# INVENTERING 2026-08-31 — läst ur källorna, sex parallella svep

**Av:** Code (Sonnet 5). Ersätter `INVENTERING_2026-08-25.md` och `INVENTERING_2026-08-26.md` (båda dödmarkerade, pekar hit).

**Metod:** Jacob bad om en grundlig genomgång av vad som är byggt och inte byggt i alla köer, ordrar och diskussioner. Sex bakgrundsagenter läste ~880 dokument parallellt: en re-verifierade varje rad i de två gamla INVENTERING-filerna mot dagens kod, fyra delade upp `docs/`-roten (232 filer), `docs/sprints/` (135), `design-system/`+`docs/mockups/` (261) och `docs/data/`+`docs/incoming/` (50). Allt kors­verifierat mot `docs/BACKLOG.md`, `docs/KVAR.md`, `docs/SLUTTEST_KO.md`, `git log` och direkt kodgrep — inte mot vad dokumenten själva påstår. `docs/findings/` (364 D-fact-filer) och `docs/kunskapsbas/` uteslöts medvetet: de är referens/kalibrering, inte köer.

**Huvudfynd, i en mening:** projektets egna "enda sanning"-filer (BACKLOG.md, design-system/HANDOFF.md+SYNC.md, flera enskilda DOM-filer) har på flera ställen själva blivit den föråldrade informationen — vilket är precis den risk hela den här övningen fanns till för att fånga.

**En andra, obekväm slutsats om själva metoden:** jag stickprovsprövade sju av agenternas "genuint öppna"-fynd mot faktisk kod innan jag skrev in dem här. Fyra höll INTE — tre för att sanningen redan hade hunnit ändras (två av dem VÄLDIGT nyligen: Jacobs egna parallella textredigeringar under själva svepet), en för att agenten missade en fix från tre veckor tillbaka. Var och en är rättad och märkt "prövad och friad" nedan istället för att tystas bort — men punkterna som INTE hann stickprovas (merparten av §2) är alltså rapporterade, inte dubbelkontrollerade. Läs dem som en stark ledtråd att verifiera, inte som ett kvitto.

Fem saker är redan åtgärdade som en direkt del av den här inventeringen (inte väntan på nästa session): BACKLOG:s stale "203 filer okommitterat"-riskrad korrigerad, BACKLOG:s "TEXT-AUDITEN AKTIV"-sektion (fel i två månader) korrigerad, två DOM-filer som saknade ⛔-supersede-pekare har fått dem, och fyra förlorade Opus-textpooler (`HALL_NEWS_*`, `BOARD_HALL_QUOTES`, raderade av misstag `d0d4d923`) är återställda ordagrant i `hallProvningData.ts` och dödmarkerade på nytt i `BEVARANDELISTA.md`.

---

## §0 — Det allvarligaste fyndet: text raderad i strid med bevaranderegeln

Commit `d0d4d923` (2026-08-17, "radera hallDebateEvents.ts — död kod") tog bort hela `hallDebateData.ts`. Motiveringen gällde bara `HALL_DEBATE_EVENTS` (korrekt superseterad av `PROVNING_*`-poolerna). Men samma fil bar fyra ANDRA, oberoende dömda textpooler — `HALL_NEWS_POSITIVE`, `HALL_NEWS_NEGATIVE`, `HALL_NEWS_OUTDOOR_PRIDE`, `BOARD_HALL_QUOTES` — som `docs/BEVARANDELISTA.md` uttryckligen skyddade med "Ingen rad här raderas" och en öppen fråga från 2026-07-21 om de hade fått en yta att bo på. Den frågan besvarades aldrig innan filen föll med resten. ~43 rader auditerad svensk text försvann ur arbetsträdet i fem dygn utan att någon märkte det.

**Åtgärdat idag:** texten återställd ordagrant ur git-historien (`git show d0d4d923^:src/domain/data/hallDebateData.ts`) till `hallProvningData.ts`, dödmarkerad med samma motivering. **Fortfarande öppet:** frågan från 07-21 är fortfarande obesvarad — har hallprocessens H·1-hubb en debatt-/nyhetsyta som kan bära dem, eller ska exporterna tas bort permanent? Ägare: Opus/Jacob.

