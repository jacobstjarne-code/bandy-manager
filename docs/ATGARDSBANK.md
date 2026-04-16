# BANDY MANAGER — ÅTGÄRDSBANK

**Uppdaterad:** 16 april 2026  
**Syfte:** En levande förteckning över ALLA identifierade problem, svagheter, luckor, idéer och drömmar — från alla granskningsomgångar. Ingenting sammanfattas bort. Varje punkt har eget ID, egen status, egen källa.

---

## HUR DEN HÄR FILEN ANVÄNDS

**Problem vi försöker lösa:** I varje översättningssteg (analys → spec → implementation) tappas 70% av observationerna. Efter tre steg är 3% kvar. Det här är en åtgärdsbank, inte en spec. Syftet är att *behålla allt*.

**Workflow:**
1. När ny analys eller granskning görs — lägg till nya rader, inte ersätt befintliga
2. När du vill jobba med en punkt — peka Code direkt till ID:t
3. När en punkt är klar — markera `✅` i Status och flytta INTE den (vi behöver spåra vad som gjorts)
4. Prioriteringsbeslut tas av Jacob, inte av Claude. Claude föreslår men väljer inte

**Format:**
- ID: `[KATEGORI-NNN]` (t.ex. BUG-001, NARR-007)
- Titel: Kort beskrivning
- Källa: Vem hittade det (Code / Opus / Jacob / Playtest)
- Status: 🔴 Obearbetad / 🟡 Pågår / ✅ Klar / ❄️ Parkerad / ⚠️ Obekräftad
- Kostnad: Grovuppskattning
- Beroende: ID som måste vara klart först

---

## 🐛 BUGGAR

### BUG-001 — Trainer arc fastnar i "grind"
- **Källa:** Code (16 april)
- **Status:** 🔴
- **Kostnad:** 1h
- **Plats:** `trainerArcService.ts`
- **Beskrivning:** Från `grind` krävs `consecutiveWins >= 5` för att gå till `established`. Men consecutiveWins nollställs vid varje förlust. En spelare som vinner 3, förlorar 1, vinner 3 sitter fast i grind hela säsongen. Säsongssluts-transition (`seasonCount >= 2 → established`) finns som safety men det är ett hål under pågående säsong.
- **Förslag på fix:** Alternativa exit-villkor från grind: `pos <= 4 && md >= 12` → established, eller ackumulerad `winRatio >= 0.6` över senaste 8 matcher.

### BUG-002 — secondHalfShare 0.488 (mål 0.543)
- **Källa:** Kalibrering + Opus
- **Status:** 🔴 (ligger i CODE_3_FIXES.md men oimplementerad)
- **Kostnad:** 1 rad
- **Plats:** `matchCore.ts simulateSecondHalf`
- **Fix:** `SECOND_HALF_BOOST = 1.25` konstant applicerad på stepGoalMod endast i andra halvlek
- **Verifiering:** `npx ts-node scripts/calibrate.ts`

### BUG-003 — Cup self-pairing guard saknas
- **Källa:** Code-verifiering
- **Status:** 🔴
- **Kostnad:** 10 rader
- **Plats:** `cupService.ts generateCupFixtures`
- **Fix:** Defensiv `console.error` om duplicate i playInTeams efter shuffle, eller lag i både bye och playIn. Detaljer i CODE_3_FIXES.md.

### BUG-004 — Presskonferens community-frågor saknas
- **Källa:** Code-verifiering
- **Status:** 🔴
- **Kostnad:** 2h
- **Plats:** `pressConferenceService.ts QUESTIONS`
- **Saknade kategorier:** cs_high, cs_low, mecenat_joined, academy_talent
- **Fix:** Lägg till fyra kontextuella frågor med `minRound` och `preferIds`. Detaljer i CODE_3_FIXES.md.

### BUG-005 — Hard-coded hex i interaktions-SVG
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 1h
- **Plats:** `CornerInteraction.tsx`, `PenaltyInteraction.tsx`, `CounterInteraction.tsx`, `FreeKickInteraction.tsx`
- **Beskrivning:** `#E8E4DC`, `#2C2820`, `#B05040`, `#3a3530` hårdkodat i SVG. Matchar designsystemet nu men bryts om CSS-variabler ändras.
- **Fix:** Ersätt med CSS-variabler eller inline style där possible. SVG kan använda `currentColor` eller `style="fill: var(--bg-surface)"`.

