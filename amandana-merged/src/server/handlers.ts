import { buildReport } from '@/admin/matrix'
import { TARGET } from '@/admin/report'
import { parseAdminData, type AdminData } from '@/admin/schema'
import { platformIssues } from '@/lib/platform/import'
import { createScorer, type RulesData } from '@/lib/risk/engine'
import { validateRules } from '@/lib/risk/validateRules'
import { AuthError, verifyAccessJwt } from './access'
import { stableStringify } from './stable'
import { HISTORY_LIMIT, KEYS, type Draft, type Env, type KV, type Published } from './types'

const MAX_BODY = 2 * 1024 * 1024
const NO_STORE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } })
const adminJson = (body: unknown, status = 200) => json(body, status, NO_STORE)

async function readJson<T>(kv: KV, key: string): Promise<T | null> {
  const raw = await kv.get(key)
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}
const writeJson = (kv: KV, key: string, value: unknown) => kv.put(key, JSON.stringify(value))

// ---------------------------------------------------------------- publik

/** GET /api/rules: aturan yang sedang terbit (204 bila belum ada). Tanpa identitas admin. Klien jatuh ke aturan bawaan bila ini gagal. */
export async function handlePublicRules(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'Metode tidak didukung.' }, 405, { Allow: 'GET, HEAD' })
  if (!env.AMANDANA_KV) return json({ error: 'Penyimpanan belum dikonfigurasi.' }, 503, { 'Cache-Control': 'no-store' })
  const pub = await readJson<Published>(env.AMANDANA_KV, KEYS.published)
  // 204 (bukan 404): belum ada aturan terbit itu keadaan normal, jangan memunculkan error di konsol pengguna.
  if (!pub) return new Response(null, { status: 204, headers: { 'Cache-Control': 'public, max-age=30' } })
  const etag = `"v${pub.version}"`
  const headers = { 'Cache-Control': 'public, max-age=60', ETag: etag }
  if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers })
  return json({ version: pub.version, publishedAt: pub.publishedAt, rules: pub.rules, ...(pub.platforms ? { platforms: pub.platforms } : {}) }, 200, headers)
}

// ---------------------------------------------------------------- gate dan validasi

export type GateResult = {
  status: 'lulus' | 'gagal' | 'dilewati'
  n: number
  precision: number | null
  recall: number | null
  target: number
  reason?: string
}

/** Ukur aturan pada sampel holdout (ambang Sedang). Hanya peringatan: admin boleh melanjutkan dengan `acknowledge`. */
export function runGate(data: AdminData): GateResult {
  const holdout = data.samples.filter((s) => s.split === 'holdout')
  if (holdout.length === 0) return { status: 'dilewati', n: 0, precision: null, recall: null, target: TARGET, reason: 'Tidak ada sampel holdout.' }
  const cell = buildReport(createScorer(data.rules), data.samples, 'holdout', data.rules.thresholds).at.sedang.Semua
  const low = (v: number | null) => v !== null && v < TARGET
  const failed = low(cell.precision) || low(cell.recall)
  return {
    status: failed ? 'gagal' : 'lulus',
    n: holdout.length,
    precision: cell.precision,
    recall: cell.recall,
    target: TARGET,
    ...(failed ? { reason: `Precision atau recall pada holdout di bawah ${Math.round(TARGET * 100)}%.` } : {}),
  }
}

const SLOW_MS = 250
// Teks uji beban: pola dengan backtracking katastrofik akan membuat setiap browser pengguna menggantung bila ikut terbit.
const STRESS = [
  'a '.repeat(3000),
  `${'pinjaman cepat cair tanpa survei '.repeat(150)}!`,
  `${'1.000.000 '.repeat(400)}x`,
  `${'a'.repeat(5000)}!`,
]

/** Masalah yang memblokir terbit: validasi bentuk aturan, pola yang tidak bisa dikompilasi, dan pola yang terlalu lambat. */
export function blockingIssues(rules: RulesData): string[] {
  const issues = validateRules(rules)
  const scorer = createScorer(rules)
  for (const e of scorer.errors) if (!issues.some((i) => e.startsWith(i.split(':')[0]))) issues.push(e)
  if (issues.length === 0) {
    for (const kind of ['Pinjol', 'Investasi'] as const) {
      for (const text of STRESS) {
        const t0 = performance.now()
        scorer.scoreOffer(text, kind)
        if (performance.now() - t0 > SLOW_MS) return [`Aturan terlalu lambat pada teks panjang (>${SLOW_MS} ms); kemungkinan ada regex dengan backtracking berlebihan.`]
      }
    }
  }
  return issues
}

// ---------------------------------------------------------------- admin

type Authenticate = (request: Request, env: Env) => Promise<{ email: string }>
export type AdminDeps = { authenticate?: Authenticate; now?: () => Date }

const defaultAuthenticate: Authenticate = async (request, env) => {
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!token) throw new AuthError(401, 'Tidak ada sesi Cloudflare Access.')
  return verifyAccessJwt(token, env)
}

const meta = (p: Published) => ({ version: p.version, publishedAt: p.publishedAt, publishedBy: p.publishedBy, note: p.note })

async function readBody(request: Request): Promise<Record<string, unknown> | Response> {
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) return adminJson({ error: 'Content-Type harus application/json.' }, 415)
  const text = await request.text()
  if (text.length > MAX_BODY) return adminJson({ error: 'Isi terlalu besar.' }, 413)
  try {
    const body = JSON.parse(text)
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>
  } catch { /* jatuh ke error di bawah */ }
  return adminJson({ error: 'Isi bukan JSON objek yang valid.' }, 400)
}

