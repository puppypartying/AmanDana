import { Link } from "react-router"
import { PageHeading } from "@/components/PageHeading"
import { card } from "@/components/ui"

// TODO: verifikasi klaim "tanpa pelacak" setiap kali ada analytics/pihak ketiga baru (PLAN.md Fase 7 #11)
// dan lengkapi catatan log teknis hosting setelah hosting dipilih (PLAN.md Fase 6).
const sections: { title: string; body: string[] }[] = [
  {
    title: "Diproses di perangkatmu",
    body: [
      "Analisis berjalan di browser kamu. Teks yang kamu tempel tidak dikirim ke server kami maupun pihak lain, dan aplikasi ini tidak memakai akun, pelacak, atau analitik.",
      "Saat dibuka, aplikasi mengunduh daftar aturan deteksi terbaru dari server kami. Itu permintaan biasa tanpa teks atau data darimu. Jika gagal, aplikasi memakai aturan yang sudah ada.",
      "Seperti situs web pada umumnya, penyedia hosting dapat mencatat akses teknis (misalnya alamat IP) saat halaman dimuat. Itu terpisah dari teks yang kamu analisis.",
    ],
  },
  {
    title: "Yang disimpan di perangkat ini",
    body: [
      "Hasil analisis terakhir dan riwayat (maksimal 20): skor, level risiko, dan alasannya.",
      "Salinan aturan deteksi terbaru (bukan data pribadi), supaya tetap bisa dipakai tanpa internet.",
      "Checklist bukti, progres kuis, dan preferensi tema terang atau gelap.",
      "Draf template aduan, persis seperti yang kamu ketik. Jika perangkat dipakai bersama, hindari mengisi data sensitif di draf itu.",
      "Teks pesanmu hanya disimpan jika kamu menyalakan \"Simpan teks pesan\" di Pengaturan (default mati).",
    ],
  },
  {
    title: "Yang tidak disimpan",
    body: [
      "Teks mentah pesan (kecuali toggle di atas menyala) dan potongan kalimat yang cocok dengan aturan.",
      "Nomor rekening, telepon, OTP, dan PIN disamarkan otomatis pada teks yang ditampilkan ulang atau disimpan. Pendeteksiannya berbasis pola sehingga tidak sempurna, jadi jangan menempel data yang tidak perlu.",
    ],
  },
  {
    title: "Cara menghapus",
    body: [
      "Buka Pengaturan lalu pilih \"Hapus semua data saya\". Semua data di atas dihapus dari perangkat ini.",
      "Kamu juga bisa menghapus data situs lewat pengaturan browser.",
    ],
  },
]

export function Privacy() {
  return (
    <div className="animate-enter">
      <PageHeading
        eyebrow="PRIVASI"
        title="Datamu tetap di perangkatmu."
        description="Ringkasan apa yang diproses, apa yang disimpan, dan cara menghapusnya."
      />
      <div className="grid items-start gap-5 md:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className={`${card} p-5 md:p-6`}>
            <h2 className="text-base font-bold">{section.title}</h2>
            <ul className="mt-3 space-y-3 text-xs leading-6 text-muted-foreground">
              {section.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-5 text-xs">
        <Link to="/pengaturan" className="inline-flex min-h-11 items-center font-semibold text-primary underline">Buka Pengaturan</Link>
      </p>
    </div>
  )
}
