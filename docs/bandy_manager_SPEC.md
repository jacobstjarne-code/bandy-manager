# Bandy Manager — Teknisk specifikation v0.1

**Bury Fen / Jacob Stjärne & Erik**
Mars 2026

---

## 1. Produktmål för v0.1

Version 0.1 ska vara en spelbar offline-MVP som webapp (mobilanpassad) där spelaren kan:

- välja en klubb ur en fiktiv liga med 12 lag
- spela en hel säsong (dubbelserie, 22 omgångar)
- hantera trupp och taktik
- simulera matcher med bandykänsla
- följa tabellen
- få nya ungdomar varje säsong
- se spelare utvecklas
- hantera enkel ekonomi, kontrakt och transfers
- spara och fortsätta

Det här är inte "hela spelet", utan första stabila kärnan som tål 3+ säsonger.

---

## 2. Plattform och teknik

- **TypeScript/React** webapp
- **PWA** (Progressive Web App) för offline-stöd och mobilinstallation
- **Vite** som build-verktyg
- **localStorage** för spardata i v0.1
- Ingen native app, ingen backend, ingen databas
- Erik kan jobba med grafik direkt i CSS/SVG

### Projektstruktur

```
src/
  domain/
    entities/          # TypeScript interfaces
    enums/             # String enums
    services/          # Ren domänlogik, inga beroenden
    types/             # Hjälptyper
  application/
    useCases/          # Orkestrering av services
  infrastructure/
    persistence/       # localStorage-adapter
  presentation/
    components/        # React-komponenter
    screens/           # Sidor/vyer
    hooks/             # Custom hooks
    navigation/        # Routing
  shared/
    utils/             # Datum, slump, beräkningar
    constants/         # Spelets konstanter
docs/
  SPEC.md              # Denna fil
  ROADMAP.md           # Feature roadmap
```

---

## 3. Produktprinciper

**Designregler:**
- Varje tryck ska ge framdrift
- Varje säsong ska skapa nya berättelser
- Ungdomar och truppbygge driver långsiktigheten
- Säsongen ska kännas komprimerad och farlig — varje förlust väger tungt

**Vad som gör spelet unikt (inte bara "bandy-FM"):**
- Väder och isförhållanden som kärnsystem (V0.2)
- Klubben som samhällsinstitution med ideell kultur (V0.3)
- Spelarnas dubbelliv — deltidsjobb, studier, livsbeslut (V0.3)
- Hörnor som centralt offensivt vapen (V0.1)
- Utvisningsdynamik med numerärt underläge (V0.1)
- Säsongens kompression — oktober till mars, ingen tid att hämta sig

Dessa principer ska genomsyra designen redan i V0.1 där det är möjligt, och aldrig glömmas bort i senare versioner.

---

## 4. Kärnflöde i appen

### Primär användarloop

1. Spelaren öppnar appen
2. Ser dashboard
3. Läser notiser
4. Justerar trupp/taktik vid behov
5. Trycker på Fortsätt
6. Match spelas eller en spelvecka processas
7. Resultat, förändringar och notiser visas
8. Spelaren fortsätter

### Sessionstänk

Spelet ska fungera för 1–2 minuter, 5–10 minuter, eller längre sessioner. Navigationen måste vara snabb och stora beslut ska ligga nära hemskärmen.

---

## 5. Skärm-för-skärm-flöde

### 5.1 Onboarding / Start

**Skärmar:** Splash → Huvudmeny → Nytt spel → Välj klubb → Manager-namn → Starta karriär

**Välj klubb** — varje klubb visas som kort med: klubbnamn, förväntad tabellplacering, ekonomi, ungdomskvalitet, svårighetsgrad.

### 5.2 Dashboard (spelets viktigaste vy)

**Visar:** nästa match, senaste resultat, tabellposition, senaste notiser, skador/avstängningar, snabbstatus för form och fitness, knapp: Fortsätt.

### 5.3 Trupp

**Visar:** hela spelarlistan med position, form, fitness, moral, ålder, potentialindikator.

**Funktioner:** sortera, filtrera på position, välja startelva + bänk, öppna spelarprofil. Skadade/avstängda markerade, varning för trötta spelare.

### 5.4 Spelarprofil

