# SPRINT 11 — TAKTIKDJUP + VISUELL MATCHRYTM

**Berör ID:** NARR-003, NARR-004, NARR-005, VIS-006  
**Kostnad:** ~2 sessioner  
**Typ:** Feature (matchupplevelse)  
**Mockup:** `docs/mockups/sprint11_taktik_momentum.html`

---

## SYFTE

Matchen är idag textflöde + interaktioner. Ingen visuell rytm. Scoutrapporter kopplas inte till taktiska val. Truppledarskap finns inte som verb. Halvtidsmodal och taktikändring-modal är två parallella UI:n för samma sak. Denna sprint ger matchen puls och taktiken koppling.

---

## ID 1: NARR-003 — Visuell matchrytm (momentum-bar)

**Plats:** `MatchLiveScreen.tsx`, ny komponent `MomentumBar.tsx`

### Koncept

En horisontell stapel som skiftar mellan vänster (hemmalag) och höger (bortalag) baserat på vem som dominerar senaste ~3 matchsteg. Visas ovanför Scoreboard.

### Datamodell

I `MatchStep`-interfacet (om inte redan):

```typescript
interface MatchStep {
  // existing fields...
  momentum: number  // -10 (helt borta) till +10 (helt hem), 0 neutralt
}
```

I `matchCore.ts`, beräkna momentum per step:

```typescript
function calculateMomentum(recentSteps: MatchStep[]): number {
  // Senaste 5 stegen
  const recent = recentSteps.slice(-5)
  let score = 0
  for (const s of recent) {
    if (s.possessionHome) score += 1
    else score -= 1
    if (s.shotAttemptHome) score += 2
    if (s.shotAttemptAway) score -= 2
    if (s.event?.type === 'goal' && s.event.clubId === homeClubId) score += 5
    if (s.event?.type === 'goal' && s.event.clubId === awayClubId) score -= 5
  }
  return Math.max(-10, Math.min(10, score))
}
```

### Komponent

```tsx
// MomentumBar.tsx
interface Props {
  momentum: number  // -10 to +10
  homeShortName: string
  awayShortName: string
}

export function MomentumBar({ momentum, homeShortName, awayShortName }: Props) {
  const percent = 50 + (momentum / 10) * 45  // 5-95% range
  const isHomeDominant = momentum > 3
  const isAwayDominant = momentum < -3
  
  return (
    <div style={{ margin: '4px 12px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>
        <span style={{ fontWeight: isHomeDominant ? 700 : 400, color: isHomeDominant ? 'var(--accent)' : undefined }}>
          {homeShortName}
        </span>
        <span style={{ fontWeight: isAwayDominant ? 700 : 400, color: isAwayDominant ? 'var(--accent)' : undefined }}>
          {awayShortName}
        </span>
      </div>
      <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${percent}%`,
          background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent-subtle) 100%)',
          transition: 'width 0.4s ease-out',
        }} />
        <div style={{
          position: 'absolute',
          left: '50%',
          top: -2,
          width: 1,
          height: 7,
          background: 'var(--text-muted)',
          opacity: 0.3,
        }} />
      </div>
    </div>
  )
}
```

### Integration

```tsx
// MatchLiveScreen
<Scoreboard ... />
<MomentumBar 
  momentum={latestStep.momentum ?? 0}
  homeShortName={homeClubName}
  awayShortName={awayClubName}
/>
<CommentaryFeed ... />
```

---

## ID 2: NARR-004 — Motståndarspecifik taktik

**Plats:** `TacticScreen.tsx` eller `MatchScreen.tsx` (pre-match), ny service `src/domain/services/tacticRecommendationService.ts`

### Koncept

Scoutrapporter finns men är passiva. Nu ska de generera konkreta taktiska förslag inför match.

### Analysera motståndaren

```typescript
export interface TacticRecommendation {
  type: 'star_player' | 'corner_threat' | 'defensive_weakness' | 'counter_vulnerability'
  title: string
  body: string
  effect: string  // t.ex. "+2% corner defensive, -1% corner offensive"
  tacticPatch: Partial<Tactic>  // föreslagna ändringar
}

