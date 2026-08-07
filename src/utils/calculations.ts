import type {
  Dag,
  Fag,
  Justering,
  Klasse,
  Laerer,
  LeseplikttInnstilling,
  SeniorRegel,
  TimeplanOppforing,
  Trinn,
  TrinnInnstilling,
} from '../types'

export function grupperNoedvendig(elevtall: number, delingstall: number): number {
  if (delingstall <= 0) return 1
  return Math.max(1, Math.ceil(elevtall / delingstall))
}

export interface FagBehov {
  fagId: string
  fagNavn: string
  trinn: Trinn
  elevtallTotalt: number
  delingstallBrukt: number
  grupper: number
  laerertimerPerUke: number
  laerertimerPerAar: number
  koblet?: string
}

/** Beregner antall grupper og lærertimer per fag for et gitt trinn. Fag koblet sammen
 * (f.eks. kroppsøving + valgfag) slås sammen til én felles beregning så ressursen ikke telles dobbelt. */
export function beregnFagbehovForTrinn(
  trinn: Trinn,
  klasser: Klasse[],
  fagListe: Fag[],
  arbeidsukerIAaret: number,
): FagBehov[] {
  const klasserPaaTrinn = klasser.filter((k) => k.trinn === trinn)
  const elevtallTotalt = klasserPaaTrinn.reduce((sum, k) => sum + k.elevtall, 0)
  const behandlet = new Set<string>()
  const resultat: FagBehov[] = []

  for (const fag of fagListe) {
    if (behandlet.has(fag.id)) continue
    const kobletFag = fag.kobletFagId ? fagListe.find((f) => f.id === fag.kobletFagId) : undefined

    if (kobletFag) {
      // Slå sammen elevtall for de to koblede fagene (f.eks. kroppsøving + valgfag).
      const delingstall = Math.min(fag.delingstall, kobletFag.delingstall)
      const grupper = grupperNoedvendig(elevtallTotalt, delingstall)
      for (const f of [fag, kobletFag]) {
        const laerertimerPerUke = grupper * f.timerPerUke
        resultat.push({
          fagId: f.id,
          fagNavn: f.navn,
          trinn,
          elevtallTotalt,
          delingstallBrukt: delingstall,
          grupper,
          laerertimerPerUke,
          laerertimerPerAar: laerertimerPerUke * arbeidsukerIAaret,
          koblet: f.id === fag.id ? kobletFag.navn : fag.navn,
        })
      }
      behandlet.add(fag.id)
      behandlet.add(kobletFag.id)
      continue
    }

    const grupper = grupperNoedvendig(elevtallTotalt, fag.delingstall)
    const laerertimerPerUke = grupper * fag.timerPerUke
    resultat.push({
      fagId: fag.id,
      fagNavn: fag.navn,
      trinn,
      elevtallTotalt,
      delingstallBrukt: fag.delingstall,
      grupper,
      laerertimerPerUke,
      laerertimerPerAar: laerertimerPerUke * arbeidsukerIAaret,
    })
    behandlet.add(fag.id)
  }

  return resultat
}

export function finnAlder(fodselsaar: number | undefined, skoleaarStart: number): number | undefined {
  if (!fodselsaar) return undefined
  return skoleaarStart - fodselsaar
}

export function foreslaSeniorReduksjon(alder: number | undefined, seniorRegler: SeniorRegel[]): number {
  if (alder === undefined) return 0
  const gjeldende = seniorRegler
    .filter((r) => alder >= r.fraAlder)
    .sort((a, b) => b.fraAlder - a.fraAlder)[0]
  return gjeldende ? gjeldende.reduksjonTimer : 0
}

export interface LaererAarsplan {
  totalArsverkTimer: number
  grunnUndervisning: number
  sumJusteringer: number
  undervisning: number
  annenBundetTid: number
  ubundetTid: number
  advarsler: string[]
}

export function summerJusteringer(justeringer: Justering[]): number {
  return justeringer.reduce((sum, j) => sum + j.timerPerAar, 0)
}

