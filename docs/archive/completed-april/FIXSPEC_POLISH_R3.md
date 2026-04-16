# FIXSPEC: Rikedom och content — polishomgång 3

---

## FIX 1: "Se resultat" → "Se sammanfattning"

MatchLiveScreen slutsignal-knapp: byt text från "Se resultat →" till "Se sammanfattning →".
1 rad.

---

## FIX 2: Bättre matchreferat vid slutsignal

I MatchLiveScreen (eller var `generateMatchSummary` finns): referatet ska referera till vad som faktiskt hände — inte generiska one-liners.

```typescript
function generateMatchSummary(
  homeScore: number, awayScore: number, 
  managedIsHome: boolean, steps: MatchStep[]
): string {
  const myScore = managedIsHome ? homeScore : awayScore
  const theirScore = managedIsHome ? awayScore : homeScore
  const goalScorers = steps.flatMap(s => s.events.filter(e => e.type === 'goal'))
  
  // Find top scorer
  const scorerCounts: Record<string, number> = {}
  goalScorers.forEach(e => { if (e.playerId) scorerCounts[e.playerId] = (scorerCounts[e.playerId] ?? 0) + 1 })
  const topScorerId = Object.entries(scorerCounts).sort((a,b) => b[1] - a[1])[0]?.[0]
  // Get player name from steps (we don't have game context here)
  
  const totalGoals = homeScore + awayScore
  const margin = myScore - theirScore
  
  if (myScore > theirScore) {
    if (margin >= 3) return `Dominant insats från start till slut. ${totalGoals} mål totalt — publiken fick valuta för pengarna.`
    if (totalGoals >= 8) return `Vild match med ${totalGoals} mål. Offensivt spel som kunde gått åt båda hållen.`
    if (margin === 1) return `Jämn match som avgjordes sent. Nerverna höll hela vägen.`
    return `Kontrollerad seger. Laget visade mognad i de avgörande lägena.`
  }
  if (myScore < theirScore) {
    if (margin <= -3) return `Motståndarna dominerade från start. Mycket att jobba med inför nästa.`
    if (margin === -1) return `Nära men inte nog. Laget skapade chanser men saknade skärpa framför mål.`
    return `Motståndarna var starkare idag. Laget kämpade men det räckte inte.`
  }
  if (totalGoals >= 6) return `Målrikt kryss — ${totalGoals} mål och drama från båda sidor.`
  if (totalGoals === 0) return `Mållöst. Båda lagen var defensivt stabila men saknade den sista gnistan.`
  return `Rättvis poängdelning. Båda lagen hade sina perioder.`
}
```

---

## FIX 3: Mecenat-generering — 50% kvinnor + bakgrundshistoria

### A) Höj kvinnoandelen
I `mecenatService.ts`, ändra:
```typescript
const isFemale = rand() < 0.3
// till:
const isFemale = rand() < 0.5
```

### B) Lägg till bakgrundshistoria
Nytt fält i Mecenat-interfacet:
```typescript
backstory?: string  // En rad om vem personen är
```

