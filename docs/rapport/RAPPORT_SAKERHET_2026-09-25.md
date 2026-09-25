# Säkerhetsgenomgång i drift — 2026-09-25

Tre oberoende granskningar (server, klient, infrastruktur/historik/CI) plus
en granskning av rättelserna. Livehuvuden kunde inte läsas (nätverksspärr i
granskningsmiljön); allt nedan bygger på koden och lokala prov.

## Rättat i denna commit

| Fynd | Allvar | Rättelse |
|---|---|---|
| Lagrad XSS via importerad sparfil (namn in i `dangerouslySetInnerHTML`) | medel–hög | `escapeHtml` på alla sparfilsvärden i anslag, söndagsträning, SM-/cupfinal. Test. |
| Inga säkerhetsheaders på SPA:n (CSP, klickkapning) | medel | CSP, X-Frame-Options, nosniff, Referrer-, Permissions-Policy, HSTS i `vercel.json` och `render.yaml`. Provat i Chromium: noll CSP-brott, API på onrender.com nås. |
| SSRF via push-endpoint | hög (vilande, push avstängd) | Endast kända push-tjänster (`server/attention/pushEndpoint.js`), både vid registrering och utskick. Test. |
| Väntelistan avslöjar vilka adresser som står i kön (409) | medel | Alltid 200. |
| Push utan timeout kan hänga cronen | medel | 10 s timeout. |
| Bandy Brain: LLM-text in i Astro-mall kan köra kod vid bygget | medel | `{ } "` neutraliseras; index-strängar JSON-escapas; titlar avkodas vid omläsning. |
| CI: workflow-indata interpolerat i skript; app-ci utan behörighetsgräns | låg | Indata via env med validering; `permissions: contents: read`. |
| Mockup med claude.ai-kontouppgifter (UUID:n) | låg | Blocket borttaget (finns kvar i historiken). |

## Omvärderat
- **Rate limit kringgås via X-Forwarded-For:** provet gjordes utan Renders edge.
  Spelet anropar Render direkt, där edgen lägger till klientens IP sist, så
  `trust proxy 1` ger rätt IP. Betafynd 8 avgjort; se kommentar i `server.js`.

## Kvar — kräver beslut
1. **Domarnamn i publikt repo** (`docs/data/bandygrytan_detailed.json`, ~335 namn,
   plus analysdokument). Strider mot projektets egen regel. Kräver borttagning ur
   trädet och omskrivning av historiken (`git filter-repo`) — påverkar alla kloner.
2. **Förhandskoden `slottsbron1945`** är publik (historik + bunt). Välj ny.
3. **Bandy Brains lösenordsgrind** skyddar inte innehållet, som ligger i klartext
   i repot; `bandy-brain-deploy.yml` publicerar till GitHub Pages utan grind.
   Antingen privat repo eller acceptera att det är publikt.
4. **Klientgrindarna** (landning, beta) är kosmetiska; allt spel finns i bunten.
   Medvetet val för en sluten beta, inte ett fel.
5. **`qs`-sårbarhet (måttlig) i express** — `npm audit fix` på Macen, där npm-
   versionen matchar låsfilen.
6. **DB-fyllnad** (väntelista, installationer, analytics) begränsas bara av
   globala 100/min per IP. Räcker för betan; tak/captcha före öppen lansering.
7. **Cronhemlighetens längd** kontrolleras inte (admin kräver ≥32). Kontrollera
   i Render att den är lång.

## Inga fynd
SQL-injektion, IDOR, konstanttidsjämförelse av hemligheter, CORS, hemligheter
i git-historiken (3 202 commits, alla grenar), hemligheter i bunten, service
workerns cache, öppna omdirigeringar, postMessage, prototype pollution.
