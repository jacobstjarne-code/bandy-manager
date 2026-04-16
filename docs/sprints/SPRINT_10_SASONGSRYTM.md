# SPRINT 10 — SÄSONGSRYTM

**Berör ID:** WEAK-017, WEAK-018, WEAK-013, WEAK-020, WEAK-012, WEAK-021  
**Kostnad:** ~1-2 sessioner  
**Typ:** Feature (berättelse-arkitektur)  
**Mockup:** `docs/mockups/sprint10_sasongsstart.html`

---

## SYFTE

Säsongen har idag inga rytmiska takter som pulserar genom året — mycket sker men ingenting ackumulerar. Akademin är tyst. Säsongsstarten saknar kontext. State of the Club jämförelse renderas inte. Slutspel bara är. Omklädningsrummet finns inte. Denna sprint gör säsongens dramaturgi synlig.

---

## ID 1: WEAK-013 — State of the Club jämförelse

**Plats:** `PreSeasonScreen.tsx`  
**Status:** Data finns (`seasonStartSnapshot`) men rendering är gles

### Koncept

Vid säsong 2+ visa ett jämförelse-kort: var var klubben förra säsongen, var är den nu.

### Datapunkter att jämföra

```typescript
interface SnapshotDelta {
  season: number
  positionChange: number      // negative = upp i tabell
  financesChange: number
  communityStandingChange: number
  squadSizeChange: number
  supporterMembersChange: number
  academyPromotionsChange: number
}
```

### Rendering

```tsx
{game.seasonStartSnapshot && game.currentSeason > game.seasonStartSnapshot.season && (
  <div className="card-sharp" style={{ padding: 16, marginBottom: 16 }}>
    <p style={LABEL}>📐 STATE OF THE CLUB</p>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
      {/* Förra säsongen */}
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>FÖRRA SÄSONGEN</p>
        <p style={{ fontSize: 20, fontWeight: 700 }}>{snapshot.finalPosition}:a</p>
        <p style={{ fontSize: 11 }}>{formatFinance(snapshot.finances)}</p>
        <p style={{ fontSize: 11 }}>Orten: {snapshot.communityStanding}</p>
      </div>
      
      {/* Pil */}
      <div>→</div>
      
      {/* I dag */}
      <div>
        <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>NU</p>
        <p style={{ fontSize: 20, fontWeight: 700 }}>{currentPosition}:a</p>
        <p style={{ fontSize: 11 }}>{formatFinance(currentFinances)}</p>
        <p style={{ fontSize: 11 }}>Orten: {currentCs}</p>
      </div>
    </div>
    
    <p style={{ fontSize: 11, fontStyle: 'italic', marginTop: 12, lineHeight: 1.5 }}>
      {generateStateNarrative(snapshot, current)}
    </p>
  </div>
)}
```

### Narrativ generation

```typescript
function generateStateNarrative(prev, curr): string {
  const posDelta = prev.finalPosition - curr.position  // positivt = upp
  const finDelta = curr.finances - prev.finances
  
  if (posDelta >= 3 && finDelta > 0) {
    return 'Ett år av tydlig progression. Vi har skakat av oss stigmat.'
  }
  if (posDelta >= 2) {
    return 'Vi står stabilare. Ekonomin följer inte alltid tabellen — men det är inte en överraskning.'
  }
  if (posDelta <= -2) {
    return 'Ett tungt år i tabellen. Vi har försökt behålla strukturen. Det syns i kontraktens längd, inte i poängen.'
  }
  if (Math.abs(posDelta) <= 1) {
    return 'Stillastående. Det är varken misslyckande eller framgång. Det är en position att bygga från.'
  }
  return 'En säsong med rörelse. Nästa ska visa om riktningen håller.'
}
```

Mockup: se `docs/mockups/sprint10_sasongsstart.html`.

---

## ID 2: WEAK-018 — Säsongsstart saknar kontext

**Plats:** `BoardMeetingScreen.tsx` (existerande)

