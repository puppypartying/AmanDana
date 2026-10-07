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
