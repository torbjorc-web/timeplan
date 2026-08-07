import type { SkoleData } from '../types'

/** Genererer og laster ned en CSV-fil (semikolon-separert, komma som desimaltegn - Excel norsk locale). */
export function lastNedCsv(filnavn: string, rader: (string | number)[][]): void {
  function escapeCelle(verdi: string | number): string {
    const tekst = typeof verdi === 'number' ? verdi.toString().replace('.', ',') : verdi
    if (/[;"\n\r]/.test(tekst)) return `"${tekst.replace(/"/g, '""')}"`
    return tekst
  }
  const BOM = '\uFEFF' // sikrer riktig visning av æøå i Excel
  const innhold = rader.map((rad) => rad.map(escapeCelle).join(';')).join('\r\n')
  const blob = new Blob([BOM + innhold], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filnavn
  a.click()
  URL.revokeObjectURL(url)
}

/** Lager CSV-rader (med header) for timeplanen - brukes av både TimeplanPanel og TimeplanVisning. */
export function timeplanCsvRader(data: SkoleData): (string | number)[][] {
  const rader: (string | number)[][] = [['Dag', 'Time', 'Fag', 'Klasse', 'Lærer', 'Rom']]
  const navnFag = (id: string) => data.fag.find((f) => f.id === id)?.navn ?? '?'
  const navnKlasse = (id: string) => data.klasser.find((k) => k.id === id)?.navn ?? '?'
  const navnLaerer = (id: string) => data.laerere.find((l) => l.id === id)?.navn ?? '?'
  const navnRom = (id: string | undefined) => (id ? data.rom.find((r) => r.id === id)?.navn ?? '?' : '')
  for (const o of data.timeplan) {
    rader.push([o.dag, o.oekt, navnFag(o.fagId), navnKlasse(o.klasseId), navnLaerer(o.laererId), navnRom(o.romId)])
  }
  return rader
}

