import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModeBadge } from '@/components/ModeBadge'
import { formatIst } from '@/lib/format'
import { useKillSwitch, useMode, useProposals } from '@/lib/queries'

export function OverviewPage() {
  const mode = useMode()
  const killSwitch = useKillSwitch()
  const pending = useProposals('pending')

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">Desk status at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Trading mode (FR-030)</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <ModeBadge />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {mode.data
              ? mode.data.trading_mode === 'live'
                ? 'Live, manual execution: you place orders in the Angel One app from tickets (CR-003).'
                : 'Paper: approvals create simulated fills at live prices. No broker orders are sent.'
              : mode.isError
                ? mode.error.message
                : 'Loading…'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Kill switch (FR-034)</CardDescription>
            <CardTitle className={killSwitch.data?.active || killSwitch.isError ? 'text-destructive' : ''}>
              {killSwitch.isError
                ? 'Unknown (treat as ON)'
                : killSwitch.data?.active
                  ? 'ON'
                  : killSwitch.data
                    ? 'Off'
                    : '…'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {killSwitch.data?.updated_at
              ? `Last change ${formatIst(killSwitch.data.updated_at)} by ${killSwitch.data.actor ?? 'unknown'}`
              : 'No change recorded.'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Pending proposals (FR-023)</CardDescription>
            <CardTitle>{pending.data ? pending.data.length : pending.isError ? '—' : '…'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <Link to="/proposals" className="text-primary underline-offset-4 hover:underline">
              Review proposals
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
