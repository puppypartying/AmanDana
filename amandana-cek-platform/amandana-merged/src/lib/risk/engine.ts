import data from './rules.json'
import { normalize } from './normalize'
import { numericEvidence } from './numeric'

export type RiskLevel = 'Rendah' | 'Sedang' | 'Tinggi'
export type OfferKind = 'Pinjol' | 'Investasi'
export type MatchedRule = {
  id: string
  label: string
  category: string
  weight: number
  evidence: string
  /** Sinyal kritis: satu saja cukup untuk skor minimal severityFloors.kritis. */
  critical?: boolean
  /** Ditemukan dalam kalimat edukasi/peringatan: bobot dihitung, tetapi tidak memicu lantai atau kombinasi. */
  warning?: boolean
}
export type RiskReason = { ruleId: string; title: string; detail: string; weight: number; icon: string }
export type RiskResult = { score: number; level: RiskLevel; matchedRules: MatchedRule[]; reasons: RiskReason[] }

export type RulePattern = {
  re: string
  inner: boolean
  /** Dicocokkan ke teks asli (huruf kecil), bukan teks ternormalisasi: untuk URL, "a.n. Nama", dsb. */
  raw?: boolean
  /** Pola ini saja sudah sinyal kritis, walau aturannya tidak. */
  critical?: boolean
  /** Teks bukti tetap yang ditampilkan menggantikan potongan yang cocok. */
  evidence?: string
}
export type Rule = {
  id: string
  category: string
  weight: number
  icon: string
  enabled: boolean
  label: string
  explanation: string
  note?: string
  /** Asal bobot: "laporan-4.3", "audit-D1", "audit-D2", "kode-lama". */
  source?: string
  /** "kritis": satu kecocokan saja menaikkan skor ke severityFloors.kritis. */
  severity?: 'kritis'
  patterns: RulePattern[]
}
export type Combo = { id: string; requires: string[]; minScore: number; minOthers?: number; icon: string; label: string; explanation: string }
export type RulesData = {
  _catatan?: string
  thresholds: { sedang: number; tinggi: number }
  negationWindow: number
  negationWords: string[]
  rules: Rule[]
  combos: Combo[]
  /** Skor minimal bila ada sinyal kritis. */
  severityFloors: { kritis: number }
  /** Kata penanda kalimat peringatan/edukasi ("jangan pernah", "waspada", ...). */
  warningMarkers: string[]
}

export const DEFAULT_RULES = data as unknown as RulesData

// <Gn> = sampai n kata sela (boleh berupa koma, tidak boleh melewati batas kalimat "|")
export const expandPattern = (src: string) => src.replace(/<G(\d+)>/g, (_, n) => `(?:[a-z0-9%_,]+\\s+){0,${n}}`)

const sentenceAt = (text: string, index: number) => {
  const end = text.indexOf('|', index)
  return text.slice(text.lastIndexOf('|', index) + 1, end === -1 ? undefined : end)
}

type Compiled = Rule & { compiledPatterns: (RulePattern & { rx: RegExp })[] }

/**
 * Membuat penilai dari satu set aturan. Aturan dengan pola tidak valid dilewati dan dilaporkan di `errors`
 * (dipakai panel admin agar draf yang salah tidak membuat aplikasi error).
 */
