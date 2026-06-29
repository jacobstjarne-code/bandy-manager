# SPEC — Kalender-refaktor (single source of truth)

**Datum:** 2026-05-21
**Status:** Klar för Code. Arkitektur-refaktor. Ingen svensk spelartext.
**Vilar på:** `SKISS_KALENDER_REFAKTOR_2026-05-21.md`, `SPEC_MATCHDAGAR.md`
(speldagar/tider — bevaras), `SPEC_VADER.md` (väderpipeline — kopplas).
**Mål:** Ge schema, väder, säsongston, inbox-datering och event-timing EN
gemensam, lagrad kalender — i stället för en funktion som räknas om on-demand
på fyra ställen med tre olika säsongsbaser.

---

## 1 · Problemet (kort — full diagnos i skissen)

Tidslinjen svajar av fyra skäl, alla arkitektur (inte fel speldagar — de är
redan rätt via SPEC_MATCHDAGAR):

1. `buildSeasonCalendar` räknas om on-demand i roundProcessor, useMatchGenerator,
   getRoundDate, MatchScreen — en ackumulerande kedja, inte en lagrad tabell.
2. Matchday/roundNumber-mismatch: `calendarSlot?.date ?? getRoundDate(season,
   nextMatchday)` — calendarSlot i matchday-rymd (liga 5-26), getRoundDate i
   leagueRound-rymd (1-22). Fyra stegs offset om fallbacken triggar.
3. Fixtures bär inte `date`/`tipoffHour` — härleds, lagras inte.
4. Tre tidsaxlar: liga okt-start, väder pollar 1 aug, seasonalTone räknar från
   1 sep. Möts aldrig.

---

## 2 · Låsta designbeslut

- **Säsongsstart: november** (utomhusbandy — isen bär). Ändrar oktoberbasen.
- **Cup: oktober, koncentrerad** (inte aug-sep). Cup → liga (nov-feb) → slutspel
  (mars).
- **SM-final: alltid Studenternas IP, Uppsala**, tredje lördagen i mars.
- **Tolv lag, ETT landslagsuppehåll** mitt i serien — med spelaruttagning som
  mekanik (truppfrånvaro att hantera).
- **Specialdatum:** annandagen 26/12 FAST. Nyår (31/12) + trettondag (6/1)
  SLUMPADE (visas vissa säsonger).
- **Tider:** helg 14-15, SM-final 13, vardag (tis/ons/fre) 19, annandag ~13.
  El finns överallt — inga dagsljushänsyn.
- **Speldagar:** fredag primär vardag, + tis/ons + helg. Aldrig mån/tors.
  (SPEC_MATCHDAGAR, SAIK-data — bevaras.)

---

## 3 · Kärnan

Lägg `seasonCalendar: MatchdaySlot[]` på SaveGame. Bygg den EN gång vid
säsongsstart. Stämpla varje fixture med `date` + `tipoffHour`. Allt läser den
lagrade kalendern eller fixturens egna fält. Aldrig räkna om.

---

## 4 · Tickets

### T1 — seasonCalendar i SaveGame, byggd från fasta ankare

**Plats:** `SaveGame.ts`, `scheduleGenerator.ts`, säsongsstart-flödet
(worldGenerator / seasonEndProcessor).

- Lägg `seasonCalendar: MatchdaySlot[]` på SaveGame.
- Bygg om `buildSeasonCalendar` så den utgår från **fasta ankare** i stället
  för ackumulerande floor:
  - Ankare: ligastart första bandydagen i november, annandagen 26/12, SM-final
    tredje lördagen mars. (Ev. trettondag/nyår som slumpade flaggor.)
  - Fördela ligarundorna mellan ankarna med SPEC_MATCHDAGAR:s ROUND_DAY_TYPE-
    regler (fredag primär, helg, tis/ons; aldrig mån/tors), seedat per säsong.
  - Annandagen ska fortfarande landa 26/12 oavsett var i runda-sekvensen den
    hamnar med novemberstart (räkna om dess round-position).
- Bygg kalendern EN gång när säsongen skapas, lagra i `seasonCalendar`.
- Determinism: samma säsong → samma kalender (seedad). Behåll.

