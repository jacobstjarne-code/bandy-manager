# SKISS — Kalender-refaktor (single source of truth)

**Datum:** 2026-05-21 (omskriven efter fynd av SPEC_MATCHDAGAR + SPEC_VADER)
**Status:** Diagnos klar. Vilar nu på befintlig research, inte minnesgissningar.
Redo att specas efter att trettondags-/landslagsdetaljer landats.
**Bakgrund:** Tidslinjen svajar. Jacobs hypotes — bygg en kalender spelet
förhåller sig till — är korrekt, men problemet är större och mer precist än
"fel datum".

**VIKTIG KORRIGERING (2026-05-21):** En tidigare version av denna skiss påstod
att det inte fanns någon kalender-spec. Fel. `SPEC_MATCHDAGAR.md` (2026-04-27,
V3) och `SPEC_VADER.md` (V2) finns och är grundliga, empiriskt researchade
(SAIK 25/26 spelschema, Per Selin ligachefscitat, SMHI/PTHBV-klimatdata).
Speldagar, tider och specialdatum är redan lösta DÄR. Denna refaktor rör inte
deras innehåll — den rör arkitekturen de vilar på.

---

## 1 · Vad som FAKTISKT svajar (och vad som inte gör det)

### Inte problemet: speldagar och tider
SPEC_MATCHDAGAR löste detta och koden byggde det. `ROUND_DAY_TYPE` i
scheduleGenerator undviker måndag/torsdag, fredag är primär vardagsdag (per
SAIK-data), cupen är flyttad till försäsong. Realismen finns. Rör den inte.

### Problemet: ingen lagrad sanning + tre tidsaxlar

1. **Kalendern lagras aldrig.** `buildSeasonCalendar(season)` räknas om från
   noll varje gång — roundProcessor, useMatchGenerator, getRoundDate,
   MatchScreen. Deterministisk men en kedja: varje ligarundas datum hänger på
   föregående via ackumulerande `seqFloor` + seedad RNG. Ömtålig.

2. **Matchday/roundNumber-mismatch (konkret bugg).** I roundProcessor:
   `calendarSlot?.date ?? getRoundDate(season, nextMatchday)`. `calendarSlot`
   hittas i matchday-rymden (liga = matchday 5-26). `getRoundDate` tolkar
   argumentet som leagueRound (1-22). Fyra stegs offset. Triggas fallbacken
   blir datumet fel.

3. **Fixtures bär inte sina datum.** En Fixture har `roundNumber`, inte `date`
   eller `tipoffHour`. "När spelas matchen" härleds, inte lagras.

4. **TRE tidsaxlar som aldrig möts:**
   - Liga startar i oktober (`scheduleGenerator`, snart november)
   - Väderpipelinen pollar från **1 augusti** (`SPEC_VADER §3.1`)
   - `seasonalTone` räknar dag-i-säsong från **1 september**
   Schema, väder och visuell säsongston hänger alla på tidsaxeln — men på var
   sin. Det är därför tonen, vädret och matcherna kan glida isär.

Svajet är summan av dessa fyra. Speldagarnas realism (SPEC_MATCHDAGAR) sitter
ovanpå en arkitektur som inte har en enda lagrad sanning.

---

## 2 · Lösningen — en lagrad kalender som matar allt

A. **Bygg kalendern en gång vid säsongsstart.** Kör `buildSeasonCalendar` (med
   SPEC_MATCHDAGAR-reglerna) när säsongen skapas, lagra i SaveGame:
   `seasonCalendar: MatchdaySlot[]`.

B. **Stämpla varje fixture vid generering** med `date` + `tipoffHour` från
   kalendern. "När spelas matchen" blir ett faktum på matchen.

C. **Alla läsare går mot lagrad kalender / fixturens datum.** Riv ut alla
   on-demand-anrop till `buildSeasonCalendar` och `getRoundDate`. `getRoundDate`
   blir en uppslagning eller försvinner. Matchday/round-mismatchen dör.

D. **Ena de tre tidsaxlarna.** Kalendern definierar EN säsongsstart (november).
   - `seasonalTone` mappar sina keyframes mot kalenderns ankare, inte mot 1 sep
   - Väderpipelinens lookup utgår från fixturens stämplade datum (pipelinen är
     redan byggd för bredare fönster — SPEC_VADER §3.1 — så detta är robust)
   - Matchschemat ÄR kalendern
   Schema, väder och ton hänger då på samma axel.