**Sektioner:**
- Översikt: namn, ålder, position, klubb, kontrakt, lön, marknadsvärde, CA/PA, form/fitness/moral
- Attribut: alla PlayerAttributes
- Kontrakt: löpande, förlängning

Utvecklingskurva och karriärhistorik väntar till V0.2+.

### 5.5 Taktik

**Visar:** vald startelva + alla taktiska val. Stora valbara segment/chips, inte små dropdowns.

### 5.6 Matchförberedelse

**Visar:** motståndare, hemma/borta, motståndarform, egna skador/avstängningar, rekommenderad startelva, vald taktik.

**Funktioner:** justera startelva, justera taktik, starta match.

### 5.7 Matchvy

**V0.1: Enbart snabbsim** — kort laddsekvens, slutresultat, direktlänk till matchrapport.

Live text väntar till V0.2.

### 5.8 Matchrapport

**Visar:** slutresultat, målskyttar, assist, utvisningar, hörnor, skott, bollinnehav (light), matchens spelare, spelarbetyg, tabellpåverkan.

### 5.9 Tabell

**Visar:** placering, spelade, vinster, oavgjorda, förluster, målskillnad, poäng.

Form senaste 5 och resultatomgång väntar till V0.2.

### 5.10 Transfers (FÖRENKLAD i V0.1)

Fria agenter mellan säsonger. Enkel "erbjud kontrakt"-mekanism. Kontraktsförlängning: lön + antal år.

Fullständig budgivning, transferfönster och låneavtal väntar till V0.2.

### 5.11 Klubb

**Visar:** ekonomi, förväntningar, ungdomskvalitet, faciliteter, säsongsmål, styrelsestatus (light).

### 5.12 Inkorg / Notiser

**Exempel:** matchresultat, skada, avstängning, transferbud, kontrakt på väg att gå ut, ungdomskull klar, spelare utvecklad, styrelsefeedback.

### 5.13 Bottom navigation

Fem flikar: Hem, Trupp, Match, Transfers, Klubb. Inkorg som ikon i appbar eller kort på Hem.

---

## 6. Domänmodell

Alla entiteter definieras som TypeScript interfaces. Alla ska vara serialiserbara till JSON.

### 6.1 Player

```typescript
interface Player {
  id: string
  firstName: string
  lastName: string
  age: number
  nationality: string
  clubId: string
  academyClubId?: string
  isHomegrown: boolean
  position: PlayerPosition
  archetype: PlayerArchetype

  salary: number
  contractUntilSeason: number
  marketValue: number

  morale: number       // 0-100
  form: number         // 0-100
  fitness: number      // 0-100
  sharpness: number    // 0-100

  currentAbility: number    // 0-100
  potentialAbility: number  // 0-100
  developmentRate: number   // 0-100

  injuryProneness: number   // 0-100
  discipline: number        // 0-100

  attributes: PlayerAttributes

  isInjured: boolean
  injuryDaysRemaining: number
  suspensionGamesRemaining: number

  seasonStats: PlayerSeasonStats
  careerStats: PlayerCareerStats
}
```

### 6.2 PlayerAttributes

```typescript
interface PlayerAttributes {
  skating: number         // 0-100
  acceleration: number    // 0-100
  stamina: number         // 0-100
  ballControl: number     // 0-100
  passing: number         // 0-100
  shooting: number        // 0-100
  dribbling: number       // 0-100
  vision: number          // 0-100
  decisions: number       // 0-100
  workRate: number        // 0-100
  positioning: number     // 0-100
  defending: number       // 0-100
  cornerSkill: number     // 0-100
  goalkeeping: number     // 0-100
}
```

### 6.3 PlayerSeasonStats / PlayerCareerStats

```typescript
interface PlayerSeasonStats {
  gamesPlayed: number
  goals: number
  assists: number
  cornerGoals: number
  penaltyGoals: number
  yellowCards: number
  redCards: number
  suspensions: number
  averageRating: number
  minutesPlayed: number
}

interface PlayerCareerStats {
  totalGames: number
  totalGoals: number
  totalAssists: number
  seasonsPlayed: number
}
```

### 6.4 Club

