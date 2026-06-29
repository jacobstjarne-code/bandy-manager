# AUDIT — Bandy Manager, fräscha ögon (Opus)

**Datum:** 2026-06-24 · **Syfte:** Oberoende genomgång att korsa med Designs rapport. Grundad i källäsning, inte arkitekturgissning.

## Vad jag faktiskt läste

Hela `src`-trädet (struktur), plus djupläsning av: `TaktikScreen`, `tacticModifiers`, `trainerArcService`, `CareerJourney`, `weeklyDecisionService`, `rippleEffectService`. Strukturen gav resten. Där jag drar slutsats av *struktur* snarare än läst kod markerar jag det med "verifiera".

## Helhetsomdöme

Jag delar Designs rotdiagnos — motorn syns inte — men källäsningen ändrar **prescriptionen** radikalt. Designs rapport läser som "bygg fyra nya system". Koden säger något annat, och det är den enskilt viktigaste upptäckten:

## Den genomgående upptäckten: byggt ≠ ytlagt

Nästan allt Design säger att ni ska *bygga* finns redan som beräknat system. Arbetet är överväldigande att **yta och koppla**, inte att bygga. Fyra exempel, alla verifierade i kod:

1. **Läsbarhetslagret ("därför hände det") — Designs prio 1 — finns redan.** `rippleEffectService` modellerar `RippleChain`/`RippleChainStep`: orsak→verkan över fanMood, communityStanding, boardPatience, sponsorNetworkMood, supporterGroup ("stjärna skadad, derby-seger, mecenat lämnar"). Kausaliteten *beräknas*. Den visas bara inte för spelaren. Att bygga "därför hände det" är till stor del att rendera kedjor som redan finns, inte att skapa dem.

2. **Beslut-per-omgång (anti-autopilot) finns redan.** `weeklyDecisionService` producerar binära A/B-beslut med *riktiga effekter* (cornerSkill, moral, fitness, recovery-deltan). Men det ligger som ett valbart sekundärkort (`WeeklyDecisionSecondary`), inte som loopens grind. Mekaniken finns; den är bara avfärdbar.

3. **Taktik är djupt och utfallspåverkande, inte tunt.** Designs "TaktikScreen = 2,8 KB" är en filstorleks-artefakt: skärmen är ett skal som delegerar till `TacticBoardCard`. Den faktiska logiken (`tacticModifiers`) mappar åtta taktikdimensioner till sju modifierare (offensiv, försvar, tempo, press, hörna, disciplin, trötthet) som går rakt in i matchmotorn. Taktik *avgör matcher*. Det är inte en lucka att fylla — det är den färdiga "ett meningsfullt beslut per omgång"-ytan, oytlagd i loopen.

4. **Manager-arc finns som motor, saknar yta.** `trainerArcService` uppdaterar varje omgång: fas (newcomer→…), säsonger, bästa placering, titlar, vinst/förlust-svit, styrelsevarning, övergångshistorik. Design sa att manager-arc saknas. Den *beräknas*. `CareerJourney` är spelar-arc (tar en `Player`), inte manager-arc — så managerns egen båge har tunn eller ingen egen yta. Datan finns; ytan saknas.

**Konsekvens för planen:** surfa-och-koppla är billigare, snabbare och lägre risk än att bygga. Det ändrar både kostnaden och ordningen. Det mesta av "nästa nivå" är att tända ljuset på det som redan körs i mörkret.

## Korrigeringar till Designs rapport

- **Taktik är inte en lucka.** Det är djupt och utfallspåverkande. Den verkliga bristen är att taktikbeslutet inte är inbakat i omgångsloopen — inte att taktiken är tunn. (Filstorlek mäter fel sak när skärmar delegerar till kort-komponenter.)
- **Manager-arc saknas inte — den är osynlig.** `trainerArc` finns och uppdateras. Bygg ytan, inte motorn. Och Designs egen oro om att FM-arc drar mot generisk karriärsim gäller fortfarande: förankra ytan i orten.
- **Granska→Taktik-bryggan finns delvis redan.** `opponentAnalysisService` + `nextOpponentAnalysis` matas redan in i `TacticBoardCard`. Kopplingen Granska→nästa taktik är halvbyggd, inte obefintlig.

