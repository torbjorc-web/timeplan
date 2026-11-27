import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../i18n/I18nContext'
import { FagfordelingPanel } from './FagfordelingPanel'
import { defaultInnstillinger, opprettTomtSkoleData } from '../defaults'
import type { Fag, Klasse, SkoleData } from '../types'

function settOpp(klasser: Klasse[] = [], fag: Fag[] = []) {
  const data: SkoleData = {
    skoleaar: '2024-2025',
    antallOekterPerDag: 6,
    innstillinger: defaultInnstillinger(),
    fag,
    rom: [],
    klasser,
    laerere: [],
    timeplan: [],
  }
  render(
    <I18nProvider>
      <FagfordelingPanel data={data} setData={vi.fn()} />
    </I18nProvider>,
  )
  return { data }
}

describe('FagfordelingPanel', () => {
  it('viser melding om ingen klasser når det ikke er registrert fag', () => {
    settOpp()
    expect(screen.getAllByText(/ingen klasser registrert/i).length).toBeGreaterThan(0)
  })

  it('beregner og viser fagbehov for et trinn med klasser', () => {
    settOpp([{ id: 'k1', navn: '1A', trinn: 'barnetrinn', elevtall: 30 }], opprettTomtSkoleData('2024-2025').fag)
    expect(screen.getByText(/30 elever totalt/i)).toBeInTheDocument()
    expect(screen.getAllByText('Norsk').length).toBeGreaterThan(0)
  })

  it('renderer fagfordelingen uten dupliserte React-keys', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      settOpp(
        [{ id: 'k1', navn: '1A', trinn: 'barnetrinn', elevtall: 30 }],
        opprettTomtSkoleData('2024-2025').fag,
      )

      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('same key'),
        expect.anything(),
      )
    } finally {
      consoleError.mockRestore()
    }
  })
})
