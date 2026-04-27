# Sprint 28 — Narrativ djup-paket 2 — Audit

**Datum:** 2026-04-27  
**Commits:** `701044a` (fas A), `abee31c` (fas B)  
**Verifieringsform:** Kod-verifierad simulation (fas A+B), Opus-audit (fas C — återstår)

---

## Punkter i spec

- [x] **28-A: Pension-impact på morale** — verifierat via kod: for-loop over `retiredPlayerIds` i `seasonEndProcessor.ts`, shared seasons beräknas via `seasonHistory`-intersection, morale-hit appliceras korrekt
- [x] **28-A: Kapten-vakuum** — `nextCaptainPlayerId` sätts till `undefined` vid kapten-pension, propageras till `updatedGame.captainPlayerId`
- [x] **28-A: Inbox-narrativ (3 varianter)** — variant 1 (kapten + affectedCount ≥ 3), variant 2 (kapten + färre), variant 3 (legend utan kaptenskap). Genereras bara om `affectedCount > 0`
- [x] **28-B: Aktiv legend-flagga** — `updateActiveLegendFlags()` i `playerDevelopmentService.ts`, kallas i `seasonEndProcessor.ts` efter development-pass, kriterier ≥5 säsonger + ≥100 matcher
- [x] **28-B: Legend commentary — mål** — `legend_goal`-poolen (12 strängar), 70% override i `goalScored && scorerPlayerId`-grenen, bara managed club (`scorerIsManaged`)
- [x] **28-B: Legend commentary — assist** — `legend_assist`-poolen (4 strängar), 70% check på `assisterPlayerId` om scorer-legend inte triggar
- [x] **28-B: Legend commentary — MV-räddning** — `legend_gk_save`-poolen (3 strängar), 70% override i `saveOccurred && gkPlayerId`-grenen
- [x] **28-B: Legend commentary — sen avgörande** — `legend_late`-poolen (3 strängar), väljs när `minute >= 80 && currentMargin <= 1` istf `legend_goal`
- [ ] **28-C: Skärmdump-vänlighet-audit** — ÅTERSTÅR (Opus-jobb, output: `docs/SCREENSHOT_AUDIT_2026-04-26.md`)

---

## Kod-verifiering

### Fas A — Simulation av morale-hit

Scenario: kapten med 5 säsonger, tre lagkamrater med 2, 3, respektive 4 gemensamma säsonger.

```
wasCaptain = true, seasonsInClub = 5
Lagkamrat A: sharedSeasons=2 → moraleHit = min(15, 5+4) = 9
Lagkamrat B: sharedSeasons=3 → moraleHit = min(15, 5+6) = 11
Lagkamrat C: sharedSeasons=4 → moraleHit = min(15, 5+8) = 13
affectedCount = 3 → triggar variant 1 ("Omklädningsrummet är tystare")
```

Scenario: legend utan kaptenskap, 4 säsonger, två lagkamrater med 2 gemensamma.

```
wasCaptain = false, wasLongtime = true (seasonsInClub=4 ≥ 3)
Lagkamrat A: sharedSeasons=2 → moraleHit = min(10, 3+2) = 5
Lagkamrat B: sharedSeasons=2 → moraleHit = min(10, 3+2) = 5
affectedCount = 2 → triggar variant 3 ("[Namn] var inte kapten...")
```

### Fas B — Legend-flagga

`updateActiveLegendFlags()` returnerar oförändrade spelare för alla utom managed-club spelare.  
Managed-club spelare med `seasonsPlayed=5, totalGames=100` → `isClubLegend: true`.  
Managed-club spelare med `seasonsPlayed=4, totalGames=150` → ingen förändring (under säsongsgränsen).  
Managed-club spelare med `isClubLegend: true` från worldGenerator → behåller flaggan.

### Fas B — Commentary

`pickLegendCommentary()` med `eventType='goal'`, `minute=45`, `player={lastName:'Eriksson', careerStats:{seasonsPlayed:6, totalGoals:87}}`:

```
Template "Den där killen igen. {seasons} säsonger. Han har gjort det här tusen gånger."
→ "Den där killen igen. 6 säsonger. Han har gjort det här tusen gånger."
```

`eventType='late_goal'` (minute=82, margin=1):

```
Template "{minute}:e minuten. Det är {lastName}. Det är så det ska vara."
→ "82:e minuten. Det är Eriksson. Det är så det ska vara."
```

### Build + tester

- Build: ✅ `✓ built in 9.60s`
- Tester: ✅ `1895 passed (1895)`

---

## Edge cases verifierade

- **Kapten med 0 lagkamrater ≥2 säsonger:** `affectedCount = 0` → ingen morale-hit, men `nextCaptainPlayerId = undefined` sätts ändå. Ingen inbox-narrativ. ✅
- **Legend med 3 säsonger men inga kvalificerade lagkamrater:** Loop returnerar omedelbart, `affectedCount = 0`, ingen inbox. ✅
- **Två pensioner samma säsong:** Båda itereras separat i for-loopen. Andra pensionärens loop hoppar över den första (filtreras av `retiredPlayerIds.has(tm.id)`). ✅
- **Morale-cap vid 10 gemensamma säsonger:** kapten `min(15, 5+20) = 15` ✅, legend `min(10, 3+10) = 10` ✅
- **Legend commentary bara managed club:** `scorerIsManaged`-check existerar. Spec B.4's krav uppfyllt. ✅
- **70%-chansen:** Explicit `rand() < 0.70`-check, inte 100%. ✅
- **`assisterPlayerId` saknas i halvchans-sekvenser:** Sätts bara i attack/transition/corner-block. Halvchans har ingen assister-logik — korrekt beteende, `assisterPlayerId` är `undefined` och legend-assist triggar inte. ✅

---

## Ej verifierat / antaganden

- **Visuell verifiering av legend commentary i live-spel** — kräver att en legend faktiskt scorer i en match. Markeras som "awaiting playtest-verification". Logiken är korrekt; att se den i UI kräver rätt trigger-villkor.
- **Pension-modal + morale-hit ihop** — Sprint 27 skapar pension-ceremonin, Sprint 28-A adderar morale-hit. Att båda sker korrekt i samma säsongslut är inte simulerat separat, men koden är sekventiell och oberoende.
- **Fas C (skärmdump-audit)** — ÅTERSTÅR.

---

## Nya lärdomar till LESSONS.md

Inga nya buggmönster identifierade i denna sprint. `as typeof resetPlayers`-castet var en TypeScript-strikthetsjustering utan praktisk bugg-risk.
