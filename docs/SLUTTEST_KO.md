# SLUTTEST-KÖN — ENDA SANNINGEN

**Skapad:** 2026-08-17 · **Omskriven:** 2026-08-17 (djupversion) · **Ägare:** Opus
**Uppdateras post för post. Skriv ingen ny fil.**

---

# ▶ HELA KÖN — ta nästa rad

**Blockerad på CI, deploy eller ett svar: ta nästa post här. Fråga inte, schemalägg ingen väckning.**

Allt som ska byggas före release står här, i ordning. Detaljer finns i respektive post längre ner och i de dömda underlagsfilerna.

## Etapp I — smått och låst

| # | Post | Var |
|---|---|---|
| 1 | ~~**B9** positionsviktad utmattning~~ KLAR (`ee58474d`) | `playerStateProcessor.ts` |
| 2 | ~~**B3** `playStyleTradition` — alla tolv värden dömda~~ KLAR (`d37605a2`) | `clubExtendedInfo.ts` |
| 3 | ~~**B4** fyra `THREAT_REASON_LINES`-pooler~~ KLAR (`4e7fd447`) | `opponentAnalysisService.ts` |
| 4 | ~~**B5** scoutvokabulären~~ Opus tar den själv | `scoutingService.ts` |
| 5 | ~~**B2** två presslägen i UI, inte tre~~ KLAR (`b24c18f6`) | taktikytorna |
| 6 | ~~**5.1 fynd 5** `hideProgress`-prop~~ KLAR (`5e2dfc96`) | `BoardObjectivesList.tsx` |
| 7 | **5.1 fynd 4** `FeedbackButton` till innehållets botten | `FeedbackButton.tsx` |
| 8 | ~~**O6 sidofynd** innerback = `MB`~~ KLAR (`0bc0ba77`) | `Formation.ts` |
| 9 | ~~**O7** fyra språkfel + testet~~ KLAR (`a33e4f85`), text från Jacob | fyra filer |
| 10 | ~~**C3** fem rå `borderRadius: 8` → `var(--radius-md)`~~ KLAR (`edf88401`) | `SeasonSummaryScreen`, `SquadScreen` |
| 11 | ~~**V1-uppföljning** `HalfTimeSummaryScreen` in i `sceneRegistry`~~ KLAR (`f3ae1b64`) — de tio andra scenerna nu ÄVEN registrerade (`f71b5edb`, 2026-08-22), se not nedan | `sceneRegistry.ts` |
| 12 | ~~Radera `MatchDoneOverlay.tsx` (död kod) och `_RADERAS/` efter verifiering~~ KLAR (`565d19fd`) | — |
| 13 | ~~**taktik-flaken** — utred, kör inte om~~ KLAR (`a3303ce5`) — rot: `assistantCoach` seedad på `Date.now()` i `gameStateFactory.makeBaseGame()`, inte scenens seed. Baseline regenererad | EXTRA_HEIGHT / `sceneRegistry` |

## Etapp II — B12-berikningen (stresstest mellan varje delsteg)

| # | Post |
|---|---|
| 14 | ~~`manpowerState`~~ KLAR (`9845be33`) — billigaste beviset att berikningen inte läcker, byte-identiskt bekräftat |
| 15 | ~~`tacticalFactors`~~ KLAR (`d49f94e8`), byte-identiskt bekräftat |
| 16 | ~~`contributingFactors`~~ KLAR (`e334736b`), byte-identiskt bekräftat |
| 17 | ~~`origin`~~ KLAR (`74ebda01`) — B12 steg 2 HELT KLAR, alla fyra fält. Ingen konsument wired än |

**Bygg inte** `primaryCause` / `responsiblePlayerId` / `involvedPlayerIds` / `sequenceId`. Se `DOM_B12_STEG2_2026-08-19.md`.

## Etapp III — dömda ytor, all text låst

| # | Post | Underlag |
|---|---|---|
| 18 | ~~**U5 forts** `isOnCooldown` mot pivotal beats, sedan `systemhandelseBudgetOk`~~ KLAR (`c2e34591`/`4e341891`) — U5 helt stängd | U5-domen |
| 19 | ~~**D1** allt~~ KLAR — punkt 1–3 (`97d26cfd`/`4e347971`/`9ae907bc`), punkt 4 "därför nu" kopplad mot contentContract.ts och AKTIVERAD (`c8bc3d3d`, fyra kritiska typer spårade `b6aa7f84`), batch-av-tre byggt (Design dömde variant 1b, `778cfb17`) | `DOM_D1_EVENTVIKTNING_2026-08-19.md` |
| 20 | ~~**O15/D4** taktikens två lägen + Å2:s träffytor~~ KLAR (`e248835f`) | D4 + min dom |
| 21 | ~~**O3** spelarens säsongsmål~~ KLAR (`7604b196`/`56e5882c`/`c025bfd7`/`424bc7ed`) — känt gap: 'inget särskilt i år'-raden ej nåbar utan `SeasonGoalType`-utökning | `DOM_EGET_SASONGSMAL_2026-08-17.md` |
| 22 | **O18 fält 2** — O19 klar men fält 2 INTE buildbart än, se not | `DOM_ARSBOKEN_RYGGRAD_2026-08-17.md` |
| 23 | **O4** burnout — rapport levererad (2/3 effekter redan gradeade, byggbara), väntar på `D1`s viktning | `DOM_BURNOUT_2026-08-17.md` |
| 24 | ~~**O16** `DITT VAL` i Granska~~ KLAR (`ee8f2d1c`) — bara hörnstrategi→hörnmål byggd (enda mätta av fyra kandidater), rapporterat | `DOM_GRANSKA_LARANDEYTA_2026-08-17.md` |
| 25 | ~~**O17 del 1** fullt anläggningsträd som tillstånd~~ KLAR (`40530421`) — del 2 (gate) också klar, del 3 väntar på O5 | `DOM_ANLAGGNINGSTRADETS_SLUT_2026-08-17.md` |
| 26 | **O2** noOp-grepet levererat — 13 bekräftade + metodfynd om resolver-specialiserade "falska noOp". Pairwise (steg 2) väntar | `DOM_DOMINANS_OCH_FORHANDSDELTAN_2026-08-17.md` |
| 27 | **O9** delningskortets tre rader + fråga, efter 4.12/4.13 | `DOM_DELNINGSKORTET_2026-08-17.md` |
| 28 | ~~**O11** `contentContract.ts`~~ KLAR (`e43aa821`) — 95 rader (canonical id, en per källa), 6 `filled:true` djupspårade, resten ärliga TODO-rader. Struktur låst av test, innehåll fylls i senare pass | `DOM_INNEHALLSKONTRAKTET_2026-08-17.md` |
| 29 | ~~**O19** märk de nio 5/5-händelserna i data~~ KLAR (`72427068`) | varsel-domen |

## Etapp IV — Grind 1 och andra akten

| # | Post |
|---|---|
| 30 | ~~**Grind 1-verifiering**~~ KLAR — se `GRINDAR`-sektionen ("VERIFIERAT 2026-08-19", `scripts/grind1-boardpatience-sim.ts`). `club_slottsbron` 2/25 sparkade (8%), `club_heros` 20/25 (80%) trots 4:e-placering nästan varje säsong — misslyckandet är verkligt, men "skickligt spel hjälper" håller inte för Heros. Två sidofynd rapporterade, inte byggda, väntar på Jacob (se `Väntar på Jacob`) |
| 31 | **O5** framgångsekonomin — tre krafter, **en i taget**, stresstest emellan: löneinflation → driftskostnad → investeringskrav |
| 32 | **O1** varsel-mallen, sponsorn först (vanligast och tommast) |
| 33 | ~~**O20** de tio 4/5-händelserna~~ RAPPORT-LEVERERAD — se O20-tabellen längre ner |

## Etapp V — skuld och övrigt

| # | Post |
|---|---|
| 34 | **Överlämning 2 steg 0** — elva grep-pass. **Körs när Code väntar på CI**, blockerar ingenting |
| 35 | ~~**6.4 post 21** edge-case-fixturer~~ KLAR — Å11-residualen `36351a95`. Långa-efternamn + skadetillstånd `f71b5edb` (redan byggda fixturer, bara oregistrerade). Positionsförkortningar granskade `17b1a6a3`: `positionShort()` (`domain/format.ts`) är den enda källan, 6 filer som refererar `PlayerPosition`-enumen utan att importera den använder alla enumen för LOGIK (sortering/filtrering), ingen för textrendering — inget inkonsekvensfynd. Marknadsvärde granskat: `Player.marketValue` är ett obligatoriskt numeriskt fält (aldrig undefined), `formatMarketValue`/`formatValue` hanterar 0 kr korrekt i alla tre kontrollerade konsumenter — inget "tomt pris-kort"-fall hittat, sannolikt samma fynd som Å11 redan täckte |
| 36 | **Å12–15** nav-dokdrift, emoji-rester, egna skuggor — Å12/Å13/Å14 `KLAR`. Å13 (`f9fcef62`): 🟥 (rött kort) → 🚫 (utvisning) på de två live-ställen som missades av tidigare svep. Å15 (bundle) `EJ` |
| 37 | **SPÅR B** fyra textnivåer som DS-kanon — hör ihop med D1, **Opus dömer först** |
| 38 | **U8** bundle, **U9** telemetri |
| 39 | Arkivera resten av `incoming/` allteftersom |
| 40 | **Grind 0, resten** — "inga kritiska mobilflöden blockerade" + "produktionsbygge/deploy-sha obligatoriskt" (grindens egen definition, GRINDAR-sektionen). Numeriska kärnan `KLAR (a7a7054a)`, gate-satt. Detta kräver browser/deploy-verifiering, inte en simulering — separat post |

## Väntar på Jacob

**B1** formationssystemet (rör `BEVARA`) · **O13** jobbmarknad · **O14** monetisering · Grind 1:s två sidofynd (binär `met`/`failed`, Heros ekonomi)

**Väntar på Opus:** 5.3 Turneringsläge-text, B5:s scoutord, SPÅR B-domen

## Rör inte

`matchCore`-kalibreringen, possession-motorn, de sex taktikdimensionerna, rollsystemet, attributmodellen — allt V2, se `docs/V2_MATCHMOTOR_OCH_TAKTIK.md`.

---

## CI-hygien (2026-08-20)

**Taktik-scenens visual-regression-flake (post 13) — löst, inte omkört.** Laddade ner CI:s expected/actual/diff-artefakter direkt (`gh run download`) istället för att vänta på nästa upload, per instruktion. Bekräftat: ingen layout-/CSS-skillnad — assistentens namn (Sven Gustafsson → Johan Magnusson mellan körningar) och samtliga sex bänkspelarcitat differerade helt. Rot: `createNewGame.ts:273` seedar `assistantCoach` på `save_${Date.now()}` — avsiktligt för riktiga spel (varje save ska få en genuint egen assistent), men `gameStateFactory.makeBaseGame()` (dev-scenes standardfabrik sedan 2026-08-09) ärver det, så coach-identiteten — och därmed vilken citat-pool bänkspelarnas repliker väljs ur — skiftar slumpmässigt mellan varje CI-körning. Olika citattext → olika radbrytning → skärmdumpens höjd skiftar (2105/2122/2135px sågs). Fix (`a3303ce5`): `makeBaseGame()` skriver över `assistantCoach` med en seed-baserad, reproducerbar coach — ENDAST i dev-fabriken, `createNewGame` orört. Verifierat: två separata dev-server-processer gav byte-identisk skärmdump; alla 57 dev-scenes-scener körda lokalt utan krasch; ny regressionstest (`gameStateFactory.test.ts`) stash-verifierad. Linux-baseline regenererad via `visual-baselines.yml` (workflow_dispatch).

**Andra `factoryMidSeasonGame`-scener kan vara jämförbart drabbade** om de renderar coach-derived text (trupp-*, transfers-*, portal-*, lineup-*) — inte verifierat vilka, samma rotorsak gäller dem alla nu efter fixen. Ingen egen post, ingen känd aktuell flake i dem.

**V1-uppföljningens fulla fynd (post 11):** tio scener finns i `DevScenesScreen.tsx`s galleri men saknas i `sceneRegistry.ts` — sveps av ingen grind (en-primary/kontrast/tap-target): `trupp-blandat`, `trupp-kris`, `lineup-empty`, `lineup-filled`, `portal-tom`, `portal-normal`, `portal-full`, `portal-grind`, `portal-bid-single`, `portal-bid-multi`. Billiga en-radstillägg om/när det prioriteras — Jacobs egen poäng gäller generellt: en yta ingen grind sveper är en yta där nästa fel är osynligt.

**Skydd eller illusion? — Jacobs fråga besvarad, 2026-08-20.** 55 distinkta visuella ytor i appen (36 Screen/Scene/Sequence-komponenter, 12 Modal/Overlay, 4 match-Interaction, 3 Ceremony — namnkonvention, korsverifierad mot faktisk användning). **Bara 20 av 55 (36 %) har någon som helst representation i `/dev/scenes` alls** — 35 är helt onåbara genom verktyget, inte bara osvepta av en grind. Bland de 35: `MatchLiveScreen` självt (bara routerwrappern `MatchScreen` är dev-scenad — den faktiska matchvyn, spelets mest komplexa skärm, har noll täckning), alla fyra match-interaktioner (`CornerInteraction`/`PenaltyInteraction`/`CounterInteraction`/`FreeKickInteraction`), `HalftimeModal`, sex av `SceneScreen`s nio scen-system-scener (`CoffeeRoomScene`/`ValetScene`/`JournalistRelationshipScene`/`CupIntroScene`/`SundayTrainingScene`/`SeasonSignatureRevealScene`), samt `FacilityScreen`/`InboxScreen`/`GameOverScreen`/`HistoryScreen`/`ChampionScreen`/`IntroSequence`/`PlayoffIntroScreen`/`QFSummaryScreen`/`TilltradeScreen`/`HallProvningScreen`/`SimSummaryScreen`/`NameInputScreen`/`ClubSelectionScreen`/`PhaseOverlay`/`BidModal`/`RenewContractModal`/`CallupModal`/`EfterklangThreadModal`/`KlubbparmOverlay`/`SnowOverlay`/`CeremonySmFinal`/`CeremonyCupFinal`/`CeremonyRetirement`. Av de 20 som HAR täckning saknade 10 scen-varianter (post 11 ovan) grind-svep. **Slutsats: de fem grindarna skyddar ~en tredjedel av appens yta** — verkligt, men mycket smalare än "fem grindar" låter. Ingen egen post, ingen åtgärd bestämd — rapporterat som beställt.

**Uppföljning, 2026-08-22 (`f71b5edb`):** de tio registrerade. Avslöjade omedelbart ett verkligt, tidigare osynligt en-primär-brott (portal-bid-single/-multi, två samtidiga `.btn-primary`) — exakt tesen bekräftad ("en yta ingen grind sveper är en yta där nästa fel är osynligt"). Fixat samma commit. De 35 helt onåbara ytorna ovan är fortfarande onåbara — detta stängde bara post 11:s specifika tio, inte täckningsgapet i stort.

---

Denna fil ersätter alla `CODE_INSTRUKTION_*`-filer från 2026-08-17 som kölista. De lever kvar som **underlag** — de bär rotorsaker, låst copy och villkor — men status står bara här.

`docs/KVAR.md` är dödmarkerad sedan 2026-06-21 och ska inte återupplivas. `docs/BACKLOG.md` äger långsiktig status; denna fil äger sluttestperioden. Lägg en pekare från BACKLOG §A hit.

---

## SÅ ANVÄNDS FILEN

**Statusvärden:** `KLAR (sha)` · `PÅGÅR` · `EJ` · `RAPPORT-VÄNTAR` · `UTGÅTT (skäl)` · `?` (rapporterat men ej kvitterat)

**Två bevis krävs innan en post är stängd.** Ett automatiskt: test, invariant eller simulering visar att mekaniken gör vad den ska. Ett mänskligt: någon har sett det i körande app och rapporterat vad de såg. Grön pixelsnapshot bevisar inte att ett beslut gör ont; en snygg text bevisar inte att state ändrats. Poster med `Godkänd när` nedan har kriteriet utskrivet — det är kriteriet, inte "testerna är gröna".

**En commit per post, med rotorsak i meddelandet.** GPT kör två nya tiosäsongstest efter detta arbete. Ett svep går inte att tolka i efterhand.

**Kalibrering aldrig i klump.** En balansändring åt gången, `npm run stress` före och efter, mittpunkt-kalibrerad som de skalade ripple-deltana.

**Ingen svensk copy skrivs av Code.** Märk `[Opus]`, lämna listan.

**Statusdrift var den största risken i det här dokumentet.** Code kvitterade hela kön 2026-08-17 mot HEAD = `fc6f5015`. Statusarna nedan är nu kvitterade med sha där de är klara. Tre saker kom fram i kvitteringen som är värda att bära vidare:

- **Etikettkollision:** commit `d6ad0216` är taggad "M-04" men innehåller displayName-fixen, inte standings parity. Samma etikett användes för två olika fynd i två olika auditer. Använd postens ID ur den här filen i commit-meddelanden, inte auditens löpnummer.
- **Code trodde Å2 var klar via `c5fa24f7`** — den commiten fixade `TacticChangeModal.tsx`, inte `TacticBoardCard.tsx`. `padding: '6px 3px'` står kvar. Verifiering mot fil, inte mot minne.
- **Å5 (skadeporträttet), löst 2026-08-17 (`bd331755`):** browser-verifierat vid 390px — bugen fanns, på ETT ANNAT anropsställe för samma `getPortraitSvg`-hjälpare (`SquadScreen.tsx:568`, krisraden för skador/avstängningar/moral/utgående kontrakt), helt utan storleks-wrapper. Kodläsningen som gav OKLAR läste rätt anropsställe (`:249`, korrekt sedan maj) men fel INSTANS. LESSONS.md #44.

---

## BLOCKERAT PÅ OPUS-TEXT — tomt (2026-08-19)

4.2 derbyrepliken wire:ad 2026-08-19 (`c1c35970`) — sista posten i den här listan. 4.8 andra halvan löst 2026-08-18 (`49abf3fc`) — Jacob gav texten direkt i chatten ("Assistenten satte laget"), ingen spec behövdes.

K5 är löst — designbeslutet (permanent betyder permanent) implementerat i `3b33db0e`.

2.6 löst 2026-08-19 (text given direkt, se ETAPP 2). 5.3 rapport levererad 2026-08-19, väntar på Jacobs text (se ETAPP 5).

---

## BEVARA — skyddas från refaktor och förenkling

Tio dygn av felrättning har en egen risk: att någon river det som fungerar. Detta är inte en kölista utan en skyddslista. Rör inget här utan att fråga.

**Platsen.** Klubbstugan, skolan, kiosken, kommunen, supporterbrev, lokala arbeten. Det är spelets största konkurrensfördel och det som gjorde att tre oberoende testare beskrev sin klubb som en ort.

**Personerna.** Torsten Henriksson, Claes Lindberg, Marianne Selin, Tord, Helena Wikström. De blev minnesvärda utan porträtt eller licenser. Fördjupa deras samband; ersätt dem inte med fler generiska roller.

**Säsongsformen.** Upptakt, vinter, svacka, derby, slutspelsjakt, uttåg, årsbok. Det är den primära retentionloopen och den fungerar redan.

**Årsboken.** Minne, belöning, långtidsprogression och framtida distributionsyta i samma yta. Den ska bli sannare och mer publik, aldrig mindre.

**Matchmotorn och de tre tempolägena.** Kalibrerad mot 1 100+ verkliga Elitserien-matcher, statistisk paritet mellan quicksim och live. Auditerna bekräftar att den fortfarande överraskar en dominerande klubb efter tio säsonger.

**Truppens generationsväxling.** 16–33 år efter tio säsonger, trovärdig mix, pensioner och ungdomar i balans. Den kalibreringen är gjord och ska inte röras av ekonomiarbetet.

**Den visuella identiteten.** Mörk portal, ljus administration, mörk match, beige årsbok. Konsolideringen fungerar som språk. Problemet är viktning, inte identitet — ingen ska "fixa" det genom att gå tillbaka till sex handrullade kortvarianter.

**Matchtypsmatrisen och sektionsregistret.** Cup-Granska utan tabell och form bekräftades av två testare som *renare, inte tomt*. Återinför ingen ligatabell.

---

## GRINDAR — vad som måste hålla innan nästa våg börjar

Gate-baserat, inte datumbaserat.

**Prioriteringsfiltret** (framgångsauditen): spelet har fyra nivåer, och alla fyra måste fungera.

| Nivå | Spelarens fråga | Behöver |
|---|---|---|
| Match | Vad försöker jag göra i nästa match? | Begriplig motståndarkontext, relevanta taktikval, sann Granska |
| Säsong | Vad står på spel denna vinter? | Tabell-/cupbåge, personer, ett eget mål, konsekvens, en ren landning |
| Karriär | Vad har klubben blivit — och vad kostar nästa steg? | Ekonomi, renommé, faciliteter, legender, jobbmarknad, dynastipress, full historik |
| Community | Varför skulle någon annan bry sig om min historia? | Publik krönika, utmaning, share-back, gruppminne |

**Regeln:** en ny feature ska stärka minst en nivå och återkoppla till en annan. Gör den inte det ska den sannolikt inte prioriteras. Detta är filtret som hade sparat oss flera rundor — använd det innan något läggs till i den här filen.

**Grind 0 — sanningen.** En automatiserad tvåsäsongskörning kan jämföra varje berättad siffra, varje namn och varje permanent tillstånd mot save-state utan avvikelse. Inga kritiska mobilflöden blockerade. Produktionsbygge och deploy-sha obligatoriskt. → stänger K1–K4, etapp 1, 2, 4.

**KÖRT 2026-08-21** (ursprungligen `scripts/grind0-truth-sim.ts`, Jacobs uppdrag — "en simulering, inte ett bygge"). Aldrig körd innan detta pass. Scope, ärligt avgränsat: "varje berättad siffra" är obegränsat om det tas bokstavligt — verifierat mot K1–K4:s egna konkreta "Godkänd när"-påståenden i en riktig tvåsäsongskörning (3 klubbar × 3 seeds, `createNewGame`+`autoSelectLineup`+`advanceToNextEvent`), inte K1/K3:s isolerade unit-tester: careerStats-ökning == seasonStats+seasonCupStats (liga+cup) vid varje säsongsgräns (K1), seasonHistory.length == min(seasonsPlayed,10) (K3), worldSeed/ruleVersion oförändrade (K4). **Tre reella fynd, alla fixade samma pass (`a2c2b6f5`):** (1) `seasonCupStats` nollställdes aldrig vid rollover, ackumulerade tyst över alla säsonger. (2) statsProcessor.ts:s "flygande byten"-gren för oanvända bänkspelare ökade seasonStats.gamesPlayed men glömde careerStats.totalGames — påverkade i praktiken de flesta matcher (varje match med minst en oanvänd bänkspelare). (3) Erik Ström-easter egget hade `seasonsPlayed` hårdkodad till 1 utan matchande bakgrund i övriga fält. 9 körningar, 0 avvikelser efter fixarna.

**IN I GATE-SVITEN 2026-08-22** (`a7a7054a`) — Jacobs order: "kör Grind 0 som en del av gate-sviten, inte som ett engångsskript... allt som rör statistik ska passera den." `scripts/grind0-truth-sim.ts` raderad (superseterad), samma logik nu `src/application/useCases/__tests__/grind0Truth.test.ts` — en del av `npm test`, körs alltså i CI:s `check`-jobb (app-ci.yml) på VARJE push, ingen schemaläggning behövd. **Körtidskostnad:** ~3.6s testexekvering för hela 9-körningssvepet, mot ~34s för hela vitest-sviten (+~12%) och ~20s för `npm run stress` (fortfarande manuell) — trivialt, ingen anledning till cron. Verifierat att gaten faktiskt fångar en regression: bänkspelar-fixen temporärt återställd → 9/9 testfall föll med spelarnamn+säsong+exakt delta i diagnostiken → återställd.

**INTE verifierat, separat postad (rad 40 nedan):** "inga kritiska mobilflöden blockerade" och "produktionsbygge/deploy-sha" — icke-numeriska villkor i grindens egen definition, kräver browser/deploy-verifiering, inte en headless simulering/vitest-gate. Grind 0:s numeriska kärna (siffror mot save-state) är stängd och nu självförnyande; resten är en egen post.

**Grind 1 — misslyckandet.** Seedade simuleringar visar att en svår klubb kan hamna i botten och bli sparkad **utan sabotage**, medan skickligt spel fortfarande hjälper. Minst ett beslut per säsong saknar uppenbart facit. → stänger etapp 3, U1, U6, O2, O4.

