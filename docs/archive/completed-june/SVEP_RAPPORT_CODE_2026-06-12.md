# Grep-svep + verify-rapport till Opus

**Datum:** 2026-06-12 · **Av:** Code · **Mottagare:** Opus/Fable
**Commits i dag:** `2ff5860` (mekaniska textfixar) · `c59f1d2` (MatchScreen/PortalScreen/CSS-tokens) · `97e35ca` (docs)

---

## DEL 1 — Grep-svep (G1–G8)

### G1 — tre/Tre poäng (2-p-systemet)

**Klara F3-buggar (segerpoäng = 2):**
```
src/domain/data/media/library/quotes/post_match_win.json:14   "Det satt där det skulle. Tre poäng."
src/domain/data/media/library/quotes/post_match_win.json:42   "Tre poäng."
src/domain/data/media/library/quotes/post_match_win.json:112  "Tre poäng till oss, en lugn kväll till för oss."
src/domain/data/media/library/quotes/post_match_win.json:175  "Tre poäng är tre poäng. Värre matcher kommer."
src/domain/data/media/library/quotes/post_match_win.json:203  "Vi kunde ha vunnit större. Tre poäng räcker."
src/domain/data/media/library/quotes/post_match_loss.json:28  "Tre poäng till dem, en träningsvecka till för oss."
src/domain/data/media/library/quotes/post_match_loss.json:112 "Aldrig riktigt med, tre poäng i gåva till {motståndare}."
```
Alla sju är otvetydigt segerpoäng. Mekanisk fix: tre→två. Code inväntar godkännande.

**RF-avdragskontext — Opus dömer:**
```
src/domain/services/coffeeRoomService.ts:197
  ['Materialaren', 'Tre poäng nästa säsong för {KLUBB}.', 'Vaktmästaren', 'Det är en tabellplats." Materialaren: "Minst.']
src/domain/services/scandalService.ts:287
  'RF utreder {KLUBB} — tre poäng på spel'
src/domain/services/scandalService.ts:291
  'Vaktmästaren: "Förbundet kollade bokföringen i {ANDRA_KLUBB}."\nMaterialaren: "Och?"\nVaktmästaren: "Tre poäng nästa år."'
src/domain/services/licenseService.ts:49   'RF beslutar: Tre poängs avdrag från {KLUBB}'
src/domain/services/licenseService.ts:52   'Tre säsonger med underskott. Tre poäng. {KLUBB} startar...'
src/domain/services/licenseService.ts:53   'Brevet kom på en tisdag. Tre poängs avdrag inför nästa säsong...'
```
Dessa avser RF-tabellpoängsavdrag, inte segerpoäng per match. Fråga: är "tre poängs avdrag" rimligt i ett 2-poängssystem (odd number)? Om ja → behålls. Om RF-avdrag alltid är jämnt → byt till "två poängs avdrag".

---

### G2 — Fel sport (period/frispark/etc)

**Inga F1-buggar hittade.** "Period" förekommer genomgående men i legitimt sammanhangs:
- `specialDateStrings.ts:38` — "3×30 minuter...två perioderna" = historisk match med tre halvlekar, korrekt.
- `matchCommentary.ts:168` — "Det fanns en period i andra halvlek..." = "period" som tidsspann, inte halvlek. OK.
- Resterande `period`-träffar = kod-term (periodisationService) eller tjänstespråk ("krisperiod", "mandatperiod"). OK.
- Inga träffar på frispark/straffspark/mittzon/linjedomar.
- `counterAttackInteractionService.ts:52` — "offside" i kommentar = korrekt, offside finns i bandy.

**Status: RENT.**

---

### G3 — hallen/bandyhall (världsbygge-buggen)

**hallDebateData.ts** — Alla träffar är intentionella. Hallen-debatten handlar specifikt om en potentiell hall som ännu inte finns. OK.

**specialDateStrings.ts:71,227** — "Ishallen bredvid" = isrinken/ishockeyhallen bredvid utomhusplanen. Korrekt — denna konstruktion är verklig bandy-geografi (Studenternas/Sävstaås har ishockeyhallar bredvid). OK.

**mecenatService.ts:110** — "har finansierat en bandyhall" = mecenat med bred verksamhet. Hallen kan tillhöra en annan ort. OK.