### BUG-006 — PenaltyInteraction.tsx:168 blandad gradient
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 30 sek
- **Plats:** `PenaltyInteraction.tsx:168`
- **Fix:** `background: 'linear-gradient(135deg, var(--danger), #8B3E30)'` → definiera `--danger-dark` och använd den.

### BUG-007 — GoldConfetti.tsx hårdkodade färger
- **Källa:** Code
- **Status:** ⚠️ Obekräftad (filen hittades inte i workspace)
- **Kostnad:** 30 sek
- **Plats:** `GoldConfetti.tsx:7`
- **Fix:** `#FFD700`, `#F5F1EB` → CSS-variabler

### BUG-008 — Negativ klubbkassa stoppas inte
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 3h (design + implementation)
- **Plats:** `economyService.ts applyFinanceChange`
- **Beskrivning:** Ingen floor på finances. En klubb kan ha -500k och fortsätta köpa. License review är enda skyddet — retroaktivt.
- **Förslag:** Hard floor vid -100k för köp, varning vid -50k, `critical_economy_event` vid -100k.

### BUG-009 — Arc resolving-fas tar aldrig bort arcs
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 1h
- **Plats:** `arcService.ts`
- **Beskrivning:** Phase sätts till `resolving` men filtreras bara i UI. `game.activeArcs[]` växer evigt.
- **Fix:** Cleanup-steg i roundProcessor: ta bort arcs med `phase === 'resolving'` OCH `currentMatchday > expiresMatchday + 2`.

### BUG-010 — Lånespelares matcher räknas inte
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 4h
- **Plats:** `loanDeals` + statistik-processorer
- **Beskrivning:** Lånespelaren finns inte i `game.players` under lånet. Prestationer bygger inte in i ratings eller karriärstatistik. När spelaren kommer tillbaka — har ingen säsong spelats.
- **Förslag:** Lånespelare ska ha parallell stats-array `loanSeasonStats` som mergas till `careerStats` vid retur.

### BUG-011 — Determinism-risk i matchprofil-seed
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 2h
- **Plats:** `matchCore.ts`, `MatchLiveScreen.tsx`
- **Beskrivning:** `pickMatchProfileFromSeed(seed, opts)` kallas med `Date.now()`-baserat seed. Quick-tactic-reroll och halvtids-tactic använder också Date.now(). Identiska situations → olika utfall beroende på exakt tidpunkt.
- **Fix:** Deterministisk seed per fixture: `fixture.id.charCodeAt(0) * fixture.matchday` eller motsv.

### BUG-012 — Klubb-ID ärvt från verkliga klubbar
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 4h + QA
- **Plats:** `rivalries.ts`, `mecenatService.ts REGION_BUSINESSES`, worldGenerator
- **Beskrivning:** `club_sirius` heter "Söderfors", `club_edsbyn` heter "Lesjöfors". Rivaliteter och mecenat-regioner bygger på gamla ID. Fungerar idag, bryts tyst vid refaktor.
- **Fix (alternativ A):** Byt ID till `club_forsbacka`, `club_soderfors` etc. Uppdatera rivalities + mecenat.
- **Fix (alternativ B):** Flytta rivalry-referenser till `CLUB_TEMPLATES.rivalClubIds`.

### BUG-013 — Forsbacka får Sandviken-mecenater
- **Källa:** Opus
- **Status:** 🔴 (del av BUG-012)
- **Plats:** `mecenatService.ts REGION_BUSINESSES`
- **Beskrivning:** Forsbacka (club_sandviken) får "Sandvikens Stålförädling" som mecenat-businesser. Forsbacka har ingen Sandvikens stålförädling.

---

## ⚠️ SVAGA PUNKTER

### WEAK-001 — Grind-loopen saknar narrativ feedback
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 2h
- **Plats:** `trainerArcService.ts getArcMoodText`, `DailyBriefing`
- **Beskrivning:** Spelaren ser "Det är grind. Varje träning är ett steg." men inte *vad* som krävs för att ta sig ur. Ingen progressionsindikator.
- **Förslag:** I DailyBriefing, om `trainerArc.current === 'grind'`, lägg till "Laget behöver en sejerserie. X raka — det är vad som krävs." där X beräknas från current state.

### WEAK-002 — Presskonferens avskärmad från matchupplevelsen
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 2h
- **Beskrivning:** `pressConference`-event triggas via EventOverlay, kan ses omgångar senare i inbox-flödet. Känns inte som direkt koppling till matchen.
- **Förslag:** Trigga automatiskt efter managed match (som halftimeModal), inte som inbox-kö.

