import type { Env } from './types'

/**
 * Verifikasi JWT Cloudflare Access (header `Cf-Access-Jwt-Assertion`) di sisi server, sebagai lapis kedua.
 * Tanpa ini, endpoint tulis hanya aman selama path-nya benar-benar tertutup oleh aplikasi Access.
 * Gagal tertutup: konfigurasi kosong atau token tidak valid berarti ditolak.
 */
export class AuthError extends Error {
  constructor(public status: 401 | 403 | 503, message: string) {
    super(message)
  }
}

type Jwk = JsonWebKey & { kid?: string }
type Deps = { fetchKeys?: (teamDomain: string) => Promise<Jwk[]>; now?: () => number }

const KEY_TTL_MS = 10 * 60 * 1000
let keyCache: { team: string; at: number; keys: Jwk[] } | null = null

export const resetKeyCache = () => { keyCache = null }

async function defaultFetchKeys(teamDomain: string): Promise<Jwk[]> {
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`)
  if (!res.ok) throw new AuthError(503, 'Tidak bisa mengambil kunci Access.')
  const body = (await res.json()) as { keys?: Jwk[] }
  return body.keys ?? []
}

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
const decodeJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s))) as Record<string, unknown>

export const normalizeTeamDomain = (raw: string) => raw.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')

export async function verifyAccessJwt(token: string, env: Env, deps: Deps = {}): Promise<{ email: string }> {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) throw new AuthError(503, 'Cloudflare Access belum dikonfigurasi (ACCESS_TEAM_DOMAIN dan ACCESS_AUD).')
  const team = normalizeTeamDomain(env.ACCESS_TEAM_DOMAIN)
  const now = (deps.now ?? Date.now)()
  const parts = token.split('.')
  if (parts.length !== 3) throw new AuthError(401, 'Token Access tidak valid.')
  let header: Record<string, unknown>
  let claims: Record<string, unknown>
  try {
    header = decodeJson(parts[0])
    claims = decodeJson(parts[1])
  } catch {
    throw new AuthError(401, 'Token Access tidak valid.')
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new AuthError(401, 'Token Access tidak valid.')

  if (!keyCache || keyCache.team !== team || now - keyCache.at > KEY_TTL_MS || !keyCache.keys.some((k) => k.kid === header.kid)) {
    keyCache = { team, at: now, keys: await (deps.fetchKeys ?? defaultFetchKeys)(team) }
  }
  const jwk = keyCache.keys.find((k) => k.kid === header.kid)
  if (!jwk) throw new AuthError(401, 'Kunci token tidak dikenal.')

  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`))
  if (!ok) throw new AuthError(401, 'Tanda tangan token tidak cocok.')

  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (!aud.includes(env.ACCESS_AUD)) throw new AuthError(403, 'Token bukan untuk aplikasi ini.')
  if (claims.iss !== `https://${team}`) throw new AuthError(403, 'Penerbit token tidak cocok.')
  if (typeof claims.exp !== 'number' || claims.exp * 1000 <= now) throw new AuthError(401, 'Token kedaluwarsa.')
  if (typeof claims.nbf === 'number' && claims.nbf * 1000 > now) throw new AuthError(401, 'Token belum berlaku.')
  const email = typeof claims.email === 'string' ? claims.email : typeof claims.common_name === 'string' ? claims.common_name : ''
  if (!email) throw new AuthError(403, 'Token tanpa identitas.')
  return { email }
}
