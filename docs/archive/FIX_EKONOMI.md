# EKONOMI-FIX — Lägg till i MATCHDAY_REFAKTOR.md DEL B

Lägg till som **B17** i docs/MATCHDAY_REFAKTOR.md.

---

## B17. EKONOMI: Intäkter för höga + möjlig bortamatch-bugg

### Problem A: Intäkter på bortamatcher
Jacob rapporterar att kassan ökar även vid bortamatcher. `calcRoundIncome` i `economyService.ts` sätter `matchRevenue = 0` om `isHomeMatch` är false — så logiken ser rätt ut. Men kontrollera hur roundProcessor bestämmer `isHomeMatch` för managed club.

**Undersök i roundProcessor.ts:** sök efter `calcRoundIncome` och kontrollera att `isHomeMatch` sätts till:
```typescript
const isHomeMatch = simulatedFixtures.some(
  f => f.homeClubId === c.id && f.status === FixtureStatus.Completed
)
```
`c.id` MÅSTE vara `game.managedClubId`. Om den loopar över ALLA klubbar och skickar `isHomeMatch` baserat på DERAS hemmamatch (alla klubbar har en hemmamatch eller bortamatch per omgång) → alla får matchintäkter → fel.

**Fix:** Se till att managed club BARA får matchRevenue vid HEMMA-match.

### Problem B: Intäkterna är alldeles för höga

Nuvarande formel i `calcRoundIncome`:
```
capacity = reputation * 25 + 600    (rep 60 → 2100)
ticketPrice = 60 + reputation * 0.4  (rep 60 → 84 kr)
baseRevenue = capacity * attendanceRate * ticketPrice
            = 2100 * 0.63 * 84 ≈ 111,000 kr per hemmamatch
```

111k per hemmamatch × 11 hemmamatcher = 1.2M per säsong bara i biljettintäkter. Det är för högt för de fiktiva småklubbarna i spelet. Svenska bandyklubbar utanför absolut-toppen har ofta 300-1500 åskådare till 80-120 kr.

**Fix — skala ner:**
```typescript
// I economyService.ts → calcRoundIncome:
const capacity = club.arenaCapacity ?? Math.round(club.reputation * 12 + 300)
// rep 60 → 1020 (var 2100)
// rep 40 → 780 (var 1600)
// rep 80 → 1260 (var 2600)

const ticketPrice = 80 + Math.round((club.reputation ?? 50) * 0.3)
// rep 60 → 98 kr (var 84 — lite högre biljettpris, lägre kapacitet)

// Resultat: 1020 * 0.63 * 98 ≈ 63,000 kr per hemmamatch
// × 11 = ~690k per säsong — rimligare
```

Alternativt: halvera `weeklyBase` också:
```typescript
const weeklyBase = Math.round(club.reputation * 120)
// rep 60 → 7,200/omg (var 15,000)
```

### Problem C: Derby/slutspel/annandag-bonusar finns redan
`calcRoundIncome` har redan:
- `derbyBonus = 1.40` 
- `eventBonus = 1.50` (knockout), `1.25` (cup)

Dessa är rimliga och behöver inte ändras.

### Filer
- `src/domain/services/economyService.ts` — skala ner capacity och weeklyBase
- `src/application/useCases/roundProcessor.ts` — verifiera isHomeMatch-logik
