import { FIXTURES } from '../src/lib/risk/__fixtures__/offers'
import { HOLDOUT } from '../src/lib/risk/__fixtures__/holdout'
import { evaluate } from '../src/lib/risk/evaluate'

const pct = (n: number) => `${(n * 100).toFixed(1)}%`
const sets = [
  { name: 'SET DEV (offers.ts), dipakai menyetel aturan: optimistis', data: FIXTURES },
  { name: 'SET HOLDOUT (holdout.ts), ditulis sebelum engine v3; sudah dipakai menemukan bug jadi tidak lagi bersih', data: HOLDOUT },
]
for (const set of sets) {
  console.log(`\n######## ${set.name}`)
  console.log(`${set.data.length} pesan (${set.data.filter((f) => f.label === 'berbahaya').length} berbahaya, ${set.data.filter((f) => f.label === 'sah').length} sah)\n`)
  for (const [name, threshold] of [['Waspada (skor >= 40, Sedang atau Tinggi)', 40], ['Risiko Tinggi (skor >= 70)', 70]] as const) {
    const r = evaluate(set.data, threshold)
    console.log(`== ${name}`)
    console.log(`   TP=${r.tp} FP=${r.fp} FN=${r.fn} TN=${r.tn}`)
    console.log(`   precision=${pct(r.precision)}  recall=${pct(r.recall)}  F1=${pct(r.f1)}`)
    if (r.wrong.length) {
      console.log('   salah klasifikasi:')
      for (const w of r.wrong) console.log(`     - ${w.id} (label ${w.label}) skor ${w.score} aturan: ${w.rules.join(', ') || '-'}`)
    }
  }
}
console.log('\nCatatan: kedua set SINTETIS dan ditulis oleh penyusun aturan. Untuk angka yang boleh dikutip di laporan, uji dengan pesan nyata berlabel yang belum pernah dilihat engine.')