export function analyzeOpponent(
  opponent: Club,
  opponentPlayers: Player[],
  game: SaveGame,
): TacticRecommendation[] {
  const recs: TacticRecommendation[] = []
  
  // Stjärn-spelare (CA 70+)
  const stars = opponentPlayers
    .filter(p => p.currentAbility >= 70)
    .sort((a, b) => b.currentAbility - a.currentAbility)
  if (stars[0]) {
    const star = stars[0]
    recs.push({
      type: 'star_player',
      title: `Motståndarens stjärna: ${star.firstName} ${star.lastName}`,
      body: `${star.position === 'Forward' ? 'Anfallaren' : 'Nyckelspelaren'} har CA ${star.currentAbility}. ${star.seasonStats.goals} mål hittills i säsong.`,
      effect: 'Tight markering: -1% egen offensiv, motståndarens stjärna -15% effektivitet',
      tacticPatch: { press: 'High' as TacticPress },
    })
  }
  
  // Corner-hot
  const cornerSpecialists = opponentPlayers.filter(p => 
    p.archetype === 'CornerSpecialist' || p.attributes.cornerSkill >= 75
  )
  if (cornerSpecialists.length >= 2) {
    recs.push({
      type: 'corner_threat',
      title: 'Cornerhot',
      body: `${cornerSpecialists.length} spelare med hög cornerSkill. De gör ${Math.round(opponent.seasonStats?.cornerGoalShare * 100 ?? 25)}% av sina mål på hörnor.`,
      effect: 'CornerStrategy: Safe → -2% egen cornereffektivitet men -30% egen risk',
      tacticPatch: { cornerStrategy: 'Safe' as CornerStrategy },
    })
  }
  
  // Defensiv svaghet
  const avgDefending = opponentPlayers
    .filter(p => p.position === 'Defender' || p.position === 'Half')
    .reduce((s, p) => s + p.attributes.defending, 0) / 
    opponentPlayers.filter(p => p.position === 'Defender' || p.position === 'Half').length
  if (avgDefending < 55) {
    recs.push({
      type: 'defensive_weakness',
      title: 'Svagt försvar',
      body: `Snitt-defending ${Math.round(avgDefending)} i ytterförsvar och halvor. Förmodligen sårbara för direkt spel.`,
      effect: 'Tempo: High + Direct passing → +3% egen offensiv',
      tacticPatch: { tempo: 'High' as TacticTempo, passingRisk: 'Direct' as TacticPassingRisk },
    })
  }
  
  return recs
}
```

### UI i taktik-skärmen

```tsx
{recommendations.length > 0 && (
  <div className="card-sharp" style={{ padding: 12, marginBottom: 10 }}>
    <p style={LABEL}>🔍 SCOUTRAPPORT</p>
    {recommendations.map((r, i) => (
      <div key={i} style={{ padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
        <p style={{ fontSize: 11, fontWeight: 600 }}>{r.title}</p>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{r.body}</p>
        <p style={{ fontSize: 10, fontStyle: 'italic' }}>{r.effect}</p>
        <button onClick={() => applyTacticPatch(r.tacticPatch)} style={{ fontSize: 10, marginTop: 4 }}>
          Justera taktiken
        </button>
      </div>
    ))}
  </div>
)}
```

---

## ID 3: NARR-005 — Truppledarskap

**Plats:** `PlayerCard.tsx` (ny action-sektion), ny service `src/domain/services/leadershipService.ts`

### Koncept

Spelaren kan göra konkreta ledarskapsåtgärder. Inte interaktiva storlines — mikroåtgärder med små, spårbara effekter.

### Actions

1. **Sänk ett varv** — "Jag vill att du sänker tempot ett varv" — cooldown 2 omg, -1 press-effort denna match, +2 fitness, -1 offensiv output
2. **Sätt som mentor** — matchar med en ung spelare (< 22); under 3 omgångar: ungdomsspelarens development_rate +10%
3. **Privat samtal** — +3 moraljusteringen (upp eller ner baserat på form/situation); cooldown 3 omg per spelare
4. **Offentlig beröm** — +5 morale för spelaren, -2 för de andra som inte får (jealousy); cooldown 5 omg

### PlayerCard integration

```tsx
<div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
  <p style={LABEL}>LEDARSKAP</p>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
    <button onClick={() => useLeadershipAction(player.id, 'lower_tempo')} disabled={cooldownActive('lower_tempo')}>
      Sänk ett varv
    </button>
    <button onClick={() => useLeadershipAction(player.id, 'mentor')} disabled={!canMentor || cooldownActive('mentor')}>
      Sätt som mentor
    </button>
    <button onClick={() => useLeadershipAction(player.id, 'private_talk')} disabled={cooldownActive('private_talk')}>
      Privat samtal
    </button>
    <button onClick={() => useLeadershipAction(player.id, 'public_praise')} disabled={cooldownActive('public_praise')}>
      Offentlig beröm
    </button>
  </div>
</div>
```

### Data

```typescript
// i SaveGame
leadershipActions?: Array<{
  playerId: string
  action: 'lower_tempo' | 'mentor' | 'private_talk' | 'public_praise'
  fromRound: number
  expiresRound: number
  effect: { stat: string; delta: number }
}>
```

---

## ID 4: VIS-006 — Halvtidsmodal enhetlig

**Plats:** `HalftimeModal.tsx`, `TacticQuickModal.tsx`, eventuellt ny `TacticChangeModal.tsx`

### Problem idag

Två UI-mönster för samma funktion (taktikändring):
1. Halvtid → `HalftimeModal` med halvtidsstatistik + taktikändring
2. ⚙-knapp under spel → `TacticQuickModal` med bara taktikändring

Olika layout, olika knapptexter, olika animationer.

### Fix

Samla taktikändring i en gemensam `TacticChangeModal.tsx`-komponent:

```tsx
interface Props {
  currentTactic: Tactic
  onSave: (newTactic: Tactic) => void
  onClose: () => void
  context: 'halftime' | 'mid_match'  // styr vilken extrainfo som visas
  halftimeStats?: HalftimeStatistics
  changesRemaining: number  // 3 max per match
}
```

### HalftimeModal wrapping

```tsx
// HalftimeModal.tsx blir wrapper
export function HalftimeModal({ stats, onContinue, tactic, onTacticChange }) {
  return (
    <div className="overlay">
      <h2>HALVTID</h2>
      <div className="stats-grid">
        {/* halvtidsstatistik */}
      </div>
      <TacticChangeModal
        currentTactic={tactic}
        onSave={onTacticChange}
        onClose={onContinue}
        context="halftime"
        halftimeStats={stats}
        changesRemaining={3}
      />
    </div>
  )
}
```

### TacticQuickModal ersätts

Ta bort `TacticQuickModal` helt. Där den användes under match → öppna `TacticChangeModal` direkt med `context="mid_match"`.

---

## ORDNING

1. VIS-006 halvtidsmodal enhet (~3h, rendermässig städning)
2. NARR-003 momentum-bar (~3h, behöver matchCore-integration)
3. NARR-004 motståndarspecifik taktik (~4h, scoutkoppling)
4. NARR-005 truppledarskap (~4h, nytt system)

**Verifiering:**
- VIS-006: Öppna halvtidsmodal och mid-match tactic-modal — samma komponent, samma UX
- NARR-003: Spela match → momentum-bar skiftar i realtid efter händelser
- NARR-004: Scouta motståndaren → taktikskärm visar rekommendationer → klick applicerar patch
- NARR-005: Klicka "Sänk ett varv" → effekt synlig i matchen, cooldown syns på knappen

## SLUTRAPPORT

```
VIS-006: ✅/⚠️/❌
NARR-003: ✅/⚠️/❌
NARR-004: ✅/⚠️/❌
NARR-005: ✅/⚠️/❌
```
