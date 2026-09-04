# LIGGARENS KONSUMENTKARTA — preliminär (Opus, 2026-09-03)

**Status:** REVIDERAD MOT RAW 2026-09-03 (se §8–§12 sist). §1–§7 är den preliminära läsningen, bevarad; RAW bekräftade den och la till tre fynd. Kön i §5 är ersatt av §9.

**Frågan:** liggaren har ~35 händelsetyper som spelet *vet*. Hur många *säger* det till spelaren, och i vilket steg av trestegsmodellen (frys · minns/eskalera · talar)?

**Lästa konsumenter:** `clubMemoryService` (Krönikan), `momentLedgerService` + `momentViewTemplates` ("Det som hänt"), `clubHistoryLedgerService` (backfill), `storylineLedgerService`, `seasonSummaryService` (årsboken), `seasonDecisionCaptureService` (Säsongens beslut), `refereeService`, `ClubMemoryView`, `Narrative.ts` (schemat).

---

## 1. Huvudfyndet: två läsare som delar upp liggaren mellan sig

Liggaren har idag **två oberoende minnesläsare**, och de läser **disjunkta** typmängder:

**Läsare 1 — Krönikan** (`getClubMemory`, per säsong, 5 säsonger bakåt, significance ≥ 30):
läser exakt sex typer via `LEDGER_CLUB_MEMORY_TYPES`: `academy_promotion`, `national_team_callup`, `retirement`, `facility_built`, `scandal`, `player_milestone` — plus `storyline_resolution` via projektion. Matchhändelserna (`season_finish`, `cup_final`, `sm_final`, `derby_result`, `big_win`, `big_loss`) bygger den ur **fixtures**, inte ur liggaren.

**Läsare 2 — "Det som hänt"** (`getRecentMomentsFromLedger`, **de fem senaste**, ingen säsongsindelning):
läser exakt elva Moment-typer via `MOMENT_LEDGER_TYPES`: `derby_win`, `star_injury`, `mecenat_costshare`, `captain_crisis`, `nemesis_signed`, `sponsor_positive`, `sponsor_negative`, `transfer_story`, `season_highlight`, `era_shift`, `rival_sale` — med vymallar i `MOMENT_VIEW_TEMPLATES`.

Konsekvens: **en epokväxling (`era_shift`, significance 85) försvinner ur varje yta efter fem senare händelser.** Den är inte i Krönikans typlista, och "Det som hänt" är recency-cappad till fem. Samma öde för `rival_sale` (75) och `star_injury` (70). Det högst viktade som händer en klubb glöms först. `significance` finns på varje post men används aldrig för att välja *mellan* typer — bara som tröskel inom Krönikans sex.

Det här ändrar Klubbminnet-redesignen: Designs "Ortens minne"-hero (= säsongens post med högst significance) förutsätter en **enad** läsning. Den finns inte. Byggs redesignen på dagens `getClubMemory` blir heron aldrig en epokväxling eller en stjärnskada — bara en av de sex.

## 2. Kartan, per nivå

**Tier A — alla tre stegen (frys · minns · talar):**
- `storyline_resolution` — frys (liggarpost) · minns (`hasPriorStorylineResolution` → återfall i press-bågen) · talar (Krönikan + årsbokens narrativ + arc-keyMoments). Fullständig.
- `manager_burnout` — frys · minns (`isBurnoutRelapse`) · talar (årsbokens managerSeason via `getBurnoutSeasonMemory`). Fullständig.

**Tier B — frys + talar, men aldrig minns (steg 2 saknas):**
- De sex Krönika-typerna: talar i Krönikan, minns via `findActiveAnniversaries` (årsdagar) — **men bara de**. Så Tier B gäller egentligen inte dem; de är närmast A. Flyttas till A-light.
- De elva Moment-typerna: talar i "Det som hänt" (fem senaste), **minns aldrig** — `findActiveAnniversaries` läser `getClubMemory().seasons`, som exkluderar dem. Ingen årsdag för ett derby, en epokväxling, en stjärnskada.

**Tier C — frys + talar en gång, sedan tyst:**
- `decision` — bara `pickMostImportantDecisionText` läser den: **ett** beslut per säsong når årsboken. Alla andra beslut samma säsong — ofta fyra–åtta kvalificerade — skrivs och nämns aldrig igen. Krönikan läser inte `decision`. HistoryScreen läser inte. Spelarens egna val är den sämst ihågkomna kategorin i liggaren.

