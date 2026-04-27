# SPEC: Bandydagar och cupfönster

**Skapad:** 2026-04-27
**Författare:** Opus
**Status:** UTKAST V3 — efter Bandy-Brain-granskning, blockerare fixade
**Beroenden:** `scheduleGenerator.ts` (huvudsakliga ändringar), `cupService.ts` (verifierat), `SPEC_VADER.md` (klimatdatum bör matcha nya ROUND_DATES)

**Beslutshistorik:**
- 2026-04-27 V1: Initial utkast med gruppspel-cup-modell
- 2026-04-27 V2: Cup-format ändrat till knockout (behåll befintlig kod), timing till försäsong, Jacob-beslut applicerade
- 2026-04-27 V3: Bandy-Brain-granskning fixar applicerade — CUP_AFTER_LEAGUE_ROUND tydliggörs, migrationsplan förtydligas, B8 tillagt

---

## 1. Syfte

Få spelets matchschema att kännas som **riktig svensk elitbandy**:

1. **Veckodags-realism** — matcher spelas på etablerade bandydagar (tisdag/onsdag/fredag/lördag/söndag), inte måndagar och torsdagar
2. **Cupens egna fönster** — Svenska Cupen är en försäsongsturnering, inte en parallell kompletteringsturnering som infogas mellan ligaomgångar
3. **Bandytraditioner som features** — Annandagsbandy, nyårsbandy, finalhelg på fast datum
4. **Genererad varierbarhet** — datum slumpas inom regelverket per säsong, inte hårdkodade kalenderdatum

Klubbarna är fiktiva, men bandyrytmen ska kännas riktig.

---

## 2. Designprinciper

Detta arbete följer de tre etablerade designprinciperna och den föreslagna P4:

- **P1 (Inbox-driven kontext):** Specialdatum som annandagsbandy får inbox-events vid season-start och dagen före
- **P2 (Pre-spec cross-check):** Verifierat mot scheduleGenerator.ts, cupService.ts, SAIK 25/26 spelschema, Svenska Bandyförbundets cupinformation
- **P3 (Integration-completeness):** Påverkar scheduleGenerator, cupService, klimatdata-pipeline (SPEC_VADER §3.1), event-system, daily briefing
- **P4 (Research före gissning):** Speldagar verifierade empiriskt från SAIK 25/26 + Sirius 23/24 + Bandyförbundets cupinfo, inte från intuition

---

## 3. Verkligheten — bandydagar i elitserien

### 3.1 Veckodagsmönster (verifierat empiriskt)

Källa: SAIK herrlag säsong 2025/26 (35 elitseriematcher), citat från Per Selin, ligachef Svensk Elitbandy 2023/24.

> "Det färdiga spelschemat innehåller till stora delar samlade omgångar med tisdagar och fredagar som primära speldagar."
> — Per Selin, ligachef Svensk Elitbandy

SAIK-schemat 25/26 fördelat på veckodag:

| Veckodag | Antal matcher | Andel |
|---|---|---|
| Fredag | 11 | ~30% |
| Tisdag | 5 | ~14% |
| Onsdag | 4 | ~11% |
| Lördag | 6 | ~17% |
| Söndag | 2 | ~6% |
| Annandag (varierar) | 1 | ~3% |
| Övriga vardagar | 6 (helger eller specialdatum) | ~19% |

**Aldrig:** måndagar, torsdagar.

### 3.2 Klockslag

| Veckodag | Tipoff | Anledning |
|---|---|---|
| Tisdag | 19:00 | Vardag, kvällsmatch efter jobb |
| Onsdag | 19:00 | Vardag, kvällsmatch efter jobb |
| Fredag | 17:00 eller 19:00 | Vardag, sen helgvärld |
| Lördag | 14:00, 15:00, eller 17:00 | Helg, eftermiddagsmatch |
| Söndag | 13:00 eller 15:00 | Helg, tidig till mid-eftermiddag |
| Annandag jul | 13:15-17:00 | Helgdag, alla matcher samma dag |
| Nyårsafton | 13:15-14:00 | Halvdag, tidig matchstart |

### 3.3 Specialdatum (etablerade traditioner)

**Annandagsbandy (26 december)**
- Alla elitserielag spelar samma dag
- Avslag mellan kl 13:15 och 17:00
- Bandy-Sveriges största enskilda matchdag (utöver finalen)
- I spelets logik: `enforceAnnandagenDerbies` placerar redan derbymatcher här. **Behåll.**

