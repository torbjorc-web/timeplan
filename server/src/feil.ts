/** Kastes av store.leggTilBruker når brukernavnet allerede finnes (sjekket atomisk under fil-låsen). */
export class BrukernavnOpptattFeil extends Error {
  constructor() {
    super('Brukernavnet er allerede i bruk.')
    this.name = 'BrukernavnOpptattFeil'
  }
}
