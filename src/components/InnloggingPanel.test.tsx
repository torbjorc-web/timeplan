import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { AuthProvider } from '../AuthContext'
import { InnloggingPanel } from './InnloggingPanel'

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api')
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
  }
})

const api = await import('../api')

function settOpp() {
  return render(
    <I18nProvider>
      <AuthProvider>
        <InnloggingPanel />
      </AuthProvider>
    </I18nProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.apiGet).mockRejectedValue(new api.ApiFeil('Ikke innlogget'))
})

describe('InnloggingPanel', () => {
  it('viser innloggingsskjema som standard', () => {
    settOpp()
    expect(screen.getByRole('heading', { name: /logg inn/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /registrer ny avdeling/i })).not.toBeInTheDocument()
  })

  it('bytter til registreringsskjema', async () => {
    const bruker = userEvent.setup()
    settOpp()
    await bruker.click(screen.getByRole('button', { name: /registrer her/i }))
    expect(screen.getByRole('heading', { name: /registrer ny avdeling/i })).toBeInTheDocument()
  })

  it('sender inn brukernavn og passord ved innlogging', async () => {
    vi.mocked(api.apiPost).mockResolvedValue({ navn: 'Test', rolle: 'avdelingsleder' })
    const bruker = userEvent.setup()
    settOpp()

    await bruker.type(screen.getByLabelText(/brukernavn/i), 'ola.nordmann')
    await bruker.type(screen.getByLabelText(/passord/i), 'hemmelig123')
    await bruker.click(screen.getByRole('button', { name: /^logg inn$/i }))

    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith('/auth/login', { brukernavn: 'ola.nordmann', passord: 'hemmelig123' })
    })
  })

  it('viser feilmelding ved mislykket innlogging', async () => {
    vi.mocked(api.apiPost).mockRejectedValue(new api.ApiFeil('Feil brukernavn eller passord.'))
    const bruker = userEvent.setup()
    settOpp()

    await bruker.type(screen.getByLabelText(/brukernavn/i), 'ola.nordmann')
    await bruker.type(screen.getByLabelText(/passord/i), 'feilPassord')
    await bruker.click(screen.getByRole('button', { name: /^logg inn$/i }))

    expect(await screen.findByText(/feil brukernavn eller passord/i)).toBeInTheDocument()
  })

  it('bytter språk til engelsk', async () => {
    const bruker = userEvent.setup()
    settOpp()
    await bruker.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument()
  })
})
