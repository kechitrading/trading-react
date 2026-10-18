import { describe, expect, it } from 'vitest'
import { formatInr, formatIst, formatPercent } from '@/lib/format'

describe('format', () => {
  it('formats Decimal strings as rupees with Indian grouping', () => {
    expect(formatInr('1000000.00')).toBe('₹10,00,000')
    expect(formatInr(null)).toBe('—')
    expect(formatInr('abc')).toBe('—')
  })

  it('formats return on margin ratios as percent', () => {
    expect(formatPercent('0.125')).toBe('12.5%')
    expect(formatPercent(null)).toBe('—')
  })

  it('shows UTC timestamps in IST', () => {
    expect(formatIst('2026-10-19T03:45:00Z')).toContain('09:15:00')
    expect(formatIst('2026-10-19T03:45:00Z')).toMatch(/IST$/)
    expect(formatIst(null)).toBe('—')
  })
})
