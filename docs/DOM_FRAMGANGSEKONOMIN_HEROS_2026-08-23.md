# O5 (RAPPORTERA-punkterna) + Heros-designfrågan, 2026-08-23

Grind 1 är passerad (SLUTTEST_KO.md). Två uppdrag följer: (1) `docs/DOM_FRAMGANGSEKONOMIN_2026-08-17.md`s fyra RAPPORTERA-punkter, som en rapport, INNAN något byggs. (2) Heros — rapportera spelbarhetsalternativ, bygg inget.

---

## Del 1 — O5: de fyra RAPPORTERA-punkterna

### 1. Löneinflation — var sätts lönekrav idag, och hur många ställen läser `salary`?

**Vid kontraktsförlängning** (`src/presentation/store/actions/transferActions.ts:44`, `renewContract(playerId, newSalary, years)`): spelaren (managern) väljer `newSalary` fritt i UI:t. Enda gränsen är ett golv:

```
minSalary = Math.round((isFullTimePro ? currentAbility*200*0.80 : currentAbility*80*0.80) / 500) * 500
```

Golvet är en funktion av `currentAbility` och `dayJob`-status — **ingen rykte-faktor**. En 52-i-rykte-klubb och en 85-i-rykte-klubb kräver identiskt golv för samma spelare. Det är exakt asymmetrin domen pekar ut (`economyService` skalar intäkt med `reputation`, lönesidan gör det inte).

**Vid utgående bud** (`transferService.ts:createOutgoingBid`): `offeredSalary` är en fri parameter från spelaren — **ingen valideringsgräns alls**. `resolveOutgoingBid()` (samma fil, rad 189) avgör accept/avslag enbart på `offerAmount` mot `marketVal`; `offeredSalary` prövas aldrig mot spelarens krav. Lönefältet i budet är i praktiken kosmetiskt för AI:ns beslut idag.

**Konsumenter av `salary`** (16 filer, grep-verifierat): kärnberäkningarna är två raka summeringar, ingen rykte-koppling i någon:
- `economyProcessor.ts:147` — `totalWages = clubPlayers.reduce(sum + p.salary)`, veckans lönekostnad.
- `economyService.ts:182` — samma summering, används för `wageBudget`-varningen.

Resten (11 filer) är UI-visning (`PlayerCard`, `ContractsTab`, `TransfersScreen`, `BidModal`, `RenewContractModal`, `FreeAgentList`, `TransferDeadlinePrimary`) eller genereringsställen (`createNewGame.ts`, `youthIntakeService.ts`, `worldGenerator.ts`, `eventFactories.ts`/`eventResolver.ts` för scoutade/genererade spelares startlön).

**Svar:** en rykte-medveten lönebildning kan läggas till på EXAKT ett ställe utan spridningsrisk — `minSalary`-golvet i `renewContract()` — plus (separat, domens ordning) en motsvarande spelarförväntan i `createOutgoingBid`/`resolveOutgoingBid` om utgående köp ska kosta mer hos en storklubb. Ingen värdering, transferbudget eller AI-klubbs-logik läser `salary` via en rykte-beroende formel idag, så en ändring i lönebildningen får INGA dolda följdeffekter i andra beräkningar — bara i de två wage-bill-summeringarna (avsett) och i spelarens egen förhandlingsgolv (avsett).

### 2. Driftskostnad — har `facilityNodes` en plats för återkommande belopp? Går det att avveckla en nod?

`FacilityNodeDef` (`src/domain/entities/Community.ts:103`) har **ett** kostnadsfält: `cost: number` — betalas en gång vid byggstart (delat mellan egen kassa/kommun/mecenat via `financing`). Inget upkeep-/drift-/recurring-fält existerar. Grep efter `upkeep`/`drift`/`maintenance`/`demolish`/`avveckl`/`teardown` i `facilityService.ts`, `Community.ts` och `facilityNodes.ts`: noll träffar.

`FacilityState.builtNodeIds: string[]` är append-only — en nod som väl är byggd finns kvar för alltid, ingen funktion tar bort ett id ur listan.

**Svar:** ingen recurring-kostnad finns, och ingen avvecklingsväg finns. Båda måste byggas från grunden: ett nytt fält (`upkeepCost: number` på `FacilityNodeDef`, eller separat `Record<nodeId, number>`), en ny per-omgångs- eller per-säsongs-avdragspunkt (samma anropsställe som wage bill i `economyProcessor.ts`), och en ny handling (`demolishNode(nodeId)`) som tar bort id:t ur `builtNodeIds` — ingen befintlig kod att haka i, det här är ett rent tillägg.

### 3. Kan `boardObjectiveService` uttrycka "spendera X" eller "kassan får inte överstiga Y"?

De två befintliga ekonomiska måltyperna (`boardObjectiveService.ts:46,59`) är båda uppåtriktade:
- `balanceBudget`: `status: finances >= 0 ? 'met' : finances > -100000 ? 'at_risk' : 'failed'` — "gå inte back".
- `growFinances`: `status: delta >= targetValue ? 'met' : ...` — "väx med minst X".

