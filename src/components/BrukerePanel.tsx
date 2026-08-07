import { useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPost, ApiFeil } from '../api'
import type { PanelProps } from './PanelProps'
import type { Rolle } from '../types'
import { useI18n } from '../i18n/useI18n'

interface BrukerVisning {
  id: string
  brukernavn: string
  navn: string
  rolle: Rolle
  laererId?: string
}

/** Avdelingsleder kan kun opprette disse rollene selv - superadmin opprettes via eget script. */
const OPPRETTBARE_ROLLER: Rolle[] = ['laerer', 'rektor', 'avdelingsleder']

export function BrukerePanel({ data }: PanelProps) {
  const { t } = useI18n()
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
      setFeilmelding(err instanceof ApiFeil ? err.message : t.feil.opprettBruker)
    }
  }

  async function slett(id: string) {
    await apiDelete(`/brukere/${id}`)
    lastBrukere()
  }

  return (
    <div className="panel">
      <h2>{t.brukere.heading}</h2>
      <p className="hjelpetekst">{t.brukere.hjelpetekst}</p>
      <table className="tabell">
        <thead>
          <tr>
            <th>{t.brukere.kolonner.navn}</th>
            <th>{t.brukere.kolonner.brukernavn}</th>
            <th>{t.brukere.kolonner.rolle}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {brukere.map((b) => (
            <tr key={b.id}>
              <td>{b.navn}</td>
              <td>{b.brukernavn}</td>
              <td>{t.rolle[b.rolle]}</td>
              <td>
                {b.rolle !== 'avdelingsleder' && (
                  <button className="knapp-faresone" onClick={() => slett(b.id)}>
                    {t.brukere.slett}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>{t.brukere.nyBruker}</h3>
      <form onSubmit={opprettBruker} className="skjema-rad">
        <input placeholder={t.brukere.navnPlaceholder} value={navn} onChange={(e) => setNavn(e.target.value)} required />
        <input
          placeholder={t.brukere.brukernavnPlaceholder}
          value={brukernavn}
          onChange={(e) => setBrukernavn(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t.brukere.passordPlaceholder}
          value={passord}
          onChange={(e) => setPassord(e.target.value)}
          minLength={8}
          required
        />
        <select value={rolle} onChange={(e) => setRolle(e.target.value as Rolle)}>
          {OPPRETTBARE_ROLLER.map((r) => (
            <option key={r} value={r}>
              {t.rolle[r]}
            </option>
          ))}
        </select>
        {rolle === 'laerer' && (
          <select value={laererId} onChange={(e) => setLaererId(e.target.value)} required>
            <option value="">{t.brukere.velgLaererRecord}</option>
            {data.laerere.map((l) => (
              <option key={l.id} value={l.id}>
                {l.navn} ({t.trinn[l.trinn]})
              </option>
            ))}
          </select>
        )}
        <button type="submit">{t.brukere.opprettKnapp}</button>
      </form>
      {feilmelding && <p className="advarsel">⚠ {feilmelding}</p>}
    </div>
  )
}
