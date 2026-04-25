# SPRINT 20 — MATCH-INTERAKTIONSUPPGRADERING

**Typ:** UX-förbättring av alla fem match-interaktioner
**Uppskattad tid:** 6–8h
**Princip:** Applicera samma fyra principer på alla interaktionstyper — hörna, straff, kontring, frispark, slutspurt. Börja med hörnan, den är mest komplex. Sen replikera till övriga.

**Beroende:** Sprint 18 (AssistantCoach) måste vara körd — vi använder `generateCoachQuote` för tränartips.

---

## De fyra förbättringarna

**C — Utfall-animation efter val**
Efter att spelaren trycker på val, visa en kort (1–1.5s) animation på mini-planen innan outcome-texten slår in. Bollen följer vägen från start till slutposition, med färg som speglar utfallet.

**D — Svårighet % på varje knapp**
Istället för bara `"NÄRA · Medium risk"` visas `"NÄRA · 35%"`. Baseras på spelarattribut, motståndare, situation. Ger taktiska val istället för gissning.

**E — Assistenttränarens tips innan val**
Liten quote-rad ovanför knapparna: `"Ekgren har haft tungt. Skicka bollen nära."` Tonen styrs av coach.personality.

**G — Zoner som klickbara regioner på planen**
För hörna och frispark: själva planen blir klickbar. Olika zoner markeras med färgad overlay, spelaren trycker på zonen direkt. Inga separata knappar — planen ÄR valet.

---

## 20A — Hörnan (referens-implementering)

**Nuläge:** `CornerInteraction.tsx` med tre knappar NÄRA/MITTEN/BORTRE under mini-plan.

### Ny layout

```
⛳ HÖRNA — 23:e MINUTEN
[timer-bar: 5 sek nedräkning]

HÖRNASTATISTIK
5 · M    4 · B    • 2 mål idag

┌──────────────────────────────────────┐
│  [MINI-PLAN med tre klickbara zoner] │
│                                      │
│   ┌──────┐┌──────┐┌──────┐          │
│   │ NÄRA ││MITTEN││BORTRE│          │
│   │ 35%  ││  28% ││ 18%  │          │
│   └──────┘└──────┘└──────┘          │
│                                      │
│  Spelarprickar: Ekgren · Hedlund     │
│  med status-badges                   │
└──────────────────────────────────────┘

💬 BJÖRN EKMAN: "Ekgren har haft tungt.
   Skicka bollen nära."

[─ AVBRYT ─]    [TIMEOUT → NÄRA (default)]
```

### Zoner på planen (G)

Planen delas i tre klickbara overlays:
- **Nära (till vänster/höger)**: 25% av planen närmast hörnstolpen, copper transparent overlay
- **Mitten**: 50% i mitten, accent transparent overlay
- **Bortre (motsatt sida)**: 25%, ice transparent overlay

Varje zon har:
- Hover-state: overlay ökar opacity till 0.35 + border markeras
- Klick-state: väljs, visar procentsats och blir primär
- En liten label mitt i zonen: `NÄRA 35%`

Efter val: alla zoner dämpas utom den valda. Spelaren har 0.5s att ångra innan outcome-animation börjar.

### Svårighet % (D)

Beräknas i `cornerInteractionService.ts`. Formel:

```typescript
function calculateZoneSuccessRate(
  zone: 'near' | 'middle' | 'far',
  corner: CornerInteractionData
): number {
  const baseRates = { near: 0.35, middle: 0.28, far: 0.18 }
  let rate = baseRates[zone]
  
  // Spelarskicklighet
  const cornerTaker = corner.cornerTaker
  rate += (cornerTaker.skillSetPieces - 50) / 500  // ±10% variation
  
  // Trötthet
  if (cornerTaker.condition < 60) rate -= 0.05
  
  // Form (senaste 3 matcher)
  if (cornerTaker.recentForm > 0.7) rate += 0.03
  
  // Motståndarens MV
  rate -= (corner.goalkeeperSkill - 50) / 500
  
  // Is-kvalitet
  if (corner.iceQuality === 'poor') rate -= 0.02
  
  return Math.max(0.05, Math.min(0.65, rate))
}
```

Visa avrundat till närmaste 5% för läsbarhet (35, 30, 20 istället för 33.7, 28.4, 17.9).

### Tränartips (E)