**Tier D — skriv-bara (spelet vet, säger aldrig) [grep bekräftar producenter]:**
- `referee_feud`, `referee_trust` — DOM_DOMARRELATION byggde skrivningen (refereeRelationLedger.test finns). `refereeService.ts` läser inte liggaren; ingen av de nio konsumenterna nämner typerna. Domar-bågen är fryst men aldrig talad utanför matchen den hände i. **[grep: finns någon läsare i matchCore/eventResolver?]**
- `mecenat_withdrawal` — producerad (Fas 4+ ripple). Inte MomentSource → ingen vymall → inte i "Det som hänt". Inte i Krönikans sex. Ingen läsare sedd. En mecenat som lämnar är en 45–75-händelse ingen minns.
- `patron_emerge`, `patron_withdrawal` — typer tillagda 2026-09-02; DOM_PATRON sa "ÖPPET, EJ PÅBÖRJAT". **[grep: producerade alls?]** Läsare: ingen sedd.
- `transfer_signed`, `transfer_sold` — finns i både `EventLedgerType` och Krönikans `MemoryEventType`, men `buildMemoryEventFromLedger` har **ingen case** för dem → returnerar null. Om de produceras försvinner de tyst i Krönikan. **[grep: producerade?]**
- Alla `decision`-poster utom säsongens topp-1 (se Tier C).

**Tier E — deklarerade, aldrig producerade [grep bekräftar]:**
- `patron_change` — Narrative.ts säger själv: konstruerades aldrig. Död typ.
- `season_finish`, `cup_final`, `sm_final`, `derby_result`, `big_win`, `big_loss` — Krönikan härleder dem ur fixtures. **[grep: skrivs de ändå av någon?]** Om inte: fixtures är kanon för matcher, vilket är fint — MEN se §3 om gallring.

## 3. Strukturella fynd utöver typerna

**3a. Matchminnet vilar på att fixtures aldrig gallras.** Krönikan bygger derby/big_win/finaler ur `game.fixtures` per säsong. Om äldre säsongers fixtures rensas vid rollover (save-storlek) försvinner matchminnena för de säsongerna, och Krönikans "5 säsonger bakåt" blir tomt bakåt. **[Code: verifiera om fixtures gallras; om ja är det ett minnesläckage, om nej är det en växande save.]**

**3b. Årsboken läser liggaren smalt.** `generateSeasonSummary` tar `storyline_resolution`, `decision` (topp-1) och `manager_burnout`. keyMoments är fixture-härledda + två arc-storylines. En epokväxling, en domarfejd, en mecenat som lämnar, en patron som kliver fram — säsongens tyngsta systemhändelser — når inte årsboken. Den vet inte att de hände.

**3c. Årsdagarna läser fel källa.** `findActiveAnniversaries` läser Krönikans färdigbyggda `MemoryEvent`-lista, inte liggaren. Därför får bara de sex typerna årsdagar. En liten omkoppling (läs `eventLedger` direkt, tröskla på significance) ger steg 2 åt **alla** typer på en gång.

**3d. `momentKind` (Triumf/Ärr/Laddat/Noterat) täcker bara Moment-typerna.** Alla andra faller till `neutral`. En enad läsare behöver en kind-mappning för hela unionen — det är en tabell, inte kod.

## 4. Dömande: var varje lucka ska surfa

Principen: **använd ytor som finns**. Liggaren är kanon; ytorna är projektioner. Ingen ny skärm.

1. **En enad minnesläsare** — `getClubMemory` läser ALLA typer per säsong, rankar på significance, med kind- och familjmappning för hela unionen. "Det som hänt" blir samma läsare filtrerad på innevarande säsong. Det är Klubbminnet-redesignens dataspec, och det gör Designs "Ortens minne"-hero sann. En service, tre konsumenter (Krönikan, "Det som hänt", HistoryScreen Timeline-lite).
2. **Årsdagar ur liggaren** — `findActiveAnniversaries` läser `eventLedger` direkt (significance ≥ 30 ett år, ≥ 95 flera år, som idag). Steg 2 för alla typer i en ändring.
3. **Årsbokens keyMoments får två liggarposter** — de två högst viktade icke-decision-posterna som inte redan representeras (era_shift, referee_feud, patron_*, mecenat_withdrawal, star_injury). Årsboken slutar vara blind för systemhändelser.
4. **Beslutsminne bortom topp-1** — Krönikan/Klubbminnet visar beslut med significance ≥ 70 som egna rader (`composeSeasonDecisionSentence` finns redan per semanticKey). Spelarens val blir ihågkomna.
5. **Vymallar för de tysta typerna** — `referee_feud`, `referee_trust`, `mecenat_withdrawal`, `patron_emerge`, `patron_withdrawal` (+ `transfer_signed/sold` om producerade). **Opus skriver**, i MOMENT_VIEW_TEMPLATES-form, en mall per typ. Utan mall kan ingen enad läsare rendera dem.
6. **Pressen läser liggaren** — pressfrågor som refererar säsongens tyngsta poster (domarfejden, mecenaten som lämnade). Det är centralredaktörens domän och en större sak; köas efter 1–5.
7. **Kafferummet** — **[grep: läser det liggaren idag?]** Om inte: kandidat för små steg-3-ekon ("för ett år sedan…"). Litet, sen.

