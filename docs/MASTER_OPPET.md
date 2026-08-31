# MASTER_ÖPPET — den enda levande statuskällan för öppna poster

**Etablerad:** 2026-08-31. Ersätter BACKLOG.md och SLUTTEST_KO.md som "enda sanning" om vad som är öppet — de degraderas till changelog + parkerad-idé-katalog och pekar hit (se deras nya filhuvuden). Ingen annan fil får längre påstå att den är den kanoniska statuslistan.

## Regler för den här filen

**Tillstånds-maskinen (regel 8):** `rapporterad → verifierad → bygger → klar` (eller `stale`, om posten visar sig redan vara löst/överspelad vid verifiering — se INVENTERING_2026-08-31.md:s "prövad och friad"-mönster för exempel).
- **Varenda post föds `rapporterad`.** Ingen post ärver `verifierad` för att en källa (BACKLOG, SLUTTEST_KO, en audit, en agent) påstod ett faktum om den. Det gäller även när tre olika källor råkar säga samma sak — konsensus mellan rapporter är inte verifiering.
- En post får inte flyttas till `bygger` förrän den är `verifierad` — det betyder: kodläst mot arbetsträdet OCH mot `git log`, av en människa eller Code, med resultatet skrivet i posten.
- **Code kör bara mot `verifierad`-rader.** En `rapporterad`-rad är inte en arbetsorder.
- En post som verifieras och visar sig redan vara löst (som fyra av sju stickprov i INVENTERING_2026-08-31.md var) sätts till `stale` med en rad om vad som faktiskt hände, inte raderas tyst.

**Ägarfält:** Opus (design/text/omdömesfråga) · Code (implementation/verifiering) · Jacob (ett beslut bara han kan fatta).

**Detta är en RÅ SKÖRD, inte en färdig lista.** Extraherad ur `docs/INVENTERING_2026-08-31.md`, `docs/SLUTTEST_KO.md` och `docs/BACKLOG.md`:s öppna tabeller, var för sig, utan sinsemellan-deduplicering — tre källor beskriver ibland samma underliggande fakta (t.ex. `wageBudget`-buggen, H4-klippans rotorsak, flera `[Opus]`-textgap) som separata rader här. Att slå ihop dem kräver samma sannings-bedömning som verifieringspasset gör — att göra det nu, i skördepasset, hade varit precis den "ärvd verifierad"-genväg regel 8 förbjuder. Dubbletter är alltså EN FÖRVÄNTAD DEL av verifieringsarbetet, inte ett skördefel.

## RÅTT ANTAL

**474 rader.** (58 ur INVENTERING_2026-08-31.md + 185 ur BACKLOG.md + 231 ur SLUTTEST_KO.md.) Antalet är utdata, inte ett mål — se Jacobs egen instruktion om varför.

Redan kända, inte separat skördade här (löstes eller stängdes SAMMA DAG av Code, före detta skördepass, med commits): FormationView.tsx:s tredje golv-blinda "Fyll bästa elvan" (`ea63b02c`), fyra räddade textpooler i `hallProvningData.ts`, två DOM-supersede-markeringar, två BACKLOG-headerkorrigeringar (203-filer-risken, TEXT-AUDITEN). De är `klar`, inte `rapporterad` — de hör inte hemma i en öppen-lista.

---

