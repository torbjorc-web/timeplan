import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { hashPassord } from '../auth.js'
import { kreverRolle } from '../middleware.js'
import { finnBrukerVedBrukernavn, hentBrukereForTenant, leggTilBruker, slettBruker } from '../store.js'
import type { Bruker, BrukerUtenPassord, Rolle } from '../types.js'

export const brukereRuter = Router()

const GYLDIGE_ROLLER: Rolle[] = ['avdelingsleder', 'laerer', 'rektor']

function erGyldigBrukernavn(verdi: unknown): verdi is string {
  return typeof verdi === 'string' && /^[a-zA-Z0-9._-]{3,50}$/.test(verdi)
}

function utenPassord(b: Bruker): BrukerUtenPassord {
  return { id: b.id, tenantId: b.tenantId, brukernavn: b.brukernavn, rolle: b.rolle, laererId: b.laererId, navn: b.navn }
}

brukereRuter.get('/', kreverRolle('avdelingsleder'), async (req, res) => {
  const brukere = await hentBrukereForTenant(req.bruker!.tenantId)
  res.json(brukere.map(utenPassord))
})

brukereRuter.post('/', kreverRolle('avdelingsleder'), async (req, res) => {
  const { brukernavn, passord, navn, rolle, laererId } = req.body ?? {}
  if (
    !erGyldigBrukernavn(brukernavn) ||
    typeof passord !== 'string' ||
    passord.length < 8 ||
    typeof navn !== 'string' ||
    navn.trim().length < 1 ||
    !GYLDIGE_ROLLER.includes(rolle)
  ) {
    res.status(400).json({
      feil: 'Ugyldige felt. Brukernavn 3-50 tegn, passord minst 8 tegn, navn og gyldig rolle må fylles ut.',
    })
    return
  }
  if (rolle === 'laerer' && typeof laererId !== 'string') {
    res.status(400).json({ feil: 'Lærer-konto må kobles til en lærer-record (laererId).' })
    return
  }
  const finnesFra = await finnBrukerVedBrukernavn(brukernavn)
  if (finnesFra) {
    res.status(409).json({ feil: 'Brukernavnet er allerede i bruk.' })
    return
  }
  const ny: Bruker = {
    id: randomUUID(),
    tenantId: req.bruker!.tenantId,
    brukernavn,
    passordHash: await hashPassord(passord),
    rolle,
    laererId: rolle === 'laerer' ? laererId : undefined,
    navn: navn.trim(),
    opprettet: new Date().toISOString(),
  }
  await leggTilBruker(ny)
  res.status(201).json(utenPassord(ny))
})

brukereRuter.delete('/:id', kreverRolle('avdelingsleder'), async (req, res) => {
  const slettet = await slettBruker(req.params.id, req.bruker!.tenantId)
  if (!slettet) {
    res.status(404).json({ feil: 'Fant ikke brukeren.' })
    return
  }
  res.json({ ok: true })
})
