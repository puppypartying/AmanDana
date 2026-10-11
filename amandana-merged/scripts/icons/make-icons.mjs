// Membuat ikon PWA full-bleed (tanpa sudut transparan) dari icon-maskable.svg.
// Glyph perisai sudah berada di dalam safe zone maskable (lingkaran 80% di tengah).
//
// Cara pakai (sharp sengaja tidak masuk dependency proyek):
//   npm i --no-save sharp && node scripts/icons/make-icons.mjs
import sharp from "sharp"
import { readFile } from "node:fs/promises"

const svg = await readFile(new URL("./icon-maskable.svg", import.meta.url))
const render = (size) => sharp(svg, { density: 384 }).resize(size, size)

await render(512).png().toFile("public/icon-maskable-512.png")
await render(192).png().toFile("public/icon-maskable-192.png")
// iOS memberi mask sendiri dan mengisi area transparan dengan hitam, jadi harus opaque.
await render(180).flatten({ background: "#0f4c5c" }).png().toFile("public/apple-touch-icon.png")
console.log("ikon dibuat")
