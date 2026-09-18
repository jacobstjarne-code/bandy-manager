# DOM — döda textpooler, 2026-09-18 (Fable)

Underlag: knip-körningen på HEAD `bd5009c3` (tillägg 3 i `CODE_KORORDER_SPAKBALANS_2026-09-18.md`, rådata `docs/matningar/spaksvep_2026-09-18/knip_dead_exports.json`). Varje pool nedan är exporterad, aldrig importerad utanför sin egen fil och utanför tester. Jag har läst innehållet. Tre domar: **KOPPLA IN** (texten är bra och det finns en yta där den hör hemma), **ARKIVERA** (texten är bra men ytan finns inte; flytta till `docs/archive/textpooler/` så den inte försvinner), **STRYK** (dubblett, fel register eller överspelad av senare bygge).

Per pool står ytan, villkoret och vem som gör vad. Code kopplar in mot befintliga generatorer; ingen ny mekanik. Alla rader står redan i skrivguidens register, ingen ny text behövs för KOPPLA IN.

## KOPPLA IN (sex pooler)

**1. `specialDateService`: `annandagsbandyBriefing`, `nyarsbandyBriefing`, `finaldagBriefingPlaying/Spectator`, `cupFinalBriefingPlaying/Spectator`.** Fem annandagsrader, fem nyårsrader, tre plus fem finaldagsrader. `NextMatchPrimary.tsx:43` visar redan etiketten ANNANDAGEN/SM-FINALEN men ingen briefingtext; `PortalPhaseMark` har annandagsfasen. Yta: matchförberedelsevyn (Förbered), raden under motståndarrubriken, samma omgång som fixturen har flaggan. Villkor: `fixture.isAnnandagen`, `isNyarsbandy`, `isFinaldag` (spelande om vår klubb, åskådare annars), `isCupFinalhelgen`. `finaldagBriefingSpectator` är dessutom en av korridorens tystaste omgångar (D2 i textleveransen); den fyller ett hål vi redan identifierat. Emoji-prefixen (🎄 🎆 🏆) stryks vid inkoppling, de bryter skrivguiden.

**2. `supporterRituals.getAwayTripNarrative`.** Tretton rader om bussresan, med klackledare, veteran, ungdom och familj som namngivna röster. Yta: inbox omgången efter en bortamatch där `supporterGroup.awayTripMatchday === matchday` (bortaresekortet finns redan, det är efterklangen som saknas). Vinst/förlust-varianter finns i poolen. Detta är exakt "händelse utan efterdyning" (klass F) för ett kort spelaren aktivt sagt ja till.

**3. `supporterRituals.getWelcomeSong`.** En rad, arenaberoende. Yta: matchlive omgång 1 hemma varje säsong, före avspark, som första kommentarrad. En gång per säsong, aldrig oftare.

**4. `suspensionText.SUSPENSION_RETURN_LINES`.** Tre rader. Yta: inbox omgången då `suspensionGamesRemaining` går till 0 för en managed-spelare, med `{motståndare}` = nästa motståndare. Villkoret finns redan i `playerStateProcessor`. Idag är återkomsten tyst; spelaren upptäcker den i laguttagningen.

**5. `windowDeadlineText.DEADLINE_KAFFERUM_TEXT`.** Fem rader kafferumsprat på transferdagen. Yta: kafferummet den omgång `fixture.isWindowDeadlineDay` är sant. Fasen finns (`scheduleGenerator.ts:299`), rummet finns, texten finns; det är bara kopplingen som saknas.

**6. `refereeService.REFEREE_OPENING_COMMENTARY`.** Nio rader om domarens linje, tre per domartyp. Yta: matchlive, andra kommentarraden i första halvlek, när domaren har ett tydligt stilvärde. Bandyspråket är rätt ("bandyvänlig pipa", "backarna kan ta i så länge det är rent").

## ARKIVERA (fyra pooler)

**7. `hallProvningData`: `HALL_NEWS_POSITIVE/NEGATIVE/OUTDOOR_PRIDE`, `BOARD_HALL_QUOTES`.** 44 rader, bra skrivna, tillhör hallprövningen som fasmaskin (B1 §5). Fasmaskinen använder andra strängar ur samma fil; de här fyra poolerna var tänkta för en nyhetsström och en styrelsedebatt som inte byggdes. Innehållet är för specifikt för att kopplas in utan den mekaniken (siffror som "3,2 miljoner per år", "280 åskådare"). Arkivera med hänvisning till hallprocessen; plockas när hallen får ett mediaspår, sannolikt efter soft launch.

