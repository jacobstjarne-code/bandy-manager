# FIXSPEC: Nästa nivå — Hörnor, Klacken, Veckans beslut, Progression

`npm run build && npm test` efter varje feature.

**MOCKUP-REFERENS:** `docs/mockups/next_features_mockup.html` — öppna i webbläsaren.

---

## SPRINT 1 — Interaktiva hörnor

### Bakgrund

I bandy kan man INTE göra mål direkt från hörna. Bollen MÅSTE toucha en annan spelare. Alla försvarare ställer sig på mållinjen inne i straffområdet. Alla anfallare står utanför straffområdet. Domaren blåser — anfallarna rusar in ("ruset"), hörnläggaren slår bollen. Kaos, timing, redirect. Det mest dramatiska ögonblicket i varje match.

Spelet har redan: `cornerScore` (squadEvaluator), `cornerSkill` (spelarattribut), `CornerStrategy` (Safe/Standard/Aggressive), `cornerModifier` (tacticModifiers), `isCornerGoal` (på MatchEvent). Men spelaren gör inget aktivt — allt simuleras.

### Feature 1.1 — Corner Interaction Service

**Fil:** Ny: `src/domain/services/cornerInteractionService.ts`

```typescript
import type { Player } from '../entities/Player'
import { PlayerPosition, PlayerArchetype } from '../enums'

export type CornerZone = 'near' | 'center' | 'far'
export type CornerDelivery = 'hard' | 'low' | 'short'

export interface CornerSetup {
  zone: CornerZone
  delivery: CornerDelivery
}

export interface CornerOutcome {
  type: 'goal' | 'saved' | 'wide' | 'cleared' | 'rebound'
  scorerId?: string
  scorerName?: string
  description: string
}

export function resolveCorner(
  setup: CornerSetup,
  cornerTaker: Player,
  rushers: Player[],
  defenders: Player[],
  goalkeeper: Player | undefined,
  opponentPenaltyKill: 'passive' | 'active' | 'aggressive',
  isHome: boolean,
  supporterBoost: number,
  rand: () => number,
): CornerOutcome {
  const deliveryQuality =
    (cornerTaker.attributes.cornerSkill * 0.5 +
     cornerTaker.attributes.passing * 0.3 +
     cornerTaker.attributes.decisions * 0.2) / 100

  const zoneWeights: Record<CornerZone, { attr: 'shooting' | 'positioning' | 'skating'; archBonus: PlayerArchetype[] }> = {
    near: { attr: 'positioning', archBonus: [PlayerArchetype.Finisher] },
    center: { attr: 'shooting', archBonus: [PlayerArchetype.Finisher, PlayerArchetype.TwoWaySkater] },
    far: { attr: 'skating', archBonus: [PlayerArchetype.Dribbler, PlayerArchetype.TwoWaySkater] },
  }

  const zw = zoneWeights[setup.zone]
  const bestRusher = rushers
    .map(p => ({
      player: p,
      score: (p.attributes[zw.attr] * 0.4 +
              p.attributes.shooting * 0.3 +
              p.attributes.positioning * 0.2 +
              (p.form / 100) * 10) +
             (zw.archBonus.includes(p.archetype) ? 8 : 0),
    }))
    .sort((a, b) => b.score - a.score)[0]

  if (!bestRusher) {
    return { type: 'cleared', description: 'Ingen nådde bollen. Försvaret klarerade.' }
  }

  const deliveryMod: Record<CornerDelivery, number> = { hard: 1.0, low: 0.9, short: 0.75 }

  const defenseStrength = defenders.length > 0
    ? defenders.reduce((s, p) => s + p.attributes.defending * 0.4 + p.attributes.positioning * 0.4 + p.attributes.skating * 0.2, 0) / defenders.length / 100
    : 0.3

  const penaltyKillMod: Record<string, Record<CornerZone, number>> = {
    passive:    { near: 0.85, center: 0.90, far: 0.95 },
    active:     { near: 0.90, center: 0.85, far: 0.90 },
    aggressive: { near: 0.95, center: 0.90, far: 0.80 },
  }
  const pkMod = penaltyKillMod[opponentPenaltyKill]?.[setup.zone] ?? 0.90

  const gkSave = goalkeeper
    ? (goalkeeper.attributes.goalkeeping * 0.6 + goalkeeper.attributes.positioning * 0.4) / 100
    : 0.3

  const attackScore = deliveryQuality * deliveryMod[setup.delivery] * (bestRusher.score / 100)
  const homeBonus = isHome ? 0.03 : 0
  const supporterMod = supporterBoost * 0.005

  const goalChance = Math.max(0.03, Math.min(0.35,
    attackScore * 0.5 - defenseStrength * 0.25 * pkMod - gkSave * 0.20
    + homeBonus + supporterMod + (rand() * 0.10 - 0.05)
  ))

  const roll = rand()

  if (roll < goalChance) {
    return {
      type: 'goal', scorerId: bestRusher.player.id,
      scorerName: `${bestRusher.player.firstName[0]}. ${bestRusher.player.lastName}`,
      description: setup.delivery === 'hard'
        ? `${bestRusher.player.lastName} mötte bollen i full fart — MÅLLL!`
        : setup.delivery === 'low'
        ? `Perfekt tajming! ${bestRusher.player.lastName} styrde in bollen vid ${setup.zone === 'near' ? 'nära stolpen' : setup.zone === 'far' ? 'bortre stolpen' : 'straffpunkten'}.`
        : `Kort hörna — motståndaren överraskad! ${bestRusher.player.lastName} avslutade.`,
    }
  }
  if (roll < goalChance + 0.15) return { type: 'saved', description: `${bestRusher.player.lastName} nådde bollen men målvakten räddade.` }
  if (roll < goalChance + 0.30) return { type: 'wide', description: setup.delivery === 'hard' ? 'Hårt skott — ingen nådde fram.' : 'Tajmingen stämde inte.' }
  if (roll < goalChance + 0.55) return { type: 'cleared', description: 'Försvaret klarerade direkt.' }
  return { type: 'rebound', description: 'Retur! Bollen studsade tillbaka — nytt spelmoment.' }
}

export function shouldBeInteractive(
  minute: number, homeScore: number, awayScore: number,
  isManaged: boolean, cornersThisMatch: number, interactiveSoFar: number,
): boolean {
  if (!isManaged) return false
  if (interactiveSoFar >= 4) return false
  if (cornersThisMatch < 2) return true
  if (Math.abs(homeScore - awayScore) <= 1) return true
  if (minute >= 70) return true
  return false
}
```

