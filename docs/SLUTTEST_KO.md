# SLUTTEST-KÖN — ENDA SANNINGEN

**Skapad:** 2026-08-17 · **Omskriven:** 2026-08-17 (djupversion) · **Ägare:** Opus
**Uppdateras post för post. Skriv ingen ny fil.**

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

## BLOCKERAT PÅ OPUS-TEXT — före allt annat på mitt bord

Fyra poster är mekaniskt färdiga och väntar bara på mig:

| Post | Vad som behövs |
|---|---|
| 2.6 `ArrivalScene:74` | N=1-grammatik för kontraktsraden, och formen när antalet varierar |
| 4.2 derbyrepliken | 13 storyline-frågor saknar topikanpassade svar. Listan skickad 2026-08-17 (+ 4 arc-aware-frågor med samma bugg, inte medräknade i de 13, väntar på besked om de ska ingå) |
| 4.8 andra halvan | Text som skiljer spelarens val från autouttagningens i snabbläget |
| 5.3 Turneringsläge | Rader för pågående serie, efter Codes datakartläggning |

K5 är löst — designbeslutet (permanent betyder permanent) implementerat i `3b33db0e`.

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

**Grind 1 — misslyckandet.** Seedade simuleringar visar att en svår klubb kan hamna i botten och bli sparkad **utan sabotage**, medan skickligt spel fortfarande hjälper. Minst ett beslut per säsong saknar uppenbart facit. → stänger etapp 3, U1, U6, O2, O4.

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
**Status:** `RAPPORT-LEVERERAD` — väntar på Jacobs dom mellan (a)/(b)/(c) för de förlorade delarna

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

**Ordning inom blockerarna:** K1 → K2 (rapport) → K5 → K3 → K4. K1 före K3 därför att `.slice(-5)`-fixen bevarar fler säsonger, alltså bevarar den snart de felaktiga talen längre.

---

# ETAPP 1 — byggbarhet och release

| ID | Post | Status |
|---|---|---|
| 1.1 | `seasonEndProcessor.ts:1178` — `resolveContractExtension` saknade fjärde argument (`managerName`) | `KLAR (73a98e14)` |
| 1.2 | `tsc --noEmit` + Vite-build som obligatoriska CI-grindar | `KLAR (f9a3358a)` |
| 1.3 | Deploy-sync som synlig releasegrind — live mot main på en rad | `KLAR (39770cd0)` |
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
| 2.6 | `ArrivalScene.tsx:74` — tre utgående kontrakt som inte finns. Bekräftad av **tre** oberoende auditer | Statisk sträng, hämtas inte ur saven | `PÅGÅR` — mekaniskt redo, blockerad på Opus-text |

### 2.5 · Choice-label-svepet — den viktigaste posten i etappen
Kända fall: "Ge honom vila" ger bara `boostMorale +10` (`eventFactories.ts:199-204`) — spelaren blev matchens bästa direkt efteråt. Varselvalet lovar "risk att spelare lämnar" och ger bara `boostMorale` (`:340-345`).

**Grepa alla choice-labels och deras faktiska state-diff. Rapportera varje val där texten lovar mer än effekten.**

Bygg inget förrän jag sett listan. Vissa löften ska wiras, andra ska skrivas om, och det avgörs per fall — det går inte att beställa i förväg.

**Klassen, fjärde gången i serien:** prototypen som hävdade att ripple-slingan fanns, Mariannes tre kontrakt, dessa två val, mecenatens permanenta avsked. Text skriver checkar domänen inte täcker.
**Godkänd när:** varje choice-label motsvaras av verifierbar state-diff, och kontraktstest finns för vila, skaderisk, spelarflykt och heltidslön.
**Status:** `DELVIS KLAR` — full rapport i `docs/CHOICE_LABEL_SVEP_2026-08-17.md`, omskriven med (a)/(b)/(c)-taxonomi.

**Runda 1 (byggt/committat):** de fyra `boostMorale`/`makeFullTimePro`-no-opsen wirade + vakt som kastar på ofullständigt effektblock (`fdcf55cb`), falsk storyline-skrivning gated på faktiskt effektutfall för captainSpeech + varsel offer_pro (`fdcf55cb`, `441c4474`), `community_bandyplay`s omkastade tecken rättat (`ece6220c`), `${elin}`-mall-buggen fixad (`694991d2`), `hallDebateEvents.ts`/`hallDebateService.ts`/`hallDebateData.ts` raderade (`d0d4d923`), LESSONS #45.

