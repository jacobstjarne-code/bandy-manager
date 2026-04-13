# FIXSPEC: Nya features — Arenanamn, Klacknamn, Straffar, Kapten

`npm run build && npm test` efter varje feature.

---

## FEATURE 1: Arenanamn och klacknamn — handgjorda per klubb

Nuvarande: `arenaName` auto-genereras som "[Klubbnamn]s IP". Klacknamn seedas från en pool med bl.a. "Bandykorpen" (olyckligt — Korpen är en spelserie/motionsserie inom bandy).

**Krav:** Varje klubb ska ha ett UNIKT arenanamn med karaktär, inspirerat av orten/regionen. Inte "[Stad]s IP" — tänk "Studenternas" (Uppsala), "Söderstadion" (Stockholm), "Zinkensdamm". Arenanamnen ska ALDRIG ändras mellan säsonger.

Samma sak för klacknamn — varje klubb ska ha en unik, passande supportergrupp.

### Nya arenanamn och klacknamn

Uppdatera `CLUB_TEMPLATES` i `worldGenerator.ts` med `arenaName` per klubb.
Uppdatera `generateSupporterGroup()` i `supporterService.ts` att använda klubb-specifikt namn istället för att seeda från GROUP_NAMES-poolen.

```typescript
// worldGenerator.ts — lägg till arenaName + supporterGroupName i varje template

// Forsbacka (Gävleborg) — toppklubb, tradition, artificiell is
arenaName: 'Stålvallen'
supporterGroupName: 'Slaggklacken'

// Söderfors (Uppland) — mellanklubb, balanserad
arenaName: 'Bruksvallen'
supporterGroupName: 'Hammarsmederna'

// Västanfors (Västmanland) — toppklubb, offensiv
arenaName: 'Gruvvallen'
supporterGroupName: 'Bergskurvan'

// Karlsborg (Norrbotten) — övre mitt, balanserad
arenaName: 'Fästningsvallen'
supporterGroupName: 'Norrskensklacken'

// Målilla (Småland) — mellanklubb, teknisk
arenaName: 'Glasvallen'
supporterGroupName: 'Hyttklacken'

// Gagnef (Dalarna) — mellanklubb, fysisk
arenaName: 'Folkparken'
supporterGroupName: 'Dalkurvan'

// Hälleforsnäs (Södermanland) — mellanklubb
arenaName: 'Smedjevallen'
supporterGroupName: 'Härdarna'

// Lesjöfors (Värmland) — mellanklubb, defensiv
arenaName: 'Torpvallen'
supporterGroupName: 'Skogsklacken'

// Rögle (Skåne) — underklubb, defensiv
arenaName: 'Bokskogen IP'
supporterGroupName: 'Sydkurvan'

// Slottsbron (Värmland) — underklubb
arenaName: 'Brovallen'
supporterGroupName: 'Bropelarna'

// Skutskär (Uppland) — underklubb, fysisk
arenaName: 'Massavallen'
supporterGroupName: 'Fabriksklacken'

// Heros (Dalarna) — underklubb, defensiv
arenaName: 'Kyrkbacken'
supporterGroupName: 'Hjältarna'
```

### Visa arenanamn i UI

Lägg till `club.arenaName` i:

1. **NextMatchCard** — under "Omgång X", visa arenanamn:
   ```
   Stålvallen (Forsbacka)    // hemma
   Torpvallen (Lesjöfors)    // borta
   ```

2. **Scoreboard** (MatchLiveScreen) — i header eller under lagnamnen:
   ```
   STÅLVALLEN · -3° · Bra is
   ```

3. **GranskaScreen** (matchsammanfattning) — "Spelades på Stålvallen"

4. **SM-Final**: Alltid "Studenternas IP (Uppsala)" — redan hårdkodat i PlayoffIntroScreen.

### Visa klacknamn i UI

Klackkortet på dashboarden visar redan `supporterGroup.name`. Med denna ändring kommer det visa det klubb-specifika namnet istället för ett slumpat från poolen.

