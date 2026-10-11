import type { Fixture } from '@/lib/risk/__fixtures__/offers'
import type { OfferKind, RiskResult } from '@/lib/risk/engine'

export type Split = 'tuning' | 'holdout'
export type Sample = Fixture & { split: Split }
export type Scorer = { scoreOffer: (text: string, kind: OfferKind) => RiskResult }
export type Cell = { tp: number; fp: number; fn: number; tn: number; precision: number | null; recall: number | null; f1: number | null }
export type Row = { sample: Sample; score: number; level: string; rules: string[] }
export type RuleStat = { id: string; onDangerous: number; onLegit: number; precision: number | null }
export type KindKey = 'Semua' | OfferKind
export type SplitReport = {
  n: number
  dangerous: number
  legit: number
  /** Matriks per ambang (positif = skor >= ambang) dan per jenis. */
  at: Record<'sedang' | 'tinggi', Record<KindKey, Cell>>
  rows: Row[]
  rules: RuleStat[]
}

const ratio = (a: number, b: number) => (b === 0 ? null : a / b)

export function confusion(rows: Row[], threshold: number): Cell {
  let tp = 0, fp = 0, fn = 0, tn = 0
  for (const r of rows) {
    const predicted = r.score >= threshold
    const actual = r.sample.label === 'berbahaya'
    if (predicted && actual) tp++
    else if (predicted) fp++
    else if (actual) fn++
    else tn++
  }
  const precision = ratio(tp, tp + fp)
  const recall = ratio(tp, tp + fn)
  const f1 = precision !== null && recall !== null && precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : null
  return { tp, fp, fn, tn, precision, recall, f1 }
}

export function buildReport(scorer: Scorer, samples: Sample[], split: Split, thresholds: { sedang: number; tinggi: number }): SplitReport {
  const rows: Row[] = samples
    .filter((s) => s.split === split)
    .map((sample) => {
      const r = scorer.scoreOffer(sample.text, sample.kind)
      return { sample, score: r.score, level: r.level, rules: r.matchedRules.map((m) => m.id) }
    })
  const at = {} as SplitReport['at']
  for (const [key, threshold] of [['sedang', thresholds.sedang], ['tinggi', thresholds.tinggi]] as const) {
    at[key] = {
      Semua: confusion(rows, threshold),
      Pinjol: confusion(rows.filter((r) => r.sample.kind === 'Pinjol'), threshold),
      Investasi: confusion(rows.filter((r) => r.sample.kind === 'Investasi'), threshold),
    }
  }
  const stats = new Map<string, { d: number; l: number }>()
  for (const row of rows) {
    for (const id of new Set(row.rules)) {
      const s = stats.get(id) ?? { d: 0, l: 0 }
      if (row.sample.label === 'berbahaya') s.d++
      else s.l++
      stats.set(id, s)
    }
  }
  return {
    n: rows.length,
    dangerous: rows.filter((r) => r.sample.label === 'berbahaya').length,
    legit: rows.filter((r) => r.sample.label === 'sah').length,
    at,
    rows,
    rules: [...stats.entries()].map(([id, s]) => ({ id, onDangerous: s.d, onLegit: s.l, precision: ratio(s.d, s.d + s.l) })).sort((a, b) => b.onDangerous + b.onLegit - (a.onDangerous + a.onLegit)),
  }
}
