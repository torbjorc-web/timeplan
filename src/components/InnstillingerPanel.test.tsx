import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { InnstillingerPanel } from './InnstillingerPanel'
import { opprettTomtSkoleData } from '../defaults'

function settOpp() {
  const data = opprettTomtSkoleData('2024-2025')
  const setData = vi.fn()
  render(
    <I18nProvider>
      <InnstillingerPanel data={data} setData={setData} />
    </I18nProvider>,
  )
  return { data, setData }
}

describe('InnstillingerPanel', () => {
  it('viser årsramme-tabellen som standard', () => {
    settOpp()
    expect(screen.getByText('Trinn')).toBeInTheDocument()
    expect(screen.getByText('Fra alder')).toBeInTheDocument()
  })

  it('bytter til leseplikt-visning ved valg av regelverk', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    await bruker.selectOptions(screen.getByRole('combobox'), 'leseplikt_uke')
    expect(setData).toHaveBeenCalled()
  })

  it('endrer delingstall for en fagtype', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    const input = screen.getAllByDisplayValue('30')[0]
    await bruker.type(input, '5')
    expect(setData).toHaveBeenCalled()
  })

  it('legger til og sletter en seniorregel', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    await bruker.click(screen.getByRole('button', { name: /legg til seniorregel/i }))
    expect(setData).toHaveBeenCalled()

    await bruker.click(screen.getAllByRole('button', { name: /^slett$/i })[0])
    expect(setData).toHaveBeenCalledTimes(2)
  })
})
