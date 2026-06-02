# Spec — Code implementation C-SD2 Portal-eskalering

**Design-mock:** `docs/mockups/2026-06-01_design_sd2_portaleskalering.html`
**Copy-pool:** `docs/2026-06-01_copypool_upptakt.md` (Opus)

Bygg fem-stegs-eskalering: grundserie → upptakt → kvart → semi → final. Final-estetiken är redan byggd (Design verifierade i kod: `roundmark.gold`, `primary-weight-3`, `series-game.next.gold`, gold-CTA). **Gapet är warm-mellansteget** mellan accent och gold. Inga nya color-tokens — bygg på existerande `--warm` / `--warm-light`.

## Designval bekräftade (Opus svar på Designs öppna frågor)

1. **Upptakt-trigger:** exakt 3 omg kvar av grundserien + sub-state matematiskt på spel
2. **Mittfält-utan-dramatik:** ingen upptakt visas. Vanlig portal kvarstår tills kvart börjar
3. **Copy-pools per sub-state:** levererade i `copypool_upptakt.md`

## Komponenter att bygga

### Nya CSS-klasser

Alla bygger på befintliga tokens (`--warm`, `--warm-light`):

- `.portal-roundmark.warm` — RoundMark warm-färgvariant (kvart + semi)
- `.primary-weight-2-warm` — primary-vikt mellan w2 och w3 (semi + farozon-upptakt). Border warm, header-gradient warm
- `.phasemark.warm` — PhaseMark warm-variant (upptakt). Border-top + bakgrund i warm gradient
- `.cta.warm` — warm CTA-variant (upptakt, kvart, semi). Linear-gradient warm-light → warm
- `.series-game.next.warm` — warm next-dot (semi när matchpuck/avgörande)
- `.crit` — text-modifier för "Matchpuck"/"Avgörande" på RoundMark + primary. Visas i warm-light (warm-läge) eller gold (final)
- `.upptakt-countdown` — pip-rail + text (ny komponent)
- `.upptakt-bottenstrid` — helper-text-färg cold istället för warm (sub-state-modifier)

### Nya komponenter

**`UpptaktCountdown`** — pip-rail + text. Pips = remainingRounds. Pip-styling: warm 9×9px. Text interpolerar `{N}` med remainingRounds från copy-pool.

**`PhaseMark` warm-variant** — utöka existerande `PhaseMark` med `tone?: 'accent' | 'warm' | 'gold'` prop (default `accent`). En gång per säsong (samma engångs-pattern som R3:s "Slutspelet börjar"-PhaseMark).

### portalEscalationResolver.ts (ny)

```ts
type EscalationSubState = 'sakrat' | 'farozon' | 'mittfalt' | 'bottenstrid' | null;

function getEscalationSubState(game: SaveGame): EscalationSubState {
  const remaining = ROUNDS_PER_SEASON - game.currentMatchday;
  if (remaining > 3 || remaining < 1) return null;
  if (game.seasonPhase !== 'regular') return null;
  
  const standing = computeManagedStanding(game);
  const playoffCutoff = 8; // topp 8 till slutspel
  const relegationCutoff = 14; // botten 2 åker direkt
  
  // bottenstrid: matematiskt omöjligt att nå slutspelet
  if (standing.maxPossiblePlace > playoffCutoff) {
    // är kvalplatsen på spel?
    if (standing.minPossiblePlace >= relegationCutoff - 2) return 'bottenstrid';
    return 'mittfalt'; // utom räckhåll både uppåt och nedåt
  }
  
  // säkrat: garanterad slutspelsplats
  if (standing.maxPossiblePlace <= playoffCutoff) {
    // kämpar om seedning?
    if (standing.minPossiblePlace < standing.maxPossiblePlace) return 'sakrat';
    return 'mittfalt'; // cementerad placering
  }
  
  // farozon: matematiskt på spel
  return 'farozon';
}
```

