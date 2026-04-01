# DESIGN & BUGG-SPRINT — 18 fixar

Kör uppifrån och ner. `npm run build` efter varje. Committa gruppvis.

**LÄS `docs/DESIGN_SYSTEM.md` FÖRST** — alla ändringar ska följa designsystemet.

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

Ersätt custom headern med samma layout som GameHeader. Vänster: tillbaka-pil + "BANDY MANAGER". Höger: "Välj klubb" (bold) + "jacob · 2026/2027". Samma bakgrund, padding, border.

---

## 3. Planvy spacing — PitchLineupView / LineupFormationView

- Öka `PH` till **170** (från ~130)
- Sprid Y-koordinater: MV 5%, Backar 18-22%, Halvar 35-40%, Centrala 50-55%, Forwards 75-80%
- Mer avstånd mellan positionslabel, cirkel och namn
- Kontrollera ALLA formationer

---

## 4. Matchkommentarer: min-minut

"Publiken suckar", "Klockan tickar", "Spelarna sparar" etc. kräver minute ≥ 20. Filtrera bort ur neutral-poolen om minute < 20.

---

## 5. Dubbelhändelse

Corner-sequence som genererar miss + mål i samma steg → visa bara målet. Eller separera till olika minuter.

---

## 6. Taktik-skärmen — TacticStep.tsx

Yttre padding `'0 14px 16px'`, gruppkort `'10px 14px'`, knapp-padding `8px`, gap 8-10px.

---

## 7. Matchsammanfattning — MatchResultScreen.tsx

Padding `16px 14px`, poängsiffror fontSize 32, 🔴→🏒, alla marginBottom -30-40%.

---

## 8. RoundSummaryScreen

`card-sharp`, padding `10px 14px`, emojis i labels (🏒 MATCHEN, 💰 EKONOMI etc.), header padding ner.

---

## 9. MatchDoneOverlay

Solid bakgrund `#F5F1EB` på kortet. Overlay `rgba(0,0,0,0.6)`.

---

## 10. EventScreen → generell overlay

Flytta till `EventOverlay.tsx` komponent, rendera i GameShell vid pending events, ta bort `/game/events`-routen, zIndex 300.

---

## 11. ClubScreen

### 11a. Sponsorer: komprimera
Ta bort 5 × "Ledig plats". Visa "0/5 platser" som en rad + kompakt "Ragga sponsor"-knapp.

### 11b. Daglig träning: emoji + rubrik på samma rad som SegmentedControl
```
🏋️ Fysik     [Lätt] [Normal] [Hård]
```

### 11c. Intensitet: rundade SegmentedControl-knappar

### 11d. Träningsprojekt: linjera knappar

### 11e. Action-knappar: kompakta, inte fullbredd

---

## 12. TabellScreen

- Ta bort rubrik "Tabell"
- Ta bort tillbaka-knapp
- Tighta tabellrader

---

## 13. SquadScreen

- Ta bort rubrik "Trupp"
- Ta bort tillbaka-knapp
- Tighta spelarkort

---

## 14. TransfersScreen

- Ta bort rubrik
- Flytta "X scouts kvar" ner i scouting-flikens yta
- Ikoner på flikar: 📋 Kontrakt, 🔍 Scouting, 💰 Bud, 📊 Marknad

---

## 15. InboxScreen

- Ta bort "Inkorg"-rubrik + Bell-ikon
- Kompakt rad med "X olästa" + "Markera alla"
- Padding `10px 14px`, ikoncirkel 28px, gap 8
- Verifiera expand-on-click fungerar

---

## 16. SeasonSummaryScreen

I `src/presentation/screens/SeasonSummaryScreen.tsx`:

Skärmen använder custom `Card`-komponent med inline `borderRadius: 12` istället för `card-sharp`. Generellt lite för gles.

**Fix:**
- Byt alla `<Card>` → `<div className="card-sharp">` med padding `10px 14px`
- Header: minska padding `24px 0 20px` → `16px 0 12px`
- Positionssiffra: `fontSize: 40` → `fontSize: 32`
- StatRow: minska paddingBottom/marginBottom `8` → `6`
- HEMMA/BORTA-grid: minska gap `8` → `6`
- Alla kort: marginBottom `12` → `8`
- Tillbaka-knapp FÅR vara kvar (hierarkisk navigering)
- `🔴` (toppskyttar) → `🏒`

---

## 17. PreSeasonScreen

I `src/presentation/screens/PreSeasonScreen.tsx`:

Alla kort använder inline `borderRadius: 12` och `padding: '14px 16px'`.

**Fix:**
- Byt alla inline-kort till `className="card-sharp"` med padding `10px 14px`
- Gap mellan kort: `14` → `8`
- Header padding: `24px 0 20px` → `16px 0 12px`
- Budgetprioritet-knapparna: verifiera att de använder SegmentedControl-stil (ser ut att göra det redan, men kontrollera borderRadius)

---

## 18. HistoryScreen

I `src/presentation/screens/HistoryScreen.tsx`:

Använder `card-round` klass. Generellt OK men kan tightas.

**Fix:**
- Byt `card-round` → `card-sharp` på alla kort
- `🔴` (Toppskytt) → `🏒`
- Gap mellan säsongskort: `14` → `8`
- Kort padding: `16px` → `12px 14px`
- JourneyGraph-kortet: padding `14px 16px 10px` → `10px 14px 8px`
- Rekord/Hall of Fame-korten: padding `18px 16px` → `12px 14px`
- Tillbaka-knapp FÅR vara kvar (hierarkisk navigering)

---

## ORDNING

1-2: Header-fixar (5 min)
3: Planvy spacing (15 min)
4-5: Matchkommentarer + dubbelhändelse (15 min)
6-9: Design-tightening (20 min)
10: EventOverlay-refaktor (30 min)
11: ClubScreen (20 min)
12-15: Rubrik + tillbaka bort + tighta (20 min)
16-18: Resterande vyer (15 min)

`npm run build` efter varje punkt. Pusha efter sista.
