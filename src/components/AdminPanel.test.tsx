import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { AdminPanel } from './AdminPanel'

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api')
  return { ...actual, apiGet: vi.fn(), apiPost: vi.fn() }
})

const loggUtMock = vi.fn()
vi.mock('../useAuth', () => ({
  useAuth: () => ({ bruker: null, laster: false, loggInn: vi.fn(), registrerAvdeling: vi.fn(), loggUt: loggUtMock }),
}))

const api = await import('../api')

function settOpp() {
  return render(
    <I18nProvider>
      <AdminPanel />
    </I18nProvider>,
  )
}

const tomTenant = { id: 't1', navn: 'Testskole', opprettet: new Date().toISOString(), lisensstatus: 'proveperiode' as const, proveperiodeSlutt: new Date().toISOString(), antallBrukere: 3 }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.apiGet).mockImplementation((sti: string) => {
    if (sti === '/admin/tenants') return Promise.resolve([tomTenant])
    return Promise.resolve([])
  })
})

describe('AdminPanel', () => {
  it('laster og viser skoler ved oppstart', async () => {
    settOpp()
    expect(await screen.findByText('Testskole')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('viser tomme-tilstander når ingen data finnes', async () => {
    vi.mocked(api.apiGet).mockResolvedValue([])
    settOpp()
    expect(await screen.findByText(/ingen skoler registrert/i)).toBeInTheDocument()
    expect(screen.getByText(/ingen innlogginger registrert/i)).toBeInTheDocument()
    expect(screen.getByText(/ingen tilbakemeldinger enda/i)).toBeInTheDocument()
  })

  it('frigir en skole ved klikk på frigi-knappen', async () => {
    vi.mocked(api.apiPost).mockResolvedValue({})
    const bruker = userEvent.setup()
    settOpp()
    await screen.findByText('Testskole')

    await bruker.click(screen.getByRole('button', { name: /frigi/i }))

    await waitFor(() => expect(api.apiPost).toHaveBeenCalledWith('/admin/tenants/t1/frigi'))
  })

  it('sperrer en skole ved klikk på sperr-knappen', async () => {
    vi.mocked(api.apiPost).mockResolvedValue({})
    const bruker = userEvent.setup()
    settOpp()
    await screen.findByText('Testskole')

    await bruker.click(screen.getByRole('button', { name: /^sperr$/i }))

    await waitFor(() => expect(api.apiPost).toHaveBeenCalledWith('/admin/tenants/t1/sperr'))
  })

  it('logger ut ved klikk på logg ut', async () => {
    const bruker = userEvent.setup()
    settOpp()
    await screen.findByText('Testskole')

    await bruker.click(screen.getByRole('button', { name: /logg ut/i }))

    expect(loggUtMock).toHaveBeenCalled()
  })

  it('viser feilmelding når lasting feiler', async () => {
    vi.mocked(api.apiGet).mockRejectedValue(new api.ApiFeil('Kunne ikke laste admin-data.'))
    settOpp()
    expect(await screen.findByText(/kunne ikke laste admin-data/i)).toBeInTheDocument()
  })
})
