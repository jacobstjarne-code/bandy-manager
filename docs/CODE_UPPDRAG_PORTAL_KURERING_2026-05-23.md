# CODE-UPPDRAG — Portal-kurering (komplett, byggbar) 2026-05-23

**Av:** Opus. **Surface:** kategori D + datamodell. **Status:** byggbar, typer
verifierade. Inga öppna designfrågor eller blockerare kvar. Bygg DEL 1–4.

**Underlag (läs i denna ordning):**
1. `docs/ANALYS_PORTAL_STATISK_2026-05-23.md` — varför portalen känns statisk
2. `docs/mockups/2026-05-23_design_portal_kurering.html` — visuell mock (story-slot, stripe-toner)
3. `docs/mockups/HANDOFF-PORTAL-KURERING-SVAR-2026-05-23.md` — Designs vikt-tabell
4. Detta dokument — den byggbara sammanföringen (vinner vid konflikt)

**Ramen:** kurering, inte arkitektur. `portalBuilder`-algoritmen fungerar. Vi
FYLLER korgen den sorterar ur (inbox-innehåll som kort) och lägger EN ny rad
(story-slot) + en vikt-justering (round-character). Inga nya komponenter — återanvänd
befintliga (`EventPrimary`, `JournalistSecondary`, etc).

---

## DEL 1 — inbox → portal-kandidater (`inboxToPortal.ts`)

Ny fil `src/domain/services/portal/inboxToPortal.ts`.

### 1.1 KRITISKT — typerna är INTE egna enum-värden

Designs handoff listar sju "typer" (`playerMilestone`, `nemesis`, ...). **Sex av
sju finns INTE som `InboxItemType`** (verifierat mot `src/domain/enums/index.ts`).
De är titel-prefix under DELADE typer. Mappa därför på titel/innehåll, INTE på
`item.type` ensam. Facit:

| Designs namn | Hur den känns igen i koden |
|---|---|
| `scandal` | `item.type === InboxItemType.Scandal` (enda äkta enum-träffen) |
| `derbyRamning` | `item.type === InboxItemType.Derby` |
| `journalistHot` | `item.type === InboxItemType.Media` ELLER `MediaEvent` |
| `mecenat` | `item.type === InboxItemType.PatronInfluence` |
| `bigResult` | `item.type === InboxItemType.MatchResult` MED målmarginal ≥4 eller motståndare=rival (läs `relatedFixtureId` → fixture, räkna |home−away|) |
| `playerMilestone` | `BoardFeedback` + titel-prefix "Karriärsmilstolpe:" (se 1.2) |
| `nemesis` | `BoardFeedback` + titel "⚠️ Nemesis:" / "Nemesis lägger av" (se 1.2) |

### 1.2 VERIFIERAT (Code rapporterade 2026-05-23) — bärande typ + mappning

Båda är riktiga inbox-items, inget att flagga. Facit:
- **playerMilestone:** `statsProcessor.ts`, `type: InboxItemType.BoardFeedback`,
  titel-prefix `"Karriärsmilstolpe: ${namn}"` (hattrick, 100 matcher, 50 mål m.fl.).
- **nemesis (aktiv):** `narrativeProcessor.ts`, `type: BoardFeedback`, titel-prefix
  `"⚠️ Nemesis: ${namn}"` (triggas vid 3+ mål mot oss).
- **nemesis (pensionerad):** `seasonEndProcessor.ts`, `type: BoardFeedback`, EXAKT titel
  `"Nemesis lägger av"` (inte prefix).
- **`InboxItem` har INGET `subType`-fält.** Mappa på titel-match.

**KRITISK ordningsregel i `inboxItemToCardCandidate`:** Båda ligger under
`BoardFeedback`, en typ som också bär vanlig styrelse-feedback som INTE ska lyftas.
Kolla titel-prefix FÖRST, låt allt annat `BoardFeedback` returnera `null`:
```typescript
if (item.type === InboxItemType.BoardFeedback) {
  if (item.title.startsWith('Karriärsmilstolpe:')) return makeMilestoneCard(item, game)
  if (item.title.startsWith('⚠️ Nemesis:') || item.title === 'Nemesis lägger av') return makeNemesisCard(item)
  return null   // övrig BoardFeedback lyfts ALDRIG
}
```
Milestone-significans (primary sig≥80 vs secondary 60): härled från titel/innehåll
(100 matcher / 50 mål = hög; hattrick / debut = lägre). Ingen tydlig signal → secondary 60.

