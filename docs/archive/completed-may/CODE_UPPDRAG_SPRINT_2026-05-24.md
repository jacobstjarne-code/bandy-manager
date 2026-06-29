# CODE-UPPDRAG — Sprint 2026-05-24 (tre fynd från playtest)

**Av:** Opus. Tre uppdrag, oberoende av varandra. Ingen är crash-class — trimning.
Full diagnos i `docs/PLAYTEST_FYND_2026-05-24.md`.

═══════════════════════════════════════════════════════════════════════════
## UPPDRAG 1 — Inbox-titlar bär för lite (PRIORITERA, billigt)
═══════════════════════════════════════════════════════════════════════════

**Problem:** Inboxen känns repetitiv. Titlar utan särskiljande info: "Matchresultat:
3-7" (ingen motståndare/omgång), "Träning: Fysik" (ingen omgång), "Helena Wikström ·
Allehanda" (journalistnamn, inte ämne). Titeln är det man skannar i listan — den måste
bära vem/vad/när.

**Surface-delning:** Opus har skrivit titelformlerna nedan (svensk text). Code kopplar
in datan (motståndarnamn, omgång). Ändra INTE formlernas ordval — bara fyll i datan.

### 1A — Matchresultat (`createMatchResultItem`, inboxService.ts)
Titeln saknar motståndare och omgång. Funktionen har `fixture` men inte klubblistan.

**Signaturändring:** lägg till `clubs: Club[]`-parameter (eller `opponentName: string`
beräknad av anroparen). Hämta motståndarens namn via fixturens motstånd-id.

**Ny titelformel (Opus):**
```
Matchresultat: {egetKortnamn}–{motståndarKortnamn} {homeScore}–{awayScore}
```
- Använd klubbarnas namn i hemma–borta-ordning (samma ordning som siffrorna), så
  resultatet läses rätt: `Forsbacka–Västanfors 3–7`.
- Om `fixture.isCup`: prefix `Cupen: ` i stället för inget → `Cupen: Forsbacka–Söderfors 2–1`.
- Tankstreck (–, U+2013) mellan lagen OCH i siffrorna, inte bindestreck. Det är husstil.
- Body lämnas oförändrad ("Ni förlorade 3–7 hemma." — byt bindestreck mot tankstreck även här).

### 1B — Träning (`createTrainingItem`, inboxService.ts)
Titeln `Träning: ${typeLabel}` saknar omgång. Funktionen HAR redan `roundNumber`.

**Ny titelformel (Opus):**
```
Träning omg {roundNumber}: {typeLabel}
```
→ "Träning omg 5: Fysik". Två fysikpass ser inte längre identiska ut.

### 1C — Media-titlar (OPUS HAR LÄST — två källor, beslut klart)
Grep visade TVÅ källor, vilket förklarar de två varianterna spelaren ser:

**Källa 1 — `generatePostMatchHeadline` (journalistService.ts), typ `MediaEvent`.** Sätter
titeln till BARA `${journalist.name} · ${journalist.outlet}` och lägger hela rubriken i
`body`. Det är de poster som syns som ren "Helena Wikström · Allehanda" utan ämne —
värsta varianten, ämnet finns men ligger i body.
**Fix:** Lyft rubriken (body) till titeln, gör journalisten till kort byline efter.
```ts
title: `${headline} — ${journalist.name}, ${journalist.outlet}`,
body: headline,   // behåll body oförändrad för expand-vyn
```
→ "Tränaren utmanade: Det här är vi — Helena Wikström, Allehanda". Ämnet skannas först,
journalisten är kvar men sekundär. (Om `headline` redan är lång: titeln trunkeras ändå
med ellipsis, men nu på ämnet — inte på journalistnamnet.)

