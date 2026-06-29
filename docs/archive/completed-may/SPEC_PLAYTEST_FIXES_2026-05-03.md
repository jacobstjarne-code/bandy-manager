# SPEC_PLAYTEST_FIXES_2026-05-03

**Datum:** 2026-05-03
**Författare:** Opus
**Status:** ✅ LEVERERAD 2026-05-03 (alla 5 åtgärder, awaiting browser-playtest)
**Estimat:** 1-2 dagar
**Beroende:** Inga akuta. Granska-omarbetning ligger redan i origin/main.

---

## LEVERANS—SAMMANFATTNING

| Åtgärd | Vem | Resultat |
|---|---|---|
| P5 (?-knapp border) | Opus direkt | `border: 'none'` på frågetecken-knappen i `GameHeader.tsx`. |
| P2 (skott vs skott på mål) | Code | `shotsHome/Away` + `onTargetHome/Away` inkrementeras nu vid hörn- och straffmål. Stress-test: `onTarget ≤ shots` håller. |
| P3 (shotmap dense) | Code | `seenLabels`-Set mot staplade spelar-labels. `oppDotScale` (1.0→0.6) + `oppDotOpacity` (0.75→0.5) skalning vid >30 prickar. |
| P1.A (cap kringgicks) | Code | `interactiveCanScore()` i MatchLiveScreen — cap-check i alla 4 interaktiva live-match paths (corner-zon, penalty-trigger, free-stroke, breakaway). Lessons #26. |
| P1.C (profile-explosion) | Code | `PROFILE_GOAL_MODS.chaotic` 1.55→1.35. `wOpen += 15` → `wOpen += 10` vid largeCaDiff. Mål/match ~8.97 (target 9.12). |
| P1.B (per-spelare-cap) | Code | Variant C: hård cap 5 + soft brake ×0.7 från 2:a målet via `adjustedWeights` i `getGoalScorer`. `goalsByPlayer` lyft som closure-variabel. |
| P4 (Portal-dubblering) | Code | `hasCriticalEvent` + `EventPrimary` filtrerar nu på `(e.priority ?? getEventPriority(e.type)) === 'critical'`. Lessons #27. |

Alla fixar awaiting browser-playtest. Se `HANDOVER_2026-05-03.md` för playtest-checklista.

---

## EFTERÅT—ARBETSSÄTTS-NOTERING

Denna spec skrevs i v1-form utan att följa CLAUDE.md princip 4 (mock-driven design) för P3 och P4. En föreslågen v2 med mocks och pre-spec cross-check planerades men levererades aldrig. V1 kördes igenom Code och fungerade — men det fungerade *trots* arbetssättsbristen, inte tack vare den. För framtida visuell omarbetning gäller princip 4 strikt enligt DECISIONS 2026-04-27.

---

## URSPRUNGLIG SPEC (BEHÅLLEN FÖR SPÅRBARHET)

## VARFÖR

Live playtest 2026-05-03 visade 5 separata buggar. Tre kritiska, en kosmetisk, en notering. Inga av dem kan fixas isolerat utan rotorsaksanalys eftersom:

- Match engine-bugg är inte "sänk värdena" — det är "varför kringgås capen"
- Stat-beräkning + shotmap delar samma datakälla — fixa fel ordning ger regression
- Portal-buggen är ny från Granska-omarbetningen — ska diagnostiseras innan fix

---

## P1 — MATCH ENGINE: 17–1 i halvtid, Kronqvist 10 mål på halvlek

**Symptom:** Skärmdump visar Skutskär 17–1 Rögle vid HALVTID. Kronqvist gör 10 mål på 30 steg.

**Tre separata buggar.**

### P1.A — `MATCH_GOAL_DIFFERENCE_CAP = 6` kringgås

**Förvänt beteende:** Capen i `matchCore.ts` rad ~480 säger att om diff > 6 ska inga fler mål registreras till ledande lag.

**Faktiskt beteende:** Match nådde diff 16 (17–1).

**Diagnostisera först. Inga ändringar än. Code ska:**