**VERIFIERAT 2026-08-19** (`scripts/grind1-boardpatience-sim.ts`, seedad, `createNewGame`+`autoSelectLineup`+`advanceToNextEvent` — samma motor som `npm run stress`, ingen sabotage, bästa tillgängliga elva varje omgång). De två klubbar U1:s difficulty-modell klassar `hard` (`club_slottsbron` rep 48, `club_heros` rep 45), 25 seedade körningar var, tre säsonger:
- `club_slottsbron`: 2/25 sparkade (8%) — placering 10:e alla tre säsonger, patience faller sakta mot 0.
- `club_heros`: 20/25 sparkade (80%) — men placering är 4:a (av 12) NÄSTAN VARJE SÄSONG. **Misslyckandet är alltså verkligt, men den första hälften av villkoret ("skickligt spel fortfarande hjälper") håller INTE för Heros:** en 4:e-placering ger `computeBoardPatienceUpdate()`s `topThird`-bonus (+15), men patience kraschar ändå mot 0 inom 2-3 säsonger. Två mekanismer identifierade (diagnostisk körning, `club_heros` seed 20000): (1) `seasonEndProcessor.ts:900-901` plattar `evaluateObjective()`s fyra tillstånd (`met`/`at_risk`/`active`/`failed`) till binärt `met`/`failed` — ett mål som är PÅ VÄG (`active`, t.ex. `cupRun` som nådde kvartsfinal men inte semifinal) räknas som lika misslyckat som ett mål som aldrig rördes. (2) Klubbens ekonomi kollapsar oberoende av tabellplacering — samma diagnostiska körning: +108 tkr → −321 tkr → −711 tkr över tre säsonger av 4:e-placeringar, vilket i sin tur garanterar att `balanceBudget`/`growFinances`-målen (ofta tilldelade `Heros` eftersom kassörens kandidat-logik triggar på `finances<500000`) misslyckas oavsett spel.

**Rapporterat, inte byggt** — ingen fix gjord, det här är Grind 1s verifieringssiffra Jacob efterfrågade, plus två sidofynd värda en egen dom: (a) binär met/failed-plattning av objectiveutvärderingen, (b) ekonomimodellen för svaga klubbar (kan höra ihop med `O5`s "ett tal måste betyda något" men är motsatt riktning — det är FÖRLUST-sidan av ekonomin som är okontrollerad, inte framgångssidan).

**Grind 2 — andra akten.** En framgångsrik klubb har år åtta ett ekonomiskt val där båda alternativen svider. Ingen exakt pivotal scen upprepas inom tre säsonger. Ett färdigbyggt anläggningsträd öppnar nästa horisont i stället för ett tomtillstånd. → stänger O5, U5, O3.

**Grind 3 — rytmen.** Spelaren kan alltid identifiera skärmens primära handling och nästa olösta fråga. Rutinbeats stoppar inte autosimulering. Säsongen landar en gång. → stänger etapp 5, D1, Å3, Å4.

**Grind 4 — tillväxten.** Riktiga mottagare startar en karriär från en spelarlänk, och några spelar klart och delar ett svar. Klick utan aktivering räknas inte. → efter Grind 0.

---

# BLOCKERANDE

Går före allt. Varje post här är ett fall där appen påstår något falskt eller kastar bort spelarens arbete.

### K1 · Karriärstatistikens dubblering
`statsProcessor.ts:74-80` och `:219-223` räknar per match; `seasonEndProcessor.ts:407-410` adderar säsongen igen. 48 matcher blir 96, Erik Sundqvist står på 64 mål efter ungefär hälften så många.
**En ägare, aldrig båda.**
**Varför blockerande, två skäl:** rekorden är det spelaren minns, och Hall of Fame är byggd på dem. Och delningskortet är den enda artefakt som lämnar appen — best-in-class-strategins kvalitetskontrakt kräver att varje publik siffra kommer ur samma state som mekaniken. Med dubblering publicerar vi fel tal till människor som inte spelar.
**Godkänd när:** en tvåsäsongssimulering visar att karriärmatcher och mål exakt motsvarar spelade fixtures, och Hall of Fame läser samma tal.
**Status:** `KLAR (b4ad8279)`

### K2 · Migrering av befintliga saves
Kan talen räknas om ur matchhistoriken, eller är de förlorade?
**Detta är ett produktbeslut, inte en migrering.** Kan de inte räknas om måste någon bestämma om spelare ska se sina rekord halveras eller om felet fryses in för gamla saves. Rapportera, jag dömer.

**Rapport levererad:** dubbleringen låg i att `seasonEndProcessor.ts:406-453` adderade `seasonStats` till `careerStats` vid varje rollover, trots att `statsProcessor.ts:75-80, 219-224` redan ackumulerar samma fält matchvis (liga+cup) hela säsongen.

**Tre lager, olika svar:**
1. **Innevarande säsong + liga-delen av senaste 10 säsongerna** — går att räkna om korrekt. `player.seasonHistory` sparar `{season, goals, assists, games}` per säsong (men bara liga, `.slice(-10)`), och `game.fixtures` för aktuell säsong har komplett matchdata. Samma mönster som A5-migrationen (`saveGameMigration.ts:439-480`) återanvänds rakt av.
2. **Cup-delen av alla redan avslutade säsonger** — permanent förlorad. `seasonCupStats` nollställs varje rollover, arkiveras aldrig.
3. **Allt bortom 10 säsonger tillbaka (liga också)** — permanent förlorad. `seasonHistory.slice(-10)` har redan kastat äldre poster, och gamla `fixtures` skrivs över vid rollover. Drabbar just veteraner/klubblegender med långa karriärer — de spelare där 100-matcherslarm och rekord känns mest.

**Migrationsmekanism om Jacob väljer omräkning:** `saveGameMigration.ts`s `migrateSaveGame()`-krok (körs redan vid varje load) — ny funktion, ~30-40 rader, samma struktur som A5-blocket. 1 fil.

**Domen väntar på Jacob.** Tre alternativ för de förlorade delarna: (a) visa förbättrat men tyst ofullständigt tal, (b) samma tal men synligt flaggat "uppskattat, cupmatcher före denna säsong saknas", (c) frysa hela `careerStats` orört för befintliga saves, garantera korrekthet bara framåt.

**Jacobs dom: (a).** Räkna om det som går. Cupdelen och allt bortom tio säsonger förblir förlorat, gissa aldrig bakåt, ingen kompensationstext.

**Byggd 2026-08-19.** Ny K2-block i `saveGameMigration.ts` (efter A5-blocket, samma struktur): `careerStats.totalGames/totalGoals/totalAssists` blir en REN härledning ur `seasonHistory` (redan kapad till tio) + `seasonStats` (innevarande säsongs levande, K1-opåverkade ligatally) — inte längre en egen ackumulator som kan glida isär. Körs ovillkorat varje laddning (självläkande cache, ingen engångsflagga — en redan korrekt save räknar om till exakt samma tal). **Säkerhetsspärr:** kör bara om `seasonHistory` faktiskt är en array — en save från innan fältet fanns lämnas helt orörd (ingen data att räkna om ur är ingen ändring, inte en nollställning).

4 nya test (`careerStatsMigration.test.ts`): dubblerad→sann omräkning, saknad `seasonHistory`→orört, idempotens, tioårsgränsen respekteras automatiskt. Alla stash-verifierade — ett verkligt testfixturfel hittades under verifieringen (A5-blocket triggade på `seasonCupStats===undefined` och nollställde `seasonStats` innan K2-blocket hann läsa det; fixat genom att ge testspelarna en tom `seasonCupStats`) innan de gav rätt signal. 196/196 filer, 2052/2052 gröna, tsc/build rent.

**Status:** `KLAR`

### K3 · `.slice(-5)` — karriärminnet kapas
`seasonEndProcessor.ts:1240`. Efter tio säsonger fanns 2031/32–2035/36; år 1–5 var borta, medan titelräknarna stod kvar.
Behåll kompakt sammanfattning per säsong för **hela** karriären: säsong, placering, poängrad, titlar, ekonomi vid årets slut, narrativt ankare. Begränsa detaljdata, aldrig säsongsidentitet. Virtualisera i UI om listan blir lång — det är en renderingsfråga, inte ett skäl att kasta data.
**Gissa inte bakåt.** De åren är borta i befintliga saves.
**Godkänd när:** test vid 1, 5, 6, 10 och 20 säsonger visar antal sammanfattningar = antal spelade säsonger.
**Status:** `KLAR (a4faf93f)`

### K4 · `worldSeed` och regelversion som beständiga fält
`createNewGame:177-190` tar emot seed (default 42), `gameStore:165-175` skickar ingen, `SaveGame:85+` sparar den inte.
**Fältet kan bara fyllas framåt** — samma logik som `builtSeason`. Varje karriär som skapas utan sparad seed och regelversion kan aldrig bli en delbar utmaning i efterhand, och kan aldrig jämföras rättvist mot en annan. Det är därför den ligger bland blockerarna trots att ingen konsument finns.
**Bygg ingen konsument nu.** Fältet, migrationen (valfritt fält, `undefined` för äldre saves), inget mer.
**Status:** `KLAR (baa57b98)` — **sidofynd, ej fixat:** `gameStore.ts:175` (enda spelarvända newGame-vägen) anropar `createNewGame` utan seed. Varje riktig karriär genereras idag med samma hårdkodade seed 42 — `worldSeed` sparas nu korrekt men blir identiskt för alla spelare tills `newGame()` skickar ett slumpat värde.

### K5 · Mecenatens återupplivning
`eventProcessor:249-251` sätter mecenaten inaktiv vid permanent avsked, men `mecenatHappiness` kan väcka den. Reproduktionstestet finns — `mecenatReactivationBug.test.ts` — och är **`skip`:at**.
**Ett skippat test som bevisar en bugg är sämre än inget test: det ser grönt ut.** Fixa och avskippa.
**Klassen:** ett "permanent" tillstånd som inte är permanent. Samma familj som "Ge honom vila".
**Godkänd när:** testet är avskippat och grönt, och en permanent lämnad mecenat inte kan förekomma i aktiva listor, finansieringsalternativ eller nya krav.
**Status:** `KLAR (3b33db0e)` — `Mecenat.permanentlyWithdrawn`, kollas FÖRE `isActive` i båda `mecenatHappiness`-vägarna (top-level + multiEffect-subEffect), ingen mutation alls om satt. Testet avskippat, två fall, båda regressionsverifierade.

**Ordning inom blockerarna:** K1 → K2 → K5 → K3 → K4, alla `KLAR`. K1 före K3 därför att `.slice(-5)`-fixen bevarar fler säsonger, alltså bevarar den snart de felaktiga talen längre.

---

# ETAPP 1 — byggbarhet och release

| ID | Post | Status |
|---|---|---|
| 1.1 | `seasonEndProcessor.ts:1178` — `resolveContractExtension` saknade fjärde argument (`managerName`) | `KLAR (73a98e14)` |
| 1.2 | `tsc --noEmit` + Vite-build som obligatoriska CI-grindar | `KLAR (f9a3358a)` |
| 1.3 | Deploy-sync som synlig releasegrind — live mot main på en rad | `DELVIS KLAR (39770cd0 + d068f867)` — grinden jämför origin/main mot Vercel och gör det korrekt, men var riktad åt fel håll för felet som faktiskt inträffade 2026-08-18 (51 commits opushade — den körs bara på push, aldrig när problemet är att push uteblir). Två nya lager täcker den andra riktningen: post-commit-hook (`scripts/git-hooks/post-commit`, tröskel 1 opushad commit) + sessionsstart-steg 5 (`CLAUDE.md`, arbetsdags-koll mot `origin/main`) |
| 1.4 | Visual-baselines regenerering. **Väntar på min styckvisa kvittering** — rapportera vad som ska ha ändrats, post för post, så jag kan godkänna per ändring och inte som klump | `PÅGÅR` — 21 diffar kartlagda i tre bekräftade + en obekräftad batch, se nedan. Aldrig triggad |
| 1.5 | `tranare`-scenens timeout | `KLAR (f72c30b4)` |

**Varför 1.4 inte får godkännas i klump:** en oförklarad diff som godkänns blir baseline, och då är en regression osynlig för alltid. Det var precis vad de 16 falska diffarna visade — de var en artefakt av sticky dev-nav, inte produktfel, och hade vi godkänt dem hade vi mätt allt framtida mot brus.

**Fullständig kartläggning, 2026-08-17 (playwright: 194/215, 21 failar):**

1. **14× `--cta-nav-clearance` (`eeab2a62`), avsedda.** 12× `baseline.visual.ts` (portal-tom/normal/full/grind/bid-single/bid-multi × 375/390px) + 2× `scenes.visual.ts` (`portal`, `finalhelg` — verifierat direkt: `finalhelg`s diff visar exakt CTA-knappen "Säsong över →").
2. **3× KapitelPunkt (`fc6f5015`), avsedda.** `granska-cup-final`, `granska-sm-final`, `granska-avsked`.
3. **1× `upptakt`, avsedd.** Bisektat mot 13-commit-intervallet `c5fa24f7`→`0b325c10`: passerar genomgående (den enda avvikande datapunkten var en kallstarts-artefakt i bisektions-riggningen, inte ett fynd). Orsaken ligger EFTER `0b325c10`: `f72c30b4` (tranare-fixet) lade till `managerName` i `DevScenesScreen.tsx`s delade `makeGame()` — `NextMatchCard.tsx:322` har `{game.managerName && (...)}`, tidigare tyst dolt, nu korrekt synligt. `upptakt` renderar `NextMatchPrimary` → `NextMatchCard`.
4. **3× förbaseline-drift, OBEKRÄFTAD, egen batch.** `granska-spelare`, `granska-shotmap`, `granska-analys` — failade på VARJE commit i hela bisektionen (`73a98e14`→`0b325c10`, ingen passerar-punkt), och ingen commit efter `0b325c10` rör de tre komponenterna. Drift som fanns **före** hela sessionen — baselinerna har varit inaktuella längre än auditerna, exakt din andra hypotes.

---

# ETAPP 2 — förtroendebrott

| ID | Post | Rotorsak | Status |
|---|---|---|---|
| 2.1 | = K3 | | `KLAR (a4faf93f)` |
| 2.2 | Råa mallvariabler `{motståndare}` `{resultat}` | `finalBody` skapas `AnslagOverlay.tsx:72` **före** interpoleringen muterar `variantBody` på `:98-101` | `KLAR (0359161c)` |
| 2.3 | Finalbeats efter eliminering | **Inte** genereringsgaten. `matchActions.saveLiveMatchResult`/`concedeWalkover` muterar bracket direkt utan att gå via `processPlayoffRound`, så `staleEventIds` blir blind | `KLAR (0359161c + aa552b60)` |
| 2.4 | Vakt mot fjärde kodvägen: test som failar när en ny anropare av `advancePlayoffRound`/`updateSeriesAfterMatch` saknar validitetskollen. Kollen finns nu på tre ställen; en fjärde väg kommer ingen minnas | | `KLAR (0b325c10)` — `playoffBracketMutationCallers.test.ts`, allowlist-baserad, verifierad fortsatt korrekt |
| 2.6 | `ArrivalScene.tsx:74` — tre utgående kontrakt som inte finns. Bekräftad av **tre** oberoende auditer | Statisk sträng, hämtas inte ur saven | `KLAR` — se not nedan |

**2.6, byggd 2026-08-19.** Ny funktion `getTreasurerLine(contractsExpiringCount)` (`arrivalDialogue.ts`) — tre kompletta repliker (0/1/2+, ordet stavat ut upp till tio via `contractCountWord()`), Jacobs text ordagrant, ersätter hela den gamla hårdkodade raden (inte ett fragment att foga ihop). `ArrivalScene.tsx`: räknar `game.players.filter(p => p.clubId === managedClubId && p.contractUntilSeason === game.currentSeason).length` — samma villkor `arcService.ts`/`playerVoiceService.ts` redan använder för "kontrakt går ut i år", ny prop `contractsExpiringCount` trädd genom till `ArrivalSceneInner`. 4 nya test (stash-verifierade, failar korrekt mot pre-fix-kod), 195/195 filer · 2048/2048 gröna, tsc/hex-grep/build rent.

**Ej browser-verifierat — pre-existerande, orelaterad dev-scen-lucka:** `/dev/scenes?scene=arrival` renderar tomt även UTAN denna ändring (bekräftat via stash: samma tomma resultat på HEAD). `DevScenesScreen.tsx`s `squadGame`-fixture (delas av arrival/squad-trupp/annandagen-scenerna) saknar `board`, vilket träffar `ArrivalScene.tsx`s egen guard (`if (!board || board.length === 0) navigate(...)`) och omdirigerar bort tyst. Inte del av 2.6:s scope — flaggat, inte fixat här.

### 2.5 · Choice-label-svepet — den viktigaste posten i etappen
Kända fall: "Ge honom vila" ger bara `boostMorale +10` (`eventFactories.ts:199-204`) — spelaren blev matchens bästa direkt efteråt. Varselvalet lovar "risk att spelare lämnar" och ger bara `boostMorale` (`:340-345`).

**Grepa alla choice-labels och deras faktiska state-diff. Rapportera varje val där texten lovar mer än effekten.**

Bygg inget förrän jag sett listan. Vissa löften ska wiras, andra ska skrivas om, och det avgörs per fall — det går inte att beställa i förväg.

**Klassen, fjärde gången i serien:** prototypen som hävdade att ripple-slingan fanns, Mariannes tre kontrakt, dessa två val, mecenatens permanenta avsked. Text skriver checkar domänen inte täcker.
**Godkänd när:** varje choice-label motsvaras av verifierbar state-diff, och kontraktstest finns för vila, skaderisk, spelarflykt och heltidslön.
**Status:** `DELVIS KLAR` — full rapport i `docs/CHOICE_LABEL_SVEP_2026-08-17.md`, omskriven med (a)/(b)/(c)-taxonomi.

**Runda 1 (byggt/committat):** de fyra `boostMorale`/`makeFullTimePro`-no-opsen wirade + vakt som kastar på ofullständigt effektblock (`fdcf55cb`), falsk storyline-skrivning gated på faktiskt effektutfall för captainSpeech + varsel offer_pro (`fdcf55cb`, `441c4474`), `community_bandyplay`s omkastade tecken rättat (`ece6220c`), `${elin}`-mall-buggen fixad (`694991d2`), `hallDebateEvents.ts`/`hallDebateService.ts`/`hallDebateData.ts` raderade (`d0d4d923`), LESSONS #45.

**Runda 2 (instrument-drivet, per ny metod — fynd skrivna löpande, inte sammanställda efteråt):** vakten breddad från 5 till 25 obligatoriska-fält-kontroller (`ed94218f`) efter full katalog av hela `eventResolver.ts`. Ett nytt fynd under kartläggningen (`resolveEconomicCrisis`/sold_star falsk "spelare-såld"-berättelse, rapporterad). `scripts/eventGuardInstrument.ts` byggt — simulerar flersäsongskörningar, resolvar VARJE choice av VARJE genererat event, fångar throws mekaniskt (`38772116`). Körningen hittade en regression vaktbreddningen själv orsakade (mecenat-avgångsvalet hade kraschat live) — fixad omedelbart (`6b9ea0c8`). Andra körningen (6×10 säsonger, EFTER fixen): 10 899 events, 12 183 choices probade, **0 kast**. Manuell (a)-tecken-sweep över 12 filer klar: två nya fynd — `community_julmarknad` (subtitle säger kostnad, effekt är korrekt uträknad men positiv nettosumma — textbeslut) och ekonomikrisens `ask_mecenat` (påhittat lojalitetslöfte, klassad b). Explicit **REDAN KLASSIFICERADE**-lista tillagd i rapporten så nästa svep vet vad som är utrett.

**Rapporterat utan att bygga:** `kommunens_villkor` (byte-identiska effekter, `finansiering`-fältet läses ingenstans, ingen kommun/klubb-kostnadssplit finns i källdatan att rapportera), bandyplays löpande nettoförlust (≈-812 kr/omgång i snitt, redan korrekt tecknad, bara odokumenterad), kiosk break-even (fanMood 83 basic / 50 upgraded), `community_julmarknad` (textbeslut).

**Runda 3 (2026-08-17) — `weeklyDecisionService.ts`s täckningslucka stängd:** "manuellt kontrollerad — inga fynd" i runda 2 höll inte vid en throw-guard-genomläsning. Tre val hade samma felklass som PC-2 redan fixat en gång (löfte kan falla tyst till noop om den nödvändiga spelaren saknas): `corner_extra_training`, `training_corners_vs_matchprep` (båda redan skyddade uppström av `hasCornerCandidate`) och `player_weekend_off` — som INTE hade något uppström-filter alls. Fix: ny `hasWearyPlayer`-filter i `generateWeeklyDecision` (rotorsaken) + `resolveWeeklyDecision` kastar nu istället för att tyst noop:a i alla tre (`ca87d13e`). Stress-test 50/50 säsonger bekräftar att throws aldrig triggas live — filtret förhindrar det redan.

**Öppen lucka, rapporterad ärligt:** agenternas ursprungliga ~40-fynds-lista från runda 1 itemiserades aldrig fullt ut — bara ~18+2 nya finns utskrivna och klassade. Kräver ett nytt sweep-pass om Jacob vill ha resten klassat (throw-guarden och (a)-grepen har nu täckt sina respektive felklasser mekaniskt/systematiskt; det som återstår är okänt (b)/(c) som kräver läsning).

---

# ETAPP 3 — avskedsvägen

Spelets största konsekvens är i dag osynlig före tröskeln och ett kraschtillstånd efter den.

### 3.1 · `managerFired`-guard på alla `/game`-rutter
`GameShell.tsx:38-49` skyddar bara mot saknat game. I fired-state kan dashboarden väckas, eller så kraschar det (`Cannot read properties of undefined (reading 'status')`).
Byggs oavsett vad 3.3 landar på.
**Status:** `KLAR (4d59ee3b)` — `if (game.managerFired) return <Navigate to="/game/game-over" replace />` tillagt direkt efter den befintliga `if (!game)`-guarden, samma mönster. game-over-rutten går via `GameGuard` (separat wrapper), ingen omdirigeringsloop. **Ej browser-verifierat** — ingen browser-drivrutin tillgänglig i sessionen som byggde den, och ingen e2e-infrastruktur (localStorage-seedad SaveGame genom `gameStore.ts`) finns i repot för att verifiera mekaniskt heller. Manuell kontroll kvar: trigga avsked, navigera till `/game/squad` eller tryck bakåt, ska landa på `/game/game-over`.

### 3.2 · `BoardPatienceMinimal`
Ingen produktionskomponent läser `boardPatience` före `GameOverScreen:24-34`. GPT lät sig sparkas och fick ingen förvarning.
Portalens befintliga minimal-familj, samma mönster som `EconomyMinimal`. **Kvalitativa zoner, inte råtal:** Stabilt · Under press · Ultimatum. Med orsak och möjlig väg tillbaka.
**Varför den inte kan vänta:** ett avsked utan varning är godtyckligt, inte dramatiskt. Och `patron.patience` heter samma sak och betyder något annat — döp om det ena i samma commit.
**Godkänd när:** en spelare som närmar sig tröskeln ser minst två steg av eskalerande varning, med orsak.
**Status:** `KLAR (165b280c, b5c1c9e3, f435022d)` — `patron.patience` → `patron.goodwill` (165b280c). `BoardPatienceMinimal` byggt (`b5c1c9e3`) — kvalitativa zoner Stabilt/Under press/Ultimatum, trösklar (30/50) från `board_failure`-beatens kalibrerade severity-gränser. **"med orsak"-kravet nu fullt uppfyllt (`f435022d`):** `boardPatienceZone.ts`s `pickConcernCause()` väljer orsaksrad i Opus låsta prioritetsordning (sporting → economic → upprepning → community) genom att läsa `boardObjectives`/`boardObjectiveHistory` — headline+orsaksrad+väg-tillbaka renderas nu permanent i kortet, oberoende av om `board_failure`-beaten vinner rotationen. **Sidofynd åtgärdat i samma commit:** `Mecenat.ts`s tredje `patience`-fält döpt om till `goodwill` (skrevs vid generering, lästes ingenstans annars). Ej browser-verifierat, samma skäl som 3.1.

**TEXT LÅST AV OPUS 2026-08-17 — "med orsak"-kravet:**

| Zon | Rad | Vad som följer |
|---|---|---|
| Stabilt | **Styrelsen har inget att invända.** | ingen orsaksrad |
| Under press | **Styrelsen är orolig.** | + en orsaksrad |
| Ultimatum | **Styrelsen har tappat tålamodet.** | + orsaksrad + väg tillbaka |

**Orsaksrader** — välj den som faktiskt driver värdet nedåt, en åt gången, i den här prioritetsordningen:
1. Tabellplacering under kravet: *Ni ligger under det de begärde.*
2. Ekonomi: *Kassan går åt fel håll.*
3. Upprepning — andra året i rad utan uppfyllt mål: *Andra året i rad utan det de bad om.*
4. Klack eller publik: *Det syns på läktaren, och de ser det.*

**Väg tillbaka** (endast Ultimatum) — det ouppfyllda styrelsemålet, sagt rakt: *Det som återstår: {mål}.*

Därmed är kravet "minst två steg av eskalerande varning, med orsak" uppfyllbart utan att hänga på att `board_failure`-beaten vinner rotationen. **Tredje `patience`-fältet: döp om i samma commit.**

### 3.3 · Post-firing-kontraktet — RAPPORT
`GameOverScreen.tsx:37-39` navigerar till `/` utan att rensa save, så huvudmenyn visar FORTSÄTT. Två kontrakt möjliga:

*Rent karriärslut:* arkivera sammanfattning, rensa aktiv save, erbjud Historik och Ny karriär.
*Job market:* behåll managerprofil och historik, välj ny klubb, återställ klubbspecifik state.

Rapportera vad var och en kostar. **Rent karriärslut är minimikravet** — se O13.
**Status:** `RAPPORT-LEVERERAD`

