import { createContext, useContext } from 'react'
import type { Api } from '@/lib/api'

export interface AuthState {
  isAuthenticated: boolean
  api: Api
  /** Verifies the token against /api/v1/mode and stores it only if the backend accepts it. */
  login: (token: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function useApi(): Api {
  return useAuth().api
}
