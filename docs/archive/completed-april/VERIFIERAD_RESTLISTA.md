# VERIFIERAD RESTLISTA — 5 APRIL 2026

Baserad på kodgranskning fil för fil. Varje punkt är 
verifierad mot faktisk kod — inte gissningar.

Följ FORSTARKNINGSSPEC_V3_FINAL.md DEL B (kodkvalitet) 
och DEL E (grafiska riktlinjer).

---

## VERIFIERAT IMPLEMENTERAT (rör ej)

Dessa saker FINNS i koden och funkar. Nämns för att 
Code inte ska "implementera om" dem:

- BottomNav 6 tabs (Hem/Trupp/Match/Tabell/Transfers/Klubb)
- GameHeader med 🔔 inkorg (badge) + ⚙️ ikon
- DoctorFAB flytande knapp
- OnboardingShell i NewGameScreen (header+footer)
- capitalizeName vid sparande
- Slumpmässigt förvalt lag
- TabellScreen: hasPlayed-guard för serieledare/zon
- MatchHeader progressiv (steg 1: väder, steg 2: +hint, steg 3: +taktik+tränarcitat)
- StartStep: "SPELA MATCHEN →", taktiksammanfattning, väder, live/snabbsim-toggle
- HalftimeModal med taktikändring (mentality/tempo/press) + substitutions
- BidModal + RenewContractModal: heritage-design med var(--bg-surface), btn-copper
- Lön avrundad till närmaste 500 i BidModal
- MatchLiveScreen: visuell differentiering av händelser (mål=orange, utvisning=röd, hörna=copper)
- LastResultCard: emoji + one-liner ("🎉 Storstilat!", "😞 Tungt", etc.)
- MatchResultScreen: resultatvy med målskyttar, POTM, flavor text
- RoundSummaryScreen: omgångssammanfattning med TappableCards

---

## REST — Vad som FAKTISKT saknas

### R1. "rinkar" → "planer" i NewGameScreen introtext

**Fil:** `src/presentation/screens/NewGameScreen.tsx`
**Rad:** ~117 (inuti `<p>` under "VEM ÄR DU?")

**Nuvarande text:**
```
Bandyn behöver folk som dig. Tränare som ställer sig 
på kalla rinkar i november, som håller ihop en trupp 
där hälften jobbar dagtid.
```

**Ska vara (kopiera bokstavligt):**
```
Bandyn behöver folk som dig. Tränare som trampar snö på väg till planen en tisdagskväll i november. Som vet att en hörna i 87:e kan vända allt. Som förstår att halva truppen har jobbat sedan sex på morgonen — och ändå ställer upp.
```

Dessutom: sök i HELA kodbasen:
```bash
grep -rni "rink" src/ --include="*.ts" --include="*.tsx" \
  | grep -v node_modules | grep -v "// " | grep -v ".d.ts"
```
Ersätt ALLA förekomster av "rink" med "plan" eller "bandyplan".
"Rink" = ishockey. Bandy spelas på "plan".

---

### R2. BoardMeetingScreen — saknar OnboardingShell

**Fil:** `src/presentation/screens/BoardMeetingScreen.tsx`
**Problem:** Har ingen header ("BANDY MANAGER") eller 
footer ("BURY FEN"). Alla andra onboarding-skärmar har det.

**Fix:** Wrappa hela BoardMeetingScreen-returen i:

```typescript
<div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
  <header style={{
    background: 'var(--bg-dark)', height: 48, 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    flexShrink: 0,
  }}>
    <span style={{ 
      color: 'var(--text-light)', fontSize: 11, letterSpacing: 3, 
      textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 600 
    }}>
      BANDY MANAGER
    </span>
  </header>
  
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
    {/* Befintligt BoardMeeting-innehåll här */}
  </div>
  
  <footer style={{
    height: 40, background: 'var(--bg)', 
    borderTop: '1px solid var(--border)', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    flexShrink: 0,
  }}>
    <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2 }}>
      BURY FEN
    </span>
  </footer>
</div>
```

---

### R3. StartStep — saknar atmosfärtext

