import { describe, expect, it } from 'vitest'
import { FIXTURES } from './__fixtures__/offers'
import rules from './rules.json'
import { evaluate } from './evaluate'
import { scoreOffer } from './engine'

const byId = (id: string) => FIXTURES.find((f) => f.id === id)!
const run = (id: string) => scoreOffer(byId(id).text, byId(id).kind)

describe('3 kasus temuan', () => {
  it('pinjaman sah yang menyebut "cair" dan "biaya admin" bukan skor 36', () => {
    const r = run('s01')
    expect(r.score).not.toBe(36)
    expect(r.score).toBeLessThan(40)
  })
  it('"tidak menjamin untung" tidak kena +28', () => {
    const r = run('s02')
    expect(r.matchedRules.map((m) => m.id)).not.toContain('inv-imbal-pasti')
    expect(r.score).toBe(0)
  })
  it('"wajib izinkan akses kontak, kalau telat kami sebar data ke semua kontakmu" = Tinggi, bukan 0', () => {
    const r = run('d20')
    expect(r.score).toBeGreaterThan(0)
    expect(r.level).toBe('Tinggi')
  })
})

describe('sinkron dengan laporan Bab 4.3', () => {
  it('bobot aturan aktif sama dengan tabel laporan', () => {
    const expected: Record<string, number> = {
      'inv-imbal-pasti': 28, 'inv-ajak-teman': 20, 'inv-rekening-pribadi': 24, 'inv-tekanan-waktu': 10, 'inv-catut-ojk': 18,
      'pin-akses-kontak': 25, 'pin-ancaman': 25, 'pin-potongan-muka': 20, 'pin-tenor-pendek': 15, 'pin-bunga-denda': 15,
    }
    const active = Object.fromEntries(rules.rules.filter((r) => r.enabled).map((r) => [r.id, r.weight]))
    expect(active).toEqual(expected)
  })
  it('contoh Lampiran B: 82 (tinggi) dan 60 (sedang)', () => {
    expect(run('d01').score).toBe(82)
    expect(run('d01').level).toBe('Tinggi')
    expect(run('d11').score).toBe(60)
    expect(run('d11').level).toBe('Sedang')
  })
})

describe('perilaku engine', () => {
  it('negasi: "tanpa akses kontak" tidak menambah skor', () => {
    expect(scoreOffer('Pinjaman tanpa akses kontak dan tanpa akses galeri.', 'Pinjol').score).toBe(0)
  })
  it('kombinasi akses kontak + ancaman sebar data minimal Tinggi', () => {
    const r = scoreOffer('Akses kontak wajib. Telat bayar kami sebar data kamu.', 'Pinjol')
    expect(r.level).toBe('Tinggi')
    expect(r.reasons.some((x) => x.ruleId === 'combo-kontak-ancaman')).toBe(true)
  })
  it('variasi tulisan tetap terdeteksi', () => {
    expect(scoreOffer('wajib izin akses k0ntak', 'Pinjol').score).toBe(25)
  })
  it('aturan investasi tidak berlaku untuk jenis Pinjol', () => {
    expect(scoreOffer('Untung pasti, transfer ke rekening pribadi admin', 'Pinjol').score).toBe(0)
  })
  it('skor dibatasi 100 dan output terstruktur', () => {
    const r = scoreOffer(byId('d01').text, 'Investasi')
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.matchedRules.length).toBe(r.reasons.length)
    expect(r.matchedRules[0]).toHaveProperty('evidence')
  })
})

describe('evaluasi set uji berlabel (40 pesan)', () => {
  it('set berisi 20 berbahaya dan 20 sah', () => {
    expect(FIXTURES.filter((f) => f.label === 'berbahaya')).toHaveLength(20)
    expect(FIXTURES.filter((f) => f.label === 'sah')).toHaveLength(20)
  })
  it('precision dan recall ambang Sedang (>=40) minimal 80%, sesuai target Bab 7.4', () => {
    const r = evaluate(FIXTURES, 40)
    expect(r.precision).toBeGreaterThanOrEqual(0.8)
    expect(r.recall).toBeGreaterThanOrEqual(0.8)
  })
})
