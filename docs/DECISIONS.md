# DECISIONS

Arkitekturbeslut, i kronologisk ordning. Läses vid sessionsstart tillsammans med LESSONS.md.

Format per post: 4-5 rader. Problem, Beslut, Alternativ övervägt, Konsekvens. Skrivs när beslutet tas, inte retroaktivt.

Syftet är inte formalism. Syftet är att om 6 månader ha ett svar på "varför gjorde vi så här?" som inte är "det bara blev så".

---

## 2026-06-26 — Typografi-kanon: siffer-roll + citatvariant + ljus-på-mörk (konsolidering)

**Problem:** ~346 inline-siter konvergerar mot samma typografiska avsikt med småskilda värden (194 × `fontSize:9`, 152 × `fontFamily:display`). `ds-guard`-ratchetn fångade driften (+29/+24 över baslinjen) men guarden körs inte i build, så den drev tyst. Två luckor i designsystemet drev fram inline-värden: (1) sifferskalan hoppar från body 14px direkt till `.h-display-sm` 22px — score/kassa/portal-tal på 12–18px Georgia tabular saknade roll; (2) citat driftar 11/12/13px utan tät variant; (3) ingen ljus-på-mörk-variant för label/quote på läder/scen. Underlag: `design-system/briefs/Typografi-kanon-2026-06-26.html` (Designs sign-off-dokument).

