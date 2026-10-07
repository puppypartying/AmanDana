import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { APP_NAME } from './src/config/app'

// Hosting di subpath (mis. https://contoh.id/amandana/): build dengan VITE_BASE=/amandana/
// Default '/' untuk domain sendiri. Slash di awal dan akhir dirapikan otomatis.
function normalizeBase(raw: string | undefined): string {
  const trimmed = (raw ?? '/').trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}
const base = normalizeBase(process.env.VITE_BASE)

// Vite config — https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    // Saat Vitest berjalan, plugin PWA tidak diperlukan (tidak ada build/SW).
    !process.env.VITEST &&
      VitePWA({
        // 'prompt': versi baru menunggu sampai pengguna menekan "Muat ulang" (lihat UpdateToast).
        registerType: 'prompt',
        // Registrasi dilakukan lewat virtual:pwa-register/react, bukan skrip inline (CSP ketat).
        injectRegister: false,
        manifest: {
          // id/start_url/scope mengikuti base supaya aman di subpath; id tetap '/' di domain sendiri.
          id: base,
          start_url: base,
          scope: base,
          name: `${APP_NAME} — Teman Aman Finansialmu`,
          short_name: APP_NAME,
          description: 'Edukasi risiko pinjaman online dan investasi untuk mahasiswa Indonesia.',
          lang: 'id',
          dir: 'ltr',
          display: 'standalone',
          background_color: '#f7f9f9',
          theme_color: '#0f4c5c',
          categories: ['finance', 'education', 'security'],
          // src relatif terhadap lokasi manifest, jadi benar di base mana pun.
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            {
              name: 'Cek Tawaran',
              short_name: 'Cek',
              description: 'Analisis tawaran pinjaman atau investasi',
              url: base,
              icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Simulator Biaya',
              short_name: 'Simulator',
              description: 'Hitung total biaya pinjaman',
              url: `${base}simulator`,
              icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
          // TODO(Fase 6): screenshots — butuh tangkapan layar asli dari build yang sudah live
          // (lihat docs/deploy.md). Jangan diisi gambar placeholder.
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
          // Rute SPA (/hasil, /simulator, ...) dijawab dari index.html yang sudah di-precache.
          navigateFallback: 'index.html',
          // Hapus precache versi lama otomatis saat SW baru aktif.
          cleanupOutdatedCaches: true,
        },
      }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
