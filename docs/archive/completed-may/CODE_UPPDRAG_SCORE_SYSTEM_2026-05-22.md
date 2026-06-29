# Code-uppdrag — Score-system (tre primitiver) — granskning + implementationsplan

**Av:** Opus, 2026-05-22. **Pairas med:** Design-Claudes handoff + mock
(`HANDOFF-SCORE-SYSTEM-2026-05-20.md`, `2026-05-20_design_score_system.html`).
**Status:** Redo för Code EFTER att §A-rättningarna är inlästa. Granskningen
nedan ändrar handoffen på tre punkter — bygg INTE rakt mot handoffen utan att
läsa §A först.

Princip: detta är UI-arbete (CLAUDE.md kategori D). Läs
`design-system/CODE-OPUS-INSTRUCTION.md` + mocken före första raden kod. Per
Jacobs granskningsregel: verifiera i KONTEXT, aldrig isolerat (LESSONS #25 —
pixel-audit i isolation missade NextMatchCard-token-krocken).

---

## A · GRANSKNING — tre rättningar mot handoffen (kod-verifierat 2026-05-22)

Opus läste `SaveGame.ts` + `global.css` + mocken. Tre avvikelser som måste in
INNAN bygge, annars blir de tysta buggar:

### A1 — Datakälla för kassa-sparkline FINNS redan. Bygg inte parallell.
Handoffen §3 Q3 + §8 listar `clubFinances` som en snapshot-kategori att bygga.
**Fel — `SaveGame.financeLog` finns redan** (`FinanceEntry[]`, "last
FINANCE_LOG_MAX entries" från economyService). EkonomiTab-sparkline (migrering
🟨) ska läsa `financeLog`, INTE en ny `recordSnapshot('clubFinances')`. Två
källor för samma data = LESSONS #6 (spec-dubblering). **Acceptanskriteriet i §8
ändras:** snapshot-pipeline byggs för `standingsPosition` + `journalistRelation`
+ `playerForm` — INTE finances.

Verifiering av de andra tre (Opus läste SaveGame):
- `standingsPosition` — ingen per-omgång-historik finns (`seasonSummaries` är
  per säsong, inte per omgång). Snapshot behövs. ✓ bygg.
- `journalistRelation` — `journalistRelationship?: number` är skalärt nuvärde,
  ingen serie. Snapshot behövs. ✓ bygg.
- `playerForm` — Player har nuvärde, ingen serie. Snapshot behövs. ✓ bygg.

### A2 — Score-block är en FJÄRDE form-primitiv. Deklarera dess plats explicit.
`global.css` har redan en form-hierarki: `.card-sharp` (radius 8px, faktadata),
`.card-round` (14px, narrativ), `.tag` (pill, passiv info), `.btn` (interaktiv).
Score-block lägger till en fjärde med `border-radius: 2px` — VASSARE än allt
annat. Det är medvetet i mocken (score = hårdast fakta), men Code får INTE
"harmonisera" det mot `.card-sharp` 8px. **Tvingande:** score-block radius =
2px, exakt som mock. Om det ser fel ut mot card-sharp i kontext — flagga till
Jacob, ändra inte. Detta är ett designsystem-beslut, inte en stiljustering.

### A3 — Använd befintliga tokens + utility-klasser, inte mockens råa värden.
Mocken deklarerar egna `:root`-värden (den är fristående HTML). Appens riktiga
tokens i `global.css` matchar färgerna, MEN:
- `font-variant-numeric: tabular-nums` finns redan som `.tabular`-klass. Score-
  numret SKA använda `.tabular` (eller `font-feature-settings: "tnum"`), inte
  bara `font-variant-numeric` rått — annars glider score-siffror i bredd vid
  ental/tvåsiffrigt (4–1 vs 12–10).
- Alla färger via `var(--*)` — inga hex. (Acceptanskriterium, redan i handoff.)
- `--gold`, `--success`, `--danger`, `--warm-light`, `--cold` verifierade
  finnas i global.css. Inga saknas. Om Code tror en token saknas → den finns,
  läs global.css igen, hitta inte på hex.

---

