# Sprint 26 — Cross-system-skandalreferenser

**Status:** READY TO IMPLEMENT
**Estimat:** 1-1.5 dagar (Code) + ~3h Opus-text
**Förutsätter:** Sprint 25h Lager 1-3 levererade. THE_BOMB-status kartlagd
(`docs/THE_BOMB_STATUS_2026-04-26.md`).
**Risk:** Låg — endast text/data + lookup-logik, inga motorändringar.

---

## SYFTE

Sprint 25h byggde 8 skandalarketyper. Var skandal genererar en inbox-nyhet och
en separat inbox-rad med kafferum-quote. Det är dokumentation. Det driver inte
funktionalitet — spelaren ser ingen referens till skandalen i andra vyer än
inboxen.

Den här sprinten gör skandaler **synliga** i fyra system där de borde märkas:

1. Dashboard-kafferum (det som dyker upp varje omgång)
2. Klacken (supporter-commentary i match)
3. Presskonferens (frågor från journalister)
4. Motståndartränaren (citat i GranskaScreen efter match)

**Princip:** En koppling som bara existerar i inbox-raden räknas inte. Riktig
koppling = system A's händelse syns/ändrar text i system B's vy.

---

## SCOPE — fyra delar

### Del 1: Dashboard-kafferum

**Fil:** `src/domain/services/coffeeRoomService.ts`

**Vad finns idag:**
`getCoffeeRoomQuote(game)` plockar quote varje omgång på dashboarden. Stöder
transferdrama (sale/buy/deadline), streaks, legend, supporter-grupp,
volunteer-namn. Ingen koppling till `game.scandalHistory`.

**Ändring:**
Lägg till skandal-prioritet i quote-prioriteten. Plocka skandaler från
`game.scandalHistory` som triggade förra eller denna omgång. Om någon hittas,
plocka quote från ny `SCANDAL_DASHBOARD_EXCHANGES`-array per skandaltyp.

```typescript
// I början av getCoffeeRoomQuote, efter pendingVictoryEcho-checken:
const recentScandals = (game.scandalHistory ?? []).filter(s =>
  s.season === game.currentSeason &&
  s.triggerRound >= round - 1 &&
  s.type !== 'small_absurdity'  // hanteras separat via mediaProcessor
)
if (recentScandals.length > 0 && seed % 4 === 0) {
  const scandal = recentScandals[0]
  const isOwnClub = scandal.affectedClubId === game.managedClubId
  const exchanges = isOwnClub
    ? SCANDAL_DASHBOARD_OWN[scandal.type]
    : SCANDAL_DASHBOARD_OTHER[scandal.type]
  if (exchanges && exchanges.length > 0) {
    const idx = Math.abs(seed * 17) % exchanges.length
    const ex = exchanges[idx]
    const club = game.clubs.find(c => c.id === scandal.affectedClubId)
    const text = ex[1]
      .replace('{KLUBB}', club?.name ?? 'klubben')
      .replace('{ANDRA_KLUBB}', /* ... */)
    return { speaker: ex[0], text: `"${text}" — ${ex[2]}: "${ex[3]}"` }
  }
}
```

**Texter (skrivs av Opus separat):**
- Två varianter per skandaltyp:
  - **Egen klubb drabbad:** Kioskvakten/Kassören/Vaktmästaren reagerar med oro, ironi, eller pragmatisk acceptans
  - **Annan klubb drabbad:** Mer distanserat, ibland skadeglatt, ibland sympatiskt
- 2-3 utbyten per skandaltyp × 7 typer (exkluderar small_absurdity som har egna) × 2 varianter = ~30-40 utbyten totalt

**Triggermekanik:**
- Triggers bara om scandal triggade i föregående eller innevarande omgång
- 25% chans (`seed % 4 === 0`) — annars vanlig coffeeroom-quote
- En skandal-quote per omgång max

### Del 2: Klacken — supporter-commentary

**Fil:** `src/domain/data/matchCommentary.ts` + `src/domain/services/matchCore.ts`

**Vad finns idag:**
6 supporter-categories: `supporter_kickoff`, `supporter_halfTime`, etc.
Triggers på match-state (mood, members, score). Ingen koppling till skandal-
historik.

**Ändring:**
Ny category `supporter_scandal_recent` triggas i kickoff/halfTime/late om
*klubben själv* drabbats av skandal denna säsong. Plockas slumpmässigt med
~20% chans när annan supporter-quote skulle plockats.

