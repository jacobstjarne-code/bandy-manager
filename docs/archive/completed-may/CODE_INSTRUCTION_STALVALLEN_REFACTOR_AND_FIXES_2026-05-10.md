# CODE — Stålvallen refactor + samlade fixar

**Datum:** 2026-05-10
**Författare:** Opus
**Status:** SAMLAD KORR-SPEC + REFACTOR
**Beroende:** BATCH A, B, C, D är pushade. Detta är uppstädning + buggfixar innan vi går vidare.

---

## Översikt

Tre kategorier i en spec:

1. **Refactor (FIX-05)** — Stålvallen-implementationen ska städas upp. Inline-styles bryts ut till CSS-klasser. Konsekvent token-användning. Detta är största jobbet (~6-8h) men avgörande för underhållbarhet framåt.
2. **Buggfixar (FIX-01, FIX-03, FIX-04)** — Bugar Jacob hittade i playtest av intro-flödet och cup-finalflödet.
3. **Textkorr (FIX-02a, FIX-02b)** — Två rader i cup_finalweekend_pre Variant B.
4. **Token-disciplin (FIX-06, FIX-07)** — Saknad token + verifiering.

**Implementations-ordning rekommenderad:**

1. FIX-06 + FIX-07 först (token-grund — krävs för refactor)
2. FIX-05 (refactor — största lift)
3. FIX-01, FIX-02, FIX-03, FIX-04 (buggar och text)

Pusha gärna i två commits: först refactor (FIX-05/06/07), sen buggar/text (FIX-01/02/03/04). Det gör review enklare.

---

## FIX-01 · Disabla `season_signature_reveal` i intro-flödet

**Bug:** Efter BoardMeetingScene visas `season_signature_reveal` som klick-igenom-stegs-scen. Gammal artefakt — stör inkörningen. Avsedda intro-flödet är: ArrivalScene → BoardMeetingScene → Portal med cup_start-anslag → första cup-match.

**Fix:** I `src/domain/services/sceneTriggerService.ts`, `shouldTriggerSeasonSignature()` ska returnera `false` alltid.

**Behåll:** scen-fil (`seasonSignatureReveal.ts`) och `SIGNATURE_REVEAL_DATA` — datan är värd att behålla för framtida iteration.

**Behåll också:** `shouldTriggerSundayTraining()` — sunday_training-scenen är OK och ska fortsatt triggas. Bara season_signature_reveal disablas.

**JSDoc:**

```ts
/**
 * Disabled 2026-05-10 — gammal artefakt, scenen används inte längre i
 * intro-flödet. Datan i SIGNATURE_REVEAL_DATA är kvar för eventuell
 * framtida iteration (väder-koppling, mid-season-trigger, etc).
 */
export function shouldTriggerSeasonSignature(): boolean {
  return false
}
```

**Verifiering:** efter fix ska intro-flödet vara: ArrivalScene → BoardMeetingScene → Portal (med cup_start-anslag) → SundayTrainingScene (om säsong 1) → första cup-match. INGEN season_signature_reveal mellan boardmeeting och första matchen.

---

## FIX-02 · Textkorr i `cup_finalweekend_pre` Variant B

**Fil:** `src/domain/data/anslag/cupAnslag.ts`

### FIX-02a · "i lördag/söndag" → "på lördag/söndag"

**Nuvarande:** `Två semifinaler i lördag, finalen i söndag.`
**Ska vara:** `Två semifinaler på lördag, finalen på söndag.`

Idiomatisk svenska. "i lördag/söndag" funkar bara om man syftar på en specifik framtida helg ("vi ses i lördag"). Här är det generellt — "på lördag, på söndag" är rätt preposition.

### FIX-02b · "Men ingen är där och tror något annat heller." → "Men ingen här tror något annat heller."

**Nuvarande:** `Det är inte SM. Men ingen är där och tror något annat heller.`
**Ska vara:** `Det är inte SM. Men ingen här tror något annat heller.`

Tightare formulering.

### Implementation

Hela Variant B-bodyn ändras från:

```ts
body: `Bollnäs den här helgen. Sävstaås, fyrverkerier, glögg på läktaren. Det är så cup-finalhelgen brukar vara.<br><br>Två semifinaler i lördag, finalen i söndag. Fyra lag åker dit, ett åker hem som vinnare. Resten åker hem som vanligt.<br><br>Det är inte SM. Men ingen är där och tror något annat heller.`,
```

till:

```ts
body: `Bollnäs den här helgen. Sävstaås, fyrverkerier, glögg på läktaren. Det är så cup-finalhelgen brukar vara.<br><br>Två semifinaler på lördag, finalen på söndag. Fyra lag åker dit, ett åker hem som vinnare. Resten åker hem som vanligt.<br><br>Det är inte SM. Men ingen här tror något annat heller.`,
```

---

## FIX-03 · Konvertera `cupFinalIntroScene` till anslag-modal

**Bug:** Inför cup-final triggas `cupFinalIntroScene.ts` — gammal 3-beat klick-igenom-helsidesvy med eyebrow "CUPFINAL", rubrik "Det är inget träningsläger", body om motståndaren och CTA "Vad är på spel?". Det är gammalt format.

Efter cup-finalen visas däremot `cup_done`-anslaget i modal-format ("⬩ POKALEN ⬩", italic body, "TRYCK FÖR ATT FORTSÄTTA →"). Det är rätt format. Det före ska se likadant ut som det efter.

**Fix:** Lägg till nytt anslag `cup_final_pre` i `cupAnslag.ts`. Disabla `shouldTriggerCupFinalIntro()` i `sceneTriggerService.ts`.

### Anslag-text (BESLUTAD — Variant A)

```
Cupfinal.

Två lag kvar. Ingen omspelning. {vsLabel} {motståndare}.

Det här är inget träningstillfälle. En match. Sen är det över.
```

Mallvariabler:
- `{motståndare}` — motståndarklubbens shortName (ex. "Västanfors")
- `{vsLabel}` — `"Borta mot"` om managed-klubben är awayClub, annars `"Hemma mot"`

EN variant av `cup_final_pre` (avviker från övriga anslag som har 3 — motiverat eftersom cupfinal inträffar max en gång per säsong).

### Implementation

Ny key i `CupAnslagKey`-typen: `'cup_final_pre'`.

Ny entry i `CUP_ANSLAG`:

```ts
cup_final_pre: {
  chapter: '⬩ Cupfinalen ⬩',
  variants: [
    {
      body: `Cupfinal.<br><br>Två lag kvar. Ingen omspelning. {vsLabel} {motståndare}.<br><br>Det här är inget träningstillfälle. En match. Sen är det över.`,
    },
  ],
},
```

Kräver template-variable-stöd i `anslagService.ts` om `pickAnslagVariant` inte hanterar `{motståndare}`/`{vsLabel}` idag.

### Trigger-logik (BESLUTAD — behåll båda anslag)

Båda `cup_finalweekend_pre` (Helgen) OCH `cup_final_pre` (Cupfinalen) bevaras. Rytm:

1. Före semifinalhelgen → `cup_finalweekend_pre` triggas (om vi är kvar i cupen)
2. Vi vinner semifinal
3. Före cup-finalen → `cup_final_pre` triggas

Två berättelse-lager. Helgen är ramen, Cupfinalen är vi-fokus.

Lägg till `cup_final_pre` som ny prio i `computeNextAnslag` i `anslagService.ts`. Triggas när:
- Managed-klubben har en cup-fixture med `roundNumber >= 4` (final) som scheduled
- Föregående cup-match (semifinal) är completed
- Inget annat anslag har högre prio

### Disabla scen

```ts
/**
 * Disabled 2026-05-10 — gammalt 3-beat klick-igenom-format. Innehållet flyttat
 * till cup_final_pre-anslag i cupAnslag.ts som visas i modal-format.
 */
export function shouldTriggerCupFinalIntro(): boolean {
  return false
}
```

**Behåll:** scen-fil `cupFinalIntroScene.ts` (datan är värd att behålla för referens).

---

## FIX-04 · TABELL #-fält i SpelaScreen för cup-matcher

**Bug:** I taktik-vyn före cup-final visas "#12 TABELL" i motståndare-kortet. Tabellplacering är ligabegrepp — irrelevant i cup-spel där det är elimineringsmatcher.

**Fix:** Byt TABELL-fältet till cup-fas-info för cup-matcher.

### Implementation

Leta upp komponenten som renderar MOTSTÅNDAREN-kortet i SpelaScreen (sannolikt `OpponentAnalysisCard.tsx` eller motsvarande). Lägg till conditional rendering:

```tsx
{fixture.isCup ? (
  <span className="opponent-meta">
    {getCupRoundLabel(fixture.roundNumber)}
    <small>CUP</small>
  </span>
) : (
  <span className="opponent-meta">
    #{opponentStanding.position}
    <small>TABELL</small>
  </span>
)}
```