### 1.3 Funktionen

```typescript
export function inboxItemToCardCandidate(item: InboxItem, game: SaveGame): DashboardCard | null
```
- Returnerar `null` för allt som inte är en JA-typ (träningsrapport, P19, rutinnyhet, ack).
- För JA-typer: returnera en `DashboardCard` med tier + weight (tabell nedan) +
  EN BEFINTLIG Component som tar item-datan. Ingen ny komponent.
- Lägg ett `kind`-fält på kandidaten (= Designs typnamn) för golv/rotation i DEL 2.
- Vikt + tier + stripe per typ (från Designs SVAR §Q1):

| Typ | tier | weight | stripe |
|---|---|---|---|
| `bigResult` (SM/cupfinal) | primary | 90 | gold |
| `scandal` (sig≥70) | primary | 88 | danger |
| `playerMilestone` (sig≥80) | primary | 85 | gold |
| `derbyRamning` | primary | 80 | warm |
| `nemesis` | secondary | 75 | warm |
| `journalistHot` | secondary | 70 | cold |
| `mecenat` | secondary | 65 | warm |
| `playerMilestone` (sig<80) | secondary | 60 | gold |
| `bigResult` (vanlig) | secondary | 55 | accent |

---

## DEL 2 — story-slot i `portalBuilder.ts`

### 2.1 PortalLayout får ett fält
```typescript
export interface PortalLayout {
  primary: DashboardCard
  storySlot: DashboardCard | null   // NY — mellan primary och secondary
  secondary: DashboardCard[]
  minimal: DashboardCard[]
}
```
Rendera i `PortalScreen` mellan primary och secondary. Om `null` → ingen rad,
secondary behåller 3 (Designs Q1a: story-slot är EXTRA rad, skär inte secondary).

### 2.2 Story-kandidater
I `buildPortal`, efter eligibility-filtret:
```typescript
const inboxCandidates = (game.inbox ?? [])
  .slice(-15)                                    // senaste 15 items
  .map(item => ({ item, card: inboxItemToCardCandidate(item, game) }))
  .filter(x => x.card !== null)
  .filter(x => roundsAgo(x.item, game) <= 2)     // recency: bara 2 omg (Designs Q2a)
```
`roundsAgo`: härled item-ålder från `item.date` mot `game.currentMatchday`/datum.

### 2.3 Golv + rotation (DEN LÖSTA REGELN — bygg exakt så här)

Story-sloten plockar EN vinnare. Två regler på OLIKA typ-mängder så de aldrig
krockar:

- **FREKVENTA typer** (`bigResult`, `scandal`, `journalistHot`): **rotation.**
  Om samma typ tog story-sloten FÖRRA matchdagen (spara `game.lastStorySlotType`),
  multiplicera dess story-vikt med 0.5 denna matchday. Hindrar att stora resultat
  tar sloten flera veckor i rad.
- **SÄLLSYNTA tysta typer** (`playerMilestone`, `nemesis`, `mecenat`): **golv.**
  Den omgång en sådan inträffar får den en temporär boost (+25 story-vikt) så den
  vinner sloten även mot ett `bigResult`. Skäl: ett stort resultat kommer igen
  nästa vecka; en milstolpe gör inte det.
- **ORDNINGSREGEL:** rotation rör bara de frekventa typerna, golv bara de sällsynta
  — de överlappar aldrig, så ingen if-else behövs, bara två separata vikt-justeringar
  på skilda typ-set. Golv kan därmed aldrig nedviktas av rotation.

