> **Diganti:** tabel di bawah mengacu ke versi lama Bab 4.3. Laporan terbaru (tes_tes_jir.pdf) mengaktifkan ketiga aturan nonaktif dan memakai potongan di muka 18. Lihat `docs/selisih-laporan.md`.
>
> **Catatan penggabungan (engine v3):** `rules.json` dan bobot sekarang mengikuti repo `AmanDana-main` (bobot Bab 4.3 versi lama: potongan di muka 20, tekanan waktu hanya investasi 10, rekening pribadi per jenis; `pin-pencairan-cepat` dan `pin-tekanan-waktu` nonaktif), bukan laporan terbaru. Menyelaraskan ulang ke tes_tes_jir.pdf masih keputusan terbuka.

# Fase 1: selisih kode lama vs laporan Bab 4.3 (menunggu keputusan manusia)

Aturan aktif di `src/lib/risk/rules.json` mengikuti bobot laporan Bab 4.3.
Aturan yang hanya ada di kode prototype lama dibawa sebagai `enabled: false`.

| Aturan | Kode lama | Bab 4.3 | Status sekarang |
|---|---|---|---|
| Imbal hasil dijanjikan pasti | 28 | 28 | aktif |
| Ajak teman / bonus | 20 | 20 | aktif (pola lebih spesifik) |
| Transfer ke rekening pribadi (investasi) | 24 | 24 | aktif |
| Tekanan waktu / slot terbatas (investasi) | 10 | 10 | aktif |
| Mencatut nama OJK / tokoh | tidak ada | 18 | aktif (baru) |
| Akses kontak / galeri | tidak ada | 25 | aktif (baru) |
| Ancaman / teror penagihan | tidak ada | 25 | aktif (baru) |
| Potongan di muka & biaya tidak jelas | 18 ("biaya/potongan/admin") | 20 | aktif, bobot 20 |
| Tenor sangat pendek (<= 30 hari) | tidak ada | 15 | aktif (baru) |
| Bunga dan denda tidak dijelaskan | tidak ada | 15 | aktif (baru) |
| Pencairan sangat cepat tanpa pemeriksaan (pinjol) | 18 | tidak ada | NONAKTIF |
| Transfer ke rekening pribadi (pinjol) | 24 | hanya investasi | NONAKTIF |
| Tekanan waktu / slot terbatas (pinjol) | 16 | hanya investasi (10) | NONAKTIF |

## Keputusan yang dibutuhkan
1. Aktifkan atau buang 3 aturan nonaktif di atas? Mengaktifkan "pencairan sangat cepat" akan mengubah contoh Lampiran B (skor 60 menjadi 78).
2. Satu aturan "ancaman" saja bernilai 25 (level Rendah). Mau diberi lantai skor sendiri, seperti kombinasi kontak + ancaman yang otomatis minimal 70?
3. Ambang Sedang (40) dan Tinggi (70) tetap seperti Bab 4.3?
4. Set uji sintetis dibuat dan disetel oleh tim yang sama. Sebelum angka precision/recall dikutip di laporan, uji ulang dengan pesan yang belum pernah dilihat engine.

## Perubahan Opsi A (pembacaan angka + lantai skor)
Bobot Bab 4.3 tidak diubah (test sinkron laporan dan Lampiran B 82/60 tetap lulus).
- `numeric.ts`: jalur kedua untuk dua aturan yang sudah ada. "untung N% per hari/minggu/bulan" yang setara >= 100%/tahun memicu `inv-imbal-pasti`; potongan >= 10% (dari angka % atau selisih pinjaman vs dana cair) memicu `pin-potongan-muka`. Batas ada di `NUMERIC_LIMITS`.
- Lantai skor (`combos` di rules.json): ancaman penagihan >= 70 (jawaban sementara keputusan 2); janji untung tidak wajar >= 40, dan >= 70 bila ada tanda bahaya lain. Lantai tidak mengubah contoh Lampiran B.
- Alasan lantai hanya tampil bila benar-benar menaikkan skor.

Hasil ke pesan holdout dari prototype-v2 (belum pernah dipakai menyetel): recall (>=40) naik dari 0/10 ke 5/10, 0 salah tandai pada 10 pesan sah. Yang masih lolos butuh aturan baru di luar Bab 4.3 (mis. biaya dibayar sebelum dana cair, bunga harian tinggi, kanal tidak resmi/APK), yaitu keputusan Opsi B. Jangan menyetel lagi ke 10 pesan itu; kumpulkan set baru.

## Fase 7 (risiko tampil di halaman Cek)
- `components/RiskSummary.tsx`: skor, level, saran, 3 alasan teratas + potongan teks yang terdeteksi, tombol ke /hasil. Fokus dipindah ke ringkasan agar pembaca layar membacakannya.
- `analyze()` tidak lagi berpindah ke /hasil dan tidak ada loading buatan 800 ms. Ringkasan disembunyikan bila teks/jenis diubah setelah analisis (`analyzedKey`).
- Potongan teks (evidence) disamarkan `maskNumbers`, hanya ada di memori, tidak disimpan ke perangkat (sama seperti sebelumnya); setelah reload ringkasan di riwayat tampil tanpa potongan.
- Hasil.tsx: kalimat "dalam contoh ini" diganti, dan tiap alasan menampilkan potongan yang terdeteksi.

## Engine v3 (digabung dari AmanDana-main ke repo admin)
Bobot Bab 4.3 versi lama tidak diubah. Yang bertambah:
- 9 aturan tambahan dari audit (D1/D2): kripto/robot, tugas berkomisi, biaya dibayar sebelum dana cair, deposit dulu, minta OTP, APK, URL pendek, rekening pribadi pinjol. Bobot usulan, belum divalidasi data.
- **Sinyal kritis** (`severity: "kritis"` pada aturan atau `critical` pada pola): satu saja menaikkan skor ke minimal `severityFloors.kritis` (70). Akibatnya Lampiran B contoh 2 naik dari 60 ke 70 (jumlah aditif tetap 60).
- **Kalimat peringatan/edukasi** (`warningMarkers`): bobot tetap dihitung, tetapi kecocokan di kalimat itu tidak memicu lantai atau kombinasi.
- Per aturan dipilih kecocokan terbaik (bukan di kalimat peringatan, dan kritis didahulukan).
- Pola `raw` dicocokkan ke teks asli (URL pendek, "a.n. Nama").
- `normalize.ts`: angka dirapikan (1.600.000 jadi 1600000, 1,5 jadi 1_5), "a.n." jadi "an".
- `numeric.ts`: "2% sehari/seminggu/sebulan/setahun" dan klaim "modal X jadi Y dalam N hari".
- `createScorer(rules)` tetap ada dan membawa semua perilaku di atas, jadi panel admin menguji aturan draf dengan engine yang sama dengan aplikasi.
