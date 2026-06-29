# Code-instruktion — nästa pass (2026-05-23)

**Av:** Opus. **Föregående:** commit b3d05fe (score steg 1–3 + OpponentForm).
**Surface:** kategori D (UI) + datamodell. Läs LESSONS.md vid start. Verifiera i
KONTEXT, aldrig isolerat.

Två oberoende spår denna pass. Ta dem i ordning, men de delar ingen kod —
**C-SD1 kan landa separat innan score steg 5 om du vill mindre commits.**

---

## SPÅR 1 — Score steg 5: snapshot-pipeline (Opus har löst anrop-platsen)

Jag har läst `roundProcessor.ts`. Du behöver INTE flagga anrop-platsen tillbaka
— den är fastställd nedan. Bygg direkt.

### 1.1 Datamodell

`SaveGame` får ett nytt fält:
```typescript
scoreSnapshots?: {
  standingsPosition: number[]   // managed klubbs tabellplacering per liga-omgång
  journalistRelation: number[]  // journalist.relationship per liga-omgång
  playerForm: number[]          // managed klubbs avg form per liga-omgång
}
```
Rullande, **senaste 22** per kategori (en hel grundserie). INTE finances —
`financeLog` finns redan (§A1 i score-uppdraget, verifierat: byggs via
`appendFinanceLog`-reduce i monteringen).

### 1.2 Anrop-plats + gard — EXAKT (Jacob verifierade mot roundProcessor)

Jacob läste hela `advanceToNextEvent()` (1544 rader) och fastställde anrop-plats
OCH en fjärde gard jag missade. Bygg exakt så här.

**Plats:** EFTER att `updatedGame` är fullt byggt (rad ~1110) men INNAN sista
`return` (rad ~1543). Där är `updatedGame.journalist?.relationship`,
spelarformer och `standings` alla uppdaterade för omgången. Snapshot kan skrivas
som en mutation på `updatedGame` där (samma mönster som arc-blocket och
follow-up-blocket som redan muterar `updatedGame` efter monteringen), eller som
inline-fält i själva monteringen — men om inline, använd `game.*`-källor, inte
`updatedGame.*` (det är inte i scope än där). Enklast: muteringsblock efter
monteringen, läser `updatedGame`.

**Garden — fyra villkor, inte tre:**
```ts
if (!isCupRound && !isPlayoffRound && currentLeagueRound !== null && !isSecondPassForManagedMatch) {
  // recordSnapshot på updatedGame
}
```

**Varför `!isSecondPassForManagedMatch` (KRITISKT — jag missade detta):** andra
passet körs i SAMMA `advance()`-call som AI:s matcher spelades, men managed ännu
ej spelat. Standings och spelarformer är då ofullständiga för rundan. Utan denna
gard körs snapshot TVÅ gånger per matchdag — en halvfärdig (AI), en komplett
(managed). OBS: `BOARD_MILESTONES`-blocket har INTE denna gard (det är
idempotent via `alreadySent`-check på inbox-id). Snapshot har ingen sådan
self-dedup — därför krävs `!isSecondPassForManagedMatch` explicit. **Kopiera
INTE board-milestone-gaten rakt av; den saknar fjärde villkoret.**

**Varför inte `appendFinanceLog`-mönstret:** financeLog loggar enskilda
händelser (en per event). Snapshot är ett tillståndsvärde ("var är vi nu?") som
bara ska finnas en gång per ligarunda. Olika natur, olika mönster.

