# MASTER_ÖPPET — den enda levande statuskällan för öppna poster

**Etablerad:** 2026-08-31. Ersätter BACKLOG.md och SLUTTEST_KO.md som "enda sanning" om vad som är öppet — de degraderas till changelog + parkerad-idé-katalog och pekar hit (se deras nya filhuvuden). Ingen annan fil får längre påstå att den är den kanoniska statuslistan.

## Regler för den här filen

**Tillstånds-maskinen (regel 8):** `rapporterad → verifierad → in_progress → klar` (eller `stale`, om posten visar sig redan vara löst/överspelad vid verifiering — se INVENTERING_2026-08-31.md:s "prövad och friad"-mönster för exempel).
- **Varenda post föds `rapporterad`.** Ingen post ärver `verifierad` för att en källa (BACKLOG, SLUTTEST_KO, en audit, en agent) påstod ett faktum om den. Det gäller även när tre olika källor råkar säga samma sak — konsensus mellan rapporter är inte verifiering.
- En post får inte flyttas till `in_progress` förrän den är `verifierad` — det betyder: kodläst mot arbetsträdet OCH mot `git log`, av en människa eller Code, med resultatet skrivet i posten.
- **Code kör bara mot `verifierad`-rader.** En `rapporterad`-rad är inte en arbetsorder.
- En post som verifieras och visar sig redan vara löst (som fyra av sju stickprov i INVENTERING_2026-08-31.md var) sätts till `stale` med en rad om vad som faktiskt hände, inte raderas tyst.

**`in_progress`-claim (2026-09-08) — kollisionsskyddets claimsteg i tillstånds-maskinen.** Filen delas av flera agenter samtidigt (Code, Codex) som kan plocka samma rad utan att veta om varandra. Regeln:
- **Innan arbetet påbörjas:** agenten sätter `status = in_progress`, befintligt `ägare`-fält till `<agent>` och inleder `nästa-åtgärd` med `CLAIM <ISO-8601-timestamp> — <agent>.` Den tidigare åtgärdstexten bevaras efter claimen. Agenten PUSHAR claimen som en EGEN commit — INNAN själva arbetet, inte efteråt. En claim som bara finns i arbetsträdet skyddar ingen.
- **Andra agenter hoppar `in_progress`-rader.** En rad med en aktiv claim är inte ledig, oavsett hur länge sedan agenten senast syntes.
- **Vid klar:** flytta till `MASTER_ARKIV.md` samma pass (befintlig regel ovan) — `in_progress` går aldrig direkt till `klar`/`stale` på plats, precis som ingen annan terminal status gör.
- **Vid avbrott/krasch:** en claim äldre än ETT PASS räknas som övergiven och får övertas av en annan agent (som då sätter en ny claim, samma protokoll).
- **Ingen claim = fritt fram.** En rad utan `in_progress` är öppen för vem som helst att plocka, som vanligt.

**Ägarfält:** Opus (design/text/omdömesfråga) · Code (implementation/verifiering) · Jacob (ett beslut bara han kan fatta).

**Detta är en RÅ SKÖRD, inte en färdig lista.** Extraherad ur `docs/INVENTERING_2026-08-31.md`, `docs/SLUTTEST_KO.md` och `docs/BACKLOG.md`:s öppna tabeller, var för sig, utan sinsemellan-deduplicering — tre källor beskriver ibland samma underliggande fakta (t.ex. `wageBudget`-buggen, H4-klippans rotorsak, flera `[Opus]`-textgap) som separata rader här. Att slå ihop dem kräver samma sannings-bedömning som verifieringspasset gör — att göra det nu, i skördepasset, hade varit precis den "ärvd verifierad"-genväg regel 8 förbjuder. Dubbletter är alltså EN FÖRVÄNTAD DEL av verifieringsarbetet, inte ett skördefel.

## AKTUELL STATUS — 2026-09-08 (MASTER-split)

**MASTER-split genomförd 2026-09-08 (Code, reconcile-fönster).** Filen bar tidigare alla ~653 poster oavsett status — varje session-start drog in 517 stängda/stale rader i kontexten för att komma åt 136 aktiva. De 517 (336 `klar` + 181 `stale`) är flyttade till `docs/MASTER_ARKIV.md`, kollapsade till id + status + commit-hash + källpekare, ingen fulltext. Fulltexten finns kvar i git-historiken och i respektive DOM-/RAPPORT-/RECON-fil — arkivraden är bara ett register, inte en andra sanning.

**66 poster kvar här, alla aktiva:** `rapporterad`/`verifierad`/`in_progress`. Ingen `klar`/`stale`-rad ska längre stå kvar i den här filen. **Räkneregel:** räkna bara faktiska datarader (aldrig tabellhuvuden eller avdelningsrubriker), och uppdatera detta tal i samma commit som en post läggs till eller flyttas till arkivet. Korrigerat 2026-09-08 från den tidigare siffran 130, som innehöll 29 upprepade tabellhuvuden; före arkiveringen av `pt2-liga-advance-otestad` fanns 101 verkliga poster. Ny råkontroll samma dag visade att rubriken därefter låg två över filens faktiska 97 rader; efter att tre uttryckligen parkerade O10-dubbletter flyttats ut är det verifierade antalet 94. `c-ft1-fitnessfloor-tuning` stängde därefter en punkt: 93; `kf3-beslutsbudget-playtest` nästa: 92; `kf4-styrelse-playtest` nästa: 91; `bygget-flik-tillbakapil` nästa: 90; `orten-pilar-playtest` nästa: 89; `ceremoni-heron-glanstitt` nästa: 88; `b6-buryfen-footer-logo` nästa: 87; `clubscreen-tab-emoji-konsekvens` nästa: 86; `inv-3-sprint22-14-delbd` nästa: 85; `b4-designdel-ej-gjord` nästa: 84; `sluttest-14-forbaseline` nästa: 83; `sluttest-o8-prosapooler` nästa: 82; `sluttest-o8-sommaren-typer` nästa: 81; `sluttest-missing-check-grind` nästa: 80; `c-sy1-portalhierarki` nästa: 79; `sluttest-missing-check-grind` återöppnad efter domkontroll: 80; två redan arkiverade valdomar felregistrerades kort som aktiva och avfördes efter kod-, test- och arkivkontroll: 82→80; `akademi-liggare-dom` flyttad: 79; råkontroll av faktiska datarader visade att rubriken redan låg en över listan, avstämt till 78. `akademi-ekonomirad` stängdes och det preliminära sidofyndet `erbjudanden-latt-fallback-felmarkt` registrerades i samma pass: netto fortsatt 78; `fornyelse-pris-slutdom` var redan uttryckligen dömd stängd i DOMLOGG och flyttades till arkivet: 77; `askadare-golvandel-generellt` var redan dömd 50 procent och passerade den formella kalibreringen: 76; full klubbklasskontroll falsifierade sidofyndet och flyttade det till arkivet som stale: 75; `inv-2-14d-illustration-nyar` och dess sista paraply `fable-scen-konst` stängdes tillsammans när den godkända nyårsbilden kopplades in och browsergranskades: 73; `flode-02-loop-andning` avfördes som explicit dubblett till den fortsatt aktiva `design-p1-tysta-ytor`: 72. Ny rapporterad post `atermatch-sparar-inte-minut` (återöppnad match sparar inte exakt minut): 73; `minne-avsked-motsager-historik` stängd efter licensradens wiring: 72; `sluttest-o8-turneringslage` stängd efter låst mitt-i-serien-text, tester och browserprov: 71; `atermatch-sparar-inte-minut` stängd efter durabel progressmarkör och riktigt reload-prov: 70; `lobbypress-mekanik-spec` stängd efter flavour-wiring i landslagsuppehållet: 69; `transfer-arsbok-minns-fel` stängd efter Del 2 (årsboksraden för missad värvning): 68; `stickiness-copy-roster` stängd efter B12-mönstrets kanoniska liggarpost, samtliga fem registerscenarier nu wirade: 67; `c-o1sp1-kontextuella-sponsorer` flyttad till post-launch efter grundad namnrymdsdom: 66.

**Stående regel (2026-09-08):** att stänga en rad = FLYTTA den till `MASTER_ARKIV.md`, aldrig bara stämpla om den `klar`/`stale` på plats. En rad som blir terminal och inte flyttas samma pass är en läckt regel, inte en genväg.

`docs/MASTER_ARKIV.md` läses ALDRIG rutinmässigt vid sessionsstart — bara vid explicit behov av historik (Jacob frågar "var det redan löst?", en gammal dom behöver återfinnas). Auto-load-pekaren (CLAUDE.md, sessionsstart-checklistan) pekar på DEN HÄR filen, inte arkivet.

## HISTORISK RÅSKÖRD

**474 ursprungligen skördade rader.** (58 ur INVENTERING_2026-08-31.md + 185 ur BACKLOG.md + 231 ur SLUTTEST_KO.md.) Antalet är den historiska råskördens utdata, inte dagens totala kö och inte ett mål — se Jacobs egen instruktion om varför.

