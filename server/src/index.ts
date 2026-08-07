import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { authRuter } from './routes/auth.js'
import { skoledataRuter } from './routes/skoledata.js'
import { brukereRuter } from './routes/brukere.js'
import { adminRuter } from './routes/admin.js'
import { betalingRuter } from './routes/betaling.js'
import { tilbakemeldingerRuter } from './routes/tilbakemeldinger.js'
import { autentiser, blokkerDemoSkriving, kreverAktivLisens } from './middleware.js'
import { APP_URL } from './stripe.js'
import { seedDemoKonto } from './seedDemo.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 3001)
const KLIENT_DIST = join(__dirname, '..', '..', 'dist')

const app = express()
app.disable('x-powered-by')
app.use(helmet())
// Frontend kan kjøre på en annen origin (f.eks. Netlify) enn API-et (Render) - tillat den med cookies.
app.use(cors({ origin: APP_URL, credentials: true }))
// Stripe-webhook trenger rå body for signaturverifisering - må registreres FØR express.json().
app.use('/api/betaling/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.use('/api/auth', authRuter)
app.use('/api/skoledata', autentiser, blokkerDemoSkriving, kreverAktivLisens, skoledataRuter)
app.use('/api/brukere', autentiser, blokkerDemoSkriving, kreverAktivLisens, brukereRuter)
app.use('/api/tilbakemeldinger', tilbakemeldingerRuter)
app.use('/api/betaling', betalingRuter)
app.use('/api/admin', adminRuter)

app.get('/api/helse', (req, res) => {
  res.json({ status: 'ok' })
})

if (existsSync(KLIENT_DIST)) {
  app.use(express.static(KLIENT_DIST))
  app.get(/(.*)/, (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next()
      return
    }
    res.sendFile(join(KLIENT_DIST, 'index.html'))
  })
}

seedDemoKonto()
  .catch((feil) => console.error('Klarte ikke å seede demo-konto:', feil))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Timeplan-server kjører på http://localhost:${PORT}`)
    })
  })
