import { describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
import { kreverRolle } from './middleware.js'

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
