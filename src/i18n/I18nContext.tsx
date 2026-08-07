import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { nb } from './nb'
import { en } from './en'
import type { Dictionary } from './dictionary'

export type Sprak = 'nb' | 'en'

const ORDBOKER: Record<Sprak, Dictionary> = { nb, en }
const LAGRINGSNOKKEL = 'timeplan-sprak'

interface I18nContextType {
  sprak: Sprak
  setSprak: (sprak: Sprak) => void
  t: Dictionary
}

const I18nContext = createContext<I18nContextType | null>(null)

function lastLagretSprak(): Sprak {
  const lagret = typeof localStorage !== 'undefined' ? localStorage.getItem(LAGRINGSNOKKEL) : null
  return lagret === 'en' ? 'en' : 'nb'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [sprak, setSprakState] = useState<Sprak>(lastLagretSprak)

  const setSprak = useCallback((nytt: Sprak) => {
    setSprakState(nytt)
    localStorage.setItem(LAGRINGSNOKKEL, nytt)
  }, [])

  const value = useMemo(() => ({ sprak, setSprak, t: ORDBOKER[sprak] }), [sprak, setSprak])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n må brukes inne i I18nProvider')
  return ctx
}