---

## §1 — Statusfiler som själva ljuger (korrigera källan, inte bara symptomet)

| Fil | Vad den påstod | Verkligheten | Status |
|---|---|---|---|
| `BACKLOG.md` rad 7 | "RISK — 203 filer okommitterat, HEAD fastfruset på `5c9a7a8b`" | Löst 2026-08-27, samma dag det upptäcktes (SLUTTEST A-COMMIT: 18 logiska block, `5c9a7a8b..594be0f7`). Stod kvar stale i fyra dygn, överst i filen — det första en ny session läser. | **Korrigerad idag** |
| `BACKLOG.md` §A | "TEXT-AUDITEN — AKTIV, domän 2-4 kvar, Code-kö: M9-grep + M17-M25" | `TEXT-AUDIT-PROTOKOLL.md`s egen ÖPPNA ÄRENDEN-tabell: "HELA TEXTAUDITEN + HELA ÄRENDEKÖN KOMPLETT 2026-07-05 … Kön är tom." Nästan två månader fel. | **Korrigerad idag** |
| `DOM_FRAMGANGSEKONOMIN_2026-08-17.md` | (ingen supersede-markering) | Ersatt av `DOM_FRAMGANGSKURVAN_2026-08-27.md` — nästa läsare bygger mot fel ramverk annars. | **⛔-markering tillagd idag** |
| `DOM_AH2B_BUDGETTRYCK_KORORDER_2026-08-28.md` | (ingen supersede-markering) | `DOM_AH2B_RETENTION_2026-08-28.md` (samma dag!) säger ordagrant "den körordern är därmed avslutad" om detta dokument. | **⛔-markering tillagd idag** |
| `SLUTTEST_KO.md:97` | "A-M8 (avsked avslutar karriären) … EJ" | Byggt `e765efd5` (tränarmarknaden, `CareerBreakScreen.tsx` existerar). | **Ej korrigerad — ägare: nästa session** |
| `design-system/HANDOFF.md` (senast ändrad 2026-05-17) | `[ ]`/`⚠` på GameHeader-redesign, PhaseIndicator, Tag-regel, BottomNav-ikoner, emoji-kategorisystem | Alla byggda (Lucide-migrering, severity-dots, handritad SVG-glyf i `GameHeader.tsx`). Den verkliga aktuella kön är `design-system/briefs/DESIGN-KO-2026-07-02.md`, som `HANDOFF.md` aldrig pekar till. | **Ej korrigerad — ägare: Design/Opus** |
| `docs/BANDY_BRAIN_LOSENORDSGRIND.md` | "Config-flippen INTE committad, [Opus]-platshållare" | Motsatt riktning stale: `astro.config.mjs` har redan `site:'https://bandybrain.se'`, svensk text skriven. Enda kvarvarande osäkerhet: Vercel-cutover + miljövariabler, ej verifierbart (Vercel-MCP oautentiserad denna session). | **Ej korrigerad — ägare: nästa session med MCP-åtkomst** |
| `docs/incoming/README.md` (senast ändrad 2026-08-30) | Listar 7 poster i mappen | Mappen har 13+ faktiska poster (utöver `_arkiv`). Sex saknas helt ur tabellen. | **Ej korrigerad — se §6** |
| CLAUDE.md, uppgiftstyp E | Pekar på `docs/THE_BOMB_STATUS_2026-04-26.md` | Filen flyttad till `docs/archive/completed-april/` i `e3062ad6` (2026-05-24). Trasig sökväg i en fil som läses vid sessionsstart. | **Ej korrigerad — ägare: Opus (CLAUDE.md-ägare)** |
| CLAUDE.md, Princip 7:s exempel | `hallProvningData.ts` = "beslutat BEHÅLL dödmarkerad" | Filen har sex levande konsumenter (`HallProvningScreen.tsx` m.fl.) — exemplet i regeln som ska lära nästa läsare skillnaden mellan död kod och text-utan-yta är självt fel. | **Ej korrigerad — ägare: Opus** |
| `docs/STRINGS_POOL_INVENTORY.md` | Genererad 2026-05-08, obligatorisk läsning för skrivsessioner (CLAUDE.md typ C) | Fyra månader gammal. Saknar minst: `hallProvningData.ts`, `seasonDecisionSentences.ts`, `careerBreakText.ts`, kontraktskravens texter. | **Ej korrigerad — ägare: Opus, regenerera** |