**Källa 2 — `mediaItem` (mediaService.ts), typ `Media`.** Sätter `getHeadlinePrefix(...)`
FÖRE en ämnesbärande title → "Helena Wikström · Allehanda: MÅLKALAS! ...". Ämnet finns
men trunkeras bakom prefixet i listan.
**Fix:** Vänd ordningen i `mediaItem` — ämne först, journalist/tidning som byline efter.
Byt prefix-konkatenering mot suffix:
```ts
// före:  title: prefix ? prefix + title : title
// efter:
const byline = game?.journalist
  ? ` — ${suppressJournalistName ? game.journalist.outlet : game.journalist.name + ', ' + game.journalist.outlet}`
  : ''
title: title + byline,
```
→ "MÅLKALAS! Forsbacka krossade Söderfors 7–1 — Helena Wikström, Allehanda".
**OBS:** `getHeadlinePrefix` används även för persona-ton (KRIS!/SENSATION!/granskning).
Den tonen ska BEVARAS — men som del av ämnet, inte som prefix-byline. Behåll
`getHeadlinePrefix`-anropet för persona-flavor om det behövs, men flytta
journalistnamn+outlet till byln-suffixet. Code: om persona-tonen och namnet är
sammanflätade i `getHeadlinePrefix`, rapportera tillbaka — då kan vi behöva dela den i
två (ton-prefix behålls fram, namn-byline flyttas bak). Bygg inte runt det blint.

Tankstreck (—, U+2014) som byline-avdelare, inte bindestreck.

**Verifiering 1:** Inboxen visar match med motståndare+omgång, träning med omgång. Två
fysikpass har olika titlar. Skärmdump.

═══════════════════════════════════════════════════════════════════════════
## UPPDRAG 2 — Bud kvar i VIKTIGT efter accept (OPUS HAR LÄST — fix klar)
═══════════════════════════════════════════════════════════════════════════

**Problem:** Accepterat bud på Erik Ström ligger kvar i VIKTIGT-sektionen i inboxen,
trots att affären är klar (kvitto + "Fans reagerar"-post finns).

**Rotorsak (VERIFIERAD i `InboxScreen.tsx`):** Sektioneringen görs av `getCategory(item)`
— ren typ-baserad mappning. `TransferOffer` och `TransferBidReceived` returnerar ALLTID
`'important'`, oavsett budets status. Ingen koppling till om budet är avslutat. Posten
är historik med stabilt id (rätt — städas inte), men dess KATEGORI följer inte budets
status, så en avslutad affär rankas som öppen-att-agera-på.

**Fix (Opus):** `getCategory` tar idag bara `item` och kan därför inte slå upp budstatus.
Ge den `game`-kontext: `getCategory(item, game)`. För `TransferOffer`/`TransferBidReceived`:
slå upp om det finns ett ÖPPET (`status === 'pending'`) bud kopplat till posten. Om budet
inte längre är pending (accepted/rejected/expired) → returnera `'news'` istället för
`'important'`. Posten lämnar då VIKTIGT och hamnar i NYHETER, utan att raderas.

Konkret:
```ts
function getCategory(item: InboxItem, game: SaveGame): InboxCategory {
  switch (item.type) {
    case InboxItemType.TransferOffer:
    case InboxItemType.TransferBidReceived: {
      const hasOpenBid = /* öppet bud för item.relatedPlayerId med status 'pending' */
      return hasOpenBid ? 'important' : 'news'
    }
    // ... resten oförändrat
  }
}
```
Anroparen (`InboxScreen`, `grouped[getCategory(item)]`) HAR redan `game` i scope —
skicka in den.

**ÖPPEN PUNKT (nu LADDAD av Opus):** Bud-listan lever i `game.transferBids: TransferBid[]`
(toppnivåfält på SaveGame). `TransferBid` har `playerId`, `status` ('pending'|'accepted'|
'rejected'|'expired') och `direction` ('incoming'|'outgoing'). Uppslaget:
```ts
const hasOpenBid = (game.transferBids ?? []).some(
  b => b.playerId === item.relatedPlayerId &&
       b.direction === 'incoming' &&
       b.status === 'pending'
)
```
Ingen ny datamodell, ingen mutation av historik. Hela fixen är nu låst.