`computeManagedStanding` returnerar `{ currentPlace, points, minPossiblePlace, maxPossiblePlace }` baserat på återstående omgångar × max poäng + konkurrenters läge. Helper bör finnas eller byggas i `clubStandingService` om saknas.

### Upptakt-trigger

Visa UpptaktPortal när `getEscalationSubState(game) !== null && getEscalationSubState(game) !== 'mittfalt'`. PhaseMark engångs — markera `phaseMarksSeen` efter visning, samma pattern som R3.

### Primary card-rendering per läge

| Läge | Primary-klass | Crit-tag | Series-tracker |
|---|---|---|---|
| Grundserie | `w1` | — | — |
| Upptakt säkrat | `w2-warm` | — | — |
| Upptakt farozon | `w2-warm` | `must-win` (om sex-poängsmatch) | — |
| Upptakt bottenstrid | `w2-warm` (cold-tonad helper) | `must-win` (om sex-poängskval-match) | — |
| Kvart | `w2` | — | best-of-5 |
| Semi | `w2-warm` | `crit` (om matchpuck) | best-of-5 m. warm next |
| Final | `w3` (befintlig) | `crit` | best-of-5 m. gold next |

### Copy-pool-integration

Parsea `docs/2026-06-01_copypool_upptakt.md` till TypeScript-data i `src/domain/data/upptaktCopy.ts`. Slumpa med no-repeat-tracker per pool och spelinstans. Countdown-text interpolerar `{N}` med faktisk remainingRounds.

## Vad RÖRS INTE

Final-portalen är redan byggd och korrekt — Design verifierade i kod. Rör inte:
- `.portal-roundmark.gold`
- `.primary-weight-3` (gold-gradient, box-shadow gold-glow, title 22px)
- `.series-game.next.gold` (19px + glow)
- `.btn-cta.btn-gold`

## Migrationsordning

1. CSS-klasser (warm-varianter) + `UpptaktCountdown`-komponent
2. `portalEscalationResolver` + sub-state-detection + `computeManagedStanding` om saknas
3. PhaseMark `tone="warm"` utbyggnad + engångs-markering
4. Upptakt-portal-rendering med copy-pool-integration
5. Kvart/semi: RoundMark warm + primary-weight-warm + warm CTA + warm next-dot (på semi vid matchpuck)
6. Crit-tag rendering på primary + RoundMark
7. Verifiera i dev-galleriet alla fem steg

## Verifiering

Dev-galleri-utbyggnad: `/dev/scenes/portal-escalation` med fem tillstånd sida vid sida + per upptakt-sub-state (säkrat/farozon/bottenstrid). Pixel-jämför mot Designs mock. Lägg till tests för `portalEscalationResolver` mot edge-cases:
- 3 omg kvar, säkrad topp 4 → sakrat
- 3 omg kvar, ±3p från strecket → farozon
- 3 omg kvar, cementerad mittfält → mittfalt (ingen upptakt)
- 3 omg kvar, matematiskt utom räckhåll men kvalrisk → bottenstrid
- 3 omg kvar, säker mittfält utan kvalrisk → mittfalt (ingen upptakt)

## Filer som rörs (verifiera vid bygge)

- `src/presentation/styles/portal.css` (eller motsv. — warm-CSS-klasser)
- `src/presentation/components/portal/PortalRoundMark.tsx` (warm-variant)
- `src/presentation/components/portal/PortalPhaseMark.tsx` (tone-prop)
- `src/presentation/components/portal/UpptaktCountdown.tsx` (ny)
- `src/presentation/screens/PortalScreen.tsx` (upptakt-rendering, sub-state-resolver-anrop)
- `src/application/services/portalEscalationResolver.ts` (ny)
- `src/application/services/clubStandingService.ts` (computeManagedStanding om saknas)
- `src/domain/data/upptaktCopy.ts` (ny)
- `src/domain/entities/SaveGame.ts` (eventuellt `phaseMarksSeen` utbyggnad om upptakt-PhaseMark är ny key)

Antaget med osäkerhet — verifiera filsökvägar vid bygge.
