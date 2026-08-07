import { describe, expect, it } from 'vitest'
import {
  beregnFagbehovForTrinn,
  beregnLaererAarsplan,
  finnKonflikter,
  foreslaSeniorReduksjon,
  formatTimer,
  grupperNoedvendig,
  summerJusteringer,
} from './calculations'
import type { Fag, Justering, Klasse, Laerer, SeniorRegel, TimeplanOppforing, TrinnInnstilling } from '../types'

describe('grupperNoedvendig', () => {
  it('runder opp til nærmeste hele gruppe', () => {
    expect(grupperNoedvendig(61, 30)).toBe(3)
    expect(grupperNoedvendig(60, 30)).toBe(2)
    expect(grupperNoedvendig(1, 30)).toBe(1)
  })

  it('returnerer minst 1 gruppe selv med 0 elever', () => {
    expect(grupperNoedvendig(0, 30)).toBe(1)
  })

  it('behandler delingstall <= 0 som "ingen deling" (1 gruppe)', () => {
    expect(grupperNoedvendig(100, 0)).toBe(1)
  })
})

describe('beregnFagbehovForTrinn', () => {
  const fagListe: Fag[] = [
    { id: 'norsk', navn: 'Norsk', type: 'teoretisk', timerPerUke: 5, delingstall: 30 },
    { id: 'valgfag', navn: 'Valgfag', type: 'valgfag', timerPerUke: 1, delingstall: 20 },
    { id: 'kropp', navn: 'Kroppsøving', type: 'kroppsoving', timerPerUke: 2, delingstall: 20, kobletFagId: 'valgfag' },
  ]
  const klasser: Klasse[] = [
    { id: 'k1', navn: '8A', trinn: 'ungdomstrinn', elevtall: 25 },
    { id: 'k2', navn: '8B', trinn: 'ungdomstrinn', elevtall: 26 },
  ]

  it('beregner grupper og lærertimer for et vanlig fag', () => {
    const resultat = beregnFagbehovForTrinn('ungdomstrinn', klasser, fagListe, 39)
    const norsk = resultat.find((r) => r.fagId === 'norsk')
    expect(norsk?.elevtallTotalt).toBe(51)
    expect(norsk?.grupper).toBe(2) // 51 / 30 -> 2 grupper
    expect(norsk?.laerertimerPerUke).toBe(10) // 2 grupper * 5t
    expect(norsk?.laerertimerPerAar).toBe(390) // 10 * 39 uker
  })

  it('slår sammen koblede fag (kroppsøving + valgfag) uten dobbelttelling', () => {
    const resultat = beregnFagbehovForTrinn('ungdomstrinn', klasser, fagListe, 39)
    const valgfag = resultat.find((r) => r.fagId === 'valgfag')
    const kropp = resultat.find((r) => r.fagId === 'kropp')
    // Begge bruker samme (laveste) delingstall og samme gruppetall, uansett rekkefølge i fagListe.
    expect(valgfag?.delingstallBrukt).toBe(20)
    expect(kropp?.delingstallBrukt).toBe(20)
    expect(valgfag?.grupper).toBe(kropp?.grupper)
  })

  it('returnerer tomt array når ingen klasser er på trinnet', () => {
    const resultat = beregnFagbehovForTrinn('barnetrinn', klasser, fagListe, 39)
    expect(resultat.every((r) => r.elevtallTotalt === 0)).toBe(true)
  })
})

describe('summerJusteringer / foreslaSeniorReduksjon', () => {
  it('summerer timerPerAar for alle justeringer', () => {
    const justeringer: Justering[] = [
      { id: '1', type: 'kontaktlaerer', timerPerAar: 50 },
      { id: '2', type: 'annet', timerPerAar: 25 },
    ]
    expect(summerJusteringer(justeringer)).toBe(75)
  })

  const regler: SeniorRegel[] = [
    { id: '1', fraAlder: 55, reduksjonTimer: 38 },
    { id: '2', fraAlder: 60, reduksjonTimer: 76 },
  ]

  it('finner riktig regel ut fra alder', () => {
    expect(foreslaSeniorReduksjon(54, regler)).toBe(0)
    expect(foreslaSeniorReduksjon(55, regler)).toBe(38)
    expect(foreslaSeniorReduksjon(61, regler)).toBe(76)
  })

  it('returnerer 0 når alder er ukjent', () => {
    expect(foreslaSeniorReduksjon(undefined, regler)).toBe(0)
  })
})

