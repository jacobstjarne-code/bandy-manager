
## PARKERAT — Framtida sprintar (ej prioriterade, men fullspecade)

### P1 — Presskonferens som visuell scen

**Vad:** Presskonferenser existerar redan som `GameEvent` med `type: 'pressConference'` i `eventResolver.ts`. Men de renderas som generiska EventOverlay-kort — samma layout som politikerhändelser och sponsorbeslut. Känslan av att sitta bakom mikrofonen saknas.

**Ny komponent:** `src/presentation/components/PressConferenceScene.tsx`

Layout (se designreferens nedan):
```
┌──────────────────────────────────┐
│  📰 PRESSKONFERENS               │
│  Efter 3:e raka förlusten        │
│                                  │
│  ┌──────────────────────────┐    │
│  │  Journalisten            │    │
│  │  Karin Ström             │    │
│  │  Lokaltidningen          │    │
│  │                          │    │
│  │  "Hur förklarar du tre   │    │
│  │   raka förluster?"       │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ "Vi jobbar vidare."         │ │
│  │  Neutral — ingen effekt     │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ "Fråga spelarna, inte mig." │ │
│  │  Aggressiv — journalist −5  │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ Vägra svara.                │ │
│  │  Tyst — reputation −2       │ │
│  └─────────────────────────────┘ │
└──────────────────────────────────┘
```

**Visuellt:** INTE en generisk EventOverlay. En dedikerad scen med:
- card-sharp med bg-elevated bakgrund
- Journalistens namn + tidning i en "frågebubbla" (bg-surface, border, border-radius)
- Frågan i kursiv Georgia
- Tre val under (samma choice-btn-stil som halvtidsbeslutet)

**Journalistpersona:** Redan finns `game.journalist` med `name`, `relationship`, `outlet`. Utöka med:
```typescript
export interface Journalist {
  name: string
  outlet: string          // "Lokaltidningen", "Bandypuls", "SVT Dalarna"
  relationship: number    // 0-100
  style: 'neutral' | 'provocative' | 'supportive'
}
```

**Frågor beror på kontext:**

| Trigger | Fråga | Ton |
|---------|-------|-----|
| 3+ raka förluster | "Hur förklarar du formen?" | provokativ |
| Stor seger (4+ mål) | "En dominant insats. Vad var nyckeln?" | stödjande |
| Hörnmål avgjorde | "Hörnorna var avgörande. Tränar ni extra?" | neutral |
| Nyförvärv debuterade | "Hur bedömer du {namn}s debut?" | neutral |
| Klacken protesterade | "Supportrarna verkar missnöjda. Din kommentar?" | provokativ |
| Inför derby | "Inför {rivalryName}. Hur ser du på matchen?" | neutral |
| Akademispelare startade | "Du satsar ungt. Medvetet?" | stödjande |
| Playoff-plats klar | "Ni har säkrat slutspelsplats. Nöjd?" | stödjande |
| Tabellbotten | "Ni ligger sist. Är jobbet i fara?" | provokativ |

**Fil:** `src/domain/services/pressConferenceService.ts`

```typescript
export interface PressQuestion {
  question: string
  context: string   // visas ovanför frågan: "Efter 3:e raka förlusten"
  tone: 'neutral' | 'provocative' | 'supportive'
  choices: Array<{
    id: string
    label: string     // citatet
    subtitle: string  // effekt-beskrivning
    effects: {
      journalistRelationship?: number
      reputation?: number
      morale?: number
      supporterMood?: number
    }
  }>
}

export function generatePressQuestion(game: SaveGame): PressQuestion | null {
  // Bara efter matcher (inte varje omgång)
  // ~40% chans efter vinst, ~70% chans efter förlust, ~20% efter kryss
  // Aldrig två omgångar i rad
}
```

**Svar-effekter:**
- "Vi jobbar vidare" (neutral) → ingen effekt, journalist nöjd (+2 rel)
- "Fråga spelarna" (aggressiv) → journalist −5, laget morale +3 (tränaren tar smällen)  
- "Vi var bättre än resultatet" (optimistisk) → journalist +3, klacken +2 (om vinst), klacken −3 (om förlust — verklighetsfrånvänd)
- Vägra svara → journalist −10, reputation −2, men morale +5 (laget gillar att tränaren skyddar dem)
- "Jag tar ansvaret" (ödmjuk, bara vid förlust) → journalist +5, morale −2, supporterMood +5