```typescript
interface Club {
  id: string
  name: string
  shortName: string
  region: string
  reputation: number     // 0-100
  finances: number
  wageBudget: number
  transferBudget: number

  youthQuality: number        // 0-100
  youthRecruitment: number    // 0-100
  youthDevelopment: number    // 0-100
  facilities: number          // 0-100

  boardExpectation: ClubExpectation
  fanExpectation: ClubExpectation
  preferredStyle: ClubStyle
  hasArtificialIce: boolean   // förberedd för V0.2 vädersystem

  activeTactic: Tactic
  squadPlayerIds: string[]
}
```

### 6.5 League

```typescript
interface League {
  id: string
  name: string
  season: number
  teamIds: string[]
  fixtureIds: string[]

  pointsForWin: number    // 3
  pointsForDraw: number   // 1
  pointsForLoss: number   // 0
}
```

### 6.6 Fixture

```typescript
interface Fixture {
  id: string
  leagueId: string
  season: number
  roundNumber: number

  homeClubId: string
  awayClubId: string

  status: FixtureStatus

  homeScore: number
  awayScore: number

  homeLineup?: TeamSelection
  awayLineup?: TeamSelection

  events: MatchEvent[]
  report?: MatchReport
}
```

### 6.7 TeamSelection

```typescript
interface TeamSelection {
  startingPlayerIds: string[]
  benchPlayerIds: string[]
  captainPlayerId?: string
  tactic: Tactic
}
```

### 6.8 Tactic

```typescript
interface Tactic {
  mentality: TacticMentality
  tempo: TacticTempo
  press: TacticPress
  passingRisk: TacticPassingRisk
  width: TacticWidth
  attackingFocus: TacticAttackingFocus
  cornerStrategy: CornerStrategy
  penaltyKillStyle: PenaltyKillStyle
}
```

### 6.9 MatchEvent

```typescript
interface MatchEvent {
  minute: number
  type: MatchEventType
  clubId: string
  playerId?: string
  secondaryPlayerId?: string
  description: string
}
```

### 6.10 MatchReport

```typescript
interface MatchReport {
  playerRatings: Record<string, number>
  shotsHome: number
  shotsAway: number
  cornersHome: number
  cornersAway: number
  penaltiesHome: number
  penaltiesAway: number
  possessionHome: number
  possessionAway: number
  playerOfTheMatchId?: string
}
```

### 6.11 StandingRow

```typescript
interface StandingRow {
  clubId: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  position: number
}
```

### 6.12 InboxItem

```typescript
interface InboxItem {
  id: string
  date: string        // ISO date
  type: InboxItemType
  title: string
  body: string
  relatedClubId?: string
  relatedPlayerId?: string
  relatedFixtureId?: string
  isRead: boolean
}
```

### 6.13 SaveGame

```typescript
interface SaveGame {
  id: string
  managerName: string
  managedClubId: string

  currentDate: string    // ISO date
  currentSeason: number

  clubs: Club[]
  players: Player[]
  league: League
  fixtures: Fixture[]
  standings: StandingRow[]
  inbox: InboxItem[]

  transferState: TransferState
  youthIntakeHistory: YouthIntakeRecord[]

  version: string
  lastSavedAt: string   // ISO datetime
}
```

### 6.14 TransferState

```typescript
interface TransferState {
  freeAgents: Player[]
  pendingOffers: TransferOffer[]
}

interface TransferOffer {
  id: string
  playerId: string
  fromClubId: string
  toClubId: string
  offerAmount: number
  offeredSalary: number
  contractYears: number
  status: 'pending' | 'accepted' | 'rejected'
}
```

### 6.15 YouthIntakeRecord

```typescript
interface YouthIntakeRecord {
  season: number
  clubId: string
  date: string
  playerIds: string[]
  topProspectId?: string
}
```

---

## 7. Enums

