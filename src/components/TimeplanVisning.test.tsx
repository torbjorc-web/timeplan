import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { TimeplanVisning } from './TimeplanVisning'
import { opprettTomtSkoleData } from '../defaults'
import type { Fag, Klasse, Laerer, SkoleData, TimeplanOppforing } from '../types'

vi.mock('../utils/csvExport', () => ({ lastNedCsv: vi.fn(), timeplanCsvRader: vi.fn(() => []) }))

function lagData(): SkoleData {
  const data = opprettTomtSkoleData('2024-2025')
  const fag: Fag = { id: 'f1', navn: 'Norsk', type: 'teoretisk', timerPerUke: 5, delingstall: 30 }
  const klasse: Klasse = { id: 'k1', navn: '1A', trinn: 'barnetrinn', elevtall: 20 }
  const laerer: Laerer = { id: 'l1', navn: 'Lærer Larsen', trinn: 'barnetrinn', stillingsprosent: 100, justeringer: [] }
  const oppforing: TimeplanOppforing = { id: 'o1', dag: 'Mandag', oekt: 1, fagId: 'f1', klasseId: 'k1', laererId: 'l1' }
  return { ...data, fag: [fag], klasser: [klasse], laerere: [laerer], timeplan: [oppforing] }
}

function settOpp() {
  render(
    <I18nProvider>
      <TimeplanVisning data={lagData()} setData={vi.fn()} />
    </I18nProvider>,
  )
}

describe('TimeplanVisning', () => {
  it('viser registrerte undervisningsøkter i riktig celle', () => {
    settOpp()
    expect(screen.getByText('Norsk')).toBeInTheDocument()
    expect(screen.getByText('1A')).toBeInTheDocument()
    expect(screen.getByText('Lærer Larsen')).toBeInTheDocument()
  })

  it('kaller csv-eksport ved klikk på last ned', async () => {
    const bruker = userEvent.setup()
    const { lastNedCsv } = await import('../utils/csvExport')
    settOpp()
    await bruker.click(screen.getByRole('button', { name: /last ned csv/i }))
    expect(lastNedCsv).toHaveBeenCalled()
  })
})
