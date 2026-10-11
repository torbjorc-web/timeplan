import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bruker } from '../types.js'

vi.mock('../store.js', () => ({
  finnBrukerVedId: vi.fn(),
  hentBrukere: vi.fn(),
  leggTilTilbakemelding: vi.fn(),
}))

const store = await import('../store.js')
const { tilbakemeldingerRuter } = await import('./tilbakemeldinger.js')
const { lagToken } = await import('../auth.js')

function lagApp() {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/tilbakemeldinger', tilbakemeldingerRuter)
  return app
}

// autentiser slår nå opp brukeren i lagringen - la oppslaget svare med samme rolle som tokenet.
let innloggetRolle: 'avdelingsleder' | 'laerer' = 'avdelingsleder'

function tokenCookie(rolle: 'avdelingsleder' | 'laerer' = 'avdelingsleder') {
  innloggetRolle = rolle
  const token = lagToken({ brukerId: 'bruker-1', tenantId: 'tenant-1', rolle })
  return `token=${token}`
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(store.finnBrukerVedId).mockImplementation(
    async (id) => ({ id, tenantId: 'tenant-1', brukernavn: 'b', passordHash: 'x', rolle: innloggetRolle, navn: 'B', opprettet: '' }) as Bruker,
  )
})

describe('POST /api/tilbakemeldinger', () => {
  it('avviser uten innlogging', async () => {
    const svar = await request(lagApp()).post('/api/tilbakemeldinger').send({ melding: 'Dette er en tilbakemelding.' })
    expect(svar.status).toBe(401)
  })

  it('avviser bruker som ikke er avdelingsleder', async () => {
    const svar = await request(lagApp())
      .post('/api/tilbakemeldinger')
      .set('Cookie', [tokenCookie('laerer')])
      .send({ melding: 'Dette er en tilbakemelding.' })
    expect(svar.status).toBe(403)
  })

  it('avviser for kort melding', async () => {
    const svar = await request(lagApp()).post('/api/tilbakemeldinger').set('Cookie', [tokenCookie()]).send({ melding: 'Hi' })
    expect(svar.status).toBe(400)
  })

  it('avviser for lang melding', async () => {
    const svar = await request(lagApp())
      .post('/api/tilbakemeldinger')
      .set('Cookie', [tokenCookie()])
      .send({ melding: 'a'.repeat(2001) })
    expect(svar.status).toBe(400)
  })

  it('lagrer gyldig tilbakemelding med brukernavn slått opp', async () => {
    vi.mocked(store.hentBrukere).mockResolvedValue([
      { id: 'bruker-1', navn: 'Avdelingsleder Ann' } as Bruker,
    ])
    vi.mocked(store.leggTilTilbakemelding).mockResolvedValue({
      id: 'tb1',
      tenantId: 'tenant-1',
      brukerNavn: 'Avdelingsleder Ann',
      melding: 'Dette fungerer bra.',
      tidspunkt: new Date().toISOString(),
    })

    const svar = await request(lagApp())
      .post('/api/tilbakemeldinger')
      .set('Cookie', [tokenCookie()])
      .send({ melding: 'Dette fungerer bra.' })

    expect(svar.status).toBe(201)
    expect(svar.body).toMatchObject({ brukerNavn: 'Avdelingsleder Ann', melding: 'Dette fungerer bra.' })
    expect(store.leggTilTilbakemelding).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      brukerNavn: 'Avdelingsleder Ann',
      melding: 'Dette fungerer bra.',
    })
  })
})
