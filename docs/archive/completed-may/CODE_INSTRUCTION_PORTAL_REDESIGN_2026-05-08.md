# CODE — Portal Secondary Cards Redesign 2026-05-08

**Kontext:** Designs leverans `HANDOFF-PORTAL-SECONDARY-AND-SCOREBOARD.md` Del A. Detta är **redesign av tre existerande komponenter**, inte ny implementation.

**Scope:** Bara Del A (Portal cards). Del B (Scoreboard) är PAUS — väntar Design-normalisering. Rör inte `Scoreboard.tsx` eller match-vy-komponenter i denna sprint.

---

## LÄS INNAN DU BÖRJAR — OBLIGATORISKT

1. `design-system/HANDOFF-PORTAL-SECONDARY-AND-SCOREBOARD.md` — STATUS-sektion + DEL A BESLUT-sektion + DEL A spec
2. `docs/mockups/2026-05-08_design_portal-secondary-cards.html` — visuell referens
3. `docs/DESIGN_REVIEW_2026-05-08.md` — fullständig konflikt-genomgång mock vs befintlig kod (för djupare bakgrund)
4. **Befintliga komponenter du ska ändra:**
   - `src/presentation/components/portal/secondary/WeeklyDecisionSecondary.tsx`
   - `src/presentation/components/portal/secondary/ActiveArcsSecondary.tsx`
   - `src/presentation/components/portal/secondary/BoardObjectivesSecondary.tsx`

---

## ARBETSORDNING

**Diff, inte rewrite.** För varje komponent: läs befintlig kod, identifiera vilka rader som behöver ändras enligt mockens visuella mål, lämna logikkärnan orörd. Om du upptäcker att en hel komponent behöver omstruktureras — stoppa och fråga Jacob innan du fortsätter.

---

## PORTAL-01 · WeeklyDecisionSecondary

**Fil:** `src/presentation/components/portal/secondary/WeeklyDecisionSecondary.tsx`

### Behåll

- `CATEGORY_META`-mappningen och dess fyra labels (player/supporter/training/community)
- `useState` + `useRef` + `capturedDecision` + resolution-mönstret med `setTimeout(1500)` och ✓-checkmark
- `resolveWeeklyDecision`-anropet och dess hantering
- All routing-logik mot store

### Ändra

1. **Frågans typografi:**
   ```tsx
   // Från:
   fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, lineHeight: 1.4
   // Till:
   fontFamily: 'var(--font-display)', fontStyle: 'italic',
   fontSize: 14, lineHeight: 1.5, fontWeight: 400
   ```

2. **Knapp-stil — likvärdig transparent (ej elevated):**
   ```tsx
   // Från befintlig "var(--bg-portal-elevated) + 1.5px border var(--accent)"
   // Till mockens transparent variant:
   background: 'transparent',
   border: '1px solid rgba(196,122,58,0.4)',
   ```
   Hover: `background: 'rgba(196,122,58,0.1)'`, `borderColor: 'var(--accent)'`.
   Båda knappar identiska tills klick — aldrig solid + transparent samtidigt.

3. **Stripe-bredd enligt kategori:**
   - `category === 'supporter'` → 3 px stripe i `var(--warm)` (relations/persona)
   - alla andra kategorier → 2 px stripe i `var(--accent)` (innehåll)
   
   Implementera via villkorad styling på `borderLeft`-värdet.

4. **Card-label tonas ner:**
   `fontSize: 9, letterSpacing: '2px'` (mocken), `opacity: 0.85`, behåll emoji + label-text.

### Acceptans

- [ ] CATEGORY_META levererar fortfarande rätt label per kategori
- [ ] Frågan renderas i Georgia italic
- [ ] Båda knappar har identisk transparent stil tills klick
- [ ] Resolved-state med checkmark fungerar som förut
- [ ] Stripe-bredd växlar 2px/3px baserat på `decision.category === 'supporter'`

---

## PORTAL-02 · ActiveArcsSecondary

**Fil:** `src/presentation/components/portal/secondary/ActiveArcsSecondary.tsx`

### Behåll

- `ARC_ICON[arc.type]`-mappningen från `activeArcStrings.ts` — alla 6+ arc-typer
- `slice(0, 2)`-cap på antal rader
- Sortering på phase + priority
- `getPhaseDots()`-logiken
- Routing till `/game/squad` med `highlightPlayer`

### Ändra

1. **Layout enligt mock:**
   - emoji 18 px med `flex-shrink: 0`
   - body med headline (12 px semibold) + meta-rad
   - phase-dots i meta-raden (5 px, gap 3 px)
   - meta-text 10 px muted

2. **Phase-dots utan border:**
   ```tsx
   // Från: border: '1px solid var(--accent)' + transparent fill
   // Till: solid bakgrund per state
   .phase-dot                { background: 'rgba(196,122,58,0.3)' }    // upcoming
   .phase-dot.active         { background: 'var(--accent)' }
   .phase-dot.done           { background: 'var(--accent-deep)' }
   ```
   
   Observera: `--accent-deep` används. Verifiera att den finns i `colors_and_type.css` — om inte, fråga Jacob om token ska läggas till eller om vi använder `rgba(162, 88, 40, 1)` (Designs `--copper-deep`-värde).

3. **Inre avdelare mellan rader:**
   `border-bottom: 0.5px solid rgba(196,122,58,0.15)` mellan arc-rader, ingen efter sista.

4. **Card-label:** behåll "📖 I blickfånget", styla som mock (9 px letter-spacing 2 px accent 0.85).

