import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { platformIssues } from '@/lib/platform/import'
import { DEFAULT_PLATFORMS } from '@/lib/platform/registry'
import { createScorer, DEFAULT_RULES } from '@/lib/risk/engine'
import { adminApi, type GateInfo, type Meta, type ServerState } from './api'
import dataset from './dataset.json'
import type { Sample } from './matrix'
import { parseAdminData, type AdminData, type Platform } from './schema'
import { validateRules } from './validate'

export { parseAdminData }
export type { AdminData, Platform }

const KEY = 'amandana-admin-v2'
const BACKUP_KEY = 'amandana-admin-v2-lokal-berbeda'

export function defaults(): AdminData {
  return structuredClone({ v: 2 as const, rules: DEFAULT_RULES, samples: dataset as Sample[], platforms: structuredClone(DEFAULT_PLATFORMS) })
}

const readLocal = (key: string): AdminData | null => {
  try { return parseAdminData(JSON.parse(window.localStorage.getItem(key) ?? 'null')) } catch { return null }
}
const writeLocal = (key: string, value: AdminData) => {
  try { window.localStorage.setItem(key, JSON.stringify(value)) } catch { /* penyimpanan tidak tersedia: abaikan */ }
}

export type Connection =
  | { mode: 'memeriksa' }
  | { mode: 'lokal'; reason: string }
  | { mode: 'server'; email: string }

export type Notice = { kind: 'info' | 'error' | 'ok'; text: string }
export type PublishOutcome = { ok: true } | { ok: false; error: string; issues?: string[]; gate?: GateInfo }

/**
 * Draf admin. Mode server (Cloudflare Pages Functions + KV): draf dibagi semua admin, "Terbitkan" membuat aturan
 * langsung dipakai pengguna. Mode lokal (tanpa Functions, mis. `vite dev`): draf hanya di browser ini, ekspor JSON seperti dulu.
 * Salinan lokal selalu ditulis sebagai cadangan.
 */
