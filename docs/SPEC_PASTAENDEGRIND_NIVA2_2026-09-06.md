# SPEC_PASTAENDEGRIND_NIVA2 — R1–R4 (sluttest-narrative-truth-grind)

**2026-09-06 · Opus · domar mot Codes R1–R4-recon · Code bygger mot detta**

Fyra påståendegrindar som stänger klassen "texten påstår något om säsong/fas som
datan inte bär". Recon (Code) scopade och hittade att två av fyra inte kan skrivas
som ursprungligen spec'at. Domarna nedan är byggbara som de står.

## R1 — säsongsindex (byggbar nu, inkl. design-d2-fix)

**Regel:** ett naket `${...season...}` interpolerat i en renderad "säsong …"-sträng
UTAN `seasonSpanLabel()`, per fil → förbjudet. `maxAllowed: 0`.

**Baseline är INTE 0 i dag** — att landa R1 = fixa dessa fem sajter först (route
genom `seasonSpanLabel()`), annars failar grinden direkt (matchar MASTER-frasen
"baseline 0 efter ett svep"):
- `src/domain/format.ts:103` `formatContractUntil()` — enda källan för PlayerCard, ContractsTab:130, RenewContractModal
- `src/presentation/screens/scenes/BoardMeetingScene.tsx:151` och `:176`
- `src/presentation/components/transfers/ContractsTab.tsx:81` (bekräftelse-toast)
- `src/presentation/store/actions/transferActions.ts:247` (finanslogg-label)

**INGEN carve-out för "din N:e säsong"** — recon: strängen finns inte i src/.
Skydda inte ett mönster som inte existerar. Undantaget i spec:en var föregripande.

**Regressionsankare** (redan korrekta, lägg required-check mot): ChampionScreen,
CareerBreakScreen, MatchScreen, MatchLiveScreen, HistoryScreen, SeasonSummaryScreen,
KlubbparmOverlay, GameHeader, OrtenTab, matchShareImage, seasonShareImage.

**Stänger `design-d2-sasongsformat-tre`** (MASTER:649, i dag `verifierad`) → `klar`
när R1 + de fem fixarna landat.

## R2 — event-säsong-fraser (byggs SMALNAD, inte som spec'at)

`seasonVerified` finns inte som namn; den generella flavor-texten ("i år", "denna
säsong") är INTE målytan (ingen `entry.season` att verifiera mot → grep-svep = bara
falska positiva). Scope till ledger/entry-drivna producenter:

- `src/domain/attention/narrativePushCopyResolver.ts:101,128` — **required:** behåll
  `seasonsAgo`-gaten (`currentSeason - item.post.season`, bail om < 0 eller > 1 innan
  frasen väljs). Det ÄR seasonVerified, inline.
- `src/domain/services/portal/pickEfterklang.ts` — **forbidden:** strängen
  "X mål mot er den här säsongen" byggd på `goalsAgainstUs` (karriärackumulator, ej
  säsongsscopad). Fixad i a3dd2151 → får inte återkomma. Ankare:
  `src/__tests__/efterklangPremiss.test.ts:183-193`.
- `src/domain/services/seasonGoalService.ts` `deriveGoalOutcomeLine` — **required:**
  enda-anropar-invarianten (endast HistoryScreen:761; "i somras" korrekt by construction).
- `src/presentation/components/match/HalftimeModal.tsx:100-103` — **forbidden:** den
  strukna "förra året"-raden ska förbli död (komponenten har ingen säsongskoll).

**Code verifierar före scoping:** `src/domain/services/reviewCallbackService.ts:70`
("…som ni sålde i somras") — gate:ar producenten att försäljningen skedde FÖRRA
säsongen, eller vilken tidigare som helst? Gated → required. Ogated → forbidden.
Kod-fråga, Code avgör vid bygget.

Flavor-ytan (functionaries, boardMeetingCopy, politicianData, coffeeRoomService m.fl.)
är UTANFÖR R2 — ambient stämningstext, ingen entry att verifiera.

## R3 — målstatus (RETARGETAD — spec namngav fel system)

Spec:en namnger `seasonGoal`-evaluatorn, men varenda levande "uppfyllt/missat" kommer
från ett ANNAT system: `boardObjectiveService.ts` / `evaluateObjective` (status
met/failed/at_risk/active). `seasonGoal`-systemet använder aldrig orden. Skrivs R3
bokstavligt blir den vakuös + required-import failar överallt.

**Dom: retarget R3 mot board-objective-systemet.** `correctField` = `evaluateObjective`
/ status-fältet, inte `seasonGoal`. Skyddsytan är där texten faktiskt bor:
- `boardObjectiveService.ts:575`, `seasonEndProcessor.ts:1164`, `OrtenTab.tsx:586`,
  `roundProcessor.ts:966` — alla redan korrekt härledda ur `evaluateObjective`/status.

**Beslut (Jacob, bekräftat 2026-09-06): frozen-record-mönstret ACCEPTERAS som
namngiven undantagsklass.** `seasonDecisionsService.ts:72` läser `obj.result` ur det
frusna `boardObjectiveHistory` (skrivet av seasonEndProcessor), inte en live
`evaluateObjective`-call. Det är samma legitima mönster som den redan accepterade
`SeasonSummary.championClubId (snapshottat)` i vem-blev-mästare-regeln. R3:s
required-check accepterar "läser det frusna record evaluatorn skrev", inte bara
"importerar evaluator-funktionen". Att läsa korrekt skriven historik räknas som
korrekt härlett. Princip gäller bredare än R3.

## R4 — turneringsfas (byggbar nu, baseline 0)

Recon: varje "final/semifinal/slutspel/cupmatch/kvartsfinal" i matchtext/kort spåras
till en fixture-flagga eller bracket-check. Ingen ogated funnen.

**Regel:** dessa fem fas-ord i en matchtext-/kort-producent utan bracket-/fixture-flagg-
gating → förbjudet. Scope STRIKT till match-simulering + portal-kort:
- `matchCore.ts` (selektorn, 1536-1541 / 1630-1633 / 1748-1751 / 2044)
- `matchSimProcessor.ts:325-329` (bracket-backed MatchPhaseContext)
- `MatchLiveScreen.tsx:160-168` (bracket-check, dokumenterad "falska SM-guld"-fix)
- `matchTriggers.ts:48-58,68-73` + `SMFinalPrimary.tsx`/`CupFinalPrimary.tsx`
- `matchCommentary.ts` pooler via sina selektorer (poolerna är ren text, gating i selektorn)

**UTANFÖR R4:** ambient flavor (`watchOthersReflectionText`, `spectatorMarkText`,
`functionaries.ts:59` "som en final varje gång" = liknelse). Egen recon-pass om det
någonsin ska täckas — inte nu, skulle bli falsk-positiv-svep.

## Handoff

- Code bygger nu: R1 (+ fem design-d2-fixar), R4 (strikt scope). Båda baseline-domar
  klara.
- Code bygger smalnad: R2 (fyra ledger-producenter; verifiera reviewCallbackService
  gate-status vid bygget), R3 (retargetad mot evaluateObjective, frozen-record accepterat).
- Varje R som landar: rotorsak, required/forbidden-ankare, test, commit-hash, status i MASTER.
- Ingen kollision (recon: rent träd så när som på illustrationskatalogen).