```typescript
// I matchCore.ts, intill befintlig supporter_kickoff-trigger:
const ownScandalThisSeason = (game.scandalHistory ?? []).some(s =>
  s.season === game.currentSeason &&
  s.affectedClubId === managedClubId &&
  s.type !== 'small_absurdity'
)
if (ownScandalThisSeason && supporterCtx && rand() < 0.20) {
  commentaryText = fillTemplate(pickCommentary(commentary.supporter_scandal_recent, rand), sv)
}
```

**Texter (Opus):**
6-8 quotes som är generiska nog att fungera oavsett skandaltyp. Klacken
reagerar inte på *typen* — bara på att det varit oroligt:
- "📣 Klacken sjunger lite tystare ikväll. Förra månadens rubriker hänger kvar."
- "{leader}: 'Vi är här ändå. Det är vad som räknas.'"
- "📯 Trumman går — men inte med samma kraft som tidigare i säsongen."

### Del 3: Presskonferens — journalist-frågor

**Fil:** `src/domain/services/pressConferenceService.ts`

**Vad finns idag:**
QUESTIONS-pool per match-utfall (bigWin/win/loss/etc.) med `minRound`-villkor.
Inga skandal-villkorade frågor.

**Ändring:**
Lägg till frågor till varje pool (bigWin, win, loss, draw, derbyWin, derbyLoss)
som triggas om någon skandal triggade i ligan denna säsong. Fältet `minScandalThisSeason: true` läggs till på frågans config.

```typescript
// Lägg till i QUESTIONS:
loss: [
  // ...befintliga...
  { text: 'Det rör om i ligan med skandaler nu. Hur håller ni er fokuserade?', preferIds: [...], minScandalThisSeason: true },
  { text: 'Förbundet har sina händer fulla just nu. Påverkar det er vardag?', preferIds: [...], minScandalThisSeason: true },
],
// + likadant för win, bigWin, draw
```

**Filterlogik vid frågeval:**
Lägg till check i frågefiltreringen — om `minScandalThisSeason: true`, kräv
att `game.scandalHistory.some(s => s.season === game.currentSeason)`. Om inte,
filtrera bort frågan från poolen.

**Texter (Opus):**
6-8 nya frågor totalt, fördelade på olika utfalls-pooler. Tonen ska vara
**inte explicit om vilken skandal** — bara antyda att "ligan har skakats" eller
"det rör om i bandyn just nu". Förvirrar inte spelaren om det är *deras* eller
*någon annans* skandal.

### Del 4: Motståndartränaren

**Fil:** `src/domain/services/opponentManagerService.ts` (eller liknande)

**Vad finns idag (behöver verifieras av Code):**
`opponentManagerService.ts` finns. Genererar troligen citat efter match. Måste
verifieras i implementation om strukturen stöder detta direkt.

**Ändring:**
Om motståndarklubben drabbats av skandal denna säsong, plocka från ny
`OPPONENT_QUOTES_AFFECTED_BY_SCANDAL`-array istället för standard. Annars
oförändrat.

```typescript
const opponentScandal = (game.scandalHistory ?? []).find(s =>
  s.affectedClubId === opponentClubId &&
  s.season === game.currentSeason &&
  s.type !== 'small_absurdity'
)
if (opponentScandal) {
  // plocka empati/respekt/distansed quote
}
```

**Texter (Opus):**
4-6 quotes där motståndartränaren refererar till sin klubbs egna oro indirekt:
- "Vi har haft mycket att hantera vid sidan av planen. Det är inte ursäkt, men det är bakgrund."
- "Spelarna har varit stenstarka mot all turbulens. Vi vinner trots det."
- "Det är säsongen vi haft. Det är vad det är. Vi kommer tillbaka."

(Notera: oavsett vilken skandaltyp, motståndartränaren kommenterar i generella
termer "turbulens", "oro", "saker vi inte styr". Inte explicit om
sponsor-kollaps eller fantomlöner — det vore för specifikt och kan kännas
påklistrat.)

---

## TEXTOMFÅNG (skrivs av Opus innan Code-impl)

| System | Antal nya texter | Tid |
|---|---|---|
| Coffee-room utbyten (egen klubb) | ~14 (2 per skandaltyp) | ~1h |
| Coffee-room utbyten (annan klubb) | ~14 (2 per skandaltyp) | ~1h |
| Klack-quotes (generiska) | 6-8 | ~30 min |
| Press-frågor (skandal-villkorade) | 6-8 | ~30 min |
| Motståndartränare-quotes | 4-6 | ~30 min |