## B · KOMPONENTBYGGE — grafiskt tvingande acceptanskriterier

Två komponenter + en CSS-fil. Varje kriterium nedan är VERIFIERBART — Code ska
kunna bevisa det med en rad kod eller en skärmdump, inte påstå "ser bra ut".

### B1 — `<ScoreBlock>` (`src/presentation/components/primitives/ScoreBlock.tsx`)

Props exakt enligt mock: `score: string`, `label?: string`, `variant?: 'win' |
'loss' | 'draw' | 'derby' | 'gold' | 'subtle'`, `compact?: boolean`.

**Tvingande (bevisbart):**
1. Score-numret renderas med `.tabular` ELLER `font-feature-settings: "tnum"`.
   BEVIS: "12–10" och "4–1" har identisk sifferbredd per tecken. Skärmdump av
   båda staplade.
2. Radius = 2px (A2). Inga andra radius-värden.
3. Varje variant ändrar BARA `border-left-color` (+ för gold/subtle även
   bakgrund per mock). BEVIS: alla sex varianter i en rad, syns att stripe-färg
   är enda skillnad utom gold/subtle.
4. `gold`-variant får INTE renderas av komponenten för annat än SM-final/Cup-
   final. Komponenten kan inte veta kontexten — så detta tvingas vid ANROP, och
   Code lägger en kommentar i komponenten: `// gold reserveras för
   SM-final/Cup-final — se designsystem regel 4`.
5. Inga inline-styles. All CSS i `score-primitives.css`. BEVIS: grep visar noll
   `style={{` i ScoreBlock.tsx.
6. `label` över 11 tecken: komponenten ska INTE rendera labeln (mock regel 3).
   BEVIS: `<ScoreBlock score="4–1" label="DETTA ÄR FÖR LÅNGT" />` renderar utan
   label. Inte trunkera — utelämna.

### B2 — `<Sparkline>` (`src/presentation/components/primitives/Sparkline.tsx`)

Props: `points: number[]`, `markers?: { index, color, size?, ringed? }[]`,
`stroke?: 'accent' | 'cold' | 'success' | 'warm'`, `height?: number`,
`yInverted?: boolean`, `label?: string`.

