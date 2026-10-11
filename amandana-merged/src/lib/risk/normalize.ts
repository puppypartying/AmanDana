const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's' }

/**
 * Menormalkan teks sebelum pencocokan aturan:
 * huruf kecil, buang aksen/karakter tak terlihat, ubah variasi tulisan (k0ntak -> kontak)
 * hanya jika angka/simbol terapit huruf, ringkas huruf berulang >=3, dan beri penanda batas:
 * akhir kalimat -> "|", koma -> token "," (dipakai untuk membatasi cakupan negasi),
 * dan rapikan angka (lihat komentar di bawah).
 */
export function normalize(input: string): string {
  let t = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u200b-\u200d\ufeff]/g, '')
  // Angka: pemisah ribuan dibuang (1.600.000 -> 1600000), desimal diberi penanda "_" (1,5 -> 1_5),
  // supaya titik/koma di dalam angka tidak dianggap batas kalimat atau klausa.
  t = t.replace(/(?<=\d)[.,](?=\d{3}(?!\d))/g, '').replace(/(?<=\d)[.,](?=\d)/g, '_')
  // Singkatan "a.n." / "a/n" (atas nama) jadi "an" supaya titiknya tidak dianggap akhir kalimat.
  t = t.replace(/\ba\.\s?n\.?(?=\s)/g, 'an').replace(/\ba\/n\b/g, 'an')
  for (let i = 0; i < 3; i++) t = t.replace(/(?<=[a-z])[013457@$](?=[a-z])/g, (c) => LEET[c])
  t = t.replace(/([a-z])\1{2,}/g, '$1')
  t = t.replace(/[.!?;\n\r]+/g, ' | ').replace(/,/g, ' , ')
  t = t.replace(/[^a-z0-9%_\s|,]/g, ' ')
  return t.replace(/\s+/g, ' ').trim()
}