### Feature 1.2 — Corner Interaction UI

**Fil:** Ny: `src/presentation/components/match/CornerInteraction.tsx`

Se mockup ① i `next_features_mockup.html`. Inline i CommentaryFeed — INTE overlay.

**Timing:**
1. CommentaryFeed pausar
2. CornerInteraction renderas inline
3. Spelaren väljer zon + leverans
4. 0.5s delay → utfall visas
5. Om MÅL → Goal-event + `goalHit` ljud
6. "Fortsätt →" → feeden fortsätter

### Feature 1.3 — Integration med matchStepByStep

I generatorn vid `Corner` för managed club: yield `MatchStep` med `type: 'cornerInteraction'`. MatchLiveScreen visar CornerInteraction, väntar på val, anropar `resolveCornerStep()`.

---

## SPRINT 2 — Klacken (Supportergruppen)

### Feature 2.1 — Supporter Entity + Service

**Fil:** Lägg till i `src/domain/entities/SaveGame.ts`:

```typescript
export interface SupporterCharacter {
  name: string
  age: number
  role: 'leader' | 'veteran' | 'youth' | 'family'
  dayJob: string
  backstory: string              // en rad
  mood: number                   // individuellt, kan avvika från gruppens
  conflictWith?: string          // namn på den de bråkar med just nu
}

export interface SupporterGroup {
  name: string                    // "Norra Klacken", "Sargvännerna" etc
  size: number                    // 30-200 medlemmar
  mood: number                    // 0-100
  profile: 'loyal' | 'demanding' | 'family'
  founded: number                 // säsong grundad
  awayTravelBudget: number        // kr per bortamatch
  lastTifoRound?: number
  favoritePlayerId?: string       // klackens favoritspelare
  favoritePlayerRound?: number    // när favoriten "valdes"
  ritual: 'trumman' | 'hornramsan' | 'sistaMinuten' | 'segerDansen' | 'bortalaten'

  // De fyra karaktärerna
  leader: SupporterCharacter
  veteran: SupporterCharacter
  youth: SupporterCharacter
  family: SupporterCharacter
}
```