### WEAK-003 — budgetPriority osynlig under säsongen
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 1h
- **Plats:** `EkonomiTab.tsx`
- **Beskrivning:** `budgetPriority` implementerat i seasonEndProcessor men spelaren ser aldrig om prioriteten "lönar sig" under säsongen.
- **Förslag:** Visa i EkonomiTab: "Prioritet: Truppen — du investerar X% mer i löner detta år."

### WEAK-004 — playerConversations osynlig i UI
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 30 min
- **Plats:** `PlayerCard.tsx`
- **Beskrivning:** `lastTalked` läses men visas inte. Spelaren vet inte "du pratade med den här spelaren för 4 omgångar sedan".
- **Förslag:** Spelarkort sektion RELATIONER: "Senaste samtalet: Omg 12 (för 4 omgångar sedan)".

### WEAK-005 — cornerRecovery påverkar matchen men är osynligt
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** Dolt attribut som påverkar post-corner kontring. Ingen matchkommentar refererar det. Spelaren anar aldrig pusslet.
- **Förslag:** Kommentarer som "Martinsson hinner inte tillbaka! Motståndarna kontrar!" när defensiv spelare har cornerRecovery < 50.

### WEAK-006 — Kapten-rollen underutnyttjad
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 4h
- **Beskrivning:** Kapten sätts, visas i säsongssammanfattning, ger matchkommentar-boost. Pratar inte i presskonferens, får ingen egen dagboksanteckning, ingen cascade till resten av laget vid låg moral.
- **Förslag:** Kapten-citeras i presskonferens vid vinst. Dagbok: "Kapten Kronberg ledde laget genom svackan." Cascade: kapten morale < 40 → lagets avg morale -5.

### WEAK-007 — Nemesis-tracker har kallt slut
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** Bygger upp `goalsAgainstUs`. Men om nemesis skadas/pensioneras — fasas hen ut? Om vi värvar nemesis — speciell behandling?
- **Förslag A:** Värvad nemesis → 3 dagboksanteckningar över 3 omgångar ("Lundkvist anländer idag. Omklädningsrummet är tyst.")
- **Förslag B:** Nemesis pensioneras → inbox: "Han som gjorde 8 mål mot oss lägger av. Epoken är över."

### WEAK-008 — Journalistens minne är tyst
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 4h (mest data, lite logik)
- **Beskrivning:** `memory: JournalistMemory[]` finns. Frågor refererar inte tidigare svar.
- **Förslag:** Ny question-kategori `followUp` som triggar när `memory.slice(-3)` har sentiment < -5. Ex: "Förra mötet sa du att försvaret skulle hålla. Nu har ni släppt in 11 mål på tre matcher. Vad säger du nu?"

### WEAK-009 — Klackens favoritspelare statisk
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h
- **Plats:** `supporterService.ts pickFavoritePlayer`
- **Beskrivning:** Sätts vid spelstart, uppdateras inte över tid.
- **Förslag:** Re-evaluera varje 5:e omgång. Om ny favorit → inbox-event: "Klacken sjunger inte längre Kronbergs namn. Martinsson har tagit över kören."

### WEAK-010 — Pensionsceremoni saknar "sista säsongen"-arc
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 6h
- **Beskrivning:** Pensionen är reaktion, inte kulmen. Ingen special-arc under säsongen innan, ingen klackkampanj, ingen jubileumsmatch-fråga.
- **Förslag:** Ny arc-typ `veteran_final_season` som triggas om `age >= 34 && contractUntilSeason === currentSeason`. Fyller dagboken med sista-signaler över säsongen.

### WEAK-011 — Arenanamnen driver inte narrativet
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h
- **Beskrivning:** "Slagghögen" står i GranskaScreen. Men matchkommentar, presskonferens, klack-ritualer refererar den aldrig.
- **Förslag:** Klack-ritual "välkomstsången" → "Klacken ropar: 'Välkommen till Slagghögen!'". Presskonferens (home) → "Hur var stämningen på Slagghögen idag?"

### WEAK-012 — Klubb-reputation osynlig
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 1h
- **Beskrivning:** `reputation: 0-100` visas inte i UI. Spelaren vet inte om Forsbacka är rep 85 eller 45.
- **Förslag:** Litet rep-indicator på KlubbTab eller Dashboard 2×2 grid.