1. Sök i `matchCore.ts` efter alla ställen som ökar `homeScore` eller `awayScore`. Lista dem.
2. För varje ställe: verifiera att `canScore(...)` anropas FÖRE inkrementeringen.
3. Specifikt kolla:
   - Penalty path (`resolvePenaltyTrigger`) — anropas `canScore` korrekt?
   - Corner counter-attack path (defendingStarters scorerare efter hörna) — kollar den `canScore(!isHomeAttacking, ...)`?
   - Overtime block — `canScore` finns där, men dubbelkolla.
4. **Om en path saknar `canScore`-check:** dokumentera vilken, lägg till checken, kör 200-match stress-test, verifiera att inga matcher har diff > 6.

**Rapportera:** Skriv en kort diagnos-rapport (`docs/diagnos/2026-05-03_match_cap_bug.md`) som listar varje goal-path och om den respekterar capen. Sen fix.

### P1.B — Per-spelare-mål-ceiling: VARIANT C VALD

**Hård cap 5 mål/match + soft brake ×0.7 från 2:a målet.**

**Implementation:**

I `getGoalScorer` (eller i anropande funktion), efter weight-beräkning men före `pickWeightedPlayer`:

```typescript
// Per-player goal ceiling — variant C (hard cap 5, soft brake ×0.7 from 2nd goal)
const adjustedWeights = nonGK.map((p, i) => {
  const goalsThisMatch = goalsByPlayer[p.id] ?? 0
  if (goalsThisMatch >= 5) return 0  // hard cap
  if (goalsThisMatch >= 2) return weights[i] * Math.pow(0.7, goalsThisMatch - 1)
  return weights[i]
})
```

`playerGoals` är scope:at till `simulateMatchCore` — `getGoalScorer` har inte access. Code måste lyfta `goalsByPlayer` som parameter eller closure-variabel.

### P1.C — Profile-explosion vid largeCaDiff

**Symptom:** När CA-gap > 15 trigger `largeCaDiff`, vilket lägger `wOpen += 15`. Plus `chaotic`-profil 1.55× goalmod. Kombinerat med powerplay (×1.20) och trailing-boost (×1.16-1.48) blir det multiplikativ explosion.

**Fix:** Sänk `PROFILE_GOAL_MODS.chaotic` från 1.55 → 1.35, OCH `wOpen += 10` istället för 15.

Verifiera med 200-match stress-test att seasonal goal-snitt fortfarande sitter (~10/match).

---

## P2 — STAT-BERÄKNING: 8 skott / 22 på mål är omöjligt

**Symptom:** GranskaScreen visar Skutskär 8 skott · 22 på mål · 77% konv. 22 > 8 är omöjligt.

**Rotorsak:** `shotsHome/shotsAway` inkrementeras inte i corner- och penalty-paths.

**Verifiera i `matchCore.ts`:**

1. **Attack path:** `if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }` — finns ✓
2. **Transition path:** Samma — finns ✓
3. **Halfchance path:** Samma — finns ✓
4. **Corner path:** `shotsHome/Away` inkrementeras INTE. Bara `cornersHome/Away`.
5. **Penalty path (`resolvePenaltyTrigger`):** Verifiera om shotsHome++ inkluderas vid straff. Förmodligen inte.

**Fix i corner-path**, när hörn-mål eller hörn-räddning sker:

```typescript
// Hörna räknas som skott på mål om mål eller räddning
if (cornerGoalScored || cornerSaved) {
  if (isHomeAttacking) { shotsHome++; onTargetHome++ } else { shotsAway++; onTargetAway++ }
}
```

**Fix i penalty-path:** När straffmål eller räddning sker, `shotsHome++` + `onTargetHome++` (eller away).

**Verifiera efter fix:**
- Stress-test 200 matcher
- För varje match: assertion `onTarget <= shots`
- För varje match: assertion `goals <= onTarget`

---

## P3 — SHOTMAP: koordinatfel + label-overflow

**Symptom A:** Skärmdumpen visar 82 röda prickar i bottenzonen — klustrar visuellt sönder.

**Symptom B:** Gröna prickar i topzonen har staplade labels ("Kronqvist" 6 gånger ovanpå varandra).

**Fix A — för-många-prickar:**

När `oppDots.length > 30`: skala ner `r` (cirkel-storlek) och sänk opacity.

```typescript
const oppDotScale = oppDots.length > 30 ? 0.6 : 1.0
const oppDotOpacity = oppDots.length > 30 ? 0.5 : 0.75
// Applicera på r och opacity i oppDots.map(...)
```

