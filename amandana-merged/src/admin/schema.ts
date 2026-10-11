import { DEFAULT_RULES, type RulesData } from '@/lib/risk/engine'
import type { Platform } from '@/lib/platform/types'
import type { Sample } from './matrix'

export type { Platform }
export type AdminData = { v: 2; rules: RulesData; samples: Sample[]; platforms: Platform[] }

/**
 * Menerima data hanya bila bentuknya lengkap; selain itu kembali ke bawaan.
 * Ekspor v1 (sebelum engine v3) tetap diterima: field baru diisi dari aturan bawaan dan bentuknya dinaikkan ke v2.
 */
export function parseAdminData(raw: unknown): AdminData | null {
  const d = raw as { v?: number; samples?: unknown; platforms?: unknown; rules?: Partial<RulesData> } | null
  if (!d || (d.v !== 1 && d.v !== 2) || !Array.isArray(d.samples) || !Array.isArray(d.platforms) || !d.rules || !Array.isArray(d.rules.rules) || !Array.isArray(d.rules.combos) || !d.rules.thresholds) return null
  const rules = {
    ...d.rules,
    severityFloors: d.rules.severityFloors ?? structuredClone(DEFAULT_RULES.severityFloors),
    warningMarkers: d.rules.warningMarkers ?? [...DEFAULT_RULES.warningMarkers],
  } as RulesData
  return { ...(d as object), v: 2, rules } as AdminData
}