### WEAK-013 — State of the Club jämförs aldrig
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** `seasonStartSnapshot` sparas. PreSeasonScreen ska visa jämförelse — renderingen är gles.
- **Förslag:** Dedikerat jämförelse-kort: "För ett år sedan: 10:a, 180k. Idag: 6:a, 440k. Vi har skakat av oss stigmat."

### WEAK-014 — Segrarens silence
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** 5-0 derby-seger i playoff → ett finalWhistleSummary + ett klack-citat. Sen inget. Inget i dagboken efterråt, ingen kaffesituation, ingen styrelsebekräftelse.
- **Förslag:** Efter storseger: dagboksanteckning nästa omgång ("Triumfen över Lesjöfors eker fortfarande i korridorerna."), kafferum-citat, eventuellt styrelsemeddelande.

### WEAK-015 — Transfers är tyst transaktionslogik
- **Källa:** Code + Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** En såld spelare som är legend (80+ matcher, kapten, klackfavorit, arc-aktiv) får exakt samma inbox-event som en reservback.
- **Förslag:** `executeTransfer` kollar: `isCaptain`, `isFanFavorite`, `arcPhase !== 'resolving'`, `totalGames >= 80`. Om ja → rikt narrativt event.

### WEAK-016 — Motståndarens manager existerar inte
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 4h (namngeneration + citat-pool + triggers)
- **Beskrivning:** Motståndarlagets tränare är anonym. Pre-match presskonferens är ensam monolog.
- **Förslag:** Varje AI-klubb får en tränare. Inbox före derby: "Lesjöfors-tränaren Hans Nordin: 'Vi räknar med att vinna det här derbyt.'"

### WEAK-017 — Akademin är tyst
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** P19 simuleras, talanger kallas upp, lånavtal finns. Men akademin genererar inga events.
- **Förslag:** "Ung spelare bryter igenom" när talanger får debut + 2 mål. "Säsongens akademi-utfall: 3 spelare uppflyttade."

### WEAK-018 — Säsongsstart saknar kontext
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 2h
- **Plats:** `BoardMeetingScreen`
- **Beskrivning:** Visar styrelseambitioner men inget om lagets situation: 30+-spelare, utgående kontrakt, svagheter.
- **Förslag:** Sektion "Truppen just nu": "3 spelare 30+, 2 kontrakt löper ut, svagaste position: Yttre halv."

### WEAK-019 — Bortamatcher matt
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 5h
- **Beskrivning:** Hemmamatch: klack, kiosk, VIP. Bortamatch: inget. Stor narrativ lucka för ett spel om svensk bruksbandy.
- **Förslag:** Bortamatch-kort på Dashboard: "Bussen avgår fredag 14:00. Övernattning i Pensionat Ljusåret. Snöoväder — 2h extra restid." Mikrobeslut: boka bättre hotell, fråga om mattstöd.

### WEAK-020 — Slutspel saknar oddsarc
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 4h
- **Beskrivning:** Kvartsfinal → semi → final. Ingen narrativ upp-trappning.
- **Förslag:** Innan kvartsfinal: dagbok "Klackens äldste: 'Tre år sedan vi var så här nära.'" Före semi: styrelsemeddelande. Före final: mecenat-middag-event.

### WEAK-021 — Omklädningsrummet frånvarande
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 8h
- **Beskrivning:** Spelare har morale, loyaltyScore, isCharacterPlayer. Ingen omklädningsrumsdynamik — vem lyssnar på vem, var sitter trätan.
- **Förslag (enkel version):** Litet kort i SquadScreen "Inre cirkel: Kapten + 3 spelare med högst loyalty. Utanför: 2 med lägst loyalty."

### WEAK-022 — Ekonomin är enkelriktad
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 6h
- **Beskrivning:** Intäkter + utgifter → netto. Men kommunbidrag per prestation, mecenat cost-share, sponsor-transfer-coupling saknas.
- **Förslag:** Kommun-reputation ger skalad bidrag (rep 50 → 60k/säsong, rep 80 → 120k). Mecenat kan erbjuda cost-share vid specifika köp. Sponsorer reagerar på transfers.

---

## 💀 DÖD KOD / OANVÄNDA SYSTEM

### DEAD-001 — narrativeService underutnyttjad
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** Kontextberoende
- **Beskrivning:** Används för skadeanteckningar och milstolpar. Full potential (kontextuell prosa-generering) oanvänd.
- **Förslag:** Bredda till form-arcs, storylines, derbyns efterdyningar.

