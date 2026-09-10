# Driftprov — Render Blueprint V1

**Datum:** 2026-09-10  
**Kod:** `9dc3e113` eller senare  
**Status:** verifierad fram till extern betalningsgrind; inga resurser skapade

## Observerat

- Render-kontot gick att nå och inloggningen via det anslutna GitHub-kontot lyckades.
- Repot `jacobstjarne-code/bandy-manager` var synligt och kunde anslutas som en ny Blueprint-instans.
- Render hittade `render.yaml` på `main` och började planera Blueprinten.
- Planeringen stoppade före skapandet med **Payment Information Required**.
- Render uppgav att Blueprintens tjänster kräver en betalningsmetod. Den timvisa Render Cron-tjänsten saknar gratisplan och medför en minsta månadsdebitering; därför kan hela Blueprinten inte skapas utan kort på kontot.
- Inget kort fylldes i, ingen betalning bekräftades och inga Render-resurser skapades.

## Dom

Jacob valde 2026-09-10 att vänta med kort och använda lösningen utan extra kostnad:

- API och Postgres ligger kvar på Render Free.
- Render Cron är borttagen ur Blueprinten.
- GitHub Actions anropar API:t timvis, på minut 17 för att undvika belastningstoppen vid hel timme.
- Workflowet är avstängt tills repo-variabeln `ATTENTION_SCHEDULER_ENABLED=true` sätts. API-adressen ligger i `ATTENTION_API_URL`; samma `ATTENTION_CRON_SECRET` lagras skyddat i Render och GitHub.

Push ska fortsatt vara släckt med `ATTENTION_PUSH_ENABLED=false` tills Etapp 1B ger sanna kandidater. HTTPS-/enhetsprovet kan göras först efter att ett av alternativen ovan har provisionerat API:t och databasen.

## Konsekvenser av gratisdriften

- GitHub Actions-scheman är inte realtid: körningar kan fördröjas och i hög belastning tappas. Notifieringsmotorn gör därför inga minutexakta löften.
- Render Free Web Service somnar efter 15 minuters inaktivitet och tar omkring en minut att väcka. Timkallet kan få den fördröjningen.
- Render Free Postgres upphör efter 30 dagar, har ingen backup och kan startas om för underhåll. Den är en V1-/mjukreleasemiljö, inte permanent produktion.
- Före databasens dag 30 måste state flyttas eller instansen uppgraderas. Annars blir notifieringsstate otillgängligt och kan senare raderas av Render.
- I ett publikt repo stänger GitHub automatiskt av schemalagda workflows efter 60 dagar utan repoaktivitet. Detta läggs i driftchecklistan.
