# SPRINT 16 — SISTA FINISHEN

**Typ:** Mixed — feature + visuellt + narrativt  
**ID:er:** WEAK-022, VIS-009, DREAM-006, DREAM-017  
**Uppskattad tid:** 10h  
**Princip:** Gör i ordning: VIS-009 (fristående), DREAM-006 (fristående), WEAK-022 (systempåverkan), DREAM-017 (narrativt).

---

## VIS-009 — Spelarporträtt (procedurella SVG istället för assets)

**Nuläge:** `portraitService.ts` returnerar sökväg till `/assets/portraits/portrait_cat_N.png` — men inga assets existerar. UI visar initialer i cirklar.

**Beslut:** Erik levererar inte i tid. Generera procedurella SVG-porträtt istället — deterministiska per spelare-ID, med åldersvariation och positionsbaserad stil. Ger varje spelare en unik visuell identitet utan externa assets.

**Steg:**

1. Skapa `src/domain/services/svgPortraitService.ts`:

```typescript
/**
 * Genererar en inline SVG-sträng för en spelare baserat på id + ålder + position.
 * Deterministisk: samma spelare → samma porträtt varje gång.
 * Returnerar SVG-markup som data-uri eller raw string.
 */
export function generatePlayerPortrait(playerId: string, age: number, position: string): string {
  const hash = simpleHash(playerId)
  
  // Ansiktsform (3 varianter)
  const faceShape = hash % 3  // 0=rund, 1=oval, 2=kantig
  
  // Hårfärg baserad på hash
  const hairColors = ['#2C2820', '#5C4A3A', '#8B7355', '#C4A87C', '#D4C4A8']
  const hairColor = hairColors[hash % hairColors.length]
  
  // Hårstil baserad på ålder + hash
  const hairStyle = age >= 32 ? (hash % 2 === 0 ? 'short' : 'bald') 
                   : age >= 25 ? (hash % 3 === 0 ? 'medium' : 'short')
                   : hash % 4 === 0 ? 'long' : 'medium'
  
  // Hudfärg (5 toner)
  const skinTones = ['#F5DEB3', '#DEB887', '#D2B48C', '#C4A87C', '#8B7355']
  const skinTone = skinTones[(hash >> 4) % skinTones.length]
  
  // Ansiktsbehåring (åldersbaserad sannolikhet)
  const hasBeard = age >= 24 && (hash >> 8) % 3 === 0
  const hasStubble = !hasBeard && age >= 22 && (hash >> 6) % 2 === 0
  
  // Bygger SVG (64x64 viewBox, copper/parchment-palett)
  return buildSvg({ faceShape, hairColor, hairStyle, skinTone, hasBeard, hasStubble, age, hash })
}
```

Implementera `buildSvg` med enkla geometriska former — inget fotorealistiskt, mer som en stiliserad ikon. Tänk "Regens på FM" men med sepia-ton.

Variationer som behövs:
- 3 ansiktsformer (circle, ellipse, rounded-rect)
- 5 hårfärger
- 4 hårstilar (kort, medium, långt, flint)
- 5 hudtoner
- Skägg ja/nej
- Ögonbryn tjocklek (2 varianter)

Totalt: ~600 unika kombinationer. Tillräckligt.

2. **Uppdatera `portraitService.ts`** att anropa `generatePlayerPortrait` istället för att returnera PNG-sökväg:

```typescript
export function getPortraitSvg(playerId: string, age: number, position: string): string {
  return generatePlayerPortrait(playerId, age, position)
}

// Behåll getPortraitPath som deprecated fallback
```

3. **Uppdatera rendering** i `SquadScreen.tsx` och `PlayerCard.tsx`:

Hitta alla ställen som renderar initialer-i-cirkel. Ersätt med:
```tsx
<div 
  style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden' }}
  dangerouslySetInnerHTML={{ __html: getPortraitSvg(player.id, player.age, player.position) }}
/>
```

Alternativt: rendera SVG som React-komponent om `dangerouslySetInnerHTML` känns orent.

**Nyckel-filer att uppdatera:**
```bash
grep -rn "initialer\|initials\|firstName\[0\]\|getPortraitPath" src/presentation/
```

**Verifiering:** Öppna trupp-skärmen. Varje spelare ska ha ett unikt litet ansikte. Samma spelare = samma ansikte varje gång.

---

## DREAM-006 — Omklädningsrum-karta

