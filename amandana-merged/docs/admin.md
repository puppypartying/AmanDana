# Panel admin (Cloudflare Pages Functions + KV + Access)

Alamat: `https://<domain>/admin`. Isinya: matriks scan (confusion matrix, precision/recall, per jenis, per aturan), editor aturan dan bobot, data uji berlabel (split tuning/holdout), daftar platform/tautan, **terbit ke pengguna** (tab Terbit), dan ekspor/impor.

## Dua mode
| | Mode server (produksi) | Mode lokal (cadangan) |
|---|---|---|
| Kapan | Functions dan KV terpasang, sesi Access aktif | Tidak ada Functions (mis. `npm run dev`), KV belum dipasang, atau belum login Access |
| Draf | Disimpan di KV, dibagi semua admin, ada deteksi dua admin saling menimpa (`rev`) | Hanya di `localStorage` browser ini |
| Menerapkan ke pengguna | Tombol **Terbitkan** di tab Terbit, tanpa deploy | Ekspor JSON, commit, deploy (tab Ekspor) |
| Riwayat dan rollback | 20 versi terakhir, siapa dan kapan, rollback satu klik | Tidak ada |

Bilah status di atas panel selalu menunjukkan mode dan alasannya bila jatuh ke mode lokal.

## Cara kerja
1. Admin menyimpan draf: `PUT /admin-api/draft` menulis `admin:draft` di KV (aturan + data uji + platform).
2. **Terbitkan** (`POST /admin-api/publish`) memeriksa draf **yang tersimpan di server**, lalu menulis `rules:published` dan `rules:history`. **Daftar platform ikut terbit bersama aturan** (satu versi, satu rollback). Server menolak bila:
   - bentuk aturan tidak valid (`validateRules`), pola tidak bisa dikompilasi, ada kuantifier bersarang (risiko backtracking katastrofik), atau aturan terlalu lambat pada teks panjang (422);
   - daftar platform punya error: entri ganda, tanggal sumber bukan YYYY-MM-DD, domain resmi tidak valid, tercatat sekaligus resmi dan red-flag, atau lebih dari 3000 entri (422). Peringatan (mis. platform resmi tanpa domain resmi) tidak memblokir;
   - draf di server berubah sejak admin memuatnya (409);
   - precision atau recall pada **holdout** (ambang Sedang) di bawah 80%. Ini peringatan: admin boleh melanjutkan dengan mencentang konfirmasi, dan metriknya ikut ditampilkan.
3. Aplikasi pengguna memanggil `GET /api/rules` saat dibuka, memvalidasi ulang di browser (aturan dan daftar platform; daftar yang rusak menolak seluruh respons), memakainya, dan menyimpan salinan di `localStorage` (`amandana-rules-cache`) supaya tetap konsisten saat offline.
4. **Server hanya boleh menambah kemampuan.** Server mati, 204 (belum ada aturan terbit), jaringan putus, respons rusak, atau aturan tidak valid: aplikasi tetap memakai salinan terakhir yang valid, atau aturan bawaan build (`src/lib/risk/rules.json`). Aplikasi tidak pernah menunggu server untuk tampil.
5. Rollback menerbitkan isi versi lama sebagai **versi baru**; riwayat tidak dihapus.

Aturan terbit di KV lebih diutamakan daripada `rules.json` bawaan build. Bila `rules.json` bawaan diperbarui lewat deploy (mis. engine baru dengan field baru) dan aturan di KV belum sesuai bentuknya, aturan di KV ditolak validasi dan aplikasi memakai bawaan; terbitkan ulang dari panel setelah itu.

Perubahan terlihat di pengguna paling cepat saat aplikasi dibuka berikutnya; cache respons sekitar 1 menit (`max-age=60`), dan KV bersifat konsisten akhir sehingga di beberapa lokasi bisa lebih lama (cek batas terbaru di dokumentasi Cloudflare KV).

