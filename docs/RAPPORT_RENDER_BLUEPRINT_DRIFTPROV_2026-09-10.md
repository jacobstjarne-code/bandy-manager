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

## Nästa dom

API och Postgres kan ligga kvar på Render i båda alternativen:

1. Behåll Render Cron enligt ursprungsplanen. Jacob lägger själv in betalningsmetod och återupptar Blueprint-synken.
2. Ersätt enbart timschedulern med GitHub Actions. Då undviks Render Crons kostnad, men samma cron-hemlighet måste konfigureras som en skyddad secret i både Render och GitHub.

Push ska fortsatt vara släckt med `ATTENTION_PUSH_ENABLED=false` tills Etapp 1B ger sanna kandidater. HTTPS-/enhetsprovet kan göras först efter att ett av alternativen ovan har provisionerat API:t och databasen.