### Feature 2.2 — Supporter-karaktärer (generering)

**Fil:** Ny: `src/domain/services/supporterService.ts`

Fyra namngivna karaktärer genereras per klubb vid spelstart:

**Ledaren** — organiserar, medlar, driver
```typescript
const LEADER_TEMPLATES = [
  { name: 'Tommy Bergkvist', age: 48, dayJob: 'Elektriker', backstory: 'Har stått i klacken sedan 1994. Organiserar allt.' },
  { name: 'Annika Ström', age: 42, dayJob: 'Sjuksköterska', backstory: 'Tog över efter förra ledaren. Ingen protesterade.' },
  { name: 'Roger Dalgren', age: 55, dayJob: 'Lastbilschaufför', backstory: 'Kör bortabussen själv. Alltid.' },
  { name: 'Eva Sundberg', age: 39, dayJob: 'Lärare', backstory: 'Startade klacken från noll. Nu 80 medlemmar.' },
]
```

**Veteranen** — minns allt, jämför med förr
```typescript
const VETERAN_TEMPLATES = [
  { name: 'Sture Lindkvist', age: 71, dayJob: 'Pensionär', backstory: 'Var med på SM-finalen 1983. Sjunger samma ramsa.' },
  { name: 'Birgitta Holm', age: 68, dayJob: 'Pensionär', backstory: 'Har inte missat en hemmamatch på 30 år.' },
  { name: 'Gunnar Persson', age: 74, dayJob: 'Pensionär', backstory: 'Spelade själv i A-laget 1975-82. Sju mål.' },
  { name: 'Maj-Britt Eriksson', age: 66, dayJob: 'Pensionär', backstory: 'Hennes man spelade. Hon stod i klacken. Nu gör barnen det.' },
]
```

**Ungdomen** — vill ha mer, driver digitalt
```typescript
const YOUTH_TEMPLATES = [
  { name: 'Elin Nordin', age: 23, dayJob: 'Student', backstory: 'Driver Instagramkontot. Vill ha tifo, flaggor — allt.' },
  { name: 'Viktor Sjögren', age: 21, dayJob: 'Snickarlärling', backstory: 'Vill att klacken ska höras i hela stan.' },
  { name: 'Hanna Lund', age: 25, dayJob: 'Barista', backstory: 'Designar klackens tröjor. Säljer dom i kiosken.' },
  { name: 'Oskar Falk', age: 19, dayJob: 'Gymnasiet', backstory: 'Spelade själv i P17. Skadade knät. Nu sjunger han istället.' },
]
```

**Familjerösten** — trygghet, barnperspektiv
```typescript
const FAMILY_TEMPLATES = [
  { name: 'Mats Eriksson', age: 42, dayJob: 'Snickare', backstory: 'Tar med dottern varje hemmamatch. Vill att det ska vara tryggt.' },
  { name: 'Camilla Eng', age: 38, dayJob: 'Förskollärare', backstory: 'Tre barn, alla i bandyskolan. Vill se dem på A-laget en dag.' },
  { name: 'Johan Berg', age: 45, dayJob: 'Brevbärare', backstory: 'Hans son spelar i P19. Varje match är personlig.' },
  { name: 'Sara Gustafsson', age: 35, dayJob: 'Undersköterska', backstory: 'Flyttade hit för bandyn. Sonen spelar. Dottern sjunger.' },
]
```