---

## §2 — Genuint öppna trådar, otrackade i BACKLOG (de viktigaste fynden)

Dessa har ingen rad i BACKLOG.md eller SLUTTEST_KO.md trots att flera av dem är substantiella, verifierade via grep/kod idag.

### Spelbara buggar

1. **(Prövad och FRIAD vid egen verifiering — inte en öppen bugg.)** En av granskningsagenterna rapporterade att cupens semifinal/final gav fullt hemmaplansövertag trots neutral plan (`matchCore.ts:505`), och att `isNeutralVenue` bara sattes för SM-finalen. Egen kontroll (`cupService.ts:178-190`) visar att detta redan fixades **2026-08-08**, med en kommentar som ordagrant citerar just den sluttest-auditen som sin källa: `isNeutralVenue: true` sätts för `isCupFinalWeekend` (`nextRound >= 3`, dvs semifinal OCH final). Nämns här bara som ett exempel på varför varje agentfynd i den här filen är kontrollerat mot faktisk kod innan det listas som öppet — den här specifika raden höll inte.
2. **(Prövad och FRIAD vid egen verifiering — inte en öppen bugg.)** En agent rapporterade, med källa `INVESTIGATION_MATCH_REVENUE_ECONOMY_2026-08-26.md` (docs/incoming/), att kiosk/lotteri/publikintäkt aldrig skalar med faktisk publik. Egen kontroll (`economyService.ts:589-596`) visar att detta byggdes om REDAN 2026-08-27 — dagen efter utredningen skrevs — under namnet "Åskådarekonomin, kandidat 2": `sqrtAttendance = sqrt(attendanceForCommunity)`, där `attendanceForCommunity` kommer direkt ur matchens faktiska `attendanceRate`. Utredningens fynd var korrekt vid skrivtillfället men överspelat sedan en dag senare. Filen i `docs/incoming/` (se §6) ska alltså arkiveras som stängd, inte tas som ett öppet ärende — tredje exemplet i rad på att varje agentfynd i den här filen är verifierat mot faktisk kod, inte accepterat på tro.
3. **`presentation/components/tactic/FormationView.tsx:90` — en TREDJE "Fyll bästa elvan" som ignorerar konditionsgolvet helt** (egen verifiering: sorterar bara på `currentAbility`, noll referens till `fitness` i filen). DOM_A3 (2026-08-29) krävde att autofyll aldrig tyst startar spelare under golvet 22; fixen landade i `lineupNudge`/`useLineupEditor` (Match/Tillträde), men Taktik-skärmens egen kopia sorterar bara på `currentAbility`, läser aldrig `fitness`. BACKLOG:s rad om "två kopior" är stängd som om problemet var löst — det finns en tredje.
4. **`Sprint 23`s OVERRIDE 1 aldrig byggd:** rekommenderad elva ska frysas när `lineupConfirmedThisRound` är satt. Fältet finns och läses i roundProcessor/NextMatchCard men **aldrig** i FormationView/TacticBoardCard. Samma bugfamilj som fynd 3.
5. **`wasCaptainSeasons` aldrig implementerat som fält** (Sprint 27, DELVIS). Approximeras idag med `trait === 'ledare' && seasonsInClub >= 2` — funkar, men är inte vad specen bad om.

### Text byggd men onåbar (Opus-textgap)

