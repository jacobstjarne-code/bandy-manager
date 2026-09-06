# BESLUTSUNDERLAG — backend och push till mjuk release

**2026-09-06 · Opus · beställt av Jacob ("ta hand om backend + notifieringsmaskinen") · underlag för Block 5**

Läget (ur `IMPLEMENTATION_STICKINESS_NOTIFIERINGAR_2026-09-04.md`, verifierat): Berättaren
steg 1–9 klara, agenda→push-adaptern byggd, Express-backend med installation/
subscription/snapshot/kvitton/telemetri/VAPID/cron-rutt, verklig Web Push via
`web-push`, taken (max 1/dygn, 3/vecka, quiet hours 21.30–08.00, 10 % holdout),
responsmodell, backoff, raderingskontrakt. Allt körbart lokalt. Ingenting driftsatt.

**Det som saknas är inte kod. Det är fyra beslut och en text.** Här är de, beslutbara.

---

## Beslut A — var körs API:t?

Idag: SPA:n publiceras statiskt (Vercel, `render.yaml` finns också). API-rutterna lever i
`server.js` och körs bara lokalt.

**Alternativ 1 — Render Web Service.** `server.js` körs som den är, som en långlivad
Node-process. Render har Postgres och Cron inbyggt. SPA:n stannar på Vercel (main→preview
nyss beordrat). Två värdar, var och en gör det den är byggd för. CORS via
`ALLOWED_ORIGINS` (finns redan i env-modellen).

**Alternativ 2 — Vercel Serverless Functions.** Skriv om Express-rutterna till
`/api/*`-funktioner, Vercel Postgres/KV + Vercel Cron. En värd. Men: omarkitektur av
Express-appen till serverless-handlers, kallstarter för schedulern, mer arbete på
sex veckor.

**Rek: Alternativ 1, Render.** `server.js` finns och funkar — kör den oförändrad.
Tiden till mitt oktober är för kort för en omarkitektur som inte ger spelaren något.
Konsolidering till en värd kan göras efter release om det skaver.

Låser upp: allt nedan. Utan A står maskinen lokalt.

## Beslut B — hållbar lagring

Idag: `InMemoryAttentionStore` — tappar allt vid omstart. Får inte vara databas.

Datat är litet och relationellt: installation → subscription, snapshot, kandidater,
leveranser, kvitton. Schedulern behöver fråga över det.

**Rek: Postgres på Render** (starter räcker). Tråkiga rätta svaret. Inte KV (schedulern
behöver queries), inte SQLite-på-volym (Render-volymer är per instans). Store-kontraktet
finns redan — Codex byter adapter, inte modell.

## Beslut C — dataskydd: scope, grund, gallring

Detta är första server-state i ett local-first-spel, och det ska vara en ren berättelse.

**Vad som lagras server-side, exakt:**
- Installations-id (slumpat lokalt, ingen koppling till person)
- Push-subscription (endpoint + nycklar) — **detta ÄR personuppgift** enligt GDPR
  (identifierar en enhet/webbläsare). Inget sätt runt det; det är vad push kräver.
- Minimal attention-snapshot: öppna loopar, state-version, tillåtna deep links. Inte
  sparfilen. Pseudonymt, knutet till installations-id.
- Leveranskvitton + telemetri-event (permission, öppning, meningsfull handling)

**Vad som INTE lagras:** konto, namn, e-post, sparfilen, IndexedDB. Vi vet inte vem
spelaren är.

**Rättslig grund: samtycke.** Push kan inte skickas utan uttrycklig webbläsar-permission
+ appens opt-in. Opt-in-ögonblicket ÄR samtycket. Ingen prompt visas automatiskt
(redan byggt så).

**Gallring:**
- Avregistrering raderar hela installationens serverstate (kontraktet finns, byggt).
- **Nytt att besluta:** installationer utan snapshot-synk på **90 dagar** raderas
  automatiskt (ett cron-jobb). Annars ackumuleras döda enheter.
- Ingen försäljning, ingen delning, ingen tredjepart utom push-leverantören
  (webbläsarens egen push-tjänst — Apple/Google/Mozilla — som är teknisk nödvändighet).

**Rek: acceptera scopet ovan + 90-dagars-gallring.** Det är minsta möjliga för att
push ska fungera, och det går att förklara i fyra meningar. Spelartexten nedan.

**Spelartext (Opus, utkast — låses efter Jacobs läsning), understatement-registret:**

