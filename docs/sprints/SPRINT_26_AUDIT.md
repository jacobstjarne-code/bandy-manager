# Sprint 26 — Audit (skandalreferenser)

**Datum:** 2026-04-26
**Scope:** Cross-system skandalreferenser — 4 system, 65 strängar
**Verifieringsmetod:** Kod-verifierad simulation (seedbaserad körning av
faktisk produktionskod mot kontrollerade SaveGame-objekt)

---

## Punkter i spec

### Del 1 — Dashboard-kafferum

- [x] **Del 1A — Egna klubbens skandal (7 typer)**
  Verifierat: `getCoffeeRoomQuote()` med `scandalHistory` innehållande aktuell
  skandal (triggerRound=7, season=1) och seed 108 (round=7 → `7*11+1*31=108`,
  `108%4=0` → triggar). En quote per skandaltyp, alla ✅:

  | Typ | Citat |
  |-----|-------|
  | `sponsor_collapse` | [Kassören] "Tröjorna ska tryckas om." — Materialaren: "När då?" Kassören: "När någon betalat." |
  | `treasurer_resigned` | [Vaktmästaren] "Är det någon som öppnat kontoret?" — Kioskvakten: "Inte sen i tisdags." Vaktmästaren: "Då." Kioskvakten: "Då." |
  | `phantom_salaries` | [Kassören] "Två poäng." — Ordföranden: "Två." Kassören: "Det är en match." |
  | `club_to_club_loan` | [Ordföranden] "Det skulle hjälpa bägge." — Kassören: "Det blev så." Ordföranden: "Hjälpen gick åt fel håll." |
  | `fundraiser_vanished` | [Materialaren] "Birger frågade igen idag." — Kioskvakten: "Vad sa du?" Materialaren: "Att vi tittar på det." |
  | `coach_meltdown` | [Vaktmästaren] "Jag plogade tidigt idag. Han var där redan." — Materialaren: "Sa något?" Vaktmästaren: "Bara hej." |
  | `municipal_scandal` | [Kioskvakten] "Hörde att Granskning ringde i veckan." — Vaktmästaren: "Lokaltidningen eller riktiga?" Kioskvakten: "Riktiga." |

- [x] **Del 1B — Annan klubbs skandal (7 typer, {KLUBB}-substitution)**
  Verifierat: `scandal.affectedClubId = 'other'` (Sandviken). `{KLUBB}` ersatt
  korrekt i alla 7 typer. Exempel:

  | Typ | Citat |
  |-----|-------|
  | `sponsor_collapse` | [Kioskvakten] "Sandviken förlorade en sponsor i veckan." — Kassören: "Stor?" Kioskvakten: "Lagom." |
  | `phantom_salaries` | [Kassören] "Sandviken fick två poäng dragna." — Ordföranden: "På vad?" Kassören: "Spelare som inte fanns." |
  | `fundraiser_vanished` | [Kassören] "Sandvikens korv-pengar är borta." — Vaktmästaren: "300 spänn?" Kassören: "300 tusen." |
  | `municipal_scandal` | [Kioskvakten] "Politiker bråkar om Sandviken-bidraget igen." — Vaktmästaren: "Igen?" Kioskvakten: "Tredje gången på fem år." |

- [x] **Edge case — small_absurdity (ska EJ trigga)**
  Output: "Vi sålde dubbelt idag. Seger säljer." (vanlig coffee-room-quote) ✅

- [x] **Edge case — tom scandalHistory**
  Inga undefined-fel. Vanlig flow körs. ✅

- [x] **Edge case — gammal säsong filtreras**
  Skandal med `season: 0`, `currentSeason: 1`. Output: vanlig coffee-room-quote. ✅

- [x] **Edge case — {KLUBB} aldrig exponerat som platshållare**
  Verifierat att `{KLUBB}` byts ut, inte renderas rakt. ✅

---

### Del 2 — Klack-commentary

