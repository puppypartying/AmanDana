import { describe, expect, it } from 'vitest'
import { FIXTURES } from './__fixtures__/offers'
import rules from './rules.json'
import { evaluate } from './evaluate'
import { scoreOffer } from './engine'

const byId = (id: string) => FIXTURES.find((f) => f.id === id)!
const run = (id: string) => scoreOffer(byId(id).text, byId(id).kind)

describe('3 kasus temuan', () => {
  it('pinjaman sah yang menyebut "cair" dan "biaya admin" bukan skor 36', () => {
    const r = run('s01')
    expect(r.score).not.toBe(36)
    expect(r.score).toBeLessThan(40)
  })
  it('"tidak menjamin untung" tidak kena +28', () => {
    const r = run('s02')
    expect(r.matchedRules.map((m) => m.id)).not.toContain('inv-imbal-pasti')
    expect(r.score).toBe(0)
  })
  it('"wajib izinkan akses kontak, kalau telat kami sebar data ke semua kontakmu" = Tinggi, bukan 0', () => {
    const r = run('d20')
    expect(r.score).toBeGreaterThan(0)
    expect(r.level).toBe('Tinggi')
  })
})

describe('sinkron dengan laporan Bab 4.3', () => {
  it('bobot 10 aturan laporan Bab 4.3 tidak berubah', () => {
    const expected: Record<string, number> = {
      'inv-imbal-pasti': 28, 'inv-ajak-teman': 20, 'inv-rekening-pribadi': 24, 'inv-tekanan-waktu': 10, 'inv-catut-ojk': 18,
      'pin-akses-kontak': 25, 'pin-ancaman': 25, 'pin-potongan-muka': 20, 'pin-tenor-pendek': 15, 'pin-bunga-denda': 15,
    }
    const report = Object.fromEntries(rules.rules.filter((r) => r.enabled && r.source === 'laporan-4.3').map((r) => [r.id, r.weight]))
    expect(report).toEqual(expected)
  })
  it('aturan aktif di luar laporan hanya yang didaftarkan di sini (tambahan audit D1/D2, bobot usulan belum divalidasi)', () => {
    // Menambah aturan aktif baru harus sadar: daftarkan di sini DAN di Bab 4.3 laporan.
    const extra = rules.rules.filter((r) => r.enabled && r.source !== 'laporan-4.3').map((r) => r.id).sort()
    expect(extra).toEqual(['inv-kripto-robot', 'inv-tugas-komisi', 'pin-rekening-pribadi', 'umum-apk', 'umum-biaya-dimuka', 'umum-deposit-dulu', 'umum-minta-otp', 'umum-url-pendek'])
  })
  it('contoh Lampiran B: jumlah aditif 82 dan 60; akses kontak = sinyal kritis, jadi contoh 2 naik ke Tinggi (70)', () => {
    expect(run('d01').score).toBe(82)
    expect(run('d01').level).toBe('Tinggi')
    // Jumlah aditif contoh 2 tetap 60 (25 + 20 + 15), tetapi akses kontak sekarang memicu lantai 70 (audit D2).
    const d11 = run('d11')
    expect(d11.matchedRules.reduce((t, m) => t + m.weight, 0)).toBe(60)
    expect(d11.score).toBe(70)
    expect(d11.level).toBe('Tinggi')
  })
})

describe('perilaku engine', () => {
  it('negasi: "tanpa akses kontak" tidak menambah skor', () => {
    expect(scoreOffer('Pinjaman tanpa akses kontak dan tanpa akses galeri.', 'Pinjol').score).toBe(0)
  })
  it('kombinasi akses kontak + ancaman sebar data minimal Tinggi', () => {
    const r = scoreOffer('Akses kontak wajib. Telat bayar kami sebar data kamu.', 'Pinjol')
    expect(r.level).toBe('Tinggi')
    expect(r.reasons.some((x) => x.ruleId === 'combo-kontak-ancaman')).toBe(true)
  })
  it('variasi tulisan tetap terdeteksi', () => {
    const r = scoreOffer('wajib izin akses k0ntak', 'Pinjol')
    expect(r.matchedRules.map((m) => m.id)).toEqual(['pin-akses-kontak'])
    expect(r.level).toBe('Tinggi')
  })
  it('aturan investasi tidak berlaku untuk jenis Pinjol', () => {
    const r = scoreOffer('Untung pasti, transfer ke rekening pribadi admin', 'Pinjol')
    expect(r.matchedRules.every((m) => !m.id.startsWith('inv-'))).toBe(true)
  })
  it('skor dibatasi 100 dan output terstruktur', () => {
    const r = scoreOffer(byId('d01').text, 'Investasi')
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.matchedRules.length).toBe(r.reasons.length)
    expect(r.matchedRules[0]).toHaveProperty('evidence')
  })
})

describe('evaluasi set uji berlabel (40 pesan)', () => {
  it('set berisi 20 berbahaya dan 20 sah', () => {
    expect(FIXTURES.filter((f) => f.label === 'berbahaya')).toHaveLength(20)
    expect(FIXTURES.filter((f) => f.label === 'sah')).toHaveLength(20)
  })
  it('precision dan recall ambang Sedang (>=40) minimal 80%, sesuai target Bab 7.4', () => {
    const r = evaluate(FIXTURES, 40)
    expect(r.precision).toBeGreaterThanOrEqual(0.8)
    expect(r.recall).toBeGreaterThanOrEqual(0.8)
  })
})

