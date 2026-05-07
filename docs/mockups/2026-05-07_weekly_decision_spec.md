# Weekly Decisions — Portal Secondary Card

**Datum:** 2026-05-07 (uppdaterad efter Jacobs val av v2 + Veckans-prefix)
**Spec-typ:** Inlåst funktionalitet → Portal-synliggörande
**Tracker-status:** 🔴 Helt inlåst → 🟡 spec+mock klar (väntar implementation)

## Rot-problem

`weeklyDecisionService` genererar veckobeslut deterministiskt med cooldown 3 omgångar. Datan lagras i `game.pendingWeeklyDecision`. Ingen UI-komponent renderar det. Spelaren ser besluten aldrig — de bara ackumuleras tysta.

Det här är audit:s "vad gör spelaren mellan matcher"-fråga konkret. Loop-mekaniken finns redan, fullimplementerad i 308 rader. Det som saknas är synlighet.

## Lösning

Permanent secondary card i Portal som visas när `game.pendingWeeklyDecision` finns. Visar question + två options med effekt-text per option. Klick → dispatch `resolveWeeklyDecision` + outcome-rendering kort + kort försvinner till nästa beslut genereras (efter cooldown).

## API som specen vilar på

```ts
generateWeeklyDecision(game, round) → WeeklyDecision | null
resolveWeeklyDecision(game, decision, choice) → WeeklyDecisionEffect[]

WeeklyDecision {
  id: string
  question: string                    // dynamisk text med character-namn
  optionA: { label, effect, effectColor: 'success' | 'danger' | 'muted' }
  optionB: { label, effect, effectColor }
  category: 'player' | 'supporter' | 'training' | 'community'
  requiredEra?: ('legacy' | 'survival')[]
}

WeeklyDecisionEffect — sju typer (cornerSkill, morale, finances, supporterMood,
  communityStanding, boardPatience, noop)
```

## Var i Portal

Secondary section. Visa när `game.pendingWeeklyDecision !== null`. Ordering: hög prio — direkt efter `BoardObjectivesSecondary` (när det implementeras), före kafferum och journalist.

## Visuell anatomi (vald variant: v2 + Veckans-prefix)

Se mock: `2026-05-07_weekly_decision_mock.html`

Portal mörk yta. Vänsterstipe `--accent` 2px (innehållstyp-markering, kortet klickas via knapparna).

**Label** — kategori-driven med emoji-prefix:

| `category` | Label | Emoji |
|---|---|---|
| `player` | "Veckans spelarfråga" | 🏒 |
| `supporter` | "Veckans supporterfråga" | 📣 |
| `training` | "Veckans träningsbeslut" | 📋 |
| `community` | "Veckans kommunfråga" | 🏛️ |

CSS: `text-transform: uppercase` + `letter-spacing: 2px` på 8px font, color `--accent`, weight 700. Ikon 13px, `filter: saturate(0.85)` så den inte skriker mer än copper-texten.

**Question** — h-card-stil ljus text, 13.5px weight 600 line-height 1.4.

**Options grid** — två likvärdiga knappar, inget val är "primärt":
- `padding: 13px 12px` (förstärkt höjd, kortet bär visuell vikt)
- `background: --bg-portal-elevated` (solid, inte transparent — distinkt från andra Portal-cards)
- `border: 1.5px --accent`
- Label: 14px weight 700 ljus
- Effekt-text under: 11px italic Georgia, färgad enligt effectColor

## Visuella states

| State | Villkor | Rendering |
|---|---|---|
| **Pending** | `pendingWeeklyDecision` finns | Kortet visas fullt — label + question + två CTA-knappar med effekt-text |
| **Resolved** | Just besvarat (1 render-tick) | Question opacity 0.5, knapparna ersätts med check-symbol + outcome-rad. Kortet försvinner nästa render. |
| **None** | `pendingWeeklyDecision === null` | Kortet renderas inte alls |

## Effekt-färgmappning

