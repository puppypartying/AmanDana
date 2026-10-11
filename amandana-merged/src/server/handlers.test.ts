import { describe, expect, it } from 'vitest'
import dataset from '@/admin/dataset.json'
import { defaults } from '@/admin/store'
import { DEFAULT_RULES } from '@/lib/risk/engine'
import { AuthError } from './access'
import { blockingIssues, handleAdmin, handlePublicRules, runGate } from './handlers'
import type { Draft, Env, KV, Published } from './types'

function fakeKv(initial: Record<string, string> = {}): KV & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return { data, get: async (k) => data.get(k) ?? null, put: async (k, v) => void data.set(k, v) }
}
const ORIGIN = 'https://amandana.test'
const as = (email: string) => async () => ({ email })
const deny = async () => { throw new AuthError(401, 'tidak ada sesi') }

const call = (env: Env, method: string, route: string, body?: unknown, opts: { auth?: () => Promise<{ email: string }>; origin?: string | null; type?: string } = {}) =>
  handleAdmin(
    new Request(`${ORIGIN}/admin-api/${route}`, {
      method,
      headers: { ...(opts.origin === null ? {} : { Origin: opts.origin ?? ORIGIN }), ...(body === undefined ? {} : { 'Content-Type': opts.type ?? 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
    { authenticate: opts.auth ?? as('admin@contoh.id'), now: () => new Date('2026-10-12T00:00:00Z') },
  )
type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const jsonOf = async (r: Response) => (await r.json()) as Json

async function saveDraft(env: Env, data = defaults(), baseRev: number | null = null) {
  const r = await call(env, 'PUT', 'draft', { data, baseRev })
  return { r, body: await jsonOf(r) }
}

describe('GET /api/rules (publik)', () => {
  it('204 bila belum ada aturan terbit, dan 503 bila KV belum dipasang', async () => {
    expect((await handlePublicRules(new Request(`${ORIGIN}/api/rules`), { AMANDANA_KV: fakeKv() })).status).toBe(204)
    expect((await handlePublicRules(new Request(`${ORIGIN}/api/rules`), {})).status).toBe(503)
  })
  it('mengirim aturan terbit tanpa email admin, dengan ETag dan cache pendek; 304 bila ETag sama', async () => {
    const pub: Published = { version: 3, publishedAt: 'x', publishedBy: 'rahasia@contoh.id', note: 'catatan internal', rules: DEFAULT_RULES }
    const env: Env = { AMANDANA_KV: fakeKv({ 'rules:published': JSON.stringify(pub) }) }
    const res = await handlePublicRules(new Request(`${ORIGIN}/api/rules`), env)
    const text = await res.text()
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=60')
    expect(res.headers.get('ETag')).toBe('"v3"')
    expect(text).not.toContain('rahasia@contoh.id')
    expect(text).not.toContain('catatan internal')
    expect(JSON.parse(text).version).toBe(3)
    const again = await handlePublicRules(new Request(`${ORIGIN}/api/rules`, { headers: { 'If-None-Match': '"v3"' } }), env)
    expect(again.status).toBe(304)
  })
  it('menolak metode tulis', async () => {
    expect((await handlePublicRules(new Request(`${ORIGIN}/api/rules`, { method: 'POST' }), { AMANDANA_KV: fakeKv() })).status).toBe(405)
  })
})

describe('/admin-api: autentikasi dan perlindungan', () => {
  it('tanpa sesi Access semua rute ditolak, termasuk baca', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    for (const [m, route] of [['GET', 'state'], ['PUT', 'draft'], ['POST', 'publish'], ['POST', 'rollback']] as const) {
      expect((await call(env, m, route, m === 'GET' ? undefined : {}, { auth: deny })).status).toBe(401)
    }
  })
  it('default menolak bila header JWT tidak ada atau Access belum dikonfigurasi', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    const res = await handleAdmin(new Request(`${ORIGIN}/admin-api/state`), env)
    expect(res.status).toBe(401)
    const res2 = await handleAdmin(new Request(`${ORIGIN}/admin-api/state`, { headers: { 'Cf-Access-Jwt-Assertion': 'a.b.c' } }), env)
    expect(res2.status).toBe(503)
  })
  it('menolak permintaan tulis dari origin lain dan Content-Type bukan JSON', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    expect((await call(env, 'PUT', 'draft', { data: defaults(), baseRev: null }, { origin: 'https://jahat.example' })).status).toBe(403)
    expect((await call(env, 'PUT', 'draft', { data: defaults(), baseRev: null }, { type: 'text/plain' })).status).toBe(415)
  })
  it('respons admin tidak boleh di-cache', async () => {
    const res = await call({ AMANDANA_KV: fakeKv() }, 'GET', 'state')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
  it('rute tak dikenal 404; KV belum dipasang 503', async () => {
    expect((await call({ AMANDANA_KV: fakeKv() }, 'GET', 'tidak-ada')).status).toBe(404)
    expect((await call({}, 'GET', 'state')).status).toBe(503)
  })
})

describe('/admin-api: draf', () => {
  it('state kosong lalu simpan draf menaikkan rev dan mencatat penyimpan', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    expect(await jsonOf(await call(env, 'GET', 'state'))).toMatchObject({ draft: null, published: null, history: [], hasUnpublished: false, email: 'admin@contoh.id' })
    const { r, body } = await saveDraft(env)
    expect(r.status).toBe(200)
    expect(body).toMatchObject({ rev: 1, updatedBy: 'admin@contoh.id' })
    const st = await jsonOf(await call(env, 'GET', 'state'))
    expect(st.draft.rev).toBe(1)
    expect(st.hasUnpublished).toBe(true)
  })
  it('menolak simpan dari rev lama (dua admin) dan mengembalikan draf terbaru', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    await saveDraft(env)
    const stale = await saveDraft(env, defaults(), null)
    expect(stale.r.status).toBe(409)
    expect(stale.body.draft.rev).toBe(1)
    const ok = await saveDraft(env, defaults(), 1)
    expect(ok.body.rev).toBe(2)
  })
  it('menolak paket yang bentuknya rusak', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    expect((await call(env, 'PUT', 'draft', { data: { v: 2 }, baseRev: null })).status).toBe(400)
    expect((await call(env, 'PUT', 'draft', { baseRev: null })).status).toBe(400)
  })
  it('draf yang aturannya belum valid tetap boleh disimpan (belum terbit)', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    const d = defaults()
    d.rules.rules[0].weight = 500
    expect((await saveDraft(env, d)).r.status).toBe(200)
  })
})

