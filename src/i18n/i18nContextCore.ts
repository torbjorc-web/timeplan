import { createContext } from 'react'
import type { Dictionary } from './dictionary'

export type Sprak = 'nb' | 'en'

export interface I18nContextType {
  sprak: Sprak
  setSprak: (sprak: Sprak) => void
  t: Dictionary
}

export const I18nContext = createContext<I18nContextType | null>(null)
