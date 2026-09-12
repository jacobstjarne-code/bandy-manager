# Driftprov — Render Blueprint V1

**Datum:** 2026-09-10

**Backendkod:** `ab667ccd`

**Frontenddeploy:** Vercel `dpl_A4hQrLCB7VaF6aDBVycFxQwpNUBJ`

**Status:** grön V1-drift på gratisnivå; pushleverans medvetet avstängd

## Observerat

- Render-kontot och det anslutna repot `jacobstjarne-code/bandy-manager` gick att nå.
- Den första Blueprint-planen stoppades av **Payment Information Required** eftersom Render Cron saknar gratisplan. Inget kort fylldes i och ingen betalning bekräftades.
- Render Cron togs bort. `.github/workflows/attention-scheduler.yml` kör i stället timvis på minut 17 via GitHub Actions.
- Blueprinten `bandy-manager-attention` skapade `bandy-manager-attention-db` och `bandy-manager-attention-api` på Render Free.
- Första API-bygget föll eftersom `NODE_ENV=production` fick `npm install` att utelämna projektets `devDependencies`; Render föll då igenom till en global, inkompatibel TypeScript-binär. `ab667ccd` rotfixade byggkontraktet till `npm ci --include=dev`, varefter deployen blev **Live**.
- API-adress: `https://bandy-manager-attention-api.onrender.com`.
- GitHub har krypterad `ATTENTION_CRON_SECRET` samt variablerna `ATTENTION_API_URL` och `ATTENTION_SCHEDULER_ENABLED=true`.
- Manuellt scheduler-prov: GitHub Actions run `34444465657`, **Success**, 7 sekunder.
- Vercel Production har `VITE_ATTENTION_API_BASE` satt till Render-API:t. Aktuell `main` publicerades från en ren checkout och aliasades till `https://bandy-manager.vercel.app`.
- Den publicerade bundlen innehåller både Render-adressen och deploy-hashen `ab667cc`.

## HTTPS- och säkerhetsprov

- `GET /api/health` → `200`, `{ "status": "ok", "version": "0.3.0" }`.
- Samma hälsokontroll med origin `https://bandy-manager.vercel.app` → `Access-Control-Allow-Origin` exakt för livefrontenden.
- `GET /api/notifications/vapid-public-key` → `503`, `{ "configured": false }`: push är släckt som beslutat.
- Osignerat `POST /api/attention/run` → `401`, `{ "error": "unauthorized" }`.
- Signerat anrop genom GitHub Actions → grönt.

## Dom

Gratisupplägget är tillräckligt för den nuvarande mjukreleasen med Jacob och Erik. Push ska fortsatt vara släckt med `ATTENTION_PUSH_ENABLED=false` tills Etapp 1B ger sanna kandidater. Timkörningen är aktiv, men skapar inga pushmeddelanden i detta läge.

## Konsekvenser av gratisdriften

- GitHub Actions-scheman är inte realtid: körningar kan fördröjas och i hög belastning tappas. Notifieringsmotorn gör därför inga minutexakta löften.
- Render Free Web Service somnar efter 15 minuters inaktivitet och kan ta 50 sekunder eller mer att väcka. Timkallet får bära den fördröjningen.
- Render Free Postgres upphör 30 dagar efter skapandet och saknar backup. Den här databasen skapades 2026-09-10; flytt eller uppgradering måste därför planeras före 2026-10-10.
- Om databasen får upphöra blir notifieringsstate först otillgängligt och kan därefter raderas av Render.
- I ett publikt repo stänger GitHub automatiskt av schemalagda workflows efter 60 dagar utan repoaktivitet. Detta hör hemma i driftchecklistan.