**Nuvarande beteende, bekräftat i kod (inte antaget):**
- `handleNewGame()` (`GameOverScreen.tsx:37-39`) navigerar till `/` men rensar aldrig `store.game`. `IntroSequence.tsx:56`s `hasSave = store.game !== null` är därför fortfarande `true` → "FORTSÄTT" visas → tar spelaren till `/game` → 3.1:s nya `managerFired`-guard (`4d59ee3b`) studsar dem direkt tillbaka till `/game/game-over`. Loopen är mildare än innan 3.1 (spelaren kan inte längre faktiskt SPELA som sparkad), men FORTSÄTT-knappen är fortfarande en återvändsgränd — enda vägen ut är att välja "NY KARRIÄR" istället.
- `useGameStore.newGame()` (`gameStore.ts:165-184`) raderar **redan idag ovillkorat alla befintliga saves** ur IndexedDB (`listSaveGames().forEach(deleteSaveGame)`) innan den nya karriären skapas — ingen arkivering sker. Det betyder att en sparkad karriärs data redan nu tystas ihjäl utan spår så fort spelaren lyckas navigera till en ny karriär via den enda fungerande vägen (NY KARRIÄR). "Rent karriärslut" är alltså inte bara att LÄGGA TILL en rensning — det är att lägga till en arkivering INNAN den rensning som redan händer.
- Persistenslagret (`saveGameStorage.ts`) är redan flersave-kapabelt i grunden (`listSaveGames`/`loadSaveGame`/`deleteSaveGame`/`saveSaveGame`, en per `game.id`) — men INGEN skärm i presentationslagret använder det för att bläddra/välja mellan flera saves. `newGame()`s allt-raderas-först-beteende gör att appen fungerar som en-save-i-taget idag, oavsett vad lagret klarar av.
- `HistoryScreen.tsx` läser karriärhistorik (`seasonSummaries`) LIVE ur `useGameStore().game` — den har inget läge för att visa en arkiverad/död karriär efter att den aktiva saven rensats. Ska den återanvändas för "erbjud Historik" måste den ta emot ett externt game-snapshot som prop, inte bara läsa live store-state.

**Kontrakt A — Rent karriärslut (minimikravet):**
1. Ny store-action (t.ex. `clearFiredGame()`) som sätter `game: null` UTAN att nödvändigtvis radera själva IndexedDB-posten omedelbart — annars kan Historik-visningen aldrig nå den.
2. Sekvensering: eftersom `newGame()` redan ovillkorat raderar alla saves, måste "arkivera sammanfattning" ske FÖRE ett eventuellt senare `newGame()`-anrop — antingen genom att låta den sparkade karriären ligga kvar i IndexedDB (genuint flersave, `deleteSaveGame` anropas aldrig på den) tills spelaren själv väljer att starta nytt, eller genom att extrahera en lätt sammanfattning (`seasonSummaries` + klubbidentitet + slutstatistik — inte hela `SaveGame` med spelartrupp/fixtures) till en separat, billigare arkivpost. Det andra är säkrare mot lagringskvoten — `gameStore.ts:169`s egen kommentar ("Clear old localStorage data that may be filling quota") bekräftar att kvoten redan varit ett verkligt problem i det här projektet, så "spara alla fulla saves för alltid" är inte riskfritt.
3. `GameOverScreen.tsx`s "STARTA NYTT SPEL"-knapp behöver antingen bli två knappar (en som visar Historik/karriärrecap innan rensning, en som går direkt till Ny karriär) eller en sekvens (visa → rensa → navigera). Skärmens befintliga "Din karriär"-statistikblock (säsonger/bästa plats/vinster) är redan en minimal recap — kan räcka som "Historik" i sig, eller länka vidare till en läsa-bara `HistoryScreen`.
4. `IntroSequence.tsx` kräver ingen ändring — `hasSave` blir korrekt `false` automatiskt så fort `store.game` faktiskt nollställs.

Uppskattad omfattning: 3-4 filer (`gameStore.ts` ny action, `GameOverScreen.tsx` flöde/knappar, `HistoryScreen.tsx` om den ska återanvändas för en död karriär, ev. `saveGameStorage.ts` för en lättviktig arkivpost). Ingen ny arkitektur — bygger på befintlig flersave-kapacitet, bara en presentationsyta som saknas.

**Kontrakt B — Job market (O13, uttryckligen ej beslutad):**
Väsentligt större, av ett strukturellt skäl: `createNewGame()` (`createNewGame.ts:186-193`) genererar ALLTID en helt ny värld (`generateWorld` — alla 12 klubbar, alla spelare) och ett nytt schema från säsong 1. Det finns ingen "behåll ligan, byt bara vilken klubb jag styr"-väg idag. "Välj ny klubb, återställ klubbspecifik state, behåll managerprofil och historik" kräver alltså:
1. En genuint ny väg vid sidan av `createNewGame` som tar en BEFINTLIG `SaveGame` (ligan, övriga 11 klubbars trupper/tabellposition, säsongskalendern) och bara byter `managedClubId` + återställer det som är klubbspecifikt (trupp, ekonomi, styrelserelation, stab) — en helt annan operation än att bygga world+schedule från noll.
2. Ett explicit beslut om VILKA fält som ska överleva bytet (managerns egen karriärstatistik, `seasonSummaries`, `managerProfile`) och vilka som ska nollställas (klubbens trupp, kassa, `boardPatience`, styrelsemål) — inte bara kod, ett designbeslut som `createNewGame`s nuvarande antaganden inte är byggda för att uttrycka.
3. Given O13 uttryckligen är "Inte beslutad" — jag djupdyker inte längre i detaljerad filomfattning här. Poängen med den här uppskattningen är bredden av skillnaden mot Kontrakt A, inte en färdig spec för något som inte är beslutat att byggas.

**Min läsning:** Kontrakt A är byggbart nu, måttlig omfattning, väntar inte på obeslutade frågor. Kontrakt B väntar på O13 OCH kräver en väsentlig omarbetning av `createNewGame`s grundantagande (alltid ny värld) — inte en påbyggnad ovanpå Kontrakt A, utan en annan operation. Din dom att avgöra om B någonsin byggs; A kan byggas oavsett det svaret.

---

**DOM 2026-08-17 — KONTRAKT A. Bygg det.**

Tre saker i rapporten avgör, och de är alla nya för mig:

**`newGame()` raderar redan alla saves ovillkorat** innan den skapar den nya karriären. En sparkad karriär tystas alltså ihäl utan spår i dag — problemet är inte att rensning saknas, det är att **arkivering saknas före en rensning som redan sker.**

**Arkivera lätt, inte tungt.** En separat arkivpost med `seasonSummaries`, klubbidentitet och slutstatistik — inte hela `SaveGame` med trupp och fixtures. Codes eget belagda skäl räcker: `gameStore.ts:169`s kommentar visar att lagringskvoten redan varit ett verkligt problem i projektet. "Spara alla fulla saves för alltid" är en framtida buggrapport.

**`HistoryScreen` tar emot ett snapshot som prop.** Den läser live store-state i dag och kan därmed inte visa en död karriär. Det är ändringen som gör "erbjud Historik" möjlig — och samma ändring behövs ändå för `U7`s backupflöde.

**Två vägar från Game Over**, inte en: **Se karriären** och **Ny karriär**. Den första visar arkivet, den andra rensar och startar om. Sekvensen "visa → rensa → navigera" bakom en knapp döljer att något kastas.

**Kontrakt B byggs inte.** Skillnaden är större än `O13` antog: `createNewGame` genererar alltid en ny värld, så job market kräver en helt annan operation — behåll ligan, byt `managedClubId`, återställ det klubbspecifika. Det är inte en påbyggnad på A. `O13` uppdaterad med det.

**Godkänd när:** efter avsked finns ingen väg till `/game`, huvudmenyn visar inte FORTSÄTT, och den avslutade karriären är läsbar.
**Status:** `KLAR (853b4d55)` — två knappar (SE KARRIÄREN / NY KARRIÄR), ny route `/game/game-over/historik` under `GameGuard` (kollar bara `!game`, inte `managerFired` — `GameShell` hade annars redirectat bort den direkt). `clearFiredGame()`-action nollställer store:t. **Avvikelse från "arkivera lätt"-rekommendationen, medveten:** byggde INTE en separat persisterad arkivpost — `GameOverScreen` fångar hela `game`-objektet i `navigate()`s route-state, `HistoryScreen` läser det via en ny `snapshot`-prop (`resolveDisplayedGame()`) istället för live store. Lättare än en ny IndexedDB-post (noll extra skrivningar), men överlever inte en sidladdning mellan avsked och "SE KARRIÄREN"-klick — route-state är minnesbaserat. Given `game` ändå ligger kvar orört i store fram tills `clearFiredGame()` körs (bara NY KARRIÄR-knappen anropar den), är det praktiska felfönstret smalt: en reload på game-over-skärmen läser fortfarande live store korrekt (samma data), det är bara ett reload EFTER att "SE KARRIÄREN" navigerat och route-state gått förlorat men INNAN NY KARRIÄR som skulle tappa vyn. Godkänn eller kräv en persisterad arkivpost — säg till.

---

# ETAPP 4 — två källor som glidit isär

Samma klass genomgående: `RoundSummaryScreen` mot `GranskaScreen`, `respondToIncomingBid` mot `resolveEvent`, `isNeutralVenue` som proxy för final. Två vägar till samma sanning, och de glider.

| ID | Post | Rotorsak / villkor | Status |
|---|---|---|---|
| 4.1 | Standings parity — dashboard 5:e, bracket 6:a, årsbok 5:e, samma säsong och 21 poäng | `calculateStandings` (tie-breaker: poäng→GD→gjorda mål→klubbId) var redan kanonisk, men `roundProcessor.ts` var ENDA anropsstället som skickade `game.pointDeductions` som tredje argument. `playoffTransition.ts`, `seasonEndProcessor.ts`, `TabellScreen.tsx`, `matchActions.ts`×3 gjorde det inte — en klubb under poängavdrag fick olika placering på olika ytor trots samma underliggande tabellfunktion | `KLAR (85e60a47)` — **osäkerhet kvar:** fixet är verifierat korrekt och täcker HELA felklassen (pointDeductions-inkonsekvens), men jag har inte det ursprungliga repro-savet och kan inte 100% bekräfta att just DEN observationen (5:e/6:a/5:e, 21 poäng) berodde på ett aktivt poängavdrag snarare än något annat. Om samma mönster syns igen efter denna fix, det är en annan rotorsak — säg till |
| 4.2 | Derbyrepliken. **Tre vägar in**, vilket är varför tre tidigare ordrar inte räckte: `preferIds` filtreras ej (`:28,36,41`); `win_derby` klassad generic `win` (`:423`); storyline-frågan behåller föregående matchfrågas `preferIds` (`:657-696`) och svaren byggs ur dem | Alla tre stängs. Specialtaggar får `generic: none`. **13 + 4 arc-frågor wire:ade 2026-08-19** — 31 nya svar (`docs/SVAR_STORYLINE_FRAGOR_2026-08-19.md`, Opus) i `PLAYER_RESPONSES` (`topic_person`/`topic_town`/`topic_doubt`/`topic_player`, 3 återanvänder `w_h5`/`w_p3`/`cl32`); alla 17 override-platser pekar nu på topikanpassade `preferIds`. Två spärrar: nya taggarna `matches:()=>false` + `generic:'none'` — nås endast via explicit `preferIds`. Nytt tabelltest `storylineArcPreferIds.table.test.ts` verifierar preferIds-täckning + topic_*-otillgänglighet från vanlig matchfråga. Hör ihop med U2 | `KLAR (c1c35970)` |
| 4.3 | Varsel-dedupe | `postAdvanceEvents:281-307` kollar `event_varsel_s{season}`, fabriken skapar `event_varsel_{employer}_{season}`. Gemensam ID-funktion | `KLAR (406be8e4)` — `varselEventId(season)` exporterad, används av båda anropsställena. Test verifierat mot repro (fixat id i resolvedEventIds blockerade inte ett nytt event innan fixet) |
| 4.4 | Byggflikens copy → "Ett bygge åt gången". Låsta noder listar **alla** krav med uppfyllt/ej | `FacilityTree.tsx:231` sa säsongsstart, `FacilityScreen:84-92` implementerar löpande. `facilityNodes:162-168` kräver två noder, visar en | `KLAR (b805a829)` |
| 4.5 | Årsbokens styrelsemening ur objective-resultat, inte placeringstier | "2:a plats uppfyller kravet att vinna ligan". Samma rot som `growFanbase`-etiketten i sluttestet | `KLAR (6f1d36a1)` |
| 4.6 | Årsboken: rå nyckel `captain_rallied_team`, dubbla kaptensevent, `O33` i en 22-omgångssäsong | Sista är kalenderindex mot ligaomgång — separera dem | `KLAR (ae1f00d0, cf6bc619, ee18caaa)` — tre separata rotorsaker, tre commits. O33: arc-storylines satte matchday till det globala matchday-värdet (kan bli 27+ i slutspel), bytt till getCurrentLeagueRound. Dubbla kaptensevent: captainSpeech-eventet och ledare_crisis-arcen triggar båda på 3+ förluster i rad, oberoende byggda — captainRallyGuard.ts delad spärr. Rå nyckel: fyra storylines (inte bara captain_rallied_team) satte description till den råa type-strängen — grep bekräftade fyra träffar totalt, alla fixade |
| 4.7 | `SeasonSummary` lagrar `eliminatedByClubId`, avgörande match, rundnummer | `SeasonSummaryScreen:121-135` läste `game.playoffBracket`, ej historiskt tillförlitlig efter rollover → "Kvartsfinalen mot motståndet" | `KLAR (fd3a7428)` |
| 4.8 | `condition_0` etiketterad "trötthet" (`GranskaOversikt:703-720`) — noll kondition visas som noll trötthet | Semantisk inversion; gör rotation olärbar | `KLAR (35e9ac16)` — andra halvan `KLAR (49abf3fc)`: `TeamSelection.autoSelected` trädas genom setLineup → setPlayerLineup → simulateRemainingStep (enda auto-uttagningsplatsen för managed club, verifierat mot matchSimProcessor.ts), kopieras in i `ManagerChoiceEntry.autoSelected` på started_tired-poster i båda byggplatserna (roundProcessor.ts snabbsim + matchActions.ts live). "Assistenten satte laget" visas som muted notering i Granska när flaggad |
| 4.9 | Sponsorpresentation | `postAdvanceEvents:605-619` rundar veckobelopp till tusental, räknar totalen exakt → "2k × 10 = 15k" | `KLAR (05e7b9b4)` |
| 4.10 | `FormationView.tsx:361` — `p.position.slice(0,3).toUpperCase()` på engelskt enum ger DEF/MID/HAL/GOA | Explicit mappning: goalkeeper→MV, defender→B, half→YH, midfielder→MF, forward→A | `KLAR (50178bb3)` |
| 4.11 | `facility_completed` konsumeras i stället för tidsstyras | `portalBeats:541-558` triggar bara när `lastCompleted.matchday === currentMatchday`. Tas platsen av något högre prioriterat försvinner invigningen för alltid | `KLAR (43903fbd)` |
| 4.12 | Delningsbilden kapas i produktion | `seasonShareImage.ts` — fast canvas 1080×1350, handrullad y-pekare (`:18-185`), tre spelarblock efter målsektionen (`:155-178`), fot alltid på `H-60`. Regionsbaserad layout, reservera fot först, **hård assertion att inget ritas efter `H - footerHeight`** | `KLAR (33b10618)` — `buildLayoutRows()` bygger EN radlista (höjd + ritfunktion) som driver både `computeSeasonShareImageHeight()` (ren, testad) och `drawRows()` — kan inte längre divergera. H = `Math.max(1350, TOP_MARGIN + innehållshöjd + FOOTER_RESERVED)` istället för konstant. `assertWithinContentBounds()` kastar om en rad ritas förbi footer-gränsen, exporterad och testad direkt. Testat mot mockad canvas-ctx (jsdom ger ingen riktig 2d-context): inget innehållsanrop hamnar förbi gränsen i värsta kombinationen (SM-final + tre statsrader), footern hamnar rätt. **Bildsnapshots byggdes INTE** — canvas-bilden renderas inte som DOM, ingen dev-scen finns för den; öppen punkt om Jacob vill ha visuell verifiering utöver den mockade ctx-testen |
| 4.13 | `shareSeasonImage` returnerar `void` och sväljer alla fel (`:215-244`) | Returnera `shared`/`downloaded`/`cancelled`/`failed`. `AbortError` = cancel **utan** nedladdning — i dag laddas filen ner efter avbrott. Web Share saknar `text` och `url` | `KLAR (26884074)` — `SeasonShareResult`-union, `isAbortError()` särskiljer medvetet avbrott (ingen nedladdning) från andra delningsfel (faller igenom som förut). `text: summary.narrativeSummary` (redan visad text, ingen ny svensk prosa), `url: window.location.origin` (ingen påhittad produktions-URL — repot har ingen sådan konstant). 5 nya test, stash-verifierade mot pre-fix-kod |
| 4.14 | "Spara som bild" under Säsongens match producerar säsongskortet | Generiska `handleShare`; `matchHighlightService:88-99` sätter `shareImageReady: false` permanent. Byt texten till "Dela säsongen" tills matchartefakten finns — en knapp som lovar en artefakt den inte kan leverera är 2.5 igen | `KLAR (fc6245c8)` — enda förekomsten av "Spara som bild" i kodbasen (de två andra delningsknapparna beskrev redan korrekt vad de gör). Browser-verifierat mot en tillfälligt fixturerad dev-scen (season-a/b/c i galleriet renderar INTE riktiga SeasonSummaryScreen — bara season-header/-noplayoffs/-fired gör det, och ingen av dem hade matchOfTheSeason satt sedan tidigare) — fixturändringen reverterad efter verifiering, ingen permanent scen-täckning för kortet finns ännu |
| 4.15 | **Svårighetsbadgen ljuger tills U1 är byggd.** Text låst av Opus 2026-08-17: byt `LÄTT/MEDEL/SVÅR` mot vad som faktiskt härleds — **`HÖGA FÖRVÄNTNINGAR` / `RIMLIGA FÖRVÄNTNINGAR` / `LÅGA FÖRVÄNTNINGAR`**, samma tre renommétrösklar som i dag. Undertexten på klubbkortet: hög → *"Styrelsen räknar med topplacering."*, rimlig → *"Styrelsen väntar sig en säsong utan kris."*, låg → *"Styrelsen väntar sig inte mirakel. Resurserna är små."* — En falsk SVÅR-badge är sämre än ingen badge, och klubbvalet är den första yta varje ny spelare ser. Återinförs som verklig svårighetsgrad när `U1` är byggd | `KLAR (redan löst av U1, 4be59ff9)` — `U1` är byggt: `DifficultyTag.tsx`/`OfferCard.tsx` renderar redan `offer.difficulty` rakt av (ren presentationskomponent, ingen egen härledning), och `ClubSelectionScreen.tsx` hämtar den från `selectThreeOffers()` → `computeDifficultyScore()`, som U1 redan rättade. Badgen visar alltså redan SANN LÄTT/MEDEL/SVÅR — texten ovan var den tänkta INTERIMSLÖSNINGEN för perioden innan U1 fanns, och postens egen villkorsmening ("återinförs som verklig svårighetsgrad när U1 är byggd") säger uttryckligen att FÖRVÄNTNINGAR-varianten då aldrig ska byggas. Ingen kodändring krävs. Ej browser-verifierat (ingen browser i sessionen) — logiken är spårad hela vägen offer.difficulty → DifficultyTag, samma sanning som redan testas i offerSelectionService.test.ts |

**Godkänd när etappen är klar:** ingen renderad produkttext innehåller `{...}` eller råa nycklar, och samma fråga ställd till två ytor får samma svar (placering, motståndare, arena, kondition, pengar).

---

# ETAPP 5 — nya ytor

Dessa är **inte** nya löften utan mekaniskt kontrakt. Framgångsauditens "pausa nya berättelsekort" gäller dem inte — de är rytmfixar för befintliga ögonblick med låst copy.

### 5.1 · Sommaren
Variant 1e. Underlag: `CODE_INSTRUKTION_SOMMAREN_2026-08-17.md` och `docs/incoming/Sommaren-sasongsovergangen-2026-08-17.dc.html`.
All copy låst. Fem rapportera-först-punkter i ordern: `getBurnoutZone`s zoner, händelsetyper mina tre radformer inte täcker, fältet bakom "slutspel inte rimligt", inhakning i flödet, härlett omgångsantal.
Utbrändhetens golv på 30 är det enda som gör burnout till något annat än en räknare som nollställs. Bygg det som specificerat.
**Status:** `KLAR (0d617cef)` — ny fil `seasonTransitionService.ts` (15 rena funktioner, 42 test), ny route `/game/season-transition` i `CEREMONY_PATHS`, ny återinträdesguard (`seasonGoalChosenForSeason`, samma fält O3 sedan tar över — se kommentaren i `SaveGame.ts`), nytt persisterat fält `pendingSeasonTransitionEvents` (retired/contractExpired/aged skrivs av `seasonEndProcessor.ts`, promoted skrivs direkt av `academyActions.ts` när det händer). Fjärde radformen (kontraktsutgång, prioriterad före de tre andra) tillagd per Jacobs DOM. Fyra dev-scener via fabriken, browser-verifierade text-för-text mot låst copy över alla villkorsgrenar samtidigt — alla fyra stämde exakt. **Inte verifierat visuellt** (temperaturkurvan vid 390px) — dev-skalets sticky-galleri är självt högre än viewporten, samma förbehåll som "DEV-SCENSKALET FÅR INTE PÅVERKA DET SOM FOTOGRAFERAS" redan dokumenterar. 50 nya test, stash-verifierade, 2044/2044 grönt, stress 10×5 rent

**Temperaturkurve-domen, 2026-08-19 — tre fynd, två fixade:**
1. **Layoutbugg, fixad.** `minHeight:'100vh'` på scenens rot + `marginTop:'auto'` på horisontblocket (flex-motsvarigheten till space-between) pressade blocket till skärmens botten oavsett innehållshöjd — ~180px svart tomrum mellan paper-kroppen och horisontblocket på kort innehåll. Båda raderna borttagna; sidan är nu innehållshög, de tre blocken ligger tätt.
2. **Kicker/brödtext-motsägelse, fixad — dev-fixtur, inte komponenten.** Kickern läser `game.currentSeason` (via `seasonStartYear()`), epok-raden läser `trainerArc.seasonCount` — två olika fält. `DevScenesScreen.tsx`s `makeSommarenGame()`-anrop satte aldrig `currentSeason`, så alla fyra scener ärvde `makeGame()`s default (8) i kickern medan brödtexten korrekt varierade (2/6/4/11). `currentSeason` nu satt per scen, matchar `seasonCount`.
3. **"Framsteg 3/8" innan säsongen börjat — kontrollerat, INTE en bugg.** Spårat till `seasonEndProcessor.ts:944-960` (kommentaren SLUTTEST 2026-08-08 punkt 4b): `boardObjectives.currentValue` evalueras EN gång vid generering (säsongsskiftet, samma ögonblick Sommaren visas), inte satt till 0 — det var den redan dokumenterade fixen för motsatta bugg-klassen (nivåmål som ljög "0/70" när mätaren egentligen stod på 50). Devscenens `currentValue:3` är en handskriven, representativ siffra (inte körd genom riktiga `evaluateObjective`), men KONCEPTET — ett nollskilt startvärde innan säsongens matcher spelats — är korrekt, avsiktligt produktbeteende, inte den falska nollan i någon riktning. Ingen kodändring.

Skärmdumpar regenererade (`screenshots/sommaren/*.png`, 390px, `capture-mode`-flaggan satt så dev-navets sticky-artefakt inte läcker in). **Godkänd 2026-08-19** — temperaturkurvan fungerar, kickern stämmer, blocken ligger tätt. Baseline-seed triggad samma dag, tre ändringar i samma svep (Sommarens fyra scener + `upptakt`s kontrastfix-diff + `primary-event-vs-farewell`s btn-outline-diff), noterat i seed-commitens meddelande via `visual-baselines.yml`s nya valfria `note`-input.

**Två nya fynd vid godkännandet, till kön, ingen brådska:**

4. **Fotens frizon för stor i korta fall.** `FeedbackButton.tsx:67` är `position:'fixed', bottom:64` — VIEWPORT-relativ, global RC-testchrome (alla skärmar, inte scen-scoped). Varje annan scen har hittills garanterat minst `100vh` innehåll (samma mönster jag just tog bort från Sommaren), så raden har alltid legat direkt under verkligt innehåll av en slump, aldrig av design. Utan den garantin (Sommarens korta fall, t.ex. "tomt"-varianten med få händelser) slutar scenens eget mörka innehåll ~130px före viewportens botten, och "byggnummer · rapportera"-raden hänger ensam i det exponerade tomrummet därunder. Innehållshöjden är fortsatt rätt (Jacobs egen dom) — det är kopplingen mellan `FeedbackButton` och "sidan fyller alltid skärmen" som aldrig var explicit, bara sant av en slump tills nu.

   **Designspänningen (2026-08-20, svar på "vad står emot vad"):** `FeedbackButton` är monterad EN gång globalt (`AppRouter.tsx:174`, syskon till `<Routes>`, inte barn till någon scen) — den har ingen scen-DOM att luta sig mot strukturellt. `#root`s eget skal (`overflow:hidden`, SKAL-REGELN) tvingar redan hela appen till en fast 100vh-box oavsett innehåll, så `position:'absolute'` hade INTE löst något — den hade landat mot exakt samma 100vh-box som `fixed` redan gör (samma "containing block"). Den verkliga motsättningen: temperaturkurve-fixen (samma sprint) tog BORT `minHeight:'100vh'` från scenens rot medvetet, så att scener blir exakt så höga som sitt innehåll — men `FeedbackButton` antar fortfarande att en mörk bakgrund alltid når hela vägen till viewportens botten. Två redan fattade beslut (scener ska vara innehållshöga · foten ska alltid vara nåbar och synlig mot mörk botten) pekar åt olika håll för KORTA scener. Att lösa det kräver antingen (a) JS-mätning av faktisk dokumenthöjd vs viewport och växla button-position dynamiskt, eller (b) ge korta scener en egen bottenfyllnad (bakgrund som sträcker sig till minst 100vh utan att FLYTTA innehållet, bara måla bakom det) — båda är produktval om vilket beteende som är rätt, inte en mekanisk fix. Ej byggd, väntar på din riktning.
