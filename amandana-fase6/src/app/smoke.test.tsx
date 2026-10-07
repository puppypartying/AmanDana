import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { beforeAll, describe, expect, it } from 'vitest'
import { Shell } from './Shell'
import { AppStateProvider } from '@/state/AppState'

beforeAll(() => {
  // @ts-expect-error stub minimal untuk render di Node
  globalThis.window = { matchMedia: () => ({ matches: false }), scrollTo: () => {} }
})

function render(path: string) {
  return renderToString(
    <StaticRouter location={path}>
      <AppStateProvider>
        <Shell />
      </AppStateProvider>
    </StaticRouter>,
  )
}

describe('smoke render per rute', () => {
  it.each([
    ['/', 'Analisis Sekarang'],
    ['/hasil', 'Belum ada tawaran yang dianalisis'],
    ['/simulator', 'Rumus yang dipakai'],
    ['/bantuan', 'Template Aduan'],
    ['/belajar', 'Kartu Tanda Bahaya'],
    ['/pengaturan', 'Hapus semua data saya'],
    ['/privasi', 'Yang disimpan di perangkat ini'],
  ])('%s menampilkan "%s"', (path, text) => {
    expect(render(path)).toContain(text)
  })
})