Redan kända, inte separat skördade här (löstes eller stängdes SAMMA DAG av Code, före detta skördepass, med commits): FormationView.tsx:s tredje golv-blinda "Fyll bästa elvan" (`ea63b02c`), fyra räddade textpooler i `hallProvningData.ts`, två DOM-supersede-markeringar, två BACKLOG-headerkorrigeringar (203-filer-risken, TEXT-AUDITEN). De är `klar`, inte `rapporterad` — de hör inte hemma i en öppen-lista.

---

## Fynd EFTER skörden — Jacobs egen verifiering, kör genom hela tillstånds-maskinen

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| high6-retirement-golvalder-fitnessensam | Finare punkt Jacob noterade men INTE auditens critical: även med golvet kan en spelare EXAKT på golvåldern (ageScore=0) bli kandidat av fitness/skador ensamt — t.ex. en 29-årig forward som bara är trött denna säsong. Balansnyans, inte en bugg. | verifierad | Jacob | Jacobs egen anteckning i körordern 2026-08-31 (medveten, ej rapporterad som fel) | Jacob avgör om det känns fel i spel — om ja, nästa steg är sannolikt ett separat, mildare golv för "endast fitness/skador utan någon ålderspoäng alls", inte en ändring av RETIREMENT_AGE_MARGIN (som redan är avsiktligt löst). [Verifierat 2026-09-01 (Code): Ren designfråga från Jacobs egen körorder 2026-08-31, ingen kodfakta att slå fast — bedömningsfråga, inte buggstatus.] |

Andra exemplet på tillstånds-maskinens fulla cykel, samma mönster som raden ovan. Två av auditens tre criticals nu `klar` (attribution + pensionsgolv). Kvar: framgångskurve-domen (väg C:s −45 tkr mot 1,7 mkr) — Jacobs egen, kräver hans spelbevis-beslut innan Code kan bygga mot den.

## Checkpoint 2026-09-01 — Codex +100-rundan mot `55b2aa9d`

**Checkpointstatus (historisk, nu stängd):** checkpointen landade i `c1588c02`; de efterföljande kontrollgolvs- och browsergrindsdelarna landade i `4dbc2cba`/`bd109109`. Full Vitest var grön (**346 filer / 3611 tester**), produktionsbygget liksom TypeScript-, design- och innehållsgrindarna var gröna. Den dåvarande visuella snapshot-sviten kördes inte; dagens separata baselineskuld spåras i `ci-visuella-baselines-rod`.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: docs/INVENTERING_2026-08-31.md (58 rader)

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| inv-2-15a-vag2-a5-motorkalibrering | ANALYSSPEC_VAG2: motorkalibreringskandidat ur A5 väntar Jacobs beslut | verifierad | Jacob | INVENTERING_2026-08-31.md:69 | Jacob beslutar [Verifierat 2026-09-01 (Code): docs/data/ANALYSSPEC_VAG2_OEXPLOATERAT.md:102 listar fortfarande "motorkalibrering från A5 (Jacob-beslut)" som öppet spår.] |
| inv-2-15c-vag2-dam-attendance | ANALYSSPEC_VAG2: dam-attendance datatäckning 20,3% mot 50%-krav, blockerar A7 | verifierad | Jacob | INVENTERING_2026-08-31.md:69 | ANALYSSPEC_VAG2_OEXPLOATERAT.md:101 — grind ej passerad (dam-täckning 20%<50%), ej kodfixbart |
| inv-2-15d-vag2-overtime-owngoal | ANALYSSPEC_VAG2: overtime/own_goal-fält saknas, relevant vid framtida omscrape | verifierad | Jacob | INVENTERING_2026-08-31.md:69 | Samma fil :102 — datagap (overtime/own_goal saknas i källdatan), inte analysbrist |
| inv-2-15e-vag2-finding065-mekanism | ANALYSSPEC_VAG2: mekanismfrågorna bakom Finding 065 aldrig spawnade som frågor | verifierad | Opus/Jacob | INVENTERING_2026-08-31.md:69 | Opus/Jacob avgör om frågorna ska ställas [Verifierat 2026-09-01 (Code): ANALYSSPEC_VAG2_OEXPLOATERAT.md:102 bekräftar "mekanismfrågorna bakom 065:s slutfaslyft (ej spawnade som questions ännu)".] |
| inv-3-sprints17-21-four-skipped | Fyra explicit skippade designpunkter (historisk kontext, timer-varianter, supporterkänsla, beslutskedja) aldrig återupptagna | verifierad | Opus/Jacob | INVENTERING_2026-08-31.md:87 | Opus/Jacob avgör om de ska tas upp [Verifierat 2026-09-01 (Code): docs/sprints/SPRINTS_17_21_INDEX.md rad 66-71 listar fortfarande alla fyra punkter under "Skipped från denna session".] |
| inv-4-o12-forhandsdelta | O12 "förhandsdelta" (DOM_DOMINANS_OCH_FORHANDSDELTAN) skriven men aldrig byggd | verifierad | Code | INVENTERING_2026-08-31.md:103 + SLUTTEST_KO.md:1060 | U9-verktyget är byggt 2026-09-02 (`npm run analyze:choice-entropy -- <exporterad-save.json>`), men domen kräver att resultatet RAPPORTERAS före O12-bygge. Kvarvarande blockerare är därför verkliga spelar-saves med nya, attribuerade val — äldre poster (`resolvedChoices`) saknar säker attribution och exkluderas medvetet, får inte gissas. D1:s ambientväg och O5 finns redan; ingen separat O12-mekanik ska byggas. Dedup 2026-09-03: konsoliderar `sluttest-o12-forhandsdeltan` (samma punkt, två källor). |
| inv-5-designko-d4-portal-orientering | D4 Portal-orienteringen/första-gången-rampen (onboarding) — enda öppna punkten i DESIGN-KO-2026-07-02.md, brief skriven, väntar Design | verifierad | Opus/Design | INVENTERING_2026-08-31.md:114 + BACKLOG.md:695 | Opus mockar, Code bygger [Verifierat 2026-09-01 (Code): design-system/briefs/DESIGN-KO-2026-07-02.md punkt 6 D4 står kvar ostruken, ingen mock levererad; ingen onboarding-/rampskärm hittad i src/presentation, design-system/HANDOFF.md nämner ingen leverans.] Dedup 2026-09-03: konsoliderar `d4-portalorientering` (samma punkt). |
| inv-5-fas4-klubbmarken | FAS 4 (12 klubbmärken) bara 3/12 klara | verifierad | Jacob | INVENTERING_2026-08-31.md:114 | Opus/Design fortsätter produktion, Code wirar [Verifierat 2026-09-01 (Code): design-system/assets/clubs/ innehåller exakt 3 av 12 klubbar, oförändrat sedan 08ce3c4f.] Ägare Opus→Jacob 2026-09-04: assetproduktion är Jacobs (Gemini/Nano), inte Opus-text. Kan köras i samma pass som ortbilderna — samma stilsträng, ett märke per ort. |
| inv-5-fas5-portrattgenerator | Spelarporträtt: SVG-porträtten som visas ser fel ut ("aliens"); de riktiga PNG-porträtten är inte inkopplade | verifierad | Opus/Jacob | INVENTERING_2026-08-31.md:114 | **RÄTTAD 2026-09-07 (Jacobs korrigering — Opus drog "fungerar" av att filer FANNS, utan att veta vad spelaren SER).** LÄGET: `portraitService.getPortraitSvg` → `svgPortraitService.generatePlayerPortrait` är det som RENDERAS, och de genererade SVG-ansiktena ser fel ut (utomjordingar). De 32 PNG-porträtten (`public/assets/portraits/portrait_{tier}_{1..8}.png`) FINNS men är INTE inkopplade i UI:t — `getPortraitImagePath` pekar på dem men något renderar SVG-vägen i stället. Bra porträtt gjordes tidigare, passade inte layouten, las på vänt. **ARBETSPASS Opus+Jacob (bild, Gemini-spåret), INTE en generator att bygga:** (1) verifiera exakt vilken väg UI:t renderar och varför SVG vinner över PNG; (2) lös layout-kravet som stoppade PNG-porträtten; (3) generera porträtt via Gemini som passar layouten. Bygg ingen generator — det är assets + wiring. Inte "fungerar", ett öppet bild-pass. |
| inv-7-stashed-wip-commits | stash@{0}, stash@{1}, stash@{2} — okänt innehåll, okänd ålder (tre stashes, inte två — antalet var fel i båda ursprungsraderna) | verifierad | Jacob | INVENTERING_2026-08-31.md:140 + BACKLOG.md:7 | Jacob avgör: poppa, granska, eller släng [Verifierat 2026-09-03 (Code): `git stash list` visar tre poster — stash@{0} ("verify staged burnout-ceiling+board-reason commit"), stash@{1} ("Spår A + LedgerFrame + text-hygiene"), stash@{2} ("corners är dict + corner_by_team-analys") — ingen poppad. Dedup: konsoliderar `topp-stashade-wip` (samma fynd, två källor, båda hade fel antal).] Jacob 2026-09-03: tittar en gång — stash@{0} är sannolikt överspelad (burnoutCeiling levererades av Codex 2026-09-03), stash@{2} är bandy_scraper-analys (fel repo-kontext?), stash@{1} är den enda som kan bära något. `git stash show -p` på var och en, applicera eller `git stash drop`. |

