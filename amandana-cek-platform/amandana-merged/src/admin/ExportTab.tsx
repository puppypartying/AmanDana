import { useState } from "react"
import { type AdminData, download, parseAdminData } from "./store"
import { btn, btnDanger, Section } from "./ui"

export function ExportTab({ data, issues, onReplace, onReset }: { data: AdminData; issues: string[]; onReplace: (d: AdminData) => void; onReset: () => void }) {
  const [msg, setMsg] = useState("")
  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed = parseAdminData(JSON.parse(await file.text()))
      if (!parsed) return setMsg("File bukan paket admin AmanDana yang valid.")
      onReplace(parsed)
      setMsg("Paket diimpor.")
    } catch {
      setMsg("File tidak bisa dibaca.")
    }
  }
  return (
    <div>
      <Section title="Terapkan ke aplikasi" hint="Draf hanya tersimpan di browser ini. Agar berlaku untuk pengguna, ekspor lalu commit ke repo dan deploy ulang.">
        <ol className="mb-3 list-decimal space-y-1 pl-5 text-xs leading-5">
          <li>Unduh <code>rules.json</code> dan timpa <code>src/lib/risk/rules.json</code>.</li>
          <li>Unduh <code>platforms.json</code> dan timpa <code>src/lib/platform/platforms.json</code> (daftar yang dibaca scan di halaman Cek dan Hasil).</li>
          <li>Unduh <code>dataset.json</code> dan timpa <code>src/admin/dataset.json</code> (agar admin berikutnya membawa data uji terbaru).</li>
          <li>Jalankan <code>npm test</code>. Test "sinkron dengan laporan Bab 4.3" sengaja gagal bila bobot berbeda dari laporan; ubah laporan dan test bersama-sama, jangan salah satunya.</li>
          <li>Commit dan deploy.</li>
        </ol>
        {issues.length > 0 && <p className="mb-2 text-xs font-semibold text-destructive">Masih ada {issues.length} masalah pada aturan; perbaiki dulu sebelum mengekspor.</p>}
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={() => download("rules.json", data.rules)}>Unduh rules.json</button>
          <button className={btn} onClick={() => download("dataset.json", data.samples)}>Unduh dataset.json</button>
          <button className={btn} onClick={() => download("platforms.json", data.platforms)}>Unduh platforms.json</button>
          <button className={btn} onClick={() => download("paket-admin.json", data)}>Unduh paket lengkap</button>
        </div>
      </Section>
      <Section title="Impor dan reset">
        <label className="block text-xs">Impor paket lengkap <input type="file" accept="application/json" className="mt-1 block text-xs" onChange={(e) => void onFile(e.target.files?.[0])} /></label>
        <button className={`${btnDanger} mt-3`} onClick={() => { if (window.confirm("Kembalikan aturan, data uji, dan daftar platform ke bawaan? Draf saat ini hilang.")) onReset() }}>Reset ke bawaan</button>
        <p role="status" className="mt-2 text-xs text-muted-foreground">{msg}</p>
      </Section>
    </div>
  )
}
