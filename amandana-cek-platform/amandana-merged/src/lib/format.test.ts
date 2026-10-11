import { describe, expect, it } from 'vitest'
import { maskNumbers, rupiah } from './format'

describe('maskNumbers', () => {
  it('menyamarkan angka panjang (rekening/telepon)', () => {
    expect(maskNumbers('transfer ke 1234567890')).toBe('transfer ke [nomor disamarkan]')
  })
  it('tidak mengubah angka pendek', () => {
    expect(maskNumbers('untung 10% per minggu')).toBe('untung 10% per minggu')
  })
  it.each([
    ['hubungi 0812-3456-7890 sekarang', 'hubungi [nomor disamarkan] sekarang'],
    ['WA +62 812 3456 7890 ya', 'WA [nomor disamarkan] ya'],
    ['telepon 081234567890.', 'telepon [nomor disamarkan].'],
    ['rekening 1234-5678-90', 'rekening [nomor disamarkan]'],
    ['rek BCA 123.456.789.0 a/n Budi', 'rek BCA [nomor disamarkan] a/n Budi'],
  ])('menyamarkan nomor telepon/rekening berformat: %s', (input, expected) => {
    expect(maskNumbers(input)).toBe(expected)
  })
  it('menyamarkan angka pendek yang didahului kata kunci sensitif', () => {
    expect(maskNumbers('kode OTP 123456 jangan dibagi')).toBe('kode OTP [nomor disamarkan] jangan dibagi')
    expect(maskNumbers('pin: 4821')).toBe('pin: [nomor disamarkan]')
    expect(maskNumbers('norek 98765 an Budi')).toBe('norek [nomor disamarkan] an Budi')
  })
  it('tidak menyentuh nominal, tenor, persen, tanggal, dan kata mirip kata kunci', () => {
    for (const t of [
      'pinjaman Rp 15.000.000 tenor 30 hari bunga 0,8% per hari',
      'dana cair 800000 dalam 5 menit',
      'Rp12345678 dipotong di muka',
      'Pinjaman cair tanggal 01-01-2024 sebesar 15.000.000',
      'pinjaman 2 juta, pin kecil saja',
      'modal 500rb jadi 5 juta dalam 7 hari',
    ]) expect(maskNumbers(t)).toBe(t)
  })
  it('idempoten', () => {
    const once = maskNumbers('rek 1234567890 dan WA 0812 3456 7890, OTP 5521')
    expect(maskNumbers(once)).toBe(once)
  })
})

describe('rupiah', () => {
  it('memformat dengan pemisah ribuan id-ID', () => {
    expect(rupiah(2_000_000)).toBe('Rp2.000.000')
  })
})
