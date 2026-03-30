# UI-buggar från playtest-screenshots — mars 2026

Gör i ordning. `npm run build` efter varje punkt. Committa gruppvis.

---

## 1. TABELL-kortet på Dashboard: "SLUTSPEL"-taggen vid säsongsstart

### Problem
Dashboard visar en "SLUTSPEL"-tagg på tabellkortet redan innan en enda match spelats. Det ser ut som att slutspelet har startat, men det är egentligen "slutspelszonen" (topp 8). Förvirrande vid säsongsstart.

### Fix
Ändra texten från "SLUTSPEL" till "TOPP 8" eller "I SLUTSPELSZON" så det är tydligt att det handlar om tabellposition, inte att slutspelet pågår. Alternativt: visa ingen tagg alls omgång 1 (ingen har spelat) — visa taggen först från omgång 2.

Sök i `DashboardScreen.tsx` efter "SLUTSPEL" och ändra till t.ex.:
```tsx
// Om 0 matcher spelade → visa inget
// Annars: "TOPP 8" eller "SLUTSPELSZON" istället för "SLUTSPEL"
```

---

## 2. Dashboard: Omgångsräknare vs cup

### Problem  
Dashboard visar "Omgång 2" som nästa att spela, men det som faktiskt väntar är en cupmatch (Förstarunda i Svenska Cupen). Det är inkonsekvent — cupmatchen borde inte räknas som "Omgång 2".

### Fix
I `DashboardScreen.tsx`, NextMatchCard-sektionen: om nästa fixture är en cupmatch (`isCup === true`), visa "Cup" som omgångsindikator istället för ligaomgångsnumret. T.ex:
```
🏆 SVENSKA CUPEN · FÖRSTARUNDA
vs Hälleforsnäs                  BORTA
```

Inte "Omgång 2". Ligaomgång 2 ska visas för nästa LIGAMATCH, inte cupmatchen.

Kontrollera att "Spela omgång X"-knappen (advance) faktiskt navigerar till cupmatchen, inte ligamatchen, om cupmatchen kommer först i ordningen.

---

## 3. Statistik-fliken i Tabell: Tom + blå ram

### Problem
Statistik-fliken (Toppskytt, Flest assist, etc.) visar tomma kategorier utan data. Och det ser ut som fliken "STATISTIK" har en blå fokusram (outline) runt sig.

### Fix A: Visa placeholder när inga matcher spelats
```tsx
{allPlayers.filter(p => p.seasonStats.gamesPlayed > 0).length === 0 ? (
  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '32px 16px' }}>
    Statistik visas när första matchen har spelats.
  </p>
) : (
  // Befintlig statistik-rendering
)}
```

### Fix B: Ta bort blå fokusram
Fliken har troligen default browser focus styling. Lägg till:
```css
/* I global.css eller inline */
button:focus-visible, [role="tab"]:focus-visible {
  outline: 2px solid var(--accent);  /* copper istället för blå */
  outline-offset: -2px;
}
button:focus:not(:focus-visible) {
  outline: none;
}
```

Eller i TabellScreen.tsx, på tab-knapparna:
```tsx
style={{ outline: 'none', /* ...resten */ }}
```

---

## 4. Planvy: Bara nummer, inga namn/positioner synliga

### Problem
På planvyn i match-uppställningen syns bara tröjnummer i cirklarna. Positionslabels (MV, VB, CH etc.) och spelarnamn som fanns tidigare verkar ha försvunnit eller är för små/dolda.

### Fix
I `PitchLineupView.tsx`, kontrollera att:
- **Positionslabel** visas OVANFÖR cirkeln (7px text, uppercase) — den finns i koden men kanske är osynlig p.g.a. positionering
- **Spelarnamn** visas UNDER cirkeln (7px text) — kontrollera att `player.lastName.slice(0, 6)` renderas

Troligt problem: cirklarna (30×30px) och den totala slot-ytan (44×44px) är för tighta. Positionslabel och namn hamnar utanför synligt område eller klipps av.

Förslag: Öka slot-höjden till 56px och justera position av label (top: -2px) och namn (bottom: -2px) så de syns tydligt:
```tsx
style={{
  // ...
  width: 48,
  height: 56,  // VAR: 44
}}
```

