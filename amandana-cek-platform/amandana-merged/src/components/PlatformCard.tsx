import { ArrowUpRight, Landmark } from "lucide-react"
import { OFFICIAL_LINKS } from "@/config/app"
import { maskNumbers } from "@/lib/format"
import { findingLabel, kindLabel, statusView, type StatusView } from "@/lib/platform/present"
import type { PlatformCheck } from "@/lib/platform/types"

const TONE: Record<StatusView["tone"], string> = {
  bad: "bg-[var(--tone-bg-fbeceb)] text-destructive",
  warn: "bg-[var(--tone-bg-fcf7e9)] text-[var(--tone-text-aa7c29)]",
  ok: "bg-secondary text-primary",
  neutral: "bg-[var(--tone-bg-f1f4f4)] text-muted-foreground",
}
const FINDING_TONE = (s: string): StatusView["tone"] => (s === "red-flag" || s === "tautan-berbeda" ? "bad" : s === "resmi" ? "ok" : s === "tidak-dicek" ? "neutral" : "warn")

/** Hasil cek nama/tautan/akun ke daftar referensi OJK/Satgas PASTI milik admin, plus sinyal teknis tautan. */
export function PlatformCard({ check, className = "" }: { check: PlatformCheck; className?: string }) {
  const view = statusView(check)
  return (
    <section aria-label="Cek platform" className={`border border-border bg-[var(--tone-bg-fbfcfc)] p-4 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-bold"><Landmark size={16} /> Cek platform</div>
      <p className={`mt-3 inline-block px-2.5 py-1 text-xs font-bold ${TONE[view.tone]}`}>{view.title}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{view.body}</p>
      {check.findings.length > 0 && (
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {check.findings.map((f, i) => (
            <li key={i} className="py-2.5 text-xs leading-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-1.5 py-0.5 font-semibold ${TONE[FINDING_TONE(f.status)]}`}>{findingLabel[f.status]}</span>
                <span className="font-semibold">{kindLabel[f.kind]}</span>
                {f.input && <span className="min-w-0 break-all text-muted-foreground">{maskNumbers(f.input)}</span>}
              </div>
              <p className="mt-1 text-muted-foreground">{f.detail}</p>
              {f.entry && (
                <p className="mt-1 break-words text-muted-foreground">
                  Di daftar: <b className="text-foreground">{f.entry.value}</b>
                  {f.entry.sourceDate ? ` (sumber ${f.entry.sourceDate})` : ""}
                  {f.entry.note ? `. ${f.entry.note}` : ""}
                  {f.status === "tautan-berbeda" && f.entry.domains?.length ? ` Domain resmi: ${f.entry.domains.join(", ")}.` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {check.signals.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs font-bold">Bentuk tautan mencurigakan</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
            {check.signals.map((s) => <li key={s.id}><b className="text-foreground">{s.label}.</b> {s.detail}</li>)}
          </ul>
        </div>
      )}
      <a href={OFFICIAL_LINKS.ojk} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-11 items-center gap-2 text-xs font-semibold text-primary">
        Verifikasi langsung di OJK <ArrowUpRight size={14} />
      </a>
    </section>
  )
}