**Opus avvisar approach (b).** Code föreslog att skriva budstatus på inboxposten vid
resolve istället. (a) är rätt av en konkret anledning: (b) kräver att resolve-logiken —
som finns på FLERA ställen (accept, reject, expire, `bidRejectedByPlayer`) — varje gång
hittar och muterar rätt inbox-post. Fyra ställen som måste komma ihåg att skriva statusen;
missas ett ligger buggen kvar. (a) läser sanningen från `transferBids` vid varje render —
en enda plats, kan inte bli inaktuell. Trådningen av `game` in i `getCategory` är trivial
(anroparen har redan `game`). Bygg (a).

**Verifiering 2:** Acceptera ett bud → posten lämnar VIKTIGT (hamnar i NYHETER). Ett
ÖPPET bud ligger kvar i VIKTIGT. Skärmdump båda lägen.

═══════════════════════════════════════════════════════════════════════════
## UPPDRAG 3 — Cup-helg erbjuder bandyskola
═══════════════════════════════════════════════════════════════════════════

**Problem:** Inför cup-semifinal var primary-kortet "ORTEN: Kommunen erbjuder bidrag om
ni startar en bandyskola" — fel lugnt beslut inför en cup-helg.

**Rotorsak (verifierad):** `getRoundCharacter` sätter `cup_day` rätt. Men
`CHARACTER_BIAS.cup_day` i `portalBuilder.ts` är `{ next_match: 1.5, board_objectives:
0.6 }` — rör bara nästa-match + styrelsemål. Lugna orts-/kommun-events (`event_critical`,
`patron_demand`) påverkas inte och vinner primary ändå.

**Fix 3A — bredda cup_day-biasen (portalBuilder.ts):**
Dämpa lugna orts-/kommun-beslut under cup_day som styrelsemål dämpas:
```ts
cup_day: { next_match: 1.5, board_objectives: 0.6, event_critical: 0.5, patron_demand_unmet: 0.5 },
```
(Lägg till de kort-id:n som driver orts-/kommun-/patron-beslut. Verifiera exakta id:n i
`initCardBag.ts` — `event_critical`, `patron_demand_unmet` finns; lägg ev. fler om
community-event har eget primary-id.)

**Fix 3B — event-priority (OPUS + CODE: ingen ändring behövs):**
Code grep visade: `communityEvent` (bandyskola) har ingen explicit priority → faller på
`default: 'low'` i `getEventPriority`. Den tänder alltså ALDRIG `hasCriticalEvent` —
`event_critical`-kortet (vikt 95) är oskyldigt. Bandyskolan vann primary via
`patron_demand_unmet` (vikt 70), och 3A dämpar den till ×0.5 under cup_day. `communityEvent`
ska FÖRBLI 'low' — ett rekryteringserbjudande är inte kritiskt som skandal/ekonomikris.
Ingen ändring i `getEventPriority`. 3A ensam löser cup-helgen. Verifiera i spel efter 3A.

**Verifiering 3:** Inför en cup-match: bandyskola/kommun-beslut tar INTE primary —
nästa-match-kortet eller cup-kortet gör det. Skärmdump. Utanför cup: kommun-beslutet
kan fortfarande nå primary normalt.

═══════════════════════════════════════════════════════════════════════════

## Ordning
1 (inbox-titlar, 1A+1B direkt, 1C efter grep+Opus) → 3 (cup-helg, 3A direkt, 3B efter
grep) → 2 (bud i VIKTIGT, efter grep+Opus). 1A/1B/3A är byggbara nu; 1C/2/3B kräver
grep-rapport till Opus först.

═══════════════════════════════════════════════════════════════════════════
## UPPDRAG 4 — Matchkommentar repeterar inom samma match
═══════════════════════════════════════════════════════════════════════════

**Problem:** Matchflödet upprepar strängar inom samma match. Två mål i rad fick
identisk klack-rad ("Jan kastar sig framåt! Klacken sjunger ut!"), "vattenpöl" och
"teknisk miss" återkom direkt efter varandra. I ett live-flöde man läser rad för rad
syns repetitionen mer än någonstans annars.