```typescript
enum PlayerPosition {
  Goalkeeper = 'goalkeeper',
  Defender = 'defender',
  Half = 'half',
  Midfielder = 'midfielder',
  Forward = 'forward'
}

enum PlayerArchetype {
  TwoWaySkater = 'twoWaySkater',
  Playmaker = 'playmaker',
  Finisher = 'finisher',
  Dribbler = 'dribbler',
  DefensiveWorker = 'defensiveWorker',
  CornerSpecialist = 'cornerSpecialist',
  ReflexGoalkeeper = 'reflexGoalkeeper',
  PositionalGoalkeeper = 'positionalGoalkeeper',
  RawTalent = 'rawTalent'
}

enum FixtureStatus {
  Scheduled = 'scheduled',
  Ready = 'ready',
  Completed = 'completed'
}

enum ClubExpectation {
  AvoidBottom = 'avoidBottom',
  MidTable = 'midTable',
  ChallengeTop = 'challengeTop',
  WinLeague = 'winLeague'
}

enum ClubStyle {
  Defensive = 'defensive',
  Balanced = 'balanced',
  Attacking = 'attacking',
  Physical = 'physical',
  Technical = 'technical'
}

enum MatchEventType {
  Goal = 'goal',
  Assist = 'assist',
  Shot = 'shot',
  Corner = 'corner',
  Penalty = 'penalty',
  YellowCard = 'yellowCard',
  RedCard = 'redCard',
  Injury = 'injury',
  Save = 'save',
  Substitution = 'substitution',
  Suspension = 'suspension',
  FullTime = 'fullTime'
}

enum InboxItemType {
  MatchResult = 'matchResult',
  Injury = 'injury',
  Suspension = 'suspension',
  TransferOffer = 'transferOffer',
  ContractExpiring = 'contractExpiring',
  YouthIntake = 'youthIntake',
  PlayerDevelopment = 'playerDevelopment',
  BoardFeedback = 'boardFeedback'
}

enum TacticMentality {
  Defensive = 'defensive',
  Balanced = 'balanced',
  Offensive = 'offensive'
}

enum TacticTempo {
  Low = 'low',
  Normal = 'normal',
  High = 'high'
}

enum TacticPress {
  Low = 'low',
  Medium = 'medium',
  High = 'high'
}

enum TacticPassingRisk {
  Safe = 'safe',
  Mixed = 'mixed',
  Direct = 'direct'
}

enum TacticWidth {
  Narrow = 'narrow',
  Normal = 'normal',
  Wide = 'wide'
}

enum TacticAttackingFocus {
  Central = 'central',
  Wings = 'wings',
  Mixed = 'mixed'
}

enum CornerStrategy {
  Safe = 'safe',
  Standard = 'standard',
  Aggressive = 'aggressive'
}

enum PenaltyKillStyle {
  Passive = 'passive',
  Active = 'active',
  Aggressive = 'aggressive'
}
```

---

## 8. Matchmotor — första algoritm

### 8.1 Mål

Matchmotorn ska ge trovärdiga resultat, påverkas tydligt av taktik och spelarkvalitet, ge bandykänsla, vara snabb nog för mobil, och skapa rimlig variation.

### 8.2 Stegbaserad modell

60 steg per match. Varje steg motsvarar ungefär en kort sekvens av spel.

Per steg:
1. Beräkna initiativ
2. Välj anfallande lag
3. Avgör sekvenstyp
4. Avgör chansnivå
5. Avgör utfall
6. Logga event

### 8.3 Lagscores före match

Beräknas från spelarattribut + taktik + form/fitness:

- offensiv styrka
- defensiv styrka
- hörnstyrka
- målvaktsstyrka
- tempoeffekt
- trötthetseffekt
- disciplinrisk

```
offenseScore = weightedAverage(passing, shooting, dribbling, vision, decisions, skating)
  + tacticModifiers + formModifier - fatiguePenalty
```

Liknande för defenseScore.

### 8.4 Initiativ per steg

Sannolikhet att ett lag driver sekvensen påverkas av: offensiv styrka, press, tempo, form, hemmafördel, utvisningar (numerärt underläge).

### 8.5 Sekvenstyper

- vanligt anfall
- snabb omställning
- hörnsekvens
- lågkvalitativ halvmöjlighet
- foul/utvisningsrisk
- bolltapp

Sannolikheter påverkas av: taktik, bredd, passningsrisk, motståndarens press, spelarnas decisions och vision.

### 8.6 Chansgenerering

Varje sekvens får ett chanceQuality-värde (0.0–1.0). Exempel: 0.1 = låg chans, 0.3 = halvchans, 0.6 = bra chans, 0.8 = hörna av hög kvalitet, 0.9 = frilägesliknande.

