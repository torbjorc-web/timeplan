import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { BrukerePanel } from './BrukerePanel'
import { opprettTomtSkoleData } from '../defaults'
import type { Laerer } from '../types'

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api')
  return { ...actual, apiGet: vi.fn(), apiPost: vi.fn(), apiDelete: vi.fn() }
})

const api = await import('../api')

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

function settOpp() {
  const data = { ...opprettTomtSkoleData('2024-2025'), laerere: [lagLaerer()] }
  return render(
    <I18nProvider>
      <BrukerePanel data={data} setData={vi.fn()} />
    </I18nProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.apiGet).mockResolvedValue([])
})

describe('BrukerePanel', () => {
  it('laster og viser eksisterende brukere', async () => {
    vi.mocked(api.apiGet).mockResolvedValue([
      { id: 'b1', brukernavn: 'lærer.en', navn: 'Lærer En', rolle: 'laerer' },
    ])
    settOpp()

    expect(await screen.findByText('Lærer En')).toBeInTheDocument()
    expect(api.apiGet).toHaveBeenCalledWith('/brukere')
  })

  it('skjuler slett-knapp for avdelingsleder-rader', async () => {
    vi.mocked(api.apiGet).mockResolvedValue([
      { id: 'b1', brukernavn: 'leder', navn: 'Leder Ledersen', rolle: 'avdelingsleder' },
    ])
    settOpp()

    await screen.findByText('Leder Ledersen')
    expect(screen.queryByRole('button', { name: /slett/i })).not.toBeInTheDocument()
  })

  it('viser lærer-valg som standard siden rolle starter som lærer', async () => {
    settOpp()
    await waitFor(() => expect(api.apiGet).toHaveBeenCalled())

    expect(screen.getByText(/lærer larsen/i)).toBeInTheDocument()
  })

  it('oppretter en ny bruker og tømmer skjemaet', async () => {
    vi.mocked(api.apiPost).mockResolvedValue({})
    const bruker = userEvent.setup()
    settOpp()
    await waitFor(() => expect(api.apiGet).toHaveBeenCalled())

    await bruker.type(screen.getByPlaceholderText('Navn'), 'Ny Lærer')
    await bruker.type(screen.getByPlaceholderText('Brukernavn'), 'ny.laerer')
    await bruker.type(screen.getByPlaceholderText(/passord/i), 'langtPassord1')
    await bruker.selectOptions(screen.getByText(/velg lærer-record/i).closest('select')!, 'l1')
    await bruker.click(screen.getByRole('button', { name: /opprett bruker/i }))

    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith('/brukere', {
        navn: 'Ny Lærer',
        brukernavn: 'ny.laerer',
        passord: 'langtPassord1',
        rolle: 'laerer',
        laererId: 'l1',
      })
    })
    expect(screen.getByPlaceholderText('Navn')).toHaveValue('')
  })

  it('viser feilmelding når oppretting feiler', async () => {
    vi.mocked(api.apiPost).mockRejectedValue(new api.ApiFeil('Brukernavnet er allerede i bruk.'))
    const bruker = userEvent.setup()
    settOpp()
    await waitFor(() => expect(api.apiGet).toHaveBeenCalled())

    await bruker.type(screen.getByPlaceholderText('Navn'), 'Ny Lærer')
    await bruker.type(screen.getByPlaceholderText('Brukernavn'), 'ny.laerer')
    await bruker.type(screen.getByPlaceholderText(/passord/i), 'langtPassord1')
    await bruker.selectOptions(screen.getByText(/velg lærer-record/i).closest('select')!, 'l1')
    await bruker.click(screen.getByRole('button', { name: /opprett bruker/i }))

    expect(await screen.findByText(/allerede i bruk/i)).toBeInTheDocument()
  })

  it('sletter en bruker ved klikk på slett', async () => {
    vi.mocked(api.apiGet).mockResolvedValue([
      { id: 'b1', brukernavn: 'laerer.en', navn: 'Lærer En', rolle: 'laerer' },
    ])
    vi.mocked(api.apiDelete).mockResolvedValue({})
    const bruker = userEvent.setup()
    settOpp()

    await screen.findByText('Lærer En')
    await bruker.click(screen.getByRole('button', { name: /slett/i }))

    await waitFor(() => expect(api.apiDelete).toHaveBeenCalledWith('/brukere/b1'))
  })
})
