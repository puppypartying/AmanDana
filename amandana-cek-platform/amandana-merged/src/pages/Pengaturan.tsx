import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { History, Trash2 } from "lucide-react"
import { PageHeading } from "@/components/PageHeading"
import { card, secondaryButton } from "@/components/ui"
import { useAppState } from "@/state/AppState"

const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" })

export function Settings() {
  const navigate = useNavigate()
  const { saveText, setSaveText, history, openFromHistory, deleteAllData } = useAppState()
  const [confirming, setConfirming] = useState(false)
  const [deleted, setDeleted] = useState(false)
  return (
    <div className="animate-enter">
      <PageHeading
        eyebrow="PENGATURAN"
        title="Data kamu, kendali kamu."
        description="Atur apa yang disimpan di perangkat ini, atau hapus semuanya kapan saja."
      />
      <div className="grid items-start gap-5 md:grid-cols-2">
        <section className={`${card} p-5 md:p-6`}>
          <h2 className="text-base font-bold">Simpan teks pesan</h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            Mati secara default. Saat mati, yang disimpan hanya skor, level, dan alasan, tanpa teks pesanmu. Saat menyala, teks disimpan dengan nomor panjang disamarkan.
            Mematikannya kembali menghapus teks yang sudah tersimpan.
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={saveText}
            onClick={() => setSaveText(!saveText)}
            className="mt-4 flex min-h-12 w-full items-center justify-between border border-border px-4 text-xs font-bold"
          >
            {saveText ? "Menyala" : "Mati"}
            <span aria-hidden="true" className={`flex h-6 w-11 items-center rounded-full px-0.5 transition ${saveText ? "bg-primary" : "bg-muted"}`}>
              <span className={`h-5 w-5 rounded-full bg-card shadow transition ${saveText ? "translate-x-5" : ""}`} />
            </span>
          </button>
        </section>
        <section className={`${card} p-5 md:p-6`}>
          <h2 className="text-base font-bold">Hapus semua data saya</h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            Menghapus hasil analisis terakhir, riwayat, checklist bukti, draf template aduan, progres kuis, dan preferensi tema dari perangkat ini. Tidak bisa dibatalkan.
          </p>
          {!confirming ? (
            <button type="button" onClick={() => { setConfirming(true); setDeleted(false) }} className={`${secondaryButton} mt-4 text-destructive`}>
              <Trash2 size={17} /> Hapus semua data saya
            </button>
          ) : (
            <div role="group" aria-label="Konfirmasi hapus data" className="mt-4 border border-destructive p-4">
              <p className="text-xs font-bold">Yakin menghapus semua data?</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { deleteAllData(); setConfirming(false); setDeleted(true) }} className="flex min-h-12 items-center justify-center bg-destructive px-3 text-xs font-bold text-white">
                  Ya, hapus
                </button>
                <button type="button" onClick={() => setConfirming(false)} className={secondaryButton}>
                  Batal
                </button>
              </div>
            </div>
          )}
          {deleted && <p role="status" className="mt-3 text-xs text-muted-foreground">Semua data di perangkat ini sudah dihapus.</p>}
        </section>
        <section className={`${card} p-5 md:p-6 md:col-span-2`}>
          <div className="flex items-center gap-2 text-base font-bold"><History size={18} /> Riwayat analisis ({history.length}/20)</div>
          {history.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Belum ada riwayat.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {history.map((item) => (
                <li key={item.id} className="flex min-h-14 items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold">{item.kind} · Risiko {item.level.toLowerCase()} · {item.score}/100</p>
                    <p className="mt-1 text-xs text-muted-foreground">{dateFormat.format(item.createdAt)}</p>
                  </div>
                  <button type="button" onClick={() => { if (openFromHistory(item.id)) navigate("/hasil") }} className="min-h-12 border border-border px-4 text-xs font-bold text-primary hover:bg-secondary">
                    Buka
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <p className="mt-5 text-xs">
        <Link to="/privasi" className="inline-flex min-h-11 items-center font-semibold text-primary underline">Baca halaman Privasi</Link>
      </p>
    </div>
  )
}
