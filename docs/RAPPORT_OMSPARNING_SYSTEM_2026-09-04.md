# OMSPÅRNING — SYSTEMEN MOT LIGGAREN (v2, per båge)

**Datum:** 2026-09-04 · **Av:** Opus · **Föregångare:** `RAPPORT_LIGGARE_KONSUMENTKARTA_2026-09-03.md` (per typ). Den här är **per system**: skriver systemet till liggaren, minns det (steg 2: återfall/årsdag/told), talar det (steg 3: vilka ytor), och går det genom Berättaren eller vid sidan av?
**Status:** kodläst där det står så; `[verifiera]` = Codes grep (order i §5). Tre GPT-rapporter samma dag säger "parallella sanningar utan redaktör" — det här är listan över var sanningarna fortfarande är parallella.

**Läst för den här kartan:** `redaktorenService.ts`, `ledgerToldService.ts`, `currentChronology.ts` (Berättaren steg 1–2 som byggda), plus förra kartans nio konsumenter, `hallProcessService.ts`, `licenseService.ts`, `refereeService.ts`, `clubMemoryService.ts`, `pickEfterklang.ts`, `portalBuilder.ts`, `orsakVerkanService.ts`, Codex rapporter 09-04.

## 1. Berättaren som byggd — det alla system nu KAN gå genom

`redaktoren(game, chronology)` → rankad agenda över `readClubLedger` (strikt clubId) med relationsvikt 1,4/1,0/0,8, tre färskhetsköer (sedan sist 4 omg, årsdag, bakgrund 0,2), ytspecifik otaldhet 0,3/0,7/1 ur `ledgerTold`, eskaleringsreset via `semanticKeyStem`. Sju ytor: portal, efterklang, press, yearbook, review, coffee_room, push. **Inkopplade:** Portal `memory_card`, årsbok (`seasonPerson` + k6), push-adaptern. **Ej inkopplade än:** efterklang (läser fortfarande åtta fickor), press (k11), review-callbacks (väntar managerId), coffee_room. Så: redaktören finns, tre av sju ytor läser den. Det är läget varje system nedan mäts mot.

## 2. Kartan per system

Kolumner: **Skriver** (typer) · **Minns** (steg 2) · **Talar** (ytor, B = via Berättaren, F = ur egen ficka/direkt) · **Lucka**.

