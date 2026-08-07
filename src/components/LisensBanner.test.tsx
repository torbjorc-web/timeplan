import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { LisensBanner } from './LisensBanner'
import type { Bruker } from '../authContextCore'

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api')
  return { ...actual, apiPost: vi.fn() }
})

const api = await import('../api')

function lagBruker(overstyring: Partial<Bruker> = {}): Bruker {
  return { navn: 'Ola', rolle: 'avdelingsleder', ...overstyring }
}

function settOpp(bruker: Bruker) {
  return render(
    <I18nProvider>
      <LisensBanner bruker={bruker} />
    </I18nProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LisensBanner', () => {
  it('viser ingenting for andre roller enn avdelingsleder', () => {
    const { container } = settOpp(lagBruker({ rolle: 'laerer' }))
    expect(container).toBeEmptyDOMElement()
  })

  it('viser ingenting når lisensen er aktiv', () => {
    const { container } = settOpp(lagBruker({ lisensstatus: 'aktiv' }))
    expect(container).toBeEmptyDOMElement()
  })

  it('viser sperret-melding når lisensen er sperret', () => {
    settOpp(lagBruker({ lisensstatus: 'sperret' }))
    expect(screen.getByText(/lisensen/i)).toBeInTheDocument()
  })

  it('viser antall dager igjen i prøveperioden', () => {
    const omToDager = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    settOpp(lagBruker({ lisensstatus: 'proveperiode', proveperiodeSlutt: omToDager }))
    expect(screen.getByText(/2 dag/i)).toBeInTheDocument()
  })

  it('starter betaling ved klikk på kjøp-knappen', async () => {
    vi.mocked(api.apiPost).mockResolvedValue({ url: 'https://checkout.stripe.com/xyz' })
    const bruker = userEvent.setup()
    settOpp(lagBruker({ lisensstatus: 'sperret' }))

    await bruker.click(screen.getByRole('button'))

    expect(api.apiPost).toHaveBeenCalledWith('/betaling/opprett-checkout')
  })

  it('viser feilmelding når betaling ikke kan startes', async () => {
    vi.mocked(api.apiPost).mockRejectedValue(new api.ApiFeil('Betaling er ikke tilgjengelig.'))
    const bruker = userEvent.setup()
    settOpp(lagBruker({ lisensstatus: 'sperret' }))

    await bruker.click(screen.getByRole('button'))

    expect(await screen.findByText(/betaling er ikke tilgjengelig/i)).toBeInTheDocument()
  })
})
