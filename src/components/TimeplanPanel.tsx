import { useState } from 'react'
import type { PanelProps } from './PanelProps'
import { uuid } from '../defaults'
import type { Dag } from '../types'
import { DAGER } from '../types'
import { finnKonflikter, type Konflikt } from '../utils/calculations'
import { lastNedCsv, timeplanCsvRader } from '../utils/csvExport'

export function TimeplanPanel({ data, setData }: PanelProps) {
  const [dag, setDag] = useState<Dag>('Mandag')
  const [oekt, setOekt] = useState(1)
  const [fagId, setFagId] = useState('')
  const [klasseId, setKlasseId] = useState('')
  const [laererId, setLaererId] = useState('')
  const [romId, setRomId] = useState('')
  const [ventendeKonflikter, setVentendeKonflikter] = useState<Konflikt[] | null>(null)

  const oekter = Array.from({ length: data.antallOekterPerDag }, (_, i) => i + 1)

  function romKanIkkeDeles(id: string | undefined) {
    if (!id) return false
    return data.rom.find((r) => r.id === id)?.kanIkkeDeles ?? false
  }

  function leggTil(tvingGjennom: boolean) {
    if (!fagId || !klasseId || !laererId) return
    const nyOppforing = { id: uuid(), dag, oekt, fagId, klasseId, laererId, romId: romId || undefined }
    const konflikter = finnKonflikter(nyOppforing, data.timeplan, romKanIkkeDeles)
    if (konflikter.length > 0 && !tvingGjennom) {
      setVentendeKonflikter(konflikter)
      return
    }
    setData((d) => ({ ...d, timeplan: [...d.timeplan, nyOppforing] }))
    setVentendeKonflikter(null)
    setFagId('')
    setKlasseId('')
    setLaererId('')
    setRomId('')
  }

  function slettOppforing(id: string) {
    setData((d) => ({ ...d, timeplan: d.timeplan.filter((o) => o.id !== id) }))
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
        <h2>Timeplan (ukeplan)</h2>
        <button onClick={() => lastNedCsv(`timeplan-${data.skoleaar}.csv`, timeplanCsvRader(data))}>Last ned CSV</button>
      </div>
      <p className="hjelpetekst">
        Legg til undervisningsøkter i rutenettet under. Appen varsler dersom lærer, klasse eller et spesialrom
        (rom merket «kan ikke deles») allerede er booket i samme time.
      </p>

      <div className="skjema-rad">
        <select value={dag} onChange={(e) => setDag(e.target.value as Dag)}>
          {DAGER.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select value={oekt} onChange={(e) => setOekt(Number(e.target.value))}>
          {oekter.map((o) => (
            <option key={o} value={o}>
              Time {o}
            </option>
          ))}
        </select>
        <select value={fagId} onChange={(e) => setFagId(e.target.value)}>
          <option value="">Velg fag</option>
          {data.fag.map((f) => (
            <option key={f.id} value={f.id}>
              {f.navn}
            </option>
          ))}
        </select>
        <select value={klasseId} onChange={(e) => setKlasseId(e.target.value)}>
          <option value="">Velg klasse</option>
          {data.klasser.map((k) => (
            <option key={k.id} value={k.id}>
              {k.navn}
            </option>
          ))}
        </select>
        <select value={laererId} onChange={(e) => setLaererId(e.target.value)}>
          <option value="">Velg lærer</option>
          {data.laerere.map((l) => (
            <option key={l.id} value={l.id}>
              {l.navn}
            </option>
          ))}
        </select>
        <select value={romId} onChange={(e) => setRomId(e.target.value)}>
          <option value="">Velg rom (valgfritt)</option>
          {data.rom.map((r) => (
            <option key={r.id} value={r.id}>
              {r.navn}
              {r.kanIkkeDeles ? ' (spesialrom)' : ''}
            </option>
          ))}
        </select>
        <button onClick={() => leggTil(false)}>+ Legg til time</button>
      </div>

      {ventendeKonflikter && (
        <div className="konfliktboks">
          <p>⚠ Konflikt oppdaget:</p>
          <ul>
            {ventendeKonflikter.map((k, i) => (
              <li key={i}>{k.melding}</li>
            ))}
          </ul>
          <div className="knapperad">
            <button onClick={() => leggTil(true)}>Legg til likevel</button>
            <button onClick={() => setVentendeKonflikter(null)}>Avbryt</button>
          </div>
        </div>
      )}

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
                        <button className="knapp-liten knapp-faresone" onClick={() => slettOppforing(x.id)}>
                          Slett
                        </button>
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
