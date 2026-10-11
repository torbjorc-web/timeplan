import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { erBlokkert, nullstillRateLimiter, registrerMislykketForsok, tillatHendelse } from './rateLimiter.js'

beforeEach(() => {
  nullstillRateLimiter()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('tillatHendelse', () => {
  it('tillater opp til maks og avviser deretter', () => {
    const resultater = Array.from({ length: 5 }, () => tillatHendelse('ip-1', 3, 60_000))
    expect(resultater).toEqual([true, true, true, false, false])
  })

  it('teller per nøkkel', () => {
    for (let i = 0; i < 3; i++) tillatHendelse('ip-1', 3, 60_000)
    expect(tillatHendelse('ip-1', 3, 60_000)).toBe(false)
    expect(tillatHendelse('ip-2', 3, 60_000)).toBe(true)
  })

  it('starter et nytt vindu når tiden har gått', () => {
    for (let i = 0; i < 3; i++) tillatHendelse('ip-1', 3, 60_000)
    expect(tillatHendelse('ip-1', 3, 60_000)).toBe(false)
    vi.advanceTimersByTime(60_001)
    expect(tillatHendelse('ip-1', 3, 60_000)).toBe(true)
  })
})

describe('innloggingsforsøk', () => {
  it('blokkerer etter 5 mislykkede forsøk og slipper opp igjen etter blokkeringstiden', () => {
    for (let i = 0; i < 5; i++) registrerMislykketForsok('bruker:ip')
    expect(erBlokkert('bruker:ip')).toBe(true)
    vi.advanceTimersByTime(5 * 60 * 1000 + 1)
    expect(erBlokkert('bruker:ip')).toBe(false)
  })
})