**Fil:** `src/presentation/components/match/StartStep.tsx`
**Problem:** Visar taktiksammanfattning + väder + spelläge, 
men INGEN stämningssättande text.

**Fix:**

**Steg 1: Utöka props:**
```typescript
interface StartStepProps {
  startingIds: string[]
  tacticState: Tactic
  matchWeatherData: MatchWeather | undefined
  useLiveMode: boolean
  lineupError: string | null
  onSetLiveMode: (v: boolean) => void
  onBack: () => void
  onPlay: () => void
  // NYA:
  fixture: Fixture
  isHome: boolean
  fanMood: number
}
```

**Steg 2: Atmosfär-generator (lägg i StartStep.tsx):**
```typescript
import { getRivalry } from '../../../domain/data/rivalries'
import { WeatherCondition } from '../../../domain/enums'

function getPreMatchAtmosphere(
  fixture: Fixture,
  weather: MatchWeather | undefined,
  isHome: boolean,
  fanMood: number,
): string {
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
  
  if (rivalry) {
    const t = ['Derbystämning. Du hör bortaläktaren redan från omklädningsrummet.',
      'Derby. Tre poäng räcker inte — det här handlar om stolthet.',
      `${rivalry.name}. Hela orten pratar om den här matchen.`]
    return t[Math.floor(Math.random() * t.length)]
  }
  if (fixture.playoffRound) {
    const t = ['Allt har lett fram till det här. Förloraren åker hem.',
      'Slutspel. Inga andra chanser. Allt eller inget.']
    return t[Math.floor(Math.random() * t.length)]
  }
  if (fixture.isCup) return 'Cupmatch. En chans. Vinn eller åk hem.'
  if (weather?.weather.condition === WeatherCondition.HeavySnow)
    return 'Snön vräker ner. Det här blir en fight, inte en uppvisning.'
  if (weather?.weather.condition === WeatherCondition.Fog)
    return 'Dimma över planen. Strålkastarna kämpar mot mörkret.'
  if (weather?.weather.condition === WeatherCondition.Thaw)
    return 'Plusgrader och blöt is. Inte en dag för fint spel.'
  if (isHome && fanMood > 65) {
    const t = ['Strålkastarna lyser upp planen. Publiken strömmar in.',
      'Hemmamatch. Planen är preparerad. Laget är redo.']
    return t[Math.floor(Math.random() * t.length)]
  }
  if (isHome && fanMood < 35)
    return 'Glest på läktarna. De som kommit väntar på att bli övertygade.'
  if (!isHome) {
    const t = ['Bortaplan. Lång bussresa bakom er. Dags att visa varför ni kom.',
      'Borta. Liten klick supportrar har följt med. Gör det värt resan.']
    return t[Math.floor(Math.random() * t.length)]
  }
  return 'Omklädningsrummet är tyst. Alla vet vad som gäller.'
}
```

**Steg 3: Rendera ÖVERST i StartStep, före sammanfattningen:**
```typescript
<div className="card-round" style={{
  marginBottom: 12, padding: '14px 16px',
  fontFamily: 'var(--font-display)',
  fontStyle: 'italic',
  fontSize: 14,
  lineHeight: 1.6,
  color: 'var(--text-secondary)',
}}>
  {getPreMatchAtmosphere(fixture, matchWeatherData, isHome, fanMood)}
</div>
```

**Steg 4: Skicka props från MatchScreen.tsx:**
Där `<StartStep>` renderas, lägg till:
```typescript
fixture={nextFixture}
isHome={nextFixture.homeClubId === managedClubId}
fanMood={game.communityStanding ?? 50}
```

---

### R4. MatchLiveScreen — saknar statistik-footer

**Fil:** `src/presentation/screens/MatchLiveScreen.tsx`

**Fix: Skapa ny komponent:**
`src/presentation/components/match/StatsFooter.tsx`

