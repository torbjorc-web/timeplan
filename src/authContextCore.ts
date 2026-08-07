import { createContext } from 'react'
import type { Rolle } from './types'

export interface Bruker {
  navn: string
  rolle: Rolle
  laererId?: string
  lisensstatus?: 'proveperiode' | 'aktiv' | 'sperret'
  proveperiodeSlutt?: string
}

export interface AuthContextType {
  bruker: Bruker | null
  laster: boolean
  loggInn: (brukernavn: string, passord: string) => Promise<void>
  registrerAvdeling: (avdelingNavn: string, brukernavn: string, passord: string, navn: string) => Promise<void>
  loggUt: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)