describe('beregnLaererAarsplan', () => {
  const innstilling: TrinnInnstilling = {
    arsverkTimerFullStilling: 1687.5,
    arbeidsukerIAaret: 39,
    undervisningsrammeFullStilling: 656,
    annenBundetTidPerAar: 150,
  }

  it('beregner undervisning og ubundet tid for full stilling uten justeringer', () => {
    const laerer: Laerer = { id: '1', navn: 'Test', trinn: 'ungdomstrinn', stillingsprosent: 100, justeringer: [] }
    const plan = beregnLaererAarsplan(laerer, innstilling)
    expect(plan.totalArsverkTimer).toBe(1687.5)
    expect(plan.grunnUndervisning).toBe(656)
    expect(plan.undervisning).toBe(656)
    expect(plan.ubundetTid).toBeCloseTo(1687.5 - 656 - 150)
    expect(plan.advarsler).toHaveLength(0)
  })

  it('skalerer med stillingsprosent', () => {
    const laerer: Laerer = { id: '1', navn: 'Test', trinn: 'ungdomstrinn', stillingsprosent: 50, justeringer: [] }
    const plan = beregnLaererAarsplan(laerer, innstilling)
    expect(plan.totalArsverkTimer).toBeCloseTo(843.75)
    expect(plan.grunnUndervisning).toBeCloseTo(328)
  })

  it('varsler når justeringer overstiger undervisningstimetallet', () => {
    const laerer: Laerer = {
      id: '1',
      navn: 'Test',
      trinn: 'ungdomstrinn',
      stillingsprosent: 100,
      justeringer: [{ id: 'j1', type: 'annet', timerPerAar: 1000 }],
    }
    const plan = beregnLaererAarsplan(laerer, innstilling)
    expect(plan.undervisning).toBe(0)
    expect(plan.advarsler.length).toBeGreaterThan(0)
  })
})

describe('finnKonflikter', () => {
  const eksisterende: TimeplanOppforing[] = [
    { id: 'o1', dag: 'Mandag', oekt: 1, fagId: 'norsk', klasseId: 'k1', laererId: 'l1', romId: 'r1' },
  ]
  const romKanIkkeDeles = (romId: string | undefined) => romId === 'r1'

  it('finner ingen konflikt i en ledig time', () => {
    const nyOppforing = { id: 'ny', dag: 'Mandag' as const, oekt: 2, fagId: 'norsk', klasseId: 'k1', laererId: 'l1', romId: 'r1' }
    expect(finnKonflikter(nyOppforing, eksisterende, romKanIkkeDeles)).toHaveLength(0)
  })

  it('oppdager lærerkonflikt i samme økt', () => {
    const nyOppforing = { id: 'ny', dag: 'Mandag' as const, oekt: 1, fagId: 'matte', klasseId: 'k2', laererId: 'l1', romId: undefined }
    const konflikter = finnKonflikter(nyOppforing, eksisterende, romKanIkkeDeles)
    expect(konflikter.some((k) => k.type === 'laerer')).toBe(true)
  })

  it('oppdager romkonflikt kun for spesialrom', () => {
    const nyOppforing = { id: 'ny', dag: 'Mandag' as const, oekt: 1, fagId: 'matte', klasseId: 'k2', laererId: 'l2', romId: 'r1' }
    const konflikter = finnKonflikter(nyOppforing, eksisterende, romKanIkkeDeles)
    expect(konflikter.some((k) => k.type === 'rom')).toBe(true)
  })

  it('ignorerer oppføringen sin egen id (redigering av seg selv)', () => {
    const nyOppforing = { id: 'o1', dag: 'Mandag' as const, oekt: 1, fagId: 'norsk', klasseId: 'k1', laererId: 'l1', romId: 'r1' }
    expect(finnKonflikter(nyOppforing, eksisterende, romKanIkkeDeles)).toHaveLength(0)
  })
})

describe('formatTimer', () => {
  it('formaterer med maks 1 desimal', () => {
    expect(formatTimer(656)).toBe('656')
    expect(formatTimer(328.333)).toBe('328,3')
  })
})
