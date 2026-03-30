# Nya features — Komplett spec-paket

Fyra nya features plus matchkalibrering. Ordnade efter prioritet.

---

## 1. MATCHKALIBRERING MOT VERKLIG DATA

### Verklig data (Elitserien Herr 2025, Edsbyn 7-5 Hammarby)

| Stat | Hemma | Borta | Totalt per match |
|------|-------|-------|-----------------|
| Mål | 7 | 5 | ~12 (hög match) |
| Hörnor | 14 | 3 | ~17 |
| Skott på mål | 22 | 9 | ~31 |
| Utvisningar (10 min) | 1 | 1 | ~2 |
| Räddningar | 4 | 19 | ~23 |
| Frislag | 10 | 12 | ~22 |

OBS: Bara en match — behöver 10-15 matcher för bra medelvärden. Men riktningen stämmer.

### Nuvarande motorvärden (uppskattade)

| Stat | Nuvarande per match | Mål | Justering |
|------|-------------------|-----|-----------|
| Mål | ~6-8 | ~7-9 | OK, möjligen lite lågt |
| Hörnor | ~10-12 | ~15-18 | HÖJA corner sequence weight |
| Utvisningar | ~2-4 (efter fix) | ~2-3 | OK efter 0.55-fix |
| Skott | ~15-20 | ~25-30 | HÖJA — fler shots från attack sequences |
| Räddningar | ~8-12 | ~15-20 | Följer av fler skott |

### Fix i matchStepByStep.ts

**Hörnor:** I `buildSequenceWeights` — öka `wCorner` basvärde från 20 till 28:
```typescript
let wCorner = 28  // var 20
```

**Skott:** I `attack` sequence — sänk chanceQuality-tröskeln från 0.15 till 0.10 (fler skott registreras):
```typescript
if (chanceQuality > 0.10) {  // var 0.15
```

Gör samma ändring i BÅDA halvleksfunktionerna.

### Verifiera
Spela 5 matcher, notera stats i matchrapporten. Jämför med:
- Mål: 7-9 per match totalt
- Hörnor: 15-18 per match totalt
- Utvisningar: 2-3 per match
- Skott: 25-30 per match totalt

---

## 2. HALL / INOMHUSARENA

### Koncept
Investering som tar 2 säsonger att bygga. Eliminerar vädereffekter, ökar publikkapacitet, förbättrar träning. Dyrt — kräver god ekonomi och styrelsegodkännande.

### Datamodell

I `Club`-entiteten, lägg till:
```typescript
hasIndoorArena?: boolean
indoorArenaUnderConstruction?: boolean
indoorArenaCompleteSeason?: number
```

### Byggkostnad
Baserad på reputation:
- Rep < 50: 300 000 kr (liten hall)
- Rep 50-70: 500 000 kr (medelhall)
- Rep > 70: 800 000 kr (stor hall)

### Event: Styrelsemöte erbjuder hallbygge

I `postAdvanceEvents.ts` eller `boardService.ts`, generera event vid säsong 2+ om:
- Klubben har ≥ 200 000 kr i kassan
- Klubben har INTE hall
- Slumpmässig trigger ~20% per säsong

```
┌─────────────────────────────────────┐
│  🏗️ Hallprojekt                     │
│                                      │
│  Styrelsen vill diskutera en          │
│  inomhushall. Kostnaden beräknas      │
│  till 500 000 kr, fördelat över       │
│  2 säsonger.                          │
│                                      │
│  Fördelar:                           │
│  • Inget väder påverkar matcher       │
│  • Publikkapacitet +500              │
│  • Bättre träningsförhållanden       │
│                                      │
│  [Bygg hallen]  [Inte nu]  [Aldrig] │
└─────────────────────────────────────┘
```

### Effekter när hall är klar

I `matchStepByStep.ts`:
```typescript
// Om hemmalaget har indoor arena → ingen vädereffekt
if (homeClub.hasIndoorArena && isHome) {
  weatherGoalMod = 1.0  // neutralisera väder
}
```

I `worldGenerator.ts` / `seasonEndProcessor.ts`:
```typescript
if (club.hasIndoorArena) {
  club.arenaCapacity += 500
}
```

Träningsbonus: i `trainingProcessor.ts`:
```typescript
const arenaBonus = club.hasIndoorArena ? 1.1 : 1.0
// Multiplicera träningseffekt med arenaBonus
```

### Narrativ koppling
- Lokaltidningen: "Hallbygget i Forsbacka är igång — klart om två år"
- Boardmeeting: "Hallprojektet fortskrider enligt plan"
- Community pulse: +5 standing vid hallstart, +10 vid färdig

