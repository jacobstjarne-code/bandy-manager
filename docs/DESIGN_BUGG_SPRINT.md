# DESIGN & BUGG-SPRINT — 15 fixar

Kör uppifrån och ner. `npm run build` efter varje. Committa gruppvis (design / buggar / events).

---

## 1. Header-kontrast — GameHeader.tsx

I `src/presentation/components/GameHeader.tsx`:

```
VAR: color: 'rgba(245,241,235,0.45)'  (BANDY MANAGER)
BLI: color: 'rgba(245,241,235,0.7)'

VAR: color: 'rgba(245,241,235,0.4)'  (spelarinfo-raden)
BLI: color: 'rgba(245,241,235,0.65)'
```

---

## 2. Välj klubb-header — NewGameScreen.tsx

Välj klubb-skärmens header har en annan layout än GameHeader. Gör den konsekvent:

I `src/presentation/screens/NewGameScreen.tsx`, club selection step:

Ersätt den custom headern med samma layout som GameHeader. Vänster: tillbaka-pil + "BANDY MANAGER". Höger: "Välj klubb" (bold) + "jacob · 2026/2027". Samma bakgrund, padding, border som GameHeader.

---

## 3. Planvy spacing — PitchLineupView / LineupFormationView

Cirklarna flyter ihop, speciellt i försvaret (5 backar + MV) och mittfältet (CH/VCH/HCH).

**Fix:**
- Öka planvyns höjd: `PH` från nuvarande värde (~130) till **170**
- Justera Y-koordinaterna så att:
  - MV: y = 5% (nere)
  - Backar/LIB: y = 18-22%
  - Halvar (VYH/HYH): y = 35-40%
  - Centrala halvar (VCH/CH/HCH): y = 50-55%
  - Forwards: y = 75-80%
- Öka cirkelradien 1-2px om det behövs
- Flytta positionslabel OVANFÖR cirkeln med lite mer avstånd (5px istället för 3px)
- Flytta spelarnamn UNDER cirkeln med lite mer avstånd

Kontrollera ALLA formationer (5-3-2, 3-3-4, 4-3-3, 2-3-2-3, 4-2-4, 3-4-3) — ingen ska ha överlappande cirklar/text.

---

## 4. Matchkommentarer: min-minut på "tröttnar"-kommentarer

I `src/domain/services/matchStepByStep.ts` (och/eller `matchUtils.ts`):

Hitta var neutral-kommentarer väljs. Lägg till en min-minut-check för dessa kommentarer:

```typescript
const LATE_ONLY_COMMENTS = [
  'Publiken suckar. Spelet har tappat tempo de senaste minuterna.',
  'Klockan tickar. Båda lagen verkar nöjda med att vänta ut varandra.',
  'Spelarna verkar spara lite på krafterna — ingen vill ta en onödig risk.',
  'En stund av lugn innan nästa storm.',
]
```

Enklaste lösningen: när en neutral kommentar ska plockas och `minute < 20`, filtrera bort dessa ur poolen.

---

## 5. Dubbelhändelse minut 27 — matchStepByStep.ts

En hörna som missar OCH en hörnvariant som sitter genereras på samma minut och concateneras i samma textruta.

**Fix:** I matchStepByStep, om en corner-sequence genererar både en miss och ett mål i samma steg → visa bara hörnmålet. Alternativt: separera dem till olika minuter.

---

## 6. Taktik-skärmen — TacticStep.tsx

Padding och spacing för generöst. Strama åt:
- Yttre padding: `'0 16px 24px'` → `'0 14px 16px'`
- Gruppkort padding: `'14px 16px'` → `'10px 14px'`
- SegmentedControl knapp-padding: minska till `8px`
- Förklaringstexter: `marginBottom` till 8px
- Gap mellan grupper: 8-10px

---

## 7. Matchsammanfattning (MatchResultScreen) — gles

- Minska padding i huvudkortet: `24px 20px` → `16px 14px`
- Minska poängsiffror: `fontSize: 40` → `fontSize: 32`
- Tighta HÄNDELSER: minska radavstånd
- Ersätt 🔴-emojin för mål med `🏒` (ser ut som röda cirklar)
- Alla marginBottom minska 30-40%

---

## 8. RoundSummaryScreen — gles, borde matcha dashboard

- Använd `card-sharp` istället för inline `borderRadius: 12`
- Minska card padding: `14px 16px` → `10px 14px`
- Minska `marginBottom: 10` → `8`
- Emojis i labels: "MATCHEN"→"🏒 MATCHEN", "TRÄNING"→"🏋️ TRÄNING", "ORTEN"→"🏘️ ORTEN", "EKONOMI"→"💰 EKONOMI", "INKORG"→"📬 INKORG", "SKADOR"→"🩹 SKADOR", "AKADEMIN P19"→"🎓 AKADEMIN", "UTLÅNADE"→"🔄 UTLÅNADE"
- Headern: minska padding `20px 20px 14px` → `14px 16px 10px`

---

## 9. MatchDoneOverlay — grått raster/blekning

- Ge kortet solid bakgrund: `background: '#F5F1EB'` (INTE transparent)
- Bakgrunds-overlay: `rgba(0,0,0,0.5)` → `rgba(0,0,0,0.6)`

