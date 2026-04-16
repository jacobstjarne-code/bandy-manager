# SPEC: Publik — synliggör åskådarantal

## Bakgrund
Publiksiffror beräknas redan i `economyService.ts` men visas aldrig. Formeln:
- Capacity: `arenaCapacity ?? reputation * 7 + 150` (200–700 för svenska bandyklubbar)
- Attendance rate: `35% + fanMood * 0.4% + position-bonus` (capped 90%)
- Bonusar: derby 1.25x, cup 1.20x, slutspel 1.40x
- Resultatet påverkar matchintäkter — men spelaren ser det aldrig

## Vad som ska visas

### 1. Steg 3 "Starta" (StartStep.tsx)
Under matchinfo, visa:
```
🏟️ Hällefors IP · Kapacitet: 450
Förväntad publik: ~320
```
Vid derby/cup/slutspel:
```
🏟️ Hällefors IP · Kapacitet: 450
Förväntad publik: ~420 (derbyfeber!)
```
Vid bortamatch: visa motståndarens arena istället.

**Data:** Beräkna `expectedAttendance` från samma formel som economyService, skicka som prop.

### 2. Live-match kommentar (matchStepByStep.ts)
Mellan minut 60–80, lägg till en kommentar:
```
"Publiksiffran annonseras: 347 åskådare på Hällefors IP."
```
Vid hög beläggning (>80%): "Fint med publik ikväll! 412 på plats — nästan fullsatt."
Vid låg (<40%): "Glest på läktarna. 156 har hittat ut till Hällefors IP."
Vid derby/slutspel: "Fullsatt! 463 har trängt in sig. Stämningen är elektrisk."

**Implementation:** Ny step med `type: 'attendance'` eller bara en commentary-rad utan event. Infoga vid minute 65-75 (randomiserat).

### 3. MatchResultScreen + MatchDoneOverlay
Visa attendance i statistik-raden:
```
Hörnor 9–12    Skott 18–15    Publik: 347
```

### 4. MatchReportView (fullständig rapport)
Visa i header under resultat:
```
Hällefors IP · 347 åskådare · 22 oktober 2027
```

### 5. Fixture-entitet — lagra attendance
Lägg till `attendance?: number` på Fixture-typen. Sätts av roundProcessor vid match-simulering (både AI och live).

**Beräkning:** Flytta INTE logiken — anropa economyService-formeln och lagra resultatet.

## Arenanamn
Varje klubb bör ha ett `arenaName`-fält på Club-entiteten. Default: `{ortnamn}s IP` eller liknande.
Om det inte finns, generera från klubbnamn: "Hälleforsnäs IP", "Lesjöfors Bandyplan", etc.

## Filer att ändra
- `src/domain/entities/Fixture.ts` — `attendance?: number`
- `src/domain/entities/Club.ts` — `arenaName?: string`
- `src/domain/data/clubs.ts` — arenanamn per klubb
- `src/domain/services/economyService.ts` — exportera `calcAttendance()` separat
- `src/application/useCases/roundProcessor.ts` — beräkna + lagra attendance
- `src/domain/services/matchStepByStep.ts` — kommentar vid minut 65-75
- `src/presentation/components/match/StartStep.tsx` — visa förväntad publik
- `src/presentation/screens/MatchResultScreen.tsx` — visa i statistik
- `src/presentation/components/match/MatchDoneOverlay.tsx` — visa i statistik
- `src/presentation/components/match/MatchReportView.tsx` — visa i header

## Prioritet
Medelhög. Publik är en central del av bandyupplevelsen — små läktare, kyla, glögg — och bör synas. Allt beräknas redan, det handlar bara om att visa det.
