# TEXT REVIEW — Formation-coach-quotes & kemi-expand-texter

**Datum:** 2026-04-20
**Sprint:** 23 (Taktik UX Part 2, B2c + B4b)
**Författare:** Opus
**Status:** GODKÄND av Jacob 2026-04-20 — Code implementerar direkt

---

## VIKTIGT FÖRE IMPLEMENTATION — matchmotor-realitet

`tacticModifiers.ts` påverkas av:
- **mentality** (offensive/defensive modifier)
- **tempo** (tempo modifier)
- **press** (press modifier)
- **passingRisk** (offense/defense)
- **width** (offense modifier)
- **attackingFocus** (corner/finish)
- **cornerStrategy** (corner effectiveness)
- **penaltyKillStyle** (discipline/defense)

**Formation påverkar INTE matchmotorn.** Formation är:
1. Kosmetisk (hur spelarna visas på planen)
2. Position-matching (om formationen kräver 4 forwards och du bara har 3, går en annan position upp som ersättare med CA-rabatt)
3. Chemistry-baseras på vilka spelare som hamnar bredvid vilka (via slots x,y)

**Konsekvens för tags:**
- ❌ `+ OFFENSIV` på 2-3-2-3 — lögn, mentality gör det, inte formation
- ❌ `+ HÖRNOR` på 4-2-4 — lögn, cornerStrategy styr det, inte formation
- ❌ `– DEFENSIV` på 3-3-4 — lögn, samma anledning
- ✅ `4 FORWARDS` — sant, reflekterar slots
- ✅ `BARA 2 BACKAR` — sant
- ✅ `STARK MITTLINJE` — sant (reflekterar slots)
- ✅ `KRÄVER LIBERO` — sant om 5-3-2 har en specifik libero-slot

Tags ska reflektera **spelarkrav och formationens anatomi**, inte match-effekter.

Coach-quotes är säkrare eftersom de är subjektiva observationer på bandyspråk — inte mekaniska påståenden.

---

## FORMATION_META — 6 formationer

Varje formation får **2 tags** + **1 coach-quote**.

Struktur i kod:
```ts
FORMATION_META: Record<FormationType, {
  tags: string[]
  coachQuote: string
}>
```

### 5-3-2 (Klassisk)

**Slots:** 1 GK · 3 DEF (+libero) · 2 HALF · 3 MID · 2 FWD

**Tags:**
- `TRYGG`
- `KRÄVER LIBERO`

**Coach-quote:**
> "Libero bak, tre halvor, två forwards. Så har vi alltid spelat — det finns en trygghet i det kända."

---

### 3-3-4 (Offensiv)

**Slots:** 1 GK · 3 DEF · 2 HALF + 1 MID · 4 FWD (två innerforwards, två ytterforwards)

**Tags:**
- `4 FORWARDS`
- `KLASSISK BANDY`

**Coach-quote:**
> "Fyra forwards. Så här spelades bandy när jag växte upp — mycket folk framme, straffa dom när dom tappar bollen."

---

### 4-3-3 (Defensiv)

**Slots:** 1 GK · 4 DEF · 2 HALF + 1 MID · 3 FWD

**Tags:**
- `STABIL BAKÅT`
- `4 BACKAR`

**Coach-quote:**
> "Fyra bak. Tråkigt, kanske — men det vinner poäng när motståndarna är bättre än oss. Stabilitet först, chanser sen."

---

### 3-4-3 (Halvlinje)

**Slots:** 1 GK · 3 DEF · 2 HALF + 2 MID · 3 FWD

**Tags:**
- `STARK MITTLINJE`
- `BOLLKONTROLL`

**Coach-quote:**
> "Fyra på halvlinjen. Äger du mitten i bandy äger du matchen — så enkelt är det."

---

### 2-3-2-3 (Offensiv)

**Slots:** 1 GK · 2 DEF · 2 HALF + 1 MID · 2 MID · 3 FWD

**Tags:**
- `BARA 2 BACKAR`
- `RISK/REWARD`

**Coach-quote:**
> "Bara två bak. Vi gasar. Funkar det inte i första halvlek får vi byta — men jag vill testa."

---

### 4-2-4 (Ultra-offensiv)

**Slots:** 1 GK · 4 DEF · 2 HALF · 4 FWD (två inner, två ytter)