```typescript
function getCornerCoachTip(
  coach: AssistantCoach,
  data: CornerInteractionData
): string {
  // Välj relevant situation:
  if (data.cornerTaker.condition < 50) {
    return coachSay(coach, 'taker-tired', data.cornerTaker.name)
    // calm: "X har haft tungt. Ta det säkra, närheten."
    // sharp: "X är slut. Kortpasskor bara."
    // jovial: "X har slitit — låt någon annan få chansen eller gå närmast."
  }
  if (data.tallStriker.condition > 80 && data.tallStriker.recentGoals > 0) {
    return coachSay(coach, 'striker-hot', data.tallStriker.name)
    // "X är glödhet. Slå upp till honom i mitten."
  }
  if (data.homeCornersThisMatch >= 4 && data.homeCornerGoals === 0) {
    return coachSay(coach, 'no-corner-goals-yet')
    // "Fyra hörnor och inga mål. Dags att variera."
  }
  // Default:
  return coachSay(coach, 'corner-default')
}
```

Implementera i `assistantCoachService.ts` — lägg till `corner-X`-kontexttyper.

Rendera som liten rad med `💬` + initialer-cirkel (16px) + quote i Georgia italic 11px:
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', ...}}>
  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{coach.initials}</span>
  </div>
  <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontStyle: 'italic', color: 'var(--text-light-secondary)' }}>
    {quote}
  </span>
