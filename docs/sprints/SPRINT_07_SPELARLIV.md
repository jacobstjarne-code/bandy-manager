# SPRINT 07 — SPELARLIV

**Tid:** ~6h · **ATGARDSBANK:** WEAK-005, WEAK-006, DEV-009, WEAK-007, DEV-011, WEAK-010, DEV-010, NARR-006, WEAK-004

Spelarna blir människor. Kapten pratar. Nemesis får slut. Veteranens sista säsong är en arc. Spelarens egen röst hörs.

**Mockup:** `docs/mockups/sprint07_spelarliv.html`

---

## WEAK-005 — cornerRecovery syns narrativt

Plats: `src/domain/services/matchCore.ts` + `matchCommentary.ts`

Efter post-corner-kontring i matchCore, kolla den defensiva spelarens cornerRecovery:
```typescript
// I kontexten "efter hörna, motståndarna kontrar":
const defenders = defendingTeam.players.filter(p => p.position === 'Defender' || p.position === 'Half')
const lowestRecovery = Math.min(...defenders.map(p => p.attributes.cornerRecovery))
if (lowestRecovery < 50) {
  const slowestPlayer = defenders.find(p => p.attributes.cornerRecovery === lowestRecovery)
  commentary = `${slowestPlayer?.lastName} hinner inte tillbaka! Motståndarna kontrar!`
}
```

Lägg till i matchCommentary.ts:
```typescript
counter_after_corner_slow: [
  '{defenderName} hinner inte tillbaka! Öppen yta och motståndarna kontrar!',
  'Vår defensiv var uppflyttad på hörnan. Nu är vi exponerade.',
  '{defenderName} springer för livet men det räcker inte — kontringen är ute på isen.',
]
```

---

## WEAK-006 + DEV-009 — Kapten-ceremoni + kapten pratar

### Kapten-ceremoni vid säsongsstart

Plats: `src/presentation/screens/PreSeasonScreen.tsx` eller ny screen

Mellan säsongssammanfattning och säsongsstart: om `game.currentSeason > 0` visa kapten-val:
```tsx
<div className="card-sharp" style={{ padding: 16 }}>
  <SectionLabel emoji="©">VÄLJ KAPTEN FÖR {game.currentSeason + 1}/{game.currentSeason + 2}</SectionLabel>
  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
    Lagets mest respekterade spelare. Morale-boost till resten av truppen. Syns i presskonferens.
  </p>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
    {captainCandidates.map(p => (
      <button key={p.id} onClick={() => setCaptain(p.id)} className="btn-ghost" style={{ textAlign: 'left' }}>
        <span style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>
          {p.age} år · {p.trait === 'ledare' ? 'Naturlig ledare · ' : ''}{p.careerStats.totalGames} matcher i klubben
        </span>
      </button>
    ))}
  </div>
</div>
```

Kandidater: topp 3 efter `loyaltyScore + careerStats.totalGames * 0.5 + (trait === 'ledare' ? 20 : 0)`.

### Kapten pratar i presskonferens

Plats: `pressConferenceService.ts`

Lägg till frågor där kaptenen förväntas tala:
```typescript
// I win-kategorin:
{ text: 'Kaptenen {captainName} — hur ser han på insatsen?', preferIds: ['w_p2', 'w_h3'], 
  condition: (g) => !!g.captainPlayerId, minRound: 3 },
```

Lägg till i choice-effekt: om val är "Kaptenen förklarar", tillfogat kapten citat i body.

### Kapten i dagbok

Plats: `dailyBriefingService.ts`

```typescript
if (game.captainPlayerId && game.trainerArc?.current === 'crisis') {
  const captain = game.players.find(p => p.id === game.captainPlayerId)
  if (captain) {
    briefings.push({
      text: `Kapten ${captain.lastName} samlade truppen efter träningen. Han pratade inte mycket. Det räckte.`,
    })
  }
}
```

### Moral-cascade vid låg kapten-moral

Plats: `playerStateProcessor.ts` eller motsv.

