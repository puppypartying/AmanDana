// Cache buatan service worker manual lama. Workbox hanya mengelola cache miliknya sendiri
// ("workbox-precache-..."), jadi cache lama ini harus dibersihkan terpisah.
const LEGACY_CACHE_PREFIXES = ["amandana-", "siagadana-"]

type CacheStorageLike = Pick<CacheStorage, "keys" | "delete">

/** Hapus cache service worker lama. Aman dipanggil berulang; tidak pernah melempar error. */
export async function cleanupLegacyCaches(storage: CacheStorageLike | undefined): Promise<string[]> {
  if (!storage) return []
  try {
    const stale = (await storage.keys()).filter((key) =>
      LEGACY_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)),
    )
    await Promise.all(stale.map((key) => storage.delete(key)))
    return stale
  } catch {
    return []
  }
}

/** Interval pengecekan versi baru untuk sesi yang dibiarkan terbuka lama (mis. PWA terpasang). */
export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000
