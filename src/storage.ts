import type { AppData } from './types'
import { apiGet, apiPut } from './api'

export async function lastInnData(): Promise<AppData> {
  return apiGet<AppData>('/skoledata')
}

export async function lagreData(data: AppData): Promise<void> {
  await apiPut('/skoledata', data)
}

export function eksporterSomFil(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `timeplan-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importerFraFil(fil: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData
        if (!parsed.aktivtSkoleaar || !parsed.skoleaar) throw new Error('Filen ser ikke ut som en gyldig backup.')
        resolve(parsed)
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Kunne ikke lese filen'))
      }
    }
    reader.onerror = () => reject(new Error('Kunne ikke lese filen'))
    reader.readAsText(fil)
  })
}
