/**
 * Engangs-script for å opprette en superadmin-konto lokalt.
 * Kjøres med: npm run create-superadmin
 * Superadmin har ingen tenant (tenantId='') og opprettes ALDRI via det offentlige API-et.
 */
import { createInterface } from 'node:readline/promises'
import { randomUUID } from 'node:crypto'
import { hashPassord } from '../auth.js'
import { finnBrukerVedBrukernavn, leggTilBruker } from '../store.js'
import type { Bruker } from '../types.js'

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const brukernavn = (await rl.question('Brukernavn for superadmin: ')).trim()
    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(brukernavn)) {
      console.error('Ugyldig brukernavn (3-50 tegn: bokstaver/tall/._-).')
      process.exitCode = 1
      return
    }
    if (await finnBrukerVedBrukernavn(brukernavn)) {
      console.error('Brukernavnet er allerede i bruk.')
      process.exitCode = 1
      return
    }
    const navn = (await rl.question('Fullt navn: ')).trim()
    const passord = await rl.question('Passord (minst 8 tegn): ')
    if (passord.length < 8) {
      console.error('Passordet må være minst 8 tegn.')
      process.exitCode = 1
      return
    }
    const bruker: Bruker = {
      id: randomUUID(),
      tenantId: '',
      brukernavn,
      passordHash: await hashPassord(passord),
      rolle: 'superadmin',
      navn: navn || brukernavn,
      opprettet: new Date().toISOString(),
    }
    await leggTilBruker(bruker)
    console.log(`Superadmin "${brukernavn}" opprettet.`)
  } finally {
    rl.close()
  }
}

main()
