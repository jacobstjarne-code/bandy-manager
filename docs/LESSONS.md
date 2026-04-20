# LESSONS

Återkommande buggar och mönstret som orsakar dem. Läs vid sessionstart.
Lägg till ny lärdom när samma fel uppträder 2+ gånger.

Format per lärdom: Mönster (symptom), Rotorsak (varför), Fix, Känn igen (signal).

---

## 1. SVG width/height-attribut skriver över container

**Mönster:** Porträtt eller ikoner klipps av i cirkel-wrappers — bara en del syns.

**Rotorsak:** Hårdkodat `width="X" height="X"` på `<svg>`-elementet dominerar över CSS-storleken från wrapper-diven. SVG:en renderas i sin "egna" storlek och klipps av overflow: hidden.

**Fix:** Använd `viewBox` för koordinatsystemet, `preserveAspectRatio="xMidYMid meet"` för centrering, och `style="width:100%;height:100%;display:block"` för att följa container:
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"
  preserveAspectRatio="xMidYMid meet"
  style="width:100%;height:100%;display:block">
```

**Känn igen:** Visuell bugg där bara en del av en SVG syns, oftast övre vänstra hörnet av canvasen.

**Historik:** Porträtt-buggen uppträdde 3 gånger innan rotorsaken hittades.

---

## 2. Flex-child scrollar inte utan `minHeight: 0`

**Mönster:** Listor klipps av i botten. `overflow: auto` + `flex: 1` fungerar inte.

**Rotorsak:** Flexbox default har `min-height: auto` på flex-children, vilket förhindrar overflow. Child kan inte bli mindre än sitt innehåll, så scroll triggar aldrig.

**Fix:** Lägg till `minHeight: 0` på flex-child-containern som ska scrolla:
```tsx
<div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
  {/* lång content */}
</div>
```

**Känn igen:** Container med `flex: 1` och `overflow: auto` där scroll inte triggar.

**Historik:** GranskaScreen (Spelare-flik) och PlayerModal — två separata fall samma sprint.

---

## 3. Inline funktioner i useEffect-deps ger infinite loop

**Mönster:** "Maximum update depth exceeded" (React error #185). Appen kraschar under en interaktion.

**Rotorsak:** Förälder skickar `onX={() => ...}` som skapar ny funktion varje render → useEffect ser ändrad dep → kör effect → setState → re-render → ny funktion → loop.

**Fix:** Använd `useRef` för callback-propen:
```tsx
const onTimeoutRef = useRef(onTimeout)
useEffect(() => { onTimeoutRef.current = onTimeout }, [onTimeout])