Ingen befintlig `measureFn`-gren uttrycker ett tak eller ett spenderkrav. MEN arkitekturen bär det utan friktion: `evaluateObjective()` är en `switch (objective.measureFn)` (rad 289) där varje case är en fristående jämförelse mot `objective.targetValue` — att lägga till t.ex. `case 'financesUnderCeiling': status: value <= targetValue ? 'met' : ...` är samma mönster som de två befintliga, ingen omstrukturering. Objektivets `BoardObjective`-shape (`targetValue`/`currentValue`/`measureFn`/status) och urvalspoolen (`allCandidates.push(...)`) är redan generiska nog.

**Svar:** inte byggt idag, men strukturellt billigt att lägga till — en ny factory-funktion (samma mönster som `growFinances`) + en ny `case` i `evaluateObjective()`. Ingen blockerare.

### 4. Går acceptanskriteriet ("minst ett ekonomiskt val där båda alternativen svider, år åtta") att mäta mekaniskt?

Ja, med samma metod som Grind 1-scripten redan använder (`createNewGame`+`autoSelectLineup`+`advanceToNextEvent`, headless, seedat). Ett konkret, programmerbart test: vid varje omgång under säsong 8, beräkna `min(cost för noder med status==='available')` via `getFacilityNodeViews()` (redan exporterad, `facilityService.ts:65`) och jämför mot `club.finances`. Om kassan NÅGON gång understiger det billigaste tillgängliga åtagandet räknas kriteriet som uppfyllt den säsongen (ett val existerade som svedde). Samma mönster går att köra för ett lönekrav (kan klubben INTE förlänga sin bästa spelare till golvlönen utan att gå back) om O5.1 byggs.

**Svar:** ja, mekaniskt mätbart utan nytt manuellt kriterium — förutsatt att ett facilityNode-läge (`available`, inte `locked`) alltid finns kvar år åtta att jämföra mot (annars är testet självt meningslöst — värt att verifiera EN gång i simuleringen innan kriteriet låses).

---

## Del 2 — Heros: designalternativ för spelbarhet (rapport, inget byggt)

Grind 1 v3-stresstestet (`docs/GRIND1_STRESSTEST_RESULTAT_2026-08-23.md`) visar att Heros (rykte 45, `boardExpectation: AvoidBottom`, samma förväntan som Skutskär) i snitt vinner bara 3–5 av 22 ligamatcher och landar på plats 12 i 46% av alla säsongssampel — även UTAN avsked. `docs/findings/facts/world_data/W012.yaml` säger uttryckligen "Heros är fiktiv dalaklubb och svagast i ligan": klubbens svaghet är kanonisk, inte en kalibreringsmiss i trupp eller matchmotor. Frågan är alltså inte "är det en bugg" utan "ska ligans kanoniskt svagaste klubb vara spelbar över tre säsonger, och om ja, hur".

Tre alternativ, verifierade mot koden:

**A. Sänkt `boardExpectation`.** Går INTE rakt av — `AvoidBottom` (ankare 9) är redan den mest tillåtande nivån i `BOARD_EXPECTATION_ANCHOR_POSITION` (`boardService.ts`), ingen lägre nivå finns i `ClubExpectation`-enumen. Två sätt att ändå göra detta: (A1) sänka `AvoidBottom`s EGET ankare/lutning — påverkar ALLA `AvoidBottom`-klubbar, inklusive Skutskär vars kalibrering just nu blev godkänd (50%, sund varians) — risk att förstöra ett just låst resultat. (A2) införa en ny, ännu mer tillåtande förväntansnivå (eller en per-klubb-override av ankaret) enbart för klubbar under en rykte-tröskel — större arkitekturändring, men isolerar Heros utan att röra Skutskär.

**B. Justerad kanon.** Höj Heros trupp-/matchstyrka (attribut, rykte, eller `youthQuality`) i `worldGenerator.ts` så det verkliga vinstprocent-golvet höjs närmare vad `AvoidBottom` faktiskt tål. Detta ändrar `W012`s sakuppgift ("svagast i ligan") — kräver rimligen samma typ av beslut som andra världs-/lore-fakta, inte en ren kod-justering.

**C. Erbjuds inte i klubbvalet.** `selectThreeOffers()` (`offerSelectionService.ts:77`) itererar `CLUB_TEMPLATES` för att bygga de tre klubberbjudandena spelaren väljer mellan. Två varianter:
- **C1 (liten, säker):** exkludera `club_heros` bara ur `selectThreeOffers()`s urvalspool — Heros finns kvar i ligan som AI-styrd motståndare (fortfarande "svagast i ligan" i tabellen, precis som kanon säger), spelaren kan bara aldrig BLI Heros-manager. Enkel, isolerad ändring.
- **C2 (stor, avrådd):** ta bort Heros ur `CLUB_TEMPLATES` helt. Krymper ligan till 11 lag — bryter den fasta 12-lags-kalibreringen flera system explicit bygger mot (`BOARD_EXPECTATION_ANCHOR_POSITION`s kommentar, dubbel round-robin-schemat i `scheduleGenerator.ts`, m.fl.). Strukturellt mycket dyrare än vad frågan kräver.

**Rekommenderas inte av mig — Jacobs beslut.** Men om en riktning ändå efterfrågas: C1 är den enda av de tre som varken riskerar att omkalibrera en redan godkänd klubb (Skutskär, alternativ A1) eller kräver en ny arkitekturbit (alternativ A2) eller en lore-omskrivning (alternativ B) eller en ligakrympning (C2) — den lämnar kanon orörd och löser exakt "spelaren ska inte kunna välja en klubb som praktiskt taget garanterat sparkar dem".
