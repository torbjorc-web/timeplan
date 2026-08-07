import { useEffect, useState } from 'react'
import { apiGet, apiPost, ApiFeil } from '../api'
import { useAuth } from '../AuthContext'

interface TenantMedStatus {
  id: string
  navn: string
  opprettet: string
  lisensstatus: 'proveperiode' | 'aktiv' | 'sperret'
  proveperiodeSlutt: string
  antallBrukere: number
}

interface Innloggingsoppforing {
  id: string
  navn: string
  brukernavn: string
  rolle: string
  tenantNavn: string
  tidspunkt: string
  ip: string
}

interface TilbakemeldingMedTenant {
  id: string
  tenantNavn: string
  brukerNavn: string
  melding: string
  tidspunkt: string
}

const LISENS_LABELS: Record<TenantMedStatus['lisensstatus'], string> = {
  proveperiode: 'Prøveperiode',
  aktiv: 'Aktiv lisens',
  sperret: 'Sperret',
}

function formatDato(iso: string): string {
  return new Date(iso).toLocaleString('nb-NO')
}

export function AdminPanel() {
  const { loggUt } = useAuth()
  const [tenants, setTenants] = useState<TenantMedStatus[]>([])
  const [innlogginger, setInnlogginger] = useState<Innloggingsoppforing[]>([])
  const [tilbakemeldinger, setTilbakemeldinger] = useState<TilbakemeldingMedTenant[]>([])
  const [feilmelding, setFeilmelding] = useState<string | null>(null)

  function lastInn() {
    Promise.all([
      apiGet<TenantMedStatus[]>('/admin/tenants'),
      apiGet<Innloggingsoppforing[]>('/admin/innlogginger'),
      apiGet<TilbakemeldingMedTenant[]>('/admin/tilbakemeldinger'),
    ])
      .then(([t, i, f]) => {
        setTenants(t)
        setInnlogginger(i)
        setTilbakemeldinger(f)
      })
      .catch((e) => setFeilmelding(e instanceof ApiFeil ? e.message : 'Kunne ikke laste admin-data.'))
  }

  useEffect(lastInn, [])

  async function endreLisens(id: string, handling: 'frigi' | 'sperr') {
    try {
      await apiPost(`/admin/tenants/${id}/${handling}`)
      lastInn()
    } catch (e) {
      setFeilmelding(e instanceof ApiFeil ? e.message : 'Kunne ikke oppdatere lisens.')
    }
  }

  return (
    <div className="app-skall">
      <header className="topplinje">
        <strong>Superadmin</strong>
        <button onClick={() => loggUt()}>Logg ut</button>
      </header>

      <main>
        {feilmelding && <p className="advarsel">⚠ {feilmelding}</p>}

        <section className="panel delseksjon">
          <h2>Skoler / avdelinger</h2>
          <table className="tabell">
            <thead>
              <tr>
                <th>Navn</th>
                <th>Opprettet</th>
                <th>Lisens</th>
                <th>Prøveperiode slutt</th>
                <th>Brukere</th>
                <th>Handling</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td>{t.navn}</td>
                  <td>{formatDato(t.opprettet)}</td>
                  <td>{LISENS_LABELS[t.lisensstatus]}</td>
                  <td>{formatDato(t.proveperiodeSlutt)}</td>
                  <td className="sentrert">{t.antallBrukere}</td>
                  <td className="knapperad">
                    <button onClick={() => endreLisens(t.id, 'frigi')}>Frigi (aktiver)</button>
                    <button className="knapp-faresone" onClick={() => endreLisens(t.id, 'sperr')}>
                      Sperr
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6}>Ingen skoler registrert enda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="panel delseksjon">
          <h2>Innlogginger ({innlogginger.length})</h2>
          <table className="tabell">
            <thead>
              <tr>
                <th>Tidspunkt</th>
                <th>Navn</th>
                <th>Brukernavn</th>
                <th>Rolle</th>
                <th>Skole</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {innlogginger.map((i) => (
                <tr key={i.id}>
                  <td>{formatDato(i.tidspunkt)}</td>
                  <td>{i.navn}</td>
                  <td>{i.brukernavn}</td>
                  <td>{i.rolle}</td>
                  <td>{i.tenantNavn}</td>
                  <td>{i.ip}</td>
                </tr>
              ))}
              {innlogginger.length === 0 && (
                <tr>
                  <td colSpan={6}>Ingen innlogginger registrert enda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="panel delseksjon">
          <h2>Tilbakemeldinger fra skoler</h2>
          {tilbakemeldinger.length === 0 && <p className="hjelpetekst">Ingen tilbakemeldinger enda.</p>}
          {tilbakemeldinger.map((t) => (
            <div key={t.id} className="detaljboks">
              <strong>
                {t.tenantNavn} - {t.brukerNavn}
              </strong>
              <p className="hjelpetekst">{formatDato(t.tidspunkt)}</p>
              <p>{t.melding}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
