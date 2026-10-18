import { Badge } from '@/components/ui/badge'
import type { ProposalStatus } from '@/lib/api'

const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'default',
  approved: 'secondary',
  executed: 'secondary',
  rejected: 'destructive',
  expired: 'outline',
  cancelled: 'outline',
}

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return <Badge variant={variants[status] ?? 'outline'}>{status}</Badge>
}
