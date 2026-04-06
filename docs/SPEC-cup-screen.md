# SPEC: Svenska Cupen-skärm

## Syfte
Cupen saknar ett eget hem. Efter att man spelat en cupmatch finns det inget sätt att se hur det gått för andra lag, vilka som gått vidare, eller vad nästa cupmatch är. Allt man har är ett kort på dashen som ibland dyker upp.

## Åtkomst
1. **Klickbar från cup-kortet på dashen** (🏆 SVENSKA CUPEN → navigerar till `/game/cup`)
2. **Tredje flik under Tabell-skärmen** (TABELL | STATISTIK | **CUPEN**) — matchar befintliga tab-switcher-designen

## Design
Ska matcha TabellScreen i utseende: samma tab-switcher, samma card-sharp-stil, samma typografi.

## Innehåll

### Header
Sammanfattningskort (som tabellens "9. plats · Utanför slutspel"):
- **Om kvar:** "Kvar i cupen · Nästa: Kvartsfinal"
- **Om utslagen:** "Utslagen i förstarundan"
- **Om vunnit:** "🏆 Cupvinnare!"

### Bracket-vy
Visa alla rundor vertikalt, senaste överst:

```
── FINAL ──
(Visas bara om spelad eller schemalagd)
Lag A  3 – 1  Lag B

── SEMIFINAL ──
Lag C  2 – 4  Lag D
★ Hälleforsnäs  1 – 3  Lag E   ← managed club markerat

── KVARTSFINAL ──  
Lag F  0 – 2  Lag C
Lag D  5 – 1  Lag G
★ Hälleforsnäs  3 – 2  Lag H
Lag E  4 – 0  Lag I

── FÖRSTARUNDA ──
(8 matcher)
```

### Per match-rad
- Hemma vs Borta med resultat (eller "Ej spelad")
- Managed club markerat med ★ + accent-färg
- Vinnare i bold
- Förlorare i text-muted

### Managed clubs matcher (highlight-sektion)
Överst, före bracketen, ett kort med dina spelade cupmatcher:

```
DINA CUPMATCHER

Förstarunda    Hälleforsnäs 3–2 Lesjöfors    ✓ Vidare
Kvartsfinal    Söderfors 1–4 Hälleforsnäs     ✓ Vidare  
Semifinal      Hälleforsnäs 1–3 Karlsborg     ✗ Utslagen
```

### Nästa match-info
Om managed club har en schemalagd cupmatch:
```
NÄSTA CUPMATCH
Semifinal · Hälleforsnäs vs Karlsborg
Hemma · Matchdag 13
```

## Implementation

### Ny fil
`src/presentation/screens/CupScreen.tsx`

### Data
All data finns redan i `game.cupBracket`:
- `bracket.matches[]` — alla matcher med `round`, `homeClubId`, `awayClubId`, `homeScore`, `awayScore`, `winnerId`
- `bracket.completed`, `bracket.winnerId`
- Plus `game.fixtures` för schemalagda cupmatcher

### Routing
Lägg till route `/game/cup` i router (under GameShell, med BottomNav).

### Tab-integration i TabellScreen
Utöka tab-switcher med tredje flik "CUPEN":
```tsx
const TABS = ['tabell', 'statistik', 'cupen'] as const
```
När "cupen" är vald, rendera CupScreen-innehållet (eller navigera till `/game/cup`).

**Rekommendation:** Rendera inline i TabellScreen (som statistik-fliken gör) snarare än separat route. Enklare, konsekvent.

### Dashboard-koppling
Cup-kortet på dashen (`CupCard` i DashboardScreen) bör bli klickbart → navigerar till TabellScreen med `state: { tab: 'cupen' }`.

## Filer att ändra/skapa
- `src/presentation/screens/TabellScreen.tsx` — ny flik + cup-innehåll (eller import av CupScreen)
- `src/presentation/screens/CupScreen.tsx` — ny fil (om separat)
- `src/presentation/screens/DashboardScreen.tsx` — CupCard klickbar → TabellScreen cupen-flik
- `src/domain/services/cupService.ts` — ev. helper `getCupBracketDisplay()` 

## Prioritet
Medelhög. Cupen fungerar mekaniskt men är osynlig. Denna skärm gör den till en del av spelarens mentala modell.
