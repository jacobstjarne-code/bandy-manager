# Slutlig genomgång — Bandy Manager
## 2026-03-28

### ✅ Routing & Navigation
- 20 routes, alla giltiga (AppRouter.tsx)
- `/game/budget` borttagen — inga kvarvarande referenser
- RoundSummary → Ekonomi navigerar korrekt med `{ state: { tab: 'ekonomi' } }`
- Alla BottomNav-tabs pekar till giltiga routes
- GameGuard skyddar full-screen routes (events, round-summary, match-result, board-meeting, game-over)
- Fallback: `<Route path="*" element={<Navigate to="/" replace />} />`

### ✅ Designsystem
- SectionCard: leather-bar borttagen globalt, card-label pattern
- card-sharp: 8px radius
- Georgia (--font-display): alla spelarnamn, rubriker
- Emojis på alla sektionstitlar
- Konsekvent tag-system (tag-green, tag-red, tag-outline, tag-copper)
- Ljusa headers: border-bottom tillagd
- Mörka headers: Dashboard + Förening (klubbidentitet)

### ✅ Svenska
- Alla attributnamn: Skjutning, Försvar, Hörnspel etc.
- Träningsprojekt: svenska effectDescriptions
- Taktik: Balanserad, Normalt etc. i StartStep
- Positioner: positionShort() överallt
- Säsong: 2026/2027 format konsekvent

### ✅ Arkitektur efter refaktor
| Fil | Före | Efter |
|-----|------|-------|
| ClubScreen.tsx | 66 KB | **6 KB** |
| gameStore.ts | 50 KB | **17 KB** |
| BudgetScreen.tsx | 10 KB | **Raderad** |
| matchCommentary.ts | — | **19 KB** (extraherad) |
| 5 club-komponenter | — | **60 KB** (EkonomiTab, AkademiTab, KlubbTab, Training×2) |
| 5 store-actions | — | **34 KB** |

### ✅ Inga kända buggar
- Avbryt-knapp i match: borttagen
- Modal clipping: maxHeight 85vh + scroll
- Yrkes-tags: konsekvent outline, trunkerade vid >120px
- MatchDoneOverlay: card-round utan färgad ram
- Pitch: vit is-gradient, transparenta cirklar

### ⚠️ Lägre prio (ej blockerande)
1. **matchStepByStep.ts** fortfarande 64KB — kommentarer extraherade men logiken är stor. OK för nu.
2. **DashboardScreen.tsx** 47KB — delvis splittad (dashboard-mapp). Kan brytas ut ytterligare.
3. **TransfersScreen.tsx** 44KB — modaler inline. Kan extraheras.
4. **pressConferenceService.ts** 41KB — mest data. Kan bli JSON.
5. **Intro med Bury Fen-logga** — väntar på Eriks assets.

### Spelflöde (verifierat i kod)
```
StartScreen → NewGameScreen → [createNewGame] → BoardMeeting → Dashboard
  ↓ (varje omgång)
Dashboard → Match (Lineup → Tactic → Start) → MatchLive → MatchDone → MatchReport
  ↓
RoundSummary → [Events om pending] → Dashboard
  ↓ (säsongsslut)
SeasonSummary → [GameOver om sparkad] → BoardMeeting (ny säsong) → PreSeason → Dashboard
```
Alla steg i flödet har korrekta navigeringar. Inga döda ändar.