### Koncept

Lägg till sektion "Truppen just nu" innan styrelsens ambitioner diskuteras.

```tsx
<div className="card-sharp" style={{ padding: 14, marginBottom: 12 }}>
  <p style={LABEL}>👥 TRUPPEN JUST NU</p>
  
  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
    <p>• {squadSize} spelare i truppen, snittålder {avgAge}</p>
    <p>• {playersOver30} spelare är 30+ (veteraner)</p>
    <p>• {expiringContracts} kontrakt löper ut i år</p>
    <p>• Svagaste position: {weakestPosition}</p>
    <p>• Stjärnan: {bestPlayer.name} (CA {bestPlayer.ca}, {bestPlayer.age} år)</p>
    {captain && <p>• Kapten: {captain.name}</p>}
  </div>
  
  <div style={{ marginTop: 10, padding: 10, background: 'var(--bg-surface)', borderRadius: 6 }}>
    <p style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-secondary)' }}>
      {generateSquadSummary(squad, season)}
    </p>
  </div>
</div>
```

### Svagaste position-beräkning

```typescript
function getWeakestPosition(players: Player[]): string {
  const positions: PlayerPosition[] = ['Goalkeeper', 'Defender', 'Half', 'Midfielder', 'Forward']
  const avgByPosition = positions.map(pos => {
    const group = players.filter(p => p.position === pos)
    const avgCa = group.length > 0 ? group.reduce((s, p) => s + p.currentAbility, 0) / group.length : 0
    return { pos, avgCa, count: group.length }
  })
  const weakest = avgByPosition.sort((a, b) => a.avgCa - b.avgCa)[0]
  return POSITION_LABELS[weakest.pos]  // "Yttre halv" etc
}
```

---

## ID 3: WEAK-017 — Akademin tyst

**Plats:** `src/application/useCases/processors/youthProcessor.ts`, ny `src/domain/services/academyNarrativeService.ts`

### Koncept

Akademin ska generera 3-4 narrativa events per säsong:

1. **Säsongsstart:** "Årets intake — 5 nya talanger kom in"
2. **Mittsäsong:** "Talangen Bryt igenom" (om ung spelare gör debut + mål)
3. **Säsongsslut:** "Årets akademi-utfall: X uppflyttade, Y sålda"
4. **Random mikro:** "P19-träningen avbröts idag — alla var tvungna skyffla snö av isen"

### Event 1: Talang bryter igenom

Triggas när ung spelare (<21 år) gör debut OCH scorar under samma match:

```typescript
export function checkBreakthroughEvent(game: SaveGame, fixture: Fixture): GameEvent | null {
  const managedGoals = fixture.events.filter(e => e.type === 'goal')
  for (const goal of managedGoals) {
    const player = game.players.find(p => p.id === goal.playerId)
    if (!player) continue
    if (player.age > 21) continue
    if (player.careerStats.totalGames > 3) continue  // debut-nära
    
    return {
      id: `event_breakthrough_${player.id}_${fixture.matchday}`,
      type: 'academyEvent',
      subject: `${player.firstName} ${player.lastName} bryter igenom`,
      body: `I debuten mot ${opponent}. ${goal.minute}:e minuten. ${player.age} år gammal. Akademitränaren har ringt redan. "Han har varit den mest hungrige på träning i två år. Det är inte tur."`,
      choices: [{ id: 'ack', label: 'Grattis akademin' }],
    }
  }
  return null
}
```

### Event 2: Säsongsslut-sammanfattning

I `seasonEndProcessor.ts`:

```typescript
const promotions = game.players.filter(p => 
  p.academyClubId === game.managedClubId && 
  p.careerStats.totalGames >= 10 &&
  p.careerStats.seasonsPlayed === 1
).length

const sold = game.players.filter(p =>
  p.academyClubId === game.managedClubId &&
  p.clubId !== game.managedClubId
).length

// Generate inbox item
if (promotions > 0 || sold > 0) {
  game.inbox.push({
    id: `academy_summary_${game.currentSeason}`,
    type: 'academy',
    title: `Akademi-utfall ${game.currentSeason}`,
    body: `${promotions} spelare fick A-lagsdebut i år. ${sold} har sålts vidare — och pengarna gick tillbaka till akademin. Det är så det ska fungera.`,
    date: game.currentDate,
    isRead: false,
  })
}
```

---

## ID 4: WEAK-020 — Slutspel oddsarc

**Plats:** Nytt `src/domain/services/playoffNarrativeService.ts`, integration i `roundProcessor.ts`

### Koncept

Innan varje playoff-runda: ett narrativt event som bygger spänning.

### Kvartsfinal-trigger

```typescript
export function generateQuarterFinalEvent(game: SaveGame): GameEvent {
  const history = game.seasonSummaries
  const lastQF = history.filter(s => s.playoffResult?.round === 'quarterfinal').slice(-1)[0]
  
  let body = ''
  if (!lastQF) {
    body = 'Kvartsfinalen. Första gången någonsin vi är här. Kapten samlade alla i omklädningsrummet efter gårdagens pass. "Ingen har sett det här läget. Det är vår chans att bygga något."'
  } else {
    const yearsAgo = game.currentSeason - lastQF.season
    body = `Kvartsfinalen. Senast vi var här: för ${yearsAgo} år sedan. Klackens äldste veteraner minns — de sjöng i tre timmar efter den matchen, oavsett resultat. Nu är vi tillbaka.`
  }
  
  return {
    id: `playoff_qf_${game.currentSeason}`,
    type: 'playoffEvent',
    subject: 'Kvartsfinalen väntar',
    body,
    choices: [{ id: 'ack', label: 'Fokusera' }],
  }
}
```

### Semifinal-trigger

```typescript
export function generateSemiFinalEvent(game: SaveGame): GameEvent {
  const mecenat = (game.mecenater ?? []).find(m => m.isActive)
  const body = mecenat 
    ? `Semifinalen. ${mecenat.name} ringer. "Om ni tar er till final — jag och hela kontoret är där. Alla biljetter är mitt ansvar." Det är första gången hen säger något sådant.`
    : 'Semifinalen. Ordföranden skrev ett sms klockan fem på morgonen. "Jag sov två timmar i natt. Är det normalt?"'
  
  return {
    id: `playoff_sf_${game.currentSeason}`,
    type: 'playoffEvent',
    subject: 'Semifinalen — två matcher från guld',
    body,
    choices: [{ id: 'ack', label: 'Andas in' }],
  }
}
```

### Final-trigger

```typescript
export function generateFinalEvent(game: SaveGame): GameEvent {
  const supporter = game.supporterGroup?.leader.name
  return {
    id: `playoff_final_${game.currentSeason}`,
    type: 'playoffEvent',
    subject: 'SM-finalen',
    body: `Finalen. ${supporter ?? 'Ordföranden'} skrev i klubbens chatt i morse: "Det var förra generationens dröm. Nu är det vår tur att kanske göra den sann. Sov gott i natt om ni kan. Ingen av oss kommer göra det."`,
    choices: [{ id: 'ack', label: 'Det är dags' }],
  }
}
```

### Integration

I `playoffTransition.ts` eller `playoffProcessor.ts`: trigga events när lag kvalificerar sig till varje runda.

---

## ID 5: WEAK-012 — Klubb-reputation synlig

**Plats:** `ClubScreen.tsx` eller `KlubbTab.tsx`

### Koncept

Visa klubbens reputation som ett tydligt värde. Inte bara indirekt via tabell.

