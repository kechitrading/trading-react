import { useState } from 'react'
import { OctagonX, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TotpField } from '@/components/TotpField'
import { isValidTotp } from '@/lib/session'
import { useKillSwitch, useKillSwitchMutation } from '@/lib/queries'

/**
 * FR-034, FR-084. Triggering needs only a reason so it is always one step away. Releasing loosens
 * a control, so it also needs a TOTP code (FR-052). If the state cannot be read, the control
 * shows "unknown" and still offers the trigger (fail closed, CLAUDE.md rule 9).
 */
export function KillSwitchControl() {
  const { data, isError } = useKillSwitch()
  const mutation = useKillSwitchMutation()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [totp, setTotp] = useState('')

  const active = data?.active ?? false
  const releasing = active && !isError
  const canSubmit = reason.trim().length >= 3 && (!releasing || isValidTotp(totp)) && !mutation.isPending

  function reset(next: boolean) {
    setOpen(next)
    if (!next) {
      setReason('')
      setTotp('')
      mutation.reset()
    }
  }

  async function submit() {
    const trimmed = reason.trim()
    try {
      if (releasing) await mutation.mutateAsync({ action: 'release', reason: trimmed, totp })
      else await mutation.mutateAsync({ action: 'trigger', reason: trimmed })
      reset(false)
    } catch {
      setTotp('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        {releasing ? (
          <Button variant="outline" size="sm" className="border-destructive text-destructive">
            <OctagonX /> Kill switch ON
          </Button>
        ) : (
          <Button variant="destructive" size="sm" data-testid="kill-switch-button">
            <OctagonX /> {isError ? 'Kill switch (state unknown)' : 'Kill switch'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{releasing ? 'Release kill switch' : 'Trigger kill switch'}</DialogTitle>
          <DialogDescription>
            {releasing
              ? 'New proposals and orders stay blocked until you release. Releasing needs a reason and your authenticator code.'
              : 'Blocks all new proposals and orders and cancels open paper orders. In live manual mode you then cancel and exit in the Angel One app.'}
          </DialogDescription>
        </DialogHeader>

        {releasing && data?.reason && (
          <p className="text-sm text-muted-foreground">
            Triggered by {data.actor ?? 'unknown'} at {data.updated_at_ist ?? '—'}: “{data.reason}”
          </p>
        )}

        <div className="grid gap-2">
          <Label htmlFor="ks-reason">Reason</Label>
          <Textarea
            id="ks-reason"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            placeholder={releasing ? 'Why it is safe to resume' : 'What happened'}
          />
        </div>
        {releasing && <TotpField id="ks-totp" value={totp} onChange={setTotp} />}

        {mutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>{mutation.error.message}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => reset(false)}>
            Cancel
          </Button>
          {releasing ? (
            <Button onClick={submit} disabled={!canSubmit}>
              <ShieldCheck /> Release
            </Button>
          ) : (
            <Button variant="destructive" onClick={submit} disabled={!canSubmit}>
              <OctagonX /> Trigger now
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