export function useAdminStore() {
  const [data, setData] = useState<AdminData>(() => readLocal(KEY) ?? defaults())
  const [conn, setConn] = useState<Connection>({ mode: 'memeriksa' })
  const [rev, setRev] = useState<number | null>(null)
  const [dirty, setDirty] = useState(false)
  const [published, setPublished] = useState<Meta | null>(null)
  const [history, setHistory] = useState<Meta[]>([])
  const [hasUnpublished, setHasUnpublished] = useState(false)
  const [draftMeta, setDraftMeta] = useState<{ updatedAt: string; updatedBy: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [localBackup, setLocalBackup] = useState<AdminData | null>(null)
  const serverMode = conn.mode === 'server'
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  useEffect(() => { writeLocal(KEY, data) }, [data])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirtyRef.current && serverMode) e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [serverMode])

  const applyServer = useCallback((s: ServerState, mode: 'awal' | 'muat-ulang') => {
    setConn({ mode: 'server', email: s.email })
    setPublished(s.published)
    setHistory(s.history)
    setHasUnpublished(s.hasUnpublished)
    if (s.draft) {
      const local = readLocal(KEY)
      setRev(s.draft.rev)
      setDraftMeta({ updatedAt: s.draft.updatedAt, updatedBy: s.draft.updatedBy })
      // Draf lokal yang berbeda dari server tidak ditimpa diam-diam: disimpan sebagai cadangan yang bisa dipulihkan.
      if (mode === 'awal' && local && JSON.stringify(local) !== JSON.stringify(s.draft.data) && JSON.stringify(local) !== JSON.stringify(defaults())) {
        writeLocal(BACKUP_KEY, local)
        setLocalBackup(local)
        setNotice({ kind: 'info', text: 'Draf di browser ini berbeda dari draf server. Yang dipakai: draf server. Draf lokal disimpan sebagai cadangan.' })
      }
      setData(s.draft.data)
      setDirty(false)
    } else {
      setRev(null)
      setDraftMeta(null)
      setDirty(true)
      setNotice({ kind: 'info', text: 'Belum ada draf di server. Simpan draf untuk membuatnya (yang dipakai: draf di browser ini atau bawaan).' })
    }
  }, [])

  const refresh = useCallback(async (mode: 'awal' | 'muat-ulang' = 'muat-ulang') => {
    setBusy(true)
    const r = await adminApi.state()
    setBusy(false)
    if (r.ok) {
      applyServer(r.data, mode)
      return true
    }
    setConn({ mode: 'lokal', reason: r.error })
    return false
  }, [applyServer])

  useEffect(() => {
    void refresh('awal')
  }, [refresh])

  const scorer = useMemo(() => createScorer(data.rules), [data.rules])
  const issues = useMemo(() => {
    const base = validateRules(data.rules)
    return [...base, ...scorer.errors.filter((e) => !base.some((i) => e.startsWith(i.split(':')[0])))]
  }, [data.rules, scorer])

  const platformErrors = useMemo(() => platformIssues(data.platforms).errors, [data.platforms])

  const edit = (next: AdminData) => { setData(next); setDirty(true); setNotice(null) }

  async function saveDraft(): Promise<boolean> {
    setBusy(true)
    const r = await adminApi.saveDraft(data, rev)
    setBusy(false)
    if (r.ok) {
      setRev(r.data.rev)
      setDraftMeta({ updatedAt: r.data.updatedAt, updatedBy: r.data.updatedBy })
      setDirty(false)
      setHasUnpublished(true)
      setNotice({ kind: 'ok', text: `Draf tersimpan di server (rev ${r.data.rev}).` })
      return true
    }
    setNotice({ kind: 'error', text: r.status === 409 ? 'Draf di server sudah diubah admin lain. Unduh paket lengkap sebagai cadangan, lalu "Muat ulang dari server".' : r.error })
    return false
  }

  async function publish(note: string, acknowledge: boolean): Promise<PublishOutcome> {
    if (rev === null) return { ok: false, error: 'Simpan draf ke server dulu.' }
    setBusy(true)
    const r = await adminApi.publish(rev, note, acknowledge)
    if (!r.ok) {
      setBusy(false)
      return { ok: false, error: r.error, issues: r.body?.issues as string[] | undefined, gate: r.body?.gate as GateInfo | undefined }
    }
    await refresh()
    setNotice({ kind: 'ok', text: `Aturan versi ${r.data.published.version} terbit. Pengguna menerimanya saat aplikasi dibuka berikutnya (cache sampai sekitar 1 menit).` })
    return { ok: true }
  }

  async function rollback(version: number, note: string): Promise<PublishOutcome> {
    setBusy(true)
    const r = await adminApi.rollback(version, note)
    if (!r.ok) {
      setBusy(false)
      return { ok: false, error: r.error, issues: r.body?.issues as string[] | undefined }
    }
    await refresh()
    setNotice({ kind: 'ok', text: `Rollback selesai: versi ${r.data.published.version} terbit.` })
    return { ok: true }
  }

  return {
    data,
    scorer,
    issues,
    platformErrors,
    conn,
    serverMode,
    rev,
    dirty,
    busy,
    notice,
    published,
    history,
    hasUnpublished,
    draftMeta,
    localBackup,
    update: (fn: (d: AdminData) => AdminData) => { setData((prev) => fn(prev)); setDirty(true); setNotice(null) },
    replace: (next: AdminData) => edit(next),
    reset: () => edit(defaults()),
    restoreLocalBackup: () => { if (localBackup) { edit(localBackup); setLocalBackup(null) } },
    refresh: () => refresh('muat-ulang'),
    saveDraft,
    publish,
    rollback,
  }
}

export type AdminStore = ReturnType<typeof useAdminStore>

export function download(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + '\n'], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
