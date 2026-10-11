import { GENERIC, handleKey, isIp, nameKey, phoneKey, tokens } from './text'

export type ExtractedLink = { raw: string; host: string; path: string; scheme: 'http' | 'https' | null }
export type ExtractedAccount = { kind: 'telepon' | 'handle'; key: string }
export type Extracted = { names: string[]; links: ExtractedLink[]; accounts: ExtractedAccount[] }

const KNOWN_TLD = new Set('com id net org app apk xyz top site online club info biz vip cc me link click io store shop live cyou icu fun loan buzz ink pw tk ml ga cf gq ru cn in us asia cloud digital finance money cash credit ly gl ee to co'.split(' '))
const FREE_MAIL = new Set(['gmail.com', 'yahoo.com', 'yahoo.co.id', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com'])
const EMAIL_RE = /[a-z0-9._%+-]+@((?:[a-z0-9-]+\.)+[a-z]{2,24})/gi
const URL_RE = /\b(?:(https?):\/\/)?((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:xn--[a-z0-9-]+|[a-z]{2,24}))(?::\d{2,5})?((?:\/[^\s<>"')\]]*)?)/gi
const IP_RE = /\b(?:(https?):\/\/)?(\d{1,3}(?:\.\d{1,3}){3})(?::\d{2,5})?((?:\/[^\s<>"')\]]*)?)/gi
const PHONE_RE = /(?<!\d)(?:\+?62|0)[\s.-]?8\d[\d\s.-]{6,13}\d/g

const clean = (p: string) => p.replace(/[.,;:!?]+$/, '')

export function extractLinks(text: string): ExtractedLink[] {
  const out: ExtractedLink[] = []
  const seen = new Set<string>()
  const add = (l: ExtractedLink) => {
    const k = l.host + l.path
    if (!seen.has(k)) { seen.add(k); out.push(l) }
  }
  for (const m of text.matchAll(EMAIL_RE)) {
    const host = m[1].toLowerCase()
    if (!FREE_MAIL.has(host)) add({ raw: m[0], host, path: '', scheme: null })
  }
  const withIp = text.replace(EMAIL_RE, ' ')
  for (const m of withIp.matchAll(IP_RE)) {
    if (m[2].split('.').every((o) => Number(o) <= 255)) add({ raw: m[0], host: m[2], path: clean(m[3] ?? '').toLowerCase(), scheme: (m[1]?.toLowerCase() as 'http' | 'https') ?? null })
  }
  const body = withIp.replace(IP_RE, ' ') // path berkas pada URL IP ("/x.apk") bukan domain
  for (const m of body.matchAll(URL_RE)) {
    const host = m[2].toLowerCase().replace(/^www\./, '')
    if (isIp(host)) continue
    const tld = host.split('.').pop() ?? ''
    // Tanpa skema atau "www.", hanya TLD yang dikenal (hindari "a.n", "dr.budi", dsb).
    if (!m[1] && !/^www\./i.test(m[2]) && !KNOWN_TLD.has(tld) && !tld.startsWith('xn--')) continue
    add({ raw: m[0], host, path: clean(m[3] ?? '').toLowerCase(), scheme: (m[1]?.toLowerCase() as 'http' | 'https') ?? null })
  }
  return out
}

export function extractAccounts(text: string, links: ExtractedLink[]): ExtractedAccount[] {
  const out: ExtractedAccount[] = []
  const add = (a: ExtractedAccount | null) => { if (a && !out.some((x) => x.kind === a.kind && x.key === a.key)) out.push(a) }
  for (const m of text.matchAll(PHONE_RE)) { const k = phoneKey(m[0]); if (k) add({ kind: 'telepon', key: k }) }
  for (const l of links) {
    const wa = l.host === 'wa.me' ? /^\/(\+?\d+)/.exec(l.path) : null
    if (wa) { const k = phoneKey(wa[1]); if (k) add({ kind: 'telepon', key: k }) }
  }
  const noUrl = text.replace(EMAIL_RE, ' ').replace(URL_RE, ' ')
  for (const m of noUrl.matchAll(/(?<![\w@])@([a-z0-9_.]{3,30})/gi)) { const k = handleKey(m[1]); if (k) add({ kind: 'handle', key: k }) }
  return out
}

const TRIGGERS = new Set(['pt', 'cv', 'aplikasi', 'app', 'apk', 'platform', 'pinjol', 'situs', 'website', 'layanan', 'fintech', 'koperasi'])
const STOP = new Set('yang ini itu dan atau untuk dengan adalah menawarkan kamu anda kalian kami saya akan bisa dari di ke pada sudah telah sedang lagi punya memiliki resmi legal ilegal terdaftar berizin tapi tetapi karena agar supaya jadi maka kalau jika bila tanpa cair mudah murah wajib harus minta meminta memberi menjanjikan bunga tenor limit denda biaya akses kontak potongan transfer bayar hari bulan sekarang segera dulu ya nih isi data'.split(' '))

/** Nama platform kandidat. Sengaja konservatif: hanya setelah kata pemicu ("aplikasi X", "PT X"), nama dalam tanda kutip, atau input pendek. */
export function extractNames(text: string, hasLink: boolean): string[] {
  const out = new Map<string, string>()
  const add = (s: string) => { const k = nameKey(s); if (k.length >= 4 && !out.has(k)) out.set(k, s.trim()) }
  for (const m of text.matchAll(/["“”]([^"“”\n]{3,40})["“”]/g)) add(m[1])
  const t = tokens(text)
  for (let i = 0; i < t.length; i++) {
    if (!TRIGGERS.has(t[i])) continue
    let j = i + 1
    while (j < t.length && GENERIC.has(t[j])) j++
    const picked: string[] = []
    while (j < t.length && picked.length < 3 && !STOP.has(t[j]) && !TRIGGERS.has(t[j]) && !/^\d+$/.test(t[j])) picked.push(t[j++])
    if (picked.length) add(picked.join(' '))
  }
  const single = !/\n/.test(text.trim()) && t.length >= 1 && t.length <= 4 && !hasLink
  if (out.size === 0 && single && !t.some((w) => STOP.has(w) || /\d/.test(w))) add(t.join(' '))
  return [...out.values()]
}

export function extractAll(text: string): Extracted {
  const links = extractLinks(text)
  const accounts = extractAccounts(text, links)
  return { links, accounts, names: extractNames(text, links.length > 0) }
}