**Världsbygge-träffar (Opus dömer — sannolikt buggar om klubben spelar utomhus):**
```
src/domain/data/eventCardInlineStrings.ts:3
  "Materialaren bad {NAME} om hjälp att bära ut näten. Han var en av få som var kvar i hallen."
src/domain/data/managerKaraktarText.ts:25
  'Bor ensam nära hallen. Säger att det passar honom, och kanske gör det det.'
src/domain/data/boardQuotes.ts:100
  "Jag spelade för klubben när hemmamatch betydde att man gick till hallen."
src/domain/data/stillnessMicroPool.ts:39
  'Lokaltidningen skrev en helsida om ny asfalt vid hallen. Sportsidan fick en notis.'
src/domain/data/stillnessMicroPool.ts:55
  'Kyrkklockorna hörs ända in i hallen om dörren står öppen.'
src/domain/data/anslag/playoffAnslag.ts:13
  'Hallen tystnade fortare än vanligt. Resten åkte vi hem i.'
src/domain/data/injuryDoctorText.ts:92
  '{spelare} var först till hallen i dag. Kroppen börjar lita på sig själv igen.'
```
`boardQuotes.ts:100` är möjligen intentionell nostalgi ("förr spelade man i hallen"). De övriga är troliga världsbygge-buggar — "hallen" borde vara "vallen" / "planen" / "arenan" för utomhusklubbar. Ersättning per kontext:
- `eventCardInlineStrings.ts:3`: "kvar på vallen/arenan"
- `managerKaraktarText.ts:25`: "nära vallen" 
- `stillnessMicroPool.ts:39,55`: "vallen"
- `anslag/playoffAnslag.ts:13`: "Vallen tystnade"
- `injuryDoctorText.ts:92`: "till träning/planen"

---

### G4 — Tidsbuggen (i fjol/förra säsongen)

**Troligen RENT — inga nya tidsbuggar:**
```
src/domain/data/refereeData.ts:57    "Fick Elitseriematcher förra säsongen"
src/domain/data/boardData.ts:127-128  "förra säsongen" ×2 (board-citat)
src/domain/data/boardData.ts:173     "Det var inte taktiken det var fel på förra säsongen."
src/domain/data/matchCommentary.ts:839  "Han skulle ha slutat förra säsongen, sa de."
```
`refereeData.ts:57` — domarbakgrund, statisk karaktärsbeskrivning. `boardData.ts` — board-citat om föregående säsong, konsumeras i rätt kontext (styrelsemöte säsong 2+). `matchCommentary.ts:839` — bekräftad karaktärsreferens. Alla fyra är anti-tidsbuggar: "förra säsongen" i kontext där föregående säsong är relevant. Ingen fix nödvändig.

---

### G5 — F2-siffror i pools

**Grep gav tre träffar:**
- `matchCommentary.ts:247` — "bortre målet" fångades av "tre.*mål"-regexet. Falskt positiv.
- `post_match_win.json:175` + `post_match_loss.json:112` — täcks redan av G1.

**Status: RENT** (inga nya F2-siffror utöver G1-täckta).

---

### G6 — F2-namn (omvärld/pooler)

**OK per varumärkesprincipen:**
- `playerNames.ts/journalistService.ts/managerKaraktarText.ts` — Lindberg/Henriksson/Bergström i surname-pooler = vanliga svenska efternamn, inga specifika individer.
- `boardData.ts:14` — "Ulf Bergström, kassör" = fiktiv karaktär med vanligt namn. OK.
- `boardData.ts:79,97,118` + `clubOfferQuotes.ts:12,60,236` — Sandviken/Västerås i kontext som verklig bandygeografi. OK per principen.
- `refereeData.ts:42,47,77` + `klackEchoText.ts:79` + `specialDateStrings.ts` + `academyService.ts:10` + `anslag/cupAnslag.ts` — Bollnäs/Sandviken som verklig bandygeografi/-media. OK.
- `localEmployers.ts:24` — "Västerås stad" = korrekt regional arbetsgivare. OK.
- `patronData.ts:19` — "Stefan Lindberg" = fiktiv patron. OK.

