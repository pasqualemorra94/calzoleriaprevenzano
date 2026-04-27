# Railway Deployment — Calzoleria Prevenzano

## Overview

| Item | Value |
|---|---|
| **Project** | grateful-illumination |
| **Service** | calzoleria-prevenzano |
| **Framework** | TanStack Start + Nitro (Node 22) |
| **DB** | PostgreSQL (Railway plugin) |
| **Region** | us-east4 (us-east4-eqdc4a) |
| **Domain** | https://calzoleria-prevenzano-production.up.railway.app |
| **Branch** | `site-gen/calzoleria-prevenzano` |
| **Auto-deploy** | Si, su ogni push al branch |

## Architecture

```
GitHub Push → Railway Build (Dockerfile) → Container → Nitro Server :8080
                    │
                    ├── npm install --legacy-peer-deps
                    ├── prisma generate
                    ├── vite build
                    ├── rm -rf .output/public/uploads
                    ├── symlink .output/public/uploads → /data/uploads
                    └── CMD: prisma migrate deploy && node .output/server/index.mjs
```

## Servizi Railway

| Servizio | ID | Ruolo |
|---|---|---|
| calzoleria-prevenzano | `473551b8-acfe-4780-87bf-e477e3c8c07e` | App web (Node 22) |
| Postgres | `592841e5-8966-4206-adcb-e0b452bd54e2` | Database PostgreSQL |

## Volumi

| Mount Path | Volume ID | Uso |
|---|---|---|
| `/data/uploads/` | `15f92bc1-778d-4845-9a1c-46c8b0b648c5` | Media uploadati dal backoffice (persistente tra i deploy) |

## Environment Variables (Railway)

Le env vars sono settate via `railway variables`. Quella che segue e' la lista completa:

### Core

| Variable | Value | Note |
|---|---|---|
| `NODE_ENV` | `production` | |
| `DATABASE_URL` | `postgresql://postgres:zEcdsgSuFtaHuOebaEFcTVaZyqnHPIxT@crossover.proxy.rlwy.net:12215/railway` | URL pubblica del Postgres Railway |
| `BETTER_AUTH_URL` | `https://calzoleria-prevenzano-production.up.railway.app` | |
| `BETTER_AUTH_SECRET` | (dal .env locale) | Min 32 chars |
| `UPLOAD_DIR` | `/data/uploads` | Percorso volume persistente |

### Stripe

| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | (dal .env locale) |
| `STRIPE_PUBLISHABLE_KEY` | (dal .env locale) |
| `STRIPE_WEBHOOK_SECRET` | (dal .env locale) |

### AI

| Variable | Value |
|---|---|
| `OPENAI_API_KEY` | (dal .env locale) |
| `FAL_KEY` | (dal .env locale) |
| `FASHN_API_KEY` | (dal .env locale) |
| `FASHN_API_BASE` | `https://api.fashn.ai/v1` |
| `IMGBB_API_KEY` | (dal .env locale) |

### Email

| Variable | Value |
|---|---|
| `EMAIL_FROM` | `noreply@calzoleriaprevenzano.it` |
| `EMAIL_ADMIN` | `info@calzoleriaprevenzano.it` |
| `SMTP_HOST` | (vuoto — configurare per produzione) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | (vuoto) |
| `SMTP_PASS` | (vuoto) |
| `RESEND_API_KEY` | (vuoto — alternativa a SMTP) |

## Come funziona il media upload

1. Il backoffice carica un file via `POST /api/upload`
2. Il file viene salvato su `/data/uploads/YYYY/MM/filename.ext` (volume persistente)
3. L'URL `/uploads/YYYY/MM/filename.ext` viene salvata nel DB
4. La route `src/routes/uploads.$.tsx` serve i file dal volume a runtime
5. Il volume sopravvive ai redeploy — i media non vengono persi

## Database

- Le migration Prisma girano automaticamente ad ogni deploy (`prisma migrate deploy`)
- Il seed NON gira automaticamente — eseguirlo manualmente se necessario:
  ```
  DATABASE_URL="postgresql://postgres:zEcdsgSuFtaHuOebaEFcTVaZyqnHPIxT@crossover.proxy.rlwy.net:12215/railway" npx prisma db seed
  ```

### Credenziali Admin

| Campo | Valore |
|---|---|
| Email | `admin@calzoleriaprevenzano.it` |
| Password | `Admin123!@#` |

## Dockerfile

Single-stage build (Node 22 Alpine). Usa `npm install --legacy-peer-deps` per risolvere il conflitto zod v3/v4 (better-auth richiede v4, @tanstack/router-generator richiede v3).

Il symlink `.output/public/uploads → /data/uploads` serve i file statici uploadati. La route `uploads.$.tsx` e' un fallback che legge direttamente dal filesystem.

## Problemi risolti durante il setup

| Problema | Causa | Soluzione |
|---|---|---|
| Node 20 troppo vecchio | TanStack Start richiede >=22.12.0 | Upgrade a node:22-alpine |
| `npm ci` falliva | Lock file desincronizzato (chokidar v3 vs v5) | Switch a `npm install` |
| `tsc --noEmit` falliva | Errori TypeScript pre-esistenti | Rimosso dal Dockerfile build |
| `prisma: not found` | Prisma CLI non completo nel runner stage | Single-stage build |
| `coerce.boolean().meta is not a function` | better-auth richiede zod v4, installato v3 | Alias vite `zod` → top-level v4 + `--legacy-peer-deps` |
| Immagini 404 | Nitro `publicAssets` bloccava `/uploads/` | Rimosso config, aggiunta route `uploads.$.tsx` |
| `readFile` crash | Importato da `node:fs` (callback) non `node:fs/promises` | Fix import |
| Delete JSON parse error | 204 No Content + frontend chiama `.json()` | Cambiato a `{ deleted: true }` |
| `DATABASE_URL` non risolta | Reference `${Postgres.DATABASE_URL}` non funzionava | Settato URL pubblica diretta |

## Operazioni comuni

### Deploy manuale
```bash
railway redeploy --yes
```

### Leggere i log
```bash
railway logs            # runtime logs
railway logs --build    # build logs
```

### Cambiare env var
```bash
railway variables set NOME=valore
```

### Seed del database
```bash
DATABASE_URL="postgresql://postgres:zEcdsgSuFtaHuOebaEFcTVaZyqnHPIxT@crossover.proxy.rlwy.net:12215/railway" npx prisma db seed
```

### Aggiornare il DOMAIN dopo deploy
Se cambi il dominio Railway, ricordati di aggiornare:
1. `BETTER_AUTH_URL` nella variabile Railway
2. Stripe webhook URL nel dashboard Stripe

## Miglioramenti futuri

- [ ] Cambiare regione da us-east4 a eu-west4 (riduce latenza per utenti italiani)
- [ ] Configurare SMTP/Resend per email transazionali
- [ ] Switch a Stripe live mode (cambiare chiavi)
- [ ] Aggiungere custom domain (es. calzoleriaprevenzano.it)
- [ ] Cloud Storage (S3/R2) come alternativa al volume Railway per media