E. **seasonalTone in i design token-systemet.** Idag har `seasonalTone.ts` egna
   hex-värden (#1a1612 etc) frikopplade från tokens. Säsongstonen ska gå genom
   design token-systemet, inte definiera egen färg vid sidan av. (Jacobs
   påminnelse — får inte missas.) Detta är en egen del av refaktorn, kopplad men
   separat från datumlogiken.

F. **Migration.** Gamla saves saknar `seasonCalendar`: bygg en gång vid laddning,
   stämpla befintliga fixtures. Engångskostnad. (SPEC_MATCHDAGAR §13 har redan
   en migrationsplan att återanvända.)

Resultat: en tabell, byggd en gång, som schema, väder OCH ton förhåller sig
till. Inget kan svaja eftersom det inte finns två ställen som kan vara oense.

---

## 3 · LÅSTA DESIGNBESLUT (Jacob, 2026-05-21)

Spelet fångar bandyns rytm och känsla — inte ligans exakta schema. Designval:

1. **SM-finalen ALLTID på Studenternas IP, Uppsala.** I verkligheten flyttar
   den (SPEC_MATCHDAGAR noterar Västerås/ABB Arena f.n.) — i vårt spel aldrig.
   Studenternas är spelets fasta katedral. Koden hårdkodar det redan.

2. **Cupen i oktober, koncentrerad — inte aug-sep.** SPEC_MATCHDAGAR la cupen
   aug-sep + okt-final (verklighetstroget). Jacob: släpp aug-sep, håll cupen i
   oktober. Förenklar — cupen blir oktoberuppladdningen precis före ligastarten,
   ingen utdragen sensommarcup, mindre att bygga. Sekvens: cup okt → liga
   nov-feb → slutspel mars.

3. **Säsongen startar i NOVEMBER.** Utomhusbandy först — säsongen börjar när
   isen bär. Identitetsmarkör, inte förenkling. Ändrar SPEC_MATCHDAGAR:s
   oktoberbas: `ROUND_WINDOWS`, `seqFloor`, och annandagens position i
   runda-sekvensen räknas om från november.

4. **Tolv lag, ett enda landslagsuppehåll.** SPEC_MATCHDAGAR har en v.47-paus
   (R6→R7). Behåll EN paus — och gör den till en rolig mekanik: spelare blir
   uttagna till landslaget, truppen får frånvaro att hantera mitt i serien.
   Släpp övriga uppehåll. Pausen ger också schemat andning.

5. **Liganamnet är irrelevant.** Fiktiv liga, inget verkligt namn behövs. Om det
   visas i UI är det en egen etikett.

### Designprincip: bygg från FASTA ANKARE
Novemberstart + annandagen 26/12 + ev. trettondagen 6/1 + SM-final tredje
lördagen mars = fasta ankare. Spika ankarna, fördela rundorna mellan dem.
Ankare + interpolation kan inte glida som kodens nuvarande kedja.

Narrativ båge: novemberis som läggs → annandagsbandy i midvinter → SM-final i
marssol med smältande is. Utomhustemat, vädret (SPEC_VADER) och seasonalTone
drar åt samma håll i stället för isär.

---

## 4 · Redan löst i SPEC_MATCHDAGAR + SPEC_VADER — bevara

Inget av detta ska webb-verifieras eller gissas om. Det är researchat:

- **Speldagar:** fredag (primär), tisdag, onsdag + helg. Aldrig måndag/torsdag.
  (SAIK 25/26, Per Selin.)
- **Tider:** tis/ons 19, fre 17/19, lör 14/15/17, sön 13/15, annandag 13:15-17,
  nyårsafton 13:15-14.
- **Specialdatum:** annandagsbandy 26/12 (fast), nyårsbandy 31/12 (~30-50%
  slumpat), trettondag 6/1 (som helg), SM-final tredje lör mars.
- **Väder:** PTHBV/SMHI-klimatprofiler per klubb, köldregler (3×30 vid <-17°C,
  inställd <-22°C), iskvalitet, arketyper. Pipelinen pollar brett (1 aug-31 mar)
  just för att vara robust mot variabla matchdatum.

Refaktorn ska BEVARA allt detta och se till att den lagrade kalendern matar det
korrekt — inte ersätta det.

---

## 5 · Kvar att landa innan spec

- **Trettondagsbandy (6/1) som andra fast vinterhelg?** Annandagen är låst.
  SPEC_MATCHDAGAR har nyårsbandy (31/12) slumpat + trettondag som vanlig helg.
  Med novemberstart och två rena julankare kan trettondagen lyftas till fast
  punkt. Smak, Jacobs beslut.
- **seasonalTone → design tokens:** hur djupt? Egen delspec eller del av denna?
  Bör samordnas med Design (lördag) eftersom det rör token-systemet.

---

## 6 · Sekvens

1. Enas om refaktorn (gjort)
2. Landa trettondag + seasonalTone-token-djup
3. Speca refaktorn — vilar på SPEC_MATCHDAGAR + SPEC_VADER, enar tre tidsaxlar
4. Code bygger: seasonCalendar i SaveGame, fixture-stämpling, riv on-demand,
   ena seasonalTone + väder mot kalendern, migration, test som låser tidslinjen

Egen sprint. Rör scheduleGenerator, Fixture, SaveGame, seasonalTone,
weatherService-lookup och alla läsare. Inte buntad med B8-B10.

— Opus, 2026-05-21
