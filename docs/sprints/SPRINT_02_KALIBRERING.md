# SPRINT 02 — KALIBRERING

**Tid:** ~1h · **ATGARDSBANK:** BUG-002, BUG-003, BUG-004

Samma innehåll som `docs/CODE_3_FIXES.md` men ID-refererat.

---

## BUG-002 — secondHalfShare 0.488 → 0.543

Plats: `src/domain/services/matchCore.ts`

Konstant efter `PROFILE_GOAL_MODS`:
```typescript
const SECOND_HALF_BOOST = 1.25
```

I `simulateSecondHalf` step-loop, EFTER `stepGoalMod`-beräkning:
```typescript
stepGoalMod *= SECOND_HALF_BOOST
```

ENDAST simulateSecondHalf. Ej firstHalf, ej overtime.

Verifiering: `npx ts-node scripts/calibrate.ts`. secondHalfShare ~0.54, goalsPerMatch ~10.0.

---

## BUG-003 — Cup self-pairing guard

Plats: `src/domain/services/cupService.ts` `generateCupFixtures`

Efter shuffle, före pairing:
```typescript
if (new Set(playInTeams).size !== playInTeams.length) {
  console.error('[CUP BUG] Duplicate teams in play-in list:', playInTeams)
}
const byeSet = new Set(byeTeams)
if (playInTeams.some(id => byeSet.has(id))) {
  console.error('[CUP BUG] Team in both bye and play-in lists')
}
```

Verifiering: `grep -n "CUP BUG" src/domain/services/cupService.ts` → 2 rader.

---

## BUG-004 — Presskonferens community-frågor

Plats: `src/domain/services/pressConferenceService.ts` `QUESTIONS`

Lägg till i `win`/`bigWin`:
```typescript
{ text: 'Det pratas om er i hela kommunen. Är det press eller inspiration?',
  preferIds: ['w_h1', 'w_c1', 'cl01'], minRound: 5 },
{ text: 'Ni har fått en ny mecenats stöd. Gör det skillnad i omklädningsrummet?',
  preferIds: ['w_p2', 'w_h2', 'cl07'], minRound: 6 },
{ text: 'Ni har en ung spelare som imponerar. Hur hanterar ni trycket?',
  preferIds: ['w_p3', 'w_h3', 'cl03'], minRound: 4 },
```

Lägg till i `loss`:
```typescript
{ text: 'Publiken sviker. Hur påverkar det laget?',
  preferIds: ['l_h1', 'l_c2', 'cl14'], minRound: 5 },
```

Lägg till `condition`-fält på PressQuestion-interfacet om saknas. Filtrera i pickerfunktionen:
- cs_high: `(g) => (g.communityStanding ?? 50) > 75`
- cs_low: `(g) => (g.communityStanding ?? 50) < 35`
- mecenat_joined: `(g) => g.mecenater?.some(m => m.isActive && m.arrivedSeason === g.currentSeason)`
- academy_talent: `(g) => g.players.some(p => p.clubId === g.managedClubId && p.promotedFromAcademy && p.age <= 20)`

Verifiering: `grep -n "hela kommunen\|Publiken sviker\|mecenats stöd\|ung spelare som imponerar" src/domain/services/pressConferenceService.ts` → 4 rader.

---

## SLUT

`npm run build && npm test && npx ts-node scripts/calibrate.ts`

Rapportera alla 5 kalibreringstargets + per ID.
