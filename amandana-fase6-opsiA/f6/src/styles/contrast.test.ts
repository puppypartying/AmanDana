import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Kontras teks vs latar harus >= 4.5:1 (WCAG AA) di mode terang dan gelap.
// Pengecualian (sengaja tidak diuji): ikon/ornamen dekoratif aria-hidden dan logotype
// (token tone-text-75aa94, 68a791, 719d87, 6a9579, 6884a8, 6d9279, b4756b, a38241, 58804a).
const css = readFileSync(new URL('./theme.css', import.meta.url), 'utf8')
const vars = (block: string) => Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]))
const split = css.indexOf('[data-theme="dark"]')
const light = vars(css.slice(0, split))
const palettes = { terang: light, gelap: { ...light, ...vars(css.slice(split)) } } as Record<string, Record<string, string>>

function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const surfaces = ['background', 'card', 'muted', 'secondary']
const pairs: [string, string][] = [
  ...['foreground', 'muted-foreground', 'primary'].flatMap((t) => surfaces.map((s): [string, string] => [t, s])),
  ['primary-foreground', 'primary'],
  ['destructive-foreground', 'destructive'],
  ...['background', 'card', 'tone-bg-fbeceb', 'tone-bg-fcf0ed', 'tone-bg-fbefeb'].map((s): [string, string] => ['destructive', s]),
  ...['23818a', '568574', '607b70', '7b8e93', '8a8069', '8b7650'].flatMap((t) => ['background', 'card'].map((s): [string, string] => [`tone-text-${t}`, s])),
  ['tone-text-a17a34', 'tone-bg-fff5de'],
  ['tone-text-aa7c29', 'tone-bg-fcf7e9'],
  ['tone-text-aa7c29', 'card'],
  ['tone-text-8c682a', 'tone-bg-fcf7e9'],
]

describe.each(Object.keys(palettes))('kontras WCAG AA mode %s', (mode) => {
  it.each(pairs)('%s di atas %s >= 4.5', (text, bg) => {
    const p = palettes[mode]
    expect(p[text], `token ${text} ada`).toBeDefined()
    expect(p[bg], `token ${bg} ada`).toBeDefined()
    expect(contrast(p[text], p[bg])).toBeGreaterThanOrEqual(4.5)
  })
})
