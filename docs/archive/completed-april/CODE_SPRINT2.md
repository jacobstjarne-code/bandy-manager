# CODE SPRINT 2 — Buggar + Döda system

**Datum:** 16 april 2026  
**Referens:** `docs/MASTERSPEC_NEXT_PHASE.md` avsnitt 3 + 7  
**Mockups:** `docs/mockups/masterspec_mockups.html` (anläggningsprojekt, pensionsceremoni)  
**Förutsättning:** Sprint 1 (matchCore) klar. Spelarkort 2.0 klar. VERIFIERAD_RESTLISTA klar (utom R7 porträtt).

`npm run build && npm test` efter VARJE deluppgift.

---

## PRIORITERING

Gör i denna ordning. Varje uppgift är oberoende — committa efter varje.

1. Cupen: lottning (BUG-1) — kritisk
2. Mecenat-spawn (BUG-4) — kritisk
3. EventOverlay blockerar /game/review (BUG-4b)
4. Presskonferens "Neutral · Neutral" (BUG-16)
5. Anläggningsprojekt startbar (DEAD-3)
6. Storylines → säsongssammanfattning (DEAD-1)

---

## 1. CUPEN: LOTTNING (BUG-1)

### Problem
Lottningen kan para ett lag mot sig självt. `generateCupFixtures` i cupService.ts shufflar `playInTeams` och parar i ordning — men garanterar inte att inga duplicates uppstår om `teamIds` har problem uppströms.

### Diagnos
Tracera hela kedjan:
1. Var anropas `generateCupFixtures`? → Troligen i `scheduleGenerator.ts` eller `createNewGame.ts`
2. Vilka `teamIds` skickas in? → Kontrollera att det är 12 unika IDs
3. Logga: lägg till `console.assert(new Set(playInTeams).size === playInTeams.length)` efter shuffle

### Fix

I `cupService.ts`, `generateCupFixtures`:

```typescript
// EFTER shuffle, FÖRE pairings — guard mot self-pairing:
for (let i = 0; i < numR1Matches; i++) {
  const home = playInTeams[i * 2]
  const away = playInTeams[i * 2 + 1]
  if (home === away) {
    console.error(`[CUP BUG] Self-pairing detected: ${home} vs ${away}`)
    // Swap with next available
    if (i * 2 + 2 < playInTeams.length) {
      ;[playInTeams[i * 2 + 1], playInTeams[i * 2 + 2]] = [playInTeams[i * 2 + 2], playInTeams[i * 2 + 1]]
    }
  }
}
```

Men den RIKTIGA fixen är att hitta varför duplicates hamnar i listan. Greppa:
```bash
grep -rn "generateCupFixtures" src/ --include="*.ts"
```
Följ anropet uppströms och verifiera att `teamIds` som skickas in har exakt 12 unika IDs.

### Verifiering
```bash
# Starta nytt spel, kör 3 omgångar, logga alla cup-fixtures:
grep -n "cup-r1" src/ --include="*.ts"  # hitta fixture-IDn
```
Eller: lägg till temporär console.log i generateCupFixtures som skriver ut alla pairings.

---

## 2. MECENAT-SPAWN (BUG-4)

### Problem
Mecenater spawnar aldrig trots att logiken finns i roundProcessor.ts.

### Diagnos

Greppa och verifiera hela kedjan:
```bash
grep -n "generateMecenat\|mecenat\|Mecenat" src/application/useCases/roundProcessor.ts
grep -n "generateMecenat" src/domain/services/mecenatService.ts
```

Kontrollera:
1. `generateMecenat` importeras korrekt i roundProcessor
2. Spawn-villkoren: `cs >= 65 && rep >= 55 && activeMecenater.length < maxMecenater && !alreadySpawnedThisSeason && localRand() < 0.15`
3. Det genererade eventet (`generateMecenatIntroEvent`) hamnar i `allNewEvents`
4. eventService / eventResolver hanterar mecenat-eventets choice-IDs korrekt
5. Vid "welcome"-val: mecenat.isActive sätts till true

### Trolig bugg-plats