## 5. Prioriterad kö (efter grep)

| # | Vad | Ägare | Beroende |
|---|---|---|---|
| 1 | Enad minnesläsare (alla typer, significance-rankad, kind+familj för hela unionen) | Code | Design ritar om Klubbminnet mot den |
| 2 | Årsdagar ur liggaren | Code | 1 (delar mappning) |
| 3 | Vymallar för fem–sju tysta typer | **Opus** | grep bekräftar producenter |
| 4 | Årsbokens keyMoments + två liggarposter | Code | 3 |
| 5 | Beslutsminne ≥70 i Krönikan | Code | 1 |
| 6 | Fixture-gallring: verifiera | Code | — |
| 7 | Pressen läser liggaren | Opus spec → Code | 1–4 |
| 8 | Döda typer (`patron_change` m.fl.): ta bort ur unionen eller producera | Code, Opus dömer per typ | grep |

## 6. Vad detta betyder för dagens öppna rader

- `redesign-klubbminnet-omdesign`: mocken är rätt, datan under den är fel. Kö #1 är förutsättningen — annars ritar Design en hero som aldrig kan visa en epokväxling. Uppdateras.
- `c-hist1-klubbhistorik-berattelse` (Timeline-lite): ska läsa den enade läsaren, inte keyMoments direkt. Uppdateras.
- `DOM_PATRON_MECENAT_LAST`: patron→liggaren var öppen; kartan bekräftar att även om skrivningen byggs saknas läsaren. Steg 1 utan steg 3 är inte klart.
- `sluttest-b12-konsument-b5`: samma klass en nivå ner (matchCore-fält utan läsare). Kvarstår som egen spec.

## 7. Verifieringar Code ska göra i grep:en (utöver tabellerna)

- Producenter för: `referee_feud/trust`, `patron_emerge/withdrawal`, `transfer_signed/sold`, `mecenat_withdrawal`, `big_win/big_loss/derby_result/season_finish/cup_final/sm_final`.
- Läsare för: `referee_*` (matchCore? eventResolver?), kafferummet (`coffeeRoomService`), Portal-kortgeneratorer, pressen.
- Gallras `game.fixtures` för äldre säsonger någonstans (rollover/migration)?
- `game.recentMoments` — dual-write kvar? Vem läser fortfarande fältet (retire-last-vakt)?

---

*Kartan revideras mot RAW-rapporten samma dag den landar. Tills dess: §1 och §3 är kodlästa och står; Tier D/E är hypoteser med explicita grep-frågor.*

---

# REVIDERAD MOT RAW (Code, `RAPPORT_LIGGARE_KONSUMENTKARTA_RAW_2026-09-03.md`, samma dag)

## 8. Vad RAW bekräftade och vad den la till

**Bekräftat rakt av:** de två disjunkta läsarna (§1), årsdagarna läser Krönikans lista (§3c), årsboken läser tre typer (§3b), `decision` topp-1 (Tier C). Siffrorna: 34 typer, 20 med ≥ 1 konsument, **9 utan producent**, **5 producerade men utan konsument**, 23 utan vymall. (RAW:s rad "skriv-bara (≥1 producent): 25" är feletiketterad — den räknar typer MED producent; äkta skriv-bara är fem.)

**Tier D är inte längre hypotes.** Fem typer skrivs och läses aldrig: `referee_feud`, `referee_trust`, `mecenat_withdrawal`, `patron_emerge`, `patron_withdrawal`. Det är exakt de tre bågar som byggdes 2026-09-02 — domarrelationen, patron, mecenat-uttaget. Steg 1 (frys) byggdes; steg 3 (talar) byggdes aldrig. Bågarna finns i liggaren och ingenstans annars.