**Tags:**
- `4 FORWARDS`
- `TUNN MITTLINJE`

**Coach-quote:**
> "Fyra forwards, fyra backar — och två stackars halvor som ska hålla ihop det. Allt eller inget."

---

## IMPLEMENTATIONSNOT för B2c

När Code bygger `FORMATION_META` i `Formation.ts`:

```ts
export const FORMATION_META: Record<FormationType, { tags: string[]; coachQuote: string }> = {
  '5-3-2': {
    tags: ['TRYGG', 'KRÄVER LIBERO'],
    coachQuote: 'Libero bak, tre halvor, två forwards. Så har vi alltid spelat — det finns en trygghet i det kända.',
  },
  '3-3-4': {
    tags: ['4 FORWARDS', 'KLASSISK BANDY'],
    coachQuote: 'Fyra forwards. Så här spelades bandy när jag växte upp — mycket folk framme, straffa dom när dom tappar bollen.',
  },
  '4-3-3': {
    tags: ['STABIL BAKÅT', '4 BACKAR'],
    coachQuote: 'Fyra bak. Tråkigt, kanske — men det vinner poäng när motståndarna är bättre än oss. Stabilitet först, chanser sen.',
  },
  '3-4-3': {
    tags: ['STARK MITTLINJE', 'BOLLKONTROLL'],
    coachQuote: 'Fyra på halvlinjen. Äger du mitten i bandy äger du matchen — så enkelt är det.',
  },
  '2-3-2-3': {
    tags: ['BARA 2 BACKAR', 'RISK/REWARD'],
    coachQuote: 'Bara två bak. Vi gasar. Funkar det inte i första halvlek får vi byta — men jag vill testa.',
  },
  '4-2-4': {
    tags: ['4 FORWARDS', 'TUNN MITTLINJE'],
    coachQuote: 'Fyra forwards, fyra backar — och två stackars halvor som ska hålla ihop det. Allt eller inget.',
  },
}
```

**Rendering i FormationView** mellan knapp-raden och planen:

```
┌─────────────────────────────────────────┐
│ [TRYGG]  [KRÄVER LIBERO]                │
│                                         │
│ "Libero bak, tre halvor, två forwards.  │
│  Så har vi alltid spelat — det finns    │
│  en trygghet i det kända."              │
│  — Coachen                              │
└─────────────────────────────────────────┘
```

Tag-styling: `tag tag-ghost` (finns i global.css). Quote-styling: kursiv, `var(--text-secondary)`, `var(--font-display)` (Georgia). "— Coachen" i ännu mindre font-size, `var(--text-muted)`.

---

## B4b — KEMI-EXPAND-TEXTER

När spelaren klickar på ett kemi-par i ChemistryView expanderas en rad med text. Koden `ChemistryView.tsx` behöver:

1. State: `const [expandedPairKey, setExpandedPairKey] = useState<string | null>(null)`
2. Vid klick på pair → toggle `expandedPairKey`
3. När expanderad, visa textrad med formatering enligt nedan

### Logik för val av text

```ts
function getPairExpandText(
  playerA: Player,
  playerB: Player,
  slotA: FormationSlot,
  slotB: FormationSlot,
  chemistryStrength: 'strong' | 'weak' | 'neutral',
): string | null {
  // Inga konkreta förslag → returnera null → visa bara paret utan text
  // Tomma generaliteter är sämre än tystnad
  ...
}
```

### Branches

**Branch 1: NYVÄRVAD SPELARE (en av dom har <5 matcher i klubben)**
Överskrider alla andra branches. Alltid visa denna om villkoret uppfylls.

Text-mallar (välj slumpmässigt):
- `"{ny} är ny i klubben. Ge det några matcher innan ni bygger anfall via dom båda."`
- `"{ny} har inte hittat rytmen med {gammal} än. Tålamod — kemin kommer."`

Tröskel: `player.careerStats?.totalGames ?? 0 < 5` — gäller bara matcher för nuvarande klubb, inte totalt i karriären. Om datan inte skiljer på det (kolla `Player.ts`), använd säsongsstats i klubben eller approximera via `seasonsInClub === 0`.

---

