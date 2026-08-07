import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { lesJson, skrivJson } from './jsonStore.js'
import type { Bruker, Innloggingslogg, Tenant, Tilbakemelding } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const TENANTS_FIL = join(DATA_DIR, 'tenants.json')
const BRUKERE_FIL = join(DATA_DIR, 'brukere.json')
const INNLOGGINGSLOGG_FIL = join(DATA_DIR, 'innloggingslogg.json')
const TILBAKEMELDINGER_FIL = join(DATA_DIR, 'tilbakemeldinger.json')
const MAKS_LOGG_OPPFORINGER = 2000


function skoledataFil(tenantId: string): string {
  // tenantId er alltid server-generert (randomUUID), aldri fra brukerinput -> trygt som filnavn.
  return join(DATA_DIR, 'skoledata', `${tenantId}.json`)
}

const PROVEPERIODE_DAGER = 30

export async function hentTenants(): Promise<Tenant[]> {
  return lesJson<Tenant[]>(TENANTS_FIL, [])
}

export async function hentTenantById(id: string): Promise<Tenant | undefined> {
  const tenants = await hentTenants()
  return tenants.find((t) => t.id === id)
}

export async function opprettTenant(navn: string): Promise<Tenant> {
  const tenants = await hentTenants()
  const proveperiodeSlutt = new Date(Date.now() + PROVEPERIODE_DAGER * 24 * 60 * 60 * 1000).toISOString()
  const ny: Tenant = {
    id: randomUUID(),
    navn,
    opprettet: new Date().toISOString(),
    lisensstatus: 'proveperiode',
    proveperiodeSlutt,
  }
  tenants.push(ny)
  await skrivJson(TENANTS_FIL, tenants)
  return ny
}

export async function hentTenantByStripeCustomerId(stripeCustomerId: string): Promise<Tenant | undefined> {
  const tenants = await hentTenants()
  return tenants.find((t) => t.stripeCustomerId === stripeCustomerId)
}

export async function oppdaterTenant(id: string, endringer: Partial<Tenant>): Promise<Tenant | undefined> {
  const tenants = await hentTenants()
  const idx = tenants.findIndex((t) => t.id === id)
  if (idx === -1) return undefined
  tenants[idx] = { ...tenants[idx], ...endringer }
  await skrivJson(TENANTS_FIL, tenants)
  return tenants[idx]
}

/** Lisensen er gyldig hvis den er aktiv, eller fortsatt i prøveperioden. */
export function harGyldigLisens(tenant: Tenant): boolean {
  if (tenant.lisensstatus === 'aktiv') return true
  if (tenant.lisensstatus === 'proveperiode') return new Date(tenant.proveperiodeSlutt).getTime() > Date.now()
  return false
}

export async function hentBrukere(): Promise<Bruker[]> {
  return lesJson<Bruker[]>(BRUKERE_FIL, [])
}

export async function finnBrukerVedBrukernavn(brukernavn: string): Promise<Bruker | undefined> {
  const brukere = await hentBrukere()
  return brukere.find((b) => b.brukernavn.toLowerCase() === brukernavn.toLowerCase())
}

export async function leggTilBruker(bruker: Bruker): Promise<void> {
  const brukere = await hentBrukere()
  brukere.push(bruker)
  await skrivJson(BRUKERE_FIL, brukere)
}

export async function slettBruker(id: string, tenantId: string): Promise<boolean> {
  const brukere = await hentBrukere()
  const filtrert = brukere.filter((b) => !(b.id === id && b.tenantId === tenantId))
  const endret = filtrert.length !== brukere.length
  if (endret) await skrivJson(BRUKERE_FIL, filtrert)
  return endret
}

export async function hentBrukereForTenant(tenantId: string): Promise<Bruker[]> {
  const brukere = await hentBrukere()
  return brukere.filter((b) => b.tenantId === tenantId)
}

export async function hentSkoledata(tenantId: string): Promise<unknown | null> {
  return lesJson<unknown | null>(skoledataFil(tenantId), null)
}

export async function lagreSkoledata(tenantId: string, data: unknown): Promise<void> {
  await skrivJson(skoledataFil(tenantId), data)
}

export async function loggInnlogging(oppforing: Omit<Innloggingslogg, 'id'>): Promise<void> {
  const logg = await lesJson<Innloggingslogg[]>(INNLOGGINGSLOGG_FIL, [])
  logg.push({ id: randomUUID(), ...oppforing })
  // Behold bare de nyeste oppføringene for å unngå at loggfilen vokser ubegrenset.
  const beskaaret = logg.length > MAKS_LOGG_OPPFORINGER ? logg.slice(logg.length - MAKS_LOGG_OPPFORINGER) : logg
  await skrivJson(INNLOGGINGSLOGG_FIL, beskaaret)
}

export async function hentInnloggingslogg(): Promise<Innloggingslogg[]> {
  const logg = await lesJson<Innloggingslogg[]>(INNLOGGINGSLOGG_FIL, [])
  return [...logg].reverse()
}

export async function leggTilTilbakemelding(melding: Omit<Tilbakemelding, 'id' | 'tidspunkt'>): Promise<Tilbakemelding> {
  const alle = await lesJson<Tilbakemelding[]>(TILBAKEMELDINGER_FIL, [])
  const ny: Tilbakemelding = { id: randomUUID(), tidspunkt: new Date().toISOString(), ...melding }
  alle.push(ny)
  await skrivJson(TILBAKEMELDINGER_FIL, alle)
  return ny
}

export async function hentTilbakemeldinger(): Promise<Tilbakemelding[]> {
  const alle = await lesJson<Tilbakemelding[]>(TILBAKEMELDINGER_FIL, [])
  return [...alle].reverse()
}
