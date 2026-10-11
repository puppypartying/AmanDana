import { describe, expect, it } from 'vitest'
import { adminApi } from './api'
import { defaults } from './store'

const resp = (body: string, init: ResponseInit = {}) => (async () => new Response(body, init)) as unknown as typeof fetch

describe('adminApi', () => {
  it('state: mengembalikan data bila respons JSON 200', async () => {
    const r = await adminApi.state(resp(JSON.stringify({ email: 'a@b.c', draft: null, published: null, history: [], hasUnpublished: false })))
    expect(r).toMatchObject({ ok: true, data: { email: 'a@b.c' } })
  })
  it('respons bukan JSON (mis. SPA fallback tanpa Functions) = API tidak tersedia', async () => {
    const r = await adminApi.state(resp('<!doctype html>', { status: 200 }))
    expect(r).toMatchObject({ ok: false, status: 200 })
    expect((r as { error: string }).error).toContain('tidak tersedia')
  })
  it('401/409 membawa pesan dan isi dari server', async () => {
    const r = await adminApi.saveDraft(defaults(), 1, resp(JSON.stringify({ error: 'Draf sudah diubah admin lain.', draft: { rev: 5 } }), { status: 409 }))
    expect(r).toMatchObject({ ok: false, status: 409, error: 'Draf sudah diubah admin lain.', body: { draft: { rev: 5 } } })
  })
  it('redirect (sesi Access berakhir) dilaporkan sebagai sesi berakhir, tidak diikuti', async () => {
    const r = await adminApi.state((async () => ({ type: 'opaqueredirect', status: 0, ok: false, text: async () => '' })) as unknown as typeof fetch)
    expect(r).toMatchObject({ ok: false, status: 401 })
    expect((r as { error: string }).error).toContain('Sesi login berakhir')
  })
  it('jaringan putus = status 0', async () => {
    const r = await adminApi.publish(1, '', false, (async () => { throw new TypeError('x') }) as unknown as typeof fetch)
    expect(r).toMatchObject({ ok: false, status: 0 })
  })
  it('mengirim body JSON dan credentials same-origin', async () => {
    let seen: { url: string; init: RequestInit } | null = null
    await adminApi.rollback(3, 'salah', (async (url: string, init: RequestInit) => { seen = { url, init }; return new Response('{}') }) as unknown as typeof fetch)
    expect(seen!.url).toMatch(/admin-api\/rollback$/)
    expect(seen!.init).toMatchObject({ method: 'POST', credentials: 'same-origin', redirect: 'manual' })
    expect(JSON.parse(seen!.init.body as string)).toEqual({ version: 3, note: 'salah' })
  })
})