</div>
```

### Utfall-animation (C)

Efter att zon valts:

1. 0.5s pause där valda zonen "låser in"
2. Liten boll (radius 3) animeras från hörnstolpen till slutposition (målmun om mål, fångad av MV om räddat, ut i planen om miss). CSS transition 0.8s ease-out.
3. På slutpositionen: blink-effekt i utfall-färg (grön=mål, koppar=räddat, grå=miss)
4. Outcome-texten slår in under planen samtidigt som animationen når slutet

Implementera via React state-maskin:
- `phase: 'choosing' | 'locked' | 'animating' | 'revealed'`
- Timer 500ms locked → animating, 800ms animating → revealed

### Timer (redan har vi)

5 sekunders nedräkning som tunn kopparstapel. Om spelaren inte valt vid 0: default till "NÄRA" (säkraste) och kör outcome.

---

## 20B — Straff

Mini-plan visar MV + straffpricken + bollbana-valmöjligheter (5 zoner: vänster hög, vänster låg, mitten, höger låg, höger hög).

**Zonklick:** Varje zon i målet är klickbar.

**Procent:** Varierar efter spelarens straffskicklighet och MV-attribut.

**Tränartips:** `"X missade sin senaste straff. Sikta enkelt."` / `"MV har tagit 3 av 5 senaste."`

**Animation:** Bollen åker från pricken till vald zon. Om mål: svart skugga genom bollen (LED-blink). Om räddat: MV-prick rör sig dit.

---

## 20C — Kontring

**Nuläge:** tre val (Sprinta/Spela av/Bygga upp).

**Behåll valen men:**

- **Zonklick** gäller inte här — det är inte "var på planen" utan "hur agerar jag". Tre knappar kvar.
- **Procent:** Sprinta 35% / Spela av 50% / Bygga 20% (exempel, varierar per spelarattribut)
- **Tränartips:** `"Ekgren är snabbare än försvaret. Kör."` / `"Dom täcker ytan. Spela av."`
- **Animation:** Liten spelare-prick löper längs vald väg, motståndarprickar försöker stoppa. Utfall syns på slutposition.

---

## 20D — Frispark

Zonklick gäller här — som hörna. Planen visar muren och målet. Tre valzoner:

- **Över muren** (högt, svårt)
- **Runt muren** (smygskott kant)
- **Passning in** (låg risk, lågt mål-%)

**Procent** + **tränartips** + **animation** som hörna.

---

## 20E — Slutspurt

Enklare interaktion — två val: "Gå ut hårt" vs "Håll formen".

**Behåll enkel design men lägg till:**
- **Procent:** "+12% målchans / −8% insläppt" vs "+4% behålla ledning / −0% risk"
- **Tränartips:** `"Vi har fortfarande orken. Pressa."` eller `"Vi är slitna. Håll ihop det."`
- **Animation:** Inte relevant (det är en strategisk val, inte en specifik händelse)

---

## 20F — Gemensam struktur

Alla interaktioner får samma grundstruktur. Skapa en shared layout-komponent:

```typescript
// src/presentation/components/match/InteractionShell.tsx
interface InteractionShellProps {
  icon: string        // emoji
  title: string       // "HÖRNA"
  minute: number
  timerSeconds?: number  // default 5
  stats?: React.ReactNode       // statistik-rad
  pitch: React.ReactNode        // mini-plan med zoner
  coachTip?: React.ReactNode    // assistenttränarens råd
  actions: React.ReactNode      // avbryt-knapp, status
  phase: 'choosing' | 'animating' | 'revealed'
  outcome?: React.ReactNode     // visas när phase=revealed
  onTimeout: () => void         // default-val vid timeout
}
```

Varje specifik interaktion (Corner, Penalty, Counter, FreeKick, LastMinute) använder Shell och skickar in sin egen plan och logik.

---

## 20G — Service-uppdateringar

**`cornerInteractionService.ts`**: Lägg till `calculateZoneSuccessRate()` och `getCornerCoachTip()`.

**`penaltyInteractionService.ts`**: Lägg till `calculateZoneSuccessRate(zone)` och `getPenaltyCoachTip()`.

**`counterAttackInteractionService.ts`**: Lägg till `calculateChoiceSuccessRate(choice)` och `getCounterCoachTip()`.

**`freeKickInteractionService.ts`**: Samma mönster.

**`lastMinutePressService.ts`**: Samma mönster.

**Alla funktioner tar spelarattribut och situation som input, returnerar sannolikhet 0–1.**

---

## 20H — assistantCoachService utökning

Lägg till nya QuoteContext-typer:

```typescript
| { type: 'corner'; subcontext: 'taker-tired' | 'striker-hot' | 'no-goals-yet' | 'default'; playerName?: string }
| { type: 'penalty'; subcontext: 'taker-missed-last' | 'gk-strong' | 'default'; playerName?: string }
| { type: 'counter'; subcontext: 'fast-runner' | 'outnumbered' | 'support-slow' | 'default'; playerName?: string }
| { type: 'freekick'; subcontext: 'wall-small' | 'distance-long' | 'default' }
| { type: 'last-minute'; subcontext: 'leading' | 'chasing' | 'tied'; margin: number }
```

Lägg till citat-uppsättningar för varje. Följ samma 5-personlighet-mönster som förlust-citaten i Sprint 18.

---

## 20I — Animation-helpers

Skapa `src/presentation/components/match/animations/`:

- `BallPath.tsx` — tar fromPoint + toPoint + outcome, animerar SVG-boll över 0.8s
- `ZoneFlash.tsx` — tar zon + outcome (color), blinkar 2 gånger

Använd CSS-transitions (inte Framer Motion eller andra bibliotek — håll lätt).

---

## Acceptanskriterier

- [ ] Alla fem interaktioner har timer (5s), med timeout → default-val
- [ ] Alla fem visar svårighet-% på val
- [ ] Alla fem har tränartips från assistenttränaren (personlighetsbaserade)
- [ ] Hörna, straff, frispark har klickbara zoner på planen
- [ ] Kontring och slutspurt behåller traditionella knappar
- [ ] Alla fem har utfall-animation (0.8s) innan outcome-text
- [ ] `InteractionShell`-komponent används av alla fem
- [ ] Coach-quote-systemet täcker alla interaktionstyper × 5 personligheter

---

## Filer som skapas/ändras

**Nya:**
- `src/presentation/components/match/InteractionShell.tsx`
- `src/presentation/components/match/animations/BallPath.tsx`
- `src/presentation/components/match/animations/ZoneFlash.tsx`

**Ändras:**
- `src/presentation/components/match/CornerInteraction.tsx` (refaktorera till Shell + zon-klick + animation)
- `src/presentation/components/match/PenaltyInteraction.tsx`
- `src/presentation/components/match/CounterInteraction.tsx`
- `src/presentation/components/match/FreeKickInteraction.tsx`
- `src/presentation/components/match/LastMinutePress.tsx`
- `src/domain/services/cornerInteractionService.ts` (success rate + coach tip)
- `src/domain/services/penaltyInteractionService.ts`
- `src/domain/services/counterAttackInteractionService.ts`
- `src/domain/services/freeKickInteractionService.ts`
- `src/domain/services/lastMinutePressService.ts`
- `src/domain/services/assistantCoachService.ts` (nya contexts)
