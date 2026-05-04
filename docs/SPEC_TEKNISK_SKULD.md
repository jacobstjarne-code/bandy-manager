# SPEC_TEKNISK_SKULD — Topp 5 åtgärder

**Datum:** 2026-05-02
**Författare:** Opus
**Status:** Spec-klar för Code, levereras stegvis
**Beroende:** SPEC_GRANSKA_SPLIT levererad

---

## VARFÖR

Genomgång 2026-05-02 visade fem konkreta tekniska skulder som är värda att åtgärda:
- Dead code (DashboardScreen 64 KB, eventuellt fler skärmar)
- 108 services i flat folder utan kategorisering
- seasonEndProcessor.ts 57 KB monolit (jämfört med roundProcessor som är split)
- Misstänkta service-överlapp (media×3, training×3, narrative×3)
- SaveGame-typen växer okontrollerat

Total kodbas är 1.7 MB, 108 services. Inget av detta är akut, men fortsätter vi som nu blir det successivt jobbigare att navigera, refactor blir svårare, och nya sessioner spenderar mer tid på att förstå strukturen.

---

## ÅTGÄRD 1 — Radera dead code

**Vad:** Bekräftade dead screens som inte längre är i AppRouter eller bara har legacy-routes.

**Verifierat dead:**
- `DashboardScreen.tsx` (64 KB) — inte importerad i AppRouter, ersatt av PortalScreen
- Eventuellt `NewGameScreen.tsx` (12 KB) — bara `/new-game-legacy`-route, ersatt av NameInputScreen + ClubSelectionScreen

**Att verifiera (Code):**
- Sökning efter `DashboardScreen`-import i hela src/. Får BARA finnas i:
  - `src/__tests__/` (om någon test-fil)
  - DashboardScreen själv
  - Inga andra träffar.
- Samma för `NewGameScreen`. Om bara `/new-game-legacy`-route använder den och ingen annan import finns → dead.
- `MatchResultScreen.tsx` (13 KB) — sök efter `navigate('/game/match-result'`-anrop. Om noll → dead.
- `RoundSummaryScreen.tsx` (23 KB) — sök efter `navigate('/game/round-summary'`-anrop. Om noll → dead.

**Implementation:**
1. Verifiera varje skärm enligt ovan.
2. För varje dead screen: lista alla services/components/utils som BARA importeras därifrån. Spåra rekursivt — om en component bara importeras av DashboardScreen, är den också dead.
3. Radera i en commit per skärm: `chore: remove dead code DashboardScreen + N orphaned dependencies`.
4. Build + test efter varje commit.

**Förväntad besparing:** 80-150 KB total, beroende på cascade.

**Risker:**
- Att radera en "dead" component som faktiskt används någonstans i en obskyr branch.
- Mitigation: TypeScript fångar det vid build. Plus tester.

---

## ÅTGÄRD 2 — Sub-mappar i services/

**Vad:** 108 services i `src/domain/services/` är en flat folder. Lägg in 7-8 sub-mappar baserat på funktionsdomän.

**Föreslagen struktur:**
```
src/domain/services/
├── match/          # matchCore, matchEngine, matchUtils, matchInjuryService,
│                   # matchMoodService, matchHighlightService, halfTimeSummaryService,
│                   # cornerInteractionService, penaltyInteractionService,
│                   # freeKickInteractionService, counterAttackInteractionService,
│                   # refereeService
├── press/          # pressConferenceService, journalistService, journalistVisibilityService,
│                   # mediaService, lastMinutePressService, insandareService,
│                   # opponentManagerService, postMatchEventService
├── training/       # trainingService, trainingProjectService, trainingSceneService,
│                   # pepTalkService
├── transfer/       # transferService, aiTransferService, transferDeadlineService,
│                   # transferWindowService, marketValueService, offerSelectionService,
│                   # rumorService
├── community/      # supporterService, supporterRituals, klackPresenter,
│                   # mecenatService, mecenatDinnerService, sponsorService,
│                   # contextualSponsorService, politicianService, volunteerService,
│                   # functionaryQuoteService
├── season/         # seasonSummaryService, seasonSignatureService, seasonActService,
│                   # seasonDecisionsService, midSeasonEventService, specialDateService,
│                   # bandyGalaService
├── narrative/      # narrativeService, playoffNarrativeService, postVictoryNarrativeService,
│                   # clubMemoryService, clubMemoryEventBuilders, retirementService,
│                   # scandalService, bandyLetterService
├── events/         # FINNS REDAN — inga ändringar
├── portal/         # FINNS REDAN — inga ändringar
└── core/           # Resten — situationService, situationFragments, sceneTriggerService,
                    # eventQueueService, eventActions, attentionRouter, weatherService,
                    # facilityService, economyService, scheduleGenerator, cupService,
                    # playoffService, standingsService, worldGenerator, etc
```