**Nyårsbandy (31 december)**
- Växande tradition (Hammarby spelar nyårsbandy 25/26)
- Ej universell — inte alla lag spelar nyårsafton
- Avslag tidig eftermiddag (13:15)
- I spelets logik: **slumpat per säsong, ~30-50% sannolikhet** (Jacob-beslut B2)

**Trettondedag jul (6 januari)**
- Helgdag, vanlig matchdag
- I spelets logik: behandla som lördag (helg-tipoff-tider)

**Bandyfinalen — SM-final**
- Fast helg: tredje lördagen i mars (i verkligheten 13-14 mars 2026)
- Spelas i Västerås (ABB Arena) för närvarande
- Hela slutspelet (kvartsfinaler, semifinaler, final) under februari-mars

---

## 4. Verkligheten — Svenska Cupen är en försäsongsturnering

### 4.1 Format i verkligheten (oförändrat sedan 2023)

- **Gruppspel: augusti–september**
- **Finalhelg: första helgen i oktober** (4-5 oktober 2025 i Bollnäs)
- 14 elitserielag delas i två grupper om 7 lag (norra + södra, geografisk indelning)
- Varje lag spelar 6 gruppspelsmatcher (3 hemma + 3 borta), enkelmöte
- 2 bästa per grupp → semifinal → final, allt på neutral arena under finalhelgen

### 4.2 Tidpunkt i förhållande till elitserien

```
augusti       september       oktober           februari    mars
  ↓               ↓               ↓                ↓           ↓
[Cup gruppspel] [Cup gruppspel] [Final / liga ]  [Liga slut][Slutspel]
                                  ↑       ↑
                          Cup-final     Liga-start
                          (4-5 okt)     (~10 okt)
```

Cup-finalen avslutas innan elitserien drar igång. Det finns alltså **ingen överlappning** mellan cup och liga — cupen är klar senast 5 oktober, ligan startar runt 10 oktober.

### 4.3 Vad finns redan i vår kod — cupService.ts

**Verifierat genom kodläsning 2026-04-27:** Nuvarande `cupService.ts` implementerar **knockout-format**:

- 12 lag, top 4 (efter reputation) får bye till kvartsfinal
- 8 övriga lag spelar förstarunda (4 matcher)
- Förstarunda (4) → kvartsfinal (4) → semifinal (2) → final (1) = **11 cup-matcher per säsong**
- Knockout med single-game elimination
- `CUP_MATCHDAYS` mappar cup-rundor till matchday 3, 8, 13, 19 — infogas mellan ligaomgångar

Det är **inte** verklighetens gruppspels-modell, utan en knockout-modell som kan anpassas.

### 4.4 Beslut: behåll knockout, flytta timing till försäsong

**Beslut V2:** Refactor till gruppspels-modell är för stor (skulle kräva ny CupBracket-typ, GroupStanding, omskrivning av UI-komponenter). Vi behåller **knockout-format** men **flyttar timing** till försäsongen.

**Vad som ändras:**
- `CUP_MATCHDAYS`-mappningen tas bort
- Cup-rundor schemaläggs i augusti-september + finalhelg första helgen oktober
- Top 4 bye-systemet behålls oförändrat
- Cup-fixture-generering i `cupService.ts` behåller sin logik

**Vad som inte ändras:**
- Cup-bracket-strukturen
- Antal cup-matcher per säsong (11)
- Top 4 efter reputation får bye
- Knockout med single-game elimination

### 4.5 Specialfall: Allsvenska Supercupen

För lag som *inte* är i elitserien finns **Allsvenska Supercupen** med eget format. Vårt spel hanterar bara elitserielag, så Allsvenska Supercupen ignoreras.

---

## 5. Vårt spels nuvarande problem

### 5.1 Veckodagar i ROUND_DATES

Verifierat mot `getRoundDate()` i scheduleGenerator.ts för säsongen 2026/27:

| Round | Datum | Veckodag | Realistiskt? |
|---|---|---|---|
| 1 | 2026-10-08 | Torsdag | ❌ |
| 2 | 2026-10-15 | Torsdag | ❌ |
| 3 | 2026-10-22 | Torsdag | ❌ |
| 4 | 2026-10-29 | Torsdag | ❌ |
| 5 | 2026-11-05 | Torsdag | ❌ |
| 6 | 2026-11-12 | Torsdag | ❌ |
| 7 | 2026-11-26 | Torsdag | ❌ |
| 8 | 2026-12-03 | Torsdag | ❌ |
| 9 | 2026-12-19 | Lördag | ✅ |
| 10 | 2026-12-26 | Lördag (annandag) | ✅ |
| 11 | 2026-12-30 | Onsdag | ✅ |
| 12 | 2027-01-04 | Måndag | ❌ |
| 13 | 2027-01-09 | Lördag | ✅ |
| 14 | 2027-01-14 | Torsdag | ❌ |
| 15 | 2027-01-18 | Måndag | ❌ |
| 16 | 2027-01-23 | Lördag | ✅ |
| 17 | 2027-01-28 | Torsdag | ❌ |
| 18 | 2027-02-01 | Måndag | ❌ |
| 19 | 2027-02-05 | Fredag | ✅ |
| 20 | 2027-02-09 | Tisdag | ✅ |
| 21 | 2027-02-13 | Lördag | ✅ |
| 22 | 2027-02-17 | Onsdag | ✅ |

**Problem:** 12 av 22 grundseriematcher (55%) ligger på torsdag eller måndag — veckodagar som elitseriebandy aldrig spelas på.

### 5.2 Cup-modellen är fel

Nuvarande `buildSeasonCalendar()` infogar cup-rundor mellan ligaomgångar (matchday 3, 8, 13, 19). Detta är **fotbollsmodellen** (FA-cupens parallellrundor). Bandy fungerar inte så. Bandyens cup är en **kompakt försäsongsturnering** som avslutas innan ligan startar.

### 5.3 Slutspelets datum

Slutspelet (rounds 23-32) ligger 28 feb - 13 mars i koden. Round 32 är "tredje lördagen i mars" via `thirdSaturdayInMarch()`. Detta är **rätt finalhelg**.

Slutspelets veckodagar har samma problem som grundserien — 3 av 8 slutspelsdagar (38%) på torsdag eller måndag.

---

## 6. Föreslagna ändringar — bandydagar

### 6.1 Princip: regelbaserad datumgenerering, inte hårdkodning

Ersätt `ROUND_DATES`-tabellen med en **regelbaserad funktion** som tar in:
- Säsongsår
- Round-nummer
- Round-typ (mid-week eller helg, baserat på round-position)

Och returnerar ett kalenderdatum på rätt veckodag, inom rätt period av säsongen.

### 6.2 Veckodagsfördelning per round-typ

| Round-typ | Tillåtna veckodagar | Frekvens i säsong |
|---|---|---|
| **Helgrunda** | Lördag, söndag | ~50% av rundor |
| **Vardagsrunda** | Tisdag, onsdag, fredag | ~45% av rundor |
| **Fast specialdatum** | Annandag jul, nyårsafton, finalhelg | ~5% av rundor |

### 6.3 Säsongsmall (22 grundseriematcher)

```
S = säsongsår, H = helg, V = vardag, A = annandag, F = finalhelg

R1   (V, fre)    8-11 oktober                  Säsongsstart, fredag
R2   (H)         lör/sön v.42                   Helgrunda
R3   (V, tis/fre) v.43                          Vardag
R4   (H)         lör/sön v.44                   Helgrunda
R5   (V, ons/fre) v.45                          Vardag
R6   (H)         lör/sön v.46                   Helgrunda
R7   (V, tis/fre) v.48                          Vardag (paus v.47 för landslag)
R8   (H)         lör/sön v.49                   Helgrunda
R9   (V/H)       17-21 december                 Sista omgång före jul
R10  (A)         26 december                    Annandagsbandy
R11  (V)         29-31 dec, prefer fre/ons      Mellandags-omgång (kan bli nyårsbandy)
R12  (H)         lör/sön v.1                    Trettondedags-omgång
R13  (V, tis/fre) v.2                           Vardag
R14  (H)         lör/sön v.2-3                  Helgrunda
R15  (V, tis/fre) v.3                           Vardag
R16  (H)         lör/sön v.4                    Helgrunda
R17  (V, tis/fre) v.4-5                         Vardag
R18  (H)         lör/sön v.5                    Helgrunda
R19  (V, fre)    v.6                            Vardag
R20  (H/V)       v.6-7                          Helg eller vardag
R21  (H)         lör/sön v.7                    Helgrunda
R22  (V/H)       v.8                            Säsongsavslut
```

