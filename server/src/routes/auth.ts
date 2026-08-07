import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { hashPassord, lagToken, sammenlignPassord } from '../auth.js'
import { autentiser } from '../middleware.js'
import { erBlokkert, nullstillForsok, registrerMislykketForsok } from '../rateLimiter.js'
import {
  finnBrukerVedBrukernavn,
  hentBrukere,
  hentTenantById,
  leggTilBruker,
  loggInnlogging,
  opprettTenant,
} from '../store.js'
import type { Bruker } from '../types.js'

export const authRuter = Router()

// I produksjon kan frontend ligge på en annen origin enn API-et (f.eks. Netlify + Render),
// da må cookien være SameSite=None (krever secure: true). Lokalt er de samme site (localhost), så 'strict' holder.
const COOKIE_INNSTILLINGER = {
  httpOnly: true,
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'strict') as 'none' | 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 12 * 60 * 60 * 1000,
}

function erGyldigBrukernavn(verdi: unknown): verdi is string {
  return typeof verdi === 'string' && /^[a-zA-Z0-9._-]{3,50}$/.test(verdi)
}

authRuter.post('/registrer-avdeling', async (req, res) => {
  const { avdelingNavn, brukernavn, passord, navn } = req.body ?? {}
  if (
    typeof avdelingNavn !== 'string' ||
    avdelingNavn.trim().length < 2 ||
    !erGyldigBrukernavn(brukernavn) ||
    typeof passord !== 'string' ||
    passord.length < 8 ||
    typeof navn !== 'string' ||
    navn.trim().length < 1
  ) {
    res.status(400).json({
      feil: 'Ugyldige felt. Avdelingsnavn og navn må fylles ut, brukernavn 3-50 tegn (bokstaver/tall/._-), passord minst 8 tegn.',
    })
    return
  }
  const finnesFra = await finnBrukerVedBrukernavn(brukernavn)
  if (finnesFra) {
    res.status(409).json({ feil: 'Brukernavnet er allerede i bruk.' })
    return
  }
  const tenant = await opprettTenant(avdelingNavn.trim())
  const bruker: Bruker = {
    id: randomUUID(),
    tenantId: tenant.id,
    brukernavn,
    passordHash: await hashPassord(passord),
    rolle: 'avdelingsleder',
    navn: navn.trim(),
    opprettet: new Date().toISOString(),
  }
  await leggTilBruker(bruker)
  const token = lagToken({ brukerId: bruker.id, tenantId: tenant.id, rolle: 'avdelingsleder' })
  res.cookie('token', token, COOKIE_INNSTILLINGER)
  await loggInnlogging({
    brukerId: bruker.id,
    brukernavn: bruker.brukernavn,
    navn: bruker.navn,
    rolle: bruker.rolle,
    tenantId: tenant.id,
    tidspunkt: new Date().toISOString(),
    ip: req.ip ?? 'ukjent',
  })
  res.status(201).json({
    navn: bruker.navn,
    rolle: bruker.rolle,
    tenantNavn: tenant.navn,
    lisensstatus: tenant.lisensstatus,
    proveperiodeSlutt: tenant.proveperiodeSlutt,
  })
})

authRuter.post('/login', async (req, res) => {
  const { brukernavn, passord } = req.body ?? {}
  if (typeof brukernavn !== 'string' || typeof passord !== 'string') {
    res.status(400).json({ feil: 'Brukernavn og passord må fylles ut.' })
    return
  }
  const nokkel = `${brukernavn.toLowerCase()}:${req.ip}`
  if (erBlokkert(nokkel)) {
    res.status(429).json({ feil: 'For mange mislykkede forsøk. Prøv igjen senere.' })
    return
  }
  const bruker = await finnBrukerVedBrukernavn(brukernavn)
  const gyldig = bruker ? await sammenlignPassord(passord, bruker.passordHash) : false
  if (!bruker || !gyldig) {
    registrerMislykketForsok(nokkel)
    res.status(401).json({ feil: 'Feil brukernavn eller passord.' })
    return
  }
  nullstillForsok(nokkel)
  const token = lagToken({ brukerId: bruker.id, tenantId: bruker.tenantId, rolle: bruker.rolle })
  res.cookie('token', token, COOKIE_INNSTILLINGER)
  await loggInnlogging({
    brukerId: bruker.id,
    brukernavn: bruker.brukernavn,
    navn: bruker.navn,
    rolle: bruker.rolle,
    tenantId: bruker.tenantId,
    tidspunkt: new Date().toISOString(),
    ip: req.ip ?? 'ukjent',
  })
  const tenant = bruker.tenantId ? await hentTenantById(bruker.tenantId) : undefined
  res.json({
    navn: bruker.navn,
    rolle: bruker.rolle,
    laererId: bruker.laererId,
    lisensstatus: tenant?.lisensstatus,
    proveperiodeSlutt: tenant?.proveperiodeSlutt,
  })
})

authRuter.post('/logout', (_req, res) => {
  res.clearCookie('token', COOKIE_INNSTILLINGER)
  res.json({ ok: true })
})

authRuter.get('/meg', autentiser, async (req, res) => {
  if (!req.bruker) {
    res.status(401).json({ feil: 'Ikke innlogget.' })
    return
  }
  const brukere = await hentBrukere()
  const bruker = brukere.find((b) => b.id === req.bruker?.brukerId)
  if (!bruker) {
    res.status(401).json({ feil: 'Bruker finnes ikke lenger.' })
    return
  }
  const tenant = bruker.tenantId ? await hentTenantById(bruker.tenantId) : undefined
  res.json({
    navn: bruker.navn,
    rolle: bruker.rolle,
    laererId: bruker.laererId,
    lisensstatus: tenant?.lisensstatus,
    proveperiodeSlutt: tenant?.proveperiodeSlutt,
  })
})