**Implementation:**
1. Skapa alla nya mappar samtidigt.
2. **Flytta en mapp åt gången** (t.ex. börja med `training/` — bara 4 filer, billig).
3. Kör `npm run build` efter varje mapp. TypeScript-felen visar vilka imports som måste uppdateras.
4. Använd find-replace mot import-paths: `from '../services/trainingService'` → `from '../services/training/trainingService'`.
5. **Inga JSX/funktionsändringar.** Bara filer som flyttas och imports som uppdateras.
6. Test efter varje mapp.

**Estimat:** 4-6h för alla 7 mappar.

**Risker:**
- Många filer importerar varandra inom samma kluster — relative paths blir röriga.
- Mitigation: Vissa kluster (training, transfer) har få inbördes imports. Börja där.

**Notering:** Detta är **rent estetiskt**. Påverkar inte funktion alls. Kan parkeras om tiden inte räcker.

---

## ÅTGÄRD 3 — Bryt upp seasonEndProcessor.ts

**Vad:** seasonEndProcessor.ts är 57 KB monolit. roundProcessor.ts (59 KB) använder split-strukturen `processors/` med 17 sub-processors. seasonEndProcessor borde följa samma mönster.

**Implementation:**
1. Skapa `src/application/useCases/seasonEnd/` (analogt med `processors/`).
2. Identifiera fas-blocken i seasonEndProcessor:
   - Retirements & legend-status
   - Kontrakt & löner (utgående, förlängningar)
   - Akademi-uttag (P19 → A-laget)
   - Awards & utmärkelser
   - Säsongssammanfattning-event
   - Klubbeko (slutsiffror, prisutdelningar, sponsorerövertroende)
   - Ny-säsong-prep (transferbudget, klubbkassa)
3. Bryt ut varje fas till en sub-processor. T.ex. `seasonEnd/retirementProcessor.ts`, `seasonEnd/contractProcessor.ts`.
4. Huvudfilen `seasonEndProcessor.ts` kvar som orchestrator — kallar sub-processors i sekvens.

**Estimat:** 1-2 dagar.

**Risker:**
- Säsongsslut är komplex orkestrering. Migration-buggar kan vara subtila och uppstå först nästa säsongsslut.
- Mitigation: TESTER. Befintliga tester för seasonEndProcessor måste fortsätta passera. Plus: kör 5+ säsonger headless före och efter, jämför slutgame-state JSON för identitet.

**Parkeras tills:** Vi har en konkret bug eller feature-tillägg som rör säsongsslut. Refactor utan trigger är riskfyllt.

---

## ÅTGÄRD 4 — Lös service-överlapp (en kluster åt gången)

**Vad:** Identifierade misstänkta överlapp:

