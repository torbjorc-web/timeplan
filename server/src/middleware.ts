import type { NextFunction, Request, Response } from 'express'
import { verifiserToken } from './auth.js'
import { harGyldigLisens, hentTenantById } from './store.js'
import type { Rolle } from './types.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      bruker?: { brukerId: string; tenantId: string; rolle: Rolle }
    }
  }
}

export function autentiser(req: Request, res: Response, next: NextFunction): void {
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
  const tenant = await hentTenantById(req.bruker.tenantId)
  if (!tenant || !harGyldigLisens(tenant)) {
    res.status(402).json({ feil: 'Lisensen for avdelingen er utløpt eller sperret. Kontakt avdelingsleder for å fornye.' })
    return
  }
  next()
}
