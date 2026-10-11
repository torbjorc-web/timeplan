import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { nb } from './nb'
import { en } from './en'
import type { Dictionary } from './dictionary'
import { I18nContext, type Sprak } from './i18nContextCore'

const ORDBOKER: Record<Sprak, Dictionary> = { nb, en }
const LAGRINGSNOKKEL = 'timeplan-sprak'

function lastLagretSprak(): Sprak {
  const lagret = typeof localStorage !== 'undefined' ? localStorage.getItem(LAGRINGSNOKKEL) : null
  return lagret === 'en' ? 'en' : 'nb'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [sprak, setSprakState] = useState<Sprak>(lastLagretSprak)

  // Hold <html lang> i synk med valgt språk (skjermlesere, orddeling og nettleserens oversettelsesforslag).
  useEffect(() => {
    document.documentElement.lang = sprak
  }, [sprak])

  const setSprak = useCallback((nytt: Sprak) => {
    setSprakState(nytt)
    localStorage.setItem(LAGRINGSNOKKEL, nytt)
  }, [])

  const value = useMemo(() => ({ sprak, setSprak, t: ORDBOKER[sprak] }), [sprak, setSprak])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}


