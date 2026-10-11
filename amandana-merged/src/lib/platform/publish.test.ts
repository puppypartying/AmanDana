import { beforeEach, describe, expect, it } from 'vitest'
import { defaults } from '@/admin/store'
import { createAnalysis } from '@/lib/risk/analysis'
import { DEFAULT_RULES, setActiveRules } from '@/lib/risk/engine'
import { applyCachedRules, refreshRules, RULES_CACHE_KEY } from '@/lib/risk/remote'
import { handleAdmin, handlePublicRules } from '@/server/handlers'
import type { Env, KV, Published } from '@/server/types'
import { isUsablePlatforms, platformIssues } from './import'
import { checkPlatform } from './match'
import { getActivePlatforms, setActivePlatforms } from './registry'
import type { Platform } from './types'

// Data FIKTIF khusus tes.
const P: Platform[] = [{ id: '1', value: 'Kredit Fiktif', type: 'nama', status: 'red-flag', note: 'tes', sourceDate: '2026-09-01' }]
const ORIGIN = 'https://amandana.test'
const fakeKv = (): KV => { const m = new Map<string, string>(); return { get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v) } }
const admin = (env: Env, method: string, route: string, body?: unknown) =>
  handleAdmin(new Request(`${ORIGIN}/admin-api/${route}`, { method, headers: { Origin: ORIGIN, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) }), env, { authenticate: async () => ({ email: 'a@b.id' }), now: () => new Date('2026-10-12T00:00:00Z') })
const store = () => { const m = new Map<string, string>(); return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } }
const reply = (body: unknown) => (async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch
const pub = (platforms?: unknown, version = 1) => ({ version, publishedAt: 'x', rules: DEFAULT_RULES, ...(platforms === undefined ? {} : { platforms }) })

beforeEach(() => { setActiveRules(null); setActivePlatforms(null) })

describe('validasi daftar terbit', () => {
  it('isUsablePlatforms menolak bentuk rusak, platformIssues memisahkan error dan peringatan', () => {
    expect(isUsablePlatforms(P)).toBe(true)
    for (const bad of [null, {}, [null], [{ id: 1 }], [{ ...P[0], status: 'x' }], [{ ...P[0], domains: [1] }]]) expect(isUsablePlatforms(bad)).toBe(false)
    const r = platformIssues([{ id: 'a', value: 'PT A', type: 'nama', status: 'resmi', note: '' }, ...P, { ...P[0], id: '2' }])
    expect(r.warnings.join()).toMatch(/domain resmi kosong/)
    expect(r.errors.join()).toMatch(/entri ganda/)
  })
})

describe('server: daftar platform ikut terbit', () => {
  it('terbit membawa platforms ke /api/rules, hasUnpublished memperhitungkannya, rollback membawanya', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    const d = defaults(); d.platforms = P
    await admin(env, 'PUT', 'draft', { data: d, baseRev: null })
    expect((await admin(env, 'POST', 'publish', { rev: 1, acknowledge: true })).status).toBe(200)
    const out = await (await handlePublicRules(new Request(`${ORIGIN}/api/rules`), env)).json() as { platforms: Platform[] }
    expect(out.platforms).toEqual(P)
    expect((await (await admin(env, 'GET', 'state')).json() as { hasUnpublished: boolean }).hasUnpublished).toBe(false)
    d.platforms = [...P, { id: '2', value: 'Pinjam Palsu', type: 'nama', status: 'red-flag', note: '' }]
    await admin(env, 'PUT', 'draft', { data: d, baseRev: 1 })
    expect((await (await admin(env, 'GET', 'state')).json() as { hasUnpublished: boolean }).hasUnpublished).toBe(true)
    await admin(env, 'POST', 'publish', { rev: 2, acknowledge: true })
    await admin(env, 'POST', 'rollback', { version: 1 })
    const back = await (await handlePublicRules(new Request(`${ORIGIN}/api/rules`), env)).json() as { platforms: Platform[] }
    expect(back.platforms).toEqual(P)
  })
  it('menolak terbit bila daftar punya error (ganda), tetapi peringatan tidak memblokir', async () => {
    const env: Env = { AMANDANA_KV: fakeKv() }
    const d = defaults(); d.platforms = [...P, { ...P[0], id: '2' }]
    await admin(env, 'PUT', 'draft', { data: d, baseRev: null })
    const res = await admin(env, 'POST', 'publish', { rev: 1, acknowledge: true })
    expect(res.status).toBe(422)
    expect(((await res.json()) as { issues: string[] }).issues.join()).toMatch(/ganda/)
    d.platforms = [{ id: 'a', value: 'PT A', type: 'nama', status: 'resmi', note: '' }]
    await admin(env, 'PUT', 'draft', { data: d, baseRev: 1 })
    expect((await admin(env, 'POST', 'publish', { rev: 2, acknowledge: true })).status).toBe(200)
  })
  it('versi lama tanpa platforms tidak menambah field platforms', async () => {
    const p: Published = { version: 1, publishedAt: 'x', publishedBy: 'z', note: '', rules: DEFAULT_RULES }
    const kv = fakeKv(); await kv.put('rules:published', JSON.stringify(p))
    expect('platforms' in await (await handlePublicRules(new Request(`${ORIGIN}/api/rules`), { AMANDANA_KV: kv })).json()).toBe(false)
  })
})

describe('klien: daftar terbit dipakai scan', () => {
  it('refresh menerapkan dan men-cache daftar; cache dipulihkan saat offline', async () => {
    const s = store()
    expect((await refreshRules({ fetchFn: reply(pub(P)), store: s })).status).toBe('updated')
    expect(getActivePlatforms()).toEqual(P)
    expect(checkPlatform('aplikasi Kredit Fiktif').status).toBe('red-flag')
    expect(createAnalysis('Pinjol', 'aplikasi Kredit Fiktif', 1).score).toBeGreaterThanOrEqual(85)
    setActivePlatforms(null); setActiveRules(null)
    expect(applyCachedRules(s)).toBe(1)
    expect(getActivePlatforms()).toEqual(P)
  })
  it('daftar rusak: seluruh respons ditolak, tidak masuk cache, daftar aktif tetap', async () => {
    const s = store()
    expect((await refreshRules({ fetchFn: reply(pub([{ id: 1 }])), store: s })).status).toBe('invalid')
    expect(s.m.has(RULES_CACHE_KEY)).toBe(false)
    expect(getActivePlatforms()).toEqual([])
  })
  it('terbit tanpa platforms = kembali ke bawaan build; daftar kosong eksplisit = kosong', async () => {
    const s = store()
    await refreshRules({ fetchFn: reply(pub(P, 1)), store: s })
    await refreshRules({ fetchFn: reply(pub(undefined, 2)), store: s })
    expect(getActivePlatforms()).toEqual([])
    await refreshRules({ fetchFn: reply(pub(P, 3)), store: s })
    await refreshRules({ fetchFn: reply(pub([], 4)), store: s })
    expect(getActivePlatforms()).toEqual([])
  })
})
