import type { NextFunction, Request, Response } from 'express'
import { verifiserToken } from './auth.js'
import { finnBrukerVedId, harGyldigLisens, hentTenantById } from './store.js'
import { demoTenantId } from './seedDemo.js'
import type { Rolle } from './types.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      bruker?: { brukerId: string; tenantId: string; rolle: Rolle }
    }
  }
}

export async function autentiser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.token as string | undefined
  if (!token) {
    res.status(401).json({ feil: 'Ikke innlogget.' })
    return
  }
  const payload = verifiserToken(token)
  if (!payload) {
    res.status(401).json({ feil: 'Ugyldig eller utløpt økt. Logg inn på nytt.' })
    return
  }
  try {
    // Token alene er ikke nok: slettede brukere (eller endret rolle/avdeling) skal miste tilgang med en gang,
    // ikke først når tokenet utløper etter 12 timer.
    const bruker = await finnBrukerVedId(payload.brukerId)
    if (!bruker || bruker.rolle !== payload.rolle || bruker.tenantId !== payload.tenantId) {
      res.status(401).json({ feil: 'Ugyldig eller utløpt økt. Logg inn på nytt.' })
      return
    }
  } catch (err) {
    next(err)
    return
  }
  req.bruker = payload
  next()
}

export function kreverRolle(...roller: Rolle[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.bruker || !roller.includes(req.bruker.rolle)) {
      res.status(403).json({ feil: 'Du har ikke tilgang til denne handlingen.' })
      return
    }
    next()
  }
}

const SKRIVE_METODER = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** Demo-passordet ligger i klartekst i repoet (offentlig), så demo-avdelingen skrivebeskyttes server-side mot ødeleggelse. */
export function blokkerDemoSkriving(req: Request, res: Response, next: NextFunction): void {
  if (SKRIVE_METODER.has(req.method) && req.bruker?.tenantId === demoTenantId) {
    res.status(403).json({ feil: 'Demo-avdelingen er skrivebeskyttet - endringer lagres ikke.' })
    return
  }
  next()
}

/** Blokkerer tenant-scopede ruter når prøveperioden er utløpt eller avdelingen er sperret. Superadmin er unntatt (har ingen tenant). */
export async function kreverAktivLisens(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.bruker) {
    res.status(401).json({ feil: 'Ikke innlogget.' })
    return
  }
  if (req.bruker.rolle === 'superadmin') {
    next()
    return
  }
  try {
    const tenant = await hentTenantById(req.bruker.tenantId)
    if (!tenant || !harGyldigLisens(tenant)) {
      res.status(402).json({ feil: 'Lisensen for avdelingen er utløpt eller sperret. Kontakt avdelingsleder for å fornye.' })
      return
    }
  } catch (err) {
    next(err)
    return
  }
  next()
}
