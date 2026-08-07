import { useState } from 'react'
import { apiPost, ApiFeil } from '../api'
import { useI18n } from '../i18n/I18nContext'

export function TilbakemeldingBoks() {
  const { t } = useI18n()
  const [melding, setMelding] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [feilmelding, setFeilmelding] = useState<string | null>(null)
  const [sender, setSender] = useState(false)

  async function send() {
    setFeilmelding(null)
    setStatus(null)
    if (melding.trim().length < 3) {
      setFeilmelding(t.feil.meldingForKort)
      return
    }
    setSender(true)
    try {
      await apiPost('/tilbakemeldinger', { melding })
      setMelding('')
      setStatus(t.tilbakemelding.takk)
    } catch (e) {
      setFeilmelding(e instanceof ApiFeil ? e.message : t.feil.sendeMelding)
    } finally {
      setSender(false)
    }
  }

  return (
    <section className="panel">
      <h2>{t.tilbakemelding.heading}</h2>
      <p className="hjelpetekst">{t.tilbakemelding.hjelpetekst}</p>
      {feilmelding && <p className="advarsel">⚠ {feilmelding}</p>}
      {status && <p>{status}</p>}
      <textarea
        rows={5}
        value={melding}
        onChange={(e) => setMelding(e.target.value)}
        placeholder={t.tilbakemelding.placeholder}
        style={{ width: '100%' }}
      />
      <div className="knapperad">
        <button onClick={send} disabled={sender}>
          {t.tilbakemelding.send}
        </button>
      </div>
    </section>
  )
}