**V2-bugg bekräftad (sundayTrainingScene):**
```
src/domain/data/scenes/sundayTrainingScene.ts:25,30,40,48,53,58
  Henriksson/Lindberg/Bergström hårdkodade som specifika spelare
  med val-etiketter "Gå ut och säg hej till Henriksson" etc.
  och relationseffekter mot spelare som inte finns i truppen.
```
Se V2 nedan för fullständig analys.

**Borderline — `matchCommentary.ts:396`:**
```
  "Avslag. Bollnäs. En match. Inget omspel."
```
Ingår i `cup_final_kickoff`-poolen. "Bollnäs" = cupfinalens verkliga arrangemangsort. Korrekt per varumärkesprincipen. Troligen OK.

---

### G7 — Journalist-kön (Hon/henne)

**Bekräftade könsbuggar (journalist):**
```
src/domain/data/efterklangText.ts:45
  '{journalist} ringde efter den matchen. Hon minns bättre än du tror.'
src/domain/data/efterklangText.ts:46
  '{journalist} skrev om det då. Hon har inte glömt.'
```
Journalist genereras av `journalistService.ts` med blandade kön. "Hon" är fel default. Fix: "Journalisten minns bättre än du tror." / "Journalisten har inte glömt."

**Borderline — Opus dömer:**
```
src/domain/data/boardMeetingCopy.ts:29
  'Ordförandens kök. Hon har plockat fram tre stolar runt köksbordet.'
```
Är ordföranden explicit en specifik kvinna i karakteriseringen? Om ja → OK. Om generisk → "Ordföranden har plockat fram..."

**Korrekt pronomen (inte buggar):**
- `boardData.ts:52` — "min fru... Hon har rätt" = refererar till fru. OK.
- `clubOfferQuotes.ts:68` — "Min mamma... Hon säger" = refererar till mamma. OK.
- `klackEchoText.ts:26` — "Min Birgitta... Hon sa" = specifikt namn. OK.
- `coffeeRoomService.ts:151,188,193` — "Hon" refererar sannolikt till kassören (som kan vara kvinna om karaktär är explicit). Borderline — se nedan.
- `coffeeRoomService.ts:461` — "Hon lägger ner mer tid" = {youth}-ledare som kan vara kvinna. Borderline.
- `supporterRituals.ts:66` — "{youth} springer... Hon vill" = {youth} pronomen. Om {youth} genereras med blandade namn: bugg. Om alltid kvinna: OK.
- `mecenatService.ts:101,158,171` — specifika kvinnliga mecenat-karaktärer. OK.
- `klackPresenter.ts:106`, `supporterEvents.ts:28,155` — "Elin" = explicit kvinnonamn. OK.
- `injuryStories.ts:6` — "morsan... Sover hos henne" = korrekt. OK.
- `cupFinalVictoryScene.ts:38` — "Birgitta... Hon" = korrekt. OK.

---

### G8 — 🏒 emoji (domslut c)

Lång lista. Kategoriserad för Opus-dom:

**Konfirmerade undantag (rör ej per domslut):**
- `EventCardInline.tsx:36` — `'🏒 KAPTENEN'` = EFTERKLANG_TYPE_ICON? Bekräfta.
- `PortalQueueRail.tsx:17` — `weeklyDecision: { icon: '🏒' }` = PORTAL_BEATS.emoji? Bekräfta.

**Mål-ikon (goal event):**
```
src/presentation/utils/formatters.ts:60  — MatchEventType.Goal → '🏒'
src/presentation/screens/granska/GranskaAnalys.tsx:64
src/presentation/screens/granska/GranskaOversikt.tsx:548
```
Vad ska mål-ikonen vara? ⛸️? 🥅? Lucide-ikon?

**MÅL!-markör i interaktioner:**
```
src/presentation/components/match/CounterInteraction.tsx:176
src/presentation/components/match/CornerInteraction.tsx:245
src/presentation/components/match/PenaltyInteraction.tsx:209
src/presentation/components/match/FreeKickInteraction.tsx:180,208
```
`'🏒 MÅL!'` — behåll som innehållssignatur (jubel i match-UI)?

