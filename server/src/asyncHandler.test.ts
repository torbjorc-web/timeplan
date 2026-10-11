import express from 'express'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { asyncHandler, feilHaandterer } from './asyncHandler.js'

function lagApp() {
  const app = express()
  app.use(express.json())
  app.get(
    '/feiler',
    asyncHandler(async () => {
      throw new Error('hemmelig intern detalj')
    }),
  )
  app.get(
    '/ok',
    asyncHandler(async (_req, res) => {
      res.json({ ok: true })
    }),
  )
  app.post('/json', (_req, res) => {
    res.json({ ok: true })
  })
  app.use(feilHaandterer)
  return app
}

describe('asyncHandler + feilHaandterer', () => {
  afterEach(() => vi.restoreAllMocks())

  it('gir 500 uten interne detaljer når en async-handler kaster', async () => {
    const logg = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = await request(lagApp()).get('/feiler')
    expect(res.status).toBe(500)
    expect(JSON.stringify(res.body)).not.toContain('hemmelig')
    expect(logg).toHaveBeenCalled()
  })

  it('slipper vellykkede svar uendret gjennom', async () => {
    const res = await request(lagApp()).get('/ok')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('gir 400 (ikke 500) ved ugyldig JSON i request-body', async () => {
    const res = await request(lagApp()).post('/json').set('Content-Type', 'application/json').send('{ikke json')
    expect(res.status).toBe(400)
  })
})
