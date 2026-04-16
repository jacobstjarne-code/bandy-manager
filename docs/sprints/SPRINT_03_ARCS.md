# SPRINT 03 — ARC-SYSTEMET

**Tid:** ~3h · **ATGARDSBANK:** BUG-001, WEAK-001, DEV-005, DEV-003, BUG-009

Hela sessionen handlar om `trainerArcService.ts`, `arcService.ts`, och deras kopplingar.

---

## BUG-001 — Trainer arc fastnar i "grind"

Plats: `src/domain/services/trainerArcService.ts` `updateTrainerArc` case `'grind'`

Problem: `consecutiveWins >= 5` krävs men nollställs vid varje förlust. Cykliska resultat (V/V/F/V/V) fastnar.

Fix: lägg till alternativa exit-villkor från grind:
```typescript
case 'grind':
  if (arc.consecutiveLosses >= 4) {
    transition(arc, 'crisis', md, season, `${arc.consecutiveLosses} raka förluster`)
  } else if (arc.consecutiveLosses >= 3 || pos >= totalTeams - 1) {
    transition(arc, 'questioned', md, season, 'Dåliga resultat')
  } else if (arc.consecutiveWins >= 5) {
    transition(arc, 'honeymoon', md, season, `${arc.consecutiveWins} raka segrar`)
  } else if (pos <= 2 && md >= 15) {
    transition(arc, 'established', md, season, 'Toppkandidat')
  }
  // NYA villkor:
  else if (pos <= 4 && md >= 12) {
    transition(arc, 'established', md, season, 'Stabil topposition')
  } else if (md >= 18) {
    // Ackumulerad form över senaste 8 matcher
    const recentFixtures = game.fixtures
      .filter(f => f.status === 'completed' && !f.isCup &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .slice(0, 8)
    const wins = recentFixtures.filter(f => {
      const isHome = f.homeClubId === game.managedClubId
      return (isHome ? f.homeScore : f.awayScore) > (isHome ? f.awayScore : f.homeScore)
    }).length
    if (wins >= 5) {
      transition(arc, 'established', md, season, 'Jämn stark form')
    }
  }
  break
```

---

## WEAK-001 + DEV-005 — Grind-exit-hint i DailyBriefing

Plats: `src/domain/services/dailyBriefingService.ts`

Lägg till tidigt i briefing-genereringen:
```typescript
if (game.trainerArc?.current === 'grind') {
  const wins = game.trainerArc.consecutiveWins ?? 0
  const needed = 5 - wins
  if (wins >= 2) {
    briefings.push({
      text: `Fyra raka — bara ${needed} till, sen vänder det. Laget vet det.`,
    })
  } else if (game.trainerArc.consecutiveLosses >= 2) {
    briefings.push({
      text: 'Varje match räknas nu. Ett till tappat poäng och styrelsen börjar titta åt fel håll.',
    })
  } else {
    briefings.push({
      text: 'Det är grind. Laget gör jobbet men genombrottet dröjer. En sejerserie — det är vad som krävs.',
    })
  }
}
```

---

## DEV-003 — Arc exit-signal

Plats: `src/domain/services/arcService.ts` `progressArcs` (eller där phase sätts till 'resolving')

När en arc går till `resolving`, generera inbox-event:
```typescript
// Vid transition till 'resolving':
if (arc.playerId) {
  const player = game.players.find(p => p.id === arc.playerId)
  if (player) {
    newInboxItems.push({
      id: `arc_resolved_${arc.id}`,
      date: currentDate,
      type: InboxItemType.Story,
      title: `Berättelsen om ${player.firstName} ${player.lastName}`,
      body: arc.resolution ?? 'En berättelse avslutades.',
      isRead: false,
    })
  }
}
```

Om `InboxItemType.Story` saknas: använd `InboxItemType.MediaEvent` eller lägg till ny typ.

---

## BUG-009 — Resolving arcs tas aldrig bort

Plats: `src/application/useCases/roundProcessor.ts` (eller `arcService.ts`)

Efter `progressArcs`-anropet, cleanup:
```typescript
const currentMatchday = /* aktuell matchday */
const cleanedArcs = (game.activeArcs ?? []).filter(arc => {
  if (arc.phase !== 'resolving') return true
  // Behåll resolving arcs 2 omgångar för DEV-003-notifiering, sen rensa
  return currentMatchday <= arc.expiresMatchday + 2
})
```

Verifiering: spela 20 omgångar, `game.activeArcs.length` bör inte överstiga 10.

---

## SLUT

`npm run build && npm test`

Rapportera per ID + särskilt: har `grind` nu tre exit-vägar, inte en?
