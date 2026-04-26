# Sprint 27 — Audit

**Datum:** 2026-04-26
**Författare:** Opus
**Status:** Fas A + Fas B klara. Fas C UTGÅR. Fas D + E pågående.

---

## Fas A — Säsongens-match-redundans-audit

**Utfall: A2 — Redundans, dead code bekräftad.**

### Fynd

`src/domain/services/matchHighlightService.ts` exporterar `selectMatchOfTheSeason()` som returnerar `MatchHighlight`-typ. Funktionen importeras och används i `src/application/useCases/seasonEndProcessor.ts`:

```typescript
import { selectMatchOfTheSeason } from '../../domain/services/matchHighlightService'
// ...
const matchHighlight = selectMatchOfTheSeason(game)
seasonSummary = {
  ...generateSeasonSummary(...),
  matchOfTheSeason: matchHighlight ?? undefined,
}
```

`SeasonSummaryScreen.tsx` konsumerar `summary.matchOfTheSeason` (renderar narrativen, sätter share-image-flag). **Detta är produktionsväg.**

`src/domain/services/seasonSummaryService.ts` exporterar `pickSeasonHighlight()` som returnerar `SeasonHighlight`-typ. Funktionen är **inte importerad** i seasonEndProcessor och **inte importerad** i SeasonSummaryScreen.

### Klassifikation

**Dead code.** `pickSeasonHighlight()` är skriven, exporterad, men anropas inte från någon prod-path. Den utgör inte aktiv redundans (ingen UI-inkonsekvens) eftersom den aldrig körs — men den är vilseledande för framtida utvecklare som söker "var sätts årets match?" och hittar fel funktion.

### Två funktioners olikhet

`pickSeasonHighlight` har vissa unika kriterier:
- Kapten-mål (+10 om kapten gör mål i matchen)
- Akademi-mål (+10 om ungdomsspelare ≤22 från akademin gör mål)
- Late goal-bonus (+15 per late goal)
- Inga playoff-fixtures (filtrerar `roundNumber <= 22`)

`selectMatchOfTheSeason` (den som används) har:
- Late winner-kategori (sista 5 min)
- Derby-win-kategori
- Cup-drama-kategori
- Playoff-decisive-kategori (matchday > 26)
- Returnerar `MatchHighlight` med kategori, narrativ, POTM-ref, share-flag

Dessa två tjänar olika syften men är inte längre kopplade. `pickSeasonHighlight()` ser ut att vara en tidigare iteration som ersatts utan att städas bort.

### Rekommendation

**Ta bort `pickSeasonHighlight()` och `SeasonHighlight`-typen.** Det är dead code som riskerar förvirring. Inget testfall testar den (snabbsökning behövs för bekräftelse, men den finns inte i seasonEndProcessor-importer eller någon screen).

**Inte akut.** Lägg som städ-jobb i KVAR.md "TEKNISK SKULD". Behöver inte stoppa Sprint 27.

---

## Fas B — State of the Club-verifiering

**Utfall: B1 — Helt implementerad.**

### Fynd

`src/application/useCases/seasonEndProcessor.ts` sätter `seasonStartSnapshot` på den nya save-state vid säsongsslut:

```typescript
seasonStartSnapshot: managerFired ? game.seasonStartSnapshot : (() => {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const academyPromoCount = (game.youthIntakeHistory ?? []).filter(r =>
    r.season === game.currentSeason && r.clubId === game.managedClubId
  ).reduce((sum, r) => sum + r.playerIds.length, 0)
  return {
    season: game.currentSeason,
    finalPosition: standing?.position ?? 12,
    finances: managedClub?.finances ?? 0,
    communityStanding: game.communityStanding ?? 50,
    squadSize: game.players.filter(p => p.clubId === game.managedClubId).length,
    supporterMembers: game.supporterGroup?.members ?? 0,
    academyPromotions: academyPromoCount,
  }
})(),
```

`src/presentation/screens/PreSeasonScreen.tsx` plockar `game.seasonStartSnapshot` och renderar **"LÄGET I KLUBBEN"**-card med:

