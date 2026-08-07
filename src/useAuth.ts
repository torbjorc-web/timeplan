import { useContext } from 'react'
import { AuthContext, type AuthContextType } from './authContextCore'

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth må brukes inne i AuthProvider')
  return ctx
}
