import { FIXTURES } from '../src/lib/risk/__fixtures__/offers'
import { evaluate } from '../src/lib/risk/evaluate'

const pct = (n: number) => `${(n * 100).toFixed(1)}%`
console.log(`Set uji: ${FIXTURES.length} pesan (${FIXTURES.filter((f) => f.label === 'berbahaya').length} berbahaya, ${FIXTURES.filter((f) => f.label === 'sah').length} sah)\n`)
for (const [name, threshold] of [['Waspada (skor >= 40, Sedang atau Tinggi)', 40], ['Risiko Tinggi (skor >= 70)', 70]] as const) {
  const r = evaluate(FIXTURES, threshold)
  console.log(`== ${name}`)
  console.log(`   TP=${r.tp} FP=${r.fp} FN=${r.fn} TN=${r.tn}`)
  console.log(`   precision=${pct(r.precision)}  recall=${pct(r.recall)}  F1=${pct(r.f1)}`)
  if (r.wrong.length) {
    console.log('   salah klasifikasi:')
    for (const w of r.wrong) console.log(`     - ${w.id} (label ${w.label}) skor ${w.score} aturan: ${w.rules.join(', ') || '-'}`)
  }
  console.log()
}
console.log('Catatan: fixture sintetis dan sama dengan yang dipakai menyetel aturan, jadi angka ini optimistis. Uji ulang dengan data baru sebelum dikutip di laporan.')