```typescript
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { MatchEventType } from '../../../domain/enums'

interface LiveMatchStats {
  possession: [number, number]
  shots: [number, number]
  corners: [number, number]
  suspensions: [number, number]
}

export function calculateLiveStats(
  steps: MatchStep[], 
  upTo: number,
  homeClubId: string,
): LiveMatchStats {
  const played = steps.slice(0, upTo + 1)
  let homeAct = 0, awayAct = 0
  let hShots = 0, aShots = 0, hCorners = 0, aCorners = 0, hSusp = 0, aSusp = 0
  
  for (const s of played) {
    if (s.attackingTeam === 'home') homeAct++
    else if (s.attackingTeam === 'away') awayAct++
    for (const e of s.events) {
      const isHome = e.clubId === homeClubId
      if (e.type === MatchEventType.Goal || e.type === MatchEventType.Save || e.type === MatchEventType.Miss) {
        if (isHome) hShots++; else aShots++
      }
      if (e.type === MatchEventType.Corner) {
        if (isHome) hCorners++; else aCorners++
      }
      if (e.type === MatchEventType.RedCard) {
        if (isHome) hSusp++; else aSusp++
      }
    }
  }
  const total = homeAct + awayAct
  const hp = total > 0 ? Math.round(homeAct / total * 100) : 50
  return {
    possession: [hp, 100 - hp],
    shots: [hShots, aShots],
    corners: [hCorners, aCorners],
    suspensions: [hSusp, aSusp],
  }
}

export function StatsFooter({ stats }: { stats: LiveMatchStats }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      padding: '6px 16px',
      flexShrink: 0,
      display: 'grid',
      gridTemplateColumns: '40px 1fr 40px',
      gap: '2px 0',
      fontSize: 11,
      fontFamily: 'var(--font-body)',
    }}>
      <span style={{ textAlign: 'right', fontWeight: 600 }}>{stats.possession[0]}%</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>Bollinnehav</span>
        <div style={{ width: '70%', height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${stats.possession[0]}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
        </div>
      </div>
      <span style={{ textAlign: 'left', fontWeight: 600 }}>{stats.possession[1]}%</span>
      
      <span style={{ textAlign: 'right', fontWeight: 600 }}>{stats.shots[0]}</span>
      <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 9 }}>Skott</span>
      <span style={{ textAlign: 'left', fontWeight: 600 }}>{stats.shots[1]}</span>
      
      <span style={{ textAlign: 'right', fontWeight: 600 }}>{stats.corners[0]}</span>
      <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 9 }}>Hörnor</span>
      <span style={{ textAlign: 'left', fontWeight: 600 }}>{stats.corners[1]}</span>
      
      {(stats.suspensions[0] + stats.suspensions[1]) > 0 && (<>
        <span style={{ textAlign: 'right', fontWeight: 600, color: stats.suspensions[0] > 0 ? 'var(--danger)' : undefined }}>{stats.suspensions[0]}</span>
        <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 9 }}>Utvisningar</span>
        <span style={{ textAlign: 'left', fontWeight: 600, color: stats.suspensions[1] > 0 ? 'var(--danger)' : undefined }}>{stats.suspensions[1]}</span>
      </>)}
    </div>
  )
}
```

**Placera i MatchLiveScreen** mellan intensity-bar och commentary-feed.

OBS: Anpassa `calculateLiveStats` till MatchSteps faktiska 
fält. Kolla vilka fält som finns (attackingTeam? events?).

---

### R5. Taktikjustering UNDER pågående match

**Fil:** `src/presentation/screens/MatchLiveScreen.tsx`
**Problem:** Taktikändring funkar vid halvtid men INTE under spel.

**Fix:** Den befintliga taktik-knappen öppnar en snabb-modal.
Max 3 ändringar per match (exkl. halvtid).

VARNING: Berör matchmotorn. Implementera SIST. Testa noggrant.
Om stegen är pregenererade behöver resterande steg regenereras 
med nya taktikparametrar.

