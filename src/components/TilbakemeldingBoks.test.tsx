import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nContext'
import { TilbakemeldingBoks } from './TilbakemeldingBoks'

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api')
  return { ...actual, apiPost: vi.fn() }
})

const api = await import('../api')

function settOpp() {
  return render(
    <I18nProvider>
      <TilbakemeldingBoks />
    </I18nProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TilbakemeldingBoks', () => {
  it('viser valideringsfeil ved for kort melding uten å kalle apiet', async () => {
    const bruker = userEvent.setup()
    settOpp()

    await bruker.type(screen.getByPlaceholderText(/skriv meldingen din/i), 'Hi')
    await bruker.click(screen.getByRole('button', { name: /^send$/i }))

    expect(await screen.findByText(/minst 3 tegn/i)).toBeInTheDocument()
    expect(api.apiPost).not.toHaveBeenCalled()
  })

  it('sender meldingen og viser takkemelding ved suksess', async () => {
    vi.mocked(api.apiPost).mockResolvedValue({})
    const bruker = userEvent.setup()
    settOpp()

    await bruker.type(screen.getByPlaceholderText(/skriv meldingen din/i), 'Dette er en fin tilbakemelding.')
    await bruker.click(screen.getByRole('button', { name: /^send$/i }))

    expect(await screen.findByText(/takk! meldingen din er sendt/i)).toBeInTheDocument()
    expect(api.apiPost).toHaveBeenCalledWith('/tilbakemeldinger', { melding: 'Dette er en fin tilbakemelding.' })
    expect(screen.getByPlaceholderText(/skriv meldingen din/i)).toHaveValue('')
  })

  it('viser feilmelding når sending feiler', async () => {
    vi.mocked(api.apiPost).mockRejectedValue(new api.ApiFeil('Serverfeil, prøv igjen.'))
    const bruker = userEvent.setup()
    settOpp()

    await bruker.type(screen.getByPlaceholderText(/skriv meldingen din/i), 'Dette er en fin tilbakemelding.')
    await bruker.click(screen.getByRole('button', { name: /^send$/i }))

    expect(await screen.findByText(/serverfeil, prøv igjen/i)).toBeInTheDocument()
  })
})
