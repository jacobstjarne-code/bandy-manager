# AUDIT DEL 3, steg 4 — Anläggning "builtSeason" — audit

## Punkter i spec
- [x] Fältet skrivs per nod när noden byggs — verifierat i: `facilityService.ts`s `advanceFacilityState()`, samma completion-punkt som redan skriver `builtNodeIds` och `lastCompleted`.
- [x] Ingenting konsumerar det ännu, och ingenting byggt som konsumerar det nu — inga läsningar av `builtSeasons` utanför `facilityService.ts` och testfilen. Grep bekräftar: `grep -rn "builtSeasons" src/` ger bara skriv-stället, typdeklarationen och testerna.
- [x] Migration: valfritt fält, `undefined` för noder byggda före ändringen, ingen gissning bakåt — `FacilityState.builtSeasons?: Record<string, number>`, testat explicit (se "migration"-testet nedan).
- [x] Projekt bortom egna arenan ingår inte — orört, ingen sådan kod finns än (etapp C).

## Rotorsak

`advanceFacilityState()` tog redan emot `season` som tredje parameter men ignorerade den (`_season`, understreck-prefix som markerar "medvetet oanvänd"). Fältet fanns med i signaturen men aldrig i data — samma klass av hål som `HallTrial.completedSeason`-kommentaren i `Community.ts` redan pekade ut ("Krönikans årsdagar får ett hål som inte går att laga i efterhand"). Lösningen är alltså inte ny mekanik — bara att sluta kasta bort en parameter som redan skickas in korrekt från `communityProcessor.ts:236` (`game.currentSeason`).

## Implementation

- `Community.ts`: `FacilityState.builtSeasons?: Record<string, number>` — parallell karta till `builtNodeIds`, inte en breaking-change av den (den arrayen används på för många ställen — `.includes`, `Set(...)`, `.filter` — för att göras om till objekt utan att röra allt runtomkring, vilket vore scope-expansion utöver detta steg).
- `facilityService.ts`:
  - `advanceFacilityState`: `_season` → `season`, skriver `builtSeasons: { ...state.builtSeasons, [nodeId]: season }` vid completion. Spread av `undefined` (gamla saves utan fältet) ger `{}`, ingen krasch.
  - `createInitialFacilityState()`: initierar `builtSeasons: {}` för NYA spel. Detta är inte bakåt-gissning (specens förbud) — det är ett framåtriktat default för spel som skapas efter ändringen, samma logik som att en ny array startar tom.
- Ingen ändring i `communityProcessor.ts` — anropet skickade redan rätt säsong, bara döpte om variabeln i signaturen.

## Kod-verifiering
- `npx tsc --noEmit`: rent.
- `npm test -- --run`: 1473/1473 gröna (151 filer, +3 nya tester i `facilityService.test.ts`).
- Nya tester: (1) säsongen skrivs för den byggda noden, (2) tidigare byggda noders säsonger bevaras vid nästa completion (spread-sammanfogning, inte overwrite), (3) migration — en `FacilityState` utan `builtSeasons` alls (gammal save-form) kraschar inte och gissar inte ett värde för den redan byggda noden, bara den nya får ett värde.
- `npm run build`: rent, `ds-guard: på baslinje ✓`.
- `npm run lint:design` / `lint:text-guard`: gröna.

## Ej relevant för detta steg
- Ingen browser-verifiering — inget UI ändrades, ingen yta läser fältet (per spec: "ingenting ska byggas som konsumerar det nu"). CLAUDE.md's browser-verifieringsregel gäller ytor som renderar något för spelaren; detta är ett rent domän-skriv utan synlig effekt.
- Ingen Playwright-baseline — samma skäl.

## Nya lärdomar till LESSONS.md
Inget nytt mönster.
