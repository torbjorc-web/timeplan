import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { apiGet, apiPost } from './api'
import { AuthContext, type Bruker } from './authContextCore'

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
