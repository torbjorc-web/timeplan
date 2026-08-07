import { useEffect, useMemo, useState } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { ApiFeil } from './api'
import { InnloggingPanel } from './components/InnloggingPanel'
import { FagPanel } from './components/FagPanel'
import { RomPanel } from './components/RomPanel'
import { KlassePanel } from './components/KlassePanel'
import { InnstillingerPanel } from './components/InnstillingerPanel'
import { LaererPanel } from './components/LaererPanel'
import { BrukerePanel } from './components/BrukerePanel'
import { FagfordelingPanel } from './components/FagfordelingPanel'
import { AarsplanPanel } from './components/AarsplanPanel'
import { TimeplanPanel } from './components/TimeplanPanel'
import { TimeplanVisning } from './components/TimeplanVisning'
import { AdminPanel } from './components/AdminPanel'
import { LisensBanner } from './components/LisensBanner'
import { TilbakemeldingBoks } from './components/TilbakemeldingBoks'
import { lastInnData, lagreData } from './storage'
import { opprettStandardAppData, opprettTomtSkoleData } from './defaults'
import type { AppData, Regelverk, SkoleData } from './types'
import { useI18n } from './i18n/I18nContext'
import { REGELVERK_VALG_NOKKEL } from './components/InnloggingPanel'
import './App.css'

type Fane =
  | 'innstillinger'
  | 'fag'
  | 'rom'
  | 'klasser'
  | 'laerere'
  | 'brukere'
  | 'fagfordeling'
  | 'aarsplan'
  | 'timeplan'
  | 'tilbakemelding'

