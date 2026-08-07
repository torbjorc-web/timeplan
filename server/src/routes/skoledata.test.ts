import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import type { MinimalAppData, Rolle } from '../types.js'

vi.mock('../store.js', () => ({
  hentBrukere: vi.fn(),
  hentSkoledata: vi.fn(),
  lagreSkoledata: vi.fn(),
}))

const store = await import('../store.js')
const { skoledataRuter } = await import('./skoledata.js')

function lagApp(rolle: Rolle = 'avdelingsleder', brukerId = 'bruker-1', tenantId = 'tenant-1') {
  const app = express()
  app.use(express.json())
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.bruker = { brukerId, tenantId, rolle }
    next()
  })
  app.use('/api/skoledata', skoledataRuter)
  return app
}

const eksempelData: MinimalAppData = {
  aktivtSkoleaar: '2024-2025',
  skoleaar: {
    '2024-2025': {
      laerere: [{ id: 'l1', navn: 'Lærer A' }, { id: 'l2', navn: 'Lærer B' }],
      timeplan: [{ laererId: 'l1', dag: 'mandag' }, { laererId: 'l2', dag: 'tirsdag' }],
    },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/skoledata', () => {
  it('returnerer alt for avdelingsleder/rektor', async () => {
    vi.mocked(store.hentSkoledata).mockResolvedValue(eksempelData)

    const svar = await request(lagApp('avdelingsleder')).get('/api/skoledata')

    expect(svar.status).toBe(200)
    expect(svar.body).toEqual(eksempelData)
  })

  it('returnerer tomt datasett når ingenting er lagret', async () => {
    vi.mocked(store.hentSkoledata).mockResolvedValue(null)

    const svar = await request(lagApp('avdelingsleder')).get('/api/skoledata')

    expect(svar.status).toBe(200)
    expect(svar.body).toEqual({ aktivtSkoleaar: '', skoleaar: {} })
  })

  it('filtrerer data for lærer til kun egne oppføringer', async () => {
    vi.mocked(store.hentSkoledata).mockResolvedValue(eksempelData)
    vi.mocked(store.hentBrukere).mockResolvedValue([
      { id: 'bruker-1', tenantId: 'tenant-1', brukernavn: 'l', passordHash: '', rolle: 'laerer', laererId: 'l1', navn: 'L', opprettet: '' },
    ])

    const svar = await request(lagApp('laerer')).get('/api/skoledata')

    expect(svar.status).toBe(200)
    expect(svar.body.skoleaar['2024-2025'].laerere).toEqual([{ id: 'l1', navn: 'Lærer A' }])
    expect(svar.body.skoleaar['2024-2025'].timeplan).toEqual([{ laererId: 'l1', dag: 'mandag' }])
  })
})

describe('PUT /api/skoledata', () => {
  it('lagrer gyldig skoledata for avdelingsleder', async () => {
    vi.mocked(store.lagreSkoledata).mockResolvedValue(undefined)

    const svar = await request(lagApp('avdelingsleder')).put('/api/skoledata').send(eksempelData)

    expect(svar.status).toBe(200)
    expect(svar.body).toEqual({ ok: true })
    expect(store.lagreSkoledata).toHaveBeenCalledWith('tenant-1', eksempelData)
  })

  it('avviser ugyldig format', async () => {
    const svar = await request(lagApp('avdelingsleder')).put('/api/skoledata').send({ feil: 'format' })

    expect(svar.status).toBe(400)
    expect(store.lagreSkoledata).not.toHaveBeenCalled()
  })

  it('avviser bruker som ikke er avdelingsleder', async () => {
    const svar = await request(lagApp('laerer')).put('/api/skoledata').send(eksempelData)

    expect(svar.status).toBe(403)
  })
})