**Nuläge:** Sprint 10 la till OMKLÄDNINGSRUM-kortet i SquadScreen med "Inre cirkel" och "Utanför" som text. Ingen visuell karta.

**Steg:**

1. Skapa `src/presentation/components/squad/LockerRoomMap.tsx`:

Visuell representation av omklädningsrummet. Enkel layout:
- Rektangulär yta (300×200) med bänkar längs kanterna
- Spelare placeras i kluster:
  - **Inre cirkeln** (kapten + topp 3 loyalty): samlade längst in, nära taktiktavlan
  - **Stam** (loyalty 50-80): utspridda normalt
  - **Periferi** (loyalty < 50, nya spelare < 3 matcher): vid dörren
- Varje spelare renderas som en liten cirkel (12px) med SVG-porträtt inuti (eller initial om porträttet inte finns)
- Tooltip/click → spelarens namn + loyalty-siffra + "sedan omgång X"

```tsx
interface Props {
  players: Player[]
  captainId?: string
  game: SaveGame
}

export function LockerRoomMap({ players, captainId, game }: Props) {
  // Sortera i tre grupper
  const inner = players.filter(p => 
    p.id === captainId || p.loyaltyScore >= 80
  ).slice(0, 4)
  
  const outer = players.filter(p => 
    p.loyaltyScore < 50 || (p.careerStats?.totalGames ?? 0) < 3
  )
  
  const core = players.filter(p => 
    !inner.includes(p) && !outer.includes(p)
  )
  
  // Placering: inner längst in (y: 20-60), core i mitten (y: 60-140), outer nära dörren (y: 140-180)
  // X-position deterministisk per spelare-ID
  // ...
}
```

2. **Ersätt text-kortet** i SquadScreen med `<LockerRoomMap>`. Behåll text-sammanfattningen under kartan som fallback.

3. **Interaktivitet:** Tryck på en spelare-prick → navigera till PlayerCard (eller visa mini-popup med namn + loyalty).

**Verifiering:** Öppna trupp. Se visuellt kluster med 3-4 i inre cirkel, majoriteten i mitten, 1-3 vid dörren. Kaptensikon (👑 eller accent-ring) ska vara tydlig.

---

## WEAK-022 — Ekonomi mångdimensionell

**Nuläge:** `calcRoundIncome` har: weeklyBase (reputation×120), sponsors, matchRevenue, community, volunteers, wages. Flat modell.

**Tre tillägg:**

### A. Kommunbidrag skalat på reputation + communityStanding

I `economyService.ts`, lägg till i `calcRoundIncome`:

```typescript
// ── Kommunbidrag (per säsong, utbetalas omgång 1) ──
// Basbelopp 60k, skalat med reputation (0-100) och communityStanding (0-100)
// Max ~180k/säsong för toppklubb med hög CS
kommunBidrag: number  // lägg till i RoundIncomeBreakdown
```

```typescript
const kommunBase = 60000
const repFactor = 0.5 + (club.reputation / 100) * 1.0  // 0.5–1.5
const csFactor = 0.7 + ((params.communityStanding ?? 50) / 100) * 0.6  // 0.7–1.3
const kommunBidrag = Math.round(kommunBase * repFactor * csFactor)
```

Utbetalas i `seasonEndProcessor` eller `roundProcessor` vid omgång 1. Loggas som `FinanceReason: 'kommunbidrag'`.

Lägg till `communityStanding` som parameter till `CalcRoundIncomeParams` om den inte redan finns.

### B. Mecenat cost-share vid transferköp

I `transferService.ts` (eller `executeTransfer`), efter godkänt köp:

```typescript
// Om aktiv mecenat har happiness >= 60 och typ 'brukspatron' eller 'entrepreneur':
// Erbjud cost-share på 20% av transfersumman (max 50k)
// Generera inbox: "Mecenaten erbjuder sig att täcka 20% av [spelarnamn]-affären."
// Pengar läggs till automatiskt — inget val, bara narrativt meddelande.
```

### C. Sponsor-reaktion vid stora transfers

I `sponsorService.ts` eller `transferService.ts`:

```typescript
// Vid köp av spelare med CA > 70:
// sponsorNetworkMood += 3
// Inbox: "Huvudsponsorn nöjd med värvningen."

// Vid försäljning av klackfavorit:
// sponsorNetworkMood -= 5  
// Inbox: "Sponsornätverket oroligt efter stjärnförsäljningen."
```

**Ny parameter i CalcRoundIncomeParams:** `communityStanding?: number`

