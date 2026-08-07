import { useState } from 'react'
import { apiPost, ApiFeil } from '../api'
import type { Bruker } from '../authContextCore'
import { useI18n } from '../i18n/useI18n'

function dagerIgjen(proveperiodeSlutt: string): number {
  const ms = new Date(proveperiodeSlutt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

export function LisensBanner({ bruker }: { bruker: Bruker }) {
  const { t } = useI18n()
  const [feilmelding, setFeilmelding] = useState<string | null>(null)
  const [laster, setLaster] = useState(false)

  if (bruker.rolle !== 'avdelingsleder' || bruker.lisensstatus === 'aktiv') return null

  async function kjopLisens() {
    setFeilmelding(null)
    setLaster(true)
    try {
      const { url } = await apiPost<{ url: string }>('/betaling/opprett-checkout')
      window.location.href = url
    } catch (e) {
      setFeilmelding(e instanceof ApiFeil ? e.message : t.feil.startBetaling)
      setLaster(false)
    }
  }

  const sperret = bruker.lisensstatus === 'sperret'
  const dager = bruker.proveperiodeSlutt ? dagerIgjen(bruker.proveperiodeSlutt) : 0

  return (
    <div className={sperret ? 'advarsel' : 'hjelpetekst'} style={{ padding: '8px 20px' }}>
      {sperret ? <>{t.lisensBanner.sperretTekst}</> : <>{t.lisensBanner.proveperiodeTekst(dager)} </>}{' '}
      <button onClick={kjopLisens} disabled={laster}>
        {t.lisensBanner.kjopLisens}
      </button>
      {feilmelding && <span className="advarsel"> {feilmelding}</span>}
    </div>
  )
}
