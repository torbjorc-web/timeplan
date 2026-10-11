import type { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Express 4 fanger ikke avviste promises fra async-handlere - uten denne ville en feil
 * (f.eks. korrupt JSON-fil eller Stripe-feil) blitt en unhandled rejection som kan krasje
 * hele Node-prosessen. Pakker en async-handler slik at feilen sendes videre til feilhåndtereren.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

/** Siste middleware i kjeden: logger feilen og svarer med en generisk JSON-feil (ingen interne detaljer til klienten). */
export function feilHaandterer(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err)
    return
  }
  const status = (err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode
  if (typeof status === 'number' && status >= 400 && status < 500) {
    // F.eks. ugyldig JSON i request-body eller for stor body - klientfeil, ikke serverfeil.
    res.status(status).json({ feil: 'Ugyldig forespørsel.' })
    return
  }
  console.error('Uventet serverfeil:', err)
  res.status(500).json({ feil: 'Noe gikk galt på serveren. Prøv igjen senere.' })
}