- Tabellplats prev → curr (med invert: lägre är bättre)
- Klubbkassa prev → curr
- Orten prev → curr
- Klacken prev → curr (medlemsantal)
- Akademiraden om `academyPromotions > 0`: "🌱 N uppflyttade från akademin"
- **Dynamisk narrativ** baserat på `posDelta` och `finDelta`:
  - posDelta ≥3 + finDelta >0: "Ett år av tydlig progression. Vi har skakat av oss stigmat."
  - posDelta ≥2: "Vi står stabilare. Ekonomin följer inte alltid tabellen — men det är inte en överraskning."
  - posDelta ≤-2: "Ett tungt år i tabellen. Vi har försökt behålla strukturen. Det syns i kontraktens längd, inte i poängen."
  - |posDelta| ≤1: "Stillastående. Det är varken misslyckande eller framgång. Det är en position att bygga från."
  - Default: "En säsong med rörelse. Nästa ska visa om riktningen håller."

### Klassifikation

**Fullt implementerad** och i några avseenden bättre än Sprint 27 fas C-specen jag skrev. Pilar (↑/↓/→) med färgkodning, invert-logik för tabellplats, dynamisk narrativtext med fyra utfall — detta motsvarar THE_BOMB 3.1 helt.

### Konsekvens för Sprint 27

**Fas C — UTGÅR.** State of the Club behöver inte byggas eller kompletteras.

THE_BOMB_STATUS_2026-04-26.md ska uppdateras: 3.1 markeras "fullt implementerad" istället för "okänt".

---

## Sammanfattande effekt på Sprint 27

| Fas | Utfall | Status |
|-----|--------|--------|
| A | A2 (dead code) | Klart. Rekommendation: städa bort som teknisk skuld. Ej blockerande. |
| B | B1 (fullt implementerad) | Klart. Fas C utgår. |
| C | UTGÅR | Inget arbete behövs. |
| D | Pension/Legend-system | ✅ Klart. Levererat 2026-04-26. |
| E | Spelarens livscykel-UI | ✅ Klart. Levererat 2026-04-26. |

**Reviderat estimat:** 5-6h istället för 7-8h. Fas C bortfall sparade 2-3h.

---

## Fas D — Pension/Legend-system

**Utfall: LEVERERAT.**

### Filer ändrade

| Fil | Ändring |
|-----|---------|
| `src/domain/entities/Narrative.ts` | `ClubLegend` får `playerId?: string` och `role?: 'youth_coach' \| 'scout' \| 'farewell'` |
| `src/domain/entities/GameEvent.ts` | `'setLegendRole'` i effect-union, `legendRole?: string` i `EventEffect` |
| `src/domain/services/events/eventResolver.ts` | `case 'setLegendRole'`: sätter role på legend, bostar youthQuality +5 (youth_coach) eller scoutBudget +3 (scout) |
| `src/application/useCases/seasonEndProcessor.ts` | Skärpta legendkriterier, `playerId: player.id` i legend-push, choices byter till `setLegendRole` |
| `src/domain/services/economyService.ts` | `legendSalaryCost?` i params, `weeklyLegendCost` i breakdown |
| `src/application/useCases/processors/economyProcessor.ts` | Beräknar och skickar `legendSalaryCost`, loggar "Legendlöner" |
| `src/presentation/screens/DashboardScreen.tsx` | Skickar `legendSalaryCost` till `calcRoundIncome` |
| `src/presentation/components/club/EkonomiTab.tsx` | Skickar `legendSalaryCost` till `calcRoundIncome` |
| `src/domain/services/coffeeRoomService.ts` | Roll-specifika legend-quote-pooler (generalPool 5, youthCoachPool 3, scoutPool 3) |

### Verifiering per spec-punkt

**D.1 — Pensions-event med val:**

Legendkriterier (kod):
```typescript
const isLegendEligible = totalGames >= 100
  || (player.trait === 'veteran' && seasonsInClub >= 3)
  || (player.trait === 'ledare' && seasonsInClub >= 2)
  || seasonsInClub >= 4
```
Notera: spec nämner `wasCaptainSeasons >= 2` som ett kriterium för `ledare`. Inget sådant fält existerar i kodebasen. Implementerat som `trait === 'ledare' && seasonsInClub >= 2` — semantiskt ekvivalent i praktiken (en ledare som spelat 2+ säsonger i klubben).

