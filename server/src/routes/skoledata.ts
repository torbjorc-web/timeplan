import { Router } from 'express'
import { hentBrukere, hentSkoledata, lagreSkoledata } from '../store.js'
import { kreverRolle } from '../middleware.js'
import type { MinimalAppData } from '../types.js'

export const skoledataRuter = Router()

function erObjekt(verdi: unknown): verdi is Record<string, unknown> {
  return typeof verdi === 'object' && verdi !== null && !Array.isArray(verdi)
}

function erGyldigAppData(verdi: unknown): verdi is MinimalAppData {
  if (!erObjekt(verdi)) return false
  if (typeof verdi.aktivtSkoleaar !== 'string' || !erObjekt(verdi.skoleaar)) return false
  return Object.values(verdi.skoleaar).every(erObjekt)
}

function tomAppData(): MinimalAppData {
  return { aktivtSkoleaar: '', skoleaar: {} }
}

function filtrerForLaerer(data: MinimalAppData, laererId: string | undefined): MinimalAppData {
  if (!laererId) return { aktivtSkoleaar: data.aktivtSkoleaar, skoleaar: {} }
  const filtrertSkoleaar: MinimalAppData['skoleaar'] = {}
  for (const [aar, sd] of Object.entries(data.skoleaar)) {
    filtrertSkoleaar[aar] = {
      ...sd,
      laerere: (sd.laerere ?? []).filter((l) => l.id === laererId),
      timeplan: (sd.timeplan ?? []).filter((t) => t.laererId === laererId),
    }
  }
  return { aktivtSkoleaar: data.aktivtSkoleaar, skoleaar: filtrertSkoleaar }
}

skoledataRuter.get('/', async (req, res) => {
  const bruker = req.bruker!
  const data = ((await hentSkoledata(bruker.tenantId)) as MinimalAppData | null) ?? tomAppData()
  if (bruker.rolle === 'laerer') {
    const brukere = await hentBrukere()
    const fullBruker = brukere.find((b) => b.id === bruker.brukerId)
    res.json(filtrerForLaerer(data, fullBruker?.laererId))
    return
  }
  res.json(data)
})

skoledataRuter.put('/', kreverRolle('avdelingsleder'), async (req, res) => {
  const bruker = req.bruker!
  if (!erGyldigAppData(req.body)) {
    res.status(400).json({ feil: 'Ugyldig format på skoledata.' })
    return
  }
  await lagreSkoledata(bruker.tenantId, req.body)
  res.json({ ok: true })
})