## Inkonsistenser och misstänkt död/dubbel kod

Kalibrerat: "verifierat" = läst, "misstänkt" = av struktur, kräver usage-koll.

- **Misstänkt halvgjord ripple-migrering (verifiera i roundProcessor).** `rippleEffectService` säger i koden att `mergeRippleDeltas` "Replaces the scattered manual extractions in roundProcessor". Om de gamla utdragen ligger kvar parallellt med den nya merge-funktionen är det dubbel logik — två källor för samma fält (fanMood m.fl.). Exakt det dubbelkälla-mönster som gav färgbuggen i klubbarbetet. Läs `roundProcessor` och bekräfta att bara en väg lever.
- **Beslut-kluster, misstänkt överlapp.** Fyra tjänster rör beslut: `decisionBudgetService`, `decisionFatigueService`, `weeklyDecisionService`, `seasonDecisionsService`. Sannolikt konkurrerande modeller av samma idé (ett substantiellt val per omgång). Verifiera att de inte trampar på varandra — och välj *en* som loopens ryggrad.
- **Onboarding/hint-kluster, misstänkt redundans.** Minst sex mekanismer: `FirstVisitHint`, `OnboardingHint`, `CoachMarks`, `HelpOverlay`, `ContextualNudges`, `DashboardNudges`. Sex sätt att peta spelaren är i sig en inkonsistens. Verifiera vilka som faktiskt renderas; sannolikt finns död eller dubbel kod här. (Design noterade FirstVisitHint som död, korrigerade sen till "används på ett ställe" — det understryker att hela klustret behöver en usage-revision.)
- **Emoji mot återhållet designsystem.** `CareerJourney` använder ⭐🩹📈📖. Det finns en `debug/designAudit/rules/emojiConsistency.ts`. Antingen är regeln inte upprätthållen, eller så spretar emoji-bruket mot den i övrigt strama estetiken. Kör harnesset och se.
- **Befintligt audit-harness underutnyttjat.** `debug/designAudit/` har redan regler för cardPadding, chevronButtons, fontSizes, hexColors, overlaps, sectionLabels, emojiConsistency. Det finns alltså redan en automatisk konsistensgranskare. Kör den först — den kan lista hårda inkonsistenser (hex utanför tokens, font-storlekar, överlapp) innan vi letar för hand.
- **Tjänste-svällning.** ~140 tjänster i `domain/services`. Inte ett fel i sig, men i kombination med klustren ovan (beslut ×4, narrativ ×6, hint ×6) ett tydligt accretions-tecken: funktioner har lagts till snabbare än de konsoliderats. En usage-svep (vilka exporteras men importeras aldrig) skulle nästan säkert hitta död kod.

## Tillägg för bättre gameplay (mest "surfa det som finns")

1. **Rendera rippleEffect som "därför hände det".** Högsta utdelning. När fanMood/kassa/förtroende ändras, visa kedjan ur `RippleChain` som redan beräknats. Bygg inte kausalitet — visa den.
2. **Promota weeklyDecision till loopens grind.** Flytta det från sekundärkort till något omgångs-CTA:n väntar på. Mekaniken och effekterna finns; det är en placerings- och flödesändring, inte ett bygge.
3. **Baka in taktikbeslutet i loopen.** Taktik avgör matcher men nås via en separat flik. Gör nästa omgångs taktikjustering till ett synligt steg i Förbered-fasen, matat av `opponentAnalysis` som redan finns.
4. **Ge managern en egen arc-yta.** `trainerArc` finns. Bygg en manager-vy (förankrad i orten, inte abstrakt rykte) som visar fas, svit, milstolpar. Knyt press/gala/derby dit.
5. **Matchvyn (Designs vassaste punkt):** besluta vad vyn är *till för* — se ställning eller känna match. Fyra samtidiga tillståndsvisare (tavla, ticker, momentum, stats-footer) före första händelsen är hela spelets sjuka i miniatyr. Lösningen är prioritering, inte komprimering.

