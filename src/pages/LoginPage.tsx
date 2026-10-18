import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { KeyRound } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

/**
 * FR-052: only Kashyap's API token opens the dashboard. The authenticator (TOTP) code is asked
 * for at each sensitive action instead of here, because the backend accepts each code once.
 */
export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(token.trim())
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.isUnauthorized
            ? 'The backend refused this token.'
            : err.status >= 500
              ? `Cannot reach the AQTA backend (HTTP ${err.status}). Is it running?`
              : err.message
          : 'Cannot reach the AQTA backend.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>AQTA Quant Desk</CardTitle>
          <CardDescription>Sign in with your API token. Personal use only (RULE-008).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="token">API token</Label>
              <Input
                id="token"
                type="password"
                autoComplete="current-password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={busy || token.trim() === ''}>
              <KeyRound /> {busy ? 'Checking…' : 'Sign in'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Approving a proposal or releasing the kill switch will also ask for your authenticator code.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