---

# KÄLLA: docs/BACKLOG.md (185 rader)

*(Harvested av en dedikerad agent, 2026-08-31, mot BACKLOG.md:s sektioner A–E + "BYGGT MEN OSYNLIGT" + "TVÅ LÄSARE, EN SANNING" + "DATAFÄLT SOM SAKNAS" + relevanta playtest-/KF-rader. Sektion F, CHANGELOG, "PRÖVAT OCH AVFÄRDAT", och alla ~~genomstrukna~~/STÄNGD/KLAR-rader uteslutna som redan stängda.)*

## Toppnoter

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| o10-queryparam-clubselection | Query-param-läsning på club-selection (seed i länk) inte byggd | verifierad | Jacob | BACKLOG.md:55 | ClubSelectionScreen.tsx:18-20 — Date.now()-seed, ingen useSearchParams. Väntar Jacobs dom (BACKLOG.md:55) |
| o10-delningskort-text | Delningskortet + frågan väntar på Opus-text | verifierad | Jacob | BACKLOG.md:55 | Opus skriver text [Verifierat 2026-09-01 (Code): BACKLOG.md:55 bekräftar fortfarande "kortet+frågan (Opus-text)" saknas.] TEXT LÅST 2026-09-04 (Opus) — O10 tillväxtslingans tre strängar, Code kopierar när Jacob säger gå för slingan (`o10-queryparam-clubselection`): (1) kortets rad under säsongsbilden: {Klubb}, {säsongsetikett}: {placering}. Samma vinter väntar på dig. · (2) frågan på landningsskärmen när länken öppnas: Samma seed. Samma ort, samma trupp, samma vinter. Det blev {placering} för {Namn}. Hur långt kommer du? · (3) mjuk ruleVersion-missmatch-notis: Spelet har ändrats sedan länken skapades. Världen är densamma — reglerna inte helt. — Ägare Opus→Jacob: texten är klar, det som återstår är Jacobs gå för hela slingan (BACKLOG:55 "väntar på bedömning innan kod skrivs"). |
| cs-patron-sannolikhetsrullning | `PATRON_EMERGE_CS=60` är binär (100 %/0 %) — en sannolikhetsrullning måste läggas till, inte bara tröskeln bytas; empiriskt spärren för Heros | verifierad | Jacob | BACKLOG.md:60, 61 | patronData.ts:1 PATRON_EMERGE_CS=60, binärt gate, ingen ramp. Kräver designbeslut (mecenat-precedenset kan tala emot en ramp här också) |
| mecenatrapport-tre-designfragor | Tre öppna designfrågor i `RAPPORT_MECENATGENERERING_2026-08-26.md` väntar innan kod skrivs | verifierad | Jacob | BACKLOG.md:60 | vänta Jacobs svar [Verifierat 2026-09-01 (Code): BACKLOG.md:60 "Tre öppna designfrågor... väntar på Jacob" — ingen uppföljande dom.] |
| mecenat-patron-modellform | Per-omgångs-rullning konvergerar mot säkerhet över en karriär — kräver annan modellform (en rullning per säsong) el. mycket lägre tal | verifierad | Jacob | BACKLOG.md:65 | vänta Jacobs dom på modellform [Verifierat 2026-09-01 (Code): mecenatService.ts:429,472 har fortfarande samma flata rand()<0.15-rullning per omgång.] |
| m5-grindar-ej-i-ci | `minTextSizeGate.ts` är byggd men saknar fortfarande en importerande fil i `npm run test:visual` — `minControlSizeGate.ts` ÄR redan inkopplad, hörde inte hemma i samma rad | verifierad | Design | BACKLOG.md:70 | STÄNGT för minControlSizeGate 2026-09-01 (Code-verifieringspasset) — tests/visual/mobileDecisionHierarchy.visual.ts importerar findControlSizeViolations (commit 799c4c84, 2026-08-31). ÖPPET för minTextSizeGate: ingen fil importerar den ännu. Rättad 2026-09-03: raden var för bred, blandade en stängd och en öppen grind under samma rubrik. Ägare Jacob→Code 2026-09-03: en import i en visual-test, inget beslut. Byggbar. FÖRSÖKT 2026-09-03 (Code): trådde in `findTextSizeViolations` i `mobileDecisionHierarchy.visual.ts` bredvid befintlig `findControlSizeViolations` (samma två spot-checks, Game Over + taktiktavlan). Var INTE ett rent en-import-beslut — testet failade omedelbart med ~40 verkliga sub-12px-brott (9-11px position-badges, spelarnamn, assistent-anteckningar, åldersrader på Game Over och taktiktavlans spelarval). Matchar exakt M5-auditens ursprungsfynd. Ändringen återställd (`git checkout --`) för att inte tysta en genuin grind eller bredda scopet till en design-runda utan beslut. Kräver en ägare: fixa ~40 fontstorlekar (Design, layoutrisk), undanta dem uttryckligen via `[data-text-size-exempt]` (Design/Jacob, dokumenterad skuld), eller hitta en scen som redan är ren att koppla in grinden mot först. Inte längre "byggbar" utan vidare beslut. **Ägare Code→Design 2026-09-06:** Code kan koppla in grinden först efter att Design dömt vilka sub-12px-ytor som ska förstoras respektive uttryckligen undantas; inga visuella baselines ändras av Code. |
| decisioncards-likriktning | `DecisionCards`-komponentens visuella likriktning (alla korts enhetlighet, L4) är inte adresserad — bara den ena konkreta luckan | verifierad | Design | BACKLOG.md:74 | verifiera mot kod [Verifierat 2026-09-01 (Code): consequenceLevel/costLabel/irreversible finns nu i två event (economicCrisisService.ts:162, communityRenewalService.ts:290) men DecisionChoices.tsx:s bredare visuella likriktning är fortfarande oadresserad.] Ägare Opus→Design 2026-09-04: visuell likriktning är Designs. Hör ihop med `design-d4-primary-utspadd` (knappvikt) och `design-p4-brytpunkt-knappar` — ta i ett svep. |
| scout-shortlist-transferfonster | Bevakad spelare som fortfarande är tillgänglig när transferfönstret stänger kan vara värd en rad — bygg när transferytorna ändå rörs | verifierad | Opus/Jacob | BACKLOG.md:76 | Medvetet parkerad (BACKLOG.md:76) — bygg vid nästa transfers-yterörelse |

## H4 Heros

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## BYGGT MEN OSYNLIGT / ONÅBART

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| o10-delbarhetsspar | Delbarhetsspåret (utmaningslänk/Bruksliga/jämförbar seed-körning) obyggt — det som skulle använda `ruleVersion` | verifierad | Opus | BACKLOG.md:171 | verifiera mot kod [Verifierat 2026-09-01 (Code): ruleVersion har bara en konsument (switchManagedClub.ts), seasonShareImage.ts delar fortfarande bara bilden utan seed/regelversion.] |

## TVÅ LÄSARE, EN SANNING + fältfamiljer

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## DATAFÄLT SOM SAKNAS + påståendekartan

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## PLAYTEST-RUNDA 2026-07-10

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| pt6-nedslackning-timing | Nedsläckning av matchhändelser går för långsamt i live-flödet | verifierad | Design | BACKLOG.md:300 | verifiera mot kod (timing-just) [Verifierat 2026-09-01 (Code): BACKLOG.md rad ~300 (PT-6) listar posten fortfarande öppen ("design/Code", ej STÄNGT), samma beskrivning om långsam nedsläckning.] |