### Feature 2.3 — Supporter-citat (coffeeRoom-integration)

**Fil:** `src/domain/services/coffeeRoomService.ts`

Utöka med supporter-exchanges som refererar till karaktärer BY NAME och till aktuella spelare. Lägg till i GENERIC_EXCHANGES och RESULT_EXCHANGES:

```typescript
// Supporter-specifika exchanges (väljs om game.supporterGroup finns)
const SUPPORTER_EXCHANGES: Array<(g: SupporterGroup, favName: string | null) => [string, string]> = [
  (g) => [g.leader.name, `"Jag sa till grabbarna: vi fyller bortaläktaren i Edsbyn. ${g.veteran.name} sa att han var för gammal. Han var först på bussen."`],
  (g) => [g.youth.name, `"400 följare på Insta nu. Nästa steg: tifo till derbyt. ${g.family.name} tycker det är onödigt. Han fattar inte."`],
  (g, fav) => [g.veteran.name, fav ? `"${fav} påminner mig om dom gamla. Samma fötter. Samma känsla för isen."` : `"Det var bättre förr. Men jag kommer ändå."`],
  (g) => [g.family.name, `"Tog med Emma igår. Hon sa: pappa, varför skriker dom så mycket? Jag sa: för att vi älskar laget."`],
  (g) => [g.leader.name, `"${g.veteran.name} och ${g.youth.name} bråkar igen. Om musiken. Alltid musiken."`],
  (g) => [g.youth.name, `"Vi kan inte sjunga samma ramsa i 30 år. ${g.veteran.name} håller inte med."`],
  (g) => [g.veteran.name, `"Jag har sett mycket. Men jag har aldrig sett klacken så stor som idag."`],
]

// Resultatbaserade supporter-citat
const SUPPORTER_RESULT_EXCHANGES: Record<'win' | 'loss' | 'draw', Array<(g: SupporterGroup) => [string, string]>> = {
  win: [
    (g) => [g.leader.name, `"Klacken bar laget idag. ${g.veteran.name} sjöng hela vägen hem."`],
    (g) => [g.youth.name, `"STORYN på Insta fick 200 views. Seger säljer."`],
    (g) => [g.family.name, `"Emma sa: pappa, vi vann! Och så kramade hon mig. Det räcker."`],
  ],
  loss: [
    (g) => [g.veteran.name, `"Tyst på bussen hem. ${g.leader.name} sa ingenting. Det var det värsta."`],
    (g) => [g.youth.name, `"Ingen ville ha foto efteråt. Inte ens jag."`],
    (g) => [g.family.name, `"Emma frågade varför vi förlorade. Jag visste inte vad jag skulle säga."`],
  ],
  draw: [
    (g) => [g.leader.name, `"En poäng. ${g.veteran.name} sa: det har jag sett förr. Ja, ${g.veteran.name}. Det har du."`],
  ],
}
```

`getCoffeeRoomQuote()` kollar om `game.supporterGroup` finns → om ja, 50% chans att välja supporter-exchange istället för generisk.

### Feature 2.4 — Ritual-texter i match

**Fil:** `src/domain/data/supporterRituals.ts` (ny)

