import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AdminPage from './AdminPage'

describe('AdminPage', () => {
  it('render awal: tab Matriks dengan data tuning dan holdout, tanpa masalah aturan', () => {
    const html = renderToString(<AdminPage />).replace(/<!-- -->/g, '')
    expect(html).toContain('Admin AmanDana')
    expect(html).toContain('Data tuning')
    expect(html).toContain('Data holdout')
    expect(html).toContain('Holdout baru 20 pesan')
    expect(html).not.toContain('masalah pada aturan draf')
  })
})
