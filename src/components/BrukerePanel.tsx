import { useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPost, ApiFeil } from '../api'
import type { PanelProps } from './PanelProps'
import type { Rolle } from '../types'
import { TRINN_LABELS } from '../types'

interface BrukerVisning {
  id: string
  brukernavn: string
  navn: string
  rolle: Rolle
  laererId?: string
}

const ROLLE_LABELS: Record<Rolle, string> = {
  avdelingsleder: 'Avdelingsleder',
  laerer: 'Lærer (kun lese egen plan)',
  rektor: 'Rektor (kun lese alt)',
  superadmin: 'Superadmin',
}

/** Avdelingsleder kan kun opprette disse rollene selv - superadmin opprettes via eget script. */
const OPPRETTBARE_ROLLER: Rolle[] = ['laerer', 'rektor', 'avdelingsleder']

export function BrukerePanel({ data }: PanelProps) {
  const [brukere, setBrukere] = useState<BrukerVisning[]>([])
  const [navn, setNavn] = useState('')
  const [brukernavn, setBrukernavn] = useState('')
  const [passord, setPassord] = useState('')
  const [rolle, setRolle] = useState<Rolle>('laerer')
  const [laererId, setLaererId] = useState('')
  const [feilmelding, setFeilmelding] = useState<string | null>(null)

  function lastBrukere() {
    apiGet<BrukerVisning[]>('/brukere').then(setBrukere).catch(() => setBrukere([]))
  }

  useEffect(lastBrukere, [])

  async function opprettBruker(e: React.FormEvent) {
    e.preventDefault()
    setFeilmelding(null)
    try {
      await apiPost('/brukere', {
        navn,
        brukernavn,
        passord,
        rolle,
        laererId: rolle === 'laerer' ? laererId : undefined,
      })
      setNavn('')
      setBrukernavn('')
      setPassord('')
      setLaererId('')
      lastBrukere()
    } catch (err) {
      setFeilmelding(err instanceof ApiFeil ? err.message : 'Kunne ikke opprette bruker.')
    }
  }

  async function slett(id: string) {
    await apiDelete(`/brukere/${id}`)
    lastBrukere()
  }

  return (
    <div className="panel">
      <h2>Brukere</h2>
      <p className="hjelpetekst">
        Opprett innlogging for lærere (leser kun sin egen årsplan/timeplan) og rektor (leser alt, kan ikke
        redigere).
      </p>
      <table className="tabell">
        <thead>
          <tr>
            <th>Navn</th>
            <th>Brukernavn</th>
            <th>Rolle</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {brukere.map((b) => (
            <tr key={b.id}>
              <td>{b.navn}</td>
              <td>{b.brukernavn}</td>
              <td>{ROLLE_LABELS[b.rolle]}</td>
              <td>
                {b.rolle !== 'avdelingsleder' && (
                  <button className="knapp-faresone" onClick={() => slett(b.id)}>
                    Slett
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Ny bruker</h3>
      <form onSubmit={opprettBruker} className="skjema-rad">
        <input placeholder="Navn" value={navn} onChange={(e) => setNavn(e.target.value)} required />
        <input placeholder="Brukernavn" value={brukernavn} onChange={(e) => setBrukernavn(e.target.value)} required />
        <input
          type="password"
          placeholder="Passord (min. 8 tegn)"
          value={passord}
          onChange={(e) => setPassord(e.target.value)}
          minLength={8}
          required
        />
        <select value={rolle} onChange={(e) => setRolle(e.target.value as Rolle)}>
          {OPPRETTBARE_ROLLER.map((r) => (
            <option key={r} value={r}>
              {ROLLE_LABELS[r]}
            </option>
          ))}
        </select>
        {rolle === 'laerer' && (
          <select value={laererId} onChange={(e) => setLaererId(e.target.value)} required>
            <option value="">Velg lærer-record</option>
            {data.laerere.map((l) => (
              <option key={l.id} value={l.id}>
                {l.navn} ({TRINN_LABELS[l.trinn]})
              </option>
            ))}
          </select>
        )}
        <button type="submit">+ Opprett bruker</button>
      </form>
      {feilmelding && <p className="advarsel">⚠ {feilmelding}</p>}
    </div>
  )
}
