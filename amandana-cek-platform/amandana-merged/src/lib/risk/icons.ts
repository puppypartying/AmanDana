import { ArrowDownLeft, HandCoins, type LucideIcon, ShieldAlert, TrendingUp, TriangleAlert, Users, Wallet } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = { ArrowDownLeft, HandCoins, ShieldAlert, TrendingUp, TriangleAlert, Users, Wallet }

/** Nama ikon (string, bisa disimpan) -> komponen ikon. Nama tak dikenal jatuh ke TriangleAlert. */
export function iconFor(name: string): LucideIcon {
  return ICONS[name] ?? TriangleAlert
}
