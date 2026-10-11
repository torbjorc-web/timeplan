import { Router } from 'express'
import { asyncHandler } from '../asyncHandler.js'
import { autentiser, kreverRolle } from '../middleware.js'
import { hentBrukere, leggTilTilbakemelding } from '../store.js'

export const tilbakemeldingerRuter = Router()

tilbakemeldingerRuter.post('/', autentiser, kreverRolle('avdelingsleder'), asyncHandler(async (req, res) => {
  const { melding } = req.body ?? {}
  if (typeof melding !== 'string' || melding.trim().length < 3 || melding.length > 2000) {
    res.status(400).json({ feil: 'Meldingen må være mellom 3 og 2000 tegn.' })
    return
  }
  const brukere = await hentBrukere()
  const bruker = brukere.find((b) => b.id === req.bruker!.brukerId)
  const ny = await leggTilTilbakemelding({
    tenantId: req.bruker!.tenantId,
    brukerNavn: bruker?.navn ?? 'Ukjent',
    melding: melding.trim(),
  })
  res.status(201).json(ny)
}))
