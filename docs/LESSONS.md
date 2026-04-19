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
