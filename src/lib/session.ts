/**
 * Single-user session token (FR-052). Kept in sessionStorage, so it is gone when the tab closes
 * and never written to disk long term. TOTP codes are never stored: they are single use and are
 * asked for at the moment of a sensitive action (NFR-009).
 */
const STORAGE_KEY = 'aqta.apiToken'

let current: string | null = read()

function read(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function getToken(): string | null {
  return current
}

export function setToken(token: string | null) {
  current = token
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked: the session lives in memory only.
  }
}

/** Re-reads storage; used by tests that seed sessionStorage directly. */
export function reloadToken() {
  current = read()
}

export const isValidTotp = (code: string) => /^\d{6}$/.test(code)