**Tier E är större än jag trodde.** Nio typer produceras aldrig: de sex matchtyperna (`season_finish`, `cup_final`, `sm_final`, `derby_result`, `big_win`, `big_loss` — konstrueras bara som `MemoryEvent` ur fixtures, aldrig som liggarpost), `transfer_signed`, `transfer_sold`, `patron_change`. En unionsmedlem utan producent är ett falskt löfte — samma klass som text utan yta.

**Tre nya fynd RAW gav:**

1. **Orsak/verkan-konsumenten är föräldralös.** `orsakVerkanService.ts:getLatestDecisionConsequence` — liggarens "första konsument" enligt DOM_ORSAK_VERKAN_SCOPING (Fas 1) — har **ingen produktionsanropare**, bara sitt test. Orsak/verkan-synligheten, som var hela skälet liggaren började byggas, är byggd i tjänstelagret och aldrig wirad till en yta. Spelaren har aldrig sett den.
2. **Portalen läser inte liggaren alls.** Ingen kortgenerator (`initCardBag`, `dashboardCardBag`, `portalBuilder`, `pickEfterklang`, `inboxToPortal`) rör `eventLedger`. Inte heller `boardService` eller `coffeeRoomService`. Spelets mest besökta yta och dess två tysta rum är blinda för kanon. (`BurnoutMark` når Portal indirekt via `isBurnoutRelapse` — det enda undantaget.)
3. **`patron_withdrawal` har en producentbugg.** `patronWithdrawalService.applyPatronHappinessTransition` bygger `.ledgerEntry`, men `eventProcessor.ts` (rad ~443, patronkravs-uppföljningen) läser inte fältet — den vägen skriver ingen post. `eventResolver`-vägen skriver. Halva uttågen saknas i kanon.

**Meningslagren är fyra, inte ett.** "23 utan vymall" är sant men missvisande: Krönikans sex har text via `buildMemoryEventFromLedger`, `storyline_resolution` via `displayText`, `decision` via `composeSeasonDecisionSentence`, `manager_burnout` via burnout-minnet. Det är fyra parallella textkällor med olika form. En enad läsare ska INTE skriva om dem — den ska ha en dispatch som pekar på rätt källa per typ, och bara de fem tysta typerna (plus ev. transfer_*) behöver ny text.

## 9. Reviderad kö (ersätter §5)

| # | Vad | Ägare | Not |
|---|---|---|---|
| 1 | **Enad minnesläsare** — en funktion som läser hela liggaren per säsong, rankar på significance, och dispatchar text till de fyra befintliga meningskällorna + de nya mallarna (§10). Kind- och familjtabell för alla producerade typer (§10). Ersätter `LEDGER_CLUB_MEMORY_TYPES`-allowlisten och `getRecentMomentsFromLedger` som separata läsare. | Code | Klubbminnet-redesignens dataspec. |
| 2 | **Årsdagar ur liggaren** — `findActiveAnniversaries` läser `eventLedger` direkt via #1. | Code | Steg 2 för alla typer. |
| 3 | **Vymallar för de fem tysta** — LÅSTA i §10. | **Opus KLAR** | Code kopierar ordagrant. |
| 4 | **Orsak/verkan får sin yta** — wira `getLatestDecisionConsequence` till Granska-ögonblicket (d1) eller Portal-kortet efter beslut: "Det du valde i omgång N: Kassan tydligt ner, Klacken knappt upp." | Code | Återställer Fas 1:s löfte. Opus har kedjans etiketter redan (`describeRippleChain`). |
| 5 | **`patron_withdrawal`-producentbuggen** — `eventProcessor.ts:443` skriver `.ledgerEntry`. | Code | En rad. |
| 6 | **Årsbokens keyMoments + två liggarposter** (högst viktade icke-decision, ej redan representerade). | Code | Efter #1. |
| 7 | **Beslutsminne ≥ 70 i Krönikan** via #1. | Code | Efter #1. |
| 8 | **Portalen läser liggaren** — ett "För ett år sedan"-kort ur #2, och ett "Sedan sist"-kort för högst viktade post sedan förra omgången. | Opus spec → Code | Efter #1–2. Centralredaktören styr frekvens. |
| 9 | **Döda typer** — dom i §11. | Code | — |
| 10 | **Fixture-gallring** — verifiera; om fixtures gallras blir #9:s matchproducent akut. | Code | — |
| 11 | **Pressen läser liggaren** — frågor om säsongens tyngsta post. | Opus spec → Code | Sist. |

