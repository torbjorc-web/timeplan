import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { RomPanel } from './RomPanel'
import { opprettTomtSkoleData } from '../defaults'

function settOpp() {
  const data = opprettTomtSkoleData('2024-2025')
  const setData = vi.fn()
  render(
    <I18nProvider>
      <RomPanel data={data} setData={setData} />
    </I18nProvider>,
  )
  return { data, setData }
}

describe('RomPanel', () => {
  it('viser eksisterende rom', () => {
    settOpp()
    expect(screen.getByDisplayValue('Klasserom A')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Sløydsal')).toBeInTheDocument()
  })

  it('legger til nytt rom', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    await bruker.click(screen.getByRole('button', { name: /legg til rom/i }))
    expect(setData).toHaveBeenCalled()
  })

  it('sletter rom', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    const slettKnapper = screen.getAllByRole('button', { name: /^slett$/i })
    await bruker.click(slettKnapper[0])
    expect(setData).toHaveBeenCalled()
  })

  it('endrer kan-ikke-deles avkrysning', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    const avkrysninger = screen.getAllByRole('checkbox')
    await bruker.click(avkrysninger[0])
    expect(setData).toHaveBeenCalled()
  })
})
