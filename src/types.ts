// Datamodeller for timeplan-/årsplanverktøyet (basert på SFS 2213-strukturen)

export type Rolle = 'avdelingsleder' | 'laerer' | 'rektor' | 'superadmin'

export type Trinn = 'barnetrinn' | 'ungdomstrinn' | 'videregaende'

export const TRINN_LABELS: Record<Trinn, string> = {
  barnetrinn: 'Barnetrinn (1.-7.)',
  ungdomstrinn: 'Ungdomstrinn (8.-10.)',
  videregaende: 'Videregående opplæring',
}

export type FagType = 'teoretisk' | 'praktisk-estetisk' | 'kroppsoving' | 'valgfag' | 'annet'

export const FAGTYPE_LABELS: Record<FagType, string> = {
  teoretisk: 'Teoretisk fag',
  'praktisk-estetisk': 'Praktisk-estetisk fag',
  kroppsoving: 'Kroppsøving',
  valgfag: 'Valgfag',
  annet: 'Annet',
}

export interface Fag {
  id: string
  navn: string
  type: FagType
  /** Undervisningstimer (klokketimer) per uke for én gruppe i faget. */
  timerPerUke: number
  /** Maks antall elever per gruppe før faget må deles i flere grupper. */
  delingstall: number
  /** Id til fag denne skal "deles sammen med" ved beregning av gruppestørrelse (f.eks. kroppsøving + valgfag). */
  kobletFagId?: string
}

export interface Rom {
  id: string
  navn: string
  /** Spesialrom (sløyd, kjøkken, musikkrom o.l.) som ikke kan brukes av to grupper samtidig. */
  kanIkkeDeles: boolean
  merknad?: string
}

export interface Klasse {
  id: string
  navn: string
  trinn: Trinn
  elevtall: number
}

export type JusteringType = 'kontaktlaerer' | 'tillitsvalgt' | 'seniortiltak' | 'annet'

export const JUSTERING_LABELS: Record<JusteringType, string> = {
  kontaktlaerer: 'Kontaktlærer',
  tillitsvalgt: 'Tillitsvalgt',
  seniortiltak: 'Seniortiltak',
  annet: 'Annen grunn',
}

export interface Justering {
  id: string
  type: JusteringType
  /** Reduksjon i undervisningstid, klokketimer per år. */
  timerPerAar: number
  merknad?: string
}

export interface Laerer {
  id: string
  navn: string
  trinn: Trinn
  /** Stillingsprosent, 0-100. */
  stillingsprosent: number
  fodselsaar?: number
  /** Overstyrer beregnet undervisningstimetall hvis satt. */
  undervisningstimerFaktisk?: number
  justeringer: Justering[]
  notat?: string
}

export interface SeniorRegel {
  id: string
  fraAlder: number
  /** Reduksjon i undervisning, klokketimer per år, fra og med angitt alder. */
  reduksjonTimer: number
}

export interface TrinnInnstilling {
  /** Klokketimer i et fullt årsverk (100% stilling) - eksempelverdi, juster etter avtale. */
  arsverkTimerFullStilling: number
  /** Lærerens arbeidsuker i skoleåret - eksempelverdi, juster etter avtale. */
  arbeidsukerIAaret: number
  /** Undervisningstimetall (klokketimer/år) for 100% stilling - eksempelverdi, juster etter avtale. */
  undervisningsrammeFullStilling: number
  /** Annet bundet arbeid ved skolen (møter mv.), klokketimer/år for 100% stilling. */
  annenBundetTidPerAar: number
}

/**
 * Hvilken modell skolen bruker for å beregne lærernes undervisningsplikt:
 * - 'arsramme': fullt årsverk fordeles på undervisning/annen bundet tid/ubundet tid (SFS 2213-stil).
 * - 'leseplikt_uke': fast undervisningstimetall per uke (vanlig internasjonal modell), sammenlignet mot faktisk timeplan.
 */
export type Regelverk = 'arsramme' | 'leseplikt_uke'

export interface LeseplikttInnstilling {
  /** Maks undervisningstimer (klokketimer) per uke ved 100% stilling ("leseplikt"). */
  leseplikttimerUke: number
  /** Lengde på en undervisningsøkt/time i minutter - brukes bare til visning/omregning. */
  timeLengdeMinutter: number
}

export interface Innstillinger {
  regelverk: Regelverk
  trinnInnstillinger: Record<Trinn, TrinnInnstilling>
  leseplikttInnstillinger: Record<Trinn, LeseplikttInnstilling>
  seniorRegler: SeniorRegel[]
  /** Standard delingstall (gruppestørrelse) per fagtype - kan overstyres per fag. */
  delingstallStandard: Record<FagType, number>
}

export type Dag = 'Mandag' | 'Tirsdag' | 'Onsdag' | 'Torsdag' | 'Fredag'

export const DAGER: Dag[] = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag']

export interface TimeplanOppforing {
  id: string
  dag: Dag
  /** Øktnummer (time 1, 2, 3 ...). */
  oekt: number
  fagId: string
  klasseId: string
  laererId: string
  romId?: string
}

export interface SkoleData {
  skoleaar: string
  antallOekterPerDag: number
  innstillinger: Innstillinger
  fag: Fag[]
  rom: Rom[]
  klasser: Klasse[]
  laerere: Laerer[]
  timeplan: TimeplanOppforing[]
}

export interface AppData {
  aktivtSkoleaar: string
  skoleaar: Record<string, SkoleData>
}