**Runda 2 (instrument-drivet, per ny metod — fynd skrivna löpande, inte sammanställda efteråt):** vakten breddad från 5 till 25 obligatoriska-fält-kontroller (`ed94218f`) efter full katalog av hela `eventResolver.ts`. Ett nytt fynd under kartläggningen (`resolveEconomicCrisis`/sold_star falsk "spelare-såld"-berättelse, rapporterad). `scripts/eventGuardInstrument.ts` byggt — simulerar flersäsongskörningar, resolvar VARJE choice av VARJE genererat event, fångar throws mekaniskt (`38772116`). Körningen hittade en regression vaktbreddningen själv orsakade (mecenat-avgångsvalet hade kraschat live) — fixad omedelbart (`6b9ea0c8`). Andra körningen (6×10 säsonger, EFTER fixen): 10 899 events, 12 183 choices probade, **0 kast**. Manuell (a)-tecken-sweep över 12 filer klar: två nya fynd — `community_julmarknad` (subtitle säger kostnad, effekt är korrekt uträknad men positiv nettosumma — textbeslut) och ekonomikrisens `ask_mecenat` (påhittat lojalitetslöfte, klassad b). Explicit **REDAN KLASSIFICERADE**-lista tillagd i rapporten så nästa svep vet vad som är utrett.

**Rapporterat utan att bygga:** `kommunens_villkor` (byte-identiska effekter, `finansiering`-fältet läses ingenstans, ingen kommun/klubb-kostnadssplit finns i källdatan att rapportera), bandyplays löpande nettoförlust (≈-812 kr/omgång i snitt, redan korrekt tecknad, bara odokumenterad), kiosk break-even (fanMood 83 basic / 50 upgraded), `community_julmarknad` (textbeslut), täckningslucka i `weeklyDecisionService.ts` (separat beslutspipeline, aldrig instrumenterad, manuellt kontrollerad — inga fynd).

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
**Status:** `DELVIS KLAR (165b280c, b5c1c9e3)` — `patron.patience` → `patron.goodwill` (165b280c, alla 7 läs-/skrivställen + testfixturer). `BoardPatienceMinimal` byggt och registrerat i `initCardBag.ts` (`b5c1c9e3`) — kvalitativa zoner Stabilt/Under press/Ultimatum, trösklar (30/50) återanvända 1:1 från `board_failure`-beatens redan kalibrerade severity-gränser (`portalBeats.ts:141-160`), inte nya siffror. `alwaysTrue`-trigger (inte bara-vid-problem) medvetet: utan en synlig Stabilt-baslinje går eskalering inte att läsa. **Godkänd-när-kravet delvis uppfyllt:** zonordet (steg 1→2→3) syns nu alltid, men "med orsak" kräver en reason-textrad i tiln som SVENSK TEXT-regeln (CLAUDE.md) förbjuder Code att författa — den fulla textmotiveringen kommer fortfarande bara från `board_failure`-beaten när den vinner rotationen mot andra beats, inte garanterat. **Sidofynd, ej åtgärdat:** `Mecenat.ts` har ett tredje fält som också heter `patience` (`mecenatService.ts:228`) — samma kollisionsrisk mot `boardPatience`, inte del av den uttryckliga instruktionen. Ej browser-verifierat, samma skäl som 3.1.

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
**Status:** `DOM GIVEN — BYGG`

---

# ETAPP 4 — två källor som glidit isär

Samma klass genomgående: `RoundSummaryScreen` mot `GranskaScreen`, `respondToIncomingBid` mot `resolveEvent`, `isNeutralVenue` som proxy för final. Två vägar till samma sanning, och de glider.

