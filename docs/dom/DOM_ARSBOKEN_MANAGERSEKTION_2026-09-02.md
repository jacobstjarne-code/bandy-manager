# DOM — ÅRSBOKEN KONSUMERAR MANAGERDAGBOKEN (steg 2–3, andra bågen)

**Datum:** 2026-09-02 · **Av:** Opus · **Utlöst av:** GPT:s burnout-audit ("årsboken tappar managerns största personliga historia" + "årsminnet kunde välja 'inget beslut stack ut' trots att dagboken beskrev året som nära slutet") + trestegsmodellen (lagras→hittas→används). Andra bågen efter burnout, samma mönster.

## Grundat i koden — årsboken är INTE tunn

`generateSeasonSummary` (seasonSummaryService.ts) är en av de mest sofistikerade ytorna i kodbasen. Den läser REDAN: `mostImportantDecision` (liggaren, Fas 2), tvåsanningsmeningen (placering vs objektiv), keyMoments (poängrankad), storyTriggers, arc-storylines, topScorer/topRated event-sourcade. GPT:s fynd är alltså inte "årsboken är fattig" — det är en PRECIS lucka.

**Luckan:** årsboken läser INTE `managerProfile.diary`. Där bor managerns EGEN säsong — `burnout_peak`, `burnout_scar` (nya, takdomen), `rivalry` (nemesis blev din nemesis), `milestone` (10/25/50 segrar, 3/5/10 säsonger), `era_shift`. Diaryn ESKALERAR redan korrekt (burnout bevisade det), men den når aldrig årsboken. Managern kan ha gått till burnout-taket och tillbaka, fått en nemesis över tre säsonger, passerat 50 karriärsegrar — och årsboken nämner inget av det. Sofistikeringen produceras och konsumeras aldrig av den yta som ska summera året. Steg 1+2 klara (diaryn lagrar + eskalerar), steg 3 saknas (årsboken använder den inte).

## Domen — en "Din säsong som tränare"-sektion i årsboken

Årsboken får en managersektion som konsumerar `managerProfile.diary` för den avslutade säsongen (`diary.filter(e => e.season === game.currentSeason)`). Ren läsning av redan durabel data — samma trestegs-avslut som burnout-återfallet, en yta som använder minnet.

### Vad sektionen bär (grundat i diary-typerna som redan finns)
- `burnout_peak` / `burnout_scar` → managerns utbrändhet under året, med den tyngd diaryn redan eskalerat till. Det GPT specifikt saknade.
- `rivalry` → en nemesis som växt fram.
- `milestone` → karriärsegrar/säsonger passerade.
- `era_shift` → klubbens era skiftade under din ledning.

### Formen (Opus text, mot den byggda strukturen)
Diary-posterna bär redan sin `text` (låst prosa, skriven denna session för burnout, av roundProcessor för milestone/rivalry/era). Så sektionen RENDERAR befintlig text, den genererar ingen ny per instans — samma "rå sanning i botten, tolkning i ytan" som liggaren. Opus skriver bara sektionens RUBRIK + ev. en inramande mening när sektionen är tom vs full. Ingen ny per-händelse-text: diaryn äger den.

### Kopplingen till GPT:s andra fynd
"Årsminnet valde 'inget beslut stack ut' trots max burnout" — det är `mostImportantDecision` som föll till fallback medan diaryn skrek. De två är olika axlar: mostImportantDecision är BESLUT (liggaren), managersektionen är managerns TILLSTÅND (diaryn). Bägge ska stå i årsboken; ett tomt besluts-fält betyder inte att managern inte hade en säsong. Domen fyller den andra axeln.

## SKYDDAT
- **Ingen ny per-instans-text.** Diaryn bär sin egen prosa (burnout-raderna skrevs denna session, milestone/rivalry/era av roundProcessor). Sektionen renderar dem — den skriver inte om dem. Opus skriver bara rubrik + tom/full-inramning.
- **Managersektionen är EN LÄSNING**, inte en ny lagring. Diaryn är källan (samma som isBurnoutRelapse läser). Ingen dual-write, inget nytt fält.
- **Tom sektion visas inte** (samma golv som keyMoments/storyTriggers: `undefined` när tom). En lugn säsong utan burnout/nemesis/milestone får ingen managersektion — den ljuger inte om drama som inte fanns.
- **Skala:** diary-posternas `matchday` är GLOBAL (roundProcessor + burnout-scar skriver global, verifierat) — om sektionen visar en omgång går den genom `matchdayToLeagueRound`/`getRoundLabel` som resten av årsboken, aldrig rå matchday.

## GODKÄNT NÄR (GPT:s omtest, samma Slottsbron-karriär)
1. En manager som gått till burnout-taket ser det i årsbokens managersektion — inte bara i den dolda tränardagboken.
2. En nemesis/milestone/era-skifte under året når årsboken.
3. En lugn säsong utan diary-drama får INGEN managersektion (ingen påhittad tyngd).
4. Sektionen renderar diaryns befintliga text, ingen ny per-instans-prosa.
5. GPT:s omtest: känns årsboken som att den minns managerns år, inte bara lagets tabell?

## ÄGARSKAP
Code: läs `managerProfile.diary` för säsongen in i `SeasonSummary` (nytt fält, t.ex. `managerSeason`), rendera sektionen i SeasonSummaryScreen, rubrik + tom/full-inramning som `[Opus]`. Opus: rubriken + inramningsmeningen (tom vs full) mot den byggda strukturen — INGEN per-händelse-text (diaryn äger den). Jacob: inget beslut väntar — mönstret är bevisat (burnout), detta är samma trestegs-avslut på nästa båge. GPT: omtest när årsbok + press båda landat (press är nästa båge efter denna).