---

## 10. EventScreen → generell overlay/modal

EventScreen navigeras till som egen route (`/game/events`) men borde vara en overlay ovanpå vilken vy som helst.

**Fix:**
1. Skapa `src/presentation/components/EventOverlay.tsx` — flytta EventScreen:s innehåll hit
2. I GameShell/layout-wrapper: rendera `<EventOverlay />` om `game.pendingEvents.length > 0`
3. Ta bort `/game/events`-routen
4. Ta bort alla `navigate('/game/events')` — events visas automatiskt
5. `zIndex: 300` (högre än MatchDoneOverlay:s 200)

---

## 11. ClubScreen — sponsorer, träning, intensitet, akademi

### 11a. Sponsorer: komprimera ledig-platser
5 × "Ledig plats" tar halva skärmen. Visa istället EN rad:
```
0/5 platser · [Ragga sponsor — 2,5 tkr]
```
Ta bort alla "Ledig plats"-rader. Visa bara aktiva sponsorer + sammanfattning.

### 11b. Daglig träning: emoji + rubrik på samma rad
Varje träninsval tar för mycket höjd. Emoji och rubrik (t.ex. "🏋️ Fysik") ska vara på SAMMA RAD som SegmentedControl, inte ovanför:
```
🏋️ Fysik     [Lätt] [Normal] [Hård]
```
Sparar en rad i höjd per sektion.

### 11c. Intensitet: rundade knappar
Om intensitets-knapparna är fyrkantiga → byt till samma SegmentedControl-stil (rundade hörn) som resten av UI:t.

### 11d. Träningsprojekt: linjera knappar
Knappar under träningsprojekt ska linjera vertikalt under varandra.

### 11e. Action-knappar: inte fullbredd
"Ragga sponsor", "Uppgradera", "Starta lotteri", akademi-knappar → använd INTE fullbreddsknappar med stora marginaler. Använd samma kompakta knappstil som resten av appen. Knappar ska vara högerställda eller ha max-width, inte sträcka sig kant-till-kant.

---

## 12. TabellScreen — rubrik + tillbaka bort, tighta

- **Ta bort rubriken "Tabell"** — framgår av bottom nav
- **Ta bort tillbaka-knappen** — TabellScreen nås via bottom nav, inte hierarkisk navigering
- Tighta tabellraderna: minska row padding
- Tighta statistik-fliken om den är gles

---

## 13. SquadScreen — rubrik + tillbaka bort, tighta

- **Ta bort rubriken "Trupp"** — framgår av bottom nav
- **Ta bort tillbaka-knappen** — SquadScreen nås via bottom nav
- Tighta spelarkorten/raderna: minska padding och marginaler

---

## 14. TransfersScreen — rubrik bort, scouts-info flytta, ikoner på flikar

- **Ta bort rubriken "Transfers"/"Transfermarknad"** — framgår av bottom nav
- **"X scouts kvar"**: flytta ner — antingen in i scouting-flikens yta, eller som en info-badge på scouting-fliken
- **Ikoner på flikarna** för att matcha resten av spelet:
  - "Trupp"/"Kontrakt" → "📋 Kontrakt"
  - "Scouting" → "🔍 Scouting"
  - "Bud" → "💰 Bud"
  - "Marknad" → "📊 Marknad"
  - (Justera efter faktiska fliknamn)

---

## 15. InboxScreen — rubrik bort, tighta, expandera på klick

### 15a. Ta bort rubriken
Ta bort "Inkorg"-rubriken med Bell-ikonen. Oläst-badge och "Markera alla"-knappen ska istället ligga i en kompakt rad direkt under GameHeader:
```tsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
  {unreadCount > 0 && (
    <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
      {unreadCount} olästa
    </span>
  )}
  {unreadCount > 0 && (
    <button onClick={markAllInboxRead} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
      Markera alla som lästa
    </button>
  )}
</div>
```

### 15b. Tightare meddelanden
Minska radpadding: `14px 16px` → `10px 14px`. Minska ikoncirkelns storlek: `36px` → `28px`. Minska gap: `12` → `8`.

### 15c. Expand-on-click funkar redan
Koden har redan `expanded`-state och visar body-text vid klick. Kontrollera att det FUNGERAR — Jacobs observation var att meddelanden "bara flyttas till läst" utan att expanderas. Möjlig orsak: `hasBody` returnerar false för meddelanden utan body-text. Fix: om `!hasBody`, visa ändå titeln tydligare vid klick (t.ex. bold → normal toggle, eller liten animering).

Kontrollera också att "Tryck för att läsa mer" bara visas om det faktiskt finns mer att läsa (body-text existerar).

---

## ORDNING

1-2: Header-fixar (5 min)
3: Planvy spacing (15 min)
4-5: Matchkommentarer + dubbelhändelse (15 min)
6-9: Design-tightening (20 min)
10: EventOverlay-refaktor (30 min)
11: ClubScreen (20 min)
12-14: Rubrik + tillbaka bort + tighta (15 min)
15: InboxScreen (10 min)

`npm run build` efter varje punkt. Pusha efter sista.