| ID | Post | Rotorsak / villkor | Status |
|---|---|---|---|
| 4.1 | Standings parity — dashboard 5:e, bracket 6:a, årsbok 5:e, samma säsong och 21 poäng | `calculateStandings` (tie-breaker: poäng→GD→gjorda mål→klubbId) var redan kanonisk, men `roundProcessor.ts` var ENDA anropsstället som skickade `game.pointDeductions` som tredje argument. `playoffTransition.ts`, `seasonEndProcessor.ts`, `TabellScreen.tsx`, `matchActions.ts`×3 gjorde det inte — en klubb under poängavdrag fick olika placering på olika ytor trots samma underliggande tabellfunktion | `KLAR (85e60a47)` — **osäkerhet kvar:** fixet är verifierat korrekt och täcker HELA felklassen (pointDeductions-inkonsekvens), men jag har inte det ursprungliga repro-savet och kan inte 100% bekräfta att just DEN observationen (5:e/6:a/5:e, 21 poäng) berodde på ett aktivt poängavdrag snarare än något annat. Om samma mönster syns igen efter denna fix, det är en annan rotorsak — säg till |
| 4.2 | Derbyrepliken. **Tre vägar in**, vilket är varför tre tidigare ordrar inte räckte: `preferIds` filtreras ej (`:28,36,41`); `win_derby` klassad generic `win` (`:423`); storyline-frågan behåller föregående matchfrågas `preferIds` (`:649-657`) och svaren byggs ur dem (`:726`) | Alla tre stängs. Specialtaggar får `generic: none`. **13 storyline-frågor saknar topikanpassade svar — blockerad på Opus-text.** Hör ihop med U2 | `PÅGÅR` |
| 4.3 | Varsel-dedupe | `postAdvanceEvents:281-307` kollar `event_varsel_s{season}`, fabriken skapar `event_varsel_{employer}_{season}`. Gemensam ID-funktion | `KLAR (406be8e4)` — `varselEventId(season)` exporterad, används av båda anropsställena. Test verifierat mot repro (fixat id i resolvedEventIds blockerade inte ett nytt event innan fixet) |
| 4.4 | Byggflikens copy → "Ett bygge åt gången". Låsta noder listar **alla** krav med uppfyllt/ej | `FacilityTree.tsx:231` sa säsongsstart, `FacilityScreen:84-92` implementerar löpande. `facilityNodes:162-168` kräver två noder, visar en | `KLAR (b805a829)` |
| 4.5 | Årsbokens styrelsemening ur objective-resultat, inte placeringstier | "2:a plats uppfyller kravet att vinna ligan". Samma rot som `growFanbase`-etiketten i sluttestet | `KLAR (6f1d36a1)` |
| 4.6 | Årsboken: rå nyckel `captain_rallied_team`, dubbla kaptensevent, `O33` i en 22-omgångssäsong | Sista är kalenderindex mot ligaomgång — separera dem | `KLAR (ae1f00d0, cf6bc619, ee18caaa)` — tre separata rotorsaker, tre commits. O33: arc-storylines satte matchday till det globala matchday-värdet (kan bli 27+ i slutspel), bytt till getCurrentLeagueRound. Dubbla kaptensevent: captainSpeech-eventet och ledare_crisis-arcen triggar båda på 3+ förluster i rad, oberoende byggda — captainRallyGuard.ts delad spärr. Rå nyckel: fyra storylines (inte bara captain_rallied_team) satte description till den råa type-strängen — grep bekräftade fyra träffar totalt, alla fixade |
| 4.7 | `SeasonSummary` lagrar `eliminatedByClubId`, avgörande match, rundnummer | `SeasonSummaryScreen:121-135` läste `game.playoffBracket`, ej historiskt tillförlitlig efter rollover → "Kvartsfinalen mot motståndet" | `KLAR (fd3a7428)` |
| 4.8 | `condition_0` etiketterad "trötthet" (`GranskaOversikt:703-720`) — noll kondition visas som noll trötthet | Semantisk inversion; gör rotation olärbar | `KLAR (35e9ac16)` — andra halvan (skilj spelarens val från autouttagningens) `EJ`, kräver nytt fält + Opus-text |
| 4.9 | Sponsorpresentation | `postAdvanceEvents:605-619` rundar veckobelopp till tusental, räknar totalen exakt → "2k × 10 = 15k" | `KLAR (05e7b9b4)` |
| 4.10 | `FormationView.tsx:361` — `p.position.slice(0,3).toUpperCase()` på engelskt enum ger DEF/MID/HAL/GOA | Explicit mappning: goalkeeper→MV, defender→B, half→YH, midfielder→MF, forward→A | `KLAR (50178bb3)` |
| 4.11 | `facility_completed` konsumeras i stället för tidsstyras | `portalBeats:541-558` triggar bara när `lastCompleted.matchday === currentMatchday`. Tas platsen av något högre prioriterat försvinner invigningen för alltid | `KLAR (43903fbd)` |
| 4.12 | Delningsbilden kapas i produktion | `seasonShareImage.ts` — fast canvas 1080×1350, handrullad y-pekare (`:18-185`), tre spelarblock efter målsektionen (`:155-178`), fot alltid på `H-60`. Regionsbaserad layout, reservera fot först, **hård assertion att inget ritas efter `H - footerHeight`**. Bildsnapshots för värsta datakombination och långa svenska namn | `EJ` |
| 4.13 | `shareSeasonImage` returnerar `void` och sväljer alla fel (`:215-244`) | Returnera `shared`/`downloaded`/`cancelled`/`failed`. `AbortError` = cancel **utan** nedladdning — i dag laddas filen ner efter avbrott. Web Share saknar `text` och `url` | `EJ` |
| 4.14 | "Spara som bild" under Säsongens match producerar säsongskortet | Generiska `handleShare`; `matchHighlightService:88-99` sätter `shareImageReady: false` permanent. Byt texten till "Dela säsongen" tills matchartefakten finns — en knapp som lovar en artefakt den inte kan leverera är 2.5 igen | `EJ` |
| 4.15 | **Svårighetsbadgen ljuger tills U1 är byggd.** Text låst av Opus 2026-08-17: byt `LÄTT/MEDEL/SVÅR` mot vad som faktiskt härleds — **`HÖGA FÖRVÄNTNINGAR` / `RIMLIGA FÖRVÄNTNINGAR` / `LÅGA FÖRVÄNTNINGAR`**, samma tre renommétrösklar som i dag. Undertexten på klubbkortet: hög → *"Styrelsen räknar med topplacering."*, rimlig → *"Styrelsen väntar sig en säsong utan kris."*, låg → *"Styrelsen väntar sig inte mirakel. Resurserna är små."* — En falsk SVÅR-badge är sämre än ingen badge, och klubbvalet är den första yta varje ny spelare ser. Återinförs som verklig svårighetsgrad när `U1` är byggd | `EJ` |

**Godkänd när etappen är klar:** ingen renderad produkttext innehåller `{...}` eller råa nycklar, och samma fråga ställd till två ytor får samma svar (placering, motståndare, arena, kondition, pengar).

