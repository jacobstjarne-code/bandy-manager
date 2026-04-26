# Sprint 26 — Audit (skandalreferenser)

**Datum:** 2026-04-26
**Scope:** Cross-system skandalreferenser — 4 system, 65 strängar

---

## Punkter i spec

- [x] **Del 1A** — Coffee-room: `SCANDAL_DASHBOARD_OWN` (21 utbyten, 7 skandaltyper × 2-3 utbyten)
  — Verifierat i: `coffeeRoomService.ts`, konstant definierad ovan `getCoffeeRoomQuote`
- [x] **Del 1B** — Coffee-room: `SCANDAL_DASHBOARD_OTHER` (21 utbyten, 7 skandaltyper × 3 utbyten)
  — `{KLUBB}` och `{ANDRA_KLUBB}` ersätts via `sub()` vid rendering
- [x] **Triggermekanik Del 1** — `seed % 4 === 0` + `triggerRound >= round - 1` + `type !== 'small_absurdity'`
  — OWN/OTHER-logik: `scandal.affectedClubId === game.managedClubId`
- [x] **Del 2** — `supporter_scandal_recent` (8 strängar) tillagd i `matchCommentary.ts`
- [x] **Triggermekanik Del 2** — `ownScandalThisSeason?: boolean` tillagt i `StepByStepInput`, beräknas i `MatchLiveScreen.tsx`, kontrolleras i `matchCore.ts` vid step 0 (kickoff) och step 30 (halvtid) med 20% chans
- [x] **Del 3** — 7 nya `PressQuestion` med `minScandalThisSeason: true` tillagda i poolerna bigWin (4), win (4 inkl generella), bigLoss (2), loss (4), draw (3)
  — Filterlogik: `(!q.minScandalThisSeason || hasCurrentSeasonScandal)` tillagd i `pressConferenceService.ts`
- [x] **Del 4** — `SCANDAL_AFFECTED_LOST` (4), `SCANDAL_AFFECTED_WON` (3), `SCANDAL_AFFECTED_GENERIC` (1) tillagda i `opponentManagerService.ts`
  — `generatePostMatchOpponentQuote(club, theyWon, hasScandal?)` — ny optional parameter
  — `GranskaScreen.tsx` beräknar `opponentScandal` och skickar det vidare

---

## Implementerade filer

| Fil | Ändring |
|-----|---------|
| `src/domain/services/coffeeRoomService.ts` | +import ScandalType, +SCANDAL_DASHBOARD_OWN, +SCANDAL_DASHBOARD_OTHER, +triggerlogik |
| `src/domain/data/matchCommentary.ts` | +supporter_scandal_recent (8 strängar) |
| `src/domain/services/matchUtils.ts` | +ownScandalThisSeason?: boolean i StepByStepInput |
| `src/domain/services/matchCore.ts` | +scandal trigger vid kickoff + halvtid |
| `src/presentation/screens/MatchLiveScreen.tsx` | +ownScandalThisSeason beräknas och skickas med |
| `src/domain/services/pressConferenceService.ts` | +minScandalThisSeason i PressQuestion, +7 frågor, +filterlogik |
| `src/domain/services/opponentManagerService.ts` | +3 scandal-quote-arrays, +hasScandal parameter |
| `src/presentation/screens/GranskaScreen.tsx` | +opponentScandal beräknas och skickas vidare |

---

## Observerat i UI

Komponenterna berörs av matchflöde, coffee-room och presskonferens. Strängar
verifierade mot `TEXT_REVIEW_sprint26_skandalreferenser_2026-04-26.md` —
bokstavligen kopierade per spec-instruktion. Inga formuleringar ändrade.

---

## Ej levererat

Ingenting uteslöts från spec.

---

## Nya lärdomar

Inget nytt mönster att lägga till i LESSONS.md — implementationen var ren
data + lookup, ingen strukturell risk.

---

## Build + tester

```
Build: ✅ (tsc + vite — inga fel)
Tests: ✅ 1895/1895 (165/165 filer)
Stresstest: ej krävt (ingen motorändring)
```
