import raw from './platforms.json'
import type { Platform } from './types'

/** Daftar referensi bawaan build. Server (aturan terbit) hanya boleh menggantinya lewat setActivePlatforms. */
export const DEFAULT_PLATFORMS = raw as unknown as Platform[]

let active: Platform[] = DEFAULT_PLATFORMS
export const getActivePlatforms = () => active
/** Ganti daftar yang dipakai scan (daftar terbit dari server). `null` = kembali ke bawaan build. */
export function setActivePlatforms(list: Platform[] | null) {
  active = list ?? DEFAULT_PLATFORMS
}