**Total Opus-text:** ~3-3.5h kurerad svensk text. Görs som vanligt — Jacob
+ Opus iterativ runda tills tonen sitter, sen samlat dokument.

---

## VERIFIERING

### Steg 1: Build + tester
```bash
npm run build && npm test
```
Förväntat: 1895/1895 grönt.

### Steg 2: Manuell playtest (5-10 minuter)

Förenklat scenario som triggas snabbt:
1. Starta spel som t.ex. Forsbacka
2. Spela 6-8 omgångar tills första skandalfönstret triggas
3. När skandal triggar: kolla inbox-rader (befintligt beteende, ska fungera oförändrat)
4. **Nästa omgångs dashboard:** kontrollera om kafferum-citatet ibland refererar till skandalen
5. **Nästa match:** lyssna efter klack-commentary om "förra månadens rubriker"
6. **Efter match:** kolla press-frågor — ny fråga om "ligan skakas" möjlig
7. **Mot drabbad motståndare:** kolla GranskaScreen efter match — motståndartränarens citat refererar till deras skandal

### Steg 3: Stresstest
```bash
npm run stress -- --seeds=10 --seasons=3
```
Förväntat: inga nya kraschar. Coffeeroom-funktionen tål null-skandaler om
`scandalHistory` är tom. Alla nya tabeller har min 2 entries.

---

## EFTER LEVERANS

`docs/sprints/SPRINT_26_AUDIT.md` med:
- Konkret manuell verifiering: vilka system såg skandalreferenserna i UI?
- Exempel på faktisk genererad text (skärmdumpar eller copy/paste från app)
- Bekräftelse att inbox-flödet är oförändrat
- Bekräftelse 1895/1895

---

## COMMIT-FÖRSLAG

```
feat: skandalreferenser i kafferum, klack, press och motståndartränare (Sprint 26)

Sprint 25h byggde 8 skandalarketyper men de bodde isolerat i inbox. Den här
sprinten gör dem synliga i fyra andra system:

- Dashboard-kafferum (~30 nya kurerade quote-utbyten, 2 per skandaltyp ×
  egen/annan klubb)
- Klack-supporter-commentary (~6-8 generiska quotes vid match)
- Presskonferens (~6-8 nya frågor villkorade på scandalHistory)
- Motståndartränaren (~4-6 nya quotes vid match mot drabbad klubb)

Ingen motorändring. Endast text + lookup-logik från game.scandalHistory.

Tester: 1895/1895.
```

---

## VAD SOM INTE INGÅR

- **Skandalspecifika konsekvenser för spelaren** — t.ex. att spelaren *själv*
  hamnar i fantomlöner. Sprint 25h Lager 2 hanterar konsekvenser av spelarens
  egna val. Den här sprinten är bara *spegling* av befintliga skandaler.
- **Visuell skandalindikator i HUD/headers.** Skandalen syns redan i inboxen
  och dashboard-kafferum är tillräckligt diskret. Ingen ny visuell markering.
- **Klack-mood-effekt vid skandal.** Om skandal påverkar `supporterMood` är
  det utanför scope (skulle kunna vara ny ripple-trigger, men det är kalibrering
  vi inte har data på).
- **Sponsorbortfall p.g.a. annan klubbs skandal.** Lockande men spekulativt.
  Inte i scope.
- **Specifik skandaltyp-detektering i klack/motståndartränare.** Generella
  hänvisningar ("oro", "turbulens") fungerar bättre — undviker påklistrad
  känsla.

---

## NOTERING — SCANDALSERVICE-DATA SOM BIBLIOTEKSSTÖD

Code kan återanvända text från `SCANDAL_TEXT.coffeeRoom` i `scandalService.ts`
som *grund* för Del 1 (dashboard-kafferum), men de fungerar inte direkt:

- Befintliga texter är "när skandalen *just* triggade" (inbox-stil)
- Dashboard-kafferum behöver "*efteråt*-perspektiv" — folk pratar om det som
  hänt förra veckan

Opus skriver helt nya texter för dashboard-kafferum. Ingen återanvändning av
de befintliga inbox-quotes.

---

## VARFÖR DEN HÄR ORDNINGEN AV SYSTEM

Del 1 (kafferum) och Del 3 (press) levererar mest värde — de syns för spelaren
även om de aldrig spelar match mot drabbad klubb. Del 4 (motståndartränaren)
beror på matchschema och kan ta hela säsongen att se. Del 2 (klack) är diskret
men ger atmosfär.

Om Code måste prioritera: gör 1 + 3 först. 2 och 4 är nice-to-have.
