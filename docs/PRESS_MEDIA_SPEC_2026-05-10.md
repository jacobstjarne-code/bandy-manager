# PRESS/MEDIA — datakontrakt, arkitektur, integration

**Datum:** 2026-05-10
**Författare:** Opus
**Status:** SPEC — klar för Code att implementera när Stålvallen-refactor är pushad

---

## Sammanfattning

Press/media är ett standalone-system: pre-generated content library + tag-baserad picker + integration med befintliga trigger-points (match-completion, anslag, skador, transfers). Ingen realtids-API-koppling. Ingen runtime-LLM. AI används off-line för att generera library, vid build-time. Vid runtime är allt deterministiskt och fil-baserat — som anslagen.

Tre form: **citat** (kort, attribuerat), **pressrelease** (klubb-officiell), **intervju** (Q&A). Alla tre lagras i samma library, separerade av `type`-fält.

---

## Datakontrakt

### `MediaItem`

```ts
// src/domain/data/media/types.ts

export type MediaItemType = 'quote' | 'press_release' | 'interview'

export type MediaTag =
  // Match-utfall
  | 'post_match_win'
  | 'post_match_loss'
  | 'post_match_draw'
  | 'post_match_close_loss'      // förlust med 1 mål
  | 'post_match_blowout_win'     // vinst 4+ mål
  | 'post_match_blowout_loss'    // förlust 4+ mål
  // Stora matcher
  | 'pre_cup_final'
  | 'pre_sm_final'
  | 'post_cup_win'
  | 'post_cup_loss'              // ledsen pokalförlust
  | 'post_sm_win'
  | 'post_sm_loss'
  // Karriär-event
  | 'injury_minor'               // 1-2 veckor
  | 'injury_major'               // 4+ veckor
  | 'milestone_goal_10'          // spelare når 10 mål på säsongen
  | 'milestone_goal_20'
  | 'transfer_arrival'
  | 'transfer_departure'
  // Säsongs-rytm
  | 'season_start'
  | 'season_end_top3'            // toppplacering
  | 'season_end_mid'
  | 'season_end_bottom'
  // Drama
  | 'crisis_streak'              // 3+ förluster i rad
  | 'success_streak_5'           // 5+ vinster i rad
  | 'success_streak_10'          // 10+ vinster i rad
  | 'scandal'                    // (placeholder för senare arc)

export type ClubArchetype = 'industry' | 'forest' | 'rural' | 'urban'

export interface MediaItem {
  id: string                     // 'quote_post_loss_001', 'press_injury_001', etc
  type: MediaItemType
  tags: MediaTag[]
  attribution: {
    name: string                 // template: "{coachName}", "Sportkrönikan", "{playerName}", litterära namn
    role: string                 // "Coach", "Sportkrönikör", "Spelare", "Klubbordförande"
  }
  body: string                   // template med slots: {motståndare}, {nextOpponent}, {playerName}, etc
  variants?: string[]            // alternativa formuleringar av samma item, picker väljer en
  // Optionella filter
  clubArchetypes?: ClubArchetype[]  // bara för dessa klubbtyper
  minSeasonNumber?: number          // bara från säsong N — för progression-känslighet
  maxSeasonNumber?: number          // bara fram till säsong N
  excludeIfRecent?: number          // antal omgångar denna item ej får återanvändas inom
}
```

### `MediaContext`

```ts
export interface MediaContext {
  managedClubId: string
  managedClubName: string
  managedClubShortName: string
  fixture?: Fixture
  player?: Player
  outcome?: 'win' | 'loss' | 'draw'
  scoreDiff?: number             // negative = vi ligger under
  homeScore?: number
  awayScore?: number
  opponentName?: string
  opponentShortName?: string
  nextOpponentName?: string
  seasonNumber: number
  roundNumber: number
  // Coach-info för attribution
  coachName?: string
  coachRole?: string             // "Huvudtränare", "Assisterande tränare"
}
```

### `RenderedMedia` (output från picker)

```ts
export interface RenderedMedia {
  id: string                     // ref till MediaItem.id
  type: MediaItemType
  attribution: { name: string; role: string }
  body: string                   // template-renderad med riktiga värden
  timestamp: string              // game-date formaterad ("Omgång 12 · 2026/2027")
}
```

---

## Picker-service

