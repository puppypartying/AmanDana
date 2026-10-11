import type { AdminData } from './schema'

/** Klien API admin (Pages Functions di /admin-api). Semua pemanggilan lewat sesi Cloudflare Access (cookie). */
export type Meta = { version: number; publishedAt: string; publishedBy: string; note: string }
export type ServerDraft = { rev: number; updatedAt: string; updatedBy: string; data: AdminData }
export type ServerState = { email: string; draft: ServerDraft | null; published: Meta | null; history: Meta[]; hasUnpublished: boolean }
export type GateInfo = { status: 'lulus' | 'gagal' | 'dilewati'; n: number; precision: number | null; recall: number | null; target: number; reason?: string }

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; body?: Record<string, unknown> }

const base = () => `${import.meta.env.BASE_URL}admin-api/`

async function call<T>(method: string, path: string, body?: unknown, fetchFn: typeof fetch = fetch): Promise<ApiResult<T>> {
  try {
    const res = await fetchFn(base() + path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual', // sesi Access kedaluwarsa menjawab redirect ke halaman login: jangan diikuti diam-diam
    })
    if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) return { ok: false, status: 401, error: 'Sesi login berakhir. Muat ulang halaman untuk masuk lagi.' }
    const text = await res.text()
    let parsed: Record<string, unknown> | null = null
    try { parsed = JSON.parse(text) as Record<string, unknown> } catch { /* bukan JSON: mis. SPA fallback saat dev tanpa Functions */ }
    if (!parsed) return { ok: false, status: res.status, error: 'API admin tidak tersedia di alamat ini (Pages Functions belum aktif?).' }
    if (!res.ok) return { ok: false, status: res.status, error: typeof parsed.error === 'string' ? parsed.error : `Gagal (${res.status}).`, body: parsed }
    return { ok: true, data: parsed as T }
  } catch {
    return { ok: false, status: 0, error: 'Tidak bisa menghubungi server.' }
  }
}

export const adminApi = {
  state: (f?: typeof fetch) => call<ServerState>('GET', 'state', undefined, f),
  saveDraft: (data: AdminData, baseRev: number | null, f?: typeof fetch) => call<{ rev: number; updatedAt: string; updatedBy: string }>('PUT', 'draft', { data, baseRev }, f),
  publish: (rev: number, note: string, acknowledge: boolean, f?: typeof fetch) => call<{ published: Meta; gate: GateInfo }>('POST', 'publish', { rev, note, acknowledge }, f),
  rollback: (version: number, note: string, f?: typeof fetch) => call<{ published: Meta }>('POST', 'rollback', { version, note }, f),
}