| System | Skriver | Minns | Talar | Lucka |
|---|---|---|---|---|
| **Burnout** | `manager_burnout`, `decision` | `isBurnoutRelapse` ✓ | årsbok managerSeason (F, egen projektion), Portal BurnoutMark (F), återfallstext ✓ | relief+tak samtidigt (PRIO 1); managersektionen oredigerad (kuratering); båda är redaktion, inte lagring |
| **Pressen / journalist** | `storyline_resolution` (feud/redemption) | `hasPriorStorylineResolution` ✓ | Krönikan (B via k1), årsbok (B), **Efterklang (F: journalist.memory-cache)**, pressens frågor (F: egna pooler) | Efterklang oförändrad två säsonger = fickan; k11 pressen läser inte agendan än |
| **Patron** | `patron_emerge`, `patron_withdrawal` (k5 fixad) | ingen återfallslogik `[verifiera: patronArc state]` | Krönikan + Portal + årsbok (B via k3-mallar), Efterklang (—) | patron är hög-significance men Efterklang ser den inte förrän steg 6 |
| **Mecenat** | `mecenat_costshare`, `mecenat_withdrawal` | — | B via k3 | samma som patron |
| **Sponsorer** | `sponsor_positive/negative`, `decision` | sponsorNetworkMood live ✓ (rätt: live-state) | B via k1 | inget — mood är inte minne |
| **Transfer / marknad** | `transfer_signed/sold` (k9), `transfer_story`, `nemesis_signed`, `rival_sale` | — | Krönikan (B, filter fixat), push memory.ex_player (B), **callbacks (ej byggda: väntar managerId)** | Jari-mot-oss finns i liggaren, sägs inte i Granska än; AI-dubbelflytt (ny rad) |
| **Styrelse / boardExpectation** | `decision` (via seasonDecisionCapture) — **inga egna poster** | boardObjectiveHistory (F), `isRepeatedObjectiveFailure` ✓ (F) | styrelsemöten (F: seasonSummaries), årsbok boardTruth (F) | **Styrelsens dom är inte i kanon.** "Uppdrag hängde löst", "över/under förväntan", varning vid omgång 7/14/22 — inget skrivs. Krönikan kan inte minnas att styrelsen tappade tålamodet 2027. Föreslagen typ: `board_verdict` (§3) |
| **Licens** | **inget** — `licenseRiskScore`/`licenseStatus` är state | ackumulatorn ✓ (F) | licensbrev (F), årsbok "Dina val" (**FEL yta**, ny rad) | **Licensnämnden är inte i kanon.** En varning, ett poängavdrag, en handlingsplan lämnar inget spår. Föreslagen typ: `license_event` (§3) |
| **Domarrelation** | `referee_feud`, `referee_trust` | refereeService läser eget state ✓ | B via k3-mallar, press via agenda (när k11) | inget nytt sedan k3 |
| **Klacken** | `decision` (klackval), storylines (tifokonflikt) `[verifiera typ]` | klackEcho live (rätt: live-state) | Efterklang klackEcho (F, korrekt), årsbok? `[verifiera]` | tifokonflikten Frida/Birger utvecklades bra (GPT) — vilken typ bär den? `[verifiera]` |
| **Orten / CS** | `decision` (aktiveringar), `facility_built` | — | Orten-vyn (live), Krönikan (facility) | **CS-vändningar är inte händelser.** "Orten vände" när CS korsar 50/70 finns inte som post. Föreslagen typ: `community_shift` (§3) — spegel av `repMilestone` |
| **Hallprövning** | `facility_built` vid bygge — **inget för prövningens utfall** | cooldown vid bordlagd (F) | processkort (F) | **Ett bordlagt eller nedlagt hallbygge glöms.** Föreslagen typ: `facility_trial_outcome` (§3) |
| **Akademi** | **inget** (DOM_AKADEMI_LIGGARE: åtta typer dömda, ej byggda) | mentorskap state (F) | Blodslinjen (F), årsbok akademidel (F: youthIntakeHistory) | känd, dömd, byggbar |
| **Landslag** | `national_team_callup` | — | Krönikan (B), personligt mål payoff ✓ | inget |
| **Skador / kapten / skandal / epok** | `star_injury`, `captain_crisis`, `scandal`, `era_shift`, `season_highlight` | årsdagar (B via k2) ✓ | Krönikan + Portal + årsbok (B) | inget sedan k1 |
| **Matcher** | sex resultattyper med `result` (k9) | årsdagar (B) | Krönikan `[verifiera: läser den liggaren nu, eller fortfarande fixtures för innevarande?]`, Granska (F: fixture) | Granska-uttågsbuggen (PRIO 2) är F-vägens fel: egen fixture-sökning i stället för kanonisk hjälpare |
| **Brev (bandyLetters)** | **inget** — `bandyLetters` ficka | — | brevarkivet (F), Efterklang followUp (F) | GPT: "brevarkivet är durabelt och personligt" — men Berättaren ser det inte. Typ `letter` (§3); Code avgör (SPEC_BERATTAREN §5) |
| **Orsak/verkan** | `decision` | — | DET DU VALDE i Granska (B via k4) ✓ | "omgång 4" = global matchday (kronologi-instansen, ny rad) |
| **Manager / karriär** | `decision`, `manager_burnout` | — | Karriärhistorik (F: seasonSummaries + managerSeason), Blodslinje | **`managerId` ej byggd** (DOM_LIGGARE_CLUBID) → inget följer managern över klubbgränsen i kanon; Kristoffer-callbacken omöjlig |
| **Personliga mål** | `player_milestone` vid uppfyllt `[verifiera: skrivs målet som satt?]` | — | Krönikan (B) | målet som SATT (managerns handling) saknar post → managerId-stämpel har inget att sitta på |
| **Push / Attention** | — (yta) | `ledgerTold` push ✓, backoff ✓ | B via agenda ✓ (copy låst) | inget — första ytan som föddes rätt |

## 3. Nya typer som kartan kräver — var och en med konsument (LESSONS #54)

| Typ | Skrivs när | Payload | Significance | Konsumenter |
|---|---|---|---|---|
| `board_verdict` | säsongsslut (boardTruth) + vid uppdragsvarning omgång 7/14/22 | `{ verdict: 'over' \| 'as_expected' \| 'under', objectiveStatus, patienceBand }` | 45 (60 vid 'under' två år i rad) | årsbok (ersätter F-läsningen av boardTruth), Krönikan (decisions_era), avskedstexten (läser SAMMA post — löser `minne-avsked-motsager-historik`), Berättaren |
| `license_event` | first_warning / point_deduction / plan / cleared / denied | `{ status, deficitKr?, pointsDeducted? }` | 50 (75 vid deduction, 95 vid denied) | årsbok som **konsekvensrad** (inte "Dina val" — löser `arsbok-dina-val-licensstatus`), Krönikan (scar), press (agenda), Berättaren |
| `community_shift` | CS korsar 30/50/70 upp eller ner | `{ from, to, direction }` | 55 | Krönikan (relations_money), årsbok, Orten-vyn ("Orten vände i februari"), Berättaren |
| `facility_trial_outcome` | hallprövning bordlagd / nedlagd / kommun-nej / ja | `{ stage, outcome, support }` | 50 (65 vid nej/nedlagd) | Krönikan (facility), årsbok, Berättaren; "Kommunen sa nej. Inte till hallen. Till oss." får en post att stå på |
| `letter` | ett brev anländer | `{ letterId, kind }` + `subjectSnapshot` (avsändaren) | 40 | Efterklang followUp (B i stället för F), Krönikan (people), Berättaren |
| `personal_goal_set` | managern sätter ett personligt mål | `{ playerId, goalKind }` + `managerId` | 30 | Kristoffer-callbacken (berattaren-callbacks c), Blodslinjen |

