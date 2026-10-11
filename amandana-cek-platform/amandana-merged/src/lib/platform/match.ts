import { extractAll, type ExtractedLink } from './extract'
import { linkSignals } from './signals'
import { handleKey, nameKey, phoneKey, registrable, similarity } from './text'
import { DEFAULT_PLATFORMS } from './registry'
import { STATUS_ORDER, type FindingEntry, type LinkSignal, type Platform, type PlatformCheck, type PlatformFinding, type PlatformStatus } from './types'

const toEntry = (p: Platform): FindingEntry => ({ value: p.value, note: p.note, sourceDate: p.sourceDate, domains: p.domains })

/** Pecah "https://x.id/a/b" atau "x.id" menjadi host dan path (huruf kecil). */
export function parseLinkValue(v: string): { host: string; path: string } | null {
  const m = /^(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z0-9-]{2,})(?::\d+)?(\/[^\s?#]*)?/i.exec(v.trim())
  if (!m) return null
  const path = (m[2] ?? '').toLowerCase().replace(/\/+$/, '')
  return { host: m[1].toLowerCase(), path }
}

const brandLabel = (domain: string) => nameKey(registrable(domain).split('.')[0])
const NEUTRAL = (host: string) => host === 'ojk.go.id' || host.endsWith('.ojk.go.id')

function matchNames(names: string[], list: Platform[]): PlatformFinding[] {
  const entries = list.filter((p) => p.type === 'nama')
  return names.map((input): PlatformFinding => {
    // Kandidat bisa memuat kata sisa. Untuk red-flag coba semua potongan 1-3 kata (lebih baik kelebihan waspada);
    // untuk resmi hanya kunci penuh (tidak boleh percaya karena kata sisa diabaikan).
    const t = input.split(/\s+/)
    const full = nameKey(input)
    const keys = new Set<string>([full])
    for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= t.length; i++) keys.add(nameKey(t.slice(i, i + n).join(' ')))
    let best: { p: Platform; sim: 'exact' | 'mirip' } | null = null
    for (const p of entries) {
      let sim: 'exact' | 'mirip' | null = null
      for (const key of p.status === 'red-flag' ? keys : [full]) { const x = similarity(key, nameKey(p.value)); if (x === 'exact' || (x && !sim)) sim = x; if (sim === 'exact') break }
      if (!sim) continue
      const better = !best || (sim === 'exact' && best.sim !== 'exact') || (sim === best.sim && p.status === 'red-flag' && best.p.status !== 'red-flag')
      if (better) best = { p, sim }
    }
    if (!best) return { kind: 'nama', status: 'tidak-ditemukan', input, detail: 'Nama ini tidak ada di daftar referensi. Itu bukan tanda aman: cek izinnya di OJK.' }
    const { p, sim } = best
    const entry = toEntry(p)
    if (p.status === 'red-flag') return sim === 'exact'
      ? { kind: 'nama', status: 'red-flag', input, entry, detail: 'Nama ini tercatat di daftar red-flag (platform ilegal).' }
      : { kind: 'nama', status: 'mirip-red-flag', input, entry, detail: 'Nama ini mirip entri di daftar red-flag. Bisa salah ketik, bisa juga penyamaran.' }
    return sim === 'exact'
      ? { kind: 'nama', status: 'resmi', input, entry, detail: 'Nama ini cocok dengan daftar platform resmi. Pastikan pesannya benar-benar dari mereka, bukan peniruan.' }
      : { kind: 'nama', status: 'mirip-resmi', input, entry, detail: 'Nama ini mirip platform resmi tetapi tidak persis sama. Waspada peniruan nama.' }
  })
}

function matchAccounts(accounts: { kind: 'telepon' | 'handle'; key: string }[], list: Platform[]): PlatformFinding[] {
  const entries = list.filter((p) => p.type === 'akun')
  return accounts.map((a): PlatformFinding => {
    const hit = entries.find((p) => (a.kind === 'telepon' ? phoneKey(p.value) === a.key : handleKey(p.value) === a.key))
    const input = a.kind === 'telepon' ? a.key : `@${a.key}`
    if (!hit) return { kind: 'akun', status: 'tidak-ditemukan', input, detail: 'Nomor atau akun ini tidak ada di daftar referensi.' }
    return hit.status === 'red-flag'
      ? { kind: 'akun', status: 'red-flag', input, entry: toEntry(hit), detail: 'Nomor atau akun ini tercatat di daftar red-flag.' }
      : { kind: 'akun', status: 'resmi', input, entry: toEntry(hit), detail: 'Nomor atau akun ini tercatat sebagai saluran resmi.' }
  })
}

