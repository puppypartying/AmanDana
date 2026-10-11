import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_PLATFORMS } from '@/lib/platform/registry'
import type { Platform } from '@/lib/platform/types'
import { createScorer, DEFAULT_RULES, type RulesData } from '@/lib/risk/engine'
import dataset from './dataset.json'
import type { Sample } from './matrix'
import { validateRules } from './validate'

export type { Platform }
export type AdminData = { v: 2; rules: RulesData; samples: Sample[]; platforms: Platform[] }

// v2: skema aturan engine v3 (severityFloors, warningMarkers, pola raw/critical). Draf v1 di browser tidak dipakai lagi.
const KEY = 'amandana-admin-v2'

export function defaults(): AdminData {
  return structuredClone({ v: 2 as const, rules: DEFAULT_RULES, samples: dataset as Sample[], platforms: structuredClone(DEFAULT_PLATFORMS) })
}

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

function load(): AdminData {
  try {
    const parsed = parseAdminData(JSON.parse(window.localStorage.getItem(KEY) ?? 'null'))
    if (parsed) return parsed
  } catch {
    /* penyimpanan tidak tersedia atau rusak: pakai bawaan */
  }
  return defaults()
}

/** Draf admin disimpan di browser ini saja (bukan server); ekspor JSON untuk menerapkannya ke aplikasi. */
export function useAdminStore() {
  const [data, setData] = useState<AdminData>(load)
  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* abaikan */ }
  }, [data])
  const scorer = useMemo(() => createScorer(data.rules), [data.rules])
  const issues = useMemo(() => validateRules(data.rules), [data.rules])
  return {
    data,
    scorer,
    issues: [...issues, ...scorer.errors.filter((e) => !issues.some((i) => e.startsWith(i.split(':')[0])))],
    update: (fn: (d: AdminData) => AdminData) => setData((prev) => fn(prev)),
    replace: (next: AdminData) => setData(next),
    reset: () => setData(defaults()),
  }
}

export function download(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + '\n'], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
