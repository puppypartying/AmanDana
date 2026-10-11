import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PlatformCard } from './PlatformCard'
import { checkPlatform } from '@/lib/platform/match'
import type { Platform } from '@/lib/platform/types'

const L: Platform[] = [
  { id: '1', value: 'Kredit Fiktif', type: 'nama', status: 'red-flag', note: 'data tes' },
  { id: '2', value: 'PT Danaresmi Contoh', type: 'nama', status: 'resmi', note: '', domains: ['danaresmi.co.id'], sourceDate: '2026-09-01' },
]
const html = (t: string, list = L) => renderToString(<PlatformCard check={checkPlatform(t, list)} />).replace(/<!-- -->/g, '')

describe('PlatformCard', () => {
  it('red-flag: judul, entri daftar, dan tautan OJK', () => {
    const h = html('aplikasi Kredit Fiktif')
    expect(h).toContain('Ada di daftar red-flag')
    expect(h).toContain('data tes')
    expect(h).toContain('ojk.go.id')
  })
  it('tautan tiruan: menampilkan domain resmi dan sinyal bentuk tautan', () => {
    const h = html('https://danaresmi-promo.xyz')
    expect(h).toContain('Tautan tidak sesuai domain resmi')
    expect(h).toContain('danaresmi.co.id')
    expect(h).toContain('Akhiran domain murahan')
  })
  it('nomor disamarkan dan resmi tidak diklaim aman', () => {
    expect(html('hubungi 0813-1111-2222')).not.toContain('6281311112222')
    expect(html('PT Danaresmi Contoh')).toContain('bukan jaminan')
  })
  it('daftar kosong: jujur bahwa legalitas belum bisa dicek', () => {
    expect(html('aplikasi Pinjam Baru', [])).toContain('Daftar referensi belum diisi')
  })
})