---

# ETAPP 5 — nya ytor

Dessa är **inte** nya löften utan mekaniskt kontrakt. Framgångsauditens "pausa nya berättelsekort" gäller dem inte — de är rytmfixar för befintliga ögonblick med låst copy.

### 5.1 · Sommaren
Variant 1e. Underlag: `CODE_INSTRUKTION_SOMMAREN_2026-08-17.md` och `docs/incoming/Sommaren-sasongsovergangen-2026-08-17.dc.html`.
All copy låst. Fem rapportera-först-punkter i ordern: `getBurnoutZone`s zoner, händelsetyper mina tre radformer inte täcker, fältet bakom "slutspel inte rimligt", inhakning i flödet, härlett omgångsantal.
Utbrändhetens golv på 30 är det enda som gör burnout till något annat än en räknare som nollställs. Bygg det som specificerat.
**Status:** `EJ`

### 5.2 · KapitelPunkt i Granska
En komponent, tre innehåll (cupfinal / SM-final / avsked), efter resultatblocket, före Turneringsläge och statistik. En rad i `granskaSectionRegistry` — **ingen egen gren.**
Kommentarblocket på `GranskaOversikt.tsx:375-387` dokumenterar varför: en tidig `return` för avsked rev sex event-drivna sektioner som inte fanns i matrisen. Avsked är innehåll överst, aldrig en gren som river sektioner.
Copy låst i chatten 2026-08-17 (sex varianter plus avskedsraden i två former).
**Status:** `EJ`

### 5.3 · Turneringsläge mitt i serie
`deriveTurneringslageMode` returnerar `null` under en pågående serie, så en semifinal där klubben står 1–0 visar ingenting alls.
**Ett avgjort utfall är information; en oavgjord serie är dramatik.** Att bara det första renderas är omvänd prioritering.
Rapportera vad som finns tillgängligt att visa mitt i en serie — matchställning, antal segrar som krävs, hemmafördel nästa match. Jag skriver texten.
**Status:** `RAPPORT-VÄNTAR`

---

# ETAPP 6 — grindar och geometri

| ID | Post | Status |
|---|---|---|
| 6.1 | Geometrigrinden — **blev 31 scener, inte 28**, enbart mätläge | `KLAR (8eea7768)` |
| 6.2 | `event-overlay` + `press-conference`: **båda samexisterar med riktig nav** — strukturellt bekräftat. Ingår i grinden | `KLAR (8eea7768)` |
| 6.3 | De fyra kvarvarande tap-target-fynden, i konsekvensordning: `primary-smfinal-vs-deadline` / `primary-event-vs-farewell` (28 px mellan "Simulera resterande säsong" och "Redo — spela omgång N" — en felträff simulerar bort resten av säsongen), `submodal` (4 px), `tacticmodal` (6–8 px) | `EJ` |
| 6.4 | Kontrastgrind, en-primär-grind, träffytegrind, matchtypsmatris-grind, datarobusthetsgrind (åtgärdslistans post 17–21) | `EJ` |

**Varför 6.1 bara mäter:** kostnaden i den breda varianten är att någon granskar 28 bilddiffar. Nyttan sitter i geometrijämförelsen, som inte behöver någon ny snapshot. Bilddiffarna tas styckvis senare, när någon ändå rör respektive yta.

---

# ÅTGÄRDSLISTAN (GPT live @`b805a829` + Design)

Graderad mot en revision **fem commits bakom** HEAD vid leverans — den känner inte till `a205c876` och framåt. Det förklarar Å9 och Å16 och kan förklara fler.