## A. AKTIVA SPRINTAR

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| m14-publikhistorik-token | Textauditens vilande rest M14 (publikhistorik-token) väntar på en funktion som inte finns än | verifierad | Opus | BACKLOG.md:346 | verifiera mot kod [Verifierat 2026-09-01 (Code): grep på "attendanceHistory/publikhistorik/crowdHistory" i src/ ger noll träffar — funktionen (publikhistorik-token) finns fortfarande inte; TEXT-AUDIT-PROTOKOLL.md rad 1569 bekräftar samma VILANDE-status.] |
| m50-clubofferquotes | Textauditens vilande rest M50 (`clubOfferQuotes`) väntar på en funktion som inte finns än | verifierad | Opus | BACKLOG.md:346 | verifiera mot kod [Verifierat 2026-09-01 (Code): clubOfferQuotes.ts finns och används (t.ex. AllClubsView.tsx, OfferCard.tsx) men ingen trofé-/meritskärm existerar (grep på TrophyScreen/MeritScreen/clubHonours ger noll träffar) — funktionen M50 väntar på (meritskärmen) finns fortfarande inte.] |
| forsoning-5-omfotografering | §5 verifiering: Jacob fotar om, Design re-auditar (grön/kvarstår) | verifierad | Jacob | BACKLOG.md:357 | Jacob fotar om [Verifierat 2026-09-01 (Code): docs/BACKLOG.md rad 349-357 listar FÖRSONINGSSPRINTEN fortfarande som "AKTIV" med §5 verifiering ostängd (ingen "STÄNGD"-markering hittades någonstans i repo för §5) — Jacobs ompaus-uppgift är en judgment call utan kodbevis på slutförande.] |
| valet-ui-eriks-oga | Valet-UI väntar på Eriks öga (playtest-nivå residual) | verifierad | Jacob | BACKLOG.md:403 | playtest [Verifierat 2026-09-01 (Code): docs/BACKLOG.md:403 listar explicit "Valet-UI väntar Eriks öga" som öppen residual, ej stängd.] |
| transfers-modaler-ledgervokabular | BidModal/RenewContractModal ska få ledger-vokabulär (designidé, öppen fråga) | verifierad | Opus/Jacob | BACKLOG.md:418, 419 | vänta Jacobs beslut [Verifierat 2026-09-01 (Code): docs/BACKLOG.md:418 listar "#7 transfers-modaler (BidModal/RenewContractModal) → ledger-vokabulär (designidé, öppen fråga Opus/Jacob)" som ej löst.] |
| forsoningskarta-saknas-i-repo | `audits/FORSONINGSKARTA-KONSOLIDERAD-2026-06-10.md` finns inte i repot — A-listan kan inte göras fynd-för-fynd — **FLAGGA (ej fixbar): filen saknas. Jacob har den? Annars är A-listan bara inte gjord fynd-för-fynd. Ingen kodial åtgärd** | verifierad | Opus | BACKLOG.md:488 | verifiera mot kod [Verifierat 2026-09-01 (Code): `find . -iname "*FORSONINGSKARTA*"` gav noll träffar i repot — filen saknas fortfarande, docs/BACKLOG.md:488 bekräftar samma slutsats.] |
| spelarkort-oversikt-konformering | Strukturbeslut 1: konforma Spelarkortets Översikt till mocken (flytta dynamiska celler till Säsong/Karriär) eller behåll rikare | verifierad | Jacob | BACKLOG.md:514 | vänta Jacobs val [Verifierat 2026-09-01 (Code): docs/BACKLOG.md:514 bekräftar "VÄNTAR JACOBS VAL, ej i kod ännu" för strukturbeslut (1) Spelarkortets Översikt.] |

## B. SPECCAT KLART, VÄNTAR BYGGE

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| b2-ej-byggd | Re-speca B2 mot vad som nu finns snarare än den ursprungliga majpremissen | verifierad | Opus | BACKLOG.md:531 | **ÄGARE → OPUS 2026-09-07 (Jacob delegerade):** inte ett Jacob-beslut — en Opus-uppgift. B2:s ursprungspremiss är fem månader gammal; Opus läser vad som finns nu (annandagsVal-fältet dött, men phase mark/scene-trigger/calendar-anchor/inbox/dev-scen har vuxit) och re-specar mot verkligheten. Står i Opus-tråden tills gjord. |

## C. IDÉER UTAN SPEC

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| bb-viz1-winprobkurva | Bandy Brains första grafik (win-prob-kurva ur Finding 060) — paradigmval om sajten ska ha grafik alls | verifierad | Jacob | BACKLOG.md:553 | vänta Jacobs/Designs beslut OM [Verifierat 2026-09-01 (Code): BACKLOG.md:553 (BB-VIZ1) beskriver fortfarande grafikfrågan som obesvarat designbeslut ("sajten är hittills medvetet tabell-och-prosa... Jacob/Design avgör OM") — ren judgment-fråga utan kodfacit.] |
| c-sp5-smfinal-skarv | SM-final-uppspelets skarv: svart panel på grå bakgrund ger hårt skarvband | verifierad | Design | BACKLOG.md:599 | verifiera mot kod [Verifierat 2026-09-01 (Code): MASTER_OPPET.md:305 bekräftar explicit att BACKLOG:599s C-SP5 (uppspelets skarv) är "ANNAN, fortfarande öppen sak" skild från den redan levererade crossfade-fixen (`0e39f24`).] |
| c-v1-opponentform-tomt | OpponentForm-kortet känns tomt/ihoppressat | verifierad | Design | BACKLOG.md:608 | verifiera mot kod [Verifierat 2026-09-01 (Code): src/presentation/components/portal/secondary/OpponentFormSecondary.tsx:33-51 renderar ett kompakt kort (padding 8px 10px, bara etikett + 5 ScoreBlocks) — visuell polish-fråga, olöst, BACKLOG.md:608 säger "tas när bugglistan är tom".] |
| c-sy1-pilot1-playtest | C-SY1 Pilot 1 väntar playtest före skalning till fler pools | verifierad | Jacob | BACKLOG.md:625 | Jacob playtestar [Verifierat 2026-09-01 (Code): BACKLOG.md:625 upprepar "Pilot 1 väntar playtest före skalning till fler pools" utan någon efterföljande playtest-bekräftelse i BACKLOG/HANDOVER-filerna.] |
| c-t11-nudges-pa-portalen | Transfer-nudges bor i transfers-fliken, inte på portalen där spelaren lever | verifierad | Design | BACKLOG.md:639 | verifiera mot kod [Verifierat 2026-09-01 (Code): ingen "TransferNudge"/nudge-komponent hittad i src/presentation/components/portal — nudges finns bara implicit i TransfersScreen.tsx, ej flyttade till portalen, BACKLOG.md:639 oförändrad.] |
| int-1-stora-bagarna | 'Bygg B1' är i huvudsak utförd som körorder; kvarstår är Jacobs genomspelning/känsla, inte mer kod | verifierad | Jacob | BACKLOG.md:659 | B1-substratet till stor del byggt (FacilityScreen, O5/O17, framgångskurvan stängd, tränarmarknad, årsbok alla fem fält) |

## KF. SYSTEMKARTANS FYND

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| kf8-fanmood-kalibrering | KF8 fanMood byggd; kvar är kalibrering mot nästa genomspelning (06-18-spec §B punkt 3) | verifierad | Jacob | BACKLOG.md:672 | Jacob genomspelar [Verifierat 2026-09-01 (Code): BACKLOG.md:672 säger fortfarande "Kvar enbart kalibrering mot NÄSTA genomspelning (06-18-spec §B punkt 3)" — ingen senare post bekräftar att den kalibreringsomgången genomförts.] |

## KF2. ÖVERLÄMNING 2 — TRE ÅTERSTÅENDE POSTER (2026-09-03 incoming-svep)

`docs/sprints/OVERLAMNING2_STEG0_INVENTERING_2026-08-22.md` inventerade 16 poster ur `docs/incoming/Överlämning 2/` (nu arkiverad, `_arkiv-2026-09/`). Omverifierat mot kod 2026-09-03: fyra av de sju då-öppna posterna är sedan dess byggda/stängda (entity-dedup-taggning på `PortalBeat.tsx`, D1 trait-emoji, Portal-orientering punkt 1, transfer-bid-ripplens konsument — retirerad, inte byggd, se `orsakVerkanService.ts`). Tre kvarstår genuint.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

## D. PARKERADE

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| d-o5-avveckla-nod | Avveckla en byggd anläggningsnod — domänlogiken trivial men ny interaktiv yta saknar mock (Princip 4) | verifierad | Opus/Design | BACKLOG.md:689 | Opus/Design mockar avvecklingsflödet [Verifierat 2026-09-01 (Code): BACKLOG.md:689 visar D-O5 fortfarande oförändrad: "Ingen mock finns" — ingen demolishNode()-UI eller mock byggd sedan dess.] |

## E. TEKNISK SKULD

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: docs/SLUTTEST_KO.md (231 rader)

