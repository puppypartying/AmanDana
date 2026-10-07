import data from './rules.json'
import { normalize } from './normalize'

export type RiskLevel = 'Rendah' | 'Sedang' | 'Tinggi'
export type OfferKind = 'Pinjol' | 'Investasi'
export type MatchedRule = { id: string; label: string; category: string; weight: number; evidence: string }
export type RiskReason = { ruleId: string; title: string; detail: string; weight: number; icon: string }
export type RiskResult = { score: number; level: RiskLevel; matchedRules: MatchedRule[]; reasons: RiskReason[] }

const NEG = new Set(data.negationWords)

// <Gn> = sampai n kata sela (boleh berupa koma, tidak boleh melewati batas kalimat "|")
const expand = (src: string) => src.replace(/<G(\d)>/g, (_, n) => `(?:[a-z0-9%,]+\\s+){0,${n}}`)
const compiled = data.rules.filter((r) => r.enabled).map((r) => ({
  ...r,
  patterns: r.patterns.map((p) => ({ re: new RegExp(expand(p.re), 'g'), inner: p.inner })),
}))

function isNegated(text: string, index: number, matched: string, inner: boolean): boolean {
  const before = text.slice(0, index).trimEnd().split(' ').slice(-data.negationWindow)
  for (let i = before.length - 1; i >= 0; i--) {
    if (before[i] === '|' || before[i] === ',') break
    if (NEG.has(before[i])) return true
  }
  return inner && matched.split(' ').some((w) => NEG.has(w))
}

export function levelFor(score: number): RiskLevel {
  return score >= data.thresholds.tinggi ? 'Tinggi' : score >= data.thresholds.sedang ? 'Sedang' : 'Rendah'
}

export function scoreOffer(rawText: string, kind: OfferKind): RiskResult {
  const text = normalize(rawText)
  const matchedRules: MatchedRule[] = []
  const reasons: RiskReason[] = []
  for (const rule of compiled) {
    if (rule.category !== 'umum' && rule.category !== kind.toLowerCase()) continue
    let evidence: string | null = null
    for (const p of rule.patterns) {
      p.re.lastIndex = 0
      for (const m of text.matchAll(p.re)) {
        if (!isNegated(text, m.index ?? 0, m[0], p.inner)) { evidence = m[0]; break }
      }
      if (evidence) break
    }
    if (!evidence) continue
    matchedRules.push({ id: rule.id, label: rule.label, category: rule.category, weight: rule.weight, evidence })
    reasons.push({ ruleId: rule.id, title: rule.label, detail: rule.explanation, weight: rule.weight, icon: rule.icon })
  }
  const sum = matchedRules.reduce((total, r) => total + r.weight, 0)
  let score = Math.min(100, sum)
  const ids = new Set(matchedRules.map((r) => r.id))
  for (const combo of data.combos) {
    if (!combo.requires.every((id) => ids.has(id))) continue
    const final = Math.min(100, Math.max(score, combo.minScore))
    reasons.push({ ruleId: combo.id, title: combo.label, detail: combo.explanation, weight: final - score, icon: combo.icon })
    score = final
  }
  return { score, level: levelFor(score), matchedRules, reasons }
}
