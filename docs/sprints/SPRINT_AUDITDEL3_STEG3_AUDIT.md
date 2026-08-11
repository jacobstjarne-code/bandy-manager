# AUDIT DEL 3, steg 3 — Club "Klubben i korthet" — audit

## Punkter i spec
- [x] Strip ovanför de sex flikarna, alltid synlig — verifierat i: `ClubScreen.tsx`, renderas innan `{/* Tab bar */}`, oberoende av `activeTab`.
- [x] Era-titel från `clubEraService.ts` (INTE `ClubMemorySeasonSection.tsx`s `ERA_LABELS`) — verifierat: `calculateClubEra(game)` + `eraLabel(era)` importerade från `../../domain/services/clubEraService`.
- [x] Öppna minnen — samma datakälla som Minne-fliken (`ClubMemoryView.tsx:82`s `game.activeAnniversaries ?? []`), ingen ny datakälla.
- [x] No false empty states — kolumnen "öppna minnen" renderas bara när `openMemories > 0`, annars inget kort, ingen platshållare.
- [x] Baseline före ombyggnad — två nya dev-scener byggda (`club-fresh`, `club-established`), inga fanns för ClubScreen tidigare.

## Rotorsaksfynd under arbetet (utöver spec)

**"Epok · år N" hade fel källfält, tre gånger, innan rätt fält hittades:**
1. Först `trainerArc.seasonCount` — fel: räknas upp först vid säsongsslut (`trainerArcService.ts:165`), skulle visa "år 0" under hela spelarens faktiska första säsong.
2. Sedan `game.currentSeason` — fel: det är kalenderår (`createNewGame.ts:186`, default 2026), inte ett säsongsindex. Bevisat i browser: club-fresh visade "EPOK · ÅR 2026".
3. Rätt fält: `game.managerProfile.seasonsAtClub` — redan etablerat och redan visat identiskt i `TranareTab.tsx:101` ("Säsong {profile.seasonsAtClub} i klubben"), 1-indexerat, default 1 (`managerProfileService.ts:40`). Ingen ny datakälla uppfanns.

Detta hade inte fångats av tsc eller vitest — bara browser-verifiering (CLAUDE.md: "BROWSER-VERIFIERING FÖRE RAPPORT") avslöjade det, i det andra steget genom att faktiskt läsa siffran på skärmen.

**cardPadding-fyndet (design-audit):** stripens `card-sharp` hade padding `11px 13px` (en fri uppskattning från mockens rå-CSS), designAudit-regeln kräver `10px 12px` eller `7px 10px`. Fixat till `10px 12px`. Bekräftat borta ur audit-rapporten efter fix.

## Observerat i UI (Playwright, headless, `/dev/scenes`)

- **club-fresh** (`makeBaseGame({ seed: 2 })`, `createTrainerArc()`-default): "Överlevnad", "Epok · år 1", ingen minnes-kolumn. Skärmdump: se sessionens scratchpad `club-fresh.png`.
- **club-established** (`atRound(..., 20)`, `trainerArc: { seasonCount:6, bestFinish:6, titlesWon:0 }`, `communityStanding:75`, `managerProfile.seasonsAtClub:6`, tre `withAnniversary`-applikationer): "Etablering", "Epok · år 6", "3", "Öppna minnen ›". Klick på "Öppna minnen" bytte korrekt till Minne-fliken (verifierat via `innerText()`-diff före/efter klick — Minne-flikens innehåll, "Säsong 2026 PÅGÅENDE", syntes efter klicket).
- Era-beräkningen kontrollerades mot `calculateClubEra`: `bestFinish:6, titlesWon:0` valdes medvetet istf `bestFinish:3, titlesWon:1` — de senare hade träffat legacy-villkoret (`bestFinish<=4 || titlesWon>=1`) före establishment hann prövas, vilket hade gett "Storhetstid" i en scen döpt "etablerad epok".

## Kod-verifiering
- `npx tsc --noEmit`: rent.
- `npm test -- --run`: 1470/1470 gröna (151 filer).
- `npm run build`: rent, `ds-guard: på baslinje ✓`.
- `npm run lint:design`: `design-tokens: grep-rent ✓`.
- `npm run lint:text-guard`: `text-guard: grep-rent ✓`.
- `window.__designAudit({ format: 'text' })` kört mot `club-established`: `cardPadding`-fyndet för den nya kortet borta efter fix. Kvarvarande fynd (sectionLabels 9px/2.5px vs förväntat 8px/2px, emojiConsistency 🟥, consoleErrors "setState under rendering") verifierade som pre-existing genom jämförelse mot en obesläktad baseline-scen (`tabell`) — samma fynd, samma antal, oberoende av Club-stripen. Dessa hör till `.h-label`-klassen (används i hela appen) respektive DevScenesScreens egna `useMemo`-mönster, inte till detta steg.

## Ej verifierat / antaganden
- Entitets-dedup-grinden (`assertNoDuplicateEntityIds`) kördes INTE mot de nya scenerna i denna audit — Club-stripen renderar inga entiteter med `data-entity-id` (bud/event/storyline), så grinden är strukturellt inte relevant här. Playwright-baseline-snapshots (`test:visual`) för `club-fresh`/`club-established` genereras först när Linux-baselines triggas (fortsatt Jacobs handling, se BACKLOG D-DEDUP1/tidigare rapportering).

## Nya lärdomar till LESSONS.md
Inget nytt mönster — "fel fält som råkar kompilera" (seasonCount → currentSeason → seasonsAtClub) är samma klass som redan täcks av VERIFIERINGSPROTOKOLLETs punkt 5 ("vid tvekan: visa koden, inte slutsatsen") och browser-verifieringsregeln. Ingen ny LESSON, existerande disciplin fångade det.
