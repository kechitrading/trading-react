import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { createApi } from '@/lib/api'
import { AuthContext, type AuthState } from '@/lib/auth-context'
import { getToken, setToken } from '@/lib/session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(() => getToken() !== null)

  const logout = useCallback(() => {
    setToken(null)
    setAuthenticated(false)
  }, [])

  // The client reads the token from the session module on each call, so it never needs rebuilding.
  const api = useMemo(() => createApi(getToken, logout), [logout])

  const login = useCallback(async (candidate: string) => {
    await createApi(() => candidate).mode()
    setToken(candidate)
    setAuthenticated(true)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ isAuthenticated, api, login, logout }),
    [isAuthenticated, api, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
