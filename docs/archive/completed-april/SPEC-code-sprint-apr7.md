# CODE SPRINT — 7 april 2026

## Läs först
- `CLAUDE.md` — obligatoriska regler
- `docs/DESIGN_SYSTEM.md` — designregler
- `docs/PLAYTEST_RAPPORT_20260406.md` — Jacobs playtest-feedback
- `npm run build && npm test` efter VARJE steg

---

## SPRINT 0: KRITISKA BUGGAR (gör DESSA FÖRST)

### 0.1 Cup-lottning: lag spelar mot sig själva
**Problem:** Forsbacka vs Forsbacka, Västanfors vs Västanfors i bracket.
**Fil:** `src/domain/services/cupService.ts` — `generateCupBracket()` eller motsvarande.
**Fix:** Pairing-loopen måste säkerställa att homeClubId !== awayClubId. Shuffla + para i ordning: [0,1], [2,3], [4,5], etc.

### 0.2 Cup: winnerId satt innan match spelats
**Problem:** Bracket visar "Utslagen" + "Nästa cupmatch" samtidigt. Alla matcher 0-0.
**Fil:** `src/domain/services/cupService.ts` eller bracket-generering
**Fix:** `winnerId` ska vara `null` på alla matcher som inte har en completed fixture. Sätt winnerId BARA när `fixture.status === 'completed'`.

### 0.3 Cup-vy: ospelade matcher visar "0–0" istf "vs"
**Fil:** `src/presentation/screens/TabellScreen.tsx` cupen-sektionen
**Fix:** Om match ej spelad (`!m.winnerId && fixture?.status !== 'completed'`): visa "vs" istället för `0–0`. Lägg till rubrik "LOTTNING" ovanför ospelad runda.

### 0.4 Match bakgrundssimuleras plötsligt
**Problem:** Managed match simuleras utan spelarinput efter omgång 10.
**Orsak trolig:** `advance()` eller batch-sim kör managed match utan lineup.
**Filer:** `roundProcessor.ts`, `DashboardScreen.tsx` (batch sim logic)
**Fix:** Managed match (league + cup) ska ALLTID kräva lineup. Lägg till explicit guard: om managed club fixture finns i denna matchday, STOPPA och navigera till /game/match.

### 0.5 "44 omgångar kvar" vid säsongssim
**Fil:** `DashboardScreen.tsx` — `remainingOtherFixtures`
**Fix:** Visa antal unika matchdays (`new Set(fixtures.map(f => f.matchday)).size`) istället för antal fixtures.

### 0.6 Utvisningar centrerade på resultattavlan
**Fil:** `src/presentation/screens/MatchLiveScreen.tsx`
**Problem:** Utvisningsraden är centrerad, borde vara sidad (hemma vänster, borta höger) precis som mål.
**Fix:** Kolla `event.clubId === homeClubId` och ställ `textAlign: 'left'` resp `'right'`.

### 0.7 Spelarkort — stängknapp + knappar utanför kortet
**Fil:** `src/presentation/components/PlayerCard.tsx`
**Problem:** ×-knapp och Upppmuntra/Kräv/Framtid hamnar utanför scroll-området.
**Fix:** Allt INUTI samma scrollbara container. ×-knapp i kortets övre högra hörn. Knappar i botten av kortet. Hela overlayen scrollbar.

### 0.8 Byten under match vs halvtid — olika modaler
**Problem:** SubstitutionModal (under match) och HalftimeModal har olika design.
**Fix:** Använd HalftimeModal-designen även för byten under match. ELLER extrahera en gemensam SubPanel-komponent.

### 0.9 Board meeting — repetitivt
**Fil:** `src/domain/data/boardData.ts`
**Fix:** Minst 8 citat per personlighet (istället för 3-4). Koppla citat till: förra säsongens resultat, tabellposition, ekonomi, mecenat-situation. Lägg till säsongs-specifik variation: "Förra året slutade vi 5:a. Det kan vi bättre."

### 0.10 Onboarding-hint: saknar rubrik, "1/3" förvirrande
**Fil:** `src/presentation/components/dashboard/OnboardingHint.tsx`
**Fix:** Lägg till rubrik "👋 KOMMA IGÅNG". Byt "Steg 1/3" till "Tips 1 av 3".

### 0.11 Ekonomi-tab: mecenat/kommun spegling
**Fil:** `src/presentation/components/club/EkonomiTab.tsx`
**Fix:** Hämta mecenat-data från `game.mecenater` och politiker från `game.localPolitician` direkt — inte hårdkodat. Visa namn + belopp. Lägg till "Se Orten-fliken →" som klickbar länk.

