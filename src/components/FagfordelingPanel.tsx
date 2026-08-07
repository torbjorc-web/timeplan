import type { PanelProps } from './PanelProps'
import type { Trinn } from '../types'
import { beregnFagbehovForTrinn, formatTimer } from '../utils/calculations'
import { useI18n } from '../i18n/I18nContext'

const TRINN_LISTE: Trinn[] = ['barnetrinn', 'ungdomstrinn', 'videregaende']

export function FagfordelingPanel({ data }: PanelProps) {
  const { t } = useI18n()
  return (
    <div className="panel">
      <h2>{t.fagfordeling.heading}</h2>
      <p className="hjelpetekst">{t.fagfordeling.hjelpetekst}</p>
      {TRINN_LISTE.map((trinn) => {
        const arbeidsuker = data.innstillinger.trinnInnstillinger[trinn].arbeidsukerIAaret
        const behov = beregnFagbehovForTrinn(trinn, data.klasser, data.fag, arbeidsuker)
        const elevtall = data.klasser.filter((k) => k.trinn === trinn).reduce((s, k) => s + k.elevtall, 0)
        return (
          <div key={trinn} className="delseksjon">
            <h3>
              {t.trinn[trinn]} - {t.fagfordeling.elevtallTotalt(elevtall)}
            </h3>
            {behov.length === 0 ? (
              <p className="hjelpetekst">{t.fagfordeling.ingenKlasser}</p>
            ) : (
              <table className="tabell">
                <thead>
                  <tr>
                    <th>{t.fagfordeling.kolonner.fag}</th>
                    <th>{t.fagfordeling.kolonner.delingstallBrukt}</th>
                    <th>{t.fagfordeling.kolonner.grupper}</th>
                    <th>{t.fagfordeling.kolonner.timerUke}</th>
                    <th>{t.fagfordeling.kolonner.timerAar}</th>
                    <th>{t.fagfordeling.kolonner.koblet}</th>
                  </tr>
                </thead>
                <tbody>
                  {behov.map((b) => (
                    <tr key={b.fagId}>
                      <td>{b.fagNavn}</td>
                      <td>{b.delingstallBrukt}</td>
                      <td>{b.grupper}</td>
                      <td>{formatTimer(b.laerertimerPerUke)}</td>
                      <td>{formatTimer(b.laerertimerPerAar)}</td>
                      <td>{b.koblet ?? t.common.dash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
