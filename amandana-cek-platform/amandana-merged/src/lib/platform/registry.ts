import raw from './platforms.json'
import type { Platform } from './types'

/** Daftar referensi bawaan. Isinya diganti lewat admin (Ekspor -> platforms.json), harus dari OJK/Satgas PASTI. */
export const DEFAULT_PLATFORMS = raw as unknown as Platform[]