5. **"Framsteg 3/8" möter "nya mål" — rapport, vilket är billigast.** Siffran är korrekt (fynd 3 ovan), men "STYRELSEN HAR SATT NYA MÅL" + en redan fylld stapel läses som en motsägelse på just den här ytan — ingen av de två byggdes med den andra i åtanke. Två alternativ:
   - **(a) Dölj framstegsstapeln i Sommaren.** `BoardObjectivesList`/`ObjRow` (`BoardObjectivesList.tsx`) har idag ingen väg att visa BARA `label`/`owner` utan `Framsteg X/Y`-blocket. Kräver en ny valfri prop (`hideProgress?: boolean`, default `false` — noll påverkan på Portal/ArrivalScene:s befintliga bruk), trädd genom till `ObjRow`, ~15-20 rader över 2 filer. **Ingen ny svensk text** — Code kan bygga, testa och leverera detta helt själv, samma dag.
   - **(b) Byt rubriken så den inte säger "nya".** Mekaniskt den minsta ändringen (en rad, `SeasonTransitionScene.tsx:125`) — men SVENSK TEXT-regeln (CLAUDE.md) stoppar Code från att formulera ersättningen själv. Blir ett nytt "blockerad på Opus-text"-ärende, samma kö som redan är full.
   
   **Rekommendation:** (a) är billigast **i praktiken**, trots fler rader — den är stängningsbar av Code idag utan väntetid, medan (b):s enda-rads-fördel äts upp av att den måste vänta på en textrunda. Säg till vilken som gäller, eller om båda ska göras (dölj stapeln OCH mjuka upp rubriken).

### 5.2 · KapitelPunkt i Granska
En komponent, tre innehåll (cupfinal / SM-final / avsked), efter resultatblocket, före Turneringsläge och statistik. En rad i `granskaSectionRegistry` — **ingen egen gren.**
Kommentarblocket på `GranskaOversikt.tsx:375-387` dokumenterar varför: en tidig `return` för avsked rev sex event-drivna sektioner som inte fanns i matrisen. Avsked är innehåll överst, aldrig en gren som river sektioner.
Copy låst i chatten 2026-08-17 (sex varianter plus avskedsraden i två former).
**Status:** `KLAR (fc6f5015, redan byggt — status ej synkad förrän nu, 2026-08-18)` — samma commit Å6 redan pekade mot. `kapitelPunktService.ts`: fyra fasta varianter (sm_guld/cup_vunnen/sm_final_forlorad/cupfinal_forlorad) + avsked i två former (under/över 10 mål) = de "sex varianterna". `deriveKapitelPunktKind` slår ihop match-utfall OCH avsked till EN `kind`, `GranskaOversikt.tsx:397-418` läser `granskaSectionRegistry`s `visasFor('kapitelPunkt',...)`-rad — ingen egen gren, exakt placering efter resultatblocket. 11 test gröna. Browser-verifierat: tre dev-scener (granska-sm-final/granska-avsked/granska-cup-final) renderar rätt låst text

### 5.3 · Turneringsläge mitt i serie
`deriveTurneringslageMode` returnerar `null` under en pågående serie, så en semifinal där klubben står 1–0 visar ingenting alls.
**Ett avgjort utfall är information; en oavgjord serie är dramatik.** Att bara det första renderas är omvänd prioritering.
Rapportera vad som finns tillgängligt att visa mitt i en serie — matchställning, antal segrar som krävs, hemmafördel nästa match. Jag skriver texten.

**RAPPORT, 2026-08-19.** Alla tre finns redan, för slutspel — och inte bara "finns i datan", utan REDAN BERÄKNADE av en levande funktion: `getPlayoffSeriesContext()` (`src/domain/services/portal/playoffSeriesContext.ts`), byggd för NextMatchCards vikt-styling, inte för Turneringsläge — men det är exakt samma fråga.

**Matchställning:** `context.wins`/`context.losses` — räknat ur den hanterade klubbens perspektiv (inte hemma/borta-perspektiv som `PlayoffSeries.homeWins`/`awayWins`), matchvis genom `series.fixtures` mot `game.fixtures`. Färdig att läsa rakt av: "Ni leder 2–1."

**Antal segrar som krävs:** inte ett eget fält i `context`, men trivialt — samma tröskel `playoffService.ts`s egen `isSeriesDecided()` redan använder: final = 1 vinst (enda matchen), kvarts/semi = 3 vinster (bäst av fem). En rad kod: `series.round === PlayoffRound.Final ? 1 : 3`.

**Hemmafördel nästa match:** inte heller ett eget fält, men `context.nextGame` (1-indexerat matchnummer i serien) pekar direkt mot `series.fixtures[nextGame - 1]` — slå upp den fixturen i `game.fixtures` och jämför `homeClubId` mot `managedClubId`. Best-of-5-mönstret är dessutom deterministiskt (hemma/borta/hemma/borta/hemma för seriens hemmaklubb, se `generatePlayoffFixtures`), så det går även att räkna ut utan uppslaget om det är billigare.

**Cup är en annan fråga, inte samma lucka.** Cup har ingen serie — varje rond är EN match, avgjord direkt (`CupBracket`/`CupMatch`, inget `homeWins`/`awayWins`-koncept). Det finns alltså ingen "matchställning mitt i en rond" att visa för cup. Den motsvarande luckan för cup är en ANNAN: mellan ronder (vunnit rond 2, inte spelat rond 3 än) visar `deriveTurneringslageMode` heller ingenting där (`isInFinal` är false tills finalen), men det som går att visa är bara "vidare till [rondnamn], hemma/borta mot [nästa motståndare]" — ingen ställning, ingen "segrar som krävs" (alltid 1, hela poängen med cup). Om Sommaren/Turneringsläge ska täcka båda är det två separata texter, inte en delad mall.

**Flaggat, inte fixat — datakvalitetsfynd i den återanvända funktionen:** `getPlayoffSeriesContext()`s `wins`/`losses`-räkning (rad 39-45) jämför RÅ `homeScore`/`awayScore` (`myGoals > theirGoals ? wins++ : losses++`) — ingen `else if`, ren binär. En match avgjord i förlängning/straff har `homeScore === awayScore` i grundtiden (samma mönster U2 redan fixade för `MatchTypeAxes.utfall`, som läser `wentToPenalties`/`overtimeResult` FÖRE råscore) — här faller en sådan match rakt in i `else`-grenen och räknas som förlust, oavsett vem som faktiskt vann. Inte rapporterat tidigare eftersom ingen UI hittills visat serieställningen självständigt (bara vikt/kritikalitet, som inte bryr sig om VILKEN sida som vann matchpucken). Om 5.3 bygger på denna funktion ärver texten samma bugg — värt att fixa i samma sving, inte en separat post.

**Status:** `RAPPORT-LEVERERAD` — väntar på Jacobs text

---

# ETAPP 6 — grindar och geometri

| ID | Post | Status |
|---|---|---|
| 6.1 | Geometrigrinden — **blev 31 scener, inte 28**, enbart mätläge | `KLAR (8eea7768)` |
| 6.2 | `event-overlay` + `press-conference`: **båda samexisterar med riktig nav** — strukturellt bekräftat. Ingår i grinden | `KLAR (8eea7768)` |
| 6.3 | De fyra kvarvarande tap-target-fynden, i konsekvensordning: `primary-smfinal-vs-deadline` / `primary-event-vs-farewell` (28 px mellan "Simulera resterande säsong" och "Redo — spela omgång N" — en felträff simulerar bort resten av säsongen), `submodal` (4 px), `tacticmodal` (6–8 px) | `KLAR (c5fa24f7, redan byggt — status ej synkad förrän nu, 2026-08-18)` — commit `c5fa24f7` ("tap-target-fynden 1-3 — Simulera/CTA, taktikgrid, spelarbytesmodal", 2026-08-17) fixade alla tre underliggande ställen (de två Primary-scenerna delar samma "Simulera"-fix). Verifierat på nytt idag: `npx playwright test tapTargetGate.visual.ts -g "primary-smfinal-vs-deadline\|primary-event-vs-farewell\|submodal\|tacticmodal"` — 6/6 gröna (ren geometrigrind, inga snapshot-baselines krävs) |
| 6.4 | Kontrastgrind, en-primär-grind, träffytegrind, matchtypsmatris-grind, datarobusthetsgrind (åtgärdslistans post 17–21) | `KLAR` — post 17, 18, 20, 21 (alla deldelar) klara, se noter nedan |

**Varför 6.1 bara mäter:** kostnaden i den breda varianten är att någon granskar 28 bilddiffar. Nyttan sitter i geometrijämförelsen, som inte behöver någon ny snapshot. Bilddiffarna tas styckvis senare, när någon ändå rör respektive yta.

**6.4, post 17 — Kontrastgrind, byggd 2026-08-18:** `tests/visual/contrastGate.ts` (WCAG 2.1-kontrastformel, 4,5:1 normaltext / 3:1 stortext) + `tests/visual/contrastGate.visual.ts` (sveper hela `SCENES`), wired i `app-ci.yml` som egen `contrast-gate`-job. Scope: `[data-primary-card]` — attributet satt på alla nio `portal/primary/*.tsx`-rotwrappers i samma commit (de delade tidigare fyra olika klassmönster, inget gemensamt CSS-selektor var möjligt utan att missa några).

Gaten hittade tre riktiga fel vid första körningen, alla fixade:
1. `NextMatchCard.tsx:515` — "vs"-avdelaren mellan formsträckor läste `var(--border)` som textfärg (fel token-roll, inte bara fel kontext) → `var(--text-muted)`.
2. `.tag-copper` (global.css) läste `var(--accent-dark)` — aldrig remappad för `.card--portal`s mörka kontext (3,15:1). Ny dedikerad `--accent-text`-token (default = samma värde som idag, noll synlig ändring utanför Portal; remappad i `.card--portal`) — INTE en blank remapp av `--accent-dark` självt, det första försöket bröt `headerTagStyle`s bakgrundsanvändning av samma variabel (ny regression, 3,01:1, hittad och reverterad innan commit).
3. `NextMatchCard.tsx`s `vsColor` (crest-avdelaren) — samma `--accent-dark`-rotorsak i default/final/playoff-grenarna → `--accent-text`.

Verifierat att gaten fångar riktiga regressioner: EventPrimary.tsx:s Å1-fix (`52a1fc30`) reverterades tillfälligt → gaten föll med exakt samma signatur (1,06:1/1,81:1) → återställd. Två falska positiva i gaten själv fixade under vägen: SVG `<text>` (ClubBadge.tsx läser `fill`, inte CSS `color`) och `background-image`-gradienter (`.btn-primary` — gaten klev förbi till fel förfaders bakgrund).

**Flaggat, inte löst:** `NextMatchCard.tsx`s mindre "vs" (dot-strip-avdelare, 8px) sitter på 3,15:1 mot portal-bg efter token-fixen — under 4,5:1-normaltextkravet, över 3:1. Genuin designfråga (är en 8px divider mellan två redan-informativa dot-rader menad att vara fullkontrast-text eller medvetet nedtonad?), inte löst ensidigt. Markerad `data-contrast-exempt` i koden (grep:bar, med anledning) så gaten förblir grön utan att tyst gissa ett svar. `vsColor`s `isDerby`/`isAnnandagen`-grenar (`--danger`/`--success-light`) är INTE verifierade i portal-mörk kontext — ingen dev-scen i dagens `SCENES` träffar dem, så gaten har aldrig prövat dem. Öppen lucka, inte antagen OK.

**6.4, post 18 — en-primär-grind, byggd 2026-08-19:** `tests/visual/enPrimaryGate.ts` (räknar synliga `.btn-primary` inom scope, `>1` = kränkning, `0` är legitimt) + `tests/visual/enPrimaryGate.visual.ts` (sveper `SCENES`), wired som egen `en-primary-gate`-job. Regeln fanns redan (`CLAUDE.md`: "En `.btn-primary` per skärm, max"), aldrig mätt.

Gaten hittade Å3-bugklassen på nytt, fast bredare: Å3s egen fix (`4b375560`) täckte bara `SMFinalPrimary.tsx` — de andra fem knapp-bärande `primary/`-komponenterna (`DerbyPrimary`, `FarewellMatchPrimary`, `CupFinalPrimary`, `PatronDemandPrimary`, `TransferDeadlinePrimary`) plus `EventPrimary` (gatens faktiska förstafynd, i scenen `primary-event-vs-farewell`: "Hantera händelse →" OCH `PortalScreen.tsx`s fasta "Redo — spela omgång N →" båda `.btn-primary` samtidigt) hade aldrig fått samma fix. `PortalScreen.tsx:426`s CTA är `position:fixed`, ovillkorlig — konkurrerar med VILKEN primär-korts-knapp som helst som också är `.btn-primary`. Sex komponenter bytta till `.btn-outline`, exakt samma mönster som `SMFinalPrimary`/`SpectatorPrimary` redan etablerat. Verifierat: regression-testad (EventPrimary tillfälligt återställd till `.btn-primary` → gaten föll med samma par igen → återställd), browser-verifierad (screenshot, outline-knappen legibel och konsekvent med etablerat mönster), 56/56 gröna.

**6.4, post 20 — matchtypsmatris-grind, byggd 2026-08-19.** Jacobs villkor ordagrant: grinden ska assertera FRÅNVARO när matrisen säger ✕ (DS-regel 12 — ✕ betyder utelämnad, aldrig ett tomt/gråtonat kort), inte bara att rätt sektioner finns — en grind som bara kollar närvaro fångar aldrig att någon "fixat" en tom sektion genom att rendera en platshållare.

`tests/visual/matchtypsmatrisGate.ts` importerar den REDAN LEVANDE `visasFor()` (`granskaSectionRegistry.ts`) direkt — ingen egen kopia av matrisen som kan glida isär från sanningen. Sju av nio matchtypsberoende sektioner (tabell/form/statistik/dinaVal/omgångssammanfattning/andraMatcher/scouting) testas TEXT-baserat: när `visasFor` säger ✕, assertera att sektionens fasta rubrik ("📊 TABELL" osv) inte finns någonstans i scenens text — fångar en platshållare som återanvänder samma rubrik (den mest sannolika regressionsformen), missar en platshållare med en helt påhittad rubrik (ärlig, dokumenterad gräns, inte en dold lucka). Presence testas INTE för dessa sju — de är alla datavillkorade utöver `visasFor` (t.ex. `standing`/`fixture.report`/`rows.length>0`), skulle ge falska larm på tomma dev-fixturer.

Två sektioner fick `data-granska-section`-attribut i `GranskaOversikt.tsx` (dynamisk text, ej textmatchningsbar): `nastaMatchPekare` (satt direkt på befintlig `<p>`, ingen omstrukturering) och `kapitelPunkt` (ny wrapper-`<div>` runt befintlig `<KapitelPunkt>`-rendering — säkert eftersom sektionen inte delar CSS Grid/flex-kolumnlogik med syskon, till skillnad från tabell/form som DELAR en grid vars kolumnantal beror på hur många av dem som renderar — en alltid-renderad wrapper hade brutit den grid:en, därför textbaserad kontroll för just de två). **kapitelPunkt är "ankaret"** — enda sektionen där NÄRVARO också asserteras, inte bara frånvaro, eftersom `deriveKapitelPunktKind` är deterministisk när `visasFor` säger ✓ (ingen datalucka att gömma bakom, till skillnad från de andra åtta).

Sex Granska-scener (`granska`/`granska-cup`/`granska-cup-final`/`granska-slutspel`/`granska-sm-final`/`granska-avsked`) mot en hand-verifierad axel-tabell (tavlingstyp/skede per scen, korsverifierad mot `matchTypeAxes.ts`s `deriveTavlingstyp`/`deriveSkede`-logik och varje scens fixture i `DevScenesScreen.tsx`). Wired som egen `matchtypsmatris-gate`-job.

Verifiering, båda riktningarna, live regressionstestade: (1) statistik-sektionen tvingad att alltid rendera (bypass av `visasFor`-kollen) → gaten föll korrekt på `granska-avsked` ("STATISTIK syns trots ✕") → återställd. (2) `kapitelPunktKind`-blocket tvingat till `false` → gaten föll korrekt på `granska-sm-final` ("kapitelPunkt SAKNAS trots ✓") → återställd. 6/6 gröna efter återställning, browser-verifierat (`granska-sm-final`: KapitelPunkt + STATISTIK korrekt närvarande, TABELL/FORM/DINA VAL/SEDAN SIST/ANDRA MATCHER korrekt frånvarande, ingen layoutregression från wrapper-diven).

**6.4, post 21 — KLAR, 2026-08-22 (`f71b5edb`/`17b1a6a3`).** Alla fyra robusthetsfynd (långa namn, svensk pos, skada, tomt pris-kort) verifierade eller täckta — se separat not nedan. Historik, tre skilda deldelar, en byggd (ursprungligt läge): Post 21 (`Datakortens robusthet + DecisionCard-kontextmatris + takregel-scenmatrisen`) buntar tre av åtgärdslistans ursprungsfynd (post 3, post 5, post 11 + del av post 7). Läget per deldel:

- **Post 3 (två takkandidater → en vinnande CTA)** — redan täckt. `en-primary-gate` (post 18, samma dag) är EXAKT samma mekanism riktad bredare — den fångar `.btn-primary`-konkurrens generiskt, inte bara Portal-taket. Inget nytt byggt, inget nytt behövs.
- **Post 7 (DecisionCard-dubbelpadding, "sex lägen") — `KLAR`, byggd 2026-08-19.** `tests/visual/decisionCardPaddingGate.ts` + `.visual.ts`, wired som `decisioncard-padding-gate`-job. `DecisionCard.tsx`s rot (shape≠'none') fick `data-decision-card="true"`. Metod: för varje märkt kort, om FÖRÄLDERN har padding på alla fyra sidor OCH kortet är förälderns enda betydande barn → dubbelpaddings-misstanke, matchar exakt Å7:s ursprungliga diagnos (en padded card-sharp inuti en padded card-sharp). `shape="none"` (GranskaSpelare) ingår inte — den FÖRUTSÄTTER en padded förälder, det är hela poängen. Grep-bekräftat: sex faktiska anropsställen (fyra i GranskaOversikt, ett i GranskaSpelare, ett i EventOverlay) — alla sex redan fria från dubbelpadding vid byggtillfället, grinden är regressionsvakt, inte en fix av ett aktuellt fel. Verifierat: EventOverlay.tsx:s kort tillfälligt omslutet i en padded div → gaten föll korrekt ("sitter i en padded förälder — dubbelpadding") → återställd, 56/56 gröna.
- **Post 5 + 11 (datakortens robusthet: långa namn, svensk pos, skada, tomt pris-kort)** — `KLAR (f71b5edb`/`17b1a6a3)`, 2026-08-22. Kärnfynden var redan fixade punktvis (Å5: porträttstorlek `bd331755`; Å11: tomt awards-kort `9716d862`). Den BREDARE robusthetsgarantin: extremt långa efternamn OCH skadetillstånd hade redan färdiga fixturer i `DevScenesScreen.tsx` (`lineup-filled`/`withLongestSurnames`, `trupp-blandat`+`trupp-kris`/`withInjuries`) — bara oregistrerade i `sceneRegistry.ts`, nu registrerade (avslöjade dessutom ett verkligt en-primär-brott, fixat samma commit). Svenska positionsförkortningar granskade kod-mässigt: `positionShort()` är enda källan, ingen konkurrerande textrendering hittad. Tomma pris-kort granskade: `Player.marketValue` obligatoriskt numeriskt fält, `formatMarketValue`/`formatValue` hanterar 0 kr korrekt överallt kontrollerat — inget separat "tomt pris-kort"-fall utöver Å11:s redan fixade awards-kort. **Å11:s egen kända residual ("Truppen"-kapitlets `ChapterDivider` ovillkorlig) `KLAR (36351a95)`**, 2026-08-20 — `shouldShowTruppenChapter()` extraherad, gatar rubriken på om något av korten under den faktiskt renderar. **RÄTTELSE, 2026-08-21:** ursprunglig not påstod att ingen dev-scene renderar det faktiska `SeasonSummaryScreen`-komponentet — FEL, ett forskningsmisstag. Jag testade bara `season-a`/`b`/`c` (handmockade score-block-previews) och drog slutsatsen utan att söka vidare. `season-header`/`season-noplayoffs`/`season-fired` renderar redan det RIKTIGA komponentet (`DevScenesScreen.tsx:1195`, `<SeasonSummaryScreen />`) och är redan registrerade i `sceneRegistry.ts` (rad 52) — sveps redan av CI. Nu faktiskt browser-verifierat mot `season-header` (Truppen visas, cupkort finns) och `season-noplayoffs` (Truppen döljs, varken award eller cup) — exakt den logik `shouldShowTruppenChapter()` ska ge. Fixen är alltså fullt verifierad, inte lågriskgissning.

---

# ÅTGÄRDSLISTAN (GPT live @`b805a829` + Design)

Graderad mot en revision **fem commits bakom** HEAD vid leverans — den känner inte till `a205c876` och framåt. Det förklarar Å9 och Å16 och kan förklara fler.