**Branch 2: STARK KEMI, spelarna SITTER IHOP** (samma sida, `Math.abs(slotA.x - slotB.x) <= 25`)

Ingen expand-text. Den starka kemin används redan optimalt.

**Returnera:** `null`

---

**Branch 3: STARK KEMI, spelarna SITTER ISÄR** (`Math.abs(slotA.x - slotB.x) > 50`)

Outnyttjad potential. Föreslå sida.

Text-mallar (välj slumpmässigt):
- `"{A} och {B} har bra kemi — men sitter långt isär. Prova att flytta ihop dom på {sida}."`
- `"Stark koppling som inte utnyttjas. Överväg att sätta {B} på {sida} tillsammans med {A}."`
- `"Bra kemi men utspritt. Flytta ihop dom om laget tillåter."`

**"{sida}" beräknas:** använd den sida där {A} redan sitter (`slotA.x < 50 ? "vänster" : "höger"`). Om {A} är central (`slotA.x` mellan 40–60) → använd variant 3 utan sida.

---

**Branch 4: SVAG KEMI (röd streckad), spelarna SITTER IHOP**

Varna för direktpass, föreslå via-spel eller flytt. Visas **endast** när kopplingen är röd streckad — inte vid neutral/saknad koppling.

Text-mallar (välj slumpmässigt):
- `"{A} och {B} läser inte varandra än. Undvik långa direktpass — låt dom spela via mittfältet."`
- `"Svag koppling men dom kommer jobba ihop. Håll det enkelt tills dom hittar varandra."`
- `"Om laget tillåter — sätt {A} och {B} på olika sidor tills kemin växt."`

---

**Branch 5: SVAG KEMI (röd streckad), spelarna SITTER ISÄR**

Låg risk — de kommer inte interagera mycket. Säg inget.

**Returnera:** `null`

---

**Branch 6: NEUTRAL KEMI (ingen linje)**

Säg inget. Visa bara paret.

**Returnera:** `null`

---

### Branch-ordning i kod

```ts
// 1. Nyvärvad vinner alltid
if (isNewSigning(playerA) || isNewSigning(playerB)) {
  return newSigningText(...)
}

// 2–5. Baserat på chemistryStrength + avstånd
if (chemistryStrength === 'strong') {
  if (Math.abs(slotA.x - slotB.x) > 50) return farApartStrongText(...)
  return null // sitter ihop = optimal
}

if (chemistryStrength === 'weak') {
  if (Math.abs(slotA.x - slotB.x) <= 25) return weakTogetherText(...)
  return null // sitter isär = låg risk
}

return null // neutral
```

---

## RENDERING av expanded text

Design:

```
┌─────────────────────────────────────────┐
│  Sjö ─────── Norén         (grön linje) │
├─────────────────────────────────────────┤
│  💡 Sjö och Norén har bra kemi — men    │
│     sitter långt isär. Prova att flytta │
│     ihop dom på vänster.                │
└─────────────────────────────────────────┘
```

Styling: textrad med `padding: 8px 12px`, `font-size: 11px`, `color: var(--text-secondary)`, `font-family: var(--font-display)`, liten glödlampa-emoji i början (`💡 ` + space).

När `getPairExpandText()` returnerar `null`:
- Inget expand-block renderas
- Klick på paret är no-op (eller: `expandedPairKey` sätts men inget visas — bestäm själv, bägge funkar)

---

## SAMMANFATTNING FÖR CODE

**B2c — FORMATION_META:**
- Lägg i `src/domain/entities/Formation.ts` efter FORMATIONS-objektet
- Kopiera koden ovan exakt — alla 6 formationer × 2 tags + 1 quote
- Rendera i FormationView mellan formation-knappar och plan
- Tags som `tag tag-ghost`, quote som kursiv serif med liten "— Coachen"-rad

**B4b — kemi-expand:**
- `ChemistryView.tsx` state + logik enligt branches ovan
- Texter är **kontext-beroende** — inte statiska strängar
- Om ingen konkret rekommendation (branch 2, 5, 6) → returnera null → visa bara paret
- Aldrig generera generaliteter

**Båda:** texterna här är svenskspråkiga slutversioner. Code ska **kopiera exakt**, inte översätta eller omformulera. Se CLAUDE.md regel "KOPIERA BOKSTAVLIGT".
