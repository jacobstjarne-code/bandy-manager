# SPRINT 06 — KLACKEN & ORTEN

**Tid:** ~3h · **ATGARDSBANK:** WEAK-009, DEV-007, WEAK-011, DEV-008, DREAM-015

Orten levande. Klackens favorit skiftar. Arenan pratar. Insändare ger röst åt fansen.

---

## WEAK-009 + DEV-007 — Klackens favoritspelare dynamisk

Plats: `src/domain/services/supporterService.ts`

Lägg till funktion:
```typescript
export function reevaluateFavoritePlayer(
  supporterGroup: SupporterGroup,
  players: Player[],
  currentRound: number,
  currentSeason: number,
): { favoritePlayerId: string; changed: boolean; oldFavoriteName?: string; newFavoriteName?: string } {
  const currentFavorite = players.find(p => p.id === supporterGroup.favoritePlayerId)
  const newFavorite = pickFavoritePlayer(players)
  
  if (!newFavorite) {
    return { favoritePlayerId: supporterGroup.favoritePlayerId ?? '', changed: false }
  }
  
  // Ingen ändring om nya favoriten är samma som gamla
  if (newFavorite.id === supporterGroup.favoritePlayerId) {
    return { favoritePlayerId: newFavorite.id, changed: false }
  }
  
  // Ändring endast om den gamla favoriten verkligen har tappat tätt 
  // (för att undvika oscillation)
  if (currentFavorite) {
    const oldScore = scoreFavorite(currentFavorite)
    const newScore = scoreFavorite(newFavorite)
    if (newScore < oldScore * 1.15) {
      // Inte tillräckligt stor skillnad
      return { favoritePlayerId: currentFavorite.id, changed: false }
    }
  }
  
  return {
    favoritePlayerId: newFavorite.id,
    changed: true,
    oldFavoriteName: currentFavorite ? `${currentFavorite.firstName} ${currentFavorite.lastName}` : undefined,
    newFavoriteName: `${newFavorite.firstName} ${newFavorite.lastName}`,
  }
}

function scoreFavorite(p: Player): number {
  const attrs = p.attributes
  const skill = attrs.shooting * 2 + attrs.skating + attrs.acceleration + attrs.stamina
  const posBonus = p.position === PlayerPosition.Forward ? 20 : p.position === PlayerPosition.Half ? 5 : 0
  const formBonus = p.form * 0.5
  const seasonBonus = p.seasonStats.goals * 3 + p.seasonStats.assists * 1
  return skill + posBonus + formBonus + seasonBonus
}
```

Anropa i roundProcessor var 5:e omgång:
```typescript
if (currentRound % 5 === 0 && game.supporterGroup) {
  const result = reevaluateFavoritePlayer(
    game.supporterGroup,
    game.players.filter(p => p.clubId === game.managedClubId),
    currentRound,
    game.currentSeason,
  )
  if (result.changed) {
    newInboxItems.push({
      id: `fav_shift_${currentRound}`,
      type: InboxItemType.MediaEvent,
      title: 'Klacken har en ny favorit',
      body: `Klacken sjunger inte längre ${result.oldFavoriteName}s namn. ${result.newFavoriteName} har tagit över kören.`,
      // ...
    })
    game.supporterGroup.favoritePlayerId = result.favoritePlayerId
  }
}
```

---

## WEAK-011 + DEV-008 — Arenanamn driver narrativet

Plats: `src/domain/data/matchCommentary.ts`, `pressConferenceService.ts`, `supporterRituals.ts`

**Matchkommentar (hemmamatch, startsteg):**
Lägg till i commentary-poolen:
```typescript
kickoff_home_arena: [
  '{homeClubName} har publik i ryggen. {arenaName} ekar.',
  '{arenaName} är full — och de vet vad de kom för.',
  'Klacken har kommit tidigt till {arenaName}. Det kommer att märkas.',
  'Det är {weather} på {arenaName}. Spelarna skakar liv i lederna.',
]
```

**Presskonferens efter hemmamatch:** Lägg till i QUESTIONS.win:
```typescript
{ text: 'Hur var stämningen på {arenaName} idag?', preferIds: ['w_p3', 'bw_p7'], minRound: 3 },
```