**Gating-bevis (tvingande):** kör en cup-omgång, en playoff-omgång OCH en
managed-matchdag (båda passen) i test. Verifiera att arrayerna växer med exakt
ETT element per liga-omgång, noll på cup/playoff, och att managed-matchdagens
två pass bara ger ETT element (inte två). Detta är hela poängen (LESSONS #14).

### 1.2b Datakällor (Jacob verifierade)

- `standingsPosition`: `standings.find(s => s.clubId === game.managedClubId)?.position`
  (inte `findIndex+1` — standings-entiteten har ett `position`-fält; verifiera namnet)
- `journalistRelation`: `updatedGame.journalist?.relationship ?? null` — hoppa
  över pushen om null, krascha inte
- `playerForm`: **medel, INTE per-spelare.** `updatedGame.players.filter(p => p.clubId === managedClubId).map(p => p.form)` → medel.
  Verifiera fältnamnet `form` mot `src/domain/entities/Player.ts` (kan vara `currentForm`).
  En sparkline visar lag-formtrend → medel räcker. Per-spelare-historik
  (`Record<playerId, number[]>`) är en annan feature (PlayerCard, score steg 8+,
  pipeline-låst). Bygg INTE `Record` nu — det sväller SaveGame i onödan. Enkel
  `number[]`, medel.

### 1.3 R1 fatigueHistory — SAMMA anrop-plats, ANNAN gate

R1-handoffen (`HANDOFF-R1-DECISION-FATIGUE`, v2, låst) kräver
`game.fatigueHistory: number[]` uppdaterad "vid varje advance()". Samma
anrop-plats som snapshot (efter `updatedGame` byggt), men **annan gate** — läs
noga, det är en fälla:

- `scoreSnapshots` gatas till liga-omgångar (cup/playoff rör inte serien).
- `fatigueHistory` mäter manager-tryck (deferred decisions) — det finns OAVSETT
  cup/liga, så ingen liga-gate. **MEN** den behöver fortfarande
  `!isSecondPassForManagedMatch`: annars pushas två värden per managed-matchdag,
  vilket förvränger tryck-trenden. Så: pusha en gång per `advance` SOM INTE är
  andra passet — cup, liga och playoff alla räknas, men bara ett pass per
  matchdag.

```typescript
// I muteringsblocket efter updatedGame, eller inline med game.*-källor:
if (!isSecondPassForManagedMatch) {
  const meter = getFatigueState(updatedGame).meter  // updatedGame = tillstånd EFTER rundan
  updatedGame = { ...updatedGame, fatigueHistory: [...(game.fatigueHistory ?? []), meter].slice(-7) }
}
```

OBS: `getFatigueState` ska läsa `updatedGame` (deferredDecisions efter rundans
bearbetning), inte `game` (före). `getFatigueState` är R1:s helper
(`decisionFatigueService.ts`). Bygg helpern först (R1 §2), sen detta. R1 är nu
UNBLOCKED — Sparkline finns (b3d05fe).

**Bygg HELA R1 i detta spår** medan du är i call-siten: `deferredAt` på
GameEvent (§1), helpern (§2), queue-rail-sparkline (§3 — använd `<Sparkline>`,
INTE fatigue-bar; mocken visar sparkline, §0.2 i Opus R1-plan), aged-chip (§3),
aged dec-card (§4), fatigue-scen-trigger + `fatigueHotStreak` (§5). Copy (4 warm
+ 4 hot) skriver Opus — lämna platshållare, flagga att de behövs.

### 1.4 Vad du INTE gör i SPÅR 1
Steg 6–7 (ljus-variant + RoundSummary) är nu UPPLÅST — Jacob har fattat
designbeslutet (mellanvägen). De ligger som eget SPÅR 3 nedan. Men de är
FORTFARANDE beroende av att steg 5 (pipelinen) är byggd först om de delar commit
— annars oberoende. STANNA i spår 1 efter pipeline + R1, visa skärmdump av
queue-rail-sparkline i kontext, ta sedan spår 3 som separat steg.

---

## SPÅR 2 — C-SD1 säsongsslutets koreografi (oberoende, Q låsta)

Handoff: `HANDOFF-C-SD1-KOREOGRAFI`. Noll score-beroende, noll datamodell-risk.
Ren arkitektur. Q1–Q4 är låsta i handoffen. Bygg rakt.

1. Ny fil `src/domain/data/seasonEndPhase.ts`: `getSeasonEndPhase(game)` →
   7 explicita faser + `SeasonEndPhase`-typ. (Se handoff TL;DR.)
2. SaveGame: `seasonDoneAck?: boolean`, `inSummerScene?: boolean`.
3. Gateway-check i 5 trigger-funktioner (sommaren, halvvägs, SM-final-victory,
   playoff-intro, granska-CTA-text). Varje gate = en rad som läser fasen.
4. Tester: snapshot per game-state-kombination.

**Detta löser tre buggar med en arkitektur** (sommaren-före-slutspel,
halvvägs-dubblering, granska-CTA-fel-tillstånd). Inkrementellt — varje gateway
kan migreras separat utan att gå sönder. Verifiera mot
`seasonPhases.ts` (`getSeasonPhase`, `isManagedClubInPlayoff`,
`isManagedClubSpectator` finns redan — C-SD1 ersätter ad-hoc-checkar med
`getSeasonEndPhase`, dubbeldefiniera inte fas-logiken).

---

## Prioritet
C-SD1 (spår 2) först — minst risk, fixar tre buggar, Q låsta, noll beroenden.
Sen score-pipelinen + R1 (spår 1) — datamodell, behöver test-verifiering av
cup/liga-gaten. Sen ljus-variant + RoundSummary (spår 3) — nu upplåst av
designbeslutet. Spår 3 kan tas när som helst efter att ScoreBlock finns (b3d05fe)
— den beror INTE på pipelinen.

---

## SPÅR 3 — Score steg 6–7: ljus variant + RoundSummary (designbeslut LÅST)

Jacob beslutade **mellanvägen** för ljust score-block: invertera bakgrund/text
för ljus yta OCH dämpa stripe-färgerna så de sitter lugnt mot parchment. Samma
primitiv — stripen bär alltid resultatet, bara tonen skiftar med ytan. INTE
väg 3 (siffran bär färgen) — det hade gjort ljus/mörk strukturellt olika.

### 6.1 `.score-block.light` i `score-primitives.css`

Code lämnade redan en platshållar-kommentar för detta ("Ljus variant
definieras i nästa pass"). Bygg den. Den befintliga mörka `.score-block` är
basen; `.light` är en modifierare som ändrar bara det som behövs:

```css
.score-block.light {
  background: var(--bg-surface);              /* #FAF8F4 krämvit */
  border-color: rgba(196, 122, 58, 0.18);     /* lättare än mörk variant */
}
.score-block.light .score-block-num   { color: var(--text-primary); }  /* mörk text default */
.score-block.light .score-block-label { color: var(--text-secondary); }
```

**Mellanvägens kärna — dämpade stripes för ljus yta.** De mörka varianterna
använder `--success`/`--danger`/`--warm` rakt av; mot #FAF8F4 blir de skrikiga.
Lägg dämpade stripe-färger BARA för `.light`:

```css
.score-block.light.win   { border-left-color: var(--success-muted, rgba(74, 124, 89, 0.7)); }
.score-block.light.loss  { border-left-color: var(--danger-muted, rgba(168, 74, 74, 0.7)); }
.score-block.light.draw  { border-left-color: rgba(120, 110, 96, 0.6); }
.score-block.light.derby { border-left-color: var(--warm); }   /* warm är redan dämpad nog */
.score-block.light.gold  { border-left-color: var(--gold); background: rgba(232, 185, 92, 0.10); }
```

**Num-siffran på ljus yta: mörk text default, INTE färgad.** Skillnaden mot mörk
variant (där win/loss-siffran är grön/röd): på ljus yta bär stripen färgen,
siffran är mörk för läsbarhet. Detta är mellanvägen — färgsignalen finns (stripe)
men texten skriker inte. Överstyr därför INTE `.light .score-block-num`-färgen
per variant. (Undantag: `gold` på ljus yta får behålla gold-siffra — ceremoniellt,
SM-final.)

**Verifiera om `--success-muted`/`--danger-muted` finns i global.css.** Om de
INTE finns: använd rgba-fallbacks ovan OCH lägg de två dämpade tokenen i
`design-system/colors_and_type.css` (samma mönster som guld-token-fixen i
RESTERANDE-TICKETS §3). Hitta inte på nya hex utan att kolla — global.css kan
redan ha en dämpad grön/röd för annat bruk.

**Bevis (tvingande):** rendera alla sex `.light`-varianter i en rad PLUS de sex
mörka, staplade. Skärmdump. V/O/F/derby ska gå att skilja åt på båda ytorna, och
de ljusa stripe-färgerna ska se LUGNA ut mot #FAF8F4 — inte neon. Om en färg
skriker, flagga till Jacob, justera inte själv (mellanvägens hela poäng är
tonen).

### 6.2 DESIGN-DECISIONS.md
Uppdatera score-block-posten: ljus variant = mellanvägen (dämpad stripe, mörk
num-text), mörk variant = full stripe + färgad num. Regel: stripe bär alltid
resultatet på båda ytor (samma primitiv); num-färg skiftar med yta.

### 7 · RoundSummary "andra matcher"

NU möjlig (ljus-varianten finns). `RoundSummaryScreen.tsx` är LJUS bakgrund
(`var(--bg)`, texture-wood, card-sharp). Ersätt den befintliga "andra matcher"-
raden (`getClubShort` + `homeScore–awayScore` + relevant-stripe via
`isRelevantFixture`) med `<ScoreBlock light compact>`. **Behåll
relevant-stripe-logiken** — `isRelevantFixture` styr vilka matcher som visas, det
ändras inte. Variant härleds från resultatet (V/O/F ur managed-perspektiv om
relevant, annars `subtle`).

**Tvingande migrerings-kriterier (samma som steg 2):**
1. Verifiera i KONTEXT — skärmdump av RoundSummary med ljusa score-block i sin
   riktiga skärm. Blocken ska smälta in mot papperet, inte vara mörka klumpar
   (LESSONS #25 — det var hela skälet att ljus-varianten krävdes).
2. `.tabular` på siffran (4–1 och 12–10 linjerar).
3. Ersätter raden, kompletterar inte (LESSONS #6).
4. Compact-läge (raden är tät) — `<ScoreBlock light compact>`.

### Vad spår 3 INTE rör
Auditens våg 2–4 (GranskaForlopp, SimSummary, övriga 15 ljus-ytor) — de är nu
tekniskt upplåsta (ljus-varianten finns) men är en separat utrullning, inte
denna pass. RoundSummary är första ljus-beviset; resten följer när det är
bevisat i kontext. (SimSummarys token-bugg är dessutom eget ärende — se
RESTERANDE-TICKETS §3.)

---

## Sammanfattning — tre oberoende spår
- **Spår 2 (C-SD1):** ren arkitektur, noll beroenden, börja här.
- **Spår 1 (pipeline + R1):** datamodell, gard verifierad, test cup/liga-gaten.
- **Spår 3 (ljus-variant + RoundSummary):** designbeslut låst (mellanvägen),
  oberoende av pipelinen, beror bara på att ScoreBlock finns (det gör den).

— Opus, 2026-05-23
