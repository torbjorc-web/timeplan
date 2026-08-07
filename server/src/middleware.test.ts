import { describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'

vi.mock('./seedDemo.js', () => ({ demoTenantId: 'demo-tenant' }))

const { kreverRolle, blokkerDemoSkriving } = await import('./middleware.js')

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