### 8.7 Avslut

Om sekvensen leder till avslut:
- shooting, vision, decisions, form vs defending, goalkeeping
- Utfall: mål, räddning, block, utanför, hörna

### 8.8 Hörnor

**Hörnor ska vara viktigare än i fotbollssim.** De är ett centralt offensivt vapen i bandy.

Påverkas av: cornerSkill, passing, decisions, motståndarens positioning, målvakt.

Hörnor ska skapa mål i en meningsfull andel av matcherna.

### 8.9 Utvisningar

**Utvisningar ska ha tydlig påverkan**, mer likt ishockey än fotboll.

När ett lag är reducerat:
- försvarsstyrka sjunker
- initiativ sjunker
- motståndarlagets chanskvalitet ökar

Utvisningstid förenklas till antal matchsteg i V0.1.

### 8.10 Målantal

Kalibreras för högre målsnitt än fotboll. Typiskt 4–8 mål per match totalt, med variation.

### 8.11 Output

- slutresultat
- eventlista
- spelarprestationer med betyg (1.0–10.0, normalsnitt ~6.5–7.0)
- skott, hörnor, bollinnehav (light)
- skador/avstängningar
- stat-uppdateringar

---

## 9. Taktikmodifiers

Varje taktiskt val ska påverka matchmotorn konkret:

| Val | Effekt |
|-----|--------|
| Mentalitet defensiv | bättre defense, sämre chance creation |
| Mentalitet offensiv | bättre chansskapande, större defensiv risk |
| Tempo lågt | bättre kontroll, lägre trötthet, färre sekvenser |
| Tempo högt | fler sekvenser, fler chanser, högre trötthet |
| Press hög | fler bollvinster, högre trötthet, fler utvisningar |
| Passing direkt | fler tapp, högre toppchanser |
| Passing säker | färre tapp, lägre spets |
| Bredd bred | bättre kantspel, fler hörnmöjligheter |
| Bredd smal | bättre centralt försvar/anfall |
| Hörn aggressiv | fler hörnmål, mer risk |
| Hörn säker | lägre risk, färre hörnmål |

---

## 10. Form, fitness, sharpness, moral

| System | Ökar av | Minskar av | Påverkar |
|--------|---------|------------|----------|
| Fitness | Vila mellan matcher | Matcher, hög belastning | Prestation, skaderisk |
| Sharpness | Speltid | Lång bänktid | Matchkvalitet |
| Form | Bra prestationer | Dåliga prestationer | Matchmotor |
| Moral | Speltid, vinster, kontrakt | Bänkning, förluster | Enkel effekt i V0.1 |

---

## 11. Skador och avstängningar

**Skador:** Slumpas efter match baserat på injuryProneness, fitness, matchbelastning, tempo, ålder. Resultat: 1 till flera matcher borta.

**Avstängningar:** Baserat på utvisningar. Enkelt system i V0.1.

---

## 12. Youth intake

**När:** En gång per säsong, fast datum.

**Antal:** 2–5 per klubb, modifierat av youthRecruitment och youthQuality.

**Positioner:** Viktade mot truppbehov.

**Ålder:** 15–17.

**Potentialfördelning:**
- 70% normal ungdom
- 25% lovande
- 5% topprospekt (varav 1–2% extremtalang)

**Arketyp:** Baserad på position. Scouttext genereras från potentialnivå och profil.

---

## 13. Spelarutveckling

Körs periodiskt (veckovis eller månadsvis).

**Påverkas av:** ålder, potential, developmentRate, facilities, youthDevelopment, speltid, form, sharpness.

**Regel:** Unga spelare utvecklas snabbare. Äldre planar ut eller tappar. Attribututveckling är profilberoende — inte alla attribut samtidigt.

---

## 14. Transfers och kontrakt (FÖRENKLAD i V0.1)

- Fria agenter mellan säsonger
- Enkel "erbjud kontrakt": lön + antal år → accept/nej
- AI-klubbar: täck trupphål, förläng nyckelspelare, släpp överskott
- Spelarintresse påverkas av: lön, kontraktslängd, klubbens reputation, sannolik speltid

