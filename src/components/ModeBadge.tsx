import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useMode } from '@/lib/queries'

/**
 * FR-030: the trading mode is shown on every screen. Unknown mode is shown as such, never as
 * paper, so a broken connection cannot look safe.
 */
export function ModeBadge({ className }: { className?: string }) {
  const { data, isError, isPending } = useMode()

  if (isPending)
    return (
      <Badge variant="outline" className={className}>
        MODE …
      </Badge>
    )
  if (isError || !data) {
    return (
      <Badge variant="destructive" className={className}>
        MODE UNKNOWN
      </Badge>
    )
  }

  const live = data.trading_mode === 'live'
  return (
    <Badge
      data-testid="mode-badge"
      className={cn(
        'font-semibold tracking-wide',
        live ? 'bg-live text-live-foreground' : 'bg-paper text-paper-foreground',
        className,
      )}
      title={live ? 'Live: manual execution in the Angel One app (CR-003)' : 'Paper: simulated fills only'}
    >
      {live ? 'LIVE · MANUAL' : 'PAPER'}
    </Badge>
  )
}
