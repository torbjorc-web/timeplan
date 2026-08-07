import { randomUUID } from 'node:crypto'
import { hashPassord } from './auth.js'
import { finnBrukerVedBrukernavn, leggTilBruker, opprettTenant } from './store.js'
import type { Bruker } from './types.js'

// Må matches av "Prøv demo-konto"-knappen i src/components/InnloggingPanel.tsx.
export const DEMO_BRUKERNAVN = 'demo'
export const DEMO_PASSORD = 'DemoTimeplan2026'

/** Sikrer at demo-kontoen finnes - kjøres ved hver oppstart siden data kan nullstilles (f.eks. Render uten persistent disk). */
export async function seedDemoKonto(): Promise<void> {
  if (await finnBrukerVedBrukernavn(DEMO_BRUKERNAVN)) return
  const tenant = await opprettTenant('Demo-avdeling')
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
