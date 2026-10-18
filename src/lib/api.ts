/**
 * Typed client for the aqta FastAPI backend (/api/v1). Same origin: Vite proxies /api in dev,
 * nginx in production. Money fields are Pydantic Decimals, which arrive as strings; keep them as
 * strings and format for display only (see format.ts).
 *
 * Auth: every call sends the API bearer token (FR-052). Sensitive calls (approving a proposal,
 * releasing the kill switch) also send a fresh single-use TOTP code in X-TOTP (NFR-009).
 */

export type TradingMode = 'paper' | 'live'

export interface ModeOut {
  trading_mode: TradingMode
  live_trading_enabled: boolean
  algo_tag: string
}

export interface KillSwitchOut {
  active: boolean
  updated_at: string | null
  updated_at_ist: string | null
  actor: string | null
  reason: string | null
  cancelled_orders: number | null
}

export interface LegOut {
  client_order_id: string
  symbol: string
  exchange: string
  side: string
  quantity: number
  lots: number
  order_type: string
  limit_price: string | null
  risk_effect: string
}

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'executed' | 'cancelled' | (string & {})

export interface ProposalOut {
  id: string
  status: ProposalStatus
  underlying: string
  horizon: string
  created_at: string
  valid_until: string
  valid_until_ist: string
  sets: number
  max_loss_inr: string | null
  margin_required_inr: string | null
  return_on_margin: string | null
  legs: LegOut[]
  rationale: Record<string, unknown>
  label: string
}

export interface LegResultOut {
  client_order_id: string
  accepted: boolean
  stage: string | null
  reasons: string[]
  state: string | null
}

export interface ApproveOut {
  proposal: ProposalOut
  mode: TradingMode
  orders: LegResultOut[]
  note: string
}

export interface HealthOut {
  status: string
  mode: TradingMode
}

/** Error shape from aqta.api.errors: {"error": {"code", "message"}, "request_id"}. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId: string | null

  constructor(status: number, code: string, message: string, requestId: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  totp?: string
  signal?: AbortSignal
}

export function createApi(getToken: () => string | null, onUnauthorized?: () => void) {
  async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' }
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    if (opts.totp) headers['X-TOTP'] = opts.totp
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json'

    const res = await fetch(path, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    })

    if (!res.ok) {
      const err = await toApiError(res)
      // A bad TOTP code is also a 401; only drop the session when the token itself is refused.
      if (err.isUnauthorized && !opts.totp) onUnauthorized?.()
      throw err
    }
    return (await res.json()) as T
  }

  return {
    health: (signal?: AbortSignal) => request<HealthOut>('/health', { signal }),
    mode: (signal?: AbortSignal) => request<ModeOut>('/api/v1/mode', { signal }),
    killSwitch: (signal?: AbortSignal) => request<KillSwitchOut>('/api/v1/kill-switch', { signal }),
    /** FR-034: trigger needs only the token, so it stays available in an emergency. */
    triggerKillSwitch: (reason: string) =>
      request<KillSwitchOut>('/api/v1/kill-switch', {
        method: 'POST',
        body: { action: 'trigger', reason },
      }),
    /** Releasing loosens a control, so it needs a TOTP code (FR-052). */
    releaseKillSwitch: (reason: string, totp: string) =>
      request<KillSwitchOut>('/api/v1/kill-switch', {
        method: 'POST',
        body: { action: 'release', reason },
        totp,
      }),
    proposals: (status?: ProposalStatus, signal?: AbortSignal) =>
      request<ProposalOut[]>(status ? `/api/v1/proposals?status=${encodeURIComponent(status)}` : '/api/v1/proposals', {
        signal,
      }),
    proposal: (id: string, signal?: AbortSignal) =>
      request<ProposalOut>(`/api/v1/proposals/${encodeURIComponent(id)}`, { signal }),
    /** FR-023, FR-024: approval needs a TOTP code. Live mode sends no order (CR-003). */
    approveProposal: (id: string, totp: string) =>
      request<ApproveOut>(`/api/v1/proposals/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        totp,
      }),
    rejectProposal: (id: string, reason: string) =>
      request<ProposalOut>(`/api/v1/proposals/${encodeURIComponent(id)}/reject`, {
        method: 'POST',
        body: { reason },
      }),
    /** Reduce size only; the backend opens a smaller copy for approval. */
    modifyProposal: (id: string, sets: number) =>
      request<ProposalOut>(`/api/v1/proposals/${encodeURIComponent(id)}/modify`, {
        method: 'POST',
        body: { sets },
      }),
  }
}

export type Api = ReturnType<typeof createApi>

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const data = (await res.json()) as {
      error?: { code?: string; message?: string }
      request_id?: string | null
      detail?: unknown
    }
    if (data.error) {
      return new ApiError(
        res.status,
        data.error.code ?? 'error',
        data.error.message ?? res.statusText,
        data.request_id ?? null,
      )
    }
    return new ApiError(res.status, 'error', res.statusText || `HTTP ${res.status}`)
  } catch {
    return new ApiError(res.status, 'error', res.statusText || `HTTP ${res.status}`)
  }
}
