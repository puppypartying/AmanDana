import { type ReactNode } from "react"

export function MiniLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-bold tracking-[1.7px] text-primary/70">
      {children}
    </span>
  )
}
