import { Router } from 'express'
import { asyncHandler } from '../asyncHandler.js'
import type Stripe from 'stripe'
import { autentiser, kreverRolle } from '../middleware.js'
import { APP_URL, stripe, STRIPE_PRIS_ID, STRIPE_WEBHOOK_HEMMELIGHET } from '../stripe.js'
import { hentTenantById, hentTenantByStripeCustomerId, oppdaterTenant } from '../store.js'

export const betalingRuter = Router()

const STATUSER_SOM_SPERRER = new Set(['unpaid', 'canceled', 'incomplete_expired'])

async function sperrStripeKunde(kunde: string | Stripe.Customer | null | undefined): Promise<void> {
  const stripeCustomerId = typeof kunde === 'string' ? kunde : undefined
  if (!stripeCustomerId) return
  const tenant = await hentTenantByStripeCustomerId(stripeCustomerId)
  if (tenant) await oppdaterTenant(tenant.id, { lisensstatus: 'sperret' })
}

betalingRuter.post('/opprett-checkout', autentiser, kreverRolle('avdelingsleder'), asyncHandler(async (req, res) => {
  if (!stripe || !STRIPE_PRIS_ID) {
    res.status(503).json({ feil: 'Betalingsløsning er ikke konfigurert på serveren ennå. Kontakt support.' })
    return
  }
  const tenantId = req.bruker!.tenantId
  const tenant = await hentTenantById(tenantId)
  if (!tenant) {
    res.status(404).json({ feil: 'Fant ikke avdelingen din.' })
    return
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRIS_ID, quantity: 1 }],
    client_reference_id: tenantId,
    metadata: { tenantId },
    subscription_data: { metadata: { tenantId } },
    success_url: `${APP_URL}/?betaling=ok`,
    cancel_url: `${APP_URL}/?betaling=avbrutt`,
  })
  res.json({ url: session.url })
}))

/** Mottas med express.raw (rå body) - se index.ts. Krever IKKE innlogging (Stripe kaller direkte). */
betalingRuter.post('/webhook', asyncHandler(async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_HEMMELIGHET) {
    res.status(503).send('Webhook er ikke konfigurert.')
    return
  }
  const signatur = req.headers['stripe-signature']
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signatur as string, STRIPE_WEBHOOK_HEMMELIGHET)
  } catch {
    res.status(400).send('Ugyldig webhook-signatur.')
    return
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const tenantId = session.metadata?.tenantId ?? session.client_reference_id
    if (tenantId) {
      await oppdaterTenant(tenantId, {
        lisensstatus: 'aktiv',
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
        stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
      })
    }
  } else if (event.type === 'customer.subscription.deleted') {
    await sperrStripeKunde((event.data.object as { customer?: string | Stripe.Customer | null }).customer)
  } else if (event.type === 'customer.subscription.updated') {
    // Sperr først når Stripe har gitt opp betalingen (etter innkrevingsforsøkene), ikke ved første feilede trekk.
    // Hva som skjer etter siste forsøk (cancel / unpaid) styres i Stripe Dashboard -> Billing -> Subscriptions.
    const abonnement = event.data.object as { customer?: string | Stripe.Customer | null; status?: string }
    if (abonnement.status && STATUSER_SOM_SPERRER.has(abonnement.status)) {
      await sperrStripeKunde(abonnement.customer)
    }
  }
  // invoice.payment_failed gjør bevisst ingenting: Stripe prøver å trekke på nytt (past_due), og
  // avdelingen beholder tilgang til siste forsøk er brukt opp.

  res.json({ mottatt: true })
}))
