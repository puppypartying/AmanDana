# Panel admin (Opsi 1: statis + Cloudflare Access)

Alamat: `https://<domain>/admin`. Isinya: matriks scan (confusion matrix, precision/recall, per jenis, per aturan), editor aturan dan bobot, data uji berlabel (split tuning/holdout), daftar platform/tautan, ekspor/impor.

## Cara kerja dan batasnya
- Panel ini **statis**: tidak ada server. Draf aturan/data disimpan di `localStorage` browser admin. Agar berlaku untuk pengguna, ekspor JSON lalu commit dan deploy ulang (tab Ekspor).
- **Kode tidak punya login.** Pembatasan akses dilakukan Cloudflare Access (di bawah). Tanpa Access, siapa pun yang tahu `/admin` bisa membukanya. Isinya memang tidak rahasia (aturan, pesan sintetis), tapi jangan menyimpan data pribadi atau laporan korban asli di sini.
- Chunk JS admin ada di `/admin-assets/`, terpisah dari bundel publik, tidak di-precache service worker, dan tidak ikut diunduh pengguna biasa.

## Pasang Cloudflare Access
1. Cloudflare dashboard → **Zero Trust** → **Access** → **Applications** → **Add an application** → **Self-hosted**.
2. Tambahkan dua path pada domain yang sama: `/admin` dan `/admin-assets` (atau satu aplikasi dengan dua destinasi). Wildcard `admin*` juga boleh bila dashboard menerimanya.
3. Policy: **Allow**, *Include → Emails* berisi email admin (atau satu domain email tim). Tolak yang lain.
4. Simpan, lalu uji di jendela incognito: `/admin` harus meminta login; `/admin-assets/...js` tanpa login harus ditolak; `/` dan `/hasil` tetap terbuka untuk umum.
5. Cek batas pengguna paket Zero Trust Anda (batas gratis bisa berubah).

Bila `/admin` blank setelah login: pastikan **kedua** path dilindungi dan dibuka dengan sesi login yang sama (chunk dimuat dari `/admin-assets/`).

## Alur kerja kalibrasi yang jujur
1. Buka tab **Data uji**, isi pesan baru (sintetis/parafrase) ke **holdout** sampai minimal 100, banyak di antaranya pesan sah yang mirip penipuan.
2. Setel aturan di tab **Aturan** dengan melihat matriks **tuning** saja. Pakai "Uji cepat" untuk mencoba satu pesan.
3. Baca matriks **holdout** hanya setelah selesai menyetel. Angka ini yang boleh masuk Bab 7.4. Jika Anda menyetel lagi berdasarkan holdout, pindahkan pesan itu ke tuning dan tulis holdout baru.
4. Ekspor `rules.json` + `dataset.json`, jalankan `npm test`, commit, deploy.
5. Bobot yang berbeda dari laporan Bab 4.3 ditandai "≠ laporan"; test sinkron-laporan akan gagal. Ubah laporan dan test bersama-sama.

## Editor aturan: field engine v3
- **Tingkat** (biasa/kritis) per aturan dan kotak **kritis** per pola: satu sinyal kritis menaikkan skor ke lantai kritis.
- Kotak **teks asli** per pola: dicocokkan ke teks asli (huruf kecil), untuk URL dan "a.n. Nama". Pola ini tidak diperluas `<Gn>`.
- **Penanda kalimat peringatan** dan **lantai sinyal kritis** ada di bagian tersendiri. Kecocokan di kalimat peringatan tetap dihitung bobotnya, tetapi tidak memicu lantai atau kombinasi.
- Aturan tambahan dari audit ditandai "di luar laporan (audit-D1/D2)"; hanya 10 aturan `laporan-4.3` yang dibandingkan dengan `REPORT_RULES`.
- Draf admin disimpan di kunci `amandana-admin-v2`. Draf v1 lama di browser tidak dipakai lagi; ekspor v1 masih bisa diimpor (field baru diisi dari aturan bawaan).

## Daftar platform (cek platform)
- Tab **Platform** mengelola nama, tautan, dan akun/nomor berstatus `red-flag` atau `resmi`. Entri `resmi` bertipe nama sebaiknya punya **domain resmi**; tanpa itu, tautan tiruan tidak bisa dideteksi.
- **Impor massal**: tempel daftar resmi dari OJK/Satgas PASTI (format di tab). Jangan mengisi dari ingatan: status legal/ilegal harus bisa dibuktikan dengan sumber dan tanggal.
- Terapkan: unduh `platforms.json`, timpa `src/lib/platform/platforms.json`, `npm test`, commit, deploy. Scan membacanya lewat `checkPlatform`.
- Aturan penilaian: red-flag persis mengunci skor minimal 85; tautan menyerupai domain resmi atau pesan menyebut platform resmi dengan tautan lain minimal 70; mirip red-flag +20; mirip resmi +10; sinyal bentuk tautan maksimal +30. Status `resmi` **tidak pernah menurunkan skor** karena nama resmi sering dicatut.
- Privasi: nama/domain/nomor yang diketik pengguna tidak ikut disimpan di riwayat; hanya status dan data daftar.

## Belum terhubung
- Perubahan tidak langsung live dan tidak berjejak audit; itu baru ada di Opsi 2 (backend + penyimpanan).
