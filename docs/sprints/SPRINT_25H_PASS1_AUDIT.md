# Sprint 25h Pass 1 — audit (Lager 1: Världshändelser)

## Punkter i spec

- [x] 6 skandalarketyper: sponsor_collapse, club_to_club_loan, treasurer_resigned, phantom_salaries, fundraiser_vanished, coach_meltdown
- [x] Trigger-fönster: omg 6-8, 12-14, 18-20, 24-26 — 25% chans per fönster
- [x] En klubb träffas max en gång per säsong — verifierat i test
- [x] Spelarens egen klubb träffas ALDRIG — verifierat i test
- [x] `scandalService.ts` med checkScandalTrigger, applyScandalEffect, resolveExpiredScandals, isTransferFrozen
- [x] SaveGame utökad: activeScandals, scandalHistory, pointDeductions, pendingPointDeductions
- [x] InboxItemType.Scandal = 'scandal' tillagd i enums
- [x] calculateStandings tar optional `pointDeductions?: Record<string, number>`
- [x] phantom_salaries: −2 poäng current season via pointDeductions
- [x] club_to_club_loan: −3 poäng nästa säsong via pendingPointDeductions
- [x] sponsor_collapse: −400k direkt på klubbens finances
- [x] coach_meltdown + fundraiser_vanished: temporär reputationsträff, återställs vid resolution
- [x] processScandals i eventProcessor med skipSideEffects-option
- [x] Integration i roundProcessor: kallas efter processGameEvents, delta-applicering på postTransferClubs

## Avvikelser från spec (rapporterade)

- **communityStanding AI-klubbar**: Spec säger "CS −15" för fundraiser_vanished. CS-fältet existerar bara för managed club. Ersatt med `reputation −8` för AI-klubbar — funktionellt ekvivalent för motorn.
- **Transfer-frys**: Tracked via isTransferFrozen(game, clubId) som läser activeScandals. Inte ännu kopplat till createOutgoingBid — flaggan finns men enforcement i Pass 2.
- **Panic-sale**: sponsor_collapse-specat kan trigga panic-sale på spelare. Ej implementerat i Pass 1 — struktur finns (skandalen är lagrad), kan kopplas in i transferService i Pass 2.

## Verifiering

```
npm run build → ✓ built in 8.43s
npm test      → 1876/1876 passed (164 test files, 18 nya)
npm run stress -- --seeds=3 --seasons=2 → 0 kraschar, 0 invariantbrott
```

## Commit

`9d82e28` — feat: bandyskandaler lager 1 — världshändelser (pass 1/3)

## Kurerad text (status)

Placeholder-text inlagd i scandalService.ts (SCANDAL_TEXT). Opus levererar kurerad text separat — kan uppdateras utan kodändring (3 titlar + 3 bodies + 2 rubriker + 2 kafferum per arketyp = ~60 strängar).
