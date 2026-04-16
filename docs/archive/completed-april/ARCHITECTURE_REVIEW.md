# Arkitektur & Kod-genomgång — Bandy Manager

## Filstorlekar (topp 10)

| Fil | Storlek | Bedömning |
|-----|---------|-----------|
| `matchStepByStep.ts` | 66 KB | 🔴 Bör brytas ut |
| `ClubScreen.tsx` | 66 KB | 🔴 Bör brytas ut i 4+ filer |
| `gameStore.ts` | 50 KB | 🔴 Bör delas i slices |
| `DashboardScreen.tsx` | 47 KB | 🟡 Stor men delvis splittad |
| `TransfersScreen.tsx` | 43 KB | 🟡 Har modaler inline |
| `pressConferenceService.ts` | 41 KB | 🟡 Data-tung (citat) |
| `MatchLiveScreen.tsx` | 34 KB | 🟡 Komplex men motiverat |
| `matchEngine.ts` | 26 KB | 🟢 OK för domänlogik |
| `worldGenerator.ts` | 22 KB | 🟢 OK |
| `SquadScreen.tsx` | 22 KB | 🟢 OK |

**Totalt:** ~400 KB screens, ~100 KB match-komponenter, ~330 KB domain/services, ~50 KB store = **~880 KB TSX/TS**

## 🔴 Kritiska arkitekturproblem

### 1. ClubScreen.tsx (66 KB) — Monolitisk
Innehåller ALLT: 4 flikar, TrainingSection, TrainingProjectsCard, InfoRow, FacilityRow, alla lokala funktioner. 
**Åtgärd:** Bryt ut till:
- `components/club/TrainingSection.tsx`
- `components/club/TrainingProjectsCard.tsx`
- `components/club/EkonomiTab.tsx`
- `components/club/KlubbTab.tsx`
- `components/club/AkademiTab.tsx`
ClubScreen blir en tunn tab-router (~100 rader).

### 2. gameStore.ts (50 KB) — Allt-i-ett Zustand-store
Alla actions (match, training, transfers, academy, community, budget, scouting) i en enda fil.
**Åtgärd:** Dela i slices eller åtminstone separata filer med actions:
- `store/matchActions.ts`
- `store/trainingActions.ts`
- `store/transferActions.ts`
- `store/academyActions.ts`
Huvudstoren importerar och kombinerar dem.

### 3. matchStepByStep.ts (66 KB) — Största filen
Troligen genererade textblock (kommentarer, scenarier) blandat med logik.
**Åtgärd:** Bryt ut kommentarsträngar till `domain/data/matchCommentary.ts`.

## 🟡 Förbättringsmöjligheter

### 4. TransfersScreen.tsx (43 KB) — Modaler inline
RenewContractModal och BidModal definieras inne i filen.
**Åtgärd:** Flytta till `components/transfers/RenewModal.tsx` och `BidModal.tsx`.

### 5. DashboardScreen.tsx (47 KB)
Redan delvis splittad (dashboard-mapp med NextMatchCard etc.) men innehåller fortfarande mycket inline.

### 6. pressConferenceService.ts (41 KB)
Troligen mestadels frågor och svar som data. Borde vara en JSON-fil eller separat data-fil.

### 7. Ingen gemensam attributeLabel-utility
`attributeLabel()` definieras lokalt i ClubScreen. Borde vara en delad utility i `presentation/utils/formatters.ts` som alla komponenter kan importera.

## 🟢 Bra arkitekturbeslut

- **Domain/presentation-separation** — Ren uppdelning
- **Match-komponenter** — 17 filer i `components/match/`, väl uppdelat
- **Dashboard-komponenter** — Dedikerad mapp
- **Entities/Services/Enums** — Clean domain structure
- **Single-file PWA** — Bra för mobilupplevelsen

## Sammanfattning
Arkitekturen är fundamentalt sund (domain-driven, komponentbaserad). Huvudproblemet är att 3 filer vuxit sig för stora. Prioriterad ordning:
1. **ClubScreen** → Bryt ut tabs till egna komponenter
2. **gameStore** → Dela i action-slices
3. **matchStepByStep** → Separera data från logik
