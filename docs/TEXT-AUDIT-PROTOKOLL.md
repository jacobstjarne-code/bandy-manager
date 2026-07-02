# TEXT-AUDIT — PROTOKOLL (Fable)

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