**SectionLabel-prefix (✓ tillåtet per designregel om kategori):**
```
src/presentation/screens/TabellScreen.tsx:148    '🏒 Toppskytt'
src/presentation/screens/TabellScreen.tsx:638    '🏒 CUPENS SKYTTEKUNGAR'
src/presentation/screens/SeasonSummaryScreen.tsx:434  '🏒 DIN SÄSONG'
src/presentation/screens/SeasonSummaryScreen.tsx:503  AwardCard icon="🏒"
src/presentation/screens/granska/GranskaOversikt.tsx:120  '🏒 MATCHEN'
src/presentation/screens/granska/GranskaOversikt.tsx:622  '🏒 ANDRA MATCHER'
src/presentation/screens/RoundSummaryScreen.tsx:194,231,392
src/presentation/screens/PlayoffIntroScreen.tsx:139
src/presentation/screens/HistoryScreen.tsx:354,361,497
src/presentation/screens/QFSummaryScreen.tsx:55
src/presentation/components/player/CareerJourney.tsx:61
src/presentation/components/PlayerCard.tsx:602
src/presentation/components/AkademiTab.tsx:66
```

**Inline-innehåll i truppvy/stats:**
```
src/presentation/screens/SquadScreen.tsx:719,722  { emoji: '🏒', label: 'Toppskytt/Utvisningar' }
src/presentation/screens/SimSummaryScreen.tsx:219  🏒 <strong>spelare</strong>
src/presentation/screens/SeasonSummaryScreen.tsx:383  '🏒' (conditional trophy icon)
src/presentation/screens/SeasonSummaryScreen.tsx:531  '🏒' fallback i cup-result
```

**Kod-logik / tjänster:**
```
src/application/useCases/processors/transferProcessor.ts:337
  title: '🏒 {firstName} {lastName} är tillbaka från lån'
src/domain/services/weeklyDecisionService.ts:125
  optionA: { label: '🏒 Hörnor', ... }
src/domain/services/trainingService.ts:235
  TrainingType.BallControl: '🏒'
src/domain/services/events/hallDebateEvents.ts:105
  title: '🏒 Annandagsbandyn'
```

**Övrigt:**
```
src/presentation/utils/seasonShareImage.ts:157  — canvas-rendering
src/presentation/components/CoachMarks.tsx:33   — 'Kör igång! 🏒'
src/presentation/components/HelpOverlay.tsx:2   — 🏒 Matchen
src/presentation/components/dashboard/LastResultCard.tsx:55  — '🏒 Senast'
src/presentation/components/squad/StillnessSection.tsx:98   — isMatch ? '🏒'
src/presentation/screens/BoardMeetingScene.tsx:26  — identity: '🏒'
src/presentation/components/club/OrtenTab.tsx:137  — Bandyskola '🏒'
src/presentation/screens/granska/GranskaSpelare.tsx:120  — isPOTM badge
```

**Designaudit-testet (rör ej):**
```
src/debug/designAudit/rules/emojiConsistency.ts:13,16  — regelkod, inte UI
```

**Opus: behövs en handlingsplan per kategori innan Code kör.** Förslag att gruppera i:
1. Mål-ikon (formatters + granska) → ett beslut
2. MÅL!-markör i interaktioner → ett beslut (behålls eller ersätts)
3. SectionLabel-prefix → ett beslut (behålls per kategoriregeln?)
4. Truppvy/stats-ikoner → ett beslut
5. Tjänste-strängar (weeklyDecision, trainingType etc.) → ett beslut
6. Undantag (bekräfta EventCardInline + PortalQueueRail)

---

## DEL 2 — Verify-punkter (V1–V9)

### V1 — ANNIVERSARY_KLACK outcome-filter ❌ BUGG BEKRÄFTAD

```ts
// anniversaryKlackText.ts
export const ANNIVERSARY_KLACK: string[] = [
  ...WON_KLACK,   // inkl "VI MINNS GULDET"
  ...LOST_KLACK,  // inkl förlust-strängar
]

// matchCore.ts:1418–1420
} else if (input.anniversaryBigEko && supporterCtx && ANNIVERSARY_KLACK.length > 0 && rand() < 0.45) {
  commentaryText = ANNIVERSARY_KLACK[Math.floor(rand() * ANNIVERSARY_KLACK.length)]
```