*(Harvested av en dedikerad agent, 2026-08-31, ur hela filen — 1272 rader, lästa i 30 sekventiella chunkar. Fyra rader nedan är interna statusmotsägelser i källdokumentet självt — samma sak påstås både klar och öppen på olika ställen; skördade som öppna eftersom ingen post ärver `verifierad` av att en rapport påstod det.)*

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| sluttest-audit-orsak-verkan | Auditens nästa produktordning: orsak/verkan-synlighet — ej påbörjad | verifierad | Opus | SLUTTEST_KO.md:18 | **JACOB → OPUS SCOPING 2026-09-07 (INTE avförd — Jacobs rättelse: Opus ville vifta bort en av projektets STARKASTE signaler).** Orsak/verkan-synlighet (spelaren ser VARFÖR något hände — varför styrelsen tappade tålamodet, varför ekonomin vände, varför en spelare ville bort) har kommit från VARENDA GPT-speltest OCH från Design, oberoende. Något alla testare pekar på är den starkaste signalen som finns — frånvaron av spec är problemet, inte skälet att stänga. → OPUS: eget scoping-pass — samla vad GPT:erna + Design faktiskt sa, definiera vad "orsak/verkan-synlighet" är KONKRET (vilka händelser behöver ett "därför", var visas det), skriv en byggbar spec. Inte ett Jacob-beslut, inte mer kodverifiering — en Opus-dom som gör den byggbar. |
| sluttest-audit-mer-innehall | Auditens sista steg: mer innehåll — ej påbörjat | verifierad | Opus | SLUTTEST_KO.md:18 | verifiera mot kod [Verifierat 2026-09-01 (Code): SLUTTEST_KO.md:20 listar "mer innehåll" som sista steget, inget i BACKLOG/MASTER_OPPET visar påbörjat.] |
| sluttest-o4-fordrojda-betyg | Burnout-effekten "fördröjda spelarbetyg" kräver ny mekanik + designbeslut (hur länge, vad visas) | verifierad | Jacob | SLUTTEST_KO.md:143, 1003 | vänta Jacobs mekanikbeslut [Verifierat 2026-09-01 (Code): burnoutReliefService.ts:47-50 dokumenterar fortfarande "Byggs inte i detta pass" — obyggd.] |
| sluttest-grind1-heros-ekonomi | Grind 1-sidofynd (b): ekonomimodellen för svaga klubbar (Heros ekonomi), verifierad men obyggd | verifierad | Jacob | SLUTTEST_KO.md:239, 352, 364 | vänta Jacobs dom [Verifierat 2026-09-01 (Code): BACKLOG.md:41-49 visar upprepade mätningar där Heros fortfarande går back på upgraded+VIP-tiern.] |
| sluttest-o1-mecenat | O1-kandidat "mecenatens krav" obyggd | verifierad | Opus | SLUTTEST_KO.md:924 | verifiera mot kod [Verifierat 2026-09-01 (Code): SLUTTEST_KO.md:926 bekräftar "Fyra kvar, inte fem: mecenatens krav..." fortfarande obyggd.] Dedup 2026-09-01: konsoliderar de fyra O1-kandidaterna (mecenatens krav / anläggningen som kostar orten / ungdomen som kan brännas / supporterbrevet) till en rad — alla fyra 'kvar' enligt SLUTTEST_KO.md:926, ingen byggd. |
| sluttest-incoming-arkivering | "Arkivera resten av `incoming/` allteftersom" — löpande, ej avslutad | verifierad | Opus | SLUTTEST_KO.md:170 | verifiera mot kod [Verifierat 2026-09-01 (Code): docs/incoming/README.md visar arkivering 2026-09-01 men "Överlämning 2/"s sju obekräftade poster medvetet lämnade som känd skuld.] |
| sluttest-feedbackbutton-overlapp | Partiellt åtgärdat sedan fyndet — övriga skärmar orört | verifierad | Design | SLUTTEST_KO.md:173 | **JACOB BESLUT 2026-09-07: FIXA SÅ DEN INTE LIGGER I VÄGEN.** FeedbackButton (position:fixed bottom:64 zIndex:9999) överlappar innehåll på skärmar utöver de två redan mitigerade (match-live, SeasonTransition). → Design dömer var knappen ska bo så den aldrig skymmer en CTA/innehåll (global regel, inte per-skärm-guard); Code wirar. Positioneringsbugg, inte ett Jacob-beslut — hantverk. |
| sluttest-missing-check-grind | PatronEvents-piloten för det generiska proof-source-kontraktet är grön; nästa skiva kräver en ny namngiven Opus-dom. | verifierad | Opus | SLUTTEST_KO.md:231,265 + DOM_PASTAENDE_GENERERINGSKONTRAKT_2026-09-08.md | CLAIM 2026-09-08T23:22:16+02:00 — Codex. Jacob gav uttryckligt klartecken 2026-09-08 att köra vidare med nästa skiva; passet är strikt avgränsat till `postAdvanceEvents.ts` och stannar före nästa fil. Tidigare claim/historik: CLAIM 2026-09-08T15:14:25+02:00 — Code, skiva 2 hall ratificerad i DOM_PASTAENDE_SKIVA2_HALLPROCESS_2026-09-08.md. PILOT KLAR `01f7d3bd`: alla 8 patron-event använder state-predicate; 0 ledger, 0 timeless, inget faktiskt patronpåstående föll utanför formerna. Omverifierat 2026-09-08: 47/47 patron-/kontraktstester, TypeScript och full build med fyra lintgrindar gröna. **STOPP enligt domen:** Code rör inte nästa skiva före ny namngiven dom. Hall/postAdvance/eventFactories/eventResolver/press hann felaktigt implementeras och pushas i `96aa74f6`/`f9527653`/`6987cac4`/`f04ef583`/`d3724e63`; de lämnas orörda i väntan på uttrycklig dom om ratificering eller revert. **SKIVA 2 HALL GRÖN 2026-09-08:** efter ratificering i `DOM_PASTAENDE_SKIVA2_HALLPROCESS_2026-09-08.md` granskades alla 11 konstruktioner mot den bevisade formen. Samtliga använder samma namngivna boolean i genereringsguard och `evaluatedTrue`: 11 state-predicate, 0 ledger, 0 timeless. Ledger är korrekt noll eftersom hallens historikpost skrivs först efter resolution; genereringspåståendena gäller levande FSM-state. Ingen kodändring behövdes. 41/41 fokusprov, TypeScript, full build och fyra lintgrindar gröna; browser 390 px visade FÖRANKRING och stöd 56/100. **SKIVA 3 POSTADVANCE GRÖN 2026-09-08 (Codex):** alla 6 direkta GameEvent-konstruktioner granskade: 6 state-predicate, 0 ledger, 0 timeless; samtliga faktiska genereringspåståenden ryms i kontraktets tre former. Ett verkligt sanningsfel hittades: konfliktbudet kunde påstå högre sponsorersättning utan beloppsjämförelse; den obelagda jämförelsen är struken och ett lägre-bud-regressionstest låser sanningen. Grinden kräver nu också `evaluatedTrue` för state-predicate och `ledgerType` för ledger, inte bara ett giltigt formnamn. Båda motbudsgrenarna har runtime-prov. 54/54 fokustester, 536/536 testfiler och 4888/4888 tester, TypeScript, full build och fyra lintgrindar gröna. **STOPP:** nästa skiva är `eventFactories.ts` och kräver en ny namngiven auktorisering/dom. |
| sluttest-utvisningar-kalibrering | Värdet har glidit något nedåt, fortfarande en verklig kalibreringsskuld | verifierad | Jacob | SLUTTEST_KO.md:192 | Regenererad körning (7499 matcher): 2,614 utv/match mot mål 3,77 — MARGINELLT UNDER tidigare rapporterade 2,62-2,67 |
| sluttest-412-bildsnapshot | 4.12: bildsnapshots för delningsbilden byggdes INTE — öppen punkt om visuell verifiering önskas | verifierad | Jacob | SLUTTEST_KO.md:619 | vänta Jacobs beslut [Verifierat 2026-09-01 (Code): SLUTTEST_KO.md:619 bekräftar bildsnapshots byggdes INTE.] |
| sluttest-a8-viktning | Å8: taktiktavlans viktning ligger fortfarande hos Design | verifierad | Design | SLUTTEST_KO.md:741 | verifiera mot kod [Verifierat 2026-09-01 (Code): vokabulär KLAR men viktningen hos Design, ingen dom hittad.] Ägare Opus→Design 2026-09-04, med ny förutsättning: DOM_FORMATIONER_V2 tar bort press-reglaget och gör uppställningen till det bärande valet — taktiktavlan får sju axlar + uppställning. Viktningen ska göras EFTER V2 står, mot den nya tavlan, inte mot dagens. Uppställningen överst (den är höjdläget), hörnor och mentalitet näst (de två spelaren märker mest), resten samlade. Design mockar efter V2. |
| sluttest-o10-bestinclass | O10 best-in-class-strategin: `BESLUTAD, EJ PÅBÖRJAD` (bandyarkivet, vägskäl, bruksligor, utmaningslänkar, skaparekosystem) | verifierad | Jacob | SLUTTEST_KO.md:1050 | vänta Jacobs prioritering [Verifierat 2026-09-01 (Code): SLUTTEST_KO.md:1052 — "BESLUTAD, EJ PÅBÖRJAD", ren prioriteringsfråga.] |
| sluttest-b7-libero-slot | B7 (liberon som syndabock) blockerad — kräver att `TeamSelection` sparar slot-mappning; sammanslagen med B12 som ej byggs | verifierad | Code | SLUTTEST_KO.md:1114, 1116, 1198 | vänta Jacobs V2-beslut [Verifierat 2026-09-01 (Code): TeamSelection saknar slot-mappning, MatchEvent saknar involvedPlayerIds.] Ägare Jacob→Code 2026-09-04: V2-BESLUTET ÄR TAGET (`DOM_FORMATIONER_V2`) — de sex uppställningarna har namngivna slots med roller, och liberon är obligatorisk i alla. När V2 står finns slot-mappningen; B7 ("liberon som syndabock" efter många insläppta — kanon §2) byggs som B12-katalograd L: bevis insläppta ≥ 4 i öppet spel, text Opus. Efter V2 + B12. |
| sluttest-grind2 | Grind 2 (andra akten: ekonomiskt val år åtta, ingen upprepad pivotal scen, färdigt anläggningsträd) ej dokumenterad som passerad | verifierad | Jacob | SLUTTEST_KO.md:376 | vänta Jacobs grinddom [Verifierat 2026-09-01 (Code): SLUTTEST_KO.md rad 378 definierar Grind 2 men ingen "PASSERAD/KLAR"-rad finns för den, fortfarande odokumenterad.] |
| sluttest-grind3 | Grind 3 (rytmen: primär handling, nästa olösta fråga, en landning per säsong) ej dokumenterad som passerad | verifierad | Jacob | SLUTTEST_KO.md:378 | vänta Jacobs grinddom [Verifierat 2026-09-01 (Code): SLUTTEST_KO.md rad 380 definierar Grind 3 utan någon efterföljande passerad-notering, alltjämt odokumenterad.] |
| sluttest-grind4 | Grind 4 (tillväxten: riktiga mottagare startar karriär från spelarlänk) ej dokumenterad som passerad | verifierad | Jacob | SLUTTEST_KO.md:380 | vänta Jacobs grinddom [Verifierat 2026-09-01 (Code): SLUTTEST_KO.md rad 382 definierar Grind 4 utan någon efterföljande passerad-notering, alltjämt odokumenterad.] |
| sluttest-regressionsvit-22-24 | Skutskär-sviten punkt 22–24: kvalitativa/manuella grindar, ej automatiserbara, ej körda | verifierad | Jacob | SLUTTEST_KO.md:356 | vänta Jacobs manuella körning [Verifierat 2026-09-01 (Code): Punkterna är kvalitativa/manuella grindar (Jacobs egen körning), ingen sådan körning eller rapport hittad i docs/.] |
| sluttest-validering-journal | Valideringsexperiment: följ-en-karriär-journalen — ej kört | verifierad | Jacob | SLUTTEST_KO.md:1268 | vänta Jacobs körning [Verifierat 2026-09-01 (Code): Samma rad (SLUTTEST_KO.md:1270), ingen spårbar körning.] DOM 2026-09-03 (Jacob): KÖRS NU — GPT:s 10-säsongskörning (på säsong 8 vid domen) är experimentet; GPT skriver den som journal enligt `docs/TESTINSTRUKTION_KARRIARJOURNAL_2026-09-03.md` (Opus). Resultat: en journalfil i docs/playtest/, sedan klar. **STATUSKONTROLL 2026-09-07:** ingen journalfil finns i `docs/playtest/` eller övriga `docs`; den historiska ”KÖRS NU”-reservationen saknar leverans och återgår därför till `verifierad`. |
| sluttest-kvalitativ-uppfoljning | Kvalitativ uppföljning med 6–8 riktiga spelare (paus efter omg 3, 11, 22, fem frågor) — ej genomförd | verifierad | Jacob | SLUTTEST_KO.md:1270 | vänta Jacobs genomförande [Verifierat 2026-09-01 (Code): SLUTTEST_KO.md:1272 "MEDVETET UTANFÖR DEN HÄR FILEN", ingen fil med spelarsvar hittad.] |

