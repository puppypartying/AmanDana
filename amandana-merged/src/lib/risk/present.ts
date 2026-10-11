import { maskNumbers } from '@/lib/format'
import type { Analysis, RiskLevel } from './analysis'

/** Warna cincin/bar per level (sama dengan halaman Hasil). */
export const levelColor = (level: RiskLevel) => (level === 'Tinggi' ? '#cf605b' : level === 'Sedang' ? '#ddb65f' : '#82a68b')

export const levelBadgeClass = (level: RiskLevel) =>
  level === 'Tinggi'
    ? 'bg-[var(--tone-bg-fbeceb)] text-destructive'
    : level === 'Sedang'
      ? 'bg-[var(--tone-bg-fcf7e9)] text-[var(--tone-text-aa7c29)]'
      : 'bg-secondary text-primary'

export const adviceFor = (level: RiskLevel) =>
  level === 'Tinggi'
    ? 'Jangan transfer dulu. Periksa lewat kanal resmi sebelum melanjutkan.'
    : level === 'Sedang'
      ? 'Ada tanda bahaya. Luangkan waktu memeriksa detailnya sebelum memutuskan.'
      : 'Tidak ada pola berisiko yang kami kenali, tetapi ini bukan jaminan aman.'

/** Alasan dengan bobot terbesar lebih dulu (urutan asal dipertahankan bila sama). */
export const topReasons = (analysis: Analysis, n = 3) =>
  analysis.reasons
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.weight - a.r.weight || a.i - b.i)
    .slice(0, n)
    .map(({ r }) => r)

/** Penanda batas kalimat/koma dari normalize() dibuang agar bukti terbaca wajar. */
const tidy = (s: string) => s.replace(/\s*\|\s*/g, ' ').replace(/\s+,/g, ',').replace(/\s+/g, ' ').trim()

/**
 * Potongan teks yang memicu aturan, sudah disamarkan. null bila tidak tersedia:
 * matchedRules hanya ada di memori (tidak disimpan ke perangkat), jadi hilang setelah halaman dimuat ulang.
 */
export function evidenceFor(analysis: Analysis, title: string): string | null {
  const hit = analysis.matchedRules.find((m) => m.label === title)
  if (!hit) return null
  const text = tidy(maskNumbers(hit.evidence))
  return text || null
}
