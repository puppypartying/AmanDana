import { handleAdmin } from '../../src/server/handlers'
import type { Env } from '../../src/server/types'

// /admin-api/*: simpan draf, terbitkan, rollback. Wajib di balik Cloudflare Access; token diverifikasi ulang di handler.
export const onRequest = ({ request, env }: { request: Request; env: Env }) => handleAdmin(request, env)
