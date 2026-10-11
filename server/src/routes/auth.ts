import { Router } from 'express'
import { asyncHandler } from '../asyncHandler.js'
import { randomUUID } from 'node:crypto'
import { erGyldigPassord, hashPassord, lagToken, sammenlignMotDummy, sammenlignPassord } from '../auth.js'
import { BrukernavnOpptattFeil } from '../feil.js'
import { autentiser } from '../middleware.js'
import { erBlokkert, nullstillForsok, registrerMislykketForsok, tillatHendelse } from '../rateLimiter.js'
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
const MAKS_REGISTRERINGER_PER_TIME = 5
const TIME_MS = 60 * 60 * 1000

const COOKIE_SLETTE_INNSTILLINGER = {
  httpOnly: COOKIE_INNSTILLINGER.httpOnly,
  sameSite: COOKIE_INNSTILLINGER.sameSite,
  secure: COOKIE_INNSTILLINGER.secure,
}

function erGyldigBrukernavn(verdi: unknown): verdi is string {
  return typeof verdi === 'string' && /^[a-zA-Z0-9._-]{3,50}$/.test(verdi)
}

authRuter.post('/registrer-avdeling', asyncHandler(async (req, res) => {
  const { avdelingNavn, brukernavn, passord, navn } = req.body ?? {}
  if (
    typeof avdelingNavn !== 'string' ||
    avdelingNavn.trim().length < 2 ||
    !erGyldigBrukernavn(brukernavn) ||
    !erGyldigPassord(passord) ||
    typeof navn !== 'string' ||
    navn.trim().length < 1
  ) {
    res.status(400).json({
      feil: 'Ugyldige felt. Avdelingsnavn og navn må fylles ut, brukernavn 3-50 tegn (bokstaver/tall/._-), passord 8-72 tegn.',
    })
    return
  }
  // Hver registrering koster en bcrypt-hash og oppretter en avdeling - begrens per IP.
  if (!tillatHendelse(`registrer:${req.ip}`, MAKS_REGISTRERINGER_PER_TIME, TIME_MS)) {
    res.status(429).json({ feil: 'For mange registreringer fra denne adressen. Prøv igjen senere.' })
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
  try {
    await leggTilBruker(bruker)
  } catch (err) {
    // To samtidige registreringer med samme brukernavn: den andre taper.
    if (err instanceof BrukernavnOpptattFeil) {
      res.status(409).json({ feil: 'Brukernavnet er allerede i bruk.' })
      return
    }
    throw err
  }
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
}))

authRuter.post('/login', asyncHandler(async (req, res) => {
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
  let gyldig = false
  if (bruker) {
    gyldig = await sammenlignPassord(passord, bruker.passordHash)
  } else {
    // Bruk like lang tid som ved et ekte brukernavn, så svartiden ikke avslører hvilke brukernavn som finnes.
    await sammenlignMotDummy(passord)
  }
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
}))

authRuter.post('/logout', (_req, res) => {
  res.clearCookie('token', COOKIE_SLETTE_INNSTILLINGER)
  res.json({ ok: true })
})

authRuter.get('/meg', autentiser, asyncHandler(async (req, res) => {
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
}))
