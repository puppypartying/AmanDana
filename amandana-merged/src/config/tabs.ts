import {
  BookOpen,
  Calculator,
  ClipboardCheck,
  HeartHandshake,
  type LucideIcon,
  ScanLine,
} from "lucide-react"

export const tabs: {
  label: string
  mobile: string
  path: string
  icon: LucideIcon
}[] = [
  { label: "Cek Tawaran", mobile: "Cek", path: "/", icon: ScanLine },
  {
    label: "Hasil Analisis",
    mobile: "Hasil",
    path: "/hasil",
    icon: ClipboardCheck,
  },
  {
    label: "Simulator Biaya",
    mobile: "Simulator",
    path: "/simulator",
    icon: Calculator,
  },
  {
    label: "Bantuan",
    mobile: "Bantuan",
    path: "/bantuan",
    icon: HeartHandshake,
  },
  { label: "Belajar", mobile: "Belajar", path: "/belajar", icon: BookOpen },
]