### DEAD-002 — rivalryHistory registreras men refereras sällan
- **Källa:** Opus
- **Status:** ⚠️ Obekräftad — behöver grep
- **Beskrivning:** `rivalryHistory: Record<string, {wins, losses, draws, streak}>`. Används det i matchkommentarer?
- **Förslag:** "Senaste tre derbyn: vinst, förlust, vinst. Vi leder H2H 12-11."

### DEAD-003 — resolvedEventIds finns men använder vi den?
- **Källa:** Opus
- **Status:** ⚠️ Obekräftad
- **Beskrivning:** Fält i SaveGame. Prevents re-trigger av samma event?

---

## 🎭 NARRATIVA LUCKOR

### NARR-001 — Mecenaten kan inte dö meningsfullt
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 5h
- **Beskrivning:** Happiness decay + social events finns. Ingen egen resa — pension, konflikt, succession.
- **Förslag:** `age: number` och `yearsInRole: number` på Mecenat. Efter 4-6 säsonger → pension-event.

### NARR-002 — Ishallens årstider
- **Källa:** Opus (dröm men faktiskt rimligt)
- **Status:** 🔴
- **Kostnad:** 3h (CSS + koppling)
- **Beskrivning:** Bandy spelas ute. Kyla, snö, värme påverkar matchen. Men världen syns inte i UI.
- **Förslag:** Subtil bakgrund på Dashboard som skiftar: grått oktober, snötungt december, mörkblå januari, ljus februari, gryningsfin mars.

### NARR-003 — Ingen visuell matchrytm
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 6h
- **Beskrivning:** Livematch = textflöde + interaktioner. Var är momentum?
- **Förslag:** Momentum-bar ovanför Scoreboard som skiftar åt det lag som dominerar senaste 3 steg. Eller: mini-heatmap.

### NARR-004 — Motståndarspecifik taktik saknas
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 4h
- **Beskrivning:** Scoutrapporter finns men länkas inte till taktiska val.
- **Förslag:** I tactic-screen: "Motståndarens stjärna är corner-specialist #7. Dubbla på honom? [+2% corner-defensive, -1% annan offensiv]"

### NARR-005 — Truppledarskap osynligt
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** Ingen säga-åt, ingen mentorskapsfokus, ingen gruppboenhet.
- **Förslag:** Liten menu på spelarkort: "Sänk ett varv" (cooldown 2 omg), "Sätt som mentor".

### NARR-006 — Spelarens egen röst
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 4h
- **Beskrivning:** playerConversations finns. Vad säger spelaren?
- **Förslag:** En mening, inte interaktiv. "Jag vill spela mer." "Jag funderar på att sluta." "Tack för förtroendet."

---

## 🏗️ ARKITEKTUR

### ARCH-001 — roundProcessor ~1200 rader
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 8h
- **Beskrivning:** En `advanceToNextEvent()` hanterar allt. Läsbar tack vare sektionskommentarer men svår att testa isolerat.
- **Förslag:** Splitta i `processors/`-mapp med en fil per domän (du har redan börjat — playoffProcessor, cupProcessor, economyProcessor). Fortsätt.

### ARCH-002 — Tre parallella arc-system
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 6h
- **Beskrivning:** arcService (spelar-arcs), trainerArcService, storylineService. Ingen delad abstraktion.
- **Förslag:** Gemensam `Arc`-interface: `{ id, type, subject, phase, triggeredAt, expiresAt, data }`. Subklasser spelar/tränare/storyline.

### ARCH-003 — SaveGame-flaggor överallt
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** 6 olika `show*`-booleans för overlays. Skulle kunna vara `pendingScreen: ScreenType | null`.

### ARCH-004 — pendingEvents utan prioritet
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h
- **Beskrivning:** Alla events i samma kö. Mecenat-intro och kontraktsfråga prioriteras likadant.
- **Förslag:** `{ critical: GameEvent[]; normal: GameEvent[] }`

### ARCH-005 — StripCompletedFixture fragilt
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h
- **Beskrivning:** Efter match tas lineup/ratings/description bort. Om man senare vill renderera historisk matchrapport — datan är borta.
- **Förslag:** Behåll full data för matches med `isKeyMoment: true` (derby, comeback, hat trick).

