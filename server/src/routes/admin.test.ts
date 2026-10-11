import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bruker, Innloggingslogg, Tenant, Tilbakemelding } from '../types.js'

vi.mock('../store.js', () => ({
  finnBrukerVedId: vi.fn(),
  hentBrukere: vi.fn(),
  hentInnloggingslogg: vi.fn(),
  hentTenants: vi.fn(),
  hentTilbakemeldinger: vi.fn(),
  oppdaterTenant: vi.fn(),
}))

const store = await import('../store.js')
const { adminRuter } = await import('./admin.js')
const { lagToken } = await import('../auth.js')

function lagApp() {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/admin', adminRuter)
  return app
}

// autentiser slår nå opp brukeren i lagringen - la oppslaget svare med samme rolle som tokenet.
let innloggetRolle: 'superadmin' | 'avdelingsleder' = 'superadmin'

function tokenCookie(rolle: 'superadmin' | 'avdelingsleder' = 'superadmin') {
  innloggetRolle = rolle
  const token = lagToken({ brukerId: 'admin-1', tenantId: '', rolle })
  return `token=${token}`
}

function lagTenant(overstyring: Partial<Tenant> = {}): Tenant {
  return {
    id: 't1',
    navn: 'Testskole',
    opprettet: new Date().toISOString(),
    lisensstatus: 'proveperiode',
    proveperiodeSlutt: new Date().toISOString(),
    ...overstyring,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(store.finnBrukerVedId).mockImplementation(
    async (id) => ({ id, tenantId: '', brukernavn: 'admin', passordHash: 'x', rolle: innloggetRolle, navn: 'Admin', opprettet: '' }) as Bruker,
  )
})

describe('tilgangskontroll', () => {
  it('avviser uten innlogging', async () => {
    const svar = await request(lagApp()).get('/api/admin/tenants')
    expect(svar.status).toBe(401)
  })

  it('avviser bruker som ikke er superadmin', async () => {
    const svar = await request(lagApp()).get('/api/admin/tenants').set('Cookie', [tokenCookie('avdelingsleder')])
    expect(svar.status).toBe(403)
  })
})

describe('GET /api/admin/tenants', () => {
  it('returnerer avdelinger med antall brukere', async () => {
    vi.mocked(store.hentTenants).mockResolvedValue([lagTenant({ id: 't1' }), lagTenant({ id: 't2' })])
    vi.mocked(store.hentBrukere).mockResolvedValue([
      { tenantId: 't1' } as Bruker,
      { tenantId: 't1' } as Bruker,
      { tenantId: 't2' } as Bruker,
    ])

    const svar = await request(lagApp()).get('/api/admin/tenants').set('Cookie', [tokenCookie()])

    expect(svar.status).toBe(200)
    expect(svar.body).toEqual([
      expect.objectContaining({ id: 't1', antallBrukere: 2 }),
      expect.objectContaining({ id: 't2', antallBrukere: 1 }),
    ])
  })
})

describe('POST /api/admin/tenants/:id/frigi og /sperr', () => {
  it('frigir en avdeling', async () => {
    vi.mocked(store.oppdaterTenant).mockResolvedValue(lagTenant({ lisensstatus: 'aktiv' }))

    const svar = await request(lagApp()).post('/api/admin/tenants/t1/frigi').set('Cookie', [tokenCookie()])

    expect(svar.status).toBe(200)
    expect(store.oppdaterTenant).toHaveBeenCalledWith('t1', { lisensstatus: 'aktiv' })
  })

  it('gir 404 når avdelingen for frigi ikke finnes', async () => {
    vi.mocked(store.oppdaterTenant).mockResolvedValue(undefined)

    const svar = await request(lagApp()).post('/api/admin/tenants/finnes-ikke/frigi').set('Cookie', [tokenCookie()])

    expect(svar.status).toBe(404)
  })

  it('sperrer en avdeling', async () => {
    vi.mocked(store.oppdaterTenant).mockResolvedValue(lagTenant({ lisensstatus: 'sperret' }))

    const svar = await request(lagApp()).post('/api/admin/tenants/t1/sperr').set('Cookie', [tokenCookie()])

    expect(svar.status).toBe(200)
    expect(store.oppdaterTenant).toHaveBeenCalledWith('t1', { lisensstatus: 'sperret' })
  })
})

describe('GET /api/admin/innlogginger', () => {
  it('returnerer logg med avdelingsnavn slått opp', async () => {
    vi.mocked(store.hentInnloggingslogg).mockResolvedValue([
      { id: '1', tenantId: 't1' } as Innloggingslogg,
    ])
    vi.mocked(store.hentTenants).mockResolvedValue([lagTenant({ id: 't1', navn: 'Skole A' })])

    const svar = await request(lagApp()).get('/api/admin/innlogginger').set('Cookie', [tokenCookie()])

    expect(svar.status).toBe(200)
    expect(svar.body[0]).toMatchObject({ tenantNavn: 'Skole A' })
  })
})

describe('GET /api/admin/tilbakemeldinger', () => {
  it('returnerer tilbakemeldinger med avdelingsnavn slått opp', async () => {
    vi.mocked(store.hentTilbakemeldinger).mockResolvedValue([
      { id: '1', tenantId: 't1', melding: 'Bra jobba' } as Tilbakemelding,
    ])
    vi.mocked(store.hentTenants).mockResolvedValue([lagTenant({ id: 't1', navn: 'Skole A' })])

    const svar = await request(lagApp()).get('/api/admin/tilbakemeldinger').set('Cookie', [tokenCookie()])

    expect(svar.status).toBe(200)
    expect(svar.body[0]).toMatchObject({ tenantNavn: 'Skole A', melding: 'Bra jobba' })
  })
})
