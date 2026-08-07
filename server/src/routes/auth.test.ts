import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bruker, Tenant } from '../types.js'

vi.mock('../store.js', () => ({
  finnBrukerVedBrukernavn: vi.fn(),
  hentBrukere: vi.fn(),
  hentTenantById: vi.fn(),
  leggTilBruker: vi.fn(),
  loggInnlogging: vi.fn(),
  opprettTenant: vi.fn(),
}))

const store = await import('../store.js')
const { authRuter } = await import('./auth.js')
const { hashPassord, lagToken } = await import('../auth.js')

function lagApp() {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/auth', authRuter)
  return app
}

function lagTenant(overstyring: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-1',
    navn: 'Testskole',
    opprettet: new Date().toISOString(),
    lisensstatus: 'proveperiode',
    proveperiodeSlutt: new Date(Date.now() + 86400000).toISOString(),
    ...overstyring,
  }
}

async function lagBruker(overstyring: Partial<Bruker> = {}): Promise<Bruker> {
  return {
    id: 'bruker-1',
    tenantId: 'tenant-1',
    brukernavn: 'test.bruker',
    passordHash: await hashPassord('riktigPassord123'),
    rolle: 'avdelingsleder',
    navn: 'Test Testesen',
    opprettet: new Date().toISOString(),
    ...overstyring,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/auth/registrer-avdeling', () => {
  it('oppretter avdeling og bruker ved gyldige felt', async () => {
    vi.mocked(store.finnBrukerVedBrukernavn).mockResolvedValue(undefined)
    vi.mocked(store.opprettTenant).mockResolvedValue(lagTenant())
    vi.mocked(store.leggTilBruker).mockResolvedValue(undefined)
    vi.mocked(store.loggInnlogging).mockResolvedValue(undefined)

    const svar = await request(lagApp()).post('/api/auth/registrer-avdeling').send({
      avdelingNavn: 'Ny Avdeling',
      brukernavn: 'ny.leder',
      passord: 'langtPassord1',
      navn: 'Ny Leder',
    })

    expect(svar.status).toBe(201)
    expect(svar.body).toMatchObject({ navn: 'Ny Leder', rolle: 'avdelingsleder', tenantNavn: 'Testskole' })
    expect(svar.headers['set-cookie']?.[0]).toMatch(/^token=/)
    expect(store.opprettTenant).toHaveBeenCalledWith('Ny Avdeling')
  })

  it('avviser ugyldige felt uten å berøre lagring', async () => {
    const svar = await request(lagApp()).post('/api/auth/registrer-avdeling').send({
      avdelingNavn: 'A',
      brukernavn: 'kort',
      passord: '123',
      navn: '',
    })

    expect(svar.status).toBe(400)
    expect(store.opprettTenant).not.toHaveBeenCalled()
  })

  it('avviser når brukernavnet allerede er i bruk', async () => {
    vi.mocked(store.finnBrukerVedBrukernavn).mockResolvedValue(await lagBruker())

    const svar = await request(lagApp()).post('/api/auth/registrer-avdeling').send({
      avdelingNavn: 'Ny Avdeling',
      brukernavn: 'test.bruker',
      passord: 'langtPassord1',
      navn: 'Ny Leder',
    })

    expect(svar.status).toBe(409)
    expect(store.opprettTenant).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/login', () => {
  it('logger inn med riktig brukernavn og passord', async () => {
    const bruker = await lagBruker({ brukernavn: 'login.suksess' })
    vi.mocked(store.finnBrukerVedBrukernavn).mockResolvedValue(bruker)
    vi.mocked(store.loggInnlogging).mockResolvedValue(undefined)
    vi.mocked(store.hentTenantById).mockResolvedValue(lagTenant())

    const svar = await request(lagApp())
      .post('/api/auth/login')
      .send({ brukernavn: 'login.suksess', passord: 'riktigPassord123' })

    expect(svar.status).toBe(200)
    expect(svar.body).toMatchObject({ navn: bruker.navn, rolle: bruker.rolle, lisensstatus: 'proveperiode' })
    expect(svar.headers['set-cookie']?.[0]).toMatch(/^token=/)
  })

  it('avviser feil passord', async () => {
    const bruker = await lagBruker({ brukernavn: 'login.feilpassord' })
    vi.mocked(store.finnBrukerVedBrukernavn).mockResolvedValue(bruker)

    const svar = await request(lagApp())
      .post('/api/auth/login')
      .send({ brukernavn: 'login.feilpassord', passord: 'heltFeilPassord' })

    expect(svar.status).toBe(401)
  })

  it('avviser ukjent bruker', async () => {
    vi.mocked(store.finnBrukerVedBrukernavn).mockResolvedValue(undefined)

    const svar = await request(lagApp())
      .post('/api/auth/login')
      .send({ brukernavn: 'finnes.ikke', passord: 'whatever123' })

    expect(svar.status).toBe(401)
  })

  it('blokkerer etter mange mislykkede forsøk (rate limiting)', async () => {
    const bruker = await lagBruker({ brukernavn: 'login.ratelimit' })
    vi.mocked(store.finnBrukerVedBrukernavn).mockResolvedValue(bruker)
    const app = lagApp()

    for (let i = 0; i < 5; i++) {
      const svar = await request(app)
        .post('/api/auth/login')
        .send({ brukernavn: 'login.ratelimit', passord: 'feilPassord' })
      expect(svar.status).toBe(401)
    }

    const blokkert = await request(app)
      .post('/api/auth/login')
      .send({ brukernavn: 'login.ratelimit', passord: 'riktigPassord123' })
    expect(blokkert.status).toBe(429)
  })
})

describe('POST /api/auth/logout', () => {
  it('sletter cookien og returnerer ok', async () => {
    const svar = await request(lagApp()).post('/api/auth/logout')
    expect(svar.status).toBe(200)
    expect(svar.body).toEqual({ ok: true })
  })
})

describe('GET /api/auth/meg', () => {
  it('avviser uten innlogging', async () => {
    const svar = await request(lagApp()).get('/api/auth/meg')
    expect(svar.status).toBe(401)
  })

  it('avviser ugyldig token', async () => {
    const svar = await request(lagApp()).get('/api/auth/meg').set('Cookie', ['token=ugyldig-token'])
    expect(svar.status).toBe(401)
  })

  it('avviser når brukeren ikke lenger finnes', async () => {
    const token = lagToken({ brukerId: 'slettet-bruker', tenantId: 'tenant-1', rolle: 'avdelingsleder' })
    vi.mocked(store.hentBrukere).mockResolvedValue([])

    const svar = await request(lagApp()).get('/api/auth/meg').set('Cookie', [`token=${token}`])
    expect(svar.status).toBe(401)
  })

  it('returnerer profilen for innlogget bruker', async () => {
    const bruker = await lagBruker({ id: 'bruker-42' })
    const token = lagToken({ brukerId: bruker.id, tenantId: bruker.tenantId, rolle: bruker.rolle })
    vi.mocked(store.hentBrukere).mockResolvedValue([bruker])
    vi.mocked(store.hentTenantById).mockResolvedValue(lagTenant())

    const svar = await request(lagApp()).get('/api/auth/meg').set('Cookie', [`token=${token}`])
    expect(svar.status).toBe(200)
    expect(svar.body).toMatchObject({ navn: bruker.navn, rolle: bruker.rolle, lisensstatus: 'proveperiode' })
  })
})
