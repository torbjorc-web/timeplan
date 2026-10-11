import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const skrivekoer = new Map<string, Promise<unknown>>()

/** Enkel per-fil lås (kø) så samtidige skriv - og les-endre-skriv - ikke overskriver hverandre. */
function kjoerLaast<T>(filsti: string, oppgave: () => Promise<T>): Promise<T> {
  const forrige = skrivekoer.get(filsti) ?? Promise.resolve()
  const neste = forrige.then(oppgave, oppgave)
  skrivekoer.set(
    filsti,
    neste.catch(() => undefined),
  )
  return neste
}

export async function lesJson<T>(filsti: string, standardverdi: T): Promise<T> {
  try {
    const innhold = await readFile(filsti, 'utf-8')
    return JSON.parse(innhold) as T
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return standardverdi
    throw err
  }
}

/** Atomisk skriving (midlertidig fil + rename). Skal KUN kalles mens låsen for filen holdes. */
async function skrivUtenLaas<T>(filsti: string, data: T): Promise<void> {
  await mkdir(dirname(filsti), { recursive: true })
  const midlertidig = `${filsti}.tmp`
  await writeFile(midlertidig, JSON.stringify(data, null, 2), 'utf-8')
  await rename(midlertidig, filsti)
}

export async function skrivJson<T>(filsti: string, data: T): Promise<void> {
  return kjoerLaast(filsti, () => skrivUtenLaas(filsti, data))
}

/**
 * Les-endre-skriv som én udelelig operasjon under fil-låsen. Uten dette kan to samtidige kall
 * lese samme tilstand og den ene endringen går tapt (f.eks. to registreringer samtidig).
 *
 * `endre` får gjeldende data og returnerer `{ data, resultat }`. Returneres `data: null`, skrives
 * ingenting. Kaster `endre`, skrives heller ingenting og feilen sendes videre til kalleren.
 */
export async function oppdaterJson<T, R>(
  filsti: string,
  standardverdi: T,
  endre: (data: T) => { data: T | null; resultat: R },
): Promise<R> {
  return kjoerLaast(filsti, async () => {
    const gjeldende = await lesJson<T>(filsti, standardverdi)
    const { data, resultat } = endre(gjeldende)
    if (data !== null) await skrivUtenLaas(filsti, data)
    return resultat
  })
}
