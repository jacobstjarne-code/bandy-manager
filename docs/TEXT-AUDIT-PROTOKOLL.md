# TEXT-AUDIT — PROTOKOLL (Fable)

## ÖPPNA ÄRENDEN — levande tabell (supersede-disciplin)

**Regel:** Detta är ENDA sanningskällan för vad som är öppet. Varje session
som rör textauditen börjar här och slutar här: nya ärenden läggs till,
avgjorda flyttas till AVGJORT med datum. LOGG:en nedan är historik och läses
aldrig för att hitta öppna ärenden. Code: kontrollera din sektion vid varje
text-relaterad commit. Uppdateras tabellen inte är sessionen inte klar.

### JACOB BESLUTAR (motor/design — rekommendation i parentes)
— tomt. M1/M15/M16 beslutade 2026-07-03 → se CODE GÖR.

### JACOB BESLUTAR (smak)
— tomt. M5–M7 godkända av Jacob 2026-07-03: "brottningen", "mittback" och
"tre-fem-tvåa" står kvar som de är. Flaggas inte igen.
- **M59 (låg, 2026-07-04):** arrivalDialogue — tre Sture-repliker daterar
  sig till högvinter (Målilla "minus arton i natt", Lesjöfors "tjugotvå
  minus i natt", Gagnef "Skidföret är bra i år") men ArrivalScene ligger
  vid säsongsstart på hösten. Medveten ortsmytologi ("det orten alltid
  säger om sig själv") eller höstjusteras? Dessutom: Söderfors "Halva ön
  bor över bron" läser paradoxalt (öns folk bor då inte på ön) —
  avsiktlig brukslogik eller ska det vara "Halva publiken bor över bron"?
- **M62 (motor, låg, 2026-07-04):** facilityNodes varmestuga
  capacityBonus 1000 — mer än dubbla östra läktarens 400. Avsiktligt?
- **M33-restfråga (2026-07-03):** V och MP och SD saknar agenda-vikter i
  `PARTY_AGENDA_WEIGHTS` (politicianService.ts + createNewGame.ts) — faller
  till den likformiga default-poolen (alla fem agendor lika sannolika)
  istf en partifärgad vikt som S/M/C/L/KD redan har. Kräver ett smakbeslut
  om vad V/MP/SD ska profileras mot (t.ex. V→inclusion, MP→infrastructure/
  inclusion, SD→prestige/savings) — Code avstod avsiktligt från att gissa
  på politiska stereotyper. Låg prioritet: påverkar bara vilken agenda en
  redan sällsynt förekommande politiker får, ingen bugg.
- **M31-observation (2026-07-03):** 7 av 15 `DAY_JOB_TITLES` (IT-konsult,
  Polis, Säljare, Lastbilsförare, Byggnadsarbetare, Ekonom, Personlig
  tränare) matchar aldrig någon regional arbetsgivares `jobTitles` i den
  omskrivna `localEmployers.ts` → spelare med de yrkena kan aldrig trigga
  coworker-bond eller räknas i varsel-grupperingen. Smakfråga: antingen
  bredda arbetsgivarnas jobTitles med vita-kragen-yrken, eller snäva
  DAY_JOB_TITLES till bruksorts-yrken. Ingen krasch, bara tyst underdäckning.

### CODE GÖR
M17–M53 HELT AVKLARADE 2026-07-04 (M36–M42/M44–M49/M51–M53 denna omgång,
detaljer + utfall i AVGJORT) → se AVGJORT. Kvar: M9 (gammal, ej upptagen
denna omgång) + M54–M58 (domän 3-svansens service-relevansskanning,
tillkom UNDER denna omgångs körning — INTE ännu körda).
- **M54** pressConferenceService: frågepooler saknar kontextgates som
  svarssystemet redan har. Inför valfri gate per fråga (lätt pre-context
  före frågevalet — buildPressContext-fälten finns): (a) 'Ni vände
  underläge till seger' → gate trailedAtHalf; (b) 'Ni kvitterade sent'
  → gate sen kvittering ur events (mål ≥75' som gjorde det lika);
  (c) 'Ni har oavgjort i tre raka' → gate drawStreak ≥3 (streak-loopen
  räknar idag bara W/L); (d) 'Hur var stämningen på {arenaName}' → gate
  isHome (arenaName är ALLTID managed club — frågan ljuger på bortaplan);
  (e) 'Laget spelade bra idag. Vad är skillnaden jämfört med tidigare
  omgångar?' → minRound: 3; (f) follow-up-frågorna (findFollowUpQuestion)
  → gate !won — preferIds kringgår matchesContext i slot 1–3, så en
  follow-up efter SEGER serverar idag förlustsvar ("Vi var inte
  tillräckligt bra idag") som enda alternativ; (g) cl25 playoff_loss
  ("Bäst av fem. Vi kommer tillbaka i nästa.") → exkludera FINALEN
  (isFinal) — finalen är EN match, det finns ingen nästa.
- **M55** mediaService.generateTrendArticles: findIndex ger -1 när ALLA
  fem senaste är W (eller L) → winStreak/lossStreak = -1 och artikeln
  uteblir för just de starkaste sviterna. Fix: -1 → lastResults.length.
- **M56 (låg)** 'Kafeterian' som inbox-titel i generateAbsurdityArticles
  — kafferummet är kanontermen. Grep 'Kafeterian' (scandalService använder
  samma format enligt kommentaren), enhetliggör: EN term, alla ställen.
- **M57** silentMatchReportService: mål efter minut 90 etiketteras 'andra
  halvlek' — lägg förlängningsgren (≤45 första, ≤90 andra, annars
  'förlängningen').
- **M58** opponentManagerService använder Math.random() i BÅDA quote-
  pickarna (generatePreMatch + generatePostMatch) — determinism-brott,
  M35-klassen → seeda med fixtureHash/rand. Samtidigt: verifiera
  hasScandal-semantiken vid anropet — SCANDAL_AFFECTED-texterna antar att
  skandalen berör MOTSTÅNDARLAGET ("mycket runtomkring oss", "läget vi är
  i"); skickas en liga-/egen-klubbskandal in ljuger citaten.
- **M60** tokenverifiering (patron-läckeklassen): (a) FAREWELL_MATCH_STRINGS
  {player}/{members}/{leader} — grep anroparen, substitueras alla tre?
  (b) SEASON_SUMMARY_ELIM_TEXT: pickSeasonElimText returnerar body MED
  {motståndare}/{season} oresolverade — substitutionen MÅSTE ske hos
  anroparen (SeasonSummaryScreen). Verifiera.
- **M61 (VIKTIG)** hallDebateData: verifiera {hallclub}-källan — spelets
  tolv Elitserieklubbar är UTOMHUSKLUBBAR (hallen är drömbyggnation);
  substitueras {hallclub} med en serieklubb ljuger hela nyhetspoolen.
  Ska vara omvärldsklubb (div 1/allsvenskan-klassen, rumorService-
  precedent). Samtidigt: (a) {paper}/{opponent}/{club}/{politiker} — obs
  token heter {politiker} här men {politician} i facilityFinancingStrings,
  döm om det är två källor eller en inkonsistens; (b) OUTDOOR_PRIDE-
  raderna bär resultat-/väder-/publikclaims ('er seger', 'två poäng',
  'storpublik i snöstorm') — verifiera gating; (c) driftsiffrorna
  (3/3,2 Mkr per år, 890 tkr el i januari) ska inte kunna motsägas av
  motorns hall-drift när spelaren själv byggt — synka eller avprecisera
  när hallens driftmodell finns.
- **M9** grep imports av injuryDoctorText — nås DIAGNOSIS_LINES för
  träningsskador? ("andra halvlek"-raden får bara visas för matchskador.)
- Stilnoter (ej rörda denna omgång): seasonChampionYear()-helpern i
  seasonSummaryService (inline +1) · enum-jämförelse i attendance-isSnow
  (kodlukt, ej bugg) · playerNames.ts har dubbletter i båda listorna
  (Lindberg, Berglund, Lundgren, Magnus m.fl. ×2) — ofarligt (bara
  vikter), städa vid tillfälle · pressConferenceService: 🎤 i eventtiteln
  och 😤 i vägra-subtitlen står kvar trots filens egen kommentar "emojis
  replaced with plain text" — hör till Emoji→Lucide-passet (Överlämning
  2), tas där.

### FABLE GÖR (efter Codes Del 1–2)
— tomt. Del 4 KÖRD 2026-07-03 (se LOGG) — M1/M15/M16 helt avslutade.

### VILANDE (låg prioritet)
- **M14** "En av de största publiksiffrorna på länge" vid att>5000 —
  väntar på publikhistorik som token.
- **M50** clubOfferQuotes lore-meriter (Slottsbrons fyra SM-guld t.o.m. 41,
  Skutskärs SM 1959 + dam-SM 2018, Hälleforsnäs SM-semi 70-tal, Västanfors
  guldhylla) — får inte motsägas av spelets meritdata OM en trofé-/
  meritskärm byggs. Aktiveras då.

### NÄSTA AUDIT-PASS
- **DOMÄN 3 HELT KLAR 2026-07-04.** **DOMÄN 4a+4b KLARA 2026-07-04**
  (ceremoni/säsong + facility, se LOGG).
- Kvar: domän 4c–4e i FÄRSK session — scenes/ (10 filer) · anslag/
  (leagueAnslag, playoffAnslag) · media/library/quotes/ (7 JSON).
  Misstankenumrering fortsätter från M63.
- text-guard-linten byggs av Code EFTER att alla fyra domäners termlista
  är slutjusterad.

### AVGJORT (referens, rör ej)
- **M43 AVGJORD 2026-07-04 (Jacob):** kvinnliga tränare JA, lågmält —
  bandyvärlden är konservativ. Fable skrev om managerKaraktarText
  könsneutralt samma dag (10 rader: bio-öppnare, familjerad,
  burnout-helpers, rivalcitat — omskrivning, aldrig hen; "lagkamrater
  förr" → "känner varandra sen spelaråren" eftersom bandy är
  könsuppdelat) och återinsatte Margareta i COACH_FIRST_NAMES (1/12).
  Principen gäller framåt: text om managern skrivs pronomenfri.
  OBS opponentManagerService (oskannad, domän 4-inledningen) ska dömas
  mot samma princip — rivaltränare kan också vara Margareta.
- **M36–M42, M44–M49, M51–M53 HELT AVKLARADE 2026-07-04** (domän 3, Code):
  · **M36** — FIXAD. `pressRefusals` bekräftat kumulativ (nollställs
    aldrig) — texten sa "tre i rad", avpreciserad till "gång på gång".
    BONUS-BUGG: triggervillkoret var `>= 3` (ingen enstaka-gång-spärr) →
    en ny kritisk artikel i inkorgen vid VARJE vägran från och med den
    tredje, oändlig spam. Ändrat till `=== 3` (räknaren ökar bara, så
    detta triggar exakt en gång per spel).
  · **M37** — VERIFIERAD, INGEN BUGG (+ angränsande bugg fixad).
    `CS_PRESS_MEMORY_TEMPLATES`s text renderas aldrig (computed i
    eventResolver.ts, sen `void`:ad — memory-arrayen lagrar bara
    strukturerad data, ingen text). "Coach" var redan bytt till
    "Tränaren". Angränsande fynd: `cs_press_*`-eventnycklarna saknade
    HELT etikett i EVENT_TO_SUMMARY (journalistRelationshipScene.ts) och
    OrtenTab.tsx:s inline-map → föll till råa slugs ("cs_press_individual")
    i "senaste interaktioner"-listan. Fyra etiketter tillagda i båda.
  · **M38** — VERIFIERAD, INGEN BUGG. Enda anropsstället
    (eventResolver.ts:1254-1268) splittar redan `journalist.name` korrekt
    till firstName/lastName innan anrop — ingen naiv anropare existerar.
  · **M39** — FIXAD. "Förra säsongens N:a plats imponerade" gated nu på
    att `boardExpectation !== WinLeague` — en titelförväntad styrelse ska
    inte kalla en 2:a/3:e plats imponerande.
  · **M40** — VERIFIERAD, INGEN BUGG (dödkod, se M42). `BOARD_QUOTES`/
    `BOARD_CONTEXT_QUOTES` (boardData.ts) konsumeras aldrig → kontradiktion-
    scenariot (resultatpositiv rad mot ekonomidoom samtidigt) kan inte
    uppstå.
  · **M41** — VERIFIERAD, INGEN BUGG. "Akademin" är INTE en byggbar B1-
    facility — `youthTeam` genereras ovillkorligt för varje ny klubb
    (createNewGame.ts:381). Ingen existens-gating behövs.
  · **M42 (system)** — LÖST, STÖRRE FYND ÄN ÄRENDET ANTOG. Grep visar
    TRE styrelsemöte-textsystem, inte två: `BOARD_PROFILES` (boardData.ts)
    ÄR live (createNewGame.ts genererar styrelsen ur den), men BÅDA
    filernas citat-/opener-poolar (boardQuotes.ts HELA filen; boardData.ts:s
    BOARD_QUOTES/BOARD_CONTEXT_QUOTES/BOARD_MEETING_OPENERS) har NOLL
    konsumenter. Det faktiskt live mötestext-systemet är en TREDJE fil,
    `boardMeetingCopy.ts`, konsumerad av boardMeetingStateResolver.ts +
    BoardMeetingScene.tsx. Namnkollisionen bekräftad (Lennart Dahlgren +
    Mikael Sandberg i båda döda poolerna). Dödmarkerat med kommentar i
    båda filerna (boardQuotes.ts förbjuder Code att ändra/utöka
    INNEHÅLLET — kommentaren respekterar det). BACKLOG-rad tillagd.
  · **M44** — FIXAD. `{spelare}`s "avgjorde"-rad borttagen ur
    `LINEUP_ROTATION_OUTCOMES.good` — bindningen är till den
    vilade/roterade spelaren, medan good/bad/neutral sätts av lagets
    matchresultat, inte den spelarens faktiska bidrag.
  · **M45** — VERIFIERAD, INGEN BUGG. `LEADERSHIP_OUTCOMES` har noll
    konsumenter (bara `CAPTAIN_OUTCOMES` är wirad i GranskaOversikt.tsx)
    — dubblettrendering kan inte uppstå.
  · **M46** — FIXAD, UTVIDGAD TILL KANONISK HELPER. Ny
    `formatRating`/`formatDecimalComma` i `domain/format.ts` (samma fil
    som formatValue/formatSalary). Applicerad på eventCardInlineStrings.ts
    (ärendets fil) + samma bugg bekräftad och fixad i narrativeService.ts
    (×2), mediaService.ts, bandyGalaService.ts (×2), seasonSummaryService.ts,
    postAdvanceEvents.ts — alla var samma "betyg X.Y i svensk prosa"-fel.
    Lämnade ~20 rena UI-numeriska badges/tabeller (PlayerCard, SquadScreen,
    HistoryScreen m.fl.) ORÖRDA — annan register-fråga (scoreboard-stil vs
    prosa), inte samma bugg, kräver ett separat designbeslut om hela appens
    siffervisning ska vara komma-decimal.
  · **M47** — VERIFIERAD, INGEN BUGG. Triggern är genuint 3 raka förluster
    (`recentResults.slice(0,3).every(loss)`), matchar texten exakt.
  · **M48** — LÖST, STÖRRE FYND ÄN ÄRENDET ANTOG. `Mecenat.demands`
    sätts till `[]` vid skapande och populeras ALDRIG någonstans i src/
    — HELA withdrawal-systemet (påminnelse-notis + de tre rika
    personlighetsgated avskedstexterna kontrollfreak/filantropen/
    nostalgiker) är onåbart, oavsett happiness. Dödmarkerat i
    Mecenat.ts, BACKLOG-rad tillagd.
  · **M49** — FIXAD. Ny `FAMILY_REFUSAL_REQUIRES_OLDER_PLAYER`-lista i
    transferResponseText.ts + åldersfilter i transferProcessor.ts —
    de två barn-specifika family-strängarna ("Pojken börjar gymnasiet",
    "dottern har börjat skolan") filtreras bort när target.age < 28.
    `transferPersonality` bekräftat hash-seedat vid worldGenerator,
    helt ålders-omedvetet.
  · **M51** — VERIFIERAD, INGEN BUGG. Deadline-dag-fragmentet
    (situationFragments.ts) triggar bara på fixture.isWindowDeadlineDay,
    som scheduleGenerator.ts BARA sätter för 31 januari — "stänger för
    säsongen" är korrekt eftersom augusti-fönstret aldrig får denna
    narrativa deadline-behandling.
  · **M52** — VERIFIERAD, INGEN BUGG. `DEADLINE_KAFFERUM_TEXT`
    (gubbnamnen) har noll konsumenter — död kod, ingen kollisionsrisk.
    Det faktiskt live deadline-kafferumsinnehållet
    (`TRANSFER_DEADLINE_EXCHANGES`, coffeeRoomService.ts) använder
    rollnamn (Kassören/Ordföranden/Materialaren), inte personnamn — hela
    felklassen är strukturellt omöjlig där.
  · **M53** — FIXAD. "Två lag åker direkt" i upptaktCopy.ts:s bottenstrid-
    pool motsade BÅDE quoten på samma rad ("slippa kvalet") och alla
    andra bottenstrid/countdown-rader i filen (alla refererar konsekvent
    "kvalet") — samt regelboken (kvalspel mellan seriernas plats,
    ingen automatisk nedflyttning). Rättad till "Två lag möter kvalet."
    `portalEscalationResolver.ts`s `RELEGATION_CUTOFF`-kommentar
    tydliggjord till samma "kval"-ram.
  Verifiering: npx tsc --noEmit, npm run build, npx vitest run efter varje
  ärende — 125 testfiler / 1238 tester gröna genom hela batchen.
- **M1/M15/M16 HELT KLARA 2026-07-03.** Code: `ad9f97a1` (förlängning 20
  min), `d7a0315a` (utvisning 5/10 diskret), `2ce3b4d0` (landslagsuttag 0–2)
  med kalibrering i respektive commit. Fable: Del 4-textbytet kört samma
  dag — {minuter}-token i suspension-/context-/trait-pooler, 20/110-
  siffrorna i OT-/straffpooler, supporterRituals-ropet neutraliserat.
  Code-verifiering KLAR: 300 simulerade matcher i mode 'full' (commentary
  på) — suspension-poolens och context_suspension_*-poolernas {minuter}
  resolvas till 5 eller 10 i varenda live-feed-rad, noll oresolvade tokens.
- **M17–M35 HELT AVKLARADE 2026-07-03** (domän 2a/2b/2c, alla Code-ärenden
  fixade eller verifierade utan bugg — commits `253c0cef`, `f26431f3`,
  `140677ef`, `cb6e6b28`, `857c4c7d`):
  · **M17** (skärpt version, rumorService-kopplingen) — FIXAD. Ny
    `InboxItemType.TransferRumor` skiljer ryktes-inboxitems (rumorService)
    från genomförda affärer; coffeeRoomServices soldItem-villkor förenklat
    till enbart `Transfer`. `executeTransfer`s storyitem fick
    `relatedPlayerId` (löste även den ursprungliga {name}→"spelaren"-buggen).
  · **M18** — FIXAD (som en del av M17-committen). `TransferOffer` skapas
    aldrig; coffeeRoomServices boughtItem-villkor bytt till
    `TransferBidResult` + id-prefix-check istf den döda typen.
  · **M19** — FIXAD. `STORSTAD_SHORT_NAMES` bytt till riktiga klubbar
    (Forsbacka/Västanfors, rep ≥70) istf påhittade förkortningar som
    matchade noll klubbar; `|| oppPos <= 2`-fallbacken borttagen.
  · **M20** — FIXAD. `weather` in i `StillnessContext` + matchning;
    `day_after` produceras nu när senaste managed fixture spelades
    föregående matchday (var tidigare oåtkomlig).
  · **M21** — FIXAD. `rival_sale`-momentet flyttat från outgoing- till
    incoming-guardad loop i `executeAcceptedTransfers` (rätt håll:
    triggas nu bara när VI SÅLT till en rival, inte när vi köpt).
  · **M22** — FIXAD (a, c) + loggad (b). (a) `pickAnniversaryKlack`s
    resultat körs nu genom `fillTemplate` med spelarnamn. (b) död,
    ogated `ANNIVERSARY_KLACK`-export borttagen; `pickAnniversaryKafferum()`
    bekräftad HELT UTAN konsumenter → ny BACKLOG-rad (byggt men osynligt).
    (c) `WatchOthersSecondary` kollar nu specifikt `playoffBracket.final`
    istf "någon kommande omgång" — "{motståndare} står i FINALEN" är nu sant.
  · **M23 (låg)** — VERIFIERAD, INGEN BUGG. Efterklangs followUp läser
    bara `bandyLetters`, aldrig `pendingFollowUps`/nemesis_diary (separat
    kodväg). `natural_recovery` är enda nåbara utfallet för
    `ECONOMIC_SCAR_AFTERMATH` (bara accept_loss-vägen ger det) — texten
    "Sponsorn är borta" stämmer alltid.
  · **M24 (låg)** — FIXAD. Hårdkodad `13-15` ersatt med
    `TRANSFER_DEADLINE_ROUND - 2`…`TRANSFER_DEADLINE_ROUND` (importerad
    konstant, en sanning).
  · **M25 (låg)** — VERIFIERAD, INGEN BUGG. `rep_academy`-milstolpens
    riktiga titel är "P19-landslagstränaren har noterat er" — genuin
    landslagsreferens, ingen förväxling med scout/sponsor-triggers.
  · **M32** — FIXAD. `generateVictoryEcho` tar nu `managedClubId`,
    bygger `{my}-{their}` istf alltid `{home}-{away}` — bortaseger läses
    inte längre som förlust i diary-raderna.
  · **M33** — POLITICIAN_PROFILES var INTE död data (grep hittade två
    konsumenter). Riktig bugg: `generateNewPolitician` (politicianService,
    mandatperiodsbyte) kopplad till POLITICIAN_PROFILES för rikare
    titlar/partier; `createNewGame.ts` lagrade `party` MED parenteser →
    bröt både agenda-viktningen och gav dubbla parenteser i
    scandalService.ts:s `{PARTI}`-mall. Strippat konsekvent. Bonus-fynd:
    `mandatExpires` använde `new Date().getFullYear()` (determinism-brott)
    → `currentSeason + 4`. V/MP/SD saknar fortfarande agenda-vikter —
    smakfråga, ej löst (se JACOB BESLUTAR nedan om det ska tas upp).
  · **M34** — FIXAD. `communityProcessor.ts`s "kr/månad" (kommunbidrag +
    ny mecenat) bytt till "kr/säsong" — matchar den faktiska
    engångsutbetalningen per säsong och `tkr/säsong`-texterna på övriga
    ställen. Sponsors kr/vecka (separat, genuint veckovis system) orört.
  · **M35** — FIXAD. `insandareService.pick()` seedas nu med `fixtureHash`
    istf `Math.random()` — samma fixture ger samma insändartext igen.
  · **Domän 2b/2c-verifieringar (Code, ingen kodändring):**
    M26 FIXAD (isUnderdog relativ mot finalmotståndaren; venueCity
    bekräftad satt för cup-/SM-final) · M27 FIXAD (6 textgrenar i
    matchCore gated på `!hallInomhus` — mål/ambient/miss/isnedbrytning/
    publikannonsering-kyla-snö; is-nedbrytnings-MEKANIKEN, rad ~808,
    lämnad orörd som spelmekanik utanför textaudit-scope) · M28 FIXAD
    (patron_style + mecenat-silentShout-tacticpress gated på att
    activeTactic.mentality inte redan är Offensive) · M29 FIXAD (fem
    subtitle↔effekt-mismatchar synkade) · M30 (låg, smak) FIXAD
    (derby-condition kollar nu `nextManagedFixture` istf senast spelad
    fixture) · M31 VERIFIERAD (clubId-format matchar 12/12 regioner;
    `findEmployerForJob`-undefined redan guardat — ingen krasch; separat
    observation loggad: 7/15 DAY_JOB_TITLES matchar aldrig en regional
    arbetsgivare, smakfråga för Fable/Jacob).
- **M12** comebackKing-triggern (injuryProneness → faktisk skadehistorik
  denna säsong) — KLAR, `baa190f4`.
- M5–M7 godkända av Jacob 2026-07-03 — texterna står. (M7:s picker-
  verifiering utgår; Jacob godkände texten som den är.)
- Register-ruling (2026-07-02): två register är kanon — WRITING_GUIDELINES #10.
- M10 strecket = nedflyttning (2026-07-02): fixat, termlistan uppdaterad.
- M2/M4/M8: bekräftade buggar, fixade (kickoff, frislagsmur, landslags-
  minne). M11/M13: falskpositiver, stängda. Domän 1: KOMPLETT 2026-07-03.

---

**Syfte:** hela spelets svenska textmassa auditerad mot (a) bandyverkligheten,
(b) tonkanon, (c) intern konsistens. Grundregel: bedömning sker ALLTID i kontext.
Regel 6 gäller: varje fynd slutar i vem som gör vad.

**Metod (omdesignad 2026-07-02 efter Jacobs invändning):** ETT systematiskt
läspass, inte grep-plus-läsning. Skälet är empiriskt: av sex buggar i Opus egen
`assistantFFStrings.ts` hade grep bara fångat hälften — "foten", "huvudet",
"springa", "chippade" greppar, men "valde luften", "lyfte in den framför mål",
"lång båge", "full pott" är fotbollsBILDSPRÅK utan fotbollsORD och fångas bara
av läsning med bandyverkligheten i huvudet. Dessutom kräver ton-granskningen
ändå full läsning — separata pass = läsa allt två gånger.

**Grep:s kvarvarande roll är REGRESSIONSVAKT, inte audit:** en banned-terms-lint
(text-guard) inkopplad i build som design-token-vakten. Fångar framtida läckor
för evigt. Byggs av Code EFTER läspassets termlista är slutjusterad.

**Två lärdomar som styr metoden:**
1. Fotbolls-/hockeybilder läcker in via skribentens ryggmärg — Opus
   introducerade "sökte huvudet" och "litade på foten" TIMMAR efter att
   "nickar in"-buggen rättats. Färska ögon + lista, inte känsla.
2. Termkunskap måste regelboksgrundas åt BÅDA hållen: tekning såg ut som
   hockey men är en bandyregelbokterm (SvBF Regel 9, mål kan göras direkt).
3. **Regelboken före webbsök vid termtvekan.** När en sökning kommer
   tillbaka dominerad av fel sport är det inte ett skäl att skriva
   agnostiskt runt frågan — det är signalen att gå direkt på regelbokens
   PDF: `sbf-forening.fra1.digitaloceanspaces.com/uploads/SvBF-Regelbok-2023-2024.pdf`
   (hela texten hämtbar via web_fetch). Minnesregel: i bandy blir man inte
   tacklad mot sargen — man blir tacklad av planen. Faller man, så är det
   isen som tog en. Samma sak med källor: står svaret inte i regelboken
   är det fotbollsinternet som tog sökningen. (2026-07-02, flagg-frågan:
   webbsök gav fyra fotbollsträffar, regelboken gav svaret på en hämtning
   — Regel 10, sträckt arm, ingen flagga.)
4. **Anropskoden före poolen.** Båda missarna i efterkontrollen 2026-07-02
   satt i en pool dömd med färska ögon — men UTAN att anropet var läst
   (ftVars: team = alltid hemmalaget, pool slumpas oavsett resultat).
   Strängar med {team}/{opponent}/{result}/{score} slutdöms först när man
   vet vad tokens FAKTISKT innehåller vid varje trigger. Läsordning per
   pool: anropsplats → tokensemantik → strängar. (M2/M4/fullTime var alla
   samma felklass: rätt svenska, fel verklighet.)

---

## LÄSPASSET — utförande

**Vem:** Fable (chatten), i FÄRSK session per domän — kontextdegradering i
maratonsessioner är bevisad (2026-07-02). **Aldrig** som svans på annan session.

**Per fil:** läs varje pool-rad med tre filter samtidigt:
1. SPORTSPRÅK — termer OCH bildspråk mot termlistan + bandyverkligheten nedan
2. TON — mot kanon: bandysvensk understatement, bruksortsprotokoll,
   personlighetsnycklad röst (Kioskvakten låter som Kioskvakten överallt),
   inga utropsteckenkluster, ingen hype, inga anglicismer, inget
   managementspråk i kafferummet. OBS matchtext: TVÅ REGISTER är kanon
   (WRITING_GUIDELINES #10, Jacobs ruling 2026-07-02) — liga-/slutspels-
   kommentatorn får vara exalterad, cup_*-pooler är Sture. Döm inom
   registret; utrop i ligapool är inte tonbrott, utrop i cuppool är det.
3. KONSISTENS — samma sak heter samma sak (halvlek aldrig period,
   hörna/hörnslag, straff/straffslag, matchdag/omgång)

**Leverans per fil:** RÄTTAT (direkta fel — Fable fixar på plats med
edit_file, sportspråk + uppenbara tonbrott), MISSTANKE (listas till Jacob
med motivering — smakfrågor, gränsfall), GODKÄNT. Allt loggas i LOGG nedan.

**Domänordning (felrisk först):**

**Domän 1 — MATCHTEXT (högst sportspråksrisk):**
data: matchCommentary, matchLiveText, matchLaddningText, matchLaddningGrind,
preMatchContextStrings, roundCharacter, nextMatchPointerText,
anticipationKafferumText (Opus nyskrivna — själv-audit), landslagText,
suspensionText, injuryContextText, injuryDoctorText, injuryStories.
services med speltext: matchCore (commentary-pooler), situationFragments,
deriveEventText, matchUtils (pickGoalCommentary), corner/counter/freeKick/
penalty-interaktionstjänsternas utfallstexter, matchHighlightService,
halfTimeSummaryService, seasonSummaryService.
KLAR: assistantFFStrings (2026-07-02, 6 rättade).

**Domän 2 — ORTEN/RÖSTER:** coffeeRoomService-texter, anniversary×4
(Kafferum/Klack/Mark/MemoryRow), klackEchoText, spectatorMarkText,
spectatorPrimaryText, smallAbsurditiesData, stillnessText, stillnessMicroPool,
efterklangText, watchOthersReflectionText, communityNames, localEmployers,
politicianData, patronData, functionaries.

**Domän 3 — PRESS/STYRELSE/BESLUT:** journalistHeadlineStrings,
csPressEventText, boardData, boardMeetingCopy, boardQuotes, managerKvittoText,
managerKaraktarText, eventCardInlineStrings, eventProcessorStrings,
transferResponseText, clubOfferQuotes, windowDeadlineText, upptaktCopy,
klubbparmContent, tabIntros.

**Domän 4 — CEREMONIER/MINNE/FACILITY/SCENER:** retirementText,
mentorshipStrings, activeArcStrings, seasonEndPhase, seasonPhases,
seasonSummaryElimText, specialDateStrings, facilityDescriptions,
facilityFinancingStrings, facilityNodes, facilityPortalBeats,
hallDebateData, hallProvningData, arrivalDialogue, scenes/, anslag/, media/.

---

## TERMLISTA v2 (regelboksgrundad mot SvBF spelregler, 2026-07-02)

FEL I BANDY — rätta på plats:
- `nick`, `nicka`, `skalle` (spela boll med huvud) — förbjudet i bandy
- `foten`, `sparka`, `volley`, `tåpaj` — bandy spelas med klubba
- `nedsläpp` — hockey (domaren släpper pucken); bandy: avslag (spelstart)
  och tekning (bollen på isen, klubbor parallella)
- `period` (om matchdel) — bandy har HALVLEK, 2×45
- `puck`, `icing` — hockey
- `femma`, `kedja` (byten/formationer) — hockey
- `rink` — hockey (undantag: uttrycklig rinkbandy-kontext)
- `inlägg`, `hörnspark`, `frispark`, `straffspark` — fotboll (bandy:
  hörnslag/hörna, frislag, straffslag/straff)
- luft-inläggsbildspråk på hörna ("lyfte in framför mål", "valde luften",
  "mötte i luften") — bandyhörnan slås ut till skytt vid straffområdeslinjen

MISSTANKAR — döm i kontext, luta konservativt:
- `slagskott` — hockeydoft; bandy: skott/dragskott
- `tackla`, `tackling` — bandy Regel 7 tillåter inte hockeytacklingar
- `powerplay`, `boxplay` — modern jargong men bryter Sture-kanon; hellre
  "numerärt överläge"/"en man kort" (ton, ej regelfel)
- `chippa` — bandy: lyfta (lyftare är äkta bandyterm)
- `springa`, `löpare` (spelare i spel) — man ÅKER på skridskor
- `krysset`? — döm i kontext (målets kryss finns, men hockeydoft i vissa fraser)

ÄKTA BANDY — flagga aldrig:
- `tekning` (Regel 9), `avslag`, `målkast`, `utkast`
- `sarg` (låg sarg längs långsidorna), `hörnrusare` (regelbokterm)
- `mur` (frislag), `lyftare`
- `straffområde` (17 m halvcirkel), `straffpunkt` (12 m storplan)
- `utvisning 5/10 min / matchstraff`, `utvisningsbås`
- `offside` (gäller även fri-/straffslag/tekning/målkast)
- målvakt som `boxar` (målvakten saknar klubba)
- `sudden death`-förlängning 2×10 min + straffar (SvBF Regel 4.4, regelboken
  23/24; äldre serieregel 2020 sa 1×10 — regelboken gäller)
- offside signaleras med domarens STRÄCKTA ARM, aldrig flagga (Regel 10 +
  domartecken; bandydomare bär ingen flagga — "flaggan går upp" är fotboll)
- `bentackling` (officiellt bestraffningstecken), `inslag` (boll över sidlinje,
  officiellt domartecken)
- `strecket` = ENBART nedflyttningslinjen (Jacobs ruling 2026-07-02, M10).
  Slutspelslinjen skrivs alltid ut: "slutspelsstrecket". Ordet strecket
  naket = nedflyttning, alltid.
- `halvtidspaus` (max 20 min), `halvlek`

---

## EFTER LÄSPASSET (Code)

1. **text-guard-lint:** banned-terms-grep (FEL-listans termer, slutjusterad
   efter läspasset) inkopplad i build som ds-guard. Whitelist-mekanism för
   legitima träffar (t.ex. "skalle" som regelbrott MOT spelare).
   Regressionstermer från Del 4 (2026-07-03): `30 minuter` och `120 minuter`
   bannade i matchtext (förlängningen är 20, totalen 110); `10 minuter`/
   `tio minuter` hårdkodat i utvisningskontext (ska vara {minuter}-token).
   Regressionstermer från domän 3 M36–M53 (2026-07-04): `tre presskonferenser
   i rad`/`tre gånger` hårdkodat i notistext bunden till en kumulativ
   (aldrig nollställd) räknare — kräv att räknarens faktiska semantik
   (kumulativ vs konsekutiv) verifieras innan ett hårdkodat tal skrivs in i
   prosan; `.toFixed(1)` utan `.replace('.', ',')` i speltext (prosa-
   sentenser, inte UI-badges/tabeller) — använd `formatRating`/
   `formatDecimalComma` (domain/format.ts); `Två lag åker direkt` (eller
   annan automatisk-nedflyttning-fras) i bandytext — regelboken har kval
   mellan seriernas plats, inte automatisk nedflyttning; barn-specifika
   familjesträngar ("börjar gymnasiet", "börjat skolan") kopplade till en
   hash-seedad, ålders-omedveten personlighetstyp — kräv en ålderskoll vid
   strängvalet, inte bara vid personlighetstilldelningen.
2. Committa rättningar per domän med rotorsak i meddelandet.

## LOGG

- 2026-07-02: Protokoll v1 skrivet (grep-metod). Samma dag omdesignat till
  ett läspass efter Jacobs invändning (grep = omväg + halvblind: fångar ord,
  inte bildspråk). Nedsläpp tillagd på FEL-listan (Jacob). Filinventarium
  inlagt (70+ filer, 4 domäner). Första fynd: `assistantFFStrings.ts`
  6 rader rättade — "sökte huvudet" (nick förbjuden), "litade på foten"
  (klubba!), luft-inlägg på mitthörna ×2, "lång båge", "löparen/springa",
  "chippade". Tekning-falskpositiv undveks tack vare regelboksläsning.
  NÄSTA: Domän 1 (matchtext) i färsk Fable-session.

- 2026-07-02 (kväll): DOMÄN 1a KLAR — all data + interaktionstjänsterna.
  Regelboksverifierat före dömning: (a) förlängning — SvBF Regel 4.4
  (regelboken 23/24, läst i sin helhet samma kväll): sudden death 2×10 min +
  straffar; spelets "30 minuter" icke-sudden matchar INTE regelboken →
  misstanke, ej texrättning. (b) "vända ur" = ÄKTA bandyspråk (Bollnäs-referat:
  "tvingas vända ur mot sargen") — falskpositiv undveken; även "förarsätet"
  och "bryter uppspel" bekräftade äkta i samma källa.

  RÄTTAT (36 rader, 12 filer):
  · matchCommentary (13): "Båda kedjor"→lagen (kedja=hockey) · "i sin zon"→
    "på deras egen halva" (zon=hockey) · "på volley"→"på direkten" (FEL-lista)
    · "springer för livet"→"jagar hemåt" · "nollan hålls" i undertal→"utan att
    släppa in" (L#9: kan vara 3-2) · "Tre raka chanser"→"Chans efter chans"
    (L#9) · "{minute}:e minuten"×2→"Minut {minute}" (ordinalbugg :a/:e) ·
    "bryter mark"→"först på tavlan" · "Klart utskott"→"Marginalen växer"
    (nonsens) · "söker det avgörandet"→"söker avgörandet" · "trängde in"→
    "tryckte in" · klumpig legend_gk_save omskriven.
  · matchLaddningText (2): "Första förlusten på länge"→"Sviten bröts" (L#9:
    vinstsvit bryts även av kryss per roundCharacter) · "från i förra veckan".
  · preMatchContextStrings (1): "Ingen har tagit poäng på deras is i år"→
    "Ingen har vunnit på deras is på länge" (L#9: obesegrad ≠ inga poäng
    avgivna — kryss ger bortalaget poäng; "i år" ogaranterat).
  · nextMatchPointerText (2): "SEX poäng i en match"→FYRA (L#8: sexpoängare
    är 3-poängsfotboll; 2-poängssport = fyrapoängsmatch) · "Året kokar ner
    till den" (anglicism)→"Dit pekar hela december".
  · landslagText (1): "bär sig lite rakare i veckan"→"går lite rakare i ryggen".
  · injuryContextText (1): "Ute resten av hösten"→"Ute en månad eller mer"
    (L#9: 4v-skada i februari ≠ höst).
  · injuryStories (2): "Tacklades mot sargen" (axel ur led) → "Föll i hög fart
    ute vid sargen" — hockeyfysik, bandysargen är 15 cm · "tryck mot sargen"
    (rygg)→"närkamp vid sargen".
  · cornerInteractionService (3): "MÅLLL"→"MÅÅÅL" (konsistens) · "vid nära
    stolpen"→"främre stolpen" (interpolationsgrammatik) · "nytt spelmoment"
    (dev-språk)→"het situation".
  · freeKickInteractionService (4): "rusher möter och sätter in — 1-0!" —
    HÅRDKODAT RESULTAT + engelskt dev-ord i spelartext → "Lyftare över muren
    — en medspelare möter och sätter in!" · "kröker"→"skruvar" · "hörna
    tillkommer"→"det blir hörna" · "en välplacerad avslut tar vägen in"→
    "ett välplacerat avslut letar sig in".
  · counterAttackInteractionService (5): "springer fritt men flaggan går upp"
    → "åker fritt men armen går upp" (springa + FLAGGA ÄR FOTBOLL — Regel 10:
    bandyoffside markeras med domarens sträckta arm, domarna bär ingen
    flagga; verifierat i regelboken efter Jacobs fråga om fotbollskällorna) · "sätter in det"→"den" · "avslut går"→"avslutet" ·
    "passet avbryts"→"passningen … försvaret bryter" · "spelar av"→"spelar
    sig fritt".
  · penaltyInteractionService (2): "Bollen i rakt fram"→"i mitten" (grammatik)
    · "parar"→"parerar".
  · matchHighlightService (2): "{minute}:e minuten"→"Minut X" (ordinal;
    förlängningsminuter 91/92/101 ger :a) · "visste aldrig vad som träffade
    dem" (anglicism)→"hade ingenting att sätta emot".
  · halfTimeSummaryService (2): "målgång sent" — MÅLGÅNG är trav/galopp →
    "avgörandet föll sent" · "bygga vidare" (förbjuden klyscha, Del 3)→
    "Våren får visa vad de är värda".

  GODKÄNT utan anmärkning: matchLiveText, matchLaddningGrind (kod),
  roundCharacter (kod), anticipationKafferumText, suspensionText,
  injuryDoctorText.

  FALSKPOSITIVER undvekna (notera för kommande pass): "vända ur", "portfölj
  på läktaren" (bandyportföljen!), "ligger {pos}:a" (substantivform trea/nia,
  EJ ordinal — :a är rätt för alla tabellpositioner), "springer på bandet"
  (rehab = löpband, inte is), "bentackling" och "inslag" (båda officiella i
  regelbokens teckensektioner — flagga aldrig).

  MISSTANKAR → Jacob (M1–M9, motiveringar i sessionsleveransen 2026-07-02):
  M1 förlängningsformatet (motor+text) · M2 kickoff-poolens "tar emot på
  hemmaplan" (token-semantik) · M3 counter_after_corner_slow enda vi-
  perspektivet · M4 freekick_danger "{team} samlar sig i muren" (perspektiv-
  inversion?) · M5 player_duel "brottningen"/"mittback" · M6 tactical_shift
  "tre-fem-tvåa" · M7 FINAL_LAGPRESENTATION underdog-antagande + "första
  SM-guld på länge" (historik-claim) · M8 FIRST_CALLUP "första klubbspelaren
  på länge" vs trigger "första för spelaren" · M9 DIAGNOSIS_LINES mild antar
  matchskada ("kände det i andra halvlek") — triggas den av träningsskador?

  KVAR I DOMÄN 1 (→ Domän 1c, FÄRSK session): ENDAST matchCore commentary-
  pooler + inline-strängar (109 KB) samt deriveEventText-anropens fallback-
  verb (lever i matchCore/MatchStep-flödet).

- 2026-07-02 (sen kväll): DOMÄN 1b KLAR — situationFragments, deriveEventText,
  matchUtils, seasonSummaryService. (matchCore återstår som 1c, Jacobs
  "kör på" till trots — 109 KB döms inte trött.)

  RÄTTAT (9 rader, 2 filer):
  · situationFragments (6): ordinalSv — tabellposition som ordinal ("ligger
    3:e") → substantivform ("ligger 3:a" = trea; alla 1–12 får :a),
    konsistent med halfTimeSummary · "delar tabellgrannar"→"är tabellgrannar"
    (bruten fras) · "Aldrig avgjort, alltid jämnt" (L#9: bara SENASTE mötet
    känt)→"Delade poäng den gången" · "Inget marginal"→"Ingen" (genus) ·
    cupstake R1 "kvartsfinal — fyra lag kvar" → ÅTTA lag kvar i kvarten;
    räknefel struket · stale placeholder-kommentar i headern uppdaterad.
  · seasonSummaryService (3): LATE_WINNER "på väg mot ett kryss" (L#9: falskt
    när vi redan ledde före sista sena målet, t.ex. 3–2 med mål 82' + reducering
    88')→"Det satt långt inne. {name} fick sista ordet." · "en magnifik
    dubbel!" (superlativförbud)→"dubbeln, inget mindre." · hattrick "går till
    historien" (klyscha)→"Det pratas fortfarande om den kvällen."

  GODKÄNT: deriveEventText (kod; fallback-verb i anropen → 1c),
  matchUtils (kod; straffmodell 5 + sudden death matchar regelboken).

  GRAMMATIKNOT (skydd mot felätt "harmonisering"): ordinal() i numberFormat
  (1:a/2:a/n:e) är KORREKT för "{n}:e plats"-konstruktionen (tredje plats);
  substantivformen {n}:a (trea/nia) gäller "ligger {n}:a". Två olika
  konstruktioner — båda rätt, blanda inte.

  NYA MISSTANKAR:
  M10 [RULED 2026-07-02: nedflyttning äger ordet. Slutspelslinjen skrivs ut
  som "slutspelsstrecket" — fixat i situationFragments, termlistan uppdaterad.]
  M11 narrative: "SM-guldet ${currentSeason + 1}" — är currentSeason ett
  årtal eller ett index? Om index blir det "SM-guldet 2". Code verifierar
  SaveGame.currentSeason-semantiken.
  M12 comebackKing-triggern använder injuryProneness > 0 (EGENSKAP, inte
  historik) — "Trots skadebekymmer kämpade sig tillbaka" kan vara falskt
  för en aldrig-skadad bänkspelare. Code: trigga på faktisk skadehistorik
  denna säsong.

- 2026-07-02 (natt): DOMÄN 1c KLAR — matchCore genomläst i två block med
  överlapp. DOMÄN 1 DÄRMED KOMPLETT.

  BEKRÄFTADE BUGGAR (anropskod läst — misstankar uppgraderade och FIXADE):
  · M2 BEKRÄFTAD: kickoff-poolen anropas med team = ANFALLANDE laget,
    slumpat i steg 0 → "{team} tar emot på hemmaplan" ljög när bortalaget
    attackerade. Fixad: "Bollen är i spel." BONUSBUGG i samma pool:
    "{opponent} inleder matchen" — bakvänt (avslagslaget är {team}) →
    "{team} inleder".
  · M4 BEKRÄFTAD: freekick_danger får team = anfallaren → "{team} samlar
    sig i muren" var perspektivinverterad. Fixad med tokenbyte: {opponent}.
  · M1 PRECISERAD (kodverifierad): motorn ÄR sudden death (mål → return),
    20 steg × 1,5 = 30 min. Enda regelboksavvikelsen är LÄNGDEN (30 vs
    2×10 = 20 min). Fix om Jacob vill: loopgräns 62..~75 + minutmappning +
    overtimeStart "30 minuter"→"20" + penaltyStart "120 minuter"→"110" +
    omkalibrering av otGoalMod (tunad för 20 steg). Code + Jacob-beslut.

  RÄTTAT matchCore.ts (10 inline-strängar):
  · "Foul på X … pekar på PRICKERN" → "Regelbrott mot X … pekar på
    pricken" (engelska + felform) · "OLAGA hindrande" (juridiksvenska) →
    "otillåtet hindrande" · "egenodlad TALENT" → "talang" · "Stämningen är
    ELEKTRISK!" (versalhype) → "Läktaren kokar!" · "säsongens viktigaste
    mål" (L#9: kan vara 5–0 i omgång 3) → "Vilket kvitto!" · "hemkomsten
    kunde inte ha börjat bättre" (L#9: målet kan komma sent på säsongen) →
    "hemkomsten betalar sig" · "Underbara scener" (anglicism, wonderful
    scenes) → "Som sig bör." · "tagit sig till PLANEN" ×2 (publiken är inte
    på planen) → "till matchen" · "Halvchans av X" som MÅL-beskrivning i
    feed → "Mål av X" (konsistens med övriga målevent).
  GODKÄNT i matchCore: PENALTY_CAUSE övriga (straffområde/hakas ner/fälls =
  regelboksäkta), publikpoolen i övrigt ("Lapp på luckan" äkta klassiker,
  "hukar bakom termosarna" kanon), storyline/contextual-målen i övrigt
  (deltidsproffs-raden är kanon), eventbeskrivningar (Omställningsmål äkta).

  NYA MISSTANKAR:
  M13 (Code, ej text): attendance-grenen isSnow jämför
  (weather.condition as string) === 'heavySnow' — verifiera enumvärdet;
  troligen död gren så snösträngen aldrig visas.

  UTANFÖR DOMÄN 1 men konsumeras av matchCore (noteras för rätt domän):
  getConditionLabel/getIceQualityLabel (weatherService → vädertext-passet),
  HALL_ATMOSPHERE (hallProvningData), specialDateStrings, klackEchoText,
  anniversaryKlackText, RIVAL_SALE_KLACK (→ domän 2, orten/röster).

- 2026-07-02 (natt, efterkontroll): STICKPROV ~24 tidigare godkända
  matchtext-strängar, långsam omdömning mot alla tre filter (obs: samma
  session, inte färska ögon — Jacobs order).
  UTFALL: 2 äkta missar + 1 gränsfall. BÅDA äkta satt i fullTime-poolen,
  dömd i 1a när sessionen var FÄRSK — trötthetshypotesen föll, rotorsaken
  var att ftVars-anropet (team = ALLTID hemmalaget, pool slumpas oavsett
  resultat) inte var läst när poolen dömdes. LÄRDOM: pooler med {team}/
  {result} kan inte slutdömas före anropskoden — 1a dömde strängar, 1c
  läste anrop; ordningen ska vara anrop först.
  RÄTTAT (2): "Slutspelat. {team} kan andas ut." (L#9: hemmaförlust 2–7
  → "Villastaden kan andas ut") → struket · "{team} tar med sig {result}
  hem" (hemmalaget tar inget hem från egen is) → "{result} för {team}".
  M14 (låg): "En av de största publiksiffrorna på länge" triggas på
  att>5000 — ljöger för klubbar som alltid drar stort. Tålbart tills
  publikhistorik finns som token.
  BEDÖMNING: matchCore-strängarna (1c, trötta passet) höll i stickprovet;
  ingen full omaudit av 1c behövs. Domän 1 står.

- 2026-07-03 (efter midnatt): MISSTANKE-VERIFIERING (lärdom #4 tillämpad
  på den egna misstankelistan) + en oplanerad fil.

  STÄNGDA SOM FALSKPOSITIVER:
  · M13: WeatherCondition.HeavySnow = 'heavySnow' — attendance-grenens
    strängjämförelse MATCHAR enumvärdet. Grenen lever. (Casten är kodlukt,
    Code får gärna byta till enum-jämförelse, men ingen bugg.)
  · M11: currentSeason ÄR kalenderstartåret (seasonYear.ts, verifierad
    kanon 2026-06-08: 2026 = bandyåret 2026/27, mästare benämns med
    finalåret). "SM-guldet ${currentSeason + 1}" = "SM-guldet 2027" —
    KORREKT. Stilnot till Code: använd seasonChampionYear()-helpern i
    seasonSummaryService i stället för inline +1.

  NY MISSTANKE:
  · M15 (motor+text+regelbok): utvisningstid. Motorn ger 3–6 steg × 1,5 =
    4,5–9 min (enums-kommentaren bekräftar). ALL matchtext säger "10
    minuter" ("10 man i 10 minuter", "får 10 minuter för bentackling").
    Regelboken: 5 eller 10 min + matchstraff. Jacob väljer: (a) motorn
    diskretiseras till 5/10 och texterna står, eller (b) texterna
    neutraliseras ("utvisad", "på botbänken") utan minutangivelse.
    (a) är regelboksvägen och ger dessutom gratis dramaturgi (5 vs 10 =
    lindrig vs grov).

  M9 PRECISERAD: sceneTriggerService har INGEN doktorsscen i prioritets-
  kedjan — injuryDoctorText konsumeras på okänd plats. Code-order: grep
  imports av injuryDoctorText, rapportera om DIAGNOSIS_LINES kan nås för
  icke-matchskador (träningsskador finns — injuryStories har tränings-
  kontexter). "Kände det redan i andra halvlek" får bara visas för
  matchskador.

  OPLANERAD AUDIT: matchInjuryService.ts — stod INTE på domän 1-fillistan
  men är live-feed-matchtext (INJURY_COMMENTARY + INJURY_INBOX_BODY).
  RÄTTAT (3): "STORKNAR av smärtan" (storkna = kvävas) → "Viker sig" ·
  "Han är ung — kroppen läker" (L#9: spelaren kan vara 34) → struket,
  omformulerat · "Gips i TRE veckor" vs weeksOut 2–4 (kunde motsäga
  rubriken i SAMMA brev) → "ett par veckor". GODKÄNT i övrigt — hög
  klass: hälsena som "den stora skadan i bandy" (kanon), galler, flygande
  byten, Linnéstudien-kalibrering. FILLISTE-LÄRDOM: services med inline-
  textpooler fångas inte av fillistans namn — domän 2-passet bör grep:a
  efter strängpooler i services/, inte lita på listan.

  LÄGE: Domän 1 komplett + verifierad. Öppna beställningar till Jacob:
  M1 (förlängning 30→20 min), M15 (utvisningstid 5/10), M5–M7 (smak),
  M12 (comebackKing-logik), M14 (låg). NÄSTA PASS: Domän 2, FÄRSK
  session, börja med anropsplatserna (lärdom #4) och grep efter
  inline-pooler.

- 2026-07-03 (natt, sista svepet): domän 1 TÄTAD — M8 stängd + två
  fillisteläckage kontrollerade.

  M8 BEKRÄFTAD OCH FIXAD: nationalTeamService tar ut 3–5 spelare från
  managed club VARJE säsong — klubben har konstant landslagsfolk, så
  FIRST_CALLUP_MEMORY-strängarnas "första {klubb}-spelaren på mycket
  länge"/"förste på åratal" var absurt falska. Omskrivna spelarcentrerat
  (triggern ÄR spelarens första uttagning): "{spelare}s första landslags-
  uttagning" / "kallades för första gången". BONUS i samma fil: multi-
  notisens hårdkodade "Två från samma bygd" (kan vara 3–5) → "Flera".

  NY MISSTANKE M16 (design, Jacob): nationalTeamService tar ALLTID ut
  3–5 från managed club, oavsett klubbnivå och tabell. En bottenklubb
  med 3–5 landslagsmän varje år underminerar hela "säsongens guldkorn"-
  tonen i landslagText (och gör "det händer inte ofta" osann även efter
  textfixen). Förslag: CALLUP_COUNT viktad mot klubbstyrka/CA-nivå,
  0–2 för bruksklubbar. Motorändring — Jacobs beslut, Codes fix.

  FILLISTELÄCKAGE KONTROLLERADE:
  · lastMinutePressService — ren logik, noll text (knapptexterna bor i
    presentation, domän 3). GODKÄNT (kod).
  · weatherService — getConditionLabel/getIceQualityLabel GODKÄNDA rakt
    av: SMHI-klass svenska (Ymnigt snöfall, Töväder, Godkänd is).

  DOMÄN 1 SLUTSTATUS: 73 rättade rader i 18 filer · 16 misstankar
  processade: 4 bekräftade & fixade (M2, M4, M8 + fullTime-klassen),
  2 falskpositiver stängda (M11, M13), 1 rulad & fixad (M10), 4 motor-/
  designbeslut hos Jacob (M1, M12, M15, M16), 3 smak hos Jacob (M5–M7),
  2 Code-grep (M9, M14) · 4 metodlärdomar inskrivna · 5 falskpositiver
  undvikna via källverifiering.

- 2026-07-03 (dag): DOMÄN 2a KLAR — kafferum/klack/anniversary/stillness/
  spectator/efterklang-klustren. Läsordning per lärdom #4: anropskod före
  pool (transferService, transferProcessor, inboxService, supporterService,
  volunteerService, clubMemoryService + builders, klackEchoService,
  stillnessService, playoffService lästa före dömning). Kvarvarande filer
  → Domän 2b (se NÄSTA AUDIT-PASS).

  RÄTTAT (≈55 rader, 13 filer):
  · coffeeRoomService (7): "Sargen på kortsidan" → "En av sargbitarna"
    (bandysargen löper längs långsidorna) · "lägger på för någon" → "lagt
    bud på någon" · draw-poolens "Kryss igen" → "Kryss." (L#9: första
    krysset) · "{KLUBB} ska skolas av kommunen" → "räddas" (typo; svaret
    om mark att sälja hänger nu ihop) · hårdkodad "Kom igen nu, Sture" →
    ${veteran} (veteranen heter ALDRIG Sture — Sture är leader-pool) ·
    "Det var fin" → "Den var fin" · volunteer-speaker-overriden BORTTAGEN:
    slumpat volontärsnamn fick rollskrivna repliker medan svaret i samma
    sträng behöll rollnamnet (röstbrott); talare = alltid rollen, kommentar
    i koden. Vill Jacob ha volontärer i kafferummet → egen pool (BACKLOG-idé).
  · klackEchoText (17): "rinken" → "planen" · "Två tusen som inte ville se
    andra halvlek" → "Halva läktaren" (kapacitet ≈200–700, två tusen
    omöjligt) · "fika-rummet" → "kafferummet" + "väggar är samma" →
    "desamma" · "storsegern" → "Segern" (top_team_win garanterar ingen
    marginal) · alla precisa veckoräkningar ("Två/Tre veckor sedan X")
    avpreciserade i både bas- och cause-poolen — visningsfönstret (delta
    1–4 omg / decay) garanterar inte antalet och kalenderdatum syns i
    spelet; cause-referensen behållen i varje rad · smågrammatik ("om och
    om igen", "i den här veckan").
  · anniversaryKafferumText (strukturell omskrivning): pickAnniversary-
    Kafferum är nu typ-/subject-medveten — guldspråk enbart sm_final won,
    generisk segerpool för derby/storseger/cup, finalförlustraden enbart
    finaler, "Han som la av" enbart retirement, personpool kräver subject,
    generisk neutralpool för skandal/serieetta. Rotorsak i filkommentar:
    alla won-ekon fick guldspråk, alla neutrala fick pensioneringsspråk
    med {subject} som läckte oresolverad för serieettan.
  · anniversaryKlackText + anniversaryMarkText: ny SEASON_TOP-pool för
    big-neutralt eko UTAN subject (= serieettan, sig 100, enda fallet) —
    tidigare fick mästerskapsekot pensioneringstext med oresolverad
    {subject}-token. WON_MARKS orörda (big+won = enbart sm_final →
    guldspråket är KORREKT där). LOST_MARKS är död pool (inget lost-event
    når sig ≥90) — lämnad, se M22c.
  · anniversaryMemoryRowText: neutral-detail "värt att minnas" (fel för
    skandaleko) → "Samma vecka som detta hände, ett annat år."
  · spectatorMarkText: "Åttondeplats blev åttondeplats" → "Slutspels-
    strecket låg där det låg" (8:an GÅR till slutspel — topp 8 av 12;
    "slutspelsstrecket" utskrivet per M10-rulingen).
  · spectatorPrimaryText (2): "Nu hinns det granska" → "Nu finns tiden att
    granska" · trupp-poolens "Inga skador, ingen kris" → "Slutspelet är
    inte vårt." (L#9: noll skador ej garanterat när fokus väljs).
  · smallAbsurditiesData (3): "Hörndomaren" → "Domaren" (rollen finns inte
    i bandy) · pizza-utbytets "Och dom var i Söderfors?" → "i Gagnef?"
    (bortaresa ≠ hemma i Söderfors) · Vänersborg ×2 → Slottsbron
    (förbjuden riktig klubb i klubbroll).
  · stillnessMicroPool: "runt rinken" → "runt planen".
  · efterklangText: anniversary-echot "Ett år sedan i dag. Samma
    motstånd..." → "Samma vecka, ett annat år..." + "Ni stod här då
    också..." (eko kan vara 1–5 år; motståndaren är inte samma).
  · watchOthersReflectionText: "två matcher från pokalen" → "står i
    finalen" (finalen är EN match på neutral arena; semi bäst-av-5).

  GODKÄNT: ANNIVERSARY_KAFFERUM (4-tuplerna) · RIVAL_SALE_KAFFERUM,
  RIVAL_SALE_KLACK, INCOMING_BID_KAFFERUM (texterna; triggrarna → M21) ·
  stillnessText-beats och stillnessMicroPool i övrigt · spectatorMarkText
  i övrigt · klackEchoService derby-logik · "Åtta lag spelade slutspel"
  (verifierat: topp 8 av 12, playoffService).

  METODNOTIS: workspace-MCP saknar content-grep — anropsverifiering kräver
  riktad filläsning eller Code-grep (därav M17–M25 som grep-ordrar där
  konsumenten inte kunde nås, t.ex. gameStore 45 KB, matchCore 109 KB).
  edit_file är atomisk: en missad oldText rullar tillbaka HELA anropet —
  läs filen omedelbart före redigering.

  LÄGE: Domän 2a komplett. M17–M25 hos Code (grep + logikfixar).
  Jacob-smak öppen: volontärer i kafferummet som egen pool (BACKLOG-idé),
  M22c (död LOST_MARKS-pool). NÄSTA: Domän 2b i FÄRSK session.

- 2026-07-03 (dag, forts): DOMÄN 2b KLAR — specialdatum, hallprovning,
  patron/mecenat, politiker, funktionärer, ortsnamn, arbetsgivare,
  postVictoryNarrative. Körd i samma session på Jacobs order. Kvarvarande
  servicefiler → Domän 2c (se NÄSTA AUDIT-PASS).

  VÄRLDSREGEL FASTSLAGEN (efter självkorrigering): riktiga orter, kommuner,
  tidningar (Gefle Dagblad, Arbetarbladet...), butikskedjor (Ica, Konsum,
  Willys, Pressbyrån) och partier ((S)–(SD) i politicianData) är etablerad
  VARDAGSFÄRG — tillåtna. Förbjudet: riktiga KLUBBAR i klubbroll, och
  riktiga STORBOLAG ägda av fiktiva personer (StoraEnso-mecenaten
  rättades; centerpartiet och ICA-Kungen återställdes efter förhastad
  rättning). Arenalore (Studan/Sävstaås: Hammarby 2010, Zeke 2011,
  Sirius-spöket) är medveten verklighistoria — rörs ej; faktauppgifterna
  källverifierades INTE i detta pass (utanför audit-scope).

  RÄTTAT (≈30 rader, 10 filer):
  · specialDateStrings (10): perspektivfel i delade pooler — PLAYING-rader
    pekade ut {homeClubName} ("är där"/"är här") fast vi kan vara bortalag
    → "vi"; lore-radens "Vi står på samma is" (delas med spectator) →
    neutral · finaldagInbox favoritroll "Inget att förlora?" (inverterad)
    → "Allt att förlora." · "sensommar" i oktober-cupfinal → höst · "Tre
    matcher har lett hit" (byes kan ge färre) → avpreciserad ·
    julgransbarr · bandysanning · grammatik ×2.
  · hallProvningData: GODKÄND RAKT AV — HALL_ATMOSPHERE är toppklass.
  · patronData (3): "kom folk till planen" → "till matcherna" (publiken
    är inte på planen) · TOKENLÄCKOR: {amount} och {rival} i UNHAPPY-
    poolen substitueras ALDRIG av patronEvents → tokenfria omskrivningar
    (Code kan återinföra med interpolation om önskat).
  · patronEvents (4): trunkerad rubrik "om spelets" → "om spelstilen" ·
    "han/hon lämnar" → "han" (alla PATRON_PROFILES är män) · subtitles
    "mecenat-relation" ×2 → "relation" (patron- och mecenatsystemen är
    två SEPARATA system; övriga subtitles säger redan bara relation).
  · mecenatService (7): intro-citatets "— hon/han vill hjälpa till" —
    mecenaten omtalade SIG SJÄLV i tredje person inne i sitt eget citat →
    "jag" · StoraEnso Norra → Norrlandsmassa AB · "bandyhall"-backstory
    motsade hallProvning-premissen → sporthall · "ett arvode" → "ett arv"
    · genusfel miljöpris · vernissage "Min fru målar" (mecenat kan vara
    kvinna; död pool i typmappningen men fällan desarmerad) → "Det målas
    i familjen" · subtitle "+5 happiness" (engelska i UI) → "+5 relation".
    Backstory-poolerna i övrigt: mycket hög klass.
  · politicianEvents: Eva-Britt fick "Han" — bindestrecksnamn saknades i
    FEMALE_FIRST_NAMES (split på mellanslag ger hela namnet) → åtta
    bindestrecksnamn tillagda. Gentjänst-pronomenen visade sig KORREKTA
    (systerdotter/brorson följer politikerns kön → barnpronomenet stämmer
    i båda grenarna) — falskpositiv undviken.
  · functionaries (2): "Är beställt" → "Har beställt" · hårdkodad "Kurt"
    i citat när Kurt finns i samma namePool (Sture-buggens tvilling, 1/8
    risk att tala om sig själv i tredje person) → "Sixten" (utanför alla
    pooler). Kvoterna i övrigt: bland det bästa i spelet — GODKÄNDA.
  · communityNames (3): "Jansen"/"Chransen" (efternamn/nonsens) i
    FÖRNAMNSLISTAN → Sune/Christer · "enöringar" (avskaffade) → enkronor
    · "stekta" → stekte.
  · localEmployers: HELT OMSKRIVEN — regionsnycklarna (sandviken, edsbyn,
    vasteras, sirius, broberg, falun) tillhörde en ÄLDRE klubblista;
    spelets tolv orter träffade aldrig dem så alla spelare jobbade på
    "Lokala bruket". Ny data för spelets tolv regioner, bolagsnamn synkade
    mot mecenatService.REGION_BUSINESSES (patronens bruk = spelarnas
    arbetsgivare), riktiga kommuner i vardagsroll. Verifiering → M31.
  · postVictoryNarrativeService (2): "flaskor i sargarna" → "bakom
    sargen" · ordförande-tempus. Score-perspektivbuggen → M32.

  GODKÄNT: HALL_ATMOSPHERE + hela hallProvningData · STUDAN/SÄVSTAÅS-lore
  · AGENDA_QUOTES + NEWSPAPER_HEADLINES (substitutionskedjan verifierad
  komplett) · FUNCTIONARY-kvoterna · KIOSK/LOTTERY/EVENT_FLAVORS i övrigt
  · mecenat-BACKSTORIES i övrigt · SOCIAL_BODIES (vernissage + segelbåt
  döda i typmappningen, golf filtreras alltid — noterat, ofarligt).

  LÄGE: Domän 2a+2b klara. M17–M32 hos Code. NÄSTA: Domän 2c (liten
  servicerest, samordna supporterRituals med Del 4) som inledning på
  domän 3-sessionen.

- 2026-07-03 (dag, forts 2): DOMÄN 2c KLAR — supporterRituals,
  klackPresenter, insandareService, rumorService, politicianService,
  communityProcessor. DOMÄN 2 DÄRMED KOMPLETT (2a+2b+2c).

  RÄTTAT (≈20 rader, 6 filer):
  · supporterRituals (7): utvisningsropet "Tio minuter — tio minuter!"
    (M15 gör 5/10 diskret → kunde motsäga matchtexten på samma skärm) →
    "Skääms — skääms!" (tidsneutralt äkta läktarrop; supporterRituals-
    raden i Del 4-greplistan är därmed AVKLARAD) · "höjer staven"
    (obegriplig) → armarna · "melodi fyller planen" → vallen ·
    "plankanten" → sargen · family-"säger hon" → han (family-poolen är
    enbart män) · "Okänd sedan förut" (klackens kärngalleri känner
    varandra) → omskriven · grammatik ×2 ("de siste", "klappa de").
  · klackPresenter (8): tre hårdkodade "Elin" i youth-rösten när youth-
    karaktären SJÄLV kan heta Elin → Gunvor (utanför alla pooler) ·
    hårdkodad "Sture" hos veteranen (ledaren kan heta Sture) → Gamle
    Sigge · hårdkodat gruppnamn "Järnkurvan" ×2 när gruppnamnet slumpas
    ur tolv → "Klacken"/interpolerat ${sg.name} · "Målburen behöver
    pinor. Jag har glas kvar hemma" (nonsens/korrupt rad) → koherent
    tyg-till-tifo-rad · "Femtiotre betalande" (motsäger members-siffran
    på SAMMA kort) → avpreciserad · "svart-gul fana" (hårdkodade färger
    vs klubbens) → "stor fana" · "ett nytt koreografi" → en ny.
  · insandareService (5 + signaturblock): SIGNATURES var Gästrike-/
    Hälsingeorter (Järbo, Tierp, Edsbyn...) och visades för ALLA klubbar
    inkl. Skåne → ortsneutrala kvarters-/bygdenamn (Bruket, Kyrkbyn,
    Stationen...) · "målet i 87:e" (målminut ej garanterad) → struken ·
    "Efter tre raka" (margin≥2 garanterar inga tre raka) → omskriven ·
    "i sista svängen" (obegriplig) → längst bort på läktaren · grammatik.
  · rumorService: "Från pressplätten" (plätt = pannkaka) → pressläktaren.
    Div 1/allsvenskan som omvärld GODKÄNT (korrekt seriepyramid under
    spelets Elitserie, kan inte motsägas). VIKTIGAST: rykten skapas som
    InboxItemType.Transfer med relatedPlayerId → förstärker M17, se
    CODE GÖR.
  · politicianService: kampanjlöftet "senast 2028" (spelet kan pågå
    2031) → "inom mandatperioden". POLITICIAN_PROFILES trol. död → M33.
  · communityProcessor: volontäravhoppets "Dåliga resultat på sistone"
    (moralen kan bottna via drift/skandal utan dåliga resultat) →
    orsaksneutral. Notiser i övrigt GODKÄNDA; enhetskaoset kr/månad vs
    tkr/säsong → M34.

  DOMÄN 2 SLUTSTATUS: ~105 rättade rader i 29 filer över tre delpass ·
  19 Code-ärenden (M17–M35) varav tre bekräftade tokenläckor, två
  perspektivinversioner, en död regiondatafil omskriven · återkommande
  felklasser: hårdkodade namn i egna namnpooler (Sture, Kurt, Elin,
  Järnkurvan — fyra fall), publiken-på-planen (två fall efter domän 1),
  subtitle-vs-effekt-lögner i eventkort. Kandidater till text-guard-
  linten utöver termlistan: \{amount\}/\{rival\}-tokens utan substitute-
  anrop, hårdkodade poolnamn i citatsträngar.

- 2026-07-03 (dag, forts 3): DEL 4 KÖRD — M1/M15/M16 helt avslutade.
  matchCommentary.ts: suspension-poolen (3 rader), context_suspension_
  frustration/tactical, traitSuspensions joker/hungrig/veteran (5 rader)
  → {minuter}-token (Del 2:s durationMinutes-plumbing bekräftad i
  getTraitCommentary; no-op-kommentaren uppdaterad). overtimeStart
  omskriven ("20 minuter till — första målet avgör" — sudden death-sant),
  overtimeEnd 30→20, penaltyStart 120→110. context_shorthanded_surviving
  "Tio man i tio minuter" → "Hela utvisningen utan att släppa in"
  (poolen är ej kopplad till minutvärdet — tokenfri är enda säkra).
  supporterRituals-ropet var redan fixat i 2c. Återstående Code-
  verifiering: att {minuter} resolvas i matchCores vars-bygge för
  suspension-/context-poolerna (se AVGJORT-noten). Text-guard-planen
  uppdaterad med regressionstermerna.

- 2026-07-03 (dag, forts 4, Code): M17–M35 KÖRDA I ORDNING, HELA LISTAN
  AVKLARAD. Commits `253c0cef` (M17 rykte-typ/M19/M20/M32/M35), `f26431f3`
  (M18/M21/M22), `140677ef` (M24 + M23/M25 verifierade utan bugg),
  `cb6e6b28` (M26/M27), `857c4c7d` (M28/M29/M30/M31/M33/M34). Se AVGJORT
  ovan för utfall per ärende.

  Två fynd utöver ärendelistan, upptäckta under M33-grävandet: (1)
  `createNewGame.ts`s `generatePolitician` lagrade `profile.party` MED
  parenteser i `party`-fältet — bröt `PARTY_AGENDA_WEIGHTS_CNG`-uppslaget
  tyst (alltid miss → uniform agenda-pool för spelets FÖRSTA politiker,
  aldrig partivägd) och gav dubbla parenteser ("((S))") i
  scandalService.ts:355s `{PARTI}`-mall vid skandaler om den egna
  klubbens politiker. (2) samma funktions `mandatExpires` använde
  `new Date().getFullYear()` — ett determinism-brott (samma seed gav
  olika resultat beroende på det verkliga kalenderåret spelet kördes i,
  samma felklass som M35s insandareService). Båda fixade i `857c4c7d`.

  Build + test genom hela batchen: `npx tsc --noEmit` rent, `npm run
  build` grönt, `npx vitest run` — 125 testfiler / 1238 tester gröna
  efter varje commit.

  LÄGE: TEXT-AUDIT-PROTOKOLL.mds CODE GÖR-sektion är tom (utöver M9 och
  gamla stilnoter, oförändrade sedan tidigare). Två smakfrågor kvar i
  JACOB BESLUTAR (V/MP/SD-agendavikter, DAY_JOB_TITLES-täckning) — ingen
  brådska. NÄSTA: domän 3 (press/styrelse/beslut) när Fable startar en
  färsk session, eller Överlämning 2-arbetet (Emoji→Lucide-pass,
  Valet-scen N-3/N-6/S-1/S-2/A-1) som väntat sedan regelboksspecen och
  M17–M35 kom in.

- 2026-07-03/04 (kväll–natt + förmiddag): DOMÄN 3 DATAFILER KLARA —
  press/styrelse/beslut, hela fillistan. Körd över två sessioner med
  tre MCP-avbrott (edit-timeout → verifiering visade i samtliga fall
  att editen ALDRIG landat → omapplicering i rent läge; arbetssättet
  läs-före-edit + batchade edits höll). Anropskod läst före pool
  genomgående: journalistService, csPressEventService, boardService,
  managerProfileService lästa före sina pooler.

  RÄTTAT (≈105 rader, 16 filer):
  · journalistHeadlineStrings (25) + journalistService (1): systematisk
    L#9-felklass — tidsförloppsclaims som granska-tidslinjen kan motsäga
    ("Sen avgörare", "efter halvtid", "Vände efter tidigt underläge",
    "från start till slut", "redan i första halvlek" m.fl. ×12) →
    förloppsneutrala omskrivningar · tabellclaims ("tabellsvagt
    motstånd", "mot bottenlag") strukna · "Hela arenan reste sig"
    (arenaperspektiv i rubrik) · "Knapp seger" vid marginal 1–3 ·
    sensationalist-WIN-poolen omskriven i sin helhet · "ducker"→"duckar".
    GODKÄNT: "nittio minuter" (2×45 ✓), SENSATION!/KRIS!-prefix
    (kvällstidningsregister per två-register-rulingen).
  · csPressEventText (11): "trepoängaren" ×3 i publicerade citat —
    DUBBELFEL: L#8 (tvåpoängssport) OCH triggern (hållen nolla hemma)
    garanterar ingen vinst alls, 0–0 kvalar → "nollan" · "Tre noll"
    (hårdkodat resultat, Sju–ett-felklassen) · påhittat tränarcitat
    ("Du har sagt förut att...") → "Man brukar säga att..." ·
    vinstantagande + nedflyttningsclaim i friendly-poolen · "{NAME}
    höll noll" när spelaren i 45 % är utespelare → "där bak"-språk ·
    "stänger ned" (anglicism) · "förra mötet"-claim (matchdag 1 säsong 1).
  · boardService (4): titelbugg "Styrelsemöte — Säsongen {club.name}"
    (renderade "Säsongen Forsbacka BK") → "inför säsongen" · "vinna
    ligan"→serien · "Välgjort."→"Det är noterat i protokollet." ·
    "förhandlade om"→"kom överens om". ordinal() för "{n}:e plats"
    verifierad korrekt per grammatiknoten.
  · boardData (11): riktiga klubbar i klubbroll (Sandviken som lag,
    Edsbyns marknadsföring, Västerås analysstab — världsregelbrott) ·
    SPELKLUBB hårdkodad i egen pool ("Forsbacka fick in tre sponsorer"
    — självreferens när managed club ÄR Forsbacka) → grannklubbarna ·
    hårdkodat årtal "Det är 2025" (spelet startar 2026) · "lovat frun"
    (4/8 ordförande är kvinnor) · publiken-på-planen ("Stämningen på
    planen") · "bufféar"→kiosken · två ogatade taktikclaims i generisk
    pool (dubbletter av context-poolens gatade versioner) → neutrala ·
    "Vi har aldrig köpt spelare" (motsägs av spelarens köp) → "Förr
    fostrade vi dem själva".
  · boardMeetingCopy (19): "Bekräfta att SILVRET inte var en
    tillfällighet" — L#9-felexemplets tvilling (B-state = måluppfyllelse
    ≥80 %, inte silver) → fjolåret · "Bygga vidare." (förbjuden klyscha,
    Del 3) → "Nästa varv." · anglicismer "hitta foten"×2/"basics"×2/
    "sikta på månen" · "Förbundskontoret" som klubbstyrelselokal
    (världsfel) → Sparbanken/Biblioteket · "Margaretas mamma" (Margareta
    Ek i egen ordförandepool) → Kassörens · "ler innan hon säger" (4/8
    män) · L#9-claims "Yngste i truppen var bättre än vi trodde" och
    "Vi sålde inte" · "Vi var nära" (kan ha vunnit allt) → "Vi vet var
    ribban ligger" · titel/speaker-eko "Fjolåret sitter i" avdubblat ·
    "Året två"→"År två" · "korkstolar"→stapelstolar · "pausad i prio".
  · boardQuotes: GODKÄNT rakt av (kurerat bibliotek, Sture-kanon;
    Kerstin/Bengtsson-lore = namn utanför pooler, säkra). Systemfråga
    → M42 (dubbla styrelsesystem).
  · managerKaraktarText (8): enhetsfel "{n} OMGÅNGAR kvar på avtalet"
    när servicen stoppar in säsonger (0/1 → "1 omgångar") → tokenfri
    "Sista avtalsåret." (Del 4-principen: tokenfri är enda säkra) ·
    "hallar/hallen" ×2 (bandy utomhus; hallen är drömbyggnation) →
    isar/klubbstugan · h2h-claims i rivalcitat ("Jag brukar inte
    förlora mot honom", "Han har slagit mig fler gånger") när h2h
    trackas från 0-0-0 i samma entitet → claimfria omskrivningar ·
    "ligan"→serien · Margareta ur COACH_FIRST_NAMES (→ Sune; hela
    textmassan maskulin) → M43 designfråga till Jacob.
  · managerKvittoText (7): måltypsclaim ("kontringarna straffade") ·
    timing ("direkt efter pausen", "tom redan tidigt i andra halvlek") ·
    comeback-antagande ("kröp tillbaka in i matchen") · "serien"-språk
    ×3 i slutspelskontext som täcker cupsemi (enmatch — "när serien
    stramades åt" ljuger där; kvittot är dessutom per match, inte per
    matchserie).
  · eventCardInlineStrings (7): "Rating:" (engelska) → "Betyg:" ×6 ·
    "ställde fram klubban i stället" → "ställde klubban i stället".
    Sture-referenserna behållna (fast kafferumsfigur, kanon; playerNames
    verifierad — ingen Sture/Kurt-kollision). Bandypuls = riktig media,
    vardagsfärg ✓.
  · eventProcessorStrings (6): "RF:s licensnämnd" — världsfel,
    elitlicensen är FÖRBUNDETS (SvBF), inte Riksidrottsförbundets →
    "Förbundets licensnämnd" · genusfel ×2 ("säger han" om ordföranden;
    "Han ser äldre ut" om mecenat som kan vara kvinna → "Blicken är
    äldre än vanligt") · "inga references" · "ett tre års marknadsavtal"
    → treårigt · earmark-claim "pengar jag investerat i fastighetssidan"
    → "skjutit till". GODKÄNT: RISKY_SPONSOR_OFFERS-matematiken
    (weeklyIncome × 22 ≈ säsongsbeloppen, alla fyra konsistenta).
  · transferResponseText (4, resten efter 2a): formclaim i homebound-
    acceptans ("formen har vänt nedåt" — form trackas, kan vara på
    topp) · "bytte tröja men inte stad" (rivaler är grannorter, en
    klubb per ort) → "bytte sida" · "vet annorlunda" (anglicism) →
    "vet bättre" · "vinkade från läktaren" åt en buss → "vinkade av
    honom". GODKÄNT: Birgitta-frunamnet (medvetet per filhuvud),
    Lindgren-affären 02 (efternamn återkommer naturligt över decennier
    — lore-precedent), altanen-raden kanon.
  · clubOfferQuotes (5): riktiga klubbar i klubbroll — "Brynäs har
    sitt" → Gävle (ortnivå OK), "Västerås tar våra grabbar och vinner
    SM" (SM:et är SPELETS slutspel, VSK finns inte i det) →
    storklubbarna, "Sandviken vinner oftare" → andra · "Vi har kvalat
    två gånger, inte gått upp" — Söderfors ÄR i Elitserien i spelet →
    "åkt ur två gånger, kommit tillbaka båda" · VM-claimen "avgjordes"
    → "spelades VM-bandy". I ÖVRIGT filens bästa hantverk: verklig
    bandyhistoria per klubb källhållbar (Skutskär 28 848/1959 +
    54-årsrekordet ✓, Slottsbrons fyra guld t.o.m. 41 ✓, Dalälven
    börjar vid Gagnef ✓, Rögle-hockeyövergången självmedveten) → M50.
  · windowDeadlineText (2): "Det ryker om fem affärer och inga av dem"
    → ryktas/ingen · hårdkodad "– Kurt" (Kurt-buggklassen) → Sixten;
    Rolf/Gunnar/Bertil/Göte → M52-grep.
  · upptaktCopy (14): hårdkodat "tre omgångar" i TIO phasemark-varianter
    — upptaktsfasen spänner sista tre omgångarna och phasemarks roterar
    genom hela fasen → ljuger vid N=2/N=1 (countdown-poolen gör rätt
    med {N}) → avnumrerade omskrivningar · "Sex-poängsmatch" →
    Fyrapoängsmatch (L#8, domän 1-fixens tvilling) · "Måste-vinna" →
    Måstematch · tabellclaims "Sex poäng räcker"/"Full pott räcker"/
    "ligger i våra händer" (konkurrentberoende — grannvarianten säger
    själv "våra resultat räcker inte alltid") → claimfria · "Sluta
    starkt sätter tonen" ×2 → "Ett starkt avslut...".
  · klubbparmContent (3): "kommunen som håller HALLEN öppen" i
    Orten-kapitlet — intern motsägelse, Ekonomi-kapitlet i samma fil
    listar hallen som framtida bygge → "plogar parkeringen" · "Västra
    Sidan" hårdkodat klacknamn (supporterService genererar namnet —
    Sture-buggklassen på klacknivå) → "de trognaste" ·
    "överföringssumma" → övergångssumma. Slutspelskapitlet verifierat
    mot playoffService (topp 8, 1v8, bäst av fem, neutral finalplan ✓).
  · tabIntros (1): "lämnar som fria agenter" (NHL-import; grannfliken
    heter redan "Fria") → "lämnar gratis". Motorfakta i övrigt
    verifierade (bud→svar nästa omgång, övergångssumma).

  GODKÄNT UTAN ANMÄRKNING: boardQuotes (text), hallProvnings-klassens
  kvalitet återkommer i clubOfferQuotes och boardQuotes — de kurerade
  biblioteken håller.

  ÅTERKOMMANDE FELKLASSER (domän 3-facit, till text-guard-listan):
  L#9-tidsförloppsclaims i rubrikpooler (största klassen, ~15 fall) ·
  riktiga klubbar i klubbroll (5 fall — Sandviken ×2, Edsbyn, Västerås,
  Brynäs) · hårdkodade namn i egna pooler (Forsbacka, Margareta ×2,
  Kurt, Västra Sidan) · genusfel mot blandade pooler (4 fall) ·
  fotbolls-/NHL-idiom (trepoängaren ×3, Sex-poängsmatch, fria agenter,
  Måste-vinna) · hårdkodade tal som motsäger motorn ("tre omgångar"
  ×10, "Tre noll", "{n} omgångar", "Det är 2025") · hallen-antaganden
  (3 fall — hallen är drömbyggnation, inte nuläge).

  REGRESSIONSGREP-TERMER (till text-guard utöver termlistan):
  "trepoängaren"/"trepoängare" · "Rating:" · "ligan" i speltext ·
  "RF:s licensnämnd" · "Sex-poäng" · "fria agenter" · "basics".

  MISSTANKAR: M36–M53 inlagda i tabellen (M43 design/Jacob, M50
  vilande, M36–M42/M44–M49/M51–M53 Code). Numrering fortsätter från
  M54.

  KVAR I DOMÄN 3: relevansskanning av pressConferenceService,
  mediaService, silentMatchReportService, opponentManagerService
  (inline-pooler) — inledning på domän 4-sessionen. LÄGE: domän 1+2
  kompletta, domän 3 datafiler kompletta. NÄSTA: Code kör M36–M53-
  grep-batchen; Fable kör service-skanning + domän 4 i färsk session.

- 2026-07-04 (kväll): DOMÄN 3-SVANSEN KLAR — service-relevansskanningen
  (pressConferenceService, mediaService, silentMatchReportService,
  opponentManagerService). DOMÄN 3 DÄRMED KOMPLETT. Anropskod läst före
  dömning i alla fyra (buildPressContext/matchesContext/
  buildPressResponses, mediaServices svit-räknare, silent-reportens
  opener-logik, opponentManager-pickarna).

  RÄTTAT (≈33 rader, 4 filer):
  · pressConferenceService (24): "ligan" ×3 i skandalfrågor →
    bandysverige (regressionstermen) · "Tvåsiffrigt idag" (bigWin =
    marginal ≥3, inte tio mål) → "Klar seger" · "Bortalaget" ×2 i
    delade pooler när VI kan vara bortalag (perspektivinversion,
    M4-klassen) → Motståndarna · "körde över er i perioder" (period-
    doft + överdrift vid 1-målsförlust) → "långa stunder av övertag"
    + genusfix "ert försvarsspel" · "Ni avancerar i tabellen" (ogatat)
    → "Två poäng till." · "Ni hamnade efter tidigt" (L#9-tidsförlopp)
    → förloppsneutral · "konverterade" (anglicism) → förvaltade ·
    "Matchen avgjordes av detaljer" (oavgjord match avgörs inte) →
    "Det satt i detaljerna" · "Laget såg trötta ut" → trött ·
    derbyWin "Ni dominerade klart" (ogatat på marginal) → intentfråga ·
    derbyLoss "fullständigt dominerade" → claimfri · TRE OGATADE
    DUBBLETTER STRUKNA ur basfrågepoolerna (mecenat-, ung spelare-,
    publiken sviker-, kommunen-frågorna påstår fakta som bara de
    GATADE override-versionerna kan garantera — fyra rader bort) ·
    follow-up-frågorna ×3: FABRICERADE tränarcitat ("sa du att
    försvaret skulle hålla", "Du lovade vändning", "sa du att truppen
    räcker" — journalist.memory lagrar sentiment, inte innehåll;
    csPress-felklassen) → claimfria omskrivningar mot det minnet
    faktiskt garanterar · storyline-frågans "Nu leder ni serien"
    (ogatat på position) struket · "förra veckan" (kaptensfrågan,
    avpreciseringsklassen) struket · "destiny" → framtid (+ "Ingen
    derby" → Inget) · "extra speech" → "inga extra ord" · "De ska
    göra" (trunkerad) → "De ska njuta" · cl29 "springer i shorts"
    (man ÅKER) → åker ×2 · cl32 "18-åring" (gaten är ≤20) → "ung
    grabb" ×2. GODKÄNT i övrigt: cl-poolens medvetna tränarklyschor
    (register, w_d4 lampshadar själv), "tolfte man" (bandy är 11 mot
    11), riktiga medier som vardagsfärg, "kliniska" (etablerad
    sportsvenska), "cred" (SAOL).
  · mediaService (4): "{n} raka segrar"/"Tredje raka förlusten" —
    räknaren räknar vinster/förluster BLAND de fem senaste, inte
    konsekutivt (W-L-W-W-W gav "4 raka") → "{n} segrar/förluster på
    de fem senaste" (exakt siffra, alltid sann) · "klättrar laget i
    tabellen" (ogatat — falskt för serieledaren) struket · "Styrelsen
    är tyst" (kan motsägas av styrelseevent samma vecka) → "Frågorna
    hopar sig". OBS: toFixed-punktdecimalen i POTM-rubriken visade sig
    REDAN FIXAD på disk (formatRating-helper) — M46-klassen har fått
    central lösning, M46 kan vara överspelad (Code verifierar).
  · silentMatchReportService (3): "tog hem ett tungt nederlag" (man
    tar inte HEM nederlag, särskilt inte på bortaplan) → "Det blev
    {flavor} för X" · fallback "Matchen avgjordes av smådetaljer"
    (visas när events SAKNAS — kan vara 6–1) → "Resultatet säger det
    mesta om kvällen." · "En prestation att bygga vidare på" (Del 3-
    förbjuden klyscha, tredje förekomsten i auditen) → "Det ger råg i
    ryggen inför nästa omgång."
  · opponentManagerService (5): M43-DÖMD — all tränartext verifierad
    PRONOMENFRI (alla citat via mgr.name, "killarna" avser spelarna),
    Margareta inlagd i MANAGER_FIRSTNAMES (1/13, lågmält per M43-
    principen) · "Det underdriver det" (kalkerad anglicism) →
    "Besviken är bara förnamnet." · "Förväntade seger" → Förväntad ·
    "Xg-modellen visade +0.4" (fotbollsjargong + punktdecimal) →
    "Modellen gav oss ett par tiondelar i övertag" (professorial-
    personan behållen) · "Outlier" → "Ett avvikande utfall" ·
    "Märkliga match" → Märklig.

  MISSTANKAR: M54–M58 inlagda i CODE GÖR (frågegates, findIndex −1,
  Kafeterian-termen, förlängningsgrenen, Math.random + hasScandal-
  semantik). MCP-NOTIS: mediaService på disk skilde sig från sessionens
  första läsning (formatRating fanns) — läs-omedelbart-före-edit-regeln
  räddade batchen; en atomisk rollback inträffade och omapplicerades rent.

  LÄGE: domän 1+2+3 KOMPLETTA. NÄSTA: domän 4 enligt fillistan (minus
  hallProvningData + specialDateStrings, dömda i 2b), numrering från M59.

- 2026-07-04 (Code): M36–M42/M44–M49/M51–M53 KÖRDA I ORDNING (M42+M38
  prioriterade enligt Jacobs order), HELA BATCHEN AVKLARAD. Se AVGJORT
  för utfall per ärende. Två fynd var STÖRRE än ärendet beskrev: M42
  (tre styrelsemöte-textsystem, inte två — boardMeetingCopy.ts är den
  faktiskt live, bekräftar Fables oberoende fynd i domän 3-svans-passet
  ovan) och M48 (hela mecenat-withdrawal-systemet dött, inte bara
  triggerräkningen oprecis — Mecenat.demands populeras aldrig). Båda
  dödmarkerade i koden + loggade i BACKLOG.md:s "BYGGT MEN OSYNLIGT"-
  tabell, som därmed är uppe i 6 aktiva rader — över den egna
  ~5-radersgränsen. Föreslår en konsolideringsomgång innan nästa fynd
  läggs till där.

  M46 utvidgades avsiktligt bortom ärendets enda fil: samma
  toFixed(1)-utan-komma-bugg fanns identisk i fem till (narrativeService,
  mediaService, bandyGalaService, seasonSummaryService,
  postAdvanceEvents) — alla i svensk PROSA, samma felklass, mekanisk
  fix. Konsoliderade i en ny kanonisk formatRating/formatDecimalComma i
  domain/format.ts (bekräftat redan på disk av Fables oberoende
  domän-3-svans-läsning av mediaService, se ovan). Rörde INTE de ~20
  rena UI-numeriska badges/tabeller (PlayerCard, SquadScreen,
  HistoryScreen m.fl.) som också har toFixed(1) — annan registerfråga
  (scoreboard-stil), inte samma bugg, kräver separat designbeslut.

  Text-guard-planen uppdaterad med domän 3 M36–M53:s regressionstermer.

  Build+test genom hela batchen: npx tsc --noEmit rent, npm run build
  grönt, npx vitest run — 125 testfiler / 1238 tester gröna efter varje
  ärende.

  LÄGE: M17–M53 helt avklarade. Kvar i CODE GÖR: M9 (gammal) + M54–M58
  (domän 3-svansen, se Fables entry ovan — INTE ännu körda). NÄSTA:
  Code kör M54–M58 när Jacob/Fable ger klartecken; BACKLOG-
  konsolideringen (ovan) kan göras när som helst innan dess.
  Code kör M36–M58-batchen när som helst.

- 2026-07-04 (kväll, forts): DOMÄN 4a+4b KLARA — ceremoni/säsongsklustret
  (retirementText, mentorshipStrings, activeArcStrings, seasonEndPhase,
  seasonPhases, seasonSummaryElimText, arrivalDialogue) + facilityklustret
  (facilityDescriptions, facilityFinancingStrings, facilityNodes,
  facilityPortalBeats, hallDebateData).

  RÄTTAT (≈18 rader, 7 filer):
  · retirementText (3): tre L#9-klackclaims i FAREWELL_MATCH_KLACK —
    "Hela karriären här", "mål mot var och en av de stora", "Vi var där
    när han spelade sin första" — veteranen kan vara nyvärvad och
    målhistoriken är okänd → claimfria omskrivningar i samma ton.
  · mentorshipStrings (1): "för dåligt däckad" (bruten svenska) →
    "har inte formen att föregå med exempel".
  · facilityDescriptions (1) + facilityNodes (1): "Västra Sidan"
    hårdkodat klacknamn ×2 (klubbparm-buggens tvilling — supporterService
    genererar namnet) → "de trognaste".
  · facilityNodes (4 till): "billettintäkt" → biljettintäkt ·
    "Nattträningar" (trippel-t + inkonsistens mot descens "kvällsträning")
    → "Kvällsträning möjlig" · matchhall-konsekvensernas casing
    normaliserad + "åretrunt" → "Bandy året om" · "↑↑ Elitakademi"
    (dubbelsignal, dir bär riktningen) → "Elitakademi".
  · facilityPortalBeats (4): belysnings-beatet öppnade med
    "Strålkastarna" — kolliderar med strålkastare-NODENS beat (två olika
    byggen, samma öppningsord på portalen) → "Ljuset är tänt" · "syns
    från bron" (bron är Söderfors-geografi, klubben kan vara vilken som)
    → "från vägen" · "på riktigt den här gången" (claimar tidigare
    misslyckande) → "på allvar nu" · hårdkodad "Birger" i hall-
    placeholdern (Kurt-buggklassen, ingen sådan pool finns) → "Alla".
  · hallDebateData (2): ekonomens "En hall kostar 120-200 miljoner. Vi
    har 350 000 i kassan" — DUBBELFEL: verklighetsskalans hallpris
    motsäger trädets matchhall (1,8 Mkr) på grannskärmen OCH kassabeloppet
    är hårdkodat (kassan är dynamisk) → sifferfri ekonomrad ·
    modernistens "Tre av fyra semifinallag spelar i hall" — VÄRLDSFEL:
    spelets semifinallag är fyra av de tolv utomhusklubbarna → omskriven
    mot hallklubbarnas träningstider (konsistent med styrelseSplittrad-
    premissen "vi tappar spelare till hallklubbarna").

  GODKÄNT UTAN ANMÄRKNING: facilityFinancingStrings (Fable-skriven med
  L#9-regler i filhuvudet — håller) · seasonSummaryElimText ("Silver.
  Nära. Aldrig nära nog." är kanonklass) · seasonEndPhase/seasonPhases
  (kod; fasnamnen annandagen/vinterkris/våroffensiv är fina) ·
  activeArcStrings (emoji-ikonerna → Lucide-passet) · arrivalDialogue
  i övrigt (STURE_PER_CLUB är toppklass; två smakfrågor → M59) ·
  hallDebateData i övrigt ("Det finns ett ord för bandy inomhus. Det
  heter innebandy." — kanon; Gubbängen-referensen godkänd som
  omvärldsfärg per arenalore-rulingen).

  MISSTANKAR: M59/M62 (Jacob smak/motor, låg) + M60/M61 (Code, M61
  VIKTIG — {hallclub}-semantiken) inlagda i tabellen.

  KVAR I DOMÄN 4 (→ 4c–4e, FÄRSK session per protokollets döms-inte-
  trött-regel): scenes/ (10 filer, 33 KB — valetScene, finalIntroScene,
  boardMeetingScene, journalistRelationshipScene, cupIntroScene,
  sundayTrainingScene, cupFinalVictory/Intro, seasonSignatureReveal,
  smFinalVictoryScene) · anslag/ (leagueAnslag, playoffAnslag —
  cupAnslag är guldstandardreferensen, läses som ton, döms lätt) ·
  media/library/quotes/ (7 JSON, 22 KB — batchskrivna med Jacobs
  feedback, döms mot L#7-processen). Numrering från M63.
