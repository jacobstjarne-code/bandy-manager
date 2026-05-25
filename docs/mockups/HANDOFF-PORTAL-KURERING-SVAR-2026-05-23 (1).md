# HANDOFF — Portal-kurering: Design-svar

**Från:** Design-Claude
**Datum:** 2026-05-23
**Svarar på:** `docs/mockups/HANDOFF-PORTAL-KURERING-2026-05-23.md` + `docs/ANALYS_PORTAL_STATISK_2026-05-23.md` (Opus)

## TL;DR

Kurering, inte arkitektur. Inga nya kort, inga nya händelsetyper. Tre svar:

1. **Q1 Inbox-lyft:** sju typer JA, fyra NEJ. Tier-mappning per typ.
2. **Q2 Vikt:** **alternativ (b) story-slot.** Garanterad berättelse-plats över sortering.
3. **Q3 Round-character:** Ja. Återanvänd `seasonPhaseBias`-mönstret. Sex karaktärer.

---

## Q1 · Inbox → portal-lyft

### JA — lyfts till portal

| Inbox-typ | Portal-tier | Vikt | Stripe-färg |
|---|---|---|---|
| `playerMilestone` (debut, 100 mål, hattrick S1) | primary om sig ≥ 80, annars secondary | 85 / 60 | `--gold` om legendmilestone, annars accent |
| `nemesis` (rival-spelarens succé mot oss) | secondary | 75 | `--warm` |
| `derbyRamning` (kommande derby + senaste H2H) | primary | 80 | `--warm` |
| `journalistHot` (provocerande citat / vägrad presskonferens) | secondary | 70 | `--cold` |
| `bigResult` (margin ≥ 4, eller vinst mot rival, eller cup-shock) | primary om SM/cup-final, secondary annars | 90 / 55 | `--gold` / `--accent` |
| `scandal` (sig ≥ 70) | primary | 88 | `--danger` |
| `mecenat` (ny donation / krav) | secondary | 65 | `--warm` |

### NEJ — stannar i inbox

| Typ | Varför |
|---|---|
| `trainingReport` | Rutin, ingen narrativ vikt |
| `p19Result` | Ungdoms-resultat, kommer via akademi-tab |
| `routineNews` (sponsorbekräftelser, mindre transferrykten) | Brus |
| `inboxAck` (kvittenser på fullbordade beslut) | Bakgrund |

### Mappning — Code

Ny helper `src/domain/services/portal/inboxToPortal.ts`:
```typescript
export function inboxItemToCardCandidate(item: InboxItem): DashboardCard | null
```

Returnerar `null` för NEJ-typer. JA-typer mappas till en `DashboardCard` med rätt tier + weight + Component. Komponenten är **en av befintliga** (`EventPrimary`, `JournalistSecondary`, etc.) som tar inbox-itemets data. **Inga nya komponenter byggs.**

`portalBuilder` läser sedan både `CARD_BAG` och resultatet från `inboxItemToCardCandidate(latest)`. Inboxen behandlas som extra korg.

---

## Q2 · Vikt-rebalansering

### Val: (b) Story-slot

**Föreslag: dedikerad "story-slot" mellan primary och secondary.**

Inte sänk tak på funktionella — det skulle bara förskjuta problemet (`board_objectives` skulle fortfarande dominera). Reservera istället **en garanterad plats för det mest dramatiska som triggar**.

### Mekanik

```
Portal-layout (uppdaterad):
1. Primary card                  (1)
2. Story-slot (om kandidat finns)(0-1)
3. Secondary cards               (3)
4. Minimal bar                   (4)
```

Story-slot fylls om:
- Någon JA-mappad inbox-item finns från senaste 2 omg
- Story-vikt = inbox-mappad vikt + recency-bonus (10 om senaste omg, 5 om förra)
- Picks topp-1 av kandidaterna

Om ingen kandidat → slot tas bort, secondary får fler kort (eller layout krymper). Story-slot är inte ett ständigt utrymme — den dyker upp när det finns något att säga.

### Justeringar på befintliga vikter (komplement)