`pickAnniversaryKlack(echo)` filtrar korrekt på `echo.outcome === 'won'/'lost'`. matchCore ignorerar denna funktion och plockar direkt ur den blandade poolen. "VI MINNS GULDET" kan rulla vid förlust-jubileum.

**Fix (Code gör utan vidare spec):**
```ts
// matchCore.ts rad ~1420, ersätt:
commentaryText = ANNIVERSARY_KLACK[Math.floor(rand() * ANNIVERSARY_KLACK.length)]
// med:
commentaryText = pickAnniversaryKlack(input.anniversaryBigEko)
```
`pickAnniversaryKlack` importeras redan i filen (rad 92). Inga nya imports behövs. Ska Code köra denna fix direkt?

---

### V2 — sundayTrainingScene roster-casting ❌ BEHÖVER OPUS-TEXT

```ts
// sundayTrainingScene.ts:25-58
{ name: 'Henriksson' } // första på is
{ name: 'Lindberg' }   // låg träningsvilja
{ name: 'Bergström' }  // sitter på läktaren
// + val-etiketter + relationseffekter mot dessa spelare
```

Fiktiva spelare som aldrig finns i truppen. Spec behövs: rollerna (första-på-is/telefon/frysen/skytt) ska castas från truppen med {efternamn}-interpolation. Opus levererar ny text efter att casting-logiken är definierad.

**Code inväntar Opus-spec och text.**

---

### V3 — UTF-8-felet i matchCommentary ✅ KLAR

```
matchCommentary.ts:24: "det räcker inte — kontringen är ute på isen."
```
Korrekt UTF-8. Redan fixad i text-commiten (DEL 1–4). KLAR.

---

### V4 — boardMeetingScene förväntnings-beat ❌ BEHÖVER OPUS-BESLUT

```ts
// boardMeetingScene.ts:70
body: `"Plats fem till åtta. Inget kvalspel.`
```

Hårdkodad förväntan. Scenen triggas säsong 2+ (`seasonSummaries.length > 0`). Förväntningen borde läsas från `game.objectives` eller `club.boardExpectation`. 

`shouldTriggerBoardMeeting` (boardMeetingScene.ts:88) kontrollerar att `game.seasonSummaries.length > 0` = triggrar för säsong 2+. Beats-texten är statisk.

**Fråga:** ska förväntnings-beatet vara dynamiskt (läsa från boardExpectation) eller är "Plats fem till åtta" acceptabelt som ett "generellt mittfält"-scenario? Kod-bugg, inte text-bugg. Opus bestämmer approach.

---

### V5 — Kaptenstalets trigger ✅ KLAR

Triggern i `postAdvanceEvents.ts` = `recentResults.slice(0, 3).every(isLoss)` = ≥3 raka förluster.  
CAPTAIN_SPEECH_VARIANTS: alla 5 varianter avslutar nu "Förlusterna har börjat stapla sig." (ej "Laget har förlorat tre raka.").  
Committat i `2ff5860`. KLAR.

---

### V6 — Dubbla vädersystem ℹ️ BÅDA KONSUMERADE

Två separata system, båda aktiva:

**System 1** (`weather_*` i matchCommentary.ts):
Används av `matchCore.ts` för specifika event-kommentarer (mål i snö, miss i dimma):
- `weather_goal_heavySnow`, `weather_goal_thaw` vid målcelebration i väder
- `weather_miss_heavySnow`, `weather_miss_thaw`, `weather_miss_fog` vid miss i väder
- `weather_heavySnow/thaw/cold/fog/clear` för allmän väder-situation

**System 2** (`weatherX` i matchCommentary.ts):
Används av `matchUtils.ts:218` `pickWeatherCommentary()`:
- `weatherCold`, `weatherSnow`, `weatherMild`, `weatherFog`, `weatherGood`

Inget dött code. Systemen tjänar olika syften (event-specifik vs situationell). Rapporteras för Opus-dokumentation — ingen fix behövs, men kanske värt en kommentar i koden om varför två system finns.

---

### V7 — kickoff-poolens hemma-antagande ℹ️ TROLIGEN KORREKT

`templateVars.team = attackingTeam` (matchCore:1356). Vid kickoff (minut 0) = hemmalaget tar nedsläpp i bandy per konvention. Kickoff-strängen "{team} tar emot på hemmaplan" förutsätter team = hemmalag.

`cup_final_kickoff:396` — "Avslag. Bollnäs. En match. Inget omspel." Bollnäs = cupfinalens faktiska arrangemangsort, inte en klubb-referens. Korrekt per varumärkesprincipen.

**Status: troligen korrekt.** Tekniskt fragilt om `attackingTeam` vid minut 0 inte alltid är hemmalaget — men det borde vara det per match-motor-logiken. Rapporteras som lågrisk, ingen fix föreslagen.

---

### V8 — Minut-ordinaler ℹ️ LÅGPRIO, HJÄLPAREN EXISTERAR

`{minute}:e` i:
```
src/domain/data/scenes/smFinalVictoryScene.ts:18
  "{playerName} satte avgörande målet i {minute}:e."