## Fynd EFTER skörden — Jacobs egen verifiering, kör genom hela tillstånds-maskinen

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| high6-attributionshal-madebyplayer | `resolveEvent()` gated aldrig VEM som löste ett event — auto-resolvade mecenatkonflikter/kaptensmöten/varsel kunde bli `seasonDecisionCandidates`/`captain_rallied_team`/`rescued_from_unemployment`/`went_fulltime_pro` som om spelaren själv fattat beslutet. | **klar** | Code | Jacobs egen kodläsning + körorder 2026-08-31 (auditens critical #1) | Byggt: `madeByPlayer: boolean` obligatorisk sist-parameter (tsc-tvingad vid alla ~50 anropsställen — UI/store/scripts/32 testfiler). Fyra skrivningar gated (captureSystemDecision-kandidaten, captainSpeech/captain_rallied_team, varsel/rescued_from_unemployment, went_fulltime_pro). narrativeBeatLog/resolvedChoices/resolvedEventIds MEDVETET ogated (mekanik). Tre nya regressionstester (mecenat/captainSpeech/varsel auto-resolve → ingen kandidat/storyline, effekten sker ändå). tsc rent (huvud + scripts), 3494/3494 gröna, build rent. |
| high6-retirement-agefloor-24aring | `getRetirementCandidate()` hade inget åldersgolv — `conditionScore` (max 4, fitness 0) + `injuryScore` (0,5/post) kunde ensamma nå score ≥ 1 trots `ageScore(24)=0`, så en 24-åring med dålig fitness/skadehistorik kunde bli pensionskandidat. | **klar** | Code | Jacobs egen kodläsning + körorder 2026-08-31 (auditens critical #2) | Byggt: filter `age >= getPositionThreshold(position) − RETIREMENT_AGE_MARGIN` FÖRE poängen räknas (`getPositionThreshold` exporterad, var privat). `RETIREMENT_AGE_MARGIN = 4` (Jacobs default, hans att tuna — forward/halv golv ~29, målvakt ~32). Fyra nya regressionstester exakt Jacobs tre scenarier + en konstant-sanity: 24-åring/fitness 20/tre skador → INTE kandidat; 33-årig forward/låg fitness → kandidat; 30-åring/tung skadehistorik → kandidat. tsc rent, 3498/3498 gröna, build rent. |
| high6-retirement-golvalder-fitnessensam | Finare punkt Jacob noterade men INTE auditens critical: även med golvet kan en spelare EXAKT på golvåldern (ageScore=0) bli kandidat av fitness/skador ensamt — t.ex. en 29-årig forward som bara är trött denna säsong. Balansnyans, inte en bugg. | rapporterad | Jacob | Jacobs egen anteckning i körordern 2026-08-31 (medveten, ej rapporterad som fel) | Jacob avgör om det känns fel i spel — om ja, nästa steg är sannolikt ett separat, mildare golv för "endast fitness/skador utan någon ålderspoäng alls", inte en ändring av RETIREMENT_AGE_MARGIN (som redan är avsiktligt löst). |

Andra exemplet på tillstånds-maskinens fulla cykel, samma mönster som raden ovan. Två av auditens tre criticals nu `klar` (attribution + pensionsgolv). Kvar: framgångskurve-domen (väg C:s −45 tkr mot 1,7 mkr) — Jacobs egen, kräver hans spelbevis-beslut innan Code kan bygga mot den.

---

# KÄLLA: docs/INVENTERING_2026-08-31.md (58 rader)

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| inv-0-hall-text-wiring | Har hallprocessens H·1-hubb en yta för HALL_NEWS_*/BOARD_HALL_QUOTES, eller ska poolerna raderas permanent? | rapporterad | Opus/Jacob | INVENTERING_2026-08-31.md:19 | Opus/Jacob avgör wiring eller radering |
| inv-1-sluttest-a-m8-stale | SLUTTEST_KO.md:97 säger fortfarande "A-M8 EJ" trots att tränarmarknaden (e765efd5) är byggd | rapporterad | Code | INVENTERING_2026-08-31.md:31 (SLUTTEST_KO.md:97) | verifiera mot kod, uppdatera raden |
| inv-1-handoff-stale | design-system/HANDOFF.md listar flera redan byggda punkter som öppna och pekar inte till DESIGN-KO-2026-07-02.md | rapporterad | Opus | INVENTERING_2026-08-31.md:32 | uppdatera eller dödmarkera HANDOFF.md |
| inv-1-losenordsgrind-stale | BANDY_BRAIN_LOSENORDSGRIND.md stale i motsatt riktning (säger ej committad, är committad) — Vercel-cutover overifierad | rapporterad | Code | INVENTERING_2026-08-31.md:33 | verifiera Vercel-cutover när MCP är autentiserad, uppdatera dokument |
| inv-1-incoming-readme-stale | docs/incoming/README.md listar bara 7 poster, mappen har 13+ | rapporterad | Code | INVENTERING_2026-08-31.md:34 | uppdatera README-tabellen, arkivera filerna |
| inv-1-thebomb-status-broken-link | CLAUDE.md uppgiftstyp E pekar på THE_BOMB_STATUS_2026-04-26.md, flyttad till docs/archive/completed-april/ | rapporterad | Opus | INVENTERING_2026-08-31.md:35 | fixa sökvägen i CLAUDE.md |
| inv-1-claude-md-princip7-example-wrong | CLAUDE.md Princip 7:s exempel (hallProvningData.ts "beslutat BEHÅLL dödmarkerad") är fel — filen har nu sex konsumenter | rapporterad | Opus | INVENTERING_2026-08-31.md:36 | byt exempel i CLAUDE.md |
| inv-1-strings-pool-inventory-stale | STRINGS_POOL_INVENTORY.md fyra månader gammal, saknar minst fyra kända pooler | rapporterad | Opus | INVENTERING_2026-08-31.md:37 | regenerera |
| inv-2-4-sprint23-override1 | Sprint 23 OVERRIDE 1 (frys rekommenderad elva vid lineupConfirmedThisRound) aldrig byggd i FormationView/TacticBoardCard | rapporterad | Code | INVENTERING_2026-08-31.md:50 | verifiera mot kod |
| inv-2-5-wascaptainseasons | wasCaptainSeasons aldrig implementerat som eget fält (Sprint 27), approximeras idag | rapporterad | Code | INVENTERING_2026-08-31.md:51 | verifiera mot kod |
| inv-2-9-aterkopplingsslingan | Återkopplingsslingan/H4-klippan (cs 70→71) — rotorsak okänd efter sju mätningar, tidigare hypotes falsifierad | rapporterad | Code | INVENTERING_2026-08-31.md:63 | verifiera mot kod, fortsätt utreda |
| inv-2-10-sex-okontrollerade-round-falt | Sex okontrollerade *Round-fält, begärt två gånger, aldrig ens rapporterade | rapporterad | Code | INVENTERING_2026-08-31.md:64 | identifiera fälten, verifiera mot kod |
| inv-2-11-h5-renommetak | H5 renommétak (klampar vid 100 på åtta ställen), ingen rapport om vad som händer säsong 5-6 | rapporterad | Code | INVENTERING_2026-08-31.md:65 | verifiera mot kod, rapportera |
| inv-2-12-dom-illustrationerna | DOM_ILLUSTRATIONERNA (nya bilder, Gemini, fast seed) aldrig utförd — bilderna på disk är oförändrade sedan juni | rapporterad | Jacob | INVENTERING_2026-08-31.md:66 | Jacob avgör om regenerering ska beställas |
| inv-2-13a-delningskortet-artefakt2 | DOM_DELNINGSKORTET artefakt 2 "Årets match" ej byggd — shareImageReady hårdkodat false | rapporterad | Code | INVENTERING_2026-08-31.md:67 | verifiera mot kod |
| inv-2-13b-delningskortet-artefakt3 | DOM_DELNINGSKORTET artefakt 3 "Karriären hittills" ej byggd — blockeraren (O18) är nu borta | rapporterad | Code | INVENTERING_2026-08-31.md:67 | verifiera mot kod |
| inv-2-14a-illustration-cup | Illustration "cup" obeställd (prioritet 1 enligt SYNC 2026-08-18) | rapporterad | Jacob | INVENTERING_2026-08-31.md:68 | Jacob beställer enligt stilbibeln |
| inv-2-14b-illustration-premiar | Illustration "premiär" obeställd | rapporterad | Jacob | INVENTERING_2026-08-31.md:68 | Jacob beställer enligt stilbibeln |
| inv-2-14c-illustration-derby | Illustration "derby" obeställd | rapporterad | Jacob | INVENTERING_2026-08-31.md:68 | Jacob beställer enligt stilbibeln |
| inv-2-14d-illustration-nyar | Illustration "nyår" obeställd | rapporterad | Jacob | INVENTERING_2026-08-31.md:68 | Jacob beställer enligt stilbibeln |
| inv-2-15a-vag2-a5-motorkalibrering | ANALYSSPEC_VAG2: motorkalibreringskandidat ur A5 väntar Jacobs beslut | rapporterad | Jacob | INVENTERING_2026-08-31.md:69 | Jacob beslutar |
| inv-2-15b-vag2-a4-script-commit | ANALYSSPEC_VAG2: A4-scriptets commit väntar Jacobs beslut | rapporterad | Jacob | INVENTERING_2026-08-31.md:69 | Jacob beslutar |
| inv-2-15c-vag2-dam-attendance | ANALYSSPEC_VAG2: dam-attendance datatäckning 20,3% mot 50%-krav, blockerar A7 | rapporterad | Code | INVENTERING_2026-08-31.md:69 | verifiera mot kod/data |
| inv-2-15d-vag2-overtime-owngoal | ANALYSSPEC_VAG2: overtime/own_goal-fält saknas, relevant vid framtida omscrape | rapporterad | Code | INVENTERING_2026-08-31.md:69 | verifiera mot data, ingen åtgärd förrän omscrape |
| inv-2-15e-vag2-finding065-mekanism | ANALYSSPEC_VAG2: mekanismfrågorna bakom Finding 065 aldrig spawnade som frågor | rapporterad | Opus/Jacob | INVENTERING_2026-08-31.md:69 | Opus/Jacob avgör om frågorna ska ställas |
| inv-2-16-data-foundation-audit | INTERNAL_DATA_NOTES.md "Data Foundation Audit" (P0, 3-4h) aldrig formellt ärendefört eller avfärdat | rapporterad | Code | INVENTERING_2026-08-31.md:70 | verifiera mot kod, ärendeför eller avfärda |
| inv-2-17a-granska-advance-useeffect | AUDIT-OPUS-GAMEPLAY tråd 2 — advance() som sidoeffekt i Granskas useEffect, bräcklig arkitektur | rapporterad | Code | INVENTERING_2026-08-31.md:71 | verifiera mot kod |
| inv-2-17b-beslut-ui-tre-ytor | AUDIT-OPUS-GAMEPLAY tråd 3 — beslut-UI återimplementerat på tre ytor utan gemensam modell | rapporterad | Code | INVENTERING_2026-08-31.md:71 | verifiera mot kod |
| inv-2-17c-granska-taktik-brygga | AUDIT-OPUS-GAMEPLAY tråd 4 — ingen navigationsbrygga GranskaAnalys→Taktik | rapporterad | Code | INVENTERING_2026-08-31.md:71 | verifiera mot kod |
| inv-2-17d-cta-anti-autopilot | AUDIT-OPUS-GAMEPLAY tråd 5 — CTA:er aldrig villkorade av att spelaren fattat ett beslut | rapporterad | Code | INVENTERING_2026-08-31.md:71 | verifiera mot kod |
| inv-2-18-granska-larandeyta-kandidater | DOM_GRANSKA_LARANDEYTA — bara 1 av 4 "DITT VAL"-kandidater byggd, tre kvar (ej namngivna i källan) | rapporterad | Code | INVENTERING_2026-08-31.md:72 | läs DOM_GRANSKA_LARANDEYTA.md, namnge de tre, verifiera mot kod |
| inv-2-19-d1-batch-av-tre | DOM_D1_EVENTVIKTNING — batch-av-tre medvetet vilande, ingen källa taggar triggerGroupId | rapporterad | Code | INVENTERING_2026-08-31.md:73 | verifiera mot kod |
| inv-2-20a-korrvanda2-clubscreen-tabs | KORRVANDA2: ClubScreen har sex flikar som bryter horisontellt på 390px | rapporterad | Code | INVENTERING_2026-08-31.md:74 | verifiera mot kod |
| inv-2-20b-korrvanda2-intro-overlay-opacity | KORRVANDA2: intro-overlay-opacitetsbugg (mock-A1) aldrig lokaliserad | rapporterad | Code | INVENTERING_2026-08-31.md:74 | lokalisera, verifiera |
| inv-2-20c-korrvanda2-visa-intro-igen | KORRVANDA2: "Visa introduktionen igen" (mock-D1) aldrig byggd | rapporterad | Code | INVENTERING_2026-08-31.md:74 | verifiera mot kod (0 träffar rapporterat) |
| inv-2-21a-pilottransferbidripplechain | pilotTransferBidRippleChain skriven/testad, noll konsumenter, väntar designplacering | rapporterad | Opus | INVENTERING_2026-08-31.md:75 | Opus beslutar placering, Code wirar |
| inv-2-21b-getarcmoodtext | getArcMoodText skriven/testad, noll konsumenter, väntar designplacering | rapporterad | Opus | INVENTERING_2026-08-31.md:75 | Opus beslutar placering, Code wirar |
| inv-2-22-dom-sponsor-motbud | DOM_SPONSOR_MOTBUD_2026-08-31 — tre-utfalls motbud på sponsorerbjudanden ej byggt | rapporterad | Opus | INVENTERING_2026-08-31.md:76 | Opus skriver text+spec om Jacob vill ha featuren |
| inv-2-23-presskonferens-kaptensfraga-preferids | pressConferenceService.ts:1004 — kaptensfrågans preferIds ej uppdaterade trots textbyte | rapporterad | Code | INVENTERING_2026-08-31.md:77 | verifiera mot kod |
| inv-2-24-sprint25f-ingen-audit | Sprint 25F (HT-lead comeback) slutade på ❌, aldrig formellt stängd med audit | rapporterad | Code | INVENTERING_2026-08-31.md:78 | skriv stängande audit-notering |
| inv-2-25-scoreboard-hex | Scoreboard.tsx:145 #A89878 — möjlig LED-kontrastfråga aldrig avgjord | rapporterad | Opus | INVENTERING_2026-08-31.md:79 | Opus avgör kontrastfrågan |
| inv-3-sprint01-21-no-audits | Sprint 01–21 (76+ specade punkter) har ingen stängande audit, okänt punkt-för-punkt-läge | rapporterad | Jacob | INVENTERING_2026-08-31.md:83-91 | Jacob avgör om retroaktiv audit är värd kostnaden |
| inv-3-sprints17-21-four-skipped | Fyra explicit skippade designpunkter (historisk kontext, timer-varianter, supporterkänsla, beslutskedja) aldrig återupptagna | rapporterad | Opus/Jacob | INVENTERING_2026-08-31.md:87 | Opus/Jacob avgör om de ska tas upp |
| inv-3-sprint22-14-delbd | SPRINT_22_14_TAKTIK_UX Del B–D obekräftade (bara Del A belagd) | rapporterad | Code | INVENTERING_2026-08-31.md:89 | verifiera mot kod |
| inv-4-o12-forhandsdelta | O12 "förhandsdelta" (DOM_DOMINANS_OCH_FORHANDSDELTAN) skriven men aldrig byggd | rapporterad | Code | INVENTERING_2026-08-31.md:103 | verifiera mot kod |
| inv-4-forutsattningsfasen-steg2-blocker-stale | boardService.ts:640 säger felaktigt att steg 2 är blockerad — båda beroenden (aiTransferLog, standingsSnapshot) finns nu | rapporterad | Code | INVENTERING_2026-08-31.md:104 | verifiera mot kod, ta bort stale-kommentaren, bygg steg 2 |
| inv-4-forutsattningsfasen-kvittensrad | Förutsättningsfasens kvittensrad (BOARD_SEASON_ACKNOWLEDGMENT_PLACEHOLDER) fortfarande '[Opus]' | rapporterad | Opus | INVENTERING_2026-08-31.md:104 | Opus skriver texten |
| inv-4-meritbuffert-magnituder | Meritbuffertens föreslagna magnituder väntar Jacobs slutgiltiga dom (byggt, konstanterna obekräftade) | rapporterad | Jacob | INVENTERING_2026-08-31.md:107 | Jacob dömer magnituderna |
| inv-5-designko-d4-portal-orientering | D4 Portal-orienteringen/första-gången-rampen — enda öppna punkten i DESIGN-KO-2026-07-02.md | rapporterad | Opus | INVENTERING_2026-08-31.md:114 | Opus mockar, Code bygger |
| inv-5-fas1-icon-todos | 7 TODO(FAS 1)-markörer i koden pekar på överspelad ICON-BRIEF (Lucide-beslutet ersatte den) | rapporterad | Code | INVENTERING_2026-08-31.md:114 | städa eller dödmarkera markörerna |
| inv-5-fas4-klubbmarken | FAS 4 (12 klubbmärken) bara 3/12 klara | rapporterad | Opus | INVENTERING_2026-08-31.md:114 | Opus/Design fortsätter produktion, Code wirar |
| inv-5-fas5-portrattgenerator | FAS 5 (porträttgenerator) opåbörjad | rapporterad | Opus | INVENTERING_2026-08-31.md:114 | Opus/Jacob avgör prioritet |
| inv-5-handoff-resterande-tickets-stale | BACKLOG-raden om HANDOFF-RESTERANDE-TICKETS-2026-05-23 ("~10h Code spridda") är stale — redan utbetald | rapporterad | Code | INVENTERING_2026-08-31.md:116 | verifiera, stäng raden i BACKLOG |
| inv-6a-audit6-arkivera | docs/incoming/BANDY_MANAGER_AUDIT_6_SASONGER_2026-08-26.md redo för arkivering, aldrig flyttad | rapporterad | Code | INVENTERING_2026-08-31.md:122 | flytta till _arkiv-2026-08/ |
| inv-6b-rapport-ommatning-vagb-arkivera | docs/incoming/RAPPORT_OMMATNING_VAGB_ANSPRAK4_TRE_FYND_2026-08-30.md redo för arkivering | rapporterad | Code | INVENTERING_2026-08-31.md:122 | flytta till _arkiv-2026-08/ |
| inv-6c-manniskoupplevelse-audit-arkivera | docs/incoming/bandy-manager-manniskoupplevelse-audit-7024f8a-2026-08-24.md redo för arkivering | rapporterad | Code | INVENTERING_2026-08-31.md:122 | flytta till _arkiv-2026-08/ |
| inv-6d-skutskaer-audit-arkivera | docs/incoming/bandy-manager-skutskaer-audit-52009671-2026-08-20.md redo för arkivering | rapporterad | Code | INVENTERING_2026-08-31.md:122 | flytta till _arkiv-2026-08/ |
| inv-6e-auditsviten-pdf-arkivera | docs/incoming/bandy-manager-hela-auditsviten-5c9a7a8.pdf redo för arkivering | rapporterad | Code | INVENTERING_2026-08-31.md:122 | flytta till _arkiv-2026-08/ |
| inv-6f-github-synk-forutsattningsfasen-arkivera | docs/incoming/github-synk-forutsattningsfasen-2026-08-25.md redo för arkivering | rapporterad | Code | INVENTERING_2026-08-31.md:122 | flytta till _arkiv-2026-08/ |
| inv-6g-ytkarta-hallprovning-arkivera | docs/incoming/"Ytkarta - hallprövning & landslag" HTML redo för arkivering | rapporterad | Code | INVENTERING_2026-08-31.md:122 | flytta till _arkiv-2026-08/ |
| inv-6h-ytkarta-textpooler-arkivera | docs/incoming/"Ytkarta - tre textpooler" HTML redo för arkivering | rapporterad | Code | INVENTERING_2026-08-31.md:122 | flytta till _arkiv-2026-08/ |
| inv-6i-investigation-match-revenue-arkivera | docs/incoming/INVESTIGATION_MATCH_REVENUE_ECONOMY_2026-08-26.md redo för arkivering (fyndet redan löst) | rapporterad | Code | INVENTERING_2026-08-31.md:122 | flytta till _arkiv-2026-08/ |
| inv-6j-sparb-b4-b3-overifierat | SPAR-B-TEXTNIVAER: B4 (svitkort) och B3 (framåtkrok) overifierade mot kod — bara B5 täcks av DOM_SPARB_TEXTNIVAER | rapporterad | Code | INVENTERING_2026-08-31.md:124 | verifiera B4/B3 mot kod |
| inv-7-stashed-wip-commits | stash@{0} och stash@{1} — okänt innehåll, okänd ålder | rapporterad | Jacob | INVENTERING_2026-08-31.md:140 | Jacob avgör: poppa, granska, eller släng |

---

# KÄLLA: docs/BACKLOG.md (185 rader)

*(Harvested av en dedikerad agent, 2026-08-31, mot BACKLOG.md:s sektioner A–E + "BYGGT MEN OSYNLIGT" + "TVÅ LÄSARE, EN SANNING" + "DATAFÄLT SOM SAKNAS" + relevanta playtest-/KF-rader. Sektion F, CHANGELOG, "PRÖVAT OCH AVFÄRDAT", och alla ~~genomstrukna~~/STÄNGD/KLAR-rader uteslutna som redan stängda.)*

## Toppnoter

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| topp-stashade-wip | Två stashade WIP-commits (`stash@{0}`, `stash@{1}`) ligger kvar, ospårat vad de innehåller | rapporterad | Jacob | BACKLOG.md:7 | Jacobs beslut: poppa eller radera |
| audit-taptargetgate-failande | `tests/visual/tapTargetGate.visual.ts` failar i fyra tester ("SÄTT LAGET"-regressionen, alla viewportbredder), pre-existerande och otäckt | rapporterad | Code | BACKLOG.md:23 | verifiera mot kod (`npx playwright test`) |
| supporter-role-labels-tomma | `enumLabels.ts`s `SUPPORTER_ROLE_LABELS` (leader/veteran/youth/family) är tomma konstanter — OrtenTab renderar ingen rolletikett | rapporterad | Opus | BACKLOG.md:25 | Opus skriver klackens fyra rolletiketter |
| sponsor-motbud-saknas | Inget motbud-läge ("kräv mer") finns på sponsorerbjudanden — bara accept/reject; äkta tre-utfalls-förhandling är obyggd | rapporterad | Jacob | BACKLOG.md:25 | vänta Jacobs beslut om featuren ska byggas |
| incoming-atta-otriagerade | ~8 otriagerade filer kvar i `docs/incoming/` (auditer, rapporter, HTML-mockar, en PDF) | rapporterad | Code | BACKLOG.md:29 | triagera per sessionsstart steg 4 |
| press-win-comeback-lacka | `win_comeback`-taggade pressvar (`w_p5`, `cl10`) kan visas efter vinst utan att laget låg under vid paus — kräver sjätte eligibility-axel el. flytt till `generic:'none'` | rapporterad | Jacob/Opus | BACKLOG.md:31 | vänta Jacobs dom om axeln är värd att bygga |
| cupprocessor-standing-kvarlamnad | `cupProcessor.ts:49` läser live-tabellposition för cupbye-texten (alfabetiskt skräp före första ligamatch); medvetet kvarlämnad, kräver `SeasonSummary.finalPosition` eller rykte-baserad text | rapporterad | Jacob | BACKLOG.md:33, 197 | vänta Jacobs separata beslut |
| askadare-golvandel-generellt | Öppet om golv-andelen (50 % av driftskostnaden) ska höjas generellt för klubbar under ~500 i publik, eller om utfallet är avsett | rapporterad | Jacob | BACKLOG.md:45 | vänta Jacobs dom på golv-andelen |
| byggkort-upkeepcost-osynlig | `upkeepCost` visas aldrig i presentationslagret — varken nodkort eller finansieringssheet varnar för löpande driftskostnad | rapporterad | Jacob | BACKLOG.md:47 | vänta Jacobs beställning av fix |
| byggtrad-kiosk-utan-intakt | Byggträdets "Kiosk & servering" (`facilityNodes.ts:95-109`) lovar "Ekonomi ↑" men har noll intäktskoppling — bara `upkeepCost` dras | rapporterad | Jacob | BACKLOG.md:47 | vänta Jacobs beslut: koppla intäkt eller ta bort löftet |
| kiosk-namnkollision | Namnkollision mellan byggträdets "kiosk" och `communityActivities.kiosk` är en läsbarhetsrisk | rapporterad | Code | BACKLOG.md:47 | verifiera mot kod |
| youth-vs-senior-attributformel | `generateAttributes` vs `generateYouthAttributes` är två oberoende formler, aldrig jämförda; ~30 % gap för Heros, kompensation ej verifierad | rapporterad | Jacob | BACKLOG.md:49 | vänta Jacobs beslut om flersäsongssimulering |
| dubblettverktyg-otriagerat | `scripts/find-duplicate-functions.ts` har 71 kandidater, ej triagerade och ej CI-gate | rapporterad | Code | BACKLOG.md:51 | verifiera mot kod (kör revisionen) |
| o10-queryparam-clubselection | Query-param-läsning på club-selection (seed i länk) inte byggd | rapporterad | Code | BACKLOG.md:55 | vänta Jacobs bedömning innan kod |
| o10-delningskort-text | Delningskortet + frågan väntar på Opus-text | rapporterad | Opus | BACKLOG.md:55 | Opus skriver text |
| o10-ruleversion-notis | Mjuk ruleVersion-missmatch-notis inte byggd | rapporterad | Code | BACKLOG.md:55 | vänta Jacobs bedömning innan kod |
| cs-mecenat-sannolikhet-skalar-ej | Mecenatens flata 15 %/omgång-chans skalar inte med communityStanding (#4-#6) | rapporterad | Code | BACKLOG.md:60 | vänta Jacobs designbeslut |
| cs-patron-sannolikhetsrullning | `PATRON_EMERGE_CS=60` är binär (100 %/0 %) — en sannolikhetsrullning måste läggas till, inte bara tröskeln bytas; empiriskt spärren för Heros | rapporterad | Code | BACKLOG.md:60, 61 | vänta Jacobs designbeslut |
| cs-clubera-troskelbeslut | `clubEraService`s establishment/legacy-gränser (cs≥50/≥70, #9-#10) kan vara avsiktlig diskret upplåsning — kräver medvetet ja/nej | rapporterad | Jacob | BACKLOG.md:60 | vänta Jacobs ja/nej |
| mecenatrapport-tre-designfragor | Tre öppna designfrågor i `RAPPORT_MECENATGENERERING_2026-08-26.md` väntar innan kod skrivs | rapporterad | Jacob | BACKLOG.md:60 | vänta Jacobs svar |
| mecenat-patron-modellform | Per-omgångs-rullning konvergerar mot säkerhet över en karriär — kräver annan modellform (en rullning per säsong) el. mycket lägre tal | rapporterad | Jacob | BACKLOG.md:65 | vänta Jacobs dom på modellform |
| mecenat-patron-cs-happiness | Mecenat/patron-relationen är enkelriktad — ingen avhopps-/happiness-logik läser communityStanding; löpande cs-kopplad drift ej byggd | rapporterad | Code | BACKLOG.md:66 | vänta Jacobs beslut om spåret ska byggas |
| repmilestone-topp3-bonus | `reputationMilestoneService.ts` engångsbonus pos≤3 && cs>60 → +3 rykte, binär tröskel (#7) | rapporterad | Code | BACKLOG.md:67 | verifiera mot kod |
| repmilestone-botten-bonus | `reputationMilestoneService.ts` engångsbonus pos≥10 && cs<40 → −2 rykte, binär tröskel (#8) | rapporterad | Code | BACKLOG.md:67 | verifiera mot kod |
| m5-grindar-ej-i-ci | `minTextSizeGate.ts`/`minControlSizeGate.ts` är byggda men medvetet ej inkopplade i `npm run test:visual` | rapporterad | Jacob | BACKLOG.md:70 | vänta Jacobs scope-beslut (a/b/c) |
| m5-113-kontroller-skuld | 113 av 142 kontroller failar text-/kontrollstorleksgolven (12px/44px) över nästan varje skärm | rapporterad | Code | BACKLOG.md:70 | verifiera mot kod |
| decisioncards-likriktning | `DecisionCards`-komponentens visuella likriktning (alla korts enhetlighet, L4) är inte adresserad — bara den ena konkreta luckan | rapporterad | Opus | BACKLOG.md:74 | verifiera mot kod |
| scout-shortlist-transferfonster | Bevakad spelare som fortfarande är tillgänglig när transferfönstret stänger kan vara värd en rad — bygg när transferytorna ändå rörs | rapporterad | Code | BACKLOG.md:76 | verifiera mot kod |
| scouting-dev-scen-saknas | Scoutingfliken har ingen dev-scen — åttonde ytan utan visuell/kontrast-/tap-target-täckning | rapporterad | Code | BACKLOG.md:78 | verifiera mot kod |

## H4 Heros

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| h4-klippan-rotorsak-okand | Klippan mellan communityStanding 70 (95 % avsked) och 71 (10 %) är oförändrad efter fyra fixar; verklig rotorsak inte hittad | rapporterad | Jacob | BACKLOG.md:84 | vänta Jacobs beslut om instrumenterad omgång-för-omgång-utredning |
| h4-avskedsfrekvens-100-procent | Rögle/Heros står kvar på 100 % avsked genom sex raka fixar — oförklarat | rapporterad | Jacob | BACKLOG.md:92 | vänta Jacobs dom om H4 vilar |
| h4-ackumulator-magnituder | Ackumulatorns (`licenseRiskScore`) magnituder behöver dömas för att stänga H4 helt | rapporterad | Jacob | BACKLOG.md:94 | vänta Jacobs dom |
| ekonomiformler-rep55-utredning | Ej påbörjad utredning av `economyService.ts`s intäktsformler — delad ekonomisk skörhet för alla klubbar under rep ~55 | rapporterad | Code | BACKLOG.md:102 | vänta Jacobs prioritering |
| midtable-mislabeling | Söderfors 85 %/Lesjöfors 90 % avsked är mislabeling driven av boardPatience-formeln; vägen förklarad stängd | rapporterad | Jacob | BACKLOG.md:104 | verifiera mot kod |
| tva-licenssystem-osynkade | Två separata, osynkade licenssystem (`licenseReview` vs `checkLicenseStatus`) existerar sida vid sida | rapporterad | Code | BACKLOG.md:108 | verifiera mot kod |
| boardpatience-skala-kalibrering | `RUNNING_LOSS_EXPECTATION_MULTIPLIER`-skalan stoppad innan vidare kalibrering — siffrorna var en linje genom två mätpunkter | rapporterad | Jacob | BACKLOG.md:122 | vänta Jacobs dom på skalan |
| boardobjektiv-tier-steg2 | Steg 2 (gate:a `boardObjectiveService.ts`s objektivgenerering/kostnad per tier) inte byggd, inte utredd | rapporterad | Jacob | BACKLOG.md:124 | vänta Jacobs riktningsbeslut |
| varldsbilds-sektion-pausad | Världsbilds-sektionen (den pausade fasen) väntar; `RAPPORT_LIGARORELSER_ELVA_KLUBBAR` är underlaget | rapporterad | Jacob | BACKLOG.md:134 | vänta Jacobs prioritering |
| forutsattningsfas-steg2-blockerad | Förutsättningsfasens steg 2 (mellandelen, ligarörelser) blockerad tills `aiTransferLog`+`standingsSnapshot`-trend finns | rapporterad | Code | BACKLOG.md:136 | vänta ordern efter att datan byggts |
| boardassessment-kvittensrad-text | Styrelsens kvittensrad i `boardAssessment` är `'[Opus]'`-platshållare | rapporterad | Opus | BACKLOG.md:136 | Opus skriver text |
| offerselection-forlustdrivare | Nästa spår per Jacobs instruktion: `offerSelectionService` och vad som faktiskt driver förlusterna | rapporterad | Code | BACKLOG.md:140 | verifiera mot kod |
| ai-transferlogg | AI-transferlogg halvbyggd i `aiTransferService.ts`, kastas idag (~5 filer att strukturera) | rapporterad | Code | BACKLOG.md:141 | vänta Jacobs prioritering av kategori |
| ai-placeringstrend-diff | Placeringstrend gratis via `standingsSnapshot` — bara en diff-funktion saknas | rapporterad | Code | BACKLOG.md:141 | vänta Jacobs prioritering |
| ai-truppstyrka-snapshot | Truppstyrke-ögonblicksbild för AI-klubbar ej byggd | rapporterad | Code | BACKLOG.md:141 | vänta Jacobs prioritering |
| ai-tranarbyten-anlaggningar | Tränarbyten och anläggningar som AI-förändring ej genomförbara billigt; anläggnings-proxy avvisad som falsk siffra | rapporterad | Jacob | BACKLOG.md:141 | vänta Jacobs beslut |
| seasonendgameview-ordningsbugg | `generateSeasonSummary` läser `updatedClubs` medan `clubsAfterLicense` sparas — latent, aktiveras när ekonomi läggs i `standingsSnapshot` | rapporterad | Code | BACKLOG.md:141 | fixa samtidigt som ekonomi läggs till snapshot |
| wagebudget-aldrig-omraknad | `wageBudget` sätts en gång vid generering/spelstart och räknas aldrig om för någon klubb, trots att den spärrar kontraktsbeslut varje säsong | rapporterad | Jacob | BACKLOG.md:145 | vänta Jacobs beslut om formel |
| fanexpectation-dott-falt | `Club.fanExpectation` sätts en gång vid generering, skrivs aldrig igen, läses bara för visning i `OrtenTab.tsx:534` | rapporterad | Jacob | BACKLOG.md:147 | vänta Jacobs beslut: radera eller wira |

## BYGGT MEN OSYNLIGT / ONÅBART

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| lobbypress-mekanik-spec | `landslagText.ts`s `LOBBY_PRESS` är färdig text utan yta — kräver ny spec som definierar uttagningsmekaniken eller nedgraderar till flavour | rapporterad | Jacob/Opus | BACKLOG.md:166 | Opus skriver spec efter Jacobs val |
| batchstack-vilande | `BatchStack` byggd och wirad men ingen källa i kodbasen sätter `triggerGroupId` — mekanismen strukturellt onådd | rapporterad | Code | BACKLOG.md:167 | vänta en motiverad generator, verifiera mot kod |
| kritisk-eventkanal-undertypsprioritet | Alla fyra default-kritiska eventtyper har tomma `whyNow` och nedgraderas till normal — prioritet måste sättas per undertyp/instans | rapporterad | Opus/Code | BACKLOG.md:168 | verifiera mot kod |
| kritisk-eventkanal-kontraktstest | Kontraktstest som kräver minst en nåbar critical-produktionsinstans saknas | rapporterad | Code | BACKLOG.md:168 | verifiera mot kod |
| inboxtoportal-karriarsmilstolpe | `inboxToPortal.ts:126-128`s `Karriärsmilstolpe:`-gren har ingen producent — sannolikt helt onåbar, ej verifierad med simulering | rapporterad | Code | BACKLOG.md:170 | verifiera mot kod (grep efter producent) |
| o10-delbarhetsspar | Delbarhetsspåret (utmaningslänk/Bruksliga/jämförbar seed-körning) obyggt — det som skulle använda `ruleVersion` | rapporterad | Opus | BACKLOG.md:171 | verifiera mot kod |
| contractdemands-devscen | `/game/contract-demands` saknar dev-scen; ratchet-baslinjen höjd 7→8 | rapporterad | Code | BACKLOG.md:172 | bygg dev-scen när Opus text är låst |
| contractdemands-text | `SeasonContractDemandsScreen.tsx`s text är `[Opus]`-platshållare | rapporterad | Opus | BACKLOG.md:172 | Opus skriver text |
| klubbhistorik-rubrik-tvaklubb | Rubriken heter `Klubbhistorik` även vid tvåklubbskarriär — textfråga, Code rörde den inte | rapporterad | Opus | BACKLOG.md:173 | Opus dömer rubriken |
| careerbreak-devscen | `/game/career-break` saknar dev-scen; kräver `state`-prop + två-tre scener, ratchet-baslinjen höjd 8→9 | rapporterad | Code | BACKLOG.md:174 | bygg när Opus text är låst |
| careerbreak-text | Hela `CareerBreakScreen`s text (inkl. `careerBreakText.ts`) är `[Opus]`-platshållare | rapporterad | Opus | BACKLOG.md:173, 174 | Opus skriver text |
| peptalk-portalbeat-beslut | `pepTalkService.getPepTalk` (21 låsta repliker) är dödmarkerad utan konsument — designfråga om Portal ska ha peptalk som PortalBeat | rapporterad | Jacob/Opus | BACKLOG.md:175, 33 | vänta Jacobs designbeslut |
| b12-manpowerstate-utan-konsument | `Fixture.manpowerState` skrivs på varje MatchEvent men har noll konsumenter utanför matchCore/test | rapporterad | Opus | BACKLOG.md:176 | Opus skriver spec som pekar ut läsande yta |
| b12-tacticalfactors-utan-konsument | `Fixture.tacticalFactors` skrivs men har noll konsumenter utanför matchCore/test | rapporterad | Opus | BACKLOG.md:176 | Opus skriver spec som pekar ut läsande yta |
| b12-contributingfactors-utan-konsument | `Fixture.contributingFactors` skrivs men har noll konsumenter utanför matchCore/test | rapporterad | Opus | BACKLOG.md:176 | Opus skriver spec som pekar ut läsande yta |
| b12-origin-utan-konsument | `Fixture.origin` skrivs men har noll konsumenter utanför matchCore/test | rapporterad | Opus | BACKLOG.md:176 | Opus skriver spec som pekar ut läsande yta |
| fornyelse-pris-slutdom | Förnyelsepolicyn är −45 tkr/säsong mot att aldrig förnya — öppet om `ACTIVITY_RENEWAL_BASE_COST` ska ned ytterligare (0,80 mätt som konservativ återgång) | rapporterad | Jacob | BACKLOG.md:180 | vänta Jacobs slutdom på talet |
| seasondecision-mall-mecenat-konflikt | `seasonDecisionSentences.ts`s `MECENAT_CONFLICT_SIDE` är tom mall — årsboken faller tillbaka på "Inget beslut stack ut" | rapporterad | Opus | BACKLOG.md:181 | Opus fyller konstanten ({backed}/{other}) |
| seasondecision-mall-captain-takecharge | `CAPTAIN_TAKE_CHARGE` är tom mall | rapporterad | Opus | BACKLOG.md:181 | Opus fyller konstanten ({captain}/{last}) |
| seasondecision-mall-captain-support | `CAPTAIN_SUPPORT` är tom mall | rapporterad | Opus | BACKLOG.md:181 | Opus fyller konstanten ({captain}/{last}) |
| seasondecision-mall-facility-build | `FACILITY_BUILD` är tom mall | rapporterad | Opus | BACKLOG.md:181 | Opus fyller konstanten ({facility}/{cost}) |

## TVÅ LÄSARE, EN SANNING + fältfamiljer

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| form-etikett-spelarform | `FormStatusMinimal`s etikett "Form" är sann om attributet, falsk om laget — ska bytas till "Spelarform" | rapporterad | Code | BACKLOG.md:195 | verifiera mot kod |
| form-vof-rad | Separat rad "Form: V O F" med de fem senaste resultaten ska läggas till | rapporterad | Code | BACKLOG.md:195 | verifiera mot kod |
| managerfired-vag-osynlig | Tre oberoende avskedsvägar bakom samma `managerFired`-flagga; ingen yta förklarar vilken som utlöstes | rapporterad | Code | BACKLOG.md:196 | verifiera mot kod |
| cup-forlangning-fel-yta | Minst en cup-yta påstår match "över vid 5-5" utan att gå via `deriveUtfall()`; vilken av 38 kandidatfiler är oidentifierad | rapporterad | Code | BACKLOG.md:201 | verifiera mot kod (grep-plan i raden) |
| mostimproved-sasongsstartsnapshot | `mostImproved` kan inte event-sourcas utan en ny lagrad säsongsstarts-trupp-snapshot; missar spelare som förbättrades och sen såldes | rapporterad | Code | BACKLOG.md:203 | verifiera mot kod |
| mutationgate-filgrind-rackvidd | `tests/grind/mutationVerificationGate.ts` skyddar bara `seasonDecisionCaptureService.ts`s BUILDERS-register — NÄR-mutation-arten är inte kategoriskt täckt | rapporterad | Code | BACKLOG.md:207 | verifiera mot kod |
| talentsearch-createdround-latent | `TalentSearchRequest.createdRound` skrivs i roundNumber-skala men läses aldrig — latent fälla om en matchday-läsare läggs till | rapporterad | Code | BACKLOG.md:235 | verifiera mot kod |
| riskysponsor-acceptedround-unused | `SaveGame.riskySponsorContract.acceptedRound` är write-only, aldrig läst | rapporterad | Code | BACKLOG.md:236 | verifiera mot kod |
| akademi-uppflyttning-inboxrad | `academyActions.ts:272`s inbox-rad ("vänt på ett par uppkallningar") påstår en handling som `roundsReadyForPromotion` inte mäter — ny formulering skickad till Jacob | rapporterad | Jacob/Opus | BACKLOG.md:248 | vänta Jacobs nya formulering |

## DATAFÄLT SOM SAKNAS + påståendekartan

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| tenure-falt-joinedclubseason | "År i klubben" går inte att härleda; `joinedClubSeason?: number` på Player ej byggt trots tre oberoende efterfrågningar | rapporterad | Jacob | BACKLOG.md:260, 262 | vänta Jacobs beslut om egen spec |
| o18-personrad-tenure-vagg | O18 fält 3 (`SeasonSummary.personChange`, "{Namn} la av efter {N} säsonger") kommer träffa samma saknade tenure-fält när den byggs | rapporterad | Opus | BACKLOG.md:260 | verifiera mot kod |
| pastaendekartan-43-forlorade | 22 av 40 runda-2-fynd ur påståendekartans 55 blev aldrig itemiserade — råa listan förlorad i kontext | rapporterad | Opus | BACKLOG.md:282 | verifiera vilken lista en framtida spec citerar |

## PLAYTEST-RUNDA 2026-07-10

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| pt2-liga-advance-otestad | Advance-flytten är otestad för LIGA (tabelluppdatering, season_done, playoff-status är egen kodväg) | rapporterad | Jacob | BACKLOG.md:296 | Jacob spelar ligamatch live→Granska + sim→Granska |
| pt6-nedslackning-timing | Nedsläckning av matchhändelser går för långsamt i live-flödet | rapporterad | Design | BACKLOG.md:300 | verifiera mot kod (timing-just) |

## A. AKTIVA SPRINTAR

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| m14-publikhistorik-token | Textauditens vilande rest M14 (publikhistorik-token) väntar på en funktion som inte finns än | rapporterad | Opus | BACKLOG.md:346 | verifiera mot kod |
| m50-clubofferquotes | Textauditens vilande rest M50 (`clubOfferQuotes`) väntar på en funktion som inte finns än | rapporterad | Opus | BACKLOG.md:346 | verifiera mot kod |
| forsoning-1-sync | Försoningssprintens §1: sex systempatch-filer ska in i `design-system/` före all kod | rapporterad | Code | BACKLOG.md:353 | verifiera mot kod |
| forsoning-forbered-wiring | `phase="forbered"` är definierad men orenderd — Förbered-wiring mot `design_forbered_trupp_slots.html` kvar | rapporterad | Code | BACKLOG.md:354 | verifiera mot kod |
| forsoning-3-fixordning | Försoningssprintens §3 fix-ordning 🟥→🟧→🟨 (D3 inline-stratum-migreringen med ratificerade regler) | rapporterad | Code | BACKLOG.md:355 | verifiera mot kod |
| forsoning-5-omfotografering | §5 verifiering: Jacob fotar om, Design re-auditar (grön/kvarstår) | rapporterad | Jacob | BACKLOG.md:357 | Jacob fotar om |
| forsoning-5-adherence-regler | §5: fem nya hårda regler ska in i `_adherence`-linten | rapporterad | Code | BACKLOG.md:357 | verifiera mot kod |
| b1-efter-forsoningen | B1 följer efter försoningen; datamodellen (B-tabellen) klar att köra i valfri Code-glugg | rapporterad | Code | BACKLOG.md:363 | verifiera mot kod |
| nodtrupp-playtest | Nödtrupp soft-lock (`62394aa4`) byggd men saknar playtest-verifiering (dev-skada 3 → nödtrupp-kort → spelbar; walkover-dead-end) | rapporterad | Jacob | BACKLOG.md:386 | Jacob playtestar |
| ceremoni-heron-glanstitt | Ceremoni-heron emoji→Lucide (`b9624b6`) kunde inte headless-screenshotas — perception-tung, väntar glans-titt | rapporterad | Jacob | BACKLOG.md:387 | Jacob tittar vid genomspelning |
| inkorg-ikoner-lucide | `InboxScreen.tsx`s `inboxTypeIcon` är fortfarande emoji (⇄ ⧀ 🏋 🏛 🔍) — hör till emoji→Lucide-svepet | rapporterad | Code | BACKLOG.md:388, 404 | verifiera mot kod |
| c1-sasong2-kurering-beslut | Beslut kvar: ska säsong-2-start ingå i endgame-kureringen eller ej (otydlig detektion) | rapporterad | Jacob | BACKLOG.md:389 | vänta Jacobs beslut |
| clubmemory-facility-built-sasong | `clubMemoryService.ts`s `facility_built`-minnen läser inte `builtSeasons` — "X stod klart [säsong]" saknas i Krönikan | rapporterad | Code | BACKLOG.md:390 | verifiera mot kod |
| pitch-komponent-hopslagning | Två separata pitch-implementationer (BandyPitch + FormationView-pitchen) ska slås ihop till en delad komponent | rapporterad | Code | BACKLOG.md:391 | verifiera mot kod |
| valet-ui-eriks-oga | Valet-UI väntar på Eriks öga (playtest-nivå residual) | rapporterad | Jacob | BACKLOG.md:403 | playtest |
| hall-kommun-nej-onabart | Hall-prövningens kommun-NEJ-utfall är onåbart — kommunen säger alltid ja (06-12 §3) | rapporterad | Jacob | BACKLOG.md:161, 403 | playtest/verifiera mot kod |
| hall-debatt-handler-gammal | Gamla `hall_`-debatt-handlern lever kvar i eventResolver som öppen flagga | rapporterad | Code | BACKLOG.md:161 | verifiera mot kod |
| b1-nodstat-konsekvensrad | Mockens nodstater/konsekvensrad i B1-klubbutvecklingsträdet är ej detaljverifierade mot kod | rapporterad | Jacob | BACKLOG.md:403 | Jacobs nästa genomspelning |
| semafor-emoji-svep | Verifiera att inga semafor-emoji (🔴🟡⚪) lever kvar någonstans — severity-dots ska vara CSS | rapporterad | Code | BACKLOG.md:411, 476 | verifiera mot kod |
| severity-skala-alla-ytor | Severity-skalans enforcement över ALLA ytor är ej re-verifierad (bara huvudytan inkorgen) | rapporterad | Code | BACKLOG.md:411 | verifiera mot kod |
| ekonomitab-inline-styles | EkonomiTab ~80 inline-styles ska till `economy.css` (rest på span-nivå) | rapporterad | Code | BACKLOG.md:418, 419 | verifiera mot kod |
| clubscreen-tab-emoji-konsekvens | Tab-emoji/tabDescription-konsekvens i ClubScreen — rena text-tabs eller alla emoji | rapporterad | Design | BACKLOG.md:418 | verifiera mot kod |
| transfers-modaler-ledgervokabular | BidModal/RenewContractModal ska få ledger-vokabulär (designidé, öppen fråga) | rapporterad | Opus/Jacob | BACKLOG.md:418, 419 | vänta Jacobs beslut |
| orten-pilar-playtest | Playtest kvar: Orten-pilar + status för redan-aktiva engagemang | rapporterad | Jacob | BACKLOG.md:419 | Jacob playtestar |
| incoming-raderas-gitrm | `docs/incoming/_RADERAS/*` väntar på Jacobs `git rm` | rapporterad | Jacob | BACKLOG.md:428, 469 | Jacob kör git rm |
| avbrottsbudget-d | Spelkänslans §D avbrottsbudget gated på `interruptClassifier`-wiring + Jacobs policybeslut (budget gallrar beslut ej narrativa band) | rapporterad | Jacob | BACKLOG.md:430, 467 | vänta Jacobs policybeslut |
| maskinell-audit-expansion | `MASKINELL-AUDIT-EXPANSION-2026-06-07`: Playwright-snapshot-CI + headless-galleri-täckning ej bekräftad byggd | rapporterad | Code | BACKLOG.md:464 | verifiera mot kod |
| fable-scen-konst | `BESTALLNING_FABLE_SCEN_KONST` är IN PROGRESS — Erik ritar cup/derby/premiär/nyår | rapporterad | Jacob | BACKLOG.md:462 | vänta Eriks leverans |
| scoreboard-b1-kommentar-token | `ScoreboardStalvallen.tsx`s fil-toppskommentar säger "copper/steel" (föråldrad) och decision-texten namnger `--led-score` medan koden har `--led-red` | rapporterad | Code | BACKLOG.md:481 | verifiera mot kod |
| emoji-svep-contentgrep | Fullständig emoji→Lucide-svep-lista kräver content-grep (🏒 m.fl. återstår som ytor) | rapporterad | Code | BACKLOG.md:483 | verifiera mot kod |
| b6-buryfen-footer-logo | Bury Fen-footern är text, inte logo; logon används en andra gång i IntroSequence S1 | rapporterad | Design | BACKLOG.md:485 | verifiera mot kod |
| forsoningskarta-saknas-i-repo | `audits/FORSONINGSKARTA-KONSOLIDERAD-2026-06-10.md` finns inte i repot — A-listan kan inte göras fynd-för-fynd | rapporterad | Opus | BACKLOG.md:488 | verifiera mot kod |
| bygget-flik-tillbakapil | Playtest-blick: Bygget-fliken som destination utan tillbaka-pil | rapporterad | Jacob | BACKLOG.md:508 | Jacob verifierar visuellt |
| hallprovning-processteg-opusrunda | Prövningens processteg väntar Opus mekanik-låsning (kostnad/risk/beslut per steg) — egen Opus-runda, ej gjord | rapporterad | Opus | BACKLOG.md:509 | Opus kör mekanikrundan |
| valet-finansiering-underfraga | Öppen underfråga: tar Valet bara noden (finansiering som sub-steg i fliken) eller väljer ceremonin även finansiering | rapporterad | Opus | BACKLOG.md:509 | avgörs när komponenten byggs |
| spelarkort-oversikt-konformering | Strukturbeslut 1: konforma Spelarkortets Översikt till mocken (flytta dynamiska celler till Säsong/Karriär) eller behåll rikare | rapporterad | Jacob | BACKLOG.md:514 | vänta Jacobs val |
| taktik-kemilager | Strukturbeslut 3: bygg kemilinjer som opacity-lager på formationen nu, eller behåll separat ChemistryView-toggle | rapporterad | Jacob | BACKLOG.md:514, 391 | vänta Jacobs val |

## B. SPECCAT KLART, VÄNTAR BYGGE

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| b1-facilitytrad-domanmodell | B1: facility-trädets domänmodell — inget beroende, redo för Code | rapporterad | Code | BACKLOG.md:529 | verifiera mot kod |
| b1-sasongsplanering | B1: säsongsplanering ej byggd | rapporterad | Code | BACKLOG.md:529 | verifiera mot kod |
| b1-loneeskalering | B1: löneeskalering ej byggd | rapporterad | Code | BACKLOG.md:529 | verifiera mot kod |
| b1-kontextuella-sponsorer | B1: kontextuella sponsorer som del av klubbutvecklingspaketet | rapporterad | Code | BACKLOG.md:529 | verifiera mot kod |
| b1-halvarsrapport | B1: halvårsrapport ej byggd | rapporterad | Code | BACKLOG.md:529 | verifiera mot kod |
| b1-halldebatt-flersasong | B1: halldebatt som flersäsongsprocess | rapporterad | Code | BACKLOG.md:529 | verifiera mot kod |
| b1-preseason-ui-och-sprint2-5 | B1 steg (2) PreSeason-beslutets UI + resten, och (3) sprint 2–5, byggs i tur efter domänmodellen | rapporterad | Code | BACKLOG.md:529 | verifiera mot kod |
| c-t3-akademiflik | C-T3 akademi-flik, i B1:s scope | rapporterad | Code | BACKLOG.md:529 | verifiera mot kod |
| c-t4-firstcap-event | C-T4 First Cap-event, i B1:s scope | rapporterad | Code | BACKLOG.md:529 | verifiera mot kod |
| c-t5-externa-akademier | C-T5 externa akademier scoutbara, i B1:s scope | rapporterad | Code | BACKLOG.md:529 | verifiera mot kod |
| c-t6-skolsamarbete | C-T6 akademi-skolsamarbete, i B1:s scope | rapporterad | Code | BACKLOG.md:529 | verifiera mot kod |
| b2-ej-byggd | B2 verifierad mot kod 2026-05-21 — ej byggd | rapporterad | Code | BACKLOG.md:531 | verifiera mot kod |
| b4-designdel-ej-gjord | B4:s design-del ej gjord sedan auditen | rapporterad | Design | BACKLOG.md:531 | verifiera mot kod |

## C. IDÉER UTAN SPEC

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| c-o1sp1-kontextuella-sponsorer | O1:s sponsorkonflikt är 4/5 av varsel-mallen; kontextuella sponsorer med stabila namn är onåbara som rival p.g.a. kategori-namnrymd | rapporterad | Opus | BACKLOG.md:541 | designbeslut om kategori-brygga före estimat |
| c-hist1-klubbhistorik-berattelse | HistoryScreen bär bara `narrativeSummary` per säsong — ingen storyline/beslut/båge avläsbar i återblick | rapporterad | Opus | BACKLOG.md:547 | designbeslut om omfattning före spec |
| bb-viz1-winprobkurva | Bandy Brains första grafik (win-prob-kurva ur Finding 060) — paradigmval om sajten ska ha grafik alls | rapporterad | Jacob | BACKLOG.md:553 | vänta Jacobs/Designs beslut OM |
| c-m2-hornfrekvens | Hörnor/match 16,8 mot target 17,72 (−5,2 %) — underproduktion i hörnfrekvens | rapporterad | Code | BACKLOG.md:561 | bevaka till nästa kalibreringsrunda |
| c-m2-ht2-andel | Andel mål i andra halvlek 52,4 % mot target 54,2 % (−1,8 pp) | rapporterad | Code | BACKLOG.md:561 | bevaka till nästa kalibreringsrunda |
| c-m2-malkap-spike | `MATCH_TOTAL_GOAL_CAP = 17` ger icke-organisk spike: 3,7 % av matcher slutar på exakt 17 | rapporterad | Code | BACKLOG.md:561 | bevaka, åtgärda inte reflexmässigt |
| c-m3-momentumriktning | Motorn mean-reverterar (utökningsgrad 47,7 % sim mot 55,0 % verkligt) — `EQUALIZE_MOMENTUM` boostar fel lag | rapporterad | Jacob | BACKLOG.md:562 | vänta Jacobs designbeslut |
| c-m3-capartefakt | `MATCH_GOAL_DIFFERENCE_CAP = 6` gör att motståndaren svarar i 100 % av fallen vid +6 mål | rapporterad | Jacob | BACKLOG.md:562 | vänta Jacobs designbeslut |
| fraga-b-trotthetsbaslinje | Fråga B (trött match 2 mot utvilad match 2) är fortfarande otestad — baslinjen saknas | rapporterad | Code | BACKLOG.md:580 | verifiera mot kod/mätning |
| c-ft1-fitnessfloor-tuning | Kvar på C-FT1 är ren tuning av `AI_FITNESS_FLOOR=40`/`AI_REPLACEMENT_MIN_FITNESS=60`/`AI_ROTATION_CA_TOLERANCE=8`, playtest-informerad | rapporterad | Jacob | BACKLOG.md:586 | Jacob playtestar, sedan tuning |
| c-sp5-smfinal-skarv | SM-final-uppspelets skarv: svart panel på grå bakgrund ger hårt skarvband | rapporterad | Design | BACKLOG.md:599 | verifiera mot kod |
| c-fm1-formationer-fotboll | Formationerna (5-3-2, 4-3-3, 3-4-3) är fotbollsformationer, inte bandy — öppen fråga om de ska bli bandy-äkta | rapporterad | Jacob | BACKLOG.md:607 | vänta Jacobs beslut (rör motorn) |
| c-v1-opponentform-tomt | OpponentForm-kortet känns tomt/ihoppressat | rapporterad | Design | BACKLOG.md:608 | verifiera mot kod |
| rest-gold-tokens | Resterande-ticket: gold-tokens (~5 min Code/CSS) | rapporterad | Code | BACKLOG.md:615 | verifiera mot kod |
| rest-smfinalprimary-guld | Resterande-ticket: SMFinalPrimary fel guld (~1h) | rapporterad | Code | BACKLOG.md:615 | verifiera mot kod |
| rest-simsummary-tokens | Resterande-ticket: SimSummary tokens (~15 min) | rapporterad | Code | BACKLOG.md:615 | verifiera mot kod |
| rest-crossfade-csp5 | Resterande-ticket: C-SP5 crossfade (~1h) | rapporterad | Code | BACKLOG.md:615 | verifiera mot kod |
| rest-dst1-tokensdoc | Resterande-ticket: D-ST1 tokens-doc (~1h) | rapporterad | Code | BACKLOG.md:615 | verifiera mot kod |
| rest-klubbminne-css | Resterande-ticket: klubbminne-CSS (~3h) | rapporterad | Code | BACKLOG.md:615 | verifiera mot kod |
| rest-transfers-refaktor | Resterande-ticket: transfers-refaktor | rapporterad | Code | BACKLOG.md:615 | verifiera mot kod |
| c-sy1-pilot2-journalistmemory | C-SY1 Pilot 2 (csPress orsakskrok) väntar på `journalist.memory`-strukturbyte, egen Code-runda | rapporterad | Code | BACKLOG.md:625 | verifiera mot kod |
| c-sy1-portalhierarki | C-SY1: Portal-hierarki-justering kvar | rapporterad | Design/Code | BACKLOG.md:625 | verifiera mot kod |
| c-sy1-pilot1-playtest | C-SY1 Pilot 1 väntar playtest före skalning till fler pools | rapporterad | Jacob | BACKLOG.md:625 | Jacob playtestar |
| c-k1-lobbypress-decision | C-K1 v2: LobbyPress-decision parkerad tills lobby-systemet prioriteras | rapporterad | Jacob | BACKLOG.md:632 | vänta Jacobs prioritering |
| c-k1-firstcallup-memoryevent | C-K1 v2: first-callup MemoryEvent (sig 60) parkerad | rapporterad | Code | BACKLOG.md:632 | vänta Jacobs prioritering |
| c-t8-signon-bonus | C-T8 förhandlings-utbyggnad: sign-on bonus | rapporterad | Opus | BACKLOG.md:638 | spec krävs |
| c-t8-boendebidrag | C-T8: boendebidrag (bandyspecifikt — klubbarna ordnar lägenheter) | rapporterad | Opus | BACKLOG.md:638 | spec krävs |
| c-t8-jobbgaranti | C-T8: jobbgaranti (semi-pro) | rapporterad | Opus | BACKLOG.md:638 | spec krävs |
| c-t8-imagerights | C-T8: image rights för lokala sponsoringansikten | rapporterad | Opus | BACKLOG.md:638 | spec krävs |
| c-t11-hantera-bud-tom | "Hantera bud → inga öppna bud": CTA lovar handling, ger tomhet — dölj vid 0 bud eller led vidare | rapporterad | Code | BACKLOG.md:639 | verifiera mot kod |
| c-t11-nudges-pa-portalen | Transfer-nudges bor i transfers-fliken, inte på portalen där spelaren lever | rapporterad | Design | BACKLOG.md:639 | verifiera mot kod |
| c-t11-marknad-passivitet | Marknaden är död vid passivitet — inget händer över tid (rykten, enstaka spelare) | rapporterad | Opus | BACKLOG.md:639 | spec krävs |
| c-tr1-klackfavoritchip | Klack-favorit-chip (Tier 1B) kräver ny `'klack'`-typ i narrativeLog eller `isKlackFavorite`-flagga | rapporterad | Opus | BACKLOG.md:645 | vänta Klack-narrativ-prioritering |
| int-1-stora-bagarna | De stora bågarna saknas — ingen dragning framåt över säsonger (= B1 lång-loopen) | rapporterad | Code | BACKLOG.md:659 | bygg B1 |
| int-2-integrationsinventering | Integrations-/renderingsyte-inventering: verifiera för varje innehållsproducerande system att det avfyrar med rätt data och når skärmen | rapporterad | Code | BACKLOG.md:660 | verifiera mot kod |

## KF. SYSTEMKARTANS FYND

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| kf4-styrelse-playtest | KF4 styrelse-konsolidering byggd men "awaiting playtest-verification" — namn/pronomen i ArrivalScene S1 + BoardMeetingScene S2+ | rapporterad | Jacob | BACKLOG.md:674 | Jacob playtestar |
| kf8-fanmood-kalibrering | KF8 fanMood byggd; kvar är kalibrering mot nästa genomspelning (06-18-spec §B punkt 3) | rapporterad | Jacob | BACKLOG.md:672 | Jacob genomspelar |
| kf3-imminentskydd-vilande | Imminent-skyddet i beslutsbudgeten är scaffoldat men vilande — aktiveras först om GameEvent får `expiresRound` | rapporterad | Code | BACKLOG.md:673 | verifiera mot kod |
| kf3-beslutsbudget-playtest | KF3 playtest kvar: 4+ beslut samma omgång → 3 surfar, kortet visar kö, nästa omgång dräneras vid resolve | rapporterad | Jacob | BACKLOG.md:673 | Jacob playtestar |

## D. PARKERADE

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| d-o5-avveckla-nod | Avveckla en byggd anläggningsnod — domänlogiken trivial men ny interaktiv yta saknar mock (Princip 4) | rapporterad | Opus/Design | BACKLOG.md:689 | Opus/Design mockar avvecklingsflödet |
| a15pp-rotorsak-tomma-events | A1.5++: rotorsak till varför matchSimulator/matchEngine genererar events med tomt `commentary`, så fallbacken blir död kod | rapporterad | Code | BACKLOG.md:691 | verifiera mot kod |
| d-st1-seasonaltone-tokens | `seasonalTone` har egna hex-värden vid sidan av token-systemet — ska tonen bli riktiga design tokens | rapporterad | Design | BACKLOG.md:693 | vänta designsession |
| d4-portalorientering | Portal-orienteringen / första-gången-rampen (onboarding), brief skriven, väntar Design | rapporterad | Design | BACKLOG.md:695 | trigger: Design fri efter audit |
| d-evt1-eventprimary-overlay | `EventPrimary` konkurrerar om Portal-primary-platsen även när samma kritiska event tvingar fram EventOverlay — ingen koordinering mellan kortbags- och skal-lagret | rapporterad | Code | BACKLOG.md:697 | verifiera mot kod vid nästa portalBuilder-omtag |
| d-dedup1-fixture | Entitets-dedup-grinden saknar `data-entity-id`-täckning för fixture | rapporterad | Code | BACKLOG.md:698 | vänta konkret dubbelrenderings-fynd |
| d-dedup1-spelare | Entitets-dedup-grinden saknar täckning för spelare (legitima multi-render-fall måste avgöras först) | rapporterad | Code | BACKLOG.md:698 | vänta konkret fynd |
| d-dedup1-styrelsemal | Entitets-dedup-grinden saknar täckning för styrelsemål (boardObjectives) | rapporterad | Code | BACKLOG.md:698 | vänta konkret fynd |
| d-rc-b-roundtrip-test | T3 save round-trip-test (export→reimport→ekvivalens + gammal-version-fixtur→migrateSaveGame) finns inte generiskt | rapporterad | Code | BACKLOG.md:699 | verifiera mot kod |

## E. TEKNISK SKULD

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| e-m24-1-ej-committat | `mediaService.ts`s streak-fönster-fix (obegränsad svit + matchday-sortering, 3 nya tester) är gjord men **ej committad** | rapporterad | Code | BACKLOG.md:709 | verifiera mot kod / committa |
| e-scripts1-master | 15 filer med 106 typfel i `scripts/` är ratchet-exkluderade i `tsconfig.scripts.json` | rapporterad | Code | BACKLOG.md:720 | verifiera mot kod |
| e-scripts1-tacticenum | Tactic-enumliteraler i data-warehouse/generate+validate, calibrate*, measure_htlead*, compare-modes — troligen kosmetiskt, ej verifierat fall för fall | rapporterad | Code | BACKLOG.md:720 | verifiera mot kod |
| e-scripts1-saknade-falt | Saknade obligatoriska Player/PlayerAttributes/Fixture-fält i measure_structure, measure_style, fatigue-vs-fresh-test — bara cornerRecovery bekräftat ofarlig | rapporterad | Code | BACKLOG.md:720 | verifiera mot kod |
| e-scripts1-sprint26audit | `sprint26_audit.ts` har helt trasiga importvägar (`./src/...` → `scripts/src/...`) — död/oanvändbar sedan okänt datum | rapporterad | Code | BACKLOG.md:720 | verifiera mot kod |
| e-scripts1-null-missmatch | null/undefined-missmatchning i `measure_sp6_interrupts.ts` | rapporterad | Code | BACKLOG.md:720 | verifiera mot kod |
| e-m4-1-playerpickersheet | `PlayerPickerSheet.tsx` ej migrerad till `Overlay`-primitiven | rapporterad | Code | BACKLOG.md:725 | verifiera mot kod |
| e-m4-1-klubbparmoverlay | `KlubbparmOverlay.tsx` ej migrerad till `Overlay` | rapporterad | Code | BACKLOG.md:725 | verifiera mot kod |
| e-m4-1-efterklangthreadmodal | `EfterklangThreadModal.tsx` ej migrerad till `Overlay` | rapporterad | Code | BACKLOG.md:725 | verifiera mot kod |
| e-m4-1-anslagoverlay | `AnslagOverlay.tsx` ej migrerad till `Overlay` | rapporterad | Code | BACKLOG.md:725 | verifiera mot kod |
| e-m4-1-bidmodal | `BidModal.tsx` ej migrerad till `Overlay` | rapporterad | Code | BACKLOG.md:725 | verifiera mot kod |
| e-m4-1-renewcontractmodal | `RenewContractModal.tsx` ej migrerad till `Overlay` | rapporterad | Code | BACKLOG.md:725 | verifiera mot kod |
| e-m4-1-wageoverrunwarning | `WageOverrunWarning.tsx` ej migrerad till `Overlay` | rapporterad | Code | BACKLOG.md:725 | verifiera mot kod |
| e-m4-1-bottomdock | `BottomDock.tsx` ej migrerad till `Overlay` | rapporterad | Code | BACKLOG.md:725 | verifiera mot kod |
| e-m4-1-onclick-div-sweep | `onClick=` på `<div` i presentationslagret ej svept till button/role=button (FacilityTree.tsx:171 nästa mest uppenbara) | rapporterad | Code | BACKLOG.md:725 | verifiera mot kod |

---

# KÄLLA: docs/SLUTTEST_KO.md (231 rader)

*(Harvested av en dedikerad agent, 2026-08-31, ur hela filen — 1272 rader, lästa i 30 sekventiella chunkar. Fyra rader nedan är interna statusmotsägelser i källdokumentet självt — samma sak påstås både klar och öppen på olika ställen; skördade som öppna eftersom ingen post ärver `verifierad` av att en rapport påstod det.)*

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| sluttest-ah4a-akademirader | A-H4a:s akademirader kunde inte wiras — ingen andra bugg hittad, kräver konkret rad/skärmdump från revisionen | rapporterad | Jacob | SLUTTEST_KO.md:43 | vänta Jacobs rad/skärmdump |
| sluttest-ah4b-survive-text | 11 `[Opus]`-platshållare kvar, huvudsakligen `ClubExpectation.Survive` utan låst text på tre säsongsövergångsytor | rapporterad | Opus | SLUTTEST_KO.md:44 | verifiera mot kod |
| sluttest-ah4b-styrelseobjektiv-text | Ny styrelseobjektiv-typ saknar låst svensk text (del av A-H4b:s platshållarlista) | rapporterad | Opus | SLUTTEST_KO.md:44 | verifiera mot kod |
| sluttest-ah2-anspak4-kostnad | Öppen BACKLOG-rad: pressa förnyelsekostnaden i anspåk 4 lägre (Opus rek: låt stå) | rapporterad | Jacob | SLUTTEST_KO.md:83 | vänta Jacobs balansbeslut |
| sluttest-ah2b-commit | A-H2b markerad stängd men "väntar bara commit — inget incheckat ännu" | rapporterad | Code | SLUTTEST_KO.md:84 | verifiera mot kod |
| sluttest-afac-traningshall | Träningshallens `consequences[]`-löfte "Ungdomarna väljer att stanna" orört — ingen dom gavs för den specifikt | rapporterad | Jacob | SLUTTEST_KO.md:94 | vänta Jacobs dom per nod |
| sluttest-agrind-skelett | A-GRIND: `consequences[]`-skelett (typ + migrering + grind, ~200-260 rader) rapporterat men ej byggt | rapporterad | Code | SLUTTEST_KO.md:95 | verifiera mot kod |
| sluttest-am8-avsked-karriar | A-M8: avsked avslutar karriären (= O13, tränarmarknaden) — status `EJ` | rapporterad | Code | SLUTTEST_KO.md:97 | verifiera mot kod |
| sluttest-am9-finaluppladdning | A-M9: samma finaluppladdning två raka finaler — status `EJ` | rapporterad | Code | SLUTTEST_KO.md:98 | verifiera mot kod |
| sluttest-ah9-builders | Årsbokens BUILDERS är fortfarande sluten mängd (8 par); äkta vidgning kräver nya Jacob-skrivna meningsmallar | rapporterad | Jacob | SLUTTEST_KO.md:99 | vänta Jacobs meningsmallar |
| sluttest-audit-orsak-verkan | Auditens nästa produktordning: orsak/verkan-synlighet — ej påbörjad | rapporterad | Code | SLUTTEST_KO.md:18 | verifiera mot kod |
| sluttest-audit-repetition | Auditens nästa steg: mindre repetition (bandyspråket B + eligibility-separation) — ej påbörjad | rapporterad | Code | SLUTTEST_KO.md:18 | verifiera mot kod |
| sluttest-audit-mer-innehall | Auditens sista steg: mer innehåll — ej påbörjat | rapporterad | Opus | SLUTTEST_KO.md:18 | verifiera mot kod |
| sluttest-b5-referat-vokabular | Rättvänd/felvänd och spelsättsorden i matchREFERAT väntar fortfarande på B12-konsumenterna | rapporterad | Code | SLUTTEST_KO.md:112, 1151 | verifiera mot kod |
| sluttest-o3-seasongoaltype-none | "Inget särskilt i år"-raden onåbar utan `SeasonGoalType`-utökning ('none'-variant) | rapporterad | Jacob | SLUTTEST_KO.md:141, 976 | vänta Jacobs beslut om typutökning |
| sluttest-o4-motstandaranalys | Burnout-effekten "motståndaranalysens detaljnivå" medvetet ej byggd | rapporterad | Code | SLUTTEST_KO.md:143, 1001 | verifiera mot kod |
| sluttest-o4-inkorgsprioritering | Burnout-effekten "inkorgsprioritering" medvetet ej byggd | rapporterad | Code | SLUTTEST_KO.md:143 | verifiera mot kod |
| sluttest-o4-fordrojda-betyg | Burnout-effekten "fördröjda spelarbetyg" kräver ny mekanik + designbeslut (hur länge, vad visas) | rapporterad | Jacob | SLUTTEST_KO.md:143, 1003 | vänta Jacobs mekanikbeslut |
| sluttest-o16-press-atervinningar | O16-kandidat press→återvinningar EJ BYGGD — ingen turnover-tracking finns | rapporterad | Code | SLUTTEST_KO.md:1075 | verifiera mot kod |
| sluttest-o16-tempo-kondition | O16-kandidat tempo→kondition sista tjugo EJ BYGGD — fatigue är transient live-data | rapporterad | Code | SLUTTEST_KO.md:1075 | verifiera mot kod |
| sluttest-o16-formation-ursprung | O16-kandidat formation→målens ursprung EJ BYGGD — inget mål-ursprung-fält | rapporterad | Code | SLUTTEST_KO.md:1075 | verifiera mot kod |
| sluttest-o2-hesitantplayer | `hesitantPlayerEvent` → `convince`/`accept` fortfarande strikt dominant, O2:s eget referensfall, ej byggt | rapporterad | Code | SLUTTEST_KO.md:941, 971 | verifiera mot kod |
| sluttest-o9-comeback | Delningskortets `comeback` är text-utan-generator | rapporterad | Code | SLUTTEST_KO.md:147, 1049 | verifiera mot kod |
| sluttest-o9-underdog | Delningskortets `underdog_upset` är text-utan-generator | rapporterad | Code | SLUTTEST_KO.md:147, 1049 | verifiera mot kod |
| sluttest-grind1-binar-met-failed | Grind 1-sidofynd (a): binär `met`/`failed`-plattning av objektivutvärderingen, rapporterat ej byggt | rapporterad | Jacob | SLUTTEST_KO.md:239, 352 | vänta Jacobs dom |
| sluttest-grind1-heros-ekonomi | Grind 1-sidofynd (b): ekonomimodellen för svaga klubbar (Heros ekonomi), verifierad men obyggd | rapporterad | Jacob | SLUTTEST_KO.md:239, 352, 364 | vänta Jacobs dom |
| sluttest-o1-mecenat | O1-kandidat "mecenatens krav" obyggd | rapporterad | Opus | SLUTTEST_KO.md:924 | verifiera mot kod |
| sluttest-o1-anlaggning | O1-kandidat "anläggningen som kostar orten" obyggd | rapporterad | Opus | SLUTTEST_KO.md:924 | verifiera mot kod |
| sluttest-o1-ungdom | O1-kandidat "ungdomen som kan brännas" obyggd | rapporterad | Opus | SLUTTEST_KO.md:924 | verifiera mot kod |
| sluttest-o1-supporterbrev | O1-kandidat "supporterbrevet" obyggd | rapporterad | Opus | SLUTTEST_KO.md:924 | verifiera mot kod |
| sluttest-bundle-produktbeslut | Å15/U8 bundle-splitting utredd, ingen tydlig nettovinst — byggs inte utan produktbeslut | rapporterad | Jacob | SLUTTEST_KO.md:167, 745, 865 | vänta Jacobs produktbeslut |
| sluttest-sparb-steg3 | SPÅR B steg 3: funktionärens svitrepliker + krokmallen ej skrivna | rapporterad | Opus | SLUTTEST_KO.md:168, 241 | verifiera mot kod |
| sluttest-u9-valentropi | U9 klass 1: val-entropi kräver ny lokal `{eventType, choiceId}`-logg — ej byggd | rapporterad | Code | SLUTTEST_KO.md:876 | verifiera mot kod |
| sluttest-u9-textupprepning | U9 klass 1: exakt textupprepning mot riktig spelares data — ej byggd | rapporterad | Code | SLUTTEST_KO.md:877 | verifiera mot kod |
| sluttest-u9-saverecovery | U9 klass 1: save recovery-mätning lokalt — ej byggd | rapporterad | Code | SLUTTEST_KO.md:878 | verifiera mot kod |
| sluttest-u9-avskedsfrekvens | U9 klass 1: avskedsfrekvens per klubbprofil (retrospektiv analysfunktion) — ej byggd | rapporterad | Code | SLUTTEST_KO.md:879 | verifiera mot kod |
| sluttest-u9-mattjanst-beslut | U9 klass 2 blockerad på beslut om extern anonym, kontolös mättjänst | rapporterad | Jacob | SLUTTEST_KO.md:881, 884 | vänta Jacobs beslut om mättjänst |
| sluttest-u9-onboarding | U9-mått: onboarding → första match (kräver klass 2-infrastruktur) | rapporterad | Jacob | SLUTTEST_KO.md:881 | vänta Jacobs beslut om mättjänst |
| sluttest-u9-sasong1-arsbok | U9-mått: första säsong → årsbok → säsong 2 | rapporterad | Jacob | SLUTTEST_KO.md:881 | vänta Jacobs beslut om mättjänst |
| sluttest-u9-retention | U9-mått: retention säsong 3/5/10 | rapporterad | Jacob | SLUTTEST_KO.md:881 | vänta Jacobs beslut om mättjänst |
| sluttest-u9-delningsfunnel | U9-mått: delningsfunneln | rapporterad | Jacob | SLUTTEST_KO.md:881 | vänta Jacobs beslut om mättjänst |
| sluttest-incoming-arkivering | "Arkivera resten av `incoming/` allteftersom" — löpande, ej avslutad | rapporterad | Opus | SLUTTEST_KO.md:170 | verifiera mot kod |
| sluttest-skutskar-high5 | Skutskär High 5 (BatchStack) medvetet skippad, inte i Jacobs byggordning | rapporterad | Jacob | SLUTTEST_KO.md:171, 356 | vänta Jacobs byggorder |
| sluttest-domarcitat-loss-opus | Domarcitatets `loss`-hink har `[Opus]`-platshållare, väntar text | rapporterad | Opus | SLUTTEST_KO.md:171 | verifiera mot kod |
| sluttest-devscenes-setstate | DevScenesScreen sätter `useGameStore.setState()` under render → React-varning på alla Portal-dev-scener, ej fixat | rapporterad | Code | SLUTTEST_KO.md:172 | verifiera mot kod |
| sluttest-vercel-autoprod | Varje push till main auto-deployar direkt till PRODUKTION; CLAUDE.md:s "production kräver Jacobs ja" gäller inte i praktiken | rapporterad | Jacob | SLUTTEST_KO.md:173 | vänta Jacobs beslut om det är avsett |
| sluttest-feedbackbutton-overlapp | FeedbackButton överlappar annat UI visuellt på flera skärmar — ej åtgärdat, separat visuellt fynd | rapporterad | Code | SLUTTEST_KO.md:173 | verifiera mot kod |
| sluttest-tsconfig-scripts-ratchet | 15 filer / 106 tsc-fel i `scripts/` ratchet-exkluderade i `tsconfig.scripts.json` | rapporterad | Code | SLUTTEST_KO.md:192 | verifiera mot kod |
| sluttest-utvisningar-kalibrering | Gap 3: utvisningar/match 2,62–2,67 mot målet 3,77 — verklig kalibreringsskuld | rapporterad | Code | SLUTTEST_KO.md:192 | verifiera mot kod |
| sluttest-peptalk-hold | `pep_talk`-valet `hold` hoppas medvetet över i Granska — ingen kategori beskriver "→ oförändrat" ärligt | rapporterad | Opus | SLUTTEST_KO.md:194 | verifiera mot kod |
| sluttest-pastaende-38-fynd | 38 av runda 2:s 43 proxy-fynd är aldrig individuellt itemiserade eller byggda | rapporterad | Code | SLUTTEST_KO.md:196, 231 | verifiera mot kod |
| sluttest-niva1-otaggade | ~29 av 85 kandidatfunktioner lämnades medvetet otaggade (Proxy/Delvis/EJ PÅSTÅENDE) i nivå 1-svepet | rapporterad | Code | SLUTTEST_KO.md:224 | verifiera mot kod |
| sluttest-niva1-builders | `seasonDecisionCaptureService.ts`s BUILDERS ligger under den billiga skannerns räckvidd — medvetet utesluten ur nivå 1 | rapporterad | Code | SLUTTEST_KO.md:206 | verifiera mot kod |
| sluttest-klippan-rotorsak | Verkliga orsaken till avskedsklippan mellan communityStanding 70/71 är okänd; gårdagens rotorsaksfynd motbevisat | rapporterad | Code | SLUTTEST_KO.md:207 | verifiera mot kod |
| sluttest-licens-ryktesskala | Licenskaskadens ryktesförlust-formel (`5 + deficitDepth/50000*5`) är ett förslag, inte en dom | rapporterad | Jacob | SLUTTEST_KO.md:208 | vänta Jacobs magnituddom |
| sluttest-licens-inbox-opus | Licenskaskadens nya inbox-post har `[Opus]`-platshållare, ingen svensk mening skriven | rapporterad | Opus | SLUTTEST_KO.md:208 | verifiera mot kod |
| sluttest-ekonomitab-lokal-stallning | EkonomiTab visar "Lokal ställning" helt oförklarad — ingen yta lär ut att communityStanding driver ekonomin | rapporterad | Opus | SLUTTEST_KO.md:209 | verifiera mot kod |
| sluttest-ortentab-falsk-kommentar | `OrtenTab.tsx` har en kodkommentar som (numera falskt) säger att samhällsaktiviteter inte påverkar inkomst | rapporterad | Code | SLUTTEST_KO.md:209 | verifiera mot kod |
| sluttest-avskedsvarning-generisk | `licenseService.ts`s avskedsvarningstext är helt generisk, nämner ingen konkret handling | rapporterad | Opus | SLUTTEST_KO.md:209 | verifiera mot kod |
| sluttest-dubblettgrind-triage | 71 dubblettkandidater från `find-duplicate-functions.ts` otriagerade | rapporterad | Jacob | SLUTTEST_KO.md:210 | vänta Jacobs prioritering |
| sluttest-dubblett-attributes | `generateAttributes()` mot `generateYouthAttributes()` — 88 % lika, olika basformel för samma sanning | rapporterad | Code | SLUTTEST_KO.md:210 | verifiera mot kod |
| sluttest-dubblett-pickarchetype | `pickArchetype()` 100 % identisk i två filer | rapporterad | Code | SLUTTEST_KO.md:210 | verifiera mot kod |
| sluttest-dubblett-stringhash | Minst åtta oberoende återuppfunna sträng-hash-funktioner | rapporterad | Code | SLUTTEST_KO.md:210 | verifiera mot kod |
| sluttest-economyservice-utredning | Rekommenderad separat utredning av `economyService.ts`s intäktsformler för rep<55-klubbar — ej påbörjad | rapporterad | Code | SLUTTEST_KO.md:212 | verifiera mot kod |
| sluttest-midtable-boardpatience | MidTable-klubbars höga avsked (Söderfors 85 %, Lesjöfors 90 %) drivs av boardPatience-formeln — vägen stängd, olöst | rapporterad | Jacob | SLUTTEST_KO.md:212 | vänta Jacobs riktningsbeslut |
| sluttest-heros-licensnekan | Heros fortfarande 100 % avskedad, nu via licensnekan ett år senare — "hålla ut"-premissen håller inte | rapporterad | Jacob | SLUTTEST_KO.md:212 | vänta Jacobs riktningsbeslut |
| sluttest-d030-man-eval | D030:s MAN-eval-fel i `validate_brain.py` är pre-existing infra-skuld, ej åtgärdad | rapporterad | Code | SLUTTEST_KO.md:212 | verifiera mot kod |
| sluttest-aitransferlog-ui | `aiTransferLog` + `getClubPositionTrend` byggda utan UI-konsument (väntar Förutsättningsfasen steg 2) | rapporterad | Code | SLUTTEST_KO.md:213, 215 | verifiera mot kod |
| sluttest-be-blind-trainerarc | `trainerArcService` dömer klubbens läge med fasta trösklar utan att läsa `boardExpectation` | rapporterad | Jacob | SLUTTEST_KO.md:214 | vänta Jacobs produktbeslut |
| sluttest-be-blind-midseason | `midSeasonEventService` läser inte `boardExpectation` | rapporterad | Jacob | SLUTTEST_KO.md:214 | vänta Jacobs produktbeslut |
| sluttest-be-blind-seasoncontext | `seasonContextService` läser inte `boardExpectation` | rapporterad | Jacob | SLUTTEST_KO.md:214 | vänta Jacobs produktbeslut |
| sluttest-be-blind-matchmood | `matchMoodService` läser inte `boardExpectation` | rapporterad | Jacob | SLUTTEST_KO.md:214 | vänta Jacobs produktbeslut |
| sluttest-be-blind-peptalk | `pepTalkService` läser inte `boardExpectation` | rapporterad | Jacob | SLUTTEST_KO.md:214 | vänta Jacobs produktbeslut |
| sluttest-be-blind-media | `mediaService` läser inte `boardExpectation` | rapporterad | Jacob | SLUTTEST_KO.md:214 | vänta Jacobs produktbeslut |
| sluttest-be-blind-repmilestone | `reputationMilestoneService` läser inte `boardExpectation` | rapporterad | Jacob | SLUTTEST_KO.md:214 | vänta Jacobs produktbeslut |
| sluttest-be-blind-clubmemory | `clubMemoryService` läser inte `boardExpectation` | rapporterad | Jacob | SLUTTEST_KO.md:214 | vänta Jacobs produktbeslut |
| sluttest-be-blind-sponsor | `contextualSponsorService` läser inte `boardExpectation` | rapporterad | Jacob | SLUTTEST_KO.md:214 | vänta Jacobs produktbeslut |
| sluttest-be-blind-demandengine | `demandEngine` läser inte `boardExpectation` | rapporterad | Jacob | SLUTTEST_KO.md:214 | vänta Jacobs produktbeslut |
| sluttest-objektivminne-text | Ingen text erkänner ännu ett upprepat objektivtema (klubben glömmer ett missat mål) | rapporterad | Opus | SLUTTEST_KO.md:214 | verifiera mot kod |
| sluttest-boardassessment-kvittensrad | "Styrelsen talar"-kvittensraden ("vad de såg") har `[Opus]`-platshållare, ingen låst text | rapporterad | Opus | SLUTTEST_KO.md:215 | verifiera mot kod |
| sluttest-forutsattningsfas-steg2 | Förutsättningsfasens mellandel (ligarörelser) renderas inte alls — koden existerar inte | rapporterad | Code | SLUTTEST_KO.md:215 | verifiera mot kod |
| sluttest-skalsrader-steg2 | Fyra av Jacobs sex låsta skälsrader är outnyttjade, väntar på steg 2:s ligadata | rapporterad | Code | SLUTTEST_KO.md:215 | verifiera mot kod |
| sluttest-wagebudget-omrakning | `wageBudget` räknas aldrig om för någon klubb (sannolikt bugg), ej fixad | rapporterad | Code | SLUTTEST_KO.md:216 | verifiera mot kod |
| sluttest-fanexpectation-dott | `Club.fanExpectation` är ett dött fält (noll skrivställen) | rapporterad | Code | SLUTTEST_KO.md:216 | verifiera mot kod |
| sluttest-forutsattningsfas-design | Nya Förutsättningsfasen-designleveransen i `docs/incoming/` förblir opåbörjad | rapporterad | Opus | SLUTTEST_KO.md:216 | verifiera mot kod |
| sluttest-running-loss-mult | `RUNNING_LOSS_EXPECTATION_MULTIPLIER`-kalibreringen stoppad | rapporterad | Jacob | SLUTTEST_KO.md:216 | vänta Jacobs koefficientdom |
| sluttest-mostimproved | `mostImproved` ej event-sourcad — kräver ny säsongsstarts-truppsnapshot, flaggad i BACKLOG | rapporterad | Code | SLUTTEST_KO.md:218 | verifiera mot kod |
| sluttest-veteran-seasonform | `veteran_final_season`s seasonForm-trösklar (≥75/annars svag) saknar prejudikat, satta symmetriskt, flaggat öppet | rapporterad | Opus | SLUTTEST_KO.md:219 | verifiera mot kod |
| sluttest-talentsearch-round | `TalentSearchRequest.createdRound` är latent fälla — skrivaren matar redan fel skala, väntar på en läsare | rapporterad | Code | SLUTTEST_KO.md:219, 222 | verifiera mot kod |
| sluttest-roundsummary-round | `RoundSummary.fromRound/toRound` inte skalkontrollerade | rapporterad | Code | SLUTTEST_KO.md:222 | verifiera mot kod |
| sluttest-referee-lastmatchround | `Referee.lastMatchRound` inte skalkontrollerad | rapporterad | Code | SLUTTEST_KO.md:222 | verifiera mot kod |
| sluttest-riskmaturityround | `SaveGame.riskMaturityRound` inte skalkontrollerad | rapporterad | Code | SLUTTEST_KO.md:222 | verifiera mot kod |
| sluttest-acceptedround | `SaveGame.acceptedRound` inte skalkontrollerad | rapporterad | Code | SLUTTEST_KO.md:222 | verifiera mot kod |
| sluttest-decayperround | `SaveGame.decayPerRound` inte skalkontrollerad | rapporterad | Code | SLUTTEST_KO.md:222 | verifiera mot kod |
| sluttest-triggerround | `SaveGame`s två `triggerRound`-fält inte skalkontrollerade | rapporterad | Code | SLUTTEST_KO.md:222 | verifiera mot kod |
| sluttest-niva3-browser | Manuell browser-verifiering av påståendegrindens nivå 3 (Granska) ej gjord — flaggat | rapporterad | Code | SLUTTEST_KO.md:223 | verifiera mot kod |
| sluttest-generateseasonverdict | VAR-felet i `generateSeasonVerdict`/Styrelsens dom känt sedan originalkartan, aldrig rört | rapporterad | Code | SLUTTEST_KO.md:225, 228 | verifiera mot kod |
| sluttest-halftimemodal-forra-aret | HalftimeModals "förra året"-påstående bekräftat fortfarande obyggt/ofixat | rapporterad | Code | SLUTTEST_KO.md:228 | verifiera mot kod |
| sluttest-annat-designfragor | Tre ANNAT-fynd ur omsvepet (design-frågor/orphan-beslut) som kräver Jacob/Opus, ej namngivna individuellt | rapporterad | Jacob | SLUTTEST_KO.md:228 | vänta Jacobs dom per fall |
| sluttest-cuprun-15ar | `boardObjectiveService.cupRun`s "15 år" är uppfunnet — rekommenderad strykning ej bekräftad byggd | rapporterad | Opus | SLUTTEST_KO.md:226 | verifiera mot kod |
| sluttest-rivaltenureline | `rivalTenureLine` ("var med när det var tunnare än nu") — data skickad till Jacob, dom väntas, texten SPEC-LYDNAD-låst | rapporterad | Jacob | SLUTTEST_KO.md:226, 227 | vänta Jacobs textdom |
| sluttest-ismaskin-tre-vintrar | `weeklyDecisionService`s ismaskin-"tre vintrar" — omskrivning dömd men ej bekräftad byggd | rapporterad | Opus | SLUTTEST_KO.md:226 | verifiera mot kod |
| sluttest-cupmatch-5-5 | Cupmatch "över vid 5–5 innan förlängning" — ytan som gör egen råscore-jämförelse ej identifierad (38 kandidatfiler) | rapporterad | Code | SLUTTEST_KO.md:230 | verifiera mot kod |
| sluttest-dinaval-forra-sasongen | "Dina val" listar spelare uppkallade förra säsongen som om det vore denna — ej påbörjat | rapporterad | Code | SLUTTEST_KO.md:230 | verifiera mot kod |
| sluttest-arsbok-andraplats | Årsbok 2027/28 sa "Andraplatsen var mer än målet" trots segermål — ej påbörjat | rapporterad | Code | SLUTTEST_KO.md:230 | verifiera mot kod |
| sluttest-raa-eventnycklar-koer | Råa eventnycklar syns i köer — ej påbörjat (H6 delfynd 5) | rapporterad | Code | SLUTTEST_KO.md:230 | verifiera mot kod |
| sluttest-narrative-truth-grind | Bredare narrative-truth-grind (säsongsindex/event-season/målstatus/tournament phase) INTE byggd, bör specas separat | rapporterad | Opus | SLUTTEST_KO.md:230 | verifiera mot kod |
| sluttest-missing-check-grind | Missing-check-klassen kräver en separat generisk "gameBefore≠gameAfter"-mekanism utöver dagens registerbundna grind | rapporterad | Code | SLUTTEST_KO.md:231, 265 | verifiera mot kod |
| sluttest-b1-formationssystem | B1 formationssystemet mot bandyns femmannaförsvar — rapport levererad, ingen dom, rör BEVARA-listan | rapporterad | Jacob | SLUTTEST_KO.md:239, 1100, 1106 | vänta Jacobs eget beslut före spec |
| sluttest-o13-jobbmarknad | O13 jobbmarknad efter avsked — `EJ BESLUTAD` | rapporterad | Jacob | SLUTTEST_KO.md:239, 1061 | vänta Jacobs beslut |
| sluttest-o14-monetisering | O14 monetisering och paketering — `HYPOTES`, ska inte driva bygge | rapporterad | Jacob | SLUTTEST_KO.md:239, 1062 | vänta Jacobs beslut |
| sluttest-53-text | 5.3 Turneringsläge mitt i serie: rapport levererad, väntar på Jacobs/Opus text | rapporterad | Opus | SLUTTEST_KO.md:241, 679 | vänta Jacobs text |
| sluttest-o5-fyra-krav | O5-granskningen: verifiera bygget (`50475cda`/`f19e5378`/`43120846`) mot domens fyra RAPPORTERA-krav | rapporterad | Opus | SLUTTEST_KO.md:241 | verifiera mot kod |
| sluttest-o5-skutskar-kalibrering | O5: Skutskär-kalibreringen — kraft 2–3 får aldrig träffa en klubb som redan blöder | rapporterad | Opus | SLUTTEST_KO.md:241 | verifiera mot kod |
| sluttest-o5-ar8-kriteriet | O5: år 8-kriteriet ej granskat | rapporterad | Opus | SLUTTEST_KO.md:241 | verifiera mot kod |
| sluttest-skutskar-high1 | Skutskär-auditens High 1 (styrelsens sammansatta dommodell) ska dömas först, delar faktorkälla med O9:s kontrastrad | rapporterad | Opus | SLUTTEST_KO.md:241 | verifiera mot kod |
| sluttest-factorymidseason-scener | Andra `factoryMidSeasonGame`-scener kan vara drabbade av samma coach-seed-flake — inte verifierat vilka | rapporterad | Code | SLUTTEST_KO.md:253 | verifiera mot kod |
| sluttest-tio-scener-registrering | Tio dev-scenvarianter anges sakna registrering i `sceneRegistry.ts` (motsägs av post 11/`f71b5edb`) | rapporterad | Code | SLUTTEST_KO.md:255, 261 | verifiera mot kod |
| sluttest-onadd-cornerinteraction | `CornerInteraction` helt onåbar i `/dev/scenes`, sveps av ingen grind | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-penaltyinteraction | `PenaltyInteraction` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-counterinteraction | `CounterInteraction` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-freekickinteraction | `FreeKickInteraction` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-halftimemodal | `HalftimeModal` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-coffeeroomscene | `CoffeeRoomScene` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-valetscene | `ValetScene` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-journalistscene | `JournalistRelationshipScene` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-cupintroscene | `CupIntroScene` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-sundaytraining | `SundayTrainingScene` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-seasonsignature | `SeasonSignatureRevealScene` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-inboxscreen | `InboxScreen` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-historyscreen | `HistoryScreen` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-championscreen | `ChampionScreen` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-introsequence | `IntroSequence` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-playoffintro | `PlayoffIntroScreen` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-qfsummary | `QFSummaryScreen` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-tilltrade | `TilltradeScreen` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-hallprovning | `HallProvningScreen` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-simsummary | `SimSummaryScreen` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-nameinput | `NameInputScreen` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-clubselection | `ClubSelectionScreen` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-phaseoverlay | `PhaseOverlay` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-bidmodal | `BidModal` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-renewcontract | `RenewContractModal` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-callupmodal | `CallupModal` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-efterklang | `EfterklangThreadModal` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-klubbparm | `KlubbparmOverlay` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-snowoverlay | `SnowOverlay` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-ceremonysm | `CeremonySmFinal` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-ceremonycup | `CeremonyCupFinal` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-onadd-ceremonyretirement | `CeremonyRetirement` helt onåbar i `/dev/scenes` | rapporterad | Code | SLUTTEST_KO.md:257, 261 | verifiera mot kod |
| sluttest-a2-tacticboardcard | `padding: '6px 3px'` uppges stå kvar i `TacticBoardCard.tsx` (motsägs av Å2 `ba18ea80`) | rapporterad | Code | SLUTTEST_KO.md:286, 734 | verifiera mot kod |
| sluttest-13-deploy-sync | 1.3 Deploy-sync som synlig releasegrind är `DELVIS KLAR` | rapporterad | Code | SLUTTEST_KO.md:448 | verifiera mot kod |
| sluttest-14-cta-diffar | 1.4: 14 `--cta-nav-clearance`-baselinediffar väntar på Jacobs styckvisa kvittering | rapporterad | Jacob | SLUTTEST_KO.md:449, 456 | vänta Jacobs kvittering per diff |
| sluttest-14-kapitelpunkt | 1.4: 3 KapitelPunkt-diffar väntar på kvittering | rapporterad | Jacob | SLUTTEST_KO.md:457 | vänta Jacobs kvittering |
| sluttest-14-upptakt | 1.4: 1 `upptakt`-diff väntar på kvittering | rapporterad | Jacob | SLUTTEST_KO.md:458 | vänta Jacobs kvittering |
| sluttest-14-forbaseline | 1.4: 3 förbaseline-driftdiffar (granska-spelare/-shotmap/-analys), OBEKRÄFTADE, egen batch | rapporterad | Jacob | SLUTTEST_KO.md:459 | vänta Jacobs kvittering |
| sluttest-arrival-devscen | `/dev/scenes?scene=arrival` renderar tomt — `squadGame`-fixturen saknar `board`, ej fixat | rapporterad | Code | SLUTTEST_KO.md:475 | verifiera mot kod |
| sluttest-25-delvis | 2.5 choice-label-svepet står som `DELVIS KLAR` | rapporterad | Code | SLUTTEST_KO.md:486 | verifiera mot kod |
| sluttest-kommunens-villkor | `kommunens_villkor`: byte-identiska effekter, `finansiering`-fältet läses ingenstans — rapporterat, ej byggt | rapporterad | Opus | SLUTTEST_KO.md:492, 920 | verifiera mot kod |
| sluttest-bandyplay-nettoforlust | Bandyplays löpande nettoförlust (≈−812 kr/omgång) korrekt men helt odokumenterad för spelaren | rapporterad | Opus | SLUTTEST_KO.md:492 | verifiera mot kod |
| sluttest-kiosk-breakeven | Kioskens break-even (fanMood 83 basic / 50 upgraded) odokumenterad | rapporterad | Opus | SLUTTEST_KO.md:492 | verifiera mot kod |
| sluttest-julmarknad | `community_julmarknad`: subtitle säger kostnad, nettosumman är positiv — öppet textbeslut | rapporterad | Opus | SLUTTEST_KO.md:490, 492 | verifiera mot kod |
| sluttest-25-40-fynd | Agenternas ursprungliga ~40-fyndslista från runda 1 aldrig fullt itemiserad (~18+2 klassade) | rapporterad | Jacob | SLUTTEST_KO.md:496 | vänta Jacobs beslut om nytt sweep-pass |
| sluttest-mecenat-traningsdag | `mecenatService.ts`: träningsdagsraden lovar effekt utan motsvarande kod | rapporterad | Code | SLUTTEST_KO.md:920 | verifiera mot kod |
| sluttest-mecenat-transferbudget | `mecenatService.ts`: transferbudgetraden lovar effekt utan motsvarande kod | rapporterad | Code | SLUTTEST_KO.md:920 | verifiera mot kod |
| sluttest-mecenat-projektfinans | `mecenatService.ts`: projektfinansieringsraden lovar effekt utan motsvarande kod | rapporterad | Code | SLUTTEST_KO.md:920 | verifiera mot kod |
| sluttest-31-browserverifiering | 3.1 `managerFired`-guard ej browser-verifierad — manuell kontroll kvar (trigga avsked → `/game/squad`) | rapporterad | Code | SLUTTEST_KO.md:523 | verifiera mot kod |
| sluttest-32-browserverifiering | 3.2 `BoardPatienceMinimal` ej browser-verifierad | rapporterad | Code | SLUTTEST_KO.md:530 | verifiera mot kod |
| sluttest-33-arkivpost | 3.3: route-state-arkivet överlever inte en sidladdning — godkänn eller kräv persisterad arkivpost | rapporterad | Jacob | SLUTTEST_KO.md:598 | vänta Jacobs godkännande |
| sluttest-41-standings-osakerhet | 4.1: kan inte bekräfta att ursprungsobservationen (5:e/6:a/5:e, 21 p) berodde på poängavdrag — annan rotorsak om mönstret återkommer | rapporterad | Jacob | SLUTTEST_KO.md:608 | vänta Jacobs rapport om det syns igen |
| sluttest-412-bildsnapshot | 4.12: bildsnapshots för delningsbilden byggdes INTE — öppen punkt om visuell verifiering önskas | rapporterad | Jacob | SLUTTEST_KO.md:619 | vänta Jacobs beslut |
| sluttest-414-scentackning | 4.14: ingen permanent dev-scen-täckning finns för säsongsdelningskortet | rapporterad | Code | SLUTTEST_KO.md:621 | verifiera mot kod |
| sluttest-415-browserverifiering | 4.15 svårighetsbadgen ej browser-verifierad (bara kodspårad) | rapporterad | Code | SLUTTEST_KO.md:622 | verifiera mot kod |
| sluttest-53-cup-lucka | Cupens motsvarande Turneringsläge-lucka (mellan ronder) kräver egen text, inte delad mall | rapporterad | Opus | SLUTTEST_KO.md:675 | verifiera mot kod |
| sluttest-playoffseries-straff | `getPlayoffSeriesContext()` räknar förlängnings-/straffavgjorda matcher som förlust (rå score, ingen `else if`) — flaggat, ej fixat | rapporterad | Code | SLUTTEST_KO.md:677 | verifiera mot kod |
| sluttest-kontrast-vs-divider | `NextMatchCard`s lilla "vs"-divider ligger på 3,15:1, `data-contrast-exempt` — genuin designfråga, ej löst | rapporterad | Opus | SLUTTEST_KO.md:703 | verifiera mot kod |
| sluttest-vscolor-derby | `vsColor`s `isDerby`/`isAnnandagen`-grenar aldrig kontrastprövade i portal-mörk kontext — öppen lucka | rapporterad | Code | SLUTTEST_KO.md:703 | verifiera mot kod |
| sluttest-matchtypsmatris-grans | Matchtypsmatris-grinden missar en platshållare med helt påhittad rubrik — dokumenterad gräns | rapporterad | Code | SLUTTEST_KO.md:710 | verifiera mot kod |
| sluttest-64-statusmotsagelse | "Grindarnas status" säger post 17/18/20/21 är `EJ` medan 6.4 säger KLAR — statusmotsägelse i filen | rapporterad | Code | SLUTTEST_KO.md:748, 690 | verifiera mot kod |
| sluttest-a8-viktning | Å8: taktiktavlans viktning ligger fortfarande hos Design | rapporterad | Opus | SLUTTEST_KO.md:741 | verifiera mot kod |
| sluttest-u7-banner | U7: ingen UI upptäcker eller föreslår en snapshot vid faktiskt misslyckad migrering | rapporterad | Code | SLUTTEST_KO.md:860 | verifiera mot kod |
| sluttest-u7-zustand | U7: den verkliga risksurfacen (zustand persist-rehydrering vid appstart) är obehandlad | rapporterad | Code | SLUTTEST_KO.md:860 | verifiera mot kod |
| sluttest-d1-consequence-optin | D1 punkt 3: `consequenceLevel`/`costLabel`/`irreversible` byggda men opt-in — inga befintliga events sätter fälten | rapporterad | Code | SLUTTEST_KO.md:892 | verifiera mot kod |
| sluttest-d1-batchstack | BatchStack-mekanismen vilande — ingen generator producerar ≥2 normal-prioriterade events ur samma orsak | rapporterad | Code | SLUTTEST_KO.md:892 | verifiera mot kod |
| sluttest-d1-whynow-mecenat | `mecenatEvent` saknar whyNow-text, nedgraderas till `normal` tills Opus skriver den | rapporterad | Opus | SLUTTEST_KO.md:892 | verifiera mot kod |
| sluttest-d1-whynow-economicstress | `economicStress` saknar whyNow-text (ifrågasatt om den ens förtjänar pivotal) | rapporterad | Opus | SLUTTEST_KO.md:892 | verifiera mot kod |
| sluttest-d1-whynow-playerunhappy | `playerUnhappy` saknar whyNow-text | rapporterad | Opus | SLUTTEST_KO.md:892 | verifiera mot kod |
| sluttest-d1-whynow-criticaleconomy | `criticalEconomy` saknar whyNow-text | rapporterad | Opus | SLUTTEST_KO.md:892 | verifiera mot kod |
| sluttest-o2-materialarkorv | Osäkert dominansfall: `eventFactories.ts:577` materialar-korv (`lock` +4000 vs `free` noOp), bindningstid ej modellerad | rapporterad | Code | SLUTTEST_KO.md:965 | verifiera mot kod |
| sluttest-renovate-wait | `communityActivitiesEvents.ts:343-346`: `wait` lovar "faciliteter försämras" men effekten är `noOp` | rapporterad | Code | SLUTTEST_KO.md:969 | verifiera mot kod |
| sluttest-nothing-valet | `eventFactories.ts:365`s `nothing`-val har en kommenterad text-effekt-mismatch | rapporterad | Code | SLUTTEST_KO.md:969 | verifiera mot kod |
| sluttest-o11-todo-rader | `contentContract.ts`: 89 av 95 rader är `filled:false`-TODO — innehållet fylls i senare pass | rapporterad | Code | SLUTTEST_KO.md:148, 1055 | verifiera mot kod |
| sluttest-playerpraise-vila | `playerPraise`-raden avslöjar textgap: löftet "vila" håller inte mekaniskt — kräver Opus, ej kod | rapporterad | Opus | SLUTTEST_KO.md:1055 | verifiera mot kod |
| sluttest-o12-forhandsdeltan | O12 förhandsdeltan står som `SKRIVEN` — dom finns, bygge ej bekräftat | rapporterad | Code | SLUTTEST_KO.md:1060 | verifiera mot kod |
| sluttest-o8-turneringslage | O8-text: Turneringsläge mitt i serie (efter 5.3) — `VÄNTAR` | rapporterad | Opus | SLUTTEST_KO.md:1048 | verifiera mot kod |
| sluttest-o8-prosapooler | O8-text: fast-lägets prosapooler — `VÄNTAR` | rapporterad | Opus | SLUTTEST_KO.md:1048 | verifiera mot kod |
| sluttest-o8-sommaren-typer | O8-text: Sommarens saknade händelsetyper — `VÄNTAR` | rapporterad | Opus | SLUTTEST_KO.md:1048 | verifiera mot kod |
| sluttest-o10-bestinclass | O10 best-in-class-strategin: `BESLUTAD, EJ PÅBÖRJAD` (bandyarkivet, vägskäl, bruksligor, utmaningslänkar, skaparekosystem) | rapporterad | Jacob | SLUTTEST_KO.md:1050 | vänta Jacobs prioritering |
| sluttest-o7-fler-sprakfel | Sannolikt fler språkfel i Skutskär-/långspelsauditerna som inte finns i repo och inte går att söka i | rapporterad | Opus | SLUTTEST_KO.md:1073 | verifiera mot kod |
| sluttest-o20-politician-inclusion | O20: `politician_inclusion` saknar K5 (ingen kostnad) — väntar på O2-blocket | rapporterad | Opus | SLUTTEST_KO.md:1218 | verifiera mot kod |
| sluttest-o20-icamaxi | O20: `icamaxi_visit` → `send_player` saknar K5 | rapporterad | Opus | SLUTTEST_KO.md:1219 | verifiera mot kod |
| sluttest-o20-awaytrip | O20: `supporter_away_trip_` → `subsidize` saknar K5 | rapporterad | Opus | SLUTTEST_KO.md:1220 | verifiera mot kod |
| sluttest-o20-lotto | O20: `survival_emergency_lotto` saknar K5 | rapporterad | Opus | SLUTTEST_KO.md:1221 | verifiera mot kod |
| sluttest-o20-q1 | O20: mecenatmiddagens `q1` (bidrag) saknar K5 | rapporterad | Opus | SLUTTEST_KO.md:1222 | verifiera mot kod |
| sluttest-o20-politician-warning | O20: `politician_warning` → `board_contact` saknar K3 (ingen kr-summa) — väntar på O5 | rapporterad | Opus | SLUTTEST_KO.md:1223 | verifiera mot kod |
| sluttest-o20-gentjanst | O20: `gentjanst` → `no`-valet saknar K3 | rapporterad | Opus | SLUTTEST_KO.md:1224 | verifiera mot kod |
| sluttest-o20-q2 | O20: mecenatmiddagens `q2` (konkurrens) saknar K3 | rapporterad | Opus | SLUTTEST_KO.md:1225 | verifiera mot kod |
| sluttest-o20-omprovning | O20 står som `DELVIS KLAR` — de fem K5-fallen ska omprövas nu när O2 är stängd | rapporterad | Opus | SLUTTEST_KO.md:1081, 1231 | verifiera mot kod |
| sluttest-b6-getpositionfit | `getPositionFit` duplicerad i `squadEvaluator.ts` och `PitchLineupView.tsx` — ingen grind fångar framtida drift | rapporterad | Code | SLUTTEST_KO.md:1118 | verifiera mot kod |
| sluttest-b7-libero-slot | B7 (liberon som syndabock) blockerad — kräver att `TeamSelection` sparar slot-mappning; sammanslagen med B12 som ej byggs | rapporterad | Jacob | SLUTTEST_KO.md:1114, 1116, 1198 | vänta Jacobs V2-beslut |
| sluttest-b10-zonmarkering | B10 zonmarkering är en textriktlinje som ännu inte förts in i matchtext eller B4-beskrivningar | rapporterad | Opus | SLUTTEST_KO.md:1132, 1145 | verifiera mot kod |
| sluttest-b3-ui-yta | `playStyleTradition` har inga UI-ytor — traditionen är inte invävd i scouttext/matchreferat | rapporterad | Code | SLUTTEST_KO.md:1110 | verifiera mot kod |
| sluttest-illustration-sarg | Rättelse till `DOM_ILLUSTRATIONERNA`: "Ingen sarg" är fel (sargen finns, låg och flyttbar) — ersätt raden i stilbibeln | rapporterad | Opus | SLUTTEST_KO.md:1155 | verifiera mot kod |
| sluttest-b12-konsument-b5 | B12:s fyra fält har ingen konsument: B5 (referat) läser dem inte | rapporterad | Code | SLUTTEST_KO.md:130, 1200, 1212 | verifiera mot kod |
| sluttest-b12-konsument-b4 | B12:s fyra fält har ingen konsument: B4 (efteranalys) läser dem inte | rapporterad | Code | SLUTTEST_KO.md:1212 | verifiera mot kod |
| sluttest-b12-konsument-o16 | B12:s fyra fält har ingen konsument: O16 (utvärdering) läser dem inte | rapporterad | Code | SLUTTEST_KO.md:1212 | verifiera mot kod |
| sluttest-grind2 | Grind 2 (andra akten: ekonomiskt val år åtta, ingen upprepad pivotal scen, färdigt anläggningsträd) ej dokumenterad som passerad | rapporterad | Jacob | SLUTTEST_KO.md:376 | vänta Jacobs grinddom |
| sluttest-grind3 | Grind 3 (rytmen: primär handling, nästa olösta fråga, en landning per säsong) ej dokumenterad som passerad | rapporterad | Jacob | SLUTTEST_KO.md:378 | vänta Jacobs grinddom |
| sluttest-grind4 | Grind 4 (tillväxten: riktiga mottagare startar karriär från spelarlänk) ej dokumenterad som passerad | rapporterad | Jacob | SLUTTEST_KO.md:380 | vänta Jacobs grinddom |
| sluttest-regressionsvit-1 | Skutskär-sviten punkt 1: seed sweep med automatiserad avskedsfrekvens-assertion — kräver magnitudbeslut om "rimlig" frekvens | rapporterad | Jacob | SLUTTEST_KO.md:356 | vänta Jacobs magnitudbeslut |
| sluttest-regressionsvit-15 | Skutskär-sviten punkt 15: produktions-BatchStack blockerad, medvetet vilande | rapporterad | Code | SLUTTEST_KO.md:356 | verifiera mot kod |
| sluttest-regressionsvit-22-24 | Skutskär-sviten punkt 22–24: kvalitativa/manuella grindar, ej automatiserbara, ej körda | rapporterad | Jacob | SLUTTEST_KO.md:356 | vänta Jacobs manuella körning |
| sluttest-avskedsvagar-yta | Tre oberoende vägar till avsked och ingen yta förklarar för spelaren vilken som utlöstes | rapporterad | Opus | SLUTTEST_KO.md:372 | verifiera mot kod |
| sluttest-heros-designfraga | Öppen fråga: är Heros avsiktligt "praktiskt taget alltid sparkad", eller är truppens/matchmotorns kalibrering för svag för ryktet 45 | rapporterad | Jacob | SLUTTEST_KO.md:370 | vänta Jacobs designdom |
| sluttest-merit-buffer-cap | `MERIT_BUFFER_CAP=20` är ett Code-förslag, inte Jacobs låsta magnitud | rapporterad | Jacob | SLUTTEST_KO.md:1024 | vänta Jacobs magnitudlåsning |
| sluttest-validering-berattelsekort | Valideringsexperiment: tio manuellt perfekta berättelsekort — ej kört | rapporterad | Jacob | SLUTTEST_KO.md:1268 | vänta Jacobs körning |
| sluttest-validering-slottsbron | Valideringsexperiment: en statisk Slottsbron-utmaning — ej kört | rapporterad | Jacob | SLUTTEST_KO.md:1268 | vänta Jacobs körning |
| sluttest-validering-bruksliga | Valideringsexperiment: en manuell Bruksliga — ej kört | rapporterad | Jacob | SLUTTEST_KO.md:1268 | vänta Jacobs körning |
| sluttest-validering-journal | Valideringsexperiment: följ-en-karriär-journalen — ej kört | rapporterad | Jacob | SLUTTEST_KO.md:1268 | vänta Jacobs körning |
| sluttest-kvalitativ-uppfoljning | Kvalitativ uppföljning med 6–8 riktiga spelare (paus efter omg 3, 11, 22, fem frågor) — ej genomförd | rapporterad | Jacob | SLUTTEST_KO.md:1270 | vänta Jacobs genomförande |
| sluttest-backlog-pekare | "Lägg en pekare från BACKLOG §A hit" — konkret åtgärd, ej bekräftad utförd | rapporterad | Opus | SLUTTEST_KO.md:267 | verifiera mot kod |
| centralredaktoren-surfacing-koordinator | Centralredaktören byggd: applySurfacingBudget/recentlySurfaced/rotateSubject (narrativeCoordinatorService.ts), event-blocket + pressen pekade dit, journalistExclusive omdirigerad, D039 skriven, 2-säsongsmätning 0 kanal-/rotationsbrott (press-recency 10 co-occurrences, huvudorsak pool-djup #5, dokumenterad i D039, inte fixad) | klar | Code | DOM_CENTRALREDAKTOREN_2026-08-31.md | Opus dömer kriterium 4 (playtest) + ev. #5 pool-djup som egen order |

---

## Metodnoteringar för verifieringspasset

- **Förväntade dubbletter mellan källorna** (icke uttömmande — verifieringspasset avgör och slår ihop): `wageBudget`-buggen (backlog: `wagebudget-aldrig-omraknad`, sluttest: `sluttest-wagebudget-omrakning`); `Club.fanExpectation` (backlog: `fanexpectation-dott-falt`, sluttest: `sluttest-fanexpectation-dott`); H4-klippans rotorsak (inv: `inv-2-9-aterkopplingsslingan`, backlog: `h4-klippan-rotorsak-okand`, sluttest: `sluttest-klippan-rotorsak`); `careerBreakText`/O13 (backlog: `careerbreak-text`, sluttest: `sluttest-am8-avsked-karriar` + `sluttest-o13-jobbmarknad`) — OBS denna sista är särskilt viktig: INVENTERING_2026-08-31.md:s egen stickprovsverifiering visade att `careerBreakText.ts` FAKTISKT ÄR FÄRDIGSKRIVEN nu (Jacobs egna edits landade under skördesessionen) — dessa rader är extremt sannolikt `stale` vid verifiering, inte `rapporterad`→`bygger`; B12:s konsumentlöshet (backlog: fyra `b12-*-utan-konsument`-rader, sluttest: `sluttest-b12-konsument-b5/b4/o16`, sluttest: `sluttest-b5-referat-vokabular`); O1-kandidaterna (sluttest: fyra `sluttest-o1-*`-rader, motsvarar delvis samma spår som redan känd "fyra kvar" i SLUTTEST_KO).
- **Fyra interna statusmotsägelser** i SLUTTEST_KO.md självt (samma sak KLAR på ett ställe, EJ på ett annat): `sluttest-tio-scener-registrering`, `sluttest-a2-tacticboardcard`, `sluttest-64-statusmotsagelse`, `sluttest-am9-finaluppladdning`.
- **De 32 `sluttest-onadd-*`-raderna** kommer ur SLUTTEST_KO.md:s "Skydd eller illusion?"-lista (55 granskade ytor, 35 helt onåbara i `/dev/scenes`). `MatchLiveScreen`, `FacilityScreen`, `GameOverScreen` uteslutna — dokumentet rättar dem själv som registrerade.
