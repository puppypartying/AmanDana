import { useState } from "react"
import type { GateInfo } from "./api"
import type { AdminStore, PublishOutcome } from "./store"
import { btn, btnDanger, btnPrimary, input, pct, Section } from "./ui"

const when = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
}

/** Bilah status di semua tab: mode, simpan draf, dan peringatan perubahan belum disimpan/terbit. */
export function StatusBar({ store, onOpenPublish }: { store: AdminStore; onOpenPublish: () => void }) {
  const { conn, dirty, busy, hasUnpublished, notice } = store
  return (
    <div className="mt-4 space-y-2">
      {conn.mode === "memeriksa" && <p role="status" className="text-xs text-muted-foreground">Memeriksa koneksi server…</p>}
      {conn.mode === "lokal" && (
        <p role="status" className="border border-border bg-[var(--tone-bg-fcf7e9)] p-3 text-xs leading-5">
          <b>Mode lokal:</b> {conn.reason} Draf hanya tersimpan di browser ini; terapkan lewat tab Ekspor.
        </p>
      )}
      {conn.mode === "server" && (
        <div className="flex flex-wrap items-center gap-2 border border-border bg-card p-3 text-xs">
          <span className="font-semibold">Server tersambung ({conn.email})</span>
          <span className={dirty ? "font-semibold text-destructive" : "text-muted-foreground"}>
            {dirty ? "● Ada perubahan belum disimpan ke server" : hasUnpublished ? "Draf tersimpan, belum terbit" : "Draf sama dengan yang terbit"}
          </span>
          <span className="ml-auto flex gap-2">
            <button className={dirty ? btnPrimary : btn} disabled={busy || !dirty} onClick={() => void store.saveDraft()}>Simpan draf</button>
            {!dirty && hasUnpublished && <button className={btn} onClick={onOpenPublish}>Ke tab Terbit</button>}
          </span>
        </div>
      )}
      {store.localBackup && (
        <p className="border border-border bg-card p-3 text-xs leading-5">
          Ada draf lokal yang berbeda dari server. <button className="font-semibold underline" onClick={store.restoreLocalBackup}>Pulihkan draf lokal</button> (menggantikan draf yang sedang tampil, belum disimpan ke server).
        </p>
      )}
      {notice && (
        <p role={notice.kind === "error" ? "alert" : "status"} className={`border p-3 text-xs leading-5 ${notice.kind === "error" ? "border-destructive text-destructive" : "border-border"}`}>{notice.text}</p>
      )}
    </div>
  )
}

function GateNote({ gate }: { gate: GateInfo }) {
  return (
    <div role="alert" className="mt-3 border border-destructive bg-[var(--tone-bg-fbeceb)] p-3 text-xs leading-5 text-destructive">
      <b>{gate.reason ?? "Metrik holdout di bawah target."}</b>
      <div>Holdout n={gate.n}: precision {pct(gate.precision)}, recall {pct(gate.recall)} (target {pct(gate.target)}, ambang Sedang).</div>
    </div>
  )
}

