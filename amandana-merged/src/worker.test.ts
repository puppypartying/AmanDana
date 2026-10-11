import { describe, expect, it } from 'vitest'
import worker from './worker'
import type { Env, KV } from './server/types'

const kv = (): KV => ({ get: async () => null, put: async () => {} })
const assets = { fetch: async (r: Request) => new Response(`asset:${new URL(r.url).pathname}`) }
const run = (path: string, env: Env, init?: RequestInit) => worker.fetch(new Request(`https://x.test${path}`, init), env)

describe('worker', () => {
  it('/api/rules dilayani handler publik (204 bila belum ada yang terbit)', async () => {
    expect((await run('/api/rules', { AMANDANA_KV: kv(), ASSETS: assets })).status).toBe(204)
  })
  it('/admin-api/* wajib sesi Access: tanpa token 401, bukan data dan bukan aset', async () => {
    const res = await run('/admin-api/state', { AMANDANA_KV: kv(), ASSETS: assets })
    expect(res.status).toBe(401)
    expect((await run('/admin-api', { AMANDANA_KV: kv(), ASSETS: assets })).status).toBe(401)
  })
  it('jalur lain diteruskan ke static assets; tanpa ASSETS 404', async () => {
    expect(await (await run('/hasil', { ASSETS: assets })).text()).toBe('asset:/hasil')
    expect((await run('/hasil', {})).status).toBe(404)
  })
  it('"/admin-apiku" bukan jalur API', async () => {
    expect(await (await run('/admin-apiku', { ASSETS: assets })).text()).toBe('asset:/admin-apiku')
  })
})
