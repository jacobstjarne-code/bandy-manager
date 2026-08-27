# Rapport: ClubExpectation-blinda tjänster, objektivminne, konsumenter av boardObjectives

2026-08-25. Tillägg till styrelseobjektiv-ordern — tre frågor ur arbetskartan, undersökta av bakgrundsagent. Inget byggt, endast research.

---

## Q1: Fler tjänster som fattar beslut om spelarens klubb utan att läsa ClubExpectation

`boardExpectation`/`ClubExpectation` läses i dag bara på 5 ställen: `boardService.ts`, `offerSelectionService.ts`, `inboxService.ts`, `seasonSummaryService.ts`, `worldGenerator.ts` (seedning). Alla andra tjänster som dömer klubbens tabellplacering, genererar styrelsenära narrativ, eller sätter ett mål gör det med **fasta absoluta trösklar**, blinda för om placeringen är vad styrelsen faktiskt bad om.

Det här är samma buggklass som redan hittades och fixades en gång inne i `boardService.ts` självt (`boardService.ts:271-279` dokumenterar att "en AvoidBottom-klubb på 8:e plats och en WinLeague-klubb på 8:e plats fick identisk (nollad) behandling"). Den har bara inte spridit sig till systertjänster. Fynd, starkast först:

**`trainerArcService.ts:32-154` `updateTrainerArc`** — manager-arc-tillståndsmaskinen (`newcomer→honeymoon→grind→questioned→crisis→redemption→established→legendary`, plus `boardWarningGiven`) styrs helt av absoluta `pos`/`totalTeams`-trösklar: `pos <= 3` → honeymoon (rad 68), `pos >= 10` → questioned (rad 69), `pos <= 4` → established (rad 78, 92, 129), `pos >= totalTeams - 1` → questioned (rad 86). Läser aldrig `club.boardExpectation`. Konkret: en WinLeague-klubb på 4:e plats behandlas som bekvämt "established" medan styrelsen skulle se det som kris; en Survive-klubb på plats 10 drivs in i "questioned"/kris-narrativ trots att plats 10-12 bokstavligen är vad dess styrelseanker förväntar (`BOARD_EXPECTATION_ANCHOR_POSITION.Survive = 12`, boardService.ts:69).

**`midSeasonEventService.ts` (halvtidsrapport), rad 29-35** — bedömningsmeningen ("Bättre start kan man knappt ha" vs "Svag inledning") väljs enbart från `pos <= 3 / <=6 / <=9 / else`, oberoende av boardExpectation. Direkt dubblett av buggklassen som redan fixats för boardPatience, återinförd ofixad här.

**`seasonContextService.ts:6-20` `getSeasonContext`** — märker hela säsongen `'relegationFight'` vid `pos >= 9` (rad 17) eller `'topRace'` vid `pos <= 3` (rad 18), oavsett tier. En Survive-klubb på plats 9 är inte i "relegationsstrid" enligt sin egen styrelse; en WinLeague-klubb på plats 4 (inte `<=3`) faller tyst till `'midTable'` trots att styrelsen inte accepterar mindre än förstaplats.

**`matchMoodService.ts:53-73` `getMatchMood`** — förmatch-mood-kort: "Toppdrabbning" vid `pos<=3` (56), "Varje poäng räknas" vid `pos>=10 && round>=16` (61), "Relegation battle" vid `pos>=11 && round>=19` (66), "Playoff chase" vid plats 7-9 & runda>=18 (71). Alla absoluta, ingen expectation-koll.

**`pepTalkService.ts:38-63` `getPepTalk`** — väljer `PEP_CRISIS` vid `standing.position >= 11` (56) eller `PEP_TOP` vid `position <= 3` (61). En ChallengeTop-klubb fast på plats 6 får inget förhöjt kris-pepptalk trots att den missar styrelsens ambition rejält.

**`mediaService.ts:150-189`** — medienarrativ-artiklar: "Kan {klubb} utmana om guldet?" vid `position <= 3 && roundNumber >= 10` (172), "kämpar... nedflyttningshotet" vid `position >= 10` (181). Ingen tier-läsning.

