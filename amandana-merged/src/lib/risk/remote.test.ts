import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_RULES, scoreOffer, setActiveRules, type RulesData } from './engine'
import { applyCachedRules, isUsableRules, refreshRules, RULES_CACHE_KEY } from './remote'

const fakeStore = () => {
  const m = new Map<string, string>()
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}
const reply = (body: unknown, status = 200) => (async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })) as unknown as typeof fetch
const clone = () => structuredClone(DEFAULT_RULES)
const TENOR = 'Pinjaman tenor 7 hari.'
const withWeight = (w: number, version = 2) => {
  const r = clone()
  r.rules.find((x) => x.id === 'pin-tenor-pendek')!.weight = w
  return { version, publishedAt: '2026-10-12T00:00:00Z', rules: r }
}

beforeEach(() => setActiveRules(null))

describe('isUsableRules', () => {
  it('menerima aturan bawaan dan menolak sampah tanpa melempar error', () => {
    expect(isUsableRules(DEFAULT_RULES)).toBe(true)
    for (const bad of [null, 1, 'x', [], {}, { rules: 'x' }, { ...clone(), thresholds: null }, { ...clone(), rules: [null] }, { ...clone(), warningMarkers: [1] }]) {
      expect(isUsableRules(bad)).toBe(false)
    }
  })
  it('menolak aturan yang gagal validasi: bobot di luar 0-100, regex rusak, kuantifier bersarang', () => {
    const a = clone(); a.rules[0].weight = 500
    const b = clone(); b.rules[0].patterns.push({ re: '(rusak', inner: true })
    const c = clone(); c.rules[0].patterns.push({ re: '(a+)+$', inner: true, raw: true })
    expect([a, b, c].map(isUsableRules)).toEqual([false, false, false])
  })
  it('menolak aturan lama tanpa field engine v3', () => {
    const old = clone() as Partial<RulesData>
    delete old.severityFloors
    expect(isUsableRules(old)).toBe(false)
  })
})

describe('refreshRules', () => {
  it('menerapkan aturan terbit yang valid dan menyimpannya ke cache', async () => {
    const store = fakeStore()
    const base = scoreOffer(TENOR, 'Pinjol').score
    const res = await refreshRules({ fetchFn: reply(withWeight(40)), store })
    expect(res).toEqual({ status: 'updated', version: 2 })
    expect(scoreOffer(TENOR, 'Pinjol').score).not.toBe(base)
    expect(JSON.parse(store.m.get(RULES_CACHE_KEY)!).version).toBe(2)
  })
  it('versi yang sama dengan cache: unchanged, aturan tetap aktif', async () => {
    const store = fakeStore()
    await refreshRules({ fetchFn: reply(withWeight(40)), store })
    setActiveRules(null)
    expect((await refreshRules({ fetchFn: reply(withWeight(40)), store })).status).toBe('unchanged')
    expect(scoreOffer(TENOR, 'Pinjol').score).toBeGreaterThan(0)
  })
  it.each([
    ['server error', reply({}, 500)],
    ['belum ada aturan terbit (204)', (async () => new Response(null, { status: 204 })) as unknown as typeof fetch],
    ['404', reply({ error: 'x' }, 404)],
    ['bukan JSON', reply('<html>')],
  ])('%s: tidak mengubah aturan yang aktif', async (_n, fetchFn) => {
    const before = scoreOffer(TENOR, 'Pinjol').score
    const res = await refreshRules({ fetchFn, store: fakeStore() })
    expect(['unavailable']).toContain(res.status)
    expect(scoreOffer(TENOR, 'Pinjol').score).toBe(before)
  })
  it('jaringan putus dan timeout: unavailable, aturan tetap', async () => {
    const before = scoreOffer(TENOR, 'Pinjol').score
    expect((await refreshRules({ fetchFn: (async () => { throw new TypeError('offline') }) as unknown as typeof fetch, store: fakeStore() })).status).toBe('unavailable')
    const hang = ((_u: unknown, init?: RequestInit) => new Promise((_r, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('abort'))))) as unknown as typeof fetch
    expect((await refreshRules({ fetchFn: hang, store: fakeStore(), timeoutMs: 20 })).status).toBe('unavailable')
    expect(scoreOffer(TENOR, 'Pinjol').score).toBe(before)
  })
  it('aturan terbit yang tidak valid ditolak dan tidak masuk cache', async () => {
    const store = fakeStore()
    const bad = withWeight(40)
    bad.rules.rules[0].patterns.push({ re: '(rusak', inner: true })
    const before = scoreOffer(TENOR, 'Pinjol').score
    expect((await refreshRules({ fetchFn: reply(bad), store })).status).toBe('invalid')
    expect(store.m.has(RULES_CACHE_KEY)).toBe(false)
    expect(scoreOffer(TENOR, 'Pinjol').score).toBe(before)
  })
  it('respons terlalu besar ditolak', async () => {
    expect((await refreshRules({ fetchFn: reply(' '.repeat(2 * 1024 * 1024 + 10)), store: fakeStore() })).status).toBe('invalid')
  })
  it('penyimpanan yang melempar error tidak menggagalkan penerapan', async () => {
    const store = { getItem: () => null, setItem: () => { throw new Error('penuh') } }
    expect((await refreshRules({ fetchFn: reply(withWeight(40)), store })).status).toBe('updated')
  })
})

describe('applyCachedRules', () => {
  it('memakai cache valid secara sinkron', () => {
    const store = fakeStore()
    store.setItem(RULES_CACHE_KEY, JSON.stringify(withWeight(40, 7)))
    const before = scoreOffer(TENOR, 'Pinjol').score
    expect(applyCachedRules(store)).toBe(7)
    expect(scoreOffer(TENOR, 'Pinjol').score).not.toBe(before)
  })
  it('mengabaikan cache rusak atau tidak valid', () => {
    const store = fakeStore()
    store.setItem(RULES_CACHE_KEY, '{rusak')
    expect(applyCachedRules(store)).toBeNull()
    const bad = withWeight(40, 3)
    bad.rules.rules[0].weight = 999
    store.setItem(RULES_CACHE_KEY, JSON.stringify(bad))
    expect(applyCachedRules(store)).toBeNull()
    expect(applyCachedRules(null)).toBeNull()
  })
})
