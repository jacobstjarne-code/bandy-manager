# SYSTEMKARTA — DEL 1: Mätarinventeringen

**Datum:** 2026-06-12 · **Av:** Opus · **Del av:** Fable-fönstrets genomlysning (PLAN_FABLE_10_DAGAR, Opus-spåret)
**Metod:** Inventering ur state-modellen (Club + Community + SaveGame). DEL 2 = läs/skriv-spårningen per mätare (Code-grep-paket + riktade Opus-läsningar). DEL 3 = domar: död mätare / död spak / saknad loop.
**Definitioner:** *Mätare* = state spelaren kan påverka och som spelet visar eller borde visa. *Spak* = handling spelaren utför. *Död mätare* = skrivs men läses inte (eller läses bara av sin egen visning). *Död spak* = handling utan kännbar konsekvens (D2-frånvaro). *Saknad loop* = mätare som borde påverka annan mätare men inte gör det.

---

## §1 Relationer & stämningar (kärnmätarna)

| # | Mätare | Skala | Bor i | Anteckning |
|---|---|---|---|---|
| 1 | club.reputation | 0–100 | Club | klubbens anseende |
| 2 | fanMood | 0–100 | SaveGame | "starts 50" |
| 3 | supporterGroup.mood | 0–100 | SupporterGroup | klackMood — Birger/Västra Sidan |
| 4 | communityStanding (+Delta) | 0–100 | SaveGame | Bygdens puls? "starts 50" |
| 5 | boardPatience | 0–100 | SaveGame | + consecutiveFailures → managerFired |
| 6 | journalistRelationship | 0–100 | SaveGame top-level | **DUBBLETT-MISSTANKE mot #7** |
| 7 | journalist.relationship | 0–100 | Journalist-entiteten | scoreSnapshots läser DENNA |
| 8 | sponsorNetworkMood | 0–100 | SaveGame | kollektiv sponsorstämning |
| 9 | patron.happiness/patience/influence | 0–100 | Patron | tre delmätare |
| 10 | politician.relationship | 0–100 | LocalPolitician | kommunrelationen (prövningens basodds) |
| 11 | politician.popularitet/oppositionStrength/corruption/generosity | 0–100 ×4 | LocalPolitician | **läses någon av dessa?** |
| 12 | volunteerMorale | 0–100/namn | SaveGame | per frivillig |
| 13 | mecenat-relationer | — | Mecenat[] | eget kravsystem |
| 14 | refereeRelations | — | SaveGame | domarsystemet (25g) |

