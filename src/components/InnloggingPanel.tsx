import { useState } from 'react'
import { useAuth, ApiFeil } from '../AuthContext'

export function InnloggingPanel() {
  const { loggInn, registrerAvdeling } = useAuth()
  const [visRegistrering, setVisRegistrering] = useState(false)
  const [brukernavn, setBrukernavn] = useState('')
  const [passord, setPassord] = useState('')
  const [avdelingNavn, setAvdelingNavn] = useState('')
  const [navn, setNavn] = useState('')
  const [feilmelding, setFeilmelding] = useState<string | null>(null)
  const [laster, setLaster] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setFeilmelding(null)
    setLaster(true)
    try {
      await loggInn(brukernavn, passord)
    } catch (err) {
      setFeilmelding(err instanceof ApiFeil ? err.message : 'Innlogging feilet.')
    } finally {
      setLaster(false)
    }
  }

  async function handleRegistrer(e: React.FormEvent) {
    e.preventDefault()
    setFeilmelding(null)
    setLaster(true)
    try {
      await registrerAvdeling(avdelingNavn, brukernavn, passord, navn)
    } catch (err) {
      setFeilmelding(err instanceof ApiFeil ? err.message : 'Registrering feilet.')
    } finally {
      setLaster(false)
    }
  }

  return (
    <div className="innlogging-side">
      <div className="innlogging-boks">
        <h1>Timeplan - SFS 2213</h1>
        {!visRegistrering ? (
          <form onSubmit={handleLogin}>
            <h2>Logg inn</h2>
            <label>
              Brukernavn
              <input value={brukernavn} onChange={(e) => setBrukernavn(e.target.value)} autoComplete="username" required />
            </label>
            <label>
              Passord
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
              {laster ? 'Logger inn...' : 'Logg inn'}
            </button>
            <button type="button" className="knapp-lenke" onClick={() => setVisRegistrering(true)}>
              Ny avdeling? Registrer her
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegistrer}>
            <h2>Registrer ny avdeling</h2>
            <p className="hjelpetekst">Oppretter en ny, adskilt avdeling med deg som avdelingsleder.</p>
            <label>
              Avdelings-/skolenavn
              <input value={avdelingNavn} onChange={(e) => setAvdelingNavn(e.target.value)} required />
            </label>
            <label>
              Ditt navn
              <input value={navn} onChange={(e) => setNavn(e.target.value)} required />
            </label>
            <label>
              Brukernavn
              <input value={brukernavn} onChange={(e) => setBrukernavn(e.target.value)} autoComplete="username" required />
            </label>
            <label>
              Passord (minst 8 tegn)
              <input
                type="password"
                value={passord}
                onChange={(e) => setPassord(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            {feilmelding && <p className="advarsel">⚠ {feilmelding}</p>}
            <button type="submit" disabled={laster}>
              {laster ? 'Oppretter...' : 'Opprett avdeling'}
            </button>
            <button type="button" className="knapp-lenke" onClick={() => setVisRegistrering(false)}>
              Har du allerede en konto? Logg inn
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