> **Om notiser**
>
> Spelet sparas på din enhet. Vi har inget konto och vet inte vem du är.
>
> Slår du på notiser sparar vi det som krävs för att skicka dem: en slumpad kod för den
> här installationen, din webbläsares adress för push, och en liten bild av var du står
> i spelet — nästa match, öppna beslut — så notisen kan säga något sant. Inte hela
> sparfilen. Inget namn, ingen e-post.
>
> Vi skickar högst en om dagen, högst tre i veckan, aldrig mellan halv tio på kvällen
> och åtta på morgonen.
>
> Stänger du av raderas allt vi sparat om installationen. Har vi inte hört från din
> enhet på tre månader raderas det ändå.
>
> Vi säljer inget och delar inget.

(Ovan är citerat för läsbarhet i underlaget — i appen renderas det som vanlig text,
inte blockquote.)

## Beslut D — permission-ögonblicket

Opus rek, redan implementerad i kod: pre-prompt visas efter första färdigspelade
veckan — spelaren har besökt Granska och nästa laguppställning är fortfarande öppen.
Värdebaserad ("vi säger till när det är dags att ta ut laget"), aldrig vid start. iOS
får först "Lägg till på hemskärmen"-hjälpen.

**Rek: kvittera som det står.** Det är rätt ögonblick — spelaren har sett vad spelet
ger innan det ber om något. Speltest bekräftar tonen.

## Vad som INTE är Jacobs beslut (redan i kön, rätt ägare)

- **Kategori-/quiet-hour-inställningar + avregistrerings-yta:** Design mockar
  (`stickiness-settings-kategorier`, `stickiness-avregistrering-yta`), Code bygger.
  **Design måste börja NU** — det är den längsta kedjan.
- **Copy-resolvern fullt wirad:** två scenarier inne (Code), resten väntar på
  `categoryFor()`-domen — c-o1sp1 + stickiness, gemensam arkitekturdom, **Opus**
  (grundad läsning krävs, ej gjord). Kritisk väg för narrativ push; ren
  matchförberedelse-push funkar utan.
- **Scheduler-kadens:** kör cron **varje timme**. Maskinens egna tak gör att
  frekvensen inte spelar roll för spelaren; timvis ger quiet-hours-precision.
- **Staging:** ingen separat staging-API. Deploya API:t en gång (Render), låt
  `ALLOWED_ORIGINS` täcka både Vercel-preview och prod, testa push mot en preview-URL
  på riktig enhet (iOS installerad PWA + Android). Enklast som håller.
- **npm audit** (`qs`/`body-parser`): egen rad, kräver major-bump, ej blockerande.

## Baklängesplan mot mjuk release senast 15 oktober

Sex veckor från 6 september. Eriks fönster styr exakt dag; planen ger buffert.

- **V1 (6–13 sep):** Jacob beslutar A–D (detta underlag). Codex: provisionera Render
  Web Service + Postgres, Postgres-adapter för store-kontraktet, VAPID-secrets i
  Render env (aldrig `VITE_*`, aldrig incheckat), Render Cron timvis → `/api/attention/run`.
  Design: börja inställnings-mocken. Opus: dataskyddstexten låst.
- **V2 (14–20 sep):** Code: inställningar + avregistrering per Designs mock.
  Codex: första riktiga push mottagen på riktig enhet via preview-URL. Gallringsjobb (90 d).
- **V3 (21–27 sep):** Opus: `categoryFor()`-domen fälld. Code: copy-resolvern fullt
  wirad, textgrinden grön. Pre-prompten synlig (VAPID giltig).
- **V4 (28 sep–4 okt):** end-to-end på iOS (installerad PWA) + Android: permission →
  snapshot → kandidat → leverans → öppning → kvitto i `ledgerTold`. Fixa. Dataskyddstext
  i appen.
- **V5 (5–11 okt):** mjuk release-prep: tolv spelare, push live, journalinstruktion.
- **V6 (12–15 okt):** buffert / Eriks fönster.

**Kritisk väg:** A → Postgres-adapter → riktig push på enhet (V1–V2). Allt annat kan
parallellt. Halkar A en vecka halkar allt.

## Vad Jacob gör nu

Fyra ja/nej: A (Render), B (Postgres), C (dataskydd-scope + 90 d + texten), D
(permission-ögonblicket som byggt). Säg ja på alla fyra eller ändra det du vill, så
går Codex på V1 i morgon och Design startar mocken.
