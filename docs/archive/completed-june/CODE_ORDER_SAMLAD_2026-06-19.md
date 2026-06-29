# CODE ORDER — Samlad kö 2026-06-19
Källa: HANDOVER_2026-06-18.md, AUDIT_PROMISE_CONSEQUENCE_2026-06-19.md, Jacob-beslut 2026-06-19.

Kör i denna ordning. Committa per punkt eller per naturlig grupp.

---

## STEG 0 — Committa det som ligger på disk

Kör `git status`. Följande filer ska ligga som modified/untracked:
- `src/domain/data/injuryContextText.ts` (ny fil, Opus-copy 2026-06-18)
- `src/presentation/components/portal/secondary/InjuryStatusSecondary.tsx` (wiring 2026-06-18)
- `src/domain/services/weeklyDecisionService.ts` (5 audit-labels, Opus 2026-06-19)
- `src/presentation/components/PlayerCard.tsx` (lower_tempo label)
- `src/domain/data/efterklangText.ts` (followUp eko)

`git add` + commit. Ingen ny kod — bara ta in det som redan är skrivet.

---

## PC-1 ⚠️ BUG — player_weekend_off skriver på fel fält
**Fil:** `src/presentation/store/actions/gameFlowActions.ts` + `weeklyDecisionService.ts`

Problemet: `type: 'morale'` i gameFlowActions applicerar delta på `p.form`, inte `p.morale`.

**Fix:**
1. I gameFlowActions, `morale`-effect-hanteraren: ändra `form` → `morale`:
   ```typescript
   } else if (effect.type === 'morale') {
     players.map(p => p.id === effect.playerId
       ? { ...p, morale: Math.max(0, Math.min(100, p.morale + effect.delta)) }
       : p
     )
   }
   ```
2. Lägg till `{ type: 'fitness'; playerId: string; delta: number }` i `WeeklyDecisionEffect` union.
3. I `resolveWeeklyDecision`, `player_weekend_off` A: returnera båda deltorna:
   ```typescript
   case 'player_weekend_off':
     if (choice === 'A' && wearyPlayer)
       return [
         { type: 'morale', playerId: wearyPlayer.id, delta: 5 },
         { type: 'fitness', playerId: wearyPlayer.id, delta: -1 },
       ]
     if (choice === 'B' && wearyPlayer)
       return [{ type: 'morale', playerId: wearyPlayer.id, delta: -3 }]
     return [{ type: 'noop' }]
   ```
4. Hantera `type: 'fitness'` i gameFlowActions:
   ```typescript
   } else if (effect.type === 'fitness') {
     updatedGame = {
       ...updatedGame,
       players: updatedGame.players.map(p =>
         p.id === effect.playerId
           ? { ...p, fitness: Math.max(0, Math.min(100, p.fitness + effect.delta)) }
           : p
       ),
     }
   }
   ```

---

## PC-2 — Dölj corner-beslut om candidate saknas
**Fil:** `src/domain/services/weeklyDecisionService.ts`

Flytta `cornerCandidate`-beräkningen ur `resolveWeeklyDecision` och upp till ett delat scope, eller beräkna den inuti `makeDecisions` och lagra på beslutet. Enklaste fix: filtrera i `generateWeeklyDecision`:

```typescript
const cornerCandidate = game.players
  .filter(p => p.clubId === game.managedClubId &&
    p.position !== PlayerPosition.Goalkeeper &&
    p.attributes.cornerSkill > 60)
  .sort((a, b) => b.attributes.cornerSkill - a.attributes.cornerSkill)[0]

const available = pool.filter(d => {
  if (!resolved.includes(`${d.id}_${game.currentSeason}`) &&
      (!d.requiredEra || d.requiredEra.includes(currentEra))) {
    if (
      (d.id === 'corner_extra_training' || d.id === 'training_corners_vs_matchprep') &&
      !cornerCandidate
    ) return false
    return true
  }
  return false
})
```

---

## PC-3 — Dölj scout-alternativ om scoutBudget = 0
**Fil:** `src/domain/services/weeklyDecisionService.ts`

Lägg till i `available`-filtreringen (samma ställe som PC-2):
```typescript
if (d.id === 'scout_opponent_corners' && (game.scoutBudget ?? 0) === 0) return false
```

---

## PC-4 — legacy_youth_showcase label
**Fil:** `src/domain/services/weeklyDecisionService.ts`

```typescript
optionA: { label: 'Ställ upp', effect: '+kommunstatus', effectColor: 'success' },
```