| ID | Post | Status |
|---|---|---|
| Å1 | Kontrast ~1,06:1 i `EventPrimary` — nästan vit text på ljust `card-sharp`. Krisen ska vara portalens mest läsbara budskap och är i praktiken osynlig | `KLAR (52a1fc30)` |
| Å2 | Taktiksegment ~22 px mot husets 44 px-regel; FÖRESLÅS-badgen skär knappens box med 6,75 px. **`padding: '6px 3px'` står kvar i `TacticBoardCard.tsx`** — `c5fa24f7` fixade `TacticChangeModal`, inte denna. ≥36 px synlig / 44 px träffyta, badgen i layouten och inte negativt positionerad | `KLAR (ba18ea80)` — `minHeight:44` + flex/center på segmentknapparna (husets 44px-konvention), badge flyttad top:-6→-12, rad-mellanrum 6→14px så badgen clearar både sin egen knapp OCH föregående rads. Browser-verifierat via DOM-mätning (Playwright mot /dev/scenes): 22/22 knappar 44px, badgeBottom===buttonTop exakt (0 överlapp) på alla fyra FÖRESLÅS-badgar |
| Å17 | Separat delfix från Å2 (upptäckt vid O15-leveransen, 2026-08-19): ★-markören var fortfarande en absolut-positionerad pill (`top:-12`, egen `overflow:hidden`-container) ovanpå/utanför knappen — Å2 rensade bara klippet, flyttade inte markören in i layouten. Jacobs order: "flytta IN i knappens egen layout istället" | `KLAR (e248835f)` — hela den absolut-positionerade FÖRESLÅS-pillen borttagen. ★ sitter nu som text i knappens egen `<button>`-innehåll (`"Offensiv ★"`), en delad `renderRow()` används av både standardlägets Spelplan-preview och avancerat lägets alla åtta rader. Browser-verifierat (Playwright mot `/dev/scenes?scene=taktik`, `capture-mode`): 0 negativt positionerade absoluta element i DOM:en, ★ synlig i knapptext i båda lägena, 9/9 knappar 44px i standard, 24/24 i avancerat. Uppföljningsfix `04d5c0b3` (🏒-prefix i väg-in-raden, pixel-jämförelse mot mocken) |
| Å3 | Portal: två konkurrerande primär-CTA — verifierat att både `SMFinalPrimary.tsx` och `PortalScreen.tsx` har egna `.btn-primary`. **Taket ska bestämma en enda primärhandling**: huvudkortet blir sekundärt, eller fasta knappen ärver kortets label och mål | `KLAR (4b375560)` — huvudkortets knapp → `.btn-outline`, matchar `SpectatorPrimary.tsx`:s redan etablerade mönster (fasta CTA:n är den enda `.btn-primary` överallt annars i Portal). Browser-verifierat: DOM-mätning visar exakt 1 `.btn-primary` på skärmen |
| Å4 | Marknad: tre "Acceptera"-primärer — verifierat att `primaryChoiceId="accept"` är ovillkorligt per kort. Plus "Marknaden är tom" under tre aktiva bud | `KLAR (c435b6b4)` — `isPrimary`-prop på `IncomingBidCard`, satt bara på det mest brådskande budet (`sortBidsByUrgency`, testad separat). "Marknaden är tom"-gaten utökad med `incomingBids.length===0`. Browser-verifierat: 3 kort, 1 `.btn-primary`, tom-texten 0 träffar med bud aktiva |
| Å5 | Trupp/Nu: skadeporträttet — bekräftat vid 390px, `SquadScreen.tsx:568` (krisraden), ingen storleks-wrapper alls. Fixat, matchar mönstret på `:249` | `KLAR (bd331755)` |
| Å6 | = 5.2 | `KLAR (fc6f5015)` |
| Å7 | Dubbel padding: skarpa `DecisionCard`-skalet lade `10px 12px` inuti `card-sharp` | `KLAR (97d26cfd)` |
| Å8 | Taktiktavlans viktning → D1. Vokabulärdelen = 4.10 | `KLAR (50178bb3)` för vokabulären; viktningen hos Design |
| Å9 | Granska-dubbletten | `UTGÅTT` — `RoundSummaryScreen` raderad i `7d97d3e2` |
| Å10 | Matchdockan ratificeras **med skärpning**: modaler som besvaras under pågående spel dockas, allt annat centreras. `SubstitutionModal` flyttas **inte** — ett byte görs i en pausad situation, en taktikändring medan spelet rullar. Skriv in regeln i designsystemet. Kugghjul → Lucide | `KLAR (c9ca21fe)` — `SubstitutionModal` → `.match-modal-overlay`/`.match-modal-panel` (samma mönster som `HalftimeModal`), `.match-modal-dock` borttagen. Regeln inskriven i `design-system/README.md` (Transparency & blur). `MatchControls.tsx`:s ⚙️ → `<Icon icon={Settings}/>`, matchar syskonknappens redan-Lucide-mönster. Browser-verifierat: `.match-modal-overlay` närvarande, `.match-modal-dock` frånvarande |
| Å11 | Årsbokens tomma "Säsongens bästa"-kort — gata kapitlet på faktisk data (DS-regel 12) | `KLAR (9716d862)` — hela kortet (rubrik + grid) villkorat på om något av de fem award-fälten finns, inte bara posterna var för sig. Browser-verifierat mot dagens dev-fixture (alla fem null där redan) — kortet försvann, dök upp igen med en temporär topScorer-övermanning (reverterad). **Flaggat, inte fixat:** "Truppen"-kapitlets `ChapterDivider` (rad 525) är fortfarande ovillkorlig — samma DS-regel-12-klass en nivå upp om både detta kort OCH cupkortet saknas samtidigt (sällsynt, utanför postens namngivna scope) |
| Å12–15 | Skuld: nav-dokdrift (6 flikar dokumenterat, 7 i bruk), emoji-svepets rester, egna skuggor mot skuggkanon, bundle | Å12 `KLAR (2f403ff0)`. Å14 `KLAR (10e53a89)` — skuggkanon dömd (Design, arkiverad `docs/incoming/_arkiv-2026-08/Batch-av-tre-och-skuggkanon-D1p4-A14-2026-08-20.dc.html`), tre nivåer × två lägen byggda i `global.css` (mirror regenererad, inte handredigerad), ~25 ställen mappade, ~12 färgade glow-effekter flaggade som egen kategori (emfas, inte elevation) och lämnade orörda per domen. Å13 `KLAR (f9fcef62)` — grep-verifierat mot emojiConsistency.ts:s kända regel (⚽/🟨/🟥), 2 live-träffar (SquadScreen.tsx, GranskaAnalys.tsx) fixade till redan etablerad 🚫, resten (DevScenesScreen.tsx) dev-only/exempt. Å15 (bundle, >500kB-varning, kräver code-splitting) fortfarande `EJ` |
| Å16 | `test:visual` startar inte | `UTGÅTT` — fixat i `a205c876` före GPT:s snapshot. **197/215 empiriskt verifierat, noll ERR_CONNECTION_REFUSED.** De 18 som inte passerar ska redovisas i 1.4 |

**Grindarnas status:** post 19 (träffyta/överlapp) är `KLAR` — `tapTargetGate.visual.ts` kör i CI. Post 17 (kontrast), 18 (en primär), 20 (matchtypsmatris) och 21 (datakort/DecisionCard/takregel) är `EJ`.

---

# ETAPP 7 — utredningar, inget bygge

Svaren avgör vad som byggs efter GPT:s nya tiosäsongstest. Var och en har en fråga vars svar ändrar storleken på arbetet.

### U1 · Svårighetsgradsmodellen — det största fyndet i hela serien
`offerSelectionService:9-17` sätter difficulty **enbart** från renommé. Skutskär har 52 och blir hard — men styrelsekravet är `AvoidBottom`, tålamod sjunker bara i botten tre (`seasonEndProcessor:680-698`), och två missade delmål kostar −10 tillsammans (`:895-902`).

GPT tankade medvetet en hel säsong: felvänd taktik, svagaste elva, 15 vägrade presskonferenser, avvisade sponsorer, negativa val. Resultat: femte plats. Styrelsen blev **mer nöjd**. Reservelvan vann 10–4 borta.

**Två frågor:** vad krävs för att härleda difficulty ur truppstyrka, ekonomi, faciliteter, styrelsens förväntan och simulerad placeringsdistribution? Och separat: vad krävs för att en klubb i nedflyttningsstrid faktiskt tappar `boardPatience`?

**Villkor jag redan sätter:** svårighetsgraden ska beskriva klubbens *situation*, inte ge dolda AI-bonusar. Eventuell assistans är en separat spelarinställning.

**Rapport levererad.** Bekräftat i kod: `boardService.ts:74-79` (AvoidBottom "delighted" ner till plats totalTeams−4, "unhappy" bara vid absolut sistaplats) och `seasonEndProcessor.ts:693-711` (patience straffar bara botten tre, plats 4-9 ger ingen förändring alls) förklarar tillsammans varför Skutskär inte kunde misslyckas — bufferten är löst i två separata filer, inte en.

**Vad som redan finns att bygga på, utan ny datamodell:** `ClubTemplate` (`worldGenerator.ts:108-128`) har redan `finances`, `wageBudget`, `youthQuality`, `facilities`, `boardExpectation` per klubb. CA-aggregat går att räkna fram direkt efter spelargenerering (`generateAttributes`, CA ≈ reputation×0.7±10). `scripts/stress-test.ts` genererar redan hela ligans placeringar per seed — räcker att extrahera dem för kalibrering, ingen ny simuleringsmotor.

**Rekommenderad modell:** tre faktorer, ingen ny simulering i runtime — reputation (bas, som idag) + `boardExpectation`-gap (ett `ChallengeTop`-krav på reputation 62 är objektivt svårare än `AvoidBottom` på samma reputation) + finansiell marginal (`finances/wageBudget`-kvot). Stress-data används bara för att KALIBRERA trösklarna en gång, inte som runtime-input. Ingen dold bonus/straff — difficulty blir en ren etikett på fakta som redan finns.

**Rekommenderad boardPatience-fix:** gör AvoidBottom-tröskeln proportionell mot faktisk nedflyttningszon (idag löpare än den sportsliga verkligheten), och lägg till en svag negativ lutning för plats 8-10 (inte bara en klippa vid botten-tre) så press känns innan klubben faktiskt är nere.

**Uppskattad omfattning:** 3-4 filer (`offerSelectionService.ts`, `boardService.ts`, `seasonEndProcessor.ts`, ev. en liten ny `difficultyService.ts`), plus en engångs-analyskörning mot stress-datan för trösklarna. Ingen ny entity.

**Öppna frågor för Jacobs beslut:** ska difficulty vara en engångsetikett (som idag) eller omvärderas löpande om ekonomin rasar mitt i säsong? Är nedflyttningszonen (botten 1 eller 2?) formellt definierad någonstans — hittades inte, måste bekräftas innan trösklarna görs proportionella. Ska stress-kalibreringen vara ett engångsjobb eller ett återkommande valideringssteg vid world-gen-ändringar (som `calibrate.ts`)?
**Status:** `KLAR (4be59ff9)` — Jacobs dom på de tre öppna frågorna: engångsetikett (som idag, ingen löpande omvärdering), nedflyttningszon som konstant (`RELEGATION_ZONE_SIZE=2`), kalibrering som engångsjobb. `computeDifficultyScore()` (offerSelectionService.ts) + `computeBoardPatienceUpdate()`/`evaluateBoard` (boardService.ts) — D029 dokumenterar formeln och kalibreringstabellen mot alla tolv `CLUB_TEMPLATES`. `O5` fortfarande pausad — U1 höll, men O5 väntar dessutom på Grind 1 självt

### U2 · Kanonisk matchkontext
Symptom: straffsegrar rapporteras som "Oavgjort, vi tar en poäng". Cupfinal ger "Två viktiga poäng". Hemmakryss ger "En poäng på bortaplan". Clean-sheet-press efter 9–8. Icke-derbyfinal erbjuder derbyreplik.

Fem symptom, fem egna felaktiga härledningar ur `homeScore`/`awayScore`. Fixas de en och en får vi fem lappar och ett sjätte symptom nästa svep.

**Frågor:** hur många ställen i `pressConferenceService` klassificerar matchutfall eller tävlingstyp självständigt? Vad **saknas** i `matchTypeAxes` (finns sedan Granska del 4: `tävlingstyp | skede | plats`) för presskonferensens behov — faktisk vinnare efter förlängning/straffar, om ligapoäng finns, derby? Vad är minsta ändringen som gör alla fem symptomen omöjliga snarare än lagade?

**Villkor:** **en** kontextmodell, byggd på `matchTypeAxes`. Ett parallellt `MatchOutcomeContext` är två sanningar om samma match — exakt felklassen vi jagat i tio dygn.

**Rapport levererad.** Fyra oberoende klassificeringsställen bekräftade, alla i `pressConferenceService.ts` + `csPressEventService.ts`: (1) `buildPressContext()` (:301-394) härleder won/lost/draw + isDerby + isCup/isPlayoff helt vid sidan av `matchTypeAxes`. (2) `contextKey`-blocket (:583-595) räknar myScore/theirScore och rivalry EN GÅNG TILL — tredje beräkningen av samma sak i samma fil, och läser aldrig `isCup`/`isPlayoff`. (3) `csPressEventService.computeCSStreak()`/`shouldTriggerCSPress()` — fjärde parallella score-tolkningen. (4) `TAG_DEFS`: `win_derby`/`loss_derby` klassade `generic: 'win'/'loss'` (:423, 431) — samma buggklass som redan patchades för `playoff_loss_not_final` men missad för derby-taggarna. Det är rotorsaken till symptom 5.

**Vad som saknas i `matchTypeAxes`:** "faktisk vinnare efter förlängning/straffar" (läser aldrig `wentToPenalties`/`penaltyResult`/`overtimeResult` — rotorsak symptom 1), "gav ligapoäng" (går att härleda 1:1 ur redan befintlig `tavlingstyp==='liga'`, men ingen kod läser den — rotorsak symptom 2), "är detta en derby" (finns inte i någon axel — rotorsak symptom 5 tillsammans med punkt 4 ovan). Symptom 3 (hemmakryss) är INTE en modellucka — `plats` täcker redan hemma/borta, buggen är att frågan saknar en `requireAway`-spärr (bara `requireHome` finns). Symptom 4 (9-8 clean sheet) gick inte att reproducera bokstavligt — spärren är korrekt — men är ändå ställe (3) ovan: en fjärde oberoende råscore-tolkning som inte delar sanning med resten.

**Minsta ändringen:** tre nya fält på `MatchTypeAxes`, beräknade EN gång i `deriveMatchTypeAxes()`: `utfall` (vunnet/förlorat/oavgjort, läser straff/förlängning), `gavLigapoang` (= tavlingstyp==='liga'), `arDerby` (= `!!getRivalry(...)`). Lägg till `requireAway?` på `PressQuestion`, fixa `win_derby`/`loss_derby` till `generic: 'none'`. Radera `buildPressContext`s och `contextKey`-blockets egna beräkningar (ställe 1+2), wire:a båda mot en enda `deriveMatchTypeAxes()`-instans.

**Uppskattad omfattning:** `matchTypeAxes.ts` (+≈20 rader), refaktor av `pressConferenceService.ts` (ta bort dubbelberäkningarna, wire:a om), enrads-fix i TAG_DEFS, enrads-fix i `csPressEventService.ts`. Ingen ny parallell modell.
**Status:** `KLAR (4a2b6b98)` — tre fält på `MatchTypeAxes` (`utfall`/`gavLigapoang`/`arDerby`), `requireAway`+`requireLeaguePoints` på `PressQuestion`, `win_derby`/`loss_derby` → `generic:'none'`. `ctx` byggs nu FÖRST i `generatePressConference`, `contextKey` återanvänder `ctx.won/lost/draw/isDerby` istället för en tredje egen beräkning. **Avvikelse, medveten:** `csPressEventService.ts`s egen `!isCup`-check lämnad ORÖRD — den är funktionellt redan korrekt för sitt smalare syfte (ligaspecifik clean-sheet-streak, inte samma dimension som `gavLigapoang` som även exkluderar playoff/avsked) och ingen rapporterad symptom pekade dit. Byt bara om ett konkret fynd kräver det. `lateEqualizer`-checken körs medvetet mot rå score (`rawDraw`), inte det nya straff-medvetna utfallet — en sen kvittering som sen gick till straffar är fortfarande en sen kvittering narrativt. 1936/1936 gröna, regressionstest verifierat mot pre-fix kod

### U3 · Effektschemat
`eventProcessor:240-242` skriver effekten i `amount`, `eventResolver:823-828` läser `effect.value`. Mecenatkortet lovar 1 000 000 kr och drar 0.

**Frågan som avgör storleken:** hur många eventeffekter har samma missmatch? Är svaret tvåsiffrigt är det ett schema som ska typas och valideras vid build, inte en rad som ska rättas — och då måste varje befintlig effekt klassificeras.
**Status:** `KLAR (e860ad7d)` — mecenat-reaktiveringen är en egen post, K5.

### U5 · Narrativt minne
"Finalen. Birger…" ordagrant år 5, 7, 8, 9 och 10, plus efter en semifinalförlust. Helena/Folke-profilen återkom flera säsonger. Samma Tord-modal stoppade två semifinalomgångar i rad.

Rot: event-ID:n är unika per säsong, inte per karaktärsbåge, och cooldown finns lokalt per källa men inte delat mellan scener, portalbeats och eventkö.

**Frågor:** hur många oberoende cooldown-/dedupmekanismer finns? Hur många distinkta narrativa event-typer finns totalt, och hur många behöver `semanticKey`? Kan nyckeln härledas maskinellt ur befintliga ID:n, eller kräver varje event ett manuellt beslut om vilken båge det tillhör?

**Är svaret trehundra typer** börjar vi med pivotal beats och lämnar ambient orörda.

**RAPPORT LEVERERAD 2026-08-17.** Åtta oberoende cooldown-/dedupmekanismer, var och en med egen lagringsplats på `SaveGame`: `resolvedEventIds`, `resolvedWeeklyDecisions`+`weeklyDecisionLastRound`, `shownBeats`+`getBeatKey`, `shownScenes`, `activeArcs`, `sourceCooldowns`, `cardStaleTracking`, `klackEcho`+`lastCoffeeSceneIndices`. Plus `captainRallyGuard.ts` — en handskriven vakt som slår upp i **två** av dem, byggd för att två system oberoende kunde trigga samma kaptensmöte. Den filen är i sig beviset på att bristen redan orsakat en riktig bugg.

~90–100 distinkta narrativa händelseformer (47 `GameEventType` + ~15 `StorylineType` + 8 `ArcType` + 25–30 beat-id:n). 15–20 pivotal, 70–80 ambient.

`semanticKey` är **maskinellt härledbar i ungefär hälften** av fallen (strippa `_${season}` — `playoff_final_${season}`, Birger-talet, följer mönstret exakt). Resten kräver ett domänbeslut: `arc_vetfinal_${vet.id}_s${season}` — är "samma båge" per spelare eller per arketyp? `event_bid_aiaccept_${bid.id}` saknar säsong helt.

---

## DOM 2026-08-17 — EN mekanism, ny liten logg

Hypotesen höll, med en rättelse: den kan **inte** byggas på `resolvedEventIds`. Den listan är platta ID-strängar utan tidsstämpel per post. `storylines` har däremot redan rätt form (`{id, type, season, matchday, resolved}`) och rensas aldrig vid säsongsskifte — den är mönstret att bygga vidare på.

**Bygg `SaveGame.narrativeLog?: NarrativeLogEntry[]`** med `{ semanticKey, season, round, systemhandelse? }` och tre funktioner: `logNarrativeBeat`, `isOnCooldown` (per-nyckel), `systemhandelseBudgetOk` (aggregat). Samma skrivväg, två läsvsägar — `O19`:s säsongsbudget och `U5`:s narrativa cooldown är samma mekanism.

**Villkoret som avgör om detta blir en förbättring eller en nionde mekanism:** de åtta befintliga får ligga kvar parallellt **under migreringen**, men varje källa som skriver till en av dem ska skriva till loggen i samma operation. När alla nio skrivvägar gör det raderas de gamla läsvsägarna. **Rapportera när skrivningen är komplett** — en logg som bara hälften av källorna skriver till är sämre än åtta ärliga mekanismer, för då tror läsaren att den vet.

**Ordning:** loggen + skrivväg först (alla nio källor), sedan `isOnCooldown` mot pivotal beats, sedan `systemhandelseBudgetOk`. De manuella `semanticKey`-besluten (arc-bågarna) tas när loggen finns — inte som förarbete.

**Status:** `KLAR (2cb602fb, 20025175, ddc56be7)` — infrastrukturen (`SaveGame.narrativeLog`, `logNarrativeBeat`/`isOnCooldown`/`systemhandelseBudgetOk`) klar och testad. **8/9 skrivvägar wiring:ade, slutgiltigt tal:** resolvedEventIds (eventResolver.ts, semanticKey=event.type), resolvedWeeklyDecisions (semanticKey=decision.id), shownBeats, shownScenes, activeArcs/storylines (en post per NY storyline — själva felklassen "Finalen. Birger…"), sourceCooldowns (egen semanticKey `source_X`), klackEcho (bara vid faktiskt ny eko), lastCoffeeSceneIndices. **9:e källan (cardStaleTracking) medvetet, permanent utesluten — Jacobs dom 2026-08-17:** villkoret "en logg som bara hälften skriver till är sämre än åtta ärliga mekanismer" gäller ofullständighet av FÖRSUMMELSE, inte en källa som inte hör hemma. cardStaleTracking mäter hur länge ett portalkort legat framme; narrativeLog svarar på när en båge senast hände — olika frågor, ett omrenderat kort är inte en beat. Dokumenterat på båda ställena i kod (narrativeLogService.ts:s huvudkommentar + gameStore.ts:s `recordPortalShown`) så 8/9 inte läses som en lucka. Åtta befintliga mekanismer ligger kvar orörda, per DOM:ens villkor. **Inte byggt än, näst i DOM:ens egen ordning (separat, ej del av denna post):** `isOnCooldown` mot pivotal beats, `systemhandelseBudgetOk`:s faktiska gating. 1970/1970 gröna, stress-test 50/50 säsonger utan krasch eller invariant-brott

### U6 · Renommé nedåt
Skutskär tankade en säsong och renommét **steg** 52 → 56. Koden kan sänka via skandal och nekad licens, men ingen placerings- eller trendnedgång finns i `seasonEndProcessor`.
Rapportera vad ett säsongsvis renommédelta ur placering mot förväntan skulle kräva, och vad det påverkar: spelarvilja att stanna, sponsorintresse, publik, jobberbjudanden, styrelsekrav.
**Status:** `RAPPORT-LEVERERAD` — Code flaggade tidigare att detta möjligen var samma sak som "ryktesskedjan" som utreddes tidigare. **Det är det inte.** Ryktesskedjan handlade om att ligan inte reagerar på dominans (avskriven — tio säsonger visade sportslig variation). U6 handlar om att renommé inte kan **falla** vid misslyckande. Motsatt riktning, annan fråga.

**Var reputation redan läses (nedströms-effekter, full lista):** ekonomi (`economyService.ts` — weeklyBase, arenakapacitet, biljettpris, publikfaktor — publik och löpande intäkter är alltså direkt reputation-styrda redan idag), cupseedning, transfer-svårighet (`offerSelectionService.ts`, delad med U1), spelarvärvning/dayJob (`worldGenerator.ts`), politiker-bonus (`politicianService.ts`, >65), patron-bidrag (`patronEvents.ts`, viktar reputation×300), klack-status "storstad" (≥70), milstolpar (landslagstränare/scoutbesök vid >65/70). **Ingen träff** på sponsorintresse direkt kopplat till reputation utanför kommunbidrag/patron, och ingen explicit manager-jobberbjudande-mekanism kopplad till reputation.

**Hur renommé sänks idag (mönster att återanvända):** `scandalService.ts` — `fundraiser_vanished` (−8) och `coach_meltdown` (−5), båda återställs fullt när skandalen löper ut. Nekad licens: −15, permanent, engångs. Alltid `Math.max(0,...)`/`Math.min(100,...)`-clamp.

**Den saknade länken finns redan byggd, bara inte kopplad:** `Club.boardExpectation` + `computeSeasonVerdictRating(expectation, finalPosition, totalTeams)` (`boardService.ts:175`) returnerar redan 1-5 för hur väl placeringen matchar förväntan — men ratingen driver idag bara text och `boardObjectives`-patience, aldrig reputation.

**Formel-skiss** (i `seasonEndProcessor.ts` där `computeSeasonVerdictRating` redan beräknas): `repDelta = { 1: -6, 2: -3, 3: 0, 4: +2, 5: +4 }[rating]`, clampat 0-100. Proportion mot befintligt: under skandalnivå (−5/−8, tillfälligt) eftersom ett säsongsmisslyckande återkommer varje säsong medan skandal är enstaka.

**Omfattning:** 3-5 rader i `seasonEndProcessor.ts`, ingen ny service — återanvänder `boardExpectation`/`computeSeasonVerdictRating` fullt ut. Kirurgiskt, men **kräver en D-fact-post** för magnituden (CLAUDE.md:s D-FACT-regel vid nya spelmagnituder) innan commit.
**Status:** `KLAR (1bfd2352)` — `seasonReputationDelta()` i `boardService.ts`, tillämpad i `seasonEndProcessor.ts`. D028 skriven. 1939/1939 gröna, regressionstest verifierat mot pre-fix kod

### U7 · Save-portabilitet — den enda posten där ett fel raderar spelarens arbete
Export/import finns i `saveGameStorage:5-56` men är **inte nåbar från UI**. En tioårig karriär lever i en lokal IndexedDB utan backup, utan enhetsbyte, utan migrationstest mellan releaser.
Rapportera vad ett begripligt backupflöde kostar, plus en automatisk lokal återställningspunkt före migrationskritiska steg. Cloud save och konto ligger långt senare och ska inte bli startfriktion.

**Rapport levererad.** Export/import är redan komplett i `saveGameStorage.ts` (`exportSaveAsJson` :5-15, blob-download, ingen File System Access API behövs; `importSaveFromJson` :32-57, validerar struktur + kör `migrateSaveGame`) — bekräftat att INGEN `.tsx`-fil importerar någotdera, bara testfilen.

**UI-koppling, minsta ändringen:** `GameHeader.tsx:233-257` har redan en färdig inställnings-dropdown med "💾 Spara spel"/"📂 Ladda spel". Två nya rader i samma array (Exportera/Importera säkerhetskopia) — 1 fil, ~10-15 rader, ingen ny skärm.

**Automatisk återställningspunkt:** två triggerpunkter i `gameStore.ts` — före `newGame()`s ovillkorade radering (:165-174, en rad `snapshotBeforeDelete` innan `deleteSaveGame`-loopen) och vid schemaversionsskillnad i `loadSaveGame`/`migrateSaveGame` innan migreringen appliceras. Ny funktion `snapshotSave()` i `saveGameStorage.ts`, samma `idb-keyval`-mönster som redan används, rotation på max 2-3 snapshots (given att lagringskvoten redan varit ett verkligt problem, se `gameStore.ts:169`s kommentar).

**Uppskattad omfattning:** `GameHeader.tsx` (+10-15 rader), ny funktion i `saveGameStorage.ts` (+20-30 rader) + 2 anropsplatser. Ingen ny fil, ingen ny route, inga nya beroenden.

**Öppna frågor för Jacobs beslut:** ska import skriva över nuvarande save direkt eller varna först (destruktivt)? Ska en misslyckad migrering automatiskt erbjuda återställning (kräver liten UI-yta) eller bara logga tyst? Rotationsantal (1 vs 2-3)?
**Status:** `KLAR (baf10f4c)` — Jacobs dom: import varnar (window.confirm) före, två snapshots. Export/import wirat i `GameHeader.tsx`s befintliga inställnings-dropdown. `snapshotSave()`/`listSaveSnapshots()`/`loadSaveSnapshot()` (saveGameStorage.ts) tar snapshot före `newGame()`s delete-all och före `loadSaveGame()`s migreringssteg. **Ärligt ogjort:** ingen automatisk "återställning erbjuds"-banner vid en faktiskt misslyckad migrering — snapshoten finns och är läsbar, men ingen UI upptäcker/föreslår den proaktivt. Den verkliga risksurfacen (zustand persist-rehydrering vid appstart) är en annan mekanism än den manuella save-storage-vägen som byggdes. 1953/1953 gröna, regressionstest verifierat mot pre-fix kod

