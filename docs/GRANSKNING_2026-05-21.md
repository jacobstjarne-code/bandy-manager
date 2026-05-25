# KODGRANSKNING — efter B8/B9/B10/B11 + textpooler

**Datum:** 2026-05-21
**Körs av:** Code i VS Code-kontexten (inte chatten). Plan mode tillåtet för läsning.
**Bakgrund:** Tung commit-våg på kort tid — B8, B9, B10, B11, kafferum-poolen,
cup-tonen Nivå 3. B11 ensam rörde scheduleGenerator, Fixture, SaveGame,
seasonalTone, väder-lookup och fem läsare. Subtila fel gömmer sig efter sådana
vågor.

**Granskningsregel (Jacobs):** Verifiera ALDRIG komponenter isolerat. Läs
parent-skärmen först, trace hela render-/data-flödet, visa kod — inte bara
slutsatser. Säg "renderas/fungerar korrekt i kontext", aldrig bara "finns".
För spel-logik: trace ETT komplett flöde steg för steg.

---

## Prioritet 1 — B11 kalender som single source of truth

Trace en hel säsong från `newGame()` till säsongsslut. Bevisa med kod:

- `seasonCalendar` byggs exakt EN gång vid säsongsstart och skrivs till SaveGame.
  Grep `buildSeasonCalendar(` i hela `src/` — ska finnas på ETT ställe
  (säsongsbygget). Varje träff i en läsare (roundProcessor, matchSimProcessor,
  useMatchGenerator, MatchLiveScreen, dailyBriefingService) är ett underkänt fynd.
- Matchday/roundNumber-mismatchen är DÖD. Hitta den gamla
  `calendarSlot?.date ?? getRoundDate(...)`-raden — bekräfta att fallbacken är
  borttagen, inte förbigången. Finns `getRoundDate` kvar: vad anropar den, varför?
- `seasonCalendar` överlever save→load→fortsätt. Ladda mitt i säsong, bekräfta
  identiska datum före och efter reload.

## Prioritet 2 — de tre tidsaxlarna möts

Följ ETT fixturedatum genom alla tre systemen, bekräfta gemensam säsongsbas:

- Fixturens stämplade `date` → väder-lookup. Tar lookupen fixturens datum, eller
  räknar den fortfarande själv?
- Samma datum → `seasonalTone`. Räknar tonen dag-i-säsong från novemberankaret,
  eller ligger 1-september-basen kvar någonstans (default, fallback, test-mock)?
- Bekräfta i en FAKTISK körning, inte bara i `calendarTimeline.test.ts` —
  testerna kan vara gröna mot en mockad kalender medan produktionsvägen avviker.

## Prioritet 3 — inbox/event-datering och E-K1

- Spela en säsong, verifiera att inbox sorteras stabilt — inget item daterar sig
  utanför `seasonCalendar`. Det var hela poängen för datum/ordning-klassen.
- E-K1: cup-rundor som genereras mitt i säsongen (nästa runda efter föregående
  spelats) — stämplas de med `date` + `tipoffHour` via samma kalenderväg, eller
  ostämplade? Känd lucka vid B11-leverans. Bekräfta + åtgärda om öppen.

## Prioritet 4 — migration v0.3.0

- Ladda en gammal save utan `seasonCalendar`. Ska få kalender + stämplade
  Scheduled-fixtures. Completed-fixtures orörda (historik intakt). Bekräfta att
  pre-v0.3.0-save inte kraschar och inte tappar spelad historik.

## Prioritet 5 — cup-tonen Nivå 3 sampling (kodlogik, ej text)

Texten är inlagd i `matchCommentary.ts` (`cup_atmosphere` 8 st,
`cup_finalweekend_atmosphere` 6 st). Det som saknas är samplingen. Bygg per
`docs/CUP_TONEN_NIVA_3_2026-05-17.md`:

- `cup_atmosphere` plockas ~40% istället för generic `atmosphere` när
  `isCupMatch && cupRound !== 'final'`.
- `cup_finalweekend_atmosphere` ~50% (cup_atmosphere ~30%, generic ~20%) när
  `isCupFinalWeekend` (semi/final).
- Rör INTE strängarna — de är skriven text. Bara väljarlogiken.

## Lättare svep, om tid finns

- B9 portal-oscillation: bekräfta att `staleBias` med frekvensgolv inte svänger
  över en spelad säsong (det var buggen).
- B10 lineupNudge: 8 fyllda + 3 tomma — är de tomma seedade så samma fixture ger
  samma tre, eller hoppar de vid re-render?

---

**Leverans:** rapportera per prioritet med kod-citat, viktigaste fyndet först.
1000 tester gröna efter ev. åtgärder. Det här är riktat mot där den senaste
vågen mest sannolikt lämnade subtila fel — kalendern och tidsaxlarna — inte ett
brett svep som inte hittar något.

— Opus, 2026-05-21