**OBS:** `supporterGroup.name` sätts vid game-start i `generateSupporterGroup()`. Ändra den funktionen att ta klubb-specifikt namn:

```typescript
export function generateSupporterGroup(
  clubId: string,
  season: number,
  players: Player[],
  seed: number,
  overrideName?: string,  // ny parameter
): SupporterGroup {
  const h = hashStr(clubId) + seed
  return {
    name: overrideName ?? pick(GROUP_NAMES, h),
    // ... resten
  }
}
```

Skicka in `template.supporterGroupName` från `createNewGame`.

---

## FEATURE 2: Straffar under match (interaktiv)

### Bakgrund

`MatchEventType.Penalty` finns i enum men genereras aldrig. I bandy döms straffslag vid regelbrott i straffområdet. Det är relativt vanligt (1-3 per match i verkligheten) och dramatiskt.

### Trigger

I `matchStepByStep.ts`, i foul-sekvensen:

```typescript
// Nuvarande: alla fouls → utvisning
// Nytt: ~20% av fouls i anfallszon → straff istället för utvisning
if (seqType === 'foul') {
  const inAttackZone = rand() < 0.35 // anfallszon
  const isPenalty = inAttackZone && rand() < 0.20

  if (isPenalty && isManagedAttacking) {
    // Yield interaktiv straff
    yield { type: 'penaltyInteraction', data: buildPenaltyInteractionData(...) }
    // Vänta på spelarens val
  } else if (isPenalty) {
    // AI-straff: räkna ut automatiskt
  } else {
    // Vanlig utvisning (som nu)
  }
}
```

Frekvens: ~1-2 per match totalt, varav ~0.5-1 för managed club.

### Interaktiv UI: PenaltyInteraction.tsx

Enklare än hörnor. Spelaren väljer:

**Placering** (var ska bollen gå):
- Vänster
- Mitt  
- Höger

**Höjd** (valfritt, avancerat):
- Lågt (is-nivå)
- Högt (övre halvan)

Målvakten "gissar" baserat på AI-stil + slump:
- Defensiv AI → gissar rätt oftare (40%)
- Offensiv AI → gissar rätt mer sällan (25%)

**Utfall:**
- Mål (~70% om olika sida, ~20% om samma)
- Räddning
- Utsida/stolpe (~10%)

### penaltyInteractionService.ts

```typescript
export interface PenaltyInteractionData {
  minute: number
  shooterName: string
  shooterSkill: number  // shooting attribute
  keeperName: string
  keeperSkill: number   // goalkeeping attribute
  isManaged: boolean
}

export type PenaltyDirection = 'left' | 'center' | 'right'
export type PenaltyHeight = 'low' | 'high'

export interface PenaltyOutcome {
  type: 'goal' | 'save' | 'miss'
  description: string
  shooterDirection: PenaltyDirection
  keeperDive: PenaltyDirection
}

export function resolvePenalty(
  data: PenaltyInteractionData,
  shooterDir: PenaltyDirection,
  shooterHeight: PenaltyHeight,
  keeperDive: PenaltyDirection,  // AI-beräknad
  rand: () => number,
): PenaltyOutcome {
  const sameDirection = shooterDir === keeperDive

  // Base probabilities
  let goalChance = sameDirection ? 0.25 : 0.75
  
  // Adjust for skill
  const skillDiff = (data.shooterSkill - data.keeperSkill) / 100
  goalChance += skillDiff * 0.15
  
  // High shots are harder to save but also harder to hit
  if (shooterHeight === 'high') {
    goalChance = sameDirection ? 0.35 : 0.80  // harder to save high
    const missChance = 0.15  // but easier to miss
    if (rand() < missChance) {
      return {
        type: 'miss',
        description: `Skottet går högt över ribban!`,
        shooterDirection: shooterDir,
        keeperDive: keeperDive,
      }
    }
  }

  // Center shot — risky
  if (shooterDir === 'center') {
    goalChance = keeperDive === 'center' ? 0.10 : 0.85
  }

  const roll = rand()
  if (roll < goalChance) {
    const dirText = shooterDir === 'left' ? 'vänstra hörnet' 
      : shooterDir === 'right' ? 'högra hörnet' : 'rakt fram'
    return {
      type: 'goal',
      description: `MÅL! Bollen i ${dirText}. Målvakten chanslös.`,
      shooterDirection: shooterDir,
      keeperDive: keeperDive,
    }
  }

  return {
    type: 'save',
    description: `Räddning! Målvakten läser skottet och parar.`,
    shooterDirection: shooterDir,
    keeperDive: keeperDive,
  }
}
```