### Acceptans

- [ ] Alla arc-typer (`ARC_ICON`) renderar korrekt
- [ ] Phase-dots: 1 av 3 = building, 2 = peak, 3 = resolving
- [ ] Klick på arc-rad navigerar till spelarkort om `arc.playerId` finns
- [ ] 0.5 px avdelare mellan rader, ingen efter sista

---

## PORTAL-03 · BoardObjectivesSecondary

**Fil:** `src/presentation/components/portal/secondary/BoardObjectivesSecondary.tsx`

### Behåll

- Domänmodellen `BoardObjective` med `measureFn`, `currentValue`, `targetValue`
- `formatOwnerInitial()` med fullnamn ("P. Andersson")
- `STATUS_ICON`-mappningen (`active → 📌`, `at_risk → ⚠️`, `failed → ❌`, `met → ✅`)
- `slice(0, 2)`-cap
- `formatMoney()`-helpern
- Routing till `/game/club` med `tab: 'orten'`

### Ändra

1. **Ta bort STATUS_LABEL-text bredvid namnet.** Bara icon + label, ingen "Aktivt"/"I fara"-text.

2. **Layout per rad enligt mock:**
   ```
   [icon]  [label]              [owner uppercase 9px]
           [progress eller money — full bredd undertill]
   ```
   
   Label + owner är `display: flex; justify-content: space-between`. Progress/money tar full bredd undertill (inte indenterad 22px som idag).

3. **Mappa `display.kind` från befintlig modell:**
   ```ts
   const displayKind = obj.measureFn === 'balanceBudget' ? 'money' : 'progress'
   ```
   Använd för att välja mellan progress-bar (3 px hög, accent/danger/success) och money-rad (`+120 tkr av mål +200 tkr`).

4. **Owner format i mocken:**
   `fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase'`. Befintlig kod använder `formatOwnerInitial()` som returnerar "P. Andersson". Anamma uppercase-styling men behåll fullnamn — alltså "P. ANDERSSON" inte "PELLE".

### Acceptans

- [ ] Inga status-text-labels längre — bara icon
- [ ] Owner visas som "P. ANDERSSON" (uppercase, fullt efternamn behålls)
- [ ] Progress-bar och money-rad väljs via `measureFn === 'balanceBudget'`-villkor
- [ ] Layout: label vänster, owner höger på samma rad; progress/money full bredd undertill

---

## PORTAL-04 · Stripe-system konsekvens (alla tre)

**Bekräfta att alla tre komponenter följer samma stripe-konvention:**
- 2 px `var(--accent)` = innehållstyp (default)
- 3 px `var(--warm)` = relations/persona (när komponenten visar relations-natured content)

För Portal-cards-implementationen denna sprint:
- BoardObjectivesSecondary → 2 px accent (alltid)
- ActiveArcsSecondary → 2 px accent (alltid)
- WeeklyDecisionSecondary → 2 px accent default, 3 px warm när `category === 'supporter'`

---

## PORTAL-05 · Token-verifiering

Innan du börjar, verifiera att dessa tokens finns i `design-system/colors_and_type.css`:
- `--accent`, `--accent-deep`, `--warm`
- `--bg-portal-surface`, `--bg-portal-elevated`
- `--text-light`, `--text-light-secondary`, `--text-muted`
- `--radius-md`, `--radius-sm`
- `--font-body`, `--font-display`

Om någon saknas (mest sannolikt `--accent-deep`) — stoppa och fråga Jacob om token ska läggas till. Skriv inte hex-värden direkt i komponenter.

---

## VAD DU INTE SKA GÖRA

- **Inte radera** `CATEGORY_META`, `ARC_ICON`-mappningen, `formatOwnerInitial()`, eller resolution-mönstret med setTimeout
- **Inte ändra** domänmodellen `BoardObjective` eller dess `measureFn`-system
- **Inte byta ut** ägarens fullnamn mot bara förnamn ("PELLE")
- **Inte införa** sektionsrubriker mellan secondaries (`⊩ Veckans fråga ⊩` är mock-layout, inte produktionsavsedd)
- **Inte röra** `Scoreboard.tsx` eller match-vy-komponenter i denna sprint (Del B är PAUS)
- **Inte införa** nya tokens utan att fråga (verifiera `colors_and_type.css` först)

---

## RAPPORTERA NÄR KLART

För varje PORTAL-XX punkt: ✅ / ⚠️ / ❌ med en mening om vad som gjordes (eller inte). Pusha varje komponent som egen commit:

```
PORTAL-01: WeeklyDecision Georgia-italic + transparent knappar
- Frågan får Georgia italic 14px line-height 1.5
- Knappar transparenta med accent border (likvärdig stil)
- Stripe 2px accent default, 3px warm när category=supporter
- CATEGORY_META + setTimeout-resolution intakt
```

Slutrapportera mot denna fil i Slack/chatt så Jacob kan klocka systemen från 🟠 till 🟢 i `INLASTA_SYSTEM.md` efter playtest-verifiering.

---

## OUT OF SCOPE — påminnelse

- **Scoreboard / Stålvallen** — Del B i samma HANDOFF är PAUS. Designs ny normaliserade förslag väntas. Rör inte.
- **Industrial-LED-tokens** (`--led-red`, `--bezel-*`, etc) — införs inte i denna sprint.
- **Sektionsrubriker** — bedömt som mock-layout, ej produktion.
- **Antal rader cap** — behåll 2, växla till 3 endast efter Jacob's playoff-test.
