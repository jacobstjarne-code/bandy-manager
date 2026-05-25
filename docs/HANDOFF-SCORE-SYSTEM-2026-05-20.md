# HANDOFF — Score-system (tre visuella primitiver)

**Från:** Design-Claude
**Datum:** 2026-05-20
**Till:** Code (implementerar), Jacob (acceptans)
**Pairas med mock:** `docs/mockups/2026-05-20_design_score_system.html`
**Föregående:** Klubbminne-handoffen (sektion G introducerade score-block + formkurva)
**Status:** Designval öppna i §3 — Code bygger komponenter när Jacob bekräftar.

> **OBS (Opus 2026-05-22):** Denna handoff har en granskning + konkret
> implementationsplan i `docs/CODE_UPPDRAG_SCORE_SYSTEM_2026-05-22.md`. Läs DEN
> först — den rättar tre punkter (financeLog finns redan, score-block är fjärde
> form-primitiv, tokens verifierade) och ger byggordning. Denna fil är källan,
> uppdraget är planen.

---

## 0 · TL;DR

Klubbminne-arbetet etablerade två nya visuella primitiver — **score-block** och **sparkline**. Tillsammans med befintliga **LED-numerals** (Stalvallen-systemet) ger det Bandy Manager **tre visuella vokabulär** för score-data. Den här handoffen etablerar dem som del av designsystemet med klar gränsdragning.

**Principen:** tre register för tre situationer. LED för "live, just nu". Score-block för "vad blev resultatet". Sparkline för "över tid". Specialisering, inte konflikt.

**Två återanvändbara komponenter ska byggas:**
- `<ScoreBlock>` — `score`, `label`, `variant`, `compact`
- `<Sparkline>` — `points`, `markers`, `stroke`, `height`

LED-systemet bevaras oförändrat (redan implementerat i Stalvallen-bundle).

**Total estimat:** ~6h för komponenter + första migrering. Övriga ytor migreras inkrementellt.

---

## 1 · Tre primitiver — anatomi

### 1.1 · LED-numerals (befintligt — bevaras)

