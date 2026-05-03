# Diagnos — MATCH_GOAL_DIFFERENCE_CAP kringgås (2026-05-03)

## Symptom
Skutskär 17–1 Rögle vid halvtid i live-match.

## Undersökning: alla goal-paths i matchCore.ts

Funktionen `canScore(attackingHome, hs, as_)` returnerar false om:
- `hs + as_ >= MATCH_TOTAL_GOAL_CAP (17)`, ELLER
- `Math.abs(newDiff) > MATCH_GOAL_DIFFERENCE_CAP (6)`

### Paths i matchCore.ts

| Rad  | Path                          | canScore-check?  |
|------|-------------------------------|------------------|
| 807  | Penalty (call site)           | ✓ inuti resolvePenaltyTrigger rad 615 |
| 833  | Attack-skott                  | ✓ rad 828        |
| 897  | Transition (omställning)      | ✓ rad 892        |
| 978  | Corner-mål                    | ✓ rad 974        |
| 1008 | Corner counter-attack         | ✓ rad 1005       |
| 1043 | Halfchance                    | ✓ rad 1039       |
| 1619 | Övertid                       | ✓ rad 1615       |

**Alla paths i matchCore.ts respekterar canScore-checken.**

## Rotorsak

`MatchLiveScreen.tsx` innehåller 4 separata handlers för interaktiva moment
där spelaren väljer utfall. Ingen av dem anropar `canScore`:

| Handler           | Rad   | canScore? |
|-------------------|-------|-----------|
| `handlePenaltyChoice`  | 604–605 | ✗ SAKNAS |
| `handleCornerChoice`   | 544–545 | ✗ SAKNAS |
| `handleCounterChoice`  | 667–668 | ✗ SAKNAS |
| `handleFreeKickChoice` | 724–725 | ✗ SAKNAS |

När spelaren gör en straff, hörna, omställning eller frislag i live-match
läggs målet till direkt i `setSteps()` utan att kolla om diff-capen är nådd.
`regenerateRemainderWithUpdatedScore` tar sen det uppdaterade resultatet
som ingångsvärde för resten av matchen — capen gäller då för nya auto-mål
men det interaktiva målet har redan passerat.

## Varför 17–1 är möjligt

1. Profil `chaotic` (PROFILE_GOAL_MODS 1.55) + `largeCaDiff` (wOpen += 15)
   + powerplay-multiplikatorer ger hög målfrekvens i auto-sim.
2. Auto-sim begränsas av canScore — stannar vid diff=6.
3. Men: spelaren kan manuellt göra mål via interaktiva moments UTAN cap.
4. Kombinationen: auto-sim når 6–1, spelaren gör 3 interaktiva mål (9–1),
   auto-sim blockeras igen vid 9–1, men spelaren kan göra fler...
5. Sammantaget kan resultatet bli 17–1 om spelaren spelar många interaktiva
   moments mot ett svagt motstånd med chaotic-profil.

## Fix

Lägg till canScore-check i de 4 handlers i MatchLiveScreen.tsx.
Importera MATCH_GOAL_DIFFERENCE_CAP och MATCH_TOTAL_GOAL_CAP från matchCore,
eller beräkna inline: `Math.abs(hs+1-as) > 6 || hs+as >= 17 → skippa mål`.
