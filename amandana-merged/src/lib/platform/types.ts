export type PlatformType = 'nama' | 'tautan' | 'akun'
export type ListStatus = 'red-flag' | 'resmi'
/** Satu entri daftar referensi (diisi admin dari sumber resmi OJK/Satgas PASTI). */
export type Platform = {
  id: string
  value: string
  type: PlatformType
  status: ListStatus
  note: string
  /** Domain resmi (hanya berarti untuk status "resmi"): dipakai mendeteksi tautan palsu. */
  domains?: string[]
  /** Tanggal sumber, format YYYY-MM-DD. */
  sourceDate?: string
}

export type PlatformStatus = 'red-flag' | 'tautan-berbeda' | 'mirip-red-flag' | 'mirip-resmi' | 'tidak-ditemukan' | 'resmi' | 'tidak-dicek'
/** Urutan terburuk -> terbaik; status gabungan diambil dari yang terburuk. */
export const STATUS_ORDER: PlatformStatus[] = ['red-flag', 'tautan-berbeda', 'mirip-red-flag', 'mirip-resmi', 'tidak-ditemukan', 'resmi', 'tidak-dicek']

export type LinkSignalId = 'ip-host' | 'punycode' | 'insecure-http' | 'brand-impersonation' | 'cheap-tld' | 'apk-file' | 'hyphen-subdomain' | 'short-link'
export type LinkSignal = { id: LinkSignalId; label: string; detail: string; weight: number; /** teks pengguna: tidak disimpan */ host?: string }

export type FindingEntry = { value: string; note: string; sourceDate?: string; domains?: string[] }
export type PlatformFinding = {
  kind: PlatformType
  status: PlatformStatus
  /** Kalimat umum, tidak memuat teks pengguna. */
  detail: string
  /** Teks pengguna yang dicek (nama/domain/nomor). Tidak disimpan ke storage. */
  input?: string
  entry?: FindingEntry
}
export type PlatformCheck = { status: PlatformStatus; findings: PlatformFinding[]; signals: LinkSignal[]; listSize: number }
