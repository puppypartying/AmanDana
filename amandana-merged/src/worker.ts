import { handleAdmin, handlePublicRules } from './server/handlers'
import type { Env } from './server/types'

/**
 * Entry Cloudflare Worker (static assets + API). Hanya /api/rules dan /admin-api/* yang masuk ke sini
 * (wrangler.jsonc: assets.run_worker_first); sisanya dilayani langsung oleh static assets, termasuk SPA fallback dan public/_headers.
 * Cabang terakhir hanya jaring pengaman bila konfigurasi diubah dan request lain ikut sampai ke sini.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/rules') return handlePublicRules(request, env)
    if (pathname === '/admin-api' || pathname.startsWith('/admin-api/')) return handleAdmin(request, env)
    if (env.ASSETS) return env.ASSETS.fetch(request)
    return new Response('Not found', { status: 404 })
  },
}