```typescript
const captain = game.players.find(p => p.id === game.captainPlayerId)
if (captain && captain.morale < 40) {
  // Sänk lagets avg morale med 5 denna omgång
  const teamPlayers = players.filter(p => p.clubId === game.managedClubId && p.id !== captain.id)
  teamPlayers.forEach(p => {
    p.morale = Math.max(0, p.morale - 5)
  })
  newInboxItems.push({
    title: 'Omklädningsrummet är tyst',
    body: `Kapten ${captain.firstName} ${captain.lastName} har inte sagt mycket denna vecka. Det märks i hela truppen.`,
    // ...
  })
}
```

---

## WEAK-007 + DEV-011 — Nemesis-tracker levande

### Nemesis pensioneras / skadas

Plats: `retirementService.ts`, injury-processing

När spelare retirar: kolla om hen är nemesis i något spel. Om ja:
```typescript
Object.entries(game.nemesisTracker ?? {}).forEach(([key, nemesis]) => {
  if (nemesis.playerId === retiringPlayer.id) {
    newInboxItems.push({
      title: 'Nemesis går i pension',
      body: `${retiringPlayer.firstName} ${retiringPlayer.lastName} lägger av. Han gjorde ${nemesis.goalsAgainstUs} mål mot oss. En epok är över.`,
      // ...
    })
    delete game.nemesisTracker[key]
  }
})
```

### Nemesis blir lagkamrat

Plats: `transferService.ts` `executeTransfer` när buyerClubId === managedClubId

```typescript
const wasNemesis = Object.values(game.nemesisTracker ?? {}).some(n => n.playerId === player.id)
if (wasNemesis) {
  // Markera med signedBy-fältet
  const nemesisKey = Object.keys(game.nemesisTracker).find(k => 
    game.nemesisTracker[k].playerId === player.id
  )
  if (nemesisKey) {
    game.nemesisTracker[nemesisKey].signedBy = game.managedClubId
  }
  
  // Generera 3 dagboksanteckningar över 3 omgångar
  const futureRounds = [game.currentRound + 1, game.currentRound + 2, game.currentRound + 3]
  futureRounds.forEach((round, idx) => {
    game.pendingFollowUps = game.pendingFollowUps ?? []
    game.pendingFollowUps.push({
      triggerRound: round,
      type: 'nemesis_diary',
      text: idx === 0 ? `${player.firstName} anlände idag. Omklädningsrummet var tyst.`
          : idx === 1 ? `${player.firstName} pratade med kapten. Någonting lossnade.`
          : `${player.firstName}: "Jag har alltid gillat ${game.clubs.find(c => c.id === game.managedClubId)?.name}. Det har bara varit på andra sidan."`,
      playerId: player.id,
    })
  })
}
```

Process `pendingFollowUps` i dailyBriefingService — trigga när `triggerRound` matchar currentRound.

---

## WEAK-010 + DEV-010 — Veteran-sista-säsong-arc

Plats: `src/domain/services/arcService.ts`

Ny arc-typ i Narrative.ts:
```typescript
export type ArcType =
  | 'hungrig_breakthrough'
  | 'joker_redemption'
  | 'veteran_farewell'
  // NY:
  | 'veteran_final_season'
  | ... 
```

Detection i `detectArcTriggers`:
```typescript
// Trigga i säsongsstart (md === 0 eller md === 1)
if (currentMatchday <= 1) {
  const veterans = managedPlayers.filter(p => 
    p.age >= 34 && 
    p.contractUntilSeason === game.currentSeason &&
    !existing.some(a => a.playerId === p.id)
  )
  for (const vet of veterans) {
    newArcs.push({
      id: `arc_vetfinal_${vet.id}_s${game.currentSeason}`,
      type: 'veteran_final_season',
      playerId: vet.id,
      startedMatchday: 0,
      phase: 'building',
      eventsFired: [],
      decisionsMade: [],
      expiresMatchday: 22, // hela säsongen
      data: { gamesPlayed: vet.careerStats.totalGames },
    })
  }
}
```

