import { handlePublicRules } from '../../src/server/handlers'
import type { Env } from '../../src/server/types'

// GET /api/rules: aturan yang sedang terbit (publik). Lihat docs/admin.md.
export const onRequest = ({ request, env }: { request: Request; env: Env }) => handlePublicRules(request, env)
