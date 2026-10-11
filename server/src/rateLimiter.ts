/** Enkel in-memory rate limiter for innloggingsforsøk (per brukernavn+IP). Nok
 * for et internt verktøy med lite trafikk; ved skalering bør dette flyttes til
 * en delt store (redis e.l.) siden dette ikke overlever server-restart eller
 * fungerer på tvers av flere instanser. */

interface Forsok {
  antall: number
  blokkertTil?: number
}

const forsokPerNokkel = new Map<string, Forsok>()

const MAKS_FORSOK = 5
const BLOKKERINGSTID_MS = 5 * 60 * 1000
const VINDU_MS = 15 * 60 * 1000
const tidspunktForForsteForsok = new Map<string, number>()

export function erBlokkert(nokkel: string): boolean {
  const forsok = forsokPerNokkel.get(nokkel)
  if (!forsok?.blokkertTil) return false
  if (Date.now() > forsok.blokkertTil) {
    forsokPerNokkel.delete(nokkel)
    tidspunktForForsteForsok.delete(nokkel)
    return false
  }
  return true
}

export function registrerMislykketForsok(nokkel: string): void {
  // Rydd bort utløpte oppføringer så mappene ikke vokser ubegrenset (f.eks. ved mange ulike brukernavn).
  if (tidspunktForForsteForsok.size > 1000) {
    for (const [k, t] of tidspunktForForsteForsok) {
      if (Date.now() - t > VINDU_MS) {
        tidspunktForForsteForsok.delete(k)
        forsokPerNokkel.delete(k)
      }
    }
  }
  const forste = tidspunktForForsteForsok.get(nokkel)
  if (!forste || Date.now() - forste > VINDU_MS) {
    tidspunktForForsteForsok.set(nokkel, Date.now())
    forsokPerNokkel.set(nokkel, { antall: 1 })
    return
  }
  const forsok = forsokPerNokkel.get(nokkel) ?? { antall: 0 }
  forsok.antall += 1
  if (forsok.antall >= MAKS_FORSOK) {
    forsok.blokkertTil = Date.now() + BLOKKERINGSTID_MS
  }
  forsokPerNokkel.set(nokkel, forsok)
}

export function nullstillForsok(nokkel: string): void {
  forsokPerNokkel.delete(nokkel)
  tidspunktForForsteForsok.delete(nokkel)
}


/** Enkel fast-vindu-teller, f.eks. for å begrense registrering av nye avdelinger per IP. Returnerer false når grensen er nådd. */
const hendelser = new Map<string, { antall: number; vinduStart: number }>()
let sisteOppryddingMs = Date.now()

export function tillatHendelse(nokkel: string, maks: number, vinduMs: number): boolean {
  const naa = Date.now()
  // Rydd bort utløpte vinduer av og til så mappen ikke vokser ubegrenset.
  if (naa - sisteOppryddingMs > vinduMs) {
    for (const [k, v] of hendelser) {
      if (naa - v.vinduStart > vinduMs) hendelser.delete(k)
    }
    sisteOppryddingMs = naa
  }
  const eksisterende = hendelser.get(nokkel)
  if (!eksisterende || naa - eksisterende.vinduStart > vinduMs) {
    hendelser.set(nokkel, { antall: 1, vinduStart: naa })
    return true
  }
  if (eksisterende.antall >= maks) return false
  eksisterende.antall += 1
  return true
}

/** Kun for tester. */
export function nullstillRateLimiter(): void {
  forsokPerNokkel.clear()
  tidspunktForForsteForsok.clear()
  hendelser.clear()
}
