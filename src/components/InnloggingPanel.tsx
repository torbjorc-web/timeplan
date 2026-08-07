import { useState } from 'react'
import { ApiFeil } from '../api'
import { useAuth } from '../useAuth'
import { useI18n } from '../i18n/useI18n'
import type { Regelverk } from '../types'

export const REGELVERK_VALG_NOKKEL = 'timeplan-regelverk-valg'

// Må matche DEMO_BRUKERNAVN/DEMO_PASSORD i server/src/seedDemo.ts.
const DEMO_BRUKERNAVN = 'demo'
const DEMO_PASSORD = 'DemoTimeplan2026'

export function InnloggingPanel() {
  const { loggInn, registrerAvdeling } = useAuth()
  const { t, sprak, setSprak } = useI18n()
  const [visRegistrering, setVisRegistrering] = useState(false)
  const [brukernavn, setBrukernavn] = useState('')
  const [passord, setPassord] = useState('')
  const [avdelingNavn, setAvdelingNavn] = useState('')
  const [navn, setNavn] = useState('')
  const [regelverk, setRegelverk] = useState<Regelverk>('arsramme')
  const [feilmelding, setFeilmelding] = useState<string | null>(null)
  const [laster, setLaster] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setFeilmelding(null)
    setLaster(true)
    try {
      await loggInn(brukernavn, passord)
    } catch (err) {
      setFeilmelding(err instanceof ApiFeil ? err.message : t.feil.loginFeilet)
    } finally {
      setLaster(false)
    }
  }

  async function handleDemoLogin() {
    setFeilmelding(null)
    setLaster(true)
    try {
      await loggInn(DEMO_BRUKERNAVN, DEMO_PASSORD)
    } catch (err) {
      setFeilmelding(err instanceof ApiFeil ? err.message : t.feil.loginFeilet)
    } finally {
      setLaster(false)
    }
  }

  async function handleRegistrer(e: React.FormEvent) {
    e.preventDefault()
    setFeilmelding(null)
    setLaster(true)
    try {
      // Lagres midlertidig og brukes til å seede standardoppsettet for den nye avdelingen ved første innlogging.
      localStorage.setItem(REGELVERK_VALG_NOKKEL, regelverk)
      await registrerAvdeling(avdelingNavn, brukernavn, passord, navn)
    } catch (err) {
      setFeilmelding(err instanceof ApiFeil ? err.message : t.feil.registreringFeilet)
    } finally {
      setLaster(false)
    }
  }

  return (
    <div className="innlogging-side">
      <div className="innlogging-boks">
        <div className="knapperad" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className={sprak === 'nb' ? 'fane-aktiv' : ''} onClick={() => setSprak('nb')}>
            {t.sprakVelger.nb}
          </button>
          <button type="button" className={sprak === 'en' ? 'fane-aktiv' : ''} onClick={() => setSprak('en')}>
            {t.sprakVelger.en}
          </button>
        </div>
        <h1>{t.login.appTittel}</h1>
        {!visRegistrering ? (
          <form onSubmit={handleLogin}>
            <h2>{t.login.loggInnHeading}</h2>
            <label>
              {t.login.brukernavn}
              <input value={brukernavn} onChange={(e) => setBrukernavn(e.target.value)} autoComplete="username" required />
            </label>
            <label>
              {t.login.passord}
              <input
                type="password"
                value={passord}
                onChange={(e) => setPassord(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {feilmelding && <p className="advarsel">⚠ {feilmelding}</p>}
            <button type="submit" disabled={laster}>
              {laster ? t.login.loggerInnKnapp : t.login.loggInnKnapp}
            </button>
            <button type="button" className="knapp-lenke" onClick={() => setVisRegistrering(true)}>
              {t.login.registrerLenke}
            </button>
            <button type="button" className="knapp-lenke" onClick={handleDemoLogin} disabled={laster}>
              {t.login.provDemoKnapp}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegistrer}>
            <h2>{t.login.registrerHeading}</h2>
            <p className="hjelpetekst">{t.login.registrerHjelpetekst}</p>
            <label>
              {t.login.avdelingNavn}
              <input value={avdelingNavn} onChange={(e) => setAvdelingNavn(e.target.value)} required />
            </label>
            <label>
              {t.login.dittNavn}
              <input value={navn} onChange={(e) => setNavn(e.target.value)} required />
            </label>
            <label>
              {t.login.brukernavn}
              <input value={brukernavn} onChange={(e) => setBrukernavn(e.target.value)} autoComplete="username" required />
            </label>
            <label>
              {t.login.passordMinLengde}
              <input
                type="password"
                value={passord}
                onChange={(e) => setPassord(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              {t.innstillinger.regelverkHeading}
              <select value={regelverk} onChange={(e) => setRegelverk(e.target.value as Regelverk)}>
                <option value="arsramme">{t.regelverk.arsramme}</option>
                <option value="leseplikt_uke">{t.regelverk.leseplikt_uke}</option>
              </select>
            </label>
            {feilmelding && <p className="advarsel">⚠ {feilmelding}</p>}
            <button type="submit" disabled={laster}>
              {laster ? t.login.oppretterKnapp : t.login.opprettKnapp}
            </button>
            <button type="button" className="knapp-lenke" onClick={() => setVisRegistrering(false)}>
              {t.login.harKontoLenke}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