| ID | Post | Status |
|---|---|---|
| Å1 | Kontrast ~1,06:1 i `EventPrimary` — nästan vit text på ljust `card-sharp`. Krisen ska vara portalens mest läsbara budskap och är i praktiken osynlig | `KLAR (52a1fc30)` |
| Å2 | Taktiksegment ~22 px mot husets 44 px-regel; FÖRESLÅS-badgen skär knappens box med 6,75 px. **`padding: '6px 3px'` står kvar i `TacticBoardCard.tsx`** — `c5fa24f7` fixade `TacticChangeModal`, inte denna. ≥36 px synlig / 44 px träffyta, badgen i layouten och inte negativt positionerad | `EJ` |
| Å3 | Portal: två konkurrerande primär-CTA — verifierat att både `SMFinalPrimary.tsx` och `PortalScreen.tsx` har egna `.btn-primary`. **Taket ska bestämma en enda primärhandling**: huvudkortet blir sekundärt, eller fasta knappen ärver kortets label och mål | `EJ` |
| Å4 | Marknad: tre "Acceptera"-primärer — verifierat att `primaryChoiceId="accept"` är ovillkorligt per kort. Plus "Marknaden är tom" under tre aktiva bud | `EJ` |
| Å5 | Trupp/Nu: skadeporträttet — bekräftat vid 390px, `SquadScreen.tsx:568` (krisraden), ingen storleks-wrapper alls. Fixat, matchar mönstret på `:249` | `KLAR (bd331755)` |
| Å6 | = 5.2 | `KLAR (fc6f5015)` |
| Å7 | Dubbel padding: skarpa `DecisionCard`-skalet lade `10px 12px` inuti `card-sharp` | `KLAR (97d26cfd)` |
| Å8 | Taktiktavlans viktning → D1. Vokabulärdelen = 4.10 | `KLAR (50178bb3)` för vokabulären; viktningen hos Design |
| Å9 | Granska-dubbletten | `UTGÅTT` — `RoundSummaryScreen` raderad i `7d97d3e2` |
| Å10 | Matchdockan ratificeras **med skärpning**: modaler som besvaras under pågående spel dockas, allt annat centreras. `SubstitutionModal` flyttas **inte** — ett byte görs i en pausad situation, en taktikändring medan spelet rullar. Skriv in regeln i designsystemet. Kugghjul → Lucide | `EJ` |
| Å11 | Årsbokens tomma "Säsongens bästa"-kort — gata kapitlet på faktisk data (DS-regel 12) | `EJ` |
| Å12–15 | Skuld: nav-dokdrift (6 flikar dokumenterat, 7 i bruk), emoji-svepets rester, egna skuggor mot skuggkanon, bundle | `EJ` |
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
**Status:** `RAPPORT-LEVERERAD` — väntar på Jacobs dom om modell + de tre öppna frågorna. Pausad tills dess, precis som O5 är pausad tills U1 håller (Grind 1-beroende, se O5/O2/O4)

### U2 · Kanonisk matchkontext
Symptom: straffsegrar rapporteras som "Oavgjort, vi tar en poäng". Cupfinal ger "Två viktiga poäng". Hemmakryss ger "En poäng på bortaplan". Clean-sheet-press efter 9–8. Icke-derbyfinal erbjuder derbyreplik.

Fem symptom, fem egna felaktiga härledningar ur `homeScore`/`awayScore`. Fixas de en och en får vi fem lappar och ett sjätte symptom nästa svep.

**Frågor:** hur många ställen i `pressConferenceService` klassificerar matchutfall eller tävlingstyp självständigt? Vad **saknas** i `matchTypeAxes` (finns sedan Granska del 4: `tävlingstyp | skede | plats`) för presskonferensens behov — faktisk vinnare efter förlängning/straffar, om ligapoäng finns, derby? Vad är minsta ändringen som gör alla fem symptomen omöjliga snarare än lagade?

**Villkor:** **en** kontextmodell, byggd på `matchTypeAxes`. Ett parallellt `MatchOutcomeContext` är två sanningar om samma match — exakt felklassen vi jagat i tio dygn.

**Rapport levererad.** Fyra oberoende klassificeringsställen bekräftade, alla i `pressConferenceService.ts` + `csPressEventService.ts`: (1) `buildPressContext()` (:301-394) härleder won/lost/draw + isDerby + isCup/isPlayoff helt vid sidan av `matchTypeAxes`. (2) `contextKey`-blocket (:583-595) räknar myScore/theirScore och rivalry EN GÅNG TILL — tredje beräkningen av samma sak i samma fil, och läser aldrig `isCup`/`isPlayoff`. (3) `csPressEventService.computeCSStreak()`/`shouldTriggerCSPress()` — fjärde parallella score-tolkningen. (4) `TAG_DEFS`: `win_derby`/`loss_derby` klassade `generic: 'win'/'loss'` (:423, 431) — samma buggklass som redan patchades för `playoff_loss_not_final` men missad för derby-taggarna. Det är rotorsaken till symptom 5.

**Vad som saknas i `matchTypeAxes`:** "faktisk vinnare efter förlängning/straffar" (läser aldrig `wentToPenalties`/`penaltyResult`/`overtimeResult` — rotorsak symptom 1), "gav ligapoäng" (går att härleda 1:1 ur redan befintlig `tavlingstyp==='liga'`, men ingen kod läser den — rotorsak symptom 2), "är detta en derby" (finns inte i någon axel — rotorsak symptom 5 tillsammans med punkt 4 ovan). Symptom 3 (hemmakryss) är INTE en modellucka — `plats` täcker redan hemma/borta, buggen är att frågan saknar en `requireAway`-spärr (bara `requireHome` finns). Symptom 4 (9-8 clean sheet) gick inte att reproducera bokstavligt — spärren är korrekt — men är ändå ställe (3) ovan: en fjärde oberoende råscore-tolkning som inte delar sanning med resten.

**Minsta ändringen:** tre nya fält på `MatchTypeAxes`, beräknade EN gång i `deriveMatchTypeAxes()`: `utfall` (vunnet/förlorat/oavgjort, läser straff/förlängning), `gavLigapoang` (= tavlingstyp==='liga'), `arDerby` (= `!!getRivalry(...)`). Lägg till `requireAway?` på `PressQuestion`, fixa `win_derby`/`loss_derby` till `generic: 'none'`. Radera `buildPressContext`s och `contextKey`-blockets egna beräkningar (ställe 1+2), wire:a båda mot en enda `deriveMatchTypeAxes()`-instans.

