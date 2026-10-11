import {
  ShieldCheck,
} from "lucide-react"

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${
          small ? "h-9 w-9" : "h-10 w-10"
        } flex items-center justify-center rounded-none bg-primary text-primary-foreground`}
      >
        <ShieldCheck size={23} strokeWidth={1.8} />
      </div>
      <span
        className={`${
          small ? "text-xl" : "text-[23px]"
        } font-extrabold tracking-[-0.7px]`}
      >
        Aman<span className="text-primary">Dana</span>
        <span className="text-[var(--tone-text-68a791)]">.</span>
      </span>
    </div>
  )
}