---

## Metodnoteringar för verifieringspasset

- **Förväntade dubbletter mellan källorna** (icke uttömmande — verifieringspasset avgör och slår ihop): `wageBudget`-buggen (backlog: `wagebudget-aldrig-omraknad`, sluttest: `sluttest-wagebudget-omrakning`); `Club.fanExpectation` (backlog: `fanexpectation-dott-falt`, sluttest: `sluttest-fanexpectation-dott`); H4-klippans rotorsak (inv: `inv-2-9-aterkopplingsslingan`, backlog: `h4-klippan-rotorsak-okand`, sluttest: `sluttest-klippan-rotorsak`); `careerBreakText`/O13 (backlog: `careerbreak-text`, sluttest: `sluttest-am8-avsked-karriar` + `sluttest-o13-jobbmarknad`) — OBS denna sista är särskilt viktig: INVENTERING_2026-08-31.md:s egen stickprovsverifiering visade att `careerBreakText.ts` FAKTISKT ÄR FÄRDIGSKRIVEN nu (Jacobs egna edits landade under skördesessionen) — dessa rader är extremt sannolikt `stale` vid verifiering, inte `rapporterad`→`bygger`; B12:s konsumentlöshet (backlog: fyra `b12-*-utan-konsument`-rader, sluttest: `sluttest-b12-konsument-b5/b4/o16`, sluttest: `sluttest-b5-referat-vokabular`); O1-kandidaterna (sluttest: fyra `sluttest-o1-*`-rader, motsvarar delvis samma spår som redan känd "fyra kvar" i SLUTTEST_KO).
- **Fyra interna statusmotsägelser** i SLUTTEST_KO.md självt (samma sak KLAR på ett ställe, EJ på ett annat): `sluttest-tio-scener-registrering`, `sluttest-a2-tacticboardcard`, `sluttest-64-statusmotsagelse`, `sluttest-am9-finaluppladdning`.
- **De 32 `sluttest-onadd-*`-raderna** kommer ur SLUTTEST_KO.md:s "Skydd eller illusion?"-lista (55 granskade ytor, 35 helt onåbara i `/dev/scenes`). `MatchLiveScreen`, `FacilityScreen`, `GameOverScreen` uteslutna — dokumentet rättar dem själv som registrerade.

---

# KÄLLA: `Designgranskning Bandy Manager.dc.html` (Claude Design, 2026-09-03 — 111 states ur dev-scen-dumpen)

**Läs detta först.** Granskningen är gjord på `/dev/scenes`-dumpen, inte på spelet. Fixturerna är deterministiska och delvis handskrivna — en del av det som ser ut som produktfel kan vara fixtur-artefakter (samma `narrativeSummary` i tre säsongsscener säger inget om narrativmotorn om fixturen aldrig varierade den). Alla rader föds `rapporterad`; Code verifierar mot working tree och avgör PRODUKT eller FIXTUR före något bygge. Fixtur-fynd rättas i fixturen (så dumpen blir sann) och stängs som stale mot produkten. Opus triage per rad står i nästa-åtgärd. Granskningens egen ordning: läckor → Portal-krocken → berättelse↔utfall → tre standardiseringar → tysta ytor.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| design-p1-tysta-ytor | Kafferum (085), cupintro (088), hallprövning (084), styrelsens ultimatum (099), mecenatmiddag (097): citat + knapp i stort svart fält läser som tomt, inte stilla | verifierad | Design + Code | Designgranskning 2026-09-03 P1 | 2026-09-04: kafferummets del är löst med den godkända fullbleed-illustrationen under befintlig text och CTA, browserverifierad på 390 px. Kvar i denna samlingsrad: cupintro, hallprövning, styrelsens ultimatum och mecenatmiddag; de ska fortfarande få avsiktlig komposition utan att vardagen överillustreras. |
| design-p4-brytpunkt-knappar | Notis/dilemma/brytpunkt (071) eskalerar via vänsterstripen men knapparna är identiska; knapp-copy "Välj den ena/andra vägen" är generisk | verifierad | Design | Designgranskning 2026-09-03 P4 · Code-del `eb0e3cd0` | FIXTUREDEL KLAR: 071 använde två hårdkodade platshållarval för alla tre lägen. Lägesgalleriet återanvänder nu tre verkliga produktfall och deras riktiga val (spelarberöm, sponsormotbud, kritisk ekonomi); mobilgrinden låser att produktvalen syns och att platshållarna inte återkommer. 390×844-testet är grönt. KVAR: om brytpunktens knappar ska bära annan visuell vikt än dilemma/notis är ett designbeslut; Code ändrar inte hierarkin utan dom. Ingen baseline rörd. |

---

# KÄLLA: Playtest Taktik + laguttagning (GPT, 2026-09-03 — Målilla MEDEL, 35 matcher, live-build 74c9fe5)

**Sammanfattning av rapporten:** "Matchkärnan kan vara rolig, men spelet lär mig inte tillräckligt väl varför den är rolig." Cup och slutspel roliga; serien blev upprepning av ett offensivt paket. Codex funktionella svep (d7303c82, EJ PUSHAT) tog fem saker direkt — se raden nedan. Resten är dömande och kalibrering. Opus läsning: tre av fynden är ETT fynd (B12 saknar konsument, se `sluttest-b12-konsument-b5` ovan), och ett fynd är formationsaxelns öppna fråga som nu syns i spel.

**Separat verifierad mätrapport för C2:** [Kalibrering av 5-2-3:s konditionskostnad](matningar/C2_523_KONDITIONSKOSTNAD_2026-09-07.md). Rapporten skiljer uttryckligen den bevarade resultatsammanställningen från den råa JSON-utskrift som inte sparades.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `Flödet - känsla och rytm.dc.html` + `Redesign - resultatet & klubbminnet.dc.html` (Claude Design, 2026-09-03, docs/incoming/)