### 6.4 Slutspelsmall (10 rundor, 23-32)

Slutspelet är **tightare** med kortare intervall (3-4 dagar). Veckodagsregler kan vara mer flexibla pga publik-intresse, men måndagar och torsdagar undviks fortfarande:

```
R23  (H)         sön v.9                        Slutspel kvartsfinal R1
R24  (V)         tis-ons v.10                   Kvartsfinal R2
R25  (V/H)       fre v.10                       Kvartsfinal R3
R26  (H)         lör v.10-11                    Semifinal R1
R27  (V)         tis-ons v.11                   Semifinal R2
R28  (V)         fre v.11                       Semifinal R3
R29  (H)         lör/sön v.11-12                Semifinal R3 (avgörande)
R30  (V)         tis-ons v.12                   Final mat 1 (om bäst-av-3)
R31  (H)         lör v.12                       Final mat 2
R32  (F)         tredje lör mars                BANDYFINALEN (avgörande)
```

### 6.5 Algorithm-skiss för datumgenerering

```typescript
type RoundDayType = 'weekend' | 'weekday' | 'annandagen' | 'final'

function generateRoundDate(
  season: number,
  roundNumber: number,
  rng: RNG  // seedad per säsong för reproducerbarhet
): { date: string; weekday: number; tipoffHour: number } {
  const dayType = getRoundDayType(roundNumber)

  switch (dayType) {
    case 'annandagen':
      return { date: `${season}-12-26`, weekday: getDayOfWeek(season, 12, 26), tipoffHour: 13 }

    case 'final':
      return { date: thirdSaturdayInMarch(season + 1), weekday: 6, tipoffHour: 14 }

    case 'weekend': {
      const targetWeek = roundToWeek(roundNumber)
      const day = rng.pick([6, 0]) // lördag eller söndag
      return { date: weekToDate(season, targetWeek, day), weekday: day, tipoffHour: rng.pick([13, 14, 15, 17]) }
    }

    case 'weekday': {
      const targetWeek = roundToWeek(roundNumber)
      const day = rng.pick([2, 3, 5]) // tisdag, onsdag, fredag
      return { date: weekToDate(season, targetWeek, day), weekday: day, tipoffHour: 19 }
    }
  }
}
```

Veckorna mappas en gång per säsong baserat på säsongsstart (8-11 oktober) och säsongsslut (tredje lördagen i mars).

### 6.6 Determinism

`scheduleGenerator` använder redan `_season` som seed-källa. Generera RNG med `mulberry32(season)` och samma seed ger samma schema över multipla körningar. Detta är **kritiskt** för testning, save-game-konsistens och replay.

---

## 7. Föreslagna ändringar — cupens fönster (knockout-format som försäsong)

### 7.1 Princip: Cup som försäsongsturnering, behåll knockout-format

Ta bort `CUP_MATCHDAYS`-mappningen som infogar cup-rundor mellan ligaomgångar. Generera cup-rundor i augusti-september med finalhelg första helgen oktober. Behåll knockout-strukturen från `cupService.ts` oförändrad.

### 7.2 Cup-rundor och datum

Med 4 cup-rundor (förstarunda → kvartsfinal → semifinal → final) ger detta följande mall:

```
Cup R1 (förstarunda)    helgen mitten augusti          v.34, lördag
Cup R2 (kvartsfinal)    helgen slutet augusti          v.36, lördag
Cup R3 (semifinal)      lördag första oktober-helgen   v.40, lördag
Cup R4 (final)          söndag första oktober-helgen   v.40, söndag
                        (semi och final samma helg, "Cup-finalhelgen")
```

Mellan R2 (kvartsfinal) och R3 (semifinal) ligger **3-4 veckor** för spelarvila och träning. Detta motsvarar verklighetens långsamma cup-tempo med vänskapsmatcher mellan rundorna (ej modellerat i spelet, B5).

### 7.3 Cup-veckodagar och tipoff-tider

Cupen har **mer flexibilitet** eftersom säsongen inte är aktiv:
- R1 och R2 (gruppfasen-ekvivalent): lördag eftermiddag, kl 14:00
- R3 (semifinal): lördag, kl 14:00 eller 17:00 (två semifinaler samma dag)
- R4 (final): söndag, kl 14:00

