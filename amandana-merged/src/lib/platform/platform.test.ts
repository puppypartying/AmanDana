import { describe, expect, it } from 'vitest'
import { createAnalysis } from '@/lib/risk/analysis'
import { defaultData, loadData, saveData, sanitize, toStored, type KV } from '@/lib/storage'
import { extractAll } from './extract'
import { entryKey, parsePlatformText, validatePlatforms } from './import'
import { checkPlatform } from './match'
import { slimPlatform, statusView } from './present'
import { applyPlatform } from './score'
import { linkSignals } from './signals'
import { editDistance, nameKey, phoneKey, registrable, similarity } from './text'
import type { Platform } from './types'

// Data FIKTIF khusus tes. Daftar asli harus dari OJK/Satgas PASTI.
const L: Platform[] = [
  { id: '1', value: 'Kredit Fiktif', type: 'nama', status: 'red-flag', note: 'tes' },
  { id: '2', value: 'https://scam.example/promo', type: 'tautan', status: 'red-flag', note: 'tes' },
  { id: '3', value: '0813-1111-2222', type: 'akun', status: 'red-flag', note: 'tes' },
  { id: '4', value: '@akun_scam', type: 'akun', status: 'red-flag', note: 'tes' },
  { id: '5', value: 'PT Danaresmi Contoh', type: 'nama', status: 'resmi', note: 'tes', domains: ['danaresmi.co.id'], sourceDate: '2026-09-01' },
  { id: '6', value: 'https://wa.me/6281200000000', type: 'tautan', status: 'red-flag', note: 'tes' },
]

describe('teks', () => {
  it('nameKey mengabaikan kata umum, spasi, tanda baca, huruf besar', () => {
    expect(nameKey('PT. Kredit-Cepat Online')).toBe('kreditcepat')
    expect(nameKey('aplikasi KREDIT  cepat')).toBe('kreditcepat')
  })
  it('phoneKey menyeragamkan format', () => {
    expect(phoneKey('0813-1111-2222')).toBe('6281311112222')
    expect(phoneKey('+62 813 1111 2222')).toBe('6281311112222')
    expect(phoneKey('12345')).toBeNull()
  })
  it('similarity: exact, salah ketik, tukar huruf, beda jauh', () => {
    expect(similarity('kreditfiktif', 'kreditfiktif')).toBe('exact')
    expect(similarity('kreditfikitf', 'kreditfiktif')).toBe('mirip')
    expect(similarity('kreditfiktifpro', 'kreditfiktif')).toBe('mirip')
    expect(similarity('danacepat', 'kreditfiktif')).toBeNull()
    expect(similarity('abc', 'abd')).toBeNull()
    expect(editDistance('ab', 'ba')).toBe(1)
  })
  it('registrable', () => {
    expect(registrable('a.b.danaresmi.co.id')).toBe('danaresmi.co.id')
    expect(registrable('www.x.com')).toBe('x.com')
  })
})

describe('ekstraksi', () => {
  it('pesan biasa tanpa pemicu tidak menghasilkan nama', () => {
    expect(extractAll('Wajib akses kontak, tenor 7 hari, potongan 20% di muka.').names).toEqual([])
    expect(extractAll('Aplikasi ini menawarkan pinjaman cepat').names).toEqual([])
  })
  it('nama setelah pemicu, kutip, dan input pendek', () => {
    expect(extractAll('Unduh aplikasi KreditFiktif sekarang').names).toEqual(['kreditfiktif'])
    expect(extractAll('dari PT. Danaresmi Contoh yang resmi').names).toEqual(['danaresmi contoh'])
    expect(extractAll('Coba "Pinjam Kilat" dulu ya').names).toContain('Pinjam Kilat')
    expect(extractAll('Kredit Fiktif').names).toEqual(['kredit fiktif'])
  })
  it('tautan: skema, tanpa skema, IP, email, dan bukan "a.n."', () => {
    const e = extractAll('Buka https://Scam.Example/Promo. atau bit.ly/abc atau http://103.12.4.5/x.apk, rek a.n. Budi, cs@evil-loan.xyz')
    expect(e.links.map((l) => l.host + l.path)).toEqual(['evil-loan.xyz', '103.12.4.5/x.apk', 'scam.example/promo', 'bit.ly/abc'])
    expect(extractAll('rek a.n. Budi dan dr.budi').links).toEqual([])
  })
  it('akun: telepon, wa.me, dan @handle (bukan email)', () => {
    const e = extractAll('Hubungi 0813-1111-2222 atau wa.me/6281200000000 atau @akun_scam, cs@gmail.com')
    expect(e.accounts).toEqual([{ kind: 'telepon', key: '6281311112222' }, { kind: 'telepon', key: '6281200000000' }, { kind: 'handle', key: 'akun_scam' }])
  })
})

