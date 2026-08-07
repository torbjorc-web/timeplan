import { useEffect, useState } from 'react'
import { apiGet, apiPost, ApiFeil } from '../api'
import { useAuth } from '../useAuth'
import { useI18n } from '../i18n/useI18n'
import type { Sprak } from '../i18n/i18nContextCore'

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

function formatDato(iso: string, sprak: Sprak): string {
  return new Date(iso).toLocaleString(sprak === 'en' ? 'en-GB' : 'nb-NO')
}

export function AdminPanel() {
  const { loggUt } = useAuth()
  const { t, sprak } = useI18n()
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
      .then(([tenantListe, innloggingListe, tilbakemeldingListe]) => {
        setTenants(tenantListe)
        setInnlogginger(innloggingListe)
        setTilbakemeldinger(tilbakemeldingListe)
      })
      .catch((e) => setFeilmelding(e instanceof ApiFeil ? e.message : t.feil.lasteAdminData))
  }

  useEffect(lastInn, [])

  async function endreLisens(id: string, handling: 'frigi' | 'sperr') {
    try {
      await apiPost(`/admin/tenants/${id}/${handling}`)
      lastInn()
    } catch (e) {
      setFeilmelding(e instanceof ApiFeil ? e.message : t.feil.oppdatereLisens)
    }
  }

  return (
    <div className="app-skall">
      <header className="topplinje">
        <strong>{t.admin.heading}</strong>
        <button onClick={() => loggUt()}>{t.common.logout}</button>
      </header>

      <main>
        {feilmelding && <p className="advarsel">⚠ {feilmelding}</p>}

        <section className="panel delseksjon">
          <h2>{t.admin.skolerHeading}</h2>
          <table className="tabell">
            <thead>
              <tr>
                <th>{t.admin.kolonner.navn}</th>
                <th>{t.admin.kolonner.opprettet}</th>
                <th>{t.admin.kolonner.lisens}</th>
                <th>{t.admin.kolonner.proveperiodeSlutt}</th>
                <th>{t.admin.kolonner.brukere}</th>
                <th>{t.admin.kolonner.handling}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.navn}</td>
                  <td>{formatDato(tenant.opprettet, sprak)}</td>
                  <td>{t.lisens[tenant.lisensstatus]}</td>
                  <td>{formatDato(tenant.proveperiodeSlutt, sprak)}</td>
                  <td className="sentrert">{tenant.antallBrukere}</td>
                  <td className="knapperad">
                    <button onClick={() => endreLisens(tenant.id, 'frigi')}>{t.admin.frigi}</button>
                    <button className="knapp-faresone" onClick={() => endreLisens(tenant.id, 'sperr')}>
                      {t.admin.sperr}
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6}>{t.admin.ingenSkoler}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="panel delseksjon">
          <h2>{t.admin.innloggingerHeading(innlogginger.length)}</h2>
          <table className="tabell">
            <thead>
              <tr>
                <th>{t.admin.innloggingerKolonner.tidspunkt}</th>
                <th>{t.admin.innloggingerKolonner.navn}</th>
                <th>{t.admin.innloggingerKolonner.brukernavn}</th>
                <th>{t.admin.innloggingerKolonner.rolle}</th>
                <th>{t.admin.innloggingerKolonner.skole}</th>
                <th>{t.admin.innloggingerKolonner.ip}</th>
              </tr>
            </thead>
            <tbody>
              {innlogginger.map((i) => (
                <tr key={i.id}>
                  <td>{formatDato(i.tidspunkt, sprak)}</td>
                  <td>{i.navn}</td>
                  <td>{i.brukernavn}</td>
                  <td>{i.rolle}</td>
                  <td>{i.tenantNavn}</td>
                  <td>{i.ip}</td>
                </tr>
              ))}
              {innlogginger.length === 0 && (
                <tr>
                  <td colSpan={6}>{t.admin.ingenInnlogginger}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="panel delseksjon">
          <h2>{t.admin.tilbakemeldingerHeading}</h2>
          {tilbakemeldinger.length === 0 && <p className="hjelpetekst">{t.admin.ingenTilbakemeldinger}</p>}
          {tilbakemeldinger.map((tb) => (
            <div key={tb.id} className="detaljboks">
              <strong>
                {tb.tenantNavn} - {tb.brukerNavn}
              </strong>
              <p className="hjelpetekst">{formatDato(tb.tidspunkt, sprak)}</p>
              <p>{tb.melding}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