**`reputationMilestoneService.ts:20-107` `checkReputationMilestones`** — `mediaAttention`-milstolpe vid `pos <= 3 && cs > 60` (45); `reputationWarning` ("Ryktet bleknar") vid `pos >= 10 && cs < 40` (94). Båda ignorerar boardExpectation; en Survive-klubb på plats 10 får ett "det går fel"-ryktestraff även om det ungefär är dess förväntade nivå.

**`clubMemoryService.ts:64-73` `seasonFinishEvent`** — minnets "signifikans"-poäng styrs enbart av absolut placering: `pos===1→100, pos<=4→65, pos<=9→35, else 30` (65). En Survive-klubbs 8:e plats (stor överprestation) får samma måttliga signifikans som vilken annan klubbs 8:e plats som helst, och en WinLeague-klubbs 4:e plats (en riktig besvikelse) lagras som ett ganska högsignifikant, positivt lutande minne (65).

**`contextualSponsorService.ts:35-57` `checkContextualSponsors`** — bonussponsorn "Regionalt Näringsliv AB" triggas vid fast `managedPos <= 4` (36), samma ribba för varje klubb oavsett vad dess styrelse förväntar.

**`demandEngine.ts:106-111` `isDemandFulfilled` (fallet `'league_position'`)** — Patron/Mecenat-kravet "ligaplacering" uppfylls av övre halvan (`position <= Math.ceil(totalTeams/2)`), samma ribba för varje klubb oavsett boardExpectation.

**`seasonGoalService.ts:154-160,419-423`** (svagare/gränsfall) — spelarens eget valda säsongsmål `playoff`/`establish` bedöms `met` vid `finalPosition <= 8` oavsett klubbens tier. Spelarvalt snarare än systempåtvingat, så ett mjukare fall av samma art — men erbjudande/tröskellogiken konsulterar fortfarande aldrig boardExpectation.

**Kontrollerade och bedömda INTE instanser av denna bugg (tier rimligen irrelevant):**
- `licenseService.ts:checkLicenseStatus` — rent finansiellt (förlustsäsonger i rad), en verklighetsbaserad licensmekanik utan koppling till sportslig ambition.
- `scandalService.ts:75-105 getClubWeight/pickAffectedClub` — viktar VILKEN klubb som drabbas av en skandal efter rykte, inte en dom om en specifik klubbs prestation.
- `politicianService.ts:calculateKommunBidrag` — bidragsformel baserad på rykte/anläggning/samhällsaktiviteter, en civil bidragsmekanik, inte kopplad till styrelseambition.
- `academyService.ts:generateYouthTeam` — styrs av `academyLevel`/`youthQuality` (anläggningsinvestering), inte styrelseambition.
- `economyService.ts` publik-/formmultiplikatorer (`position <= 3 → publikboost`) — modellerar att sportslig framgång faktiskt drar mer publik; ett verkligt orsakssamband, inte en dom om "mötte klubben förväntningarna".

---

## Q2: Objektivgenereringens "minne" — glöms ett misslyckande från två säsonger sedan?

Läst `generateBoardObjectives` och `isRepeatedObjectiveFailure` i sin helhet (`boardObjectiveService.ts`, före dagens tier-ombyggnad — se not nedan om vad som ändrats sedan).

**Tilldelnings-/variationssidan har exakt den hypotiserade buggen.** `generateBoardObjectives` byggde `lastSeasonObjectiveIds` från bara `season - 1`:

```ts
const lastSeasonObjectiveIds = new Set(
  (game.boardObjectiveHistory ?? [])
    .filter(o => o.season === season - 1)
    .map(o => o.objectiveId)
)
```

Denna mängd användes sedan enbart som **variationsfilter**, aldrig som misslyckandefilter (rad 270, 290-292 i den gamla koden: `useImprove = rand() < 0.5 || lastSeasonObjectiveIds.has('playHomegrown')`, samma mönster för `cupRun`/`topHalf`/`reduceInjuries`).

Om `topHalf` misslyckades säsong N-2, och säsong N-1 av en slump tilldelade ett annat sportsligt objektiv, innehöll `lastSeasonObjectiveIds` i säsong N ingen `'topHalf'`-post (den tittar bara på N-1) — `topHalf` kom då tillbaka som om det vore helt nytt, med ny slumpad brödtext, `status: 'active'`, `currentValue: 0`, **utan någon referens någonstans i fabriken eller tilldelningsvägen till att samma objektivtyp redan misslyckats två säsonger tidigare**.

