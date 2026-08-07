import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import type { Bruker, Rolle } from '../types.js'

vi.mock('../store.js', () => ({
  finnBrukerVedBrukernavn: vi.fn(),
  hentBrukereForTenant: vi.fn(),
  leggTilBruker: vi.fn(),
  slettBruker: vi.fn(),
}))

const store = await import('../store.js')
const { brukereRuter } = await import('./brukere.js')

function lagApp(rolle: Rolle = 'avdelingsleder', tenantId = 'tenant-1') {
  const app = express()
  app.use(express.json())
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.bruker = { brukerId: 'bruker-1', tenantId, rolle }
    next()
  })
  app.use('/api/brukere', brukereRuter)
  return app
}

function lagBruker(overstyring: Partial<Bruker> = {}): Bruker {
  return {
    id: 'b1',
    tenantId: 'tenant-1',
    brukernavn: 'lærer.en',
    passordHash: 'hash',
    rolle: 'laerer',
    navn: 'Lærer En',
    opprettet: new Date().toISOString(),
    ...overstyring,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/brukere', () => {
  it('returnerer brukere for tenant uten passordHash', async () => {
    vi.mocked(store.hentBrukereForTenant).mockResolvedValue([lagBruker()])

    const svar = await request(lagApp()).get('/api/brukere')

    expect(svar.status).toBe(200)
    expect(svar.body).toEqual([
      { id: 'b1', tenantId: 'tenant-1', brukernavn: 'lærer.en', rolle: 'laerer', laererId: undefined, navn: 'Lærer En' },
    ])
    expect(svar.body[0].passordHash).toBeUndefined()
  })

  it('avviser bruker som ikke er avdelingsleder', async () => {
    const svar = await request(lagApp('laerer')).get('/api/brukere')
    expect(svar.status).toBe(403)
  })
})

describe('POST /api/brukere', () => {
  it('oppretter en ny bruker', async () => {
    vi.mocked(store.finnBrukerVedBrukernavn).mockResolvedValue(undefined)
    vi.mocked(store.leggTilBruker).mockResolvedValue(undefined)

    const svar = await request(lagApp())
      .post('/api/brukere')
      .send({ brukernavn: 'ny.laerer', passord: 'langtPassord1', navn: 'Ny Lærer', rolle: 'laerer', laererId: 'l1' })

    expect(svar.status).toBe(201)
    expect(svar.body).toMatchObject({ brukernavn: 'ny.laerer', rolle: 'laerer', laererId: 'l1' })
    expect(svar.body.passordHash).toBeUndefined()
  })

  it('avviser ugyldige felt', async () => {
    const svar = await request(lagApp()).post('/api/brukere').send({ brukernavn: 'ab', passord: '123' })
    expect(svar.status).toBe(400)
  })

  it('krever laererId når rolle er laerer', async () => {
    const svar = await request(lagApp())
      .post('/api/brukere')
      .send({ brukernavn: 'ny.laerer', passord: 'langtPassord1', navn: 'Ny Lærer', rolle: 'laerer' })

    expect(svar.status).toBe(400)
  })

  it('avviser duplikat brukernavn', async () => {
    vi.mocked(store.finnBrukerVedBrukernavn).mockResolvedValue(lagBruker())

    const svar = await request(lagApp())
      .post('/api/brukere')
      .send({ brukernavn: 'laerer.en', passord: 'langtPassord1', navn: 'Duplikat', rolle: 'rektor' })

    expect(svar.status).toBe(409)
  })
})

describe('DELETE /api/brukere/:id', () => {
  it('sletter en bruker', async () => {
    vi.mocked(store.slettBruker).mockResolvedValue(true)

    const svar = await request(lagApp()).delete('/api/brukere/b1')

    expect(svar.status).toBe(200)
    expect(svar.body).toEqual({ ok: true })
    expect(store.slettBruker).toHaveBeenCalledWith('b1', 'tenant-1')
  })

  it('gir 404 når brukeren ikke finnes', async () => {
    vi.mocked(store.slettBruker).mockResolvedValue(false)

    const svar = await request(lagApp()).delete('/api/brukere/finnes-ikke')

    expect(svar.status).toBe(404)
  })
})
