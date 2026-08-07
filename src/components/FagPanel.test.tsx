import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { FagPanel } from './FagPanel'
import { opprettTomtSkoleData } from '../defaults'

function settOpp() {
  const data = opprettTomtSkoleData('2024-2025')
  const setData = vi.fn()
  render(
    <I18nProvider>
      <FagPanel data={data} setData={setData} />
    </I18nProvider>,
  )
  return { data, setData }
}

describe('FagPanel', () => {
  it('viser eksisterende fag', () => {
    settOpp()
    expect(screen.getByDisplayValue('Norsk')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Matematikk')).toBeInTheDocument()
  })

  it('legger til nytt fag', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    await bruker.click(screen.getByRole('button', { name: /legg til fag/i }))
    expect(setData).toHaveBeenCalled()
  })

  it('sletter fag', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    const slettKnapper = screen.getAllByRole('button', { name: /^slett$/i })
    await bruker.click(slettKnapper[0])
    expect(setData).toHaveBeenCalled()
  })

  it('endrer navn på fag', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    const input = screen.getByDisplayValue('Norsk')
    await bruker.type(input, 'X')
    expect(setData).toHaveBeenCalled()
  })
})
