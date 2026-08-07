import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { TimeplanPanel } from './TimeplanPanel'
import { opprettTomtSkoleData } from '../defaults'
import type { Fag, Klasse, Laerer, SkoleData } from '../types'

vi.mock('../utils/csvExport', () => ({ lastNedCsv: vi.fn(), timeplanCsvRader: vi.fn(() => []) }))

function lagData(): SkoleData {
  const data = opprettTomtSkoleData('2024-2025')
  const fag: Fag = { id: 'f1', navn: 'Norsk', type: 'teoretisk', timerPerUke: 5, delingstall: 30 }
  const klasse: Klasse = { id: 'k1', navn: '1A', trinn: 'barnetrinn', elevtall: 20 }
  const laerer: Laerer = { id: 'l1', navn: 'Lærer Larsen', trinn: 'barnetrinn', stillingsprosent: 100, justeringer: [] }
  return { ...data, fag: [fag], klasser: [klasse], laerere: [laerer] }
}

function Wrapper({ initial }: { initial: SkoleData }) {
  const [data, setData] = useState(initial)
  return <TimeplanPanel data={data} setData={setData} />
}

function settOpp() {
  return render(
    <I18nProvider>
      <Wrapper initial={lagData()} />
    </I18nProvider>,
  )
}

async function velgOgLeggTil(bruker: ReturnType<typeof userEvent.setup>) {
  const comboboxer = screen.getAllByRole('combobox')
  // rekkefølge: dag, økt, fag, klasse, lærer, rom
  await bruker.selectOptions(comboboxer[2], 'Norsk')
  await bruker.selectOptions(comboboxer[3], '1A')
  await bruker.selectOptions(comboboxer[4], 'Lærer Larsen')
  await bruker.click(screen.getByRole('button', { name: /legg til time/i }))
}

describe('TimeplanPanel', () => {
  it('legger til en ny undervisningsøkt', async () => {
    const bruker = userEvent.setup()
    settOpp()
    await velgOgLeggTil(bruker)
    expect(screen.getByText('Norsk', { selector: 'strong' })).toBeInTheDocument()
  })

  it('varsler om konflikt ved dobbeltbooking av lærer', async () => {
    const bruker = userEvent.setup()
    settOpp()
    await velgOgLeggTil(bruker)
    await velgOgLeggTil(bruker)
    expect(screen.getByText(/konflikt oppdaget/i)).toBeInTheDocument()
    expect(screen.getByText(/læreren er allerede satt opp/i)).toBeInTheDocument()
  })

  it('legger til likevel til tross for konflikt', async () => {
    const bruker = userEvent.setup()
    settOpp()
    await velgOgLeggTil(bruker)
    await velgOgLeggTil(bruker)
    await bruker.click(screen.getByRole('button', { name: /legg til likevel/i }))
    expect(screen.getAllByText('Norsk', { selector: 'strong' }).length).toBe(2)
  })

  it('sletter en oppføring', async () => {
    const bruker = userEvent.setup()
    settOpp()
    await velgOgLeggTil(bruker)
    await bruker.click(screen.getByRole('button', { name: /^slett$/i }))
    expect(screen.queryByText('Norsk', { selector: 'strong' })).not.toBeInTheDocument()
  })
})
