# SPEC: Matchresultat — visuell konsolidering

## Problem
Tre skärmar visar matchresultat med tre olika designspråk:

1. **MatchResultScreen** (efter match, "Se rapport"-knapp) — card-sharp, nyckelmoment + målgörare duplicerade, "Klar vinst" felaktigt vid straffvinst
2. **MatchReportView** (fullständig rapport via match-tabben) — helt annan stil, "MATCHSAMMANFATTNING" header, händelser med PlayerLink, spelarbetyg-lista
3. **RoundSummaryScreen** (omgångssammanfattning) — ny design med hero-score, two-column layout

## Designprincip
**EN visuell modell för matchresultat.** RoundSummaryScreen (bild 3) har bäst grund — hero-score med flavor text, kompakt och tydlig. Använd den som mall.

## Specifika buggar att fixa

### A. Straffvinst flavor text
MatchResultScreen visar "✅ Klar vinst" vid 1-1 avgjort på straffar. Det är inte en "klar vinst".
**Fix:** Ny flavor för straff/förlängning:
- Straffvinst: "🎯 Kalla nerver i straffarna"
- Straffförlust: "😔 Straffarna avgjorde"
- OT-vinst: "⏱️ Avgjort i sista stund"
- OT-förlust: "⏱️ Förlängt lidande"

### B. Vinnare måste markeras tydligt
Vid 1-1 (straffar 2-4) ser det ut som oavgjort. Vinnarens score bör vara i vinst-färg, förlorarens i muted.
**Fix:** Individuell färg per lag istf samma färg på båda:
```
Karlsborg    1 – 1    Lesjöfors
(danger)          (success)
         str. 2–4
```

### C. Nyckelmoment + Målgörare dupliceras
MatchResultScreen visar samma mål i BÅDE "Nyckelmoment" OCH "Goal scorers". Välj EN:
**Fix:** Ta bort "Goal scorers"-sektionen. Nyckelmoment-listan visar redan alla mål + utvisningar med rätt lag-sida.

### D. Spelarbetyg-listan
MatchReportView har en spelarbetyg-lista som bör använda EXAKT samma rad-design som trupp-vyn (PlayerRow i SquadScreen), fast kompaktare:
```
#7  Martinsson  A    8.0  ⭐
#21 Lindqvist   YH   6.5
#1  Engberg     MV   5.8
```
Inte en ny design — återanvänd exakt PlayerRow-mönstret (porträtt, namn, position, betyg) med matchbetyg istf CA.

### E. Statistik-kort
MatchReportView har "STATISTIK" med hörnor/skott/bollinnehav. 
MatchResultScreen har samma data i en inline-rad.
**Konsolidera:** Använd MatchReportView-stilen (card med label i mitten, hemma vänster, borta höger) men i card-sharp istf nuvarande design.

## Implementation

### Steg 1: Fixa MatchResultScreen (enklast, mest synlig)
- Straffar/OT flavor text
- Individuell score-färg per lag
- Ta bort duplicerade målgörare
- Fil: `src/presentation/screens/MatchResultScreen.tsx`

### Steg 2: Harmonisera MatchReportView
- Byt till card-sharp-stil
- Spelarbetyg: återanvänd PlayerRow-mönstret
- Statistik: card-sharp med hemma/mitten/borta layout
- Händelser: samma nyckelmoment-layout som MatchResultScreen
- Fil: `src/presentation/components/match/MatchReportView.tsx`

### Steg 3: RoundSummaryScreen (redan bra)
- Säkerställ att score-färg per lag fungerar vid straffar
- Fil: `src/presentation/screens/RoundSummaryScreen.tsx`

## Filer
- `src/presentation/screens/MatchResultScreen.tsx`
- `src/presentation/components/match/MatchReportView.tsx`
- `src/presentation/screens/RoundSummaryScreen.tsx`
- `src/presentation/screens/SquadScreen.tsx` (referens för PlayerRow)

## Prioritet
Hög. Spelaren ser dessa vyer varje match — inkonsistens urholkar designsystemets trovärdighet.