**8. `communityNames`: `KIOSK_FLAVORS`, `LOTTERY_FLAVORS`, `EVENT_FLAVORS`.** 57 rader volontärvardag ("fick slut på senap redan i halvtid"). Rätt ton, men de hör till ortsaktiviteternas gamla notismodell som ersattes av D031/D037:s färskvarumodell utan notiser per omgång. Arkivera. Om korridoralternativ 2 väljs kan KIOSK/EVENT bli en femte nivå i D4 (Bygden), då återuppstår de med villkor.

**9. `transferResponseText`: `PLAYER_LEDGER_*` (tolv rader), `RIVALRY_WARNING_PER_INTENSITY` (nio).** Spelarliggarens karaktärsrader ("Kör grävmaskin åt kommunen på vardagarna") är bland de bästa i hela korpusen, men de är hårdkodade exempel utan variabler (Ekström, Sjödin, Skutskär) och kan inte kopplas in generiskt. Arkivera som förlaga; rivalitetsvarningen (nio nivåer) arkiveras tills transferytorna rörs (POST_LAUNCH `scout-shortlist-transferfonster`).

**10. `specialDateStrings`: `STUDAN_FACTS`, `SAVSTAAS_FACTS`.** Faktarutor om Studenternas och Sävstaås. Innehåller riktiga klubbar (Hammarby, Bollnäs, Edsbyn) som skrivguiden förbjuder i speltext. Arkivera som research; kan bli lore-kommentar (`FINALDAG_COMMENTARY_LORE` finns redan och används) om raderna tvättas från klubbnamn.

## STRYK (åtta poster)

**11. `assistantCoachService`: `getHalftimeCoachComment`, `getTacticChangeFeedback`, `framesWeeklyDecision`, `getSeasonSummaryReflection`, `canSubstituteAtPressConference`.** Funktioner utan egna strängar, ersatta av assistentrösten i `assistantFFStrings` och halvtidsmodalen. Stryk.

**12. `narrativeService`: `addNarrativeEntry`, `generateGoalStreakEntry`, `generateAcademyPromotionEntry`.** Två rader, båda i AI-register ("Formen är het just nu", "nu gäller det att gripa chansen"). Överspelade av `narrativeProcessor`. Stryk.

**13. `clubEraService`: `eraFullLabel`, `eraDescription`.** "Det är inte längre bara bandy. Det är ortens identitet." är exakt argumentparet skrivguiden förbjuder. Stryk.

**14. `journalistService`: `getJournalistTone`, `getHeadlinePrefix`.** Prefix med "SENSATION!" i versaler. Journalistrubrikerna byggs nu i `journalistHeadlineStrings` per persona. Stryk.

**15. `trainingService.trainingTypeDescription`.** "Skridskoåkning +0.3, Acceleration +0.2" är siffror i UI som skrivguiden och metric-scale-guarden inte tillåter; ersatt av A5-raderna i textleveransen. Stryk.

**16. `enumLabels`: fyra TACTIC_*-etikettabeller.** Ersatta av `tacticData.ts` efter formationer v2. Stryk.

**17. `csPressEventText`: `pickCSPressQuestion`, `buildCSPressMemoryEntry`; `anniversaryMemoryRowText.anniversaryRowDetail`; `facilityPortalBeats`: `FACILITY_AVAILABLE_BEAT`, `HALL_PROCESS_BEATS`; `upptaktCopy.MUSTWIN_CRIT_TAGS`; `contentContract._*CoverAllTypes`; `cupIntroScene.shouldTriggerCupIntro`; `supporterService.updateSupporterFavorite/getSupporterMoodLabel`.** Hjälpare vars anropare försvunnit. `HALL_PROCESS_BEATS` (tre rader) är den enda med text värd att spara; flytta raderna in i hallprocessens befintliga beat-pool innan strykning.

## Handoff

Code, ett pass: KOPPLA IN 1–6 mot ytorna ovan (sex generatorvillkor, inga nya tillstånd), flytta 7–10 till `docs/archive/textpooler/` med en rad om varför, stryk 11–17. Kör knip efteråt; målet är noll döda exporter i `src/domain/data/`. Verifiera 1, 2 och 4 med `scripts/text-exposure.ts`: annandagsbriefingen ska synas exakt en gång per säsong, bortaresans efterklang efter varje besvarad bortaresa, avstängningsåterkomsten vid varje avstängning.

Fable: inget mer här. Emoji-strykningen i pool 1 är mekanisk.