```typescript
export const RITUAL_TEXTS: Record<string, Record<string, string[]>> = {
  trumman: {
    matchStart: ['Trumman börjar. Samma takt som alltid. Bom-bom-bom-bom.'],
    corner: ['Trumman ökar tempot. SKJUT! SKJUT! SKJUT!'],
    goal: ['Trumman EXPLODERAR. Hela kortsidan hoppar.'],
    lastMinutes: ['Trumman slår långsammare nu. Tung. Bestämd. Som ett hjärta.'],
    win: ['Dunk-dunk-dunk i sargen. Klacken stannar kvar tills lamporna släcks.'],
    loss: ['Trumman tystnar. Ingen behöver säga något.'],
  },
  hornramsan: {
    matchStart: ['Klacken har fyllt kortsidan. Flaggorna vajar.'],
    corner: ['HELA klacken skanderar: HÖR-NA! HÖR-NA! HÖR-NA!'],
    goal: ['Ramsan övergår i skrik. Ren glädje.'],
    lastMinutes: ['Ramsan blir mer desperat. Snabbare. Högre.'],
    win: ['Segerramsan. Den gamla. Alla kan den.'],
    loss: ['Ingen ramsa. Bara tystnad och stampande fötter.'],
  },
  sistaMinuten: {
    matchStart: ['Klacken sparar krutet. De vet när det behövs.'],
    corner: ['Klacken sjunger — men sparar det bästa.'],
    goal: ['NU vaknar dom. Klacken EXPLODERAR.'],
    lastMinutes: ['Hela kortsidan sjunger. Orden spelar ingen roll — det är känslan.'],
    win: ['Sången ekar över isen. De slutar inte. Inte än.'],
    loss: ['De sjöng ändå. I sista minuten. Som alltid.'],
  },
  segerDansen: {
    matchStart: ['Klacken klappar takten. Lugnt. Förväntar sig seger.'],
    corner: ['Tempot ökar. Klappen blir hårdare.'],
    goal: ['Armarna i luften. Hela raden hoppar i takt.'],
    lastMinutes: ['Klappen blir nervös. Snabbare. Ojämn.'],
    win: ['Segrardansen. Alla vet stegen. Hela raden svänger.'],
    loss: ['Inga danssteg idag. Bara tunga fötter mot betong.'],
  },
  bortalaten: {
    matchStart: ['Bortaläktaren: tyst. Men de är där. Alla 38.'],
    corner: ['38 röster. Det låter som 380.'],
    goal: ['BORTAMÅL! De små bänkarna skakar.'],
    lastMinutes: ['De sjunger lagets namn. Om och om igen.'],
    win: ['De sjunger hela vägen till bussen. Föraren ler.'],
    loss: ['Tyst buss hem. Fyra timmar. Men de kommer tillbaka.'],
  },
}
```

Dessa texter infogats i CommentaryFeed vid rätt matchmoment (matchStart, corner, goal, lastMinutes, win/loss) — väljs baserat på `group.ritual`.

### Feature 2.5 — Klackens favoritspelare

Automatiskt val baserat på:
- Akademi-uppkallad → automatisk favorit i 5 omgångar
- Flest mål senaste 5 matcherna → utmanar
- Veteran med 50+ matcher → stabil
- Hörnspecialist som gör hörn-mål → extra kärlek

**Effekter:**
- Mål av favoriten → extra commentary: "{Namn} pekar mot kortsidan. Klacken EXPLODERAR."
- Favoriten bänkas → inbox från ledaren: "Varför sitter {namn} på bänken?"
- Favoriten säljs → supporter mood −20, veteran i kafferummet: "Jag har sett mycket. Men det här var svek."
- Favoriten gör hörn-mål hemma → ritual-text + "Klacken kastar sig framåt. {veteran.name} gråter."

### Feature 2.6 — Bortaresan som berättelse

**Veckans beslut (kopplat till Sprint 3):**
```
"Tommy har hyrt en buss till Edsbyn. 38 platser. Sture har redan bokat sin. 
Elin vill livestreama resan. Ska klubben bidra med 3 000 kr?"
→ Bidra: −3 tkr, +bortasupport (hemmabonus borta), ledare mood +10
→ Låt dem ordna: +0, ledare mood −5
```

**Under bortamatch (CommentaryFeed):**
"Bortahörnan: 38 röster. De sjunger som om de vore hemma."

