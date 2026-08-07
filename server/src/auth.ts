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

export function verifiserToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, HEMMELIGHET) as TokenPayload
  } catch {
    return null
  }
}
