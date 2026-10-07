const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's' }

/**
 * Menormalkan teks sebelum pencocokan aturan:
 * huruf kecil, buang aksen/karakter tak terlihat, ubah variasi tulisan (k0ntak -> kontak)
 * hanya jika angka/simbol terapit huruf, ringkas huruf berulang >=3, dan beri penanda batas:
 * akhir kalimat -> "|", koma -> token "," (dipakai untuk membatasi cakupan negasi).
 */
export function normalize(input: string): string {
  let t = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u200b-\u200d\ufeff]/g, '')
  for (let i = 0; i < 3; i++) t = t.replace(/(?<=[a-z])[013457@$](?=[a-z])/g, (c) => LEET[c])
  t = t.replace(/([a-z])\1{2,}/g, '$1')
  t = t.replace(/[.!?;\n\r]+/g, ' | ').replace(/,/g, ' , ')
  t = t.replace(/[^a-z0-9%\s|,]/g, ' ')
  return t.replace(/\s+/g, ' ').trim()
}
