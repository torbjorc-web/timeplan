import { useState } from 'react'
import type { PanelProps } from './PanelProps'
import { uuid } from '../defaults'
import type { Dag } from '../types'
import { DAGER } from '../types'
import { finnKonflikter, type Konflikt } from '../utils/calculations'
import { lastNedCsv, timeplanCsvRader } from '../utils/csvExport'
import { useI18n } from '../i18n/I18nContext'

export function TimeplanPanel({ data, setData }: PanelProps) {
  const { t } = useI18n()
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
        <h2>{t.timeplan.heading}</h2>
        <button onClick={() => lastNedCsv(`timeplan-${data.skoleaar}.csv`, timeplanCsvRader(data))}>
          {t.timeplan.lastNedCsv}
        </button>
      </div>
      <p className="hjelpetekst">{t.timeplan.hjelpetekst}</p>

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
              {t.timeplan.time(o)}
            </option>
          ))}
        </select>
        <select value={fagId} onChange={(e) => setFagId(e.target.value)}>
          <option value="">{t.timeplan.velgFag}</option>
          {data.fag.map((f) => (
            <option key={f.id} value={f.id}>
              {f.navn}
            </option>
          ))}
        </select>
        <select value={klasseId} onChange={(e) => setKlasseId(e.target.value)}>
          <option value="">{t.timeplan.velgKlasse}</option>
          {data.klasser.map((k) => (
            <option key={k.id} value={k.id}>
              {k.navn}
            </option>
          ))}
        </select>
        <select value={laererId} onChange={(e) => setLaererId(e.target.value)}>
          <option value="">{t.timeplan.velgLaerer}</option>
          {data.laerere.map((l) => (
            <option key={l.id} value={l.id}>
              {l.navn}
            </option>
          ))}
        </select>
        <select value={romId} onChange={(e) => setRomId(e.target.value)}>
          <option value="">{t.timeplan.velgRomValgfritt}</option>
          {data.rom.map((r) => (
            <option key={r.id} value={r.id}>
              {r.navn}
              {r.kanIkkeDeles ? t.timeplan.spesialromSuffiks : ''}
            </option>
          ))}
        </select>
        <button onClick={() => leggTil(false)}>{t.timeplan.leggTilTime}</button>
      </div>

      {ventendeKonflikter && (
        <div className="konfliktboks">
          <p>{t.timeplan.konfliktOppdaget}</p>
          <ul>
            {ventendeKonflikter.map((k, i) => (
              <li key={i}>{k.melding}</li>
            ))}
          </ul>
          <div className="knapperad">
            <button onClick={() => leggTil(true)}>{t.timeplan.leggTilLikevel}</button>
            <button onClick={() => setVentendeKonflikter(null)}>{t.timeplan.avbryt}</button>
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
              <td className="oekt-nr">{t.timeplan.time(o)}</td>
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
                          {t.timeplan.slett}
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
