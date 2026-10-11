import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Rolle } from './types.js'

const JWT_HEMMELIGHET = process.env.JWT_SECRET
if (!JWT_HEMMELIGHET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET må settes som miljøvariabel i produksjon.')
}
// Kun til lokal utvikling - sett alltid JWT_SECRET i produksjon.
const HEMMELIGHET = JWT_HEMMELIGHET ?? 'utvikling-hemmelig-ikke-bruk-i-produksjon'

export interface TokenPayload {
  brukerId: string
  tenantId: string
  rolle: Rolle
}

export async function hashPassord(passord: string): Promise<string> {
  return bcrypt.hash(passord, 12)
}

export async function sammenlignPassord(passord: string, hash: string): Promise<boolean> {
  return bcrypt.compare(passord, hash)
}

export function lagToken(payload: TokenPayload): string {
  return jwt.sign(payload, HEMMELIGHET, { expiresIn: '12h' })
}

const GYLDIGE_ROLLER: readonly string[] = ['avdelingsleder', 'laerer', 'rektor', 'superadmin']

export function verifiserToken(token: string): TokenPayload | null {
  try {
    // Pin algoritmen så ingen annen algoritme (f.eks. "none") aksepteres.
    const payload = jwt.verify(token, HEMMELIGHET, { algorithms: ['HS256'] })
    if (typeof payload !== 'object' || payload === null) return null
    const { brukerId, tenantId, rolle } = payload as Record<string, unknown>
    if (typeof brukerId !== 'string' || typeof tenantId !== 'string') return null
    if (typeof rolle !== 'string' || !GYLDIGE_ROLLER.includes(rolle)) return null
    return { brukerId, tenantId, rolle: rolle as Rolle }
  } catch {
    return null
  }
}

/** bcrypt ser bare på de første 72 bytene - lengre passord kuttes stille, så vi avviser dem. */
export const PASSORD_MIN_TEGN = 8
export const PASSORD_MAKS_BYTES = 72

export function erGyldigPassord(verdi: unknown): verdi is string {
  return (
    typeof verdi === 'string' && verdi.length >= PASSORD_MIN_TEGN && Buffer.byteLength(verdi, 'utf8') <= PASSORD_MAKS_BYTES
  )
}

let dummyHash: Promise<string> | undefined

/** Brukes når brukernavnet ikke finnes, så svartiden ikke avslører om kontoen eksisterer. */
export async function sammenlignMotDummy(passord: string): Promise<void> {
  dummyHash ??= bcrypt.hash('dummy-passord-for-jevn-svartid', 12)
  await bcrypt.compare(passord, await dummyHash)
}