**Rotorsak (verifierad i `matchCommentary.ts`):** `pickCommentary(arr, rng)` är ren
slump utan minne: `arr[Math.floor(rng() * arr.length)]`. Ingen spärr mot att dra samma
sträng som sist. Med små pooler — `supporter_goal_home` (4), `weather_miss_thaw` (3),
`weather_miss_fog` (2) — är dubblett i rad inte otur, det är förväntat (1 på 3-4).

### Fix 4A — minne i pickCommentary (STRUKTURELL, viktigast)
Detta är samma sorts fix som kafferum-slumpen (`CODE_UPPDRAG_KAFFERUM_SLUMP_2026-05-23`).
`pickCommentary` ska inte kunna returnera samma sträng den nyss returnerade ur SAMMA
pool. Implementera en rullande historik PER POOL:
- Behåll determinismen — `rng`-seeden måste fortf. ge identisk match vid omspel. Lös
  det genom att avvisa ett drag som matchar de N senaste ur poolen och dra IGEN med
  nästa rng-värde (deterministiskt), INTE genom icke-deterministisk Set-lagring utanför
  rng-strömmen.
- N = `min(poolstorlek - 1, 3)` så små pooler inte fastnar.
- Code: hitta alla call sites av `pickCommentary` (grep) och avgör var historiken bor.
  Den bör leva per match-simulering (återställs per match), nycklad på pool-identitet.
  Rapportera till Opus hur `pickCommentary` anropas (delas rng-strömmen mellan pooler
  eller per event?) INNAN bygge — determinismen är känslig och Opus vill se trådningen.

### Fix 4B — utöka de minsta poolerna (TEXT, Opus surface)
De minsta poolerna töms snabbt i en målrik match även med minne. Opus har skrivit
tilläggsrader nedan. Lägg till dem i respektive array i `matchCommentary.ts`, rör inte
befintliga rader.

`supporter_goal_home` (lägg till):
- "🎵 Och där tar taket av sig! {leader} höjer rösten en oktav."
- "📣 Trumman kommer en halv sekund för sent — ingen bryr sig, alla skriker ändå."
- "🎵 {members} på plats och de låter som dubbelt så många just nu."
- "📣 {leader} hann inte ens dra ramsan färdigt innan bollen låg där."

`weather_miss_thaw` (lägg till):
- "Bollen tappar fart i väten precis när det gick undan. Bortkastat läge."
- "Slasket tog avslutet. Det var ett mål på vanlig is."

`weather_miss_fog` (lägg till):
- "Skytten såg nog inte stolpen — bollen gick där målet borde varit."
- "Inslaget försvann i grått. Ingen såg vart det tog vägen, minst av allt skytten."

`weather_goal_thaw` (lägg till):
- "Genom slasket! {player} trängde in den där en torr is hade gett en enklare boll. {score}!"
- "Bollen kröp de sista metrarna — men över linjen. {player}! {score}!"

`weather_goal_heavySnow` (lägg till):
- "Ur snöyran kommer {player} och bollen ligger där. {score}!"
- "Ingen såg passningen i snön — utom {player}. {score}!"

**Verifiering 4:** Spela en målrik hemmamatch (5+ mål) i töväder. Inga två mål i rad
får samma klack-rad; "vattenpöl"/"teknisk miss" upprepas inte i direkt följd. Spela om
SAMMA seed → identiskt flöde (determinism behållen). Skärmdump flödet.

═══════════════════════════════════════════════════════════════════════════

## Reviderad ordning (fyra uppdrag)
1A/1B (inbox-titlar) + 3A (cup-bias) + 4B (text-pooler) — byggbara DIREKT, ren text/data.
4A (kommentar-minne) — strukturell, kräver grep-rapport till Opus om rng-trådning först.
1C (media-titel) + 2 (bud i VIKTIGT) + 3B (event-priority) — kräver grep-rapport först.

Fix 4A och B5 (kafferum-slump) är samma mönster — bygg dem med samma minnes-helper om
möjligt, så vi inte har två olika lösningar på samma problem.

— Opus, 2026-05-24