Inga måndagar/torsdagar i cupen heller (bandybundens etablerade rutin).

### 7.4 Cup-final och liga-start överlappning

Cup-finalen söndag första oktober-helgen → Liga-start fredag följande vecka ger **5-6 dagars vila**. Lag som spelat cup-final har bara dryga veckans vila innan första ligamatchen.

**Beslut V3:** Behåll fast R1-datum för alla lag. Cup-finalisterna får träna med tröttare ben — 5-6 dagars vila räcker, asymmetriska scheman bryter "alla möts samma matchday"-logiken. 

Matchengine kan eventuellt få en `tirednessModifier: 1.05` för cup-finalister i deras R1-match som kosmetisk effekt (lite lågre stamina-nivåer första 30 min). Inte kritisk för MVP.

### 7.5 ScheduleGenerator-struktur

```typescript
// scheduleGenerator.ts
export function buildSeasonCalendar(season: number): MatchdaySlot[] {
  const calendar: MatchdaySlot[] = []
  let day = 0

  // CUP-MATCHDAGAR (matchday 1-4, augusti-oktober)
  // R1: helgen mitten augusti
  // R2: helgen slutet augusti
  // R3: lördag första oktober-helgen
  // R4: söndag första oktober-helgen
  for (let cupRound = 1; cupRound <= 4; cupRound++) {
    day++
    calendar.push({
      matchday: day,
      type: 'cup',
      cupRound,
      date: getCupRoundDate(season, cupRound),
      weekday: cupRound <= 2 ? 6 /* lördag */ : (cupRound === 3 ? 6 : 0 /* söndag */),
      tipoffHour: 14,
    })
  }

  // LIGA-MATCHDAGAR (matchday 5-26, oktober-februari)
  for (let leagueRound = 1; leagueRound <= 22; leagueRound++) {
    day++
    const dateInfo = generateRoundDate(season, leagueRound, makeRng(season + leagueRound))
    calendar.push({
      matchday: day,
      type: 'league',
      leagueRound,
      date: dateInfo.date,
      weekday: dateInfo.weekday,
      tipoffHour: dateInfo.tipoffHour,
      isAnnandagen: leagueRound === 10,
      isNyarsbandy: leagueRound === 11 && nyarsbandyEnabled(season),
    })
  }

  // SLUTSPEL-MATCHDAGAR (matchday 27+, februari-mars)
  // [genereras dynamiskt vid playoffTransition]

  return calendar
}
```

---

## 8. Datamodell-ändringar

### 8.1 Ny fields på `MatchdaySlot`

```typescript
interface MatchdaySlot {
  matchday: number
  type: 'league' | 'cup' | 'playoff'
  leagueRound?: number
  cupRound?: number               // 1-4 (förstarunda, kvarts, semi, final)
  date: string
  // NYA FIELDS:
  weekday: number                 // 0-6, 0=söndag
  tipoffHour: number              // 13-19
  isAnnandagen?: boolean          // true om 26 december
  isFinaldag?: boolean            // true om SM-final
  isNyarsbandy?: boolean          // true om 31 december (om enabled denna säsong)
  isCupFinalhelgen?: boolean      // true om R3/R4 i cup
}
```

### 8.2 Cup-fixture-generering oförändrad

`generateCupFixtures()` och `generateNextCupRound()` i `cupService.ts` behöver **inte** ändras strukturellt. De producerar redan rätt knockout-struktur. Men cup-konstanter finns på **två ställen** som måste hållas i synk:

**Steg 1: Uppdatera `scheduleGenerator.buildSeasonCalendar()`** — primärkällan för cup-infogning

Nuvarande kod (rad 73-110):
```typescript
const CUP_AFTER_LEAGUE_ROUND: Record<number, number> = {
  2: 1,   // Cup förstarunda after liga omg 2 → matchday 3
  6: 2,   // Cup kvartsfinal after liga omg 6 → matchday 8
  10: 3,  // Cup semifinal after liga omg 10 → matchday 13
  15: 4,  // Cup final after liga omg 15 → matchday 19
}

export function buildSeasonCalendar(season: number): MatchdaySlot[] {
  // ... infogar cup-rundor MELLAN ligaomgångar
}
```