describe('pembacaan angka dan lantai skor (Opsi A)', () => {
  it('untung 5% per hari dibaca sebagai imbal hasil tidak wajar tanpa kata "pasti"', () => {
    const r = scoreOffer('Join sekarang, untung 5% per hari langsung masuk.', 'Investasi')
    expect(r.matchedRules.map((m) => m.id)).toContain('inv-imbal-pasti')
    expect(r.score).toBeGreaterThanOrEqual(40)
  })
  it('imbal hasil wajar (7% per tahun) tidak ditandai', () => {
    expect(scoreOffer('Reksa dana pendapatan tetap, return 7% per tahun, bisa naik turun.', 'Investasi').score).toBe(0)
  })
  it('janji untung tidak wajar + rekening pribadi minimal Tinggi', () => {
    expect(scoreOffer('Untung 3% per hari, transfer ke rekening pribadi admin.', 'Investasi').level).toBe('Tinggi')
  })
  it('ancaman penagihan saja minimal Tinggi', () => {
    expect(scoreOffer('Telat bayar, kami sebarkan foto KTP kamu.', 'Pinjol').level).toBe('Tinggi')
  })
  it('dana cair jauh lebih kecil dari pinjaman dibaca sebagai potongan di muka', () => {
    const r = scoreOffer('Pinjaman Rp1 juta, dana cair Rp800 ribu.', 'Pinjol')
    expect(r.matchedRules.map((m) => m.id)).toContain('pin-potongan-muka')
  })
  it('biaya admin kecil (2%) tidak ditandai', () => {
    expect(scoreOffer('Biaya admin 2% dari pinjaman, bunga 1,5% per bulan.', 'Pinjol').score).toBe(0)
  })
})

describe('aturan tambahan audit (D1/D2) dan sinyal kritis', () => {
  const ids = (text: string, kind: 'Pinjol' | 'Investasi') => scoreOffer(text, kind).matchedRules.map((m) => m.id)
  it('minta OTP/PIN = Tinggi; peringatan "jangan berikan OTP" bukan ancaman', () => {
    expect(scoreOffer('Kirimkan kode OTP kamu ke petugas kami agar pinjaman cair.', 'Pinjol').level).toBe('Tinggi')
    expect(scoreOffer('Jangan pernah berikan kode OTP atau PIN kamu ke siapa pun.', 'Pinjol').score).toBe(0)
    expect(scoreOffer('Kode OTP Anda 482913. Jangan berikan kode ini kepada siapa pun.', 'Pinjol').score).toBe(0)
  })
  it('biaya/pajak harus dibayar dulu agar dana cair = Tinggi, walau nominal berformat Rp150.000', () => {
    expect(scoreOffer('Transfer biaya aktivasi Rp150.000 dulu supaya pinjaman Rp5 juta bisa dicairkan.', 'Pinjol').level).toBe('Tinggi')
    expect(scoreOffer('Saldo sudah bisa ditarik, tapi harus bayar pajak penarikan 15% dulu.', 'Investasi').level).toBe('Tinggi')
    expect(scoreOffer('Biaya admin 2% dipotong saat pencairan dan tertulis jelas di perjanjian.', 'Pinjol').score).toBe(0)
  })
  it('rekening atas nama perorangan terdeteksi (a.n. dan a/n), rekening perusahaan atau milik sendiri tidak', () => {
    expect(ids('Transfer ke rekening BCA a.n. Siti Rahma ya', 'Investasi')).toContain('inv-rekening-pribadi')
    expect(ids('Setor ke rekening a/n Agus Prasetyo', 'Investasi')).toContain('inv-rekening-pribadi')
    expect(ids('Dana cair ke rekening atas nama kamu sendiri', 'Pinjol')).toEqual([])
    expect(ids('Bayar ke rekening atas nama PT Maju Jaya', 'Investasi')).toEqual([])
  })
  it('APK dan robot trading terdeteksi; saran "hindari file APK" tidak', () => {
    expect(ids('Download aplikasi lewat file APK ini ya kak', 'Pinjol')).toContain('umum-apk')
    expect(ids('Robot trading kami auto profit tiap hari', 'Investasi')).toContain('inv-kripto-robot')
    expect(ids('Hindari mengunduh file APK dari link yang tidak dikenal.', 'Investasi')).toEqual([])
  })
  it('tugas berkomisi + deposit dulu = Tinggi', () => {
    const r = scoreOffer('Kerja part time, 1 tugas dibayar Rp25.000. Deposit dulu Rp300.000 untuk aktivasi.', 'Investasi')
    expect(r.level).toBe('Tinggi')
  })
  it('sinyal di kalimat peringatan/edukasi tetap dihitung tetapi tidak memicu lantai skor', () => {
    const r = scoreOffer('Hati-hati tawaran pinjol: aplikasi yang meminta akses kontak dan galeri adalah tanda bahaya.', 'Pinjol')
    expect(r.matchedRules[0].warning).toBe(true)
    expect(r.level).toBe('Rendah')
  })
  it('REGRESI (deposito): "dijamin LPS" bukan janji imbal hasil pasti', () => {
    const r = scoreOffer('Deposito berjangka 6 bulan bunga 4,25% per tahun, dijamin LPS sesuai ketentuan.', 'Investasi')
    expect(r.matchedRules.map((m) => m.id)).not.toContain('inv-imbal-pasti')
    expect(r.level).not.toBe('Tinggi')
  })
  it('angka: "profit 2% sehari" dan "modal Rp1 juta jadi Rp8 juta dalam 7 hari" dibaca sebagai imbal tidak wajar', () => {
    expect(ids('Robot kami profit 2% sehari, tinggal duduk manis.', 'Investasi')).toContain('inv-imbal-pasti')
    expect(ids('Modal Rp1 juta jadi Rp8 juta dalam 7 hari!', 'Investasi')).toContain('inv-imbal-pasti')
    expect(ids('Return IHSG minggu ini naik 1,2% tapi aku masih rugi 3%', 'Investasi')).toEqual([])
  })
})