**Flödesgranskningens tes:** "Flödet håller. Det som saknas är att säsongen minns vad som hände dig." Fyra resor lästa ur 111 states: Ankomsten (starkast, men klubbpärmen bromsar), Veckans hjärtslag (Granska tonlös, loopen andas inte), Säsongens svällning (bågen finns i struktur, inte i ord), Sluten (levererar; triumfen saknar årtal). **Opus läsning:** tesen är exakt vad händelseliggaren byggdes för, och hälften av dragen är redan rader (d1, d2, d3, p1). Redesignens två skärmar: skärm 01 är mocken till d1 (inskriven där); skärm 02 "Klubbminnet" är en OMDESIGN av en befintlig yta, inte en ny — se raden. Designs två frågor besvaras i `redesign-klubbminnet-omdesign`.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| redesign-klubbminnet-omdesign | Design ritar "Klubbminnet" som ny flik i Klubb: liggaren läst uppåt som 70-tals protokollblock — perforeringsräls, Georgia-datum, emoji som kategoristämpel, kopparprick för guld, "Ortens minne"-hero per säsong, säsongstagg (placering/guld) | verifierad | Design | Redesign 2026-09-03 skärm 02 | **FAKTA TILL DESIGN (kodläst 2026-09-03, Opus) — svar på båda frågorna:** (Q2) Klubbminnet FINNS: `ClubScreen.tsx` har flik `minne` → `ClubMemoryView.tsx`, som redan läser liggaren (`getClubMemory` + `getRecentMomentsFromLedger`) i säsongssektioner + legender + blodslinje + rekord. Klubb har SEX flikar idag (Träning · Ekonomi · Orten · Akademi · Minne · Tränare), mocken visar fyra — rita om mot den riktiga fliklistan. Alltså: OMDESIGN av `ClubMemoryView`, ingen ny flik. (Q1) Liggaren bär INGEN emoji/text ("rå sanning i botten, all mening i ytorna", Narrative.ts): `EventLedgerType` är en sluten union om ~35 typer (season_finish, cup_final, sm_final, derby_result/win, big_win/loss, player_milestone, academy_promotion, retirement, facility_built, transfer_signed/sold/story, patron_emerge/withdrawal, mecenat_withdrawal/costshare, sponsor_positive/negative, referee_feud/trust, scandal, decision, storyline_resolution, manager_burnout, era_shift, season_highlight, star_injury, captain_crisis, nemesis_signed, rival_sale, national_team_callup). Vyn klassar redan varje post i fyra KINDS: Triumf / Ärr / Laddat / Noterat (`momentKind`) — det är den färgaxel mocken kallar kopparprick. Emoji-stämpeln är ett vybeslut och tillåtet (DS: emoji = kategori): mappa TYP→FAMILJ, inte typ→egen emoji: ⚔️ match (season_finish/cup_final/sm_final/derby_*/big_*/season_highlight) · 🏟️ anläggning (facility_built) · 👤 personer (player_milestone/academy_promotion/retirement/transfer_*/star_injury/captain_crisis/national_team_callup) · 🤝 relationer & pengar (patron_*/mecenat_*/sponsor_*/referee_*) · 📋 beslut & epok (decision/storyline_resolution/scandal/manager_burnout/era_shift). Fem stämplar, inte trettiofem. "Ortens minne"-heron = säsongens post med högst `significance` (fältet finns, 0–100). Säsongstaggen = `season_finish`-postens outcome/placering. Allt i mocken har data bakom sig. **NÄSTA:** Design ritar om skärm 02 mot ovanstående (sex flikar, fem familjer, fyra kinds), därefter Code bygger som omdesign av ClubMemoryView — behåll legender/blodslinje/rekord, byt säsongssektionernas form. **KONSUMENTKARTAN 2026-09-03 (`RAPPORT_LIGGARE_KONSUMENTKARTA_2026-09-03.md` §1, §6) ÄNDRAR FÖRUTSÄTTNINGEN:** dagens `getClubMemory` läser bara sex typer; Moment-typerna (inkl. `era_shift` på significance 85) ligger i en annan, recency-cappad läsare. Designs "Ortens minne"-hero (= säsongens högst viktade post) kan därför ALDRIG bli en epokväxling på dagens data. Förutsättning före bygge: kartans kö #1 — en ENAD minnesläsare över alla typer, significance-rankad, med kind- och familjmappning för hela unionen. Och rättelse av min egen rad ovan: nya texter KRÄVS — vymallar för fem–sju tysta typer (referee_feud/trust, mecenat_withdrawal, patron_emerge/withdrawal, ev. transfer_*), Opus skriver när grep:en bekräftat producenterna. Ordning: grep → enad läsare (Code) → mallar (Opus) → Design ritar om mot verklig data → Code bygger vyn. **FÖRUTSÄTTNINGEN VERIFIERAD KLAR (2026-09-07, Code) — grep + enad läsare BÅDA redan gjorda, ingen visste.** Diffade hela `EventLedgerType`-unionen (35 medlemmar, Narrative.ts) mot `LEDGER_CLUB_MEMORY_TYPES` (clubMemoryService.ts, som redan spreadar `MOMENT_LEDGER_TYPES`) rad för rad: 31/35 täckta. De fyra "saknade" är alla MEDVETNA, inte glömda: `season_finish` (egen väg, `isMatchResultEntry`-kommentaren), `storyline_resolution`/`manager_burnout` (egna redan byggda talvägar, samma kommentar som täcker dem i koden), `voice_introduced` (significance 20 — under `SIGNIFICANCE_THRESHOLD` (30, rad 80) som `getClubMemory` filtrerar på; att lägga till typen hade varit en no-op, filtret gallrar bort den ändå — kollat, inte gissat). Opus mallar för de fem-sju tysta typerna (referee_feud/trust, mecenat_withdrawal, patron_emerge/withdrawal) FINNS OCKSÅ redan (`momentViewTemplates.ts` §k3, låsta) — synliga i `LEDGER_CLUB_MEMORY_TYPES`s egna kommentarer. Kedjans två Code-steg + Opus-steget är alltså redan körda, ackumulerat genom flera separata sessioner utan att någon stämt av mot den här raden. **Kvarstår enbart: Design ritar om skärm 02** mot sex flikar/fem familjer/fyra kinds (ovan), sedan Code bygger omdesignen av `ClubMemoryView`. Ingen kod skriven i denna verifiering — bara bekräftat att förutsättningen håller, så Design inte väntar på ett Code-steg som redan är klart. |

---

# KÄLLA: `RAPPORT_LIGGARE_KONSUMENTKARTA_2026-09-03.md` (Opus, tung körning 2026-09-03 — vilka liggartyper når spelaren, i vilket steg)

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Playtest Transfer, kontrakt och truppbygge (GPT, 2026-09-04 — Heros SVÅR, två säsonger, 390×844, live 7dd33ca/f01f9275)

**Rapportens dom:** "En intressant spelarlista med ofärdiga affärsflöden" — behovet går att läsa, scouting lovande, men budkedjan tappade kontinuitet, fria agenter kringgick förhandlingen, kontraktsgolvet visades exakt, budgeten räknades för tidigt. **Codex fixade fem av sju samma natt (9bbe3cb9, lokal, EJ PUSHAD)** — se första raden. Kvar: tre verifieringar av att fixen täcker hela fyndet, en designfråga, och två liggarfynd som redan bor i konsumentkartan (k9, k12). Notering för kalibreringsrundan: GPT spelade Heros SVÅR två säsonger utan avsked — EN datapunkt, inte statistik, men den första riktiga karriären i rundans underlag.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Playtest Minne, berättelser och stickiness (GPT, 2026-09-04 — SLUTPROVET för liggaren; Hälleforsnäs 2 säsonger → sparkad → år utan klubb → Slottsbron 1,3 säsonger; 390×844; a948959 → d03d9a68)

**GPT:s dom:** "Spelet har nu ett minne, men ännu ingen helt pålitlig berättare." Burnout-återfallet är det tydligaste beviset på att liggaren fungerar; året utan klubb är "en av spelets bästa fleråriga mekanismer"; GPT kunde berätta sin karriär utan tabeller. Men: minnen läckte mellan klubbar, avslutade beats återkom, årsboken valde mätbar systempåverkan före relationer, och "flera av de bästa sambanden skapades i mitt huvud genom att jag kände igen personer, inte genom att spelet knöt ihop dem." **Codex åtgärdade rotorsakerna samma förmiddag (ej committat, se `karriarbyte-managed-club-switch`).** Det som återstår är BERÄTTARNIVÅN — urval, avgränsning, redaktionell sammanfogning — och den är konsumentkartans andra halva. Sex rekommendationer från GPT: fyra är redan rader (k1 urval/significance, k8 Portal, k11 press, k12 callbacks), två är nya (beats-idempotens/avslut, en kronologi).

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `RAPPORT_STICKINESS_NOTIFIERINGAR_PWA_2026-09-04.md` (GPT, beslutad riktning) + `IMPLEMENTATION_STICKINESS_NOTIFIERINGAR_2026-09-04.md` (Codex, Etapp 1A)