**Ny kod:** Ta bort `CUP_AFTER_LEAGUE_ROUND`. Ersätt med ny kalenderlogik:
```typescript
export function buildSeasonCalendar(season: number): MatchdaySlot[] {
  const calendar: MatchdaySlot[] = []
  let day = 0

  // CUP-MATCHDAGAR (matchday 1-4, augusti-oktober)
  for (let cupRound = 1; cupRound <= 4; cupRound++) {
    day++
    calendar.push({
      matchday: day,
      type: 'cup',
      cupRound,
      date: getCupRoundDate(season, cupRound),
      // ... (weekday, tipoffHour, isCupFinalhelgen)
    })
  }

  // LIGA-MATCHDAGAR (matchday 5-26)
  for (let leagueRound = 1; leagueRound <= 22; leagueRound++) {
    day++
    // ... generateRoundDate + push
  }

  return calendar
}
```

**Steg 2: Uppdatera `cupService.CUP_MATCHDAYS`** — duplicerad pekarkonstant

```typescript
// Befintlig (rad 7-12):
const CUP_MATCHDAYS: Record<number, number> = {
  1: 3,   // förstarunda: after liga omg 2
  2: 8,   // kvartsfinal: after liga omg 6
  3: 13,  // semifinal: after liga omg 10
  4: 19,  // final: after liga omg 15
}

// Nytt:
const CUP_MATCHDAYS: Record<number, number> = {
  1: 1,   // förstarunda: matchday 1 (mitten augusti)
  2: 2,   // kvartsfinal: matchday 2 (slutet augusti)
  3: 3,   // semifinal: matchday 3 (lördag första oktober-helgen)
  4: 4,   // final: matchday 4 (söndag första oktober-helgen)
}
```

**VIKTIGT:** Båda konstanterna måste hållas i synk. De är duplicerade per design och ändras tillsammans. När fixturerna för Cup R2 genereras (efter Cup R1 är slutförd), använder cupService `CUP_MATCHDAYS[2] = 2` för att sätta matchday på fixturen. scheduleGenerator har redan placerat matchday 2 i kalendern som cup-typ.

### 8.3 Game-state-ändringar och sommarpaus

`SaveGame` behöver:
- Cup-resultat-historik per säsong (befintligt: `bracket: CupBracket` finns redan)
- Eventuellt en separat `cupCompleted: boolean` för UI-renderingar

**Sommarpaus:** Verifierat genom kodläsning av `seasonEndProcessor.ts`. Sommarpausen hanteras **passivt** — `currentDate` flyttar fram från SM-finalen (mitten mars) till säsongsstart i augusti utan att matcher genereras. preSeasonScreen och inbox-items daterade `${nextSeason}-09-15` markerar säsongsstart.

Ingen formell game-state-period för summer_break behövs. seasonEndProcessor genererar redan nästa säsongs schedule + cup-fixtures direkt vid säsongsslut.

---

## 9. Edge cases

### 9.1 Cancellerade matcher (från SPEC_VADER §6.3)

Cancellerade ligamatcher som flyttas behöver respektera **bandydagar** även för makeup-datumet. Använd samma `generateRoundDate(rng, 'weekday')` eller `'weekend'` för att hitta nästa lediga matchday.

### 9.2 Landslagssamlingar

Verkligheten har **landslagspaus** ~v.47 (november) och vid VM (mitten januari). Spelet ignorerar detta för enkelhet, men det förklarar varför ROUND_DATES hoppar från R6 (12 nov) till R7 (26 nov) — en två-veckors paus byggd in i schemat.

**Behåll**: Lägg en obligatorisk paus mellan R6 och R7 (alltid ~2 veckor mellan dem) för realistisk landslagsfönster-känsla, även om det inte modelleras explicit.

### 9.3 Klimatdata-pipelinen i SPEC_VADER §3.1

Klimat-data-pipelinen polletar PTHBV ±3 dagar runt matchdatumen. När ROUND_DATES omgenereras med RNG kommer datum att variera mellan säsonger. **Beslut V2 (Jacob bekräftade):** Polla bredare fönster (hela bandysäsongens period: 8 okt - 15 mars = 158 dagar) och filtrera vid lookup.

