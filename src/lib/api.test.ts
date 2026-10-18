import { describe, expect, it, vi } from 'vitest'
import { ApiError, createApi } from '@/lib/api'
import { mockFetch } from '@/test/utils'

const header = (init: RequestInit, name: string) => new Headers(init.headers).get(name)

describe('api client', () => {
  it('sends the bearer token on every call', async () => {
    const calls = mockFetch(() => ({
      body: { trading_mode: 'paper', live_trading_enabled: false, algo_tag: 'x' },
    }))
    await createApi(() => 'tok').mode()
    expect(calls[0]!.url).toBe('/api/v1/mode')
    expect(header(calls[0]!.init, 'Authorization')).toBe('Bearer tok')
    expect(header(calls[0]!.init, 'X-TOTP')).toBeNull()
  })

  it('sends X-TOTP only on approve and kill-switch release', async () => {
    const calls = mockFetch(() => ({ body: {} }))
    const api = createApi(() => 'tok')
    await api.approveProposal('p1', '123456')
    await api.triggerKillSwitch('test reason')
    await api.releaseKillSwitch('all clear', '654321')

    expect(calls[0]!.url).toBe('/api/v1/proposals/p1/approve')
    expect(header(calls[0]!.init, 'X-TOTP')).toBe('123456')
    expect(header(calls[1]!.init, 'X-TOTP')).toBeNull()
    expect(JSON.parse(calls[1]!.init.body as string)).toEqual({ action: 'trigger', reason: 'test reason' })
    expect(header(calls[2]!.init, 'X-TOTP')).toBe('654321')
  })

  it('maps the backend error shape and signs out on a refused token', async () => {
    mockFetch(() => ({
      status: 401,
      body: { error: { code: 'unauthorized', message: 'invalid or missing API token' }, request_id: 'r1' },
    }))
    const onUnauthorized = vi.fn()
    const err = await createApi(() => 'bad', onUnauthorized)
      .mode()
      .catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).message).toBe('invalid or missing API token')
    expect((err as ApiError).requestId).toBe('r1')
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('does not sign out when only the TOTP code is refused', async () => {
    mockFetch(() => ({ status: 401, body: { error: { code: 'unauthorized', message: 'invalid TOTP' } } }))
    const onUnauthorized = vi.fn()
    await createApi(() => 'tok', onUnauthorized)
      .approveProposal('p1', '000000')
      .catch(() => undefined)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