### U8 · Bundle och precache
2,1 MB huvudbundle, 4,17 MB PWA-precache för en mobile-first app. Rapportera vad code splitting skär och vad det kostar. **Efter sanningslagret.**
**Status:** `EJ`

### U9 · Produkttelemetri
Ingen mätning finns. Behövs: onboarding → första match, första säsong → årsbok, årsbok → säsong 2, säsong 3/5/10, val-entropi, avskedsfrekvens per klubbprofil, exakt textupprepning, save recovery, och delningsfunneln.
**Val-entropi är det mest värdefulla måttet i listan:** väljer 90 % samma alternativ är det sannolikt ingen riktig fråga. Det mäter O2 automatiskt.
Rapportera vad som kan mätas utan konto och utan personuppgifter. **Efter sanningslagret.**
**Status:** `EJ`

---

# HOS DESIGN

| ID | Post | Status |
|---|---|---|
| D1 | Eventköns viktning: ambient / normal / pivotal, plus konsekvensnivå på val (neutral, positiv, kostsam, irreversibel). Inkl. Å7:s inline-rytm och Å8:s taktikviktning. Svåraste frågan: hur pivotal får väga mer **utan** att bli en fjärde ceremoni | `DELVIS KLAR` — se `docs/DOM_D1_EVENTVIKTNING_2026-08-19.md`. Punkt 1 (Å7, dubbelpadding) redan `KLAR (97d26cfd)` innan detta pass, orört. Punkt 2 (Ambient-regeln) `KLAR (4e347971)` — `isAmbientEvent`/`getEventRenderTarget` i `eventQueueService.ts`, ny `AmbientEventRow.tsx`, wirad i `PortalEventSlot.tsx`/`GameShell.tsx`/`EventPrimary.tsx`; fann och fixade under vägen en verklig softlock (kritiskt event utan val gav en fullskärmsmodal utan knappar) samt en krasch i `gameFlowActions.ts`s `simulateRemainingStep`. Punkt 3 (konsekvensmarkören) `KLAR (9ae907bc)` — `EventChoice.consequenceLevel`/`costLabel`/`irreversible` + `getConsequenceLines()` i `GameEvent.ts`, rendering i `DecisionChoices.tsx`; grep-verifierat 0 träffar på `--danger`/⚠ i den nya koden. Renderingsstöd byggt men opt-in — inga befintliga events sätter de nya fälten än. Punkt 4, "därför nu"-raden — **HELT KLAR, 2026-08-21/22.** Jacobs dom: klassificera INTE de sexton i förväg — `getWhyNowLine()` läser `contentContract.ts` (per `event.type`), inte event-instansen (`c8bc3d3d`), och `getEffectivePriority()` är AKTIVERAD i routing/sortering (`getEventRenderTarget`/`getNextEvent`/`getQueueStats`). De fyra typer som faktiskt routas kritiskt (mecenatEvent/economicStress/playerUnhappy/criticalEconomy) fick sina contentContract-rader spårade (`b6aa7f84`) — whyNow-fälten lämnades medvetet TOMMA (ingen groundbar brådskerad hittad utan att gissa), så alla fyra nedgraderas fortfarande till `normal` idag, men SANT och SJÄLVFÖRNYANDE: aktiveras rad för rad när Opus skriver whyNow-text för den som faktiskt behöver den (economicStress ifrågasatt om den ens förtjänar pivotal). Punkt 4, batch-av-tre — **BYGGT (`778cfb17`)**. Design dömde variant 1b (skymtad stapel) 2026-08-21, Jacob overridade platsen (under Primary, inte istället för) — `BatchStack.tsx` + `GameEvent.triggerGroupId` + `getBatchSiblings()`. Ingen generator sätter triggerGroupId ännu (event-genereringen är medvetet kapad till ~2/omgång) — mekanismen byggd och redo, dormant i verkligt spel tills en samma-orsak-skur medvetet taggas. 34 nya tester totalt över hela D1-arbetet, stash-verifierade. |
| D4 | **Taktikens två lägen** (`O15`). Fyra frågor: hur "två ändringar föreslås" ser ut som ett sammanhållet förslag; hur "vad skiljer mot förra matchen" visas; hur avancerat läge nås utan två skärmar; träffytorna (Å2). Läses ihop med D1 | `KLAR (e248835f)` — svar levererat som `docs/incoming/Taktikens-tva-lagen-O15-2026-08-18.dc.html` (vikt 1b), DOM godkänd samma dag och byggd (`e248835f`, uppföljningsfix `04d5c0b3`), se O15 |
| D2 | Crescendot (post 6/7/10) | `LEVERERAD` → 5.2, 5.3, Å10 |
| D3 | Sommaren | `LEVERERAD` → 5.1 |

---

# HOS OPUS

De fyra första är svar på framgångsauditens huvudtes och väger tyngre än något i etapp 4.

### O1 · Varslet som systemmall — den egentliga svarsdomen
Tre oberoende testare pekade ut samma sak: varslet var det bästa i spelet. Det förenade en plats (Älvkarleby kommun), namngivna personer (Torsten Henriksson, Erik Sundqvist), en konkret resurs (1,5× lön), en sportslig följd och ett långsiktigt minne. Det gick att återberätta efteråt.

**Det finns exakt ett sådant.** Ingen post i den här filen gör spelet mer likt det — de gör det mindre trasigt.

**Status:** `SKRIVEN` — `DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md`. Fem kvalifikationskrav, sex kandidater i prioritetsordning (sponsorn först — vanligast och tommast), riktmärke två–tre per säsong.

**Byggs efter Grind 1.** Beroenden: `O5` (ett tal måste betyda något — 1,5× lön kostar ingenting vid 11 mkr) och `U1` (systemen kan inte peka isär om ingenting kan misslyckas). Throw-guarden var det tredje beroendet och är klart.

**Görs nu, kräver ingen ny mekanik — Code-rapport:** klassificera alla befintliga händelser mot mallens fem punkter. Hur många uppfyller fem, fyra, tre? Det talet är utgångsläget.

**Code-rapport levererad:** `docs/DOM_VARSLET_KLASSIFICERING_2026-08-17.md` — 101 bedömda val, genomsökt över 14 filer (`eventFactories.ts`, `communityActivitiesEvents.ts`, `patronEvents.ts`, `mecenatService.ts`, `politicianEvents.ts`, `sponsorEvents.ts`, `supporterEvents.ts`, `economicCrisisService.ts`, `arcService.ts`, `hallProcessService.ts`, `weeklyDecisionService.ts`, `postAdvanceEvents.ts` inline, `characterPlayerService.ts`, `bandyLetterService.ts`, `schoolAssignmentService.ts`, `mecenatDinnerService.ts`).

**Utgångsläget:** 9/5 (systemhändelse), 10 st 4/5, 17 st 3/5, 27 st 2/5, 31 st 1/5, 7 st 0/5. 64 % landar på 2/5 eller lägre.

**Nio dolda 5/5-kandidater redan i kodbasen, ingen tidigare märkt som systemhändelse:** `bidReceivedEvent`, `generateMecenatInterventionEvent` (båda eventFactories.ts), `offer_tribute` (mecenatService.ts), `sell_star` (economicCrisisService.ts), `away_trip_bus`, `tifo_contribution`, `legacy_naming_arena` (alla tre weeklyDecisionService.ts), `detOmojligaValet` (postAdvanceEvents.ts) — utöver varslet självt. De är utspridda över åtta filer, triggas oberoende av varandra och delar ingen gemensam cooldown-pool, vilket betyder att flera strukturellt kan träffa samma säsong trots riktmärket 2–3/säsong.

**Tre nya "påhittad effekt"-buggar hittade under sweepet** (utanför O1:s egentliga uppdrag, tillagda i choice-label-svepets öppna lista): alla i `mecenatService.ts` (träningsdags-, transferbudget- och projektfinansierings-rader utan motsvarande kod). `hallProcessService.ts`s `kommunens_villkor`-bugg (identiskt val oavsett svar) dök upp igen i sweepet men var redan känd och dokumenterad sedan tidigare — ingen ny information.

**Godkänd när:** en spelare som spelat två säsonger kan namnge ett beslut som gjorde ont och beskriva vad det kostade, utan att öppna en meny.

### O2 · Dominansrevisionen
**Status:** `SKRIVEN` — `DOM_DOMINANS_OCH_FORHANDSDELTAN_2026-08-17.md`, ihop med O12.

Två regler: (1) ett val kräver två system och inget alternativ som är svagare på varje dimension — annars är det ambient, inte ett kort. (2) Före valet visas riktning, vem som berörs och exakta **pengar**; efter valet visas allt. Pengar är den enda resurs där exakthet inte förstör valet.

Sponsorerna först — vanligast och tommast. Motvikter som redan finns i världen: synlighet, kategoriexklusivitet, `communityStanding`, kontraktslängd, risk.

**Rapportera-först:** hur många val har ett strikt dominant alternativ? Går siffran att härleda ur `2.5`-svepets material eller krävs eget pass?

**Besvarad 2026-08-19:** nej, går inte att härleda — `2.5` mätte text-mot-effekt-fidelitet (lovar texten vad effekten gör), inte val-mot-syskonval på varje dimension inom samma beslut. Olika frågor. Täckningen var dessutom partiell (~40 av okänt totalt, bara ~18 skrivna ut, `weeklyDecisionService.ts` bara stickprovskontrollerad).

**Jacobs dom:** bygg det skriptade passet i `eventGuardInstrument.ts`-stil. **Ordning:** (1) noOp-grep över samtliga event-filer först — `{type:'noOp'}` bredvid ett rent fördel-val är dominans i renaste form, kräver ingen dimensionsjämförelse. Rapportera den siffran innan (2) den fulla pairwise-analysen (extrahera fulla effektvektorer per beslut, jämför alla par för dominans).

**Första konkreta fall när domen tillämpas:** `hesitantPlayerEvent` → `convince` (+15 moral, ingen kostnad) vs `accept` (`noOp`) — samma paradigm som sponsoroffren, litet och tydligt, visar formen. Inte byggt än.

**Beroenden:** `D1` (ambient-nivån att degradera till), `U9` (val-entropin mäter domen), `O5` (en kostnad i kronor är bara ett val om kronor är knappa).
**Godkänd när:** inget alternativ väljs av mer än 80 % i val-entropin.

**noOp-grepet — RAPPORT LEVERERAD, 2026-08-20.** 41 `type:'noOp'`-förekomster i 14 filer. Läste varje enskild siblingjämförelse (inte bara räknat träffar) — grepet ensamt duger inte, se metodfyndet nedan.

**13 bekräftade dominanta val** (noOp bredvid ett syskonval utan modellerad kostnad, samma paradigm som `hesitantPlayerEvent`):
| Fil:rad | Fördelsvalet | Dominerad noOp |
|---|---|---|
| `eventFactories.ts:52` | `convince` (+15 moral) | `accept` — domens eget referensfall |
| `eventFactories.ts:164` | `promise` (+10 moral) | `hold` |
| `eventFactories.ts:301` | kapten `support` (+5/+8 moral laget) | `decline` |
| `eventFactories.ts:536` | mecenat `invite_generic` (gratis +8 happiness) | `ignore` |
| `characterPlayerService.ts:112` | veteranhyllning (+3 samhällsstöd) | `plan` |
| `characterPlayerService.ts:173` | kaptensutnämning (+2 samhällsstöd) | `no` |
| `communityActivitiesEvents.ts:165` | loppis `support` (streamingintäkt) | `decline` |
| `communityActivitiesEvents.ts:281` | `fika` (+3 fanMood) | `skip` |
| `communityActivitiesEvents.ts:309` | mystisk `go` (engångsintäkt + fanMood) | `pass` |
| `bandyGalaService.ts:141` | gala-närvaro (+reputation/+fanMood) | `skip` |
| `sponsorEvents.ts:24` | `send_player` (+5 tkr + communityStanding) | `decline` |
| `patronEvents.ts:283` | `welcome`/`cautious` (gratis patron) | `decline` |
| `mecenatService.ts:280` | `welcome`/`cautious` (gratis mecenat-relation) | `decline` |

**1 osäkert fall:** `eventFactories.ts:577` (materialar-korv, `lock` +4000 kr) vs `free` (`noOp`) — `lock` binder klubben två år (nämnt i `body`, inte i `effect`). Kan vara dominant eller inte beroende på om bindningstiden faktiskt begränsar något senare — kräver den fulla pairwise-analysen, inte grep-nivån.

**Metodfynd, viktigare än listan: en ren `type:'noOp'`-grep ger falska svar för sju förekomster.** Mecenat-avgångstrion (`listen`/`plan_succession`/`offer_tribute`, `mecenatService.ts:617-641`) och de fyra presskonferens-svaren (`csPressEventService.ts:141-144`) är ALLA generiskt typade `noOp` — men resolvas i verkligheten via id-baserad special-casing i `eventResolver.ts` (grep bekräftar: `eventId.startsWith('event_mecenat_retire_')`, `choiceId === 'offer_tribute'` osv.), som applicerar riktiga effekter OAVSETT vad `effect.type` säger. En ren grep hade antingen missat dessa som "redan lika (alla noOp)" eller felaktigt flaggat dem som dominans-kandidater. **Steg 2 (pairwise) måste korsa varje kandidat mot `eventResolver.ts`s id-baserade grenar, inte bara läsa `effect`-fältet** — annars ärvs samma blinda fläck i den fulla analysen.

**Sidofynd, ingen dominansfråga:** `communityActivitiesEvents.ts:343-346` (`renovate`/`wait`) — `wait`s text lovar "faciliteter försämras" men dess `effect` är `{type:'noOp'}`, ingen försämring sker mekaniskt. Text-effekt-mismatch, samma felklass som `nothing`-valets kommenterade bugg i `eventFactories.ts:365`. Inte O2:s fråga, men värt en egen rad om/när text-effekt-fidelitet svepas igen.

**Nästa steg:** den fulla pairwise-analysen (steg 2) — extrahera effektvektorer, jämför alla syskonval, inte bara noOp-sidorna. Inte påbörjad, väntar på Jacobs go givet metodfyndet ovan.

### O3 · Spelarens eget säsongsmål
**Status:** `KLAR (7604b196, 56e5882c, c025bfd7, 424bc7ed)` — domänlager (offers/evaluering/rader) + halvtidsraden (D1 landade under samma session) byggda av tidigare pass; UI-valet i Sommaren ("DITT VAL"-sektionen, tre-läges state, browser-verifierat) byggt `424bc7ed`. **Känt, avsiktligt gap:** "Inget mål valt"-radens text ("Du lovade ingenting...") renderas aldrig i praktiken — `SeasonGoalType` saknar en `'none'`-variant, så ett explicit avstående inte går att skilja från en säsong som spelades innan featuren fanns. Se `HistoryScreen.tsx`-commiten (`3fe41754`) för resonemanget. Om Jacob vill ha den aktiva versionen krävs en liten typutökning.

Ett mål, valt i Sommaren, återkallat vid halvtid och i årsboken. Sex måltyper härledda ur klubbens läge, plus "inget särskilt i år" som giltigt svar. All text låst i domen, inklusive årsbokens fyra utfallsrader.

**Tre regler som avgör:** ett mål och inte tre (tre är en checklista, alltså ett styrelsekrav till). Valfritt att avstå. **Aldrig en belöning** — uppfyllt mål ger inga pengar, inget rykte, ingenting utom att spelet säger att du gjorde det. Kopplas det till en mekanisk belöning blir det ett uppdrag och spelaren optimerar i stället för att välja.

**Lagras i `SeasonSummary`** som del av `O18`: måltyp, referens, utfall. Tre fält.

**Kräver `5.1` Sommaren och `O18`.** Kräver **inte** `O5` eller `U1` — den enda av mina domar som kan byggas direkt efter Sommaren. Halvtidsraden kräver `D1`:s ambient-nivå.

**Godkänd när:** en spelare kan säga vad hen lovade sig själv förra sommaren — och spelet säger samma sak i årsboken.

### O4 · Burnout: spelbar eller nedtonad
**Status:** `SKRIVEN` — `DOM_BURNOUT_2026-08-17.md`. **Domen: spelbar.**

Effekten är **informationskvalitet**, inte prestation: hög burnout gör att assistentens rekommendation uteblir, motståndaranalysen blir grövre, spelarbetygen fördröjs. En utmattad manager ser sämre — laget spelar inte plötsligt sämre. Det senare vore ett dolt straff, samma sak jag avvisade om rivalernas catch-up-budget.

Tre handlingar med verkliga priser: delegera pressen (tappar journalistrelationen, svaret blir assistentens), sänk träningsintensiteten (utvecklingen bromsar), be styrelsen om andrum (`boardPatience` faller — den enda som kan kosta jobbet). All text låst i domen.

**Byggs oberoende av `O5` och `U1`** — burnout är en egen valuta och kräver inte att kronor är knappa. Kräver `D1` för viktningen.

**Rapportera-först:** var konsumeras assistentens taktikrekommendation och motståndaranalysens detaljnivå? Går de att gradera eller är de binära?

**RAPPORT LEVERERAD, 2026-08-20.** Två av tre effekter är redan gradeade av BEFINTLIG infrastruktur, ingen ny mekanik krävs för dem — bara en burnout-koll vid rätt anropsställe:

1. **Motståndaranalysens detaljnivå — redan tvånivåad.** `OpponentAnalysis.level: 'basic' | 'detailed'` (`opponentAnalysisService.ts`) med två separata exporterade funktioner, `generateBasicAnalysis`/`generateDetailedAnalysis`. Valet mellan dem görs i dag PER ANROPSSTÄLLE (statiskt — `TacticStep.tsx`/`gameStore.ts`/`DevScenesScreen.tsx` kör alltid detailed, `LineupStep.tsx`/`OpponentAnalysisCard.tsx` kör alltid basic), inte av något dynamiskt game-state. `OpponentAnalysisCard.tsx:61-124` renderar redan olika innehåll per nivå (formation/style/threatPlayer bara vid `detailed`). Burnout skulle bara behöva byta vilken funktion som anropas vid hög burnout på de ställen som annars kör detailed — samma två-nivå-rendering återanvänds, ingen ny UI-gren.
2. **Assistentens taktikrekommendation — redan binär-med-tomt-tillstånd.** `suggestedMentality`/`suggestedPress` är redan `?: TacticMentality`/`?: TacticPress`, och `undefined` är redan ett levande, testat tillstånd ("Jämn motståndare" — B2/O15-arbetet i den här sessionen bekräftade det igen). `TacticBoardCard.tsx`/`TacticStep.tsx` visar redan "inget förslag" tyst, utan särskild text, när fälten är `undefined`. Burnout skulle återanvända EXAKT samma tomma tillstånd — ingen ny text, ingen ny renderingsgren, bara en villkorad `undefined`-tilldelning vid generering.
3. **Spelarbetygen fördröjs — INTE redan gradeat, kräver ny mekanik.** `MatchReport.playerRatings: Record<string, number>` (`Fixture.ts:75`) är ett OBLIGATORISKT fält, alltid fullt populerat när en match är klar. Ingen "delay"/"partial"-koncept finns. Att bygga detta kräver antingen en ny fördröjningsmekanik (betyg syns X dagar senare) eller att lämnas utanför denna leverans.

**Slutsats:** 2/3 effekter byggbara nu utan ny text eller ny renderingslogik (återanvänder befintlig optionalitet). Effekt 3 kräver ett separat, litet designbeslut (hur länge fördröjs betygen, vad visas under tiden) innan den kan byggas — inte en textfråga, en mekanikfråga. Väntar på `D1` för viktningen (domens eget villkor) innan bygge.

**Godkänd när:** en spelare kan säga vad burnout kostade och vad hen gjorde åt det.

### O5 · Framgångsekonomin — PAUSAD
`DOM_FRAMGANGSEKONOMIN_2026-08-17.md`. Tre krafter i ordning: löneinflation med rykte, driftskostnad för byggt, styrelsens investeringskrav. Rivalernas catch-up-budget avvisad — dolt mottryck spelaren inte kan se.
**Pausad tills U1 är byggd.** Domen antog att nedsidan fanns och behövde kalibreras mot. Skutskär visar att en svag klubb inte kan misslyckas; löneinflation mot ett sådant spel blir dekoration i övre halvan och godtycklig i nedre.
**Status:** `PAUSAD`

### O6–O14 · Kortare poster

| ID | Post | Status |
|---|---|---|
| O6 | Positionsvokabulären i `Formation.ts`: `LIB`, `VCB`/`HCB`, `CMF`, `HR` som spegling av `VH` | `KLAR (6ede9f06)` — Jacobs research (SvenskaFans bandytaktikserie + Elitseriens positionslista): `LIB` och `CMF` är verkliga, distinkta bandypositioner — behålls, tidigare dom om dem var fel. Två ändringar: `HR`→`HH` (spegling av `VH`, `HR` var ett skrivfel som blivit kanon), `VCB`/`HCB`→`VB`/`HB` (centerback är fotbollsterm, svensk backlinje saknar den sammansättningen). **Sidofynd, oadresserat:** i `4-3-3`/`4-2-4` (fyrbackslinje) ger renamningen `VB`/`VB` och `HB`/`HB` som DUBBLA etiketter på samma rad (ytterback + den forna VCB/HCB-innerbacken) — pitch-vyn kan inte längre skilja dem åt visuellt. Grepat: bara `Formation.ts` påverkat, inga andra kodställen refererade de gamla etiketterna. Jacob behöver döma: acceptera dubbletten, eller ett tredje ord för innerbacken i fyrbackslinjen (t.ex. "mittback"/`MB`) |
| O7 | Språkfelslistan från alla auditer, samlad. Rapport levererad — se not under tabellen | `RAPPORT-LEVERERAD` |
| O8 | Text: Turneringsläge mitt i serie (efter 5.3), fast-lägets prosapooler, Sommarens saknade händelsetyper | `VÄNTAR` |
| O9 | Delningskortets berättelseläge. "6:e, 21 poäng" ser mediokert ut för en utomstående; det var en svår klubb som gick från nia till kvartsfinal. Huvudbudskapet ska vara förtjänad kontrast plus svarsinbjudan. Tre artefakter att namnge: Årets berättelse, Årets match, Karriären hittills | `EJ SKRIVEN` |
| O10 | Best-in-class-strategin beslutad som ambition. Bandyarkivet, spelbara vägskäl, Bruksligor, utmaningslänkar, skaparekosystem byggs **inte** nu — men strategins Fas 0 är samma sanningslager som K1–K5. Ordningen håller | `BESLUTAD, EJ PÅBÖRJAD` |
| O11 | **Innehållskontraktet** — `DOM_INNEHALLSKONTRAKTET_2026-08-17.md`. Sex obligatoriska fält: trigger, state-effekt, berörda system/personer, livslängd, `semanticKey`+cooldown, återkallningsyta. **Gäller från nu**, också för ändringar av befintlig text. Rapportera-först: finns ett register att hänga tabellen på, eller måste det skapas? I så fall samma arbete som `U5` — gör dem ihop | `KLAR (e43aa821)` — se leveransnot nedan |

**O11 — rapportera-först besvarad, 2026-08-19.** Inget register finns (grep bekräftat: `GameEventType` är en ren unionstyp, `eventFactories.ts` är imperativa konstruktionsfunktioner, `getEventPriority()` är en enkolumns-switch — inget deklarativt per-typ-register existerar). **Jacobs dom:** O11 och U5 byggs som EN fil, `src/domain/data/contentContract.ts`, en rad per narrativt innehåll, sex kolumner där kolumn 5 är `U5`:s redan gjorda `semanticKey`-analys. Att bygga tabellen ÄR att bygga registret — två pass vore två sanningar om samma sak.

**O11 — levererat 2026-08-20 (`e43aa821`).** 95 rader (48 `GameEventType` + 22 `StorylineType` + 8 `ArcType` + 17 `PortalBeat`), en per canonical id, struktur låst av `contentContract.test.ts`. 6 rader `filled:true` med alla sex fält spårade mot koden: `hesitantPlayer`/`playerPraise`/`sponsorOffer` (från O2-revisionens djupspårning) + `board_failure`/`ripple_consequence` (pivotal beats, U5 forts). Resten `filled:false`, ärliga TODO-rader — INGEN gissning, bara det verifierade är ifyllt. Enforcement (byggtid-grind som vägrar merge av ofyllda rader, `scripts/eventGuardInstrument.ts`) är INTE byggd i detta pass — separat, större leverans. `playerPraise`-raden avslöjar ett kvarstående textgap (löftet "vila" håller inte mekaniskt) som kräver Opus, inte kod.

**Ordning:** `narrativeLog`s kompletta skrivväg FÖRST, registret sedan (loggen registrerar vad som hänt, registret deklarerar vad varje innehåll ÄR — deklarationen blir billigare och sannare när loggen visar vad som faktiskt fyrar).

