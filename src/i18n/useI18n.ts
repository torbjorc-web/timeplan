import { useContext } from 'react'
import { I18nContext, type I18nContextType } from './i18nContextCore'

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n må brukes inne i I18nProvider')
  return ctx
}
