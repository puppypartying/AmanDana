import { describe, expect, it } from 'vitest'
import { normalize } from './normalize'

describe('normalize', () => {
  it('huruf kecil dan rapikan spasi', () => {
    expect(normalize('  AKSES   Kontak ')).toBe('akses kontak')
  })
  it('menangani variasi tulisan k0ntak / pr0fit / p4sti', () => {
    expect(normalize('akses k0ntak')).toBe('akses kontak')
    expect(normalize('pr0fit p4sti')).toBe('profit pasti')
  })
  it('tidak merusak angka yang menempel: 7hari, 10%, 5 menit', () => {
    expect(normalize('tenor 7hari untung 10% cair 5 menit')).toBe('tenor 7hari untung 10% cair 5 menit')
  })
  it('huruf berulang berlebihan diringkas', () => {
    expect(normalize('untuuuung pastiii')).toBe('untung pasti')
  })
  it('akhir kalimat jadi penanda batas, koma tetap token terpisah', () => {
    expect(normalize('Tanpa survei! Untung, pasti.')).toBe('tanpa survei | untung , pasti |')
  })
  it('angka berformat Indonesia tidak memutus kalimat: Rp1.600.000, 1,5%', () => {
    expect(normalize('Transfer Rp1.600.000 dulu. Bunga 1,5% per bulan.')).toBe('transfer rp1600000 dulu | bunga 1_5% per bulan |')
  })
})
