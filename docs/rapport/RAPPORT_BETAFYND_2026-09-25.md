# Betafynd 2–9 åtgärdade — 2026-09-25

Underlag: Opus kodgranskning av betaflödet 2026-09-22 (tio fynd). Fynd 1
(gratis-Postgres upphör 2026-10-10) och fynd 10 (MASTER_OPPET) ingår inte här.

| Fynd | Åtgärd | Fil |
|---|---|---|
| 2 Grinden väntar utan gräns på kallstart, ingen offlinestart | Tillträdet cachas per installation; spelaren släpps in direkt och servern kontrolleras i bakgrunden. Efter 4 s: "Servern vaknar…". Tidsgräns 75 s. | `attentionClient.ts`, `BetaInviteGate.tsx` |
| 3 iOS: kod bränns i Safari-fliken | Grinden upptäcker Safari-flik på iOS och säger åt spelaren att lägga spelet på hemskärmen först. Server oförändrad. | `BetaInviteGate.tsx` |
| 4 Permanent utelåsning | 90-dagarsgallringen sparar id + tokenhash på inbjudan; samma id med samma token återfår tillträdet vid omregistrering. Uttrycklig avregistrering återkallar fortfarande (kontraktet i `pushLifecycle.test.js` orört). | `postgresStore.js`, `store.js` |
| 5 32-teckenskoder på mobil | Nya koder: tio tecken Crockford base32, visade `XXXXX-XXXXX`, skiftlägesokänsliga, O/I/L läses som 0/1/1. Gamla koder fungerar. | `routes.js`, `attentionClient.ts` |
| 6 Fel domän i delningsbilder | `bandy-manager.se` | `matchShareImage.ts`, `seasonShareImage.ts` |
| 7 Förhandskoden i klartext i bunten | Borttagen ur källan; skrivs in i adminvyn och sparas bara i admin-webbläsaren. Sms/mejl går inte att kopiera utan den. **Koden finns kvar i git-historiken och i nuvarande bunt — byt förhandskod (hashen i `public/landing/landing.js`).** | `BetaStatsScreen.tsx` |
| 8 Delad rate limit bakom Vercel | **Öppet.** Oberoende granskning visade att `trust proxy 2` låter den som anropar Render direkt välja egen hink via X-Forwarded-For. Kvar på 1; kräver mätning av `req.ips` i drift och en nyckel bara Vercel kan sätta. | `server.js` (kommentar) |
| 9 STARTA KARRIÄREN primär trots sparfil | Med sparfil: FORTSÄTT KARRIÄREN primär, NY KARRIÄR sekundär. | `IntroSequence.tsx` |

Oberoende granskning (separat agent) gav fem anmärkningar; rättade: gallringen låser sina rader och avregistrering stryker vilande spår (fynd 4), hängande kontroll avbryts med AbortSignal så FÖRSÖK IGEN gör nytt anrop (fynd 2), förhandskoden krävs (fynd 7), trust proxy återställd (fynd 8).

Verifiering: tsc grönt, `npm run build` med alla lint-grindar grönt, hela
sviten 613 filer / 5 476 tester grönt. Grinden kontrollerad i Chromium vid
390 px med iPhone-UA och fördröjt API-svar (väntetext, Safari-rad, ingen
horisontell scroll). Introt inte sett i browser med sparfil.

Kvar: fynd 8 (se ovan), fynd 1 (Postgres-flytt före 2026-10-10), fynd 10 (MASTER_OPPET-raderna
`beta-inbjudningar-anvandare`/`beta-statistikvy` säger att betakoden inte är
committad — den är det, 7155f4ec/823b1a60), ny förhandskod.