## 10. Vymallar — LÅSTA (Opus, 2026-09-03)

Samma form som `MOMENT_VIEW_TEMPLATES` (title + body, `{Namn}`/`{Efternamn}` interpoleras ur `resolveSubjectName`). Code kopierar ordagrant, översätter aldrig. Domar-relationen är per DOM_DOMARRELATION *marginell, aldrig utslagsgivande* — texterna lovar därför uppfattning och tendens, inte rigg.

**referee_feud** — kind: tension · familj: relationer
title: Fejd med {Efternamn}
body: Vi har protesterat en gång för mycket, och han har märkt det. Från och med nu tolkas varje tveksam situation åt fel håll — i huvudet på båda.

**referee_trust** — kind: triumph · familj: relationer
title: {Efternamn} och vi förstår varandra
body: Ett par matcher med respekt i stället för protester. Han hör bänken utan att bli irriterad, och det märks i tveksamma lägen. Sånt är värt mer än ett frislag.

**mecenat_withdrawal** — kind: scar · familj: relationer
title: {Namn} lämnade
body: Pengarna var en sak. Att ha någon som ställde upp när det knakade var en annan. Kassan märker det direkt; orten om ett tag.

**patron_emerge** — kind: triumph · familj: relationer
title: {Namn} kliver fram
body: Ingen presskonferens, ingen skylt på arenan. Bara någon som bestämt sig för att klubben ska finnas kvar, och har råd att mena det.

**patron_withdrawal** — kind: scar · familj: relationer
title: {Namn} drar sig tillbaka
body: Grundpelaren finns inte längre. Det syns inte på läktaren första veckan. Sen syns det överallt.

**Kind- och familjtabell för hela den producerade unionen** (Code implementerar som tabell, inte switch):
- triumph: derby_win, sponsor_positive, era_shift, season_highlight, academy_promotion, national_team_callup, facility_built, referee_trust, patron_emerge
- scar: star_injury, rival_sale, captain_crisis, sponsor_negative, transfer_story, scandal, mecenat_withdrawal, patron_withdrawal
- tension: nemesis_signed, referee_feud
- neutral: mecenat_costshare, player_milestone, retirement (värdighet, inte sår), storyline_resolution (kind ur storyline-typen: underdog/gala/breakthrough → triumph; farewell/contract_drama → neutral), decision (neutral; irreversible+tension → tension), manager_burnout (scar vid mark, triumph vid close)
- familjer: ⚔️ match (derby_win, season_highlight) · 🏟️ anläggning (facility_built) · 👤 personer (player_milestone, academy_promotion, retirement, transfer_story, star_injury, captain_crisis, national_team_callup, nemesis_signed, rival_sale) · 🤝 relationer & pengar (patron_*, mecenat_*, sponsor_*, referee_*) · 📋 beslut & epok (decision, storyline_resolution, scandal, manager_burnout, era_shift)

## 11. Dom över de nio döda typerna

- **`patron_change`** — TA BORT ur unionen. Ersatt av emerge/withdrawal, Narrative.ts säger det själv.
- **`transfer_signed`, `transfer_sold`** — PRODUCERA. Marknaden är ett minne (säsongens stora värvning, den som såldes) och `transfer_story` täcker bara laddade avgångar. `transferProcessor.executeAcceptedTransfers` skriver redan Moments där — lägg en post per genomförd affär för managerad klubb, significance 35 (+15 om avgift över truppens medianlön×12), subject spelaren, subject2 motparten. Mallar: **Opus skriver när producenten står** (två korta).
- **De sex matchtyperna** — BEROR PÅ #10. Om `game.fixtures` aldrig gallras: ta bort ur `EventLedgerType` (fixtures är kanon för matcher, Krönikan härleder korrekt) och låt `MemoryEventType` behålla dem. Om fixtures gallras: PRODUCERA dem vid matchslut/säsongsslut med `buildEventFromFixture`:s befintliga significance-logik, så matchminnet inte dör med fixturerna. Code verifierar gallringen först; Opus dömer sedan på svaret.

## 12. Vad kartan säger om veckans bågar

De tre bågar som byggdes 2026-09-02 — domarrelationen, patron, mecenat-uttaget — är alla i samma läge: fryst, aldrig talad. De är inte trasiga. De är halvbyggda enligt trestegsmodellen, och det här är andra halvan. Med #1 + #3 blir de hela i ett pass. Det är den mest konkreta "gör bågarna så bra de kan" som finns just nu.