**Uppskattad omfattning:** `matchTypeAxes.ts` (+≈20 rader), refaktor av `pressConferenceService.ts` (ta bort dubbelberäkningarna, wire:a om), enrads-fix i TAG_DEFS, enrads-fix i `csPressEventService.ts`. Ingen ny parallell modell.
**Status:** `RAPPORT-LEVERERAD` — klart att bygga direkt, inget produktbeslut väntas. Kirurgiskt nog för Code utan spec

### U3 · Effektschemat
`eventProcessor:240-242` skriver effekten i `amount`, `eventResolver:823-828` läser `effect.value`. Mecenatkortet lovar 1 000 000 kr och drar 0.

**Frågan som avgör storleken:** hur många eventeffekter har samma missmatch? Är svaret tvåsiffrigt är det ett schema som ska typas och valideras vid build, inte en rad som ska rättas — och då måste varje befintlig effekt klassificeras.
**Status:** `KLAR (e860ad7d)` — mecenat-reaktiveringen är en egen post, K5.

### U5 · Narrativt minne
"Finalen. Birger…" ordagrant år 5, 7, 8, 9 och 10, plus efter en semifinalförlust. Helena/Folke-profilen återkom flera säsonger. Samma Tord-modal stoppade två semifinalomgångar i rad.

Rot: event-ID:n är unika per säsong, inte per karaktärsbåge, och cooldown finns lokalt per källa men inte delat mellan scener, portalbeats och eventkö.

**Frågor:** hur många oberoende cooldown-/dedupmekanismer finns? Hur många distinkta narrativa event-typer finns totalt, och hur många behöver `semanticKey`? Kan nyckeln härledas maskinellt ur befintliga ID:n, eller kräver varje event ett manuellt beslut om vilken båge det tillhör?

**Är svaret trehundra typer** börjar vi med pivotal beats och lämnar ambient orörda.
**Status:** `RAPPORT-VÄNTAR`

### U6 · Renommé nedåt
Skutskär tankade en säsong och renommét **steg** 52 → 56. Koden kan sänka via skandal och nekad licens, men ingen placerings- eller trendnedgång finns i `seasonEndProcessor`.
Rapportera vad ett säsongsvis renommédelta ur placering mot förväntan skulle kräva, och vad det påverkar: spelarvilja att stanna, sponsorintresse, publik, jobberbjudanden, styrelsekrav.
**Status:** `RAPPORT-LEVERERAD` — Code flaggade tidigare att detta möjligen var samma sak som "ryktesskedjan" som utreddes tidigare. **Det är det inte.** Ryktesskedjan handlade om att ligan inte reagerar på dominans (avskriven — tio säsonger visade sportslig variation). U6 handlar om att renommé inte kan **falla** vid misslyckande. Motsatt riktning, annan fråga.

**Var reputation redan läses (nedströms-effekter, full lista):** ekonomi (`economyService.ts` — weeklyBase, arenakapacitet, biljettpris, publikfaktor — publik och löpande intäkter är alltså direkt reputation-styrda redan idag), cupseedning, transfer-svårighet (`offerSelectionService.ts`, delad med U1), spelarvärvning/dayJob (`worldGenerator.ts`), politiker-bonus (`politicianService.ts`, >65), patron-bidrag (`patronEvents.ts`, viktar reputation×300), klack-status "storstad" (≥70), milstolpar (landslagstränare/scoutbesök vid >65/70). **Ingen träff** på sponsorintresse direkt kopplat till reputation utanför kommunbidrag/patron, och ingen explicit manager-jobberbjudande-mekanism kopplad till reputation.

**Hur renommé sänks idag (mönster att återanvända):** `scandalService.ts` — `fundraiser_vanished` (−8) och `coach_meltdown` (−5), båda återställs fullt när skandalen löper ut. Nekad licens: −15, permanent, engångs. Alltid `Math.max(0,...)`/`Math.min(100,...)`-clamp.

**Den saknade länken finns redan byggd, bara inte kopplad:** `Club.boardExpectation` + `computeSeasonVerdictRating(expectation, finalPosition, totalTeams)` (`boardService.ts:175`) returnerar redan 1-5 för hur väl placeringen matchar förväntan — men ratingen driver idag bara text och `boardObjectives`-patience, aldrig reputation.

**Formel-skiss** (i `seasonEndProcessor.ts` där `computeSeasonVerdictRating` redan beräknas): `repDelta = { 1: -6, 2: -3, 3: 0, 4: +2, 5: +4 }[rating]`, clampat 0-100. Proportion mot befintligt: under skandalnivå (−5/−8, tillfälligt) eftersom ett säsongsmisslyckande återkommer varje säsong medan skandal är enstaka.

**Omfattning:** 3-5 rader i `seasonEndProcessor.ts`, ingen ny service — återanvänder `boardExpectation`/`computeSeasonVerdictRating` fullt ut. Kirurgiskt, men **kräver en D-fact-post** för magnituden (CLAUDE.md:s D-FACT-regel vid nya spelmagnituder) innan commit.