async function loadState(kv: KV) {
  const [draft, published, history] = await Promise.all([
    readJson<Draft>(kv, KEYS.draft),
    readJson<Published>(kv, KEYS.published),
    readJson<Published[]>(kv, KEYS.history),
  ])
  return { draft, published, history: history ?? [] }
}

export async function handleAdmin(request: Request, env: Env, deps: AdminDeps = {}): Promise<Response> {
  const url = new URL(request.url)
  const route = url.pathname.replace(/^\/admin-api\/?/, '').replace(/\/+$/, '')
  const method = request.method

  let who: { email: string }
  try {
    who = await (deps.authenticate ?? defaultAuthenticate)(request, env)
  } catch (e) {
    if (e instanceof AuthError) return adminJson({ error: e.message }, e.status)
    return adminJson({ error: 'Autentikasi gagal.' }, 401)
  }
  if (!env.AMANDANA_KV) return adminJson({ error: 'Binding KV AMANDANA_KV belum dipasang.' }, 503)
  const kv = env.AMANDANA_KV

  // Perlindungan CSRF berlapis: cookie Access tidak boleh dipakai dari situs lain.
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = request.headers.get('Origin')
    if (origin && origin !== url.origin) return adminJson({ error: 'Asal permintaan tidak diizinkan.' }, 403)
  }
  const nowIso = (deps.now ?? (() => new Date()))().toISOString()

  if (route === 'state' && method === 'GET') {
    const { draft, published, history } = await loadState(kv)
    return adminJson({
      email: who.email,
      draft,
      published: published ? meta(published) : null,
      history: history.map(meta),
      hasUnpublished: !!draft && (!published || stableStringify(draft.data.rules) !== stableStringify(published.rules) || stableStringify(draft.data.platforms) !== stableStringify(published.platforms ?? [])),
    })
  }

  if (route === 'draft' && method === 'PUT') {
    const body = await readBody(request)
    if (body instanceof Response) return body
    const data = parseAdminData(body.data)
    if (!data) return adminJson({ error: 'Paket draf tidak valid.' }, 400)
    const baseRev = typeof body.baseRev === 'number' ? body.baseRev : null
    const current = await readJson<Draft>(kv, KEYS.draft)
    if ((current?.rev ?? null) !== baseRev) return adminJson({ error: 'Draf sudah diubah admin lain. Muat ulang sebelum menyimpan.', draft: current }, 409)
    const next: Draft = { rev: (current?.rev ?? 0) + 1, updatedAt: nowIso, updatedBy: who.email, data }
    await writeJson(kv, KEYS.draft, next)
    return adminJson({ rev: next.rev, updatedAt: next.updatedAt, updatedBy: next.updatedBy })
  }

  if (route === 'publish' && method === 'POST') {
    const body = await readBody(request)
    if (body instanceof Response) return body
    const { draft, published, history } = await loadState(kv)
    if (!draft) return adminJson({ error: 'Belum ada draf tersimpan di server.' }, 409)
    if (body.rev !== draft.rev) return adminJson({ error: 'Draf di server sudah berubah. Muat ulang, periksa, lalu terbitkan lagi.' }, 409)
    const issues = [...blockingIssues(draft.data.rules), ...platformIssues(draft.data.platforms).errors]
    if (issues.length) return adminJson({ error: 'Aturan atau daftar platform belum valid.', issues }, 422)
    const gate = runGate(draft.data)
    if (gate.status === 'gagal' && body.acknowledge !== true) return adminJson({ error: 'Metrik holdout di bawah target.', gate }, 409)
    const note = typeof body.note === 'string' ? body.note.slice(0, 200) : ''
    const next: Published = { version: (published?.version ?? 0) + 1, publishedAt: nowIso, publishedBy: who.email, note, rules: draft.data.rules, platforms: draft.data.platforms }
    // Riwayat ditulis dulu: bila gagal di tengah, aturan yang terbit tidak berubah.
    await writeJson(kv, KEYS.history, [next, ...history].slice(0, HISTORY_LIMIT))
    await writeJson(kv, KEYS.published, next)
    return adminJson({ published: meta(next), gate })
  }

  if (route === 'rollback' && method === 'POST') {
    const body = await readBody(request)
    if (body instanceof Response) return body
    const { published, history } = await loadState(kv)
    const target = history.find((h) => h.version === body.version)
    if (!target) return adminJson({ error: 'Versi tidak ada di riwayat.' }, 404)
    const issues = [...blockingIssues(target.rules), ...(target.platforms ? platformIssues(target.platforms).errors : [])]
    if (issues.length) return adminJson({ error: 'Versi itu tidak lagi valid.', issues }, 422)
    const next: Published = {
      version: (published?.version ?? 0) + 1,
      publishedAt: nowIso,
      publishedBy: who.email,
      note: `Rollback ke v${target.version}${typeof body.note === 'string' && body.note ? `: ${body.note.slice(0, 160)}` : ''}`,
      rules: target.rules,
      ...(target.platforms ? { platforms: target.platforms } : {}),
    }
    await writeJson(kv, KEYS.history, [next, ...history].slice(0, HISTORY_LIMIT))
    await writeJson(kv, KEYS.published, next)
    return adminJson({ published: meta(next) })
  }

  return adminJson({ error: 'Rute tidak ditemukan.' }, 404)
}