### PenaltyInteraction.tsx (UI)

Enkel layout — ingen SVG behövs:

```
┌─────────────────────────────┐
│ 🏒 STRAFF — 34:e minuten   │
│                              │
│ Skytt: S. Kronberg           │
│ Målvakt: K. Nilsson          │
│                              │
│ PLACERING                    │
│ ┌───────┬───────┬───────┐   │
│ │ Vänst │ Mitt  │ Höger │   │
│ └───────┴───────┴───────┘   │
│                              │
│ HÖJD                        │
│ ┌──────────┬──────────┐     │
│ │ Lågt 🧊  │ Högt ⬆️  │     │
│ └──────────┴──────────┘     │
│                              │
│ ┌───────────────────────┐   │
│ │    SKJ​UT STRAFFEN →    │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

Samma yield-mekanism som CornerInteraction i matchStepByStep.

---

## FEATURE 3: Kaptensmekanism

### Säsongsstart

Vid PreSeasonScreen (eller som ett tidigt event omgång 1): "Utse lagkapten".

Spelaren väljer bland sina 5 mest erfarna/högst ability outfield-spelare. Default-förslag: spelaren med flest matcher.

### SaveGame

```typescript
captainPlayerId?: string
```

### Effekter

- Kaptenen får +3 moral permanent
- Kaptenen nämns i presskonferenser ("Kaptenen tog ton...")
- Kaptenen visas i spelarkort med ©-symbol
- Kaptenen visas i trupp-vyn med ©-symbol
- Kaptenen nämns i säsongssammanfattning: "Lagkapten: Erik Ström"
- Om kaptenen säljs/skadas → event: "Ny kapten behövs"

### UI

1. **Spelarkort**: © bredvid namn
2. **SquadScreen**: © i lineup-raden
3. **SeasonSummary**: "Lagkapten: [namn]"
4. **PreSeasonScreen**: Beslutskort "Utse kapten" med 5 alternativ

---

## FEATURE 4: Hörn-SVG — uppstädning

### Problem

1. Inline-knapparna (NÄRA/MITT/BORTRE) i SVG:n krockar — noll gap
2. "H. hör" avklippt — borde stå "Hörna från höger" / "Hörna från vänster"
3. Dubbla knappar (SVG + HTML under) tar för mycket plats

### Fix

**Behåll inline-knapparna i SVG** (de var bättre), men:
- Öka y-avstånd mellan rektanglarna (gap 5px → 8px i SVG-coords)
- Tydligare border: strokeWidth 1.5, aktiv = 2.0 + fill 0.35
- "H. hörna" → "Hörna från höger" (eller "Hörna från vänster", randomiserat)
- **Ta bort de separata HTML-knapparna under SVG:n** — de duplicerar och tar plats
- Behåll LEVERANS-knapparna (Hårt skott / Låg pass / Kort hörna) som HTML under SVG

Resultat: SVG med zonval + hörnpunkt med fulltext, sedan leveransval + "SLÅ HÖRNAN →".

---

## Prioritering

1. Arenanamn + klacknamn (data + UI) — snabb, stor upplevelseskillnad
2. Straffar under match — ny interaktiv feature, bygger på befintlig yield-mekanism  
3. Kapten — mekanisk + narrativ feature
4. Hörn-SVG uppstädning — visuell fix
