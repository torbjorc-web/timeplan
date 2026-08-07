import type { PanelProps } from './PanelProps'
import { uuid } from '../defaults'
import type { Klasse, Trinn } from '../types'
import { useI18n } from '../i18n/I18nContext'

const TRINN_LISTE: Trinn[] = ['barnetrinn', 'ungdomstrinn', 'videregaende']

export function KlassePanel({ data, setData }: PanelProps) {
  const { t } = useI18n()

  function oppdaterKlasse(id: string, endring: Partial<Klasse>) {
    setData((d) => ({ ...d, klasser: d.klasser.map((k) => (k.id === id ? { ...k, ...endring } : k)) }))
  }

  function leggTilKlasse() {
    const nyKlasse: Klasse = { id: uuid(), navn: 'Ny klasse', trinn: 'barnetrinn', elevtall: 20 }
    setData((d) => ({ ...d, klasser: [...d.klasser, nyKlasse] }))
  }

  function slettKlasse(id: string) {
    setData((d) => ({
      ...d,
      klasser: d.klasser.filter((k) => k.id !== id),
      timeplan: d.timeplan.filter((o) => o.klasseId !== id),
    }))
  }

  return (
    <div className="panel">
      <h2>{t.klasse.heading}</h2>
      <table className="tabell">
        <thead>
          <tr>
            <th>{t.klasse.kolonner.navn}</th>
            <th>{t.klasse.kolonner.trinn}</th>
            <th>{t.klasse.kolonner.elevtall}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.klasser.map((k) => (
            <tr key={k.id}>
              <td>
                <input value={k.navn} onChange={(e) => oppdaterKlasse(k.id, { navn: e.target.value })} />
              </td>
              <td>
                <select value={k.trinn} onChange={(e) => oppdaterKlasse(k.id, { trinn: e.target.value as Trinn })}>
                  {TRINN_LISTE.map((trinn) => (
                    <option key={trinn} value={trinn}>
                      {t.trinn[trinn]}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  value={k.elevtall}
                  onChange={(e) => oppdaterKlasse(k.id, { elevtall: Number(e.target.value) })}
                />
              </td>
              <td>
                <button className="knapp-faresone" onClick={() => slettKlasse(k.id)}>
                  {t.klasse.slett}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={leggTilKlasse}>{t.klasse.leggTil}</button>
    </div>
  )
}