**Frekvens:** Max varannan omgång. Journalist-relationen påverkar vilka frågor som ställs — hög relation → mjukare frågor, låg → hårdare.

**Integration:** Ersätter befintliga `pressConference`-events i `eventResolver.ts`. Samma triggers, ny rendering. `PressConferenceScene` renderas istället för `EventOverlay` när `event.type === 'pressConference'`.

---

### P2 — Transferdödline-känsla

**Vad:** Transferfönstret (omgång 1-15) stänger tyst. Ingen countdown, ingen panik, inget drama. I verkligheten är de sista dagarna kaotiska.

**Tre komponenter:**

**A) Header-indikator (omgång 13-15):**

```typescript
// I DashboardScreen, ovanför NextMatchCard:
{transferWindowClosesIn <= 3 && transferWindowClosesIn > 0 && (
  <div style={{ 
    padding: '4px 12px', 
    background: 'rgba(176,80,64,0.06)', 
    borderBottom: '1px solid rgba(176,80,64,0.15)',
    textAlign: 'center',
  }}>
    <p style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 600 }}>
      ⏳ Transferfönstret stänger om {transferWindowClosesIn} omgång{transferWindowClosesIn > 1 ? 'ar' : ''}
    </p>
  </div>
)}
```

**B) AI-panikbud (omgång 14-15):**

**Fil:** `src/domain/services/transferDeadlineService.ts`

```typescript
export interface DeadlineBid {
  clubId: string
  clubName: string
  playerId: string
  playerName: string
  amount: number
  reason: string   // "De behöver en forward desperat", "Ersättare för skadad spelare"
}

export function generateDeadlineBids(game: SaveGame, rand: () => number): DeadlineBid[] {
  // 30% chans per omgång (14-15) att ETT AI-lag lägger bud
  // Budet är 20-40% ÖVER marknadsvärde (panikpris)
  // Riktas mot managed clubs spelare med: hög CA, inte favorit hos klacken, 
  //   kontraktssituation > 1 säsong kvar
  // Max 2 bud per transferfönster
}
```

Budet kommer som inbox-meddelande:
```
📬 BUD: Bollnäs erbjuder 180 000 kr för Lindberg
"Vi behöver en forward. Det här är vårt sista erbjudande."
→ Acceptera (pengar + klack-reaktion)
→ Avvisa
→ Motbud (+30%)
```

Klacken reagerar om favoriten säljs i dödlinefönstret — hårdare reaktion än vanligt:
`Tommy: "Ni sålde honom i sista sekunden. Inte ens en förklaring."`

**C) Rabatt-värvningar (omgång 14-15):**

AI-lag med överskott erbjuder spelare till rabatt (20-30% under marknadsvärde):
```
📬 ERBJUDANDE: Fagersta erbjuder Eriksson (FW, 62 CA) för 45 000 kr
"Han sitter på bänken. Vi vill att han spelar."
→ Köp (om råd)
→ Avvisa
```

**Fil:** `src/domain/services/events/transferDeadlineEvents.ts`

Genereras i `roundProcessor` vid omgång 14-15. Använder befintlig transfer-logik men med panikpriser.

---

### P3 — Klubbens rykte utanför orten

**Vad:** Narrativa inbox-meddelanden som signalerar att klubben växer (eller krymper) i omvärldens ögon. Ingen ny mekanik — bara triggers + text.

**Fil:** `src/domain/services/reputationMilestoneService.ts`

