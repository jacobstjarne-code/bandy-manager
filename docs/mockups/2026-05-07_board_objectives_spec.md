# Board Objectives — Portal Secondary Card (revidered)

**Datum:** 2026-05-07
**Spec-typ:** Komplement till befintlig Klubb-tab-rendering, inte ersättning
**Tracker-status:** 🟠 (in-spec utvidgning, status oförändrad — befintlig implementation kvarstår)

## Rot-problem — sanningsjustering

Den ursprungliga audit-anteckningen "boardObjectiveService är inlåst" var fel. Den **renderas redan** i `KlubbTab.tsx` under "🎯 Förväntan & profil"-sektionen (label + ägare + status-icon). Min ursprungliga 2026-05-06-spec utgick från fel premiss — nu reviderad.

**Verkligt gapet:** Klubb-tab är djup placering. Användaren måste:
1. Klicka Klubb-tab
2. Scrolla förbi Ortskartan, Bygdens puls, Lokaltidningen, Frivilliga, Mecenater, Kommun, Anläggning
3. Hitta "Förväntan & profil"
4. Hitta "📋 Styrelsens uppdrag" inom den sektionen

Plus: KlubbTab-renderingen visar **inte progress** — bara status-text ("Aktivt", "I fara", "Uppfyllt"). Spelaren ser inte "78/100 fanMood" eller "2/3 egenfostrade i startelvan". Det är en minor gap för numeric-mål.

## Lösning

Portal-secondary card som visar **1–2 mest akuta** boardObjectives direkt i Portal, med progress-indikator. Klick → navigerar till Klubb-tab + scrollar till sektion (bevarar full kontext för spelaren).

Komplementär — ersätter inte KlubbTab-rendering. Ger snabb summering + progress, full detalj i Klubb-tab.

## API som specen vilar på

```ts
BoardObjective {
  id: string
  type: 'economic' | 'academy' | 'community' | 'sporting'
  label: string                  // "Håll ekonomin i balans"
  description: string            // Owner-quote: "Vi kan inte fortsätta blöda pengar..."
  ownerId: string                // "Sven Eriksson"
  ownerPersonality: string       // för future flavor
  targetValue: number
  currentValue: number
  measureFn: string              // 'balanceBudget', 'playHomegrown', etc.
  status: 'active' | 'met' | 'at_risk' | 'failed'
  assignedSeason: number
  successReward: string
  failureConsequence: string
  carryOver: boolean
}

game.boardObjectives: BoardObjective[]
```

`status` är central för prio. `currentValue` / `targetValue` ger progress.

## Var i Portal

Secondary section. Visa när `game.boardObjectives?.filter(o => o.status !== 'met').length > 0`.

Ordering: **högt** — direkt efter `WeeklyDecisionSecondary`. Eftersom det här är *styrelsens krav* — den högsta hierarkin i klubben — passar det att synas tidigt.

## Prio-ordning vid flera mål

Filtrera bort `status === 'met'` (klart är klart). Sortera resterande:
1. `failed` överst (chock-värde, måste hanteras nästa säsong)
2. `at_risk` (kritisk attention nu)
3. `active` (ok-status, stämning)

Visa max **2** objektiv. Resten är synliga i Klubb-tab.

## Visuell anatomi

Se mock: `2026-05-07_board_objectives_mock.html`

Portal mörk yta. Vänsterstipe `--accent` 2px (innehållstyp).

**Label** — `🎯 STYRELSENS KRAV` (uppercase letter-spaced muted, designsystemets h-label-konvention med emoji-prefix). Konkret språk — det är vad styrelsen *kräver*, inte abstrakt "objectives".

**Per objektiv-rad:**
- Status-icon (samma mapping som KlubbTab: ✅ met / ⚠️ at_risk / ❌ failed / 📌 active)
- Label (h-card 13px ljus weight 600)
- Owner-rad: `S. Eriksson` (12px muted italic Georgia)
- Progress-bar för numeric mål (target > 0): `currentValue / targetValue` med fyllning %
- Chevron `›` längst till höger — affordans-signal som bekräftar klickbarhet (opacity 0.5 default, 1.0 + accent-färg vid hover). Inga separata knappar; hela raden är klickyta enligt Portal-secondary-pattern.

