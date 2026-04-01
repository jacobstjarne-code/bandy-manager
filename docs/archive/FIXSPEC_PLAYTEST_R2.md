# Fixspec: Alla buggar från playtest — mars 2026

Gör i ordning. `npm run build` efter varje punkt.

---

## 🔴 1. CUP-SNABBSIM: Matchen spelas aldrig

### Fix
I `src/application/useCases/roundProcessor.ts`, cup-skip-blocket (ca rad 290):
Lägg till `&& game.managedClubPendingLineup === undefined` i villkoret.

Revert eventuell `effectiveLiveMode`-workaround i MatchScreen.tsx.
Revert eventuell disable av snabbsim i StartStep.tsx.

### Filer
- `src/application/useCases/roundProcessor.ts`
- `src/presentation/screens/MatchScreen.tsx`
- `src/presentation/components/match/StartStep.tsx`

---

## 🔴 2. CUPMATCH-RESULTAT: Visas som oavgjort trots förlust på straffar

### Fix
I `src/presentation/components/match/MatchDoneOverlay.tsx`:

Lägg till check av `fixture.penaltyResult` och `fixture.overtimeResult`:
```tsx
let actualWinner: 'home' | 'away' | 'draw' = 'draw'
if (managedGoals > oppGoals) actualWinner = managedIsHome ? 'home' : 'away'
else if (managedGoals < oppGoals) actualWinner = managedIsHome ? 'away' : 'home'
else if (fixture.penaltyResult) {
  actualWinner = fixture.penaltyResult.home > fixture.penaltyResult.away ? 'home' : 'away'
} else if (fixture.overtimeResult) {
  actualWinner = fixture.overtimeResult
}
const managedWon = actualWinner === (managedIsHome ? 'home' : 'away')
const managedLost = actualWinner !== 'draw' && !managedWon
const resultColor = managedWon ? '#5A9A4A' : managedLost ? '#B05040' : '#C47A3A'
```

Visa straffresultat under poängen:
```tsx
{fixture.penaltyResult && homeScore === awayScore && (
  <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: -8, marginBottom: 8 }}>
    str. {fixture.penaltyResult.home}–{fixture.penaltyResult.away}
  </p>
)}
```

### Filer
- `src/presentation/components/match/MatchDoneOverlay.tsx`

---

## 🔴 3. "(politiker)" i event — template-variabler ej ersatta

### Fix
I `src/domain/services/events/politicianEvents.ts`, i low-relationship-warning-blocket:

Ersätt template-variablerna INNAN headline används:
```typescript
const papers = ['Lokaltidningen', 'Sportbladet', 'Bandypuls']
const paper = papers[Math.floor(rand() * papers.length)]
const managedClub = game.clubs.find(c => c.id === game.managedClubId)
const clubName = managedClub?.name ?? 'Klubben'
const bidrag = politician.kommunBidrag?.toLocaleString('sv-SE') ?? '30 000'

let headline = NEWSPAPER_HEADLINES[headlineIdx]
headline = headline
  .replace(/\{politician\}/g, politician.name)
  .replace(/\{paper\}/g, paper)
  .replace(/\{club\}/g, clubName)
  .replace(/\{amount\}/g, `${bidrag} kr`)
```

### Filer
- `src/domain/services/events/politicianEvents.ts`

---

## 🔴 4. "Intensitet 1" — intern data i UI

### Fix
I `src/presentation/components/dashboard/NextMatchCard.tsx`:
- Ta bort "· Intensitet {rivalry!.intensity}" från texten (rad ~273)
- Ta bort `<span className="tag tag-red">🔥 Intensitet {rivalry!.intensity}</span>` taggen

### Filer
- `src/presentation/components/dashboard/NextMatchCard.tsx`

---

## 🔴 5. Cup: "Klar för semifinalen" — fel omgång

### Fix
I `DashboardScreen.tsx` → CupCard, ersätt:
```tsx
// VAR:
playedAndWon.length >= 2 ? 'finalen' : 'semifinalen'
// BLI:
const highestWonRound = Math.max(0, ...playedAndWon.map(m => m.round))
const nextRoundName = highestWonRound === 1 ? 'kvartsfinalen'
  : highestWonRound === 2 ? 'semifinalen'
  : highestWonRound === 3 ? 'finalen' : 'nästa omgång'
```

### Filer
- `src/presentation/screens/DashboardScreen.tsx`

---

## 🟠 6. Dashboard: Omgångsräknare visar fel vid cupmatch

### Fix
I `DashboardScreen.tsx`: om nästa match är cup → visa "Spela cupmatch ›", inte "Spela omgång X ›".

### Filer
- `src/presentation/screens/DashboardScreen.tsx`

---

## 🟠 7. Bytesknappen markerad som default

