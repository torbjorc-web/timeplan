import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { KlassePanel } from './KlassePanel'
import { opprettTomtSkoleData } from '../defaults'
import type { Klasse } from '../types'

function settOpp() {
  const data = { ...opprettTomtSkoleData('2024-2025'), klasser: [{ id: 'k1', navn: '1A', trinn: 'barnetrinn', elevtall: 22 } as Klasse] }
  const setData = vi.fn()
  render(
    <I18nProvider>
      <KlassePanel data={data} setData={setData} />
    </I18nProvider>,
  )
  return { data, setData }
}

describe('KlassePanel', () => {
  it('viser eksisterende klasser', () => {
    settOpp()
    expect(screen.getByDisplayValue('1A')).toBeInTheDocument()
    expect(screen.getByDisplayValue('22')).toBeInTheDocument()
  })

  it('legger til ny klasse', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    await bruker.click(screen.getByRole('button', { name: /legg til klasse/i }))
    expect(setData).toHaveBeenCalled()
  })

  it('sletter klasse', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    await bruker.click(screen.getByRole('button', { name: /^slett$/i }))
    expect(setData).toHaveBeenCalled()
  })

  it('endrer elevtall', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    await bruker.type(screen.getByDisplayValue('22'), '5')
    expect(setData).toHaveBeenCalled()
  })
})
