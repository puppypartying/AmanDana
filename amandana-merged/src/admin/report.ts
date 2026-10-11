/**
 * Bobot dan kategori 10 aturan yang berasal dari laporan Bab 4.3 (`source: "laporan-4.3"` di rules.json).
 * Dipakai panel admin untuk menandai selisih. Aturan tambahan dari audit (D1/D2) sengaja tidak ada di sini:
 * panel menandainya sebagai "di luar laporan" lewat field `source`.
 */
export const REPORT_RULES: Record<string, { weight: number; category: string }> = {
  'inv-imbal-pasti': { weight: 28, category: 'investasi' },
  'inv-ajak-teman': { weight: 20, category: 'investasi' },
  'inv-rekening-pribadi': { weight: 24, category: 'investasi' },
  'inv-tekanan-waktu': { weight: 10, category: 'investasi' },
  'inv-catut-ojk': { weight: 18, category: 'investasi' },
  'pin-akses-kontak': { weight: 25, category: 'pinjol' },
  'pin-ancaman': { weight: 25, category: 'pinjol' },
  'pin-potongan-muka': { weight: 20, category: 'pinjol' },
  'pin-tenor-pendek': { weight: 15, category: 'pinjol' },
  'pin-bunga-denda': { weight: 15, category: 'pinjol' },
}
export const REPORT_THRESHOLDS = { sedang: 40, tinggi: 70 }
/** Bab 7.4: precision dan recall minimal 80% pada data uji. */
export const TARGET = 0.8
/** Ukuran holdout minimum yang disarankan agar angkanya berarti. */
export const MIN_HOLDOUT = 100
