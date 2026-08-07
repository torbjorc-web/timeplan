import { randomUUID } from 'node:crypto'
import { hashPassord } from './auth.js'
import { finnBrukerVedBrukernavn, leggTilBruker, oppdaterTenant, opprettTenant } from './store.js'
import type { Bruker } from './types.js'

// Må matches av "Prøv demo-konto"-knappen i src/components/InnloggingPanel.tsx.
export const DEMO_BRUKERNAVN = 'demo'
export const DEMO_PASSORD = 'DemoTimeplan2026'

// Satt av seedDemoKonto() ved oppstart - brukes av middleware.ts for å skrivebeskytte demo-avdelingen.
export let demoTenantId: string | undefined

/** Sikrer at demo-kontoen finnes - kjøres ved hver oppstart siden data kan nullstilles (f.eks. Render uten persistent disk). */
export async function seedDemoKonto(): Promise<void> {
  const eksisterende = await finnBrukerVedBrukernavn(DEMO_BRUKERNAVN)
  if (eksisterende) {
    demoTenantId = eksisterende.tenantId
    // Forny prøveperioden ved hver oppstart så demo-kontoen aldri låser seg pga. utløpt lisens.
    await oppdaterTenant(eksisterende.tenantId, {
      proveperiodeSlutt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    return
  }
  const tenant = await opprettTenant('Demo-avdeling')
  demoTenantId = tenant.id
  const bruker: Bruker = {
    id: randomUUID(),
    tenantId: tenant.id,
    brukernavn: DEMO_BRUKERNAVN,
    passordHash: await hashPassord(DEMO_PASSORD),
    rolle: 'avdelingsleder',
    navn: 'Demo',
    opprettet: new Date().toISOString(),
  }
  await leggTilBruker(bruker)
}