```ts
// src/domain/services/mediaService.ts

import { MEDIA_LIBRARY } from '../data/media/library'
import { mulberry32, hashString } from '../utils/random'
import type { MediaTag, MediaItem, MediaContext, RenderedMedia } from '../data/media/types'

export interface RecentlyShown {
  itemId: string
  shownAtRound: number
}

export function pickMediaItem(
  tag: MediaTag,
  context: MediaContext,
  recentlyShown: RecentlyShown[],
  seed: string
): MediaItem | null {
  const candidates = MEDIA_LIBRARY.filter(item =>
    item.tags.includes(tag) &&
    matchesArchetype(item, context) &&
    matchesSeasonGate(item, context) &&
    notRecentlyShown(item, recentlyShown, context.roundNumber)
  )

  if (candidates.length === 0) {
    // Fallback: drop the recency-filter
    const fallback = MEDIA_LIBRARY.filter(item =>
      item.tags.includes(tag) &&
      matchesArchetype(item, context) &&
      matchesSeasonGate(item, context)
    )
    if (fallback.length === 0) return null
    return pickWithSeed(fallback, seed)
  }

  return pickWithSeed(candidates, seed)
}

export function renderMediaItem(item: MediaItem, context: MediaContext): RenderedMedia {
  const variants = item.variants ?? []
  const allBodies = [item.body, ...variants]
  const variantSeed = hashString(`${item.id}_${context.seasonNumber}_${context.roundNumber}`)
  const rng = mulberry32(variantSeed)
  const body = allBodies[Math.floor(rng() * allBodies.length)]

  return {
    id: item.id,
    type: item.type,
    attribution: {
      name: applyTemplate(item.attribution.name, context),
      role: item.attribution.role,
    },
    body: applyTemplate(body, context),
    timestamp: formatGameDate(context.seasonNumber, context.roundNumber),
  }
}

function applyTemplate(s: string, context: MediaContext): string {
  return s
    .replace(/\{motståndare\}/g, context.opponentShortName ?? '')
    .replace(/\{nextOpponent\}/g, context.nextOpponentName ?? '')
    .replace(/\{playerName\}/g, context.player ? `${context.player.firstName} ${context.player.lastName}` : '')
    .replace(/\{playerLastName\}/g, context.player?.lastName ?? '')
    .replace(/\{coachName\}/g, context.coachName ?? '')
    .replace(/\{coachRole\}/g, context.coachRole ?? '')
    .replace(/\{ourClub\}/g, context.managedClubShortName)
    .replace(/\{round\}/g, String(context.roundNumber))
}
```

Inga nya tester för triviala helpers — testa pickMediaItem, renderMediaItem, applyTemplate.

---

## Trigger-integration

Var i koden press/media-events läggs i queue:

| Trigger-point | Service som anropar | Tag(ar) |
|---|---|---|
| Efter match (managed-klubb) | `roundProcessor` | `post_match_win` / `post_match_loss` / `post_match_draw` (+ blowout-modifierare om scoreDiff ≥ 4) |
| Cup-final scheduled | `anslagService` (parallellt med `cup_final_pre`-anslag) | `pre_cup_final` |
| Cup-final spelad | `roundProcessor` | `post_cup_win` / `post_cup_loss` |
| SM-final scheduled | `anslagService` | `pre_sm_final` |
| SM-final spelad | `roundProcessor` | `post_sm_win` / `post_sm_loss` |
| Skada påförs spelare | `injuryService` | `injury_minor` (≤2v) eller `injury_major` (≥4v) |
| Spelare når 10/20 mål | ny check i `seasonProcessor` | `milestone_goal_10` / `milestone_goal_20` |
| Transfer slutförd | `transferService` | `transfer_arrival` / `transfer_departure` |
| Säsongsstart | `seasonProcessor` | `season_start` |
| Säsongsslut | `seasonProcessor` | `season_end_top3` / `season_end_mid` / `season_end_bottom` |
| 3 förluster i rad | `streakService` (ny) | `crisis_streak` |
| 5/10 vinster i rad | `streakService` (ny) | `success_streak_5` / `success_streak_10` |

### MediaQueue

Items läggs i en `MediaQueue` på SaveGame:

```ts
// SaveGame
mediaQueue: RenderedMedia[]
mediaShownHistory: RecentlyShown[]   // för excludeIfRecent-filter
```

Render-tid: Portal eller InboxScreen läser `mediaQueue` och renderar kort enligt befintliga UI-komponenter (`MediaSection`, `PressReleaseCard`, etc — Batch E:s frontend).

När spelaren ser ett item flyttas det från queue till history. Begränsa history till senaste 30 items för att hålla SaveGame-storlek nere.

---

## Library-organisation