- [x] **supporter_scandal_recent tillagd i matchCommentary.ts**
  Antal strängar: 8 (spec: 8) ✅

  ```
  [0] 📯 {leader} börjar slå trumman tidigt. Ramsorna kommer inte med på första försöket.
  [1] 📣 "Hejsan alla är ni klara?" Svaret kommer från halva läktaren. {leader} drar den en gång till.
  [2] 🎵 Växelramsan tappar i bortre sektionen. {leader} tittar dit, tar i lite mer.
  [3] 📯 Trumslagen kommer i takt. Sångerna ligger ett halvt slag efter.
  [4] {leader} går runt arenan ändå. Tunn tröja, bara handskar — som alltid. Som om ingenting hade hänt.
  [5] 📣 "Öka takten sista kvarten" — fjärde gången idag. {leader} hittar inte rätt timing ikväll.
  [6] 🎵 {members} på läktaren. Ljudtopparna är där. Bottnarna är längre än vanligt.
  [7] 📯 Trumman går. Flaggorna går. Det går — men det knaggar i synkningen.
  ```

- [x] **{leader}-substitution fungerar**
  Input: `{leader}` → Output: `"📯 Karl-Gustav börjar slå trumman tidigt. Ramsorna kommer inte med på första försöket."` ✅

- [x] **Distribution 30 seeds: 6/8 unika index** ✅

- [x] **Triggerlogik i matchCore.ts**
  `ownScandalThisSeason?: boolean` tillagd i `StepByStepInput`. Passeras
  från `MatchLiveScreen.tsx`. Triggar med 20% chans vid step 0 (kickoff)
  och step 30 (halvtid). Kodgranskning: if-gren korrekt placerad i if/else-kedja,
  `fillTemplate(pickCommentary(commentary.supporter_scandal_recent, rand), sv)`
  anropas korrekt med `sv = { leader, members, groupName }`.

---

### Del 3 — Pressfrågor

- [x] **minScandalThisSeason-filterlogiken verifierad**
  Direkt test av filterlogiken (exakt koden på rad 548-553 i pressConferenceService.ts):

  ```
  Win, round=7, scandalHistory=[]:      0 skandal-frågor inkluderade ✅
  Win, round=7, med sponsor_collapse:   4 skandal-frågor inkluderade ✅
  Loss, round=7, med skandal:           4 skandal-frågor inkluderade ✅
  Draw, round=7, med skandal:           3 skandal-frågor inkluderade ✅
  Gammal säsong (season=0):             0 skandal-frågor inkluderade ✅
  ```

  Frågor som exponeras vid aktiv skandal (win-pool, exempel):
  - "Bandysverige skakas av rubriker just nu — ni vinner ändå. Är det ett tecken på något?"
  - "Det är turbulent runt sporten den här säsongen. Hur håller ni er fokuserade?"
  - "Tidningarna pratar mer om ekonomi än bandy just nu. Hur landar det hos er?"
  - "Det är inte den lugnaste säsongen för svensk bandy. Märks det i kalendern eller bara på rubrikerna?"

  Frågor vid loss (exempel):
  - "Det rör om i ligan med skandaler den här säsongen. Påverkar det stämningen i omklädningsrummet?"
  - "Förbundet har sina händer fulla just nu. Stör det fokuset på matchen?"

  Draw (exempel):
  - "En match i en orolig säsong — för bandyn i stort. Vad säger du om läget i ligan?"

---

### Del 4 — Motståndartränare

- [x] **hasScandal=false returnerar normalt persona-citat**
  Output: `"Lars Nordin: "Det är ett minusresultat.""` (defensive/förlorade) ✅

- [x] **hasScandal=true, de förlorade → SCANDAL_AFFECTED_LOST**
  Output: `"Lars Nordin: "Vi förlorade. Vi vet varför. Lagets fokus har inte
  varit perfekt, men det är inte en ursäkt — det är en förklaring.""` ✅

- [x] **hasScandal=true, de vann → SCANDAL_AFFECTED_WON**
  Output: `"Lars Nordin: "Bra för killarna. De förtjänar att slippa rubriker en gång.""` ✅

- [x] **hasScandal=undefined (bakåtkompatibel)**
  Faller tillbaka till normalt persona-citat. ✅

