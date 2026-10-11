import { describe, expect, it } from 'vitest'
import { computeLoan } from './loan'

describe('computeLoan', () => {
  it('contoh laporan Bab 4.4: Rp2.000.000, cair Rp1.600.000, 14 hari', () => {
    const r = computeLoan(2_000_000, 1_600_000, 14)
    expect(r.valid).toBe(true)
    expect(r.fee).toBe(400_000)
    expect(r.period).toBe(25)
    expect(Math.round(r.annual)).toBe(652)
  })
  it('tidak valid bila dana cair melebihi pinjaman', () => {
    expect(computeLoan(1_000_000, 1_200_000, 14).valid).toBe(false)
  })
  it('tidak valid bila tenor 0 atau input kosong', () => {
    expect(computeLoan(2_000_000, 1_600_000, 0).valid).toBe(false)
    expect(computeLoan(0, 0, 0)).toEqual({ valid: false, fee: 0, period: 0, annual: 0 })
  })
  it('tanpa potongan: biaya 0%', () => {
    const r = computeLoan(1_000_000, 1_000_000, 30)
    expect(r.valid).toBe(true)
    expect(r.annual).toBe(0)
  })
})
