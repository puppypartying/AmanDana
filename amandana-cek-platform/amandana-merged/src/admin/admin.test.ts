import { describe, expect, it } from 'vitest'
import { createScorer, DEFAULT_RULES, scoreOffer } from '@/lib/risk/engine'
import dataset from './dataset.json'
import { buildReport, confusion, type Sample } from './matrix'
import { REPORT_RULES, REPORT_THRESHOLDS } from './report'
import { defaults, parseAdminData } from './store'
import { validateRules } from './validate'

const samples = dataset as Sample[]

describe('data uji admin', () => {
  it('berisi 40 tuning (20 berbahaya, 20 sah) dan 20 holdout (10/10), id unik', () => {
    expect(samples.filter((s) => s.split === 'tuning')).toHaveLength(40)
    const h = samples.filter((s) => s.split === 'holdout')
    expect(h).toHaveLength(20)
    expect(h.filter((s) => s.label === 'berbahaya')).toHaveLength(10)
    expect(new Set(samples.map((s) => s.id)).size).toBe(samples.length)
  })
})

describe('createScorer', () => {
  it('aturan bawaan identik dengan scoreOffer bawaan dan tanpa error', () => {
    const s = createScorer(DEFAULT_RULES)
    expect(s.errors).toEqual([])
    for (const x of samples) expect(s.scoreOffer(x.text, x.kind).score).toBe(scoreOffer(x.text, x.kind).score)
  })
  it('bobot yang diubah langsung mengubah skor', () => {
    const r = structuredClone(DEFAULT_RULES)
    r.rules.find((x) => x.id === 'pin-tenor-pendek')!.weight = 60
    expect(createScorer(r).scoreOffer('tenor 7 hari', 'Pinjol').score).toBe(60)
  })
  it('pola tidak valid dilewati dan dilaporkan, bukan melempar error', () => {
    const r = structuredClone(DEFAULT_RULES)
    r.rules[0].patterns.push({ re: '(tidak tertutup', inner: true })
    const s = createScorer(r)
    expect(s.errors.length).toBe(1)
    expect(() => s.scoreOffer('untung pasti', 'Investasi')).not.toThrow()
  })
})

describe('createScorer: fitur engine v3', () => {
  const kritis = 'Pinjaman cair setelah kirim kode OTP ke petugas kami.'
  it('lantai sinyal kritis bisa diubah dari aturan draf', () => {
    const r = structuredClone(DEFAULT_RULES)
    r.severityFloors.kritis = 90
    const base = createScorer(DEFAULT_RULES).scoreOffer(kritis, 'Pinjol')
    expect(base.score).toBeGreaterThanOrEqual(DEFAULT_RULES.severityFloors.kritis)
    expect(createScorer(r).scoreOffer(kritis, 'Pinjol').score).toBeGreaterThanOrEqual(90)
  })
  it('penanda peringatan dari draf mencegah lantai pada kalimat edukasi', () => {
    const edu = 'Waspada modus pinjol: aplikasi wajib akses kontak kamu.'
    expect(createScorer(DEFAULT_RULES).scoreOffer(edu, 'Pinjol').score).toBeLessThan(DEFAULT_RULES.severityFloors.kritis)
    const r = structuredClone(DEFAULT_RULES)
    r.warningMarkers = []
    expect(createScorer(r).scoreOffer(edu, 'Pinjol').score).toBeGreaterThanOrEqual(DEFAULT_RULES.severityFloors.kritis)
  })
  it('aturan draf tanpa field baru (severityFloors/warningMarkers) tidak melempar error', () => {
    const r = structuredClone(DEFAULT_RULES) as Partial<typeof DEFAULT_RULES>
    delete r.severityFloors
    delete r.warningMarkers
    expect(() => createScorer(r as typeof DEFAULT_RULES).scoreOffer(kritis, 'Pinjol')).not.toThrow()
  })
  it('pola raw tidak diperluas <Gn> dan tidak boleh regex rusak', () => {
    const r = structuredClone(DEFAULT_RULES)
    r.rules[0].patterns.push({ re: '(raw rusak', inner: true, raw: true })
    expect(validateRules(r).join('|')).toContain('tidak valid')
    expect(createScorer(r).errors).toHaveLength(1)
  })
})

describe('validateRules', () => {
  it('aturan bawaan valid dan cocok dengan laporan Bab 4.3', () => {
    expect(validateRules(DEFAULT_RULES)).toEqual([])
    expect(DEFAULT_RULES.thresholds).toEqual(REPORT_THRESHOLDS)
    for (const [id, want] of Object.entries(REPORT_RULES)) {
      const r = DEFAULT_RULES.rules.find((x) => x.id === id)!
      expect([r.weight, r.category, r.enabled]).toEqual([want.weight, want.category, true])
    }
  })
  it('menangkap ambang terbalik, id ganda, bobot di luar 0-100, regex rusak', () => {
    const r = structuredClone(DEFAULT_RULES)
    r.thresholds = { sedang: 70, tinggi: 40 }
    r.rules[1].id = r.rules[0].id
    r.rules[2].weight = 150
    r.rules[3].patterns.push({ re: '[abc', inner: false })
    const problems = validateRules(r).join('|')
    expect(problems).toContain('Ambang')
    expect(problems).toContain('Id ganda')
    expect(problems).toContain('bobot harus 0-100')
    expect(problems).toContain('tidak valid')
  })
})

describe('matriks', () => {
  it('confusion: hitungan dan metrik benar', () => {
    const mk = (label: 'berbahaya' | 'sah', score: number) => ({ sample: { id: 'x', kind: 'Pinjol' as const, label, split: 'tuning' as const, text: '' }, score, level: '', rules: [] })
    const c = confusion([mk('berbahaya', 80), mk('berbahaya', 10), mk('sah', 50), mk('sah', 5)], 40)
    expect(c).toMatchObject({ tp: 1, fn: 1, fp: 1, tn: 1, precision: 0.5, recall: 0.5 })
  })
  it('buildReport: total sesuai dan tuning/holdout terpisah', () => {
    const t = buildReport(createScorer(DEFAULT_RULES), samples, 'tuning', DEFAULT_RULES.thresholds)
    const h = buildReport(createScorer(DEFAULT_RULES), samples, 'holdout', DEFAULT_RULES.thresholds)
    expect(t.n).toBe(40)
    expect(h.n).toBe(20)
    const c = h.at.sedang.Semua
    expect(c.tp + c.fp + c.fn + c.tn).toBe(20)
  })
})

describe('penyimpanan draf', () => {
  it('parseAdminData menolak bentuk rusak dan menerima bawaan', () => {
    expect(parseAdminData(null)).toBeNull()
    expect(parseAdminData({ v: 2 })).toBeNull()
    expect(parseAdminData(defaults())).not.toBeNull()
  })
  it('ekspor v1 (sebelum engine v3) dinaikkan ke v2 dengan field baru dari aturan bawaan', () => {
    const old = structuredClone(defaults()) as unknown as Record<string, unknown> & { rules: Record<string, unknown> }
    old.v = 1
    delete old.rules.severityFloors
    delete old.rules.warningMarkers
    const parsed = parseAdminData(old)!
    expect(parsed.v).toBe(2)
    expect(parsed.rules.severityFloors).toEqual(DEFAULT_RULES.severityFloors)
    expect(parsed.rules.warningMarkers).toEqual(DEFAULT_RULES.warningMarkers)
    expect(validateRules(parsed.rules)).toEqual([])
  })
})
