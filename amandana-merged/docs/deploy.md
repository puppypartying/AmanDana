# Deploy AmanDana ke Cloudflare Pages (Fase 6)

## Setelan project

Dashboard Cloudflare → Workers & Pages → Create → Pages → Connect to Git → pilih repo ini.

| Setelan | Nilai |
|---|---|
| Production branch | `main` (setiap branch lain otomatis jadi preview URL) |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `22` |
| `VITE_BASE` | jangan diisi (default `/`); hanya untuk hosting di subpath |

URL awal: `https://<nama-project>.pages.dev` (HTTPS otomatis). Domain sendiri bisa ditambah di tab Custom domains.

Alternatif tanpa Git: `npm run build && npx wrangler pages deploy dist --project-name <nama-project>` (perlu login Wrangler).

## Functions dan KV (aturan terbit dari panel admin)

Folder `functions/` (Pages Functions) melayani `/api/rules` (publik) dan `/admin-api/*` (admin, di balik Cloudflare Access). Agar aktif: pasang binding KV `AMANDANA_KV` dan variabel `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`. Langkah lengkap di `docs/admin.md`. Tanpa binding, aplikasi publik tetap jalan memakai aturan bawaan build (`/api/rules` menjawab 503, klien mengabaikannya).

## Cara kerja SPA fallback dan header

- **Rute SPA** (`/hasil`, `/simulator`, ...): Cloudflare otomatis menjawab `index.html` untuk path yang tidak ada filenya, **selama tidak ada `404.html`**. Jangan menambah `public/404.html` atau `public/_redirects` catch-all `/* /index.html 200` (Cloudflare menolaknya sebagai "infinite loop"). `deploy-config.test.ts` dan `npm run check:dist` menjaga ini.
- **Header** (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, cache `sw.js`/manifest/assets): semuanya di `public/_headers`.

## Yang sudah diverifikasi (di sandbox, tanpa browser)

- `npm run check:dist`: tidak ada `<script>`/`<style>` inline di `index.html`, satu `<link rel="manifest">`, ikon maskable 512 dan any 512 ada, shortcuts ada, `skipWaiting` hanya dipanggil setelah pengguna menekan "Muat ulang", tidak ada `404.html`/`_redirects`.
- Emulator Cloudflare Pages (`wrangler pages dev dist`): `/hasil` dijawab 200 dengan `index.html`, keempat header terpasang, `sw.js` dan manifest `no-cache`, `/assets/*` immutable.
- Build dengan `VITE_BASE=/amandana/`: manifest, tautan di `index.html`, scope service worker, dan `basename` router ikut subpath.

## Cek setelah deploy pertama (belum bisa diuji di sandbox)

1. **Refresh rute**: buka `https://<domain>/hasil` langsung, harus tampil halaman Hasil, bukan 404.
2. **CSP di browser asli**: DevTools → Console, pakai semua halaman, cari `Refused to ...`. Jangan longgarkan dengan `unsafe-inline`; cari sumbernya. Untuk deploy pertama bisa ganti sementara nama header jadi `Content-Security-Policy-Report-Only` di `_headers` (test header akan gagal sampai dikembalikan).
3. **Service worker & update**: DevTools → Application → Service Workers harus terdaftar. Deploy build kedua, buka tab lama: toast "Versi baru tersedia" harus muncul, dan "Muat ulang" harus memuat versi baru.
4. **Install**: DevTools → Application → Manifest tanpa peringatan; cek ikon maskable dengan "Show only the minimum safe area for maskable icons".
5. **Header**: `curl -sI https://<domain>/ | grep -i "content-security\|x-content\|referrer\|permissions"`
6. **Lighthouse** (Performance, Accessibility, Best Practices, SEO):
   `npx lighthouse https://<domain> --only-categories=performance,accessibility,best-practices,seo --view`
   Sejauh yang gue tahu, Lighthouse terbaru sudah tidak punya kategori "PWA"; installability dicek lewat langkah 4. Catat skor di laporan hanya dari hasil nyata.

## Screenshots manifest (belum ada, butuh tangkapan layar asli)

Ambil dari situs yang sudah live: 1 layar sempit (mis. 1080×1920, `form_factor: narrow`) dan 1 layar lebar (mis. 1280×720, `form_factor: wide`), simpan di `public/screenshots/`, lalu tambahkan ke `manifest` di `vite.config.ts`:

```ts
screenshots: [
  { src: 'screenshots/cek-narrow.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'Cek tawaran' },
  { src: 'screenshots/cek-wide.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide', label: 'Cek tawaran' },
],
```

Jangan pakai gambar placeholder.

## Mengganti ikon

Sumber ikon maskable/iOS: `scripts/icons/icon-maskable.svg`. Regenerasi PNG:
`npm i --no-save sharp && node scripts/icons/make-icons.mjs`

## noindex

`index.html` masih `noindex, nofollow`. Ubah hanya setelah pemilik proyek menyatakan siap publik.