function matchLinks(links: ExtractedLink[], list: Platform[], mentioned: PlatformFinding[]): PlatformFinding[] {
  const linkEntries = list.filter((p) => p.type === 'tautan').map((p) => ({ p, v: parseLinkValue(p.value) })).filter((x): x is { p: Platform; v: { host: string; path: string } } => x.v !== null)
  // Domain resmi: dari field "domains" semua entri resmi + entri tautan resmi.
  const official = [
    ...list.filter((p) => p.status === 'resmi').flatMap((p) => (p.domains ?? []).map((d) => ({ domain: registrable(parseLinkValue(d)?.host ?? d.toLowerCase()), p }))),
    ...linkEntries.filter((x) => x.p.status === 'resmi').map((x) => ({ domain: registrable(x.v.host), p: x.p })),
  ]
  const mentionedOfficial = mentioned.find((f) => f.status === 'resmi' && f.entry?.domains?.length)
  return links.filter((l) => !NEUTRAL(l.host) && !l.host.endsWith('.go.id')).map((l): PlatformFinding => {
    const reg = registrable(l.host)
    const input = l.host + l.path
    const direct = linkEntries.find(({ v }) => (v.path ? v.host === l.host && (l.path === v.path || l.path.startsWith(v.path + '/')) : registrable(v.host) === reg))
    if (direct) return direct.p.status === 'red-flag'
      ? { kind: 'tautan', status: 'red-flag', input, entry: toEntry(direct.p), detail: 'Tautan ini tercatat di daftar red-flag.' }
      : { kind: 'tautan', status: 'resmi', input, entry: toEntry(direct.p), detail: 'Tautan ini cocok dengan domain resmi di daftar.' }
    const own = official.find((o) => o.domain === reg)
    if (own) return { kind: 'tautan', status: 'resmi', input, entry: toEntry(own.p), detail: 'Tautan ini cocok dengan domain resmi di daftar.' }
    const key = brandLabel(reg)
    const lookalike = official.find((o) => { const k = brandLabel(o.domain); return k.length >= 5 && (similarity(key, k) !== null || nameKey(l.host).includes(k)) })
    if (lookalike) return { kind: 'tautan', status: 'tautan-berbeda', input, entry: toEntry(lookalike.p), detail: 'Domain ini menyerupai domain resmi tetapi bukan miliknya. Ciri khas situs tiruan.' }
    const nearRed = linkEntries.find(({ p, v }) => p.status === 'red-flag' && key.length >= 6 && similarity(key, brandLabel(v.host)) !== null)
    if (nearRed) return { kind: 'tautan', status: 'mirip-red-flag', input, entry: toEntry(nearRed.p), detail: 'Domain ini mirip tautan di daftar red-flag.' }
    if (mentionedOfficial) return { kind: 'tautan', status: 'tautan-berbeda', input, entry: mentionedOfficial.entry, detail: 'Pesan menyebut platform resmi, tetapi tautannya bukan domain resminya.' }
    return { kind: 'tautan', status: 'tidak-ditemukan', input, detail: 'Tautan ini tidak ada di daftar referensi. Itu bukan tanda aman.' }
  })
}

/** Mencocokkan nama, tautan, dan akun di teks ke daftar referensi, ditambah sinyal teknis tautan. Murni dan berjalan di perangkat. */
export function checkPlatform(text: string, list: Platform[] = DEFAULT_PLATFORMS): PlatformCheck {
  const ex = extractAll(text)
  const nameFindings = matchNames(ex.names, list)
  const findings = [...nameFindings, ...matchLinks(ex.links, list, nameFindings), ...matchAccounts(ex.accounts, list)]
  const signals: LinkSignal[] = []
  for (const l of ex.links) for (const s of linkSignals(l)) if (!signals.some((x) => x.id === s.id)) signals.push(s)
  const status: PlatformStatus = findings.length === 0 ? 'tidak-dicek' : STATUS_ORDER.find((s) => findings.some((f) => f.status === s)) ?? 'tidak-dicek'
  return { status, findings, signals, listSize: list.length }
}