Med template-fyllning i `buildPressConferenceEvent`. Leta efter befintlig fillTemplate-funktion.

**Klack-ritual "välkomstsång":**
Plats: `src/domain/services/supporterRituals.ts`

```typescript
welcomeSong: (game) => {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  return `Klacken ropar: "Välkommen till ${club?.arenaName ?? 'planen'}!"`
},
```

---

## DREAM-015 — Lokaltidningens insändare

Plats: Ny fil `src/domain/services/insandareService.ts` + GranskaScreen

Genererar insändare baserat på game state:
```typescript
interface Insandare {
  signature: string  // "Lars-Erik, 64, Järbo"
  text: string
  sentiment: 'positive' | 'negative' | 'reflective'
}

export function generateInsandare(game: SaveGame, lastFixture: Fixture): Insandare | null {
  const isHome = lastFixture.homeClubId === game.managedClubId
  const myScore = isHome ? lastFixture.homeScore : lastFixture.awayScore
  const theirScore = isHome ? lastFixture.awayScore : lastFixture.homeScore
  const margin = myScore - theirScore
  const isDerby = !!getRivalry(lastFixture.homeClubId, lastFixture.awayClubId)
  
  // 25% chans per match, 60% efter derby
  const chance = isDerby ? 0.6 : 0.25
  if (Math.random() > chance) return null
  
  const signatures = [
    'Lars-Erik, 64, Järbo', 'Birgit, 71, Centrum', 'Kjell-Olof, 58, Norrbyn',
    'Gunilla, 69, Hillsta', 'Sigvard, 73, Älvkarleby', 'Margareta, 66, Tierp',
    'Gunnar, 78, Hedesunda', 'Lennart, 55, Storvik', 'Ingvar, 61, Edsbyn',
  ]
  const signature = signatures[Math.floor(Math.random() * signatures.length)]
  
  if (margin <= -3) {
    return {
      signature,
      sentiment: 'negative',
      text: pick([
        `Jag har varit ${game.clubs.find(c => c.id === game.managedClubId)?.name}-anhängare i 38 år. Och det här är värst jag har sett på länge.`,
        'Spelarna gör sitt men var är viljan? Någon måste ställa frågor nu.',
        'Kan vi inte kräva att styrelsen förklarar vad som händer?',
      ]),
    }
  }
  if (margin >= 3 && isDerby) {
    return {
      signature,
      sentiment: 'positive',
      text: pick([
        `Jag var där. Hela vägen. Den matchen berättar jag om när barnbarnen frågar om bandy.`,
        'Tack till laget. Tack till klacken. Tack till orten. Det här är vad bandy handlar om.',
        'Trettiosju år i publiken och jag glömmer aldrig det där målet i 87:e.',
      ]),
    }
  }
  if (margin >= 2) {
    return {
      signature,
      sentiment: 'positive',
      text: pick([
        'Bra jobbat laget. Fortsätt så.',
        'Efter tre raka — nu börjar det likna något.',
        'Kaptenen ledde idag. Det syns när det är någon som bär laget.',
      ]),
    }
  }
  // Oavgjort eller knapp — reflektiv
  return {
    signature,
    sentiment: 'reflective',
    text: pick([
      'En jämn match. Det är så det ska vara i serien. Vi är inte bäst, vi är inte sämst.',
      'Bandy är inte bara siffror. Det är lukten av kaffekoppen, kylan, människorna runt planen.',
      'Tänk på ungdomslaget. De sitter alltid i sista svängen. De förtjänar bättre.',
    ]),
  }
}
```

Rendera i GranskaScreen, under TIDNINGSRUBRIK:
```tsx
{(() => {
  const insandare = generateInsandareFromGame(game, fixture)
  if (!insandare) return null
  return (
    <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: 6 }}>
        ✉️ INSÄNDARE
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontStyle: 'italic', lineHeight: 1.5 }}>
        "{insandare.text}"
      </p>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
        — {insandare.signature}
      </p>
    </div>
  )
})()}
```

Cacha genereringen per fixture för determinism (samma fixture = samma insändare vid omladdning).

---

## SLUT

`npm run build && npm test`