```typescript
// State:
const [showTacticQuick, setShowTacticQuick] = useState(false)
const [tacticChangesUsed, setTacticChangesUsed] = useState(0)
const MAX_CHANGES = 3

// Modal (renderas ovanför kontrollknapparna):
{showTacticQuick && tacticChangesUsed < MAX_CHANGES && (
  <div style={{
    position: 'absolute', bottom: 70, left: 16, right: 16,
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '14px 16px', zIndex: 50,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 600 }}>⚙️ Snabbändring</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {MAX_CHANGES - tacticChangesUsed} kvar
      </span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {[
        { id: 'tempo_high', label: 'Höj tempot' },
        { id: 'tempo_low', label: 'Sänk tempot' },
        { id: 'attack', label: 'Anfallspress' },
        { id: 'defend', label: 'Parkera bussen' },
      ].map(opt => (
        <button key={opt.id} className="btn btn-ghost" 
          style={{ padding: 10, fontSize: 12 }}
          onClick={() => applyQuickTactic(opt.id)}>
          {opt.label}
        </button>
      ))}
    </div>
    <button onClick={() => setShowTacticQuick(false)} style={{
      width: '100%', marginTop: 8, padding: 8,
      background: 'none', border: 'none',
      color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
    }}>Avbryt</button>
  </div>
)}
```

Kommentar vid ändring:
```typescript
const tacticCommentary: Record<string, string[]> = {
  tempo_high: ['Tränaren viftar in spelarna. Tempot höjs.',
    'Nya direktiv från bänken — nu ska det gå fort.'],
  tempo_low: ['Tränaren signalerar lugn. Sänk tempot.',
    'Kontroll. Tränaren vill se tålamod.'],
  attack: ['Tränaren skickar upp laget. Allt framåt!',
    'Anfallspress. Backlinjen flyttar upp.'],
  defend: ['Tränaren sjunker ner. Försvara ledningen.',
    'Alla bakom bollen.'],
}
```

---

### R6. Tab-beskrivningar

**Filer:** `TransfersScreen.tsx`, `ClubScreen.tsx`, 
`TabellScreen.tsx`, `SquadScreen.tsx`

**Fix:** Direkt UNDER tab-switcher i varje fil:

```typescript
const TAB_DESCRIPTIONS: Record<string, string> = {
  marknad: 'Spelare som är tillgängliga för transfer just nu.',
  scouting: 'Utvärdera spelare eller sök nya talanger.',
  contracts: 'Förläng avtal med dina spelare.',
  freeagents: 'Kontraktslösa spelare. Ingen transfersumma.',
  sell: 'Sälj spelare från din trupp.',
  ekonomi: 'Klubbkassa, budget, intäkter och utgifter.',
  orten: 'Lokalstöd, sponsorer, patron och föreningsaktiviteter.',
  akademi: 'Ungdomslag, talangutveckling och intag.',
  anlaggning: 'Plan, is, faciliteter och investeringar.',
  tabell: 'Aktuell tabell med form och målskillnad.',
  statistik: 'Ligans toppskytt, assist och betyg.',
}

// Rendera direkt under tab-switcher:
{TAB_DESCRIPTIONS[activeTab] && (
  <p style={{
    padding: '6px 16px 10px',
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-body)',
    borderBottom: '1px solid var(--border)',
    marginBottom: 10,
  }}>
    {TAB_DESCRIPTIONS[activeTab]}
  </p>
)}
```

---

### R7. Spelarporträtt

**Steg 1:** Porträttfiler placeras i `public/assets/portraits/`
(Jacob levererar separat)

**Steg 2: Skapa ny fil:**
`src/domain/services/portraitService.ts`

```typescript
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

export function getPortraitPath(playerId: string, age: number): string {
  const cat = age <= 21 ? 'young' : age <= 27 ? 'mid' : age <= 32 ? 'exp' : 'vet'
  const idx = (simpleHash(playerId) % 8) + 1
  return `/assets/portraits/portrait_${cat}_${idx}.png`
}
```

**Steg 3:** I `PlayerCard.tsx`, ersätt streckgubben:
```typescript
import { getPortraitPath } from '../../domain/services/portraitService'

<img 
  src={getPortraitPath(player.id, player.age)} 
  alt={player.lastName}
  style={{
    width: 72, height: 72, borderRadius: '50%',
    border: '2px solid var(--accent)',
    objectFit: 'cover', background: 'var(--bg)',
  }}
  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
/>
```

**Steg 4:** I `SquadScreen.tsx` spelarlistan, liten variant (28×28):
```typescript
<img src={getPortraitPath(p.id, p.age)} alt="" 
  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
```

