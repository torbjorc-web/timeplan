import type { PanelProps } from './PanelProps'
import { beregnLaererAarsplan, beregnLaererLeseplikt, formatTimer } from '../utils/calculations'
import { lastNedCsv } from '../utils/csvExport'
import { useI18n } from '../i18n/I18nContext'

export function AarsplanPanel({ data }: PanelProps) {
  const { t } = useI18n()
  const erLeseplikt = data.innstillinger.regelverk === 'leseplikt_uke'

  function eksporterCsv() {
    const rader: (string | number)[][] = erLeseplikt
      ? [
          [
            'Lærer',
            'Trinn',
            'Stilling %',
            t.aarsplan.kolonnerLeseplikt.leseplikttimerUke,
            t.aarsplan.kolonnerLeseplikt.sumJusteringerUke,
            t.aarsplan.kolonnerLeseplikt.undervisningUke,
          ],
        ]
      : [
          [
            'Lærer',
            'Trinn',
            'Stilling %',
            t.aarsplan.kolonnerArsramme.totaltArsverk,
            t.aarsplan.kolonnerArsramme.grunnUndervisning,
            t.aarsplan.kolonnerArsramme.sumJusteringer,
            t.aarsplan.kolonnerArsramme.undervisningEtterJustering,
            t.aarsplan.kolonnerArsramme.annenBundetTid,
            t.aarsplan.kolonnerArsramme.ubundetTid,
          ],
        ]
    for (const l of data.laerere) {
      if (erLeseplikt) {
        const innstilling = data.innstillinger.leseplikttInnstillinger[l.trinn]
        const arbeidsuker = data.innstillinger.trinnInnstillinger[l.trinn].arbeidsukerIAaret
        const plan = beregnLaererLeseplikt(l, innstilling, arbeidsuker, data.timeplan)
        rader.push([
          l.navn,
          t.trinn[l.trinn],
          l.stillingsprosent,
          plan.leseplikttimerUke,
          plan.sumJusteringerUke,
          plan.undervisningPaakrevdUke,
        ])
      } else {
        const innstilling = data.innstillinger.trinnInnstillinger[l.trinn]
        const plan = beregnLaererAarsplan(l, innstilling)
        rader.push([
          l.navn,
          t.trinn[l.trinn],
          l.stillingsprosent,
          plan.totalArsverkTimer,
          plan.grunnUndervisning,
          plan.sumJusteringer,
          plan.undervisning,
          plan.annenBundetTid,
          plan.ubundetTid,
        ])
      }
    }
    lastNedCsv(`aarsplan-${data.skoleaar}.csv`, rader)
  }

  return (
    <div className="panel">
      <div className="mellom-topp">
        <h2>{t.aarsplan.heading}</h2>
        <div className="knapperad">
          <button onClick={eksporterCsv}>{t.aarsplan.lastNedCsv}</button>
          <button onClick={() => window.print()}>{t.aarsplan.skrivUt}</button>
        </div>
      </div>
      <p className="hjelpetekst">{t.aarsplan.hjelpetekst}</p>
      {data.laerere.length === 0 && <p className="hjelpetekst">{t.aarsplan.ingenLaerere}</p>}
      {data.laerere.map((l) => {
        if (erLeseplikt) {
          const innstilling = data.innstillinger.leseplikttInnstillinger[l.trinn]
          const arbeidsuker = data.innstillinger.trinnInnstillinger[l.trinn].arbeidsukerIAaret
          const plan = beregnLaererLeseplikt(l, innstilling, arbeidsuker, data.timeplan)
          return (
            <div key={l.id} className="delseksjon">
              <h3>
                {l.navn} - {t.trinn[l.trinn]} - {t.aarsplan.stillingSuffiks(l.stillingsprosent)}
              </h3>
              <table className="tabell">
                <thead>
                  <tr>
                    <th>{t.aarsplan.kolonnerLeseplikt.leseplikttimerUke}</th>
                    <th>{t.aarsplan.kolonnerLeseplikt.sumJusteringerUke}</th>
                    <th>{t.aarsplan.kolonnerLeseplikt.undervisningUke}</th>
                    <th>{t.aarsplan.kolonnerLeseplikt.timeLengde}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{formatTimer(plan.leseplikttimerUke)}</td>
                    <td>{formatTimer(plan.sumJusteringerUke)}</td>
                    <td>{formatTimer(plan.undervisningPaakrevdUke)}</td>
                    <td>{innstilling.timeLengdeMinutter}</td>
                  </tr>
                </tbody>
              </table>
              {l.justeringer.length > 0 && (
                <p className="hjelpetekst">
                  {t.aarsplan.justeringerListe(l.justeringer.map((j) => `${t.justering[j.type]} (${formatTimer(j.timerPerAar)}t/år)`).join(', '))}
                </p>
              )}
              {plan.advarsler.map((a) => (
                <p key={a} className="advarsel">
                  ⚠ {a}
                </p>
              ))}
            </div>
          )
        }
        const innstilling = data.innstillinger.trinnInnstillinger[l.trinn]
        const plan = beregnLaererAarsplan(l, innstilling)
        return (
          <div key={l.id} className="delseksjon">
            <h3>
              {l.navn} - {t.trinn[l.trinn]} - {t.aarsplan.stillingSuffiks(l.stillingsprosent)}
            </h3>
            <table className="tabell">
              <thead>
                <tr>
                  <th>{t.aarsplan.kolonnerArsramme.totaltArsverk}</th>
                  <th>{t.aarsplan.kolonnerArsramme.grunnUndervisning}</th>
                  <th>{t.aarsplan.kolonnerArsramme.sumJusteringer}</th>
                  <th>{t.aarsplan.kolonnerArsramme.undervisningEtterJustering}</th>
                  <th>{t.aarsplan.kolonnerArsramme.annenBundetTid}</th>
                  <th>{t.aarsplan.kolonnerArsramme.ubundetTid}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{formatTimer(plan.totalArsverkTimer)}</td>
                  <td>{formatTimer(plan.grunnUndervisning)}</td>
                  <td>{formatTimer(plan.sumJusteringer)}</td>
                  <td>{formatTimer(plan.undervisning)}</td>
                  <td>{formatTimer(plan.annenBundetTid)}</td>
                  <td>{formatTimer(plan.ubundetTid)}</td>
                </tr>
              </tbody>
            </table>
            {l.justeringer.length > 0 && (
              <p className="hjelpetekst">
                {t.aarsplan.justeringerListe(l.justeringer.map((j) => `${t.justering[j.type]} (${formatTimer(j.timerPerAar)}t)`).join(', '))}
              </p>
            )}
            {plan.advarsler.map((a) => (
              <p key={a} className="advarsel">
                ⚠ {a}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}