Generera baserat på typ + kön:
```typescript
const BACKSTORIES: Record<MecenatType, { male: string[]; female: string[] }> = {
  brukspatron: {
    male: ['Tredje generationens bruksägare. Farfadern grundade sågverket.', 'Köpte bruket vid konkursen 2008. Vände det på tre år.'],
    female: ['Tog över efter fadern. Moderniserade hela produktionslinjen.', 'Skogsbolagets VD sedan 15 år. Känd för att hålla vad hon lovar.'],
  },
  skogsägare: {
    male: ['Äger 800 hektar skog norr om orten. Jagar älg varje höst.', 'Skogsmaskinsentreprenör som blev markägare. Pragmatisk.'],
    female: ['Ärvde skogen av mormodern. Driver den som ett modernt företag.', 'Biolog som blev skogsägare. Kombinerar naturvård med avverkning.'],
  },
  it_miljonär: {
    male: ['Sålde sin startup för 40 miljoner. Flyttade hem till orten.', 'Techbolag i Stockholm men hjärtat är kvar här.'],
    female: ['Grundade en SaaS-firma i garaget. Nu 30 anställda.', 'Lämnade Google för att bygga något eget. Tillbaka i bygden.'],
  },
  entrepreneur: {
    male: ['Äger tre bilhallar i länet. Sponsrar allt som rör sig.', 'Startade som lärling. Nu största byggfirman i kommunen.'],
    female: ['Driver regionens största eventbyrå. Vet hur man skapar stämning.', 'Från bageri till restaurangkedja. Affärssinne i blodet.'],
  },
  fastigheter: {
    male: ['Äger halva centrumkvarteret. Tyst men inflytelserik.', 'Byggde 200 lägenheter under 2010-talet. Kommunens största hyresvärd.'],
    female: ['Fastighetsmäklare som blev investerare. Känner varje hus i orten.', 'Arkitekt som blev byggherre. Formger ortens framtid.'],
  },
  lokal_handlare: {
    male: ['Tredje generationens ICA-handlare. Alla i orten känner honom.', 'Öppnade Handlarn när alla sa att det var omöjligt. Finns kvar.'],
    female: ['Driver ortens enda mataffär. Navet i bygden.', 'Tog över butiken från föräldrarna. Moderniserade och expanderade.'],
  },
  jordbrukare: {
    male: ['Mjölkbonde med 120 kor. Sponsrar P19 sedan 2018.', 'Spannmålsodlare som diversifierade. Nu också vindkraft.'],
    female: ['Driver ekologiskt jordbruk. Säljer direkt till restauranger i stan.', 'Mjölkbonde i tredje generationen. Envis och rak.'],
  },
}

const backstory = BACKSTORIES[template.type]?.[isFemale ? 'female' : 'male']?.[Math.floor(rand() * 2)] ?? ''
```

### C) Visa backstory i OrtenTab
Under mecenatens namn/företag:
```tsx
{mecenat.backstory && (
  <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
    {mecenat.backstory}
  </p>
)}
```

---

## FIX 4: Patron vs Mecenat — tydligare labels

I OrtenTab (ClubScreen orten-flik):
- Patron-kortet: label "PATRON" (inte "MECENAT")
- Mecenat-kortet: label "MECENATER" (plural)
- Under patron-label: visa typ-text: "Brukspatron" / "IT-miljonär" / "Skogsägare" etc.

```typescript
const typeLabels: Record<MecenatType, string> = {
  brukspatron: 'Brukspatron',
  skogsägare: 'Skogsägare',
  it_miljonär: 'IT-entreprenör',
  entrepreneur: 'Företagare',
  fastigheter: 'Fastighetsägare',
  lokal_handlare: 'Lokal handlare',
  jordbrukare: 'Jordbrukare',
}
```

---

## FIX 5: Presskonferens fortfarande inte klickbar

Se FIXSPEC_POLISH_R2.md Fix 1. Debug:
1. Lägg `console.log` i handleChoice
2. Kolla om funktionen ens anropas
3. Om ja: kolla om resolveEvent kraschar på presskonferensens effect-typ
4. Om nej: kolla om knapparna har pointer-events: none eller en overlay ovanpå

**Vanligaste orsaken:** EventOverlay renderas OVANPÅ GranskaScreen med zIndex 300. Kolla EventOverlay — blockeras den under /game/review?

```typescript
// EventOverlay.tsx:
const isMatchScreen = location.pathname.includes('/match/live') || 
  location.pathname === '/game/match' || 
  location.pathname === '/game/match-result'
```

**SAKNAS: `/game/review`!** Lägg till:
```typescript
const isReviewScreen = location.pathname === '/game/review'
// ...
if (!game || events.length === 0 || isMatchScreen || isReviewScreen) return null
```

Det förklarar varför presskonferensen inte kan klickas — EventOverlay ligger ovanpå med samma event och fångar klicken, men den kanske inte visar knapparna synligt (trasig rendering).

---

## ORDNING

1. Fix 5 (presskonferens — EventOverlay blockering)
2. Fix 1 (text: "Se sammanfattning")
3. Fix 2 (matchreferat)
4. Fix 4 (patron/mecenat labels)
5. Fix 3 (kvinnor + backstory)

Committa per fix.