```typescript
const FREKVENTA = new Set(['bigResult', 'scandal', 'journalistHot'])
const SALLSYNTA = new Set(['playerMilestone', 'nemesis', 'mecenat'])
const scored = inboxCandidates.map(({ item, card }) => {
  let w = card.weight + recencyBonus(item, game)   // +10 om denna omg, +5 om förra
  if (FREKVENTA.has(card.kind) && card.kind === game.lastStorySlotType) w *= 0.5
  if (SALLSYNTA.has(card.kind)) w += 25
  return { card, w }
})
const storySlot = scored.sort((a,b) => b.w - a.w)[0]?.card ?? null
```
Spara `game.lastStorySlotType = storySlot?.kind ?? game.lastStorySlotType` efter
rendering (behåll förra värdet om sloten var tom, så rotation funkar över gap).

---

## DEL 3 — round-character (`roundCharacter.ts`)

Ny fil `src/domain/data/roundCharacter.ts`. Från Designs SVAR §Q3.

```typescript
export type RoundCharacter = 'standard' | 'post_loss' | 'pre_derby' | 'cup_day' | 'premiere' | 'winning_streak' | 'losing_streak'
export function getRoundCharacter(game: SaveGame): RoundCharacter
```
(Designs Q3a: dela `after_streak` i `winning_streak`/`losing_streak`.)

Bias-tabell (multiplikator per karaktär × kort-id), appliceras i `buildPortal`
EFTER `applyPhaseBias`, FÖRE sortering:
```typescript
weight *= phaseBias[phase][tier] * characterBias[character][card.id] * staleBias(...)
```

| Karaktär | Boost | Dämpning |
|---|---|---|
| post_loss | journalist ×1.5, kafferum ×1.4, klacken ×1.3 | board_objectives ×0.7, ekonomi ×0.7 |
| pre_derby | klacken ×1.6, derby ×1.5, opponent_form ×1.4 | season_signature ×0.5 |
| cup_day | cup-kort ×1.5, next_match ×1.3 | board_objectives ×0.6 |
| premiere | ankommer-spelare ×1.5, ekonomi ×1.2 | (inget) |
| winning_streak | klacken ×1.4, journalist ×1.3 | board_objectives ×0.5 |
| losing_streak | kafferum ×1.4, journalist ×1.4 | board_objectives ×0.5 |
| standard | alla ×1.0 | alla ×1.0 |

**Bandysvensk regel (hård):** round-character syns ALDRIG som banner/etikett på
portalen. Det är bara ett vikt-instrument. Ingen "POST-LOSS DAG"-text någonstans.

---

## DEL 4 — vikt-justeringar (komplement, Designs SVAR §Q2)

I `dashboardCardBag` (fillCardBag): `board_objectives` 87→**65**, `tabell` 30→**20**,
`ekonomi` 25→**18**. I `staleBias`: golv 0.1→**0.05** (träng undan hårdare efter 4+ omg).

**VARNING (Jacobs poäng):** detta får INTE göra portalen till en andra inbox.
Funktion (tabell, ekonomi, nästa match) ska fortfarande synas — bara inte
DOMINERA. Verifiera i test att tabell/ekonomi ännu når secondary regelbundet, inte
trängs ut helt. Om de försvinner: höj tillbaka något. Berättelse OCH funktion,
inte byte.

---

## DATAMODELL (SaveGame)
- `lastStorySlotType?: string` (rotation)
- inget mer — inbox finns, cardStaleTracking finns, narrativeLog finns.

## VERIFIERING (tvingande)
1. Spela 10 omgångar med en milstolpe + ett stort resultat samma vecka → milstolpen
   vinner story-sloten (golv slår). Skärmdump.
2. Tre stora resultat tre veckor i rad → story-sloten roterar bort `bigResult` v2/v3,
   visar något annat om det finns. Skärmdump.
3. board_objectives dominerar INTE längre, MEN tabell/ekonomi syns än. Skärmdump.
4. Round-character syns aldrig som text. Verifiera i DOM.
5. Övrig `BoardFeedback` (ej milstolpe/nemesis) lyfts ALDRIG till portalen. Testa.
6. Determinism: samma save+matchday → samma portal (story-slot inklusive).

## VAD SOM INTE ÄNDRAS
Algoritmen i `buildPortal` (filter→bias→sort→slice), komponenterna, tier-systemet.
Vi lägger story-slot-injection + character-bias-multiplikation + inbox-korg. Inget mer.

— Opus, 2026-05-23 (1.2 uppdaterad med Codes typ-verifiering)
