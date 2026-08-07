import type { AppData, Fag, FagType, Innstillinger, Rom, SkoleData, Trinn } from './types'

export function uuid(): string {
  return crypto.randomUUID()
}

/**
 * ALLE tall her er EKSEMPELVERDIER, ikke fasit fra tariffavtalen.
 * SFS 2213-tallene endrer seg ved hvert hovedoppgjør og kan variere lokalt.
 * Kontroller og juster i "Innstillinger" mot gjeldende avtaletekst/PDF før bruk.
 */
export function defaultInnstillinger(): Innstillinger {
  const trinnInnstillinger: Innstillinger['trinnInnstillinger'] = {
    barnetrinn: {
      arsverkTimerFullStilling: 1687.5,
      arbeidsukerIAaret: 39,
      undervisningsrammeFullStilling: 741,
      annenBundetTidPerAar: 150,
    },
    ungdomstrinn: {
      arsverkTimerFullStilling: 1687.5,
      arbeidsukerIAaret: 39,
      undervisningsrammeFullStilling: 656,
      annenBundetTidPerAar: 150,
    },
    videregaende: {
      arsverkTimerFullStilling: 1687.5,
      arbeidsukerIAaret: 39,
      undervisningsrammeFullStilling: 623,
      annenBundetTidPerAar: 150,
    },
  }

  const delingstallStandard: Record<FagType, number> = {
    teoretisk: 30,
    'praktisk-estetisk': 15,
    kroppsoving: 20,
    valgfag: 20,
    annet: 30,
  }

  return {
    trinnInnstillinger,
    seniorRegler: [
      { id: uuid(), fraAlder: 55, reduksjonTimer: 38 },
      { id: uuid(), fraAlder: 60, reduksjonTimer: 76 },
    ],
    delingstallStandard,
  }
}

export function defaultFag(): Fag[] {
  const d = defaultInnstillinger().delingstallStandard
  const fagListe: Fag[] = [
    { id: uuid(), navn: 'Norsk', type: 'teoretisk', timerPerUke: 5, delingstall: d.teoretisk },
    { id: uuid(), navn: 'Matematikk', type: 'teoretisk', timerPerUke: 4, delingstall: d.teoretisk },
    { id: uuid(), navn: 'Engelsk', type: 'teoretisk', timerPerUke: 3, delingstall: d.teoretisk },
    { id: uuid(), navn: 'Musikk', type: 'praktisk-estetisk', timerPerUke: 1, delingstall: d['praktisk-estetisk'] },
    { id: uuid(), navn: 'Mat og helse', type: 'praktisk-estetisk', timerPerUke: 1, delingstall: d['praktisk-estetisk'] },
    { id: uuid(), navn: 'Kunst og håndverk', type: 'praktisk-estetisk', timerPerUke: 2, delingstall: d['praktisk-estetisk'] },
    { id: uuid(), navn: 'Valgfag', type: 'valgfag', timerPerUke: 1, delingstall: d.valgfag },
    { id: uuid(), navn: 'Kroppsøving', type: 'kroppsoving', timerPerUke: 2, delingstall: d.kroppsoving },
  ]
  const valgfag = fagListe.find((f) => f.type === 'valgfag')
  const kroppsoving = fagListe.find((f) => f.type === 'kroppsoving')
  if (valgfag && kroppsoving) {
    // Kroppsøving og valgfag deles sammen ved beregning av gruppestørrelse.
    kroppsoving.kobletFagId = valgfag.id
  }
  return fagListe
}

export function defaultRom(): Rom[] {
  return [
    { id: uuid(), navn: 'Klasserom A', kanIkkeDeles: false },
    { id: uuid(), navn: 'Klasserom B', kanIkkeDeles: false },
    { id: uuid(), navn: 'Sløydsal', kanIkkeDeles: true, merknad: 'Spesialrom - én gruppe om gangen' },
    { id: uuid(), navn: 'Kjøkken (mat og helse)', kanIkkeDeles: true, merknad: 'Spesialrom - én gruppe om gangen' },
    { id: uuid(), navn: 'Musikkrom', kanIkkeDeles: true, merknad: 'Spesialrom - én gruppe om gangen' },
    { id: uuid(), navn: 'Gymsal', kanIkkeDeles: true, merknad: 'Spesialrom - én gruppe om gangen' },
  ]
}

export function opprettTomtSkoleData(skoleaar: string): SkoleData {
  return {
    skoleaar,
    antallOekterPerDag: 6,
    innstillinger: defaultInnstillinger(),
    fag: defaultFag(),
    rom: defaultRom(),
    klasser: [],
    laerere: [],
    timeplan: [],
  }
}

export function defaultTrinnForNyLaerer(): Trinn {
  return 'barnetrinn'
}

export function opprettStandardAppData(): AppData {
  const now = new Date()
  const startAar = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  const skoleaar = `${startAar}/${startAar + 1}`
  return {
    aktivtSkoleaar: skoleaar,
    skoleaar: { [skoleaar]: opprettTomtSkoleData(skoleaar) },
  }
}