export function PublishTab({ store }: { store: AdminStore }) {
  const { serverMode, dirty, busy, issues, platformErrors, published, history, draftMeta, rev, hasUnpublished } = store
  const [note, setNote] = useState("")
  const [failure, setFailure] = useState<Extract<PublishOutcome, { ok: false }> | null>(null)
  const [ack, setAck] = useState(false)

  if (!serverMode) {
    return (
      <Section title="Terbit ke pengguna" hint="Tab ini aktif bila server tersambung (Cloudflare Pages Functions + KV). Lihat docs/admin.md untuk pemasangannya. Sementara itu, pakai tab Ekspor.">
        <p className="text-xs">Server belum tersambung. {store.conn.mode === "lokal" ? store.conn.reason : ""}</p>
        <button className={`${btn} mt-3`} disabled={busy} onClick={() => void store.refresh()}>Coba sambungkan lagi</button>
      </Section>
    )
  }

  const nothingNew = !hasUnpublished && !!published
  const blocked = dirty || rev === null || issues.length > 0 || platformErrors.length > 0 || nothingNew
  const doPublish = async () => {
    const r = await store.publish(note, ack)
    if (r.ok) { setNote(""); setAck(false); setFailure(null) } else setFailure(r)
  }
  const doRollback = async (version: number) => {
    if (!window.confirm(`Kembalikan aturan ke versi ${version}? Versi itu diterbitkan ulang sebagai versi baru dan langsung dipakai pengguna.`)) return
    const r = await store.rollback(version, "")
    setFailure(r.ok ? null : r)
  }

  return (
    <div>
      <Section title="Terbitkan aturan dan daftar platform ke pengguna" hint="Aturan dan daftar platform terbit bersama. Yang diterbitkan adalah draf yang tersimpan di server (bukan yang belum disimpan). Aplikasi pengguna mengambilnya saat dibuka dan tetap memakai aturan bawaan bila server tidak terjangkau.">
        <dl className="grid gap-1 text-xs sm:grid-cols-2">
          <div><dt className="inline font-semibold">Versi terbit: </dt><dd className="inline">{published ? `v${published.version} (${when(published.publishedAt)}, ${published.publishedBy})` : "belum ada (pengguna memakai aturan bawaan build)"}</dd></div>
          <div><dt className="inline font-semibold">Draf di server: </dt><dd className="inline">{draftMeta ? `rev ${rev} (${when(draftMeta.updatedAt)}, ${draftMeta.updatedBy})` : "belum ada"}</dd></div>
        </dl>
        {dirty && <p className="mt-3 text-xs font-semibold text-destructive">Simpan draf ke server dulu (tombol di bilah atas).</p>}
        {issues.length > 0 && <p className="mt-3 text-xs font-semibold text-destructive">Perbaiki {issues.length} masalah pada aturan sebelum menerbitkan.</p>}
        {platformErrors.length > 0 && <ul role="alert" className="mt-3 list-disc pl-5 text-xs text-destructive"><li className="font-semibold">Perbaiki daftar platform sebelum menerbitkan (tab Platform):</li>{platformErrors.map((e) => <li key={e}>{e}</li>)}</ul>}
        {!dirty && !hasUnpublished && published && <p className="mt-3 text-xs text-muted-foreground">Draf sama dengan versi terbit; tidak ada yang perlu diterbitkan.</p>}
        <label className="mt-3 block text-xs">Catatan perubahan (opsional)
          <input className={`${input} mt-1`} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. naikkan bobot tenor pendek" />
        </label>
        {failure?.issues && <ul role="alert" className="mt-3 list-disc pl-5 text-xs text-destructive">{failure.issues.map((i) => <li key={i}>{i}</li>)}</ul>}
        {failure && !failure.issues && !failure.gate && <p role="alert" className="mt-3 text-xs text-destructive">{failure.error}</p>}
        {failure?.gate && (
          <>
            <GateNote gate={failure.gate} />
            <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> Saya paham metrik di bawah target dan tetap ingin menerbitkan.</label>
          </>
        )}
        <div className="mt-3">
          <button className={btnPrimary} disabled={busy || blocked || (!!failure?.gate && !ack)} onClick={() => void doPublish()}>
            {busy ? "Memproses…" : failure?.gate ? "Terbitkan tetap" : "Terbitkan ke pengguna"}
          </button>
        </div>
      </Section>
      <Section title={`Riwayat versi terbit (${history.length})`} hint="Maksimal 20 versi terakhir. Rollback menerbitkan ulang isi versi lama sebagai versi baru, jadi riwayat tidak terhapus.">
        {history.length === 0 && <p className="text-xs text-muted-foreground">Belum ada versi terbit.</p>}
        <ul className="space-y-2">
          {history.map((h, i) => (
            <li key={h.version} className="flex flex-wrap items-center gap-2 border border-border p-2 text-xs">
              <b>v{h.version}</b>
              {i === 0 && <span className="bg-secondary px-1.5 py-0.5 font-semibold text-primary">terbit sekarang</span>}
              <span className="text-muted-foreground">{when(h.publishedAt)} · {h.publishedBy}</span>
              {h.note && <span>“{h.note}”</span>}
              {i > 0 && <button className={`${btnDanger} ml-auto`} disabled={busy} onClick={() => void doRollback(h.version)}>Kembalikan ke ini</button>}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
