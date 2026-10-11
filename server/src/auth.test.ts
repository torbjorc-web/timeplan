import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'
import { erGyldigPassord, lagToken, verifiserToken } from './auth.js'

describe('erGyldigPassord', () => {
  it('krever minst 8 tegn', () => {
    expect(erGyldigPassord('1234567')).toBe(false)
    expect(erGyldigPassord('12345678')).toBe(true)
  })

  it('avviser passord over 72 bytes (telt i bytes, ikke tegn)', () => {
    expect(erGyldigPassord('a'.repeat(72))).toBe(true)
    expect(erGyldigPassord('a'.repeat(73))).toBe(false)
    expect(erGyldigPassord('æ'.repeat(37))).toBe(false) // 37 tegn = 74 bytes
  })

  it('avviser ikke-strenger', () => {
    expect(erGyldigPassord(undefined)).toBe(false)
    expect(erGyldigPassord(12345678)).toBe(false)
  })
})

describe('verifiserToken', () => {
  it('godtar et token laget av lagToken', () => {
    const token = lagToken({ brukerId: 'b1', tenantId: 't1', rolle: 'laerer' })
    expect(verifiserToken(token)).toEqual({ brukerId: 'b1', tenantId: 't1', rolle: 'laerer' })
  })

  it('avviser et usignert token (alg: none)', () => {
    const ujustert = jwt.sign({ brukerId: 'b1', tenantId: 't1', rolle: 'superadmin' }, '', { algorithm: 'none' })
    expect(verifiserToken(ujustert)).toBeNull()
  })

  it('avviser et token med ukjent rolle eller manglende felt', () => {
    const hemmelighet = process.env.JWT_SECRET ?? 'utvikling-hemmelig-ikke-bruk-i-produksjon'
    const ukjentRolle = jwt.sign({ brukerId: 'b1', tenantId: 't1', rolle: 'gud' }, hemmelighet)
    const utenTenant = jwt.sign({ brukerId: 'b1', rolle: 'laerer' }, hemmelighet)
    expect(verifiserToken(ukjentRolle)).toBeNull()
    expect(verifiserToken(utenTenant)).toBeNull()
  })
})