**Konsekvens av novemberstart:** `ROUND_WINDOWS` (idag offsets från Oct 8) räknas
om från novemberbas. Säsongen packas i ~19-20 veckor — verifiera att 22 rundor +
landslagspaus + slutspel får plats utan att matcher hamnar tätare än ~var 3:e dag.

### T2 — Stämpla fixtures med datum + tid

**Plats:** `Fixture.ts`, fixture-generering (scheduleGenerator/seasonEnd).

- Lägg `date: string` + `tipoffHour: number` på Fixture (om de inte finns).
- När fixtures genereras: slå upp matchday i `seasonCalendar`, stämpla date +
  tipoffHour på varje fixture direkt.
- "När spelas matchen" blir ett faktum på fixturen, inte en härledning.
- `stripCompletedFixture` får INTE strippa date/tipoffHour.

### T3 — Riv ut on-demand-omräkning

**Plats:** roundProcessor, useMatchGenerator, MatchScreen, getRoundDate.

- roundProcessor: ersätt `buildSeasonCalendar(...)` + `calendarSlot?.date ??
  getRoundDate(...)` med uppslagning i `game.seasonCalendar`. Matchday/round-
  mismatchen försvinner — slå alltid upp på matchday.
- useMatchGenerator, MatchScreen: läs `game.seasonCalendar` / `fixture.date`,
  räkna inte om.
- `getRoundDate`: gör om till ren uppslagning i seasonCalendar, eller ta bort
  och ersätt anropen med direkt slot-lookup.
- **Acceptans:** `buildSeasonCalendar` anropas på EXAKT ett ställe
  (säsongsbygget). Grep efter övriga anrop ska returnera noll.

### T4 — Ena de tre tidsaxlarna

**Plats:** `seasonalTone.ts`, weather-lookup i roundProcessor/weatherService.

- **seasonalTone:** byt tidsbasen från hårdkodat 1 september till kalenderns
  säsongsstart. `dayOfSeason` räknas från `seasonCalendar[0].date` (eller
  ligastart-ankaret), inte från ett eget datum. Tonen följer då den faktiska
  säsongen: novemberstart varm→kylig, midvinter djup, mars slutspelsskärpa.
- **Väder:** weather-lookup utgår från fixturens stämplade `date`. Pipelinen är
  redan byggd för brett fönster (SPEC_VADER §3.1) så detta är robust — men
  lookupen ska ta fixturedatumet, inte ett omräknat datum.
- **OBS — token-djup är Designs beslut (lördag):** seasonalTone har idag egna
  hex-värden. Om tonen ska bli riktiga design tokens (i stället för egen färg
  vid sidan av token-systemet) är en token-arkitekturfråga för Design. Denna
  ticket enar bara TIDSBASEN. Token-integrationen är separat och flaggas, inte
  byggd här.

### T5 — Cup oktober + landslagsuppehåll

**Plats:** scheduleGenerator (`getCupRoundDate`), cup-matchday-mappning.

- Flytta cup-rundorna från aug-sep till **oktober, koncentrerat** — alla fyra
  rundor i oktober, finalhelg sist, ligastart november därefter.
- Behåll knockout-strukturen (cupService oförändrad strukturellt).
- Landslagsuppehåll: EN paus mitt i serien (behåll SPEC_MATCHDAGAR:s ena paus,
  släpp resten). Spelaruttagnings-mekaniken (truppfrånvaro) är en separat
  feature — flaggas, inte i denna refaktor, men pausen ska finnas i kalendern
  som ankarpunkt den kan hänga på.

### T6 — Migration

- Gamla saves saknar `seasonCalendar` + fixture-datum: vid laddning, bygg
  kalendern en gång från aktuell säsong, stämpla befintliga Scheduled-fixtures.
  Behåll Completed-fixtures orörda (historik intakt). SPEC_MATCHDAGAR §13 har en
  återanvändbar migrationsplan.
- Sätt ny SaveGame-version-tag.

### T7 — Test som låser tidslinjen + systemkopplingar

- **Determinism:** bygg kalendern två gånger för samma säsong → identisk.
- **Single source:** assert att inget datum härleds utanför seasonCalendar
  (grep-test eller arkitektur-test att getRoundDate/buildSeasonCalendar inte
  anropas i läsare).