6. **(Prövad och FRIAD — texten är levererad.)** En agent rapporterade att `careerBreakText.ts` (hela O13:s tränarmarknad) hade varje spelarvänd sträng som `'[Opus]'`. Egen kontroll: filen är fullt skriven — `CAREER_BREAK_SEASON_TITLE = 'LAGET SPELADE VIDARE'`, `CAREER_BREAK_NO_CALL_BODY = 'Ingen klubb har en stol åt dig...'` m.fl., noll faktiska platshållarvärden kvar (bara en kommentarsrad som nämner konventionen). Detta hann skrivas av Jacob själv UNDER den här sessionen — filen syntes upprepade gånger som "modifierad" i git status genom hela svepet. Fjärde exemplet i rad på att ett agentfynd inte höll vid egen kontroll — i det här fallet för att verkligheten hann ändras medan agenterna arbetade, inte för att fyndet var felaktigt när det begicks.
7. **(Prövad och FRIAD, samma orsak.)** En agent rapporterade sju `[Opus]`-strängar i `FatigueFloorConfirm.tsx`. Egen kontroll: komponenten är fullt skriven ("Du får inte ihop en elva över golvet. Startar du dem ändå stiger skaderisken...", "UNDER GOLVET" m.fl.) — de två faktiska träffarna på `[Opus]` i filen är kommentarer som förklarar SVENSK TEXT-konventionen, inte kvarvarande platshållare.
8. **`seasonDecisionSentences.ts`** — fyra tomma meningsmallar (HIGH 6, redan i BACKLOG rad 181). Denna verifierade JAG SJÄLV direkt i koden tidigare i den här sessionen (inte agentrapporterad), nämns här bara för fullständighet.

**Läsvarning för hela §2:** fem av de första sju punkterna i den här sektionen hann prövas mot kod av mig personligen efter agentsvepet — två höll (FormationView, seasonDecisionSentences), tre höll INTE (cupens hemmaplan, kiosk/lotteri, careerBreakText+FatigueFloorConfirm). Samtliga tre felaktiga berodde på att sanningen hann ändras — antingen av tidigare commits agenterna missade, eller av Jacobs egna parallella redigeringar under själva svepet. Punkterna 9 till 25 nedan är INTE omprövade på samma sätt av tidsskäl. Behandla dem som "rapporterat, inte dubbelkontrollerat" — verifiera mot faktisk kod innan du agerar på någon av dem, särskilt de som rör filer som varit aktiva under den här sessionen (allt hall-/careerBreak-relaterat).

### Undersökt men aldrig besvarat