describe('/admin-api: terbit dan rollback', () => {
  it('menerbitkan draf: versi naik, /api/rules menyajikannya, hasUnpublished false', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    const d = defaults()
    d.rules.rules.find((r) => r.id === 'pin-tenor-pendek')!.weight = 17
    await saveDraft(env, d)
    const res = await call(env, 'POST', 'publish', { rev: 1, note: 'naikkan tenor', acknowledge: true })
    expect(res.status).toBe(200)
    expect((await jsonOf(res)).published).toMatchObject({ version: 1, publishedBy: 'admin@contoh.id', note: 'naikkan tenor' })
    const pub = await jsonOf(await handlePublicRules(new Request(`${ORIGIN}/api/rules`), env))
    expect(pub.version).toBe(1)
    expect(pub.rules.rules.find((r: { id: string; weight: number }) => r.id === 'pin-tenor-pendek').weight).toBe(17)
    expect((await jsonOf(await call(env, 'GET', 'state'))).hasUnpublished).toBe(false)
  })
  it('menolak terbit bila rev tidak cocok atau belum ada draf', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    expect((await call(env, 'POST', 'publish', { rev: 1 })).status).toBe(409)
    await saveDraft(env)
    expect((await call(env, 'POST', 'publish', { rev: 99, acknowledge: true })).status).toBe(409)
  })
  it('menolak terbit aturan tidak valid (422) dan tidak mengubah aturan yang terbit', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    const d = defaults()
    d.rules.rules[0].weight = 500
    d.rules.rules[1].patterns.push({ re: '(rusak', inner: true })
    await saveDraft(env, d)
    const res = await call(env, 'POST', 'publish', { rev: 1, acknowledge: true })
    expect(res.status).toBe(422)
    expect((await jsonOf(res)).issues.join('|')).toContain('bobot')
    expect((env.AMANDANA_KV as ReturnType<typeof fakeKv>).data.has('rules:published')).toBe(false)
  })
  it('menolak aturan dengan kuantifier bersarang (tanpa menjalankannya)', () => {
    const d = defaults()
    d.rules.rules[0].patterns.push({ re: '(a+)+$', inner: true, raw: true })
    expect(blockingIssues(d.rules).join('|')).toContain('backtracking')
  })
  it('gate holdout: gagal tanpa acknowledge (409 + metrik), lolos bila diakui', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    const d = defaults()
    for (const r of d.rules.rules) r.enabled = false // tidak ada yang terdeteksi: recall 0
    await saveDraft(env, d)
    const blocked = await call(env, 'POST', 'publish', { rev: 1 })
    expect(blocked.status).toBe(409)
    expect((await jsonOf(blocked)).gate).toMatchObject({ status: 'gagal' })
    expect((await call(env, 'POST', 'publish', { rev: 1, acknowledge: true })).status).toBe(200)
  })
  it('runGate: aturan bawaan lulus pada data uji bawaan; tanpa holdout dilewati', () => {
    expect(runGate(defaults()).status).toBe('lulus')
    const d = defaults()
    d.samples = d.samples.filter((s) => s.split !== 'holdout')
    expect(runGate(d).status).toBe('dilewati')
    expect(dataset.length).toBeGreaterThan(0)
  })
  it('rollback membuat versi baru dari riwayat, bukan menimpa versi lama', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    await saveDraft(env)
    await call(env, 'POST', 'publish', { rev: 1, acknowledge: true })
    const d = defaults()
    d.rules.rules.find((r) => r.id === 'pin-tenor-pendek')!.weight = 40
    await saveDraft(env, d, 1)
    await call(env, 'POST', 'publish', { rev: 2, acknowledge: true })
    const res = await call(env, 'POST', 'rollback', { version: 1, note: 'salah bobot' })
    expect(res.status).toBe(200)
    expect((await jsonOf(res)).published).toMatchObject({ version: 3, note: 'Rollback ke v1: salah bobot' })
    const pub = await jsonOf(await handlePublicRules(new Request(`${ORIGIN}/api/rules`), env))
    expect(pub.rules.rules.find((r: { id: string; weight: number }) => r.id === 'pin-tenor-pendek').weight).toBe(DEFAULT_RULES.rules.find((r) => r.id === 'pin-tenor-pendek')!.weight)
    const st = await jsonOf(await call(env, 'GET', 'state'))
    expect(st.history.map((h: { version: number }) => h.version)).toEqual([3, 2, 1])
    expect((await call(env, 'POST', 'rollback', { version: 99 })).status).toBe(404)
  })
  it('riwayat dibatasi 20 versi', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    await saveDraft(env)
    for (let i = 0; i < 23; i++) await call(env, 'POST', 'publish', { rev: 1, acknowledge: true })
    const st = await jsonOf(await call(env, 'GET', 'state'))
    expect(st.history).toHaveLength(20)
    expect(st.history[0].version).toBe(23)
  })
  it('draf yang tersimpan di KV tetap utuh (bukan terbit otomatis)', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    await saveDraft(env)
    const raw = JSON.parse((env.AMANDANA_KV as ReturnType<typeof fakeKv>).data.get('admin:draft')!) as Draft
    expect(raw.data.samples.length).toBe(dataset.length)
    expect((env.AMANDANA_KV as ReturnType<typeof fakeKv>).data.has('rules:published')).toBe(false)
  })
})