### U7 · Save-portabilitet — den enda posten där ett fel raderar spelarens arbete
Export/import finns i `saveGameStorage:5-56` men är **inte nåbar från UI**. En tioårig karriär lever i en lokal IndexedDB utan backup, utan enhetsbyte, utan migrationstest mellan releaser.
Rapportera vad ett begripligt backupflöde kostar, plus en automatisk lokal återställningspunkt före migrationskritiska steg. Cloud save och konto ligger långt senare och ska inte bli startfriktion.

**Rapport levererad.** Export/import är redan komplett i `saveGameStorage.ts` (`exportSaveAsJson` :5-15, blob-download, ingen File System Access API behövs; `importSaveFromJson` :32-57, validerar struktur + kör `migrateSaveGame`) — bekräftat att INGEN `.tsx`-fil importerar någotdera, bara testfilen.

**UI-koppling, minsta ändringen:** `GameHeader.tsx:233-257` har redan en färdig inställnings-dropdown med "💾 Spara spel"/"📂 Ladda spel". Två nya rader i samma array (Exportera/Importera säkerhetskopia) — 1 fil, ~10-15 rader, ingen ny skärm.

**Automatisk återställningspunkt:** två triggerpunkter i `gameStore.ts` — före `newGame()`s ovillkorade radering (:165-174, en rad `snapshotBeforeDelete` innan `deleteSaveGame`-loopen) och vid schemaversionsskillnad i `loadSaveGame`/`migrateSaveGame` innan migreringen appliceras. Ny funktion `snapshotSave()` i `saveGameStorage.ts`, samma `idb-keyval`-mönster som redan används, rotation på max 2-3 snapshots (given att lagringskvoten redan varit ett verkligt problem, se `gameStore.ts:169`s kommentar).

**Uppskattad omfattning:** `GameHeader.tsx` (+10-15 rader), ny funktion i `saveGameStorage.ts` (+20-30 rader) + 2 anropsplatser. Ingen ny fil, ingen ny route, inga nya beroenden.

**Öppna frågor för Jacobs beslut:** ska import skriva över nuvarande save direkt eller varna först (destruktivt)? Ska en misslyckad migrering automatiskt erbjuda återställning (kräver liten UI-yta) eller bara logga tyst? Rotationsantal (1 vs 2-3)?
**Status:** `RAPPORT-LEVERERAD` — kirurgiskt, byggbart direkt efter Jacobs svar på de tre öppna frågorna

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
| D1 | Eventköns viktning: ambient / normal / pivotal, plus konsekvensnivå på val (neutral, positiv, kostsam, irreversibel). Inkl. Å7:s inline-rytm och Å8:s taktikviktning. Svåraste frågan: hur pivotal får väga mer **utan** att bli en fjärde ceremoni | `SKICKAD` |
| D4 | **Taktikens två lägen** (`O15`). Fyra frågor: hur "två ändringar föreslås" ser ut som ett sammanhållet förslag; hur "vad skiljer mot förra matchen" visas; hur avancerat läge nås utan två skärmar; träffytorna (Å2). Läses ihop med D1 | `SKICKAD` |
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

**Beroenden:** `D1` (ambient-nivån att degradera till), `U9` (val-entropin mäter domen), `O5` (en kostnad i kronor är bara ett val om kronor är knappa).
**Godkänd när:** inget alternativ väljs av mer än 80 % i val-entropin.

### O3 · Spelarens eget säsongsmål
**Status:** `SKRIVEN` — `DOM_EGET_SASONGSMAL_2026-08-17.md`

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

**Godkänd när:** en spelare kan säga vad burnout kostade och vad hen gjorde åt det.

### O5 · Framgångsekonomin — PAUSAD
`DOM_FRAMGANGSEKONOMIN_2026-08-17.md`. Tre krafter i ordning: löneinflation med rykte, driftskostnad för byggt, styrelsens investeringskrav. Rivalernas catch-up-budget avvisad — dolt mottryck spelaren inte kan se.
**Pausad tills U1 är byggd.** Domen antog att nedsidan fanns och behövde kalibreras mot. Skutskär visar att en svag klubb inte kan misslyckas; löneinflation mot ett sådant spel blir dekoration i övre halvan och godtycklig i nedre.
**Status:** `PAUSAD`

### O6–O14 · Kortare poster

