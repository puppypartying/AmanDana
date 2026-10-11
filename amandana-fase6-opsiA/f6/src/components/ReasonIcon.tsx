import { iconFor } from "@/lib/risk/icons"

export function ReasonIcon({ name, size }: { name: string; size: number }) {
  const Icon = iconFor(name)
  return <Icon size={size} />
}
