# IMPLEMENTATION PLAN — Match Live Bundle (Stålvallen)

**Datum:** 2026-05-08
**Författare:** Opus
**Status:** PLAN — översikt över hela implementationen
**Beroende:** `docs/match-live-bundle/` (alla mockar + IMPLEMENTATION-SPEC.md från designern)

---

## Vad det här är

En komplett designimplementation för match-flödet i Stålvallen-vokabulär: scoreboard, commentary-feed, fem interaktiva matchhändelser, match-report (quicksim), portal secondary cards, press/media-separation. Sju mockar + designerns implementation-spec ligger i `docs/match-live-bundle/`.

Designvokabulären är distinkt: mörkt läder + koppar + monospace LED + 7-segment digital + papper-warm för "rapport"-yta. Tvådubbel-lager-modell (mekanisk sanning + digital dimension) som respekterar att appen inte är arenan utan kompletterar med tidshorisont.

**Mekaniken är låst.** Alla matchhändelse-services (`cornerInteractionService`, `freeKickInteractionService`, `penaltyInteractionService`, `counterAttackInteractionService`, `lastMinutePressService`) har sina datakontrakt verifierade mot mockarnas zoner/val. Designvalen avtryck mekaniken — inte påhittade.

---

## Total tidsuppskattning

~60h fördelat över fem batcher. Pragmatiskt approach: leverera batch 1 först, validera mot mock i playtest, sen successivt resten.

| Batch | Omfattning | Estimat | Beroenden |
|---|---|---|---|
| **1** | Slutminuterna + Match Report restyling | ~12h | Inga (befintliga komponenter, mest styling) |
| **2** | Scoreboard-modul + Commentary feed | ~14h | Återanvänds i Batch 1 (Match Report använder scoreboard FT-state) — kan göras parallellt eller före |
| **3** | 4 övriga event-paneler (hörna, frislag, straff, kontring) | ~22h | InteractionShell-mönster verifierat i Batch 1 |
| **4** | Portal secondary restyling | ~3-4h | Inga (befintliga komponenter, bara token-byte) |
| **5** | Press/media-separation | ~12h | Ny feature, eget datakontrakt — separat lift |

Totalt: ~63h. Batcherna kan ordnas om — primär valfrihet är om scoreboard byggs före eller efter slutminuterna. Min rekommendation: **scoreboard först** (Batch 2 → Batch 1), eftersom Match Report återanvänder scoreboard-modulen i FT-state. Då slipper vi bygga den två gånger.

---

## Föreslagen ordning

### Steg 1 — Batch 2: Scoreboard + Commentary (~14h)

**Varför först:** scoreboard-modulen återanvänds i Batch 1 (Match Report FT-state). Commentary-feed är fristående men delar designtokens med scoreboarden.

**Levererat:** scoreboard-komponent som är data-driven, sticky topp i match-vy, score-flash, scanlines, tidslinje med data-binding mot fixture-events. Commentary-feed med tag-vokabulär, atmosphere-rad-rytm, auto-scroll.

**Validering:** kan playtestas isolerat genom att starta en match — scoreboard syns från första sekunden, commentary fyller på. Inga interaktioner än.

### Steg 2 — Batch 1: Slutminuterna + Match Report (~12h)

**Varför här:** befintliga komponenter, mest restyling. Slutminuterna har redan `LastMinutePress.tsx` med fungerande mekanik — bara visualiseringen byts. Match Report har redan `MatchReportView.tsx` — restylas med scoreboard-modulen från Steg 1.

**Levererat:** slutminuts-interaktion i Stålvallen-vokabulär (8-sek count-down-ring, risk-rad, taktiktavla med 10 spelare + risk-pilar). Match Report med scoreboard FT-state överst + papper-yta med arena-rad, story, events, hörnstats, betyg.

**Validering:** spela en match till slutminuterna och vinst → se Match Report. Det är hela quicksim-flödet i miniatyr.

### Steg 3 — Batch 4: Portal secondary (~3-4h)

**Varför parallellt med Batch 1:** oberoende av match-flödet. Tre befintliga komponenter (`BoardObjectivesSecondary`, `WeeklyDecisionSecondary`, `ActiveArcsSecondary`) får ny styling enligt mock — papper-warm, koppar-stripe, eyebrow-monospace.

**Levererat:** Portal-vyn använder samma vokabulär som scoreboard nedom matchen. Visuell kontinuitet etablerad.

**Validering:** öppna Portal, se nya kort. Snabbt att verifiera.

### Steg 4 — Batch 3: 4 övriga event-paneler (~22h)

**Varför sist av live-bundeln:** mest grafiktung, mönstret är beprövat efter Batch 1 (slutminuterna är referensen). Bygg parvis: straff + kontring först (befintliga komponenter, mindre grafik), sen hörna + frislag (mer grafik, fler element).

**Levererat:** alla fem matchhändelser har konsekvent visuellt språk. Live-matchen är komplett.