```typescript
export interface ReputationMilestone {
  id: string
  trigger: ReputationTrigger
  title: string
  body: string
  effect?: { type: string; amount: number }
}

type ReputationTrigger =
  | 'academyNoticed'      // P19 landslagstränaren
  | 'mediaAttention'      // Bandypuls/SVT vill göra reportage
  | 'neighborClubContact' // Grannklubb vill samarbeta
  | 'sponsorApproach'     // Ny sponsor hör av sig
  | 'scoutVisit'          // Talangscout besöker match
  | 'reputationWarning'   // Ryktet sjunker — varningssignal

export function checkReputationMilestones(game: SaveGame): ReputationMilestone[] {
  const milestones: ReputationMilestone[] = []
  const rep = game.clubs.find(c => c.id === game.managedClubId)?.reputation ?? 50
  const cs = game.communityStanding ?? 50
  const pos = game.standings.find(s => s.clubId === game.managedClubId)?.position ?? 6
  const season = game.currentSeason
  const alreadySeen = new Set(game.resolvedEventIds ?? [])

  // P19-landslagstränaren (reputation > 65 + akademi > 60)
  const youthQuality = game.clubs.find(c => c.id === game.managedClubId)?.youthQuality ?? 50
  if (rep > 65 && youthQuality > 60) {
    const eid = `rep_academy_${season}`
    if (!alreadySeen.has(eid)) {
      milestones.push({
        id: eid,
        trigger: 'academyNoticed',
        title: '🔍 P19-landslagstränaren har noterat er',
        body: `"Vi följer er akademi med intresse. Ni har några spännande talanger." \n\nEtt erkännande som sprider sig — spelarnas motivation ökar.`,
        effect: { type: 'morale', amount: 3 },
      })
    }
  }

  // Mediaintresse (topp 3 + CS > 60)
  if (pos <= 3 && cs > 60) {
    const eid = `rep_media_${season}`
    if (!alreadySeen.has(eid)) {
      milestones.push({
        id: eid,
        trigger: 'mediaAttention',
        title: '📺 Bandypuls vill göra ett reportage',
        body: `"Er resa den här säsongen är en historia som förtjänas att berättas. Kan vi komma förbi på en träning?"\n\nBra publicitet — om ni fortsätter leverera.`,
        effect: { type: 'reputation', amount: 3 },
      })
    }
  }

  // Grannklubb vill samarbeta (CS > 70)
  if (cs > 70) {
    const eid = `rep_neighbor_${season}`
    if (!alreadySeen.has(eid)) {
      const neighbors = game.clubs.filter(c => c.id !== game.managedClubId).slice(0, 3)
      const neighbor = neighbors[season % neighbors.length]
      milestones.push({
        id: eid,
        trigger: 'neighborClubContact',
        title: `🤝 ${neighbor?.name ?? 'Grannklubben'} hör av sig`,
        body: `"Vi ser hur ni jobbar med orten. Kan vi träffas och prata om ett ungdomssamarbete?"\n\nEtt tecken på att ert arbete uppmärksammas.`,
        effect: { type: 'communityStanding', amount: 2 },
      })
    }
  }

  // Talangscout besöker match (reputation > 70 + har akademispelare i A-laget)
  const hasAcademyPlayer = game.players.some(p => 
    p.clubId === game.managedClubId && p.promotedFromAcademy && p.age <= 21
  )
  if (rep > 70 && hasAcademyPlayer) {
    const eid = `rep_scout_${season}`
    if (!alreadySeen.has(eid)) {
      const youngStar = game.players
        .filter(p => p.clubId === game.managedClubId && p.promotedFromAcademy && p.age <= 21)
        .sort((a, b) => b.potentialAbility - a.potentialAbility)[0]
      milestones.push({
        id: eid,
        trigger: 'scoutVisit',
        title: '👀 Talangscout på läktaren',
        body: `En scout från Elitserien satt på läktaren under senaste hemmamatchen. ${youngStar ? `Ögonen var riktade mot ${youngStar.firstName} ${youngStar.lastName}.` : 'Intresset växer.'}\n\nBra för ryktet. Kanske mindre bra för plånboken — om de vill köpa.`,
      })
    }
  }

  // Ryktet sjunker (position >= 10, CS < 40, reputation tappat > 5 sedan säsongsstart)
  if (pos >= 10 && cs < 40) {
    const eid = `rep_warning_${season}`
    if (!alreadySeen.has(eid)) {
      milestones.push({
        id: eid,
        trigger: 'reputationWarning',
        title: '📉 Ryktet bleknar',
        body: `Sponsorer drar sig undan. Talanger väljer andra klubbar. Kommunen frågar sig om pengarna gör nytta.\n\nDet här går åt fel håll.`,
        effect: { type: 'reputation', amount: -2 },
      })
    }
  }

  return milestones.slice(0, 1) // max en per omgång
}
```

**Integration:** Anropas i `roundProcessor.ts` efter omgång 8 (inte för tidigt). Milestones genereras som inbox-items med `InboxItemType.ReputationMilestone`. Inga val — bara info + eventuell effekt.

**Koppling till klacken:** Vid `academyNoticed` → Elin i kafferummet: "Såg ni? LANDSLAGET tittar på oss!" Vid `reputationWarning` → Sture: "Det var bättre förr. Och jag menar det den här gången."