För `balanceBudget`-typ (target 0 — "håll ovanför noll"): visa "+3 200 kr i kassan" eller "−12 400 kr underskott" med danger-färg om negativt. Ingen progress-bar.

Status-färger per spec:
- `met` → success-on-dark (`#A0C890`)
- `at_risk` → warm/danger-warn (`#E8A090`)
- `failed` → danger-warn (`#E8A090`) eller starkare
- `active` → muted (`--text-light-secondary`)

## Klick-beteende

Klick på en rad → navigera till Klubb-tab + scrolla till `#section-board-objectives` (anchor som Code lägger på "Förväntan & profil"-sektionen, eller specifikt på "📋 Styrelsens uppdrag"-block inom den).

Det bevarar full kontext: ägare-citat (`obj.description`), `successReward`, `failureConsequence` syns i Klubb-tab. Portal-card är "snabbblick", Klubb-tab är "full kontext".

## Edge-cases

- **Inga aktiva mål** (alla `met` eller arrayen tom) — kortet renderas inte.
- **Gamla saves** — boardObjectives saknas helt i `migrate`-pass. Komplementär migration-fix utanför scope (Code's separata punkt). När arrayen är tom → kortet visas inte → ok degradering.
- **Säsongsslut-transition** — `met`-mål markeras, nästa säsong genereras nya. Mellan säsonger är arrayen kanske tom — kortet försvinner naturligt.
- **`at_risk` utan numeric progress** — visa status-icon + label + owner. Ingen progress-bar.

## Implementation steg

1. **Skapa komponent:** `src/presentation/components/portal/secondary/BoardObjectivesSecondary.tsx`
2. **Konsumera state:** `useGameStore(s => s.game?.boardObjectives)`
3. **Filtrera + sortera** enligt prio-ordning ovan
4. **Render:** label + max 2 objektiv-rader med progress för numeric mål
5. **Klick-handler:** `navigate('/game/club#section-board-objectives')` eller motsvarande pattern
6. **KlubbTab-justering:** lägg till `id="section-board-objectives"` på "📋 Styrelsens uppdrag"-block (en rad i KlubbTab.tsx) för anchor-scroll
7. **Lägg in i** `initCardBag.ts` likt `WeeklyDecisionSecondary` — weight runt 80, trigger `(game.boardObjectives?.filter(o => o.status !== 'met').length ?? 0) > 0`

## Tester

- Snapshot per status-typ (4 st: active, at_risk, failed, met)
- Two-objective-state: at_risk + failed sorterat korrekt
- Filter: only `met`-mål → komponent returnerar null
- Edge: empty array → null
- Progress-bar för numeric mål (`growFanbase` med `currentValue: 55, targetValue: 70` → 79%)
- npm run build && npm test gröna

## Verifiering i playtest

- Starta säsong → boardObjectives genereras → kortet dyker upp i Portal med "📌 Aktivt"-objektiv
- Spela tills ett mål blir `at_risk` → kortet visar warning-färg + sortering ändrar sig
- Klick på rad → Klubb-tab öppnas, scrollas till sektion
- Säsongsslut → status uppdateras (met/failed) → nästa säsong genererar nya mål

## Inte i scope

- **boardPersonalities migration-fix** — separat Code-fix för gamla saves
- **Owner-quote (`description`) rendering** i Portal-card — behålls i KlubbTab/historik
- **Reward/consequence text** vid säsongsslut — det är säsongsslut-rendering (existing)
- **Realtidssortering om status ändras under sessionen** — komponenten är reaktiv via store, ingen extra logik behövs

## Status efter landning

`boardObjectiveService` förblir 🟠 (befintlig KlubbTab-rendering är fortfarande implementerad). Den extra Portal-secondary-cardet är scope-utvidgning, inte status-progression. När Code implementerar Portal-card + migration-fix + playtest → 🟢.
