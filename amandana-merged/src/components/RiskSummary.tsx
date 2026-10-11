import { useEffect, useRef } from "react"
import { ArrowRight, ShieldAlert } from "lucide-react"
import { ReasonIcon } from "@/components/ReasonIcon"
import { type Analysis } from "@/lib/risk/analysis"
import { adviceFor, evidenceFor, levelBadgeClass, levelColor, topReasons } from "@/lib/risk/present"

/** Ringkasan risiko tepat di bawah tombol Analisis, supaya hasil scan langsung terlihat. */
export function RiskSummary({ analysis, onDetail }: { analysis: Analysis; onDetail: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    ref.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" })
  }, [analysis.id])
  const reasons = topReasons(analysis, 3)
  const more = analysis.reasons.length - reasons.length
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label="Hasil analisis"
      className="mt-5 border border-border bg-[var(--tone-bg-fbfcfc)] p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Skor risiko</p>
          <p className="text-3xl font-extrabold tracking-[-1px]">
            {analysis.score}
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </p>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-wide ${levelBadgeClass(analysis.level)}`}>
          <ShieldAlert size={14} />
          RISIKO {analysis.level.toUpperCase()}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full bg-border" aria-hidden="true">
        <div className="h-full" style={{ width: `${analysis.score}%`, backgroundColor: levelColor(analysis.level) }} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{adviceFor(analysis.level)}</p>
      {reasons.length > 0 && (
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {reasons.map((r) => {
            const quote = evidenceFor(analysis, r.title)
            return (
              <li key={r.title} className="flex gap-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--tone-bg-fcf0ed)] text-destructive">
                  <ReasonIcon name={r.icon} size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold leading-5">{r.title}</p>
                  {quote && <p className="mt-0.5 break-words text-xs leading-5 text-muted-foreground">Terdeteksi: “{quote}”</p>}
                </div>
                <span className="h-fit bg-[var(--tone-bg-fbeceb)] px-2 py-1 text-xs font-bold text-destructive">+{r.weight}</span>
              </li>
            )
          })}
        </ul>
      )}
      <button onClick={onDetail} className="mt-2 flex min-h-11 w-full items-center justify-between border-t border-border pt-3 text-xs font-bold text-primary">
        {more > 0 ? `Lihat ${more} tanda bahaya lain dan detail lengkap` : "Lihat detail lengkap"} <ArrowRight size={15} />
      </button>
    </div>
  )
}
