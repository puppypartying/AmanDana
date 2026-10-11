import { expandPattern, type RulesData } from './engine'

const CATEGORIES = ['umum', 'pinjol', 'investasi']

/**
 * Heuristik backtracking katastrofik: grup yang berisi kuantifier tak terbatas lalu dikuantifikasi lagi tak terbatas,
 * mis. `(a+)+` atau `(\w+\s*)*`. Dicek pada sumber pola sebelum <Gn> diperluas (grup <Gn> terbatas, jadi aman).
 */
export const hasNestedQuantifier = (re: string) => /\((?:\?:)?(?:[^()\\]|\\.)*?[+*](?:[^()\\]|\\.)*\)\s*(?:[+*]|\{\d+,\})/.test(re)

/** Daftar masalah pada satu set aturan; kosong = aman dipakai. */
export function validateRules(rules: RulesData): string[] {
  const out: string[] = []
  const t = rules.thresholds
  if (!(Number.isFinite(t.sedang) && Number.isFinite(t.tinggi) && t.sedang > 0 && t.sedang < t.tinggi && t.tinggi <= 100)) out.push('Ambang harus 0 < Sedang < Tinggi <= 100.')
  if (!(rules.negationWindow >= 1)) out.push('Jendela negasi minimal 1 kata.')
  const floor = rules.severityFloors?.kritis
  if (!(Number.isFinite(floor) && floor >= 0 && floor <= 100)) out.push('Lantai sinyal kritis harus 0-100.')
  if (!Array.isArray(rules.warningMarkers)) out.push('Daftar penanda peringatan hilang.')
  else {
    try { new RegExp(`\\b(?:${rules.warningMarkers.filter((w) => w.trim() !== '').join('|')})\\b`) } catch (e) { out.push(`Penanda peringatan tidak valid (${e instanceof Error ? e.message : String(e)}).`) }
  }
  const ids = new Set<string>()
  for (const r of rules.rules) {
    if (!r.id.trim()) { out.push('Ada aturan tanpa id.'); continue }
    if (ids.has(r.id)) out.push(`Id ganda: ${r.id}`)
    ids.add(r.id)
    if (!(Number.isFinite(r.weight) && r.weight >= 0 && r.weight <= 100)) out.push(`${r.id}: bobot harus 0-100.`)
    if (!CATEGORIES.includes(r.category)) out.push(`${r.id}: kategori harus umum, pinjol, atau investasi.`)
    if (r.enabled && r.patterns.every((p) => p.re.trim() === '')) out.push(`${r.id}: aktif tetapi tidak punya pola.`)
    if (r.severity !== undefined && r.severity !== 'kritis') out.push(`${r.id}: severity hanya boleh "kritis" atau kosong.`)
    for (const p of r.patterns) {
      if (p.re.trim() === '') continue
      if (hasNestedQuantifier(p.re)) out.push(`${r.id}: pola "${p.re.slice(0, 40)}" berisiko backtracking berlebihan (kuantifier bersarang).`)
      // Pola `raw` dipakai apa adanya (tanpa perluasan <Gn>), sama seperti di engine.
      try { new RegExp(p.raw ? p.re : expandPattern(p.re), 'g') } catch (e) { out.push(`${r.id}: pola "${p.re.slice(0, 40)}" tidak valid (${e instanceof Error ? e.message : String(e)}).`) }
    }
  }
  for (const c of rules.combos) {
    for (const id of c.requires) if (!ids.has(id)) out.push(`Lantai ${c.id}: aturan "${id}" tidak ada.`)
    if (!(c.minScore >= 0 && c.minScore <= 100)) out.push(`Lantai ${c.id}: skor minimal harus 0-100.`)
  }
  return out
}
