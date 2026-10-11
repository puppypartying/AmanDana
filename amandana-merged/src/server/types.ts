import type { Platform } from '@/lib/platform/types'
import type { RulesData } from '@/lib/risk/engine'
import type { AdminData } from '@/admin/store'

/** Bagian minimal dari Workers KV yang dipakai server (nilai disimpan sebagai string JSON). */
export type KV = {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

export type Env = {
  /** Binding KV: Pages → Settings → Functions → KV namespace bindings. */
  AMANDANA_KV?: KV
  /** Binding static assets (hanya di Workers; tidak ada di Pages Functions). */
  ASSETS?: { fetch(request: Request): Promise<Response> }
  /** Contoh: "tim-anda.cloudflareaccess.com". */
  ACCESS_TEAM_DOMAIN?: string
  /** Application Audience (AUD) tag dari aplikasi Access yang melindungi /admin dan /admin-api. */
  ACCESS_AUD?: string
}

/** Satu versi aturan yang terbit. `publishedBy` (email admin) tidak pernah dikirim ke endpoint publik. */
export type Published = { version: number; publishedAt: string; publishedBy: string; note: string; rules: RulesData; /** Daftar platform ikut terbit bersama aturan. Tidak ada (versi lama) = pakai bawaan build. */ platforms?: Platform[] }

/** Draf bersama semua admin. `rev` naik tiap simpan; dipakai untuk mendeteksi dua admin saling menimpa. */
export type Draft = { rev: number; updatedAt: string; updatedBy: string; data: AdminData }

export const KEYS = { published: 'rules:published', draft: 'admin:draft', history: 'rules:history' } as const
export const HISTORY_LIMIT = 20
