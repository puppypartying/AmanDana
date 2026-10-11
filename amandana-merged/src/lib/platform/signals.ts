import type { ExtractedLink } from './extract'
import type { LinkSignal } from './types'
import { isIp, registrable } from './text'

const CHEAP_TLD = new Set(['xyz', 'top', 'icu', 'cyou', 'click', 'loan', 'vip', 'buzz', 'shop', 'site', 'online', 'live', 'fun', 'ink', 'pw', 'tk', 'ml', 'ga', 'cf', 'gq'])
const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 'cutt.ly', 's.id', 'is.gd', 't.ly', 'rb.gy', 'shorturl.at'])
const BRANDS = ['ojk', 'satgas', 'kominfo', 'komdigi', 'kemenkeu', 'bankindonesia', 'polri']

/** 8 sinyal teknis pada satu tautan. Tidak membaca isi halaman, hanya bentuk alamatnya. */
export function linkSignals(l: ExtractedLink): LinkSignal[] {
  const out: LinkSignal[] = []
  const { host } = l
  const push = (id: LinkSignal['id'], label: string, detail: string, weight: number) => out.push({ id, label, detail, weight, host })
  const reg = registrable(host)
  const tld = host.split('.').pop() ?? ''
  if (isIp(host)) push('ip-host', 'Alamat berupa angka IP', 'Layanan resmi memakai nama domain, bukan alamat IP.', 20)
  if (host.split('.').some((x) => x.startsWith('xn--'))) push('punycode', 'Domain memakai karakter menyerupai huruf lain', 'Domain "xn--" sering dipakai meniru nama merek dengan huruf yang tampak sama.', 20)
  if (l.scheme === 'http') push('insecure-http', 'Tautan tanpa enkripsi (http)', 'Situs keuangan yang sah memakai https.', 8)
  const flat = host.replace(/[-.]/g, '')
  if (!host.endsWith('.go.id') && BRANDS.some((b) => flat.includes(b))) push('brand-impersonation', 'Domain mencatut nama lembaga', 'Domain memuat nama lembaga negara tetapi bukan domain pemerintah (.go.id).', 25)
  if (!isIp(host) && CHEAP_TLD.has(tld)) push('cheap-tld', 'Akhiran domain murahan', `Akhiran .${tld} murah dan sering dipakai situs sekali pakai.`, 10)
  if (/\.apk(?:$|\?)/.test(l.path) || host.split(/[.-]/).includes('apk')) push('apk-file', 'Mengarah ke berkas APK', 'Aplikasi resmi diunduh dari toko aplikasi, bukan berkas APK dari tautan.', 12)
  const labels = host.replace(/^www\./, '').split('.')
  if ((host.match(/-/g)?.length ?? 0) >= 3 || labels.length > 4) push('hyphen-subdomain', 'Alamat berbelit', 'Banyak tanda hubung atau sub-domain adalah cara umum menyamarkan domain asli.', 8)
  if (SHORTENERS.has(reg)) push('short-link', 'Tautan dipendekkan', 'Tujuan asli tautan pendek disembunyikan.', 8)
  return out
}
