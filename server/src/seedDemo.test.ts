import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tenant } from './types.js'

vi.mock('./store.js', () => ({
  finnBrukerVedBrukernavn: vi.fn(),
  leggTilBruker: vi.fn(),
  oppdaterTenant: vi.fn(),
  opprettTenant: vi.fn(),
}))

const store = await import('./store.js')
const seedDemoModul = await import('./seedDemo.js')
const { seedDemoKonto, DEMO_BRUKERNAVN } = seedDemoModul

function lagTenant(): Tenant {
  return {
    id: 'demo-tenant',
    navn: 'Demo-avdeling',
    opprettet: new Date().toISOString(),
    lisensstatus: 'proveperiode',
    proveperiodeSlutt: new Date().toISOString(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('seedDemoKonto', () => {
  it('oppretter demo-tenant og -bruker hvis den ikke finnes', async () => {
    vi.mocked(store.finnBrukerVedBrukernavn).mockResolvedValue(undefined)
    vi.mocked(store.opprettTenant).mockResolvedValue(lagTenant())

    await seedDemoKonto()

    expect(store.opprettTenant).toHaveBeenCalledWith('Demo-avdeling')
    expect(store.leggTilBruker).toHaveBeenCalledWith(
      expect.objectContaining({ brukernavn: DEMO_BRUKERNAVN, rolle: 'avdelingsleder' }),
    )
    expect(seedDemoModul.demoTenantId).toBe('demo-tenant')
  })

  it('fornyer prøveperioden og oppretter ikke demo-brukeren på nytt', async () => {
    vi.mocked(store.finnBrukerVedBrukernavn).mockResolvedValue({
      id: '1',
      tenantId: 'demo-tenant',
      brukernavn: DEMO_BRUKERNAVN,
      passordHash: 'hash',
      rolle: 'avdelingsleder',
      navn: 'Demo',
      opprettet: new Date().toISOString(),
    })

    await seedDemoKonto()

    expect(store.opprettTenant).not.toHaveBeenCalled()
    expect(store.leggTilBruker).not.toHaveBeenCalled()
    expect(store.oppdaterTenant).toHaveBeenCalledWith(
      'demo-tenant',
      expect.objectContaining({
        proveperiodeSlutt: expect.any(String),
      }),
    )
    expect(seedDemoModul.demoTenantId).toBe('demo-tenant')
  })
})