```tsx
<div className="card-sharp" style={{ padding: 12, marginBottom: 8 }}>
  <p style={LABEL}>KLUBBRENOMMÉ</p>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 28, fontWeight: 700, color: repColor(club.reputation) }}>
      {club.reputation}
    </span>
    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ 100</span>
    <span style={{ fontSize: 11, marginLeft: 'auto' }}>{repLabel(club.reputation)}</span>
  </div>
  <div style={{ display: 'flex', gap: 1, marginTop: 6 }}>
    <div style={{ flex: club.reputation, height: 4, background: repColor(club.reputation) }} />
    <div style={{ flex: 100 - club.reputation, height: 4, background: 'var(--border)' }} />
  </div>
</div>

function repLabel(r: number): string {
  if (r >= 85) return 'Elitklubb'
  if (r >= 70) return 'Etablerad topp'
  if (r >= 55) return 'Mittenklubb'
  if (r >= 40) return 'Utmanare'
  return 'Underdog'
}
```

---

## ID 6: WEAK-021 — Omklädningsrummet

**Plats:** `SquadScreen.tsx` (ny sektion), ev. ny komponent `LockerRoomCard.tsx`

### Enkel version (rekommenderad)

Ingen interaktion, bara visning. Bygger på existerande data.

```tsx
<div className="card-sharp" style={{ padding: 12 }}>
  <p style={LABEL}>OMKLÄDNINGSRUMMET</p>
  
  <div style={{ marginBottom: 8 }}>
    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>INRE CIRKEL</p>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {innerCircle.map(p => (
        <div key={p.id} style={{ padding: '4px 8px', background: 'var(--accent-subtle)', borderRadius: 4, fontSize: 10 }}>
          {p.lastName} {p.id === captainId && '(C)'}
        </div>
      ))}
    </div>
  </div>
  
  {peripheral.length > 0 && (
    <div>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>UTANFÖR</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {peripheral.map(p => (
          <div key={p.id} style={{ padding: '4px 8px', background: 'var(--border-subtle)', borderRadius: 4, fontSize: 10, opacity: 0.7 }}>
            {p.lastName}
          </div>
        ))}
      </div>
    </div>
  )}
  
  <p style={{ fontSize: 10, fontStyle: 'italic', marginTop: 8, color: 'var(--text-muted)' }}>
    Inre cirkel: kapten + spelare med högst lojalitet. Utanför: spelare med lägst lojalitet.
  </p>
</div>
```

### Beräkning

```typescript
function calculateLockerRoom(players: Player[], captainId?: string) {
  const sorted = [...players].sort((a, b) => b.loyaltyScore - a.loyaltyScore)
  const innerCircle = [
    ...(captainId ? [players.find(p => p.id === captainId)!] : []),
    ...sorted.filter(p => p.id !== captainId).slice(0, 3),
  ].filter(Boolean)
  
  const peripheral = sorted.filter(p => p.loyaltyScore < 40).slice(0, 2)
  
  return { innerCircle, peripheral }
}
```

---

## ORDNING

1. WEAK-012 rep synlig (~30min)
2. WEAK-018 säsongsstart-kontext (~2h)
3. WEAK-013 State of the Club (~2h)
4. WEAK-017 akademi narrativa events (~3h)
5. WEAK-020 slutspel-events (~2h)
6. WEAK-021 omklädningsrum-kort (~2h)

**Verifiering:**
- WEAK-012: ClubScreen visar rep-värde tydligt
- WEAK-018: BoardMeetingScreen har "Truppen just nu"-sektion
- WEAK-013: Säsong 2+ → PreSeason visar State of the Club-kort
- WEAK-017: Ung spelare gör debutmål → breakthrough-event i inbox. Säsongsslut → akademi-sammanfattning
- WEAK-020: Kvalificera till kvart → event triggar. Samma för semi och final
- WEAK-021: SquadScreen har omklädningsrum-sektion

## SLUTRAPPORT

```
WEAK-012: ✅/⚠️/❌
WEAK-013: ✅/⚠️/❌
WEAK-017: ✅/⚠️/❌
WEAK-018: ✅/⚠️/❌
WEAK-020: ✅/⚠️/❌
WEAK-021: ✅/⚠️/❌
```