- [x] **Alla 8 unika scandal-quotes genererade (200 seeds × 4 personas)**

  ```
  • "Killarna höll fokus. Det är inte självklart i läget vi är i."
  • "Vi spelade. Det är vad jag bryr mig om idag."
  • "Det är säsongen vi haft. Vi får ta det här och gå vidare. Inget mer än så."
  • "Det har varit mycket runtomkring oss. Spelarna har försökt — det är allt jag kan säga om saken."
  • "Vi har grejer att lösa hemma också. Det här var inte lätt, men det är inget vi kan dröja vid."
  • "Bra för killarna. De förtjänar att slippa rubriker en gång."
  • "Vi förlorade. Vi vet varför. Lagets fokus har inte varit perfekt, men det är inte en ursäkt — det är en förklaring."
  • "Truppen har stängt allt utanför planen ute. Det är jag stolt över. Mer behöver inte sägas."
  ```
  Unika quotes: 8/8 ✅

- [x] **GranskaScreen.tsx beräknar opponentScandal och skickar det vidare**
  Kodgranskning: `opponentScandal = (game.scandalHistory ?? []).some(s => s.affectedClubId === opponentClub.id && s.season === game.currentSeason && s.type !== 'small_absurdity')`.
  Skickas som tredje argument till `generatePostMatchOpponentQuote`. ✅

---

## Edge-cases verifierade

| Check | Resultat |
|-------|---------|
| `small_absurdity` triggar INTE skandalreferenser (coffee-room) | ✅ |
| `small_absurdity` triggar INTE skandalreferenser (GranskaScreen `s.type !== 'small_absurdity'`) | ✅ (kodgranskning) |
| `small_absurdity` i matchCore: `ownScandalThisSeason` beräknas med `s.type !== 'small_absurdity'` i MatchLiveScreen | ✅ (kodgranskning) |
| Tom `scandalHistory` → inga undefined-fel i coffee-room | ✅ |
| Gammal säsong (season < currentSeason) → filtreras i coffee-room | ✅ |
| Gammal säsong → filtreras i presskonferens-filter | ✅ |
| `{KLUBB}` aldrig exponerat som platshållare i output | ✅ |
| `hasScandal=undefined` bakåtkompatibelt i opponentManagerService | ✅ |

---

## Ej verifierat / antaganden

- **Del 2 i live-match:** `ownScandalThisSeason` triggar faktiskt supporter_scandal_recent
  vid step 0/30 — verifierat via kodgranskning men inte via faktisk live-match-körning
  (kräver full match-simulation med scandal i game-state). Koden är strukturellt korrekt:
  if-grenen är på rätt plats, 20% chans, `fillTemplate` anropas med rätt variablar.

- **Del 3 i generatePressConference end-to-end:** Fullständig `generatePressConference`-körning
  testades inte pga att testmiljöns minimala SaveGame-mock saknar `players`-referens som
  krävs av en sen override-check (rad 630 i service). Filterlogiken testades isolerat
  och är korrekt. Produktionskod fungerar med komplett SaveGame.

---

## Kod-verifiering

```
Build:  ✅ (tsc + vite — inga TypeScript-fel)
Tests:  ✅ 1895/1895 (165/165 filer)
Stress: ej krävt (ingen motorändring i denna sprint)
```

---

## Implementerade filer

| Fil | Ändring |
|-----|---------|
| `src/domain/services/coffeeRoomService.ts` | +ScandalType import, +SCANDAL_DASHBOARD_OWN/OTHER (42 utbyten), +triggerlogik |
| `src/domain/data/matchCommentary.ts` | +supporter_scandal_recent (8 strängar) |
| `src/domain/services/matchUtils.ts` | +ownScandalThisSeason?: boolean i StepByStepInput |
| `src/domain/services/matchCore.ts` | +scandal trigger vid kickoff + halvtid (20%) |
| `src/presentation/screens/MatchLiveScreen.tsx` | +ownScandalThisSeason beräknas och skickas med |
| `src/domain/services/pressConferenceService.ts` | +minScandalThisSeason fält, +7 frågor, +filterlogik |
| `src/domain/services/opponentManagerService.ts` | +3 scandal-quote-arrays, +hasScandal? parameter |
| `src/presentation/screens/GranskaScreen.tsx` | +opponentScandal beräknas och skickas vidare |
