import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Six-digit authenticator code, sent once in X-TOTP and never stored (NFR-009). */
export function TotpField({
  id = 'totp',
  value,
  onChange,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Authenticator code (TOTP)</Label>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder="123456"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="font-mono tracking-[0.3em]"
      />
    </div>
  )
}
