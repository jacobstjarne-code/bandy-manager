# CODE-LEVERANS 2026-06-09 — Säsongsflöde (S1 / S2+)

Startpunkt för denna pass. Bygg i ordning, bygg och testa efter varje del.

## Kontext

Opus har diagnostiserat säsongsövergångarna. Fyra saker fixades av Opus direkt
(seasonYear.ts, boardMeetingScene.ts-guard, PortalScreen-guard, journalist-outlook).
Resterande kräver kod-iteration: fyra avgränsade edits + ett trace + ett grep-svep.

Målläge:
- S1: ArrivalScene → portal (ingen season_kickoff-anslag, inget styrelsemöte)
- S2+: SeasonSummary → board_meeting-scen → portal

---

## Del 1 — Avaktivera season_kickoff-anslaget

**Fil:** `src/domain/services/anslagService.ts`

Ta bort blocket som returnerar `'season_kickoff'` i `computeNextAnslag`.
Guarden `game.currentSeason >= 2` (år-baserat) är bruten — tänds i S1 som
dubblett ovanpå styrelsemötet, och i S2+ som dubblerat board_meeting.

Ta även bort `BOARD_ANSLAG.season_kickoff` och `buildBoardReportText` om de
efter borttagningen är oanropade (verifiera med grep att inget annat importerar dem).

```bash
# Verifiera att 'season_kickoff' inte längre produceras
grep -rn "season_kickoff" src/ --include="*.ts" --include="*.tsx"
# Ska bara finnas i eventuell dead-data eller zero results
```

Commit: `fix: avaktivera season_kickoff-anslaget — bruten guard dubblerade styrelsemötet`

---

## Del 2 — boardMeetingStateResolver.ts: A-läge guard

**Fil:** `src/domain/services/boardMeetingStateResolver.ts`

**Nuvarande (fel):**
```typescript
if (game.currentSeason <= 2 || fulfillmentPct < 0)
```

**Ny:**
```typescript
if ((game.seasonSummaries?.length ?? 0) <= 1 || fulfillmentPct < 0)
```

A-läge = första styrelsemötet (en avslutad säsong i seasonSummaries).
Ordningstals-guard (`<= 2`) är år-baserad och feltriggar p.g.a. modellen.

```bash
npm run build && npm test
```

Commit: `fix: boardMeetingStateResolver A-läge guard → seasonSummaries.length`

---

## Del 3 — Trace: currentMatchday-reset vid säsongsväxling

**Syfte:** board_meeting-scenen och sunday_training kräver `currentMatchday === 0`.
Om säsongsövergången inte nollställer matchday tänds aldrig S2+-styrelsemötet.

**Filer att trace:a (läs, rör inte ännu):**
- `src/domain/services/seasonEndProcessor.ts` — letar du `currentSeason: nextSeason` i updatedGame
- `src/domain/services/roundProcessor.ts` → `advanceToNextEvent()` — vad sätts på updatedGame

Om `currentMatchday` inte nollställs i `seasonEndProcessor.ts`:

```typescript
// Lägg till i updatedGame-objektet i seasonEndProcessor:
currentMatchday: 0,
```

Verifiera: sätt en console.log på board_meeting-scen-triggern i DevScenesScreen
och kör ett snabbspel till S2 i dev-läge, bekräfta att scenen tänds.

Commit (om ändring behövs): `fix: reset currentMatchday: 0 vid säsongsövergång — krävs för board_meeting-trigger`

---

## Del 4 — Ordningstals-svep + tsc

**Syfte:** Hitta eventuella kvarvarande år-baserade ordningstalsjämförelser som
inte kom med i Opus-fixarna.

```bash
grep -rn "currentSeason ===" src/ --include="*.ts" --include="*.tsx"
grep -rn "currentSeason <=" src/ --include="*.ts" --include="*.tsx"
grep -rn "currentSeason >=" src/ --include="*.ts" --include="*.tsx"
grep -rn "currentSeason %" src/ --include="*.ts" --include="*.tsx"
grep -rn "currentSeason + 1" src/ --include="*.ts" --include="*.tsx"
grep -rn "currentSeason - 1" src/ --include="*.ts" --include="*.tsx"
grep -rn "SEASON_BASE_YEAR" src/ --include="*.ts" --include="*.tsx"
```

För varje träff: audita mot år-modellen. `currentSeason` är nu ett år (2024, 2025 …),
inte ett ordningstal (1, 2, 3 …). Jämförelser mot ordningstal (≤ 2, === 1, etc.)
är fel om de styr feature-logik.

`SEASON_BASE_YEAR` ska inte importeras av någon (Opus tog bort exporten).
Om träff finns: ta bort importen + riv upp beroende.

```bash
npx tsc --noEmit
npm test
```

Commit: `fix: ordningstals-svep — inga återstående år-jämförelser mot ordningstal`

---

## Verifiering efter alla fyra delar

```bash
npm run build && npm test
npm run lint:design
```

Manuellt:
- Nytt spel (S1): ArrivalScene monteras → ingen season_kickoff-anslag i inbox
- Forcera S2-övergång (dev-console eller stresstest): board_meeting-scen tänds → portal
- Inget dubbelt styrelsemöte i S1

Rapportera till Opus: "S1-flöde ok / S2-flöde ok / nollställning av matchday: [behövdes / behövdes inte]"

---

## Saker att INTE ändra

- `matchCore.ts` / stash@{0} — rör inte
- `scheduleGenerator.ts` — rör inte
- `currentMatchday`-räknaren i normala rundor — rör bara nollställningen vid säsongsövergång
- Befintliga Playwright-baselines — rör inte
