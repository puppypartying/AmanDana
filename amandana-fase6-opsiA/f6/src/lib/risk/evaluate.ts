import type { Fixture } from './__fixtures__/offers'
import { scoreOffer } from './engine'

export type EvalResult = {
  threshold: number
  tp: number
  fp: number
  fn: number
  tn: number
  precision: number
  recall: number
  f1: number
  wrong: { id: string; label: string; score: number; rules: string[] }[]
}

/** Positif = diprediksi berbahaya bila skor >= threshold. */
export function evaluate(fixtures: Fixture[], threshold: number): EvalResult {
  let tp = 0, fp = 0, fn = 0, tn = 0
  const wrong: EvalResult['wrong'] = []
  for (const f of fixtures) {
    const r = scoreOffer(f.text, f.kind)
    const predicted = r.score >= threshold
    const actual = f.label === 'berbahaya'
    if (predicted && actual) tp++
    else if (predicted && !actual) fp++
    else if (!predicted && actual) fn++
    else tn++
    if (predicted !== actual) wrong.push({ id: f.id, label: f.label, score: r.score, rules: r.matchedRules.map((m) => m.id) })
  }
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn)
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
  return { threshold, tp, fp, fn, tn, precision, recall, f1, wrong }
}
