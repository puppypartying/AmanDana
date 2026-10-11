import { type AdminData } from "./store"
import { buildReport, type Cell, type KindKey, type Split, type SplitReport } from "./matrix"
import { MIN_HOLDOUT, TARGET } from "./report"
import { pct, Section } from "./ui"
import type { createScorer } from "@/lib/risk/engine"

const KINDS: KindKey[] = ["Semua", "Pinjol", "Investasi"]

function Metric({ value }: { value: number | null }) {
  const ok = value !== null && value >= TARGET
  return <td className={`px-2 py-1.5 font-semibold ${value === null ? "" : ok ? "text-primary" : "text-destructive"}`}>{pct(value)}</td>
}

function ConfusionTable({ title, cells }: { title: string; cells: Record<KindKey, Cell> }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <p className="mb-1 text-xs font-bold">{title}</p>
      <table className="w-full min-w-[420px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-2 py-1.5">Jenis</th><th className="px-2">TP</th><th className="px-2">FP</th><th className="px-2">FN</th><th className="px-2">TN</th>
            <th className="px-2">Precision</th><th className="px-2">Recall</th><th className="px-2">F1</th>
          </tr>
        </thead>
        <tbody>
          {KINDS.map((k) => (
            <tr key={k} className="border-b border-border">
              <td className="px-2 py-1.5 font-semibold">{k}</td>
              <td className="px-2">{cells[k].tp}</td><td className="px-2">{cells[k].fp}</td><td className="px-2">{cells[k].fn}</td><td className="px-2">{cells[k].tn}</td>
              <Metric value={cells[k].precision} /><Metric value={cells[k].recall} /><Metric value={cells[k].f1} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SplitSection({ split, report, thresholds }: { split: Split; report: SplitReport; thresholds: { sedang: number; tinggi: number } }) {
  const wrong = report.rows.filter((r) => (r.score >= thresholds.sedang) !== (r.sample.label === "berbahaya"))
  return (
    <Section
      title={split === "tuning" ? "Data tuning (boleh dipakai menyetel aturan)" : "Data holdout (hanya dibaca, jangan dipakai menyetel)"}
      hint={`${report.n} pesan: ${report.dangerous} berbahaya, ${report.legit} sah. Positif = skor >= ambang. Hijau = memenuhi target Bab 7.4 (${TARGET * 100}%).`}
    >
      {split === "holdout" && report.n < MIN_HOLDOUT && (
        <p className="mb-3 border border-[var(--tone-border-e9e5d9)] bg-[var(--tone-bg-faf8f1)] p-2 text-xs leading-5">
          Holdout baru {report.n} pesan (disarankan minimal {MIN_HOLDOUT}). Dengan data sekecil ini satu pesan salah menggeser angka banyak persen, jadi jangan dikutip di laporan.
        </p>
      )}
      <ConfusionTable title={`Ambang Sedang (>= ${thresholds.sedang})`} cells={report.at.sedang} />
      <ConfusionTable title={`Ambang Tinggi (>= ${thresholds.tinggi})`} cells={report.at.tinggi} />
      <p className="mb-1 text-xs font-bold">Salah klasifikasi di ambang Sedang ({wrong.length})</p>
      {wrong.length === 0 ? <p className="mb-4 text-xs text-muted-foreground">Tidak ada.</p> : (
        <ul className="mb-4 divide-y divide-border border border-border text-xs">
          {wrong.map((r) => (
            <li key={r.sample.id} className="p-2 leading-5">
              <b>{r.sample.id}</b> {r.sample.kind}, label <b>{r.sample.label}</b>, skor <b>{r.score}</b> ({r.level}). Aturan: {r.rules.join(", ") || "-"}
              <br /><span className="text-muted-foreground">{r.sample.text}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mb-1 text-xs font-bold">Seberapa sering tiap aturan menyala</p>
      <table className="w-full border-collapse text-left text-xs">
        <thead><tr className="border-b border-border text-muted-foreground"><th className="px-2 py-1.5">Aturan</th><th className="px-2">Di pesan berbahaya</th><th className="px-2">Di pesan sah</th><th className="px-2">Presisi aturan</th></tr></thead>
        <tbody>
          {report.rules.map((s) => (
            <tr key={s.id} className="border-b border-border">
              <td className="px-2 py-1.5">{s.id}</td><td className="px-2">{s.onDangerous}</td>
              <td className={`px-2 ${s.onLegit > 0 ? "font-semibold text-destructive" : ""}`}>{s.onLegit}</td><td className="px-2">{pct(s.precision)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}

export function MatrixTab({ data, scorer }: { data: AdminData; scorer: ReturnType<typeof createScorer> }) {
  const th = data.rules.thresholds
  return (
    <div>
      <p className="mb-4 text-xs leading-6 text-muted-foreground">
        Matriks dihitung ulang setiap kali aturan atau data berubah. Setel aturan dengan melihat bagian <b>tuning</b>; bagian <b>holdout</b> hanya untuk memeriksa hasil akhir. Sekali holdout dipakai menyetel, angkanya tidak jujur lagi.
      </p>
      <SplitSection split="tuning" report={buildReport(scorer, data.samples, "tuning", th)} thresholds={th} />
      <SplitSection split="holdout" report={buildReport(scorer, data.samples, "holdout", th)} thresholds={th} />
    </div>
  )
}
