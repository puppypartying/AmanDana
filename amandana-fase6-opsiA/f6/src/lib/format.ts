export const MASK = '[nomor disamarkan]'

const SENSITIVE_WORD = '(?:rekening|rek|norek|no\\.?\\s*rek|va|virtual\\s+account|otp|pin|ovo|gopay|shopeepay|linkaja|wa|whatsapp|telp|telepon|hp)'

/**
 * Menyamarkan angka sensitif (rekening, telepon, OTP/PIN), bukan hanya angka panjang:
 * 1. angka (min. 4 digit) tepat setelah kata kunci seperti "rekening", "OTP", "PIN", "WA";
 * 2. nomor telepon Indonesia (08..., +62..., 62...) dengan spasi/titik/strip;
 * 3. deretan >= 8 digit (spasi/titik/strip boleh menyela), kecuali nominal rupiah, tanggal, dan format ribuan "15.000.000".
 * Angka biasa (10%, 7 hari, Rp500.000) tidak disentuh. Hasilnya idempoten.
 * Keterbatasan: nomor bertitik 3-3-3 yang tidak didahului kata kunci mirip format ribuan, jadi tidak disamarkan.
 */
export function maskNumbers(text: string): string {
  let t = text.replace(new RegExp(`\\b(${SENSITIVE_WORD})\\b([^\\d\\n]{0,25}?)(\\+?\\d[\\d\\s.-]{2,}\\d)`, 'gi'), (_m, word: string, gap: string) => `${word}${gap}${MASK}`)
  t = t.replace(/(?<![\d])(?:\+?62|0)[\s.-]?8\d{1,3}(?:[\s.-]?\d{2,5}){2,3}(?!\d)/g, MASK)
  t = t.replace(/(?<![\d.])\d(?:[\s.-]?\d){7,}(?![\d])/g, (match, offset: number, whole: string) => {
    const before = whole.slice(Math.max(0, offset - 4), offset)
    if (/(?:rp|idr)\.?\s*$/i.test(before)) return match
    if (/^\d{1,3}(?:\.\d{3})+$/.test(match)) return match
    if (/^\d{1,2}[-./]\d{1,2}[-./]\d{2,4}$/.test(match)) return match
    return MASK
  })
  return t
}

export function rupiah(value: number): string {
  return `Rp${Math.round(value).toLocaleString('id-ID')}`
}