**Flaggat innan bygge (Code, samma dag):** skrivvägen är redan komplett i den mening som avgör ordningen — `U5`s "8/9 skrivvägar" var aldrig en väntande 9:e källa. Jacobs egen dom 2026-08-17 uteslöt `cardStaleTracking` PERMANENT (olika fråga: portalkorts synlighetstid, inte narrativ båge) — 8/8 av det som hör hemma är wired. Det som FAKTISKT återstår av `U5` innan `contentContract.ts` börjar, per `U5`s egen DOM-ordning: `isOnCooldown` mot pivotal beats, sedan `systemhandelseBudgetOk`:s faktiska gating. Om "kompletta skrivväg" i ordern syftar på något annat än dessa två — flagga tillbaka, annars är det redan uppfyllt och nästa steg är `isOnCooldown`.
| O12 | Förhandsdeltan — se `DOM_DOMINANS_OCH_FORHANDSDELTAN_2026-08-17.md`, skriven ihop med O2 | `SKRIVEN` |
| O13 | Jobbmarknad efter avsked — framgångsauditens rekommendation ovanpå 3.3. **Inte beslutad.** 3.3:s rena karriärslut är minimikravet | `EJ BESLUTAD` |
| O14 | Monetisering och paketering — framgångsauditens modell är en **hypotes**, inte en dom. Ska inte driva något bygge | `HYPOTES` |

**O7 — fyra öppna fynd, alla markerade `[Opus]`, ingen ny text skriven av Code:**

| Fil:rad | Citerad text | Feltyp |
|---|---|---|
| `GranskaAnalys.tsx:162` | "En tungt förlust att analysera grundligt." | Grammatik — genuskongruens ("en tung förlust"). Samma felklass som redan rättats i `helpers.ts:107` ("En tung matchdag"), men återkom oupptäckt i en systerfil |
| `journalistHeadlineStrings.ts:204` | "Skämmig insats. Punkt" | Ej standardsvenska ("skämmig") — känt exempel, Helena Wikström |
| `journalistHeadlineStrings.ts:178` | "Skämmig kväll — inget försvar för det här" | Samma ord, samma konstant, ej tidigare flaggat separat |
| `nationalTeamService.ts:152` | "Landslagsspelarena är tillbaka" | Stavfel ("spelarna"). `nationalTeamService.test.ts:167` assertar den felstavade strängen — testet måste uppdateras i samma commit som texträttningen |

**Begränsning värd att bära vidare:** två auditer (Skutskär-, långspelsauditen) är refererade i `CODE_INSTRUKTION_LANGSPEL_10SASONGER_2026-08-17.md`/`CODE_TOTALORDER_2026-08-17.md` som källa till en "Språkfelen (LOW)"-lista, men de underlagen är själva markerade "uppladdade, ej i repo" — går inte att söka i. Sannolikt fler fynd där. Tre äldre fynd (mattstöd/samma kväll, brittningen/Dominerar sitt område, bryter igenom→slår igenom) är redan fixade (`KVAR.md`), listade bara för att ingen ska återupptäcka dem som nya.
| O15 | **Taktikens två lägen.** Brief skickad till Design 2026-08-17. Standardläge: assistentens två rekommendationer som **ett** förslag, vad som skiljer planen från förra matchen, och "följ rådet" (ändrar bara det som föreslås). Avancerat läge: alla åtta, större träffytor, ändringshistorik. Standardläge är default. Å2 (träffytorna) ingår. De åtta dimensionerna stannar — progressiv disclosure, inte förenkling | `KLAR (e248835f)` — vikt 1b (DOM godkänd 2026-08-19). Domänfundament: `TacticChangeLogEntry` (`Club.ts`), `SaveGame.tacticAdvancedMode`/`tacticChangeLog`, `diffTactics`/`getTacticDeltaLine`/`getTacticChangeHistoryLines` (`tacticData.ts`) — landade i `4e347971` (delad worktree). `gameStore.ts`: `updateTactic` loggar ändringshistorik mot senast spelade matchens tactic-snapshot (samma baslinje som delta-raden), `setTacticAdvancedMode` persisterar lägestoggeln (`persistGameSnapshot`, samma mönster som `updateMatchMode`) — `4e654c53`. UI (`TaktikScreen.tsx` + `TacticBoardCard.tsx`, wirat i båda konsumenterna inkl. `SquadScreen.tsx`s Taktik-flik) + Å17-stjärnfixen (se Å-listan) — `e248835f`. Delta-raden jämför mot förra SPELADE matchen oavsett tävlingstyp (`useLastCompletedFixture`, inte ligafilter) — Jacobs kritiska villkor, testat explicit. "Följ rådet" sätter bara `suggestedMentality`/`suggestedPress`, aldrig alla åtta. Test: `tacticData.test.ts` (13 fall) låser den LÅSTA delta-/historik-texten ordagrant. 2142/2142 gröna, tsc rent, build ren, ds-guard under baslinje. Browser-verifierat (Playwright mot `/dev/scenes?scene=taktik`): standardläge (förslagskort, Spelplan-preview med ★, VISA ALLA ÅTTA-rad) + avancerat läge (alla åtta, 44px, "Vad du ändrat i år") båda korrekta, skärmdumpar jämförda mot mocken (uppföljningsfix `04d5c0b3`: enkel 🏒-prefix i väg-in-raden, matchar mocken exakt). **Avvikelse från mocken (medveten):** TaktikScreen är en fristående klubbmeny-skärm ("← Tillbaka"), inte matchförberedelsens leather-`GameHeader`/fasdots/"NÄSTA: STARTA"-CTA som mockens telefonram visar som illustrativ chrome — dessa hör till `TacticStep.tsx`/matchflödet, inte till målskärmen, och byggdes inte om. `TacticStep.tsx` självt rördes inte denna leverans (delar redan `tacticRows`, men har ingen Å2/FÖRESLÅS-pill-bugg och ingen egen standard/avancerat-toggel än) |
| O16 | **Granska som lärandeyta** — `DOM_GRANSKA_LARANDEYTA_2026-08-17.md`. En sektion, `DITT VAL`, som kopplar **ett** av spelarens val till ett mätt utfall. Fyra kandidater i ordning efter kopplingens säkerhet: press→återvinningar, hörnstrategi→hörnmål, tempo→kondition sista tjugo, formation→målens ursprung. All text låst. **Rapportera-först:** vilka av de fyra har `MatchResult` faktiskt siffror för? Bygg bara de som redan mäts. **Kräver `4.8` andra halvan** — utan den kan sektionen tillskriva spelaren assistentens beslut, vilket gör den aktivt skadlig | **KLAR (ee8f2d1c), 2026-08-19.** Rapport (samma dag): (1) Press→återvinningar: INTE mätt, ingen turnover/recovery-tracking finns — EJ BYGGD. (2) Hörnstrategi→hörnmål: MÄTT — `cornerStrategy` går in i hörnberäkningen (`matchCore.ts:462,675,1195`), `MatchEvent.isCornerGoal`+`minute`+`clubId` persisteras på färdig `Fixture` — **BYGGD**, den enda av fyra. (3) Tempo→kondition sista tjugo: INTE tillräckligt mätt, sann fatigue (`lastMinutePressData`/`avgFatigue`) är transient live-matchdata, sparas aldrig på färdig match — EJ BYGGD. (4) Formation→målens ursprung: INTE mätt, inget mål-ursprung-fält finns — EJ BYGGD. `dittVal`-sektion i `granskaSectionRegistry.ts` + `dittValCornerText()` i `GranskaOversikt.tsx`, samma ✕-regel som `dinaVal` (bara avsked). Renderar null vid 0 hörnor (ingen koppling). 4.8-beroendet grepat, inte antaget: `setLineup.ts` stämplar alltid `club.activeTactic` — tactic auto-väljs ALDRIG separat i snabbläge (bara lineuppet gör det, `TeamSelection.autoSelected`), så ingen ny mode-gating behövdes. 9 nya tester + browser-verifierat (liga: sektionen syns med rätt text; avsked: syns inte). Build blockerad av ORELATERAT, redan pågående O15-fel i `SaveGame.ts`/`tacticData.ts` (duplicate identifier) — `tsc --noEmit` rent för alla filer den här commiten rör, `npx vitest run` 199/199 filer gröna |
| O17 | **Anläggningsträdets slut** — `DOM_ANLAGGNINGSTRADETS_SLUT_2026-08-17.md`. Del 1 **byggd**: fullt-träd-tillstånd i `FacilityTree.tsx` (låst text + nodantal), additivt — trädet under visas oförändrat. `getFacilityNodeViews` fyller nu `completedSeason` från `builtSeasons` (fanns sedan AUDIT DEL 3, ingen konsument förrän nu). Del 2 **gate byggd**: `shouldStartHallTrial` kräver `isFacilityTreeFull(fs)` istf. bara `laktare_ostra` — men ekonomiska tyngden (hallen som horisont) väntar fortfarande på `O5`. Del 3 (**avveckla en byggd nod**) **inte byggd** — kräver drift (`O5` del 2), ny mekanik, uppfyller varsel-mallens punkt 4–5 när den byggs. **Inte fler noder** — det skjuter problemet fem säsonger framåt | `DEL 1+2 KLAR (40530421)`, del 3 väntar på `O5` |
| O18 | **Årsboken som karriärens ryggrad** — `DOM_ARSBOKEN_RYGGRAD_2026-08-17.md`. Fem fält i `SeasonSummary`: spelarens mål+utfall (`O3`), säsongens viktigaste beslut (kräver `O19`), största personförändring, rivalitetens ställning, klubbens epok. **Ett fält per säsong, aldrig en lista** — en händelselös säsong ska bära färre fält, inte utfyllnad. All text låst. Fält 3–5 kan byggas nu; fält 1 ihop med `O3`. `HistoryScreen` med snapshot-prop delas med `3.3` och `U7` — bygg den en gång | **KLAR, fält 1+3-5 (`56e5882c`, `32649d65`, `3fe41754`)** — `seasonEndProcessor.ts` bygger `personalGoal`/`personChange`/`rivalryStanding`/`clubEra` på `SeasonSummary`; `HistoryScreen.tsx` (redan snapshot-prop-kapabel sedan `3.3`) läser dem, varje rad villkorad på faktiskt innehåll. Fält 2 (säsongens viktigaste beslut) kvar, väntar på `O19` |

**O19-uppföljning, 2026-08-20 — fält 2 fortfarande INTE Code-buildbart, av ett NYTT skäl.** `O19` är klar (`72427068`), så BLOCKET som stod i domen är löst. Men templaten "Du {beslut}. Det kostade {kostnad}." är låst — VÄRDENA som ska fyllas i den är det inte. Grepade alla nio `systemhandelse:true`-källorna (samma nio O19 märkte): sell_star/take_loan/ask_mecenat (economicCrisisService.ts), away_trip_bus/tifo_contribution/legacy_naming_arena (weeklyDecisionService.ts), offer_tribute (mecenatService.ts), varsel offer_pro (eventFactories.ts), mecenat-happiness-eventet (eventFactories.ts, "mallens eget referensfall"), det omöjliga valet — sälj/behåll (postAdvanceEvents.ts). Nio helt olika formuleringar av VAD som hände ("sålde toppspelaren", "bjöd mecenaten på jubileumsmatch", "gav truppen heltidskontrakt") existerar inte skrivna någonstans — att skriva dem är ny svensk text, inte substitution i en färdig mall. **Också olöst, oavsett text:** "störst mätbar konsekvens" jämför inte äpplen mot äpplen — 350 000 kr (sell_star) mot −15 fanMood/−12 communityStanding (det omöjliga valet) har ingen given gemensam skala; domen specar inte rangordningen. **Körorder:** Opus skriver de nio {beslut}-fraserna (korta, samma register som mål-/person-/rivalraderna) och dömer rangordningsprincipen (kr-baserad? social kostnad väger tyngre?); Code bygger urvalslogiken + rendering när båda finns.
| O19 | **Märk de nio 5/5-händelserna som systemhändelser i data**, inte i en rapport — de ska bli åtkomliga för en gemensam räknare. Billigt, och gör säsongsbudgeten möjlig. Ingen mekanik byggs än | `KLAR (72427068)` — nytt fält `systemhandelse?: boolean` på `GameEvent` + `WeeklyDecision` (två separata typer, delar inget interface). Satt på alla nio konstruktionsställen. **Designval, inte givet av ordern:** märkt på HELA event:et/decisionen, inte per enskilt val — för `checkMecenatRetirement` (bara `offer_tribute` är 5/5 av tre val) och economicCrisisService (bara `sell_star` av tre) betyder det att räknaren senare ser händelsemomentet som systemhändelse oavsett vilket val spelaren faktiskt gör. Motivering: en finare per-val-märkning kräver att veta VILKET val spelaren gjorde innan räknaren kan agera, vilket hör ihop med säsongsbudget-mekaniken (U5, inte byggd än) — event-nivå är den enda granularitet som är meningsfull utan den mekaniken. Regressionstest verifierat mot pre-fix kod |
| O20 | **De tio 4/5-händelserna — rapportera vilken punkt som saknas i var och en.** Saknas punkt 5 (systemen pekar isär) är det `O2`:s dominansfråga. Saknas punkt 3 (ett tal att räkna på) väntar den på `O5`. Det avgör vilka som är billiga att lyfta till 5/5 | `RAPPORT-LEVERERAD` — se tabell under |

---

# BANDYSPRÅKET — B1–B8

**Källa:** `docs/BANDYSPRAK_KALLASNING_2026-08-19.md`. SvenskaFans "Bandytaktik förklarat för en idiot" (2013), del 1 (Brodén, tränare), del 3 (Bergman, libero), del 5 (Einarsson, ytterhalv). Fyra delar (målvakt, back, mittfältare, anfallare) går inte att nå.

**Jacobs dom 2026-08-19: bygg alla åtta.** B1 sist och med eget beslut före bygge.

| ID | Post | Storlek |
|---|---|---|
| B4 | **Motståndaranalysen namnger en spelare med skäl.** Einarsson: *"Därför är det Christoffer Edlund jag ska hålla koll på, snarare än Erik Säfström."* `opponentAnalysisService` ger egenskaper; den ska ge ett namn plus varför. Datan finns. Uppfyller varsel-mallens punkt 2. **Text från Opus** | Liten |
| B5 | **Bandyvokabulär i scouttext och matchreferat.** Följsam, brytsäker, bra på tennis (ta ner höga bollar), hal, rättvänd/felvänd, uppåkning, lyra vs flipp, styrspel, vända hem. Rapportera var scouttext och referat genereras — **Opus skriver raderna** | Liten |
| B7 | **Liberon som syndabock.** Bergman: många frilägen → lätt att skylla på liberon, *"och helt fel är det inte"*. Precisering: **raka djupledsbollar** är liberons ansvar, **frilägen från kanten** är halvens eller backens. Mekanisk grund finns (frilägen, positioner, moral). **Text från Opus** | Liten |
| B6 | **Positionsfärgningen erkänner halvens dubbelroll.** Brodén: *"när vi försvarar är halvorna ytterbackar. När vi anfaller är de yttermittfältare."* En halv som spelats som mittfältare är inte felplacerad. Gör inte färgningen strängare — gör den rätt | Liten |
| B8 | **Åkhalv/lyrhalv och klubbfattning som scoutdetaljer.** Einarsson: den som bara kan det ena är skön att möta — *"då vet du att du alltid kan falla"*. Klubban utåt = forehandpassningar inåt men fel skruv på lyrorna; klubban inåt = lättare att dra en kille, längre räckvidd utmed sargen. Ingen ny mekanik krävs — scouttext | Liten |
| B3 | **"Spela eller åk" som klubbtradition.** Den enda skillnaden Brodén kallar fundamental, och den **korrelerar inte med tabellplacering** — bottenlag kan vara spelande, topplag kan åka. *"Ibland sitter det också i tröjorna."* Fält i `clubExtendedInfo`, knyter stil till ort | Medel |
| B2 | **Högt press som situationsbundet, inte likvärdigt.** *"Det är inte många som gör det idag... man kan göra det i korta perioder, exempelvis i inledningen av matchen eller om motståndaren har utvisningar."* Rapportera hur `press` konsumeras innan något ändras — det rör matchmotorns kalibrering | Medel |
| B1 | **Formationssystemet mot bandyns femmannaförsvar.** Alla lag spelar fem i försvaret — två backar, libero, två ytterhalvor. Bara de främre fem varierar (två eller tre mittfältare). Vårt 5-3-2 / 4-3-3 / 3-3-4 beskriver en variation som inte finns. **Rör byggd mekanik och `BEVARA`-listan — RAPPORT FÖRST, eget beslut före bygge** | **Stor** |

**Ordning:** B4 → B5 → B7 → B6 → B8 → B3 → B2 (rapport) → B1 (rapport).

**B4 MEKANIK BYGGD 2026-08-19 (`9406be40`).** `selectThreatPlayer()` pekar deterministiskt ut samma spelare (högst tillgänglig `currentAbility`, samma urval som `keyPlayers`) och klassar VARFÖR ur fyra attributpar (evasive/clinical/relentless/creative) — ren funktion, ingen slump, domens "peka konsekvent" håller by construction. Wired i `OpponentAnalysisCard.tsx` (🎯-raden, samma villkorade mönster som strengths/weaknesses). **TEXT LEVERERAD OCH WIRED 2026-08-19 (`4e7fd447`).** Jacobs fyra pooler (evasive/clinical/relentless/creative, 4 rader var, `{Efternamn}`-platshållare) i `THREAT_REASON_LINES`. Rotationen är stabil per match (hash på spelar-id), inte per rendering. `displayThreatReasonLine()` interpolerar `{Efternamn}` och har en null-safety-fix (`!pool || pool.length === 0`, inte bara `pool.length === 0` — kastade annars för en okänd `reasonKey`). Testsviten skrevs om: originalet muterade den delade `THREAT_REASON_LINES`-exporten direkt i `afterEach`, ofarligt när poolerna var tomma men en risk nu när de bär produktionstext. B5 tar Opus själv, inte nästa Code-post.

**B1 RAPPORT LEVERERAD 2026-08-19 — bekräftar fyndet, INGEN dom fattad, inget byggt.** Läst `Formation.ts` i sin helhet (bekräftat i samma session vid O6). Sex formationer (`5-3-2/3-3-4/4-3-3/3-4-3/2-3-2-3/4-2-4`) VARIERAR backlinjens storlek (2, 3 eller 4 backar/halvar) — precis den fidelitetslucka domen beskriver, eftersom källmaterialets två oberoende elitspelare (Brodén + Liw) bekräftar att ALLA bandylag spelar exakt fem i försvaret (två backar, libero, två ytterhalvor), bara den FRÄMRE femman (mittfältare/anfallare) varierar. Domen är själv tydlig: **"Öppen fråga, inte en order."** Det är den enda posten av tolv som rör redan byggd, `BEVARA`-skyddad matchmotorkalibrering (`matchCore.ts` läser `formation` för positionskrav i flera vägar) — en omskrivning skulle beröra alla sex formationsdefinitioner, `autoAssignFormation`, `getRecommendedFormation`, och `squadEvaluator.ts`s positionsvikter samtidigt. Kräver Jacobs eget beslut innan ens en spec skrivs, per ordern. Inget kodfynd utöver vad B1s egen text redan säger — rapporten bekräftar att fyndet stämmer mot koden, mer än så är inte begärt.

**B2 RAPPORT LEVERERAD 2026-08-19.** Grepat hela `matchCore.ts` för `tactic.press`. ETT konsumtionsställe existerar: `:673`, `if (tactic.press === 'high') { wFoul += 5; wTransition += 3 }`. Det betyder: motorn är redan FUNKTIONELLT BINÄR (hög vs. inte-hög) — `'low'` och `'medium'` ger IDENTISKT beteende i simuleringen, ingen egen viktjustering för någotdera. Domens oro (tre jämbördiga UI-alternativ) är alltså bekräftad på motorsidan också: skärmen visar tre val, motorn känner bara igen två effektiva lägen. **Rör matchmotorns kalibrering (BEVARA-listan)** — ingen ändring gjord, bara rapporterat som ordern kräver. Öppen fråga till Jacob/Opus: ska `'low'`/`'medium'` få egna, svagare effekter (mer motorarbete, kalibreringsrisk), eller ska UI:t ärligt visa att bara `'high'` gör skillnad?

**B3 FÄLT BYGGT 2026-08-19 (`3beab6d5`).** `playStyleTradition?: 'spelande' | 'akande'` i `ClubExtendedInfo` (`clubExtendedInfo.ts`), `undefined` på alla tolv klubbar. **Väntar på Opus dom:** vilka klubbar är vilka är en identitetsfråga ("sitter i tröjorna"), inte något Code ska gissa. Ingen UI-yta byggd än — inget att visa förrän värdena finns; nästa steg när de gör det är att väva in traditionen i scouttext/matchreferat (samma ytor som B5/B8).

**B8 RAPPORT LEVERERAD 2026-08-19 — samma yta som B5, ingen egen mekanik.** Domens egen ord ("Ingen ny mekanik krävs — scouttext") stämmer: åkhalv/lyrhalv och klubbfattning är samma sorts fritt textval som B5s attributbeskrivningar, samma genereringsställe (`generateScoutNotes`, `scoutingService.ts:124-155`, `ARCHETYPE_STRENGTHS`/`ATTRIBUTE_LABELS`). Inget nytt att grepa eller rapportera utöver B5s fynd — Opus kan lägga in dessa ord i samma svep som B5s vokabulär.

**B7 RAPPORT LEVERERAD 2026-08-19 — mekanik BLOCKERAD, samma felklass som B12s fynd.** Domens precision (raka djupledsbollar = liberons ansvar, frilägen från kanten = halvens/backens) kräver att veta VEM som spelade libero i en specifik AVSLUTAD match. Två hinder, bekräftade i kod: (1) "libero" är inte ett permanent spelarattribut — `PlayerPosition`-enumet har `Goalkeeper/Defender/Half/Midfielder/Forward`, ingen `Libero`. Libero är bara en FORMATIONSSLOT (`def-c`, label `'LIB'`) som existerar UTESLUTANDE i `5-3-2`-formationen (`Formation.ts:31`) — i `3-3-4`/`4-3-3`/etc. finns ingen libero-slot alls, samma back-etikett gäller alla. (2) Slot-tilldelningen sparas aldrig per match — `Fixture.homeLineup`/`awayLineup` (`TeamSelection`) bär bara en platt `startingPlayerIds`-lista + `tactic` (formationstyp som sträng), ingen slot-mappning. Att i efterhand GISSA vem som stod i LIB-slotten för en redan spelad match (genom att köra dagens `autoAssignFormation`-logik baklänges) vore precis det `gissa inte bakåt`-disciplinen förbjuder — CA och lagets sammansättning kan ha ändrats sedan matchen spelades. **Byggbart om:** `TeamSelection` börjar spara slot-mappningen vid matchtillfället (en ny fält-tillökning, litet ingrepp) — då blir B7 en ren efterhandsläsning. Inte gjort nu, flaggat som förutsättning.

**SAMMANSLAGEN MED B12, Jacobs dom 2026-08-19.** Samma datalucka: B12s `involvedPlayerIds` (steg 2a, händelseberikningen) löser B7 GRATIS om varje involverad spelares POSITION VID HÄNDELSETILLFÄLLET sparas tillsammans med id:t — inte bara den permanenta `PlayerPosition`, utan vilken slot (inkl. `'LIB'` när formationen är 5-3-2) spelaren faktiskt stod i just då. B7 byggs alltså inte separat — den blir en konsekvens av B12 steg 2a när/om den godkänns. Ingen egen ordning kvar för B7.

**B6 RAPPORT LEVERERAD 2026-08-19 — redan korrekt, inget att bygga.** Verifierat i kod: `squadEvaluator.ts:8-14` (`ADJACENT`) och `PitchLineupView.tsx:9-15` (`ADJACENT_POS`) har BÅDA redan `half: ['defender', 'midfielder']` — en halv som spelas som mittfältare får `amber`/`0.90`, inte `red`/felplacerad. Domens egen formulering bekräftar att det här var en förebyggande notering ("värt att veta INNAN någon skärper den logiken"), inte en bugrapport — ingen kod ska ändras. **Sidofynd:** `getPositionFit` finns duplicerad på två ställen (`squadEvaluator.ts` numerisk 1.0/0.90/0.75, `PitchLineupView.tsx` grön/gul/röd) med identisk adjacency-logik, oberoende hållna i synk. Samma felklass som Etapp 4:s "två källor som glidit isär" — de stämmer överens IDAG, men ingen grind skulle fånga en framtida drift mellan dem. Inte en B6-post i sig, flaggat separat.

**B5 RAPPORT LEVERERAD 2026-08-19.** Två generatorer, olika mognad:

- **Scouttext (`generateScoutNotes`, `scoutingService.ts:124-155`, renderad i `ScoutingTab.tsx` via `ScoutReport.notes`, satt vid `processScoutAssignment:83`).** REDO utan förbehåll — rena textswappar. `ARCHETYPE_STRENGTHS` (`:95-105`, t.ex. `Finisher → 'dödligt avslut'`) och `ATTRIBUTE_LABELS` (`:107-122`, t.ex. `skating → 'skridskogången'`, `ballControl → 'bollkontrollen'`) är generiska fotbolls-/allmänsportord idag. Fem fasta meningsmallar (`:146-152`) interpolerar `{strength}`/`{weakLabel}` — bandyorden (följsam, brytsäker, bra på tennis, hal, rättvänd/felvänd, köldtålig) ersätter befintliga värden i dessa två `Record`, mallarna rör Opus inte.
- **Matchreferat (`generateMatchStory`, `matchStory.ts`, renderad i `MatchReportView.tsx`/`MatchLiveScreen.tsx`).** DELVIS blockerad — hörnmål nämns redan (`:59-63`, `"Ett hörnmål bidrog..."`), det går att byta ordval där direkt. Men lyra/flipp/styrspel/vända hem/uppåkning beskriver SPELSÄTT (hur ett mål byggdes upp), och `B12`s steg 1-rapport (samma session, ovan) bekräftade att `matchCore` inte skiljer passningstyper eller bygger upp-mönster från varandra — ingen sådan data finns att hänga orden på än. De fem spelsätts-orden kan alltså inte in i referatet förrän `B12` steg 2b (målets ursprung) eller senare V2-arbete finns. **Rekommendation:** skriv om `ARCHETYPE_STRENGTHS`/`ATTRIBUTE_LABELS` nu (litet, oberoende, inget väntar), lämna referatets spelsätts-vokabulär till efter `B12`.

