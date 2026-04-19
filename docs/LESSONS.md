# LESSONS

Återkommande buggar och mönstret som orsakar dem. Läs vid sessionstart.
Lägg till ny lärdom när samma fel uppträder 2+ gånger.

Format per lärdom: Mönster (symptom), Rotorsak (varför), Fix, Känn igen (signal).

---

## 1. SVG width/height-attribut skriver över container

**Mönster:** Porträtt eller ikoner klipps av i cirkel-wrappers — bara en del syns.

**Rotorsak:** Hårdkodat `width="X" height="X"` på `<svg>`-elementet dominerar över CSS-storleken från wrapper-diven. SVG:en renderas i sin "egna" storlek och klipps av `overflow: hidden`.

**Fix:** Använd `viewBox` för koordinatsystemet, `preserveAspectRatio="xMidYMid meet"` för centrering, och `style="width:100%;height:100%;display:block"` för att följa container:

```html
<!-- Fel -->
<svg viewBox="0 0 64 64" width="64" height="64">

<!-- Rätt -->
<svg viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block">
```

**Känn igen:** När du ser ett SVG som inline-string i TypeScript (t.ex. template literals i `svgPortraitService.ts`) och en wrapper-div med fast storlek + `overflow: hidden` — kontrollera alltid att SVG-elementet saknar `width`/`height`-attribut.

---

## 2. React error #185 — setState i render eller dep-loop i useEffect

**Mönster:** Spelet fryser/crashar under live-match-interaktioner (hörna, straff, kontring, frislag). Console visar "Too many re-renders".

**Rotorsak:** `useEffect` med `[outcome, phase]` som deps anropade `setPhase('locked')` — en setState som triggade en ny render, som triggade effecten igen p.g.a. `phase` i deps-arrayen. Loop.

**Fix:** Ta bort alla bieffekter (`phase`, lokalt state) som effekten själv skriver till från deps-arrayen. Använd bara den externa trigger (`outcome`) som faktiskt ska starta effecten:

```ts
// Fel
useEffect(() => {
  if (!outcome) return
  setPhase('locked')           // skriver till phase
  const t = setTimeout(...)
  return () => clearTimeout(t)
}, [outcome, phase])           // phase är dep → loop

// Rätt
useEffect(() => {
  if (!outcome) return
  setPhase('locked')
  const t = setTimeout(...)
  return () => clearTimeout(t)
}, [outcome])                  // bara den externa triggern
```

**Känn igen:** Error #185 i React 18 concurrent mode är nästan alltid ett dep-array-problem. Leta efter effects som skriver till state som de själva läser via deps. Kontrollera också Zustand-selektorer som returnerar nya objekt varje render (skapa object reference-instabilitet → onödig re-render).

---

## 3. Zustand-selektor returnerar nytt objekt varje render

**Mönster:** Komponent renderas om vid varje store-uppdatering, trots att värdet inte ändrats. Kan bidra till performance-problem eller triggra React error #185.

**Rotorsak:** Zustand använder `Object.is` för att jämföra selektor-output. En selektor som returnerar `{ locked: bool, reason: string }` skapar ett nytt objekt-literal varje gång → `Object.is` ≠ → re-render.

**Fix:** Returnera primitives (string, boolean, number) direkt och beräkna det sammansatta värdet utanför:

```ts
// Fel
const { locked, reason } = useGameStore(s => ({
  locked: !!s.game?.pendingScreen,
  reason: s.game?.pendingScreen ?? null,
}))

// Rätt
const pendingScreen = useGameStore(s => s.game?.pendingScreen ?? null)
const locked = !!pendingScreen
const reason = pendingScreen ? (REASON_MAP[pendingScreen] ?? 'Slutför pågående flöde') : null
```

**Känn igen:** Selektorer i `useGameStore(s => ({ ... }))` med objekt-literal. Letaefter detta mönster i hooks som används i ofta-renderande komponenter (t.ex. BottomNav).

---

## 4. Flex-scroll: minHeight: 0 saknas

**Mönster:** En scrollbar sektion inuti en flex-container scrollar inte — innehållet klipps eller sektionen växer utan begränsning.

**Rotorsak:** Flex-children har `min-height: auto` som default, vilket förhindrar att de krymper under sitt innehålls naturliga höjd. `overflow: auto` har ingen effekt utan en explicit höjdbegränsning.

**Fix:** Lägg till `minHeight: 0` på flex-child som ska scrolla:

```tsx
// Fel
<div style={{ flex: 1, overflowY: 'auto' }}>

// Rätt
<div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
```

**Känn igen:** Scrollbar sektion inne i `display: flex, flexDirection: 'column'`. Om det inte scrollar — lägg till `minHeight: 0` på den berörda div:en.

---

## 5. "finns = funkar" — importeras men renderas aldrig

**Mönster:** En komponent eller service verkar implementerad men påverkar inget i spelet. Audit returnerar "✅ finns".

**Rotorsak:** Filen finns men importeras aldrig, eller importeras men renderas/anropas inte med rätt props, eller renderas på fel ställe i DOM-trädet.

**Fix:** Verifieringskedjan är alltid: fil finns → importeras i rätt parent → renderas med rätt props → inte duplicerad av annan komponent → visas på rätt plats i layouten.

**Känn igen:** När du ska verifiera en feature — börja ALLTID med parent-filen, inte child-filen. Följ renderingsflödet uppifrån och ner. "Finns som fil" är inte verifiering.

---

## 6. Sticky-element flödar ovanpå modal-innehåll

**Mönster:** En knapprad eller footer visas utanpå/ovanpå ett modalt kort och ser felfixad ut — inte förankrad till kortet.

**Rotorsak:** `position: sticky` med `bottom: X` inuti en scrollbar overlay placerar elementet relativt till scroll-containern, inte till kortet. Resultatet ser ut som ett floating-element som inte hör till kortet.

**Fix:** Flytta in elementet som normal flow-del av kortets scrollbara innehåll. Ta bort `position: sticky` och `bottom`-värdet. Om det måste vara synligt utan scroll — lägg det utanför scrollbar-arean men inuti kortets wrapper.

**Känn igen:** `position: sticky` inuti `overflowY: auto`-container. Fråga: "Ska detta scrolla med innehållet eller stanna kvar?" Om stanna → placera utanför scroll-diven, inte med sticky.
