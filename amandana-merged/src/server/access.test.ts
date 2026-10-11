import { beforeEach, describe, expect, it } from 'vitest'
import { AuthError, normalizeTeamDomain, resetKeyCache, verifyAccessJwt } from './access'
import { stableStringify } from './stable'

const TEAM = 'tim.cloudflareaccess.com'
const AUD = 'aud-123'
const b64 = (b: ArrayBuffer | string) => {
  const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : new Uint8Array(b)
  let s = ''
  for (const x of bytes) s += String.fromCharCode(x)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function makeKey() {
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
  const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'k1' }
  return { pair, jwk }
}
async function sign(pair: CryptoKeyPair, claims: Record<string, unknown>, header: Record<string, unknown> = { alg: 'RS256', kid: 'k1' }) {
  const head = b64(JSON.stringify(header))
  const body = b64(JSON.stringify(claims))
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(`${head}.${body}`))
  return `${head}.${body}.${b64(sig)}`
}

const NOW = 1_800_000_000_000
const good = { aud: [AUD], iss: `https://${TEAM}`, exp: NOW / 1000 + 600, email: 'admin@contoh.id' }
const env = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD }

describe('verifyAccessJwt', () => {
  beforeEach(() => resetKeyCache())

  it('menerima token yang benar dan mengembalikan email', async () => {
    const { pair, jwk } = await makeKey()
    const token = await sign(pair, good)
    await expect(verifyAccessJwt(token, env, { fetchKeys: async () => [jwk], now: () => NOW })).resolves.toEqual({ email: 'admin@contoh.id' })
  })
  it('menerima team domain dengan https:// dan garis miring akhir', () => {
    expect(normalizeTeamDomain(' https://tim.cloudflareaccess.com/ ')).toBe(TEAM)
  })
  it('gagal tertutup bila konfigurasi kosong', async () => {
    await expect(verifyAccessJwt('a.b.c', {}, {})).rejects.toMatchObject({ status: 503 })
    await expect(verifyAccessJwt('a.b.c', { ACCESS_TEAM_DOMAIN: TEAM }, {})).rejects.toBeInstanceOf(AuthError)
  })
  it('menolak tanda tangan dari kunci lain', async () => {
    const real = await makeKey()
    const attacker = await makeKey()
    const token = await sign(attacker.pair, good)
    await expect(verifyAccessJwt(token, env, { fetchKeys: async () => [real.jwk], now: () => NOW })).rejects.toMatchObject({ status: 401 })
  })
  it('menolak payload yang diubah setelah ditandatangani', async () => {
    const { pair, jwk } = await makeKey()
    const [h, , s] = (await sign(pair, good)).split('.')
    const forged = `${h}.${b64(JSON.stringify({ ...good, email: 'penyusup@jahat.id' }))}.${s}`
    await expect(verifyAccessJwt(forged, env, { fetchKeys: async () => [jwk], now: () => NOW })).rejects.toMatchObject({ status: 401 })
  })
  it('menolak aud salah, iss salah, kedaluwarsa, belum berlaku, tanpa email', async () => {
    const { pair, jwk } = await makeKey()
    const deps = { fetchKeys: async () => [jwk], now: () => NOW }
    await expect(verifyAccessJwt(await sign(pair, { ...good, aud: ['lain'] }), env, deps)).rejects.toMatchObject({ status: 403 })
    await expect(verifyAccessJwt(await sign(pair, { ...good, iss: 'https://lain.cloudflareaccess.com' }), env, deps)).rejects.toMatchObject({ status: 403 })
    await expect(verifyAccessJwt(await sign(pair, { ...good, exp: NOW / 1000 - 1 }), env, deps)).rejects.toMatchObject({ status: 401 })
    await expect(verifyAccessJwt(await sign(pair, { ...good, nbf: NOW / 1000 + 100 }), env, deps)).rejects.toMatchObject({ status: 401 })
    await expect(verifyAccessJwt(await sign(pair, { ...good, email: undefined }), env, deps)).rejects.toMatchObject({ status: 403 })
  })
  it('menolak alg selain RS256 (mis. none) dan token yang bukan JWT', async () => {
    const { pair, jwk } = await makeKey()
    const deps = { fetchKeys: async () => [jwk], now: () => NOW }
    await expect(verifyAccessJwt(await sign(pair, good, { alg: 'none', kid: 'k1' }), env, deps)).rejects.toMatchObject({ status: 401 })
    await expect(verifyAccessJwt('bukan-jwt', env, deps)).rejects.toMatchObject({ status: 401 })
    await expect(verifyAccessJwt('@@@.@@@.@@@', env, deps)).rejects.toMatchObject({ status: 401 })
  })
  it('kid tak dikenal ditolak; kunci di-cache antar panggilan', async () => {
    const { pair, jwk } = await makeKey()
    let fetched = 0
    const deps = { fetchKeys: async () => { fetched++; return [jwk] }, now: () => NOW }
    await verifyAccessJwt(await sign(pair, good), env, deps)
    await verifyAccessJwt(await sign(pair, good), env, deps)
    expect(fetched).toBe(1)
    await expect(verifyAccessJwt(await sign(pair, good, { alg: 'RS256', kid: 'asing' }), env, deps)).rejects.toMatchObject({ status: 401 })
  })
})

describe('stableStringify', () => {
  it('urutan kunci tidak memengaruhi hasil', () => {
    expect(stableStringify({ a: 1, b: { c: [1, 2], d: 2 } })).toBe(stableStringify({ b: { d: 2, c: [1, 2] }, a: 1 }))
    expect(stableStringify({ a: 1, b: undefined })).toBe(stableStringify({ a: 1 }))
  })
})
