import { describe, expect, it } from "vitest"
import { cleanupLegacyCaches } from "./pwa"

function fakeStorage(initial: string[]) {
  const keys = new Set(initial)
  return {
    keys: async () => [...keys],
    delete: async (key: string) => keys.delete(key),
    remaining: () => [...keys],
  }
}

describe("cleanupLegacyCaches", () => {
  it("menghapus cache amandana-* dan siagadana-*, membiarkan cache Workbox dan lainnya", async () => {
    const storage = fakeStorage(["amandana-v1", "siagadana-v3", "workbox-precache-v2-https://x/", "lain"])
    const removed = await cleanupLegacyCaches(storage)
    expect(removed.sort()).toEqual(["amandana-v1", "siagadana-v3"])
    expect(storage.remaining().sort()).toEqual(["lain", "workbox-precache-v2-https://x/"])
  })

  it("aman kalau CacheStorage tidak tersedia", async () => {
    expect(await cleanupLegacyCaches(undefined)).toEqual([])
  })

  it("tidak melempar error kalau CacheStorage gagal", async () => {
    const broken = {
      keys: async () => {
        throw new Error("denied")
      },
      delete: async () => false,
    }
    expect(await cleanupLegacyCaches(broken)).toEqual([])
  })
})
