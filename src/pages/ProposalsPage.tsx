import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ProposalStatusBadge } from '@/components/ProposalStatusBadge'
import { QueryState } from '@/components/QueryState'
import type { ProposalStatus } from '@/lib/api'
import { formatInr, formatIst, formatPercent } from '@/lib/format'
import { useProposals } from '@/lib/queries'

const filters: { label: string; value?: ProposalStatus }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'All' },
  { label: 'Approved', value: 'approved' },
  { label: 'Executed', value: 'executed' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Expired', value: 'expired' },
]

/** FR-011, FR-012: ranked ideas with max loss and return on margin; newest first from the API. */
export function ProposalsPage() {
  const [status, setStatus] = useState<ProposalStatus | undefined>('pending')
  const query = useProposals(status)

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Proposals</h1>
        <p className="text-sm text-muted-foreground">Every idea is a proposal, never an order, until you approve it.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.label}
            size="sm"
            variant={status === f.value ? 'default' : 'outline'}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <QueryState isPending={query.isPending} error={query.error}>
        {query.data && query.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No proposals.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Underlying</TableHead>
                  <TableHead>Horizon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Max loss</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">RoM</TableHead>
                  <TableHead>Valid until</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link to={`/proposals/${p.id}`} className="hover:underline">
                        {p.underlying}
                      </Link>
                      <div className="text-xs text-muted-foreground">{p.label}</div>
                    </TableCell>
                    <TableCell>{p.horizon}</TableCell>
                    <TableCell>
                      <ProposalStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatInr(p.max_loss_inr)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatInr(p.margin_required_inr)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPercent(p.return_on_margin)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatIst(p.valid_until)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>
    </div>
  )
}
