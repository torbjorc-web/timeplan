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
import { opprettTomtSkoleData } from './defaults'
import type { AppData, SkoleData } from './types'
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
  const [appData, setAppData] = useState<AppData | null>(null)
  const [feilmelding, setFeilmelding] = useState<string | null>(null)
  const [fane, setFane] = useState<Fane>('aarsplan')

  useEffect(() => {
    if (!bruker || bruker.rolle === 'superadmin') return
    lastInnData()
      .then(setAppData)
      .catch((e) => setFeilmelding(e instanceof ApiFeil ? e.message : 'Kunne ikke laste data fra serveren.'))
  }, [bruker])

  useEffect(() => {
    if (!appData || bruker?.rolle !== 'avdelingsleder') return
    lagreData(appData).catch((e) => setFeilmelding(e instanceof ApiFeil ? e.message : 'Kunne ikke lagre endringer til serveren.'))
  }, [appData, bruker])

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
    const nyttAar = window.prompt('Nytt skoleår (f.eks. 2026/2027):', forslag)
    if (!nyttAar) return
    setAppData((d) => {
      if (!d || d.skoleaar[nyttAar]) return d
      return {
        ...d,
        aktivtSkoleaar: nyttAar,
        skoleaar: { ...d.skoleaar, [nyttAar]: opprettTomtSkoleData(nyttAar) },
      }
    })
  }

  if (laster) return <div className="senter-melding">Laster...</div>
  if (!bruker) return <InnloggingPanel />
  if (bruker.rolle === 'superadmin') return <AdminPanel />
  if (!appData || !skoleData) return <div className="senter-melding">Laster data...</div>

  const panelProps = { data: skoleData, setData: setSkoleData }

  const faneKnapper: { id: Fane; navn: string }[] =
    bruker.rolle === 'avdelingsleder'
      ? [
          { id: 'innstillinger', navn: 'Innstillinger' },
          { id: 'fag', navn: 'Fag' },
          { id: 'rom', navn: 'Rom' },
          { id: 'klasser', navn: 'Klasser' },
          { id: 'laerere', navn: 'Lærere' },
          { id: 'brukere', navn: 'Brukere' },
          { id: 'fagfordeling', navn: 'Fagfordeling' },
          { id: 'aarsplan', navn: 'Årsplan' },
          { id: 'timeplan', navn: 'Timeplan' },
          { id: 'tilbakemelding', navn: 'Tilbakemelding' },
        ]
      : [
          { id: 'fagfordeling', navn: 'Fagfordeling' },
          { id: 'aarsplan', navn: bruker.rolle === 'laerer' ? 'Min årsplan' : 'Årsplan' },
          { id: 'timeplan', navn: bruker.rolle === 'laerer' ? 'Min timeplan' : 'Timeplan' },
        ]

  return (
    <div className="app-skall">
      <header className="topplinje">
        <div>
          <strong>Timeplan - SFS 2213</strong>
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
              <button onClick={leggTilSkoleaar}>+ Nytt skoleår</button>
            </>
          )}
          <span>
            {bruker.navn} ({bruker.rolle})
          </span>
          <button onClick={() => loggUt()}>Logg ut</button>
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