---

### R8. ⚙️ Settings-ikon → egen meny

**Fil:** `src/presentation/components/GameHeader.tsx`
**Problem:** Pekar på `/game/club`. Borde vara dropdown.

```typescript
const [showMenu, setShowMenu] = useState(false)

// Ersätt Settings onClick:
<button onClick={() => setShowMenu(!showMenu)} ...>
  <Settings size={16} strokeWidth={2} />
</button>

{showMenu && (
  <div style={{
    position: 'absolute', top: 48, right: 12,
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '4px 0',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    zIndex: 200, minWidth: 160,
  }}>
    {[
      { label: '💾 Spara spel', action: () => { /* saveGame() */ } },
      { label: '📂 Ladda spel', action: () => navigate('/') },
      { label: '❓ Hjälp', action: () => navigate('/game/doctor') },
      { label: '🏟️ Klubb', action: () => navigate('/game/club') },
    ].map((item, i) => (
      <button key={i} onClick={() => { item.action(); setShowMenu(false) }}
        style={{
          display: 'block', width: '100%', textAlign: 'left',
          padding: '10px 14px', background: 'none', border: 'none',
          fontSize: 13, color: 'var(--text-primary)',
          cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}>
        {item.label}
      </button>
    ))}
  </div>
)}
```

Lägg till `useState` import och `position: 'relative'` på 
header-containern.

---

### R9. Välj klubb — dubbel header

**Fil:** `src/presentation/screens/NewGameScreen.tsx`
**Problem:** I 'club'-steget visas OnboardingShell-headern 
PLUS en extra header med "Välj klubb · jacob · 2026/2027".

**Fix:** I club-steget, ta bort eventuell extra GameHeader.
Visa BARA OnboardingShell-headern ("BANDY MANAGER").
"Välj klubb" ska vara en rubrik i body-content, 
inte i headern.

---

### R10. Styrelsemål — specifik text

**Fil:** `src/presentation/screens/BoardMeetingScreen.tsx`

Ersätt generisk text under målrubriken med:

```typescript
const expectationDescription: Record<string, string> = {
  'avoidBottom': 'Styrelsen vill se framsteg. Håll oss kvar i serien.',
  'midTable': 'Håll er i övre halvan. Nedflyttning vore katastrofalt.',
  'challengeTop': 'Styrelsen förväntar sig slutspel. Gå så långt ni kan.',
  'winLeague': 'Styrelsen kräver guld. Annat vore en besvikelse.',
}
```

---

## IMPLEMENTATIONSORDNING

```
1. R1 — "rinkar" → "planer" (2 min)
2. R2 — BoardMeetingScreen OnboardingShell (10 min)
3. R9 — Välj klubb dubbel-header (5 min)
4. R10 — Styrelsemål text (5 min)
5. R6 — Tab-beskrivningar (15 min)
6. R8 — Settings-meny (20 min)
7. R3 — StartStep atmosfärtext (30 min)
8. R4 — StatsFooter matchvy (45 min)
9. R7 — Spelarporträtt (20 min, kräver assets)
10. R5 — Taktikjustering under match (60 min, SIST)
```

npm run build && npm test efter VARJE steg.

Generera: `docs/textgranskning/TEXT_REVIEW_RESTLISTA.md`

## VERIFIERING

```bash
# R1:
grep -rni "rink" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l
# Ska returnera 0

# R2:
grep -n "BANDY MANAGER" src/presentation/screens/BoardMeetingScreen.tsx
# Ska hitta minst 1

# R3:
grep -n "fixture" src/presentation/components/match/StartStep.tsx
# Ska finnas i props

# R4:
ls src/presentation/components/match/StatsFooter.tsx
# Ska finnas

# R6:
grep -n "TAB_DESCRIPTIONS\|tabDescriptions" src/presentation/screens/*.tsx
# Ska finnas i TransfersScreen + ClubScreen

# R7:
ls src/domain/services/portraitService.ts
# Ska finnas

# R8:
grep -n "showMenu\|Spara spel" src/presentation/components/GameHeader.tsx
# Ska finnas
```