export function beregnLaererAarsplan(laerer: Laerer, innstilling: TrinnInnstilling): LaererAarsplan {
  const andel = laerer.stillingsprosent / 100
  const totalArsverkTimer = andel * innstilling.arsverkTimerFullStilling
  const grunnUndervisning =
    laerer.undervisningstimerFaktisk ?? andel * innstilling.undervisningsrammeFullStilling
  const sumJusteringer = summerJusteringer(laerer.justeringer)
  const undervisning = Math.max(0, grunnUndervisning - sumJusteringer)
  const annenBundetTid = andel * innstilling.annenBundetTidPerAar
  const ubundetTid = totalArsverkTimer - undervisning - annenBundetTid

  const advarsler: string[] = []
  if (grunnUndervisning - sumJusteringer < 0) {
    advarsler.push('Summen av justeringer/reduksjoner er større enn beregnet undervisningstimetall.')
  }
  if (ubundetTid < 0) {
    advarsler.push('Ubundet tid blir negativ - undervisning + annen bundet tid overstiger årsverket.')
  }
  return { totalArsverkTimer, grunnUndervisning, sumJusteringer, undervisning, annenBundetTid, ubundetTid, advarsler }
}

export interface LaererLeseplikt {
  leseplikttimerUke: number
  sumJusteringerUke: number
  undervisningPaakrevdUke: number
  undervisningFaktiskUke: number
  differanseUke: number
  advarsler: string[]
}

/**
 * Beregner ukentlig undervisningsplikt for "leseplikt_uke"-modellen (vanlig internasjonal modell):
 * et fast undervisningstimetall per uke, sammenlignet mot lærerens faktiske timeplan.
 * Justeringer er lagret som klokketimer/år (samme felt som årsramme-modellen) og regnes om til per uke.
 */
export function beregnLaererLeseplikt(
  laerer: Laerer,
  innstilling: LeseplikttInnstilling,
  arbeidsukerIAaret: number,
  timeplan: TimeplanOppforing[],
): LaererLeseplikt {
  const andel = laerer.stillingsprosent / 100
  const leseplikttimerUke = andel * innstilling.leseplikttimerUke
  const sumJusteringerAar = summerJusteringer(laerer.justeringer)
  const sumJusteringerUke = arbeidsukerIAaret > 0 ? sumJusteringerAar / arbeidsukerIAaret : 0
  const undervisningPaakrevdUke = Math.max(0, leseplikttimerUke - sumJusteringerUke)
  const undervisningFaktiskUke = timeplan.filter((o) => o.laererId === laerer.id).length * (innstilling.timeLengdeMinutter / 60)
  const differanseUke = undervisningPaakrevdUke - undervisningFaktiskUke

  const advarsler: string[] = []
  if (leseplikttimerUke - sumJusteringerUke < 0) {
    advarsler.push('Summen av justeringer/reduksjoner er større enn leseplikten per uke.')
  }
  if (differanseUke < -0.01) {
    advarsler.push('Læreren er satt opp med flere undervisningstimer per uke enn leseplikten tilsier.')
  } else if (differanseUke > 0.01) {
    advarsler.push('Læreren er satt opp med færre undervisningstimer per uke enn leseplikten tilsier.')
  }
  return { leseplikttimerUke, sumJusteringerUke, undervisningPaakrevdUke, undervisningFaktiskUke, differanseUke, advarsler }
}

export interface Konflikt {
  type: 'rom' | 'laerer' | 'klasse'
  melding: string
}

/** Sjekker om en ny timeplanoppføring kolliderer med eksisterende (samme dag/økt). */
export function finnKonflikter(
  nyOppforing: Pick<TimeplanOppforing, 'dag' | 'oekt' | 'laererId' | 'klasseId' | 'romId' | 'id'>,
  eksisterende: TimeplanOppforing[],
  romKanIkkeDeles: (romId: string | undefined) => boolean,
): Konflikt[] {
  const konflikter: Konflikt[] = []
  const sammeSlot = eksisterende.filter(
    (o) => o.id !== nyOppforing.id && o.dag === nyOppforing.dag && o.oekt === nyOppforing.oekt,
  )
  for (const o of sammeSlot) {
    if (o.laererId === nyOppforing.laererId) {
      konflikter.push({ type: 'laerer', melding: 'Læreren er allerede satt opp i dette tidsrommet.' })
    }
    if (o.klasseId === nyOppforing.klasseId) {
      konflikter.push({ type: 'klasse', melding: 'Klassen/gruppen er allerede satt opp i dette tidsrommet.' })
    }
    if (nyOppforing.romId && o.romId === nyOppforing.romId && romKanIkkeDeles(nyOppforing.romId)) {
      konflikter.push({ type: 'rom', melding: 'Rommet er et spesialrom og er allerede booket i dette tidsrommet.' })
    }
  }
  return konflikter
}

export function formatTimer(t: number): string {
  return t.toLocaleString('nb-NO', { maximumFractionDigits: 1 })
}

export const DAGER_KONST: Dag[] = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag']