I roundProcessor: den genererade mecenaten läggs till `updatedMecenater` med `isActive: false`. Intro-eventet genereras. MEN: hanterar `resolveEvent` detta korrekt? Kontrollera att eventService har en handler för mecenat-intro som sätter `isActive: true` på rätt mecenat.

```bash
grep -n "mecenat\|mecen" src/domain/services/eventService.ts
```

### Fix

Om handler saknas, lägg till i eventService.ts:
```typescript
// I resolveEvent, hantera mecenat-intro:
if (event.type === 'mecenatIntro' || event.id.startsWith('mecenat_intro_')) {
  if (choiceId === 'welcome' || choiceId === 'cautious') {
    const mecenatId = event.relatedMecenatId ?? event.id.replace('mecenat_intro_', '')
    updatedGame = {
      ...updatedGame,
      mecenater: (updatedGame.mecenater ?? []).map(m =>
        m.id === mecenatId ? { ...m, isActive: true } : m
      ),
    }
  }
  // 'decline' → mecenat stays isActive: false, effectively removed
}
```

### Verifiering
Starta nytt spel. Sänk spawn-chansen temporärt till 1.0 (100%). Spela 8 omgångar med CS >= 65 och rep >= 55. Verifiera att mecenat-event dyker upp.

---

## 3. EVENTOVERLAY BLOCKERAR /game/review (BUG-4b)

### Status
Redan FIXAD i koden! EventOverlay.tsx har:
```typescript
const isMatchScreen = location.pathname.includes('/match/live') || 
  location.pathname === '/game/match' || 
  location.pathname === '/game/match-result' || 
  location.pathname === '/game/review'
```

### Verifiering
Spela en match, navigera till /game/review. Bekräfta att INGA event-overlays visas. Om events finns, bekräfta att de visas som inline-kort i GranskaScreen istället.

Om detta redan funkar → skippa, markera som ✅.

---

## 4. PRESSKONFERENS "Neutral · Neutral" (BUG-16)

### Problem
Header visar "Neutral · Neutral" istf journalistens namn och outlet.

### Fix

I den komponent som renderar presskonferens-headern (troligen `PressConferenceScene.tsx`):

```bash
grep -n "Neutral\|neutral\|tone\|relationship" src/presentation/components/PressConferenceScene.tsx
```

Ersätt header-texten. Istf `${tone} · ${relationship}` visa:
```typescript
// Om journalist finns i game state:
const j = game.journalist
const header = j ? `${j.name} · ${j.outlet}` : 'Presskonferens'
```

Om `game.journalist` inte finns eller inte har `name`/`outlet`, fallbacka:
```typescript
const outlet = JOURNALISTS[Math.floor(seed % JOURNALISTS.length)]
const header = outlet
```

### Verifiering
Spela en match. Presskonferensen ska visa journalistnamn + outlet, INTE "Neutral · Neutral".

---

## 5. ANLÄGGNINGSPROJEKT STARTBAR (DEAD-3)

### Problem
Spelaren kan aldrig starta nya projekt. Knappen existerar inte i ClubScreen.

### Fil: `src/presentation/screens/ClubScreen.tsx`

Hitta "anläggning"-tabben (troligen `tab === 'anlaggning'`). Lägg till under pågående projekt:

```typescript
import { getAvailableProjects } from '../../domain/services/facilityService'

// I anläggning-tabben:
const club = useManagedClub()
const available = getAvailableProjects(club.facilities, game.facilityProjects ?? [])
const startFacilityProject = useGameStore(s => s.startFacilityProject)
const [facilityMsg, setFacilityMsg] = useState<string | null>(null)

// Under pågående projekt-sektionen:
{available.length > 0 && (
  <>
    <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '10px 0 4px' }}>
      🏟️ TILLGÄNGLIGA PROJEKT
    </p>
    {available.map(project => (
      <div key={project.id} className="card-sharp" style={{ padding: '10px 12px', marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{project.name}</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {Math.round(project.cost / 1000)} tkr · {project.durationRounds} omgångar
              {project.requiresKommun && ' · Kräver kommunstöd'}
            </p>
          </div>
          <button
            onClick={() => {
              const result = startFacilityProject(project.id)
              if (!result.success) setFacilityMsg(result.error ?? 'Kunde inte starta')
              else setFacilityMsg(`${project.name} påbörjat!`)
              setTimeout(() => setFacilityMsg(null), 3000)
            }}
            disabled={club.finances < project.cost}
            style={{
              padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: club.finances >= project.cost ? 'var(--accent)' : 'var(--border)',
              color: club.finances >= project.cost ? 'var(--text-light)' : 'var(--text-muted)',
              border: 'none', borderRadius: 6, fontFamily: 'var(--font-body)',
            }}
          >
            Starta
          </button>
        </div>
      </div>
    ))}
    {facilityMsg && (
      <p style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4, textAlign: 'center' }}>{facilityMsg}</p>
    )}
  </>
)}
```

Se mockup: `docs/mockups/masterspec_mockups.html` — anläggningsprojekt-kortet.

### Verifiering
1. Gå till Klubb → Anläggning-flik
2. Tillgängliga projekt visas med namn, kostnad, duration
3. Klicka "Starta" → projektet dyker upp under "Pågående"
4. Om inte tillräckligt med pengar → knappen disabled

---

## 6. STORYLINES → SÄSONGSSAMMANFATTNING (DEAD-1)

### Problem
Storylines (15 typer) skapas men refereras aldrig i säsongssammanfattningen.

### Ny funktion i `src/domain/services/seasonSummaryService.ts`:

```typescript
export function generateSeasonNarrative(game: SaveGame): string[] {
  const narrativeLines: string[] = []
  const managedStorylines = (game.storylines ?? [])
    .filter(s => {
      const player = game.players.find(p => p.id === s.playerId)
      return player?.clubId === game.managedClubId
    })
    .slice(-5)

  for (const story of managedStorylines) {
    narrativeLines.push(story.displayText)
  }
  return narrativeLines
}
```

Om `seasonSummaryService.ts` inte har denna funktion, lägg till den.

### Rendera i `SeasonSummaryScreen.tsx`:

Importera funktionen och rendera under statistik-sektionen:

```typescript
import { generateSeasonNarrative } from '../../domain/services/seasonSummaryService'

// I renderingen:
const narrativeLines = game ? generateSeasonNarrative(game) : []

// Under statistik-kortet:
{narrativeLines.length > 0 && (
  <div className="card-round" style={{ padding: '10px 12px', marginBottom: 6 }}>
    <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
      📖 SÄSONGENS BERÄTTELSER
    </p>
    {narrativeLines.map((line, i) => (
      <p key={i} style={{
        fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic',
        lineHeight: 1.5, marginTop: i > 0 ? 6 : 4, fontFamily: 'var(--font-display)',
      }}>
        {line}
      </p>
    ))}
  </div>
)}
```

Se mockup: `docs/mockups/masterspec_mockups.html` — "SÄSONGENS BERÄTTELSER".

### Verifiering
Spela en hel säsong (eller simulera). Gå till säsongssammanfattning. Verifiera att storylines renderas som kursiv prosa under "📖 SÄSONGENS BERÄTTELSER".

---

## EFTER SPRINT 2

Nästa sprint (3) enligt masterspecen: Systemkorsningar.
- Kafferummet × transfers/events
- Presskonferens × orten + journalist-personlighet
- Klacken × matchkommentarer
- Journalist-headlines i inbox
- Season phases koppla till events/dagbok

Se `docs/MASTERSPEC_NEXT_PHASE.md` avsnitt 2 för fullständiga specar.

---

## CHECKLISTA INNAN COMMIT

```
□ npm run build passerar
□ npm test passerar
□ Inga hårdkodade hex: grep -rn '#[0-9a-fA-F]{6}' src/presentation/ --include="*.tsx" | grep -v node_modules | grep -v .svg
□ Inga "rink": grep -rni 'rink' src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
□ Varje ny svensk text → docs/textgranskning/TEXT_REVIEW_sprint2.md
```
