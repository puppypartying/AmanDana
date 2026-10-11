import { describe, expect, it } from 'vitest'
import { createAnalysis } from './analysis'
import { evidenceFor, topReasons } from './present'

describe('present', () => {
  it('topReasons: bobot terbesar dulu dan dibatasi n', () => {
    const a = createAnalysis('Investasi', 'Untung pasti, ajak teman bonus, transfer ke rekening pribadi, slot terbatas')
    const top = topReasons(a, 2)
    expect(top).toHaveLength(2)
    expect(top[0].weight).toBeGreaterThanOrEqual(top[1].weight)
  })
  it('evidenceFor: mengembalikan potongan teks tanpa penanda batas', () => {
    const a = createAnalysis('Pinjol', 'Aplikasi wajib izin akses kontak. Telat kami sebar foto kamu.')
    const q = evidenceFor(a, a.reasons[0].title)
    expect(q).toBeTruthy()
    expect(q).not.toContain('|')
  })
  it('evidenceFor: nomor sensitif disamarkan', () => {
    const a = createAnalysis('Investasi', 'Transfer ke rekening pribadi atas nama admin, rekening 1234567890')
    for (const r of a.reasons) expect(evidenceFor(a, r.title) ?? '').not.toContain('1234567890')
  })
  it('evidenceFor: null bila matchedRules kosong (data dari storage)', () => {
    const a = { ...createAnalysis('Pinjol', 'wajib izin akses kontak'), matchedRules: [] }
    expect(evidenceFor(a, a.reasons[0].title)).toBeNull()
  })
})
