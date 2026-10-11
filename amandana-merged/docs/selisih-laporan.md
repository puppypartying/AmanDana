# Selisih laporan (tes_tes_jir.pdf) vs aplikasi

Acuan: laporan AmanDana Bab 1-7 dan Lampiran A-C. Status per butir setelah penyelarasan terakhir.

## Sudah sesuai
| Butir laporan | Di aplikasi |
|---|---|
| 4.3 bobot 11 aturan (imbal 28, ajak teman 20, catut OJK 18, akses kontak 25, ancaman 25, pencairan cepat 18, potongan di muka 18, tenor 15, bunga/denda 15, rekening pribadi 24 Umum, tekanan waktu 16 Umum) | `rules.json`, dikunci test "sinkron dengan laporan Bab 4.3" |
| 4.3 ambang 0-39 / 40-69 / 70-100; aturan hanya sesuai jenis + Umum | `engine.ts`, test |
| 4.4 contoh simulator: 25% per periode, setara +-652% per tahun | `loan.ts`, `loan.test.ts` |
| 6.1 lima layar (Cek, Hasil, Simulator, Bantuan, Belajar) | `config/tabs.ts` |
| 6.3 status legalitas "Belum diverifikasi dalam prototipe ini" + tautan OJK | `Hasil.tsx` |
| 4.5 penyamaran nomor, HTTPS, hasil sebagai indikasi | `format.ts`, `_headers` |
| 1.3 target pengguna 18-55+ berpenghasilan (bukan mahasiswa) | teks Cek, deskripsi index/manifest |

## Perlu diputuskan: laporan atau aplikasi yang diubah
1. **Lampiran B contoh 1 tidak konsisten.** Laporan menulis skor 76 dengan tanda bahaya "potongan di muka (18)", tetapi teks contohnya tidak memuat potongan. Dengan teks asli hasilnya 58 (Sedang). Teks yang bisa dipakai: "Dana cair 5 menit tanpa survei! Potongan admin 15% di muka. Slot terbatas, transfer ke rekening pribadi admin." = 76 (Tinggi). Contoh 2 (58) sudah cocok.
2. **4.1 / 4.3 model TF-IDF + regresi logistik (Python, scikit-learn) tidak ada.** Aplikasi hanya rule-based berjalan di browser, tanpa server. Pilih: tulis di laporan bahwa prototipe rule-based (model teks = pengembangan lanjutan), atau bangun model + server. Angka "precision/recall 80%" di 7.4 sampai sekarang hanya bisa diklaim untuk aturan, bukan model.
3. **3.2 #6, 4.1, 6.1 panel admin login tidak ada** (dihapus di Fase 4 karena aplikasi tanpa backend). Hapus dari laporan atau bangun backend.
4. **3.2 #1 dan 4.2 langkah 4 cek legalitas dengan salinan daftar entitas resmi** belum ada (sesuai 6.3 untuk prototipe). Target 7.4 "salah label entitas legal < 5%" belum bisa diukur.
5. **4.2 langkah 6 / 4.5 "teks asli tidak disimpan; hanya log anonim".** Aplikasi menyimpan hasil di perangkat pengguna, dan teks (disamarkan) hanya bila pengguna menyalakan "Simpan teks pesan". Tidak ada log ke server. Sesuaikan kalimat laporan.
6. **Tambahan yang tidak ada di laporan:** pembacaan angka (`numeric.ts`), lantai skor (ancaman >= 70; janji untung tidak wajar >= 40, >= 70 bila ada tanda bahaya lain), dan dari engine v3: 9 aturan audit D1/D2, sinyal kritis (lantai 70), deteksi kalimat peringatan, serta normalisasi angka. Lampiran B contoh 2 sekarang 70, bukan 60 (jumlah aditif tetap 60). Perlu ditulis di 4.3 atau dimatikan (hapus `floor-*`/`severity` di `rules.json`).
7. **Bobot di `rules.json` kini mengikuti AmanDana-main (Bab 4.3 versi lama), bukan tes_tes_jir.pdf.** Selisihnya: potongan di muka 20 (laporan baru 18), tekanan waktu dan rekening pribadi per jenis (laporan baru: umum 16 dan 24), `pin-pencairan-cepat` nonaktif (laporan baru: aktif 18). `REPORT_RULES` di `src/admin/report.ts` mengikuti versi ini.
8. **Bab 2.5 dan 7.4:** kolom "[isi]" dan angka survei harus diisi dari data nyata. Aplikasi tidak mengubahnya.

## Catatan
- 4.3 menyebut bobot sebagai "nilai awal yang akan dikalibrasi". Kalibrasi harus memakai holdout yang belum pernah dilihat engine (rencana Fase 10).

## Panel admin
Ada di `/admin` (lihat `docs/admin.md`): matriks scan, editor aturan, data uji tuning/holdout, daftar platform, tab Terbit, ekspor. Memenuhi sebagian Bab 3.2 #6 / 6.1: pengelolaan aturan dengan akses terbatas lewat Cloudflare Access. Sekarang dengan Pages Functions + KV: draf bersama, terbit tanpa deploy, riwayat 20 versi dengan nama admin, dan rollback. Yang belum: jejak audit per perubahan draf, daftar platform yang dibaca scan, dan transaksi penuh (butuh D1 atau Durable Object).

Catatan: aturan yang diterbitkan lewat panel tidak lagi dijaga oleh test "sinkron dengan laporan Bab 4.3" (test itu hanya membaca `rules.json` bawaan build). Panel tetap menandai selisih bobot dengan laporan di editor.