### 0.12 Inkorg: saknar rubrik
**Fil:** `src/presentation/screens/InboxScreen.tsx`
**Fix:** Lägg till section-label högst upp: `📬 INKORG` eller integrera i befintlig header.

### 0.13 Ta bort Bandydoktorn — ersätt med utbyggd hjälp

**Problem:** Bandydoktorn (API-baserad AI-assistent) ger inte tillräckligt värde just nu. Den kostar API-anrop, är svår att underhålla, och ger generiska svar. Bättre att satsa på statisk hjälp som är specifik och alltid tillgänglig.

**Ta bort:**
- `src/presentation/screens/BandyDoktorScreen.tsx` — ta bort filen
- Route `/game/doctor` i `AppRouter.tsx` — ta bort
- `🩺 Bandydoktorn` i GameHeader dropdown — ta bort
- `server.js` proxy-endpoint för Anthropic API — ta bort (om inget annat använder det)
- ContextualNudges referens till `/game/doctor` — ta bort
- DashboardScreen Bandydoktorn-kort — ta bort

**Ersätt med: Utbyggd Spelguide**

Spelguide-overlayen (redan implementerad i GameHeader) utökas:

1. **Från 10 → 20+ FAQ-poster**, organiserade i sektioner:
   - 🏁 **Komma igång** (5 poster): lineup, taktik, första matchen, spara, vad gör jag mellan matcher
   - 🏆 **Tävling** (5 poster): tabell, cup, slutspel, poängsystem, uppflyttning/nedflyttning
   - 💰 **Ekonomi & Orten** (5 poster): kassa, sponsorer, mecenater, kommun, bygdens puls
   - 👥 **Trupp & Transfers** (5 poster): kontrakt, scouting, bud, akademi, dubbelliv
   - ⚙️ **Tips** (3 poster): taktiktips, hörnstrategi, träningsfokus

2. **Onboarding-hints utökas från 3 → 5 tips:**
   - Tips 1: Sätt din startelva (befintlig)
   - Tips 2: Välj taktik inför matchen (befintlig)
   - Tips 3: Kolla inboxen efter matchen (befintlig)
   - Tips 4: Besök Orten-tabben för att se bygdens stöd (NY)
   - Tips 5: Träningsplanering gör skillnad — se Träning-tabben (NY)

3. **GameHeader dropdown**: "🩺 Bandydoktorn" ersätts av "❓ Hjälp" (som den redan har) + behåll "📖 Spelguide"

**Filer att ändra:**
- `src/presentation/screens/BandyDoktorScreen.tsx` — TA BORT
- `src/presentation/navigation/AppRouter.tsx` — ta bort route
- `src/presentation/components/GameHeader.tsx` — ta bort Bandydoktorn-länk, utöka spelguide
- `src/presentation/components/dashboard/ContextualNudges.tsx` — ta bort doctor-referens
- `src/presentation/screens/DashboardScreen.tsx` — ta bort Bandydoktorn-kort
- `src/presentation/components/dashboard/OnboardingHint.tsx` — utöka till 5 tips
- `server.js` — ta bort `/api/doctor` endpoint (om den finns)

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

**Problem:** `game.storylines[]` finns och matchStepByStep.ts HAR storyline-kommentarer (6 typer). Men det är oklart om `storylines` faktiskt skickas till match engine.

**KRITISKT: Verifiera först:**
```bash
grep -n 'storylines' src/presentation/store/actions/matchActions.ts
```
Om resultatet är tomt → storylines skickas ALDRIG till matchen. Fixa:
```typescript
// I matchActions.ts där simulateMatchStepByStep anropas:
storylines: game.storylines?.filter(s => s.resolved) ?? []
```

**Sedan: Presskonferenser**
Kolla `pressConferenceService.ts`. Refereras `game.storylines`? Om nej → lägg till storyline-baserade frågor:
- `underdog_season`: "Ingen trodde på er i augusti. Vad hände?"
- `rescued_from_unemployment`: "Martinsson — från varsel till målskytt. Hur känns det?"
- `captain_rallied_team`: "Kaptenen samlade laget efter krisläget. Hur viktig var den insatsen?"

**Sedan: Säsongssammanfattning**
Kolla `seasonSummaryService.ts`. Inkludera storyline-höjdpunkter i narrativen.

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