## Pasang di Cloudflare
1. **KV**: Cloudflare dashboard → Workers & Pages → **KV** → Create a namespace (mis. `amandana`).
2. **Binding**: project Pages → **Settings → Functions → KV namespace bindings** → tambah variable name `AMANDANA_KV` untuk Production (dan Preview bila dipakai).
3. **Access** (langkah di bawah), lalu catat **Application Audience (AUD) Tag** aplikasi Access dan **team domain** (`<tim>.cloudflareaccess.com`).
4. **Environment variables** project Pages (Production): `ACCESS_TEAM_DOMAIN` = `<tim>.cloudflareaccess.com`, `ACCESS_AUD` = AUD tag. Tanpa keduanya, `/admin-api/*` menolak semua permintaan (gagal tertutup).
5. Deploy ulang (binding dan variable baru berlaku setelah deploy). Folder `functions/` ikut terdeteksi otomatis oleh Pages.
6. Uji: `curl -i https://<domain>/api/rules` → `204` (belum terbit) atau `200`; `curl -i https://<domain>/admin-api/state` tanpa login → `401` (bukan data).

Jangan menambah `wrangler.toml` bila project di-deploy lewat integrasi Git dan binding diatur di dashboard: file itu menjadi sumber konfigurasi tunggal dan pengaturan dashboard tidak lagi dipakai.

Uji lokal: `npm run build && npx wrangler pages dev dist --kv AMANDANA_KV --binding ACCESS_TEAM_DOMAIN=<tim>.cloudflareaccess.com --binding ACCESS_AUD=<aud>`. Verifikasi token Access butuh jaringan ke Cloudflare dan token asli, jadi alur admin lengkap diuji lewat `npm test` (`src/server/*.test.ts`), bukan lewat emulator.

## Pasang Cloudflare Access
1. Cloudflare dashboard → **Zero Trust** → **Access** → **Applications** → **Add an application** → **Self-hosted**.
2. Tambahkan **tiga** path pada domain yang sama: `/admin`, `/admin-assets`, dan `/admin-api` (atau satu wildcard `admin*` bila dashboard menerimanya; itu mencakup ketiganya).
3. Policy: **Allow**, *Include → Emails* berisi email admin (atau satu domain email tim). Tolak yang lain.
4. Simpan, lalu uji di jendela incognito: `/admin` harus meminta login; `/admin-assets/...js` dan `/admin-api/state` tanpa login harus ditolak; `/`, `/hasil`, dan `/api/rules` tetap terbuka untuk umum. **Jangan** melindungi `/api/rules`: aplikasi pengguna memanggilnya tanpa login.
5. Cek batas pengguna paket Zero Trust Anda (batas gratis bisa berubah).

Bila `/admin` blank setelah login: pastikan **semua** path admin dilindungi dan dibuka dengan sesi login yang sama (chunk dimuat dari `/admin-assets/`, API dari `/admin-api/`).

Keamanan berlapis: Access menjaga path, dan server **memverifikasi ulang** token Access (`Cf-Access-Jwt-Assertion`: tanda tangan RS256, `aud`, `iss`, masa berlaku) di setiap permintaan `/admin-api`. Permintaan tulis juga ditolak bila `Origin` bukan situs ini, dan semua respons admin `no-store`. Email admin hanya ada di respons admin; `/api/rules` tidak memuat email atau catatan terbit.

## Alur kerja kalibrasi yang jujur
1. Buka tab **Data uji**, isi pesan baru (sintetis/parafrase) ke **holdout** sampai minimal 100, banyak di antaranya pesan sah yang mirip penipuan.
2. Setel aturan di tab **Aturan** dengan melihat matriks **tuning** saja. Pakai "Uji cepat" untuk mencoba satu pesan.
3. Baca matriks **holdout** hanya setelah selesai menyetel. Angka ini yang boleh masuk Bab 7.4. Jika Anda menyetel lagi berdasarkan holdout, pindahkan pesan itu ke tuning dan tulis holdout baru.
4. Mode server: **Simpan draf**, lalu tab **Terbit**. Mode lokal: ekspor `rules.json` + `dataset.json`, jalankan `npm test`, commit, deploy.
5. Bobot yang berbeda dari laporan Bab 4.3 ditandai "≠ laporan". Test sinkron-laporan hanya menjaga `rules.json` bawaan build, **bukan** aturan yang diterbitkan lewat panel; jadi di mode server, selaraskan laporan secara manual dan, bila perlu, jadikan aturan terbit sebagai bawaan build (ekspor `rules.json`, jalankan `npm test`, commit).

