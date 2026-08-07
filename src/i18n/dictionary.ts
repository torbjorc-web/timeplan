import type { FagType, JusteringType, Rolle, Trinn } from '../types'

/** Skjemaet begge språk-ordbøkene må følge - gir TypeScript-feil hvis en tekst mangler i ett av språkene. */
export interface Dictionary {
  common: {
    loading: string
    loadingData: string
    logout: string
    delete: string
    close: string
    cancel: string
    optional: string
    dash: string
  }
  trinn: Record<Trinn, string>
  fagtype: Record<FagType, string>
  justering: Record<JusteringType, string>
  rolle: Record<Rolle, string>
  lisens: Record<'proveperiode' | 'aktiv' | 'sperret', string>
  sprakVelger: {
    nb: string
    en: string
  }
  regelverk: {
    arsramme: string
    leseplikt_uke: string
  }
  feil: {
    loginFeilet: string
    registreringFeilet: string
    lasteData: string
    lagreData: string
    opprettBruker: string
    lasteAdminData: string
    oppdatereLisens: string
    startBetaling: string
    sendeMelding: string
    meldingForKort: string
  }
  login: {
    appTittel: string
    loggInnHeading: string
    brukernavn: string
    passord: string
    loggInnKnapp: string
    loggerInnKnapp: string
    registrerLenke: string
    registrerHeading: string
    registrerHjelpetekst: string
    avdelingNavn: string
    dittNavn: string
    passordMinLengde: string
    opprettKnapp: string
    oppretterKnapp: string
    harKontoLenke: string
    provDemoKnapp: string
  }
  app: {
    tittel: string
    nyttSkoleaarKnapp: string
    nyttSkoleaarPrompt: (forslag: string) => string
    brukerVisning: (navn: string, rolle: string) => string
    tabs: {
      innstillinger: string
      fag: string
      rom: string
      klasser: string
      laerere: string
      brukere: string
      fagfordeling: string
      aarsplan: string
      minAarsplan: string
      timeplan: string
      minTimeplan: string
      tilbakemelding: string
    }
  }
  innstillinger: {
    heading: string
    advarselTekst: string
    regelverkHeading: string
    regelverkHjelpetekst: string
    arsrammeHeading: string
    leseplikttHeading: string
    kolonner: {
      trinn: string
      arsverkTimer: string
      arbeidsuker: string
      undervisningsramme: string
      annenBundetTid: string
      leseplikttimerUke: string
      timeLengde: string
    }
    delingstallHeading: string
    delingstallHjelpetekst: string
    delingstallKolonner: { fagtype: string; delingstall: string }
    seniorHeading: string
    seniorHjelpetekst: string
    seniorKolonner: { fraAlder: string; reduksjon: string }
    leggTilSeniorregel: string
    slett: string
  }
  fag: {
    heading: string
    hjelpetekst: string
    kolonner: { navn: string; type: string; timerUke: string; delingstall: string; delesMed: string }
    leggTil: string
    slett: string
  }
  rom: {
    heading: string
    hjelpetekst: string
    kolonner: { navn: string; kanIkkeDeles: string; merknad: string }
    leggTil: string
    slett: string
  }
  klasse: {
    heading: string
    kolonner: { navn: string; trinn: string; elevtall: string }
    leggTil: string
    slett: string
  }
  laerer: {
    heading: string
    kolonner: { navn: string; trinn: string; stillingProsent: string; fodselsaar: string }
    fodselsaarPlaceholder: string
    justeringer: string
    lukk: string
    leggTil: string
    slett: string
    justeringerFor: (navn: string) => string
    justeringerHjelpetekst: string
    justeringKolonner: { type: string; timerAar: string; merknad: string }
    leggTilKontaktlaerer: string
    leggTilTillitsvalgt: string
    leggTilSeniortiltak: string
    leggTilAnnet: string
  }
  fagfordeling: {
    heading: string
    hjelpetekst: string
    elevtallTotalt: (antall: number) => string
    ingenKlasser: string
    kolonner: { fag: string; delingstallBrukt: string; grupper: string; timerUke: string; timerAar: string; koblet: string }
  }
  aarsplan: {
    heading: string
    hjelpetekst: string
    lastNedCsv: string
    skrivUt: string
    ingenLaerere: string
    stillingSuffiks: (prosent: number) => string
    kolonnerArsramme: {
      totaltArsverk: string
      grunnUndervisning: string
      sumJusteringer: string
      undervisningEtterJustering: string
      annenBundetTid: string
      ubundetTid: string
    }
    kolonnerLeseplikt: {
      leseplikttimerUke: string
      sumJusteringerUke: string
      undervisningUke: string
      timeLengde: string
    }
    justeringerListe: (tekst: string) => string
  }
  timeplan: {
    heading: string
    headingVisning: string
    hjelpetekst: string
    lastNedCsv: string
    time: (nr: number) => string
    velgFag: string
    velgKlasse: string
    velgLaerer: string
    velgRomValgfritt: string
    spesialromSuffiks: string
    leggTilTime: string
    konfliktOppdaget: string
    leggTilLikevel: string
    avbryt: string
    slett: string
  }
  brukere: {
    heading: string
    hjelpetekst: string
    kolonner: { navn: string; brukernavn: string; rolle: string }
    slett: string
    nyBruker: string
    navnPlaceholder: string
    brukernavnPlaceholder: string
    passordPlaceholder: string
    velgLaererRecord: string
    opprettKnapp: string
  }
  admin: {
    heading: string
    skolerHeading: string
    kolonner: {
      navn: string
      opprettet: string
      lisens: string
      proveperiodeSlutt: string
      brukere: string
      handling: string
    }
    frigi: string
    sperr: string
    ingenSkoler: string
    innloggingerHeading: (antall: number) => string
    innloggingerKolonner: { tidspunkt: string; navn: string; brukernavn: string; rolle: string; skole: string; ip: string }
    ingenInnlogginger: string
    tilbakemeldingerHeading: string
    ingenTilbakemeldinger: string
  }
  lisensBanner: {
    sperretTekst: string
    proveperiodeTekst: (dager: number) => string
    kjopLisens: string
  }
  tilbakemelding: {
    heading: string
    hjelpetekst: string
    placeholder: string
    send: string
    takk: string
  }
}