- **Press-clustret:** `pressConferenceService.ts` (58 KB), `journalistService.ts` (9 KB), `journalistVisibilityService.ts` (1 KB), `mediaService.ts` (8 KB), `lastMinutePressService.ts` (1 KB)
- **Training-clustret:** `trainingService.ts` (10 KB), `trainingProjectService.ts` (6 KB), `trainingSceneService.ts` (2 KB)
- **Narrative-clustret:** `narrativeService.ts` (3 KB), `playoffNarrativeService.ts` (2 KB), `postVictoryNarrativeService.ts` (3 KB)
- **Opponent-clustret:** `opponentManagerService.ts` (4 KB), `opponentAnalysisService.ts` (5 KB)
- **Mecenat-clustret:** `mecenatService.ts` (30 KB), `mecenatDinnerService.ts` (5 KB)
- **Supporter-clustret:** `supporterService.ts` (8 KB), `supporterRituals.ts` (8 KB)
- **Scout-clustret:** `scoutingService.ts` (6 KB), `talentScoutService.ts` (3 KB)

**Implementation per kluster (engångsanalys):**
1. Code läser alla filer i klustret.
2. Code skriver kort rapport: vad gör varje fil, vilka funktioner är de unika, finns det dubbletter eller överlapp.
3. Opus läser rapporten och beslutar:
   - Slå ihop till en fil
   - Behåll uppdelningen (motiverad domän-uppdelning)
   - Refactor (flytta funktioner mellan filer)

**Börja med:** Training-clustret. Minst (3 filer, 18 KB total). Snabbast feedback om processen fungerar.

**Implementation per beslut:** Separat commit. Test före/efter.

**Estimat per kluster:** 1-2h analys + 2-4h refactor om sammanslagning.

**Parkeras tills:** Specifik kluster blir relevant under feature-arbete. Inte värt att göra alla nu.

---

## ÅTGÄRD 5 — SaveGame-typen growth

**Vad:** `SaveGame.ts` är 14 KB och växer för varje feature. Migration-logik blir mer komplex.

**Två konkreta steg:**

**A. Audit av nuvarande fält:**
- Code listar alla fält på SaveGame med kommentar om vad de gör.
- Identifierar vilka fält som faktiskt används vs vilka som sätts en gång och aldrig läses.
- Identifierar fält som är dubbletter (t.ex. `currentMatchday` finns både på SaveGame och beräknas från fixtures).

**B. Sub-typer / komposition:**
- Bryt ut tematiska grupper till sub-typer:
  - `SaveGame.boardState: BoardState` (boardExpectations, lastBoardMeeting, etc)
  - `SaveGame.transferState: TransferState` (transferBudget, lastTransferDeadline, pendingBids, etc)
  - `SaveGame.matchState: MatchState` (lastCompletedFixtureId, lastProcessedMatchday, currentMatchday)
- Migration enklare: en sub-typ åt gången kan migreras isolerat.

**Estimat:** 2 dagar för audit + initial omstrukturering.

**Risker:**
- Stor TypeScript-förändring. Många service-signaturer ändras.
- Migration-fil måste hanteras varsamt.

**Parkeras tills:** SaveGame korsar 20 KB eller migration-buggar uppstår.

---

## PRIORITERING

| # | Åtgärd | Estimat | Akut? |
|---|--------|---------|-------|
| 1 | Radera dead code | 4-6h | Ja, snabb vinst |
| 2 | Sub-mappar services/ | 4-6h | Nej, estetiskt |
| 3 | Split seasonEndProcessor | 1-2 dagar | Vänta tills trigger |
| 4 | Service-överlapp | 1-2h per kluster | Nej, opportunistiskt |
| 5 | SaveGame-omstrukturering | 2 dagar | Vänta tills 20 KB |

**Lutning:** Kör **Åtgärd 1** nu (snabb vinst, rent städ) och **Åtgärd 2** när det passar. Resten parkeras med tydliga triggers.

---

## EFTER IMPLEMENTATION

KVAR.md:
- Åtgärd 1 levererad → "Dead code rensad: DashboardScreen + N orphaned"
- Åtgärd 2 levererad → "services/ omstrukturerad i sub-mappar"
- Övriga: noteras med trigger-villkor i TEKNISK SKULD-sektionen.

Slut.