| effectColor | Hex (mörk yta) | Token | Användning |
|---|---|---|---|
| `success` | `#A0C890` | `--match-positive` | Positiva effekter (+moral, +stämning) |
| `danger` | `#E8A090` | `--match-warn` | Negativa effekter (−moral, −finanser) |
| `muted` | `--text-light-secondary` | — | Neutrala/inga effekter |

## Edge-cases

- **Multiple effekter samtidigt** — vissa beslut returnerar 2 effekter (`away_trip_bus` ger `−3000 finanser` + `+8 supporterMood`). Outcome-text visar båda separerade med " · ".
- **Effekter med playerId** — måste lookup:a spelarnamn från `game.players` för outcome-rendering.
- **`noop`-effekter** — visas som "Ingen direkt effekt" i outcome.
- **Era-gating** är hanterad av `generateWeeklyDecision`. Komponent behöver inte filtrera. Era visas inte i UI:t (osynlig markering), endast kategori.
- **Cooldown** är 3 omgångar — efter resolution visas nästa beslut tidigast 3 omgångar senare. Mellan dessa: kortet renderas inte.

## Implementation steg

1. **Skapa komponent:** `src/presentation/components/portal/secondary/WeeklyDecisionSecondary.tsx`
2. **Konsumera state:** `useGameStore(game => game.pendingWeeklyDecision)`
3. **Render-logik:**
   - `pendingWeeklyDecision === null` → returnera `null`
   - Annars rendera label (`CATEGORY_META[decision.category]` ger ikon + namn) + question + options
4. **Action-dispatch:** Vid knappklick — `resolveWeeklyDecisionAction(decision, choice)` som anropar `resolveWeeklyDecision` och uppdaterar game-state med:
   - Tillämpa `WeeklyDecisionEffect[]` på rätt entiteter (player.attributes.cornerSkill etc.)
   - `pendingWeeklyDecision = null`
   - `weeklyDecisionLastRound = currentRound`
   - `resolvedWeeklyDecisions = [...resolved, ${decisionId}_${currentSeason}]`
5. **Lokal outcome-state** för 1 render-tick (`useState` med timeout) som visar resolution innan komponenten returnerar `null`.
6. **Lägg in i** `PortalSecondarySection.tsx` ordering — efter board objectives.

## Konstantkarta

```ts
const CATEGORY_META: Record<WeeklyDecisionCategory, { icon: string; label: string }> = {
  player:    { icon: '🏒', label: 'Veckans spelarfråga' },
  supporter: { icon: '📣', label: 'Veckans supporterfråga' },
  training:  { icon: '📋', label: 'Veckans träningsbeslut' },
  community: { icon: '🏛️', label: 'Veckans kommunfråga' },
}
```

## Tester

- Snapshot-test för pending- och resolved-states per kategori (4 snapshots)
- Integration-test: klick på optionA → state uppdateras + effekter applicerade
- Edge-test: två effekter (finances + mood) renderar korrekt outcome
- Edge-test: noop-effekt visar "Ingen direkt effekt"
- Edge-test: pendingWeeklyDecision === null → komponent renderar `null`

## Verifiering i playtest

- Spela 3+ omgångar i nytt spel.
- Förvänta: weekly-decision-kort dyker upp någonstans inom första 3 omgångarna.
- Klick på optionA → kortet visar outcome → kortet försvinner → nästa kort kommer tidigast 3 omgångar senare.
- Resolution påverkar faktiska game-state-fält (verifiera via DevTools eller spelarens påverkan i nästa match).
- Alla fyra kategorier ska kunna dyka upp över längre spelperiod.

## Inte i scope

- Beslut-historik (lista över tidigare resolved beslut) — kan komma som separat feature
- Ångrings-funktionalitet — beslut är binding (matchar service-API:t)
- Era-markering i UI — era-gating är osynlig, bara påverkar vilka beslut som genereras
- Tonal-pool för outcome-strängar — använder befintligt `effect`-fält direkt

## Status efter landning

Tracker uppdateras: `weeklyDecisionService` → 🟠 (implementerad, väntar playtest-verifiering) → 🟢 efter Jacob bekräftat synlighet i playtest.