**Beslut (Jacob, via kanon-underlaget):** `.h-label` = praxis **9/600/2.5px** (redan i kod — ingen ändring, emoji ligger som syskon-element inte i rollen). NY siffer-roll: `.h-num-sm` (12/700), `.h-num` (15/700), `.h-num-lg` (18/700), alla display + `tabular-nums`; **färgen sätts inline** (data: vi/dom, upp/ned, severity) — aldrig i klassen. `.h-quote-sm` (11px) som tät citatvariant. Ljus-på-mörk-modifierare `.h-label-light` (`--text-light-secondary`) + `.h-quote-light` (nytt token `--text-quote-light` #E6DDD0). Tillagt i `global.css` (sanning) + regenererad spegel.

**Alternativ övervägt:** Exakt-match-klass per inline-kombination (~23 nästan-identiska klasser) — avvisat, värre designsystem-skräp än inline. Svepande migrering per värde — avvisat, alla 9px är inte labels (mono-meta, tidsstämplar, tickers bor där också); mappning sker per ROLL.

**Konsekvens:** Klasserna är additiva (noll regressionsrisk; inget använder dem ännu). Site-migreringen (346 siter) är ett koordinerat pixel-pass, sammanflätat med MatchLive-omdesignen — mappa per roll, ljus-på-mörk från start, dynamisk färg/LED/live-tickers/badge-färger förblir inline. Lås-steg efteråt: sänk `ds-guard`-baslinjen, koppla in guarden i build. Implementeras av Code (iteration-tungt + pixel-verifiering).

---

## 2026-06-21 — Styrelsen konsolideras till en modell (KF4)

**Problem:** Styrelsen lever på två oberoende ställen som beskriver samma tre personer men aldrig länkas: `club.board` (`ClubBoard` = chairman/treasurer/member, var och en `{firstName, lastName, age, gender}`, från CLUB_TEMPLATES) och `game.boardPersonalities` (`BoardMember[]` = `{name, role, personality}`, slumpas från BOARD_PROFILES). Följder: (1) ordföranden har två olika namn beroende på kodväg — ArrivalScene/boardMeetingScene visar template-namnet, resolver visar boardPersonalities-namnet med `?? 'Margareta'`; (2) två typer heter `BoardMember`; (3) kön och personlighet kan inte användas ihop utan join-by-role, och kardinaliteten divergerar (eventResolver lägger ledamot på boardPersonalities, club.board är fast trippel).

**Beslut (Jacob):** Konsolidera till EN modell. `game.board: BoardMember[]` där varje medlem bär `{ id, firstName, lastName, age, gender, role, personality }`. Namn/kön/ålder seedas från managed-klubbens CLUB_TEMPLATES.board vid skapande (handskrivna namn vinner — de är narrativa tillgångar), personlighet slumpas in då. `boardPersonalities` och `ClubBoard`-trippeln utgår. Array stödjer eventResolvers tillägg naturligt. Spec: `docs/SPEC_KF4_STYRELSE_KONSOLIDERING_2026-06-21.md`.

**Alternativ övervägt:** Behålla två källor men länka med delad `id`. Avvisat — löser inte typnamnskollisionen eller dubbelnamnet, och tvingar varje läsare att joina. Berika `club.board`-trippeln med personlighet (behåll trippel-formen). Avvisat — trippeln klarar inte eventResolvers dynamiska fjärde ledamot.

**Konsekvens:** ~6 filer + migration + objektiv-signaturändring. BOARD_PROFILES degraderas till personlighetspool (namnen där slutar visas). Framtida styrelsekod läser `game.board`, aldrig `club.board` eller `boardPersonalities`. Implementeras av Code (iteration-tungt: migration av befintliga saves + stress-test).

---

## 2026-06-18 — Efterklang nemesis grindas till nästa motståndare

**Problem:** Efterklang-kortets nemesis-kandidat (spelare med ≥2 mål mot oss) väljs oavsett vem vi möter härnäst. Playtest: Robert Bergqvist (Slottsbron, 2 mål i cupen) visades före en Hälleforsnäs-match med ekot "Slottsbron igen. Det tar visst aldrig riktigt slut mellan er" — rématch-röst utan rématch. Ytan lovar något systemet inte håller.

**Beslut (Jacob):** Grinda nemesis-ekot så det bara visas när `n.clubId` är lagets nästa motståndare. Då blir "igen/mellan er" sant.

**Alternativ övervägt:** Behålla ambient (som journalist-/klack-ekona) och skriva om texten till minnesröst. Avvisat — nemesis biter mest som återmatch-eko, och grindning gör befintlig copy ärlig.

**Konsekvens:** Code-logik. Andra motståndares nemeser tystnar tills man möter dem. Hör ihop med promise↔consequence-principen (LESSONS 2026-06-18).

---

## 2026-06-18 — Veckans beslut: stubbarna byggs klart, skrotas inte

**Problem:** Veckans-beslut-etiketter lovar effekter motorn inte ger: `scout_opponent_corners` "−1 scout · +taktikinsikt" ger i koden bara `boardPatience +2` (kommentar: "No direct field for tactic insight, use proxy"); matchprep "+positionering" är en `noop`. Etiketterna är stubbar, inte beslut.

**Beslut (Jacob):** Bygg klart. taktikinsikt kopplas till det befintliga `opponentAnalyses`-systemet (detailed-tier via `generateDetailedAnalysis` för nästa motståndare) + faktisk scout-kostnad. positionering = enmatchs-effekt via `leadershipActions`-mönstret (`effect{stat,delta}` + `expiresRound`). Synlig effekt-kvittens.

**Alternativ övervägt:** Ometikettera ner till de verkliga effekterna (+boardpatience), eller skrota besluten. Avvisat — det vore att anpassa ner till stubben; mekaniken finns redan (opponentAnalysis), den blev bara aldrig kopplad.

**Konsekvens:** Code bygger + bekräftar (a) att detailed-analys är gated bakom scoutning, (b) att motorn läser leadershipActions under match. Opus skriver om etiketterna när effekterna är satta.

---

## 2026-06-18 — PortalBeat är flavor, inte handlingsyta

**Problem:** "Fönstret öppet"-beaten (`transfer_window_open`) var kryptisk ("vilket fönster?") och bara stängbar — playtest läste den som en död notis som borde länka till Transfers.

**Beslut:** Copyn namnger fönstret ("Transferfönstret öppet"). PortalBeat-kontraktet förblir text-bart + stängbart (flavor, inte action) — beats lovar inte handling, de sätter stämning. Att länka beaten kräver antingen ett nytt länk-fält i beat-systemet eller att notisen promotas till ett kort = systembeslut.

**Alternativ övervägt:** Lägga en Transfers-länk direkt på beaten. Avvisat tills vidare — bryter beat-kontraktet; med namnet på plats är "vilket fönster?" redan löst.

**Konsekvens:** #14 i ordern står som öppet beslut. Copy-fixen är gjord (portalBeats.ts).

---

## 2026-06-18 — fanMood blir egen mätare uppbyggd till orten-nivå (ej sammanslagen med pulsen)

**Problem:** fanMood är en schablon bredvid pulsens konstverk — enkel matchdelta (+8/+4/+1/−4/−8) + transfer-deltan (avvisat bud −5, rivalförsäljning −20), klamp 0–100, ingen mean reversion, inga diminishing returns, och oavgjort ger +1 (uppåtbias som ratchetar mot taket). Kartfynd 8 (fanMood-omarbetning) parkerades 2026-06-12 i väntan på Jacobs genomspelningsdata. Genomspelningen är nu gjord och rapporterad.

**Beslut (Jacob, 2026-06-18):** fanMood förblir en EGEN mätare och byggs upp till orten-paritet — mean reversion + diminishing returns, och oavgjort-deltat görs om från +1 till 0. Tre distinkta signaler behålls: orten (communityStanding), klack (supporterGroup.mood), fan (fanMood). Kartfynd 8 avparkeras.

**Alternativ övervägt:** Genomgång I:s omdesign C — fäll in fanMood som långsam "grundstämning"-undertext under pulsen, en mätare i stället för två. AVVISAT av Jacob — han vill ha de tre signalerna distinkta, inte sammanslagna.

**Konsekvens:** Reverteringskurvans siffror specas mot genomspelningsrapporten — gissa inte, pulsen löste det empiriskt och samma disciplin gäller här. Klacken (kartfynd 8a) är redan byggd; detta gäller fanMood (8b). Genomgång I redesign C läggs ned. Spec-arbetet är Opus näst, när rapporten är inläst. Reverteringen + diminishing returns + oavgjort-0 är tre rader i `narrativeProcessor`, lågt pris.

---

## 2026-06-14 — Delade presentationsprimitiver bor i `domain/format.ts`

**Problem:** Positionsetiketter och pengaformat hade tre+ kopior var (MV/B/YH/MF/**A** i `formatters.ts` vs MV/B/YH/MF/**FW** i `teamPhotoGenerator`; Målvakt/Back/… i 3 lokala långform-maps + en trasig prosa-variant i `rumorService` som alltid returnerade "spelare"; `formatValue` definierad både i `formatters.ts` och `eventFactories.ts`). Detta är samma klass som determinism-buggen: varje lokal kopia var rimlig, men tillsammans bröt de "en representation"-invarianten. Designs eget mönster ("global svep sitter halvgjort där route:n rörts") bekräftar att route-för-route degraderar.

**Beslut:** Kanoniska, rena primitiver (`positionShort`, `positionLong`, `formatValue`, `formatSalary`) bor i `src/domain/format.ts`. `presentation/utils/formatters.ts` re-exporterar dem så de ~19 befintliga import-ställena är oförändrade.

**Alternativ övervägt:** Behålla dem i `presentation/utils/formatters.ts`. Avvisat — domänen (`rumorService`, `eventFactories`) behöver dem och får ALDRIG importera presentation; enda stället en delad sanning kan bo som båda lagren når är domänlagret.

**Konsekvens:** Nya positions-/pengaformat ska aldrig definieras lokalt — importera från `domain/format` (eller re-exporten i `formatters`). En ny lokal map är en regression. LineupStep behåller medvetet sin PLURAL-map (section-headers: Backar/Ytterhalvar) — distinkt lexikal form, inte en konkurrerande stratum.

---

## 2026-05-06 — Stripes och klammer som genomgående visuellt språk

**Problem:** SPRINT_B2_STRIPES_AUDIT implementerade Mock 1 (ta bort 6 stripes, ersätt med tint/tag/🔥). Beslutet reverterades samma dag: stripes-borttagning skapade inkonsekvent visuellt språk och Mock 2 visade att stripes + kompletterande signaler fungerar bättre än antingen-eller.

**Beslut:** `borderLeft`-stripes är genomgående visuellt språk i appen — de tas INTE bort. De dubbla signalerna (stripe + tint på InboxScreen, stripe + tag-copper på Transfer/ActiveBids, stripe + 🔥 i GranskaForlop) behålls som kompletterande lager, inte ersättning. Formaliserat i `design-system/DESIGN-DECISIONS.md § "Stripes och klammer"`.

**Alternativ övervägt:** Mock 1-ansatsen (enbart tint/tag/emoji, inga stripes) — avvisat efter att Mock 2 visade att det tappade kopplingen till en konsekvent spatial vokabulär. Stripe + signal ger rikare information utan mer visuellt brus.

**Konsekvens:** Inga `borderLeft`-stripes tas bort utan explicit beslut per komponent. `.card-tap` (brightness hover/active) används på klickbara secondary cards. Danger-block-stripes (`--danger`) och severity-stripes (`--cold`/`--warm`) var aldrig i fara — de är dokumenterade undantag sedan tidigare. Mock 2-listan (`SeasonSummaryScreen`, `VictoryQuote`, `ClubMemory`, `CounterInteraction`, `FreeKickInteraction`, `SeasonSignatureSecondary`, `MatchHeader`, `CommentaryFeed`) adresseras i separata pass när kontexten är klar.

---

## 2026-05-06 — `arrivalDialogue.ts` som datakälla för Sture-repliker

**Problem:** `ArrivalScene.tsx` hade inline `STURE_VARIANTS`-array med 4 generiska placeholder-repliker. Texten var märkt `// TODO(Opus)` men låg hårdkodat i komponentfilen — ett Opus-jobb som aldrig skulle hittas utan att öppna tsx-filen.

**Beslut:** Extrahera till `src/domain/data/arrivalDialogue.ts` med `getStureLine(clubId: string): string`. Komponentfilen importerar `getStureLine`, props-gränssnittet får `clubId: string`. Datafilen är rätt ställe för bandysvensk text — inte komponentfilen.

**Konsekvens:** Opus kan skriva per-klubb Sture-repliker direkt i `arrivalDialogue.ts` utan att röra komponentkoden. Samma mönster som `matchCommentary.ts`, `rivalries.ts`, `specialDateStrings.ts`.

---

## 2026-05-06 — design-system/ på rotnivå, docs/DESIGN_SYSTEM.md arkiverad

**Problem:** Designsystemet levde i ett separat Claude.ai-projekt. Claude Code hade ingen direkt tillgång, varje session krävde att Opus citerade relevanta delar manuellt. Drift uppstod när lokala CSS-tokens ändrades utan att designsystemet uppdaterades.

**Beslut:** Hela designsystemet kopierat till `design-system/` på rotnivå. Ingångspunkt: `CODE-OPUS-INSTRUCTION.md`. `docs/DESIGN_SYSTEM.md` är nu stub som pekar dit. CLAUDE.md uppdaterat att peka på `design-system/CODE-OPUS-INSTRUCTION.md` istf `docs/DESIGN_SYSTEM.md`.

**Konsekvens:** Code kan läsa designsystemet direkt. Opus kan referera till specifika mockar i `design-system/preview/` och `ui_kits/` per komponent. Synk-risk kvarstår om `design-system/` och `src/styles/global.css` driftar isär — mitigeras av att `design-system/SYNC.md` uppdateras per HANDOFF-implementation.

---

## 2026-05-03 — Kvot-avvägning Opus/Code förtydligad i ARBETSFÖRDELNING

**Problem:** Tidigare regel sa att Opus fixar direkt om diff < 50 rader. Det är otillräckligt när en fix kräver iteration. En 5-raders konstantändring som behöver fyra stress-test-rundor för att verifieras blir fyra Opus-turns (hög kvot) i stället för fyra Sonnet-turns (låg kvot). Sessionen 2026-05-03 stod inför exakt det valet med P1–P5 i playtest-fix-paketet och ramverket gav inte vettig vägledning.

**Beslut:** ARBETSFÖRDELNING-sektionen i CLAUDE.md skriven om till två-frågor-modell:
1. Är det Opus-rollens jobb? (mock, spec, text, diagnos)
2. Kräver fixen iteration? (stress-test, build/test-loop, pixel-jämför)

Båda ja → Opus direkt. Iteration-tungt → Code, även för små diffar. Annars → spec.

Processfil-uppdateringar EFTER sprint-leverans (SPRINT_AUDIT, HANDOVER, KVAR-checks, LESSONS-historik) flyttade från Opus till Code — Code har sett implementationen, vet vad som faktiskt hände, och drar mindre kvot per iteration.

**Alternativ övervägt:**
- Behålla 50-raders-tumregel och bara komplettera med text om iteration. Avvisat — det är just smådiff-fall som sväller via iteration som är problemet, och tumregeln pekar fel där.
- Låta Opus alltid skriva specs för alla kodändringar och bara fixa text/mocks. Avvisat — underutnyttjar Opus när kirurgisk fix är iteration-fri (1 rad CSS), spec blir tyngre än problemet.

**Konsekvens:** Sessionen 2026-05-03 implementerade beslutet samma dag: P5 (1 rad CSS) görs av Opus direkt; P1–P4 (alla iteration-tunga) delegeras till Code via patchad v1-spec. KVAR/HANDOVER/SPRINT_AUDIT skrivs av Code efter leverans. Mocks i docs/mockups/ skrivs av Opus innan Code börjar (princip 4).

---

## 2026-04-27 (kväll) — Pixel-jämförelse som commit-blocker, en komponent åt gången

**Problem:** Scene-systemet levererades 2026-04-27 med felaktiga CSS-tokens på mörka bakgrunder. Code använde ljusa tokens (`--bg-elevated` = vitt, `--text-secondary` = mörk text, `--border` = ljust) på svarta scen-bakgrunder. Komponenter blev oläsbara. Pixel-jämförelse hade fångat felet men gjordes inte trots att CLAUDE.md princip 4 (Mock-driven design) föreskrev det. Jacob fick fixa i efterhand med Opus-granskning.

Rotorsaken är att "pixel-jämför mot mock" i CLAUDE.md var formulerat som *best practice*, inte *commit-blocker*. Code tolkade det som något som kan skippas när build passerar och tester grönas. Pixel-fel slipper alla automatiska kontroller — endast manuell jämförelse fångar dem.

**Beslut:** Förstärk princip 4 i CLAUDE.md med tre konkreta krav:

1. **En komponent åt gången.** Code skriver komponent N → pixel-jämför mot mock → bifogar skärmdump i commit → skriver komponent N+1. Inte hela komponentträdet och sedan verifiering i slutet.

2. **CSS-token-disciplin på mörka komponenter.** Mörka scen-bakgrunder (`--bg-deepdark`, `--bg-dark`) får INTE använda ljusa tokens som default. Dark-varianter ska användas. Detta är en explicit regel för att förebygga det specifika fel som uppstod.

3. **Pixel-jämförelse är commit-blocker.** Sprint är inte klar förrän SPRINT_AUDIT.md innehåller skärmdumpar för varje visuell komponent. "Verifierat i UI" som textcheckbox utan bifogad skärmdump räknas inte.

**Alternativ övervägt:**
- (a) CSS-lint-regel som mekaniskt blockerar ljusa tokens på mörka bakgrunder. Avvisat för nu — svårt att implementera korrekt utan att blockera legitima undantag (t.ex. vit text på mörk bakgrund är rätt). Kan implementeras senare om problemet kvarstår.
- (b) Visual regression testing (Percy/Chromatic-typ verktyg). Avvisat — överkurs för ett en-utvecklare-spel, hög setup-kostnad. Manuell pixel-jämförelse räcker.
- (c) Låta Opus granska varje komponent i playtest istället för att kräva det av Code. Avvisat — flyttar bara bördan, löser inte rotorsaken (Code lyder skickliga formuleringar mer än vaga bör:s).

**Konsekvens:** Code-sprintar med visuell komponent blir långsammare per komponent men levererar mer pixel-troget resultat. Risk för Code att tappa fart under en sprint men gain i kvalitet är värd det. Förstärkningarna gäller alla framtida specer — SPEC_PORTAL_FAS_1 och SPEC_KAFFERUMMET_FAS_1 uppdateras med samma krav i sina verifieringsprotokoll.

**Meta:** Detta är ett klassiskt fall av "instruktion utan tvingande mekanik". CLAUDE.md innehöll regeln men det fanns ingen mekanism som faktiskt stoppade en sprint som inte uppfyllde den. Förstärkningen är att göra det till commit-blocker — utan skärmdump i commit, ingen leverans. Även om det är oss själva som granskar skärmdumparna är kravet att de *finns* tillräckligt för att tvinga Code att faktiskt öppna mocken bredvid.

---

## 2026-04-27 — Mock-driven design som fjärde designprincip

**Problem:** Visuella beslut har historiskt drivit från målbild i implementation. Opus producerar fina idéer (i ord, ibland i skärmdumpar), Code implementerar dem ungefärligt — padding 14px istället för 16px, gradient "liknande" men inte exakt, layout som matchar på storleksordning men inte i detalj. Över tid ackumuleras detta till en app som känns generisk trots att avsikten var distinkt.

Session 2026-04-27 (Portal/inledning/moments) använde tre HTML-mocks innan specer skrevs. Mocken användes för två distinkta syften: (1) få Jacobs feedback på designen *innan* kod skrevs (innehålls-iteration på vågor som Sverige-bakgrund vs karta, klubbpiller-format, regions-ordning), (2) ge Code en konkret målbild att implementera mot. Resultatet är att ortsfelet (Karlsborg = Värmland) fångades innan spec, snarare än efter implementation.

**Beslut:** Inför princip 4 ("Mock-driven design") i CLAUDE.md DESIGNPRINCIPER. När en feature är visuellt eller interaktivt komplex — mock först, kod sen. Mocken är kanon, inte ungefär. Riktmärke: om designen tar mer än fem minuter att beskriva i ord — mocka.

Principen delas i tre ansvarsområden:
- **Opus** producerar interaktiv HTML-mock i `docs/mockups/` när feature är visuellt distinkt. Använder samma CSS-variabler som appen.
- **Code** läser mocken bredvid editorn, kopierar CSS-värden bokstavligen, pixel-jämför appen mot mocken innan commit, frågar Opus om mock-uppdatering om mocken inte funkar (ändrar inte själv).
- **Specen** länkar mocken explicit i "INNAN DU BÖRJAR", mappar varje komponent mot sin mock-vy, kräver pixel-verifiering i SPRINT_AUDIT.md.

**Alternativ övervägt:**
- (a) Bara sätta in mock-hänvisning i enskilda specer ad hoc. Avvisat — inkonsekvent, råkar bli förhalat när man skriver fort.
- (b) Ny separat fil MOCK_PRINCIPLES.md. Avvisat — fler filer = mer fragmentering, samma fel som motiverade DESIGNPRINCIPER-sektionen i CLAUDE.md från start.
- (c) Skarpare designsystem-dokument med exakta px-värden för varje element. Avvisat — designsystem fungerar för generella regler men inte för feature-specifika layouter.

**Konsekvens:** Visuella beslut görs i mock, inte i kod. Pixel-verifiering blir commit-krav för visuella komponenter. Code får en tydligare målbild och mindre tolkningsutrymme.

**Meta:** Principen föddes ur observation att 2026-04-27-sessionen producerade lite drift mellan mock och spec, vilket i tidigare workflows hade hamnat hos Code att tolka. Genom att mocka tidigt kom missarna fram tidigt (Jacob såg "din korv ser ut som Finland" i mocken — inte i appen efter sprint-leverans).

---

## 2026-04-26 (kväll) — Pre-spec cross-check räddade Sprint 27 fas C

**Problem:** Sprint 27-specen innehöll fas C "State of the Club-implementation" som planerade ny komponent + ny `seasonStartSnapshot`-lösning + ny PreSeasonScreen-rendering. Estimat 2-3h Code + ~30 min Opus-text.

**Vad som hände:** Fas A+B-audit (körd av Opus innan Code startade impl) avslöjade att State of the Club redan är fullt implementerad i PreSeasonScreen som "LÄGET I KLUBBEN"-card med pilar, färgkodning, invert-logik för tabellplats och dynamisk narrativ-text i fyra varianter. Bättre än den nya specen.

**Konsekvens:** Fas C utgår. Sprint 27-estimat reviderat från 7-8h till 5-6h.

**Lärdom:** Det här är första dokumenterade vinsten av designprincip 2 (pre-spec cross-check) som infördes 2026-04-26. Utan auditen hade Code byggt om existerande funktionalitet — inte bara slukad tid utan introducerat regression-risk. Principens värde är konkret: ~2-3h besparing på en singel sprint.

**Meta:** Det är värt att notera att specen var skriven *efter* att principen infördes — men auditen var där medvetet, som en gate. Specen behandlade princip 2 som en "audit-fas" snarare än en pre-spec-aktivitet. Det fungerade. Antagligen är "audit som första sprint-fas" en bra arbetsform för framtida THE_BOMB-paket där implementation-status är osaklart.

---

## 2026-04-26 — Kod-verifierad simulation som audit-alternativ

**Problem:** Sprint 26 levererade 65 kurerade strängar från fyra system, villkorade på skandalhändelser som triggar i specifika omgångar. Code rapporterade `1895/1895 grönt` + ren build och behövde stoppas eftersom det inte är audit enligt CLAUDE.md (kräver "verifierat i UI"). Men full manuell playtest per sprint är inte praktiskt; Jacob playtestar on-the-fly. Risk: sprintar markeras klara med teknisk-verifiering-bara.

**Beslut:** Inför kod-verifierad simulation som audit-alternativ i CLAUDE.md § SJÄLVAUDIT. Code skriver test-script som triggar villkor, dumpar output, kopierar in i SPRINT_XX_AUDIT.md. Krav: konkret output per spec-punkt, edge-cases verifierade, reproducerbart med seed.

**Alternativ övervägt:** (a) Manuell playtest som enda form — avvisat, ej realistiskt. (b) Build+tester som audit — avvisat, fångar inte runtime-buggar i text/lookup-logik. (c) Ny separat audit-nivå — avvisat, byråkratisk overhead.

**Konsekvens:** Text-/data-tunga sprintar får använda kod-simulation. Visuella/UX-tunga kräver manuell verifiering — markeras "awaiting playtest-verification" i KVAR.md.

**Meta:** Skiljer *teknisk verifiering* (inga kraschar) från *audit* (vad ser spelaren). Kod-simulation svarar på audit-frågan utan manuell playtest.

---

## 2026-04-26 — Tre designprinciper införda i CLAUDE.md (post-Sprint 25h, pre-Sprint 26)

**Problem:** Trots LESSONS.md, audits och självaudit-regel missade vi tre konkreta saker under april:
1. Strukturanalysen 2026-04-25 bedömde THE_BOMB till 40-50% klar. Faktisk siffra efter kodverifikation 65-75%. THE_BOMB 1.3 (kontextuell match-commentary) var fullt implementerad i `matchCore.ts` med en explicit `// Contextual commentary (THE BOMB 1.3)`-kommentar — ändå missad.
2. `pickSeasonHighlight()` i seasonSummaryService verkar duplicera funktionalitet av `summary.matchOfTheSeason`-fält. Möjlig redundans byggd för att ingen sökte efter befintlig implementation först.
3. Sprint 25h levererade 8 skandalarketyper. De bodde isolerat i inbox-rader och inbox-formatterade kafferum-quotes. Ingen integration till dashboard-kafferum, klack-commentary, presskonferens, eller motståndartränaren. Krävde Sprint 26 i efterhand.

Gemensam nämnare: dokumentation av *det som hänt* är bra. *Beslutsögonblicken* (innan kod skrivs, innan spec klubbas) är otillräckligt strukturerade.

**Beslut:** Tre nya principer i CLAUDE.md mellan DESIGN_SYSTEM och VERIFIERINGSPROTOKOLL, under rubriken "DESIGNPRINCIPER — LÄS FÖRE SPEC":

1. **Inbox-principen** — koppling som bara manifesterar sig som ny inbox-rad räknas inte som leverans. Riktig koppling = system A's händelse syns/ändrar text i system B's vy.
2. **Pre-spec cross-check** — innan ny feature specas, 60-sekunders grep efter befintlig implementation. Ingen träff → bygg. Träff → läs den först, beslut om återanvändning eller medveten ersättning.
3. **Integration-completeness-check** — när feature levererar narrativ data, lista vilka vyer som ska visa den. Specen ska adressera alla relevanta vyer eller medvetet välja vilka som lämnas utanför med skäl.

**Alternativ övervägt:**
- (a) Lägga in principerna som lärdomar i LESSONS.md. Avvisat — LESSONS.md är formaterad för buggmönster med rotorsak/fix/historik. Designprinciper passar inte det formatet.
- (b) Ny separat fil DESIGNPRINCIPER.md. Avvisat — fler filer = mer fragmentering. CLAUDE.md är redan obligatorisk vid sessionsstart.
- (c) Bara dokumentera missarna i en handover utan principer. Avvisat — handovers är dagsläges-rapporter, inte återkommande regler.

**Konsekvens:** Innan ny feature specas, kör 60-sekunders grep på huvudkonceptet (princip 2). När feature producerar narrativ data, lista alla vyer som logiskt borde visa den (princip 3). Vid kodgranskning, kontrollera att inga "kopplingar" är inbox-only (princip 1).

Framtida sprintar som följer detta mönster ska reverseras till specen om någon av principerna är överträdd. T.ex. om en spec föreslår "ny ekonomisk händelse-typ" utan att lista visningsvyer — Opus stoppar och frågar.

**Meta:** Beslutet är meta-beslut — beslut om hur framtida beslut ska fattas. Det är värt att notera att vi inte hade kunnat formulera principerna utan att först gjort missarna. Process-evolution är reaktiv, inte proaktiv.

---

## 2026-04-26 — Code+Opus-arbetsform för text-tunga sprintar (Sprint 27 prejudikat)

**Problem:** Text-tunga sprintar (kafferums-quotes, matchkommentarer, presskonferens) kräver dels korrekt kod-struktur, dels kurerad ton. Code skriver korrekt struktur men generisk text med LLM-reflexer (bekräftande svar utan substans, hårdkodade namn, "Det är så det ska vara"-mönster). Opus kan inte alltid bygga strukturen direkt.

**Beslut:** Dela i två pass. Code bygger struktur + stubs (platshållare med TODO-flaggor). Opus uppgraderar text i ett separat text-pass. Stubs ska vara funktionell text — inte `""` eller `"PLACEHOLDER"` — men kan vara generiska. TODO-flaggor märker vilka pooler som är under-kurerade.

**Konkret från Sprint 27:**
- Code byggde `youthCoachPool` (3 stubs) och `scoutPool` (3 stubs) med TODO-kommentarer
- Opus ersatte med 6+6 utbyten med tydliga tonregler:
  1. Inga bekräftande svar utan substans ("Det är så det ska vara")
  2. Inga hårdkodade spelar- eller klubbnamn
  3. 3-parts-dialog samma encoding-mönster som Sprint 26

**Konsekvens:** Vid framtida text-tunga sprintar — Code bygger struktur, lägger `// TODO: OPUS TEXT` på stub-pooler. Opus gör textpass separat. Inte parallellt — Opus behöver se hur Code encodade 3-parts-dialog för att matcha formatet.

---

## 2026-04-20 — `.btn-cta` istället för fyra inline-CTA:er (Sprint 22.5)

**Problem:** Fyra skärmar (Dashboard, BoardMeeting, PreSeason, StartStep) hade fyra olika implementeringar av skärm-avslutande CTA. Padding 18/16/14, fontSize 15/15/14/14, fontWeight 600/800/700/700, letterSpacing 2/1/0.3/1px. DESIGN_SYSTEM.md §1 saknade stor CTA-klass.

**Beslut:** Ny `.btn-cta` i global.css (14/16 padding, 14/700/1.5 font, 12 radius, uppercase, fullbredd). Kombineras alltid med `.btn .btn-primary`. Alla fyra skärmar migrerade.

**Alternativ övervägt:** Tre storlekar med medveten hierarki (hero / pulse / standard). Avvisat — ingen tydlig regel för när vilken skulle användas. Enklare modell vinner.

**Konsekvens:** Inline-styling av CTA-padding/fontSize/fontWeight är nu regression. `.btn-copper` finns kvar i global.css som legacy-dublett till `.btn-primary`, migreras vid tillfälle.

---

## 2026-04-20 — BottomNav döljs på ceremoniella transition-skärmar (Sprint 22.5)

**Problem:** BoardMeeting, PreSeason, SeasonSummary m.fl. är övergångsskärmar utan egen funktion. BottomNav visades synligt men klick poppade bara "SLUTFÖR PÅGÅENDE FLÖDE"-banner. Falska valet skapade förvirring (bild 5-buggen i playtest).

**Beslut:** `HIDDEN_PATHS`-lista i BottomNav.tsx döljer nav helt på: board-meeting, pre-season, season-summary, playoff-intro, qf-summary, champion, game-over. Skärmarna slutförs via sin egen `.btn-cta`.

**Alternativ övervägt:** (a) Overlay istället för fullskärmsskärmar (avvisat — ceremoniell tyngd passar inte modal-form), (b) Behålla nav men gömma banner (avvisat — roten är att valet inte finns, inte att bannern är ful).

**Konsekvens:** Nya transition-skärmar ska läggas till HIDDEN_PATHS. Nya nav-skärmar kräver att de *har* navigerbar funktion — annars hör de hemma som transitions.

---

## 2026-04-20 — Testrytm + refactor-disciplin + arkitekturloggbok i CLAUDE.md

**Problem:** Sprint 17-21 levererade med luckor. Sprint 22.3 expanderade scope självständigt. `.btn-copper` duplicerade `.btn-primary` oupptaget. Ingen löpande rytm för att fånga designdrift, scope-creep eller dubletter.

**Beslut:** Ny § "LÖPANDE KVALITET" i CLAUDE.md med fyra underdiscipliner: testrytm (vid commit/sprint-slut/release), refactor-disciplin (pausa vid scope > spec+2), arkitekturloggbok (denna fil), kod-granskning för nya services/entities/CSS-primitiver.

**Alternativ övervägt:** Formell ADR-process med "Context/Options/Decision/Consequences"-mall. Avvisat — enterprise-overhead för en-persons-projekt. Lightweight 4-rad-format vinner.

**Konsekvens:** Code och Opus ska köra testrytmen enligt schema. Alla framtida arkitekturbeslut loggas här i samma format. Scope-expansion över 2 filer kräver chat-bekräftelse från Jacob.

---

## 2026-04-20 — Stress-test baseline hittade BUG-STRESS-01 på första körningen (Sprint 22.6)

**Problem:** 10/10 seeds kraschade i `playerDevelopmentService.getArchetypeMultiplier` när `ARCHETYPE_MULTIPLIERS[archetype]` var undefined. Code's första hypotes var att `p.attributes` var undefined, Opus granskade stacktrace och fann att felet faktiskt var på `archetype`-nivån.

**Beslut:** Två-stegs-fix. Steg 1: guard i `getArchetypeMultiplier` som fall-back på default-multiplier om archetype saknas i mappen, med console.warn. Syfte: avblockera stress-testet så nästa bugg kan hittas. Steg 2: spåra rotorsaken via warn-output till den service som sätter ogiltig archetype.

**Alternativ övervägt:** Direkt rotorsaks-fix utan guard. Avvisat — stress-test-infrastrukturen blockeras då tills rotorsaken hittas, vilket kan ta flera omgångar. Defensive-guard är billigt och låter infrastrukturen fortsätta leverera värde under utredning.

**Konsekvens:** Alla nya fel med mönstret "TypeError: Cannot read properties of undefined (reading 'X')" där X är en property på en map-lookup ska granskas mot enum-key vs map-key-diskrepans först. Lärdom loggas i LESSONS.md.

**Meta:** Första skarpa fyndet från stress-test-infrastrukturen. Baseline-körningen levererade exakt det värde den byggdes för — en bugg som aldrig upptäckts i playtest eftersom ingen spelat 2+ säsonger igenom.

---

## 2026-04-20 — Managed club safety-net replenishment (Sprint 22.7)

**Problem:** BUG-STRESS-02: Stress-test avslöjade att managed club i auto-play scenario (ingen människa rekryterar) förlorar 5-9 spelare per säsong genom retirement + contract expiry, men aldrig får kompensation — replenishment-loopen skippar explicit managed club. Squad < 14 i säsong 2-3. Samma mekanism kan drabba passiva spelare i normalt spel.

**Beslut:** Vid squad < 14 spelare, fyll på akut till 14 med samma replenishment-logik som AI-klubbar, men lägre cap. AI-klubbar behåller cap på 20. Narrativ tolkning: "sportchefen signar några akutspelare" när tränaren varit passiv. Spelaren ska fortfarande känna press att rekrytera upp till full trupp (20) själv.

**Alternativ övervägt:** (a) Stress-test injicerar fake transfers — avvisat, maskerar riktig speldesign-brist. (b) Acceptera degradering — avvisat, kan inte ha < 14 spelare i bandy (11 startar + 3 reserver minimum). (c) Auto-förlänga kontrakt — avvisat, bryter intention att spelaren aktivt hanterar kontrakt. (d) Replenish upp till 20 som AI — avvisat, tar bort motivation för spelaren att rekrytera själv.

**Konsekvens:** Mekanismen är också en säkerhetslina för mycket passiva mänskliga spelare. Bör ses som safety net, inte en strategi — därför lågt tak (14). Framtida arbete: UI-notifikation när mekanismen triggas ("Sportchefen kontrakterade X spelare akut — trupp var farligt tunn"), och säkerställ att akut-signade spelare är lågpotential (inga stjärnor på rea).

---

## 2026-04-20 — Position-aware replenishment (Sprint 22.7)

**Problem:** BUG-STRESS-02 (sekundär): `replenishPositions[i % 8]`-cykeln `[GK, DEF, DEF, DEF, MID, MID, FWD, FWD]` gav fel fördelning när klubb behöver färre än 8 spelare. Ett lag som behöver 5 fick positionerna 0-4 = GK/DEF/DEF/DEF/MID — noll forwards. AI-klubbar kraschade pga positioncoverage-invariant.

**Beslut:** Ersätt cyklisk arrayselection med position-aware logik. Räkna aktuell composition per position, definiera minimum (GK=2, DEF=5, MID=4, FWD=4 = 15 totalt), fyll positioner under minimum först, sen prioritera minst fyllda.

**Alternativ övervägt:** (a) Bara omordna arrayen så positioner sprids ut — avvisat, kvar samma bias när mindre antal fylls. (b) Slumpad selection — avvisat, ger ingen garanti för minimum-täckning. (c) Hårdkodad formel typ "2 GK, rest fördelas" — avvisat, mindre flexibel än räkna-befintligt-approach.

**Konsekvens:** Alla replenishment-anrop garanterar nu positiontäckning. Position-minimums kan senare justeras per taktikstil (t.ex. offensiva lag vill ha FWD=5). Funktionen `pickPositionToFill(players)` blir återanvändbar för framtida features (AI-transfer-prioritering, scouting-rekommendationer).

**Resolution (Sprint 22.8):** Sprint 22.7-fixen exit:ade om `squadSize >= target`, vilket missade klubbar över target med position-obalans via AI-transfers. Fix: dubbel trigger `needsMore || needsRebalance`. `needed = max(size-shortfall, position-shortfall)`. `positionCoverage: 0 violations` i 10×10.

---

## 2026-04-20 — Graderad konkurs-mekanik för managed club (Sprint 22.9)

**Problem:** BUG-STRESS-05: Finances kan gå under -1 MSEK utan att någon mekanism triggar. Spelet fortsätter som om allt är normalt. I riktigt bandy-Sverige skulle klubben för länge sen ha försatts i konkurs av tingsrätten och tränaren sparkad.

**Beslut:** Tre trösklar för managed club:
- **< -500 000 kr:** varning via inbox (en gång per säsong, inte per omgång). "Klubben närmar sig farlig nivå."
- **< -1 000 000 kr:** tvingad licens-denial via existerande mekanism (3 spelare lämnar, 60% sponsorer bort, rykt-sank). Fortsätter spela.
- **< -2 000 000 kr:** game over. `managerFired = true`, `pendingScreen = GameOver`. Spelet är slut.

AI-klubbar: ingen mekanism. Kan ha negativ ekonomi utan konsekvens. Game-design > realism här — AI-konkurser skulle komplicera tabell, schedule, transfers utan nämnvärd spelvärde.

**Alternativ övervägt:** (a) Binärt game-over vid -1 MSEK — avvisat, ingen varningssignal till spelaren före dödsstöt. (b) Mjuk game-over med "sparkad men få chans igen nästa säsong" — avvisat, bryter nästa säsong-kontinuitet. (c) AI-klubbar konkursar också — avvisat, kräver relegation-mekanik som inte finns.

**Konsekvens:** Managed club har nu hard floor på -2 MSEK. Stress-test kan inte längre driftas obegränsat i negativ ekonomi — kommer triggar game-over och säsongen avslutas. Invariant `finance` i stress-test bör ändras: acceptera managed-finances ned till -2 MSEK som giltig, inte som bugg.

---

## 2026-04-20 — Cup-matcher cancelleras aldrig pga väder (Sprint 22.10)

**Problem:** BUG-STRESS-04: Väder-avbokning satte `status="postponed"` på cup-matcher. Ligamatcher klarar postponed (poeng väntar, matchen spelas senare), men cup-knockoutmatcher kräver `winnerId` för att bracket ska fortsätta. En postponed cup-match orphanar bracketen permanent: matchen spelas aldrig om, winnerId förblir null, bracket markeras aldrig completed. Diagnos via stress-test failure-dump bug04-seed5-s10.

**Beslut:** Cup-matcher cancelleras aldrig pga väder. Explicit `&& !fixture.isCup` i väder-cancel-villkoret i matchSimProcessor.ts. Väder påverkar fortfarande commentary, chanser, attendance — bara inte cancellation.

**Alternativ övervägt:** (a) Omschemalägga postponed cup-match till nästa lediga matchday — avvisat, kräver schedule-refactor, scope för stor. (b) Postponed cup = forfeit för ett av lagen — avvisat, känns oschyst mekaniskt. (c) Ta bort väder-cancel helt — avvisat, ligamatcher drar nytta av väder-dramatiken.

**Konsekvens:** Cup-matcher spelas alltid oavsett väder. Narrativt tolkat som "arrangören sätter tak / flyttar till alternativ arena / skrapar isen extra". Om vi i framtiden vill implementera realistisk omschemaläggning är det en egen sprint. Mer generellt: varje ny feature som inför state-transitions på fixtures måste fråga "hur hanteras detta i cup-knockout?" (se LESSONS.md #12).

**Meta:** Sista stress-test-buggen. Efter Sprint 22.10 har dagens infrastruktur-arbete levererat: design-audit + stress-test + tre fixar (22.5, 22.6, 22.7) + fyra bugfixes (BUG-STRESS-01 till -05, minus -02 som var två buggar) — från "kraschar i säsong 2" till "100/100 säsonger på 10×10" på en dag.

**Resolution (Sprint 22.9):** Implementerat. `evaluateFinanceStatus(finances)` i `economyService.ts` — tre trösklar, ingen once-per-season-logik (hanteras av call site). `financeWarningGivenThisSeason` i SaveGame reset varje säsongsstart. Invariant uppdaterad: −2M utan managerFired = crash; −2M med managerFired = warn. Stress-test: `finance: 0 crashes` i 10×10. 99/100 säsonger avklarade.

**Resolution (Sprint 22.6):** Rotorsak identifierad: `seasonEndProcessor.ts:890` och `matchSimProcessor.ts:35` satte `archetype: 'TwoWaySkater' as Player['archetype']` — PascalCase literal. Enum-värdet är `'twoWaySkater'` (camelCase). Fix: importerade `PlayerArchetype`, ersatte raw-sträng med `PlayerArchetype.TwoWaySkater`. console.warn borttagen. Defensiv guard kvar.

---

## 2026-04-20 — Kalibreringsinfrastruktur: stress-test loggar matchstats, analyze-stress jämför mot bandygrytan (Sprint 24)

**Problem:** Playtest gav 13-14 mål/match. Target enligt bandygrytan 9.12. Ingen mätinfrastruktur för att isolera var felet låg — calibrate.ts mätte neutral lab-motor (10.3, inom tolerans), stress-testet mätte bara invariants/krascher, ingen loggning av säsongs-aggregat från live-motorn med alla modifiers aktiva.

**Beslut:** Utvidga stress-test med `stats.ts` som loggar `season_stats.json` per match (goals[], suspensions[], cornersHome, etc). Ny `analyze-stress.ts` jämför mot `bandygrytan_detailed.json.calibrationTargets.herr`. Etablerar pipeline: `npm run stress && npm run analyze-stress` → ger klara siffror, inte magänsla, för alla efterföljande motor-sprintar.

**Alternativ övervagt:** (a) Fixa calibrate.ts istället — avvisat, den kör isolerat utan modifier-stacking. (b) Mäta direkt i browser via devtool — avvisat, kan inte köra 7000+ matcher per session. (c) Bara öka playtest-mängden — avvisat, statistisk brus på 10 matcher = ±1 mål standardavvikelse.

**Konsekvens:** Varje motor-sprint har nu ett numeriskt target, inte ett spelkänslo-target. Sprint 25a-d specades med specifika förväntade utslag per ändring. Första mätrapporten (SPRINT_24_FIRST_MEASUREMENT.md) blev referenspunkt som alla efterföljande mättes mot. Infrastruktur är additiv — invariants-checkningen rörs inte.

---

## 2026-04-20 — Sprint 25 splittras i delsprintar per rotorsak (Sprint 25a-d-serien)

**Problem:** Sprint 24-mätningen avslöjade fem gap mot bandygrytan. Att ändra flera saker samtidigt gör det omöjligt att veta vilken ändring som gjorde vad. Dessutom första hypotes: gap 1+2 hänger ihop, gap 3+5 hänger ihop, gap 4 kan lösa sig själv.

**Beslut:** Splittra Sprint 25 i fyra delsprintar, en rotorsak per sprint:
- **25a:** Comeback-dynamik (gap 1+2, parameterjustering i matchCore)
- **25b.1:** Straff till egen trigger (del av gap 5, strukturell separation)
- **25b.2:** Utvisnings-basfrekvens (gap 3, höja wFoul+foulThreshold-multiplikator)
- **25d:** Fas-konstanter (verifiera PHASE_CONSTANTS mot slutspelsdata)

Mellan varje delsprint: mät via analyze-stress, läs rapporten, avgör om nästa sprint behöver justeras.

**Alternativ övervagt:** (a) En enda Sprint 25 med alla fem gap — avvisat, kan inte mäta enskild effekt. (b) Bara Sprint 25a, skippa straff+utvisning — avvisat, htLeadWinPct-gapet är för stort för att bara comeback-justering ska lösa det. (c) Sprint 25 som Big Bang-refaktor av hela matchmotorn — avvisat, för stor risk.

**Konsekvens:** Etablerar kulturen "en rotorsak per sprint, mät mellan". Varje sprint har tydliga förväntade mätutslag i speccen. Om utslaget avviker från förväntan → pausa, analysera, justera. Sprint 25a upptäckte managed-grinden (LESSONS #15) genom att mätutslaget var <1/3 av förväntat — det hade försvunnit i ett Big Bang.

---

## 2026-04-21 — Straff som separat fenomen från utvisningar (Sprint 25b.1)

**Problem:** Motorn triggar straff som bi-produkt av `seqType === 'foul'`: 70% av fouls är i attack-zon, 60% av dem blir straff → 42% av alla foul-sekvenser blir straff. Bandygrytan säger straff utgör ~5.4% av mål och utvisningar är ~3.77/match — straff är ungefär 13% av utvisnings-liknande incidenter, inte 42%. Dessutom: om vi höjer foul-frekvensen 9x för att nå utvisnings-target (Sprint 25b.2) höjs straff också 9x, vilket överskjuter.

**Beslut:** Separera straff till egen trigger i `seqType === 'attack'`-sekvensen. Straff-sannolikhet bygger på chanceQuality (nära-målchanser), inte på discipline. Period- och spellägesmodifierare från SCORELINE_REFERENCE.md (ledning +12%, peak 75-89 min 1.35x). Fouls i foul-sekvensen blir nu 100% utvisningar, inte 30%.

**Alternativ övervagt:** (a) Behålla straff i foul-sekvens men sänka sannolikheten — avvisat, kopplingen mellan straff- och utvisnings-frekvens blir kvar, inte skötselmässigt separerbara. (b) Trigga straff i corner-sekvens också — avvisat tills data visar att det behövs. (c) Separera först efter 25b.2 är klar — avvisat, kopplingen stör 25b.2-kalibreringen.

**Konsekvens:** Straff och utvisningar kan nu kalibreras oberoende. `isPenaltyGoal`-flagga på Goal-event för korrekt tracking. Sido-effekt: utvisningar 3x (från att alla foul-sekvens-fouls blir utvisningar) — det förväntas lyfta `avgSuspensionsPerMatch` 0.47 → ~1.4, förberäknat i speccen. Återstående gap till 3.77 hanteras i 25b.2.

---

## 2026-04-21 — Mini-edits direkt av Opus istället för Code-sprint (25b.2.2 + 25d.2)

**Problem:** Sprint 25d-mätningen avslöjade två konstanta-nivå-problem: `avgSuspensionsPerMatch` 3.23 (0.07 under spec 3.3), KVF `homeWin%` 50.8% (gap 9.5pp). Båda lösbara med enkla konstant-ändringar. Att skriva hela Code-sprintar för två rader kod är dyrt i credits.

**Beslut:** Opus gjorde båda ändringarna direkt via workspace:edit_file. Två rader i två filer. Sedan får Code bara köra stress-mätning för att verifiera.

**Alternativ övervagt:** Två separata Code-sprintar. Avvisat — spec+implementation+audit-cycle för en-rads-ändringar är pattern-tvingande overhead.

**Konsekvens:** Etablerar mönstret: enkla konstant-ändringar under 5 rader görs direkt av Opus, mätning sker i nästa Code-körning tillsammans med annat arbete. Sparar credits. Viktigt: Opus loggar ändringar i KVAR.md och DECISIONS.md (som nu) så spårbarhet bibehålls.

---

## 2026-04-22 — Centraliserad save-logik via store actions (Cursor-refaktor)

**Problem:** `saveSaveGame()` anropades direkt i komponenter (`TransfersScreen`, `GameHeader`) med rå `.catch(console.warn)` — ingen felhantering synlig för användaren, business logic (renewContract, signFreeAgent, listPlayerForSale) inlinead i skärm-filen, `useGameStore.setState` anropades direkt från komponenter och kringgick actions-lagret.

**Beslut:** (1) `persistGameSnapshot()` i `gameStore.ts` — enda platsen för explicit save, returnerar `{ success, error }`. (2) `persistAutosave(game, context)` i `gameFlowActions.ts` för advance-flödet. (3) Ny publik `saveGame()` action. (4) `renewContract` / `signFreeAgent` / `listPlayerForSale` flyttade från inline-kod i `TransfersScreen` till `transferActions.ts`. (5) `markCoachMarksSeen` och `updateMatchMode` async med `SaveActionResult`.

**Alternativ övervägt:** Behålla komponent-nivå save men lägga till error-toast — avvisat, löser inte att business logic sitter i fel lager.

**Konsekvens:** Inga fler direkta `saveSaveGame`-importer i presentation-lagret. Toast i `GameHeader` visar nu fel-state (röd) om save misslyckas. `useGameStore.setState` direkt från screens reducerat till tre läs-only `getState()`-anrop i sim-loopar (legitimt mönster).

---

## 2026-04-22 — getState() i sim-loopar är legitimt, setState i screens är inte det

**Problem:** Code review flaggade inkonsekvent state-mutation. Distinktionen var oklar.

**Beslut:** `useGameStore.getState()` i event-handlers och sim-loopar är korrekt Zustand-mönster för att undvika stale closures — inte regression. `useGameStore.setState()` direkt från screen-komponenter är inte okej — kringgår actions och deras invarianter. Kvarvarande `getState()`-läsningar i `DashboardScreen` (sim-loop) är avsiktliga och ska lämnas.

**Konsekvens:** Regel: mutera aldrig state direkt från screens. Läs via `getState()` i callbacks är OK.

---

## 2026-04-25 — Verifiera calibrationTargets mot rådata istället för att sprintplanera motorsprint (Sprint 25-HT)

**Problem:** `analyze-stress.ts` rapporterade `htLeadWinPct` motor 82-83% vs target 46.6% — ett gap på ~35pp som såg ut som ett allvarligt motorfel. Tre möjliga hypoteser: (a) motorn är för tuff på ledande lag, (b) trailing-boost räcker inte, (c) target-värdet är fel.

**Beslut:** Verifiera target-värdet från rådata INNAN kod rörs. Räknade om `htLeadWinPct` direkt ur `bandygrytan_detailed.json` (1124 grundseriematcher): 78.1%. Target-värdet 46.6 var `homeHtLeadFraction` (andel matcher hemmalaget leder vid halvtid, ~47%) som felaktigt lagrats under nyckeln `htLeadWinPct`. Fix: uppdatera JSON, inte motorn. Motor 80.4% = +2.3pp mot korrekt 78.1% — acceptabelt gap, ingen motorsprint.

**Alternativ övervägt:** Sprintat direkt på hypotes (a) eller (b). Avvisat — verifiering av target är billig (en skript-körning) och bör alltid ske före motorändring.

**Konsekvens:** Ny regel i LESSONS.md #21: innan motorsprint planeras för ett specifikt target, räkna om det måttet från rådata och jämför mot stored target. Om diff >2pp — fix JSON-filen. Target-audit dokumenterad i `docs/findings/REVISION_2026-04-25_calibration_targets.md` (13 av 14 targets korrekta). `homeHtLeadFraction: 46.6` tillagt som eget fält. Sprint 25b/25e/25f behövde inte rullas tillbaka — de fixade korrekta motorproblem mot korrekta targets.

---

## 2026-05-21 — Quicksim och live delar motor; resultatskillnaden är halvtidsjusteringar (avsedd)

**Problem:** Playtest-känsla att man "förlorar oftare" när man snabbsimmar en match i stället för att spela live. Misstanke: lägena divergerar — kanske får managed club AI-genererad uppställning i quicksim.

**Beslut:** Verifiera med paritetstest före antagande. N=1000 matcher genom `simulateMatch` (quicksim) vs `simulateMatchStepByStep` (live) utan interaktiva justeringar → statistiskt likvärdiga snitt. Quicksim använder `managedClubPendingLineup` korrekt. Den upplevda skillnaden är att live-läget tillåter halvtidsbeslut/byten/taktikjustering som ger en reell fördel. AVSETT — live belönar närvaro.

**Alternativ övervägt:** Sprinta på "quicksim-bug" direkt. Avvisat — paritetstest är billigt och visade att motorn var oskyldig (samma mönster som calibration-target-fyndet 2026-04-25).

**Konsekvens:** Ingen motorfix behövd. "Sim förlorar oftare" ska INTE återupptäckas som bug — det är designvalet att halvtidsinteraktion är värd något. Att hålla öga på: fördelens STORLEK. Om quicksim känns som en straffknapp snarare än ett tidssparande val är balansen fel — men det är då en justering av halvtidseffekternas styrka, inte ett motorfel. Parity-test ligger i `matchEngineParity`-testet (B10 T1).

---

## 2026-05-22 — "Simulera resterande säsong"-knappen återställd till PortalScreen (C-SD3)

**Problem:** `⏩ Simulera resterande säsong` försvann 3 maj 2026 när `DashboardScreen.tsx` (1208 rader) raderades som dead code (commit 4a41789). Handlern `simulateRemainingStep` levde kvar i storen; bara UI-ytan föll bort. Funktionen hade funnits sedan spelet lanserades i januari. Upptäckt av Jacob 2026-05-22.

**Beslut:** Knappen återställd till `PortalScreen.tsx` som ghost-knapp ovanför spela-CTA, villkorad av `canSimulateRemaining` (≥12 ligarundor spelade, inget slutspel, nästa managed ej cup, ingen HalfTimeSummary). Den hör hemma i entry-point-skärmen, inte i en separat dashboard. Villkoret verifierades mot originalimplementationen i git-historiken och är identiskt (inklusive sekundärsortering som prioriterar ligarundor vid matchday-kollision med cup).

**Alternativ övervägt:** Skapa ny dedikerad vy. Avvisat — PortalScreen är nu permanent entry point; en separat vy skulle ge samma dead-code-risk igen.

**Konsekvens:** När en skärm raderas som dead code ska dess unika CTA:er och handlerfunktioner inventeras mot den nya entry pointen INNAN radering. En funktion kan dö tyst även när dess handler lever kvar i storen. Lärdom tillagd i LESSONS.md.

---

## 2026-06-08 — Spak B förbrukar ett av tre taktikbyten (gatad)

**Problem:** Spak B (sent matchningsval, feed-kort) applicerar en sen hållning via samma `applyQuickTactic`-väg som det manuella taktikbytet. Frågan: ska den ha en egen budget eller dela de tre manuella bytena?

**Beslut (Jacob, 2026-06-08):** Delar budgeten — Spak B förbrukar ett av tre taktikbyten. Kortet gatas så det bara tänds när minst ett byte finns kvar (`tacticChangesUsed < MAX_TACTIC_CHANGES`), så knappen aldrig no-op:ar. Amber-glow på taktik-knappen behålls när kortet är tänt (B3) — taktikskifte ÄR det relevanta handtaget sent (brief §3).

**Alternativ övervägt:** Egen budget för Spak B (separat från de tre manuella). Avvisat — återanvänder mentality-vägen rakt av, ingen ny budget-state, och kopplar det sena valet till samma resurs som manuella skiften (en sen hållning ÄR ett taktikbyte).

**Konsekvens:** Spak B är en auto-framtvingad variant av det manuella taktikbytet, inte en gratis extra-spak. Om det känns snålt att en prompt äter ett manuellt byte är justeringen att ge Spak B egen budget — inte att ta bort gaten (gaten skyddar mot tyst no-op).

---

## 2026-07-13 — Sim-efter-live-känslan (PT-3), sekvenstest: ingen mätbar effekt, motorn oskyldig

**Problem:** Jacob rapporterade för andra gången att en simmad match direkt efter en live-match nästan alltid förloras (PT-3, BACKLOG.md). B10 (2026-05-21) hade stängt samma känsla, men det testet (`matchEngineParity`, N=1000) mätte ISOLERADE matcher oberoende av varandra — aldrig SEKVENSEN live→sim med samma spelares tillstånd buret vidare. Fick inte avfärdas som "känt" en andra gång utan ett test som faktiskt mäter sekvensen.

**Kodspårning innan testet skrevs:** `saveLiveMatchResult` (matchActions.ts) skriver inga spelarfält alls (fitness/sharpness/form/moral/skada). Den faktiska mutationen sker i `applyPlayerStateUpdates` (playerStateProcessor.ts), anropad från `roundProcessor` för BÅDA live och sim via samma `advanceToNextEvent`-väg — identisk formel, identisk lineup (matchens pre-match-uppställning, inte per-minut-spårad). Halvtidsjusteringens moral/sharpness-boost i `MatchLiveScreen` (`handleApplyTactic`) appliceras bara på lokala kopior som föder den simulerade andra halvlekens händelser — aldrig dispatchad till storen, alltså aldrig persisterad. Slutsats innan siffrorna ens kördes: domänlagret har ingen mekanism som skulle kunna bära en live→sim-specifik effekt. (Bifynd, inte åtgärdat här: `MatchLiveScreen.tsx` seedar sin motor med `Date.now()` — bryter projektets seed-disciplin, men påverkar inte denna slutsats eftersom state-skrivningen är oberoende av var seedet kom ifrån.)

**Testet:** Nytt skript `scripts/live-sim-sequence.ts` — N=1000 oberoende säsonger. Match 1 tvingas till vinst via rejection sampling (riktig motorsimulering, ingen handpåklistrad poäng — upprepa med nya sub-seeds tills en äkta vinst uppstår), sedan match 2, 3, 4 simuleras normalt i rad mot lagets faktiska nästa ligamotståndare. 976/1000 sekvenser lyckades (24 nådde inte tak på win-forcing-försök inom gränsen, ingen bugg — bara otur).

**Resultat:** Match 2 (n=976): snittpoäng 0.954, snitt-målskillnad +0.006. Match 3–4 (n=1952): snittpoäng 0.993, snitt-målskillnad −0.053. Welchs t-test: poäng t=−1.090, p=0.28; målskillnad t=0.583, p=0.56. Motståndarstyrka jämförbar mellan positionerna (snitt-reputation 61.2 vs 60.9 — "jämförbara motståndare" höll). De två måtten pekar dessutom åt OLIKA håll (poäng svagt mot "match 2 sämre", målskillnad svagt mot "match 2 bättre") — signaturen för brus, inte en riktad effekt.

**Beslut:** Ingen motorändring. PT-3 stängs i BACKLOG.md. Känslan är sann som UPPLEVELSE (halvtidsinteraktionens reella fördel, se B10) men existerar inte som en mätbar sekvensbugg i domänlagret.

**Alternativ övervägt:** Avfärda direkt som "redan stängt i B10". Avvisat — Jacob hade explicit rätt i att B10:s test mätte fel sak (isolerat, inte sekvens); en andra avfärdning utan nytt bevis hade upprepat samma metodfel.

**Konsekvens:** `scripts/live-sim-sequence.ts` är permanent tooling (samma status som `live-vs-sim.ts`/`compare-modes.ts`) — kör om vid framtida motorändringar som rör fitness/sharpness/form om känslan dyker upp igen. Om B10:s halvtidsfördel någon gång känns för stor är det en balansjustering av halvtidseffekternas styrka (se B10:s egen konsekvensrad), inte en motorbugg att leta efter i sekvensen.

---

## 2026-08-17 — `deferredDecisions` fick samma wholesale-clear som `pendingEvents` vid säsongsrollover

**Problem (Jacobs order):** "rensa alla event med avslutad säsong vid rollover, inte bara kvart och semi." Den kända mekanismen var `staleEventIds` i `playoffProcessor.ts` (rensar `playoff_qf_`/`playoff_sf_` ur `pendingEvents` när respektive fas avslutas) — men den täckte varken Final-fasen eller något annat event-slag.

**Kodspårning innan fix:** `seasonEndProcessor.ts` wholesale-ersätter redan `pendingEvents: seasonEndPendingEvents` vid rollover, så den arrayen var INTE den faktiska läckan — headless simulering (seed-driven, `advanceToNextEvent` + `autoSelectLineup`/`autoResolvePendingScreen`) visade att den var ren. De enskilda `pending*`-objektfälten (`pendingPressConference`, `pendingCSPress`, `pendingRefereeMeeting`, `pendingScene`, m.fl.) rekomputeras ovillkorligt varje omgång i `roundProcessor.ts` och självläker därför på premiäromgången. Den verkliga läckan: `game.deferredDecisions` — KF3-avbrottsbudgetens FIFO-kö (events som trängts undan av `MAX_ACTIVE_DECISIONS`-capet). Den filtrerades varken av `staleEventIds` när en fas avslutades, eller alls vid `seasonEndProcessor.ts`s rollover. Bekräftat i en engångs-probe (headless, seed=2): ett `playoff_sf_2026`-kort låg kvar oberört i `deferredDecisions` genom hela SF- och finalfasen och dök upp i portalen EFTER att SM-guldet redan var avgjort; säsong-2026-daterade events (`patron_emerge_2026`, sponsorerbjudanden m.fl.) cirkulerade fortfarande i kön vid matchdag 10 i säsong 2027.

**Beslut:** Tre ändringar, samma mönster som redan fanns för `pendingEvents`:
1. `playoffProcessor.ts` — lade till den saknade `wasFinalPhase`-grenen i `staleEventIds` (tidigare bara QF/SF).
2. `roundProcessor.ts` — `staleEventIds`-filtret (och `allNewEvents`-dedupen) appliceras nu även på `game.deferredDecisions`, inte bara `pendingEvents`.
3. `seasonEndProcessor.ts` — `deferredDecisions: []` tillagt i rollover-objektet, exakt samma wholesale-clear som `pendingEvents` redan fick.

**Alternativ övervägt:** En generisk "strip alla event-id:n vars inbäddade säsongssiffra < currentSeason"-scrubber. Avvisat — kodbasens etablerade mönster vid rollover är redan wholesale-replace (`pendingEvents: seasonEndPendingEvents`), inte selektiv ID-mönstermatchning; att lägga samma regel på `deferredDecisions` är konsekvent med det mönstret och kräver ingen ny mekanism. En ID-scrubber hade dessutom fångat falska positiva — legitima årsboks-event som `event_gala_2026` bär medvetet det AVSLUTADE säsongsnumret i sitt ID och ska synas i den nya säsongens portal.

**Konsekvens:** `deferredDecisions` ska framöver behandlas som en del av samma i-flight-beslutskö som `pendingEvents` — varje framtida `staleEventIds`-användning eller rollover-fält som rör events måste beakta båda arrayerna, annars återkommer läckan i en ny variant. Regressionstest: `src/application/useCases/__tests__/seasonRolloverStaleEvents.test.ts` (kör headless genom final → ceremoni → årsbok → premiär, asserterar tom `deferredDecisions` vid rollover + inga `playoff_qf_/sf_/final_<gammal säsong>`-kort i pendingEvents ELLER deferredDecisions upp till 15 omgångar in i nya säsongen).
