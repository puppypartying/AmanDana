// Pemeriksaan hasil build (jalankan setelah `npm run build`): memastikan artefak PWA dan
// hosting yang dijanjikan Fase 6 benar-benar ada di dist/. Keluar dengan kode 1 jika ada yang gagal.
import { existsSync, readFileSync, readdirSync } from "node:fs"

const problems: string[] = []
const check = (ok: boolean, message: string) => {
  if (!ok) problems.push(message)
}

const html = readFileSync("dist/index.html", "utf8")
const inlineScripts = [...html.matchAll(/<script\b([^>]*)>/g)].filter((m) => !/\bsrc=/.test(m[1]))
check(inlineScripts.length === 0, "index.html memuat <script> inline (melanggar CSP script-src 'self')")
check(!/\son[a-z]+=/i.test(html), "index.html memuat atribut event inline (onclick, dst.)")
check(!/<style\b/i.test(html), "index.html memuat <style> inline (melanggar CSP style-src 'self')")
check((html.match(/rel="manifest"/g) ?? []).length === 1, "harus tepat satu <link rel=\"manifest\">")
check(/rel="apple-touch-icon"[^>]*apple-touch-icon\.png/.test(html), "apple-touch-icon belum menunjuk ke apple-touch-icon.png (180px)")

for (const file of ["sw.js", "manifest.webmanifest", "_headers", "apple-touch-icon.png", "icon-maskable-512.png"]) {
  check(existsSync(`dist/${file}`), `dist/${file} tidak ada`)
}
check(!existsSync("dist/404.html") && !existsSync("dist/_redirects"), "dist/404.html atau _redirects ada: merusak SPA fallback Cloudflare Pages")
check(readdirSync("dist").some((f) => /^workbox-.*\.js$/.test(f)), "file runtime workbox-*.js tidak ada di dist/")

if (existsSync("dist/manifest.webmanifest")) {
  const manifest = JSON.parse(readFileSync("dist/manifest.webmanifest", "utf8"))
  const icons: { purpose?: string; sizes?: string; src: string }[] = manifest.icons ?? []
  check(icons.some((i) => i.purpose === "maskable" && i.sizes === "512x512"), "manifest: ikon maskable 512 tidak ada")
  check(icons.some((i) => i.purpose === "any" && i.sizes === "512x512"), "manifest: ikon any 512 tidak ada")
  check(icons.every((i) => !i.purpose?.includes(" ")), "manifest: jangan gabung 'any maskable' dalam satu ikon")
  for (const icon of icons) check(existsSync(`dist/${icon.src}`), `manifest: file ikon ${icon.src} tidak ada di dist/`)
  check(Array.isArray(manifest.categories) && manifest.categories.length > 0, "manifest: categories kosong")
  const shortcutUrls: string[] = (manifest.shortcuts ?? []).map((s: { url: string }) => s.url)
  check(shortcutUrls.length >= 2, "manifest: shortcuts (Cek, Simulator) kurang dari 2")
  check(shortcutUrls.some((u) => u.endsWith("/simulator")), "manifest: shortcut Simulator tidak ada")
  check(manifest.start_url === manifest.scope && manifest.id === manifest.start_url, "manifest: id/start_url/scope harus konsisten")
}

if (existsSync("dist/sw.js")) {
  const sw = readFileSync("dist/sw.js", "utf8")
  check(sw.includes("index.html"), "sw.js tidak mereferensikan index.html (navigateFallback)")
  // Mode prompt: skipWaiting hanya boleh dipanggil sebagai balasan pesan SKIP_WAITING dari halaman
  // (saat pengguna menekan "Muat ulang"), bukan otomatis saat install.
  const calls = [...sw.matchAll(/skipWaiting\(\)/g)]
  const guarded = calls.every((m) => sw.slice(Math.max(0, m.index - 80), m.index).includes("SKIP_WAITING"))
  check(guarded, "sw.js memanggil skipWaiting() tanpa menunggu pesan SKIP_WAITING (update jadi otomatis)")
}

// Panel admin: chunk terpisah di admin-assets/, tidak di-precache, dan datanya tidak bocor ke chunk publik.
const adminDir = "dist/admin-assets"
check(existsSync(adminDir) && readdirSync(adminDir).some((f) => f.endsWith(".js")), "dist/admin-assets/*.js tidak ada (chunk admin tidak terpisah)")
if (existsSync("dist/sw.js")) check(!readFileSync("dist/sw.js", "utf8").includes("admin-assets"), "sw.js me-precache admin-assets (akan gagal di balik Cloudflare Access)")
for (const f of readdirSync("dist/assets").filter((n) => n.endsWith(".js"))) {
  check(!readFileSync(`dist/assets/${f}`, "utf8").includes("holdout awal"), `dist/assets/${f} memuat data uji admin (seharusnya hanya di admin-assets)`)
}

if (problems.length) {
  console.error(`check-dist GAGAL (${problems.length}):\n- ${problems.join("\n- ")}`)
  process.exit(1)
}
console.log("check-dist OK")