### Fix
I `MatchLiveScreen.tsx`: kontrollera default play speed = 'normal', highlight matchar rätt knapp.

### Filer
- `src/presentation/screens/MatchLiveScreen.tsx`

---

## 🟠 8. "SLUTSPEL"-tag → "TOPP 8"

### Fix
I `DashboardScreen.tsx`: byt till "TOPP 8" eller visa inget omgång 1.

### Filer
- `src/presentation/screens/DashboardScreen.tsx`

---

## 🟠 9. Statistik-flik: Tom + blå outline

### Fix
I `TabellScreen.tsx`: placeholder-text + `outline: 'none'` på tabs.

### Filer
- `src/presentation/screens/TabellScreen.tsx`

---

## 🟠 10. Planvy: Labels och namn osynliga

### Fix
I `PitchLineupView.tsx`: öka slot-höjd 44→58px, font 7→8-9px.

### Filer
- `src/presentation/components/match/PitchLineupView.tsx`

---

## 🟠 11. ⚽ → 🏒 i planvy-toggle

### Fix
I `LineupStep.tsx`: byt "⚽ Planvy" → "🏒 Planvy".

### Filer
- `src/presentation/components/match/LineupStep.tsx`

---

## 🟠 12. Terminologi i matchkommentarer och övrigt

OBS: Kommentarerna ligger i `src/domain/data/matchCommentary.ts` (INTE services/).

### Specifika fixar i matchCommentary.ts:

**"vadden" → "vaden"** (save-sektionen):
```
VAR: "{goalkeeper} räddar med vadden! Vilken reflex!"
BLI: "{goalkeeper} räddar med vaden! Vilken reflex!"
```

**Offside-kommentaren — TA BORT HELT** (neutral-sektionen):
```
TA BORT: "En lång boll, ett offside — spelet börjar om från målgårdsavstamp."
```
Det finns INGEN offside i bandy.

### Sök och ersätt i hela src/:
```bash
grep -rni "avspark\|mittfält\|löpkapacitet\|gult kort\|gula kort\|3 poäng\|frispark\|tackling\|offside\|vadden" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Ersätt:
- "vadden" → "vaden"
- "Avspark" → "Avslag" (OBS: kickoff-arrayen har redan "Avslag" — sök efter kvarliggande)
- "mittfältet" → "mitten av planen" / "mitten"
- "löpkapacitet" → "skridskoåkning i båda riktningar"
- "gult kort"/"gula kort" → "utvisning"/"utvisningar"
- "3 poäng"/"tre poäng" → "2 poäng"/"två poäng"
- "frispark" → "frislag"
- "tackling" → "brytning"
- "offside" → TA BORT hela raden (finns inte i bandy)

### ARCHETYPE_STRENGTHS i scoutingService.ts:
```typescript
[PlayerArchetype.TwoWaySkater]: 'imponerande skridskoåkning i båda riktningar',
[PlayerArchetype.DefensiveWorker]: 'järnhård i försvarsarbetet',
[PlayerArchetype.Dribbler]: 'magisk teknik med bollen',
```

### Filer
- `src/domain/data/matchCommentary.ts` ← OBS rätt sökväg
- `src/domain/services/scoutingService.ts`
- Alla filer grep hittar

---

## 🟡 13. Scoutrapporter: "målvaktsspelet" för utespelare

### Fix
I `scoutingService.ts` → `generateScoutNotes()`: filtrera bort `goalkeeping` från weakest för utespelare.

### Filer
- `src/domain/services/scoutingService.ts`

---

## 🟡 14. Bandydoktorn: Intro + felmeddelande

### Fix
I `BandyDoktorScreen.tsx`: intro-text + bättre felmeddelande.
**Deploy:** Sätt `ANTHROPIC_API_KEY` i Render.

### Filer
- `src/presentation/screens/BandyDoktorScreen.tsx`

---

## ORDNING
1. Cup-snabbsim (#1)
2. Cupmatch-resultat oavgjort (#2)
3. (politiker) template (#3)
4. Intensitet-läcka (#4)
5. Cup semifinalen-bugg (#5)
6. Dashboard cup-ordning (#6)
7. Bytesknapp default (#7)
8. SLUTSPEL-tag (#8)
9. Statistik-flik (#9)
10. Planvy labels (#10)
11. Fotbollsemoji (#11)
12. Terminologi (#12)
13. Scoutrapporter (#13)
14. Bandydoktorn (#14)

`npm run build` efter varje. Pusha efter sista.

## Verifiering
```bash
grep -rni "Intensitet.*intensity\|löpkapacitet\|avspark\|mittfält\|gult kort\|gula kort\|3 poäng\|frispark\|tackling\|offside\|vadden\|{politician}\|{paper}\|{club}\|{amount}" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Ska ge 0 resultat

npm run build
```