- Font: `--font-mono`, 32px, bold
- Färger: `--led-red` (score), `--led-amber` (label/tid), `--led-green` (period)
- Text-shadow för glow-effekt
- Bakgrund: `--led-bg` (#0A0A0A)

**Kontext:** Bara under match (live). Westerstrand-vokabulär.

### 1.2 · ScoreBlock (NY)

CSS och komponent enligt mock. Border-left-stripe ger typ (win/loss/draw/derby/gold/subtle).
Score-num i `--font-mono` 16px, tabular-nums. Label 7px uppercase under.
Compact-variant för list-rows (min-width 44px).

**Kontext:** Retrospekt. När matchen är klar och scoren är historisk fakta.

### 1.3 · Sparkline (NY)

- SVG 200×28 viewBox, `preserveAspectRatio="none"`
- Polyline med 1.5px stroke, `--accent` default
- Markers: circles 2–3px med färg per typ
- Stora markers (3px) får border `--text-light` 0.5px

Props: `points: number[]`, `markers?: {index,color,size,ringed}[]`,
`stroke?: 'accent'|'cold'|'success'|'warm'`, `height?: number`,
`yInverted?: boolean`, `label?: string`.

**Kontext:** Trend. När datan visar förändring över tid.

---

## 2 · Cheatsheet — när vilken används

| Primitiv | När | Var (befintliga ytor) |
|---|---|---|
| **LED** | Live, just nu | Scoreboard, MatchEvents, MatchLive, MatchHalftime |
| **Block** | Retrospekt, klart | RoundSummary, WatchOthers, MatchReport, Klubbminne, OpponentForm |
| **Spark** | Trend över tid | FormStatus, PlayerCard, EkonomiTab, AcademyTab, SeasonSummary, JournalistSec |

### Fem regler

1. **En primitiv per yta.** Blanda inte LED + Block på samma skärm.
2. **Sparkline kräver minimum 5 datapunkter.** Färre = använd Block.
3. **Score-block-label max 11 tecken.** "KVARTS G5" är gränsen. Längre = ta bort label.
4. **Gold-variant av Block reserveras för SM-Final + Cup-final.** Spara magin.
5. **Sparkline-stroke per kontext:** `--accent` default, `--cold` för relation, `--success` för positiva trender.

---

## 3 · Designval öppna till Jacob

### Q1 · Bygga komponenterna nu eller per-yta?
**Föreslag:** Bygg `<ScoreBlock>` + `<Sparkline>` som återanvändbara komponenter **först**, sedan migrera ytor en i taget.
**[OPUS-BESLUT 2026-05-22]:** Komponenter först. Bekräftat. Se uppdrag §B.

### Q2 · Vilken yta migreras först?
**Föreslag prioritet:** 1. RoundSummary "Andra matcher", 2. Klubbminne, 3. OpponentForm + FormStatus, 4. Resten inkrementellt.
**[OPUS-BESLUT 2026-05-22]:** Se uppdrag §D för full byggordning — ordningen ändrad efter datakälla-verifiering.

### Q3 · Data-pipeline för sparkline
**Föreslag:** `recordSnapshot(category, value, round)` vid varje `advance()`. Lagra 22 punkter per kategori i SaveGame.
**Snapshot-kategorier:** standingsPosition, clubFinances, journalistRelation, playerForm.
**[OPUS-RÄTTNING 2026-05-22]:** `clubFinances` byggs INTE — `SaveGame.financeLog` finns redan. Pipeline byggs för standings + journalistRelation + playerForm. Se uppdrag §A1.

---

## 4 · Migreringsplan

| Prioritet | Yta | Primitiv | Estimat |
|---|---|---|---|
| 🔴 Hög | RoundSummaryScreen "Andra matcher" | ScoreBlock compact | ~1h |
| 🔴 Hög | Klubbminne (separat handoff §G) | ScoreBlock + Sparkline | ~3h |
| 🟧 Medel | OpponentFormSecondary | ScoreBlock-row | ~45 min |
| 🟧 Medel | FormStatusMinimal | Mini-Sparkline | ~30 min |
| 🟧 Medel | WatchOthersSecondary (spectator) | ScoreBlock | ~30 min |
| 🟨 Låg | PlayerCard form-graph | Sparkline | ~1h |
| 🟨 Låg | EkonomiTab kassan över tid | Sparkline (läs financeLog!) | ~2h |
| 🟨 Låg | JournalistSecondary relation-trend | Mini-Sparkline | ~45 min |
| 🟨 Låg | AcademyTab CA-progression | Sparkline per spelare | ~1.5h |
| 🟨 Låg | SeasonSummaryScreen hero-trend | Sparkline | ~1h |

**Total migrering:** ~13h. Byggordning i uppdrag §D — inte denna tabells ordning rakt av.

---

## 5 · Risker att flagga

1. **Sparkline-inflation.** Bara där "över tid" är relevant info. Inte TransferPlayerCard, inte enskild matchrad.
2. **LED + Block-konflikt.** MatchReport: under match = LED, efter slutsignal = Block. Inga övergångar inom samma vy.
3. **Mini-sparkline minimum.** ~40×16px för 5 punkter.
4. **Performance.** OpponentForm × 12 klubbar + Portal-stack = 100+ SVG. Mät på low-end Android innan full migrering.
5. **Datakrav.** Sparkline behöver historik. Inkrementell: börja samla nu, fall back på tom-tillstånd.

---

## 6 · Designsystem-additions (dokumentera i `design-system/DESIGN-DECISIONS.md`)

1. Tre score-primitiver: LED / Block / Sparkline.
2. Gold-variant av ScoreBlock reserveras för SM-Final + Cup-final.
3. Sparkline-stroke-färger per kontext.
4. Sparkline minimum: 5 datapunkter och 40×16px.

---

## 7 · Vad denna handoff INTE rör
Stalvallen LED-systemet (oförändrat), bar/donut-charts (behövs ej), färgade emoji som dataviz, tabell-vyn (eget spår).

---

## 8 · Acceptanskriterier
- [ ] `<ScoreBlock>` i `src/presentation/components/primitives/ScoreBlock.tsx`
- [ ] `<Sparkline>` i `src/presentation/components/primitives/Sparkline.tsx`
- [ ] `score-primitives.css` med alla klasser
- [ ] Inga inline-styles, alla färger via `var(--*)`
- [ ] RoundSummary "andra matcher" migrerad som första bevis
- [ ] Snapshot-pipeline för standings + journalist-relation (+ playerForm) — INTE finances
- [ ] Tester: ScoreBlock-variant, Sparkline-normalisering

— Design-Claude, 2026-05-20 (granskad + planerad av Opus 2026-05-22)
