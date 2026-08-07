import { useState } from 'react'
import { apiPost, ApiFeil } from '../api'

export function TilbakemeldingBoks() {
  const [melding, setMelding] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [feilmelding, setFeilmelding] = useState<string | null>(null)
  const [sender, setSender] = useState(false)

  async function send() {
    setFeilmelding(null)
    setStatus(null)
    if (melding.trim().length < 3) {
      setFeilmelding('Skriv en litt lengre melding (minst 3 tegn).')
      return
    }
    setSender(true)
    try {
      await apiPost('/tilbakemeldinger', { melding })
      setMelding('')
      setStatus('Takk! Meldingen din er sendt.')
    } catch (e) {
      setFeilmelding(e instanceof ApiFeil ? e.message : 'Kunne ikke sende meldingen.')
    } finally {
      setSender(false)
    }
  }

  return (
    <section className="panel">
      <h2>Tilbakemelding / ønsker</h2>
      <p className="hjelpetekst">
        Send ønsker, spørsmål eller tilbakemelding om appen direkte til oss. Vi leser alt som kommer inn.
      </p>
      {feilmelding && <p className="advarsel">⚠ {feilmelding}</p>}
      {status && <p>{status}</p>}
      <textarea
        rows={5}
        value={melding}
        onChange={(e) => setMelding(e.target.value)}
        placeholder="Skriv meldingen din her..."
        style={{ width: '100%' }}
      />
      <div className="knapperad">
        <button onClick={send} disabled={sender}>
          Send
        </button>
      </div>
    </section>
  )
}
