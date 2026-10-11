import { parseLinkValue } from './match'
import { handleKey, nameKey, phoneKey, registrable } from './text'
import type { ListStatus, Platform, PlatformType } from './types'

const DATE = /^\d{4}-\d{2}-\d{2}$/
const validDate = (s: string) => DATE.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s
const looksDomain = (s: string) => parseLinkValue(s) !== null && /\.[a-z]{2,}/i.test(s) && !/\s/.test(s)

export function guessType(v: string): PlatformType {
  if (phoneKey(v) || /^@/.test(v.trim())) return 'akun'
  if (looksDomain(v)) return 'tautan'
  return 'nama'
}

/** Kunci unik entri: dua entri dengan kunci sama dianggap ganda. */
export function entryKey(p: Pick<Platform, 'type' | 'value'>): string {
  if (p.type === 'tautan') { const v = parseLinkValue(p.value); return `tautan:${v ? v.host + v.path : p.value.toLowerCase()}` }
  if (p.type === 'akun') return `akun:${phoneKey(p.value) ?? handleKey(p.value) ?? p.value.toLowerCase()}`
  return `nama:${nameKey(p.value)}`
}

export type ImportResult = { entries: Platform[]; errors: { line: number; reason: string }[]; duplicates: number }

/**
 * Impor massal dari teks tempel. Satu baris satu entri, kolom dipisah `|`, `;`, atau tab, urutan bebas:
 *   nilai | tipe(nama/tautan/akun) | status(resmi/red-flag) | domain resmi (spasi) | tanggal YYYY-MM-DD | catatan
 * Tipe ditebak bila tidak ditulis; status memakai `defaultStatus`. Baris kosong dan yang berawalan # diabaikan.
 */
export function parsePlatformText(text: string, defaultStatus: ListStatus, existing: Platform[] = [], now = Date.now()): ImportResult {
  const entries: Platform[] = []
  const errors: ImportResult['errors'] = []
  const seen = new Set(existing.map(entryKey))
  let duplicates = 0
  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) return
    const [value, ...rest] = line.split(/\s*[|;\t]\s*/).map((x) => x.trim())
    if (!value) return errors.push({ line: i + 1, reason: 'Nilai kosong.' })
    let type: PlatformType | null = null
    let status: ListStatus = defaultStatus
    let sourceDate: string | undefined
    let domains: string[] = []
    const notes: string[] = []
    for (const f of rest.filter(Boolean)) {
      const lf = f.toLowerCase()
      if (lf === 'nama' || lf === 'tautan' || lf === 'akun') type = lf
      else if (lf === 'resmi' || lf === 'red-flag') status = lf
      else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(f) || /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(f)) { if (validDate(f)) sourceDate = f; else return errors.push({ line: i + 1, reason: `Tanggal "${f}" harus YYYY-MM-DD dan valid.` }) }
      else if (f.split(/\s+/).every(looksDomain)) domains = f.split(/\s+/).map((d) => (parseLinkValue(d)?.host ?? d).toLowerCase())
      else notes.push(f)
    }
    if (errors.some((e) => e.line === i + 1)) return
    const t = type ?? guessType(value)
    if (t === 'tautan' && !parseLinkValue(value)) return errors.push({ line: i + 1, reason: `"${value}" bukan tautan/domain yang valid.` })
    if (t === 'akun' && !phoneKey(value) && !handleKey(value)) return errors.push({ line: i + 1, reason: `"${value}" bukan nomor seluler atau @akun yang valid.` })
    if (t === 'nama' && nameKey(value).length < 3) return errors.push({ line: i + 1, reason: 'Nama terlalu pendek.' })
    const p: Platform = { id: `p${(now + entries.length).toString(36)}${i}`, value, type: t, status, note: notes.join('; ') }
    if (domains.length && status === 'resmi') p.domains = domains
    if (sourceDate) p.sourceDate = sourceDate
    const k = entryKey(p)
    if (seen.has(k)) { duplicates++; return }
    seen.add(k)
    entries.push(p)
  })
  return { entries, errors, duplicates }
}

/** Masalah pada daftar; kosong = aman diekspor. */
export function validatePlatforms(list: Platform[]): string[] {
  const out: string[] = []
  const byKey = new Map<string, Platform[]>()
  for (const p of list) {
    const label = `"${p.value}"`
    if (!p.value.trim()) { out.push('Ada entri tanpa nilai.'); continue }
    if (p.sourceDate && !validDate(p.sourceDate)) out.push(`Platform ${label}: tanggal sumber harus YYYY-MM-DD.`)
    if (p.status === 'resmi' && p.type === 'nama' && !(p.domains?.length)) out.push(`Platform ${label}: berstatus resmi tetapi domain resmi kosong (tautan palsu tidak bisa dideteksi).`)
    for (const d of p.domains ?? []) if (!parseLinkValue(d) || registrable(parseLinkValue(d)!.host).split('.').length < 2) out.push(`Platform ${label}: domain resmi "${d}" tidak valid.`)
    const k = entryKey(p)
    byKey.set(k, [...(byKey.get(k) ?? []), p])
  }
  for (const group of byKey.values()) {
    if (group.length < 2) continue
    if (group.some((g) => g.status === 'resmi') && group.some((g) => g.status === 'red-flag')) out.push(`Platform "${group[0].value}": tercatat sekaligus resmi dan red-flag.`)
    else out.push(`Platform "${group[1].value}": sama dengan "${group[0].value}" (entri ganda).`)
  }
  return out
}
