import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiGet, apiPost, ApiFeil } from './api'
import type { Rolle } from './types'

export interface Bruker {
  navn: string
  rolle: Rolle
  laererId?: string
  lisensstatus?: 'proveperiode' | 'aktiv' | 'sperret'
  proveperiodeSlutt?: string
}

interface AuthContextType {
  bruker: Bruker | null
  laster: boolean
  loggInn: (brukernavn: string, passord: string) => Promise<void>
  registrerAvdeling: (avdelingNavn: string, brukernavn: string, passord: string, navn: string) => Promise<void>
  loggUt: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [bruker, setBruker] = useState<Bruker | null>(null)
  const [laster, setLaster] = useState(true)

  useEffect(() => {
    apiGet<Bruker>('/auth/meg')
      .then(setBruker)
      .catch(() => setBruker(null))
      .finally(() => setLaster(false))
  }, [])

  const loggInn = useCallback(async (brukernavn: string, passord: string) => {
    const svar = await apiPost<Bruker>('/auth/login', { brukernavn, passord })
    setBruker(svar)
  }, [])

  const registrerAvdeling = useCallback(
    async (avdelingNavn: string, brukernavn: string, passord: string, navn: string) => {
      const svar = await apiPost<Bruker>('/auth/registrer-avdeling', { avdelingNavn, brukernavn, passord, navn })
      setBruker(svar)
    },
    [],
  )

  const loggUt = useCallback(async () => {
    await apiPost('/auth/logout')
    setBruker(null)
  }, [])

  return (
    <AuthContext.Provider value={{ bruker, laster, loggInn, registrerAvdeling, loggUt }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth må brukes inne i AuthProvider')
  return ctx
}

export { ApiFeil }