## Syntesförslag (Opus × Design)

Vi är överens om rotdiagnosen. Skillnaden vår audit tillför: **det mesta är ett ytläggnings- och kopplingsproblem, inte ett byggproblem.** Det betyder att Designs fyra "nästa nivå"-byggen i stor utsträckning är fyra "tänd ljuset"-uppgifter, vilket är billigare och snabbare. Ordning jag föreslår:

1. Kör `debug/designAudit`-harnesset — fånga hårda inkonsistenser automatiskt först.
2. Verifiera de tre misstänkta klustren (ripple-migrering, beslut ×4, hint ×6) och rensa död/dubbel kod. Det krymper ytan innan vi bygger ovanpå.
3. Surfa rippleEffect (läsbarhet) + promota weeklyDecision (beslut) som *ett* bygge — orsak och synlig följd är samma slinga, precis som Design säger. Men båda halvorna finns redan; vi kopplar dem.
4. Baka in taktik i loopen. Ge managern en arc-yta.

Allt ovan rör samma sak Design pekar på — den osedda motorn — men källäsningen säger att motorn inte bara är osedd, den är till stor del *redan byggd*. Det är goda nyheter för kostnaden.

---

## TILLÄGG — brett svep av kärnloop + matchvy (verifierat i kod)

Första passet djupläste sex tjänster och drog mönstret ur dem. Det här passet läste **kärnloopen och matchvyn** för att grunda Designs två mest centrala punkter (autopilot, matchvy) i faktisk kod. Läst nu: `PortalScreen` (helt), `MatchLiveScreen` (topp + imports).

**Autopilot bekräftat i kod.** `PortalScreen` har EN dominant sticky CTA längst ned — en pulserande knapp (`btn-pulse`) "Redo — spela omgång N →", plus en ghost-knapp "Simulera resterande säsong". Villkoret är `canClickAdvance = canAdvance || hasScheduledFixtures`. Inget gränsvärde kräver att spelaren engagerat ett beslut innan CTA:n låses upp. Minsta motståndets väg är att trycka på den pulserande knappen. Designs autopilot-diagnos: bekräftad, ordagrant i koden.

**Men anti-autopiloten finns redan halvbyggd.** `decisionBudgetService` är live och importerad i Portal (`getActiveDecisionCount`). En kommentar i koden visar en genomförd omdesign: "PortalActiveBudget (pills) removed — Variant B: en fråga åt gången, ingen paginering", och en tutorial-ram i säsong 1 omgång 1 förklarar principen ("En fråga åt gången. Resten ligger och väntar"). Så "ett beslut i taget" är byggt — men besluten dyker upp som kort i stacken (`SituationCard`/`PortalEventSlot`/sekundärsektion), INTE som ett villkor på CTA:n. Fixen är att göra det befintliga beslutet till en grind, inte att bygga ett beslutssystem. Samma byggt≠ytlagt-mönster, nu på själva loop-knappen.

**Informationsarkitektur (Designs punkt D) konkret bekräftad.** Portal staplar ~12–15 vertikala komponenter runt primärkortet: `SituationCard`, `PortalPhaseMark`, `PortalUpptakt`, `PortalSpectatorMark`, `PortalAnniversaryMark`, `PortalBeat`, `PortalRoundMark`, `PortalObjectiveAlert`, `PortalEventSlot`, primärkort, story-slot, `PortalQueueRail`, sekundärsektion, minimal-bar, `PortalInboxCounter`. "Var tittar jag" är ett verkligt, grundat problem — mycket konkurrerar ovanför viklinjen innan primärkortet.