function AppInnhold() {
  const { bruker, laster, loggUt } = useAuth()
  const { t } = useI18n()
  const [appData, setAppData] = useState<AppData | null>(null)
  const [feilmelding, setFeilmelding] = useState<string | null>(null)
  const [fane, setFane] = useState<Fane>('aarsplan')

  useEffect(() => {
    if (!bruker || bruker.rolle === 'superadmin') return
    lastInnData()
      // Helt ny avdeling har ingen skoledata lagret ennå - fyll inn standardoppsett så siden ikke låser seg på "Laster data...".
      .then((d) => {
        if (!d.aktivtSkoleaar || !d.skoleaar[d.aktivtSkoleaar]) {
          const regelverkValg = localStorage.getItem(REGELVERK_VALG_NOKKEL) as Regelverk | null
          localStorage.removeItem(REGELVERK_VALG_NOKKEL)
          setAppData(opprettStandardAppData(regelverkValg ?? undefined))
        } else {
          setAppData(d)
        }
      })
      .catch((e) => setFeilmelding(e instanceof ApiFeil ? e.message : t.feil.lasteData))
  }, [bruker, t])

  useEffect(() => {
    if (!appData || bruker?.rolle !== 'avdelingsleder') return
    lagreData(appData).catch((e) => setFeilmelding(e instanceof ApiFeil ? e.message : t.feil.lagreData))
  }, [appData, bruker, t])

  const skoleData: SkoleData | null = useMemo(() => {
    if (!appData) return null
    return appData.skoleaar[appData.aktivtSkoleaar] ?? null
  }, [appData])

  function setSkoleData(updater: (d: SkoleData) => SkoleData) {
    setAppData((d) => {
      if (!d) return d
      const gjeldende = d.skoleaar[d.aktivtSkoleaar]
      if (!gjeldende) return d
      return { ...d, skoleaar: { ...d.skoleaar, [d.aktivtSkoleaar]: updater(gjeldende) } }
    })
  }

  function byttSkoleaar(aar: string) {
    setAppData((d) => (d ? { ...d, aktivtSkoleaar: aar } : d))
  }

  function leggTilSkoleaar() {
    const forslag = (() => {
      const [start] = (appData?.aktivtSkoleaar ?? '').split('/')
      const tall = Number(start)
      return Number.isFinite(tall) ? `${tall + 1}/${tall + 2}` : ''
    })()
    const nyttAar = window.prompt(t.app.nyttSkoleaarPrompt(forslag), forslag)
    if (!nyttAar) return
    setAppData((d) => {
      if (!d || d.skoleaar[nyttAar]) return d
      const gjeldendeRegelverk = d.skoleaar[d.aktivtSkoleaar]?.innstillinger.regelverk
      return {
        ...d,
        aktivtSkoleaar: nyttAar,
        skoleaar: { ...d.skoleaar, [nyttAar]: opprettTomtSkoleData(nyttAar, gjeldendeRegelverk) },
      }
    })
  }

  if (laster) return <div className="senter-melding">{t.common.loading}</div>
  if (!bruker) return <InnloggingPanel />
  if (bruker.rolle === 'superadmin') return <AdminPanel />
  if (!appData || !skoleData) return <div className="senter-melding">{t.common.loadingData}</div>

  const panelProps = { data: skoleData, setData: setSkoleData }

  const faneKnapper: { id: Fane; navn: string }[] =
    bruker.rolle === 'avdelingsleder'
      ? [
          { id: 'innstillinger', navn: t.app.tabs.innstillinger },
          { id: 'fag', navn: t.app.tabs.fag },
          { id: 'rom', navn: t.app.tabs.rom },
          { id: 'klasser', navn: t.app.tabs.klasser },
          { id: 'laerere', navn: t.app.tabs.laerere },
          { id: 'brukere', navn: t.app.tabs.brukere },
          { id: 'fagfordeling', navn: t.app.tabs.fagfordeling },
          { id: 'aarsplan', navn: t.app.tabs.aarsplan },
          { id: 'timeplan', navn: t.app.tabs.timeplan },
          { id: 'tilbakemelding', navn: t.app.tabs.tilbakemelding },
        ]
      : [
          { id: 'fagfordeling', navn: t.app.tabs.fagfordeling },
          { id: 'aarsplan', navn: bruker.rolle === 'laerer' ? t.app.tabs.minAarsplan : t.app.tabs.aarsplan },
          { id: 'timeplan', navn: bruker.rolle === 'laerer' ? t.app.tabs.minTimeplan : t.app.tabs.timeplan },
        ]

  return (
    <div className="app-skall">
      <header className="topplinje">
        <div>
          <strong>{t.app.tittel}</strong>
          {appData.aktivtSkoleaar && <span className="skoleaar-tag"> {appData.aktivtSkoleaar}</span>}
        </div>
        <div className="topplinje-hoyre">
          {bruker.rolle === 'avdelingsleder' && (
            <>
              <select value={appData.aktivtSkoleaar} onChange={(e) => byttSkoleaar(e.target.value)}>
                {Object.keys(appData.skoleaar).map((aar) => (
                  <option key={aar} value={aar}>
                    {aar}
                  </option>
                ))}
              </select>
              <button onClick={leggTilSkoleaar}>{t.app.nyttSkoleaarKnapp}</button>
            </>
          )}
          <span>{t.app.brukerVisning(bruker.navn, bruker.rolle)}</span>
          <button onClick={() => loggUt()}>{t.common.logout}</button>
        </div>
      </header>

      <LisensBanner bruker={bruker} />

      {feilmelding && <p className="advarsel">⚠ {feilmelding}</p>}

      <nav className="faner">
        {faneKnapper.map((f) => (
          <button key={f.id} className={fane === f.id ? 'fane-aktiv' : ''} onClick={() => setFane(f.id)}>
            {f.navn}
          </button>
        ))}
      </nav>

      <main>
        {fane === 'innstillinger' && bruker.rolle === 'avdelingsleder' && <InnstillingerPanel {...panelProps} />}
        {fane === 'fag' && bruker.rolle === 'avdelingsleder' && <FagPanel {...panelProps} />}
        {fane === 'rom' && bruker.rolle === 'avdelingsleder' && <RomPanel {...panelProps} />}
        {fane === 'klasser' && bruker.rolle === 'avdelingsleder' && <KlassePanel {...panelProps} />}
        {fane === 'laerere' && bruker.rolle === 'avdelingsleder' && <LaererPanel {...panelProps} />}
        {fane === 'brukere' && bruker.rolle === 'avdelingsleder' && <BrukerePanel {...panelProps} />}
        {fane === 'fagfordeling' && <FagfordelingPanel {...panelProps} />}
        {fane === 'aarsplan' && <AarsplanPanel {...panelProps} />}
        {fane === 'timeplan' &&
          (bruker.rolle === 'avdelingsleder' ? <TimeplanPanel {...panelProps} /> : <TimeplanVisning {...panelProps} />)}
        {fane === 'tilbakemelding' && bruker.rolle === 'avdelingsleder' && <TilbakemeldingBoks />}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppInnhold />
    </AuthProvider>
  )
}

export default App
