# KOMPLETT GENOMGÅNG — Bandy Manager, 2 april 2026

---

## 1. ARKITEKTUR — Bra grund, men growing pains

### Vad som fungerar
- **Domain-driven structure** — `domain/` (ren logik) separerat från `presentation/` (React). Korrekt.
- **Matchday-systemet** — Solid refaktor. `fixture.matchday` styr ordningen, inga beräkningar vid runtime.
- **Ekonomi-refaktor** — `calcRoundIncome()` som enda beräkningspunkt + `applyFinanceChange()` för mutation. Bra.
- **EventOverlay** — korrekt implementerad som komponent i GameShell, inte egen route. Kollar `!!roundSummary` för att inte visa under sammanfattning.

### Vad som behöver förbättras

**roundProcessor.ts är för stor.** Det är en ~1200-raders monster-funktion som gör ALLT: simulera matcher, beräkna ekonomi, hantera skador, uppdatera standings, cup-bracket, playoff-bracket, scouting, transfers, events, media, board milestones, fan mood, rivalry history, training, player development... 

Rekommendation: Redan delvis uppdelad med `processors/trainingProcessor.ts`, `processors/playerStateProcessor.ts`, `processors/statsProcessor.ts`. Bra start. Men ekonomi-blocket, playoff-blocket, cup-blocket och event-blocket borde också extraheras till egna processorer.

**SaveGame-interfacet har 70+ fält.** Det växer okontrollerat. Varje ny feature adderar fält. Inga grupper, ingen hierarki. Bör delas upp i sub-interfaces:
```typescript
interface SaveGame {
  core: GameCore         // id, manager, date, season
  squad: SquadState      // clubs, players
  competition: CompState // fixtures, standings, playoff, cup
  economy: EconomyState  // finances, sponsors, community
  meta: MetaState        // inbox, events, settings
}
```

**Tactic har `positionAssignments` som en `Record<string, FormationSlot>`.** Det sparas som en del av `Tactic`-interfacet men har ingen typdeklaration i Tactic-interfacet — det läggs till dynamiskt via `as any` eller spread. Bör formaliseras.

---

## 2. KOD-KVALITET

### Problem: Hårdkodade färger kvarstår
Ekonomi-formeln har `console.log` — bra för debug men ska tas bort före release.

### Problem: `club_villa` ID kvarstår
Klubben heter nu "Målilla" men club-ID:t är fortfarande `club_villa`. Inte funktionellt problem men förvirrande.

### Problem: `arenaCapacity` sätts i worldGenerator MED den GAMLA formeln
```typescript
arenaCapacity: Math.round((t.reputation * 25 + 600) / 500) * 500,
```
Men `calcRoundIncome` har fallback:
```typescript
const capacity = club.arenaCapacity ?? Math.round(club.reputation * 7 + 150)
```
`arenaCapacity` sätts ALLTID vid world generation → fallbacken i economyService används ALDRIG. Kapaciteten är fortfarande `rep*25+600`, inte `rep*7+150`.

**DETTA ÄR EKONOMI-BUGGEN.** `arenaCapacity` i worldGenerator måste ändras:
```typescript
arenaCapacity: Math.round((t.reputation * 7 + 150) / 50) * 50,
```

### Problem: Positionspool OK men formationer har inkonsekventa labels
`POSITION_POOL` har nu korrekt 5 Half + 5 Midfielder. Men formationerna i `Formation.ts` har slots med `position: PlayerPosition.Half` för positioner som heter "VCH", "CH", "HCH" — det här kanske borde vara Midfielder? 5-3-2 har:
- VYH, HYH = Half (ytterhalvar) ✓
- VCH, CH, HCH = Half (centrala halvar) — **borde dessa vara Midfielder?**

Med 5 Half + 5 Midfielder i truppen och 5 "Half"-slots i 5-3-2 → alla mittfältare sitter på bänken. Formationerna behöver separera Half (ytterhalvar) och Midfielder (centrala mittfältare).

### Problem: `moodBonus` borttagen från matchRevenue
Tidigare hade ekonomin `moodBonus = 0.85 + (fanMood / 100) * 0.30`. Nuvarande kod saknar den — fanMood påverkar bara attendanceRate. Det är en förändring som gör att fans mood har mindre inverkan på intäkter.

### Problem: MatchEventType.YellowCard finns kvar i enum
Bandy har inga gula kort. Enumen borde vara `Suspension` (10 min utvisning) istället. `YellowCard` används fortfarande i statsProcessor och andra ställen.

---

## 3. UX / PRESENTATION

