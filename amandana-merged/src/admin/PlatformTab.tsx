import { useMemo, useState } from "react"
import { guessType, parsePlatformText, validatePlatforms } from "@/lib/platform/import"
import { checkPlatform } from "@/lib/platform/match"
import { findingLabel, statusView } from "@/lib/platform/present"
import type { Platform } from "@/lib/platform/types"
import { btn, btnDanger, btnPrimary, input, Section } from "./ui"

const sel = "border border-border bg-card px-2 py-1.5 text-xs"

export function PlatformTab({ platforms, onChange }: { platforms: Platform[]; onChange: (next: Platform[]) => void }) {
  const [value, setValue] = useState("")
  const [type, setType] = useState<Platform["type"] | "auto">("auto")
  const [status, setStatus] = useState<Platform["status"]>("red-flag")
  const [domains, setDomains] = useState("")
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")
  const [bulk, setBulk] = useState("")
  const [bulkStatus, setBulkStatus] = useState<Platform["status"]>("red-flag")
  const [msg, setMsg] = useState("")
  const [probe, setProbe] = useState("")
  const [filter, setFilter] = useState("")
  const issues = useMemo(() => validatePlatforms(platforms), [platforms])
  const probeResult = useMemo(() => (probe.trim() ? checkPlatform(probe, platforms) : null), [probe, platforms])
  const shown = platforms.filter((p) => !filter || `${p.value} ${p.note}`.toLowerCase().includes(filter.toLowerCase()))

  const add = () => {
    if (!value.trim()) return
    const t = type === "auto" ? guessType(value.trim()) : type
    const doms = status === "resmi" ? domains.split(/[\s,]+/).filter(Boolean) : []
    onChange([...platforms, { id: `p${Date.now().toString(36)}`, value: value.trim(), type: t, status, note: note.trim(), ...(doms.length ? { domains: doms } : {}), ...(date ? { sourceDate: date } : {}) }])
    setValue(""); setNote(""); setDomains(""); setDate("")
  }
  const runBulk = () => {
    const r = parsePlatformText(bulk, bulkStatus, platforms)
    if (r.entries.length) onChange([...platforms, ...r.entries])
    // Baris bermasalah dibiarkan di kotak agar bisa diperbaiki; yang sudah masuk dibuang dari kotak.
    const bad = new Set(r.errors.map((e) => e.line))
    setBulk(bulk.split(/\r?\n/).filter((l, i) => bad.has(i + 1)).join("\n"))
    setMsg(`${r.entries.length} entri ditambahkan, ${r.duplicates} ganda dilewati, ${r.errors.length} baris bermasalah.${r.errors.length ? " " + r.errors.map((e) => `Baris ${e.line}: ${e.reason}`).join(" ") : ""}`)
  }

  return (
    <div>
      <Section title="Daftar platform, tautan, dan akun" hint="Daftar ini dipakai scan di halaman Cek dan Hasil setelah diterbitkan (tab Terbit, tanpa deploy) atau, di mode lokal, diekspor (platforms.json) dan di-deploy. Isi HANYA dari sumber resmi (OJK/Satgas PASTI), catat tanggal sumbernya. Jangan mengisi dari ingatan: status legal/ilegal sebuah perusahaan harus bisa dibuktikan.">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input aria-label="Nilai" className={input} placeholder="Nama platform, domain/tautan, nomor, atau @akun" value={value} onChange={(e) => setValue(e.target.value)} />
          <select aria-label="Tipe" className={sel} value={type} onChange={(e) => setType(e.target.value as Platform["type"] | "auto")}><option value="auto">tipe otomatis</option><option value="nama">nama</option><option value="tautan">tautan</option><option value="akun">akun</option></select>
          <select aria-label="Status" className={sel} value={status} onChange={(e) => setStatus(e.target.value as Platform["status"])}><option value="red-flag">red-flag</option><option value="resmi">resmi</option></select>
        </div>
        {status === "resmi" && <input aria-label="Domain resmi" className={`${input} mt-2`} placeholder="Domain resmi (pisah spasi), mis. contoh.co.id contoh.id. Wajib untuk mendeteksi tautan palsu." value={domains} onChange={(e) => setDomains(e.target.value)} />}
        <div className="mt-2 grid gap-2 sm:grid-cols-[auto_1fr]">
          <input aria-label="Tanggal sumber" type="date" className={sel} value={date} onChange={(e) => setDate(e.target.value)} />
          <input aria-label="Catatan dan sumber" className={input} placeholder="Catatan / sumber (mis. rilis Satgas PASTI)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className={`${btnPrimary} mt-2`} onClick={add}>Tambah</button>
      </Section>

      <Section title="Impor massal" hint="Tempel daftar resmi, satu entri per baris. Kolom dipisah | atau ; atau tab, urutan bebas: nilai | tipe | status | domain resmi | tanggal YYYY-MM-DD | catatan. Tipe ditebak bila tidak ditulis, status memakai pilihan di bawah. Baris berawalan # diabaikan.">
        <textarea aria-label="Daftar untuk diimpor" className={`${input} min-h-28 font-mono`} placeholder={"Nama Platform\nhttps://contoh.example/promo | red-flag | 2026-09-01 | rilis Satgas PASTI\n0812-0000-0000\nPT Nama Resmi | resmi | namaresmi.co.id | 2026-09-01"} value={bulk} onChange={(e) => setBulk(e.target.value)} />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select aria-label="Status bawaan impor" className={sel} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as Platform["status"])}><option value="red-flag">status bawaan: red-flag</option><option value="resmi">status bawaan: resmi</option></select>
          <button className={btn} onClick={runBulk} disabled={!bulk.trim()}>Impor</button>
        </div>
        {msg && <p role="status" className="mt-2 text-xs leading-5 text-muted-foreground">{msg}</p>}
      </Section>

      <Section title="Uji cepat" hint="Tempel pesan atau tautan untuk melihat apa yang ditemukan scan dengan daftar draf ini.">
        <textarea aria-label="Pesan uji" className={`${input} min-h-16`} value={probe} onChange={(e) => setProbe(e.target.value)} placeholder="Tempel pesan, nama platform, atau tautan" />
        {probeResult && (
          <div className="mt-2 text-xs leading-5">
            <p><b>{statusView(probeResult).title}</b> ({probeResult.status}; daftar {probeResult.listSize} entri)</p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {probeResult.findings.map((f, i) => <li key={i}>{f.kind} <b>{f.input}</b>: {findingLabel[f.status]}{f.entry ? ` ← ${f.entry.value}` : ""}</li>)}
              {probeResult.signals.map((s) => <li key={s.id}>sinyal: {s.label} (+{s.weight}){s.host ? `, ${s.host}` : ""}</li>)}
              {probeResult.findings.length === 0 && probeResult.signals.length === 0 && <li>Tidak ada nama, tautan, atau akun yang terbaca.</li>}
            </ul>
          </div>
        )}
      </Section>

      <Section title={`Isi daftar (${platforms.length})`}>
        {issues.length > 0 && (
          <div role="alert" className="mb-3 border border-destructive bg-[var(--tone-bg-fbeceb)] p-3 text-xs leading-5 text-destructive">
            <b>{issues.length} masalah pada daftar platform:</b>
            <ul className="list-disc pl-5">{issues.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        )}
        {platforms.length > 8 && <input aria-label="Cari" className={`${input} mb-2`} placeholder="Cari…" value={filter} onChange={(e) => setFilter(e.target.value)} />}
        <ul className="divide-y divide-border border border-border text-xs">
          {platforms.length === 0 && <li className="p-2 text-muted-foreground">Belum ada entri. Selama kosong, scan hanya menilai bentuk tautan; status legalitas tampil sebagai &ldquo;daftar belum diisi&rdquo;.</li>}
          {shown.map((p) => (
            <li key={p.id} className="flex items-center gap-2 p-2">
              <span className={`px-1.5 py-0.5 font-semibold ${p.status === "red-flag" ? "bg-[var(--tone-bg-fbeceb)] text-destructive" : "bg-secondary text-primary"}`}>{p.status}</span>
              <span className="min-w-0 flex-1 break-words"><b>{p.value}</b> ({p.type}){p.domains?.length ? ` [${p.domains.join(", ")}]` : ""}{p.sourceDate ? ` ${p.sourceDate}` : ""}{p.note ? `: ${p.note}` : ""}</span>
              <button className={btnDanger} aria-label={`Hapus ${p.value}`} onClick={() => onChange(platforms.filter((x) => x.id !== p.id))}>Hapus</button>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
