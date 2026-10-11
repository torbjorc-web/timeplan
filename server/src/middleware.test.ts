import { describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'

vi.mock('./seedDemo.js', () => ({ demoTenantId: 'demo-tenant' }))
vi.mock('./store.js', () => ({
  finnBrukerVedId: vi.fn(),
  harGyldigLisens: vi.fn(),
  hentTenantById: vi.fn(),
}))
const store = await import('./store.js')
const { lagToken } = await import('./auth.js')

const { autentiser, kreverRolle, blokkerDemoSkriving } = await import('./middleware.js')

function lagRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.body = body
      return this
    },
  }
  return res as unknown as Response & { statusCode: number; body: unknown }
}

describe('kreverRolle', () => {
  it('slipper gjennom bruker med tillatt rolle', () => {
    const req = { bruker: { brukerId: '1', tenantId: 't1', rolle: 'avdelingsleder' } } as unknown as Request
    const res = lagRes()
    const next = vi.fn()
    kreverRolle('avdelingsleder', 'rektor')(req, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(res.statusCode).toBe(200)
  })

  it('avviser bruker med rolle som ikke er i listen', () => {
    const req = { bruker: { brukerId: '1', tenantId: 't1', rolle: 'laerer' } } as unknown as Request
    const res = lagRes()
    const next = vi.fn()
    kreverRolle('avdelingsleder')(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
  })

  it('avviser når req.bruker mangler (ikke autentisert)', () => {
    const req = {} as unknown as Request
    const res = lagRes()
    const next = vi.fn()
    kreverRolle('superadmin')(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
  })
})
describe('blokkerDemoSkriving', () => {
  it('slipper gjennom lesing (GET) fra demo-tenanten', () => {
    const req = { method: 'GET', bruker: { brukerId: '1', tenantId: 'demo-tenant', rolle: 'avdelingsleder' } } as unknown as Request
    const res = lagRes()
    const next = vi.fn()
    blokkerDemoSkriving(req, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(res.statusCode).toBe(200)
  })

  it('blokkerer skriving (POST) fra demo-tenanten', () => {
    const req = { method: 'POST', bruker: { brukerId: '1', tenantId: 'demo-tenant', rolle: 'avdelingsleder' } } as unknown as Request
    const res = lagRes()
    const next = vi.fn()
    blokkerDemoSkriving(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
  })

  it('slipper gjennom skriving fra en annen tenant', () => {
    const req = { method: 'PUT', bruker: { brukerId: '1', tenantId: 'annen-tenant', rolle: 'avdelingsleder' } } as unknown as Request
    const res = lagRes()
    const next = vi.fn()
    blokkerDemoSkriving(req, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(res.statusCode).toBe(200)
  })
})

describe('autentiser', () => {
  const token = lagToken({ brukerId: 'b1', tenantId: 't1', rolle: 'avdelingsleder' })
  const lagReq = (cookieToken?: string) => ({ cookies: cookieToken ? { token: cookieToken } : {} }) as unknown as Request
  const dbBruker = (overstyring: Record<string, unknown> = {}) =>
    ({ id: 'b1', tenantId: 't1', brukernavn: 'b', passordHash: 'x', rolle: 'avdelingsleder', navn: 'B', opprettet: '', ...overstyring }) as never

  it('avviser uten token', async () => {
    const res = lagRes()
    const next = vi.fn()
    await autentiser(lagReq(), res, next)
    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('slipper gjennom gyldig token for en bruker som finnes', async () => {
    vi.mocked(store.finnBrukerVedId).mockResolvedValue(dbBruker())
    const req = lagReq(token)
    const res = lagRes()
    const next = vi.fn()
    await autentiser(req, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(req.bruker).toEqual({ brukerId: 'b1', tenantId: 't1', rolle: 'avdelingsleder' })
  })

  it('avviser gyldig token når brukeren er slettet', async () => {
    vi.mocked(store.finnBrukerVedId).mockResolvedValue(undefined)
    const res = lagRes()
    const next = vi.fn()
    await autentiser(lagReq(token), res, next)
    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('avviser gyldig token når rollen i lagringen er endret', async () => {
    vi.mocked(store.finnBrukerVedId).mockResolvedValue(dbBruker({ rolle: 'laerer' }))
    const res = lagRes()
    const next = vi.fn()
    await autentiser(lagReq(token), res, next)
    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('sender lagringsfeil videre til feilhåndtereren i stedet for å kaste', async () => {
    const feil = new Error('disk')
    vi.mocked(store.finnBrukerVedId).mockRejectedValue(feil)
    const res = lagRes()
    const next = vi.fn()
    await autentiser(lagReq(token), res, next)
    expect(next).toHaveBeenCalledWith(feil)
  })
})