---

## FYND 3 — Per-yta pressrubrik (Jacob-beslut: ja)
**Fil:** `src/domain/data/journalistHeadlineStrings.ts` + `src/domain/services/journalistService.ts`

En händelse ska generera tre formuleringar av rubriken: en för portal, en för inkorg, en för granska.

**Implementation:**

Lägg till en `surface`-parameter i `pickHeadline`:
```typescript
export function pickHeadline(
  bucket: ResultBucket,
  persona: Persona,
  fixtureId: string,
  prevLoss = false,
  oppName?: string,
  scoreline?: string,
  matchday = 0,
  isCup = false,
  surface: 'portal' | 'inbox' | 'granska' = 'portal',
): string
```

Seed-variationen ger automatiskt olika val om pool-indexet varierar per yta:
```typescript
const surfaceOffset = surface === 'portal' ? 0 : surface === 'inbox' ? 7 : 13
const idx = hashSeed(`${fixtureId}_${bucket}_${persona}_md${matchday}_s${surfaceOffset}`) % pool.length
```

Uppdatera alla `pickHeadline`-anropare med korrekt `surface`-argument:
- Portalkort → `'portal'`
- Inkorgspost (createMatchResultItem / mediaProcessor) → `'inbox'`
- Granska-vyn → `'granska'`

Ingen pool-utökning behövs — same pool, different seed → different line.

---

## FYND 12 — Inkorg: inline-actions + länkning (Jacob-beslut)
**Beslut:** Förfrågningar utan egen yta → inline action-knappar i InboxRow. Förfrågningar MED egen yta → länk dit.

**Fil:** `src/presentation/screens/InboxScreen.tsx`

**Steg 1 — Definiera vad som är vad:**

```typescript
// Förfrågningar MED egen yta (länka, inte inline)
function getActionPath(item: InboxItem, game: SaveGame): string | undefined {
  switch (item.type) {
    case InboxItemType.TransferBidReceived:
    case InboxItemType.TransferOffer:
      return '/game/transfers'
    case InboxItemType.ContractExpiring:
    case InboxItemType.Injury:
    case InboxItemType.Suspension:
      return '/game/squad'
    case InboxItemType.BoardFeedback:
    case InboxItemType.LicenseReview:
      return '/game/club'
    default:
      return undefined
  }
}

// Förfrågningar UTAN egen yta (inline-action i inkorg)
// Dessa är InboxItem.choices-baserade — surfas som inline-knappar.
function getInlineChoices(item: InboxItem): Array<{ id: string; label: string }> | null {
  return item.choices?.length ? item.choices : null
}
```

**Steg 2 — InboxRow-ändringar:**

Om `getActionPath` returnerar en path: visa `›`-länk i raden + hela raden klickbar till den pathen.

Om `getInlineChoices` returnerar choices: visa knappar under titeln (samma mönster som EventCardInline).

**Steg 3 — Frida-tifo specifikt:**
Tifo-förfrågningar (`InboxItemType.SupporterTifo` eller motsv.) har `choices` på itemen — bidra/neka. De har ingen egen yta → inline. Verifiera att itemet faktiskt bär `choices` i inbox-generatorn; om inte, lägg till dem där.

**Not från Code:** "supporter_tifo weekly_decision surfas via portal-kön, inte en distinkt inkorgspost." Bekräfta att Helena-typen och Frida-typen faktiskt är `InboxItem` med choices, eller att de genereras som sådana. Om inte: skapa dem som InboxItem med choices i generatorn (liknar transfer-bid-mönstret).

---

## PC-5 — KRÄVER SVAR utan action-path (ingår i FYND 12 ovan)
Täckt av `getActionPath` i FYND 12. Samma implementation.

---

## PC-6 — mentor downstream (lågprio, körs sist)
**Fil:** Wherever endOfSeason/seasonEndProcessor handles CA development.

Läs aktiva `leadershipActions` med `effect.stat === 'mentorship'`. För varje sådan: hitta `youngPlayer` (squad, age < 22, ej mentorn själv) och ge +1 på CA-development-bonusen i säsongsavslutets tillväxtberäkning. Använd befintlig CA-development-infrastruktur — ingen ny mechanic.

---

## Verifiering
Efter STEG 0 + PC-1: `npm run typecheck` + `npm test`. Inga röda.
FYND 3: verifiera att portal / inkorg / granska får olika rubriktext på samma fixture.
FYND 12: verifiera Frida-tifo-flödet + transfer-länkning manuellt.
