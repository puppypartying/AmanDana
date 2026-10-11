import { isUsablePlatforms } from '../platform/import'
import { setActivePlatforms } from '../platform/registry'
import type { Platform } from '../platform/types'
import { createScorer, setActiveRules, type RulesData } from './engine'
import { validateRules } from './validateRules'

/**
 * Aturan terbit dari server (Cloudflare Pages Functions + KV, lihat docs/admin.md).
 * Prinsip: server hanya boleh MENAMBAH kemampuan. Gagal jaringan, respons rusak, atau aturan tidak valid
 * berarti aplikasi tetap memakai aturan yang sudah ada (cache terakhir yang valid, atau bawaan bundel).
 */
export const RULES_CACHE_KEY = 'amandana-rules-cache'
const MAX_BYTES = 2 * 1024 * 1024

type Cached = { version: number; publishedAt: string; rules: RulesData; platforms?: Platform[] }
type Store = Pick<Storage, 'getItem' | 'setItem'>
export type RefreshStatus = 'updated' | 'unchanged' | 'unavailable' | 'invalid'

const isStrings = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** True hanya bila bentuknya lengkap, lolos validateRules, dan semua pola bisa dikompilasi. Tidak pernah melempar error. */
export function isUsableRules(raw: unknown): raw is RulesData {
  try {
    if (!isObj(raw)) return false
    const r = raw as Record<string, unknown>
    if (!isObj(r.thresholds) || typeof r.negationWindow !== 'number' || !isStrings(r.negationWords)) return false
    if (!Array.isArray(r.rules) || !Array.isArray(r.combos) || !isStrings(r.warningMarkers) || !isObj(r.severityFloors)) return false
    for (const rule of r.rules) {
      if (!isObj(rule) || typeof rule.id !== 'string' || !Array.isArray(rule.patterns) || !rule.patterns.every((p) => isObj(p) && typeof p.re === 'string')) return false
      if (typeof rule.weight !== 'number' || typeof rule.category !== 'string' || typeof rule.label !== 'string' || typeof rule.explanation !== 'string') return false
    }
    if (!r.combos.every((c) => isObj(c) && typeof c.id === 'string' && isStrings(c.requires) && typeof c.minScore === 'number')) return false
    const rules = raw as unknown as RulesData
    return validateRules(rules).length === 0 && createScorer(rules).errors.length === 0
  } catch {
    return false
  }
}

function readCache(store: Store | null): Cached | null {
  try {
    const parsed = JSON.parse(store?.getItem(RULES_CACHE_KEY) ?? 'null') as Partial<Cached> | null
    if (parsed && typeof parsed.version === 'number' && isUsableRules(parsed.rules)) return { ...parsed, platforms: isUsablePlatforms(parsed.platforms) ? parsed.platforms : undefined } as Cached
  } catch { /* cache rusak: abaikan */ }
  return null
}

function defaultStore(): Store | null {
  try { return typeof window === 'undefined' ? null : window.localStorage } catch { return null }
}

/** Dipanggil sinkron sebelum render: pakai aturan terbit terakhir yang tersimpan agar offline tetap konsisten. */
export function applyCachedRules(store: Store | null = defaultStore()): number | null {
  const cached = readCache(store)
  if (!cached) return null
  if (setActiveRules(cached.rules).length) return null
  setActivePlatforms(cached.platforms ?? null)
  return cached.version
}

export type RefreshOptions = { fetchFn?: typeof fetch; store?: Store | null; url?: string; timeoutMs?: number }

/** Ambil aturan terbit dari server dan terapkan bila valid dan lebih baru dari cache. */
export async function refreshRules(opts: RefreshOptions = {}): Promise<{ status: RefreshStatus; version?: number }> {
  const fetchFn = opts.fetchFn ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : null)
  if (!fetchFn) return { status: 'unavailable' }
  const store = opts.store === undefined ? defaultStore() : opts.store
  const url = opts.url ?? `${import.meta.env.BASE_URL}api/rules`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 5000)
  try {
    const res = await fetchFn(url, { signal: ctrl.signal, headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'default' })
    if (!res.ok) return { status: 'unavailable' }
    const text = await res.text()
    if (text.length > MAX_BYTES) return { status: 'invalid' }
    const body = JSON.parse(text) as Partial<Cached>
    if (typeof body.version !== 'number' || !isUsableRules(body.rules)) return { status: 'invalid' }
    // Daftar platform: tidak ada = bawaan build; ada tapi rusak = seluruh respons ditolak.
    if (body.platforms !== undefined && !isUsablePlatforms(body.platforms)) return { status: 'invalid' }
    const platforms = body.platforms ?? null
    const cached = readCache(store)
    if (cached && cached.version === body.version) {
      // Cache sudah versi ini; pastikan tetap aktif (mis. refresh dipanggil tanpa applyCachedRules).
      if (setActiveRules(body.rules).length) return { status: 'invalid', version: body.version }
      setActivePlatforms(platforms)
      return { status: 'unchanged', version: body.version }
    }
    if (setActiveRules(body.rules).length) return { status: 'invalid' }
    setActivePlatforms(platforms)
    try { store?.setItem(RULES_CACHE_KEY, JSON.stringify({ version: body.version, publishedAt: body.publishedAt ?? '', rules: body.rules, ...(platforms ? { platforms } : {}) })) } catch { /* penyimpanan penuh/diblokir: tetap aktif untuk sesi ini */ }
    return { status: 'updated', version: body.version }
  } catch {
    return { status: 'unavailable' }
  } finally {
    clearTimeout(timer)
  }
}
