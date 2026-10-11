import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const root = (path: string) => new URL(`../../${path}`, import.meta.url)
const headersText = readFileSync(root("public/_headers"), "utf8")

/** Ambil header dari blok "/*" di public/_headers (format Cloudflare Pages). */
function parseGlobalHeaders(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  let inGlobalBlock = false
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("#") || line.trim() === "") continue
    if (!line.startsWith(" ")) {
      inGlobalBlock = line.trim() === "/*"
      continue
    }
    if (!inGlobalBlock) continue
    const index = line.indexOf(":")
    result[line.slice(0, index).trim()] = line.slice(index + 1).trim()
  }
  return result
}
const global = parseGlobalHeaders(headersText)

describe("SPA fallback Cloudflare Pages", () => {
  it("tidak ada public/404.html (Cloudflare hanya jadi SPA fallback kalau 404.html tidak ada)", () => {
    expect(existsSync(root("public/404.html"))).toBe(false)
  })
  it("tidak ada _redirects /* → /index.html (ditolak Cloudflare sebagai infinite loop)", () => {
    expect(existsSync(root("public/_redirects"))).toBe(false)
  })
})

describe("header keamanan", () => {
  it("empat header wajib ada", () => {
    for (const name of ["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]) {
      expect(global[name], name).toBeTruthy()
    }
  })
  it("CSP ketat: tanpa unsafe-inline/unsafe-eval, tanpa host eksternal", () => {
    const csp = global["Content-Security-Policy"]
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/)
    expect(csp).not.toMatch(/https?:|\*/)
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("worker-src 'self'")
  })
  it("sw.js dan manifest tidak di-cache agar update terdeteksi", () => {
    expect(headersText).toMatch(/\/sw\.js\n\s+Cache-Control: no-cache/)
    expect(headersText).toMatch(/\/manifest\.webmanifest\n\s+Cache-Control: no-cache/)
  })
})

describe("isolasi panel admin", () => {
  it("/admin dan /admin-assets/* tidak di-cache dan tidak diindeks", () => {
    expect(headersText).toMatch(/\/admin\n\s+Cache-Control: no-store/)
    expect(headersText).toMatch(/\/admin-assets\/\*\n\s+Cache-Control: private, no-store/)
    expect(headersText).toMatch(/X-Robots-Tag: noindex/)
  })
  it("vite: chunk admin ke admin-assets, tidak di-precache, navigasi /admin tidak dijawab SW", () => {
    const cfg = readFileSync(root("vite.config.ts"), "utf8")
    expect(cfg).toContain("admin-assets/[name]-[hash].js")
    expect(cfg).toContain("globIgnores: ['admin-assets/**']")
    expect(cfg).toContain("navigateFallbackDenylist")
  })
})