Ny helper i `cupService.ts` eller `formatters.ts`:

```ts
export function getCupRoundLabel(roundNumber: number): string {
  if (roundNumber === 4) return 'FINAL'
  if (roundNumber === 3) return 'SEMIFINAL'
  if (roundNumber === 2) return 'KVARTSFINAL'
  return 'FÖRSTA RUNDAN'
}
```

---

## FIX-05 · Refactor — inline-styles → CSS-klasser

**Bakgrund:** Stålvallen-komponenterna i Batch A/B/C/D är funktionellt korrekta men strukturellt slarviga. Inline `style={{}}` på varje element istället för CSS-klasser. Klassnamn finns som `className`-prop men utan styling-koppling. Konsekvenser:

- Padding/färg/spacing-justeringar kräver sökjobb genom 12 inline-block per komponent
- Mönster som upprepas (LED-tag-styling, score-flash, scanlines) duplicerar inline-styles istället för en delad klass
- Mockens CSS-organisation (namngivna klasser med tydlig ansvarsfördelning) försvinner i Code's implementation

Detta är inte "fel" tekniskt — det fungerar och tester är gröna. Men det är tech debt som accumuleras varje gång vi rör en komponent. **Vi städar upp det nu, innan playtest-iterationerna börjar generera fler ändringar.**

### Omfattning

ALLA Stålvallen-komponenter ska refactoreras till CSS-klasser. Inte selektivt:

**Match-bundle:**
- `scoreboard/ScoreboardStalvallen.tsx`
- `scoreboard/sevenSegment.tsx` (om den har inline-styles utöver SVG-attribut)
- `commentary/CommentaryFeedStalvallen.tsx`
- `InteractionShell.tsx`
- `LastMinutePress.tsx`
- `MatchReportView.tsx`
- `CornerInteraction.tsx`
- `FreeKickInteraction.tsx`
- `PenaltyInteraction.tsx`
- `CounterInteraction.tsx`

**Portal-bundle:**
- `portal/secondary/WeeklyDecisionSecondary.tsx`
- `portal/secondary/BoardObjectivesSecondary.tsx`
- `portal/secondary/ActiveArcsSecondary.tsx`

### CSS-fil-organisation

Skapa två nya CSS-filer:

```
src/presentation/styles/stalvallen-match.css
src/presentation/styles/stalvallen-portal.css
```

Importera i appens root (eller där befintliga CSS-filer importeras).

**stalvallen-match.css** ska innehålla klasser för: scoreboard-modulen (inkl ticker, tidslinje, score-flash, scanlines, final-band, pen-strip), commentary-feed (inkl tag-stilar, atmosphere-rader), interaction-shell (inkl LED-tag, fold-hint, pitch-panel, sub-choices, risk-row, coach-tip, CTA-varianter, locked/revealed states), match-report (inkl stage, paper, arena-line, story, events, hörnstats, ratings, POTM).

**stalvallen-portal.css** ska innehålla klasser för: card-anatomin (border, stripe, eyebrow-label, chevron), specifika kort (weekly-decision, board-objectives, active-arcs).

### Klassnamn-konvention

Behåll de klassnamn som redan finns i koden som `className`-prop. Mappa CSS-regler mot dem. Exempel:

Före (Code):
```tsx
<div
  className={`module-main${flashSide ? ` score-flash-${flashSide}` : ''}`}
  style={{
    background: '#0A0908',
    margin: '8px 10px 0',
    borderRadius: 6,
    padding: '8px 12px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 8,
  }}
>
```

Efter:
```tsx
<div className={`module-main${flashSide ? ` score-flash-${flashSide}` : ''}`}>
```

CSS:
```css
.module-main {
  background: var(--panel);
  margin: 8px 10px 0;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
```

### Vad som STANNAR i komponenten (inte bryts ut)

- **Datadriven dynamisk styling:** flash-state-toggle, timer-color-progression, conditional positioning av timeline-events, SVG-attribut. Använd inline-styles för det som verkligen är dynamiskt — inte för det som är statiskt.
- **SVG-attribut** som `cx`, `cy`, `r`, `d` är inte CSS — de stannar.

### Tokens

Alla värden ska gå via tokens. Inga hardkodade hex-värden i CSS-klasser eller inline-styles. Exempel:

❌ Före: `background: '#0A0908'`
✅ Efter: `background: var(--panel)`

Detta inkluderar `#0A0908` (FIX-06), alla rgba(245,241,235,X)-paper-toner (kan bli `--paper-warm` med alpha-modifierare där det är relevant), alla scanline-värden (kan bli token).

Acceptabel inline-användning av tokens: `style={{ color: 'var(--led-amber)' }}` om värdet är dynamiskt valt vid runtime. Statiska värden ska i CSS-klasserna.

### Tester

Befintliga tester ska fortsatt vara gröna efter refactor (751). Lägg INTE till nya tester för CSS-refactor — det är ren strukturering, inte ny funktionalitet.

Visuell regression: ingen pixel ska ändras efter refactor. Om något ser annorlunda ut är refactorn fel.

---

## FIX-06 · Lägg till `--panel`-token

**Bakgrund:** ScoreboardStalvallen använder `background: '#0A0908'` direkt på `module-main`-elementet. Mockens `--panel: #0A0908`-token saknas i `colors_and_type.css`.

**Fix:** Lägg till i Stålvallen-token-blocket i `colors_and_type.css`:

```css
--panel: #0A0908;
```

Och uppdatera ScoreboardStalvallen att använda `var(--panel)` istället för `#0A0908`. Detta händer naturligt som del av FIX-05 men flaggas separat så token-disciplinen blir explicit.

---

## FIX-07 · Verifiera `fadeInUp`-keyframe globalt

**Bakgrund:** CommentaryFeedStalvallen, MatchReportView (och möjligen andra) refererar `animation: 'fadeInUp 250ms ease-out both'` eller `'fadeInUp 300ms ease-out both'`. Om keyframen inte är definierad globalt blir det ingen animation (silent failure).

**Fix:** Verifiera att följande finns i en globalt importerad CSS-fil (t.ex. `index.css`, `app.css`, `animations.css`):

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Om den saknas — lägg till. Om den finns med annan definition — kontrollera att det är samma effekt.

---

## FLAG-01 · Snålvinden Variant B "ligger på på"

**Status:** Ej beslutad. Lägg INTE in fix utan Jacobs godkännande.

**Fil:** `src/domain/data/anslag/cupAnslag.ts`, `cup_between` Variant B

**Nuvarande:** `Mörkret kommer för tidigt nu, frosten ligger på på mornarna, och spelet är inte där det ska vara än.`

"frosten ligger på på mornarna" — dubbel "på". Tekniskt grammatiskt korrekt men ser fult ut. Flaggat.

---

## Acceptanskriterier

- [ ] Alla 7 FIX:ar implementerade
- [ ] Befintliga 751 tester gröna
- [ ] Inga nya hardkodade hex-värden i kod (allt via tokens)
- [ ] Inline-styles bara för dynamiska värden, inte för statisk styling
- [ ] Två nya CSS-filer skapade och importerade (`stalvallen-match.css`, `stalvallen-portal.css`)
- [ ] Visuell regression: ingen pixel ändrad efter refactor (jämför mot pre-refactor screenshots vid behov)
- [ ] FLAG-01 ej rörd (väntar Jacobs beslut)

---

## Vad du INTE ska göra

- **Inte ändra mekanik.** Match-services, anslag-trigger-logik (utöver `cup_final_pre`), etc rörs inte.
- **Inte införa nya designval.** Tokens, klassnamn, komponentstruktur — bevara det som finns. Detta är restrukturering, inte redesign.
- **Inte hoppa över komponenter** i FIX-05. ALLA listade komponenter ska refactoreras.
- **Inte uppfinna nya tokens.** Använd existerande Stålvallen-tokens. Bara `--panel` (FIX-06) är ny.
- **Inte ändra på FLAG-01** utan Jacobs godkännande.

---

## Rapportera

Per FIX-XX-punkt: ✅ / ⚠️ / ❌ med en mening. Pusha gärna i två commits:

1. **Refactor-commit:** FIX-05, FIX-06, FIX-07 (CSS-strukturen)
2. **Buggfix-commit:** FIX-01, FIX-02a, FIX-02b, FIX-03, FIX-04 (logik och text)

Flagga också:
- Om något befintligt tester går sönder vid refactor
- Om någon CSS-extraktion blir komplicerad (t.ex. nested selectors som inte går rakt över från inline)
- Om `pickAnslagVariant` behöver utbyggnad för template-variables i FIX-03

Säg till om något är oklart i specen.
