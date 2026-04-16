# SPRINT 14 — DRÖMMAR

**Berör ID:** DREAM-002, DREAM-003, DREAM-010, DREAM-011, DREAM-013, DREAM-014, DREAM-016  
**Kostnad:** ~1-3 sessioner (valbara delmoment)  
**Typ:** Bonus-features  
**Prioritet:** Post-beta — ligg på hyllan tills spelet är stabilt

---

## SYFTE

Sju punkter som tillsammans förvandlar Bandy Manager från "bra managerspel" till något med virussignatur. Varje punkt är fristående. Gör dem i valfri ordning, en i taget, eller skippa helt om fokus ligger på bugghantering efter beta.

Rekommenderad ordning: **DREAM-010 → DREAM-015 (redan i Sprint 6) → DREAM-011 → DREAM-013 → DREAM-002 → DREAM-003 → DREAM-014 → DREAM-016**

---

## ID 1: DREAM-010 — Bandybrev till klubben

**Kostnad:** ~3h  
**Mockup:** `docs/mockups/sprint14_bandybrev.html`

### Koncept

Slumpmässigt (en gång per säsong): en pensionär skickar brev till klubben med minnen. Spelaren kan svara. Svaret sparas i klubbarkivet.

### Trigger

En gång per säsong, omgång 10-18, om inga andra kritiska events pågår.

### Data

```typescript
// Ny entity
export interface BandyLetter {
  id: string
  senderName: string
  senderAge: number
  senderOrigin: string     // "Järbo", "Högbo Bruk"
  season: number
  memoryYear: number       // vilket år minnet refererar
  text: string
  playerReply?: string
  savedInArchive: boolean
}

// i SaveGame
bandyLetters?: BandyLetter[]
```

### Brevgenerering

```typescript
const LETTER_TEMPLATES = [
  (club: Club, year: number) => `Jag heter ${randomName()} och jag är ${randAge()} år gammal. 
Jag såg min första ${club.name}-match med min far ${year} — jag var ${randAge() - (2026 - year)}. 
Det snöade så hårt att pappan lade en filt över mig under andra halvlek. Vi vann 4-3. 
Jag har följt klubben sedan dess. Jag tänkte bara att ni skulle veta.`,

  (club: Club, year: number) => `Jag jobbade på Forsbacka Bruk mellan 1972 och 1989. 
Jag satt alltid på östra sidan — platsen där vinden tog minst. 
Jag minns när Lundgren gjorde frisparksmålet från 40 meter i semin ${year}. 
Hela hallen blev tyst i fem sekunder innan det exploderade. 
Jag är 81 nu och har svårt att gå dit längre. Men jag lyssnar på radio. Hälsa grabbarna.`,
  
  (club: Club, year: number) => `Kära ${club.name}-folk. 
Jag är änka efter Göran som var målvakt i andralaget 1968-1974. 
Han dog förra året. Vi hittade hans gamla tröja när vi städade vinden. 
Jag undrar om ni skulle vilja ha den till klubbens minnesrum? 
Göran hade velat det. Han pratade om er till sista dagen.`,
]
```

### UI

Inbox-item av ny typ `letter`:

```tsx
<InboxItem type="letter" title={letter.senderName} body={letter.text}>
  <textarea 
    placeholder="Skriv ett svar (valfritt)..."
    onChange={e => setReplyText(e.target.value)}
  />
  <button onClick={() => saveReply(letter.id, replyText)}>
    Svara och spara i arkivet
  </button>
  <button onClick={() => archiveLetter(letter.id, false)}>
    Spara utan svar
  </button>
</InboxItem>
```

### Arkiv

Nytt screen/tab: `ClubArchive.tsx` — visar alla sparade brev med svar. Klubbens kollektiva minne.

---

## ID 2: DREAM-011 — Klubblegend per klubb

**Kostnad:** ~4h

### Koncept

Varje klubb får sin Erik Ström-motsvarighet: en persistent spelare som alltid är homegrown, aldrig lämnar klubben, ackumulerar legendstatus över tid.

### Data

```typescript
// Utvidga Player
legendStatus?: {
  isClubLegend: true
  totalSeasons: number       // ökar varje säsong hen stannar
  emblematicForClub: string  // clubId
  backstory: string          // genereras en gång, persisterar
}
```

### Generering vid worldGenerator

En per klubb, utöver Erik Ström-specialfallet:

```typescript
const LEGEND_BACKSTORIES = {
  brukspatron: (clubName: string, year: number) => 
    `Tredje generationen bandymän i familjen. Farfar spelade i ${clubName} på 40-talet, 
    fadern på 70-talet. Han själv har aldrig burit en annan tröja. 
    Han säger att han kommer att dö i den. Alla tror honom.`,
  
  skogsarbetare: (clubName: string, year: number) =>
    `Sågverksarbetare på dagen, bandyspelare på kvällen. Ortens band-of-brothers-figur. 
    Vägrar flytta trots tre erbjudanden från Elitserie-klubbar. Säger: "Jag behöver se skogen 
    från mitt kök för att spela rätt."`,
  
  tradition: (clubName: string, year: number) =>
    `Kom upp genom akademin 2019. Spelar kvar. Kaptensbindeln sitter. 
    Tränare har gått, managers har gått, han är kvar. Klackfavorit innan han hade 10 matcher.`,
}
```

### Persistens över spel

Lagra klubblegender i LocalStorage under nyckel `bandyManager_clubLegends_<clubId>`:

```typescript
export function getOrCreateClubLegend(clubId: string, season: number): ClubLegend {
  const stored = localStorage.getItem(`bandyManager_clubLegends_${clubId}`)
  if (stored) {
    const legend = JSON.parse(stored)
    legend.totalSeasons = Math.max(legend.totalSeasons, season - legend.startSeason + 1)
    return legend
  }
  
  const legend = generateClubLegend(clubId, season)
  localStorage.setItem(`bandyManager_clubLegends_${clubId}`, JSON.stringify(legend))
  return legend
}
```

### Effekt

- Legenden kan aldrig säljas
- Kontraktsförlängning är automatisk (1 år om kontrakt går ut)
- Klackens favoritspelare prefererar alltid legenden om inte andra prestationer dikterar annat
- Vid pensionering: stor säsongssammanfattningsmoment + läggs till `clubLegends[]` i SaveGame

---

## ID 3: DREAM-013 — Lagfotografiet

**Kostnad:** ~6h  
**Mockup:** `docs/mockups/sprint14_lagfoto.html`

### Koncept

Varje säsongsslut: ett genererat lagfoto sparas i karriärhistoriken. Spelarens ansikten, tränaren, ordföranden. Delbart.

### Implementation

Använd HTML Canvas eller SVG-generator.

```typescript
// src/presentation/utils/teamPhotoGenerator.ts
export function generateTeamPhoto(
  club: Club,
  players: Player[],
  season: number,
): string {  // returns data URL
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 800
  const ctx = canvas.getContext('2d')!
  
  // Bakgrund — klubbens hemmaarena-silhuett
  ctx.fillStyle = '#2C2820'
  ctx.fillRect(0, 0, 1200, 800)
  drawArenaBackground(ctx, club)
  
  // Överskrift
  ctx.fillStyle = '#E8E4DC'
  ctx.font = 'bold 32px Georgia'
  ctx.fillText(`${club.name} ${season}/${season + 1}`, 60, 60)
  ctx.font = '18px Georgia'
  ctx.fillText(club.arenaName, 60, 90)
  
  // Spelarrader (3 rader, 6 spelare per)
  const starters = players.slice(0, 18)
  for (let i = 0; i < starters.length; i++) {
    const row = Math.floor(i / 6)
    const col = i % 6
    const x = 60 + col * 190
    const y = 180 + row * 180
    drawPlayerPortrait(ctx, starters[i], x, y)
  }
  
  // Tränare + ordförande nederst
  drawStaff(ctx, club, season)
  
  return canvas.toDataURL('image/png')
}
```

### Persistering

```typescript
// SaveGame
teamPhotos?: Array<{
  season: number
  dataUrl: string    // base64 PNG — stor men OK
}>
```

Eller bättre — spara i IndexedDB under separat key:

```typescript
// src/infrastructure/teamPhotoStorage.ts
export async function saveTeamPhoto(saveId: string, season: number, dataUrl: string) {
  const db = await openDB('bandyManager', 1)
  await db.put('teamPhotos', { saveId, season, dataUrl }, `${saveId}_${season}`)
}
```

### Trigger

I `seasonEndProcessor.ts`:

```typescript
const photoDataUrl = generateTeamPhoto(club, squadPlayers, game.currentSeason)
await saveTeamPhoto(game.id, game.currentSeason, photoDataUrl)
```

### UI

Ny screen `TeamPhotosScreen.tsx` eller integrerad i `HistoryScreen.tsx`:

```tsx
<div className="photos-grid">
  {photos.map(p => (
    <div className="photo-card">
      <img src={p.dataUrl} alt={`Säsong ${p.season}`} />
      <p>{p.season}/{p.season + 1}</p>
      <button onClick={() => downloadPhoto(p)}>Ladda ner</button>
      <button onClick={() => sharePhoto(p)}>Dela</button>
    </div>
  ))}
