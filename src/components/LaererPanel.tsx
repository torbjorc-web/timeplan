import { useState } from 'react'
import type { PanelProps } from './PanelProps'
import { uuid } from '../defaults'
import type { Justering, JusteringType, Laerer, Trinn } from '../types'
import { JUSTERING_LABELS, TRINN_LABELS } from '../types'
import { foreslaSeniorReduksjon } from '../utils/calculations'

const TRINN_LISTE: Trinn[] = ['barnetrinn', 'ungdomstrinn', 'videregaende']
const JUSTERINGSTYPER: JusteringType[] = ['kontaktlaerer', 'tillitsvalgt', 'seniortiltak', 'annet']

export function LaererPanel({ data, setData }: PanelProps) {
  const [valgtId, setValgtId] = useState<string | null>(null)
  const valgtLaerer = data.laerere.find((l) => l.id === valgtId) ?? null

  function oppdaterLaerer(id: string, endring: Partial<Laerer>) {
    setData((d) => ({ ...d, laerere: d.laerere.map((l) => (l.id === id ? { ...l, ...endring } : l)) }))
  }

  function leggTilLaerer() {
    const ny: Laerer = {
      id: uuid(),
      navn: 'Ny lærer',
      trinn: 'barnetrinn',
      stillingsprosent: 100,
      justeringer: [],
    }
    setData((d) => ({ ...d, laerere: [...d.laerere, ny] }))
    setValgtId(ny.id)
  }

  function slettLaerer(id: string) {
    setData((d) => ({
      ...d,
      laerere: d.laerere.filter((l) => l.id !== id),
      timeplan: d.timeplan.filter((o) => o.laererId !== id),
    }))
    if (valgtId === id) setValgtId(null)
  }

  function leggTilJustering(laerer: Laerer, type: JusteringType, timerPerAar = 0) {
    const ny: Justering = { id: uuid(), type, timerPerAar, merknad: '' }
    oppdaterLaerer(laerer.id, { justeringer: [...laerer.justeringer, ny] })
  }

  function oppdaterJustering(laerer: Laerer, id: string, endring: Partial<Justering>) {
    oppdaterLaerer(laerer.id, {
      justeringer: laerer.justeringer.map((j) => (j.id === id ? { ...j, ...endring } : j)),
    })
  }

  function slettJustering(laerer: Laerer, id: string) {
    oppdaterLaerer(laerer.id, { justeringer: laerer.justeringer.filter((j) => j.id !== id) })
  }

  return (
    <div className="panel">
      <h2>Lærere</h2>
      <table className="tabell">
        <thead>
          <tr>
            <th>Navn</th>
            <th>Trinn</th>
            <th>Stilling %</th>
            <th>Fødselsår</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.laerere.map((l) => (
            <tr key={l.id} className={l.id === valgtId ? 'rad-valgt' : ''}>
              <td>
                <input value={l.navn} onChange={(e) => oppdaterLaerer(l.id, { navn: e.target.value })} />
              </td>
              <td>
                <select value={l.trinn} onChange={(e) => oppdaterLaerer(l.id, { trinn: e.target.value as Trinn })}>
                  {TRINN_LISTE.map((t) => (
                    <option key={t} value={t}>
                      {TRINN_LABELS[t]}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={l.stillingsprosent}
                  onChange={(e) => oppdaterLaerer(l.id, { stillingsprosent: Number(e.target.value) })}
                />
              </td>
              <td>
                <input
                  type="number"
                  placeholder="f.eks. 1975"
                  value={l.fodselsaar ?? ''}
                  onChange={(e) => oppdaterLaerer(l.id, { fodselsaar: e.target.value ? Number(e.target.value) : undefined })}
                />
              </td>
              <td className="knapperad">
                <button onClick={() => setValgtId(l.id === valgtId ? null : l.id)}>
                  {l.id === valgtId ? 'Lukk' : 'Justeringer'}
                </button>
                <button className="knapp-faresone" onClick={() => slettLaerer(l.id)}>
                  Slett
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={leggTilLaerer}>+ Legg til lærer</button>

      {valgtLaerer && (
        <div className="detaljboks">
          <h3>Justeringer for {valgtLaerer.navn}</h3>
          <p className="hjelpetekst">
            Legg til reduksjon i undervisningstid for kontaktlærer, tillitsvalgt, seniortiltak eller annen grunn.
            Timer trekkes fra beregnet undervisningstimetall i årsplanen.
          </p>
          <table className="tabell">
            <thead>
              <tr>
                <th>Type</th>
                <th>Timer/år</th>
                <th>Merknad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {valgtLaerer.justeringer.map((j) => (
                <tr key={j.id}>
                  <td>
                    <select
                      value={j.type}
                      onChange={(e) => oppdaterJustering(valgtLaerer, j.id, { type: e.target.value as JusteringType })}
                    >
                      {JUSTERINGSTYPER.map((t) => (
                        <option key={t} value={t}>
                          {JUSTERING_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={j.timerPerAar}
                      onChange={(e) => oppdaterJustering(valgtLaerer, j.id, { timerPerAar: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      value={j.merknad ?? ''}
                      onChange={(e) => oppdaterJustering(valgtLaerer, j.id, { merknad: e.target.value })}
                    />
                  </td>
                  <td>
                    <button className="knapp-faresone" onClick={() => slettJustering(valgtLaerer, j.id)}>
                      Slett
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="knapperad">
            <button onClick={() => leggTilJustering(valgtLaerer, 'kontaktlaerer')}>+ Kontaktlærer</button>
            <button onClick={() => leggTilJustering(valgtLaerer, 'tillitsvalgt')}>+ Tillitsvalgt</button>
            <button
              onClick={() => {
                const alder = valgtLaerer.fodselsaar
                  ? Number(data.skoleaar.slice(0, 4)) - valgtLaerer.fodselsaar
                  : undefined
                const forslag = foreslaSeniorReduksjon(alder, data.innstillinger.seniorRegler)
                leggTilJustering(valgtLaerer, 'seniortiltak', forslag)
              }}
            >
              + Seniortiltak (forslag ut fra fødselsår)
            </button>
            <button onClick={() => leggTilJustering(valgtLaerer, 'annet')}>+ Annet</button>
          </div>
        </div>
      )}
    </div>
  )
}
