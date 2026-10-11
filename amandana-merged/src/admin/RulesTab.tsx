import { useState } from "react"
import type { createScorer, OfferKind, Rule, RulePattern, RulesData } from "@/lib/risk/engine"
import { REPORT_RULES, REPORT_THRESHOLDS } from "./report"
import { btn, btnDanger, input, Section } from "./ui"

type Props = { rules: RulesData; scorer: ReturnType<typeof createScorer>; onChange: (next: RulesData) => void }

function Tester({ scorer }: { scorer: Props["scorer"] }) {
  const [text, setText] = useState("")
  const [kind, setKind] = useState<OfferKind>("Pinjol")
  const result = text.trim() ? scorer.scoreOffer(text, kind) : null
  const hitFor = (id: string) => {
    const m = result?.matchedRules.find((x) => x.id === id)
    if (!m) return ""
    return `: "${m.evidence}"${m.critical ? " [kritis]" : ""}${m.warning ? " [kalimat peringatan: tidak memicu lantai/kombinasi]" : ""}`
  }
  return (
    <Section title="Uji cepat dengan aturan draf" hint="Tempel satu pesan untuk melihat skor dan aturan yang menyala memakai draf di bawah (belum diterapkan ke aplikasi).">
      <div className="mb-2 flex gap-2">
        {(["Pinjol", "Investasi"] as const).map((k) => (
          <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)} className={`${btn} ${kind === k ? "bg-secondary" : ""}`}>{k}</button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={input} aria-label="Pesan uji" />
      {result && (
        <div className="mt-2 text-xs leading-5">
          <b>Skor {result.score} ({result.level})</b>
          <ul className="mt-1 list-disc pl-5">
            {result.reasons.map((r) => <li key={r.ruleId}>{r.title} (+{r.weight}){hitFor(r.ruleId)}</li>)}
            {result.reasons.length === 0 && <li>Tidak ada aturan yang menyala.</li>}
          </ul>
        </div>
      )}
    </Section>
  )
}

export function RulesTab({ rules, scorer, onChange }: Props) {
  const patchRule = (id: string, patch: Partial<Rule>) => onChange({ ...rules, rules: rules.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const patchPattern = (r: Rule, i: number, patch: Partial<RulePattern>) => patchRule(r.id, { patterns: r.patterns.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
  const t = rules.thresholds
  const th = (k: "sedang" | "tinggi", v: number) => onChange({ ...rules, thresholds: { ...t, [k]: v } })
  const addRule = () => {
    const id = `baru-${rules.rules.length + 1}`
    onChange({ ...rules, rules: [...rules.rules, { id, category: "umum", weight: 10, icon: "TriangleAlert", enabled: false, label: "Aturan baru", explanation: "", patterns: [{ re: "", inner: true }] }] })
  }
  return (
    <div>
      <Tester scorer={scorer} />
      <Section title="Ambang level" hint={`Laporan Bab 4.3: Sedang ${REPORT_THRESHOLDS.sedang}, Tinggi ${REPORT_THRESHOLDS.tinggi}.`}>
        <div className="flex gap-3">
          <label className="text-xs">Sedang <input type="number" className={input} value={t.sedang} onChange={(e) => th("sedang", Number(e.target.value))} /></label>
          <label className="text-xs">Tinggi <input type="number" className={input} value={t.tinggi} onChange={(e) => th("tinggi", Number(e.target.value))} /></label>
        </div>
      </Section>
      <Section title={`Aturan (${rules.rules.length})`} hint="Pola memakai regex pada teks yang sudah dinormalkan (huruf kecil). <G3> berarti sampai 3 kata sela. Centang 'abaikan bila dinegasi' agar 'tidak ... ' tidak menyalakan aturan.">
        <div className="space-y-3">
          {rules.rules.map((r) => {
            const rep = REPORT_RULES[r.id]
            const diff = !rep ? (r.source && r.source !== "laporan-4.3" ? `di luar laporan (${r.source})` : "tidak ada di laporan") : rep.weight !== r.weight || rep.category !== r.category ? `laporan: ${rep.weight} (${rep.category})` : null
            return (
              <div key={r.id} className={`border p-3 ${r.enabled ? "border-border" : "border-dashed border-border opacity-70"}`}>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label className="flex items-center gap-1 font-semibold"><input type="checkbox" checked={r.enabled} onChange={(e) => patchRule(r.id, { enabled: e.target.checked })} /> aktif</label>
                  <code className="bg-secondary px-1.5 py-0.5">{r.id}</code>
                  <select aria-label={`Kategori ${r.id}`} className="border border-border bg-card px-1 py-1" value={r.category} onChange={(e) => patchRule(r.id, { category: e.target.value })}>
                    <option value="umum">umum</option><option value="pinjol">pinjol</option><option value="investasi">investasi</option>
                  </select>
                  <label className="flex items-center gap-1">bobot <input type="number" aria-label={`Bobot ${r.id}`} className="w-16 border border-border bg-card px-1 py-1" value={r.weight} onChange={(e) => patchRule(r.id, { weight: Number(e.target.value) })} /></label>
                  <label className="flex items-center gap-1">tingkat
                    <select aria-label={`Tingkat ${r.id}`} className="border border-border bg-card px-1 py-1" value={r.severity ?? ""} onChange={(e) => patchRule(r.id, { severity: e.target.value === "kritis" ? "kritis" : undefined })}>
                      <option value="">biasa</option><option value="kritis">kritis</option>
                    </select>
                  </label>
                  {diff && <span className="bg-[var(--tone-bg-fcf7e9)] px-1.5 py-0.5 font-semibold text-[var(--tone-text-aa7c29)]">≠ {diff}</span>}
                  <button className={`${btnDanger} ml-auto`} onClick={() => onChange({ ...rules, rules: rules.rules.filter((x) => x.id !== r.id) })}>Hapus</button>
                </div>
                <input aria-label={`Judul ${r.id}`} className={`${input} mt-2`} value={r.label} onChange={(e) => patchRule(r.id, { label: e.target.value })} />
                <textarea aria-label={`Penjelasan ${r.id}`} rows={2} className={`${input} mt-2`} value={r.explanation} onChange={(e) => patchRule(r.id, { explanation: e.target.value })} />
                <div className="mt-2 space-y-1.5">
                  {r.patterns.map((p, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <input aria-label={`Pola ${i + 1} ${r.id}`} className={`${input} min-w-[12rem] flex-1 font-mono`} value={p.re} onChange={(e) => patchPattern(r, i, { re: e.target.value })} />
                      <label className="flex shrink-0 items-center gap-1 text-xs"><input type="checkbox" checked={p.inner} onChange={(e) => patchPattern(r, i, { inner: e.target.checked })} /> abaikan bila dinegasi</label>
                      <label className="flex shrink-0 items-center gap-1 text-xs" title="Dicocokkan ke teks asli (huruf kecil), bukan teks yang sudah dinormalkan. Untuk URL dan 'a.n. Nama'."><input type="checkbox" aria-label={`Pola raw ${i + 1} ${r.id}`} checked={p.raw === true} onChange={(e) => patchPattern(r, i, { raw: e.target.checked || undefined })} /> teks asli</label>
                      <label className="flex shrink-0 items-center gap-1 text-xs" title="Pola ini saja sudah sinyal kritis."><input type="checkbox" aria-label={`Pola kritis ${i + 1} ${r.id}`} checked={p.critical === true} onChange={(e) => patchPattern(r, i, { critical: e.target.checked || undefined })} /> kritis</label>
                      <button className={btn} aria-label={`Hapus pola ${i + 1} ${r.id}`} onClick={() => patchRule(r.id, { patterns: r.patterns.filter((_, j) => j !== i) })}>×</button>
                    </div>
                  ))}
                  <button className={btn} onClick={() => patchRule(r.id, { patterns: [...r.patterns, { re: "", inner: true }] })}>+ Pola</button>
                </div>
              </div>
            )
          })}
        </div>
        <button className={`${btn} mt-3`} onClick={addRule}>+ Aturan baru</button>
      </Section>
      <Section title="Sinyal kritis dan kalimat peringatan (tidak ada di laporan)" hint="Satu sinyal kritis (aturan atau pola bertanda kritis) menaikkan skor ke lantai di bawah. Kecocokan di kalimat yang memuat penanda peringatan tetap dihitung bobotnya, tetapi tidak memicu lantai atau kombinasi.">
        <label className="text-xs">Lantai skor sinyal kritis
          <input type="number" aria-label="Lantai sinyal kritis" className={`${input} w-24`} value={rules.severityFloors.kritis} onChange={(e) => onChange({ ...rules, severityFloors: { ...rules.severityFloors, kritis: Number(e.target.value) } })} />
        </label>
        <label className="mt-3 block text-xs">Penanda kalimat peringatan (satu per baris, huruf kecil, tanpa tanda baca)
          <textarea aria-label="Penanda peringatan" rows={5} className={`${input} font-mono`} value={rules.warningMarkers.join("\n")} onChange={(e) => onChange({ ...rules, warningMarkers: e.target.value.split("\n") })} />
        </label>
      </Section>
      <Section title="Lantai skor (tidak ada di laporan)" hint="Menaikkan skor minimal bila aturan tertentu menyala. Hapus untuk kembali ke penjumlahan murni Bab 4.3.">
        {rules.combos.map((c) => (
          <div key={c.id} className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <code className="bg-secondary px-1.5 py-0.5">{c.id}</code> bila {c.requires.join(" + ")}{c.minOthers ? ` + ${c.minOthers} aturan lain` : ""} → minimal
            <input type="number" aria-label={`Skor minimal ${c.id}`} className="w-16 border border-border bg-card px-1 py-1" value={c.minScore} onChange={(e) => onChange({ ...rules, combos: rules.combos.map((x) => (x.id === c.id ? { ...x, minScore: Number(e.target.value) } : x)) })} />
            <button className={btnDanger} onClick={() => onChange({ ...rules, combos: rules.combos.filter((x) => x.id !== c.id) })}>Hapus</button>
          </div>
        ))}
      </Section>
    </div>
  )
}
