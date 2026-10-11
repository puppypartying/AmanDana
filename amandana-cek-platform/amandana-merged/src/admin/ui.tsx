import type { ReactNode } from "react"

export const input = "w-full border border-border bg-card px-2 py-1.5 text-xs"
export const btn = "min-h-9 border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:bg-secondary"
export const btnPrimary = "min-h-9 bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
export const btnDanger = "min-h-9 border border-destructive px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-[var(--tone-bg-fbeceb)]"

export const pct = (v: number | null) => (v === null ? "-" : `${(v * 100).toFixed(1)}%`)

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-5 border border-border bg-card p-4">
      <h2 className="text-sm font-bold">{title}</h2>
      {hint && <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}