src/domain/data/scenes/cupFinalVictoryScene.ts:17
  "{playerName} satte avgörande målet i {minute}:e."
```

`ordinal()` existerar i `seasonSummaryService.ts:231` men är inte exporterad (lokal funktion).

I praktiken: "i 37:e" är korrekt svensk sportssvenska. Kantfallet är "i 1:e" vs "i 1:a" (genus). Lågrisk. Fix kräver att ordinal() extraheras till en util-fil och importeras i useSMFinalData/useCupFinalData.

**Förslag:** Flytta `ordinal()` till `src/domain/utils/formatters.ts`. Uppdatera renders i useSMFinalData och useCupFinalData: `.replace('{minute}', ordinal(minute))`. Lågprio — Code kan göra utan ny Opus-runda.

---

### V9 — `--disabled-opacity` ❌ BARA TOKENEN DEFINIERAD

```css
/* global.css:69 */
--disabled-opacity: 0.4;
```

**Wired någonstans?** Nej. `OrtenTab.tsx:444,453,462` har tre buttons med `opacity: inviteCooldown > 0 ? 0.5 : 1` (hårdkodat 0.5, inte `var(--disabled-opacity)`) trots att token nu är definierad.

Token är definierad men INTE konsumerad. Mekanismen tillhör **#8 (delade primitiver)** — räknas inte som klar. Detta bekräftar att #8 måste köra disabled-mekanismen systemiskt (OrtenTab + alla andra disabled-knappar → `var(--disabled-opacity)`).

---

## Sammanfattning för Opus

| | Punkt | Status |
|---|---|---|
| G1 | 7 segerpoäng-fel i post_match-citat | Mekanisk fix, inväntar OK |
| G1 | 6 RF-avdragspoäng-träffar | Opus dömer: behåll eller byt? |
| G2 | Fel sport (period/etc) | RENT ✅ |
| G3 | 7 världsbygge-hallen-buggar | Opus dömer + levererar text |
| G4 | Tidsbuggar | RENT ✅ |
| G5 | F2-siffror | RENT ✅ (inga nya) |
| G6 | F2-namn | RENT (sundayTrainingScene = V2) |
| G7 | Journalist-kön (efterklangText) | Fix: 2 strängar, Opus levererar |
| G7 | boardMeetingCopy ordföranden | Opus dömer |
| G7 | coffeeRoomService kassörens kön | Opus dömer |
| G8 | 🏒 repo-grep | Handlingsplan behövs per kategori |
| V1 | ANNIVERSARY_KLACK bugg | Code fixar om Opus säger go |
| V2 | sundayTrainingScene cast | Opus-spec + text krävs |
| V3 | UTF-8-felet | KLAR ✅ |
| V4 | boardMeetingScene förväntan | Opus beslutar approach |
| V5 | Kaptenstals trigger | KLAR ✅ |
| V6 | Dubbla vädersystem | Dokumenteras, ingen fix |
| V7 | kickoff hemma-antagande | Troligen OK, lågprio |
| V8 | Minut-ordinaler | Lågprio, Code fixar om OK |
| V9 | `--disabled-opacity` | Väntar på #8 |

**Code inväntar Opus-dom på:** G1 (RF), G3 (text), G7 (journalist/kassör/ordförande), G8 (handlingsplan per kategori), V1 (go/no-go), V2 (spec+text), V4 (approach).

— Code, 2026-06-12
