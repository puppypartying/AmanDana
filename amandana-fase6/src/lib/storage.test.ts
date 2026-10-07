import { describe, expect, it } from 'vitest'
import { createAnalysis } from './risk/analysis'
import { example } from '@/config/content'
import {
  clearAllData, defaultData, fromStored, loadData, MAX_HISTORY, pushHistory, saveData, stripText, STORAGE_KEY, toStored, withSavedText, type KV, type StoredAnalysis,
} from './storage'

function fakeStore(initial: Record<string, string> = {}): KV & { dump: () => Record<string, string> } {
  const m = new Map(Object.entries(initial))
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size },
    dump: () => Object.fromEntries(m),
  }
}
const sample = (now: number) => createAnalysis('Investasi', example, now)

describe('loadData / saveData', () => {
  it('data kosong -> bawaan', () => expect(loadData(fakeStore())).toEqual(defaultData()))
  it('JSON rusak -> bawaan, tidak melempar', () => expect(loadData(fakeStore({ [STORAGE_KEY]: '{bukan json' }))).toEqual(defaultData()))
  it('versi skema tak dikenal -> bawaan', () => expect(loadData(fakeStore({ [STORAGE_KEY]: JSON.stringify({ v: 99, saveText: true }) }))).toEqual(defaultData()))
  it('bolak-balik simpan lalu muat', () => {
    const s = fakeStore()
    const a = toStored(sample(1000))
    const data = { ...defaultData(), last: a, history: [a], evidenceChecks: ['Bukti transfer'], complaintTemplate: 'draf saya', quizAnswer: 1 }
    expect(saveData(data, s)).toBe(true)
    expect(loadData(s)).toEqual(data)
  })
  it('data kosong menghapus kunci, bukan menyimpan kerangka kosong', () => {
    const s = fakeStore()
    saveData({ ...defaultData(), quizAnswer: 0 }, s)
    expect(s.dump()[STORAGE_KEY]).toBeDefined()
    saveData(defaultData(), s)
    expect(s.dump()).toEqual({})
  })
  it('entri riwayat rusak dibuang, sisanya dipertahankan', () => {
    const good = toStored(sample(1))
    const raw = { v: 1, saveText: false, last: { score: 'x' }, history: [good, { id: 5 }, null], evidenceChecks: ['a', 3], complaintTemplate: 7, quizAnswer: -2 }
    const d = loadData(fakeStore({ [STORAGE_KEY]: JSON.stringify(raw) }))
    expect(d.last).toBeNull()
    expect(d.history).toEqual([good])
    expect(d.evidenceChecks).toEqual(['a'])
    expect(d.complaintTemplate).toBeNull()
    expect(d.quizAnswer).toBeNull()
  })
  it('storage yang melempar error tidak merusak aplikasi', () => {
    const boom: KV = { getItem: () => { throw new Error('x') }, setItem: () => { throw new Error('x') }, removeItem: () => { throw new Error('x') }, key: () => { throw new Error('x') }, length: 1 }
    expect(loadData(boom)).toEqual(defaultData())
    expect(saveData({ ...defaultData(), quizAnswer: 1 }, boom)).toBe(false)
    expect(clearAllData(boom)).toBe(false)
  })
  it('tanpa storage (null) aman', () => {
    expect(loadData(null)).toEqual(defaultData())
    expect(saveData(defaultData(), null)).toBe(false)
  })
})

describe('privasi: teks pesan', () => {
  it('secara default teks mentah dan potongan bukti tidak ikut tersimpan', () => {
    const s = fakeStore()
    const a = withSavedText(sample(1), example, false)
    expect(a.matchedRules.length).toBeGreaterThan(0)
    saveData({ ...defaultData(), last: toStored(a), history: [toStored(a)] }, s)
    const raw = s.dump()[STORAGE_KEY]
    const parsed = JSON.parse(raw)
    expect(parsed.last.text).toBeUndefined()
    expect(parsed.last.matchedRules).toBeUndefined()
    expect(raw).not.toContain('Slot terbatas')
    expect(raw).not.toContain('tanpa survei')
    expect(parsed.last.score).toBe(a.score)
    expect(parsed.last.reasons.length).toBe(a.reasons.length)
  })
  it('bila saveText menyala, teks disimpan dalam bentuk tersamar', () => {
    const a = withSavedText(sample(1), 'Transfer ke 1234567890 sekarang', true)
    expect(a.text).toBe('Transfer ke [nomor disamarkan] sekarang')
  })
  it('stripText membuang teks dan fromStored memulihkan bentuk Analysis', () => {
    const a = withSavedText(sample(1), 'halo', true)
    expect(stripText(toStored(a)).text).toBeUndefined()
    expect(fromStored(toStored(a)).matchedRules).toEqual([])
  })
})

describe('riwayat', () => {
  it(`maksimal ${MAX_HISTORY}, terbaru dulu`, () => {
    let h: StoredAnalysis[] = []
    for (let i = 1; i <= 25; i++) h = pushHistory(h, toStored(sample(i)))
    expect(h).toHaveLength(MAX_HISTORY)
    expect(h[0].id).toBe('25')
    expect(h[MAX_HISTORY - 1].id).toBe('6')
  })
  it('id yang sama tidak menggandakan entri', () => {
    const e = toStored(sample(7))
    expect(pushHistory(pushHistory([], e), e)).toHaveLength(1)
  })
})

describe('clearAllData', () => {
  it('menghapus kunci milik aplikasi saja', () => {
    const s = fakeStore({ [STORAGE_KEY]: '{}', 'amandana-theme': 'dark', lain: 'tetap' })
    expect(clearAllData(s)).toBe(true)
    expect(s.dump()).toEqual({ lain: 'tetap' })
  })
})

describe('masking pada data tersimpan', () => {
  it('teks yang tersimpan tersamar walau sumbernya mentah (saat simpan dan saat muat)', () => {
    const a = { ...toStored(sample(1)), text: 'rek 1234567890, WA 0812 3456 7890' }
    expect(toStored({ ...a, matchedRules: [] }).text).not.toMatch(/\d{4}/)
    const s = fakeStore({ [STORAGE_KEY]: JSON.stringify({ v: 1, saveText: true, last: a, history: [a] }) })
    const d = loadData(s)
    expect(d.last?.text).toBe('rek [nomor disamarkan], WA [nomor disamarkan]')
    expect(d.history[0].text).not.toMatch(/\d{4}/)
  })
})