### ARCH-006 — Migrationer saknas
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 4h
- **Beskrivning:** `tutorialSeen` deprecated men finns kvar. Ingen migrationslogik.
- **Förslag:** Version-baserad migration i saveGameStorage.

### ARCH-007 — Seeded random inkonsistent
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** `mulberry32(seed)` används överallt men olika services seedar olika. Determinismrisk vid refaktor.

### ARCH-008 — SaveGame.ts 300+ rader
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h
- **Beskrivning:** Alla typdefinitioner i en fil.
- **Förslag:** Splitta i `SaveGame/core.ts`, `SaveGame/narrative.ts`, `SaveGame/economy.ts`, `SaveGame/community.ts`.

---

## 🎨 VISUELLA INKONSEKVENSER

### VIS-001 — Dashboard för tät
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 6h (design + impl)
- **Beskrivning:** 11+ kort på Dashboard. Viktiga försvinner.
- **Förslag:** Prioritetsfiltrering per omgång. "Den här omgången: mecenat + skada." Andra kort kollapsade.

### VIS-002 — Emoji-trötthet
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** 20+ emoji på en skärm. Blir brus.
- **Förslag:** Konsekvent bruk: matchhändelser = sportemoji, administrativt = utan, narrativt = utan.

### VIS-003 — Inkonsekventa överskrifter
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h
- **Beskrivning:** Tre olika LABEL-stilar: LABEL-konstant, SectionLabel-komponent, inline-styling.
- **Förslag:** En komponent, en regel.

### VIS-004 — Knappar olika accenthierarki
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h
- **Beskrivning:** CTA har gradient, andra har solid, ghost har opacity. Hierarkin syns inte.

### VIS-005 — Röster svajar
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 4h
- **Beskrivning:** CTA-tone ("Redo — spela omgång 14"), journalistisk ("Kontrollerad seger"), formell ("Det pratas om er"). Olika texter har olika röst.

### VIS-006 — Halvtidsmodal vs taktikändring-modal
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h
- **Beskrivning:** Två parallella vägar till taktikändring (HalftimeModal + ⚙-knapp) med olika UI.
- **Förslag:** Samma TacticChangeModal-komponent oavsett var den triggas från.

### VIS-007 — Modals z-index odefinerat
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 1h
- **Beskrivning:** 5-6 overlays med DOM-ordning-beroende z-index.
- **Förslag:** `--z-modal: 300`, `--z-overlay: 400`, `--z-interaction: 500` i design-systemet.

### VIS-008 — paddingBottom inkonsekvent
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 30 min
- **Beskrivning:** Dashboard 120, SeasonSummary 180, BoardMeeting rörligt.
- **Förslag:** `--scroll-padding-bottom: 120px` token.

### VIS-009 — Spelarporträtt generiska
- **Källa:** Jacob + Opus
- **Status:** ❄️ Väntar på assets från Erik
- **Beskrivning:** Cirklar med initialer tills Erik levererar.

---

## 💡 UTVECKLINGSPOTENTIAL (LÅGODDS)

### DEV-001 — budgetPriority synlig i EkonomiTab
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 1h (se WEAK-003)

### DEV-002 — Presskonferens direkt efter match
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 2h (se WEAK-002)

### DEV-003 — Arc exit-signal
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 30 min
- **Beskrivning:** När arc går till resolving — inbox-event: "Berättelsen om {spelaren} är skriven." 5 rader kod.

### DEV-004 — Transfer med historia
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 3h (se WEAK-015)

### DEV-005 — Grind-exit-hint i DailyBriefing
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 1h (se WEAK-001)

### DEV-006 — Journalistens minne biter
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 4h (se WEAK-008)

### DEV-007 — Klackens favoritspelare dynamisk
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h (se WEAK-009)

### DEV-008 — Arenanamn i matchkommentar + press
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h (se WEAK-011)

### DEV-009 — Kapten-ceremoni vid säsongsstart
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h (se WEAK-006)

### DEV-010 — Sista-säsongen-arc för veteraner
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 6h (se WEAK-010)

### DEV-011 — Nemesis blir lagkamrat
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h (se WEAK-007)

### DEV-012 — Economic stress-events
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** Om finans < 50k: "Materialarens fråga: ska vi köpa nya klubbor eller vänta?"

### DEV-013 — Presskonferens-avslag med konsekvens
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h
- **Beskrivning:** pressRefusals >= 3 → kritisk artikel i inbox OCH tidningsrubrik.