**Validering:** spela genom hela matchen, träffa varje interaktiv händelse minst en gång.

### Steg 5 — Batch 5: Press/media-separation (~12h, separat lift)

**Varför separat:** ny feature, eget datakontrakt. Inte beroende av övriga batcher. Kan göras när tid finns eller skjutas till senare iteration.

---

## Krockar att respektera

### Mot befintlig kod

- **Mekaniken i alla event-services är låst.** Visualiseringen är avtryck av zoner/val — inte påhittade visuella stater.
- **`InteractionShell.tsx`** finns redan och används av befintliga interaktioner. Specen i `docs/match-live-bundle/IMPLEMENTATION-SPEC.md` föreslår att shell-mönstret är samma — men den nya visuella vokabulären kräver justering av shell-internals (LED-tags, copper-CTA, danger-CTA-variant). Det är samma komponent, inte två parallella.
- **`MatchLiveScreen.tsx`** är värd för scoreboard + commentary-feed + event-paneler. Layout-ändring: scoreboard sticky topp, event-panel fälls upp över commentary-feed-bottnen. Kräver omstrukturering av `MatchLiveScreen` men ingen ny screen.
- **`MatchReportView.tsx`** restylas — datakontraktet `{ fixture, game, onClose }` är fast. `generateMatchStory()` används som den är.
- **Befintliga `*Secondary.tsx`-komponenter** (`BoardObjectivesSecondary`, `WeeklyDecisionSecondary`, `ActiveArcsSecondary`) restylas — datakontrakten är fasta, bara visuell yta byts.

### Mot designsystemet

- **Stålvallen-tokens** (`--bg-leather`, `--copper`, `--led-red`, etc) är NYA tokens som ska läggas till `colors_and_type.css`. Befintliga tokens (`--accent`, `--bg-portal-surface`, `--gold`) rörs ej — de har egna roller.
- **`--gold #E8B95C`** (cup-vinst-variant från cup_done_winner-anslag) bevaras separat från `--copper #C47A3A`. Olika roller: gold = vinst-celebration, copper = generell brand-accent.
- **7-segment-glyfer** kräver custom CSS (definierad i scoreboard-mocken). Ny render-funktion `renderDigit(char, sizeClass)` används av scoreboard-modulen.
- **Stålvallen är universellt designsystem**, inte klubbspecifikt. Forsbacka råkar vara managed-klubb i mockarna — koppar = "managed", stål = "andra". Inga klubbspecifika designs.

### Mot designerns mockar

- Designern använder Forsbacka, Västanfors, Söderfors, Karlsborg, Skutskär — alla riktiga klubbar från `clubExtendedInfo.ts`. Ingen klubbnamnsförvirring.
- SM-final i Match Report sätts på Studenternas IP (Uppsala) — matchar `specialDateService` finaldag-arena.
- Cup-final-arena är inte representerad i mockarna men finns i `specialDateService` (Sävstaås IP, Bollnäs). Match Report-mocken visar SM-final, inte cup-final. Cup-final skulle få samma final-pannband men annan arena.

---

## Tester och regression

### Befintliga tester som måste fortsatt vara gröna

723 tester (efter anslag-variants-implementationen). Alla event-mekaniker är test-täckta. Restyling rör inte tester.

### Nya tester per batch

- **Batch 2:** scoreboard data-binding (mål från fixture-events placeras korrekt på tidslinjen, utvisnings-timer räknar ner, FT-state visar inte NU-prick). Commentary-feed tag-vokabulär (rätt tag per event-typ).
- **Batch 1:** slutminuts-trigger oförändrad (step >= 55, scoreDiff === -1). Match Report data-render (alla 4 mock-states fungerar med faktisk fixture-data).
- **Batch 4:** Portal secondary cards renderar med data från befintliga services. Inga regression-buggar i `boardObjectiveService`, `weeklyDecisionService`, `arcService`.
- **Batch 3:** alla event-services routas korrekt till sina taktiktavlor. Sub-choice-mappning verifierad (KORT → layOff, BRYT → sprint, etc).

### Visuell regression

Stålvallen är stort skifte i designspråk. Innan implementation: ta screenshots av nuvarande UI så vi kan jämföra. Specifikt:
- Portal secondary cards (innan/efter)
- MatchLiveScreen (innan/efter)
- MatchReportView (innan/efter)

Spara dem i `docs/match-live-bundle/_regression/` om vi vill jämföra.

---

## Vad tas inte med

- **Per-klubb-anpassad scoreboard.** Stålvallen är universell. Om vi senare vill ha 12 klubb-specifika designs är det egen iteration.
- **Animationer utöver det som redan är specat** (score-flash, count-down-ring puls, scanlines). Inga nya animationer i v1.
- **Audio-effekter.** Mocken är tyst. Audio är separat designspår.
- **Press/media-feature** (Batch 5) är specat men prioriteras lägre. Kan komma senare.