**Efter bortamatch (Kafferummet):**
- Vinst: `Tommy: "Bästa bortaresan sedan Vetlanda 2019. Sture somnade på bussen hem. Med ett leende."`
- Förlust: `Elin: "Fyra timmar i buss för det här. Men vi kommer tillbaka."`

### Feature 2.7 — Supporter-events (utökat med karaktärer)

**Tifot:**
Elin vill göra tifo till derbyt. Mats tycker det kostar för mycket. Tommy medlar.
- "Ge Elin fria händer" → −2 tkr, hemmabonus, Elin mood ++
- "Kompromiss: enklare tifo" → −500 kr, liten bonus, alla nöjda
- "Neka" → Elin mood −−, Sture: "Låt ungdomen försöka."

**Konflikten:**
Sture och Elin bråkar om huruvida klacken ska stå eller sitta.
Tommy ringer: "Sture vägrar stå bredvid Elin. Hon spelar för hög musik."
- "Prata med Sture" → Sture lugnar sig, Elin irriterad
- "Prata med Elin" → Elin sänker volymen, Sture nöjd
- "Låt dem lösa det" → 50% att det löser sig, 50% att mood sjunker

**Öppet brev (demanding-profil, 3+ raka förluster):**
Tommy skickar öppet brev via tidningen: "Klacken kräver svar."
- "Bjud in klacken till möte" → Tommy mood ++, Sture: "Det var längesen en tränare lyssnade."
- "Svara i media" → 50/50 beroende på journalist-relation
- "Ignorera" → supporter mood −10, tidningen skriver om konflikten

**Spelaren lämnar (favoritspelare säljs):**
Tommy: "Jag respekterar beslutet. Men det här gör ont."
Sture: "Sista gången jag öppnar plånboken för den här klubben."
Mats: "Emma frågade varför {namn} inte spelade. Jag visste inte vad jag skulle säga."
Elin: "Jag tog bort alla inlägg med {namn}. Det var 47 stycken."

### Feature 2.8 — Supporter Match Integration

**matchEngine/matchStepByStep:**
- `homeAdvantage` ökas med `getSupporterHomeBonus()`
- Supporter-text från `RITUAL_TEXTS` vid matchstart, hörna, mål, sista minuten, matchslut

**matchMoodService.ts:**
- `getSupporterAtmosphere()` integreras i stämningskortet (Feature 1 från FIXSPEC_SOUL)

**roundProcessor.ts:**
- `updateSupporterMood()` efter varje match → uppdaterar grupp + individuella karaktärer
- Favorit-check: uppdatera `favoritePlayerId` baserat på senaste 5 matchernas prestationer

### Feature 2.9 — Supporter Dashboard Section

Visas i KlubbTab (Orten) som SectionCard. Se mockup ③ i `next_features_mockup.html`.

Visar: gruppnamn, storlek, humör-bar, profil-pill, supporterledarens citat, senaste aktiviteter (tifo, bortaresa).

Under huvudkortet: de fyra karaktärerna i komprimerad form:
```
Tommy (48) Elektriker — Ledare    😊 72
Sture (71) Pensionär — Veteranen  😐 58
Elin (23) Student — Ungdomen      😊 75
Mats (42) Snickare — Familjen     😊 68
```

---

## SPRINT 3 — Veckans beslut

### Feature 3.1 — Weekly Decision Service

**Fil:** Ny: `src/domain/services/weeklyDecisionService.ts`

Genererar EN fråga per omgång. Inte ett fullständigt GameEvent — en enkel struct:

```typescript
export interface WeeklyDecision {
  id: string
  question: string
  optionA: { label: string; effect: string }
  optionB: { label: string; effect: string }
  category: 'player' | 'supporter' | 'training' | 'community'
}
```

Pool av ~30 beslut, filtrerade efter spelläge. Besluten refererar till supporter-karaktärer BY NAME:

