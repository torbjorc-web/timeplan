import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tenant } from '../types.js'

vi.mock('../store.js', () => ({
  hentTenantById: vi.fn(),
  hentTenantByStripeCustomerId: vi.fn(),
  oppdaterTenant: vi.fn(),
}))

vi.mock('../stripe.js', () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
  },
  STRIPE_PRIS_ID: 'price_123',
  STRIPE_WEBHOOK_HEMMELIGHET: 'whsec_test',
  APP_URL: 'http://localhost:5173',
}))

vi.mock('../middleware.js', () => ({
  autentiser: (req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => {
    req.bruker = { brukerId: 'bruker-1', tenantId: 'tenant-1', rolle: 'avdelingsleder' }
    next()
  },
  kreverRolle:
    (...roller: string[]) =>
    (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
      if (!req.bruker || !roller.includes(req.bruker.rolle)) {
        res.status(403).json({ feil: 'Du har ikke tilgang til denne handlingen.' })
        return
      }
      next()
    },
}))

const store = await import('../store.js')
const stripeModul = await import('../stripe.js')
const { betalingRuter } = await import('./betaling.js')

function lagApp() {
  const app = express()
  app.use('/api/betaling/webhook', express.raw({ type: 'application/json' }))
  app.use(express.json())
  app.use('/api/betaling', betalingRuter)
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/betaling/opprett-checkout', () => {
  it('oppretter en checkout-sesjon for innlogget avdelingsleder', async () => {
    vi.mocked(store.hentTenantById).mockResolvedValue(lagTenant())
    vi.mocked(stripeModul.stripe!.checkout.sessions.create).mockResolvedValue({
      url: 'https://checkout.stripe.com/xyz',
    } as never)

    const svar = await request(lagApp()).post('/api/betaling/opprett-checkout')

    expect(svar.status).toBe(200)
    expect(svar.body).toEqual({ url: 'https://checkout.stripe.com/xyz' })
    expect(stripeModul.stripe!.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ client_reference_id: 'tenant-1' }),
    )
  })

  it('gir 404 når avdelingen ikke finnes', async () => {
    vi.mocked(store.hentTenantById).mockResolvedValue(undefined)

    const svar = await request(lagApp()).post('/api/betaling/opprett-checkout')

    expect(svar.status).toBe(404)
  })
})

describe('POST /api/betaling/webhook', () => {
  it('avviser ugyldig signatur', async () => {
    vi.mocked(stripeModul.stripe!.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('ugyldig signatur')
    })

    const svar = await request(lagApp())
      .post('/api/betaling/webhook')
      .set('stripe-signature', 'feil-signatur')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'checkout.session.completed' }))

    expect(svar.status).toBe(400)
  })

  it('aktiverer lisensen ved checkout.session.completed', async () => {
    vi.mocked(stripeModul.stripe!.webhooks.constructEvent).mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { tenantId: 'tenant-1' },
          customer: 'cus_123',
          subscription: 'sub_123',
        },
      },
    } as never)
    vi.mocked(store.oppdaterTenant).mockResolvedValue(lagTenant({ lisensstatus: 'aktiv' }))

    const svar = await request(lagApp())
      .post('/api/betaling/webhook')
      .set('stripe-signature', 'gyldig-signatur')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({}))

    expect(svar.status).toBe(200)
    expect(store.oppdaterTenant).toHaveBeenCalledWith('tenant-1', {
      lisensstatus: 'aktiv',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    })
  })

  it('sperrer avdelingen ved customer.subscription.deleted', async () => {
    vi.mocked(stripeModul.stripe!.webhooks.constructEvent).mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_456' } },
    } as never)
    vi.mocked(store.hentTenantByStripeCustomerId).mockResolvedValue(lagTenant({ id: 'tenant-2' }))
    vi.mocked(store.oppdaterTenant).mockResolvedValue(lagTenant({ id: 'tenant-2', lisensstatus: 'sperret' }))

    const svar = await request(lagApp())
      .post('/api/betaling/webhook')
      .set('stripe-signature', 'gyldig-signatur')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({}))

    expect(svar.status).toBe(200)
    expect(store.oppdaterTenant).toHaveBeenCalledWith('tenant-2', { lisensstatus: 'sperret' })
  })

  it('sperrer avdelingen ved invoice.payment_failed', async () => {
    vi.mocked(stripeModul.stripe!.webhooks.constructEvent).mockReturnValue({
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_789' } },
    } as never)
    vi.mocked(store.hentTenantByStripeCustomerId).mockResolvedValue(lagTenant({ id: 'tenant-3' }))
    vi.mocked(store.oppdaterTenant).mockResolvedValue(lagTenant({ id: 'tenant-3', lisensstatus: 'sperret' }))

    const svar = await request(lagApp())
      .post('/api/betaling/webhook')
      .set('stripe-signature', 'gyldig-signatur')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({}))

    expect(svar.status).toBe(200)
    expect(store.oppdaterTenant).toHaveBeenCalledWith('tenant-3', { lisensstatus: 'sperret' })
  })

  it('gjør ingenting når stripe-kunden ikke er koblet til noen avdeling', async () => {
    vi.mocked(stripeModul.stripe!.webhooks.constructEvent).mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus-ukjent' } },
    } as never)
    vi.mocked(store.hentTenantByStripeCustomerId).mockResolvedValue(undefined)

    const svar = await request(lagApp())
      .post('/api/betaling/webhook')
      .set('stripe-signature', 'gyldig-signatur')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({}))

    expect(svar.status).toBe(200)
    expect(store.oppdaterTenant).not.toHaveBeenCalled()
  })
})
