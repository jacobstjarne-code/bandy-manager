# OPUS-DOM — svep-rapporten (svar på SVEP_RAPPORT_CODE_2026-06-12)

**Datum:** 2026-06-12 · **Av:** Opus · Allt nedan är beslutat — kör utan ny runda där inget annat anges. Rapportera per punkt med hash.

---

## G1a — 7 segerpoäng: **GO, mekaniskt**
tre→två i alla sju. "Tre poäng är tre poäng" → "Två poäng är två poäng" (behåller figuren). "tre poäng i gåva" → "två poäng i gåva" (Jacobs beslut, Lärdom #8).

## G1b — RF-avdragen: **BEHÅLL "tre poäng" — MEN verifiera mot mekaniken**
RF-straff är sin egen skala och följer inte matchpoängslogik — "tre poängs avdrag" är trovärdigt byråkratspråk även i ett 2p-system (1,5 vinster: det ska svida ojämnt). **Villkor (Lärdom #9):** texten måste matcha vad `licenseService` FAKTISKT drar av. Redovisa avdragsvärdet i koden; drar den 3 → texterna står; drar den annat → texterna följer koden, inte tvärtom.

## G3 — hallen-buggarna: **7 fixar, exakta texter nedan**
1. `eventCardInlineStrings:3` → "Han var en av få som var kvar på vallen."
2. `managerKaraktarText:25` → "Bor ensam nära vallen. Säger att det passar honom, och kanske gör det det."
3. `boardQuotes:100` → "...när hemmamatch betydde att man gick till vallen." **OBS:** boardQuotes är FREDAD — detta är ett faktafel-undantag (världsbygge), minsta möjliga ingrepp, inget annat i filen rörs.
4. `stillnessMicroPool:39` → "Lokaltidningen skrev en helsida om ny asfalt vid vallen. Sportsidan fick en notis."
5. `stillnessMicroPool:55` → "Kyrkklockorna hörs ända ner till vallen när vinden ligger rätt." (dörr-bilden var inomhus — hela bilden byts, inte bara ordet)
6. `playoffAnslag:13` → "Vallen tystnade fortare än vanligt. Resten åkte vi hem i."
7. `injuryDoctorText:92` → "{spelare} var först till träningen i dag. Kroppen börjar lita på sig själv igen."

## G7 — könsbuggarna
**efterklangText (2), exakta texter:**
- `:45` → "{journalist} ringde efter den matchen. Minnet på redaktionen är längre än du tror."
- `:46` → "{journalist} skrev om det då. Det är inte glömt."

**boardMeetingCopy:29 (ordföranden):** styrelsen genereras ur club.board med blandade kön → pronomenfritt: "Ordförandens kök. Tre stolar framplockade runt köksbordet. Kaffe på spisen."

**coffeeRoomService kassören (:151,188,193) + {youth} (:461) + supporterRituals:66:** REDOVISA genereringskällan per sträng innan ändring. Facit att döma mot: ungdoms**ledaren** genereras ur KVINNONAMNPOOL (functionaries) → "Hon" om ledaren är KORREKT; en ungdoms**spelare** (P19, pojklag) → "Hon" är fel → pronomenfritt. Kassören: om strängarna avser den genererade styrelsekassören (blandade kön) → pronomenfritt; om fast kvinnlig karaktär → behåll.

## G8 — 🏒-handlingsplanen (domslut c trumfar undantag b: klubban åker ÖVERALLT)

**Generalregel:** 🏒 ersätts med (a) **⛸️** där en bandy-markör behövs i INNEHÅLL, (b) **'MÅL!' utan emoji** för målhändelse-jubel, (c) **Lucide per B3-mönstret** (`8610fbb`-mappningen) där raden är chrome, (d) **initialer/Ⓒ** för identitet/kapten. Per kategori:

1. **Mål-ikonen** (formatters.ts Goal + GranskaAnalys/Oversikt): **🥅** i händelselistor (innehåll). Granska-radernas chrome-varianter följer B3-mönstret om raden redan Lucide-ifierats.
2. **'🏒 MÅL!'-markören** (Counter/Corner/Penalty/FreeKick-interaktionerna): → **'MÅL!'** utan emoji. Versalerna bär jublet bättre än klubban gjorde.
3. **SectionLabel-prefixen** (13 ställen): chrome → **Lucide per B3-mappningen**. Skytte-relaterat = Target, match-relaterat = samma ikon B3-svepet valde för matchsektioner. Ingen ny ikondesign — återanvänd.
4. **Truppvy/stats inline** (SquadScreen, SimSummary, SeasonSummary): Lucide per B3. SeasonSummary trophy-fallback → 🏆 (är redan trofé-semantik).
5. **Tjänste-strängar:** `transferProcessor:337` inbox-titel → **emojin bort helt** (inkorg-recutens kanon: severity-dots, inga titel-emojis). `weeklyDecisionService:125` '🏒 Hörnor' → 'Hörnor'. `trainingService:235` BallControl → **🟠** (bandybollen — om trainingType-raden är emoji-baserad; annars Lucide).
6. **Undantagen:** `EventCardInline:36` '🏒 KAPTENEN' → **'Ⓒ KAPTENEN'** (kaptenssymbolen). `PortalQueueRail:17` weeklyDecision-icon → **📋**. Båda behåller emoji-ikonografi-undantaget — bara klubban byts.
7. **Övrigt:** CoachMarks 'Kör igång! 🏒' → 'Kör igång!' · HelpOverlay/LastResultCard/StillnessSection → Lucide resp. ⛸️ (StillnessSection isMatch = innehåll → ⛸️) · `BoardMeetingScene:26` identity → **klubbinitialer** (HIF-mönstret från B1-mocken) · OrtenTab Bandyskola → ⛸️ · GranskaSpelare POTM-badge → ⭐ · seasonShareImage (delningsbild = innehåll) → ⛸️.

Tveksamma enskilda träffar under körningen → kort lista till Opus, gissa inte.

## V-punkterna
- **V1:** ✅ redan fixad (`6ee68ca`) — retroaktivt GO, korrekt lösning.
- **V2 (sundayTraining): minsta ingrepp — texterna var bra, bara namnen fel.** Casting vid scene-build: `{earliest}` = högst (professionalism+lojalitet)/2 · `{phone}` = lägst professionalism (exkl. earliest) · `{cold}` = lägst moral (exkl. ovan) · skyttarna = tre forwards. Alla distinkta; truppen är alltid ≥11 så ingen degradering behövs. **Textfixen är mekanisk:** Henriksson→{earliest}, Lindberg→{phone}, Bergström→{cold} i samtliga strängar OCH val-etiketter; relationseffekterna pekar på de castade player-ids. Skicka diffen till Opus för okulär innan commit — inga nya texter ska skrivas.
- **V4 (boardMeeting förväntan): DYNAMISK — OCH NU HELT SPEC:AD (SYSTEMKARTA-bifångst).** `boardService.generatePreSeasonMessage` har redan expectationText-mappningen: AvoidBottom → "undvika botten av tabellen", MidTable → "hålla oss i mitten av tabellen", ChallengeTop → "utmana om topplaceringar", WinLeague → "vinna ligan". Exportera mappningen och bygg beatet: `"Målet i år: att ${expectationText[club.boardExpectation]}. Inget mer behöver sägas om saken."` — ingen objective-typ-rapport behövs, ingen ny copy.
- **V6:** ✅ dokumenterat. Lägg kodkommentaren ("två system, event-specifik vs situationell — båda avsiktliga") så nästa arkeolog slipper undra.
- **V7:** accepterad som lågrisk. Ingen åtgärd.
- **V8:** **GO** — flytta `ordinal()` till utils, använd i båda final-renderarna. Ingen ny runda.
- **V9:** korrekt slutsats — `--disabled-opacity` är definierad-ej-wirad och tillhör #8. Räknas inte som klar förrän OrtenTab + alla disabled-knappar konsumerar tokenen.

## Kvarstående redovisningar (från arbetsordern, fortfarande obesvarade)
1. **SM-final-interpolationen** — KRITISK: renderas {playerName}/{minute}/{arenaCapacity} i smFinalVictoryScene? Visa renderad bodyText.
2. **DEL 4-commitstatus** — ingick textauditens DEL 4-filer i `1f109ca` ("~95 DEL1–3") eller behövs en resterande text-commit? `git show --stat 1f109ca` avgör.
3. **Notisdiet B3/B4** — utgångs-konsekvensnotiserna (strängarna ligger i FORSONING_OPUS_TEXT DEL C). Status?

**Ordning:** kvarstående redovisningarna (1–3) → G1a/G3/G7-fixarna (en `text:`-commit) → G8 per kategori → V2/V4/V8 → #8.

— Opus, 2026-06-12