**VIKTIG UPPDATERING (samma dag, efter denna undersökning):** `generateBoardObjectives` skrevs om till tier-härledd (fast uppsättning per ClubExpectation, se `RAPPORT_STYRELSEOBJEKTIV_TIER_2026-08-25.md`). Den gamla variationsfilter-logiken (`lastSeasonObjectiveIds`, `useImprove`-slumpen) togs bort helt i samband med det bytet — tilldelningen är nu deterministisk per tier, inte slumpad med variationsundvikande. **Det betyder att den här specifika "glömmer ett missat mål och erbjuder det som nytt"-bugg-formuleringen inte längre existerar i sin ursprungliga form**, eftersom det inte längre finns någon variationslogik att glömma i. Men den bredare frågan — "vet spelaren/texten att det här objektivet redan misslyckats förut?" — kvarstår obesvarad under den nya modellen: en Survive-klubb får `avoidRelegation` VARJE säsong oavsett hur många gånger det redan misslyckats, med samma `'[Opus]'`-platshållartext varje gång. Ingen upprepningsmedveten text finns ännu (väntar på Opus ändå, per SVENSK TEXT-regeln).

**`isRepeatedObjectiveFailure`, däremot, var INTE begränsad till närmast föregående säsong:**

```ts
export function isRepeatedObjectiveFailure(
  objectiveId: string,
  cost: number,
  history: Array<{ objectiveId: string; result: 'met' | 'failed' }>,
): boolean {
  if (cost >= 0) return false
  let latest: 'met' | 'failed' | undefined
  for (const h of history) {
    if (h.objectiveId === objectiveId) latest = h.result
  }
  return latest === 'failed'
}
```

Den skannar **hela** historiken (ej säsongsfiltrerad) och skriver över `latest` vid varje träff, och slutar med vad den temporalt SISTA posten för den objectiveId:n var — oavsett hur många säsongers gap som skiljer den från nuvarande säsong. Funktionens egen dokumentationskommentar bekräftar detta ("Historiken förutsätts kronologisk (äldst→nyast...)" — den förlitar sig på tilläggsordning, inte närhet). Anropas bara en gång, vid säsongsslutsutvärdering, från `seasonEndProcessor.ts:805`:

```ts
const cost = OBJECTIVE_PATIENCE_COST[result.status]
if (isRepeatedObjectiveFailure(obj.id, cost, objectiveHistory)) {
  unprotectedObjectiveDelta += cost
} else {
  bufferEligibleObjectiveDelta += cost
}
```

**Nettomekanik för scenariot i frågan** (topHalf misslyckas N-2, hoppas över N-1, tilldelas igen N — under DEN GAMLA modellen, innan tier-ombyggnaden):
1. Vid **tilldelningstillfället** (säsong N) hade systemet inget som helst minne av att `topHalf` redan misslyckats — presenterades som ett helt nytt objektiv. Denna del av hypotesen bekräftad (för den gamla modellen).
2. Om `topHalf` **misslyckades igen** i säsong N, upptäckte `isRepeatedObjectiveFailure` det KORREKT som en upprepning (skannar hela historiken, inte bara N-1) och routade dess tålamodskostnad till den oskyddade hinken, förbi meritbufferten — straffmekanismen var alltså gap-tolerant.
3. Om `topHalf` **lyckades** i säsong N, applicerades inget straff alls, och N-2-misslyckandet glömdes utan konsekvens — rimligen okej (en senare framgång bör rensa tavlan).

**Slutsats:** detta var två separata, oberoende avgränsade problem. "Tilldelningsminne" (undviker/flaggar generatorn ett tidigare misslyckat objektiv, och vet den spelarvända texten om historiken) var trasigt och begränsat till N-1 — ett äkta, separat problem från "kostnad/buffertskydd" (straffas ett upprepat MISSLYCKANDE hårdare), vilket redan var separat implementerat via `isRepeatedObjectiveFailure` och INTE begränsat till N-1. Tilldelningssidans problem är nu delvis moot efter tier-ombyggnaden (ingen variationslogik kvar att glömma i), men den bredare "vet texten om upprepningen" -luckan finns fortfarande.

---

## Q3: Alla konsumenter av `game.boardObjectives`

