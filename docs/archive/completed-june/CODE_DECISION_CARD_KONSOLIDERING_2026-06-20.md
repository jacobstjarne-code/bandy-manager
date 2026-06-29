# CODE — Decision-card-konsolidering (delad-primitiv #4) — 2026-06-20

**Källa:** `DESIGN-DECISIONS.md § Systempatch 2026-06-11 → Delade primitiver #4`: *"Decision-card — EN komponent (Portal-variantens hierarki: primär fylld + outline), både Portal och Granska."* Sista öppna posten i D3 inline-stratum-migreringen (FÖRSONINGSSPRINTEN §3). Opus äger design-beslutet; Code äger extraktionen.

---

## Divergensen (verifierad mot källan 2026-06-20)

**Portal** — `src/presentation/components/portal/EventCardInline.tsx`:
```jsx
{actions.map((action, idx) => (
  <button className={idx === 0 ? 'btn btn-primary' : 'btn btn-outline'}>{action.label}</button>
))}
```
Horisontell wrap. Hierarki: första = primär fylld, resten outline. ✓ kanon-vokabulär.

**Granska** — `src/presentation/screens/granska/GranskaOversikt.tsx`, FYRA inline-dubbletter (kritiska events · presskonferens · CS-pressfråga · domarmöte):
```jsx
{choices.map(choice => (
  <button style={{ ...choiceStyle(choice.id) }}>{choice.label}</button>
))}
```
Vertikal helbredd, vänsterställd. `choiceStyle()` i `granska/helpers.ts` **ignorerar `choiceId`** och returnerar en platt neutral stil (`bg-elevated` + border) för ALLA val → ingen hierarki, ingen primär. Detta är divergensen #4 pekar på.

---

## Design-beslut (Opus, låst)

**1. Vokabulär:** den flata `choiceStyle`-stilen dör. Valknappar använder `.btn`-vokabulären: **primär fylld (`.btn .btn-primary`) + outline (`.btn .btn-outline`)** — i båda kontexterna. Detta är #4:s kärna: ingen tredje platt knappstil för beslut.

**2. Layout som prop, inte hårdkodad:** Portal-kontexten är kompakt → `inline` (horisontell wrap, dagens beteende). Granska-kontexten är läsflöde → `stack` (vertikal helbredd, vänsterställd, dagens layout bevaras). Hierarkin (#1) är gemensam; layouten skiljer sig per kontext. Decision #4 säger "Portal-variantens **hierarki**", inte Portals layout — så stack-layouten i Granska behålls.

**3. Symmetriska val ljuger inte (det enda icke-mekaniska):** "första = primär fylld" gäller BARA när ett val är den naturliga huvudåtgärden. Granskas presskonferens / domarmöte / CS-pressfråga är **likvärdiga svarsalternativ** — att fylla det första kopparfärgat signalerar falskt ett rekommenderat svar. Därför:
   - Komponenten tar en valfri `primaryChoiceId?`.
   - Satt → den knappen är `.btn-primary`, övriga `.btn-outline`.
   - **Osatt (symmetriskt set) → ALLA `.btn-outline`** (likvärdig vikt, ingen falsk primär).
   - **Portal** (`EventCardInline`): behåll dagens beteende → `primaryChoiceId = actions[0].choiceId` (naturlig huvudåtgärd först).
   - **Granska kritiska events** (`event.choices`): om eventdatan har ett primärt val, sätt det; annars osatt. Default för nuvarande events = **osatt** (de är beslutsval, inte handling-vs-avböj) tills någon eventtyp får en uttalad huvudåtgärd.
   - **Granska presskonferens / CS-press / domarmöte:** alltid osatt (symmetriska) → all-outline.

---

## Code-extraktion

**Ny komponent:** `src/presentation/components/DecisionChoices.tsx`
```tsx
interface DecisionChoice { id: string; label: string; subtitle?: string }
interface Props {
  choices: DecisionChoice[]
  onChoose: (choiceId: string, label: string) => void
  layout?: 'inline' | 'stack'   // default 'stack'
  primaryChoiceId?: string       // osatt → all-outline
}
```
- Renderar varje val som `<button className={isPrimary ? 'btn btn-primary' : 'btn btn-outline'}>`.
- `layout='inline'` → `display:flex; gap:8; flexWrap:wrap`. `layout='stack'` → `display:flex; flexDirection:column; gap:5`, knappar `width:100%`, `justify-content:flex-start` (vänsterställd text via `.btn` text-align override i stack-läge).
- `subtitle` (presskonferensen använder det) renderas som dämpad underrad i knappen.
- INGEN egen färglogik, INGA råa hex — bara `.btn`-klasserna.

**Rewiring:**
1. `EventCardInline.tsx` → ersätt knapp-mappen med `<DecisionChoices choices={actions...} layout="inline" primaryChoiceId={actions[0]?.choiceId} onChoose={handleAction} />` (normalisera `getActionsForEvent`-formen `{choiceId,label}` → `{id,label}`).
2. `GranskaOversikt.tsx` → ersätt ALLA FYRA inline-knapp-mappar med `<DecisionChoices choices={...} layout="stack" onChoose={(id,label)=>onChoice(eventId,id,label)} />` (primaryChoiceId osatt = all-outline; kritiska events: sätt bara om eventdatan bär en primär).
3. Ta bort `choiceStyle` ur `granska/helpers.ts` (blir död kod efter rewiring — verifiera inga andra anropare via grep `choiceStyle`).

**Bevaras:** `.btn-primary` i stack-läge ska inte få box-shadow-lyft som krockar med läsflödet — om `.btn`-skuggan skaver i den vertikala listan, lägg en `.btn-in-stack`-modifier som nollar shadow (men behåll fyllnad/outline-vokabulären). Design-Fable tittar på det i audit; bygg först med ren `.btn`.

---

## Gate
- Typecheck + tester gröna.
- Visuell: Portal-event = oförändrat (första primär, horisontell). Granska presskonferens = tre likvärdiga outline-knappar (INGEN kopparfylld). Granska kritiskt event = outline-stack tills datan bär en primär.
- Rapportera commit + bekräfta att `choiceStyle` är borttagen och `DecisionChoices` är enda beslutsknapp-vägen i båda kontexterna.
- **Design-Fable efterkontroll:** stack-layoutens `.btn-primary`-skugga + att symmetriska set verkligen läser som likvärdiga.
