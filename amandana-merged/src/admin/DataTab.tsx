import { useState } from "react"
import type { Sample, Split } from "./matrix"
import { MIN_HOLDOUT } from "./report"
import { btn, btnDanger, btnPrimary, input, Section } from "./ui"

type Props = { samples: Sample[]; onChange: (next: Sample[]) => void }
const newId = () => `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

export function parseBulk(raw: string, split: Split): Sample[] | string {
  let arr: unknown
  try { arr = JSON.parse(raw) } catch { return "Bukan JSON yang valid." }
  if (!Array.isArray(arr)) return "Harus berupa array JSON."
  const out: Sample[] = []
  for (const [i, x] of arr.entries()) {
    const o = x as Partial<Sample>
    if (typeof o?.text !== "string" || !o.text.trim()) return `Butir ${i + 1}: "text" kosong.`
    if (o.kind !== "Pinjol" && o.kind !== "Investasi") return `Butir ${i + 1}: "kind" harus Pinjol atau Investasi.`
    if (o.label !== "berbahaya" && o.label !== "sah") return `Butir ${i + 1}: "label" harus berbahaya atau sah.`
    out.push({ id: newId() + i, kind: o.kind, label: o.label, split: o.split === "holdout" || o.split === "tuning" ? o.split : split, text: o.text })
  }
  return out
}

export function DataTab({ samples, onChange }: Props) {
  const [filter, setFilter] = useState<"semua" | Split>("semua")
  const [bulk, setBulk] = useState("")
  const [bulkSplit, setBulkSplit] = useState<Split>("holdout")
  const [msg, setMsg] = useState("")
  const patch = (id: string, p: Partial<Sample>) => onChange(samples.map((s) => (s.id === id ? { ...s, ...p } : s)))
  const shown = samples.filter((s) => filter === "semua" || s.split === filter)
  const holdout = samples.filter((s) => s.split === "holdout").length
  const doBulk = () => {
    const r = parseBulk(bulk, bulkSplit)
    if (typeof r === "string") return setMsg(r)
    onChange([...samples, ...r])
    setBulk("")
    setMsg(`${r.length} pesan ditambahkan.`)
  }
  return (
    <div>
      <Section title={`Data uji (${samples.length}): tuning ${samples.length - holdout}, holdout ${holdout}`} hint={`Holdout perlu minimal ${MIN_HOLDOUT} pesan, termasuk banyak pesan sah yang mirip penipuan (menyebut OJK, "cair cepat", reksa dana resmi). Pesan holdout baru sebaiknya ditulis orang yang tidak ikut menyetel aturan.`}>
        <div className="mb-3 flex gap-2">
          {(["semua", "tuning", "holdout"] as const).map((f) => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)} className={`${btn} ${filter === f ? "bg-secondary" : ""}`}>{f}</button>)}
        </div>
        <div className="space-y-2">
          {shown.map((s) => (
            <div key={s.id} className="border border-border p-2">
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                <code className="bg-secondary px-1.5 py-0.5">{s.id}</code>
                <select aria-label={`Jenis ${s.id}`} className="border border-border bg-card px-1 py-1" value={s.kind} onChange={(e) => patch(s.id, { kind: e.target.value as Sample["kind"] })}><option>Pinjol</option><option>Investasi</option></select>
                <select aria-label={`Label ${s.id}`} className="border border-border bg-card px-1 py-1" value={s.label} onChange={(e) => patch(s.id, { label: e.target.value as Sample["label"] })}><option value="berbahaya">berbahaya</option><option value="sah">sah</option></select>
                <select aria-label={`Split ${s.id}`} className="border border-border bg-card px-1 py-1" value={s.split} onChange={(e) => patch(s.id, { split: e.target.value as Split })}><option value="tuning">tuning</option><option value="holdout">holdout</option></select>
                <button className={`${btnDanger} ml-auto`} onClick={() => onChange(samples.filter((x) => x.id !== s.id))}>Hapus</button>
              </div>
              <textarea aria-label={`Teks ${s.id}`} rows={2} className={input} value={s.text} onChange={(e) => patch(s.id, { text: e.target.value })} />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Tambah banyak sekaligus" hint={`Tempel array JSON: [{"kind":"Pinjol","label":"sah","text":"..."}]. Data sintetis atau parafrase saja; jangan tempel pesan asli yang memuat nomor atau nama orang.`}>
        <textarea aria-label="JSON pesan" rows={5} className={`${input} font-mono`} value={bulk} onChange={(e) => setBulk(e.target.value)} />
        <div className="mt-2 flex items-center gap-2">
          <select aria-label="Split bawaan" className="border border-border bg-card px-1 py-1.5 text-xs" value={bulkSplit} onChange={(e) => setBulkSplit(e.target.value as Split)}><option value="holdout">masuk holdout</option><option value="tuning">masuk tuning</option></select>
          <button className={btnPrimary} onClick={doBulk}>Tambahkan</button>
          <span role="status" className="text-xs text-muted-foreground">{msg}</span>
        </div>
      </Section>
    </div>
  )
}
