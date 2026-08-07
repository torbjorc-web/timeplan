import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const skrivekoer = new Map<string, Promise<unknown>>()

/** Enkel per-fil lås så samtidige skriv ikke korrumperer JSON-filen. */
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

export async function skrivJson<T>(filsti: string, data: T): Promise<void> {
  return kjoerLaast(filsti, async () => {
    await mkdir(dirname(filsti), { recursive: true })
    const midlertidig = `${filsti}.tmp`
    await writeFile(midlertidig, JSON.stringify(data, null, 2), 'utf-8')
    const { rename } = await import('node:fs/promises')
    await rename(midlertidig, filsti)
  })
}
