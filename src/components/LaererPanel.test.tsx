import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { LaererPanel } from './LaererPanel'
import { opprettTomtSkoleData } from '../defaults'
import type { Laerer } from '../types'

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

function settOpp(laerere: Laerer[] = [lagLaerer()]) {
  const data = { ...opprettTomtSkoleData('2024-2025'), laerere }
  const setData = vi.fn()
  render(
    <I18nProvider>
      <LaererPanel data={data} setData={setData} />
    </I18nProvider>,
  )
  return { data, setData }
}

describe('LaererPanel', () => {
  it('viser eksisterende lærere', () => {
    settOpp()
    expect(screen.getByDisplayValue('Lærer Larsen')).toBeInTheDocument()
  })

  it('legger til ny lærer', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    await bruker.click(screen.getByRole('button', { name: /legg til lærer/i }))
    expect(setData).toHaveBeenCalled()
  })

  it('sletter lærer', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    await bruker.click(screen.getByRole('button', { name: /^slett$/i }))
    expect(setData).toHaveBeenCalled()
  })

  it('åpner justeringer for lærer og legger til kontaktlærer-justering', async () => {
    const bruker = userEvent.setup()
    const { setData } = settOpp()
    await bruker.click(screen.getByRole('button', { name: /justeringer/i }))
    expect(screen.getByText(/justeringer for lærer larsen/i)).toBeInTheDocument()

    await bruker.click(screen.getByRole('button', { name: /\+ kontaktlærer/i }))
    expect(setData).toHaveBeenCalled()
  })

  it('lukker justeringspanelet igjen', async () => {
    const bruker = userEvent.setup()
    settOpp()
    await bruker.click(screen.getByRole('button', { name: /justeringer/i }))
    await bruker.click(screen.getByRole('button', { name: /lukk/i }))
    expect(screen.queryByText(/justeringer for lærer larsen/i)).not.toBeInTheDocument()
  })
})
