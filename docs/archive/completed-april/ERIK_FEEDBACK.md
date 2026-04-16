# Eriks feedback — Bugfix + Feature spec

Gör i ordning uppifrån. `npm run build` efter varje punkt. Committa gruppvis (buggar, sedan features). Pusha efter sista.

---

## SNABBFIXAR (text/data/logik)

### 1. P17 → P19
Ändra ALL text som refererar till "P17" till "P19" — akademin, dashboard, inbox, youthTeam.
Sök globalt: `grep -rn "P17" src/` och byt alla förekomster.
OBS: Ändra INTE variabelnamn eller filnamn, bara user-facing strängar.

### 2. Datum på Dashboard
Visa aktuellt datum tydligt i Dashboard-headern, intill omgångsnummer.
I DashboardScreen.tsx, lägg till datum intill advance-knappen eller i header-sektionen:
```tsx
// game.currentDate är t.ex. "2026-10-15"
const dateObj = new Date(game.currentDate)
const months = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december']
const dateStr = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`
```
Visa `dateStr` och `Omgång ${currentRound}` tydligt överst på Dashboard, t.ex. under GameHeader.

### 3. Ålder saknas på scoutade spelare
I TransfersScreen.tsx, scouting-listan: lägg till ålder i info-raden.
Hitta raden med `{positionShort(player.position)} · {club?.name ?? '?'} · {formatValue(player.marketValue)}` och lägg till `{player.age} år`:
```tsx
{positionShort(player.position)} · {player.age} år · {club?.name ?? '?'} · {formatValue(player.marketValue)}
```
Gör samma sak i scoutrapporter och spaningsresultat.

### 4. Träning/jobb-kollision för frekvent
I roundProcessor.ts, hitta där träning/jobb-konflikter genereras.
Sänk sannolikheten från nuvarande (verkar vara varje omgång) till ~15% per omgång:
```typescript
if (rand() < 0.15) { // Var: troligen ingen check eller 100%
  // Generera träning/jobb-event
}
```

### 5. Annandagen måste vara 26 december
Kontrollera i scheduleGenerator.ts att omgång 8 (Annandagsrundan) mappas till 26 december.
Sök efter Annandagen-datum och verifiera att det är `${season}-12-26` eller liknande.

### 6. Annandagen MÅSTE vara derby
I scheduleGenerator.ts: omgång 8 ska schemaläggas så att rivaler möter varandra.
Importera rivalries-data (`src/domain/data/rivalries.ts`) och vid omgång 8:
1. Hämta alla rivalitetspar
2. Para ihop rivalpar som hemmamatch/bortamatch
3. Resterande lag fördelas slumpmässigt
Om detta är för komplext, prioritera åtminstone att managed club möter sin rival i omgång 8.

### 7. Fel motståndare visas vid Annandagen
I DashboardScreen.tsx eller NextMatchCard.tsx: kontrollera att motståndarnamnet hämtas från nextFixture, inte från senaste matchen. Troligen ett state-problem där föregående fixture fortfarande visas.

### 8. Cupmatch — spelas inte, utslagen direkt
I roundProcessor.ts / advanceToNextEvent.ts: när en cupmatch är schemalagd för managed club, ska spelet INTE auto-resolva den. Managed club-cupmatcher ska navigera till Match-skärmen precis som ligamatcher.
Sök efter `isCup` i advance-logiken. Se till att:
```typescript
// Om nästa fixture är en cupmatch för managed club → navigera till match, inte auto-sim
const managedCupMatch = scheduledFixtures.find(f => 
  f.isCup && 
  effectiveRound(f) === nextEffRound &&
  (f.homeClubId === managedClubId || f.awayClubId === managedClubId)
)
if (managedCupMatch) {
  // Navigera till /game/match, INTE simulera
}
```

### 9. Batch sim — stoppar efter en omgång
I DashboardScreen.tsx batch sim useEffect: verifiera att loopen inte avbryts av pendingEvents-navigation.
Kontrollera att:
- Events auto-resolvas utan navigation under batch sim
- Loopen fortsätter till nästa `advance()` efter events resolverats
- Bara verkliga stopp (seasonEnd, playoffStarted, managedCupMatch) avbryter

---

## GAMEPLAY-FÖRÄNDRINGAR

### 10. Byten — flygande byten (bandyregler)
I bandy finns INGA begränsade byten. Flygande byten tillåts hela matchen (som ishockey).
Ändra bytessystemet:
- Ta bort `liveSubsUsed < 2`-begränsningen i MatchLiveScreen.tsx
- Byten ska vara tillgängliga hela matchen, inte bara minut 10-50
- Halvtidsbyten behåller taktisk funktion men är inte "vanliga byten"
- Ändra bytesknappen att alltid vara synlig (förutom vid matchslut)

```tsx
// Var:
{currentStep >= 10 && currentStep <= 50 && liveSubsUsed < 2 && !matchDone && (
// Ny:
{!matchDone && currentStep >= 0 && (
```

Ta bort `liveSubsUsed`-state helt — obegränsade byten.

### 11. Utvisningar saknas
Kontrollera matchSimulator.ts / matchStepByStep.ts:
- Verkar som utvisningar (MatchEventType.RedCard, YellowCard) inte genereras
- Kontrollera att utvisningslogik finns: spelare med låg discipline → chans för gult/rött kort
- Utvisningssituationer ska påverka spelet (numerärt underläge 2 min)
- `activeSuspensions` i MatchStep måste uppdateras korrekt

### 12. Hörnor — fel tilldelning
Erik rapporterar: "hörna för motståndarlaget, sedan mitt lag gör hörnmål"
Kontrollera i matchSimulator.ts att:
- `cornerClubId` korrekt sätts till det lag som TAR hörnan
- Mål efter hörna tillskrivs rätt lag
- `isCornerGoal` flaggan kopplas till rätt clubId

### 13. Presskonferens — svar matchar inte frågor
I pressConferenceService.ts: granska question/answer-mappningen.
Problemet är troligen att frågorna och svarsalternativen genereras oberoende av varandra.
Fix: varje fråga ska ha 3 svar som DIREKT relaterar till frågan.
Strukturera som:
```typescript
const pressTemplates = [
  {
    question: "Laget spelade otroligt idag. Vad är hemligheten?",
    choices: [
      { label: '"Vi har jobbat hårt på träning."', ... },
      { label: '"Spelarna förtjänar all kredit."', ... },
      { label: '"Det handlar om laganda."', ... },
    ]
  },
  // ...fler templates
]
```
Matcha fråga+svar baserat på matchresultat (vinst/förlust/oavgjort) och matchtyp (derby/cup/normal).

### 14. Uppställning — SKIPPAS DENNA SPRINT
Drag-and-drop/klick-per-position kräver en större designinsats. Parkeras.
Istället: förbättra nuvarande system genom att visa tydligare vilken position varje spelare tilldelas.
I LineupFormationView.tsx, visa positionsetikett (MV/DEF/HALF/MID/FWD) OVANFÖR varje cirkel.
Visa spelarens nummer (se punkt 15) och efternamn under cirkeln.

### 15. Spelarnummer i uppställning
I LineupFormationView.tsx, visa nummer istället för (eller utöver) förkortade namn:
- Generera nummer vid spelskapande (worldGenerator.ts): `shirtNumber: index + 1` eller smart tilldelning
- Visa numret i cirkeln på planen: stor siffra (t.ex. 18px bold)
- Visa namn under cirkeln eller som tooltip

Om Player-entiteten saknar `shirtNumber`, lägg till det:
```typescript
// I Player entity:
shirtNumber?: number

// I worldGenerator.ts, generera:
shirtNumber: index + 1 // Enkel variant
```

### 16. Statistikflik — hela ligan
Ny tab eller sektion i TabellScreen.tsx med ligastatistik:
- Toppskytt (alla lag)
- Flest assist
- Flest hörnmål
- Bästa snittbetyg (min 5 matcher)
- Flest utvisningsminuter

Data finns redan i `player.seasonStats`. Samla alla spelare, sortera, visa topp 10 per kategori.

Lägg till en tab i TabellScreen: "TABELL" | "STATISTIK"

```tsx
const allPlayers = game.players.filter(p => p.seasonStats.gamesPlayed > 0)
const topScorers = [...allPlayers].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals).slice(0, 10)
const topAssisters = [...allPlayers].sort((a, b) => b.seasonStats.assists - a.seasonStats.assists).slice(0, 10)
const topCornerGoals = [...allPlayers].sort((a, b) => b.seasonStats.cornerGoals - a.seasonStats.cornerGoals).slice(0, 10)
const topRated = [...allPlayers].filter(p => p.seasonStats.gamesPlayed >= 5).sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating).slice(0, 10)
```

### 17. Hallfrågan — vad tillför den?
Om det inte finns en tydlig spelmekanik kopplad till att bygga hall → ta bort frågan tills vi har en riktig implementation. Alternativt: hall ger möjlighet att träna under hela veckan (bonus fitness/development), bättre draft (ungdomar föredrar klubbar med hall), och matchdagsinkomster på vintern.
Om vi behåller den, lägg till en förklaringstext som säger vad hallen ger.

---

## ORDNING
1. Snabbfixar 1-9 (text, datum, logik) — committa som "fix: Erik feedback batch 1"
2. Gameplay 10-13 (byten, utvisningar, hörnor, presskonferens) — committa som "fix: bandy rules + match engine"  
3. Features 14-17 (positionsetiketter, nummer, statistik, hall) — committa som "feat: lineup labels, stats, shirt numbers"

OBS: Punkt 14 (drag-and-drop lineup) är PARKERAD. Gör bara positionsetiketterna tydligare.

## Verifiering
```bash
npm run build

# P17 helt borta:
grep -rn "P17" src/ | grep -v node_modules | grep -v ".d.ts"
# Ska ge 0 resultat

# Ålder i scouting:
grep -n "player.age" src/presentation/screens/TransfersScreen.tsx

# Annandagen datum:
grep -rn "12-26\|annandagen\|Annandagen" src/
```
