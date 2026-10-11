// Fixture SINTETIS dibuat tim untuk pengujian (bukan kutipan tawaran nyata).
// label "berbahaya" = seharusnya diwaspadai; "sah" = sah/netral.
export type Fixture = {
  id: string
  kind: 'Pinjol' | 'Investasi'
  label: 'berbahaya' | 'sah'
  text: string
  note?: string
}

export const FIXTURES: Fixture[] = [
  // ---------- 20 BERBAHAYA ----------
  { id: 'd01', kind: 'Investasi', label: 'berbahaya', note: 'Lampiran B contoh 1 (skor 82)', text: 'Dana cair 5 menit tanpa survei! Untung 10% per minggu pasti, ajak teman dapat bonus. Slot terbatas, transfer ke rekening pribadi admin.' },
  { id: 'd02', kind: 'Investasi', label: 'berbahaya', text: 'Join member VIP sekarang, profit harian 3% dijamin pasti cair tiap hari. Setor modal ke rekening pribadi admin Budi ya kak. Kuota tinggal 5 orang!' },
  { id: 'd03', kind: 'Investasi', label: 'berbahaya', text: 'Investasi emas digital, untung 20% per bulan tanpa risiko. Ajak 3 teman langsung dapat bonus 500 ribu per orang. Terdaftar dan diawasi OJK.' },
  { id: 'd04', kind: 'Investasi', label: 'berbahaya', text: 'Robot trading AI profit pasti 5% per hari, deposit minimal 1 juta ke rek pribadi kami. Buruan slot terbatas hari ini!' },
  { id: 'd05', kind: 'Investasi', label: 'berbahaya', text: 'Kripto cuan dijamin 100% balik modal. Direkomendasikan artis dan didukung menteri. Transfer ke rekening pribadi admin untuk aktivasi.' },
  { id: 'd06', kind: 'Investasi', label: 'berbahaya', text: 'Arisan online bagi hasil 15% pasti tiap minggu. Rekrut downline dapat bonus tambahan. Setor ke rekening pribadi koordinator.' },
  { id: 'd07', kind: 'Investasi', label: 'berbahaya', note: 'sulit: janji return tidak memakai kata "pasti" persis', text: 'Peluang terbatas! Modal 500rb jadi 5 juta dalam 7 hari, profit pasti. Jangan sampai kehabisan, daftar sekarang lewat admin WA.' },
  { id: 'd08', kind: 'Investasi', label: 'berbahaya', text: 'Saham fiktif IPO eksklusif, untung dijamin 30% dalam sebulan. Hanya untuk 20 orang pertama, transfer DP ke rekening atas nama pribadi.' },
  { id: 'd09', kind: 'Investasi', label: 'berbahaya', note: 'sulit: "profit konsisten" bukan kata kunci janji pasti', text: 'Bergabung dengan komunitas trader kami. Terdaftar resmi di Bappebti dan OJK. Profit konsisten 8% per minggu, ajak teman join dapat komisi.' },
  { id: 'd10', kind: 'Investasi', label: 'berbahaya', text: 'Cuan pasti tiap hari! Top up lewat rekening pribadi admin, bonus referral buat yang ajak teman. Slot terbatas.' },
  { id: 'd11', kind: 'Pinjol', label: 'berbahaya', note: 'Lampiran B contoh 2 (skor 60)', text: 'Pinjaman cepat tanpa BI checking, wajib akses kontak, potongan admin 20% di muka, tenor 7 hari.' },
  { id: 'd12', kind: 'Pinjol', label: 'berbahaya', text: 'Pinjam 2 juta cair 1,6 juta, tenor 14 hari. Wajib izinkan akses kontak dan galeri. Telat bayar kami sebar foto dan data ke semua kontakmu.' },
  { id: 'd13', kind: 'Pinjol', label: 'berbahaya', text: 'Kalau terlambat bayar kami akan teror keluarga dan atasanmu, data pribadimu kami viralkan. Akses kontak wajib diizinkan.' },
  { id: 'd14', kind: 'Pinjol', label: 'berbahaya', text: 'Dapat dana instan 3 juta tanpa jaminan. Biaya admin dipotong di muka 30%, bunga dan denda sesuai kebijakan aplikasi. Lunas dalam 10 hari.' },
  { id: 'd15', kind: 'Pinjol', label: 'berbahaya', text: 'Pinjaman online cair 10 menit! Syarat KTP dan akses galeri foto kontak. Tenor 5 hari, denda harian tidak dijelaskan.' },
  { id: 'd16', kind: 'Pinjol', label: 'berbahaya', text: 'Kami akan datangi rumah dan kantor kamu kalau gagal bayar, fotomu disebar ke grup. Tenor 7 hari.' },
  { id: 'd17', kind: 'Pinjol', label: 'berbahaya', text: 'Pinjol kilat tanpa survei, potongan di muka 25% dan biaya lain menyusul. Izin akses kontak wajib. Bayar dalam 14 hari.' },
  { id: 'd18', kind: 'Pinjol', label: 'berbahaya', text: 'Hai kak, ada pinjaman dana tunai 5jt, cair hari ini. Aplikasi minta izin kontak dan lokasi. Jika telat, tim kami teror semua kontak darurat.' },
  { id: 'd19', kind: 'Pinjol', label: 'berbahaya', note: 'sulit: potongan disamarkan sebagai "biaya administrasi"', text: 'Dana cair 800 ribu dari pinjaman 1 juta, selisih sebagai biaya administrasi. Tenor 7 hari, bunga dan denda ditentukan kemudian.' },
  { id: 'd20', kind: 'Pinjol', label: 'berbahaya', note: 'KASUS TEMUAN 3: harus Tinggi, bukan 0', text: 'Wajib izinkan akses kontak, kalau telat kami sebar data ke semua kontakmu.' },
  // ---------- 20 SAH / NETRAL ----------
  { id: 's01', kind: 'Pinjol', label: 'sah', note: 'KASUS TEMUAN 1: menyebut "cair" dan "biaya admin", bukan skor 36', text: 'Pinjaman dari bank terdaftar OJK. Dana cair ke rekening atas nama Anda 1 hari kerja setelah disetujui. Biaya admin 1% dijelaskan di awal dan tercantum di perjanjian. Tenor 12 bulan.' },
  { id: 's02', kind: 'Investasi', label: 'sah', note: 'KASUS TEMUAN 2: "tidak menjamin untung" tidak kena +28', text: 'Reksa dana ini tidak menjamin untung dan nilainya bisa turun. Baca prospektus sebelum membeli.' },
  { id: 's03', kind: 'Pinjol', label: 'sah', text: 'Cek legalitas pinjol di situs OJK sebelum meminjam. Pastikan bunga, denda, dan tenor dijelaskan sejak awal.' },
  { id: 's04', kind: 'Pinjol', label: 'sah', note: 'edukasi; boleh kena tanda bahaya tunggal tapi tidak sampai Sedang', text: 'Hati-hati tawaran pinjol: aplikasi yang meminta akses kontak dan galeri adalah tanda bahaya.' },
  { id: 's05', kind: 'Pinjol', label: 'sah', text: 'Kami tidak pernah meminta akses kontak, galeri, atau lokasi Anda.' },
  { id: 's06', kind: 'Pinjol', label: 'sah', text: 'Pinjaman tanpa potongan di muka dan tanpa biaya tersembunyi. Seluruh biaya ditampilkan sebelum Anda setuju. Tenor 6 bulan.' },
  { id: 's07', kind: 'Investasi', label: 'sah', text: 'Ingat, investasi apa pun punya risiko. Jangan percaya janji untung pasti.' },
  { id: 's08', kind: 'Investasi', label: 'sah', text: 'Halo, besok jadi ketemu jam 10 di kantin kampus? Aku bawa catatan kuliah.' },
  { id: 's09', kind: 'Pinjol', label: 'sah', text: 'Tagihan listrik bulan ini Rp350.000, jatuh tempo tanggal 20.' },
  { id: 's10', kind: 'Investasi', label: 'sah', text: 'Promo cashback 10% untuk pembelian pertama di aplikasi kami, berlaku sampai akhir bulan.' },
  { id: 's11', kind: 'Pinjol', label: 'sah', text: 'Bank kami menawarkan KPR tenor 15 tahun dengan bunga tetap 2 tahun pertama. Simulasi lengkap ada di brosur.' },
  { id: 's12', kind: 'Pinjol', label: 'sah', text: 'Pinjaman kampus untuk mahasiswa: bunga 0,5% per bulan, cicilan 12 bulan, tanpa agunan. Pendaftaran lewat bagian kemahasiswaan.' },
  { id: 's13', kind: 'Investasi', label: 'sah', note: 'klaim izin legal; boleh kena +18 tapi tidak sampai Sedang', text: 'Reksa dana pasar uang: imbal hasil tidak dijamin, dapat naik atau turun. Terdaftar dan diawasi OJK.' },
  { id: 's14', kind: 'Investasi', label: 'sah', text: 'Seminar literasi keuangan: kenali ciri investasi bodong, termasuk ajakan rekrut teman dan bonus referral.' },
  { id: 's15', kind: 'Pinjol', label: 'sah', text: 'Pembayaran cicilan motor jatuh tempo 5 hari lagi. Mohon segera dibayar via minimarket atau mobile banking.' },
  { id: 's16', kind: 'Pinjol', label: 'sah', text: 'Terima kasih sudah bergabung. Statement kartu kredit bulan Oktober sudah tersedia di aplikasi.' },
  { id: 's17', kind: 'Investasi', label: 'sah', text: 'Dana darurat sebaiknya 3 sampai 6 kali pengeluaran bulanan, simpan di instrumen yang likuid.' },
  { id: 's18', kind: 'Pinjol', label: 'sah', text: 'Pengajuan KTA: bunga efektif 1,2% per bulan, biaya provisi 1% dipotong dari pencairan dan tertulis jelas di ringkasan produk. Tenor 24 bulan.' },
  { id: 's19', kind: 'Investasi', label: 'sah', text: 'Bagi hasil usaha warung kami 5% dari laba bersih tiap bulan, tergantung penjualan.' },
  { id: 's20', kind: 'Investasi', label: 'sah', text: 'Waspada penipuan: OJK tidak pernah meminta transfer ke rekening pribadi. Laporkan ke kanal resmi.' },
]
