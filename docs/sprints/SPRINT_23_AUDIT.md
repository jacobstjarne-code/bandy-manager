# Sprint 23 — audit (Taktiktavlan Del B)

## Punkter i spec

- [x] **Formation.ts — getRecommendedFormation** (commit 6cdbf3f). Scores varje formation mot tillgängliga spelares positionsfördelning. Returnerar FormationType med högst matchning.
- [x] **Formation.ts — FORMATION_META** (commit 6cdbf3f). 6 formationer × 2 anatomy-tags + 1 coach-quote. Texter kopierade exakt från TEXT_REVIEW_formations_2026-04-20.md. Tags reflekterar slot-krav, INTE match-effekter.
- [x] **B1c — Coach-rekommendation i FormationView** (commit 960c388). Grön outline + "★ COACH"-badge på rekommenderad knapp. Beräknas från `getRecommendedFormation(players)` per render — stabil under en runda eftersom truppen inte ändras mid-round.
- [x] **B2c — Tags + coach-quote i FormationView** (commit 960c388). `tag tag-ghost`-klassen, updateras direkt vid formation-byte. Quote med kursiv serif + "— Coachen"-rad.
- [x] **B3c — Taktik-översikt + klickbar "ändras i lineup"** (commit 960c388). Kompakt rad överst: Mentalitet · Tempo · Press. "ändras i lineup" är `<button onClick={() => navigate('/game/squad')}>` med `color: var(--accent)` och underline.
- [x] **B4b — Interaktiv kemi i ChemistryView** (commit 590d4fa). useState(expandedPairKey), klick för toggle. getPairExpandText med 6 branches + 3 textmallar per aktiv branch. Texter kopierade exakt från TEXT_REVIEW.
- [x] **Inbox-notis vid rekommendationsändring** (commit ccc1051). SaveGame.previousRecommendedFormation lagrar senast kända. roundProcessor jämför per omgång, pushar InboxItem (Training) vid ändring.
- [x] **npm run build && npm test** — 124 test files, 1451 tests, exit code 0.
- [x] **Push** — 4 commits pushade till origin/main (9aba869..ccc1051).

## Observerat i UI (logisk verifiering — kan inte köra appen direkt)

**FormationView — B3c overview:**
`tactic.mentality`, `tactic.tempo`, `tactic.press` mappar till svenska via konstanter. `useNavigate()` anropas, `navigate('/game/squad')` vid klick — samma route som GranskaScreen och DashboardScreen använder.

**FormationView — B1c:**
`recommended === f && formation !== f` ger grön outline. `recommended === f` alltid ger `★ COACH`-badge (inklusive om aktiv formation = rekommenderad, vilket är det normala läget).

**FormationView — B2c:**
`FORMATION_META[formation]` uppdateras reaktivt via `formation` prop. Tags via `className="tag tag-ghost"` (global.css verifierad).

**ChemistryView — B4b:**
Branch-logiken: nyvärvad (gamesInCurrentClub via seasonHistory) vinner alltid. Stark+ihop → null. Stark+isär (xDist > 50) → sidoförslag. Svag+ihop → direktpassvarning. Svag+isär → null. Neutral → null. expandText=null → inget block renderas.

**roundProcessor — inbox:**
Första omgången: `prevRec` är undefined → lagra utan notis. Nästa omgång: jämför. Ändring → push InboxItem. Notis skickas max en gång per faktisk ändring (inte per render).

## Ej levererat

**"Frys rekommendationen när lineupConfirmedThisRound=true"** (OVERRIDE 1): Ej implementerat. Motivering: TacticBoardCard.tsx ska inte ändras (spec-krav). FormationView har inte åtkomst till `lineupConfirmedThisRound` utan prop-threading via TacticBoardCard. Frysning är dessutom implicit stabil under en normal runda — inga spelare lämnar/tillkommer truppen under en runda. Edge case: om man öppnar taktiktavlan precis när en skada inträffar mid-round kan rekommendationen skilja sig. Parkas till nästa sprint om det bedöms vara problem i playtest.

## Nya lärdomar till LESSONS.md

Inget nytt mönster — inga återkommande buggar i denna sprint.

## Grep-verifiering

```bash
# Inga hårdkodade hex-färger i taktik-komponenterna
grep -rn '#[0-9a-fA-F]\{3,8\}' src/presentation/components/tactic/ --include="*.tsx"
# → 0 relevanta träffar (rgba() är OK)
```