```
src/domain/data/media/
├── types.ts                      # MediaItem, MediaTag, MediaContext
├── index.ts                      # exporterar MEDIA_LIBRARY = [...quotes, ...press, ...interviews]
└── library/
    ├── quotes/
    │   ├── post_match_win.json
    │   ├── post_match_loss.json
    │   ├── post_match_draw.json
    │   ├── streaks.json
    │   └── seasons.json
    ├── pressReleases/
    │   ├── injuries.json
    │   ├── transfers.json
    │   ├── finals.json
    │   └── season_arcs.json
    └── interviews/
        ├── pre_finals.json
        ├── post_milestones.json
        └── post_seasons.json
```

JSON-filerna importeras via `import quotes_post_loss from './library/quotes/post_match_loss.json'`. Alla items i ett fält:

```json
[
  {
    "id": "quote_post_loss_001",
    "type": "quote",
    "tags": ["post_match_loss"],
    "attribution": { "name": "{coachName}", "role": "Coach" },
    "body": "Det blev som det blev mot {motståndare}. Vi gör om det mot {nextOpponent}."
  },
  ...
]
```

`index.ts` flatmap:ar alla filer till en stor `MEDIA_LIBRARY`-array.

---

## Volym-mål för v1

| Type | Tags | Items per tag | Total |
|---|---|---|---|
| Quote | post_match_win/loss/draw + blowout-varianter | 30 per tag | ~150 |
| Quote | streaks (4 tags) | 10 per tag | 40 |
| Quote | season_start/end (4 tags) | 8 per tag | 32 |
| Press release | injuries (2 tags) | 8 per tag | 16 |
| Press release | transfers (2 tags) | 6 per tag | 12 |
| Press release | finals (4 tags) | 4 per tag | 16 |
| Press release | season_arcs (3 tags) | 5 per tag | 15 |
| Interview | pre_finals (2 tags) | 8 per tag | 16 |
| Interview | post_milestones (2 tags) | 6 per tag | 12 |
| Interview | post_seasons (3 tags) | 5 per tag | 15 |
| **Totalt** | | | **~324 items** |

Cirka 270-330 items för v1. Med variants à la 1-2 per item = ~500 unika texter att se. Räcker för 5-6 säsongers spel utan markant upprepning.

Generation tar ~5h med tight prompt-styrning + Jacobs review.

---

## Vad som INTE byggs i v1

- **AI-genererad realtidstext.** Avfärdat. Standalone-principen håller.
- **WebLLM.** För tungt för värdet.
- **Per-spelare-personlighet i citat.** För komplext för v1. Coach och anonyma spelare räcker.
- **Skandalhantering full ut.** `scandal`-tag finns i typ men inga items genereras än — hänger ihop med eventuell skandal-arc-feature senare.
- **Klubbspecifik styling i UI.** Stålvallen är universell.

---

## Implementations-ordning för Code (när detta startas)

1. **Datakontrakt + types** (`types.ts`, `index.ts`-stub) — 1h
2. **Picker-service + tester** (`mediaService.ts`) — 2h
3. **Trigger-integration** (anrop från `roundProcessor`, `anslagService`, `injuryService`, etc) — 3h
4. **MediaQueue i SaveGame + persistance** — 1h
5. **UI-komponenter** (OperatorFeed-separation, MediaSection, PressReleaseCard, InterviewCard, MediaQuote) — 3-4h
6. **Library-import** (JSON-filerna kopplas in) — 0.5h
7. **End-to-end-tester** (trigger → render → display) — 2h

**Total Code-tid: ~12-13h.**

Library-generation körs separat av Jacob+Opus. ~5h.

**Total feature-tid: ~17-18h.**

---

## Riskanalys

**1. Ton-drift i generation.** Mitigation: små batcher (~30 items), tight prompt med anti-pattern-lista, Jacobs review innan commit.

**2. Tag-mismatch.** Trigger-koden anropar tag som ingen item har. Mitigation: TypeScript union-typ för MediaTag (compile-error om tag inte finns), runtime fallback (om inga items matchar → hoppa över, ej krasch).

**3. Variation-illusion.** ~330 items känns mycket men picker väljer från ~30 candidates per tag. Mitigation: `excludeIfRecent`-filter (item kan inte återanvändas inom 5 omgångar), prioritera större library i högfrekventa tags (post-match), spara `mediaShownHistory`.

**4. SaveGame-storlek.** mediaQueue + history växer över tid. Mitigation: cap på history (30 senaste), queue rensas när items visas.

---

## Kvarvarande beslut

Inga blockerare. Alla val är gjorda. Specen är komplett för Code att implementera mot.