**Tvingande (bevisbart) — sparkline har två kända fällor, båda måste hanteras:**
1. **`preserveAspectRatio="none"` töjer stroke olika i x/y** (besläktat med
   LESSONS #1). Stroke-bredden 1.5px blir visuellt ojämn när viewBox töjs till
   container-bredd. BEVIS: rendera en sparkline i ett 60px-fält OCH ett
   300px-fält — stroke får INTE se tjockare ut i det smala. Lösning:
   `vector-effect="non-scaling-stroke"` på polyline. Om Code inte använder det,
   måste Code bevisa att stroke är jämn ändå.
2. **Normalisering av points till viewport.** `points` är råa y-värden (t.ex.
   tabellplaceringar 1–12, eller kassa i kr). De ska normaliseras till
   0..(height−4) så kurvan fyller höjden oavsett indata-range. BEVIS: points
   `[1,12,1,12]` och `[100,1200,100,1200]` ger IDENTISK kurvform. Enhetstest.
3. **`yInverted`** för placering (1 = överst = bäst). BEVIS: points `[1,2,3]`
   med yInverted ritar en NEDÅTGÅENDE kurva (placering blev sämre), utan
   yInverted en uppåtgående. Enhetstest båda.
4. **Minimum 5 punkter.** Färre → komponenten renderar inget (eller ett tomt-
   tillstånd), och anropssidan ska använda ScoreBlock istället (mock regel 2).
   BEVIS: `<Sparkline points={[1,2,3]} />` renderar tomt-tillstånd, inte en
   3-punkts-linje.
5. **Tomt-tillstånd vid saknad historik.** Många ytor saknar data initialt
   (A1 — pipelinen börjar tom). `points={[]}` → "saknar historik"-tillstånd,
   inte krasch, inte tom SVG. BEVIS: skärmdump av tom-tillståndet.
6. Inga inline-styles, alla färger via token. Samma som B1.5.

### B3 — `score-primitives.css` (`src/presentation/styles/`)
Alla klasser för båda komponenterna. Importeras EN gång (verifiera var appens
CSS-import-kedja går — troligen `main.tsx` eller `App.tsx`; grep efter
`import '.*\.css'`). BEVIS: klasserna syns i datorn, inga dubbletter av
befintliga global.css-klasser (kolla att `.tabular` återanvänds, inte
omdefinieras).

---

## C · BYGGSEKVENS — motiverad ordning (Opus läste ytorna 2026-05-22)

Handoffen säger "RoundSummary först". **Det är fel första-migrering, och jag
ändrar det — inte för att bunta undan, utan för att jag läst koden och ordningen
bygger på fel premiss.** Tre fynd från ytläsningen som styr sekvensen:

**Fynd 1 — RoundSummary är LJUS bakgrund.** `RoundSummaryScreen.tsx` renderar på
`var(--bg)` (ljust papper) med `texture-wood` + `card-sharp`-kort
(`--bg-surface`). Mockens score-block har `background: var(--bg-portal-elevated)`
(#2a241e, MÖRK). Ett mörkt score-block på ljust papper blir en svart klump —
exakt LESSONS #25 (NextMatchCard renderade vit mot mörk portal; här tvärtom).
RoundSummary kan därför INTE migreras med mockens score-block som det är. Det
kräver en LJUS-yta-variant av score-block FÖRST — ett designtillägg utöver
mocken. Att börja här = börja med det svåraste, dolt bakom handoffens "1h".
Dessutom: "andra matcher" har redan en kompakt egen rad (`getClubShort` +
`homeScore–awayScore` + relevant-stripe via `isRelevantFixture`). Den fungerar.
Vinsten av att byta är reell men inte störst, och kostnaden är en ny variant.

**Fynd 2 — OpponentForm är MÖRK bakgrund och har datan FÄRDIG.**
`OpponentFormSecondary.tsx` är ett portal-secondary-kort (`--bg-portal-surface`,
mörk). `getFormResults()` returnerar redan `{ result: 'V'|'O'|'F', score:
'3–1', opponent }` — `result` mappar 1:1 till win/draw/loss-variant, `score` är
exakt ScoreBlock-formatet. Mörk yta + färdig data + mockens score-block-row
(§03) passar UTAN ny variant och UTAN ny data. **Detta är den verkliga första
migreringen** — den bevisar komponenten i kontext (LESSONS #25) på den yta den
faktiskt designades för (mörk).

**Fynd 3 — FormStatusMinimal kan INTE få sparkline än.** Den visar ett enda
nuvärde (`avgForm`, medel av spelarnas form) — INGEN historik. Mockens "FÖRE"
visar "V V O"-sträng, men koden visar talet "62". En sparkline kräver 5 punkter
över tid; de finns inte förrän snapshot-pipelinen (A1, playerForm) byggts och
samlat data i 5+ omgångar. FormStatus-sparkline är alltså PIPELINE-BEROENDE, inte
en quick win. Mockens 🟧-prio är fel här.

### Sekvensen, med skäl och databeroende per steg:

| # | Steg | Yta | Varför här | Databeroende |
|---|---|---|---|---|
| 1 | B1 ScoreBlock + B3 CSS | — | Allt annat beror på den. Bygg mörk-yta-varianten enligt mock (score-block bor på portal-ytor). | inget |
| 2 | **OpponentForm** (FÖRSTA migrering) | portal-secondary, MÖRK | Mörk yta = mockens block passar rakt av. `getFormResults` ger score+result färdigt. Bevisar komponenten i kontext utan ny variant/data. LESSONS #25-säker. | finns nu ✓ |
| 3 | B2 Sparkline + B3 CSS | — | Behövs för pipeline-ytorna. Bygg med non-scaling-stroke + normalisering (se §B2). | inget |
| 4 | ~~WatchOthersSecondary~~ **STRUKEN** | portal-secondary | **Ej score-yta.** Code läste den (b3d05fe): `card-sharp` LJUS bakgrund + datan är SCHEMALAGDA matcher (`FixtureStatus.Scheduled`), inga avgjorda scores. Visar kommande slutspelsmatcher man INTE är med i — ett reflektions-kort, inte ett resultat-kort. Score-block vore fel verktyg oavsett bakgrund. Behåll textraden. | — |
| 5 | **Snapshot-pipeline** (A1) | datamodell | Lås upp ALLA trend-ytor. standings + journalistRelation + playerForm. Flagga anrop-plats för Opus (cup/liga-asymmetri, LESSONS #14). | bygger datat |
| 6 | **Ljus-yta-variant** av ScoreBlock | score-primitives.css | Krävs INNAN RoundSummary. Ny variant `.score-block.light` med `--bg-surface` + mörk text. Designtillägg — bekräfta utseende mot Jacob (mock-driven). | inget |
| 7 | **RoundSummary** "andra matcher" | screen, LJUS | NU möjlig — ljus-varianten finns. Ersätt befintlig rad. Behåll relevant-stripe-logiken (`isRelevantFixture`). | finns nu ✓ |
| 8+ | Pipeline-beroende trend-ytor | div. | FormStatus (mini-sparkline, playerForm-snapshot), PlayerCard, EkonomiTab (financeLog!), Journalist, Academy, SeasonSummary. Var och en när dess data finns. | pipeline (steg 5) |

**Vad detta ändrar mot handoffen:** OpponentForm flyttas från 🟧 till FÖRSTA
(det är den enklaste säkra vinsten). RoundSummary flyttas från FÖRSTA till efter
ljus-varianten (det krävde ett dolt designtillägg). FormStatus flyttas till
pipeline-beroende (kan inte göras före steg 5). Steg 1–4 är denna leverans och
har noll databeroende eller dolda varianter — ren vinst. Steg 5–7 är nästa pass.
Steg 8+ är genuint inkrementellt OCH genuint pipeline-låst — inte "senare för att
det är jobbigt", utan "kan fysiskt inte byggas förrän datat finns".

### Tvingande för varje migrering (steg 2, 4, 7):
1. Verifiera i KONTEXT med faktisk game-state, aldrig isolerat (LESSONS #25).
   Skärmdump av kortet i sin riktiga skärm.
2. Variant härleds korrekt: V→win (grön), O→draw (grå), F→loss (röd). Derby via
   `getRivalry`-check → derby-variant (warm). BEVIS: skärmdump med minst en av
   varje synlig.
3. Score-numret via `.tabular` (A3). BEVIS: "12–10" och "4–1" linjerar.
4. Ersätter befintlig text/rad, kompletterar inte (LESSONS #6).
5. Rätt yta-variant: mörk score-block på portal-ytor (steg 2,4), ljus på
   RoundSummary (steg 7). BEVIS: blocket smälter in i kortets bakgrund, inte en
   kontrasterande klump.

---

## D · DENNA LEVERANS vs NÄSTA PASS

**LEVERERAT (commit b3d05fe, 2026-05-23):** Steg 1 (ScoreBlock + CSS), steg 2
(OpponentForm-migrering), steg 3 (Sparkline). Alla tvingande kriterier mötta:
`.tabular`, radius 2px, label-regel, non-scaling-stroke, normalisering,
yInverted, MIN_POINTS=5, flat-line-centrering. DESIGN-DECISIONS.md uppdaterad.
Steg 4 (WatchOthers) STRUKEN — Code verifierade att det inte är en score-yta
(ljus card-sharp + schemalagda matcher utan score). Rätt catch.

**Nästa pass (steg 5–7):** snapshot-pipeline → ljus-variant → RoundSummary.
Pipelinen är datamodell-arbete (flagga anrop-plats för Opus före bygge,
cup/liga-asymmetri LESSONS #14). Ljus-varianten är ett designtillägg (bekräfta
mot Jacob). Dessa väntar inte "för att det är jobbigt" — de väntar för att
RoundSummary fysiskt kräver ljus-varianten, och den är ett medvetet designval.

**ANDRA MÖRK-YTA-BEVISET saknas nu** (WatchOthers var tänkt som det). Inte
blockerande — OpponentForm bevisade redan komponenten i kontext. Men om ett
andra mörk-yta-bevis vill ha före pipelinen: auditens våg 1 har
GranskaForlopp-rivaler-listan + SimSummaryScreen (båda matchresultat). Verifiera
yta-färg först (samma fälla som WatchOthers) innan de antas vara mörka.

**Steg 8+ (pipeline-låsta):** FormStatus, PlayerCard, EkonomiTab, Journalist,
Academy, SeasonSummary. Var och en kan byggas FÖRST när dess snapshot-data
samlats 5+ omgångar. Genuint inkrementellt — inte parkerat, utan data-grindat.

**Performance-grind (mock-risk 4):** före bred sparkline-utrullning (steg 8+) —
mät OpponentForm ×12 + Portal-stack på låg-end Android. 100+ SVG. Grind, inte
blockare.

---

## E · VAD OPUS INTE KUNNAT VERIFIERA (Code stänger)
- `WatchOthersSecondary` — Opus har inte läst den (steg 4). Verifiera att den är
  mörk yta + har matchresultat-data innan migrering. Om den avviker — flagga.
- CSS-import-kedjan (var score-primitives.css importeras) — grep
  `import '.*\.css'` i main.tsx/App.tsx.
- `design-system/CODE-OPUS-INSTRUCTION.md` aktuella form-token-regler — läs för
  att placera score-block rätt i hierarkin (A2) + härleda ljus-variantens tokens
  (steg 6).
- Snapshot-anropets plats i `advance()`/roundProcessor (steg 5) — flagga till
  Opus före bygge, cup/liga-asymmetri (LESSONS #14).

---

## F · COVERAGE-AUDITEN (2026-05-23) — förhållande till denna plan

Design levererade `docs/mockups/AUDIT-SCORE-SYSTEM-COVERAGE-2026-05-23.md` — en
systematisk genomgång som hittade **27 ytor** med score-data (10 i handoffen +
17 nya) och föreslår en fyra-vågs-migrering (~18–22h). Den är värdefull och ska
in — men INTE rakt av, av två skäl:

**1. Auditen upprepar RoundSummary-felet.** Den lägger RoundSummary i "Våg 1
quick wins". Min kodläsning (§C Fynd 1) visade att RoundSummary är LJUS bakgrund
och kräver ljus-varianten FÖRST — den är inte en quick win. Auditen hade inte
läst den ytan. **Min §C-sekvens gäller över auditens Våg 1 där de krockar.**

**2. Auditens 17 nya ytor är en UTÖKNING, inte denna leverans.** De hör till
score-spåret (samma primitiver) men kommer efter att §C steg 1–7 bevisat
komponenterna. När steg 1–4 är levererade är auditen rätt källa för vad som
migreras härnäst — då med RoundSummary-rättningen inarbetad.

**Två fynd i auditen som är direkt användbara nu:**
- **R.1 — victory-scenes divergerar.** Champion/CupFinalVictory/SMFinalVictory/
  MatchResult/GranskaOversikt visar matchresultat på fem olika sätt. Auditen
  föreslår migrera dem SAMLAT (gold-variant). Bra grupp — men den kräver
  gold-varianten + ev. ljus/mörk per scen. Egen våg EFTER §C, inte nu.
- **R.2 — ~60 rendering-ställen av homeScore/awayScore, inte ~13h.** Realistisk
  full-migrering 20–25h. Bekräftar att inkrementellt är rätt — och att §C steg
  8+ är data-grindat, inte parkerat.

**Beslut:** §C-sekvensen (steg 1–4) är denna leverans, oförändrad. Auditens
vågor 2–4 + de 17 ytorna blir nästa score-pass, planerat NÄR steg 1–4 är klara
och komponenterna bevisade i kontext. Rätta auditens RoundSummary-placering när
den då arbetas in. Auditens DESIGN-DECISIONS #5–7 (gold-final-rendering,
live→retrospekt-övergång, mini-sparkline-density max 12) skrivs in i
DESIGN-DECISIONS.md tillsammans med de fyra från handoffen.

— Opus, 2026-05-22 (F-sektion tillagd 2026-05-23)
