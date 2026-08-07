import type { PanelProps } from './PanelProps'
import { uuid } from '../defaults'
import type { Rom } from '../types'
import { useI18n } from '../i18n/useI18n'

export function RomPanel({ data, setData }: PanelProps) {
  const { t } = useI18n()

  function oppdaterRom(id: string, endring: Partial<Rom>) {
    setData((d) => ({ ...d, rom: d.rom.map((r) => (r.id === id ? { ...r, ...endring } : r)) }))
  }

  function leggTilRom() {
    const nyttRom: Rom = { id: uuid(), navn: 'Nytt rom', kanIkkeDeles: false }
    setData((d) => ({ ...d, rom: [...d.rom, nyttRom] }))
  }

  function slettRom(id: string) {
    setData((d) => ({
      ...d,
      rom: d.rom.filter((r) => r.id !== id),
      timeplan: d.timeplan.map((o) => (o.romId === id ? { ...o, romId: undefined } : o)),
    }))
  }

  return (
    <div className="panel">
      <h2>{t.rom.heading}</h2>
      <p className="hjelpetekst">{t.rom.hjelpetekst}</p>
      <table className="tabell">
        <thead>
          <tr>
            <th>{t.rom.kolonner.navn}</th>
            <th>{t.rom.kolonner.kanIkkeDeles}</th>
            <th>{t.rom.kolonner.merknad}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.rom.map((r) => (
            <tr key={r.id}>
              <td>
                <input value={r.navn} onChange={(e) => oppdaterRom(r.id, { navn: e.target.value })} />
              </td>
              <td className="sentrert">
                <input
                  type="checkbox"
                  checked={r.kanIkkeDeles}
                  onChange={(e) => oppdaterRom(r.id, { kanIkkeDeles: e.target.checked })}
                />
              </td>
              <td>
                <input value={r.merknad ?? ''} onChange={(e) => oppdaterRom(r.id, { merknad: e.target.value })} />
              </td>
              <td>
                <button className="knapp-faresone" onClick={() => slettRom(r.id)}>
                  {t.rom.slett}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={leggTilRom}>{t.rom.leggTil}</button>
    </div>
  )
}
