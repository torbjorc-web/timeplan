import type { PanelProps } from './PanelProps'
import type { Trinn } from '../types'
import { TRINN_LABELS } from '../types'
import { beregnFagbehovForTrinn, formatTimer } from '../utils/calculations'

const TRINN_LISTE: Trinn[] = ['barnetrinn', 'ungdomstrinn', 'videregaende']

export function FagfordelingPanel({ data }: PanelProps) {
  return (
    <div className="panel">
      <h2>Fagfordeling - beregnet gruppebehov</h2>
      <p className="hjelpetekst">
        Antall grupper beregnes ut fra samlet elevtall på trinnet delt på fagets delingstall (opprundet). Fag som
        er koblet sammen (f.eks. kroppsøving + valgfag) bruker samlet elevtall og laveste delingstall, slik at
        ressursen ikke telles dobbelt.
      </p>
      {TRINN_LISTE.map((trinn) => {
        const arbeidsuker = data.innstillinger.trinnInnstillinger[trinn].arbeidsukerIAaret
        const behov = beregnFagbehovForTrinn(trinn, data.klasser, data.fag, arbeidsuker)
        const elevtall = data.klasser.filter((k) => k.trinn === trinn).reduce((s, k) => s + k.elevtall, 0)
        return (
          <div key={trinn} className="delseksjon">
            <h3>
              {TRINN_LABELS[trinn]} - {elevtall} elever totalt
            </h3>
            {behov.length === 0 ? (
              <p className="hjelpetekst">Ingen klasser registrert på dette trinnet ennå.</p>
            ) : (
              <table className="tabell">
                <thead>
                  <tr>
                    <th>Fag</th>
                    <th>Delingstall brukt</th>
                    <th>Grupper</th>
                    <th>Timer/uke totalt</th>
                    <th>Timer/år totalt</th>
                    <th>Koblet med</th>
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
                      <td>{b.koblet ?? '-'}</td>
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
