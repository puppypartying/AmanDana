import { Link } from "react-router"
import { Info } from "lucide-react"
import { card } from "@/components/ui"

export function HowItWorks() {
  return (
    <section aria-labelledby="cara-kerja" className={`${card} mb-5 border-l-4 border-l-primary p-5`}>
      <h2 id="cara-kerja" className="flex items-center gap-2 text-sm font-bold">
        <Info size={16} aria-hidden="true" /> Cara kerja dan batasan
      </h2>
      <div className="mt-3 grid gap-4 text-xs leading-6 text-muted-foreground md:grid-cols-2">
        <div>
          <h3 className="font-bold text-foreground">Yang dicek</h3>
          <p className="mt-1">
            Teks yang kamu tempel dicocokkan dengan pola tanda bahaya yang umum pada penipuan pinjaman dan investasi, misalnya janji untung pasti, ajakan transfer ke rekening pribadi, permintaan akses kontak atau galeri, ancaman saat penagihan, potongan di muka, tenor sangat pendek, serta bunga dan denda yang tidak dijelaskan. Skor dihitung dari pola yang cocok, dan setiap alasan ditampilkan.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-foreground">Yang tidak dicek</h3>
          <p className="mt-1">
            Izin atau legalitas perusahaan di OJK, keaslian rekening, nomor telepon, tautan, atau aplikasi, identitas pengirim, isi gambar atau tangkapan layar, dan konteks percakapan di luar teks yang kamu tempel.
          </p>
        </div>
      </div>
      <p className="mt-4 bg-secondary px-3 py-2 text-xs font-bold leading-6 text-primary">
        Tidak ada tanda bahaya ≠ aman. Skor rendah hanya berarti pola yang kami kenal tidak muncul. Periksa legalitas lewat kanal resmi sebelum transfer.
      </p>
      <p className="mt-3 text-xs">
        <Link to="/privasi" className="inline-flex min-h-11 items-center font-semibold text-primary underline">Bagaimana datamu diperlakukan</Link>
      </p>
    </section>
  )
}