### Implementation
| Fil | Ändring |
|-----|---------|
| `Club.ts` entity | Lägg till hall-fält |
| `EkonomiTab.tsx` | Visa hallstatus + byggknapp |
| `postAdvanceEvents.ts` | Generera hall-event |
| `eventResolver.ts` | Hantera hall-val |
| `seasonEndProcessor.ts` | Slutför hallbygge om completeSeason nåtts |
| `matchStepByStep.ts` | Neutralisera väder om hall |
| `BoardMeetingScreen.tsx` | Visa hallstatus i styrelsemöte |

---

## 3. SÄSONGSARKIV — Historik och nostalgi

### Koncept
En vy som visar klubbens resa över tid. Tabellplacering per säsong, ekonomiutveckling, toppskyttar, transferhistorik.

### Datamodell

`seasonSummaries` finns redan i `SaveGame` — kontrollera att den sparar tillräcklig data:

```typescript
interface SeasonSummary {
  season: number
  finalPosition: number
  points: number
  goalsFor: number
  goalsAgainst: number
  topScorer: { name: string; goals: number }
  topAssist?: { name: string; assists: number }
  bestRating?: { name: string; rating: number }
  finances: number  // klubbkassa vid säsongsslut
  playoffResult?: string  // 'Kvartsfinal' | 'Semifinal' | 'Final' | 'SM-guld'
  transfers?: Array<{ name: string; direction: 'in' | 'out'; fee: number }>
  averageAttendance?: number
}
```

### HistoryScreen förbättringar

Nuvarande `HistoryScreen.tsx` finns redan — utöka med:

**1. Resa-graf (position per säsong)**
```
Plats
1  ─────────────────── ★
2                    /
3                   /
4        ──────────
6  ─────/
   S1   S2   S3   S4   S5
```

Enkel SVG-linjegraf. X-axel = säsong, Y-axel = tabellposition (inverterad — 1 högst upp).

**2. Nyckeltal per säsong**
Klickbara säsongskort:
```
┌─ Säsong 2027/2028 ─────────────┐
│  🥈 Finalist · Plats 2 · 38p    │
│  ⚽ Toppskytt: Andersson (14)   │
│  💰 Kassa: 450 tkr              │
│  📈 Snittbetyg: 6.8             │
└──────────────────────────────────┘
```

**3. Hall of Fame**
- Flest mål totalt (career stats)
- Flest säsonger i klubben
- Bästa snittbetyg (min 20 matcher)

### Implementation
| Fil | Ändring |
|-----|---------|
| `seasonEndProcessor.ts` | Spara topScorer, topAssist, bestRating, finances i summary |
| `HistoryScreen.tsx` | Lägg till resa-graf + förbättrade säsongskort |
| `SeasonSummary` entity | Utöka med nya fält |

---

## 4. LOKALTIDNINGENS NARRATIV

### Koncept
Lokaltidningen kommenterar TRENDER, inte bara enskilda matcher. Det binder ihop presskonferens, Bygdens puls och mediaheadlines till en sammanhängande berättelse.

### Trender som genererar artiklar

| Trend | Trigger | Rubrik-exempel |
|-------|---------|----------------|
| Segertåg | 3+ raka vinster | "Forsbacka på vinnarkurs — tredje raka segern" |
| Förlustsvit | 3+ raka förluster | "Mörka tider i Hälleforsnäs — supportrarna tappar hoppet" |
| Topplacering | Position ≤ 3 + omgång ≥ 10 | "Kan Söderfors utmana om guldet?" |
| Bottenplacering | Position ≥ 10 + omgång ≥ 10 | "Rögle kämpar — men räcker det?" |
| Ungdomsgenombrott | P19-uppkallad gör mål | "17-årige Svensson — framtiden för Slottsbron?" |
| Derby-revansch | Vinst efter derbyförlust | "Revansch! Gagnef slår tillbaka i Daladerbyt" |
| Transferbomb | Spelar med CA > 65 köpt/såld | "Storsigning: Larsson klar för Lesjöfors" |
| Hallbygge startat | Hall under construction | "Hallbygget i Forsbacka är igång" |
| Nytt publikrekord | Attendance > previous max | "Publikrekord på Forsbacka IP — 2300 såg derbyt" |

### Datamodell

Utöka `mediaService.ts` med en ny funktion:

```typescript
interface TrendArticle {
  id: string
  headline: string
  body: string
  newspaper: string
  roundNumber: number
  trend: string
}

export function generateTrendArticles(game: SaveGame, roundNumber: number): TrendArticle[]
```

### Visning

**Inbox:** Trendartiklar blir inbox-meddelanden med typ `InboxItemType.Media`

**Dashboard:** Under "Bygdens puls" eller som eget kort:
```
┌─ 📰 Lokaltidningen ──────────────┐
│  "Forsbacka på vinnarkurs —       │
│   tredje raka segern"             │
│                                   │
│  Stämningen i Forsbacka har inte  │
│  varit så här bra på länge...     │
└───────────────────────────────────┘
```

