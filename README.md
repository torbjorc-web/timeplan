# Timeplan - årsplan/timeplanverktøy (SFS 2213)

Verktøy for avdelingsleder til å lage årsplan og ukentlig timeplan for undervisningspersonale, basert på strukturen i SFS 2213. Multi-tenant webapp (flere skoler/avdelinger, hver med egne data), med roller for avdelingsleder, lærer, rektor og en global superadmin.

Frontend: Vite + React + TypeScript (repo-rot). Backend: Node.js + Express + TypeScript (`/server`), fil-basert JSON-lagring.

## Oppsett

```powershell
# Frontend-avhengigheter (repo-rot)
npm install

# Backend-avhengigheter
cd server
npm install
cd ..
```

## Miljøvariabler (server/.env)

Opprett `server/.env` (ikke commit denne filen - den er i `.gitignore`):

```env
JWT_SECRET=en-lang-tilfeldig-hemmelig-streng
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRIS_ID=price_...
APP_URL=http://localhost:5173
```

- `JWT_SECRET` er **påkrevd i produksjon** (`NODE_ENV=production`). I utvikling brukes en innebygd standardverdi hvis den mangler.
- Stripe-variablene er kun nødvendig for å teste/bruke "Kjøp lisens"-knappen og lisens-webhooken. Uten dem gir betalingsrutene en tydelig 503-feil, resten av appen fungerer som normalt (nye avdelinger får 30 dagers prøveperiode automatisk).
- **Vipps er ikke implementert.** Dette krever en signert Vipps-merchant-avtale og egne sertifikater/klient-ID som ikke kan settes opp uten dine egne Vipps-credentials. Legg det til senere via Vipps sitt ePayment-API når avtalen er på plass - samme mønster som Stripe-integrasjonen (egen rute + webhook som oppdaterer `tenant.lisensstatus`).

### Sette opp Stripe lokalt

1. Opprett et produkt/abonnement i [Stripe Dashboard](https://dashboard.stripe.com/) (test-modus), kopier pris-ID-en til `STRIPE_PRIS_ID`.
2. Bruk [Stripe CLI](https://stripe.com/docs/stripe-cli) til å videresende webhooks lokalt: `stripe listen --forward-to localhost:3001/api/betaling/webhook`. CLI-en gir deg en `whsec_...`-verdi til `STRIPE_WEBHOOK_SECRET`.

## Opprette superadmin-bruker

Superadmin er en global konto (ser alle skoler, innlogginger og tilbakemeldinger, kan frigi/sperre lisenser) og kan **ikke** opprettes via registreringsskjemaet i appen. Kjør i stedet:

```powershell
cd server
npm run create-superadmin
```

Scriptet spør om brukernavn, navn og passord i terminalen.

## Kjøre i utvikling

Kjør frontend og backend samtidig fra repo-rot:

```powershell
npm run dev:full
```

Dette starter Vite dev-server (`http://localhost:5173`) og Express-serveren (`http://localhost:3001`) samtidig. Vite er satt opp med proxy slik at `/api/*`-kall fra frontend videresendes til backend automatisk.

Alternativt, i to separate terminaler:

```powershell
npm run dev            # frontend
npm run dev:server     # backend
```

## Bygge for produksjon

```powershell
npm run build           # bygger frontend til dist/
cd server
npm run build           # kompilerer backend til server/dist/
npm start                # kjører den bygde serveren, serverer også frontend fra ../dist
```

Serveren kjører på samme origin for både API og statiske filer i produksjon (unngår CORS).

## Roller

| Rolle | Tilgang |
| --- | --- |
| avdelingsleder | Full lese/skrive-tilgang til egen avdelings data, oppretter lærer-/rektor-kontoer, kjøper lisens |
| laerer | Kun lesetilgang til egen årsplan/timeplan |
| rektor | Kun lesetilgang til hele avdelingens data |
| superadmin | Global oversikt over alle skoler, innloggingslogg, tilbakemeldinger, kan frigi/sperre lisenser |

## Lisens/prøveperiode

Nye avdelinger som registrerer seg får 30 dagers prøveperiode med full tilgang. Etter det må avdelingsleder kjøpe lisens (Stripe Checkout) eller vente på at superadmin frigir tilgangen manuelt. Superadmin kan når som helst sperre eller frigi en avdeling fra admin-panelet, uavhengig av Stripe-status.

## Funksjoner

- Årsplan/timeplan-beregning etter SFS 2213-struktur (justerbare eksempelverdier, ikke fasit-tall - kontroller mot gjeldende avtale i Innstillinger)
- Praktisk-estetiske fag med egne delingstall, kobling Kroppsøving+valgfag
- Individuelle justeringer per lærer (kontaktlærer, tillitsvalgt, seniortiltak, annet)
- Ukentlig timeplan med konfliktsjekk for rom/lærer/klasse
- CSV-eksport (Excel-vennlig) for årsplan og timeplan
- Installerbar som PWA (app-lignende opplevelse i nettleser, uten Electron/React Native)
- Tilbakemeldingsboks til superadmin fra avdelingsledere

## Lisens (kildekode)

Denne koden er proprietær - se [LICENSE](LICENSE). Repoet er offentlig synlig, men koden kan kun brukes av rettighetshaver eller de som har fått uttrykkelig tillatelse.