## Tillägg efter att alla sju delar lästs (2026-08-19, senare)

De fyra sista delarna (målvakt, back, mittfältare, anfallare) lästes efter att B1–B8 skrivits. Tre nya poster, och en förstärkning av B1.

| ID | Post | Storlek |
|---|---|---|
| B9 | **Positionsberoende bytesbehov.** Liw: *"För en mittfältare finns egentligen inget utrymme att vila på planen. Jämfört med halven har vi mindre möjlighet att välja om vi ska gå med eller inte... Därför måste vi byta oftare."* Ytterhalvor kan spela nittio minuter; mittfältare kan inte. **Rapportera först:** är `fatigue` positionsberoende i dag, eller enhetlig? Om enhetlig är det ett verkligt fidelitetsfel — rotation blir en generisk syssla i stället för en positionsfråga. Rör matchmotorns kalibrering | Medel |
| B10 | **Zonmarkering, inte man-man.** Törner: *"Det går inte att åka efter en spelare, det går inte. Utan jag håller min zon och släpper över spelare till en medspelare när han lämnar min position."* Detta är inte en taktikdimension att lägga till — det är **grundregeln för hur bandyförsvar fungerar**, och den ska synas i matchtext och i hur `B4`:s hotspelare beskrivs (den som rör sig över zongränser är svårast). Textpost, ingen mekanik | Liten |
| B11 | **Den ihåliga muren.** Wasberg: målvakten kan **medvetet ställa en ihålig mur** vid frislag för att locka skytten att skjuta från dåligt läge. Ett taktiskt val som inte finns i spelet, och som passar hörn-/frislagsmekaniken vi redan har. **Rapportera:** finns frislag som egen händelse med val, eller bara hörnor? | Liten–Medel |

**B9 RAPPORT LEVERERAD 2026-08-19 — fyndet bekräftat, ett verkligt fidelitetsfel.** `playerStateProcessor.ts:105-119`: matchens `fitnessLoss` är `baseFitnessLoss (15+slump 0-9) × tactic.fatigueRate × weatherTacticFatigue` — bägge multiplikatorerna är LAGVISA (samma för alla elva spelare), och `tactic.fatigueRate` i sig (`tacticModifiers.ts:36-178`) härleds ur taktikval (tempo/mentality/press), aldrig ur `player.position`. En mittfältare och en ytterhalv tappar identisk fitness per match idag — Liws vittnesmål (mittfältare kan inte välja bort ett anfall, halvar kan) har inget mekaniskt motstycke. Rotation är en generisk syssla, inte en positionsfråga, exakt domens farhåga.

**Uppföljning (Jacobs fråga): kan positionsviktad fördelning bevara aggregatet?** JA, och risken är LÄGRE än "rör matchmotorns kalibrering" antog. Grepat `matchCore.ts` för `.fitness` — NOLL träffar. `fitness` läses aldrig av själva matchsimuleringen (mål-/chanssannolikheter, RNG-strömmen `B12`s byte-identiska krav skyddar). Enda konsumenten är `squadEvaluator.ts:42` (`effectiveFitness`), som räknar TRUPPKVALITET för lagval MELLAN matcher — en annan, mindre känslig kalibreringsklass än `matchCore` självt. Mekaniskt förslag: en `POSITION_FATIGUE_MULT`-tabell (mittfältare tyngre, ytterhalv lättare, övriga 1.0), NORMALISERAD mot den faktiska startelvans viktade snitt vid tillämpningstillfället (inte en global konstant) — garanterar att LAGETS totala/genomsnittliga fitnessförlust per match blir EXAKT densamma som idag, oavsett formation, bara omfördelad mellan individerna.

**BYGGD 2026-08-19 (`ee58474d`), Jacobs go givet i chatten.** `POSITION_FATIGUE_MULT` i `playerStateProcessor.ts` (Half 0.85, Midfielder 1.15, övriga 1.0), normaliserad PER FIXTURE mot startelvans egna snitt via `simulatedFixtures`s `homeLineup`/`awayLineup.startingPlayerIds` — inte matchCore, rör inte RNG-strömmen. 2 nya tester (`playerStateProcessorFatigue.test.ts`), stash-verifierade. Ett verkligt fynd under den verifieringen: en naiv jämförelse (mittfältarförlust > halvförlust över 20 seeds) passerade ~50% av gångerna ÄVEN UTAN viktningen (ren slump i `baseFitnessLoss`) — kalibrerat om till en tröskel (diff > 500 vid N=200 seeds; empiriskt ~113 utan effekten, ~1281 med den) för att göra testet icke-flaky i båda led.

**B11 RAPPORT LEVERERAD 2026-08-19 — frislag finns redan som egen händelse, men bara anfallssidan.** `freeKickInteractionService.ts` har ett fullständigt interaktivt system parallellt med hörnmekaniken: `FreeKickInteractionData`/`resolveFreeKick`/`FreeKickChoice` (`'shoot' | 'chipPass' | 'layOff'`). Alla tre är ANFALLARENS val — ingen försvarsval finns i typen. Den ihåliga muren är ett GENUINT NYTT valdimension (målvaktens/försvarets sida), inte en variant av något som redan finns — men den passar in i en redan byggd händelsestruktur snarare än att kräva en helt ny mekanik från grunden. Rapporterat, inget byggt (B11 var själv "rapportera", ingen order att bygga).

**Jacobs dom 2026-08-19: V2.** Ny försvarsdimension, hör hemma i `docs/V2_MATCHMOTOR_OCH_TAKTIK.md` under Målvakt, inte i sluttestkön — filat dit. B11 stängd i denna kö.

**B10 noterat, ingen kodåtgärd.** Ren textriktlinje för framtida matchtext/`B4`-beskrivningar (spelare som rör sig över zongränser är svårast att hantera) — inget för Code att grepa eller rapportera utöver att bekräfta att det är en textpost, vilket domens egen rad redan säger.

**B1 förstärkt.** Liw bekräftar Brodén oberoende och med samma ord (*"en lek med siffror"*), och lägger till strukturen: **två femmor plus målvakt** — bakre femman (två backar, libero, två ytterhalvor) och främre femman (mittfältare och anfallare i någon fördelning). Två oberoende elitkällor säger samma sak. Det är inte längre en tolkning.

**B5 utvidgad** med hela vokabulären ur alla sju delar: flipp, styrspel, vända hem, uppåkning, drop, översteg, åka i tomme, gå i djupet, fiska efter bollar, rättvänd/felvänd, hal, brytsäker, följsam, bra på tennis, placeringssäker, köldtålig, ryssvantar.

**B4 har nu en färdig mall.** Varje intervju slutar med "vem är svårast att möta", och svaret är alltid **ett namn plus ett skäl**: *"Han är riktigt hal."* · *"Han dyker upp varsomhelst och gör mål på allt."* · *"Extremt bra på att åka och fiska efter bollar."* Och **Edlund nämns av två oberoende spelare** — ett hot är allmänt känt, inte hemligt. Analysen ska peka konsekvent på samma spelare, inte slumpa.

**Rättelse till `DOM_ILLUSTRATIONERNA_2026-08-18.md`:** raden "Ingen sarg — låga stakethinder" är fel. Sargen finns, **låg och flyttbar** — man ser över den. Ersätt raden i stilbibeln.

### B12 · Kausal och taktisk metadata på befintliga matchhändelser (händelseberikning)

**Order:** `docs/CODE_INSTRUKTION_B12_BERIKNING_2026-08-19.md`. **Jacobs beslut:** alternativ B — berikningen nu, possession-motorn som eget V2-program efter releasen.

Låta `matchCore` skriva ner vad den redan vet vid varje chansskapande/bolltapp-event (orsak, ansvarig/inblandad spelare, numerärt läge, målets ursprung) — istället för att kasta informationen. **Ingen ny motor, inga nya sannolikheter, inga nya taktikdimensioner** — allt det är V2.

**Godkännandekriteriet (hårt, avsiktligt):** `npm run stress` före och efter måste ge **byte-identiskt** resultat på samma seed — målsnitt, hemmavinstandel, oavgjortandel, hörnmål, utvisningar, allt. Inte "inom toleransen". Skiljer sig något har berikningen läckt in i beräkningen och ska rullas tillbaka. Stresstest före och efter **varje** delsteg (2a/2c/2b), inte bara i slutet.

**Steg 1 — RAPPORT, bygg inget.** Tio frågor om vad `matchCore` redan vet men kastar (fråga 10 är kärnan: finns orsaken som lokal variabel vid beslutspunkten, eller måste den härledas i efterhand? En gissad orsak är sämre än ingen). Därefter en klassificering per föreslaget fält — **A** (befintlig info som tappas), **B** (deterministiskt härledbar utan RNG), **C** (kräver ny simulering/nytt beslut, hör till V2). **Bara A och B byggs.**

**Falsk kausalitet är den enda vägen posten kan skada:** ett påhittat `responsiblePlayerId` är fel på tre ställen samtidigt (spelarbetyg, `B4`, `O16`). `responsiblePlayerId` sätts bara när spelaren redan är part i det utlösande beslutet, aldrig för att hen "råkade vara närmast" tidigare.

**Ordning om steg 1 tillåter:** 2a (kausal metadata på chans/bolltapp) → 2c (`manpowerState`, minst riskabelt) → 2b (målets ursprung, kräver mest kunskap om motorns interna beslut).

**Låser upp:** `B5` (referat), `B4` (efteranalys) och `O16` (utvärdering — listan blir längre och korrekt istället för approximativ) läser samma beriktade data istället för att tolka verkligheten var för sig oberoende. Spelarbetyg som känner till negativa prestationer följer med gratis.

**STEG 1-RAPPORTEN LEVERERAD 2026-08-19.** Läst hela `matchCore.ts` (2078 rader) + `Fixture.ts`s `MatchEvent`. Två load-bearing fynd stickprovsverifierade mot koden (grep + radläsning) innan de skrevs in här: (1) `possessionId`/`sequenceId`/`previousEventId` finns noll träffar någonstans i `src/` — `allEvents` (`:569`) är en helt platt lista. (2) Kontringsmålets `slowest`-mekanism (`:1247-1258`) är precis så belagd som rapporten säger: `slowestRecovery`/`attackingDefenders`/`cornerRecovery < 50` räknas redan fram, `slowest.lastName` skrivs in i fritext-beskrivningen, men `slowest.id` skrivs ALDRIG till själva `MatchEvent`-objektet (`cg`, `:1258`, bär bara `minute/type/clubId/playerId/description`).

**Klassificeringstabell:**

| Fält | Klass | Motivering |
|---|---|---|
| `origin` | **B** | Ren omskrivning av redan avgjord `seqType` (`:993`) för de tre vägar motorn faktiskt går (öppet spel/omställning, hörna, straff). Täcker INTE `FREE_HIT` — icke-interaktiva/AI-mål från frislag skrivs aldrig av `matchCore` självt, bara av `MatchLiveScreen.tsx` (`:974-976`), utanför scope |
| `manpowerState` | **A** | `homeActiveSuspensions`/`awayActiveSuspensions` (`:523-524`, uppdaterade `:930-944`) är exakta heltal, redan lästa för powerplay-boost (`:949-950`) före varje sekvensval. Textbook-A |
| `tacticalFactors` | **B** | Taktikinställningarna (mentality/press/tempo/width/cornerStrategy/passingRisk) är känd konfiguration, redan lästa i `buildSequenceWeights` (`:655-699`) — ren etikettering, ingen simulering |
| `contributingFactors` | **B** | Redan beräknade aktiva modifierare (hot-hand `:849-850`, kvitteringsmomentum `:918-924`, 2H-läge `:866-878`, derby `:490-491`, väder `:472-480`, post-paus-urgency `:892-896`) — en lista över vilka som var ≠1.0 är ren avläsning |
| `primaryCause` | **C** (ett smalt A-undantag) | Belagd i EXAKT en pathway (kontringsmål efter hörna, `slowest`). Resten av motorn (attack/transition/halfchance/corner, `:1018-1263`) modellerar anfall/försvar som lagaggregat, ingen enskild orsak. Fältet skulle stå tomt för >95% av alla mål — klassat C för fältet i stort, per ordern ("osäker → C") |
| `responsiblePlayerId` | **C** (ett smalt A-undantag) | Samma mönster: A bara för kontringsmålet (`slowest.id`) och redan-levererat för utvisningar (`playerId` på Suspension-eventet). Motorns majoritetsväg pekar aldrig ut en enskild försvarsspelare — `defDefense`/`defGK` är laggenomsnitt (`squadEvaluator.ts:111-121`) |
| `involvedPlayerIds` | **B/C blandat** | Scorer+assist+GK redan `playerId`/`secondaryPlayerId` (A, redan levererat). Rikare identitet (`rusherIds`/`runnerId`/`kickerId`) finns BARA i de interaktiva services:na (`cornerInteractionService.ts` m.fl.), bara vid `mode:'full'` + managed-lag + tröskelvillkor — strukturellt frånvarande i `fast`-läge som täcker merparten av säsongens matcher. Klassat C för generell tillämpning. **Jacobs dom (B7 sammanslagen hit, 2026-08-19):** när detta fält byggs ska varje spelar-id åtföljas av spelarens SLOT/position vid just det ögonblicket (inkl. `'LIB'` i 5-3-2), inte bara den permanenta `PlayerPosition` — det löser B7 (liberon som syndabock) utan egen post |
| `sequenceId` | **C** | Bekräftat: ingen länkningsstruktur existerar. Kräver possession-motorn, redan Jacobs beslut till V2 |

**Sammanfattning:** byggbart nu utan att röra RNG/kalibrering — `origin`, `manpowerState`, `tacticalFactors`, `contributingFactors` (alla B eller A, rena avläsningar av redan beräknad state). `primaryCause`/`responsiblePlayerId` byggbara ENDAST för den smala, belagda kontringsmåls-pathwayn (`slowest`) — `undefined` överallt annars, aldrig ett generellt fält som gissar. `involvedPlayerIds` samma begränsning. `sequenceId` väntar helt på V2. Frilägen (fråga 7), passningstyper (fråga 6) och `FREE_HIT`-ursprung (fråga 5) kräver ny simuleringslogik eller finns bara i UI-lagret utanför `matchCore` — inte extraherbara utan ett nytt motorbeslut.

**Status:** `DOM GIVEN 2026-08-19 — BYGG` (`docs/DOM_B12_STEG2_2026-08-19.md`)

**Bygg fyra fält, i denna ordning:** `manpowerState` (A, renast — billigaste beviset på att berikningen inte läcker) → `tacticalFactors` → `contributingFactors` → `origin` (sist, kräver mest kunskap om `seqType`-vägarna). Rapportens föreslagna ordning är alltså vänd.

**`origin`:** skriv inte en enum som lovar fyra värden när motorn kan tre. Antingen tre, eller ett fjärde som aldrig sätts och är dokumenterat som sådant — `FREE_HIT` skrivs av `MatchLiveScreen`, inte `matchCore`.

**Bygg INTE `primaryCause`/`responsiblePlayerId`, inte ens för den belagda `slowest`-vägen.** Kopplingen är sann men täcker under fem procent av målen. Ett fält som är satt i en marginalväg och `undefined` i resten gör tre konsumenter systematiskt fel: spelarbetyget straffar bara den som var långsammast tillbaka efter en hörna, `B4` kan bara peka ut ansvar när målet råkade vara en kontring, `O16` får en kausal koppling som gäller en undantagsväg. **Systematiskt underrapporterat är värre än inte rapporterat.** Fälten får finnas i typen som optional med en kommentar om varför de är tomma — sätts av V2. Utvisningens `playerId` står kvar, den är ett komplett ansvar.

**`involvedPlayerIds` och `sequenceId`:** C, byggs inte. B7 väntar därmed på V2, som sammanslagningen redan säger.

**Ingen konsument byggs i samma svep.** `B5`/`B4`/`O16` läser fälten först när alla fyra finns — annars byggs tre ytor mot ett halvfyllt underlag.

**1/4 BYGGD 2026-08-19: `manpowerState`.** `{ownSuspended, opponentSuspended}` på `MatchEvent` (`Fixture.ts`), ren avläsning av `homeActiveSuspensions`/`awayActiveSuspensions` vid varje event-skapande-ställe i `matchCore.ts` (19 ställen — samtliga Goal/Assist/Save/Corner/Penalty/Suspension/Substitution, inklusive straff-triggern som är en egen closure och förlängningen som är en egen loop, båda ändå i samma lexikaliska scope). Utvisningens EGET manpowerState läses FÖRE dess egen increment (läget domaren faktiskt dömde i, inte ett steg senare). `primaryCause`/`responsiblePlayerId` tillagda i typen som `optional` med kommentar om varför de är tomma, exakt som domen kräver — sätts inte av `matchCore`.

**Byte-identiskt bekräftat:** `npm run stress` (10 seeds × 5 säsonger, 7627 matcher) före/efter — enda diffen i `season_stats.json` var `generatedAt`-tidsstämpeln. 3 nya tester (`matchCoreManpowerState.test.ts`), stash-verifierade.

**2/4 BYGGD 2026-08-19: `tacticalFactors`.** `string[]` på `MatchEvent`, ren etikettering av EGET lags taktikkonfiguration (tempo/press/width/cornerStrategy/passingRisk/mentality) — exakt de sex villkor `buildSequenceWeights` redan förgrenar på, ingen ny simulering. Wired via `sed` på 19 ställen + 1 manuell fix (Suspension-eventet missades av regexen, fångat av testsviten: `expected undefined to deeply equal []`). Byte-identiskt bekräftat. 2 nya tester (`matchCoreTacticalFactors.test.ts`).

**3/4 BYGGD 2026-08-19: `contributingFactors`.** `string[]` på `MatchEvent` — `hot_hand`/`derby`/`weather`/`second_half_mode`/`equalizer_momentum`, de motorförhållanden som faktiskt påverkade målchansen. `second_half_mode` slår medvetet ihop andrahalvlekläge och post-paus-urgency (samma `homeModeAttackMult`/`awayModeAttackMult`-variabel i koden, ingen separat spårning — att särskilja dem hade fabricerat precision motorn inte har). Egen closure för OT-loopen (`currentContributingFactorsOT`, bara `weather` möjlig där — ingen hot_hand/mode/equalizer-mekanik finns i förlängningen). Bytesloggningen vid steg 31 får `contributingFactors: []` — closure:n är inte i scope än på grund av TDZ i samma loop-varv, ett gissat värde hade varit fel. Byte-identiskt bekräftat (omkört efter att en första verifieringsrunda av misstag race:ade två bakgrundskörningar mot samma fil). 4 nya tester (`matchCoreContributingFactors.test.ts`), inklusive väder/derby/OT-särfall.

**4/4 BYGGD 2026-08-19, B12 STEG 2 KLAR: `origin`.** `'OPEN_PLAY' | 'CORNER' | 'PENALTY'` — inte `FREE_HIT` (frislagsmål skrivs av `MatchLiveScreen`, per domens begränsning). Satt på 19/22 event-ställen (bara skott-/målutfall — Suspension/Substitution har inget "ursprung", lämnas `undefined`). Genuin tvetydighet hittad och testad: `'Hörnslag'` (Corner-typ) skapas av BÅDA attack-grenen (avslaget skott → hörna, `OPEN_PLAY`) och corner-grenen (icke-målutfall, `CORNER`) — samma `MatchEventType` och beskrivningstext, olika ursprung, exakt vad fältet finns för att fånga. Post-cornerkontring klassas `OPEN_PLAY`, inte `CORNER` (målet kommer från kontringen, inte hörnleveransen). Byte-identiskt bekräftat. 4 nya tester (`matchCoreOrigin.test.ts`).

**Ingen konsument byggd.** `B5`/`B4`/`O16` läser inte de fyra nya fälten än — väntar på egen beställning, enligt domen.

**O20 — vilken punkt saknas, tio händelser, källa `DOM_VARSLET_KLASSIFICERING_2026-08-17.md`:**

| Händelse | Saknad punkt | Grupp |
|---|---|---|
| `politician_inclusion` | K5 — allt pekar uppåt, ingen kostnad | `O2` (dominans) |
| `icamaxi_visit` → `send_player` | K5 | `O2` |
| `supporter_away_trip_` → `subsidize` | K5 | `O2` |
| `survival_emergency_lotto` | K5 | `O2` |
| `q1` (mecenatDinner, bidrag) | K5 | `O2` |
| `politician_warning` (låg relation) → `board_contact` | K3 — ingen kr-summa, bara relationspoäng | `O5` (väntar) |
| `gentjanst` → `no`-valet | K3 | `O5` |
| `q2` (mecenatDinner, konkurrens) | K3 | `O5` |
| `ismaskin_offer` | K2 — träffar ingen spelare/funktionär, bara kassa+kommunstatus | Varken/eller — kräver ett namngivet mål, inte en ekonomi- eller dominansfix |
| `jubilee` (characterPlayerService) | K1 — ingen extern aktör, klubbens egen ceremoni | Varken/eller — kräver en extern namngiven aktör i texten |

**Fördelning:** 5 av 10 väntar bara på `O2` (lägg till en genuin nedsida i redan befintliga val — billigast, kräver ingen ny mekanik). 3 av 10 väntar på `O5` (kräver att ett kr-tal betyder något, pausad tills `U1`). 2 av 10 (`ismaglet_offer`, `jubilee`) är varken/eller — de kräver ett litet textbeslut (ge kravet en namngiven avsändare respektive ett namngivet mål) som varken `O2` eller `O5` löser åt dem, men som är billigt när Opus har tid.

**Körorder:** Opus avgör om de 5 K5-fallen ska räknas in i `O2`:s befintliga sponsor-först-ordning eller tas som en egen liten svit efter `O2`:s första leverans. De 3 K3-fallen rör sig inte förrän `O5` är olåst av `U1`. `ismaskin_offer`/`jubilee` kan textas när som helst, oberoende av båda.

---

# REVISIONER

| Sha | Vad |
|---|---|
| `2539fb2` | Live under lång tid. Tvåsäsongs- och långspelsauditen körde mot denna |
| `c5fa24f7` | main vid Skutskär-auditen — **byggde inte** |
| `b805a829` | GPT:s live-revision för åtgärdslistan. Fem commits bakom HEAD vid leverans |
| `0b325c10` | Stickiness-auditen. **Bekräftat:** 13 commits före `bd331755` (H-02 t.o.m. sig själv). Bisektat 2026-08-17 mot fyra oförklarade scendiffar — se ETAPP 1.4 |
| `52a1fc30` | Delbarhets- och tillväxtauditerna. Byggde |
| `6513d4ed` | Framgångsauditen. Byggde. 1828 tester, **ett skippat** (`mecenatReactivationBug` = K5). Nyast bekräftade revision |

---

# ARBETSMODELL

**Ordning:** blockerarna → etapp 1 → 2 → 3 → 4 → 6.1–6.3 → 5 → resten av 6. Etapp 7:s rapporter kan skrivas parallellt.

**Två bevis per post.** Simulering eller invariant plus mänsklig genomspelning. Grön pixelsnapshot bevisar inte att ett beslut gör ont.

**Innehåll får ett kontrakt** (O11) innan mer text wiras.

**Release är en verifierad sha.** Main, deploy och auditerad version ska gå att jämföra på en rad. Fem auditer har körts mot fyra olika revisioner och två av dem beskrev fel som redan var lagade.

**Uppdatera denna fil post för post. Skriv ingen ny.**

---

# MEDVETET UTANFÖR DEN HÄR FILEN

Så att ingen letar efter dem här och tror att de fallit bort:

**Release- och marknadsstrategin.** Rekrytera grundare i stället för trafik; använd befintliga communities (Discord, Reddit, bandyforum, gruppchattar); publicera berättelser i stället för featurelistor; knyt redaktionella utmaningar till bandyåret; köp ingen trafik före aktiveringsbevis. Beslutat som riktning, ligger i framgångsauditen och best-in-class-strategin. Inget av det är kö.

**De billiga valideringsexperimenten.** Tio manuellt perfekta berättelsekort; en statisk Slottsbron-utmaning; en manuell Bruksliga; följ-en-karriär-journalen. Kan köras parallellt efter Grind 0, kräver nästan ingen kod. Jacobs bord.

**Kvalitativ uppföljning med riktiga spelare.** Sex till åtta personer, pausa efter omgång 3, 11 och 22, fem frågor om vem de bryr sig om, vad de försöker uppnå, vad de riskerar, vilket beslut som ändrade något, vad de vill se nästa säsong. Bra stickiness är att svaren blir mer specifika över tid.

**Ryktesskedjan** (att ligan inte reagerar på dominans) — **avskriven** på nytt underlag. Tio säsonger gav placeringarna 1,1,1,3,2,1,2,1,3,3 och poäng 39→28. De två identiska säsongerna i tvåsäsongsauditen var slump. Ej samma sak som U6.
