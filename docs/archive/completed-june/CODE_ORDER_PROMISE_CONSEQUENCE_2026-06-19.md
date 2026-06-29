# CODE ORDER — Promise↔consequence-fixar 2026-06-19
Källa: `docs/AUDIT_PROMISE_CONSEQUENCE_2026-06-19.md`

Prio-ordning: PC-1 (bug) → PC-3 (osynlig) → PC-2 (noop-risk) → PC-4 (copy) → PC-5 (inkorg) → PC-6 (stub, lågprio)

---

## PC-1 ⚠️ BUG — player_weekend_off applicerar på fel fält (gameFlowActions.ts)
**Fil:** `src/presentation/store/actions/gameFlowActions.ts`

I `resolveWeeklyDecision`, effect-hanteraren för `type: 'morale'` applicerar delta på `p.form` istf `p.morale`:
```typescript
} else if (effect.type === 'morale') {
  players.map(p => ... { form: p.form + delta } ...)  // FEL: bör vara p.morale
}
```

**Fix:**
1. Ändra `morale`-effect-type i gameFlowActions så den träffar `p.morale` (inte `p.form`).
2. Lägg till en ny `type: 'fitness'` i `WeeklyDecisionEffect` union i `weeklyDecisionService.ts`.
3. I `resolveWeeklyDecision` för `player_weekend_off`, A: returnera `[{ type: 'morale', playerId, delta: 5 }, { type: 'fitness', playerId, delta: -1 }]`.
4. Hantera `type: 'fitness'` i gameFlowActions: `{ fitness: Math.max(0, Math.min(100, p.fitness + delta)) }`.
5. Kontrollera att inga andra beslut bryter på förändringen (bara `player_weekend_off` och `training_corners_vs_matchprep`/`corner_extra_training` som ändrar `morale`-type — övriga är noop i morale-grenen).

Label justeras av Opus efteråt: "−1 kondition · +5 moral" stämmer nu.
Tester: lägg till ett test i weeklyDecisionService som verifierar att `morale`-effect ger `p.morale += delta`.

---

## PC-2 — Silent noop-risk vid saknad candidate (weeklyDecisionService.ts)
**Berörda beslut:** `corner_extra_training`, `training_corners_vs_matchprep`

**Problem:** Om ingen spelare har `cornerSkill > 60` hittas ingen cornerCandidate → `resolveWeeklyDecision` returnerar `noop` utan feedback. Labeln lovar alltid effekt.

**Fix (enklast):** I `generateWeeklyDecision`, filtrera bort `corner_extra_training` och `training_corners_vs_matchprep` ur `available`-poolen om `cornerCandidate === undefined`:
```typescript
const available = pool.filter(d => {
  if (!resolved.includes(`${d.id}_${game.currentSeason}`) &&
      (!d.requiredEra || d.requiredEra.includes(currentEra))) {
    // Dölj corner-beslut om ingen candidate finns
    if ((d.id === 'corner_extra_training' || d.id === 'training_corners_vs_matchprep') && !cornerCandidate) return false
    return true
  }
  return false
})
```
Flytta `cornerCandidate`-beräkningen ovan `available`-filtreringen.

---

## PC-3 — Scout-noop vid scoutBudget = 0 (weeklyDecisionService.ts)
**Beslut:** `scout_opponent_corners`

**Problem:** Om `game.scoutBudget === 0` genererar beslutets A-val en silent noop trots att labeln säger "−1 scout · +taktikinsikt".

**Fix:** I `generateWeeklyDecision`, lägg till i `available`-filtreringen:
```typescript
if (d.id === 'scout_opponent_corners' && (game.scoutBudget ?? 0) === 0) return false
```

---

## PC-4 — legacy_youth_showcase label (weeklyDecisionService.ts)
**Beslut:** `legacy_youth_showcase`

"+rekrytering" lovar en mechanic som inte finns.

**Fix (minimal):** Ändra label A från "+rekrytering · +kommunstatus" till "+kommunstatus":
```typescript
optionA: { label: 'Ställ upp', effect: '+kommunstatus', effectColor: 'success' },
```

Om rekryteringseffekt ska byggas: gör det som ett separat beslut. Inte nu.

---

## PC-5 — Inkorg "KRÄVER SVAR" utan action-path (InboxScreen.tsx)
**Berörda:** BoardFeedback, LicenseReview, ContractExpiring, Suspension, Injury i "kräver-svar"-gruppen.

**Problem:** Gruppen säger "KRÄVER SVAR" men InboxRow har ingen action-knapp. Spelaren ser att svar krävs men kan inte agera härifrån.

**Fix (order #12-familjens logik):** Lägg till en navigationsindikation per item-typ. Enklast: en liten "→"-pil eller "Gå till Trupp" i InboxRow för items med klar navigationsyta:
```typescript
function getActionDestination(type: InboxItemType): string | undefined {
  switch (type) {
    case InboxItemType.ContractExpiring: return '/game/squad'
    case InboxItemType.Injury: return '/game/squad'
    case InboxItemType.Suspension: return '/game/squad'
    case InboxItemType.BoardFeedback: return '/game/club'
    case InboxItemType.LicenseReview: return '/game/club'
    default: return undefined
  }
}
```

Visa en klickbar CTA i raden ("Gå till Trupp →") om `getActionDestination(item.type)` returnerar en path. Hela raden klickbar = navigate till destination.

**Not:** Frida-tifo och Helena-specifika ärenden (tidigare kända som #12) kan behöva separat behandling — avgörs vid implementation.

---

## PC-6 — mentor action saknar downstream (lågprio)
**Fil:** `src/domain/services/leadershipService.ts`, `src/application/useCases/endOfSeason.ts` (eller motsv.)

`mentor`-action skapar en `leadershipEntry` med `effect: { stat: 'mentorship', delta: 1 }` men ingen kod läser detta.

**Fix (minimal):** I endOfSeason-processorn, för varje aktiv mentorship-entry: hitta den yngsta squadmate (youngPlayer) och ge +1 CA-tillväxt som bonus. Använd befintlig CA-development-infrastruktur.

**Alternativ (lågprio):** Byt ut mentor mot en enkel morale-boost istf tom mechanic — men det missar poängen med mentor-konceptet. Bygg hellre.

**Prioritet:** Lägst av dessa sex. Kan vänta till nästa spelkänsle-runda.

---

## Verifiering
Efter PC-1–PC-4: kör `npm run typecheck` + `npm test`. Inga nya tester bör vara röda.
PC-5 + PC-6 kräver manuell playtest.