**Applikations-/domänlogik:**
- `createNewGame.ts:360` — anropar `generateBoardObjectives` för att seeda arrayen vid spelstart; `:464-467` fyller i `startValue`/`currentValue` via `evaluateObjective` innan den returnerade save:n.
- `roundProcessor.ts:901-919` — vid rundorna 7/14/22, anropar `checkInObjectives(updatedBoardObjectives, gameForEval)` (halvsäsongs-statusomvärdering → inbox-meddelanden, sponsor-/styrelseförtroende-deltan); `:1470` skriver tillbaka den uppdaterade arrayen till `game`.
- `seasonEndProcessor.ts:784-810` — itererar `game.boardObjectives`, anropar `evaluateObjective` per objektiv, beräknar tålamodskostnad per objektiv via `OBJECTIVE_PATIENCE_COST[status]`, routar den genom `isRepeatedObjectiveFailure`; `:1494` skriver `newSeasonObjectives` (nygenererad) in i nästa säsongs `game.boardObjectives`.
- `boardMeetingStateResolver.ts:115` — läser innevarande säsongs `game.boardObjectives` som `newGoals` för styrelsemötesscenens data (skickar bara igenom objekten — ingen id-/typspecifik logik).
- `boardPatienceZone.ts:52-71` `pickConcernCause` — hittar ett misslyckat/riskobjektiv **efter `.type`** (`'sporting'`, `'economic'`, `'community'`) för att välja "orsaks"-raden i patience-zonens UI, och läser `.label` för "vägen tillbaka"-meningen. Typnyckel, inte id-nyckel — robust mot id-churn så länge typtaxonomin är stabil.
- `portalBeats.ts:154-184` `board_failure`-beat — `severity`/`trigger` kollar `.some(o => o.status === 'failed')`; `text` väljer första misslyckade objektivet med preferens för `type === 'sporting' || 'economic'` och läser `.ownerId`/`.label`; `keyFn` (dedup-nyckel) är `board_fail_sev${sev}_s${season}` — **innehåller inte objektiv-id**, så återkommande samma id över säsonger påverkar inte dedup/cooldown.
- `initCardBag.ts:170-175` — `board_objectives`-sekundärkort-triggern är bara `.filter(o => o.status !== 'met').length > 0` — en räkning, id-agnostisk.
- `contentContract.ts:291-301` — dokumentationspost som beskriver `board_failure`-beatens trigger/mekanik (ej körbar, men dokumenterar samma `.status==='failed'`-kontrakt).

**UI/presentation:**
- `BoardObjectivesSecondary.tsx:7-9` — visar det sekundära portalkortet om något objektiv inte är `'met'`; delegerar rendering till `BoardObjectivesList`.
- `BoardObjectivesList.tsx:58-175` `computeProgressPct`/`BoardObjectivesList` — **komponenten mest känslig för ett schemabyte.** Nyckel via `obj.measureFn` (inte `.id` direkt, men `measureFn`-värden som `'topHalf'`, `'reduceInjuries'` är samma stabila strängar som dagens id:n) via en hårdkodad `LOWER_IS_BETTER = ['topHalf', 'reduceInjuries']`-array (rad 56) för att avgöra om progress ska räknas avstånds- eller kvotbaserat. Så länge tier-härledda objektiv återanvänder samma measureFn-vokabulär fortsätter det fungera; en NY measureFn som är "lägre är bättre" och inte läggs till i denna lista skulle tyst felrenderas. Sorterar också efter `.status` (`SORT_ORDER`, rad 18) och använder `obj.id` bara som React-`key` (list-render-identitet inom en säsong, inte säsongsöverskridande minne) — id-återkomst över säsonger är ofarligt här.
- `PortalObjectiveAlert.tsx:10-35` — filtrerar `.status === 'at_risk'`, renderar `.label` — status-/label-bara, id-agnostisk.
- `OrtenTab.tsx:533-560` — renderar `club.boardExpectation`/`fanExpectation`-etiketter *och separat* listar `game.boardObjectives` med `.status`/`.label`/`.ownerId`/`.ownerPersonality` — rent beskrivande, inga id-antaganden, men noterbart att detta är den ENDA skärmen där boardExpectation och boardObjectives visas sida vid sida utan att vara kausalt länkade — visuellt bevis på precis den disconnect Q1 beskriver.
- `ArrivalScene.tsx:213` — skickar `game.boardObjectives ?? []` rakt in i `BoardObjectivesList` vid spelstart.
- `PortalScreen.tsx:301` — `objectiveAlertWarning = boardObjectives.some(o => o.status === 'at_risk')` — status-bara.
- `SeasonTransitionScene.tsx:91-93` — räknar icke-`met`-objektiv för en "N mål kvar"-sammanfattning — räknebara, id-agnostisk.
- `dev/gameStateFactory.ts:283-292` — dev-/testhjälpare som tvingar `objectives[0].status` till `'failed'`/`'at_risk'` via array-index (inte id) — ordningsberoende men inte id-beroende.
- `DevScenesScreen.tsx:896-899,1094-1096` — dev-fixturdata som hårdkodar två exempelobjektiv med explicita id:n (`obj-1`, `obj-2`) för Sommaren-/styrelsemötesförhandsvisningar; ej produktionslogik, behöver bara hållas koherent med vilka id:n den riktiga generatorn nu producerar (tier-listan).

