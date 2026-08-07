import type { PanelProps } from './PanelProps'
import { uuid } from '../defaults'
import type { FagType, LeseplikttInnstilling, Regelverk, SeniorRegel, Trinn, TrinnInnstilling } from '../types'
import { useI18n } from '../i18n/I18nContext'

const TRINN_LISTE: Trinn[] = ['barnetrinn', 'ungdomstrinn', 'videregaende']
const FAGTYPER: FagType[] = ['teoretisk', 'praktisk-estetisk', 'kroppsoving', 'valgfag', 'annet']
const REGELVERK_LISTE: Regelverk[] = ['arsramme', 'leseplikt_uke']

export function InnstillingerPanel({ data, setData }: PanelProps) {
  const { t } = useI18n()

  function oppdaterRegelverk(regelverk: Regelverk) {
    setData((d) => ({ ...d, innstillinger: { ...d.innstillinger, regelverk } }))
  }

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

  function oppdaterLeseplikttInnstilling(trinn: Trinn, endring: Partial<LeseplikttInnstilling>) {
    setData((d) => ({
      ...d,
      innstillinger: {
        ...d.innstillinger,
        leseplikttInnstillinger: {
          ...d.innstillinger.leseplikttInnstillinger,
          [trinn]: { ...d.innstillinger.leseplikttInnstillinger[trinn], ...endring },
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

  const regelverk = data.innstillinger.regelverk

  return (
    <div className="panel">
      <h2>{t.innstillinger.heading}</h2>
      <p className="hjelpetekst advarsel">{t.innstillinger.advarselTekst}</p>

      <h3>{t.innstillinger.regelverkHeading}</h3>
      <p className="hjelpetekst">{t.innstillinger.regelverkHjelpetekst}</p>
      <select value={regelverk} onChange={(e) => oppdaterRegelverk(e.target.value as Regelverk)}>
        {REGELVERK_LISTE.map((r) => (
          <option key={r} value={r}>
            {t.regelverk[r]}
          </option>
        ))}
      </select>

      {regelverk === 'arsramme' ? (
        <>
          <h3>{t.innstillinger.arsrammeHeading}</h3>
          <table className="tabell">
            <thead>
              <tr>
                <th>{t.innstillinger.kolonner.trinn}</th>
                <th>{t.innstillinger.kolonner.arsverkTimer}</th>
                <th>{t.innstillinger.kolonner.arbeidsuker}</th>
                <th>{t.innstillinger.kolonner.undervisningsramme}</th>
                <th>{t.innstillinger.kolonner.annenBundetTid}</th>
              </tr>
            </thead>
            <tbody>
              {TRINN_LISTE.map((trinn) => {
                const i = data.innstillinger.trinnInnstillinger[trinn]
                return (
                  <tr key={trinn}>
                    <td>{t.trinn[trinn]}</td>
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
        </>
      ) : (
        <>
          <h3>{t.innstillinger.leseplikttHeading}</h3>
          <table className="tabell">
            <thead>
              <tr>
                <th>{t.innstillinger.kolonner.trinn}</th>
                <th>{t.innstillinger.kolonner.leseplikttimerUke}</th>
                <th>{t.innstillinger.kolonner.timeLengde}</th>
              </tr>
            </thead>
            <tbody>
              {TRINN_LISTE.map((trinn) => {
                const i = data.innstillinger.leseplikttInnstillinger[trinn]
                return (
                  <tr key={trinn}>
                    <td>{t.trinn[trinn]}</td>
                    <td>
                      <input
                        type="number"
                        value={i.leseplikttimerUke}
                        onChange={(e) => oppdaterLeseplikttInnstilling(trinn, { leseplikttimerUke: Number(e.target.value) })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={i.timeLengdeMinutter}
                        onChange={(e) => oppdaterLeseplikttInnstilling(trinn, { timeLengdeMinutter: Number(e.target.value) })}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      <h3>{t.innstillinger.delingstallHeading}</h3>
      <p className="hjelpetekst">{t.innstillinger.delingstallHjelpetekst}</p>
      <table className="tabell">
        <thead>
          <tr>
            <th>{t.innstillinger.delingstallKolonner.fagtype}</th>
            <th>{t.innstillinger.delingstallKolonner.delingstall}</th>
          </tr>
        </thead>
        <tbody>
          {FAGTYPER.map((type) => (
            <tr key={type}>
              <td>{t.fagtype[type]}</td>
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

      <h3>{t.innstillinger.seniorHeading}</h3>
      <p className="hjelpetekst">{t.innstillinger.seniorHjelpetekst}</p>
      <table className="tabell">
        <thead>
          <tr>
            <th>{t.innstillinger.seniorKolonner.fraAlder}</th>
            <th>{t.innstillinger.seniorKolonner.reduksjon}</th>
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
                    {t.innstillinger.slett}
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <button onClick={leggTilSeniorRegel}>{t.innstillinger.leggTilSeniorregel}</button>
    </div>
  )
}
