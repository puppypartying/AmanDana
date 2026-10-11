import {
  Check,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

export function SafetyIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-44 w-64 shrink-0 items-center justify-center max-md:hidden"
    >
      <div className="absolute h-48 w-48 rounded-none border border-[var(--tone-border-cce0d9)]" />
      <div className="absolute h-36 w-36 rounded-none border border-[var(--tone-border-cce0d9)]" />
      <div className="absolute h-24 w-24 rounded-none bg-[var(--tone-bg-d5e9e0)]" />
      <div className="relative flex h-28 w-24 -rotate-6 items-center justify-center rounded-none border-4 border-white bg-primary shadow-[0_12px_25px_-8px_#528d80]">
        <ShieldCheck className="text-primary-foreground" size={58} strokeWidth={1.3} />
      </div>
      <div className="absolute left-0 top-8 flex -rotate-6 items-center gap-2 rounded-none border border-white bg-card px-3 py-2.5 text-xs font-bold shadow-sm">
        <div className="rounded-none bg-[var(--tone-bg-eaf4df)] p-1 text-[var(--tone-text-58804a)]">
          <Check size={12} />
        </div>
        Cek dulu, aman kemudian
      </div>
      <div className="absolute bottom-5 right-0 flex rotate-6 items-center gap-2 rounded-none bg-card p-3 shadow-sm">
        <LockKeyhole size={15} className="text-primary" />
        <span className="text-xs font-semibold">Kendali di tanganmu</span>
      </div>
      <Sparkles className="absolute right-7 top-4 text-[var(--tone-text-75aa94)]" size={23} />
      <div className="absolute bottom-6 left-7 h-2 w-2 rounded-none bg-[var(--tone-bg-c4a55c)]" />
    </div>
  )
}