**Matchvyn (Designs vassaste punkt) styrkt av imports.** `MatchLiveScreen` komponerar `ScoreboardStalvallen` (LED-tavlan) + `CommentaryFeedStalvallen` (referat-feed) + `MatchControls` (som enligt Design bär `MomentumBar` + `StatsFooter`). Flera samtidiga matchtillstånds-ytor är alltså bekräftade via imports. (Exakt renderingsordning är inte radverifierad — men strukturen stödjer Designs räkning.)

**`FirstVisitHint` bekräftat använd i matchLive** (importeras här). Den är alltså inte död — Designs korrigering står. Det bredare hint-klustret är dock fortfarande inte usage-spårat.

**`decisionBudget` är den LIVE beslut-tjänsten** (används i Portal). Det reder ut en del av beslut-klustret: budget är den aktiva. De andra tre (`weeklyDecision`, `decisionFatigue`, `seasonDecisions`) är fortfarande inte spårade — kan vara wired på andra ytor eller döda.

## Vad som återstår att verifiera (ärlig avgränsning)

Jag har INTE läst, och drar därför inga skarpa slutsatser om:
- `roundProcessor` (~92 KB) — den misstänkta halvgjorda ripple-migreringen (lever både ny merge och gamla utdrag?) är fortfarande en hypotes, inte ett konstaterande.
- `GranskaScreen` — om eftermatchsanalysen är en återvändsgränd eller kan mata nästa taktikval är inte kodverifierat.
- Beslut-klustrets usage (weeklyDecision/decisionFatigue/seasonDecisions — döda eller wired?).
- Hint-klustrets usage (sex mekanismer — vilka renderas faktiskt?).

Dessa fyra kräver var sin riktad läsning. Mönstret (byggt≠ytlagt) håller oavsett, men de specifika död/dubbel-kod-påståendena ska behandlas som "att verifiera", inte som fynd.

---

## VERIFIERINGSPASS + EGNA TRÅDAR (läst: roundProcessor topp/imports, GranskaScreen helt)

### Verifiering — och en korrigering av MIG själv

**Beslut-klustret är LAGRAT, inte redundant. Min tidigare misstänkta "överlapp" var fel.** roundProcessor importerar och använder alla tre: `generateWeeklyDecision` (genererar A/B-beslutet), `canAddDecision`/`MAX_ACTIVE_DECISIONS`/`MAX_DEFERRED_DECISIONS` (grindar hur många som är aktiva), `getFatigueState` (spårar tillstånd). De konkurrerar inte — de är en pipeline: weekly skapar, budget begränsar, fatigue mäter. Korrigering av första auditens "misstänkt död/dubbel": detta är ett designat lager. (seasonDecisions fortfarande ej spårad.)

**Granska är INTE en ren återvändsgränd — korrigering av Design.** `GranskaScreen` är där post-match-besluten faktiskt fattas: `handleChoice` → `resolveEvent`, och `getCriticalEventsForGranska(pendingEvents)` ytlagger ohanterade kritiska händelser (presskonferens, domarmöte, kritiska event). Spelaren VÄLJER här. Designs misstanke att "Granska leder inte till beslut" stämmer inte för skärmen som helhet.

**Men precisering: återvändsgränden är analys-flikarna, inte Granska.** Av fyra FÖRDJUPA-steg bär två beslut (Översikt, Spelare — `onChoice`), två är rena rapporter utan val (Shotmap, Analys). Designs "41 KB analys i en återvändsgränd" gäller alltså specifikt `GranskaAnalys`/`GranskaShotmap` — de tar in resultat men returnerar inget val och leder ingenstans framåt.