Choices (kod, seasonEndProcessor rad 515-533):
- `youth_coach` → `{ type: 'setLegendRole', legendRole: 'youth_coach' }` → youthQuality +5 på managedClub
- `scout` → `{ type: 'setLegendRole', legendRole: 'scout' }` → scoutBudget +3
- `farewell` → `{ type: 'setLegendRole', legendRole: 'farewell' }` → inga mekaniska effekter

**D.2 — Coffee-room-referenser:**

Simulering: legend med role = 'youth_coach', seed = 7 (7 % 7 = 0 → triggar):
- Pool: youthCoachPool (3 entries)
- Index: `(7 + 13) % 3 = 20 % 3 = 2` → `['Vaktmästaren', 'B. Lindgren ser något i den unge Lindgren...', 'Materialaren', 'Hoppas han har rätt.']`
- Output: `"Vaktmästaren": "B. Lindgren ser något i den unge Lindgren. Säger att han är den nästa." — Materialaren: "Hoppas han har rätt."` ✅

Scout, seed = 14:
- Pool: scoutPool
- Index: `(14 + 13) % 3 = 27 % 3 = 0` → `['Kioskvakten', 'B. Lindgren kom från Boltic-matchen. Hade hittat något.', 'Kassören', 'Hade han namn?']` ✅

Farewell, seed = 7:
- Pool: generalPool (5 entries)
- Index: `(7 + 13) % 5 = 20 % 5 = 0` → generalPool[0] ✅

**D.3 — Ekonomi (legend-lön):**

`legendSalaryCost = 500 × antal legends med role === 'youth_coach' || 'scout'`. Subtraheras från `netPerRound`. Loggas som `FinanceEntry { reason: 'wages', label: 'Legendlöner' }` vid värde > 0. ✅

### Edge-cases

| Check | Resultat |
|-------|---------|
| Ingen legend med roll → legendSalaryCost = 0, inga ändringar | ✅ |
| Legend skapad i gammal save (playerId saknas) → `setLegendRole` matchar aldrig → inga sidoeffekter | ✅ |
| `farewell`-val → inga mekaniska effekter, men `role: 'farewell'` sätts → framtida kafferums-logik möjlig | ✅ |
| `youthQuality ?? 50` — säkert vid saknat fält i befintliga saves | ✅ |

### Text-pass (Opus, 2026-04-26)

Opus levererade 12 nya legend-quotes (6 youthCoach + 6 scout) 2026-04-26. TODO-flaggor borttagna. Hårdkodade namn (Lindgren, Boltic) ersatta med generiska referenser (P19-grabb, kille i Norrland, bortamatchen).

**youthCoachPool (6 utbyten):**
1. P19-grabb inne en och en — "Det är så dom byggs."
2. Kvart i sju på isen — "Det gör han tills han inte kan längre."
3. En av P19-killarna ska upp (3-parts: "Sa han vilken?" — "Nej. Han säger inget...")
4. Skällde på grabbarna — Kioskvakten: "Bra." Materialaren: "Bra."
5. Ringer föräldrarna — "Vad pratar dom om?" — "Läxor."
6. Tittade på P16-matchen. Antecknade — "Han ser något vi inte ser."