- `board_objectives` 87 → **65** (fortfarande hög, men inte dominant)
- `tabell` 30 → **20** (alltid-på-kort ska vara lättviktiga)
- `ekonomi` 25 → **18** (samma princip)
- Stale-bias-golv 0.1 → **0.05** (träng undan mer aggressivt om kortet visats 4+ omg)

---

## Q3 · Round-character-bias

### Val: Ja, återanvänd mönstret från `seasonPhaseBias` + C-SD1.

### Ny helper

`src/domain/data/roundCharacter.ts`:
```typescript
export type RoundCharacter =
  | 'standard'      // default
  | 'post_loss'     // förra omg = förlust
  | 'pre_derby'     // nästa = rival
  | 'cup_day'       // idag/närmaste = cup
  | 'premiere'      // omg 1
  | 'after_streak'  // 3+ vinst eller förlust i rad

export function getRoundCharacter(game: SaveGame): RoundCharacter
```

### Bias-tabell

Multiplikator per karaktär × kort-typ:

| Karaktär | Boost | Dämpning |
|---|---|---|
| `post_loss` | journalist × 1.5, kafferum × 1.4, klacken × 1.3, board_objectives × 0.7 | ekonomi × 0.7, tabell × 0.8 |
| `pre_derby` | klacken × 1.6, derby × 1.5, opponent_form × 1.4 | season_signature × 0.5 |
| `cup_day` | cup-relaterade × 1.5, nästa-match-kort × 1.3 | board_objectives × 0.6 |
| `premiere` | ankommer-spelare × 1.5, ekonomi × 1.2 | (inget) |
| `after_streak` | journalist × 1.4, klacken × 1.4 | board_objectives × 0.5 |
| `standard` | (alla × 1.0) | (alla × 1.0) |

Applikation i `portalBuilder` efter `seasonPhaseBias`:
```typescript
const phase = getSeasonPhase(...)
const character = getRoundCharacter(game)
weight *= phaseBias[phase][tier] * characterBias[character][card.id]
```

### Bandysvensk regel

Karaktärerna ska aldrig dubbleras visuellt på Portal ("⚡ POST-LOSS DAG" som banner) — det är **bara** ett vikt-instrument. Spelaren märker att Portal är annorlunda utan att veta varför.

---

## Vad detta INTE innehåller

- Inga nya kort
- Inga nya händelsetyper
- Inga ändringar i `portalBuilder`-algoritmen (förutom story-slot-injection + character-bias-multiplikation)
- Inga nya komponenter
- Inget mock-arbete — detta är ren kurering, ingen bild krävs

## Estimat

| Del | Estimat |
|---|---|
| `inboxToPortal.ts` mapping (7 JA-typer + 4 NEJ-filtering) | ~2h |
| Story-slot integration i `portalBuilder` + `PortalScreen` | ~1.5h |
| `roundCharacter.ts` helper + bias-tabell | ~1h |
| Vikt-justeringar (`board_objectives`, `tabell`, `ekonomi`, stale-golv) | ~30 min |
| Tester (snapshot per character × typ) | ~1.5h |
| **Total** | **~6.5h Code** |

---

## Designval öppna till Opus + Jacob

**Q1a:** Story-slot — visa även när secondary-stack är full (alltså totalt 1 primary + 1 story + 3 secondary = 5 kort)? Eller skär secondary till 2 när story aktiv? **Föreslag:** Behåll secondary 3. Story-slot är extra rad.

**Q2a:** "Recency-bonus" 10 om senaste omg, 5 om förra — räcker? Eller behöver vi 7-dagars-rullande för att en stor händelse ska kunna återanvändas? **Föreslag:** Bara 2 omg. Tredje gången blir det brus.

**Q3a:** `after_streak` — bara vinster, bara förluster, eller båda? **Föreslag:** Båda. Tonen blir olika (klacken-rad för vinst-streak vs kafferum-rad för förlust-streak) men character-name är samma — eller dela upp till `winning_streak` / `losing_streak` om Code vill ha precision.

— Design-Claude, 2026-05-23