Arc-progression ger:
1. Dagboksanteckningar var 4:e omgång: "Kronberg har börjat prata om vad som kommer sen. Ungdomslaget, kanske."
2. Klack-sång: "Vid varje hemmamatch står sektionen med hans nummer på banderollen."
3. Kapten-fråga (om veteranen är kapten): "Är det här sista säsongen?"
4. Sista matchen: ceremoni-event (ställ fram en blombukett, avtackning).

Lägg till i storylineService typerna vid resolution.

---

## NARR-006 — Spelarens egen röst

Plats: `src/domain/services/playerVoiceService.ts` (ny fil)

```typescript
export function getPlayerVoice(player: Player, game: SaveGame): string | null {
  // 20% chans per spelarkort-öppning att spelaren har något att säga
  if (Math.random() > 0.2) return null
  
  // Låg moral
  if (player.morale < 30) {
    return pick([
      '"Jag vet inte vad jag gör fel längre."',
      '"Något måste ändras. Det här fungerar inte."',
      '"Skulle behöva prata med någon — men inte nu."',
    ])
  }
  
  // Hög form, många mål
  if (player.form >= 80 && player.seasonStats.goals >= 5) {
    return pick([
      '"Det känns lätt just nu. Jag hoppas det håller i sig."',
      '"Tack för förtroendet. Det är det som ger kraften."',
      '"Har aldrig mått så bra på isen."',
    ])
  }
  
  // Kontrakt löper ut
  if (player.contractUntilSeason === game.currentSeason) {
    return pick([
      '"Kontraktet? Vi får se. Jag vill veta vad klubben vill."',
      '"Jag trivs här. Men jag behöver veta att ni vill ha mig."',
    ])
  }
  
  // Veteran (sista säsong arc)
  if (player.age >= 34) {
    return pick([
      '"Man tänker på vad som kommer sen. Men just nu är jag här."',
      '"Kroppen säger ifrån ibland. Men jag är inte klar än."',
    ])
  }
  
  // Nyförvärvad
  if (player.id.includes('new') || (game.previousMarketValues && !game.previousMarketValues[player.id])) {
    return pick([
      '"Bara varit här en månad. Behöver tid att förstå spelet här."',
      '"Grabbarna är schyssta. Kioskvakten kan mitt namn nu."',
    ])
  }
  
  // Joker-trait
  if (player.trait === 'joker') {
    return pick([
      '"Bandy är tur och tajming. Den som tror något annat har inte spelat."',
      '"Jag gör ingen plan. Den går ändå inte i lås."',
    ])
  }
  
  // Hungrig
  if (player.trait === 'hungrig') {
    return pick([
      '"Jag vill mer. Mer matcher, mer ansvar, mer allt."',
      '"Jag är inte här för att vara med. Jag är här för att bli."',
    ])
  }
  
  return null
}
```

Visa i PlayerCard:
```tsx
{(() => {
  const voice = getPlayerVoice(player, game)
  if (!voice) return null
  return (
    <div className="section">
      <p className="label">🗣 {player.firstName.toUpperCase()}</p>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', fontFamily: 'var(--font-display)', lineHeight: 1.5 }}>
        {voice}
      </p>
    </div>
  )
})()}
```

---

## WEAK-004 — playerConversations synlig i UI

Plats: `PlayerCard.tsx` RELATIONER-sektion

Redan finns `lastTalked`. Ersätt visningen:
```tsx
{lastTalked && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>🗣</span>
    <span style={{ color: 'var(--text-secondary)' }}>
      Senaste samtalet: <strong>Omg {lastTalked}</strong> — för {currentRound - lastTalked} omgång{currentRound - lastTalked !== 1 ? 'ar' : ''} sedan
    </span>
  </div>
)}
```

Lägg till visuell indikator om det varit >5 omgångar:
```tsx
{lastTalked && currentRound - lastTalked >= 5 && (
  <p style={{ fontSize: 10, color: 'var(--warning)', fontStyle: 'italic' }}>
    💬 Det var ett tag sen ni pratades vid.
  </p>
)}
```

---

## SLUT

`npm run build && npm test`

Spelarkort-granskning: öppna kort på 5 olika spelare i olika state. Rapportera vilka som har spelarens egen röst synlig.