- **Speldagar bevarade:** över 100 säsonger, 0% mån/tors, fredag primär.
- **Ankare:** annandagen alltid 26/12, final tredje lör mars, ligastart november.
- **Inbox-ordning:** event/inbox-items daterade från seasonCalendar sorteras
  konsekvent (se §5).
- **Migration:** gammal save laddas, får kalender + stämplade fixtures, kraschar
  inte.
- Alla 922+ gröna.

---

## 5 · Systemkopplingar — vad kalendern matar (Jacobs "koppla alla system")

Kalendern är inte bara matchdatum. Den är tidsaxeln flera system hänger på.
Refaktorn ska göra den till EN axel:

| System | Hänger på kalendern via | Vad refaktorn fixar |
|---|---|---|
| Matchschema | matchday → date/tipoff | En lagrad tabell, ingen omräkning |
| Väder | fixture.date → klimat-lookup | Lookup på stämplat datum, inte omräknat |
| seasonalTone | dag-i-säsong → färgton | Samma säsongsbas som allt annat |
| Inbox-datering | items daterade game.currentDate (rundans datum) | Rundans datum kommer från kalendern, konsekvent |
| Inbox-sortering | `date.localeCompare` | Konsekventa datum → stabil ordning, inga hopp |
| Event-timing | events daterade newDate | Samma — rätt datum, rätt kronologi |
| Specialdatum-triggers | isAnnandagen/isNyarsbandy etc | Lästa från lagrad slot, triggar rätt |

**Vad detta LÖSER (Jacobs hypotes — korrekt för denna klass):** allt som beror
på datum och kronologisk ordning. Om `newDate` blir fel via fallback-buggen får
hela rundans inbox-items + events fel datum → fel sortering → "visas på fel
plats/tid". Stämplad kalender = konsekvent datering = stabil ordning. Det är
sant att on-demand-omräkningen orsakar detta.

**Vad detta INTE löser (var ärlig):** vilka events som *visas* vs begravs i
inbox, och prioritetshierarkin (Erik Ström-budet i inbox medan bandyskolan är
nudge). Det är synlighet och fas-affinitet — B8 (dukningssprinten), inte
datering. MEN: kalendern är FÖRUTSÄTTNINGEN för fas-affinitet. En event som ska
veta "är vi mitt i cupen / slutspelet / lugn ligaperiod" behöver en pålitlig
kalender att fråga. Så kalendern låser upp B8:s fas-medvetenhet — den ersätter
den inte.

**Presskommentar-på-samma-vy + budhistorik:** kan vara timing (kalender) eller
vy-routing (separat). T7 ska verifiera EFTER refaktorn vilka av de observerade
symptomen som försvinner med konsekvent datering och vilka som är kvar som
separata vy-buggar. Lova inte att alla försvinner — mät.

---

## 6 · Vad som BEVARAS (rör inte)

- SPEC_MATCHDAGAR:s speldags- och tidsregler (innehållet — bara tidsbasen och
  lagringen ändras)
- SPEC_VADER:s klimatpipeline och köldregler (bara lookup-datumkällan enas)
- Cup-knockout-strukturen i cupService
- Determinismen (seedad per säsong)

---

## 7 · Leveransordning

T1 → T2 → T3 (kärnan, i ordning). T4, T5 parallellt efter T3. T6, T7 sist.
Egen sprint. Rör scheduleGenerator, Fixture, SaveGame, seasonalTone,
weather-lookup, roundProcessor, useMatchGenerator, MatchScreen.

## 8 · Acceptanskriterier

- [ ] seasonCalendar lagrad på SaveGame, byggd en gång vid säsongsstart
- [ ] Fixtures stämplade med date + tipoffHour, överlever stripCompletedFixture
- [ ] buildSeasonCalendar anropas på exakt ETT ställe (grep = noll i läsare)
- [ ] Matchday/roundNumber-mismatchen borta
- [ ] seasonalTone + väder-lookup utgår från kalenderns tidsbas
- [ ] Novemberstart, cup oktober, annandagen 26/12, final tredje lör mars
- [ ] Nyår + trettondag slumpade, ETT landslagsuppehåll
- [ ] Migration av gamla saves
- [ ] Tidslinje-test grönt + 922+ tester gröna
- [ ] T7 dokumenterar vilka inbox/event-symptom som försvann

— Opus, 2026-05-21
