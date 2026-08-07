import type { PanelProps } from './PanelProps'
import { uuid } from '../defaults'
import type { Fag, FagType } from '../types'
import { useI18n } from '../i18n/useI18n'

const FAGTYPER: FagType[] = ['teoretisk', 'praktisk-estetisk', 'kroppsoving', 'valgfag', 'annet']

export function FagPanel({ data, setData }: PanelProps) {
  const { t } = useI18n()

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
      <h2>{t.fag.heading}</h2>
      <p className="hjelpetekst">{t.fag.hjelpetekst}</p>
      <table className="tabell">
        <thead>
          <tr>
            <th>{t.fag.kolonner.navn}</th>
            <th>{t.fag.kolonner.type}</th>
            <th>{t.fag.kolonner.timerUke}</th>
            <th>{t.fag.kolonner.delingstall}</th>
            <th>{t.fag.kolonner.delesMed}</th>
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
                  {FAGTYPER.map((type) => (
                    <option key={type} value={type}>
                      {t.fagtype[type]}
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
                  <option value="">{t.common.dash}</option>
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
                  {t.fag.slett}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={leggTilFag}>{t.fag.leggTil}</button>
    </div>
  )
}
