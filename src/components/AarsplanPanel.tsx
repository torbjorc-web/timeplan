import type { PanelProps } from './PanelProps'
import { TRINN_LABELS } from '../types'
import { beregnLaererAarsplan, formatTimer } from '../utils/calculations'
import { lastNedCsv } from '../utils/csvExport'

export function AarsplanPanel({ data }: PanelProps) {
  function eksporterCsv() {
    const rader: (string | number)[][] = [
      [
        'Lærer',
        'Trinn',
        'Stilling %',
        'Totalt årsverk (timer)',
        'Grunn undervisning (timer)',
        'Sum justeringer (timer)',
        'Undervisning etter justering (timer)',
        'Annen bundet tid (timer)',
        'Ubundet tid (timer)',
      ],
    ]
    for (const l of data.laerere) {
      const innstilling = data.innstillinger.trinnInnstillinger[l.trinn]
      const plan = beregnLaererAarsplan(l, innstilling)
      rader.push([
        l.navn,
        TRINN_LABELS[l.trinn],
        l.stillingsprosent,
        plan.totalArsverkTimer,
        plan.grunnUndervisning,
        plan.sumJusteringer,
        plan.undervisning,
        plan.annenBundetTid,
        plan.ubundetTid,
      ])
    }
    lastNedCsv(`aarsplan-${data.skoleaar}.csv`, rader)
  }

  return (
    <div className="panel">
      <div className="mellom-topp">
        <h2>Årsplan/oversikt per lærer (jf. SFS 2213 pkt. 5.2)</h2>
        <div className="knapperad">
          <button onClick={eksporterCsv}>Last ned CSV</button>
          <button onClick={() => window.print()}>Skriv ut</button>
        </div>
      </div>
      <p className="hjelpetekst">
        Viser total årsverkstid, undervisning (etter reduksjoner/justeringer), annen bundet tid og ubundet tid.
        Tallene bygger på eksempelverdiene i Innstillinger - juster disse mot gjeldende avtale.
      </p>
      {data.laerere.length === 0 && <p className="hjelpetekst">Ingen lærere registrert ennå.</p>}
      {data.laerere.map((l) => {
        const innstilling = data.innstillinger.trinnInnstillinger[l.trinn]
        const plan = beregnLaererAarsplan(l, innstilling)
        return (
          <div key={l.id} className="delseksjon">
            <h3>
              {l.navn} - {TRINN_LABELS[l.trinn]} - {l.stillingsprosent}% stilling
            </h3>
            <table className="tabell">
              <thead>
                <tr>
                  <th>Totalt årsverk (timer)</th>
                  <th>Grunn undervisning (timer)</th>
                  <th>Sum justeringer (timer)</th>
                  <th>Undervisning etter justering (timer)</th>
                  <th>Annen bundet tid (timer)</th>
                  <th>Ubundet tid (timer)</th>
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
                Justeringer: {l.justeringer.map((j) => `${j.type} (${formatTimer(j.timerPerAar)}t)`).join(', ')}
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