</div>
```

### Delbart

`downloadPhoto` triggar `<a download>` med data-URL. `sharePhoto` använder Web Share API där tillgängligt.

---

## ID 4: DREAM-002 — Ekonomisk kris som narrativ bana

**Kostnad:** ~6h

### Trigger

När `club.finances < -200_000`:

### Event-kedja

**Event 1 (omedelbart):** Styrelseman ringer

```typescript
{
  id: `economic_crisis_start_${season}`,
  type: 'criticalEconomy',
  priority: 'critical',
  subject: 'Anders Lindgren (styrelsen) ringer klockan 22:17',
  body: `"Jag har sett siffrorna. Vi är -240k. Det här är inte ett sponsorproblem — det är ett strukturellt problem. 
  Jag vill träffa dig. I morgon. Inte på klubbkontoret. På Stadshotellet. Jag bjuder."`,
  choices: [
    { id: 'accept', label: 'Tacka ja till mötet' },
    { id: 'propose_club', label: 'Föreslå klubbkontoret istället' },
  ],
}
```

**Event 2 (3 omgångar senare):** Sponsor hotar lämna

```typescript
{
  subject: 'Holmström Bygg hotar att dra sig ur',
  body: `Huvudsponsorns VD har ringt ordföranden. 
  "Vi har varit med i 11 år. Men vi kan inte vara klubbens lösning på allt. 
  Antingen visar ni en plan inom två veckor, eller så står vår logga inte på tröjan nästa säsong."`,
  choices: [
    { id: 'present_plan', label: 'Presentera en ekonomisk plan', effect: { finances: -20_000, sponsor: 'stay' } },
    { id: 'accept_loss', label: 'Acceptera förlusten — stolthet kostar', effect: { sponsorIncome: -400_000 } },
  ],
}
```

**Event 3 (5 omgångar senare):** Valet

```typescript
{
  subject: 'Två vägar ur krisen',
  body: `Ekonomichefen har räknat. Det finns två vägar:
  
  **A. Sälj stjärnan ${bestPlayer.name}.** Budet ligger på 350k. Det löser skulden men laget faller.
  
  **B. Ansök om kommunlån.** 300k över 3 år. Räntan äter hälften av intäkterna. 
  Politiskt känsligt — vi hamnar i beroendeställning.`,
  choices: [
    { id: 'sell_star', label: 'Sälj stjärnan', effect: { finances: +350_000, removePlayer: bestPlayer.id } },
    { id: 'take_loan', label: 'Kommunlån', effect: { finances: +300_000, debtLoad: 100_000 } },
    { id: 'third_way', label: 'Mecenat — kan hen hjälpa?', effect: { mecenatHappiness: -30, finances: +200_000 } },
  ],
}
```

### Tracking

```typescript
// i SaveGame
economicCrisisState?: {
  startedSeason: number
  startedMatchday: number
  phase: 'awareness' | 'pressure' | 'decision' | 'resolved'
  eventsFired: string[]
  outcome?: 'sold_star' | 'loan' | 'mecenat' | 'natural_recovery'
}
```

Når finances > 0 → phase: 'resolved'.

---

## ID 5: DREAM-003 — Spridningseffekter

**Kostnad:** Stegvis, 4h-10h beroende på ambition  

### Koncept

Spelets system pratar redan med varandra. Denna punkt gör kopplingarna starkare:

### Exempel 1: Stjärna skadad → motståndarens odds ändras

När managedClubs stjärna skadas:
- AI-motståndare i nästa match får +3% offensiv
- Egen fanMood -5
- Kaffeum-citat: "Det känns tunnt utan Martinsson. Vi hoppas alla."

### Exempel 2: Derby-seger → biljettförsäljning

```typescript
// efter derby-win
if (classifyVictory(fixture) === 'big_derby_win') {
  // nästa hemmamatch: +20% publikrat
  game.nextHomeAttendanceBonus = 1.2
  // fanMood +8
  game.fanMood = Math.min(100, (game.fanMood ?? 50) + 8)
  // sponsor-intresse
  game.sponsors.forEach(s => s.networkMood = Math.min(100, (s.networkMood ?? 50) + 5))
}
```

### Exempel 3: Mecenat lämnar → ripple

```typescript
// när mecenat avslutar relation
game.communityStanding -= 8
// styrelse: -patience
game.boardPatience = Math.max(0, (game.boardPatience ?? 70) - 10)
// klackens mood
if (game.supporterGroup) {
  game.supporterGroup.mood = Math.max(0, game.supporterGroup.mood - 5)
}
// kafferum märker det
game.pendingCoffeeQuote = {
  speaker: 'Sekreteraren',
  text: 'Det kom ett mejl från Hedin i morse. Ingen mejlar Hedin. Det är inte så det fungerar här.',
}
```

### Implementation

Skapa centralt service:

```typescript
// src/domain/services/rippleEffectService.ts
export function applyRipples(game: SaveGame, event: RippleTrigger): SaveGame {
  switch (event.type) {
    case 'star_injured': return applyStarInjuryRipples(game, event.playerId)
    case 'big_derby_win': return applyBigDerbyWinRipples(game, event.fixtureId)
    case 'mecenat_left': return applyMecenatLeftRipples(game, event.mecenatId)
    case 'player_sold': return applyPlayerSoldRipples(game, event.playerId)
    // etc
  }
  return game
}
```

---

## ID 6: DREAM-014 — Tyst mode

**Kostnad:** ~3h

### Koncept

En setting: "Tyst mode". Spela omgång utan UI-feedback. Ingen score-hero, ingen kort-popupar, inga animationer. Bara en sportredaktions rapport.

### Implementation

```typescript
// i user-preferences (ny)
interface UserPrefs {
  silentMode: boolean
  // ...
}
```

### UI-suppression

När `silentMode === true`:

- Dashboard renderar bara en enda scrollbar lista
- Match: ingen Scoreboard, ingen Momentum-bar, ingen interaktion — direkt till text-summary
- Inga sound-effects
- GranskaScreen = text-rapport i sportjournalistisk ton

### Rapport-generering

```typescript
function generateMatchReport(fixture: Fixture, game: SaveGame): string {
  return `
${fixture.homeClubName} ${fixture.homeScore}–${fixture.awayScore} ${fixture.awayClubName}.

${openingParagraph(fixture)}.

${middleParagraph(fixture)}.

${closingParagraph(fixture)}.
`
}

