import { maskNumbers } from '@/lib/format'
import type { Analysis, RiskLevel } from '@/lib/risk/analysis'

/**
 * Penyimpanan lokal (localStorage) dengan versi skema dan try/catch.
 * Semua fungsi menerima `store` agar bisa diuji tanpa browser dan tidak pernah melempar error.
 *
 * Privasi: teks mentah pesan TIDAK disimpan. Yang disimpan hanya skor, level, dan alasan.
 * `matchedRules` sengaja dibuang karena berisi potongan teks pengguna (evidence).
 * Teks (sudah disamarkan) hanya disimpan jika `saveText` dinyalakan.
 */
export const STORAGE_KEY = 'amandana:data'
export const SCHEMA_VERSION = 1
export const MAX_HISTORY = 20
const OWN_PREFIXES = ['amandana:', 'amandana-'] // termasuk kunci tema lama "amandana-theme"

export type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>
export type StoredAnalysis = Omit<Analysis, 'matchedRules'>
export type StoredData = {
  v: typeof SCHEMA_VERSION
  saveText: boolean
  last: StoredAnalysis | null
  history: StoredAnalysis[] // terbaru dulu, maks MAX_HISTORY
  evidenceChecks: string[]
  complaintTemplate: string | null // null = pakai template bawaan
  quizAnswer: number | null
}

export function defaultData(): StoredData {
  return { v: SCHEMA_VERSION, saveText: false, last: null, history: [], evidenceChecks: [], complaintTemplate: null, quizAnswer: null }
}

export function isEmptyData(d: StoredData): boolean {
  return !d.saveText && d.last === null && d.history.length === 0 && d.evidenceChecks.length === 0 && d.complaintTemplate === null && d.quizAnswer === null
}

export function getStore(): KV | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

const LEVELS: RiskLevel[] = ['Rendah', 'Sedang', 'Tinggi']
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null

function toStoredAnalysis(raw: unknown): StoredAnalysis | null {
  if (!isObj(raw)) return null
  const { id, createdAt, kind, score, level, reasons, text } = raw
  if (typeof id !== 'string' || typeof createdAt !== 'number' || typeof kind !== 'string') return null
  if (typeof score !== 'number' || score < 0 || score > 100) return null
  if (typeof level !== 'string' || !LEVELS.includes(level as RiskLevel)) return null
  if (!Array.isArray(reasons)) return null
  const cleanReasons: StoredAnalysis['reasons'] = []
  for (const r of reasons) {
    if (!isObj(r) || typeof r.title !== 'string' || typeof r.detail !== 'string' || typeof r.weight !== 'number' || typeof r.icon !== 'string') return null
    cleanReasons.push({ title: r.title, detail: r.detail, weight: r.weight, icon: r.icon })
  }
  const out: StoredAnalysis = { id, createdAt, kind, score, level: level as RiskLevel, reasons: cleanReasons }
  if (typeof text === 'string') out.text = maskNumbers(text)
  return out
}

/** Validasi data mentah dari storage. Data rusak/versi tak dikenal -> data bawaan, bagian per bagian. */
export function sanitize(raw: unknown): StoredData {
  const base = defaultData()
  if (!isObj(raw) || raw.v !== SCHEMA_VERSION) return base // TODO: tambahkan migrasi saat skema naik versi
  const last = toStoredAnalysis(raw.last)
  const history = Array.isArray(raw.history) ? raw.history.map(toStoredAnalysis).filter((x): x is StoredAnalysis => x !== null).slice(0, MAX_HISTORY) : []
  return {
    v: SCHEMA_VERSION,
    saveText: raw.saveText === true,
    last,
    history,
    evidenceChecks: Array.isArray(raw.evidenceChecks) ? raw.evidenceChecks.filter((x): x is string => typeof x === 'string') : [],
    complaintTemplate: typeof raw.complaintTemplate === 'string' ? raw.complaintTemplate : null,
    quizAnswer: typeof raw.quizAnswer === 'number' && Number.isInteger(raw.quizAnswer) && raw.quizAnswer >= 0 ? raw.quizAnswer : null,
  }
}

export function loadData(store: KV | null = getStore()): StoredData {
  if (!store) return defaultData()
  try {
    const raw = store.getItem(STORAGE_KEY)
    return raw ? sanitize(JSON.parse(raw)) : defaultData()
  } catch {
    return defaultData()
  }
}

/** Mengembalikan true jika berhasil. Data kosong = kunci dihapus (tidak meninggalkan jejak). */
export function saveData(data: StoredData, store: KV | null = getStore()): boolean {
  if (!store) return false
  try {
    if (isEmptyData(data)) store.removeItem(STORAGE_KEY)
    else store.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

/** Hapus semua kunci milik aplikasi (data, riwayat, tema). Kunci lain di origin yang sama dibiarkan. */
export function clearAllData(store: KV | null = getStore()): boolean {
  if (!store) return false
  try {
    const keys: string[] = []
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i)
      if (k && OWN_PREFIXES.some((p) => k.startsWith(p))) keys.push(k)
    }
    keys.forEach((k) => store.removeItem(k))
    return true
  } catch {
    return false
  }
}

export function toStored(a: Analysis): StoredAnalysis {
  const { matchedRules: _dropped, ...rest } = a
  void _dropped
  return rest.text === undefined ? rest : { ...rest, text: maskNumbers(rest.text) }
}

export function fromStored(s: StoredAnalysis): Analysis {
  return { ...s, matchedRules: [] }
}

/** Menempelkan teks (disamarkan) ke hasil analisis hanya bila saveText menyala. */
export function withSavedText(a: Analysis, offer: string, saveText: boolean): Analysis {
  if (!saveText) return a
  return { ...a, text: maskNumbers(offer) }
}

export function stripText<T extends { text?: string }>(a: T): T {
  const { text: _text, ...rest } = a
  void _text
  return rest as T
}

export function pushHistory(history: StoredAnalysis[], entry: StoredAnalysis): StoredAnalysis[] {
  return [entry, ...history.filter((h) => h.id !== entry.id)].slice(0, MAX_HISTORY)
}