## Daftar platform (cek platform)
- Tab **Platform** mengelola nama, tautan, dan akun/nomor berstatus `red-flag` atau `resmi`. Entri `resmi` bertipe nama sebaiknya punya **domain resmi**; tanpa itu, tautan tiruan tidak bisa dideteksi.
- **Impor massal**: tempel daftar resmi dari OJK/Satgas PASTI (format di tab). Jangan mengisi dari ingatan: status legal/ilegal harus bisa dibuktikan dengan sumber dan tanggal.
- Mode server: Simpan draf, lalu **Terbitkan**; daftar langsung dipakai scan tanpa deploy. Daftar terbit yang tidak menyertakan `platforms` (versi lama) berarti memakai bawaan build (`src/lib/platform/platforms.json`). Mode lokal: unduh `platforms.json`, timpa file itu, `npm test`, commit, deploy.
- Penilaian: red-flag persis mengunci skor minimal 85; tautan menyerupai domain resmi, atau pesan menyebut platform resmi dengan tautan lain, minimal 70; mirip red-flag +20; mirip resmi +10; sinyal bentuk tautan maksimal +30. Status `resmi` **tidak pernah menurunkan skor** karena nama resmi sering dicatut.
- Privasi: nama/domain/nomor yang diketik pengguna tidak ikut disimpan di riwayat perangkat; hanya status dan data daftar.

## Editor aturan: field engine v3
- **Tingkat** (biasa/kritis) per aturan dan kotak **kritis** per pola: satu sinyal kritis menaikkan skor ke lantai kritis.
- Kotak **teks asli** per pola: dicocokkan ke teks asli (huruf kecil), untuk URL dan "a.n. Nama". Pola ini tidak diperluas `<Gn>`.
- **Penanda kalimat peringatan** dan **lantai sinyal kritis** ada di bagian tersendiri. Kecocokan di kalimat peringatan tetap dihitung bobotnya, tetapi tidak memicu lantai atau kombinasi.
- Aturan tambahan dari audit ditandai "di luar laporan (audit-D1/D2)"; hanya 10 aturan `laporan-4.3` yang dibandingkan dengan `REPORT_RULES`.
- Salinan lokal draf selalu ditulis di kunci `amandana-admin-v2` sebagai cadangan. Draf v1 lama di browser tidak dipakai lagi; ekspor v1 masih bisa diimpor (field baru diisi dari aturan bawaan).
- Bila draf lokal berbeda dari draf server saat panel dibuka, yang dipakai draf server dan draf lokal ditawarkan sebagai cadangan yang bisa dipulihkan.

## Belum terhubung
- Daftar platform/tautan hanya dikelola, disimpan di draf, dan diekspor (`platforms.json`); scan belum membacanya (Fase 8). Data uji juga hanya bagian dari draf, tidak ikut diterbitkan ke pengguna.
- KV tidak punya transaksi: terbit menulis `rules:history` lalu `rules:published` berurutan (bila gagal di tengah, aturan terbit tidak berubah). Deteksi dua admin menyimpan bersamaan memakai `rev` dan bersifat upaya terbaik (ada celah balapan sempit antara baca dan tulis); untuk tim kecil ini cukup. Bila perlu jaminan ketat, pindahkan draf dan riwayat ke D1 atau Durable Object.
- Jejak audit terbatas pada 20 versi terbit terakhir (siapa, kapan, catatan); perubahan draf antar-simpan tidak dicatat.
