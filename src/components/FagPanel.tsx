import type { PanelProps } from './PanelProps'
import { uuid } from '../defaults'
import type { Fag, FagType } from '../types'
import { FAGTYPE_LABELS } from '../types'

const FAGTYPER: FagType[] = ['teoretisk', 'praktisk-estetisk', 'kroppsoving', 'valgfag', 'annet']

export function FagPanel({ data, setData }: PanelProps) {
  function oppdaterFag(id: string, endring: Partial<Fag>) {
    setData((d) => ({ ...d, fag: d.fag.map((f) => (f.id === id ? { ...f, ...endring } : f)) }))
  }

  function leggTilFag() {
    const standard = data.innstillinger.delingstallStandard.teoretisk
    const nyttFag: Fag = { id: uuid(), navn: 'Nytt fag', type: 'teoretisk', timerPerUke: 1, delingstall: standard }
    setData((d) => ({ ...d, fag: [...d.fag, nyttFag] }))
  }

  function slettFag(id: string) {
    setData((d) => ({
      ...d,
      fag: d.fag
        .filter((f) => f.id !== id)
        .map((f) => (f.kobletFagId === id ? { ...f, kobletFagId: undefined } : f)),
    }))
  }

  return (
    <div className="panel">
      <h2>Fag</h2>
      <p className="hjelpetekst">
        Delingstall er maks antall elever per gruppe. Praktisk-estetiske fag (musikk, mat og helse, kunst og
        håndverk) bør ha lavere delingstall enn teoretiske fag. Kroppsøving kan kobles sammen med valgfag slik at
        gruppestørrelsen beregnes ut fra elevtallet samlet, uten dobbelttelling av ressurs.
      </p>
      <table className="tabell">
        <thead>
          <tr>
            <th>Navn</th>
            <th>Type</th>
            <th>Timer/uke</th>
            <th>Delingstall</th>
            <th>Deles med</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.fag.map((f) => (
            <tr key={f.id}>
              <td>
                <input value={f.navn} onChange={(e) => oppdaterFag(f.id, { navn: e.target.value })} />
              </td>
              <td>
                <select value={f.type} onChange={(e) => oppdaterFag(f.id, { type: e.target.value as FagType })}>
                  {FAGTYPER.map((t) => (
                    <option key={t} value={t}>
                      {FAGTYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={f.timerPerUke}
                  onChange={(e) => oppdaterFag(f.id, { timerPerUke: Number(e.target.value) })}
                />
              </td>
              <td>
                <input
                  type="number"
                  min={1}
                  value={f.delingstall}
                  onChange={(e) => oppdaterFag(f.id, { delingstall: Number(e.target.value) })}
                />
              </td>
              <td>
                <select
                  value={f.kobletFagId ?? ''}
                  onChange={(e) => oppdaterFag(f.id, { kobletFagId: e.target.value || undefined })}
                >
                  <option value="">-</option>
                  {data.fag
                    .filter((other) => other.id !== f.id)
                    .map((other) => (
                      <option key={other.id} value={other.id}>
                        {other.navn}
                      </option>
                    ))}
                </select>
              </td>
              <td>
                <button className="knapp-faresone" onClick={() => slettFag(f.id)}>
                  Slett
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={leggTilFag}>+ Legg til fag</button>
    </div>
  )
}