function openingParagraph(f: Fixture): string {
  const scoreDiff = Math.abs((f.homeScore ?? 0) - (f.awayScore ?? 0))
  if (scoreDiff === 0) return `En jämn tillställning där båda lagen skapade lägen men ingen kunde pressa fram segern`
  if (scoreDiff >= 4) return `En ensidig affär från start`
  return `En kamp där det lag som var villigast att ta risker tog hem det`
}
```

---

## ID 7: DREAM-016 — Bandyhistorisk skoluppgift

**Kostnad:** ~5h

### Koncept

En gång per säsong (i december): en P17-spelare frågar om klubbens historia. Spelet genererar svaret baserat på spelets egna historik.

### Trigger

```typescript
if (game.currentDate.month === 12 && !game.schoolAssignmentAsked) {
  const youngestPlayer = game.players
    .filter(p => p.academyClubId === game.managedClubId && p.age <= 18)
    .sort((a, b) => a.age - b.age)[0]
  
  if (youngestPlayer) {
    game.pendingEvents.push({
      id: `school_assignment_${game.currentSeason}`,
      type: 'academyEvent',
      priority: 'low',
      subject: `${youngestPlayer.firstName} har en skoluppgift`,
      body: `Akademitränaren hälsar: "${youngestPlayer.firstName} har fått i uppgift att intervjua någon i klubben 
      om klubbens historia. Han frågade om han fick prata med dig. Han undrar särskilt om säsongen ${promptSeason}."`,
      choices: generateHistoryChoices(game),
    })
  }
}
```

### Historiska fakta

Hämta från `game.seasonSummaries[]`, `game.allTimeRecords`, `game.clubLegends[]`:

```typescript
function generateHistoryChoices(game: SaveGame): Choice[] {
  const summaries = game.seasonSummaries ?? []
  const notableSeason = summaries.find(s => s.finalPosition <= 3 || s.playoffResult)
  
  if (notableSeason) {
    return [{
      id: 'tell_notable',
      label: `Berätta om ${notableSeason.season} — ${summarizeSeason(notableSeason)}`,
      effect: { youthMorale: +3, clubLegendBuff: +1 },
    }]
  }
  
  return [{
    id: 'tell_now',
    label: 'Berätta om den här säsongen istället',
    effect: { youthMorale: +1 },
  }]
}
```

### Respons

Efter val: generera prosa-text som "publiceras" som skolinlämning i klubbens arkiv.

---

## KRITERIER FÖR ATT SKIPPA

Skippa denna sprint helt om:
- Playtest har avslöjat fler buggar än väntat
- Erik behöver mer tid för textgranskning eller assets
- Dina Returpack/XPENG-processer kräver fokus

Drömmarna går inte någonstans. De väntar.

## SLUTRAPPORT (per delmoment)

```
DREAM-010: ✅/⚠️/❌/skippad
DREAM-011: ✅/⚠️/❌/skippad
DREAM-013: ✅/⚠️/❌/skippad
DREAM-002: ✅/⚠️/❌/skippad
DREAM-003: ✅/⚠️/❌/skippad
DREAM-014: ✅/⚠️/❌/skippad
DREAM-016: ✅/⚠️/❌/skippad
```
