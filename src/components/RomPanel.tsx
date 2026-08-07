import type { PanelProps } from './PanelProps'
import { uuid } from '../defaults'
import type { Rom } from '../types'

export function RomPanel({ data, setData }: PanelProps) {
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
      <h2>Rom</h2>
      <p className="hjelpetekst">
        Kryss av «kan ikke deles» for spesialrom (sløyd, kjøkken, musikkrom, gymsal o.l.) som bare kan brukes av
        én gruppe om gangen. Timeplanen varsler da automatisk ved dobbeltbooking av rommet.
      </p>
      <table className="tabell">
        <thead>
          <tr>
            <th>Navn</th>
            <th>Kan ikke deles</th>
            <th>Merknad</th>
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
                  Slett
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={leggTilRom}>+ Legg til rom</button>
    </div>
  )
}
