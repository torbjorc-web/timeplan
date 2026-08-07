import Stripe from 'stripe'

const STRIPE_HEMMELIG_NOKKEL = process.env.STRIPE_SECRET_KEY
export const STRIPE_WEBHOOK_HEMMELIGHET = process.env.STRIPE_WEBHOOK_SECRET
export const STRIPE_PRIS_ID = process.env.STRIPE_PRIS_ID
export const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

if (!STRIPE_HEMMELIG_NOKKEL && process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_SECRET_KEY må settes som miljøvariabel i produksjon.')
}

/** Er null i lokal utvikling uten Stripe-nøkkel satt - betalingsruter gir da en tydelig feilmelding. */
export const stripe = STRIPE_HEMMELIG_NOKKEL ? new Stripe(STRIPE_HEMMELIG_NOKKEL) : null
