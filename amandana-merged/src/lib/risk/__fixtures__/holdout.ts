// Set HOLDOUT: ditulis SEBELUM engine v2 diubah, dan tidak dipakai menyetel aturan.
// Jangan ubah isi atau label setelah engine v2 diukur; kalau ada aturan disetel berdasarkan
// kegagalan di sini, set ini tidak lagi "bersih" dan harus diganti dengan pesan baru.
// Pesan SINTETIS (ditulis penyusun), bukan kutipan tawaran nyata. Terbatas: ditulis oleh orang yang
// sama dengan yang menulis aturan, jadi tetap optimistis dibanding pesan di lapangan.
import type { Fixture } from './offers'

export const HOLDOUT: Fixture[] = [
  // ---------- 15 BERBAHAYA ----------
  { id: 'h01', kind: 'Investasi', label: 'berbahaya', text: 'Halo kak, gabung grup trading AI kami yuk. Robot kami auto profit 2% sehari, tinggal duduk manis. Min. depo Rp500.000 aja. Withdraw bisa kapan aja.' },
  { id: 'h02', kind: 'Investasi', label: 'berbahaya', text: 'KERJA PART TIME dari rumah! Cukup like & subscribe channel, 1 tugas dibayar Rp25.000. Untuk aktivasi akun silakan deposit Rp300.000 dulu ke rekening BCA a.n. Siti Rahma, nanti dikembalikan + komisi.' },
  { id: 'h03', kind: 'Pinjol', label: 'berbahaya', text: 'Selamat! Pengajuan pinjaman Rp3.000.000 disetujui. Sebelum dana cair, mohon transfer biaya asuransi Rp450.000 ke rekening 8801234567 a.n. Dewi Lestari agar pinjaman bisa diproses.' },
  { id: 'h04', kind: 'Pinjol', label: 'berbahaya', text: 'Pinjaman Rp1.000.000 cair Rp700.000, tenor 10 hari. Bunga denda 1% per hari. Pencairan 3 menit, tanpa BI checking.' },
  { id: 'h05', kind: 'Pinjol', label: 'berbahaya', text: 'Untuk melanjutkan, kirimkan kode OTP yang masuk ke HP Anda kepada petugas kami agar pinjaman Rp5 juta segera cair.' },
  { id: 'h06', kind: 'Pinjol', label: 'berbahaya', text: 'Download aplikasi pinjaman resmi kami lewat file APK ini (bukan dari Playstore ya kak), nanti aplikasinya minta izin kontak dan galeri buat verifikasi.' },
  { id: 'h07', kind: 'Pinjol', label: 'berbahaya', text: 'Jika kamu telat bayar, kami akan hubungi semua nomor di kontakmu dan sebarkan fotomu ke grup RT. Bayar sebelum jam 5 sore!' },
  { id: 'h08', kind: 'Investasi', label: 'berbahaya', text: 'Saldo kamu Rp12.000.000 sudah bisa ditarik, tapi harus bayar pajak penarikan 15% dulu ke akun admin, kalau tidak saldo hangus.' },
  { id: 'h09', kind: 'Investasi', label: 'berbahaya', text: 'Return 12% per minggu untuk member Gold. Dijamin aman, modal kembali 100%. Transfer ke rekening a/n Agus Prasetyo ya.' },
  { id: 'h10', kind: 'Investasi', label: 'berbahaya', text: 'Investasi kripto terbaru dari PT Mega Cuan Abadi, resmi terdaftar OJK dan Bappebti, profit harian 1,5% tanpa risiko. Cek link bit.ly/megacuan2026.' },
  { id: 'h11', kind: 'Pinjol', label: 'berbahaya', text: 'Pinj4man dana t00nai cair 10 mnt, wajib iz1n akses k0ntak & galeri y kak, klo tlat kami bongkar aib kmu ke kluarga.' },
  { id: 'h12', kind: 'Investasi', label: 'berbahaya', text: 'Modal Rp1 juta jadi Rp8 juta dalam 7 hari! Ajak 2 orang teman, dapat bonus saldo. Slot hanya 10 orang.' },
  { id: 'h13', kind: 'Pinjol', label: 'berbahaya', text: 'Tenor 7 hari, pinjam Rp800.000 terima bersih Rp560.000. Ada denda keterlambatan Rp50.000 per hari.' },
  { id: 'h14', kind: 'Investasi', label: 'berbahaya', text: 'Gabung komunitas saham VIP. Admin akan bantu deposit via rek pribadi admin. Profit dibagi tiap Jumat, bonus ajak member baru.' },
  { id: 'h15', kind: 'Pinjol', label: 'berbahaya', text: 'Kami dari CS pinjaman online. Untuk verifikasi data, tolong sebutkan PIN dan kode verifikasi SMS yang kamu terima.' },
  // ---------- 15 SAH / NETRAL ----------
  { id: 'h16', kind: 'Pinjol', label: 'sah', text: 'Kredit Multiguna Bank ABC: plafon sampai Rp50.000.000, tenor 12-48 bulan, bunga 0,9% per bulan efektif. Biaya provisi 1% dipotong dari pencairan, dijelaskan di ringkasan informasi produk. Terdaftar dan diawasi OJK.' },
  { id: 'h17', kind: 'Pinjol', label: 'sah', text: 'Ingat ya, jangan pernah berikan kode OTP atau PIN kamu ke siapa pun, termasuk yang mengaku dari bank atau pinjol.' },
  { id: 'h18', kind: 'Pinjol', label: 'sah', text: 'Kode OTP Anda 482913. Berlaku 5 menit. Jangan berikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari kami.' },
  { id: 'h19', kind: 'Pinjol', label: 'sah', text: 'Aplikasi kami hanya meminta akses kamera untuk foto KTP, mikrofon, dan lokasi. Kami tidak mengakses kontak, galeri, maupun SMS kamu.' },
  { id: 'h20', kind: 'Investasi', label: 'sah', text: 'Deposito berjangka 6 bulan bunga 4,25% per tahun, dijamin LPS sesuai ketentuan. Minimal penempatan Rp8.000.000. Info lengkap di cabang terdekat.' },
  { id: 'h21', kind: 'Investasi', label: 'sah', text: 'Reksa dana saham pernah memberi return 14% dalam setahun, tetapi kinerja masa lalu tidak menjamin hasil di masa depan dan nilainya dapat turun.' },
  { id: 'h22', kind: 'Pinjol', label: 'sah', text: 'Koperasi kampus menawarkan pinjaman Rp2.000.000, cicilan Rp180.000 x 12 bulan, tanpa potongan di muka. Syarat: KTM aktif dan slip beasiswa atau gaji.' },
  { id: 'h23', kind: 'Pinjol', label: 'sah', text: 'Hai Rina, pinjaman koperasimu Rp1.500.000 jatuh tempo 25 Oktober. Kamu bisa bayar lewat transfer ke rekening koperasi atas nama Koperasi Maju Bersama.' },
  { id: 'h24', kind: 'Investasi', label: 'sah', text: 'Download aplikasi resmi kami dari Google Play Store atau App Store. Hindari mengunduh file APK dari link yang tidak dikenal.' },
  { id: 'h25', kind: 'Investasi', label: 'sah', text: 'Seminar gratis: kenali modus investasi bodong, yaitu janji profit harian, robot trading, dan skema ajak teman. Daftar di s.id/semin-literasi' },
  { id: 'h26', kind: 'Pinjol', label: 'sah', text: 'Tagihan kartu kredit Anda Rp2.350.000 jatuh tempo 28 Oktober. Bayar via mobile banking atau minimarket.' },
  { id: 'h27', kind: 'Investasi', label: 'sah', text: 'Aku lagi belajar saham nih. Return IHSG minggu ini naik 1,2% tapi aku masih rugi 3% hehe. Kamu gimana?' },
  { id: 'h28', kind: 'Investasi', label: 'sah', text: 'Promo emas digital: cashback Rp25.000 untuk pembelian pertama, berlaku sampai 31 Oktober. Harga emas bisa naik atau turun.' },
  { id: 'h29', kind: 'Pinjol', label: 'sah', text: 'Biaya admin 2% dipotong saat pencairan dan tertulis jelas di perjanjian. Pinjaman Rp3.000.000 tenor 6 bulan, bunga 1,2% per bulan.' },
  { id: 'h30', kind: 'Pinjol', label: 'sah', text: 'Isi nomor kontak darurat (orang tua atau saudara) di formulir pengajuan. Kami hanya menghubungi bila kamu tidak bisa dihubungi, bukan untuk menagih mereka.' },
]