| ID | Post | Status |
|---|---|---|
| O6 | Positionsvokabulären i `Formation.ts`: `LIB`, `VCB`/`HCB`, `CMF`, `HR` som spegling av `VH` | `EJ SKRIVEN` |
| O7 | Språkfelslistan från alla auditer, samlad. Rapport levererad — se not under tabellen | `RAPPORT-LEVERERAD` |
| O8 | Text: Turneringsläge mitt i serie (efter 5.3), fast-lägets prosapooler, Sommarens saknade händelsetyper | `VÄNTAR` |
| O9 | Delningskortets berättelseläge. "6:e, 21 poäng" ser mediokert ut för en utomstående; det var en svår klubb som gick från nia till kvartsfinal. Huvudbudskapet ska vara förtjänad kontrast plus svarsinbjudan. Tre artefakter att namnge: Årets berättelse, Årets match, Karriären hittills | `EJ SKRIVEN` |
| O10 | Best-in-class-strategin beslutad som ambition. Bandyarkivet, spelbara vägskäl, Bruksligor, utmaningslänkar, skaparekosystem byggs **inte** nu — men strategins Fas 0 är samma sanningslager som K1–K5. Ordningen håller | `BESLUTAD, EJ PÅBÖRJAD` |
| O11 | **Innehållskontraktet** — `DOM_INNEHALLSKONTRAKTET_2026-08-17.md`. Sex obligatoriska fält: trigger, state-effekt, berörda system/personer, livslängd, `semanticKey`+cooldown, återkallningsyta. **Gäller från nu**, också för ändringar av befintlig text. Rapportera-först: finns ett register att hänga tabellen på, eller måste det skapas? I så fall samma arbete som `U5` — gör dem ihop | `SKRIVEN` |
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
| O15 | **Taktikens två lägen.** Brief skickad till Design 2026-08-17. Standardläge: assistentens två rekommendationer som **ett** förslag, vad som skiljer planen från förra matchen, och "följ rådet" (ändrar bara det som föreslås). Avancerat läge: alla åtta, större träffytor, ändringshistorik. Standardläge är default. Å2 (träffytorna) ingår. De åtta dimensionerna stannar — progressiv disclosure, inte förenkling | `HOS DESIGN` |
| O16 | **Granska som lärandeyta** — `DOM_GRANSKA_LARANDEYTA_2026-08-17.md`. En sektion, `DITT VAL`, som kopplar **ett** av spelarens val till ett mätt utfall. Fyra kandidater i ordning efter kopplingens säkerhet: press→återvinningar, hörnstrategi→hörnmål, tempo→kondition sista tjugo, formation→målens ursprung. All text låst. **Rapportera-först:** vilka av de fyra har `MatchResult` faktiskt siffror för? Bygg bara de som redan mäts. **Kräver `4.8` andra halvan** — utan den kan sektionen tillskriva spelaren assistentens beslut, vilket gör den aktivt skadlig | `SKRIVEN` |
| O17 | **Anläggningsträdets slut** — `DOM_ANLAGGNINGSTRADETS_SLUT_2026-08-17.md`. Tre delar: (1) ett fullt träd är ett **tillstånd** med text och sammanställning, **byggs nu**; (2) hallprövningen gatas på fullt träd nu men är en horisont först efter `O5` — en hall som kostar 3 mkr mot en kassa på 11 är samma klickning som de sista noderna; (3) **avveckla en byggd nod** blir ett val först när drift finns (`O5` del 2), och det uppfyller varsel-mallens punkt 4–5. **Inte fler noder** — det skjuter problemet fem säsonger framåt | `SKRIVEN` |
| O18 | **Årsboken som karriärens ryggrad** — `DOM_ARSBOKEN_RYGGRAD_2026-08-17.md`. Fem fält i `SeasonSummary`: spelarens mål+utfall (`O3`), säsongens viktigaste beslut (kräver `O19`), största personförändring, rivalitetens ställning, klubbens epok. **Ett fält per säsong, aldrig en lista** — en händelselös säsong ska bära färre fält, inte utfyllnad. All text låst. Fält 3–5 kan byggas nu; fält 1 ihop med `O3`. `HistoryScreen` med snapshot-prop delas med `3.3` och `U7` — bygg den en gång | `SKRIVEN` |
| O19 | **Märk de nio 5/5-händelserna som systemhändelser i data**, inte i en rapport — de ska bli åtkomliga för en gemensam räknare. Billigt, och gör säsongsbudgeten möjlig. Ingen mekanik byggs än | `KLAR (72427068)` — nytt fält `systemhandelse?: boolean` på `GameEvent` + `WeeklyDecision` (två separata typer, delar inget interface). Satt på alla nio konstruktionsställen. **Designval, inte givet av ordern:** märkt på HELA event:et/decisionen, inte per enskilt val — för `checkMecenatRetirement` (bara `offer_tribute` är 5/5 av tre val) och economicCrisisService (bara `sell_star` av tre) betyder det att räknaren senare ser händelsemomentet som systemhändelse oavsett vilket val spelaren faktiskt gör. Motivering: en finare per-val-märkning kräver att veta VILKET val spelaren gjorde innan räknaren kan agera, vilket hör ihop med säsongsbudget-mekaniken (U5, inte byggd än) — event-nivå är den enda granularitet som är meningsfull utan den mekaniken. Regressionstest verifierat mot pre-fix kod |
| O20 | **De tio 4/5-händelserna — rapportera vilken punkt som saknas i var och en.** Saknas punkt 5 (systemen pekar isär) är det `O2`:s dominansfråga. Saknas punkt 3 (ett tal att räkna på) väntar den på `O5`. Det avgör vilka som är billiga att lyfta till 5/5 | `RAPPORT-LEVERERAD` — se tabell under |

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