Fullständig budgivning, transferfönster och låneavtal → V0.2.

---

## 15. Ekonomi (FÖRENKLAD i V0.1)

**Intäkter:** basinkomst, matchintäkter, placeringsbonus.
**Kostnader:** löner, transferkostnader.

Ekonomin ska begränsa och styra beslut, inte bli ett separat managementspel.

---

## 16. AI-managers (ENKEL i V0.1)

**Inför match:** välj bästa tillgängliga elva, undvik skadade/avstängda, enkel taktik baserat på lagstyrka.

**Under säsong:** reagera på form, rotera vid dålig fitness.

**Mellan säsonger:** släpp överskott, förläng nyckelspelare, värva på svaga positioner, hänsyn till ekonomi.

---

## 17. Säsongsflöde

**Under säsong:** matcher enligt schema, form/fitness/tabell/notiser uppdateras, skador och avstängningar hanteras.

**Säsongsslut:** sluttabell, styrelseutvärdering (light), kontraktsgenomgång, AI-truppjustering, youth intake, nytt schema, ny säsong.

---

## 18. Savegame

**Format:** JSON, localStorage.

**Autosave efter:** match klar, säsongsskifte, youth intake, transfersteg.

All speldata ska kunna laddas från ett enda SaveGame-objekt.

---

## 19. Valideringsregler

**Lineup:** tillräckligt antal spelare, inga skadade/avstängda som startar, minst en målvakt.

**Kontrakt:** klubben måste ha råd, kontraktstid inom gränser.

**Transfers:** budgetkontroll, truppgränser.

---

## 20. Prioriterad byggordning

### Milestone 1 — Domänmodell och infrastruktur (2–3 dagar)
- Entities (TypeScript interfaces)
- Enums
- SaveGame-struktur
- Världsgenerering (12 klubbar, ~264 spelare)
- Schemagenerator (dubbelserie)
- Standings service
- Persistence (localStorage)
- Integrationstester

### Milestone 2 — Matchmotor (1–2 veckor)
- Squad evaluator
- Taktikmodifiers
- Matchsimulator (60-stegsmodell)
- Matchrapport
- Form/fitness/sharpness-uppdatering
- Skador och avstängningar
- Kalibrering och balansering

### Milestone 3 — Youth och utveckling (2–3 dagar)
- Youth intake service
- Spelarutveckling
- Inbox service
- Notisgenererare

### Milestone 4 — UI-skärmar (1–2 veckor)
- Onboarding
- Dashboard
- Trupp + laguttagning
- Spelarprofil
- Taktik
- Matchförberedelse + snabbsim + rapport
- Tabell
- Transfers
- Klubb
- Inkorg
- Bottom navigation

### Milestone 5 — Transfers och kontrakt (3–5 dagar)
- Transferservice
- Kontraktsförlängning
- Transfers UI

### Milestone 6 — Säsongsskifte (3–5 dagar)
- End-of-season processing
- AI-trupphantering
- Youth intake trigger
- Ny säsong

---

## 21. Definition av "klar v0.1"

Version 0.1 är klar när:

- [ ] Nytt spel kan skapas
- [ ] Klubb kan väljas
- [ ] Säsongsschema genereras
- [ ] Matcher kan spelas klart
- [ ] Tabellen uppdateras
- [ ] Spelare får form, fitness och skador
- [ ] Trupp och taktik påverkar resultat
- [ ] Ungdomskull genereras varje säsong
- [ ] Spelare utvecklas
- [ ] Spelet kan sparas och laddas
- [ ] Spelaren kan spela minst 3 säsonger utan att världen kollapsar

---

## 22. Vad som väntar efter V0.1

Se docs/ROADMAP.md för fullständig feature roadmap. I korthet:

- **V0.2:** Väder/isförhållanden, live text-matchvy, träningssystem, scouting, dynamiska marknadsvärden, utökade transfers
- **V0.3:** Styrelsekaraktärer, spelarnas dubbelliv, media, rivaliteter, cup, flerårsnarrativer
- **V0.4:** Fler divisioner, flerårig historik, spelarpersonligheter, avancerad AI, multiplayer
- **V1.0:** Verkliga lag (licensberoende), damliga, internationellt, grafik, modding
