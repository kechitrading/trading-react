import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Check, Minus, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ProposalStatusBadge } from '@/components/ProposalStatusBadge'
import { QueryState } from '@/components/QueryState'
import { TotpField } from '@/components/TotpField'
import { isValidTotp } from '@/lib/session'
import type { ApproveOut, ProposalOut } from '@/lib/api'
import { formatInr, formatIst, formatPercent } from '@/lib/format'
import {
  useApproveProposal,
  useKillSwitch,
  useMode,
  useModifyProposal,
  useProposal,
  useRejectProposal,
} from '@/lib/queries'

type Action = 'approve' | 'reject' | 'modify' | null

export function ProposalDetailPage() {
  const { id = '' } = useParams()
  const query = useProposal(id)
  const [action, setAction] = useState<Action>(null)
  const [result, setResult] = useState<ApproveOut | null>(null)

  return (
    <div className="grid gap-4">
      <Link to="/proposals" className="flex items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="size-4" /> Proposals
      </Link>
      <QueryState isPending={query.isPending} error={query.error}>
        {query.data && (
          <ProposalView
            proposal={query.data}
            onAction={(a) => {
              setResult(null)
              setAction(a)
            }}
            result={result}
          />
        )}
      </QueryState>
      {query.data && (
        <ActionDialog proposal={query.data} action={action} onClose={() => setAction(null)} onApproved={setResult} />
      )}
    </div>
  )
}

function ProposalView({
  proposal: p,
  onAction,
  result,
}: {
  proposal: ProposalOut
  onAction: (a: Action) => void
  result: ApproveOut | null
}) {
  const killSwitch = useKillSwitch()
  const blocked = killSwitch.data?.active !== false
  const pending = p.status === 'pending'

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {p.underlying} <ProposalStatusBadge status={p.status} />
          </h1>
          <p className="text-sm text-muted-foreground">
            {p.label} · {p.horizon} · {p.sets} set{p.sets === 1 ? '' : 's'} · valid until {formatIst(p.valid_until)}
          </p>
        </div>
        {pending && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => onAction('approve')}
              disabled={blocked}
              title={blocked ? 'Kill switch is on or unknown' : undefined}
            >
              <Check /> Approve
            </Button>
            <Button variant="outline" onClick={() => onAction('modify')} disabled={p.sets <= 1}>
              <Minus /> Reduce size
            </Button>
            <Button variant="outline" onClick={() => onAction('reject')}>
              <X /> Reject
            </Button>
          </div>
        )}
      </div>

      {result && (
        <Alert>
          <AlertTitle>
            {result.mode === 'live' ? 'Approved: place the order ticket manually' : 'Paper result'}
          </AlertTitle>
          <AlertDescription>
            <p>{result.note}</p>
            {result.orders.map((o) => (
              <p key={o.client_order_id} className="font-mono text-xs">
                {o.client_order_id}:{' '}
                {o.accepted ? `accepted (${o.state ?? 'ok'})` : `blocked at ${o.stage}: ${o.reasons.join('; ')}`}
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Max loss" value={formatInr(p.max_loss_inr)} />
        <Metric label="Margin required" value={formatInr(p.margin_required_inr)} />
        <Metric label="Return on margin" value={formatPercent(p.return_on_margin)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legs (risk-reducing legs first, FR-077)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Exch</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Lots</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Limit</TableHead>
                <TableHead>Risk effect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {p.legs.map((l) => (
                <TableRow key={l.client_order_id}>
                  <TableCell className="font-mono">{l.symbol}</TableCell>
                  <TableCell>{l.exchange}</TableCell>
                  <TableCell className={l.side.toLowerCase() === 'buy' ? 'text-profit' : 'text-loss'}>
                    {l.side}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{l.lots}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.quantity}</TableCell>
                  <TableCell>{l.order_type}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.limit_price ?? 'MKT'}</TableCell>
                  <TableCell>{l.risk_effect}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rationale (FR-010, FR-043)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">{JSON.stringify(p.rationale, null, 2)}</pre>
        </CardContent>
      </Card>
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm text-muted-foreground">{label}</p>
        <CardTitle className="tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

function ActionDialog({
  proposal,
  action,
  onClose,
  onApproved,
}: {
  proposal: ProposalOut
  action: Action
  onClose: () => void
  onApproved: (r: ApproveOut) => void
}) {
  const mode = useMode()
  const approve = useApproveProposal()
  const reject = useRejectProposal()
  const modify = useModifyProposal()
  const [totp, setTotp] = useState('')
  const [reason, setReason] = useState('')
  const [sets, setSets] = useState(Math.max(1, proposal.sets - 1))

  const mutation = action === 'approve' ? approve : action === 'reject' ? reject : modify
  const live = mode.data?.trading_mode === 'live'

  function close() {
    setTotp('')
    setReason('')
    approve.reset()
    reject.reset()
    modify.reset()
    onClose()
  }

  async function submit() {
    try {
      if (action === 'approve') onApproved(await approve.mutateAsync({ id: proposal.id, totp }))
      else if (action === 'reject') await reject.mutateAsync({ id: proposal.id, reason: reason.trim() })
      else if (action === 'modify') await modify.mutateAsync({ id: proposal.id, sets })
      close()
    } catch {
      setTotp('')
    }
  }

  const canSubmit =
    !mutation.isPending &&
    (action === 'approve'
      ? isValidTotp(totp)
      : action === 'reject'
        ? reason.trim().length >= 3
        : sets >= 1 && sets < proposal.sets)

  return (
    <Dialog open={action !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'approve' ? 'Approve proposal' : action === 'reject' ? 'Reject proposal' : 'Reduce size'}
          </DialogTitle>
          <DialogDescription>
            {action === 'approve'
              ? live
                ? 'Live manual mode: nothing is sent to the broker. You get an order ticket to place in the Angel One app (CR-003).'
                : 'Paper mode: each leg is filled on the paper broker after the pre-trade risk checks.'
              : action === 'reject'
                ? 'The proposal is closed and tracked as a skipped trade (FR-082).'
                : 'The original is cancelled and a smaller copy opens for approval.'}
          </DialogDescription>
        </DialogHeader>

        {action === 'approve' && <TotpField value={totp} onChange={setTotp} />}
        {action === 'reject' && (
          <div className="grid gap-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea id="reject-reason" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}
        {action === 'modify' && (
          <div className="grid gap-2">
            <Label htmlFor="sets">New size in sets (currently {proposal.sets})</Label>
            <Input
              id="sets"
              type="number"
              min={1}
              max={proposal.sets - 1}
              value={sets}
              onChange={(e) => setSets(Number(e.target.value))}
            />
          </div>
        )}

        {mutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>{mutation.error.message}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button variant={action === 'reject' ? 'destructive' : 'default'} onClick={submit} disabled={!canSubmit}>
            {mutation.isPending ? 'Working…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
