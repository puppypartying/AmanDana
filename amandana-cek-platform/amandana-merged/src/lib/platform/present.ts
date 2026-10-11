import { STATUS_ORDER, type FindingEntry, type LinkSignal, type PlatformCheck, type PlatformFinding, type PlatformStatus } from './types'

export type StatusView = { tone: 'bad' | 'warn' | 'ok' | 'neutral'; title: string; body: string }

export function statusView(c: PlatformCheck): StatusView {
  const empty = c.listSize === 0
  switch (c.status) {
    case 'red-flag': return { tone: 'bad', title: 'Ada di daftar red-flag', body: 'Nama, tautan, atau akun ini tercatat sebagai ilegal. Jangan transfer atau memberi data.' }
    case 'tautan-berbeda': return { tone: 'bad', title: 'Tautan tidak sesuai domain resmi', body: 'Pesan mengaku dari platform resmi atau menyerupai domainnya, tetapi alamatnya berbeda. Buka platform lewat toko aplikasi atau situs resmi yang kamu ketik sendiri.' }
    case 'mirip-red-flag': return { tone: 'warn', title: 'Mirip entri red-flag', body: 'Menyerupai platform di daftar ilegal. Periksa ejaan dan verifikasi di OJK sebelum lanjut.' }
    case 'mirip-resmi': return { tone: 'warn', title: 'Mirip platform resmi, tapi tidak persis', body: 'Bisa salah ketik, bisa juga peniruan nama. Verifikasi di kanal resmi.' }
    case 'tidak-ditemukan': return { tone: 'warn', title: empty ? 'Daftar referensi belum diisi' : 'Belum ditemukan di daftar referensi', body: empty ? 'Aplikasi belum memuat daftar platform, jadi legalitas belum bisa dicek di sini. Verifikasi langsung di OJK.' : 'Ini bukan tanda aman. Daftar kami terbatas, jadi cek izin di OJK sebelum meminjam.' }
    case 'resmi': return { tone: 'ok', title: 'Cocok dengan daftar platform resmi', body: 'Terdaftar bukan jaminan pesan ini asli: penipu sering mencatut nama resmi. Pastikan tautan dan akun pengirimnya juga resmi.' }
    default: return { tone: 'neutral', title: 'Belum ada yang bisa dicek', body: 'Tulis nama platform, tautan, atau nomor/akun pengirim agar bisa dicocokkan ke daftar.' }
  }
}

export const findingLabel: Record<PlatformStatus, string> = {
  'red-flag': 'Red-flag', 'tautan-berbeda': 'Tautan berbeda', 'mirip-red-flag': 'Mirip red-flag', 'mirip-resmi': 'Mirip resmi', 'tidak-ditemukan': 'Tidak ada di daftar', resmi: 'Resmi', 'tidak-dicek': 'Tidak dicek',
}
export const kindLabel = { nama: 'Nama', tautan: 'Tautan', akun: 'Akun' } as const

/** Buang teks pengguna (nama/domain/nomor yang dicek) sebelum disimpan. Sisanya hanya data daftar admin dan kalimat umum. */
export function slimPlatform(c: PlatformCheck): PlatformCheck {
  return {
    ...c,
    findings: c.findings.map(({ input: _i, ...f }) => (void _i, f)),
    signals: c.signals.map(({ host: _h, ...s }) => (void _h, s)),
  }
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null
const str = (x: unknown): x is string => typeof x === 'string'

/** Validasi bentuk data dari storage. Rusak -> null (dibuang, bukan error). */
export function sanitizePlatform(raw: unknown): PlatformCheck | null {
  if (!isObj(raw) || !STATUS_ORDER.includes(raw.status as PlatformStatus) || !Array.isArray(raw.findings) || !Array.isArray(raw.signals) || typeof raw.listSize !== 'number') return null
  const findings: PlatformFinding[] = []
  for (const f of raw.findings) {
    if (!isObj(f) || !['nama', 'tautan', 'akun'].includes(f.kind as string) || !STATUS_ORDER.includes(f.status as PlatformStatus) || !str(f.detail)) return null
    let entry: FindingEntry | undefined
    if (isObj(f.entry) && str(f.entry.value) && str(f.entry.note)) entry = { value: f.entry.value, note: f.entry.note, sourceDate: str(f.entry.sourceDate) ? f.entry.sourceDate : undefined, domains: Array.isArray(f.entry.domains) ? f.entry.domains.filter(str) : undefined }
    findings.push({ kind: f.kind as PlatformFinding['kind'], status: f.status as PlatformStatus, detail: f.detail, ...(entry ? { entry } : {}) })
  }
  const signals: LinkSignal[] = []
  for (const s of raw.signals) {
    if (!isObj(s) || !str(s.id) || !str(s.label) || !str(s.detail) || typeof s.weight !== 'number') return null
    signals.push({ id: s.id as LinkSignal['id'], label: s.label, detail: s.detail, weight: s.weight })
  }
  return { status: raw.status as PlatformStatus, findings, signals, listSize: raw.listSize }
}