useEffect(() => {
  // använd onTimeoutRef.current() istället för onTimeout()
}, [phase, timerSeconds])  // ingen onTimeout i deps
```

**Känn igen:** Error #185, ofta i komponenter med timer eller auto-resolve-logik.

**Historik:** InteractionShell — upptäcktes i playtest efter Sprint 20.

---

## 4. "Klart" utan UI-verifiering missar luckor

**Mönster:** Sprint rapporteras klar men flera delar saknas i appen. Upptäcks först vid playtest.

**Rotorsak:** "Kod skriven" tolkas som "funktion levererad". Komponent kan existera som fil utan att importeras, utan att få props, eller utan att renderas i DOM.

**Fix:** Obligatorisk självaudit efter varje sprint — öppna appen, navigera till varje ny vy, beskriv i ord vad som syns. Skriv `docs/sprints/SPRINT_XX_AUDIT.md`.

**Känn igen:** Spec har N delar, bara K nämns i commit-meddelandet. Eller: audit-grep visar att filer saknas.

**Historik:** Sprint 19 — Taktiktavlan, ExpectationsCard, klack-leather-bar, animationer alla rapporterade klara men fanns inte.

---

## 5. Symptomfix istället för rotorsak

**Mönster:** Samma bugg återkommer flera playtest-rundor trots "fix".

**Rotorsak:** Fixen adresserar symptomet ("jag justerade koordinater") utan att förstå varför det gick fel från början ("alla y-värden hamnade i samma range eftersom formeln var `y = GOAL_Y + 20 + r2 * 50`").

**Fix:** Innan kod ändras — formulera rotorsaken i en mening. Om du inte kan formulera den, läs mer kod innan du rör något. Commit-meddelande ska innehålla rotorsak, inte bara fix:
```
fix: shotmap prickar klumpade — rot: nextPos('goal') y-range var
20-70 istf 10-90 så alla hamnade i målområdet
```

**Känn igen:** Commit som säger "fixed X" utan att förklara varför X var fel. Eller: samma bugg rapporteras 2+ gånger.

**Historik:** Shotmap-spridning (2 iterationer), porträtt-koordinater (3 iterationer).

---

## 6. Spec-dupliceringar bygger på varandra

**Mönster:** Samma information visas på flera skärmar för att olika specar lade till den oberoende av varandra.

**Rotorsak:** När specen skrivs, kontrolleras inte om informationen redan finns någonstans. "Lägg till konsekvenser-ruta i Analys" — men konsekvenser finns redan i Förlopp.

**Fix:** Innan ny feature specas — grep efter nyckelord i existerande kodbas. Innan ny info läggs till en vy — kolla om samma info finns i annan vy.

**Känn igen:** Spelaren scrollar genom två olika skärmar och ser samma siffror.

**Historik:** GranskaScreen Analys-steg — tabellplacering/ekonomi/bygdens puls dubblerade från Förlopp-steg.

---

## 7. useEffect-dep på state som effecten själv skriver till

**Mönster:** React error #185 under live-match-interaktioner (hörna, straff, kontring, frislag). Kraschar specifikt när `outcome` sätts.

**Rotorsak:** `useEffect` med `[outcome, phase]` i deps anropade `setPhase('locked')` — vilket ändrar `phase` → triggrar om effecten → `setPhase` igen → loop. Inte samma som lärdom 3 (inline-funktion) — här är det lokalt state i deps-arrayen som effecten själv muterar.

**Fix:** Ta bort allt state som effecten skriver till från deps-arrayen. Behåll bara den externa triggern:
```tsx
// Fel — phase är i deps men setPhase('locked') ändrar phase
useEffect(() => {
  if (!outcome) return
  setPhase('locked')
  const t = setTimeout(() => setPhase('revealed'), 600)
  return () => clearTimeout(t)
}, [outcome, phase])

// Rätt — bara den externa triggern
useEffect(() => {
  if (!outcome) return
  setPhase('locked')
  const t = setTimeout(() => setPhase('revealed'), 600)
  return () => clearTimeout(t)
}, [outcome])
```

**Känn igen:** Error #185 i kombination med `useState` + `useEffect` där samma state-variabel finns i deps OCH skrivs till inuti effecten. Kontrollera alla interaktionskomponenter (CornerInteraction, PenaltyInteraction, etc.).

**Historik:** Alla fyra interaktionskomponenter hade `[outcome, phase]` — fixades i Sprint 22.

---

## 8. Zustand-selektor returnerar nytt objekt varje render

**Mönster:** Komponent re-renderas vid varje store-uppdatering trots att det visade värdet inte ändrats. Kan eskalera till loop-problem eller märkbar lagg.

**Rotorsak:** Zustand använder `Object.is` för att jämföra selektor-output. `useGameStore(s => ({ locked: !!, reason: s... }))` skapar ett nytt objekt-literal varje anrop → `Object.is({}, {}) === false` → re-render.

**Fix:** Returnera primitives direkt från selektorn och bygg det sammansatta värdet utanför:
```tsx
// Fel — nytt objekt varje render
const { locked, reason } = useGameStore(s => ({
  locked: !!s.game?.pendingScreen,
  reason: s.game?.pendingScreen ?? null,
}))

