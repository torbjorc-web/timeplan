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
