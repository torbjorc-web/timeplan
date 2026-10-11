import { describe, expect, it } from 'vitest'
import { escapeCelle } from './csvExport'

describe('escapeCelle', () => {
  it('lar vanlig tekst være uendret', () => {
    expect(escapeCelle('Matematikk')).toBe('Matematikk')
  })

  it('bruker komma som desimaltegn for tall og rører ikke negative tall', () => {
    expect(escapeCelle(1.5)).toBe('1,5')
    expect(escapeCelle(-2)).toBe('-2')
  })

  it('siterer tekst med semikolon, anførselstegn og linjeskift', () => {
    expect(escapeCelle('a;b')).toBe('"a;b"')
    expect(escapeCelle('si "hei"')).toBe('"si ""hei"""')
    expect(escapeCelle('linje1\nlinje2')).toBe('"linje1\nlinje2"')
  })

  it.each(['=SUM(A1:A9)', '+1+1', '-1+1', '@SUM(A1)', '\tx', '\rx'])('nøytraliserer formeltegn i starten: %j', (verdi) => {
    expect(escapeCelle(verdi).replace(/^"/, '').startsWith("'")).toBe(true)
  })
})
