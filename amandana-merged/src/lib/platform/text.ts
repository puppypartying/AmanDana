import { normalize } from '../risk/normalize'

/** Kata umum yang dibuang saat membandingkan nama, supaya "PT Kredit Cepat" = "kredit-cepat". */
export const GENERIC = new Set(['pt', 'cv', 'tbk', 'aplikasi', 'app', 'apk', 'platform', 'pinjol', 'pinjaman', 'online', 'situs', 'website', 'layanan', 'fintech', 'lending', 'p2p'])

export const tokens = (s: string) => normalize(s.replace(/\b(pt|cv)\.\s*/gi, '$1 ')).replace(/[|,]/g, ' ').split(' ').filter(Boolean)
/** Kunci nama: huruf kecil, tanpa spasi/tanda baca/kata umum. */
export const nameKey = (s: string) => tokens(s).filter((t) => !GENERIC.has(t)).join('')

/** 0813-1111-2222 / +62 813... / 62813... -> "62813...". null bila bukan nomor seluler Indonesia. */
export function phoneKey(s: string): string | null {
  let d = s.replace(/\D/g, '')
  if (d.startsWith('0')) d = '62' + d.slice(1)
  else if (d.startsWith('8')) d = '62' + d
  return /^628\d{7,12}$/.test(d) ? d : null
}
export const handleKey = (s: string): string | null => {
  const h = s.trim().toLowerCase().replace(/^@/, '')
  return /^[a-z0-9_.]{3,30}$/.test(h) ? h : null
}

/** Jarak edit (Damerau terbatas: tukar huruf bersebelahan dihitung 1). */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

/** exact = sama persis; mirip = salah ketik 1-2 huruf atau memuat nama lain. */
export function similarity(a: string, b: string): 'exact' | 'mirip' | null {
  if (!a || !b) return null
  if (a === b) return 'exact'
  const [s, l] = a.length <= b.length ? [a, b] : [b, a]
  if (s.length < 5) return null
  if (editDistance(a, b) <= (l.length >= 9 ? 2 : 1)) return 'mirip'
  if (s.length >= 6 && l.includes(s) && l.length - s.length <= 6) return 'mirip'
  return null
}

const SLD = new Set(['co', 'or', 'go', 'ac', 'web', 'sch', 'my', 'net', 'com', 'org'])
export const isIp = (h: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(h)
/** example.co.id -> example.co.id; a.b.example.com -> example.com. */
export function registrable(host: string): string {
  if (isIp(host)) return host
  const l = host.split('.')
  if (l.length >= 3 && l[l.length - 1].length === 2 && SLD.has(l[l.length - 2])) return l.slice(-3).join('.')
  return l.slice(-2).join('.')
}