**Fix B — staplade labels:**

```typescript
const seenLabels = new Set<string>()
{dots.map((d, i) => {
  const showLabel = d.label && !seenLabels.has(d.label)
  if (d.label && showLabel) seenLabels.add(d.label)
  // rendera prick. Om showLabel: rendera text också.
})}
```

---

## P4 — PORTAL: dubbelrendering med vit bakgrund

**Symptom:** Portal visar ETT ljust kort med knappar ("Acceptera 50 tkr" / "Kräv mer 65 tkr" / "Avslå") OCH ett mörkt kort under med "HÄNDELSE KRÄVER SVAR — Hantera händelse" CTA. Samma transferbud-event renderas dubbelt.

**Diagnostisera först.** Code ska:

1. Inspektera vilka komponenter som renderar event-data i Portal.
2. Identifiera varför transferbud-event renderas av både inline-card och overlay/CTA.
3. **Misstanke:** Granska-omarbetningen skapade `postMatchEventService.ts` som lade `fanLetter` och `opponentQuote` i `pendingEvents`. Om något i den patchen råkade påverka hur kritiska events (transferbud) hanteras i Portal-flödet är det rotorsaken.

**Rapportera:** Diagnos-fil `docs/diagnos/2026-05-03_portal_dubblering.md`. Sen fix.

**Förmodlig fix:** Verifiera att `attentionRouter` returnerar `critical` för transferbud och att EventCardInline i PortalEventSlot hoppar över critical events (det ska den göra via `if (event.priority === 'critical') return null`). Om den checken saknas eller kringgås — lägg till den.

---

## P5 — FRÅGETECKEN-RING (kosmetisk)

**Fix i `GameHeader.tsx`:** Ta bort `border: '1.5px solid var(--border)'` på `?`-knappen.

```typescript
// Ta bort denna rad från ?-knappens style-objekt:
border: '1.5px solid var(--border)',
```

---

## NOTERING — Portal omg 1 är gles

Inte bug. Lägg till i KVAR.md:

> Portal omg 1 säsong 1 är gles — ingen bygd-, spelare- eller patron-data hunnit ackumuleras. Specifikt välkomstkort eller sänkt tröskel för secondary-cards behövs. Inte akut.

---

## IMPLEMENTATIONSORDNING

**INTE parallellt. Exakt denna ordning:**

1. **P5** — 5 min. Snabb commit.
2. **P2** — fix + stress-test 200 matcher med assertion `onTarget <= shots`.
3. **P3** — beror på P2 (samma datakälla).
4. **P1.A** — diagnos-fil FÖRST, sen fix.
5. **P1.C** — 1.35 chaotic + wOpen += 10. Stress-test.
6. **P1.B** — variant C implementation.
7. **P4** — diagnos-fil FÖRST, sen fix.

**Mellan varje:** `npm run build && npm test`. Commit per åtgärd.

---

## REGLER FÖR CODE

1. **Inga "förbättringar".** Spec-givna värden kopieras bokstavligen.
2. **Diagnos före fix för P1.A och P4.** Diagnos-fil i `docs/diagnos/` innan kodändring.
3. **Stress-test för P1 och P2** — 200 matcher headless.
4. **Per commit:** Build + test + stress-körning för P1/P2.

---

## VERIFIERINGSPROTOKOLL

Code spelar 3 matcher i webbläsaren efter alla fixes:
1. En "normal" match (jämbördiga lag)
2. En outlier-match (stort CA-gap)
3. En cup-match med managed-klubben

För varje:
- Skärmdump av Granska-statistik (verifiera `shotsOnTarget <= shots`)
- Skärmdump av Shotmap (labels inte staplade, prickar inte överskuggar)
- Skärmdump av halvtidsmodal (inga 17–1-resultat)
- Skärmdump av Portal med pending transferbud (inga dubbelrenderade kort)

---

## EFTER IMPLEMENTATION

KVAR.md uppdateras med: match engine cap-bug, per-spelare-ceiling, stat-beräkning, shotmap, Portal-dubbelrendering.

LESSONS.md ny lärdom: Multiplikativa modifiers ger explosionsrisk vid edge cases. Caps måste kontrolleras i samtliga goal-paths.

Slut.