**Spelarbeslut:**
- "Kronberg vill öva hörnskott efter träningen." → Ja: +3 cornerSkill, +10% skaderisk / Nej: ingen effekt
- "{favorit} är populär hos klacken. {leader.name} vill att hen startar." → Starta: +supporter mood / Bänka: −mood
- "Eriksson vill åka hem till familjen över helgen." → Ja: −1 fitness, +5 morale / Nej: −3 morale

**Supporterbeslut:**
- "{leader.name} har hyrt en buss till {motståndare}. {veteran.name} har redan bokat sin. Bidra med 3 000 kr?" → Bidra: −3 tkr, +bortasupport / Neka: −leader mood
- "{youth.name} vill arrangera tifo till annandagen." → Bidra 2 tkr: +hemmabonus / Neka: −supporter mood
- "{leader.name}: {veteran.name} och {youth.name} bråkar om musiken." → Medla / Låt dem lösa det

**Träningsbeslut:**
- "Extra hörnträning eller matchförberedelse?" → Hörn: +cornerSkill / Match: +positioning
- "Scouten vill studera motståndarens hörnförsvar." → Ja: −1 scout, +insikt / Nej: spara scouten

**Ortsbeslut:**
- "Kommunen erbjuder ismaskin." → Ja: +isQuality, +politikerrelation / Nej: inget
- "Tidningen vill göra reportage om klacken. {leader.name} säger ja." → Tillåt: +3 CS / Neka: −journalist rel

### Feature 3.2 — Weekly Decision UI

Se mockup ④. card-sharp OVANFÖR CTA. Två knappar sida vid sida. Försvinner vid val.

### Feature 3.3 — Integration

I `roundProcessor.ts`: generera `WeeklyDecision` → spara i `game.pendingWeeklyDecision` → dashboard visar → nollställ vid val.

---

## SPRINT 4 — Visuell progression

### Feature 4.1 — Trofé-rad

Se mockup ⑤. Inline emoji-ikoner. Tom säsong 1. 🏆 SM-guld, 🥈 silver, 🏅 cup, ⭐ topp 3.

### Feature 4.2 — AI-tränarpersona

Se mockup ⑥. 12 unika tränare genererade vid newGame. Visas under motståndarnamn i NextMatchCard.

```typescript
export interface AICoach {
  name: string
  style: 'defensive' | 'offensive' | 'pragmatic' | 'corner-focused'
  quote: string
}
```

### Feature 4.3 — Snittåskådare

`averageAttendance` + `previousAverageAttendance` i SaveGame. Visas i ekonomi-cell: "👥 Snitt: 1 240 (+180)".

---

---

## PARKERAT (lägre prio, framtida sprintar)

Fullständiga specs finns i **`docs/FIXSPEC_PARKERAT.md`** — filer, typer,
texter, triggers och kopplingar till supporter-karaktärer.

| Feature | Vad som finns i FIXSPEC_PARKERAT.md |
|---|---|
| Presskonferens som visuell scen | `PressConferenceScene.tsx`, `pressConferenceService.ts`, 9 frågetyper, 5 svarsalternativ med effekter, journalist-persona med stil, frekvensstyrning |
| Transferdödline-känsla | Header-indikator, `transferDeadlineService.ts` med `DeadlineBid`, AI-panikbud 20–40% över marknad, rabattvärvningar, klack-reaktion vid favorit-försäljning |
| Klubbens rykte utanför orten | `reputationMilestoneService.ts` med 6 triggers (academy/media/neighbor/scout/warning), fullständiga texter, koppling till supporter-karaktärer i kafferummet |

---

## Verifiering

```bash
npm run build && npm test

grep -rn 'cornerInteractionService\|supporterService\|weeklyDecisionService\|aiCoachService' src/ --include="*.ts" --include="*.tsx" | grep import

grep -rn "#[0-9a-fA-F]\{6\}" src/presentation/ --include="*.tsx" | grep -v node_modules | grep -v ".svg" | grep -v TownSilhouette
```
