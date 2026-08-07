/** Serverens syn på datamodellene. Selve SkoleData-strukturen eies av
 * frontend (src/types.ts) og lagres/videresendes stort sett uendret her -
 * serveren kjenner bare til feltene den trenger for rollebasert filtrering. */

export type Rolle = 'avdelingsleder' | 'laerer' | 'rektor' | 'superadmin'

export type Lisensstatus = 'proveperiode' | 'aktiv' | 'sperret'

export interface Tenant {
  id: string
  navn: string
  opprettet: string
  lisensstatus: Lisensstatus
  proveperiodeSlutt: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}


/** Superadmin har ikke tenant - brukes som tenantId-verdi for slike kontoer. */
export const INGEN_TENANT = ''

export interface Innloggingslogg {
  id: string
  brukerId: string
  brukernavn: string
  navn: string
  rolle: Rolle
  tenantId: string
  tidspunkt: string
  ip: string
}

export interface Tilbakemelding {
  id: string
  tenantId: string
  brukerNavn: string
  melding: string
  tidspunkt: string
}


export interface Bruker {
  id: string
  tenantId: string
  brukernavn: string
  passordHash: string
  rolle: Rolle
  /** For rolle=laerer: hvilken Laerer-record (i skoledata) brukeren kan se. */
  laererId?: string
  navn: string
  opprettet: string
}

export interface BrukerUtenPassord {
  id: string
  tenantId: string
  brukernavn: string
  rolle: Rolle
  laererId?: string
  navn: string
}

/** Minimal form av frontendens Laerer/TimeplanOppforing - nok til rollefiltrering. */
export interface MinimalLaerer {
  id: string
  [key: string]: unknown
}

export interface MinimalTimeplanOppforing {
  laererId: string
  [key: string]: unknown
}

export interface MinimalSkoleData {
  laerere?: MinimalLaerer[]
  timeplan?: MinimalTimeplanOppforing[]
  [key: string]: unknown
}

export interface MinimalAppData {
  aktivtSkoleaar: string
  skoleaar: Record<string, MinimalSkoleData>
}