9. **Återkopplingsslingan / H4-klippan (cs 70→71) — rotorsak fortfarande okänd efter sju mätningar och sex fixar.** Den tidigare huvudhypotesen (licenseReview-kaskaden) är bevisat FEL — klippan är exakt oförändrad efter att kaskaden togs bort. Enda posten i hela inventeringen där ingen vet vad problemet är.
10. **Sex okontrollerade `*Round`-fält** — begärt i BÅDA de gamla INVENTERING-filerna, aldrig ens rapporterat vilka de är.
11. **H5 renommétaket** — klubbrykte klampar vid 100 (åtta ställen i koden), ingen rapport om vad som händer säsong 5-6. Begärt två gånger.
12. **`DOM_ILLUSTRATIONERNA_2026-08-18` aldrig utförd.** Domen beställde tre NYA bilder (Gemini, ny promptstil, fast seed). Bilderna på disk är oförändrade sedan 5 juni — 2,5 månader FÖRE domen. Skild tråd från den här sessionens `MatchLaddningScene.tsx`-fix (som bara löste hur avsaknad av bild renderas, inte att skaffa bilderna).
13. **`DOM_DELNINGSKORTET`s artefakt 2 och 3 ("Årets match", "Karriären hittills") finns inte.** Domen beställde tre artefakter, en byggdes ("Årets berättelse"), SLUTTEST stängde raden efter bara den ena. "Årets match" blockeras permanent av `matchHighlightService.ts:108` (`shareImageReady: false` hårdkodat) — löst genom att byta knapptext, inte genom att bygga. "Karriären hittills" väntade på O18, som nu är byggt — blockeraren är alltså borta utan att någon märkt det.
14. **Illustrations-beställningarna: `cup` (prio 1 enligt SYNC 2026-08-18), `premiär`, `derby`, `nyår` är fortfarande obeställda konstverk.** Kod-sidan (fallback när bild saknas) fixad i denna session; själva bilderna är Jacobs ägande, oberoende tråd.
15. **`ANALYSSPEC_VAG2_OEXPLOATERAT.md` — fem kvarvarande spår, inga i BACKLOG:** motorkalibreringskandidat ur A5 (väntar Jacob), A4-scriptets commit (väntar Jacob), dam-attendance datatäckning (20,3% mot 50%-krav, blockerar A7), overtime/own_goal-fält vid framtida omscrape, samt mekanismfrågorna bakom Finding 065 (aldrig spawnade som frågor).
16. **`INTERNAL_DATA_NOTES.md`s "Data Foundation Audit" (P0, uppskattad 3-4h)** — fyra datakvalitetsfel från maj-juni, aldrig formellt ärendefört eller avfärdat.
17. **`AUDIT-OPUS-GAMEPLAY-2026-06-24` — fyra obespårade trådar**, den tyngsta obetade posten i design-system/: (a) `advance()` som sidoeffekt i Granskas `useEffect` med en `didAdvance.current`-grind — bräcklig arkitektur; (b) beslut-UI återimplementerat på tre separata ytor utan gemensam modell; (c) ingen navigationsbrygga från GranskaAnalys till Taktik; (d) CTA:er är aldrig villkorade av att spelaren faktiskt fattat ett beslut (anti-autopilot, aldrig byggt).
18. **`DOM_GRANSKA_LARANDEYTA` — bara 1 av 4 "DITT VAL"-kandidater byggd** (hörnstrategi→hörnmål). Tre kvar.
19. **`DOM_D1_EVENTVIKTNING` — batch-av-tre medvetet vilande**, ingen källa taggar `triggerGroupId` ännu.
20. **KORRVANDA2, tre öppna punkter utan BACKLOG-rad:** ClubScreen har sex flikar som bryter horisontellt på 390px (ingen overflow-hantering); en intro-overlay-opacitetsbugg aldrig lokaliserad; en "Visa introduktionen igen"-funktion (mock-D1) som aldrig byggdes alls (0 träffar i kod).
21. **`pilotTransferBidRippleChain` och `getArcMoodText`** — båda skrivna, testade, noll konsumenter (Överlämning 2 steg 0, väntar designplacering sedan 2026-08-22).
22. **`DOM_SPONSOR_MOTBUD_2026-08-31.md`** — skriven samma dag som denna inventering, redan orphan. Beställer ett tre-utfalls motbud på sponsorerbjudanden (accept/reject/motkrav). Verifierat: mekaniken finns bara för transferbud, aldrig sponsorer. Ingen rad i BACKLOG.
23. **Presskonferensens sista residual:** `pressConferenceService.ts:1004` byter ut kaptensfrågans TEXT mot en generisk variant men behåller de gamla `preferIds` — sista instansen av den bugklass DERBYREPLIKEN-passet stängde på 17 andra ställen.
24. **Sprint 25F (HT-lead comeback) slutade på ❌, ingen audit skrevs.** Löstes indirekt senare (targetet i sig var fel, 46.6→78.1), men den ursprungliga sprinttråden stängdes aldrig formellt.
25. **Scoreboard-hex:** `Scoreboard.tsx:145` har `#A89878` med kommentaren "möjlig LED-tavla-kontrast, verifiera live" — aldrig avgjort.

---

## §3 — Sprint 01–21: 76+ specade punkter, noll stängande audits

Det enskilt största strukturella hålet. Från Sprint 22 och framåt har praktiskt taget varje sprint en egen `*_AUDIT.md` och de flesta är rena. **Sprint 01 till 21 (21 sprintspecar) har ingen enda audit.** Den avsedda stängningsmekanismen (`docs/ATGARDSBANK.md`, manuell ✅-märkning) har bara två ✅ totalt och skrevs om till playtest-fynd redan 2026-04-28. BACKLOG dödmarkerar själv hela metoden ("Sprintlistan död") utan att någon inventerat vad som faktiskt blev klart.