### Verifierat gjort ✅
- EventOverlay som komponent (inte route), zIndex 300, villkor mot roundSummary
- GameHeader med kontrast (`rgba(245,241,235,0.7)` och `0.65`)
- Positioner: MV, B, YH, MF, A i `positionShort()`
- POSITION_ORDER separerade (0-4)
- Erik Ström som back i Forsbacka
- Flygande byten: bänkspelare 30-40 min
- Utvisningar: 2% matchstraff → 1 match, resten 10 min

### Kvarstår (Design Sprint R2)
Se `docs/DESIGN_SPRINT_R2.md`. De viktigaste:

1. **Planvy: olika utseende flikar** — LineupFormationView saknar positionsmatchnings-färger
2. **Daglig träning: grid istället för kompakt lista** — träningsvalen blev SÄMRE efter Codes ändring
3. **Inkorg: expand-on-click** — mail försvinner pga onRead() körs före expand
4. **Transfer-flikar: overflow** — 5 flikar får inte plats
5. **RoundSummary: fortfarande otight** — TappableCard-padding ej ändrad?

### Generell UX-observation
Spelet har ~20 skärmar. Ungefär hälften följer designsystemet (Dashboard, Match, ClubScreen), hälften gör inte det (RoundSummary, MatchResult, SeasonSummary, PreSeason, History). De som avviker använder:
- `borderRadius: 12` istället för `card-sharp`
- `padding: 14-24px` istället för `10-14px`
- Inga emojis i section labels
- Generell "för luftig"-känsla

---

## 4. GAMEPLAY-MEKANIK

### Ekonomi
Formeln i `economyService.ts` ser nu korrekt ut:
- weeklyBase = `rep * 120` ✓
- capacity fallback = `rep * 7 + 150` ✓
- `rand() * 2000` ✓
- `attendanceRate` = `0.35 + fanMood*0.40` ✓
- ticketPrice = `50 + rep*0.3` ✓

**MEN:** `arenaCapacity` sätts i `worldGenerator.ts` med `rep * 25 + 600`. Fallbacken i economyService används aldrig. **DET HÄR ÄR DET KVARVARANDE EKONOMI-PROBLEMET.**

Rep 60 → arenaCapacity = 2100 (worldGenerator) vs 570 (economyService fallback). 4x skillnad.

### Kontraktsförhandlingar
Code rapporterade att lägsta alltid accepteras. Behöver verifieras att motförslag-logiken implementerats.

### Akademi
POSITION_POOL har 22 spelare med korrekt fördelning. Akademi-spelare kvar till 20 — behöver verifieras.

### Truppfördelning + Formationer
5 Half + 5 Midfielder i truppen. Men alla formationer har `PlayerPosition.Half` för centrala positioner. Det innebär att 5 Midfielder-spelare aldrig matchar en formationsslot → alltid "fel position" (röd ring). Formationerna behöver uppdateras så centrala slots använder `PlayerPosition.Midfielder`.

---

## 5. SPECIFIKA KODPROBLEM ATT FIXA

### KRITISKT
1. **worldGenerator arenaCapacity** — `rep*25+600` → `rep*7+150` (ekonomi-buggen)
2. **Formation.ts slots** — centrala halvar (VCH/CH/HCH) bör vara `PlayerPosition.Midfielder`, inte `PlayerPosition.Half`
3. **MatchEventType.YellowCard** → bör heta `Suspension` eller `Penalty` (10 min utvisning)

### VIKTIGT  
4. **console.log i economyService** — ta bort före release
5. **ALL_GAME_COPY.md** — inte skapad, Jacob behöver den
6. **Testfel** — 4 pre-existing failures behöver fixas

### BÖR GÖRAS
7. **SaveGame refaktor** — dela upp 70+ fält i sub-interfaces
8. **roundProcessor uppdelning** — extrahera ekonomi/playoff/cup till egna processorer
9. **club_villa ID** → borde vara `club_malilla`

---

## 6. SAMMANFATTANDE PRIORITERING

### Nu (innan nästa playtest)
1. **Fixa arenaCapacity i worldGenerator** — det här är varför ekonomin fortfarande är "för hög"
2. **Uppdatera Formation.ts** — centrala slots = Midfielder, ytter = Half
3. **Design Sprint R2** — de 11 UX-fixarna
4. **ALL_GAME_COPY.md** — extrahera all text för Jacob att granska
5. **4 testfel**

### Snart (innan beta)
6. Ta bort console.log
7. SaveGame sub-interfaces
8. roundProcessor uppdelning
9. YellowCard → Suspension i enums
10. Verifiera kontraktsförhandling/akademi-mekanik

### Senare
11. roundProcessor till <500 rader
12. SaveGame migration strategi (versionering)
13. Performance-optimering (stripCompletedFixture gör bra jobb redan)
