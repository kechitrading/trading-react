/** Display helpers. Backend stores UTC; the dashboard shows IST (CLAUDE.md rule 8). */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** Formats a Decimal string from the API as rupees. Returns an em dash for null or bad input. */
export function formatInr(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? inr.format(n) : '—'
}

/** Return on margin is a ratio (0.12 = 12%). */
export function formatPercent(value: string | number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? `${(n * 100).toFixed(digits)}%` : '—'
}

const ist = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export function formatIst(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : `${ist.format(d)} IST`
}