**KARTFRÅGA A (publikstämningstrion #2/#3/#4):** tre mätare för "vad folk känner". Hypotes om avsedd arbetsdelning: fanMood = breda publiken (intäktsrelaterad), klackMood = de organiserade (Västra Sidan, tifo, ramsor), communityStanding = orten bortom bandyn (kommun, skola, Konsum). Om services blandar dem godtyckligt är två av tre brus. DEL 2 avgör.
**KARTFRÅGA B (journalistdubbletten #6/#7):** vilken är källa, vilken är rest? scoreSnapshots läser entitetens — top-level-fältet kan vara pre-V1.0-rest.

## §2 Ekonomi

| Mätare | Bor i | Anteckning |
|---|---|---|
| club.finances / wageBudget / transferBudget | Club | kassan + budgetar |
| scoutBudget | SaveGame | separat pott |
| seasonStartFinances | SaveGame | snapshot för delta |
| financeLog | SaveGame | senaste N poster |
| previousKommunBidrag / politician.kommunBidrag | SaveGame/Politician | kommunpengarna |
| sponsors[] + riskySponsorContract | SaveGame | inkl. riskmekanik (25h L2) |
| wageBudgetOverrunRounds | SaveGame | → Licensnämnden |
| licenseReview/licenseStatus/consecutiveLossSeasons | SaveGame | RF-spåret (G1b-domen: avdragsvärdet bor här) |
| pointDeductions/pendingPointDeductions | SaveGame | tabellstraff |
| economicCrisisState | SaveGame | DREAM-002 narrativ bana med outcome |
| averageAttendance (+previous) | SaveGame | publiksnitt — prövningens krav 2 läser denna |

**KARTFRÅGA C:** vad driver averageAttendance i intäktsmodellen — väder + tabell + fanMood? Vilken av stämningstrion? (Prövningens Publik-dimension hänger på svaret.)

## §3 Trupp & utveckling
spelarattribut (form/moral/fitness/sharpness) · chemistryStats (**läses den?**) · trainingProjects · managedClubPeriodisation (bygg/håll/toppa/vila) · leadershipActions (med expiresRound ✓) · captainPlayerId · mentorships · loanDeals · youthTeam + academyLevel + academyReputation · youthIntakeHistory · activeArcs (V1.3) · nemesisTracker · playerConversations · doctorQuestionsUsed

## §4 Klubb & anläggning (B1-kollisionszonen)
**club.facilities (0–100)** · **club.youthQuality/youthRecruitment/youthDevelopment (0–100 ×3)** · **facilityProjects[]** (FacilityProject med financingMode club/kommun/mecenat!) · facilityUpgradeSeason · hasArtificialIce ("förberedd för V0.2" — **död flagga?**) · hasIndoorArena · communityActivities (kiosk/lotteri/julmarknad/bandyskola/pensionärskaffe...)

**KARTFRÅGA D (kritisk för B1):** FacilityProject-systemet FINNS redan med kommun/mecenat-finansiering — B1:s FacilityTree och prövningen måste antingen ÄRVA detta system eller ersätta det medvetet. Om Code bygger B1 bredvid utan att läsa detta får vi dubbla anläggningssystem. → IN I CODE §6a-UNDERLAGET OMEDELBART.

## §5 Berättelse & minne
clubMemory/activeAnniversaries · clubLegends · allTimeRecords · storylines · seasonSummaries · pastSeasonSignatures · rivalryHistory · klackEcho · recentMoments · currentEra (survival/fotfäste/establishment/legacy) · trainerArc · managerProfile · bandyLetters · schoolAssignmentArchive · scoreSnapshots (position/journalist/form, 22 omg)

## §6 Tempo & uppmärksamhet (beslutsekonomin — genomlysningens kärna)
deferredDecisions (budget-cap max 10) · pendingDecisions (**"reserved for future use" — död**) · decisionBudgetService + decisionFatigueService (fatigueHistory/fatigueHotStreak) · sourceCooldowns · cardStaleTracking · attentionRouter · weeklyDecision (cooldown) · lastRumorRound/lastEventQueueRound (cooldowns 3/2) · interruptClassifier

**KARTFRÅGA E:** beslutsekonomin har FEM throttlingsystem (budget, fatigue, source-cooldowns, stale-bias, event-cooldowns). Samverkar de eller staplas de? Risk åt båda håll: för tyst mittsäsong (allt cooldownar samtidigt) eller tryckläckage (system räknar inte varandras beslut). Detta är spelkänsle-auditens systemiska motpart — Jacobs genomspelning ger upplevelsesidan, DEL 2 ger mekaniksidan.

## §7 Misstankelistan inför DEL 2 (prioriterad)
1. **Journalistdubbletten** (§1B) — en av två är rest
2. **Publikstämningstrion** (§1A) — arbetsdelning eller brus?
3. **Politikerns fyra extramätare** (corruption/opposition/popularitet/generosity) — skrivna men olästa?
4. **chemistryStats** — läses den av matchmotorn eller bara samlas?
5. **hasArtificialIce** — död V0.2-flagga
6. **pendingDecisions** — uttalat reserverad/död
7. **patron.demands[]/wantsStyle** — konsumeras de?
8. **club.facilities-skalan vs facilityProjects** — vem läser 0–100-värdet? (B1-kollisionen, §4D)
9. **boardPersonalities vs club.board** — dubbla styrelser: vilka ytor läser vilken?
10. **fanExpectation vs boardExpectation** — läses fanExpectation alls?

## §8 DEL 2b — riktade läsningar, RESULTAT (2026-06-12 em)

**Kartfråga C — BESVARAD (economyService läst):** Intäktsmodellen har REN arbetsdelning: `fanMood` driver publikgrad (0.35 + fanMood×0.40) och kioskens moodMult · `communityStanding` driver ENDAST kommunbidraget (kvadratisk faktor, betalas omg 1) · `reputation` driver basintäkt, biljettpris, kapacitetsfallback · tabellposition driver både publik och formbonus · journalistsynligheten har en ÄKTA ekonomiloop (attendance-modifier 0.95–1.10). Klacken läses inte av ekonomin (rimligt: 10–80 personer). Stämningstrion är alltså INTE brus på lässidan — återstår skrivsidan (grep).

**KARTFYND 1 — VÄDER→PUBLIK-LOOPEN SAKNAS — ÅTGÄRDAD 2026-06-12 (Jacobs beslut: bygg).** Fördjupning vid bygget: `WeatherEffects.attendanceModifier` BERÄKNADES redan av weatherService (snöstorm 0.60 … lätt snö 0.85) men konsumerades aldrig — avbruten wire, inte saknad funktion (samma felklass som LedgerFrame-Förbered). Opus byggde mottagarsidan i economyService (`effectiveWeatherAttendance` + optional params, bakåtkompatibelt; final/annandag halverar dippen, hasIndoorArena neutraliserar). Wiring av anroparna = `CODE_ORDER_VADERLOOP_2026-06-12.md`. Prövningens §5-effekt faller nu ut gratis ur loopen — vi byggde en UTOMHUS-mekanik som hallen konsumerar, inte tvärtom.

**KARTFYND 2 — BIRGER-INKONSISTENSEN (träffar även Opus eget arbete):** supporterGroup.leader GENERERAS ur namnpool [Sture, Gunnar, Leif, Bengt, Jan, Birger, Rune] — men klackEchoText, hallDebateData och prövningens nya textpooler hårdkodar "Birger" som klackledare. I saves där leadern heter Gunnar står Birger-citaten bredvid fel namn på ytor som visar leader.name. MINSTA FIX som bevarar all text: tvinga managed klubbs leader.name = 'Birger' vid generering (overrideName-mönstret finns redan i generateSupporterGroup). → Code-order-kandidat, en rad.

**G7-FACIT BEKRÄFTAT I KOD:** youth-rollen genereras ur KVINNONAMNPOOL (Elin, Sara, Maja...) — supporterRituals "{youth}... Hon" är KORREKT om {youth} = supporterkaraktären. Klack-medlemsantal växer/krymper med mood+resultat (tak 80, golv 8) — levande loop ✓.

**Kartfråga E — BESVARAD MED FYND (decisionBudgetService + attentionRouter + interruptClassifier lästa):**
**KARTFYND 3 (preciserat i tre steg) — TRYCKET ÄR SEKVENTIELLT OCH POLICYBESLUTET TOGS ALDRIG.** (1) decisionBudget-gaten räknar bara pendingEvents + weeklyDecision — övriga kanaler (scen, press, domarmöte, pensionsval, annandagsval, echo) går förbi. (2) attentionRouter SERIALISERAR visningen (screen > scene > event > idle) — så upplevelsen är inte fem saker samtidigt utan fem AVBROTT I FÖLJD samma omgång. (3) interruptClassifier (2026-05-21) byggdes som MÄTINSTRUMENT för exakt detta — dess huvudkommentar: roundProcessor throttlar bara lågprio-events (MAX_ATMOSPHERIC=2, MAX_LOW_IN_QUEUE=5, spill-to-inbox); anslag/weekly_decision/phase_mark bypassar HELT; "changes NOTHING until Design decides" — OCH BESLUTET TOGS ALDRIG. Instrumentet (countPendingInterrupts, actionable/informational-klassningen) ligger färdigt och oanvänt. → VÅG 2-UPPGIFT, FÄRDIGFORMULERAD: ta throttle-policybeslutet med befintligt instrument — förslag: omgångsbudget över ALLA kanaler, viktklasser (actionable = tung, informational → inbox per FM-principen). Korsas mot Jacobs genomspelnings "för mycket samtidigt"-loggar.

**KARTFYND 4 — STYRELSENS PERSONER GENERERAS I TVÅ OBEROENDE SYSTEM.** Fyra styrelselager: club.boardExpectation (enum, boardService) · club.board (ClubBoard: chairman/treasurer/member MED gender — boardMeetingScene-beatsen) · boardPersonalities (BoardMember[] MED personality — boardQuotes-konsumenter?) · boardObjectives (mål med ownerPersonality). Lager 1+4 är aspekter (ok). Lager 2+3 är PERSONER genererade separat — ordföranden kan heta olika på olika skärmar. Grep-paketet §7.9 avgör vilka ytor som läser vilken; trolig åtgärd: ETT persongalleri (club.board med gender) + personality-fältet flyttas dit.

**V4-FACIT (bifängst ur boardService):** `generatePreSeasonMessage` har redan expectationText-mappningen ("utmana om topplaceringar" osv) — boardMeetingScene-beatets dynamiska förväntan ska läsa den (exportera mappningen), INTE vänta på objective-typ-rapport. DOM-dokumentet uppdaterat.

**Övriga noteringar:** matchMoodService antar matchday 12 = Annandagen (hårdkodad kalender — ok givet låsta scheduleGenerator, men bör dokumenteras) · finance-status-trösklarna: varning −500 tkr, licensnekande −1 Mkr, game over −2 Mkr · deriveKassaHistory rekonstruerar saldohistorik bakåt ur loggen (C-SY2) ✓.

## §8b DEL 2c — roundProcessor KOMPLETT LÄST (2 000 rader, 2026-06-12 kväll)

**SKRIVSIDAN AV STÄMNINGSTRION — BESVARAD UTAN GREP:** `fanMood` skrivs av processNarrative (matchresultat) + transferkonsekvenser (bud-avslag −5, rivalförsäljning −20) · `communityStanding` skrivs av processCommunity + playoffCsBoost + **MEAN REVERSION: pulsen driftar mot 60 med 3 %/omgång (Sprint 26)** — allt spelaren bygger eroderar mot mitten, pulsen kräver kontinuerligt underhåll. Medveten anti-runaway-design, viktig för spelkänslan: communityStanding kan ALDRIG parkeras. · `supporterGroup.mood` skrivs av processNarrative + annandagskonsekvenser + medlemstillväxt-loopen. TRION ÄR REN på båda sidor — misstanke §1A AVSKRIVEN.

**NAVMÄTAR-INSIKTEN:** communityStanding är spelets nav: kommunbidrag ← cs² · patron-emergence ← era+cs-tröskel · kontextuella sponsorer ← cs>70 · era ← cs+resultat — och cs självläker/självsjunker mot 60. Orten-systemen är på riktigt sammankopplade. Prövningens stödmätare (start ur klackMood+puls) landar i ett LEVANDE system.

**KARTFYND 3 — SLUTGILTIGT PRECISERAT:** roundProcessor IMPLEMENTERAR notisdieten (A1 inga egna resultatnotiser, A3 max ett pressklipp/omg, A4 id-dedup, gallring läst 2/oläst 4 omg med skyddade typer, B3 max 2 atmosfäriska nya/omg, B4 globalt max 5 låg-prio i kö med spill-to-inbox, B5 resolved-rensning) — events-kanalen ÄR throttlad. Det som bypassar är exakt interruptClassifier-listan: EN omgång kan sätta pendingPressConference + pendingRefereeMeeting + pendingCSPress + pendingScene + pendingWeeklyDecision + pendingAnnandagsVal + 2 events = 7 avbrott, var och en legitim, summan obudgeterad. Våg 2-uppgiften står: omgångsbudget över kanalerna.

**Övrigt ur läsningen:** weekly-decision genereras EFTER budgetkoll mot nya events (konservativt ✓) · averageAttendance = rullande 0.7/0.3, bara hemmamatcher (prövningens krav-2-mätare lever ✓) · chemistryStats SKRIVS här (90 min/startpar) — läsaren fortfarande okänd, grep-frågan står · väder för NÄSTA omgång pre-genereras i slutet → EkonomiTab-prognosen i väderloop-ordern har data ✓ · era-shift ger Moments, patron-cooldown 2 säsonger ✓.

**TEXTFYND till Code-listan (services-strängar, grep-klassen):** (1) STAVFEL "Landslagsspelarena är tillbaka" → "Landslagsspelarna" (landslagsretur-inbox) · (2) inbox-titlar med emoji STRIDER mot inkorg-recutens kanon: "📬 Uppföljning", "🚨 {sponsor}"-titlarna ×3, "📈/📉 {namn} — marknadsvärde" → emojifria titlar (severity-dots bär signalen).

## §8c DEL 2d — seasonEndProcessor KOMPLETT LÄST (62 KB, 2026-06-12 sen kväll)

**Säsongsslutets ordning:** styrelsebetyg 1–5 → licenscheck → youth intake ALLA klubbar → prispengar [200→15 tkr] + **transferBudget = 15 % av kassan (sätts om varje säsong — kassan ÄR transferutrymmet)** → patron-bidrag → dynamiskt kommunbidrag → budgetPriority-effekter → pension/legender/moralhit → kontraktsutgång → boardPatience → kommunval → grävande/räddande artikel → handlingsplan → Bandygalan → funktionärsdöd → AI-transfers → replenishment → records/signatur/arkivering.

**LEVANDE LOOPAR VERIFIERADE:** (a) **Legend-loopen är SLUTEN:** pension → legendkriterier (≥100 matcher / veteran 3+ / ledare 2+ / 4+ säsonger) → ceremoni-event med val (ungdomstränare/scout/farväl) → legendRole → weeklyLegendCost i economyService + löpande effekter. Förebildlig kedja. (b) **Patronens inflytande växer obönhörligt** (+5/säsong, krav-event vid ≥80): gratis pengar blir dyrare med tiden — och prövningens patron-borgen möter samma eskalering, konsistent. (c) Pensionens moralhit skalas på DELADE SÄSONGER (kapten upp till −15 på lagkamrater) + kaptensvakuum — avsked känns i truppen. (d) A5-arkiveringen implementerad ✓ (notisdietens säsongsdel verifierad i kod). (e) boardPatience-mekaniken: topp2 +20 / topp3 +15 / botten3 −20 + failures, objectives ±, avsked vid ≤15 eller 3 raka — utvärderad EFTER objectives (rätt ordning).

**KARTFYND 5 — ÅTGÄRDAT (Jacobs dom: rubriken står, respiten förklaras).** Ny body skriven av Opus direkt i seasonEndProcessor: "Licensnämnden beslutar om nedflyttning för {klubb}. Efter överläggning beviljas respit — klubben får spela kvar, mot hårda villkor..." Rubriken är nu SANN: beslutet finns, respiten är mekaniken.

**KARTFYND 6 — ÅTGÄRDAT (Jacobs dom: avsiktligt och fint).** "Orten samlas i sorgen"-designen bekräftad — kodkommentar inskriven av Opus vid funktionärsdödsblocket så intentionen aldrig förväxlas med teckenfel.

**KARTFYND 7 — FREE-AGENT-POOLEN GALLRAS ALDRIG:** transferState.freeAgents ackumulerar varje säsongs utgångna kontrakt utan gallring — över 10 säsonger växer savefilen och poolen fylls av 38-åringar ingen värvar. → Code: gallringsregel (t.ex. bort efter 2 säsonger som fri agent eller vid ålder ≥37), lågprio men år-3-relevant.

**Övrigt:** budgetPriority SKRIVER youthQuality/facilities (§7-misstanke 8 delvis besvarad på skrivsidan; läsaren av club.facilities fortfarande grep-fråga) · replenishment: AI-klubbar fylls till ≥20 med positionsminima GK2/DEF5/HALF2/MID2/FWD4, managed safety-net 14 ✓ · kommunval var 4:e säsong 50 % ny politiker (relation 40) ✓ · **managerFired sätts men avskeds-UPPLEVELSEN är okänd** (pendingScreen blir SeasonSummary — finns en riktig sparken-skärm?) → spåras i Jacobs genomspelning/Fables första-timmen-audit som spelkänsle-punkt.

**TEXTFYND säsongsslut (till Code-listan):** 🎖️-emoji i inbox-titlar ×2 (legend + ceremoni) · ✅/❌ i objectives-titlar → emojifria per inkorg-recuten · "Tack för ditt stöd!" i patron-inbox (F4-ton, gubbarna tackar inte med utropstecken) → "Klubben tackar." eller stryk meningen · 'Fansen: "Tack för allt!"' i legend-inbox → pre-guideline-doft, Opus skriver om vid G-passet · "Relation startar på 40/100." i kommunvals-inbox → SIFFEREXPONERING i brevtext, stryk meningen (mätaren syns i UI).

## §8d DEL 2e — processorsvepet påbörjat (economyProcessor + communityProcessor radlästa, 06-12 natt)

**economyProcessor:** ren dirigent över calcRoundIncome med finanslogg per post · AI-klubbar kör schablon (rep×60 sponsor + rep×600 matchintäkt) · annandags-gratisentrén nollar matchRevenue efter beräkning · socialMedia ger +1 rep var 5:e omgång. VÄDERLOOP-WIRINGEN EXAKT LOKALISERAD — CODE_ORDER_VADERLOOP §1a uppdaterad med färdig kodsnutt och verifierad timing.

**communityProcessor — PULSENS HELA SKRIVLOGIK:** matchresultat (storseger +5 / vinst +2 / förlust −4 / storförlust −6 / derby ±2) + aktivitets-mikrodoser (skolbesök 0.12, pensionärskaffe 0.10, kiosk/bandyplay/bandyskola 0.08...) + frivilliga (0.3/st, cap +1.5) + tabelläge (±0.2/−0.15) + journalistmodifier. Och krönet: **DIMINISHING RETURNS på positiva boostar (>85: ×0.25, >70: ×0.5, >55: ×0.75) medan negativa är OPÅVERKADE** — "lika lätt att falla från 90 som från 50". Tillsammans med mean reversion (3 % mot 60): **pulsen är spelets mest genomarbetade mätare** — asymmetrisk, självreverterande, multikälla. Våg 2-lärdom: RÖR INTE pulsen; frågan är om fanMood håller samma klass (narrativeProcessor avgör).

**Frivillig-delsystemet är levande poesi:** namn-seedad moral (55–80), matchskiften med individuellt brus, **drift mot pulsen** (delsystemet speglar huvudmätaren — frivilliga mår som orten mår), attrition ≤10 med avskedsnotis. ✓

**B1-kollisionen (§4D) konkretiserad:** facilityService.checkProjectCompletion körs här varje omgång → facilitiesBonus → club.facilities. Arvet FacilityTree måste förhålla sig till = facilityService + denna processor + FacilityProject-staten. Pekaren står i CODE_UPPDRAG §6a.

**TEXTFYND (värsta emoji-titel-källan hittills):** 🏛️×3, 👥×2, ⚠️, 🤝, 💰 — åtta inbox-titlar med emoji i communityProcessor → in i samma text-order som §8b/§8c-fynden.

## §8e DEL 2f — narrative/media/event/sponsor-processorerna lästa (06-12 natt, forts.)

**KARTFYND 8 — fanMood ÄR EN SCHABLON BREDVID PULSENS KONSTVERK (stark våg 2-kandidat).** narrativeProcessor: fanMood = ren symmetrisk delta (storseger +8 / vinst +4 / kryss +1 / förlust −4 / storförlust −8), klamras 0–100. INGEN mean reversion, INGEN diminishing returns, INGEN asymmetri — till skillnad från communityStanding. Konsekvens i upplevelsen: (a) fanMood kan PARKERAS på 100 (vinn några matcher, publikhumöret ligger kvar i taket utan underhåll), (b) studsar lika lätt upp som ner oavsett nivå. Två mätare sida vid sida i UI på helt olika kvalitetsnivåer. → VÅG 2: ge fanMood pulsens behandling (mean reversion mot ~50, diminishing returns nära taket). Liten ändring, stor känslo-effekt — gör mätarna till syskon. Jacobs beslut.

**KARTFYND 9 — LAGER 2-TEXTERNA BOR INLINE I eventProcessor (arkitektur/skrivguide-risk).** WAGE_OVERRUN_WARNING/DEDUCTION, RISKY_SPONSOR_OFFERS (4 st), MECENAT_WITHDRAWAL_TEXT — stora copy-block ligger som konstanter i processorn, inte i src/domain/data/. Två problem: (1) textauditen missade dem (letade i data/, inte i processors/) — de är O-auditerade; (2) framtida copy-ändringar måste hitta dem här. → VÅG 2 lågprio: flytta till data/. KORTSIKTIGT: textauditens grep-svep MÅSTE täcka processors/ (lades bara på data/ + services/). MECENAT_WITHDRAWAL-texterna är förövrigt STARKA (kontrollfreak/filantrop/nostalgiker, 3 röster) — men O-auditerade mot guiden.

**Cooldown-kartläggning (kartfråga E, komplett):** rumors 3 omg + budget-gate · events 2 omg + budget-gate · mecenat-middag omg 20 + source-cooldown + budget-gate · risky sponsor omg 8/16 (40 %) · reputation-milstolpar från liga-omg 8 · deadline-events omg 13–15. Budget-gaten (canAddDecision) ÄR konsekvent anropad av media+event — bekräftar kartfynd 3: de SOM går via canAddDecision är disciplinerade; problemet är kanalerna som INTE går via den (scen/press/domare/pension).

**sponsorProcessor:** kontraktsnedräkning + utgångskedja (30 % att granne tappar 20 %) + licensvarning skrämmer sponsor (20 %) + nudge-systemet (kiosk/sociala medier/lotteri/träning/bandyskola/sponsor/moral). Rent. Patron-invite vid influence 30–60 ✓.

**TEXTFYND §8e (till Code text-order):** 📋 ×2 (mecenat-påminnelse, sponsor-avslut) · ⚠️ ×2 (ekonomisk varning, lönevarning) · 🚨 (poängavdrag) · 🔥/⚠️ redan fixade i narrativeProcessor av Opus · RISKY_SPONSOR "⚠️ Risk:"-prefixen är INNEHÅLL (val-subtitle, ej titel) — behåll. Övriga emoji-titlar → emojifria.

## §8f DEL 2g — match/spelar/stats-klustret läst (06-12 natt, forts.)

**KARTFYND 10 — `Math.random()` I SIMULERINGEN BRYTER DETERMINISMEN (allvarligt — ej kosmetiskt).** Tre ställen anropar global `Math.random()` istället för den seedade `localRand`/`mulberry32`: (1) playerStateProcessor matchstraff-rullningen (`Math.random() < 0.02`), (2) statsProcessor fläckspelarnas minuter (`Math.floor(Math.random()*11)`), (3) statsProcessor bänk-bandybyten-minuter. Hela motorn är annars seedad (fixtureSeed-lärdomen, A1) för reproducerbarhet — dessa tre gör save-laddning/replay icke-deterministisk: ladda samma save, spela samma omgång, få olika avstängningar/speltid. → CODE: byt till seedad rand (localRand finns i playerStateProcessor; statsProcessor behöver en seed-param via signaturen — nextRound+playerId som mulberry32-seed). HÖGRE PRIO än textfynden — det är samma determinism-kontrakt som A1 etablerade.

**KARTFYND 11 — hemmaf@rdel-magnituden är en dold spak (design, ej bugg).** matchSimProcessor: `baseAdv = hasIndoorArena ? 0.19*0.85 : 0.19` — **hall SÄNKER hemmafördelen 15 %.** Avsiktligt och tematiskt rimligt (utomhusvallen i snö är ett värre ställe att gästa än en neutral hall) — och det är en TREDJE Själ-kostnad för hallen utöver atmosfär-språket och väder-publiken: byt komfort mot bortalagens obehag. communityStanding-bonusen på hemmafördel (±0.02 vid cs 0–100) är EN ÄKTA cs-konsument till (navmätaren igen). Värt en kodkommentar så hall-rabatten inte "städas bort" av misstag.

**chemistryStats-LÄSAREN HITTAD (§7-misstanke 4 BESVARAD):** calculateLineupChemistry läser game.chemistryStats i matchSimProcessor → homeChemistry/awayChemistry till simulateMatch. Så paret-minne-systemet ÄR kopplat: spelade-minuter-tillsammans (skrivs i roundProcessor) påverkar matchresultatet. Levande loop ✓. Avskriver misstanke 4.

**Övrigt:** AI-lineup fitness-golv 40 (byter bara ut genuint utmattade, ingen proaktiv rotation — medvetet) · regenspelare "Regen Spelare" som nödlösning vid <11 tillgängliga (syns det någonsin i UI? → genomspelnings-flagga) · utvisning = 10 min på isen, INTE avstängning (korrekt bandy-modell, fin kodkommentar) · matchstraff ~2 % → 1 match · moral routas via form-kanalen ±1/omg endast utanför 30–80-zonen (undviker brus, smart) · kaptenens moralkris <40 → −5 på hela truppen · A-lagsdebut bara för promotedFromAcademy (undviker 11 falska premiärdebuter — exakt den sortens detalj som skiljer ett genomarbetat spel).

**TEXTFYND §8f:** inga emoji-titlar (rent kluster) · "Regen Spelare"-namnet skulle exponeras som spelarnamn om en nödlineup någonsin renderas — lågprio, men ge dem ortsnamn ur PLAYER_LAST_NAMES istället för att skylta "Regen" om det kan synas.

## §8g DEL 2h — SLUTSVEP: training/transfer/youth/scout/cup/playoff/preRound/postRound (06-12 natt) — APPLICATION-LAGRET KOMPLETT

**KARTFYND 10 UTVIDGAT — `Math.random()` ÄR ETT MÖNSTER, INTE TRE MISSAR.** Två till hittade: transferProcessor C-T9 rivalförsäljnings-text (`Math.floor(Math.random()*...)`) och statsProcessor bänkminuter (redan räknad). Totalt FEM osådda `Math.random()` i hot path: playerState matchstraff, stats fläck/bänk ×2, transfer rivaltext. → CODE-ORDER (egen commit, högprio): grep `Math.random()` i hela `src/application/` OCH `src/domain/services/` — byt ALLA i simuleringskedjan mot seedad rand. Determinism-kontraktet (A1/fixtureSeed) ska gälla utan undantag. Detta är en kvalitetsregel värd en LESSON: "ingen Math.random() i game-logik, bara i UI/kosmetik".

**KARTFYND 12 — PLAYOFF-DIAGNOSTIKEN LOGGAR I PROD-NÄRA LÄGE.** playoffProcessor har två `console.log`-block bakom `process.env.NODE_ENV !== 'production'` — ofarligt men skvalpar i konsolen för alla icke-prod-builds (inkl. Jacobs lokala speltester). preRoundContext har likadant (`typeof window !== 'undefined'` → loggar ALLTID i browser, även prod!). → CODE lågprio: ta bort eller gate bakom en DEBUG-flagga. preRound-loggen är den som faktiskt läcker till prod.

**ONBOARDING-SPÅRET HITTAT (relevant för Fable-fönstrets första-timmen-audit):** postRoundFlags räknar `onboardingStep` 0→4 över de tre första managed-matcherna. Så spelet HAR ett onboarding-stegsystem — Design-Fable bör veta att det finns när första-timmen granskas (vad triggar stegen visuellt? kollas i presentation-passet). Avskeds-UPPLEVELSEN (kartfynd ur seasonEnd) är däremot fortfarande oklar: postRoundFlags sätter `managerFired=true` vid game-over-ekonomi men ingen sparken-skärm syns i logiken — presentation/genomspelnings-fråga kvarstår.

**LEVANDE LOOPAR — transfer/youth-kedjorna är förebildliga:** nemesis→värvad-spelare ger Moment ("i rätt färger nu") · mecenat-kostnadsdelning 20 % vid försäljning · stjärnförsäljning sänker sponsorhumör · klackfavorit-försäljning −5 · lån→CA-boost × deltagandegrad · breakthrough-event (ung debutant gör mål → akademitränaren ringer). youthProcessor: P19 spelar varannan omgång, mentorskap, skolkonflikt, juniorlandslag. Allt sammankopplat. ✓

**TEXTFYND §8g (till Code text-order):** 🏆 (cup-direktkval, cupvinnare) · 📁 (P19-rapport, formationsrek) · 📰×2 (transfer-saga, rykten) · 🚨/⚠️ (postRound finansvarning) · ⭐ (scoutnote i P19-body — INNEHÅLL, behåll) · youthProcessor val-subtitles 📚/🏆/⚠️ (INNEHÅLL, behåll). Titel-emojis → emojifria; subtitle/body-emojis bedöms separat per emoji-domslutet.

## §8h DEL 2i — service-urval (06-12, genomlysningens sista läspass)

**Metod:** ~120 services (ej ~55 — undervärderat). Urval för DEL 3-relevans istället för radläsning av alla — lövens risk fångas av grep, inte ögon. Lästa: politician/clubEra/contextualSponsor/marketValue (de som stänger öppna misstankar + bär navlogik).

**MISSTANKE 3 BESVARAD — politikerns extra-mätare LEVER (delvis):** `generosity` LÄSES (kommunbidrag-formeln: base×generosityMod×communityMod). `agenda` LÄSES (agendaBonus: youth+bandyplay 20k, infrastructure+facilities>60 15k, prestige+rep>65 10k — äkta loop). `relationship` LÄSES (relBonus + milstolpar). MEN `corruption`, `oppositionStrength`, `popularitet` GENERERAS men LÄSES ALDRIG (grep-bekräftas i §9) — tre döda mätare. → VÅG 2-kandidat (låg): antingen wira (korruption → ej-helt-rent kommunbidrag-event; opposition → kommunval-osäkerhet; popularitet → omvalsodds) eller stryk ur typen. Inte brådskande — men "genererad-ej-läst" är samma döda-flagga-klass som hasArtificialIce.

**KARTFYND 13 — NAVMÄTAR-TESEN BEKRÄFTAD I TRE OBEROENDE SERVICES:** clubEra läser cs (legacy kräver cs≥70, establishment ≥50) · contextualSponsor läser cs (>70 → kommunstöd 80k engång vid omg 5/11/18) · politician läser cs (communityMod i bidraget). Plus de tidigare (kommunbidrag cs², patron-emergence, hemmafördel). **communityStanding driver minst SEX system** och driftar mot 60 — spelets obestridliga nav. Prövningens stödmätare landar mitt i detta nät, bekräftat.

**marketValue:** ren formel (ålderskurva × CA^2.5 × form × kontraktstid × 50k, klamrad 5k–500k). Ingen dölj logik, ingen mätarkonsumtion utöver spelarens egna fält. ✓ Inga fynd.

**clubEra-texterna är guidelinevärdiga:** "Det är inte längre bara bandy. Det är ortens identitet." (legacy) — exakt brukssamhälls-tonen, redan i prosa. Ingen åtgärd.

**TÄCKNINGSSTATUS efter urvalet:** state 100 % · båda hjärtslagen 100 % · 17 processorer 100 % · ~13 services radlästa (kärna + navkonsumenter + öppna misstankar) · övriga ~107 services kontraktstäckta (signatur/retur känd via anrop från processorerna) + grep-täcks. **LÄSDELEN AV GENOMLYSNINGEN ÄR HÄRMED STÄNGD.** Återstår: grep-resultaten (Code), genomspelningen (Jacob), Design-Fable-auditen → sen DEL 3-domarna som korsar alla tre mot kartan.

## §9 Uppdaterat DEL 2a-grep-paket (Code, efter svepet)
Utöver misstankelistan §7: `adjustSupporterMood`-anropare utanför roundProcessor · `club.facilities`-LÄSARE (skrivarna nu kända: budgetPriority + facilityBonusTotal) · `chemistryStats`-läsare · freeAgents-konsumenter (kartfynd 7) · **`corruption`/`oppositionStrength`/`popularitet`-läsare** (misstanke 3: bekräfta att de ALDRIG läses → döda mätare).
**KRITISKT TILLÄGG (kartfynd 9):** textauditens grep-svep MÅSTE köras även mot `src/application/useCases/processors/` — Lager 2-copyn (WAGE_OVERRUN, RISKY_SPONSOR, MECENAT_WITHDRAWAL) ligger inline där och är O-auditerad. Greppa F1–F6 + emoji-titlar + tvåpoäng även i processors/.

## §10 Nästa steg (uppdaterat 06-12 sen natt)
- **Jacobs domar:** — (fynd 5+6 dömda; fynd 8 fanMood-omarbetning väntar på genomspelningsdata; fynd 10 är Code-fix ej dom).
- **Code-ordrar ur kartan (prioriterat):** (1) Math.random()-svepet (kartfynd 10, högprio determinism) · (2) väderloop-wiring · (3) Birger-kanonisering · (4) grep-paket §7+§9 inkl processors/ · (5) playoff/preRound-loggning (kartfynd 12, lågprio) · (6) freeAgent-gallring (kartfynd 7) · textfynden §8b–§8g.
- **Opus nästa pass:** ~55 services på kontraktsnivå (urval för DEL 3-relevans, ej allt radläses) → DEL 3-domarna när grep + genomspelning + Design-Fable-audit landat.
- **TÄCKNINGSSTATUS:** state 100 % · båda hjärtslagen 100 % · **ALLA 17 processorer 100 %** · 9 kärnservices radlästa · text ~95 % (processors/-copyn O-auditerad) · motorn instrumenttäckt · presentation Fable-täckt. KVAR: ~55 services på kontraktsnivå — application-lagret är färdigläst.

— Opus, 2026-06-12