describe('sinyal tautan', () => {
  const ids = (u: string) => linkSignals(extractAll(u).links[0]).map((s) => s.id)
  it('mendeteksi 8 sinyal', () => {
    expect(ids('http://103.12.4.5/')).toEqual(['ip-host', 'insecure-http'])
    expect(ids('https://xn--ojk-9ua.com')).toContain('punycode')
    expect(ids('https://ojk-pinjaman.xyz')).toEqual(['brand-impersonation', 'cheap-tld'])
    expect(ids('https://pinjam.com/app.apk')).toContain('apk-file')
    expect(ids('https://a-b-c-d.pinjam.com')).toContain('hyphen-subdomain')
    expect(ids('https://bit.ly/x')).toEqual(['short-link'])
  })
  it('situs bersih dan domain pemerintah tidak kena sinyal', () => {
    expect(ids('https://danaresmi.co.id/login')).toEqual([])
    expect(extractAll('https://ojk.go.id').links.flatMap(linkSignals)).toEqual([])
  })
})

describe('checkPlatform', () => {
  it('nama red-flag persis (salah spasi/huruf besar)', () => {
    expect(checkPlatform('aplikasi KREDIT-fiktif', L).status).toBe('red-flag')
  })
  it('nama mirip red-flag (salah ketik)', () => {
    expect(checkPlatform('aplikasi Kredit Fikitf', L).status).toBe('mirip-red-flag')
  })
  it('nama resmi persis = resmi; mirip = mirip-resmi', () => {
    expect(checkPlatform('PT Danaresmi Contoh', L).status).toBe('resmi')
    expect(checkPlatform('aplikasi Danaresmi Contoh Pro', L).status).toBe('mirip-resmi')
  })
  it('tautan red-flag, termasuk path pada host bersama', () => {
    expect(checkPlatform('klik https://scam.example/promo', L).status).toBe('red-flag')
    expect(checkPlatform('chat wa.me/6281200000000', L).findings.some((f) => f.status === 'red-flag' && f.kind === 'tautan')).toBe(true)
    expect(checkPlatform('chat wa.me/6289999999999', L).findings.some((f) => f.status === 'red-flag' && f.kind === 'tautan')).toBe(false)
  })
  it('domain resmi = resmi; tiruan domain = tautan-berbeda', () => {
    expect(checkPlatform('https://www.danaresmi.co.id/login', L).status).toBe('resmi')
    expect(checkPlatform('https://danaresmi-promo.xyz/login', L).status).toBe('tautan-berbeda')
    expect(checkPlatform('https://danaresm1.com', L).status).toBe('tautan-berbeda')
  })
  it('menyebut nama resmi tapi tautan lain = tautan-berbeda', () => {
    expect(checkPlatform('PT Danaresmi Contoh: isi data di https://pinjam-murah.com', L).status).toBe('tautan-berbeda')
  })
  it('akun: nomor beda format dan @handle', () => {
    expect(checkPlatform('WA +62 813 1111 2222', L).status).toBe('red-flag')
    expect(checkPlatform('IG @AKUN_SCAM', L).status).toBe('red-flag')
  })
  it('tidak-dicek vs tidak-ditemukan, dan daftar kosong', () => {
    expect(checkPlatform('Wajib akses kontak, tenor 7 hari.', L).status).toBe('tidak-dicek')
    expect(checkPlatform('aplikasi Pinjam Baru', L).status).toBe('tidak-ditemukan')
    const empty = checkPlatform('aplikasi Pinjam Baru', [])
    expect(empty.listSize).toBe(0)
    expect(statusView(empty).title).toMatch(/belum diisi/)
  })
  it('status gabungan memakai yang terburuk', () => {
    expect(checkPlatform('PT Danaresmi Contoh, hubungi 0813-1111-2222', L).status).toBe('red-flag')
  })
  it('ojk.go.id tidak dianggap tautan asing', () => {
    expect(checkPlatform('cek di https://ojk.go.id', L).status).toBe('tidak-dicek')
  })
})

describe('skor', () => {
  const base = [{ ruleId: 'x', title: 't', detail: 'd', weight: 10, icon: 'TriangleAlert' }]
  it('red-flag mengunci skor minimal 85, tautan-berbeda 70, tidak pernah menurunkan', () => {
    expect(applyPlatform(10, base, checkPlatform('Kredit Fiktif', L)).score).toBe(85)
    expect(applyPlatform(95, base, checkPlatform('Kredit Fiktif', L)).score).toBe(95)
    expect(applyPlatform(10, base, checkPlatform('https://danaresmi-promo.xyz', L)).score).toBeGreaterThanOrEqual(70)
    for (const t of ['PT Danaresmi Contoh', 'aplikasi Pinjam Baru', 'halo']) expect(applyPlatform(50, base, checkPlatform(t, L)).score).toBe(50)
  })
  it('sinyal tautan dibatasi 30 dan short-link tidak dihitung dua kali', () => {
    const c = checkPlatform('http://103.12.4.5/x.apk https://xn--ojk-9ua.xyz', L)
    expect(applyPlatform(0, [], c).score).toBe(30)
    const s = checkPlatform('https://bit.ly/x', L)
    expect(applyPlatform(10, [{ ...base[0], ruleId: 'umum-url-pendek' }], s).score).toBe(10)
    expect(applyPlatform(10, base, s).score).toBe(18)
  })
})