Sex typer, alla med minst två läsare namngivna. Ingen får byggas utan sin konsument i samma pass.

## 4. Vad omspårningen säger — tre mönster

**A. De system som skriver till liggaren är nu synliga; de som inte gör det är osynliga.** Burnout, pressen, patron, domare, transfer, matcher, skador — alla har fått sin väg genom k1/agendan sedan i går. Styrelsen, licensen, orten, hallen, breven, akademin — de fem systemen som ALDRIG skriver — är exakt de GPT hittade luckor i (styrelsetestet: licens under "Dina val", "uppdrag hängde löst" utan spår; akademitestet: allt). Mönstret är binärt: skriver du, minns spelet dig.

**B. F-vägarna är där buggarna bor.** Granska-uttåget (egen fixture-sökning), managersektionens tre rader (egen projektion), Efterklangs stillhet (cache), headerns "Omg 22" (egen bracket-läsning), "omgång 4" (egen matchday-tolkning). Varje F i tabellen är en parallell sanning. Ordning framåt = migrera F till B, en yta i taget — det är SPEC_BERATTAREN steg 5–8 plus den här kartans §3.

**C. Steg 2 (minns) är fortfarande punktvis.** Burnout och pressen har egna relapse-funktioner. Alla andra får steg 2 bara via årsdagar (k2) och otaldhet (told). `berattaren-beats-idempotens` — prior-check för alla producenter via `semanticKeyStem` (som redaktören redan använder!) — är det som gör steg 2 till regel. Redaktören har verktyget; producenterna använder det inte.

## 5. Grep-order till Code (RAW v2)

Leverera `RAPPORT_OMSPARNING_RAW_2026-09-04.md`, inga kodändringar, inga domar:
1. Per system i §2: bekräfta eller korrigera kolumnerna Skriver/Minns/Talar mot koden; lista varje `[verifiera]`.
2. Per yta (Portal, Efterklang, press, årsbok, Granska, kafferum, Karriärhistorik, Blodslinje, Orten, styrelsemöten, licensbrev, Klubbminnet): läser den `redaktoren`/`agendaForSurface`, `readClubLedger` direkt, eller en ficka/egen projektion? Vilka fickor finns kvar med läsare (`journalist.memory`, `bandyLetters`, `boardObjectiveHistory`, `nemesisTracker`, `economicCrisisState`, `lastRivalSale`, `youthIntakeHistory`, `recentMoments`)?
3. `ledgerTold`: vilka ytor skriver kvitton idag, vilka visar liggarposter utan att skriva?
4. Schemafält: täckning av `clubId` (alla poster?), `result` (sex typer?), `managerId` (finns det?), `subjectSnapshot` (finns det?).
5. Krönikan: läser matchminnet ur liggaren eller fixtures — för innevarande säsong respektive tidigare?
6. Producenter som skapar intro utan prior-check: lista alla `logEvent`-anropare av storyline-/dilemma-typ och om de frågar `semanticKeyStem`/`hasPriorStorylineResolution` innan.

## 6. Kön ur omspårningen (efter RAW)

1. `berattaren-beats-idempotens` — generalisera prior-check med `semanticKeyStem` (verktyget finns i redaktören). Stänger PRIO 1:s klass.
2. Migrera F → B: Efterklang (steg 6), Granska nästa-match via kanonisk hjälpare (PRIO 2), managersektionens kuratering (dom står), kronologi-instansen.
3. `managerId` + `subjectSnapshot` (två domar står) → callbacks + Blodslinje.
4. De sex nya typerna (§3), i ordning styrelse → licens → hall → orten → brev → personligt mål, var och en med sin konsument.
5. Akademidomens åtta typer (står).

Efter det finns inget system som inte skriver, och ingen yta som läser vid sidan av. Då är "parallella sanningar" en historisk lärdom.