**Verifiering:**
1. Starta säsong 2. Omgång 1: kommunbidrag syns i financeLog.
2. Köp dyr spelare med aktiv mecenat → mecenat cost-share-inbox.
3. Sälj klackfavorit → sponsorNetworkMood sjunker.

---

## DREAM-017 — Mecenatens middag (interaktiv scen)

**Nuläge:** Mecenater finns med happiness, personality, social events. Ingen middag.

**Steg:**

1. Skapa `src/domain/services/mecenatDinnerService.ts`:

```typescript
export interface DinnerScene {
  setting: 'jakt' | 'bastu' | 'whisky'
  settingDescription: string
  questions: DinnerQuestion[]
}

export interface DinnerQuestion {
  id: string
  text: string         // Mecenatens fråga/uttalande
  options: DinnerOption[]
}

export interface DinnerOption {
  label: string
  effect: {
    happiness: number        // -10 till +10
    communityStanding: number  // -3 till +3
    relationship: number     // -5 till +5
    financial?: number       // engångsbelopp
  }
  followUp: string          // Mecenatens reaktion
}

export function generateDinnerScene(mecenat: Mecenat, season: number): DinnerScene {
  // Setting baserad på mecenat-personality:
  // brukspatron → jakt, entrepreneur → whisky, skogsägare → bastu, etc
  
  // 3 frågor per middag:
  // 1. Småprat (låg insats) — t.ex. "Hur trivs du i orten?"
  // 2. Affärsfråga (medel) — t.ex. "Jag funderar på att sponsra nya omklädningsrum."
  // 3. Känslig fråga (hög) — t.ex. "Jag hörde att ni tänker sälja [stjärnspelaren]."
}
```

2. **Trigger:** I `seasonEndProcessor` eller `roundProcessor` vid omgång 20 (sent på säsongen), om mecenat finns och `happiness >= 40`:

```typescript
// Generera GameEvent typ 'mecenatDinner'
// Persista scenen i pendingEvents
```

3. **UI:** Ny komponent `src/presentation/components/events/MecenatDinnerEvent.tsx`:

Renderas i EventOverlay. Visar:
- Setting-beskrivning (2-3 meningar, atmosfär)
- Mecenatens porträtt (om SVG-generator finns) eller namn + emoji
- Fråga 1 → 2 svar-knappar → mecenatens reaktion → fråga 2 → etc
- Slutkort: "Middagen är slut. [Mecenatens namn] verkar [nöjd/fundersam/besviken]."

Effekterna appliceras efter sista frågan.

4. **GameEvent.ts:** Lägg till `mecenatDinner` som eventtyp.

5. **Tre settings med flavor-text:**

**Jakt:** "Dimman ligger låg över Stormyren. Geväret på axeln, hunden framför. [Mecenatens namn] stannar vid en kulle och häller upp kaffe ur termosen."

**Bastu:** "Ångan ligger tung. Björkris hänger på kroken. [Mecenatens namn] lutar sig mot bastuväggen och blundar. 'Kan vi prata om nästa säsong?'"

**Whisky:** "Biblioteket i [Mecenatens namn]s hus. Brasan sprakar. En flaska Lagavulin 16 på bordet. 'Jag har funderat', säger hen."

**Verifiering:** Spela till omgång 20 med aktiv mecenat. Event dyker upp. Klicka igenom 3 frågor. Happiness/CS ändras efter sista svaret. Ingen crash.

---

## ORDNING OCH COMMITS

```
1. VIS-009: SVG-porträtt
   Commit: "VIS-009: procedural SVG portraits replacing initials"
   → npm test

2. DREAM-006: Omklädningsrum-karta
   Commit: "DREAM-006: visual locker room map in SquadScreen"
   → npm test

3. WEAK-022: Ekonomi mångdimensionell
   Commit: "WEAK-022: kommun bidrag, mecenat cost-share, sponsor transfer reactions"
   → npm test

4. DREAM-017: Mecenatens middag
   Commit: "DREAM-017: interactive mecenat dinner scene"
   → npm test
```

---

## RAPPORTERA PER ID

```
VIS-009:   ✅/⚠️/❌ — [vad som gjordes]
DREAM-006: ✅/⚠️/❌ — [vad som gjordes]
WEAK-022:  ✅/⚠️/❌ — [vad som gjordes]
DREAM-017: ✅/⚠️/❌ — [vad som gjordes]
```