export function createScorer(rules: RulesData) {
  const NEG = new Set(rules.negationWords)
  const FLOOR = rules.severityFloors?.kritis ?? 70
  const markers = (rules.warningMarkers ?? []).filter((w) => w.trim() !== '')
  // Penanda kosong tidak boleh membuat regex yang cocok dengan semua kalimat.
  const WARNING = markers.length ? new RegExp(`\\b(?:${markers.join('|')})\\b`) : null
  const errors: string[] = []
  const compiled: Compiled[] = []
  for (const rule of rules.rules) {
    if (!rule.enabled) continue
    try {
      const usable = rule.patterns.filter((p) => p.re.trim() !== '')
      compiled.push({ ...rule, compiledPatterns: usable.map((p) => ({ ...p, rx: new RegExp(p.raw ? p.re : expandPattern(p.re), 'g') })) })
    } catch (e) {
      errors.push(`${rule.id}: pola tidak valid (${e instanceof Error ? e.message : String(e)})`)
    }
  }

  function isNegated(prefix: string, matched: string, inner: boolean): boolean {
    const before = prefix.trimEnd().split(' ').slice(-rules.negationWindow)
    for (let i = before.length - 1; i >= 0; i--) {
      if (before[i] === '|' || before[i] === ',') break
      if (NEG.has(before[i])) return true
    }
    return inner && matched.split(' ').some((w) => NEG.has(w))
  }

  function levelFor(score: number): RiskLevel {
    return score >= rules.thresholds.tinggi ? 'Tinggi' : score >= rules.thresholds.sedang ? 'Sedang' : 'Rendah'
  }

  function scoreOffer(rawText: string, kind: OfferKind): RiskResult {
    const text = normalize(rawText)
    const rawLower = rawText.toLowerCase() // untuk pola `raw` (URL, "a.n. Nama") yang rusak oleh normalisasi
    const messageHasWarning = WARNING ? WARNING.test(text) : false
    const numeric = numericEvidence(rawText, kind) // jalur kedua untuk aturan yang sudah ada (imbal tidak wajar, potongan besar)
    const matchedRules: MatchedRule[] = []
    const reasons: RiskReason[] = []

    for (const rule of compiled) {
      if (rule.category !== 'umum' && rule.category !== kind.toLowerCase()) continue
      // Pilih kecocokan terbaik per aturan: yang bukan di kalimat peringatan dan kritis didahulukan.
      let best: (MatchedRule & { rank: number }) | null = null
      for (const p of rule.compiledPatterns) {
        const source = p.raw ? rawLower : text
        p.rx.lastIndex = 0
        for (const m of source.matchAll(p.rx)) {
          const index = m.index ?? 0
          if (isNegated(p.raw ? normalize(source.slice(0, index)) : source.slice(0, index), m[0], p.inner)) continue
          const critical = rule.severity === 'kritis' || p.critical === true
          const warning = p.raw ? messageHasWarning : WARNING ? WARNING.test(sentenceAt(source, index)) : false
          const rank = (warning ? 0 : 2) + (critical ? 1 : 0)
          if (!best || rank > best.rank) best = { id: rule.id, label: rule.label, category: rule.category, weight: rule.weight, evidence: p.evidence ?? m[0], critical, warning, rank }
        }
      }
      if (!best && numeric[rule.id]) best = { id: rule.id, label: rule.label, category: rule.category, weight: rule.weight, evidence: numeric[rule.id], critical: rule.severity === 'kritis', warning: false, rank: 2 }
      if (!best) continue
      const { rank, ...match } = best
      void rank // dipakai hanya untuk memilih kecocokan terbaik
      matchedRules.push(match)
      reasons.push({ ruleId: rule.id, title: rule.label, detail: rule.explanation, weight: rule.weight, icon: rule.icon })
    }

    let score = Math.min(100, matchedRules.reduce((total, r) => total + r.weight, 0))
    // Kombinasi dan sinyal kritis hanya berlaku bila tidak berada di kalimat peringatan/edukasi.
    const live = new Set(matchedRules.filter((r) => !r.warning).map((r) => r.id))
    for (const combo of rules.combos) {
      if (!combo.requires.every((id) => live.has(id))) continue
      if ((combo.minOthers ?? 0) > live.size - combo.requires.length) continue
      const final = Math.min(100, Math.max(score, combo.minScore))
      if (final <= score) continue // lantai tidak menaikkan skor: tidak perlu jadi alasan tambahan
      reasons.push({ ruleId: combo.id, title: combo.label, detail: combo.explanation, weight: final - score, icon: combo.icon })
      score = final
    }
    const critical = matchedRules.filter((r) => r.critical && !r.warning)
    if (critical.length && score < FLOOR) {
      reasons.push({
        ruleId: 'floor-kritis',
        title: 'Ada tanda bahaya yang sangat jelas',
        detail: `Satu tanda ini saja sudah cukup berbahaya (${critical.map((r) => r.label.toLowerCase()).join('; ')}), jadi skor dinaikkan ke minimal ${FLOOR}.`,
        weight: FLOOR - score,
        icon: 'ShieldAlert',
      })
      score = FLOOR
    }
    return { score, level: levelFor(score), matchedRules, reasons }
  }

  return { scoreOffer, levelFor, errors }
}

const defaultScorer = createScorer(DEFAULT_RULES)
export const scoreOffer = defaultScorer.scoreOffer
export const levelFor = defaultScorer.levelFor
