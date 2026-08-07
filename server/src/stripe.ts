import Stripe from 'stripe'

const STRIPE_HEMMELIG_NOKKEL = process.env.STRIPE_SECRET_KEY
export const STRIPE_WEBHOOK_HEMMELIGHET = process.env.STRIPE_WEBHOOK_SECRET
export const STRIPE_PRIS_ID = process.env.STRIPE_PRIS_ID
// Fjerner en evt. trailing slash - CORS-origin-sammenligning er streng eksakt match mot nettleserens Origin-header (uten slash).
export const APP_URL = (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/+$/, '')

if (!STRIPE_HEMMELIG_NOKKEL && process.env.NODE_ENV === 'production') {
  // Ikke krasj hele appen i produksjon uten Stripe konfigurert - betalingsrutene
  // gir en tydelig 503-feil til klienten inntil nøklene settes (se betaling.ts).
  console.warn('STRIPE_SECRET_KEY er ikke satt - betalingsfunksjoner er deaktivert.')
}

/** Er null i lokal utvikling uten Stripe-nøkkel satt - betalingsruter gir da en tydelig feilmelding. */
export const stripe = STRIPE_HEMMELIG_NOKKEL ? new Stripe(STRIPE_HEMMELIG_NOKKEL) : null
