# FEATURE SPEC — Utökade styrelsemål (V0.2)

## Varför (för Code)

Det nuvarande systemet har ETT mål: tabellplacering. Det gör att
styrelsen känns som en envåningshus — man vet alltid exakt vad de
vill, och det finns ingen tension utöver "vinn matcher".

Det nya systemet ger spelaren FLERA mål som ibland krockar med
varandra. Ska du köpa den där dyra forwarden som styrelsen vill
ha, eller hålla ekonomin i balans som kassören kräver? Ska du
satsa på ungdomar som traditionalisten vill, eller värva utifrån
för att klara tabellmålet?

Det är i krocken mellan målen som spelet blir intressant.

---

## Koncept: Primärt mål + Sekundära uppdrag

### Primärt mål (kvarstår)
Tabellplacering, exakt som idag:
- `avoidBottom`, `midTable`, `challengeTop`, `winLeague`
- Justeras automatiskt baserat på förra säsongens resultat

### Sekundära uppdrag (NYTT)
1-2 sekundära mål per säsong, valda utifrån klubbens situation.
Varje uppdrag har en **styrelseledamot som äger frågan** — 
det är DERAS uppdrag, och de kommenterar det under säsongen.

#### Möjliga uppdrag:

**KASSÖRENS UPPDRAG (ekonom):**
- `balanceBudget` — "Klubbkassan får inte vara negativ vid
  säsongsslut." Triggas om kassan var negativ förra säsongen.
- `growFinances` — "Öka klubbkassan med minst 100 tkr."
  Triggas om ekonomin är stabil men kassören ser potential.
- `reduceSalaries` — "Sänk den totala lönekostnaden med 15%."
  Triggas om lönekostnaderna överstiger intäkterna.

**TRADITIONALISTENS UPPDRAG:**
- `playHomegrown` — "Minst 3 egenfostrade spelare ska starta
  i snitt." Triggas om klubben har stark akademi.
- `keepIdentity` — "Behåll formationen 3-3-4. Det är vår
  identitet." Triggas av traditionalist-ordförande.
- `cornerFocus` — "Vi är kända för våra hörnor. Fortsätt
  satsa på det." Triggas om cornerGoals var höga förra året.

**MODERNISTENS UPPDRAG:**
- `growFanbase` — "Fan mood ska nå 70 vid säsongsslut."
  Triggas om fanMood < 50.
- `startActivities` — "Starta minst 2 nya föreningsaktiviteter."
  Triggas om communityActivities är mestadels 'none'.
- `mediaPresence` — "Aktivera sociala medier." Triggas om
  socialMedia inte är aktivt.

**SUPPORTERNS UPPDRAG:**
- `cupRun` — "Gå långt i cupen. Finalen vore magiskt."
  Triggas slumpmässigt, ca 30% chans.
- `beatRival` — "Vi MÅSTE slå {rival} den här säsongen."
  Triggas om det finns en rivalry med negativ historik.
- `excitingFootball` — "Publiken vill se mål. Minst 60 mål
  den här säsongen." Triggas om laget gjort < 50 mål.

---

## Datastruktur

### Nytt på SaveGame:
```typescript
interface BoardObjective {
  id: string                    // t.ex. 'balanceBudget', 'playHomegrown'
  type: 'economic' | 'academy' | 'identity' | 'community' | 'sporting'
  label: string                 // "Håll ekonomin i balans"
  description: string           // Längre text som visas vid styrelsemötet
  ownerId: string               // Namn på styrelseledamoten som äger frågan
  ownerPersonality: BoardPersonality
  
  // Mätning
  targetValue: number           // Målvärde (t.ex. 0 för balanceBudget = "ej negativ")
  currentValue: number          // Uppdateras vid round 7, 14, 22
  measureFn: string             // Nyckel till utvärderingsfunktion
  
  // Status
  status: 'active' | 'met' | 'failed' | 'at_risk'
  assignedSeason: number
  
  // Konsekvenser
  successReward: string         // "Kassören är nöjd. Budget +50k nästa säsong."
  failureConsequence: string    // "Kassören är besviken. Skärpt budgetkontroll."
  carryOver: boolean            // Om misslyckande → samma mål nästa säsong med hårdare krav?
}
```

### Nytt på SaveGame:
```typescript
boardObjectives?: BoardObjective[]    // 1-2 aktiva per säsong
boardObjectiveHistory?: Array<{       // historik för narrativ
  season: number
  objectiveId: string
  result: 'met' | 'failed'
  ownerReaction: string               // "Kassören drog en lättnadens suck"
}>
```

---

## Livscykel

### Styrelsemöte (säsongsstart)
Styrelsen presenterar primärt mål + sekundära uppdrag.
Varje uppdrag presenteras av ledamoten som äger det, i deras röst:

> **Ulf Bergström** (kassör, ekonom):
> "Vi kan inte fortsätta blöda pengar. Jag vill se en
> klubbkassa som inte är röd vid säsongsslut. Det är
> mitt krav."

