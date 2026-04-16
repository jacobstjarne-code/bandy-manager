# SPRINT 04 — EKONOMI & TRANSFER-NARRATIV

**Tid:** ~4h · **ATGARDSBANK:** BUG-008, WEAK-015, DEV-004, WEAK-003, DEV-001, DEV-012

Samma subsystem: ekonomi + transfer. En session.

---

## BUG-008 — Negativ kassa stoppas inte

Plats: `src/domain/services/economyService.ts` `applyFinanceChange` + transferService

Lägg till i `applyFinanceChange`:
```typescript
export function applyFinanceChange(
  clubs: Club[],
  clubId: string,
  amount: number,
): Club[] {
  return clubs.map(c => {
    if (c.id !== clubId) return c
    const newFinances = c.finances + amount
    // Ingen hard block här — bara mutation. Block sker i callers.
    return { ...c, finances: newFinances }
  })
}
```

Block-logik i `transferService.ts` `executeTransfer`:
```typescript
// Före köp-transaktion:
const buyingClub = clubs.find(c => c.id === buyerClubId)
if (buyingClub && buyingClub.finances - transferFee < -100000) {
  return { success: false, error: 'Klubbkassan tillåter inte köpet. Gränsen är -100k.' }
}
```

Varning vid -50k: lägg till i `generateEvents` i roundProcessor:
```typescript
if (managedClub.finances < -50000 && managedClub.finances >= -100000) {
  // generera inbox varning om inte redan skickad denna säsong
}
```

Kritiskt event vid -100k: license_review-event-trigger (finns troligen redan, verifiera).

---

## WEAK-015 + DEV-004 — Transfer med historia

Plats: `src/domain/services/transferService.ts` `executeTransfer`

Före standard inbox-event, kolla spelarens status:
```typescript
const isCaptain = game.captainPlayerId === player.id
const isFanFavorite = game.supporterGroup?.favoritePlayerId === player.id
const hasActiveArc = (game.activeArcs ?? []).some(a => a.playerId === player.id && a.phase !== 'resolving')
const isLegend = player.careerStats.totalGames >= 80
const isHomegrown = player.isHomegrown && player.clubId === player.academyClubId

const hasHistory = isCaptain || isFanFavorite || hasActiveArc || isLegend || isHomegrown

if (hasHistory && selling) {
  // Rikt narrativt event
  newInboxItems.push({
    id: `transfer_story_${player.id}`,
    type: InboxItemType.Transfer,
    title: `${player.firstName} ${player.lastName} lämnar`,
    body: buildTransferStory(player, { isCaptain, isFanFavorite, hasActiveArc, isLegend, isHomegrown }, buyerClub),
    // ...
  })
}
```

`buildTransferStory`-funktionen:
```typescript
function buildTransferStory(player, flags, buyerClub) {
  const parts: string[] = []
  if (flags.isCaptain) {
    parts.push(`Kaptenen är borta. ${player.firstName} ${player.lastName} tog bindeln sist och gav laget en hållhake hela säsongen.`)
  }
  if (flags.isFanFavorite) {
    parts.push('Klacken är tyst. "Vi förlåter inte det här i första taget" skriver en insändare.')
  }
  if (flags.isHomegrown) {
    parts.push(`${player.firstName} växte upp här. Tränade i vår akademi. Det här är en del av klubbens historia som lämnar.`)
  }
  if (flags.isLegend) {
    parts.push(`${player.careerStats.totalGames} matcher i tröjan. ${player.careerStats.totalGoals} mål. En epok är över.`)
  }
  if (flags.hasActiveArc) {
    parts.push('Berättelsen om honom fick inte ett slut — den klipptes av.')
  }
  parts.push(`Han skrev på för ${buyerClub?.name ?? 'annan klubb'}.`)
  return parts.join(' ')
}
```

---

## WEAK-003 + DEV-001 — budgetPriority synlig i EkonomiTab

Plats: `src/presentation/components/club/EkonomiTab.tsx`

Lägg till sektion nära toppen:
```tsx
{game.budgetPriority && (
  <SectionCard title="🎯 Budgetprioritet">
    <div style={{ padding: '8px 0' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        {game.budgetPriority === 'squad' && 'Truppen först'}
        {game.budgetPriority === 'youth' && 'Ungdomssatsning'}
        {game.budgetPriority === 'balanced' && 'Balanserat'}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {game.budgetPriority === 'squad' && 'Du lägger +15% extra på löner denna säsong. Akademi -10%.'}
        {game.budgetPriority === 'youth' && '+20% till akademi och ungdomsutveckling. Löner -10%.'}
        {game.budgetPriority === 'balanced' && 'Jämn fördelning mellan trupp och akademi.'}
      </p>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
        Valet gäller hela säsongen. Ändra vid nästa säsongsstart.
      </p>
    </div>
  </SectionCard>
)}
```

---

## DEV-012 — Economic stress-events

Plats: `src/domain/services/events/eventFactories.ts` (eller motsv.)

Ny event-typ:
```typescript
export function createEconomicStressEvent(game: SaveGame): GameEvent | null {
  const finances = game.clubs.find(c => c.id === game.managedClubId)?.finances ?? 0
  if (finances >= 50000 || finances < -100000) return null
  // Bara mellan -100k och +50k — det är zonen där mikrobeslut känns

  const options = [
    {
      id: 'economic_stress_clubs',
      title: 'Materialarens fråga',
      body: 'Materialaren: "Fem klubbor gick sönder i veckan. Köper vi nya nu eller väntar en månad?"',
      choices: [
        { id: 'buy', label: 'Köp nya direkt (−3k)', effect: { type: 'finance', amount: -3000 } },
        { id: 'wait', label: 'Vänta — grabbarna får klara sig', effect: { type: 'moraleDelta', amount: -2 } },
      ],
    },
    {
      id: 'economic_stress_bus',
      title: 'Bussbolaget ringde',
      body: 'Bussbolaget: "Vi höjer 8% från nästa månad. Vill ni skriva nytt 3-årsavtal med lägre höjning eller köra som vanligt?"',
      choices: [
        { id: 'sign', label: 'Skriv nytt avtal (−5k nu, −2k/omg senare)', effect: { type: 'finance', amount: -5000 } },
        { id: 'shop', label: 'Fråga andra bolag — kan ta tid', effect: { type: 'noOp' } },
      ],
    },
    {
      id: 'economic_stress_kiosk',
      title: 'Kioskvakten: förnyar vi korvavtalet?',
      body: 'Korvfabriken vill sälja oss exklusivt. 10% billigare men låst i två år.',
      choices: [
        { id: 'lock', label: 'Skriv — bra marginaler', effect: { type: 'finance', amount: 4000 } },
        { id: 'free', label: 'Behåll flexibiliteten', effect: { type: 'noOp' } },
      ],
    },
  ]

  // Slumpa en av alternativen, men max 1 stress-event per 6 omgångar
  if (game.lastEconomicStressRound && (game.currentRound - game.lastEconomicStressRound) < 6) return null
  const chosen = options[Math.floor(Math.random() * options.length)]
  return { ...chosen, resolved: false }
}
```

Kolla trigger-villkoret i roundProcessor — anropa efter fixture-processing.

---

## SLUT

`npm run build && npm test`
