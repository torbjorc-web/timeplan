import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { AarsplanPanel } from './AarsplanPanel'
import { opprettTomtSkoleData } from '../defaults'
import type { Laerer } from '../types'

vi.mock('../utils/csvExport', () => ({ lastNedCsv: vi.fn() }))

function lagLaerer(overstyring: Partial<Laerer> = {}): Laerer {
  return {
    id: 'l1',
    navn: 'Lærer Larsen',
    trinn: 'barnetrinn',
    stillingsprosent: 100,
    justeringer: [],
    ...overstyring,
  }
}

function settOpp(laerere: Laerer[] = [], regelverk: 'arsramme' | 'leseplikt_uke' = 'arsramme') {
  const data = opprettTomtSkoleData('2024-2025', regelverk)
  data.laerere = laerere
  render(
    <I18nProvider>
      <AarsplanPanel data={data} setData={vi.fn()} />
    </I18nProvider>,
  )
  return { data }
}

describe('AarsplanPanel', () => {
  it('viser melding om ingen lærere når listen er tom', () => {
    settOpp()
    expect(screen.getByText(/ingen lærere registrert/i)).toBeInTheDocument()
  })

  it('viser årsplan for lærer med årsramme-regelverk', () => {
    settOpp([lagLaerer()])
    expect(screen.getByText(/lærer larsen/i)).toBeInTheDocument()
  })

  it('viser leseplikt-kolonner når regelverk er leseplikt_uke', () => {
    settOpp([lagLaerer()], 'leseplikt_uke')
    expect(screen.getByText('Leseplikt (timer/uke)')).toBeInTheDocument()
  })

  it('kaller csv-eksport ved klikk på last ned', async () => {
    const bruker = userEvent.setup()
    const { lastNedCsv } = await import('../utils/csvExport')
    settOpp([lagLaerer()])
    await bruker.click(screen.getByRole('button', { name: /last ned csv/i }))
    expect(lastNedCsv).toHaveBeenCalled()
  })
})