> **Rolf Svensson** (ledamot, traditionalist):
> "Vi har fyra pojkar från orten i truppen. Minst tre
> av dem ska starta regelbundet. Det är så vi bygger
> en klubb."

### Omgång 7, 14, 22 (check-ins)
boardService utvärderar sekundära mål och genererar
inbox-meddelanden från ägaren:

**On track:**
> 📋 Ulf Bergström: "Siffrorna ser bra ut. Fortsätt så."

**At risk:**
> ⚠️ Ulf Bergström: "Kassan krymper. Vi måste prata."

**Already failed:**
> 🔴 Rolf Svensson: "Bara en egenforstrad i startelvan
> senaste tre matcherna. Det här var inte vad vi kom
> överens om."

### Säsongsslut (verdict)
Sekundära mål utvärderas separat från primärt mål.
Kombinationen ger det totala styrelsebetyget:

```
Primärt mål uppfyllt + alla sekundära uppfyllda → Betyg 5
Primärt mål uppfyllt + 1 sekundärt misslyckat   → Betyg 4
Primärt mål misslyckat + sekundära uppfyllda     → Betyg 3
Primärt mål misslyckat + sekundärt misslyckat    → Betyg 2
Allt misslyckat                                  → Betyg 1 → risk för sparken
```

### Carry-over (nästa säsong)
Misslyckade mål kan ÅTERKOMMA med hårdare formulering:

Säsong 1: "Håll ekonomin i balans" → MISSLYCKAT
Säsong 2: "Ekonomin MÅSTE vara i balans. Styrelsen 
  accepterar inga ursäkter den här gången."
  (Konsekvens vid nytt misslyckande: sparken)

Uppfyllda mål kan ERSÄTTAS av nya, mer ambitiösa:

Säsong 1: "Starta 2 föreningsaktiviteter" → UPPFYLLT
Säsong 2: "Bygdens puls ska nå 70." (ny ambitionsnivå)

---

## Urval av sekundära mål (generateBoardObjectives)

Algoritm vid säsongsstart:

```typescript
function generateBoardObjectives(
  club: Club,
  game: SaveGame,
  boardMembers: BoardMember[],
  lastSummary: SeasonSummary | null,
  rand: () => number,
): BoardObjective[] {
  const objectives: BoardObjective[] = []
  const kassör = boardMembers.find(m => m.role === 'kassör')
  const traditionalist = boardMembers.find(m => m.personality === 'traditionalist')
  const modernist = boardMembers.find(m => m.personality === 'modernist')
  const supporter = boardMembers.find(m => m.personality === 'supporter')

  // 1. Kassören ALLTID om ekonomin var dålig
  if (club.finances < 0 && kassör) {
    objectives.push(balanceBudget(kassör))
  } else if (club.finances > 0 && club.finances < 200000 && kassör && rand() < 0.4) {
    objectives.push(growFinances(kassör))
  }

  // 2. Andra uppdrag baserat på situation
  const candidates: BoardObjective[] = []
  
  if (traditionalist) {
    const homegrown = game.players.filter(p => 
      p.clubId === club.id && p.isHomegrown
    ).length
    if (homegrown >= 3) candidates.push(playHomegrown(traditionalist, homegrown))
  }
  
  if (modernist && !game.communityActivities?.socialMedia) {
    candidates.push(mediaPresence(modernist))
  }
  
  if (supporter) {
    const rivalHistory = Object.entries(game.rivalryHistory ?? {})
      .find(([_, h]) => h.currentStreak < -1)
    if (rivalHistory) {
      const rivalClub = game.clubs.find(c => c.id === rivalHistory[0])
      if (rivalClub) candidates.push(beatRival(supporter, rivalClub.name))
    }
    if (rand() < 0.3) candidates.push(cupRun(supporter))
  }
  
  if (modernist && (game.communityStanding ?? 50) < 45) {
    candidates.push(growFanbase(modernist))
  }

  // Plocka max 1 till (totalt 1-2 sekundära)
  if (objectives.length === 0 && candidates.length > 0) {
    objectives.push(candidates[Math.floor(rand() * candidates.length)])
  } else if (objectives.length === 1 && candidates.length > 0 && rand() < 0.5) {
    const pick = candidates[Math.floor(rand() * candidates.length)]
    if (pick.type !== objectives[0].type) objectives.push(pick) // undvik 2 av samma typ
  }

  return objectives
}
```

---

## Utvärderingsfunktioner

Varje `measureFn` mappar till en funktion som returnerar
`{ value: number; status: 'met' | 'failed' | 'at_risk' | 'active' }`:

```typescript
const MEASURE_FUNCTIONS: Record<string, (game: SaveGame) => { value: number; status: string }> = {
  'balanceBudget': (game) => {
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const value = club.finances
    return { value, status: value >= 0 ? 'met' : value > -100000 ? 'at_risk' : 'failed' }
  },
  'playHomegrown': (game) => {
    // Räkna snitt av egenfostrade i startelvan senaste 5 matcherna
    const recent = game.fixtures
      .filter(f => f.status === 'completed' && f.homeClubId === game.managedClubId)
      .sort((a, b) => b.matchday - a.matchday)
      .slice(0, 5)
    const homegrownIds = new Set(game.players.filter(p => p.isHomegrown && p.clubId === game.managedClubId).map(p => p.id))
    const avg = recent.reduce((sum, f) => {
      const starters = f.homeLineup?.startingPlayerIds ?? []
      return sum + starters.filter(id => homegrownIds.has(id)).length
    }, 0) / Math.max(1, recent.length)
    return { value: Math.round(avg * 10) / 10, status: avg >= 3 ? 'met' : avg >= 2 ? 'at_risk' : 'active' }
  },
  'growFanbase': (game) => {
    const fm = game.fanMood ?? 50
    return { value: fm, status: fm >= 70 ? 'met' : fm >= 55 ? 'active' : 'at_risk' }
  },
  'beatRival': (game) => {
    // Kolla om vi slagit rivalen minst en gång denna säsong
    // ... (kolla rivalryHistory)
    return { value: 0, status: 'active' }
  },
  'cupRun': (game) => {
    const status = game.cupBracket
    if (!status) return { value: 0, status: 'active' }
    // semifinal eller bättre = met
    return { value: 0, status: 'active' }
  },
}
```

---

## Styrelseledamöternas röster

Varje check-in och säsongsslut-reaktion ska vara i leamotens
personliga röst. Inte generisk — utan DERAS ord.

**Kassören (nöjd):**
"Jag vill tacka tränaren. Siffrorna är i balans. Det är inte
sexigt, men det är det som håller klubben vid liv."

**Kassören (missnöjd):**
"Minus 47 000 kronor. Vi har pratat om detta. Jag noterar
mitt missnöje och förväntar mig en plan."

**Traditionalisten (nöjd):**
"Fyra pojkar från orten i startelvan mot Edsbyn. Det är
det jag kallar att bygga en klubb. Så ska det se ut."

**Traditionalisten (missnöjd):**
"Inte en enda egenforstrad i startelvan på tre matcher.
Vi pratar om att bevara en kultur här. Det tar jag
personligt."

**Supportern (cuprun uppfyllt):**
"SEMIFINAL! Jag har väntat 15 år på det här! Resten
av säsongen är bonus."

**Supportern (rivalförlust):**
"Vi förlorade derbyt. Igen. Jag vet inte vad jag ska
säga till grabbarna på jobbet imorgon."

---

## Integration med befintligt system

### BoardMeetingScreen
Lägg till en ny sektion EFTER "Säsongens mål":

```
📋 SÄSONGENS MÅL
Etablera oss i mitten av tabellen
Håll er i övre halvan. Nedflyttning vore katastrofalt.

📌 STYRELSENS UPPDRAG
┌──────────────────────────────────────┐
│ Ulf Bergström (kassör)               │
│ "Ekonomin måste vara i balans vid    │
│ säsongsslut. Inga undanflykter."     │
│ Mål: Klubbkassan ≥ 0 kr             │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ Rolf Svensson (ledamot)              │
│ "Minst tre egenfostrade i snitt      │
│ ska starta. Vi bygger inifrån."      │
│ Mål: ≥ 3 homegrown i startelvan     │
└──────────────────────────────────────┘
```

### Dashboard
En liten "uppdragsstatus" kan visas i Bygdens Puls eller
som ett eget mini-card:

```
📌 Uppdrag: Ekonomi i balans ✅ | Egenfostrade ⚠️ (2.1 snitt)
```

### Inbox (omgång 7, 14, 22)
Befintlig BoardFeedback-logik utökas med kommentarer
från uppdragsägarna. Separata inbox-meddelanden.

### SeasonSummary
Utöka med sekundärresultat:

```
STYRELSEUPPFÖLJNING
✅ Ekonomi i balans — Kassören: "Tack. Klokt hanterat."
❌ Egenfostrade: 2.1 snitt (mål: 3)
   Rolf Svensson: "Besviken. Jag tar upp det på nästa möte."
   → Uppdraget ÅTERKOMMER nästa säsong med hårdare krav.
```

---

## Implementationsplan

Denna feature berör > 5 filer och kräver nya datastrukturer,
nya typer i enums, utökning av boardService, BoardMeetingScreen,
roundProcessor (check-in), seasonEndProcessor (verdict), och
SeasonSummary. **Spec för Code, inte direkt edit.**

```
Steg 1: Datastrukturer (BoardObjective, uppdatera SaveGame)
Steg 2: generateBoardObjectives() i boardService
Steg 3: Utvärderingsfunktioner (MEASURE_FUNCTIONS)
Steg 4: Check-in-logik i roundProcessor (omg 7/14/22)
Steg 5: Säsongsslut-utvärdering i seasonEndProcessor
Steg 6: BoardMeetingScreen UI (uppdrag-kort)
Steg 7: Carry-over-logik vid ny säsong
Steg 8: Dashboard mini-status (optional)
```

VARNING: Steg 1-3 kan implementeras utan att röra befintlig
logik. Steg 4-5 berör roundProcessor och seasonEndProcessor —
kräver försiktighet. Steg 6-8 är ren UI.