### Implementation

Ny funktion i `mediaService.ts`:

```typescript
export function generateTrendArticles(game: SaveGame, roundNumber: number, rand: () => number): InboxItem[] {
  const articles: InboxItem[] = []
  const managedClubId = game.managedClubId
  const club = game.clubs.find(c => c.id === managedClubId)
  if (!club) return articles

  // Beräkna trender
  const completedManaged = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup &&
      (f.homeClubId === managedClubId || f.awayClubId === managedClubId))
    .sort((a, b) => b.roundNumber - a.roundNumber)

  // Senaste resultat
  const lastResults = completedManaged.slice(0, 5).map(f => {
    const isHome = f.homeClubId === managedClubId
    const myScore = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const theirScore = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    return myScore > theirScore ? 'W' : myScore < theirScore ? 'L' : 'D'
  })

  const winStreak = lastResults.findIndex(r => r !== 'W')
  const lossStreak = lastResults.findIndex(r => r !== 'L')

  const standing = game.standings.find(s => s.clubId === managedClubId)
  const position = standing?.position ?? 6

  // Segertåg
  if (winStreak >= 3 && rand() < 0.6) {
    articles.push({
      id: `media_trend_winstreak_${roundNumber}`,
      date: game.currentDate,
      type: InboxItemType.Media,
      title: `${club.shortName} på vinnarkurs — ${winStreak} raka segrar`,
      body: `Det går som tåget för ${club.name}. Med ${winStreak} raka vinster i ryggen klättrar laget i tabellen och fansen börjar drömma stort.`,
      isRead: false,
    })
  }

  // Förlustsvit
  if (lossStreak >= 3 && rand() < 0.6) {
    articles.push({
      id: `media_trend_lossstreak_${roundNumber}`,
      date: game.currentDate,
      type: InboxItemType.Media,
      title: `Mörka tider i ${club.shortName} — ${lossStreak} raka förluster`,
      body: `Formkurvan pekar stadigt neråt. Supportrarna börjar ifrågasätta ledarskapet efter ännu en förlust.`,
      isRead: false,
    })
  }

  // Topplacering
  if (position <= 3 && roundNumber >= 10 && rand() < 0.3) {
    articles.push({
      id: `media_trend_topchallenge_${roundNumber}`,
      date: game.currentDate,
      type: InboxItemType.Media,
      title: `Kan ${club.shortName} utmana om guldet?`,
      body: `Med plats ${position} efter ${roundNumber} omgångar börjar det bli svårt att ignorera ${club.name}. Frågan är om truppen håller hela vägen.`,
      isRead: false,
    })
  }

  // Bottenplacering
  if (position >= 10 && roundNumber >= 10 && rand() < 0.3) {
    articles.push({
      id: `media_trend_relegation_${roundNumber}`,
      date: game.currentDate,
      type: InboxItemType.Media,
      title: `${club.shortName} kämpar — men räcker det?`,
      body: `Plats ${position} efter ${roundNumber} omgångar. Nedflyttningshotet hänger tungt över ${club.name}. Styrelsen är tyst — men hur länge?`,
      isRead: false,
    })
  }

  return articles.slice(0, 1) // Max 1 trendingbild per omgång
}
```

### Integration i roundProcessor.ts

Anropa efter matchsimulering, lägg till i inbox:
```typescript
const trendArticles = generateTrendArticles(game, roundNumber, rand)
newInboxItems.push(...trendArticles)
```

### Dashboard-visning

I `DashboardScreen.tsx`, visa senaste olästa media-artikel som eget kort (om det finns).

---

## 5. MATCHPACING OCH TEMPO

### Fråga till Erik
Behöver feedback: Går matchen för fort? Vill han se fler "andningshål" mellan händelser? Eller är tempot bra?

Om tempot behöver justeras — ändra i `MatchLiveScreen.tsx`:
- `STEP_INTERVAL_MS`: tid mellan varje steg (nuvarande ~1500ms?)
- Lägg till dynamisk pacing: mål/utvisningar → 3s paus, neutrala steg → 0.8s

---

## PRIORITETSORDNING

| # | Feature | Storlek | Effekt |
|---|---------|---------|--------|
| 1 | Matchkalibrering (hörnor/skott) | S | Mer realistiska matcher |
| 2 | Lokaltidningen narrativ | M | Känsla av "levande" värld |
| 3 | Säsongsarkiv/historik | M | "Min resa"-känsla, fler-säsongs-retention |
| 4 | Hall/inomhusarena | L | Ny investeringsdimension, väderstrategin |
| 5 | Matchpacing | S | Bättre matchupplevelse (behöver Erik-feedback) |

Ge Code 1-3 först. Hall är en V0.3-feature.