Stickprov mot kod visar att KÄRNAN i Sprint 17-21 är byggd (`AssistantCoach.ts`, `TaktikScreen.tsx`, `GranskaScreen.tsx`, `LockerRoomMap.tsx` finns alla) — men punkt-för-punkt-läget för alla 76+ specade rader är okänt. `SPRINTS_17_21_INDEX.md` listar dessutom fyra explicit skippade designpunkter (historisk kontext, rika timer-varianter, supporterkänsla, beslutskedja) som aldrig återupptagits någonstans.

Utöver detta: **två namnkollisioner** gör kön svårläst — det finns två olika "Sprint 26" (ekonomibalans vs skandalreferenser, bara den senare har en audit) och två olika "25f" (HT-lead-comeback vs domare/matchskador). Och `SPRINT_22_14_TAKTIK_UX.md` har bara Del A belagd; Del B–D är obekräftade.

Alla lösa `SPEC_*.md`-filer som ligger direkt i `docs/sprints/` (inte i en nummer-mapp) visade sig vara byggda — två är faktiskt felnamngivna audits, inte specar.

---

## §4 — DOM_*-rulingar (2026-08-17 till 2026-08-31), sammanfattat

29 domar granskade. **23 helt klara**, verifierade mot kod och (där relevant) mot denna sessions egna commits (väg C, HIGH 5-12, MEDIUM 13-16 alla bekräftade oberoende av granskningsagenten). Kvarstående:

| Dom | Läge |
|---|---|
| `DOM_D1_EVENTVIKTNING` | DELVIS — batch-av-tre vilande, se §2.19 |
| `DOM_DELNINGSKORTET` | DELVIS — 1 av 3 artefakter, se §2.13 |
| `DOM_DOMINANS_OCH_FORHANDSDELTAN` | DELVIS — O12 "förhandsdelta" skriven, aldrig byggd |
| `DOM_FORUTSATTNINGSFASEN` | Steg 1 klar. Steg 2 var "blockerad" på `aiTransferLog`+`standingsSnapshot` — **båda finns nu** (`seasonEndProcessor.ts:1853`, `seasonSummaryService.ts:719`). Kommentaren i `boardService.ts:640` som säger "ej byggda" är stale — ordern är körbar idag. Kvittensraden fortfarande `'[Opus]'`. |
| `DOM_GRANSKA_LARANDEYTA` | DELVIS — se §2.18 |
| `DOM_ILLUSTRATIONERNA` | EJ UTFÖRD, se §2.12 |
| `DOM_MERITBUFFERT` | Byggd, men de föreslagna MAGNITUDERNA väntar fortfarande Jacobs slutgiltiga dom |
| `DOM_SPONSOR_MOTBUD` (idag) | EJ BYGGD, se §2.22 |

---

## §5 — design-system/ och docs/mockups/

`design-system/HANDOFF.md` och `SYNC.md` är stale (se §1). Den verkliga senaste kön är `design-system/briefs/DESIGN-KO-2026-07-02.md` (7 punkter, punkt 6 "D4 Portal-orienteringen/första-gången-rampen" är enda öppna). `AUDIT-OPUS-GAMEPLAY-2026-06-24` bär den tyngsta obetade posten (§2.17). FAS 1 (24 ikoner) är överspelad av Lucide-beslutet men 7 `TODO(FAS 1)`-markörer pekar fortfarande dit i koden — bör städas eller dödmarkeras. FAS 4 (12 klubbmärken) är 3/12 klara. FAS 5 (porträttgenerator) är opåbörjad.

`docs/mockups/` (170 filer, ingen från 2026-08) är i praktiken ett ARKIV för konsumerat arbete — mappen fylls när en mock byggs, inte när den beställs. Av ~40 identifierade ämnen bekräftades 39 byggda via grep. Enda "nollträffen" (`hall_debate_service_spec.md`) är en medvetet stängd/överspelad rad, inte en obyggd mock. `HANDOFF-RESTERANDE-TICKETS-2026-05-23.md` (BACKLOG rad 618, "~10h Code spridda") visade sig i praktiken helt utbetald — BACKLOG-raden är stale.

---

## §6 — docs/incoming/: åtta filer redo för arkivering, ingen genuint öppen

