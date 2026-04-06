# CODE SPRINT — 7 april 2026

## Läs först
- `CLAUDE.md` — obligatoriska regler
- `docs/DESIGN_SYSTEM.md` — designregler
- `npm run build && npm test` efter VARJE steg

## Befintliga specar (redan skrivna, redo att implementera)
Dessa finns i `docs/` och är fullständiga. Implementera i denna ordning:

---

## SPRINT 1: Synliggör dolda system

### 1.1 Event-konsekvenser synliga (NY)

**Problem:** Spelaren väljer mellan event-alternativ utan att veta konsekvenserna. FÖRSTÄRKNINGSSPEC V3 DEL F kräver subtitle med ikoner.

**Fil:** `src/presentation/components/EventOverlay.tsx`

**Fix:** Under varje val-knapp, visa `choice.subtitle` om det finns:
```tsx
{choice.subtitle && (
  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
    {choice.subtitle}
  </p>
)}
```

**Sedan:** Gå igenom ALLA event-factories i `src/domain/services/events/` och lägg till `subtitle` på varje choice. Format:
- `💰 -50 tkr` för ekonomi
- `🤝 +15 relation` för politiker/mecenat
- `😊 +10 moral` för spelare
- `⏰ -5 fitness` för tidsförlust
- `⭐ +5 reputation` för rykte

Prioritera: `communityEvents.ts`, `politicianEvents.ts`, `playerEvents.ts`

### 1.2 Inbox-notiser för kommun/mecenat

**Spec:** `docs/SPEC-orten-narrativ.md` avsnitt 1A

**Sammanfattning:** Lägg till inbox-generering i roundProcessor.ts:
- Mecenat happiness-förändringar → inbox
- Politiker relationship-milstolpar → inbox
- Ny mecenat aktiverad → inbox
- Kommunbidrag ändrat → inbox

### 1.3 Publik i matchflödet

**Spec:** `docs/SPEC-publik-attendance.md`

**Sammanfattning:**
- `attendance?: number` på Fixture
- `arenaName?: string` på Club (+ statisk data per klubb)
- Beräkna + lagra i roundProcessor
- Visa i StartStep, MatchDoneOverlay, MatchResultScreen, MatchReportView
- Live-kommentar vid minut 65-75

---

## SPRINT 2: Visuell polish

### 2.1 Spelarkort overlay

**Spec:** `docs/FIXSPEC-orten-kommun-ui.md` punkt 7

**Sammanfattning:**
- Stängknapp INUTI kortet (inte flytande)
- Aktionsknappar (uppmuntra/kräv/framtid) INUTI kortet
- Feedback-text inline, inte i "rymden"
- Porträtt: `objectPosition: 'center 20%'` för bättre centrering

### 2.2 Matchresultat-konsolidering

**Spec:** `docs/SPEC-matchresultat-konsolidering.md`

**Sammanfattning:**
- MatchReportView → card-sharp-stil
- Spelarbetyg-lista som PlayerRow-mönstret
- Statistik-kort med hemma/mitten/borta

### 2.3 Storylines i matchkommentarer + press

**Problem:** `game.storylines[]` finns men refereras aldrig i kommentarer eller press.

**Filer:**
- `src/domain/data/matchCommentary.ts` — lägg till storyline-varianter
- `src/domain/services/matchStepByStep.ts` — kolla storylines vid mål-kommentarer
- Presskonferens-frågorna — referera storylines

**Exempel:** Om målskytt har `rescued_from_unemployment`:
```
"MÅL! Martinsson — mannen som nästan förlorade allt vid varslet. Nu gör han säsongens viktigaste mål!"
```

Om 3+ förluster i rad och `underdog_season`:
```
Journalistfråga: "Ingen trodde på er i augusti. Vad hände?"
```

Kolla `game.storylines.filter(s => s.playerId === scorer.id && s.resolved)` vid varje mål.

---

## SPRINT 3: Nya features

### 3.1 Anläggningsprojekt startbara (NY SPEC)

**Problem:** `facilityProjects` finns men spelaren kan inte STARTA nya projekt. Orten-tabben visar pågående men inte tillgängliga.

