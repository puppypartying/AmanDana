import type { OfferKind } from './engine'

/**
 * Pembacaan angka (Opsi A): bukan aturan baru, hanya jalur kedua untuk aturan Bab 4.3 yang sudah ada.
 * Berjalan pada teks mentah (bukan hasil normalize, karena normalize memecah "0.8%" di titik).
 */
export const NUMERIC_LIMITS = {
  /** Imbal hasil setara per tahun yang dianggap tidak wajar (deposito/SBN berkisar satu digit). */
  returnAnnualPct: 100,
  /** Potongan di muka (% dari pinjaman atau dari angka potongan) yang dianggap besar. */
  upfrontPct: 10,
}

const PREP = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ')
const num = (s: string) => (s.includes(',') && !/\.\d{3}/.test(s) ? parseFloat(s.replace(',', '.')) : parseFloat(s.replace(/\./g, '').replace(',', '.')))
const PER: Record<string, number> = { hari: 365, harian: 365, minggu: 52, mingguan: 52, pekan: 52, bulan: 12, bulanan: 12, tahun: 1, tahunan: 1 }
const GAIN = /untung|keuntungan|profit|cuan|return|imbal|hasil|dividen|penghasilan|bonus|bagi hasil/
const NEG = /\b(?:tidak|tak|bukan|tanpa|jangan|belum|nggak|gak|bebas)\b(?:\s+\S+){0,4}\s*$/

function returnRate(t: string): string | null {
  const forms: [RegExp, number, number][] = [
    [/(\d+(?:[.,]\d+)?)\s*%\s*(?:per|\/|tiap|setiap|\s)\s*(hari|harian|minggu|mingguan|pekan|bulan|bulanan|tahun|tahunan)\b/g, 1, 2],
    [/\b(harian|mingguan|bulanan)\s*(?:sebesar|hingga|sampai|up to)?\s*(\d+(?:[.,]\d+)?)\s*%/g, 2, 1],
  ]
  for (const [re, ni, ui] of forms) {
    for (const m of t.matchAll(re)) {
      const at = m.index ?? 0
      const ctx = t.slice(Math.max(0, at - 50), at + m[0].length + 25)
      if (!GAIN.test(ctx)) continue
      if (NEG.test(t.slice(Math.max(0, at - 40), at))) continue
      const annual = num(m[ni]) * (PER[m[ui]] ?? 0)
      if (annual >= NUMERIC_LIMITS.returnAnnualPct) return `${m[0].trim()} (setara ±${Math.round(annual)}% per tahun)`
    }
  }
  return null
}

function money(n: string, unit?: string): number {
  const v = num(n)
  const u = unit ?? ''
  return u === 'juta' || u === 'jt' ? v * 1e6 : u === 'ribu' || u === 'rb' || u === 'k' ? v * 1e3 : v
}

/** Ambil nominal pinjaman dan dana cair; hanya angka berawalan Rp atau bersatuan juta/ribu. */
export function extractAmounts(t: string): { principal: number | null; received: number | null } {
  let principal: number | null = null
  let received: number | null = null
  const re = /(?:rp\.?\s*(\d[\d.,]*)\s*(juta|jt|ribu|rb)?)|(?:(\d[\d.,]*)\s*(juta|jt|ribu|rb))/g
  for (const m of t.matchAll(re)) {
    const v = money(m[1] ?? m[3], m[2] ?? m[4])
    if (!Number.isFinite(v) || v < 10000) continue
    const before = t.slice(Math.max(0, (m.index ?? 0) - 24), m.index)
    if (/(?:cair|diterima|terima|bersih)[^\d]*$/.test(before)) received ??= v
    else if (/(?:pinjam(?:an)?|plafon|limit|disetujui)[^\d]*$/.test(before)) principal ??= v
  }
  return { principal, received }
}

function upfront(t: string): string | null {
  let best = 0
  let ev = ''
  const forms = [
    /(?:potongan|dipotong|admin|provisi|biaya\s+layanan|biaya\s+proses)\D{0,18}?(\d+(?:[.,]\d+)?)\s*%/g,
    /(\d+(?:[.,]\d+)?)\s*%\s*(?:potongan|dipotong|biaya\s+admin|admin|provisi)/g,
  ]
  for (const re of forms) for (const m of t.matchAll(re)) {
    const p = num(m[1])
    if (p > best) { best = p; ev = m[0].trim() }
  }
  const { principal, received } = extractAmounts(t)
  if (principal && received && principal > received) {
    const p = ((principal - received) / principal) * 100
    if (p > best) { best = p; ev = `dana cair lebih kecil ${Math.round(p)}% dari pinjaman` }
  }
  return best >= NUMERIC_LIMITS.upfrontPct ? ev : null
}

/** id aturan -> bukti angka. Hanya aturan yang berlaku untuk `kind` yang diisi. */
export function numericEvidence(raw: string, kind: OfferKind): Record<string, string> {
  const t = PREP(raw)
  const out: Record<string, string> = {}
  if (kind === 'Investasi') { const r = returnRate(t); if (r) out['inv-imbal-pasti'] = r }
  if (kind === 'Pinjol') { const u = upfront(t); if (u) out['pin-potongan-muka'] = u }
  return out
}
