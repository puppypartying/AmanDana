import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RiskSummary } from './RiskSummary'
import { createAnalysis } from '@/lib/risk/analysis'

describe('RiskSummary', () => {
  it('menampilkan skor, level, alasan teratas, dan bukti terdeteksi', () => {
    const a = createAnalysis('Investasi', 'Untung 5% per hari! Transfer ke rekening pribadi admin. Slot tinggal 3 orang.')
    const html = renderToString(<RiskSummary analysis={a} onDetail={() => {}} />).replace(/<!-- -->/g, '')
    expect(html).toContain(`${a.score}`)
    expect(html).toContain('RISIKO TINGGI')
    expect(html).toContain('Terdeteksi')
    expect(html).toContain('detail lengkap')
  })
  it('tanpa bukti (data dari storage) tidak menampilkan "Terdeteksi"', () => {
    const a = { ...createAnalysis('Pinjol', 'wajib izin akses kontak'), matchedRules: [] }
    expect(renderToString(<RiskSummary analysis={a} onDetail={() => {}} />)).not.toContain('Terdeteksi')
  })
})