---

## 🌌 DRÖMMAR

### DREAM-001 — Rivalens röst (citat 1x/säsong)
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 2h
- **Beskrivning:** Motståndarens manager citeras en mening i inbox. Lätt, stor effekt.

### DREAM-002 — Ekonomisk kris som narrativ bana
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 6h
- **Beskrivning:** Kassa < -200k → event-kedja: styrelseman ringer, sponsor hotar, val mellan sälja stjärnan eller kommunlån.

### DREAM-003 — Spridningseffekter
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** Stegvis
- **Beskrivning:** Stjärna skadas → motståndarens odds på nästa match ändras. Derby-seger → biljettförsäljning upp. Mecenat lämnar → community standing ner.

### DREAM-004 — Årsrytm med mekanik
- **Källa:** Code
- **Status:** 🔴
- **Kostnad:** 8h
- **Beskrivning:** Inte bara SEASON_MOOD-text utan faktiska variationer: januari-is (snabbare tempo), december-publikrekord (jul), transferfönster-oro.

### DREAM-005 — Bortamatchens scen
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 5h (se WEAK-019)

### DREAM-006 — Omklädningsrum-karta
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 4h (enkel version)

### DREAM-007 — Ishallens årstider
- **Källa:** Opus
- **Status:** 🔴 (se NARR-002)

### DREAM-008 — Kollektiva Sverige (leaderboard)
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** Större
- **Beskrivning:** Alla spelar samma motor. Leaderboard per klubb, region, säsong. Determinismen tillåter det.

### DREAM-009 — Podden efter match
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** Större (TTS-integration)
- **Beskrivning:** Audio-version av presskonferens, 45 sek.

### DREAM-010 — Bandybrev till klubben
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** Slumpmässigt: pensionär skickar brev med minnen. Du kan svara.

### DREAM-011 — Klubblegenden per klubb
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 4h
- **Beskrivning:** Varje klubb får sin Erik Ström. Persistent över spel.

### DREAM-012 — Skadelista som medmänsklighet
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** Skade-event med mikro-narrativ: "Knäet är stukat. Morfar kommer med efterrätt på fredagarna."

### DREAM-013 — Lagfotografiet
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 6h (canvas-generation)
- **Beskrivning:** Varje säsongsslut: ett genererat lagfoto. Sparas i historiken. Delbart.

### DREAM-014 — Tyst mode
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 3h
- **Beskrivning:** Spela omgång utan UI-feedback. Bara texten.

### DREAM-015 — Lokaltidningens insändare
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 2h
- **Beskrivning:** Bredvid tidningsrubriken: insändare från orten. "Jag har varit Forsbacka-anhängare i 38 år..."

### DREAM-016 — Bandyhistorisk skoluppgift
- **Källa:** Opus
- **Status:** 🔴
- **Kostnad:** 5h
- **Beskrivning:** Ung akademispelare frågar: "Berätta om SM-guldet 1989." Spelet genererar svaret från ditt spels historia.

### DREAM-017 — Mecenatens middag (interaktiv scen)
- **Källa:** THE_BOMB
- **Status:** 🔴
- **Kostnad:** 8h
- **Beskrivning:** Årligen: middag med mecenaten. Välj scen (jakt / bastu / whisky). Beslutssekvens.

---

## 📊 STATISTIK

**Totalt antal punkter:** 76  
**Fördelning:**
- Buggar: 13
- Svaga punkter: 22
- Död kod: 3
- Narrativa luckor: 6
- Arkitektur: 8
- Visuellt: 9
- Utveckling: 13
- Drömmar: 17 (en del överlappar med andra kategorier)

**Uppskattat totalkostnad (utan drömmar):** ~200h  
**Drömmar:** ~70h+  

---

## ARBETSSÄTT-FÖRSLAG

Istället för att Claude skriver en ny spec som samlar 10 av 76 punkter — vad om vi testar detta:

1. **Du läser igenom åtgärdsbanken** (tar 15-20 min)
2. **Du väljer 3-5 punkter per session** att jobba med, oavsett kategori
3. **Claude skriver implementationsspec för enbart de valda punkterna** — med direkt ID-referens så inget tappas bort
4. **Code pekas till både åtgärdsbanken (ID:erna) OCH specen** — så den kan slå upp originalet om något är otydligt

Det skulle förhindra bråkdels-problemet. Varje punkt har ett spårbart ID från observation till implementation.