Kontrollera att `isDraggingFrom` inte gömmer labels/namn felaktigt.

---

## 5. Planvy-toggle: ⚽ fotbollsikon

### Problem
I lista/planvy-togglen står det "⚽ Planvy". Fotbollsemojin hör inte hemma i ett bandyspel.

### Fix
Byt ⚽ till ett bandyrelevant alternativ. Förslag:
- `🏑` (field hockey stick — närmast bandy som finns som emoji)
- `📋` för Lista och `🏟️` för Planvy  
- Eller ta bort emojin helt och använd bara text: "Lista" / "Planvy"

I `LineupStep.tsx`, hitta togglen och byt emoji.

---

## 6. Live-match: Resultatvlan kortar av lagnamn

### Problem
Resultattavlan visar "MÅLILL" och "LESJÖF" — avkortade versioner av Målilla och Lesjöfors. Ser billigt ut.

### Fix
I `MatchLiveScreen.tsx`, hitta LED-tavlan/scoreboard-komponenten. Öka den tillåtna namnlängden eller använd `shortName` istället av att korta av.

Klubbarna har `shortName` i sina Club-entiteter (t.ex. "Målilla", "Lesjöfors"). Om kortet redan använder shortName och fortfarande kortar av — öka maxbredden eller minska fontstorleken.

Kontrollera: är det en `maxLength`-slice, CSS `overflow: hidden`, eller font-size-problem?

```tsx
// Om det finns en slice:
// VAR: clubName.slice(0, 6).toUpperCase()
// BLI: clubName.toUpperCase() (låt CSS sköta overflow)
```

Om det är en platsfråga: minska fontstorleken något (från kanske 14px till 12px) eller förkorta "Lesjöfors" → "Lesjöf." med punkt istället för att bara klippa.

---

## 7. Live-match: "Avspark" i kommentarerna

### Problem
Första kommentaren säger "Avspark! Lesjöfors möter Målilla i kvällens match." — "Avspark" är fotboll. I bandy heter det "avslag" eller "matchstart".

### Fix
I `matchCommentary.ts`, sök efter "Avspark" och byt till "Avslag" eller "Domaren blåser igång matchen".

```bash
grep -rni "avspark\|kickoff\|kick.off" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Byt alla förekomster.

---

## 8. Live-match: Kontrollknapp highlighted som default

### Problem
En av kontrollknapparna (den tredje — ser ut som auto-play/snabbspola) är markerad/highlighted som default. Det borde kanske vara paus eller normal hastighet som default.

### Fix
I `MatchLiveScreen.tsx`, kontrollera vilken play-speed som är default. Om "snabb" (den gröna knappen) är default — byt till "normal" hastighet:

Sök efter initial state för play speed:
```typescript
const [playSpeed, setPlaySpeed] = useState<'paused' | 'normal' | 'fast' | 'instant'>('normal')
// Kontrollera att 'normal' är default, inte 'fast'
```

Om det redan är 'normal' men fel knapp highlightas — kontrollera att highlight-logiken matchar rätt index.

---

## 9. Live-match: "mittfältet" i kommentarer

### Problem
Kommentaren "Bollen rullas runt i mittfältet" — "mittfältet" är inte en term som används naturligt i bandy (planen har inte ett definierat mittfält som i fotboll). Bättre: "mitten av planen", "centralzonen", eller "halvorna spelar bollen mellan sig".

### Fix
```bash
grep -rni "mittfält" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```
Byt till bandyspråk: "mitten", "centralzonen", "mitt på planen".

---

## ORDNING
1. Tabell-tag "SLUTSPEL" → tydligare text
2. Dashboard omgångsräknare vs cup
3. Statistik-flik: placeholder + fokusram
4. Planvy: namn och positioner synliga
5. Fotbollsemoji → bandyalternativ
6. Resultattavla: längre lagnamn
7. "Avspark" → "Avslag"/"Matchstart"
8. Default kontrollknapp i live-match
9. "mittfältet" → bandyterm

`npm run build` efter varje. Committa: `fix: UI issues from playtest screenshots`
