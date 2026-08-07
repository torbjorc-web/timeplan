import type { PanelProps } from './PanelProps'
import { DAGER } from '../types'
import { lastNedCsv, timeplanCsvRader } from '../utils/csvExport'

export function TimeplanVisning({ data }: PanelProps) {
  const oekter = Array.from({ length: data.antallOekterPerDag }, (_, i) => i + 1)

  function eksporterCsv() {
    lastNedCsv(`timeplan-${data.skoleaar}.csv`, timeplanCsvRader(data))
  }

  function navnFag(id: string) {
    return data.fag.find((f) => f.id === id)?.navn ?? '?'
  }
  function navnKlasse(id: string) {
    return data.klasser.find((k) => k.id === id)?.navn ?? '?'
  }
  function navnLaerer(id: string) {
    return data.laerere.find((l) => l.id === id)?.navn ?? '?'
  }
  function navnRom(id: string | undefined) {
    return id ? data.rom.find((r) => r.id === id)?.navn ?? '?' : ''
  }

  return (
    <div className="panel">
      <div className="mellom-topp">
        <h2>Timeplan</h2>
        <button onClick={eksporterCsv}>Last ned CSV</button>
      </div>
      <table className="tabell timeplan-tabell">
        <thead>
          <tr>
            <th></th>
            {DAGER.map((d) => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {oekter.map((o) => (
            <tr key={o}>
              <td className="oekt-nr">Time {o}</td>
              {DAGER.map((d) => {
                const oppforinger = data.timeplan.filter((x) => x.dag === d && x.oekt === o)
                return (
                  <td key={d} className="timeplan-celle">
                    {oppforinger.map((x) => (
                      <div key={x.id} className="time-tag">
                        <div>
                          <strong>{navnFag(x.fagId)}</strong>
                        </div>
                        <div>{navnKlasse(x.klasseId)}</div>
                        <div>{navnLaerer(x.laererId)}</div>
                        {x.romId && <div>{navnRom(x.romId)}</div>}
                      </div>
                    ))}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