**Ripple-migrering: ny väg är wired.** roundProcessor importerar `mergeRippleDeltas` OCH `describeRippleChain` OCH `applyRipples`. Den konsoliderade merge-funktionen används alltså. Om gamla utdrag lever kvar parallellt kräver en body-läsning av 92 KB:n — ej gjord. Men: `describeRippleChain` betyder att det redan finns en funktion som gör en RippleChain till läsbar prosa. Läsbarhetslagret har alltså inte bara data utan en text-renderare — surfa-jobbet är ännu mindre än auditen först sa.

**Manager-state är DUBBELT beräknat, fortfarande osynligt.** roundProcessor uppdaterar varje omgång både `updateTrainerArc` (karriärfas) och `updateManagerBurnout`/`updateH2HRecord`/`getBurnoutZone` (utbrändhet, inbördes möten). Två manager-system kör; ingen av dem har en egen yta.

### Egna trådar — dit Design inte tittade

**1. roundProcessor är en god-orkestrator — den verkliga arkitekturrisken.** ~50 processorer/tjänster importeras och körs i sekvens varje advance. Hela rundan är en enda sekventiell pipeline. Det är där ordningsberoenden bor: kör narrativ före ripples, eller ripples före ekonomi, och orsak→verkan-kedjan ändras. "~140 tjänster" är inte problemet i sig — problemet är att de alla tratta genom EN dirigent, så varje ny feature lägger till ett importberoende och en ordningsrisk. Design såg symptomen (mycket byggt); det här är mekanismen.

**2. advance() körs som SIDOEFFEKT av navigation i Granska.** `GranskaScreen` anropar `advance(true)` i en useEffect för att processa rundan medan spelaren tittar på post-match-skärmen. De har tvingats lägga en `didAdvance.current`-ref-grind för att hindra dubbelfyrning — vilket avslöjar att dubbelkörning varit en verklig bugg. Tung rundlogik kopplad till en skärms livscykel är skört: navigera bort mitt i, eller låt effekten gå om, och tillståndet kan gå sönder. Det här är build-behind-tree-fällan i drift, och den är värd ett eget Code-pass: flytta round-processing ut ur skärmars effekter.

**3. Besluten är utspridda över TRE ytor med samma mönster men ingen gemensam modell.** Val dyker upp i Portal (som kort), i Granska (som event-resolution med egen lokal `resolvedEventIds`/`chosenLabels`-state), och i match. Varje yta återimplementerar "visa val → resolveEvent" lokalt. Även en engagerad spelare måste lära sig tre olika besluts-UI. Designs "beslut är begravda" är en understatement — de är begravda PÅ TRE OLIKA SÄTT. En gemensam besluts-yta (en modell, ett mönster) är ett konsolideringsbygge Design inte nämnde.

**4. Den billigaste mellanmatchs-agensen finns redan halvvägs: Granska-Analys → Taktik.** Designs högsta lucka är "inga meningsfulla beslut mellan matcher". Lösningen kräver inget nytt: `GranskaAnalys` (som idag dödar i en rapport) kan avslutas med "så här ändrar du till nästa match →" och routa till `TaktikScreen`, som REDAN tar emot `opponentAnalysis` (verifierat i första passet). Två befintliga ytor, en koppling — och eftermatchsanalysen slutar vara en återvändsgränd och blir bryggan till nästa besluts grind. Det här är mitt skarpaste gameplay-förslag, härlett ur koden, inte ur Designs rapport.

**5. Mönstret gäller även CTA-grindar överallt.** Både Portal-CTA:n och Granska-CTA:n ("KLAR — NÄSTA OMGÅNG") är alltid klickbara även med ohanterade beslut. Granska visar en mjuk varning ("N ohanterade händelser") men grindar inte. Överallt är mönstret detsamma: beslutet finns, ytlagt, men aldrig som villkor. Anti-autopilot är därför inte fyra byggen — det är EN princip applicerad på befintliga grindar: gör minst ett substantiellt val till ett villkor för CTA:n, på varje yta.