// Rätt — primitives, stabila referenser
const pendingScreen = useGameStore(s => s.game?.pendingScreen ?? null)
const locked = !!pendingScreen
const reason = pendingScreen ? (REASON_MAP[pendingScreen] ?? 'Slutför pågående flöde') : null
```

**Känn igen:** `useGameStore(s => ({ ... }))` med objekt-literal. Letaefter i hooks som används i ofta-renderande komponenter (BottomNav, headers, wrappers).

**Historik:** `useNavigationLock` i BottomNav — bidrog till React #185 i Sprint 22.

---

## 9. Sticky-element flödar ovanpå modal-innehåll

**Mönster:** Knapprad eller footer syns utanpå ett modalt kort — inte förankrad till kortet, ser felfixad ut som ett floating-element.

**Rotorsak:** `position: sticky` med `bottom: X` inuti en scrollbar overlay placerar elementet relativt till scroll-containern, inte till det visuella kortet. Ser ut som att det "hänger i luften" utanpå kortet.

**Fix:** Flytta in elementet som normal flow-del av kortets scrollbara innehåll. Ta bort `position: sticky` och `bottom`-värdet. Om det måste stanna synligt — lägg det *utanför* scroll-diven men *inuti* kortets wrapper, inte med sticky:
```tsx
// Fel — sticky inuti overflowY: auto
<div style={{ overflowY: 'auto' }}>
  {/* ...innehåll... */}
  <div style={{ position: 'sticky', bottom: 60 }}>
    <button>Prata med spelaren</button>
  </div>
</div>

// Rätt — normal flow, scrollar med innehållet
<div style={{ overflowY: 'auto' }}>
  {/* ...innehåll... */}
  <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px' }}>
    <button>Prata med spelaren</button>
  </div>
</div>
```

**Känn igen:** `position: sticky` inuti `overflowY: auto`-container. Fråga alltid: "Ska detta scrolla med innehållet?" Om ja — normal flow. Om nej — placera utanför scroll-diven.

**Historik:** PlayerCard "Prata med spelaren"-footer — fixades efter playtest-feedback Sprint 23.

---

## 10. `as`-cast till enum från sträng — bypassar TypeScript-skyddet

**Mönster:** TypeError vid runtime: "Cannot read properties of undefined (reading 'X')" där X är en property på en map-lookup (t.ex. `ARCHETYPE_MULTIPLIERS[archetype][attr]`). Felet uppstår långt från där rotorsaken ligger.

**Rotorsak:** Någon har skrivit `'MinString' as MinEnum` istället för att använda enum-värdet direkt. TypeScript godtar detta utan varning — as-cast är en "litar på mig"-assertion, inte en check. Vid runtime är strängen INTE ett enum-värde, bara en vanlig sträng som inte matchar någon key i parallella map-konstanter.

Specifikt fall: `PlayerArchetype.TwoWaySkater = 'twoWaySkater'` (camelCase enum-värde), men två callsites hade hardkodat `'TwoWaySkater' as PlayerArchetype` (PascalCase sträng). `ARCHETYPE_MULTIPLIERS['TwoWaySkater']` = undefined, sen försök läsa `.skating` på undefined = krasch.

**Fix:** Ersätt rå-stringen med enum-värdet:
```ts
// Fel
archetype: 'TwoWaySkater' as PlayerArchetype

// Rätt
archetype: PlayerArchetype.TwoWaySkater
```

Plus: defensiv guard i map-lookup med console.warn så framtida diskrepans rapporteras tyst istället för att krascha.

**Känn igen:** `as EnumName`-mönster i kod. Särskilt farligt när enum-värdena är camelCase men utvecklare skriver PascalCase strängar av gammal vana (eller tvärtom).

**Grep-kommando för jakt:**
```bash
grep -rn "' as \(PlayerArchetype\|PlayerPosition\|ClubStyle\|TacticMentality\)" src/ --include="*.ts" --include="*.tsx"
```

**Historik:** Hittat av stress-test-infrastruktur 2026-04-20 (BUG-STRESS-01). 2 callsites: `seasonEndProcessor.ts:890` och `matchSimProcessor.ts:35`. Fixades i Sprint 22.6.

---

## 11. [PLAYOFF] completedThisRound loggas tom upprepat — möjlig dubbelprocessning

**Mönster:** `[PLAYOFF] Series X: 3-0, winnerId=clubY, completedThisRound: ` (tom) loggas 5-8 gånger per serie efter att serien redan är klar (winnerId satt).

**Rotorsak:** Ej undersökt. Sannolikt att `advanceToNextEvent` anropas på fixture-matchdays som tillhör en redan avslutad serie, och playoff-koden körs men hittar inget att göra (completedThisRound = tom). Inga konsekvenser synliga i speldata.

**Känn igen:** Upprepade identiska PLAYOFF-loggrader med tom `completedThisRound` direkt efter en seriseger.

**Historik:** Observerat i stress-test baseline Sprint 22.6. Inte fixat — potentiell bugg, låg prio.
