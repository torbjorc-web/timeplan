import { describe, expect, it } from 'vitest'
import { harGyldigLisens } from './store.js'
import type { Tenant } from './types.js'

function lagTenant(overstyring: Partial<Tenant>): Tenant {
  return {
    id: 't1',
    navn: 'Testskole',
    opprettet: new Date().toISOString(),
    lisensstatus: 'proveperiode',
    proveperiodeSlutt: new Date().toISOString(),
    ...overstyring,
  }
}

describe('harGyldigLisens', () => {
  it('er gyldig når lisensstatus er aktiv', () => {
    const tenant = lagTenant({ lisensstatus: 'aktiv', proveperiodeSlutt: new Date(0).toISOString() })
    expect(harGyldigLisens(tenant)).toBe(true)
  })

  it('er gyldig i prøveperioden når fristen ikke er passert', () => {
    const fremtid = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const tenant = lagTenant({ lisensstatus: 'proveperiode', proveperiodeSlutt: fremtid })
    expect(harGyldigLisens(tenant)).toBe(true)
  })

  it('er ugyldig når prøveperioden er utløpt', () => {
    const fortid = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const tenant = lagTenant({ lisensstatus: 'proveperiode', proveperiodeSlutt: fortid })
    expect(harGyldigLisens(tenant)).toBe(false)
  })

  it('er ugyldig når lisensstatus er sperret', () => {
    const fremtid = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const tenant = lagTenant({ lisensstatus: 'sperret', proveperiodeSlutt: fremtid })
    expect(harGyldigLisens(tenant)).toBe(false)
  })
})
