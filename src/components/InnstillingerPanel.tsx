import type { PanelProps } from './PanelProps'
import { uuid } from '../defaults'
import type { FagType, SeniorRegel, Trinn, TrinnInnstilling } from '../types'
import { FAGTYPE_LABELS, TRINN_LABELS } from '../types'

const TRINN_LISTE: Trinn[] = ['barnetrinn', 'ungdomstrinn', 'videregaende']
const FAGTYPER: FagType[] = ['teoretisk', 'praktisk-estetisk', 'kroppsoving', 'valgfag', 'annet']

export function InnstillingerPanel({ data, setData }: PanelProps) {
  function oppdaterTrinnInnstilling(trinn: Trinn, endring: Partial<TrinnInnstilling>) {
    setData((d) => ({
      ...d,
      innstillinger: {
        ...d.innstillinger,
        trinnInnstillinger: {
          ...d.innstillinger.trinnInnstillinger,
          [trinn]: { ...d.innstillinger.trinnInnstillinger[trinn], ...endring },
        },
      },
    }))
  }

  function oppdaterDelingstallStandard(type: FagType, verdi: number) {
    setData((d) => ({
      ...d,
      innstillinger: {
        ...d.innstillinger,
        delingstallStandard: { ...d.innstillinger.delingstallStandard, [type]: verdi },
      },
    }))
  }

  function oppdaterSeniorRegel(id: string, endring: Partial<SeniorRegel>) {
    setData((d) => ({
      ...d,
      innstillinger: {
        ...d.innstillinger,
        seniorRegler: d.innstillinger.seniorRegler.map((r) => (r.id === id ? { ...r, ...endring } : r)),
      },
    }))
  }

  function leggTilSeniorRegel() {
    const ny: SeniorRegel = { id: uuid(), fraAlder: 62, reduksjonTimer: 0 }
    setData((d) => ({
      ...d,
      innstillinger: { ...d.innstillinger, seniorRegler: [...d.innstillinger.seniorRegler, ny] },
    }))
  }

  function slettSeniorRegel(id: string) {
    setData((d) => ({
      ...d,
      innstillinger: {
        ...d.innstillinger,
        seniorRegler: d.innstillinger.seniorRegler.filter((r) => r.id !== id),
      },
    }))
  }

  return (
    <div className="panel">
      <h2>Innstillinger</h2>
      <p className="hjelpetekst advarsel">
        Alle tall under er <strong>eksempelverdier</strong>, ikke fasit fra tariffavtalen. SFS 2213-tallene endres
        ved hvert hovedoppgjør og kan variere lokalt - kontroller og juster mot gjeldende avtaletekst.
      </p>

      <h3>Arbeidsår og undervisningsrammer per trinn</h3>
      <table className="tabell">
        <thead>
          <tr>
            <th>Trinn</th>
            <th>Årsverk (timer, 100%)</th>
            <th>Arbeidsuker/år</th>
            <th>Undervisningsramme (timer, 100%)</th>
            <th>Annen bundet tid (timer/år, 100%)</th>
          </tr>
        </thead>
        <tbody>
          {TRINN_LISTE.map((trinn) => {
            const i = data.innstillinger.trinnInnstillinger[trinn]
            return (
              <tr key={trinn}>
                <td>{TRINN_LABELS[trinn]}</td>
                <td>
                  <input
                    type="number"
                    value={i.arsverkTimerFullStilling}
                    onChange={(e) => oppdaterTrinnInnstilling(trinn, { arsverkTimerFullStilling: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={i.arbeidsukerIAaret}
                    onChange={(e) => oppdaterTrinnInnstilling(trinn, { arbeidsukerIAaret: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={i.undervisningsrammeFullStilling}
                    onChange={(e) =>
                      oppdaterTrinnInnstilling(trinn, { undervisningsrammeFullStilling: Number(e.target.value) })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={i.annenBundetTidPerAar}
                    onChange={(e) => oppdaterTrinnInnstilling(trinn, { annenBundetTidPerAar: Number(e.target.value) })}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h3>Standard delingstall (gruppestørrelse) per fagtype</h3>
      <p className="hjelpetekst">
        Brukes som forslag når nye fag opprettes. Praktiske/estetiske fag bør ha lavere delingstall enn teoretiske
        fag, siden gruppene av naturlige/sikkerhetsmessige grunner må være mindre.
      </p>
      <table className="tabell">
        <thead>
          <tr>
            <th>Fagtype</th>
            <th>Delingstall</th>
          </tr>
        </thead>
        <tbody>
          {FAGTYPER.map((type) => (
            <tr key={type}>
              <td>{FAGTYPE_LABELS[type]}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  value={data.innstillinger.delingstallStandard[type]}
                  onChange={(e) => oppdaterDelingstallStandard(type, Number(e.target.value))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Seniortiltak</h3>
      <p className="hjelpetekst">
        Aldersbaserte reduksjoner i undervisningstid, ofte avtalt lokalt. Legg inn trinnene deres her - de brukes
        som forslag på lærerens side ut fra fødselsår.
      </p>
      <table className="tabell">
        <thead>
          <tr>
            <th>Fra alder</th>
            <th>Reduksjon (timer/år)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.innstillinger.seniorRegler
            .slice()
            .sort((a, b) => a.fraAlder - b.fraAlder)
            .map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    type="number"
                    value={r.fraAlder}
                    onChange={(e) => oppdaterSeniorRegel(r.id, { fraAlder: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={r.reduksjonTimer}
                    onChange={(e) => oppdaterSeniorRegel(r.id, { reduksjonTimer: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <button className="knapp-faresone" onClick={() => slettSeniorRegel(r.id)}>
                    Slett
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <button onClick={leggTilSeniorRegel}>+ Legg til seniorregel</button>
    </div>
  )
}