Cup-data behöver också inkluderas i klimatpipelinen. Augusti-september-perioden (cup-rundor) ger temp-data för **försäsongs-väder** — varmare, regn vanligare. Det skapar nya möjligheter för commentary: "Cup-finalen i strålande sensommarsol — andra världen mot ligadöden i februari."

### 9.4 Sommarpaus

Mellan SM-finalen (mitten mars) och cup-R1 (mitten augusti) är **5 månaders sommarpaus**. Game-state-period `summer_break` behöver hantera:
- Transferfönster (befintligt via `transferService.ts`)
- Träningsläger
- Kontraktsförhandlingar
- Akademispelare flyttas upp
- Pension/avhopp av veteraner
- Ny manager-kontrakts-evaluering

**Verifiera om detta är implementerat.** Om inte: separat spec krävs för sommarpaus-flödet.

---

## 10. Implementeringsfaser

### Fas 1 — Veckodags-fix utan cup-ändring (~1 dag Code)
Lägg till `weekday` och `tipoffHour` på MatchdaySlot. Ersätt hårdkodade datum i `getRoundDate()` med RNG-baserad generering med veckodagsregler. **Behåll cupens nuvarande infogning tills vidare.**

**Test:** Veckodagsfördelning över 100 säsonger ska visa ~95% tisdag/onsdag/fredag/lördag/söndag, 0% måndag/torsdag.

### Fas 2 — Cup-omflyttning till försäsong (~1 dag Code)
Uppdatera `CUP_MATCHDAYS` i `cupService.ts` till nya matchday-positioner (1-4). Uppdatera `buildSeasonCalendar()` så att cup-rundorna placeras i augusti-september + finalhelg första oktober-helgen. Behåll all annan cup-logik oförändrad.

**Test:** Cup-matchdagar ligger alla före R1 i ligan. Cup R1 är matchday 1, R2 är matchday 2, R3 och R4 är matchday 3-4. Liga R1 är matchday 5.

### Fas 3 — Specialdatum-events (~1 dag Code + 0.5 dag Opus för text)
Annandagsbandy, nyårsbandy, finaldag, cup-finalhelgen flaggas i `MatchdaySlot`. Inbox-events fyrar season-start och dagen före. Klubbar med hög-profil-derbymatch på annandagen får extra hype-events.

### Fas 4 — Justering klimatdata-pipeline (~1 dag Python + 0.5 dag Opus för spec-justering)
PTHBV-datainsamling pollar hela säsongens period (158 dagar) istället för matchday-specifika fönster. Klimatprofiler omgenereras. SPEC_VADER §3.1 uppdateras.

**Total tid:** ~3.5 Code-dagar + 1 Opus-dag + 1 Python-dag = ~1 sprint.

(Mindre än V1-uppskattningen eftersom knockout-format behålls — ingen cupService-refactor.)

---

## 11. Beslutade scope-frågor

| Fråga | Beslut | Konsekvens |
|---|---|---|
| **B1: Cup-format** | ~~6+6 gruppspel~~ → **Behåll knockout** (V2-revision) | Stor refactor undviks; mindre verklighetstroget men 11 cup-matcher/säsong är hanterbart |
| **B2: Nyårsbandy** | **Ibland** (~30-50% av säsongerna, slumpat) | Feature-event som klubbarnas styrelser kan glädjas åt |
| **B3: Cup obligatoriskt** | **Ja** (alla lag deltar i cupen) | Cup-resultat påverkar inte säsongsbetyg, men seger ger sponsorbonus och morale-boost |
| **B4: Slutspelsformat** | **Behåll nuvarande** (8 slutspelsrundor + final) | Implicierar bäst-av-3, verifiera mot playoffService |
| **B5: Vänskapsmatcher mellan cup-rundor** | **Senare-sprint** | Inte i scope för denna spec |
| **B6: Klimatdata-fönster** | **Bredare fönster** (243 dagar/säsong, 1 aug — 31 mars) | Robust mot framtida schedule-ändringar; täcker cup + liga + slutspel |
| **B7: Cup-timing** | **Som verkligheten** — cup som försäsong aug-sep + finalhelg första oktober-helgen | Bandyrytmen bevaras, cup blir säsongens första kapitel |
| **B8: Top 4 bye-system** | **Behåll** | Befintlig cupService-logik behålls; stora klubbar prioriteras (realistisk seeding); bye-systemet kan revideras i framtida cup-refactor |

---