**Persistens/typer:**
- `SaveGame.ts:375` — typdeklaration `boardObjectives?: BoardObjective[]`.
- `SeasonSummary.ts:200-209` — `objectiveOutcome` är en **aggregerad räkning** (`met`/`atRisk`/`active`/`failed`), beräknad en gång vid säsongsslut (`seasonEndProcessor.ts:811-816`) och konsumerad av `seasonSummaryService.ts:824-846` ("två-sanningar"-meningen, t.ex. "Plats 8 överträffade målet. Två uppdrag missades.") och `seasonShareImage.ts:126` — båda läser bara räkningarna, aldrig specifika id:n/typer, alltså helt robusta mot id-återkomst.
- `saveGameMigration.ts:197-205` — migrering defaultar `boardObjectives = []` och fyller i saknat `startValue` från `currentValue`; ingen id-specifik logik.

**Angränsande (`.boardObjectiveHistory`, inte `.boardObjectives`, men bärande för samma delsystem):** `clubMemoryService.ts:465-466`, `seasonDecisionsService.ts:47`, `portal/pickEfterklang.ts:170` (`.slice(-1)[0]` — senaste posten, id-agnostisk), `events/hallProcessService.ts:85` (filtrerar strikt till `season - 1`, samma N-1-bara-mönster som den gamla generatorn hade).

**Total riskbedömning för bytet till tier-härledda fasta objektivuppsättningar:** Ingen konsument antar att objektiv VARIERAR säsong-till-säsong eller kollar ett SPECIFIKT antal utöver `Math.min(..., 2)`-visningstak — all räknelogik är statusbaserad (`met`/`failed`/`at_risk`), inte id-/räknebaserad. Det enda stället med ett verkligt strukturellt beroende av dagens id-/measureFn-vokabulär är `BoardObjectivesList.tsx`s `LOWER_IS_BETTER`-array (nyckel: measureFn), som skulle behöva uppdateras om tier-härledda objektiv inför nya "lägre är bättre"-measureFn:er — men samma-id-återkomst över säsonger, i sig, bryter ingenting som hittades i denna spårning.

---

## Sammanfattning — vad detta betyder för nästa steg

1. **Q1 är ett äkta, brett fynd:** minst 9 tjänster fattar styrelsenära bedömningar (mood, media, rykte, minnessignifikans, sponsring, kravuppfyllnad) med fasta trösklar som ignorerar boardExpectation. Inget av detta byggdes eller ordrades i denna session — det är research åt Jacobs produktbeslut om VILKA av dessa som ska bli tier-medvetna, i vilken ordning.
2. **Q2:s ursprungliga bugg (tilldelningsglömska) är delvis inaktuell** efter dagens tier-ombyggnad av `generateBoardObjectives` — men en näraliggande lucka kvarstår: ingen text erkänner ett upprepat objektiv-tema (t.ex. "avoidRelegation igen").
3. **Q3 bekräftar att bytet till tier-härledda objektiv är strukturellt säkert** — inga konsumenter antar variation eller specifikt antal, bara `BoardObjectivesList.tsx`s `LOWER_IS_BETTER`-lista behöver hållas i synk med measureFn-vokabulären.

Inget byggt. Väntar på dom.
