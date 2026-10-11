import type { RiskReason } from '../risk/engine'
import type { PlatformCheck } from './types'

export const RED_FLAG_FLOOR = 85
export const LOOKALIKE_FLOOR = 70
export const MIRIP_RED_ADD = 20
export const MIRIP_RESMI_ADD = 10
export const SIGNAL_CAP = 30

/**
 * Menggabungkan hasil cek platform ke skor engine. Hanya MENAIKKAN skor: platform "resmi" tidak pernah menurunkan skor,
 * karena nama resmi sering dicatut penipu.
 */
export function applyPlatform(score: number, reasons: RiskReason[], check: PlatformCheck): { score: number; reasons: RiskReason[] } {
  let s = score
  const out = [...reasons]
  const add = (ruleId: string, title: string, detail: string, delta: number, icon: string) => { out.push({ ruleId, title, detail, weight: delta, icon }); s = Math.min(100, s + delta) }
  const floor = (ruleId: string, title: string, detail: string, to: number, icon: string) => { const d = Math.max(0, to - s); out.push({ ruleId, title, detail, weight: d, icon }); s = Math.max(s, to) }
  const has = (st: string) => check.findings.some((f) => f.status === st)

  // Tambahan aditif lebih dulu, lantai sesudahnya.
  const hadShort = reasons.some((r) => r.ruleId === 'umum-url-pendek') // jangan hitung dua kali
  const sig = check.signals.filter((x) => !(x.id === 'short-link' && hadShort))
  const sigWeight = Math.min(SIGNAL_CAP, sig.reduce((t, x) => t + x.weight, 0))
  if (sigWeight > 0) add('plat-sinyal-tautan', 'Tautan mencurigakan', sig.map((x) => x.label).join('; ') + '.', sigWeight, 'TriangleAlert')
  if (has('mirip-red-flag') && !has('red-flag')) add('plat-mirip-red-flag', 'Mirip platform yang masuk daftar red-flag', 'Nama atau tautan menyerupai entri di daftar platform ilegal.', MIRIP_RED_ADD, 'ShieldAlert')
  if (has('mirip-resmi') && !has('tautan-berbeda') && !has('red-flag')) add('plat-mirip-resmi', 'Mirip platform resmi tetapi tidak persis', 'Nama menyerupai platform terdaftar. Peniruan nama umum dipakai penipu.', MIRIP_RESMI_ADD, 'TriangleAlert')
  if (has('red-flag')) floor('plat-red-flag', 'Platform, tautan, atau akun ada di daftar red-flag', 'Cocok dengan daftar platform ilegal. Jangan transfer atau memberi data.', RED_FLAG_FLOOR, 'ShieldAlert')
  else if (has('tautan-berbeda')) floor('plat-tautan-berbeda', 'Tautan tidak sesuai domain resmi', 'Tautan menyerupai atau mengaku sebagai platform resmi, tetapi domainnya berbeda.', LOOKALIKE_FLOOR, 'ShieldAlert')
  return { score: s, reasons: out }
}