Mappens egen regel (README) säger att en fil ska flyttas till `_arkiv-<år>-<månad>/` så fort den är dömd och byggd. Åtta filer bryter mot detta — alla verifierat fullt behandlade, bara aldrig flyttade: `BANDY_MANAGER_AUDIT_6_SASONGER_2026-08-26.md`, `RAPPORT_OMMATNING_VAGB_ANSPRAK4_TRE_FYND_2026-08-30.md`, `bandy-manager-manniskoupplevelse-audit-7024f8a-2026-08-24.md`, `bandy-manager-skutskaer-audit-52009671-2026-08-20.md`, `bandy-manager-hela-auditsviten-5c9a7a8.pdf`, `github-synk-forutsattningsfasen-2026-08-25.md`, de två "Ytkarta"-HTML-filerna, och (efter egen verifiering, §2 punkt 2) `INVESTIGATION_MATCH_REVENUE_ECONOMY_2026-08-26.md` — dess fynd visade sig redan löst dagen efter det skrevs.

**Overifierat, 40 dagar gammalt:** `SPAR-B-TEXTNIVAER-SVITKORT-FRAMATKROK-2026-07-20.md` + sin HTML-mock — `DOM_SPARB_TEXTNIVAER` täcker bara B5 (textnivåer); B4 (svitkort) och B3 (framåtkrok) är overifierade mot kod.

**Aktiv, låt ligga:** `Forutsattningsfasen-styrelsen-talar…html` (steg 1 byggd, steg 2 väntar §4:s DOM_FORUTSATTNINGSFASEN-fynd), `Illustrationer-stilbibel-2026-08-18.dc.html` (aktivt refererad av SYNC.md), `github.md` (löpande referens).

**README:s egen tabell är stale** — listar 7 poster, mappen har faktiskt 13+.

---

## §7 — Frågor bara Jacob kan svara på

- **Sponsormotbud** (§2.22) — vill du ha en riktig tre-utfalls-förhandling (kräver Opus-text + spec), eller stannar den vid att reset-buggen är fixad?
- **Illustrationerna** (§2.12, §2.14) — beställ `cup` (prioritet), `premiär`, `derby`, `nyår` enligt stilbiblen, eller acceptera den typografiska fallbacken permanent?
- **`DOM_ILLUSTRATIONERNA`** — ska de tre BEFINTLIGA bilderna (intro/final/annandagen, från 5 juni) regenereras enligt domens nya promptstil/seed, eller stå kvar?
- **Meritbuffertens magnituder** (§4) — domen byggdes, de föreslagna talen väntar fortfarande ditt slutgiltiga OK.
- **`HALL_NEWS_*`/`BOARD_HALL_QUOTES`** (§0) — väva in i en ny hall-nyhetsyta, eller radera permanent nu när de är räddade och synliga igen?
- **Sprint 01-21-arvet** (§3) — värt en retroaktiv punkt-för-punkt-audit, eller acceptera att de 76+ punkterna aldrig får en formell stängning eftersom kärnan uppenbarligen är byggd?
- **Stashade WIP-commits** (`stash@{0}`, `stash@{1}`) — okänt innehåll, okänd ålder. Poppa, granska, eller släng?

---

## Vad som INTE står här

Allt i `docs/findings/` (D-facts, kalibreringsfakta) och `docs/kunskapsbas/` (bandyregler, dataschema) — det är referens, inte köer, och uteslöts medvetet. HIGH 5-12/MEDIUM 13-16 från 2026-08-29-auditen täcks redan uttömmande av `docs/BACKLOG.md`s egen rad om den audit-triagen (skriven samma vecka som detta dokument) — upprepas inte här. `docs/mockups/` och `design-system/preview/` är komponentkanon/arkiv, inte ordrar — sammanfattade i §5, inte radade fil för fil.

**Om något saknas här är det för att det är stängt, eller för att sex agenter och en synteser missade det. Det senare är statistiskt garanterat vid den här skalan — nästa session bör inte ta den här filen som ofelbar, bara som den mest genomlästa nulägesbilden som finns.**
