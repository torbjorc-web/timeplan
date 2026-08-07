const BASE = '/api'

export class ApiFeil extends Error {}

async function kall<T>(sti: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${sti}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    let melding = `Feil (${res.status})`
    try {
      const kropp = (await res.json()) as { feil?: string }
      if (kropp.feil) melding = kropp.feil
    } catch {
      /* ignorer - bruker standardmelding */
    }
    throw new ApiFeil(melding)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function apiGet<T>(sti: string): Promise<T> {
  return kall<T>(sti)
}

export function apiPost<T>(sti: string, body?: unknown): Promise<T> {
  return kall<T>(sti, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined })
}

export function apiPut<T>(sti: string, body: unknown): Promise<T> {
  return kall<T>(sti, { method: 'PUT', body: JSON.stringify(body) })
}

export function apiDelete<T>(sti: string): Promise<T> {
  return kall<T>(sti, { method: 'DELETE' })
}
