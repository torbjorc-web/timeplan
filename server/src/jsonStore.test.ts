import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { lesJson, oppdaterJson, skrivJson } from './jsonStore.js'

let mappe: string
let fil: string

beforeEach(async () => {
  mappe = await mkdtemp(join(tmpdir(), 'jsonstore-'))
  fil = join(mappe, 'data', 'liste.json')
})

afterEach(async () => {
  await rm(mappe, { recursive: true, force: true })
})

describe('oppdaterJson', () => {
  it('mister ingen endringer ved mange samtidige les-endre-skriv', async () => {
    await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        oppdaterJson<number[], void>(fil, [], (liste) => {
          liste.push(i)
          return { data: liste, resultat: undefined }
        }),
      ),
    )
    const lagret = await lesJson<number[]>(fil, [])
    expect(lagret).toHaveLength(50)
    expect(new Set(lagret).size).toBe(50)
  })

  it('skriver ikke når endre returnerer data: null, og gir tilbake resultatet', async () => {
    const resultat = await oppdaterJson<number[], string>(fil, [], () => ({ data: null, resultat: 'uendret' }))
    expect(resultat).toBe('uendret')
    expect(await lesJson<number[] | null>(fil, null)).toBeNull()
  })

  it('skriver ingenting når endre kaster, og køen fortsetter å virke', async () => {
    await skrivJson(fil, [1])
    await expect(
      oppdaterJson<number[], void>(fil, [], () => {
        throw new Error('avbrutt')
      }),
    ).rejects.toThrow('avbrutt')
    expect(JSON.parse(await readFile(fil, 'utf-8'))).toEqual([1])

    await oppdaterJson<number[], void>(fil, [], (liste) => ({ data: [...liste, 2], resultat: undefined }))
    expect(await lesJson<number[]>(fil, [])).toEqual([1, 2])
  })

  it('bruker standardverdien når filen ikke finnes', async () => {
    await oppdaterJson<string[], void>(fil, [], (liste) => ({ data: [...liste, 'første'], resultat: undefined }))
    expect(await lesJson<string[]>(fil, [])).toEqual(['første'])
  })
})
