# Active Arcs — Portal Secondary Card

**Datum:** 2026-05-07
**Spec-typ:** In-säsong-synliggörande av befintligt system
**Tracker-status:** 🟠 → 🟡 efter spec landar

## Rot-problem

`arcService` detekterar och hanterar narrativa bågar (hungrig_breakthrough, joker_redemption, veteran_final_season, derby_echo) under säsongen. Datan finns i `game.activeArcs`. Bågarna går genom faser (`building → climaxing → resolving`) och resulterar i storylines vid säsongsslut.

**Spelaren ser aldrig de pågående bågarna.** Storylines renderas bara på `SeasonSummaryScreen.tsx:386–416` vid säsongsslut. Under säsongen är bågar dolda — vilket är "inlåst-problemets" kärna för detta system. Spelaren upplever inte spänningen i Olles malsökta målmånad eller veteranens sista säsong löpande.

## Lösning

Portal-secondary card som visar pågående arcs under säsongen. Visar arc-typ + relaterad spelare + fas + tidslinje (matcher kvar till expires). Passivt — kortet ber inte spelaren göra något, bara informerar.

## API som specen vilar på

```ts
ActiveArc {
  id: string
  type: 'hungrig_breakthrough' | 'joker_redemption' | 'veteran_final_season' | 'derby_echo'
  playerId?: string
  startedMatchday: number
  phase: 'building' | 'climaxing' | 'resolving'
  eventsFired: string[]
  decisionsMade: string[]
  expiresMatchday: number
  data?: { gamesWithoutGoal?: number, ... }
}

game.activeArcs: ActiveArc[]   // Max 2 aktiva non-derby
```

`derby_echo` är speciell — kort fönster runt derbymatcher. Visar inte i Portal-card (det är en match-spec mekanik, inte säsongsbåge).

## Var i Portal

Secondary section. Visa när `game.activeArcs?.filter(a => a.type !== 'derby_echo' && a.phase !== 'resolving').length > 0`. Ordering: efter `WeeklyDecisionSecondary`, efter board objectives. Innan kafferum.

Om flera aktiva arcs (max 2): rendera båda i samma kort med separator, eller bara visa den högsta-prioriterade (climaxing > building). Mocken visar två-arc-state.

## Visuell anatomi

Se mock: `2026-05-07_active_arcs_mock.html`

Portal mörk yta. Vänsterstipe `--accent` 2px (innehållstyp-markering).

**Label** — `📖 I BLICKFÅNGET` (uppercase letter-spaced muted, designsystemets h-label-konvention med emoji-prefix). Vardaglig, beskriver funktionen — vilka personer matchen handlar om utöver själva resultatet. Inte intern jargong som "pågående berättelser" eller "narrative arcs".

**Per arc-rad:**
- Arc-emoji (per type, samma som SeasonSummaryScreen storylineEmoji-mapping)
- Headline: dynamisk text som beskriver bågens nuläge ("Olle Sundström — 4 matcher utan mål", "Lars Berg — sista säsongen")
- Fas-indikator: tre prickar där aktiva fas är fylld accent, övriga är tom border (building → ●○○, climaxing → ●●○, resolving → ●●●)
- Tidslinje: "3 omgångar kvar" eller "till seriestart" baserat på `expiresMatchday - currentMatchday`
- Chevron `›` längst till höger — affordans-signal som bekräftar klickbarhet (opacity 0.5 default, 1.0 + accent-färg vid hover). Inga separata knappar; hela raden är klickyta enligt Portal-secondary-pattern.

**Klickbart:** klick → spelarkort om `playerId` finns. Annars no-op.

## Headline-pool per arc-typ

Code skriver textpool i `src/domain/data/activeArcStrings.ts` (ny fil):

```ts
export const ARC_HEADLINES: Record<ArcType, (arc: ActiveArc, player?: Player) => string> = {
  hungrig_breakthrough: (arc, p) => 
    `${p?.firstName[0]}. ${p?.lastName} — ${arc.data?.gamesWithoutGoal ?? '?'} matcher utan mål`,
  
  joker_redemption: (arc, p) => 
    `${p?.firstName[0]}. ${p?.lastName} — efter utvisningen`,
  
  veteran_final_season: (arc, p) => 
    `${p?.firstName[0]}. ${p?.lastName} — sista säsongen`,
  
  derby_echo: () => '',  // visas inte
}
```

Frasering är **stillsam, inte dramatisk** — matchar designsystemets "brukets själ, inte kostym". Inte "ÖDESMÄTT MATCH FÖR LARS!" utan "Lars Berg — sista säsongen".

## Phase-progression-emoji

| Fas | Indikator | Betydelse |
|---|---|---|
| `building` | ●○○ | Bågen byggs upp, ingen klimax än |
| `climaxing` | ●●○ | Klimax nära — nästa 1-2 matcher avgör |
| `resolving` | ●●● | Bågen är slut (visas inte — då blir det storyline vid säsongsslut) |

## Edge-cases

- **Ingen aktiv arc** — kortet renderas inte alls (returnera `null`)
- **playerId saknas** — visa headline utan namn-koppling (för derby_echo, men den filtreras ändå)
- **Båge nära expires** (≤ 1 omgång kvar) — kan färga tidsline-text accent-dark eller `--warm` för att signalera urgensi
- **Två arcs samtidigt** — båda renderas. Ordna efter phase (climaxing överst).
- **Spelaren har avslutat säsong** — `phase === 'resolving'` filtreras bort i query, kortet visas inte mellan säsonger.

## Implementation steg

1. **Skapa textpool:** `src/domain/data/activeArcStrings.ts` — `ARC_HEADLINES`-mapping ovan.
2. **Skapa komponent:** `src/presentation/components/portal/secondary/ActiveArcsSecondary.tsx`
3. **Konsumera state:** `useGameStore(s => s.game?.activeArcs)`
4. **Filtrera:** non-derby + non-resolving
5. **Rendering:** label + arc-rader (max 2)
6. **Klick på rad med playerId** → navigera till spelarkort (`navigate('/game/squad?player=' + playerId)` eller motsvarande pattern)
7. **Lägg in i** `PortalSecondarySection.tsx` ordering / `initCardBag.ts` som `WeeklyDecisionSecondary` gjordes

## Tester

- Snapshot per arc-typ (3 st pending-state)
- Two-arc-state snapshot
- No-arc-state: returnerar null
- Edge: arc i resolving filtreras bort
- npm run build && npm test gröna

## Verifiering i playtest

- Spela en säsong med en hungrig U21-spelare som inte gör mål på 3+ matcher → arc triggas → kortet dyker upp i Portal
- Klick på rad → spelarkort öppnas
- Spela tills spelaren gör mål → arc går till resolving → storyline skapas → kortet försvinner från Portal
- Vid säsongsslut: storyline visas i SeasonSummaryScreen (befintlig rendering)

## Inte i scope

- Inbox-events vid phase-transitions ('building → climaxing') — kan komma i nästa iteration när Portal-card är 🟢
- Audio/notif-pingar vid arc-trigger
- Manuell trigger eller dismissal av arcs

## Status efter landning

`arcService` → 🟡 (spec+mock klar, in-säsong-yta) → 🟠 efter Code implementation → 🟢 efter playtest-bekräftelse.