## 12. Öppna frågor för Code

### Öppen fråga 1: Sommar-period i game-state

Spelet behöver hantera 5-månadig sommarpaus mellan SM-finalen och cup-R1. Är detta implementerat? Behöver verifieras innan fas 2 startar.

### Öppen fråga 2: Cup-resultat påverkar reputation/sponsorer?

Cup-vinst i verkligheten ger pris-pengar och prestige. Spelet kan:
- Ignorera (cupen är bara "förträning")
- Ge mindre prispengar
- Ge prestige-boost för hela säsongen

Detta är **utanför scopet för denna spec** men flaggas för framtida feature-spec.

### Öppen fråga 3: Domarutsättning för cup vs liga

Domarpoolen i `refereeService.ts` används för båda turneringarna. Om cup-matcher har egen domar-prioritet (mer junior-domare?) eller samma som liga, behöver verifieras.

### Öppen fråga 4: Befintliga sparfiler

Hur hanteras sparfiler från innan denna ändring? Migration-strategin behöver beslutas innan fas 1 deployas.

---

## 13. Risker

### Risk 1: Befintliga sparfiler bryts av schemaändringar
*Sannolikhet:* Hög
*Mitigering:* Konkret migrationsplan för save-format-v12:

1. **Detektera version** via SaveGame-version-tag (om <12 → pre-fix-format)
2. **Behåll Completed-fixtures** med deras existerande IDs och resultat — historiken är intakt
3. **Omgenerera framtida fixtures** (Scheduled-status) med nya algoritmen, seed = `game.currentSeason`
4. **Cup-fixtures:** om cup redan påbörjats i pre-fix-formatet — behåll bracket som det är för nuvarande säsong. Nästa säsongs cup genereras med ny algoritm.
5. **Låt inbox-events historik förbli oförändrad** — datum-format ändras inte, bara matchdag-positioner
6. **Sätt nytt SaveGame-version-tag (12)** efter migration

Verifierat: `seasonEndProcessor.ts` har redan `seed ?? game.currentSeason * 12345` som fallback — vi kan härleda deterministiskt seed från season även utan explicit sparat seed-fält.

### Risk 2: Cup-omflyttning bryter befintlig event-pipeline
*Sannolikhet:* Medel
*Mitigering:* Stega upp implementation. Fas 1 ändrar bara veckodagar, Fas 2 är där cupen flyttas. Mellan faserna kan båda systemen samexistera.

### Risk 3: Sommarpaus inte implementerad
*Sannolikhet:* Medel
*Mitigering:* Verifiera tidigt i fas 2 om game-state har period för "summer_break". Om inte, separat sub-spec krävs och fas 2 skjuts upp.

### Risk 4: Test-data behöver uppdateras
*Sannolikhet:* Hög
*Mitigering:* Alla unit-tester som hänvisar till specifika ROUND_DATES-värden eller CUP_MATCHDAYS-värden kommer att brytas. Generera nya golden-files för regression-tester.

---

## 14. Sammanfattning

**TL;DR**

1. **Veckodagar:** Ersätt hårdkodade ROUND_DATES med RNG-baserad generering som respekterar bandydagar (tisdag/onsdag/fredag/lördag/söndag, aldrig måndag/torsdag).
2. **Cup-timing:** Flytta Svenska Cupen från "infogad mellan ligaomgångar" till "försäsongsturnering aug-sep + finalhelg första oktober-helgen".
3. **Cup-format:** Behåll knockout-format från befintlig cupService — ingen refactor.
4. **Specialdatum:** Annandagsbandy (26 dec) → derbymatch-event, nyårsbandy (31 dec) → optionell, finaldag (tredje lördagen mars) → fast.
5. **Klimatdata-pipelinen** (SPEC_VADER) anpassas till bredare datumfönster så att den inte är beroende av specifika ROUND_DATES.

**Effekt på spelaren:**
- Schemat känns som riktig bandy
- Cupen blir en meningsful försäsongsturnering, inte en distraktion mitt i ligan
- Annandagsbandy och nyårsbandy får sina rätta atmosfär
- SM-finalen behåller sin fasta tredje-lördagen-i-mars-status

**Tidsåtgång:** ~3.5 Code-dagar + 1 Opus-dag + 1 Python-dag = ~1 sprint.

---

## Slut SPEC_MATCHDAGAR
