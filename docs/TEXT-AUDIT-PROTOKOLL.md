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

### CODE GÖR
- **DOMÄN 2-BUGGAR M17–M25 (2026-07-03, anropskodsverifierade — detaljer
  och rotorsaker i LOGG samma datum):**
  · **M17** coffeeRoomService: soldItem-villkoret inkluderar
    InboxItemType.TransferBidReceived (= inkommande BUD, inget är sålt) →
    säljtexterna ("{name} lämnade", "Pengarna är inne") ljuger. Fix: ta bort
    TransferBidReceived ur villkoret. Bonus: Transfer-storyitemet i
    executeTransfer saknar relatedPlayerId → {name} faller alltid tillbaka
    till "spelaren"; lägg till relatedPlayerId.
  · **M18** grep skapare av InboxItemType.TransferOffer — skapas INTE i
    transferService/aiTransferService/inboxService. TRANSFER_BUY_EXCHANGES
    är då död eller feltriggad; rätt trigger för köptexterna är genomfört
    köp (outgoing TransferBidResult accepted / executeTransfer).
  · **M19** klackEchoService storstad_loss: `|| oppPos <= 2` släpper in
    bruksklubbar i storstadspoolen ("bandyn vi inte har", "pendlade till
    storstan"). Fix: enbart STORSTAD_SHORT_NAMES-medlemskap; verifiera
    samtidigt att SBK/VBK/FBK/HBK matchar worldGenerators shortNames.
  · **M20** stillnessService: (a) matchesContext ignorerar weather-fältet →
    snö-/kyl-/mildbeats visas oavsett faktiskt väder; fix: weather in i
    StillnessContext + matchning. (b) buildStillnessContext producerar
    aldrig 'day_after' → day_after-taggade beats/micro är oåtkomliga
    (byggt-men-osynligt → även BACKLOG-rad); fix: day_after när senaste
    managed fixture spelades föregående matchday.
  · **M21** C-T9-riktningen: executeAcceptedTransfers-momentet triggas på
    outgoing-accepted (= VI KÖPER från rival) men har säljperspektiv
    ("till fiendelaget" + PLAYER_REACTION_RIVAL_SALE, vars docstring säger
    sålt-till-rival). Grep även lastRivalSaleMatchday-settern (gameStore?)
    och verifiera att RIVAL_SALE_KAFFERUM/KLACK bara triggas när VI SÅLT
    till rival — texterna är skrivna för det.
  · **M22** anniversary-konsumenter: (a) ANNIVERSARY_KLACK (flat WON+LOST)
    i matchCore — verifiera outcome-gating; utan den kan "VI MINNS GULDET"
    visas för ett förlorat eko. (b) grep konsumenter av
    pickAnniversaryKafferum/pickAnniversaryKlack/pickAnniversaryMarkCopy +
    att {subject} resolvas (Fables nya pooler förutsätter det). (c)
    verifiera watchOthers-kontexten: lost_to_finalist ⇒ motståndaren står
    i finalen (Fables nya rad hävdar det).
  · **M23 (låg)** EFTERKLANG followUp-echo antar brev, men pendingFollowUps
    innehåller även nemesis_diary — verifiera mappningen. ECONOMIC_SCAR
    natural_recovery-echot antar sponsororsak — verifiera krisorsakerna.
  · **M24 (låg)** coffeeRoomService deadlineRound hårdkodad 13–15 —
    verifiera mot transferWindowService.
  · **M25 (låg)** rep_academy-strängen "LANDSLAGET tittar på oss!" — grep
    reputationMilestone-eventet och verifiera att det faktiskt handlar om
    landslaget, inte förbunds-/scoutuppmärksamhet.
- **SPEC_REGELBOKSANPASSNING_2026-07-03.md — Del 1-3 KLARA (Code), Del 4
  väntar på Fable.** M1 förlängning 20 min (`ad9f97a1`), M15 utvisning 5/10
  diskret (`d7a0315a`), M16 landslagsuttag 0–2 förtjänstmodell (`2ce3b4d0`).
  Kalibrering körd + dokumenterad i respektive commit (OT-proportion,
  utvisningsminuter/match, callup-Monte-Carlo mot worldGenerator-tiers).
  Grep-listor till Fables Del 4 finns i Del 1- och Del 2-commiten.
- Commit domän 1: 73 rättade rader, 18 filer. Commit-order + regressions-
  grep i LOGG 2026-07-02 kväll (utvidga grep med: storknar, prickern,
  talent, underbara scener).
- **M9** grep imports av injuryDoctorText — nås DIAGNOSIS_LINES för
  träningsskador? ("andra halvlek"-raden får bara visas för matchskador.)
- Stilnoter: seasonChampionYear()-helpern i seasonSummaryService (inline
  +1) · enum-jämförelse i attendance-isSnow (kodlukt, ej bugg).

### FABLE GÖR (efter Codes Del 1–2)
- **Del 4 i regelboksspecen (Code klar, väntar på detta):** textbyte
  "10 minuter"/"30 minuter"/"120 minuter" mot {minuter}-token resp. nya
  förlängningsrader. Kort riktad session, input = de kuraterade grep-
  listorna i commit `d7a0315a` (M15, inkl. supporterRituals.ts:52 och den
  ej-kopplade context_shorthanded_surviving-poolen) och `ad9f97a1` (M1).

### VILANDE (låg prioritet)
- **M14** "En av de största publiksiffrorna på länge" vid att>5000 —
  väntar på publikhistorik som token.

### NÄSTA AUDIT-PASS
- **Domän 2b** (resten av orten/röster): FÄRSK session. Kvar:
  specialDateStrings (14 KB) + specialDateService · hallProvningData
  (HALL_ATMOSPHERE — läs matchCore-anropet först) · patronData +
  patronEvents/patronTriggers + mecenatService-pooler (31 KB) ·
  politicianData + politicianService/politicianEvents · functionaries +
  functionaryQuoteService · communityNames · localEmployers.
  Inline-pool-kandidater (fillisteläckage): postVictoryNarrativeService
  (pendingVictoryEcho.coffeeLine konsumeras av kafferummet!),
  supporterRituals, klackPresenter, insandareService, rumorService,
  communityProcessor. Sen domän 3 (UI) och 4 (väder/övrigt).
- text-guard-linten byggs av Code EFTER att alla fyra domäners termlista
  är slutjusterad.

### AVGJORT (referens, rör ej)
- **M1/M15/M16 — Codes del KLAR 2026-07-03** (`ad9f97a1`/`d7a0315a`/`2ce3b4d0`).
  Flyttas hit helt (inkl. Del 4-raden i FABLE GÖR ovan) när Fable kört
  textbytet — tills dess står de kvar i CODE GÖR/FABLE GÖR som pekare.
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