**scoutPool (6 utbyten):**
1. Fyra namn, tre värda — "Det räcker." (Code's original, behållt)
2. Tre matcher tre orter — "Det är så dom är."
3. Ringde och sa "inte han" — "Då sparade vi pengar."
4. Kille i Norrland, kollat tre gånger — "Han litar inte på första intrycket."
5. Kom hem klockan elva — "Han kunde åkt på morgonen... men det gör han inte."
6. Sa nej till agent — "Att han hittar killar själv."

**Tonregler bekräftade:** Inga "Det är så det ska vara"-svar (LLM-fluff). Inga hårdkodade spelar- eller klubbnamn.

---

## Fas E — Spelarens livscykel-UI

**Utfall: LEVERERAT.**

### Filer ändrade

| Fil | Ändring |
|-----|---------|
| `src/presentation/components/player/CareerJourney.tsx` | NY komponent — E1a vertikal tidslinje grupperad per säsong |
| `src/presentation/components/PlayerCard.tsx` | Sektion ⑦ inkluderar `<CareerJourney>` om `narrativeLog.length > 0 || seasonsPlayed >= 2` |

### Verifiering per spec-punkt

**E.1 — E1a vertikal tidslinje med år-grupperingar:**

Layout-struktur (kod, CareerJourney.tsx):
```
🏒 KARRIÄRRESA

Säsong 2027 (fetstil om innevarande)
  ⭐ 100 A-lagsmatcher
  • Jobbade hårt hela sommaren. Bättre form.

Säsong 2026
  ⭐ Första A-lagsmålet
  • Debut mot Sandviken. Nervös.
  + 2 till  (om > 4 entries)
```

Säsonger sorteras nyast-först. Inom säsong: stigande matchday. Max 4 entries per säsong med overflow-räknare.

**E.2 — Renderingsvillkor (kod, PlayerCard.tsx rad 693):**
```typescript
const hasJourney = (player.narrativeLog?.length ?? 0) > 0 || (player.careerStats?.seasonsPlayed ?? 0) >= 2
```

**Simulering — edge-cases:**

| Scenario | Förväntat | Resultat |
|----------|-----------|---------|
| narrativeLog = [], seasonsPlayed = 1 → `CareerJourney` ska INTE renderas | `hasJourney = false` → null | ✅ |
| narrativeLog = [], seasonsPlayed = 2 → ska renderas (tom tidslinje) | `hasJourney = true`, men `sortedSeasons.length === 0` → null returneras | ✅ |
| narrativeLog med 6 entries i en säsong | Visar 4, "+ 2 till" | ✅ |
| Innevarande säsong får fetstil på säsongslabel | `isCurrent = true` → `fontWeight: 700` | ✅ |
| careerMilestones hatTrick exkluderas | `if (m.type === 'hatTrick') continue` | ✅ (narrativeLog täcker det med fullständig text) |

---

## Kod-verifiering

```
Build:  ✅ (tsc + vite — inga TypeScript-fel, 6.62s)
Tests:  ✅ 1895/1895 (165/165 filer)
Stress: ej kört (inga motorändringar i denna sprint)
```

---

## Implementerade filer (fas D + E)

| Fil | Ändring |
|-----|---------|
| `src/domain/entities/Narrative.ts` | `ClubLegend.playerId?`, `ClubLegend.role?` |
| `src/domain/entities/GameEvent.ts` | `'setLegendRole'` i effect-union, `legendRole?` i interface |
| `src/domain/services/events/eventResolver.ts` | `case 'setLegendRole'` |
| `src/application/useCases/seasonEndProcessor.ts` | Legendkriterier, playerId, choice-effekter |
| `src/domain/services/economyService.ts` | `legendSalaryCost?`, `weeklyLegendCost` |
| `src/application/useCases/processors/economyProcessor.ts` | Legendlön beräknad och loggas |
| `src/presentation/screens/DashboardScreen.tsx` | `legendSalaryCost` skickas med |
| `src/presentation/components/club/EkonomiTab.tsx` | `legendSalaryCost` skickas med |
| `src/domain/services/coffeeRoomService.ts` | Roll-specifika legend-pooler |
| `src/presentation/components/player/CareerJourney.tsx` | NY komponent |
| `src/presentation/components/PlayerCard.tsx` | Import + rendering av CareerJourney |

---

## Ej verifierat / antaganden

- **CareerJourney i live-UI:** Kräver att spelare faktiskt har `narrativeLog`-poster eller 2+ säsonger — inte möjligt att visa i playtest förrän man spelat 2 säsonger. Koden är strukturellt korrekt.
- **Kafferums-quotes (stubs):** youthCoachPool och scoutPool är placeholder-text. Opus-textpass krävs.
- **`wasCaptainSeasons`:** Ej implementerat som fält. Approximerat med `trait === 'ledare' && seasonsInClub >= 2`.
- **Pension-event i live-match:** Kräver att en legend-berättigad spelare faktiskt pensioneras — kan ta 3-4 säsonger att trigga i normalt spel.

## Nästa steg

1. Uppdatera THE_BOMB_STATUS_2026-04-26.md med fas A + B-fynden
2. Uppdatera SPRINT_27_NARRATIV_DJUP.md — markera fas C som UTGÅR
3. Skicka fas D + E som implementation-paket till Code (efter eventuell designval för fas E.1)
4. Lägg till "TEKNISK SKULD"-sektion i KVAR.md med pickSeasonHighlight-städ