**Implementation:**
1. Skapa `src/domain/services/facilityProjectService.ts`:
```typescript
interface AvailableFacilityProject {
  id: string
  name: string
  description: string
  cost: number
  duration: number        // omgångar
  facilitiesBonus: number
  minFacilities: number   // kräver denna nivå för att synas
}

export function getAvailableProjects(currentFacilities: number, finances: number): AvailableFacilityProject[] {
  return ALL_PROJECTS
    .filter(p => currentFacilities >= p.minFacilities && currentFacilities < p.minFacilities + 30)
    .filter(p => p.cost <= finances * 1.5) // visa även om man inte riktigt har råd
}
```

2. Projektlista (minst 8 projekt):
| Projekt | Kostnad | Tid | Bonus | Min faciliteter |
|---------|---------|-----|-------|-----------------|
| Förbättra omklädningsrum | 50k | 4 omg | +10 | 0 |
| Uppgradera strålkastare | 80k | 6 omg | +8 | 10 |
| Ny kiosk | 40k | 3 omg | +5 + kiosk-upgrade | 15 |
| Installera konstfrusen is | 200k | 10 omg | +15 + hasArtificialIce | 30 |
| Bygg värmestuga | 120k | 8 omg | +10 + capacity +200 | 35 |
| Renovera läktare | 300k | 12 omg | +12 + capacity +500 | 50 |
| Bygga gym | 150k | 8 omg | +10 + träningsbonus | 40 |
| Ny ismaskin | 100k | 5 omg | +8 + isQuality | 25 |

3. UI i KlubbTab under "🏟️ Anläggning & faciliteter":
   - Visa tillgängliga projekt som lista med kostnad + tid
   - "Starta projekt"-knapp per projekt
   - Pågående projekt med progress-bar

4. `gameStore.ts`: ny action `startFacilityProject(projectId: string)`
5. `roundProcessor.ts`: räkna ner `duration`, applicera bonus vid completion

### 3.2 Spelarhistorik per säsong (NY SPEC)

**Problem:** PlayerCard visar bara nuvarande säsongs statistik. Ingen historik.

**Implementation:**
1. Lägg till `seasonHistory: Array<{ season: number, goals: number, assists: number, games: number, rating: number }>` på Player
2. `seasonEndProcessor.ts`: spara nuvarande säsongsstatistik till `seasonHistory` vid säsongsslut
3. `PlayerCard.tsx`: ny sektion "Karriär" under "Säsong" som visar historik per säsong

### 3.3 Scouting → transfers-workflow (NY SPEC)

**Problem:** Scoutrapporter glöms bort. Ingen påminnelse, ingen koppling till transfers.

**Implementation:**
1. Dashboard-nudge om det finns ≥1 fresh scoutrapport: "🔍 Du har 2 färdiga scoutrapporter. Se transfers →"
2. TransfersScreen scouting-tab: markera spelare med färdiga rapporter med accent-border
3. Inbox-notis vid klar scoutrapport bör navigera till transfers (redan fixat med PlayerLink)

---

## RESTLISTA (R1–R13 från VERIFIERAD_RESTLISTA.md)

### Verifiera dessa — de kanske redan är fixade:
- R1: "rinkar" → "planer" — kör `grep -rni "rink" src/`
- R2: BoardMeetingScreen OnboardingShell
- R9: Välj klubb dubbel-header
- R13: Politiker-tab i Orten hanterar nu cooldowns med knappar (fixat av Opus)

### Kvar att göra:
- R5: Taktikjustering under match (SIST — berör matchmotor)
- R10: Styrelsemål-text i BoardMeetingScreen

---

## VERIFIERING EFTER VARJE DELSTEG

```bash
npm run build && npm test

# Inga hårdkodade hex:
grep -rn "C9A84C\|#22c55e\|#f59e0b\|#ef4444\|#0a1520" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules

# Inga "rink":
grep -rni "rink" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".d.ts"
```

## COMMIT EFTER VARJE SPRINT

```
feat: [sprint 1] event subtitles, kommun/mecenat inbox, attendance
design: [sprint 2] player card overlay, match result consolidation
feat: [sprint 3] facility projects, player history, scouting workflow
```
