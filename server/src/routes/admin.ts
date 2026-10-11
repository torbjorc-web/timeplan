import { Router } from 'express'
import { asyncHandler } from '../asyncHandler.js'
import { autentiser, kreverRolle } from '../middleware.js'
import {
  hentBrukere,
  hentInnloggingslogg,
  hentTenants,
  hentTilbakemeldinger,
  oppdaterTenant,
} from '../store.js'

export const adminRuter = Router()

adminRuter.use(autentiser, kreverRolle('superadmin'))

adminRuter.get('/tenants', asyncHandler(async (_req, res) => {
  const [tenants, brukere] = await Promise.all([hentTenants(), hentBrukere()])
  const resultat = tenants.map((t) => ({
    ...t,
    antallBrukere: brukere.filter((b) => b.tenantId === t.id).length,
  }))
  res.json(resultat)
}))

adminRuter.post('/tenants/:id/frigi', asyncHandler(async (req, res) => {
  const tenant = await oppdaterTenant(req.params.id, { lisensstatus: 'aktiv' })
  if (!tenant) {
    res.status(404).json({ feil: 'Fant ikke avdelingen.' })
    return
  }
  res.json(tenant)
}))

adminRuter.post('/tenants/:id/sperr', asyncHandler(async (req, res) => {
  const tenant = await oppdaterTenant(req.params.id, { lisensstatus: 'sperret' })
  if (!tenant) {
    res.status(404).json({ feil: 'Fant ikke avdelingen.' })
    return
  }
  res.json(tenant)
}))

adminRuter.get('/innlogginger', asyncHandler(async (_req, res) => {
  const [logg, tenants] = await Promise.all([hentInnloggingslogg(), hentTenants()])
  const resultat = logg.slice(0, 300).map((oppforing) => ({
    ...oppforing,
    tenantNavn: tenants.find((t) => t.id === oppforing.tenantId)?.navn ?? '(ukjent avdeling)',
  }))
  res.json(resultat)
}))

adminRuter.get('/tilbakemeldinger', asyncHandler(async (_req, res) => {
  const [tilbakemeldinger, tenants] = await Promise.all([hentTilbakemeldinger(), hentTenants()])
  const resultat = tilbakemeldinger.map((t) => ({
    ...t,
    tenantNavn: tenants.find((tenant) => tenant.id === t.tenantId)?.navn ?? '(ukjent avdeling)',
  }))
  res.json(resultat)
}))