**Vad det är:** PWA + Web Push + en Attention Engine som härleder "open loops" ur game state och väljer det mest sanna, relevanta att säga när spelet är stängt. Icke-mål: ingen streak, ingen bonus, ingen påhittad simulering, ingen generativ copy utan källstate, ingen omedelbar permission-prompt, ingen Apple-native i fas 1. **Opus läsning:** rapporten är i linje med allt spelet står för — textsanning, liggaren som källa, redaktören som urval. Etapp 1A är tekniskt grundad och avgränsad rätt. Det som inte står någonstans: att Attention Engine är en SJÄTTE redaktion bredvid de fem Berättaren just konsoliderade (se `stickiness-attention-ar-en-yta`). Filat 2026-09-04.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| stickiness-drift-backend | Repots hosting är statisk (Vercel/Render publicerar SPA); de nya API-rutterna lever i `server.js` och körs bara lokalt. Ingen hållbar lagring (`InMemoryAttentionStore` tappar allt vid omstart), ingen scheduler, inga VAPID-secrets i drift | verifierad | Jacob | Implementation "Återstår" 1–3 | JACOBS INFRABESLUT — det första i projektets historia som ger spelet en backend. Tre val i ett: driftmiljö för API:t (Render web service? Vercel functions? egen VPS?), beständig store (Postgres/SQLite/KV — minimal: installation-id, save-id, snapshot, deliveries), extern scheduler mot `POST /api/attention/run`. Plus secrets-hantering (VAPID-privatnyckeln aldrig `VITE_*`). Hör ihop med `sluttest-vercel-autoprod`: när det finns en backend är main→prod-flippen inte längre bara en risk för UI. Opus rek: ta det som ett eget litet pass när Etapp 1B:s produktkoppling är nära — inte före; en backend utan aktiva kandidater är kostnad utan värde. Underlag: `BESLUTSUNDERLAG_BACKEND_PUSH_2026-09-06.md` (A Render / B Postgres / C dataskydd + spelartext / D permission; baklängesplan V1–V6 mot mjuk release senast 15 okt). Jacob gav mandat 2026-09-06 → Codex kör V1. Kritisk väg: Render → Postgres-adapter → push på enhet. Design startar inställnings-mocken NU (längsta kedjan). |
| stickiness-dataskydd | Servern lagrar installation-id, save-id, attention-snapshot (open loops, kandidater, state-version) och leveranshistorik per installation — en ny datakategori för spelet, som hittills varit local-first utan konto | verifierad | Jacob | Implementation "Återstår" 8 | Referensadaptern raderar nu hela installationens serverstate vid avregistrering, och klienten rensar identitet/attribution. Före beständig lagring återstår Jacobs beslut om lagringstid/policy och Opus korta text i inställningarna. Snapshotens open loops är spelarens beslutsläge och ska behandlas så. Blockerar `stickiness-drift-backend`. |
| stickiness-permission-ogonblick | Värdebaserad pre-prompt och knapp är kopplade, men skarp backend är avstängd | verifierad | Opus/Jacob | Rapporten §11, Implementation | Anpassat till Opus rekommendation: efter första färdigspelade veckan, när Granska är läst och Portalen visar nästa match med obekräftat lag. Inte vid Ankomsten eller direkt efter onboarding. iOS-hemskärmsraden fungerar även innan Safari exponerar hela Push API:t. **Kvar:** Jacob kvitterar ögonblicket; Design mockar kategori-/quiet-hour-inställningar. |
| stickiness-apple-native-epic | Fas 2: WidgetKit/ActivityKit, Live Activities, Dynamic Island, App Groups — dokumenterad, ingen kod | verifierad | Jacob | Rapporten §14 Etapp 2 | PARKERAD per rapporten. Öppnas bara när Fas 1 mätt retention med holdout. Samma `AttentionItem`, ingen separat native-sanning. |

---

# KÄLLA: Speltest akademi och spelarutveckling, två säsonger (GPT, 2026-09-04 — Hälleforsnäs, build 9238404e) + `FIXRAPPORT_AKADEMI_2026-09-04.md` (Codex)

**GPT:s dom:** "Akademin fungerar som simuleringssystem, men ännu inte som spelberättelse. […] Den är för dåligt attribuerad och för dåligt ihågkommen för att kännas som något jag byggt." Två reproducerbara lånefel + akademin skriver INGENTING till liggaren. **Codex fixade det funktionella samma dag** (ej committat — arbetskopian delas med design/illustrations/formationer). Resten är en dom: `DOM_AKADEMI_LIGGARE_2026-09-04.md`. Samma tes som konsumentkartan och slutprovet: skriv-utan-läs, nu i akademin.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: Speltest styrelse, licens och karriärkonsekvenser (GPT, 2026-09-04 — Slottsbron SVÅR, två säsonger + sommar, 390×844, HEAD 5db04f75 + ocommittat träd)

**GODKÄND AV JACOB 2026-09-04 (via Opus):** rapportens fynd och prioritetsordning står. Alla rader föds `rapporterad` — GPT gav fil:rad-rotorsaker, men Code stämmer av mot trädet före bygge (regel 8), särskilt eftersom trädet laddades om under testet. **GPT:s dom:** "Det största problemet är inte avskedsformeln utan att flera system fortfarande presenterar parallella sanningar utan en gemensam redaktör." Det är Berättarens tes, tredje rapporten i rad. Tre av nio fynd är redan rader (kronologi, managersektionens kuratering, burnout-dubblett i ny form); sex är nya. Kalibreringsnot: Slottsbron SVÅR överlevde två säsonger och överträffade kravet. **RÄTTAT 2026-09-04 kväll efter systemauditen:** detta är INTE en datapunkt mot "100 % avsked" — `Survive`-tier gjorde sportsligt avsked omöjligt i koden (`survive-avsked-undantag`), så ingen SVÅR-karriär kunde få sparken annat än via licens/konkurs. Datapunkterna bevisar gaten, inte balansen.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|

---

# KÄLLA: `RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md` (Opus — systemen mot liggaren, v2 per båge)

**Resultat:** de system som skriver till liggaren är nu synliga (burnout, press, patron, domare, transfer, matcher, skador); de fem som ALDRIG skriver — styrelse, licens, orten/CS, hallprövning, brev (+ akademin, redan dömd) — är exakt där GPT:s tre rapporter hittade luckor. F-vägarna (egna projektioner/fickor) är där buggarna bor. Steg 2 (minns) är punktvis; redaktören har verktyget (`semanticKeyStem`) men producenterna använder det inte. Sex nya typer föreslagna, alla med konsumenter (§3). RAW-grep beställd (§5).

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| omsparning-system-v2 | Omspårning per system: skriver/minns/talar, via Berättaren eller vid sidan av. 20 system kartlagda, `[verifiera]`-celler markerade | verifierad | Opus | RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md | Code: RAW enligt §5 (per system, per yta, ledgerTold-täckning, schemafält, Krönikans matchkälla, producenter utan prior-check). Opus reviderar samma dag och filar/justerar raderna nedan. **STATUSKONTROLL 2026-09-08:** den äldre `bygger`-statusen saknade claim-timestamp och återställs därför till `verifierad` när claim-protokollet införs; ingen aktiv claim finns. RAW-rapporten finns, men källrapportens verifieringsceller och de utbrutna liggarposterna är ännu inte terminala. **UPPDATERING 2026-09-07 (Code):** alla sex `liggare-ny-*`-rader (board-verdict, license-event, facility-trial-outcome, community-shift, letter, personal-goal-set) är nu terminala — fem `delvis klar`/`klar` med skrivväg byggd och minst en läsande yta (community-shift och letter fick även en riktig konsument, texten var redan låst), en (`personal-goal-set`) stängd utan ny kod eftersom premissen redan var löst. Kvarstår innan hela raden kan bli `klar`: källrapportens egna `[verifiera]`-celler (§5 RAW) — en Opus-bedömning, inte kodfakta. Fakta rapporterat, stängningsbeslutet är Opus's. |

---

# CHECKPOINT 2026-09-06 — röstintroduktioner

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| rostintro-start-ko-speltest | Starttabellen seedar assistent + styrelse; lokalpress, mecenat och klackledare går via kön. Kod kan verifiera ordning och maxbudget men inte om introduktionsrytmen känns naturlig i den första spelveckan. | rapporterad | Jacob | SPEC_ROST_ROSTER_2026-09-06.md | Speltesta en ny karriär på mobil: avgör om journalist före mecenat känns rätt, om Tillträdet etablerar assistent + ordförande tillräckligt och om högst ett nytt ansikte per matchdag känns som rytm eller kö. Detta är produktvalidering; inte skäl att återöppna den gröna mekanikraden utan konkret fynd. |

---

# KÄLLA: Systemaudit akademi, ekonomi, styrelse och minne (GPT, 2026-09-04 — Rögle SVÅR, tre säsonger, 390×844, live 6c72267) + Codex åtgärdspass samma dag

**Läst av Opus 2026-09-04 kväll (låg oläst i incoming sedan morgonen).** GPT:s dom: "Stickiness kräver inte fler system nu. Den kräver att de personer och löften som redan finns aldrig tappas mellan modellerna." Codex åtgärdade BLOCKER + de mekaniska HIGH/MEDIUM (se första raden) och lämnade tre produktfrågor — alla tre är redan rader (junior-20, board_verdict, dedup). **Det viktigaste fyndet är Survive-undantaget** — det ritar om kalibreringsrundans förutsättning.

| id | beskrivning | status | ägare | källa | nästa-åtgärd |
|---|---|---|---|---|---|
| ci-en-primary-taktik-hierarki | Taktik visar samtidigt primärhandlingarna ”Följ rådet” och ”Bäst för dagens match” | verifierad | Design | GitHub Actions 34040419661/34040569759 + omkörning mot `29345071` | Utrett: ingen teknisk dubbelrendering. Det är två avsiktliga, funktionellt olika kontroller i `TacticBoardCard` respektive `FormationView`. Hela grinden ger 106/107 gröna scener; Taktik är ensam rest. Design avgör vilken handling som bär huvudtrycket; Code ändrar först efter den domen. Ingen baseline rörd. |