describe('createAnalysis dan storage', () => {
  it('pesan tanpa platform: skor sama persis dengan engine saja', () => {
    const a = createAnalysis('Pinjol', 'tenor 7 hari dan wajib akses kontak', 1000)
    expect(a.platform?.status).toBe('tidak-dicek')
    expect(a.score).toBeGreaterThan(0)
  })
  it('hasil memuat platform dan lolos bolak-balik storage tanpa teks pengguna', () => {
    const a = createAnalysis('Pinjol', 'Unduh http://103.12.4.5/pinjam.apk dan chat 0813-1111-2222', 1000)
    expect(a.platform?.signals.length).toBeGreaterThan(0)
    const stored = toStored(a)
    const json = JSON.stringify(stored)
    expect(json).not.toContain('103.12.4.5')
    expect(json).not.toContain('62813')
    const mem = new Map<string, string>()
    const kv: KV = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size } }
    const d = { ...defaultData(), last: stored, history: [stored] }
    expect(saveData(d, kv)).toBe(true)
    expect(loadData(kv).last?.platform).toEqual(slimPlatform(a.platform!))
  })
  it('platform rusak di storage dibuang, analisis tetap dimuat', () => {
    const s = toStored(createAnalysis('Pinjol', 'tenor 7 hari', 1000))
    const d = sanitize({ ...defaultData(), last: { ...s, platform: { status: 'ngawur' } } })
    expect(d.last?.platform).toBeUndefined()
    expect(d.last?.score).toBe(s.score)
  })
})

describe('impor massal dan validasi', () => {
  it('berbagai pemisah, tebak tipe, status bawaan, duplikat, baris rusak', () => {
    const r = parsePlatformText(
      ['# komentar', 'Kredit Baru', 'https://scam2.example/x | red-flag | 2026-09-02 | rilis Satgas', '0813-9999-0000;akun', '@akun_baru', 'PT Resmi Baru | resmi | resmi-baru.co.id www.resmibaru.id | 2026-09-03', 'Salah Tanggal | resmi | 2026-13-40', 'kredit-baru', 'bukan tautan | tautan'].join('\n'),
      'red-flag', L, 1,
    )
    expect(r.entries.map((e) => [e.value, e.type, e.status])).toEqual([
      ['Kredit Baru', 'nama', 'red-flag'], ['https://scam2.example/x', 'tautan', 'red-flag'], ['0813-9999-0000', 'akun', 'red-flag'], ['@akun_baru', 'akun', 'red-flag'], ['PT Resmi Baru', 'nama', 'resmi'],
    ])
    expect(r.entries[1]).toMatchObject({ sourceDate: '2026-09-02', note: 'rilis Satgas' })
    expect(r.entries[4].domains).toEqual(['resmi-baru.co.id', 'resmibaru.id'])
    expect(r.duplicates).toBe(1)
    expect(r.errors.map((e) => e.line)).toEqual([7, 9])
  })
  it('validatePlatforms', () => {
    const msg = validatePlatforms([
      { id: 'a', value: 'PT A Resmi', type: 'nama', status: 'resmi', note: '' },
      { id: 'b', value: 'Dobel', type: 'nama', status: 'red-flag', note: '' },
      { id: 'c', value: 'dobel', type: 'nama', status: 'red-flag', note: '' },
      { id: 'd', value: 'Tgl', type: 'nama', status: 'red-flag', note: '', sourceDate: '2026-1-1' },
      { id: 'e', value: 'Bentrok', type: 'nama', status: 'red-flag', note: '' },
      { id: 'f', value: 'bentrok', type: 'nama', status: 'resmi', note: '', domains: ['bentrok.id'] },
    ]).join('|')
    expect(msg).toMatch(/domain resmi kosong/)
    expect(msg).toMatch(/entri ganda/)
    expect(msg).toMatch(/tanggal sumber/)
    expect(msg).toMatch(/resmi dan red-flag/)
    expect(entryKey({ type: 'akun', value: '+62 813-1111-2222' })).toBe(entryKey({ type: 'akun', value: '081311112222' }))
  })
})
