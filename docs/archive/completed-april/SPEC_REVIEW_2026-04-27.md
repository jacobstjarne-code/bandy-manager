# SPEC-granskning — Bandy-Brain (Opus)

**Granskat:** 2026-04-27
**Granskare:** Bandy-Brain (Opus, samma instans som skrev specsen, distans efter färdigt utkast)
**Granskade dokument:**
- `SPEC_VADER.md` (V1 → V2 efter fixar)
- `SPEC_MATCHDAGAR.md` (V2 → V3 efter fixar)
- `KLUBBFAKTA.md` (V1)

**Granskningsmetod:** Återläs båda specs med distans + kodverifiering av nyckelpåståenden i scheduleGenerator.ts, cupService.ts, weatherService.ts, matchUtils.ts, seasonEndProcessor.ts, worldGenerator.ts.

---

## V3-status: blockerare och substantiella fixade

**Fixade efter Jacob-godkännande 2026-04-27:**
- ✅ V-1: Klimat-pollningsfönster synkat (243 dagar, 1 aug — 31 mars)
- ✅ V-2: Stöpis-detektering kastad till framtida sprint
- ✅ V-3: 3×30 period-skevhet specat som accepterad kosmetisk realism (§5.4)
- ✅ V-4: SMHI_STATIONS.md skapad för Erik
- ✅ V-5: Dimma-fördröjning specat (§5.5)
- ✅ M-1: CUP_AFTER_LEAGUE_ROUND tydliggörs i SPEC_MATCHDAGAR §8.2
- ✅ M-2: Konkret migrationsplan i SPEC_MATCHDAGAR §13 Risk 1
- ✅ M-3: Top 4 bye dokumenterat som B8
- ✅ M-4: Fast R1-datum för alla cup-finalister (§7.4 V3)
- ✅ M-5: Cup-matchvolym 1-4 dokumenterat som feature
- ✅ I-3: Sommarpaus verifierat passivt-hanterad

**Kvar (medvetet):**
- V-6: Encoding-bugg "10 ï¿½ï¿½r" rad 47 — kosmetiskt, Jacob fixar manuellt
- M-7: `isFinaldag` vs `isFinaldagen` — kosmetiskt, Code väljer en
- S-1, S-2, S-3: Inbox-events och commentary-triggers — implementeras i fas 3

**Status:** Specsen är implementeringsklara för Code Sprint 24 och 25.

---

## TL;DR (ursprunglig granskning, behållen för historik)

**Specsen är generellt solid och implementeringsklara.** 3 blockerande punkter, 6 substantiella förbättringspunkter, 4 mindre nits.

**Blockerare innan Code-handover:**
1. Klimat-pollningsfönstret är inkonsistent mellan specs
2. CUP_AFTER_LEAGUE_ROUND i scheduleGenerator missas i SPEC_MATCHDAGAR §8.2
3. Stöpis-detektering kräver SaveGame-state som inte är formellt specat

**Substantiellt:**
- 3×30-format har period-effekt-skevhet i matchEngine (kosmetiskt, accepterbart)
- Top 4 reputation-bye är en designval som bör explicitgranskas
- Cup-finalister vs övriga lag i R1-timing — rekommendation bör vara starkare
- Stations-mappning per klubb saknas i SPEC_VADER
- Cup-matchvolym för spelarens klubb varierar mycket (1-4 matcher) — UI-fråga
- Schemamigration vid sparfilsladdning är vag

**Nits:**
- Encoding-bugg "10 ��r" rad 47 SPEC_VADER (känt)
- §9.2 SPEC_MATCHDAGAR landslagspaus inte syncad med §6.3-mallen
- "isFinaldag" vs "isFinaldagen" — inkonsistens i fältnamn
- Annandagsbandy-exemplets timing (13:15) verifierad mot SAIK 25/26

---

## SPEC_VADER granskning

### V-1 [BLOCKERARE] Klimat-pollningsfönster är inkonsistent

**Problem:** SPEC_VADER §3.1 säger "±3 dagar runt ROUND_DATES, dygnsvärden". SPEC_MATCHDAGAR §9.3 säger "polla bredare fönster (158 dagar)". Bägge kan inte stämma.

**Rotorsak:** SPEC_VADER skrevs när ROUND_DATES var hårdkodade. När SPEC_MATCHDAGAR ändrade ROUND_DATES till RNG-genererade datum blev "±3 dagar runt ROUND_DATES" oprecis (vilka datum?). Vi antog "polla bredare" som lösning, men SPEC_VADER §3.1 uppdaterades inte.

**Fix:** Uppdatera SPEC_VADER §3.1 explicit:
> Polla PTHBV-dygnsvärden för **hela bandysäsongens period** per historisk säsong (1 augusti — 31 mars = ~243 dagar). Inkluderar både cup-period (aug-okt) och liga/slutspels-period (okt-mars). Per matchday-position hämtas datapunkter via filter mot beräknat datum för respektive matchday i den givna historiska säsongen.

**Påverkan:** Datavolym ökar något (243 dagar vs 158), men marginellt. Pythonscriptet blir simpel range-loop över hela perioden — faktiskt enklare än ±3-dagars-fönster.

---

### V-2 [BLOCKERARE] Stöpis-detektering kräver SaveGame-state-extension

**Problem:** SPEC_VADER §8.2 steg 3 säger:
```
weatherHistory: Record<string, Array<{matchDay, temp, condition, snowfall, rainfall}>>
```
men det är i en kommentar. Inget i `entities/SaveGame.ts` är specat att uppdateras. weatherService får ingen sådan input idag.

**Fix:**
1. Lägg till explicit `weatherHistory: WeatherHistoryEntry[]` på `SaveGame`
2. Uppdatera signaturen för `generateMatchWeather()` att ta `recentWeather: WeatherHistoryEntry[]` parameter
3. Uppdatera roundProcessor.ts att uppdatera `game.weatherHistory` efter varje matchgenerering (rolling window, max 30 senaste matchdays per klubb)

**Påverkan:** Kräver edit i SaveGame entity + roundProcessor + weatherService. Borde flaggas som separata sub-uppgifter i fas 3 av SPEC_VADER (matchformat & cancelled), inte fas 1.

**Alternativ förenkling:** Kasta stöpis-detektering till framtida sprint, behåll bara grundläggande Thaw-condition. Stöpis är "bandynörd-feature", inte kritisk för MVP.

---

### V-3 [SUBSTANTIELLT] 3×30-format vs hårdkodade speltidsperioder

**Problem:** Matchengine använder `GOAL_TIMING_BY_PERIOD` och `SUSP_TIMING_BY_PERIOD` med 9 perioder à 10 minuter — mappade till 2×45-formatet. För 3×30-format (samma 90 minuter total) hamnar:
- Halvtidsjakt-effekten (40-50 min) på FEL plats — period 2-3-övergång ligger på 60 min, inte 45 min
- Slutryckningen på 80-90 min är OK (samma final-period)
- Pauserna ligger på 30 + 60 min, inte 45 min

**Frekvens:** 3×30 triggas vid temp -17 till -22°C. Karlsborg och Lesjöfors har detta ~5-10% av matcher. Övriga klubbar <2%.

**Beslut:** Acceptera period-skevhet för 3×30-matcher som "kosmetisk realism". Inga halvtidsjakt-mål 30-min in i en 3×30-match är inte en deal-breaker.

**Alternativ:** Bygg om matchEngine för att stödja variabla periodlängder. Stort arbete, troligen inte värt det.

**Fix i specen:** Lägg till §5.4 "Implementation av 3×30 i matchEngine":
> 3×30-formatet använder samma matchEngine-pipeline som 2×45 — bara perioduppdelningen skiljer (3 perioder à 30 min istället för 2 à 45). Empiriska timing-vikter behålls oförändrade men appliceras på samma 90-minutersbas. Detta innebär att halvtids- och slutryckningseffekter får marginellt fel timing för 3×30-matcher (få per säsong), vilket bedöms som acceptabel kosmetisk skevhet.

---

### V-4 [SUBSTANTIELLT] Stations-mappning per klubb saknas

**Problem:** SPEC_VADER §6.1 specar `smhiStationId` i ClimateProfile, men ingen lista över vilka SMHI-stationer som ska användas för respektive klubb finns. Erik kommer att behöva research:a det.

**Påverkan på Erik-paketet:** Han behöver veta:
1. Vilka SMHI-stationer som har data för 2015-2025
2. Vilka som ligger närmast varje av de 12 ortsna
3. Vilka som har de parametrar vi behöver (temp, nederbörd, vind, sikt)

**Fix:** Lägg till `docs/SMHI_STATIONS.md` med rekommenderad station per klubb:

| Klubb | Ort | Föreslagen SMHI-station | Station-ID |
|---|---|---|---|
| Forsbacka | Forsbacka | Sandviken (eller Gävle/Bro) | TBD av Erik |
| Söderfors | Söderfors | Tierp (eller Uppsala) | TBD |
| Karlsborg | Karlsborg-Kalix | Kalix-Karlsborg | TBD |
| ... | ... | ... | ... |

Detta blir Eriks första uppgift i Python-skriptet — verifiera vilka station-IDs som returnerar data för 2015-2025 och välja primär per klubb.

---

### V-5 [SUBSTANTIELLT] Uppskjutna matcher (dimma 45 min) saknar game-state-impact

**Problem:** SPEC_VADER §5 säger "Tät dimma vid matchstart → Uppskjut 45 min, sedan inställd om sikten inte förbättras". Hur hanteras detta i game-state?

**Möjligheter:**
1. Match flyttas inom samma dag (matchstart 19:45 istället för 19:00) — kosmetisk
2. Match flyttas till nästa dag (default: nästa "bandydag")
3. Match flaggas som "started_late" men spelas samma dag

Inget av detta är specat. För enkelhet rekommenderar jag (1) — kosmetisk. Match spelas samma dag, bara med inbox-event "Matchen startade 45 min senare pga dimma."

**Fix:** Lägg till §5.5 i SPEC_VADER:
> 45-minuters dimma-fördröjning hanteras kosmetiskt — match spelas samma dag med inbox-event om fördröjningen. Ingen schemaändring, ingen rescheduling. Om dimman inte förbättras → `cancelReason: 'fog'` och full rescheduling enligt §6.3.

---

### V-6 [NIT] Encoding-bugg

Rad 47: `10 ��r` ska vara `10 år`. Känt sen tidigare. Jacob kan fixa manuellt.

---

## SPEC_MATCHDAGAR granskning

### M-1 [BLOCKERARE] CUP_AFTER_LEAGUE_ROUND i scheduleGenerator missas

**Problem:** SPEC_MATCHDAGAR §8.2 säger:
> Endast `matchday`-värdena som de [cupService] sätter behöver mappas till de nya cup-matchday-positionerna (1-4).

Detta är fel/ofullständigt. Den faktiska cup-infogningen sker i `scheduleGenerator.buildSeasonCalendar()` via `CUP_AFTER_LEAGUE_ROUND`-konstanten + `+3 dagar`-logiken. cupService.CUP_MATCHDAYS är bara en duplicerad pekarkonstant.

**Verifierat fynd:** I `scheduleGenerator.ts` rad 73-78:
```typescript
const CUP_AFTER_LEAGUE_ROUND: Record<number, number> = {
  2: 1,   // Cup förstarunda after liga omg 2 → matchday 3
  6: 2,   // Cup kvartsfinal after liga omg 6 → matchday 8
  10: 3,  // Cup semifinal after liga omg 10 → matchday 13
  15: 4,  // Cup final after liga omg 15 → matchday 19
}
```

Denna konstant + buildSeasonCalendar-loopen är där cup-rundor skjuts in **mellan** ligaomgångar.

**Fix:** Uppdatera SPEC_MATCHDAGAR §8.2 till:
> **Steg 1:** Ta bort `CUP_AFTER_LEAGUE_ROUND` och cup-loopens "+3 dagar"-logik i `scheduleGenerator.buildSeasonCalendar()`. Ersätt med ny generation som först skapar cup-matchdays (1-4) i augusti-september + finalhelg, sedan ligamatchdays (5-26).
>
> **Steg 2:** Uppdatera cupService.CUP_MATCHDAYS till nya värden (1, 2, 3, 4).
>
> Båda konstanterna måste hållas i synk — de är duplicerade per design och ändras tillsammans.

**Påverkan:** Mer omfattande edit i scheduleGenerator än vad §8.2 antydde. Tidsuppskattningen i §10 (fas 2: 1 dag Code) håller fortfarande, men Code måste veta om båda ändringspunkterna.

---

### M-2 [BLOCKERARE] Schemamigration vid sparfilsladdning är vag

**Problem:** SPEC_MATCHDAGAR §14 risk 1:
> Mitigering: Migration-version-tag i SaveGame. Vid laddning av äldre format, regenerera schedule från sparad seed med ny algoritm.

Detta antar att SaveGame **sparar season-seed**. Verifiera om det är så.

**Fynd:** `seasonEndProcessor.ts` använder `seed` som parameter och `mulberry32(seed ?? game.currentSeason * 12345)` — så ett deterministiskt seed kan **härledas från currentSeason** även om det inte explicit sparas. För befintliga sparfiler kan vi använda `currentSeason` som seed för ny schedule-generering.

**Fix:** Lägg till §15 i SPEC_MATCHDAGAR med konkret migrationsplan:
> Vid laddning av sparfil från pre-fix-version:
> 1. Detektera via SaveGame-version-tag (om <12 → pre-fix)
> 2. Regenerera schedule + cup-fixtures för nuvarande och resterande säsonger med ny algoritm, seed = `game.currentSeason`
> 3. Pågående säsongs spelade matcher (status=Completed) behålls med sina sparade fixture-IDs
> 4. Inbox-events historik lämnas oförändrad
> 5. Sätt nytt SaveGame-version-tag (12)
>
> Risken är att fixture-IDs ändras → matchhistorik från pågående säsong kan bryta UI-visning. Workaround: behåll Completed-fixtures + omgenerera bara framtida fixtures.

---

### M-3 [SUBSTANTIELLT] Top 4 reputation-bye = 1/3 av lagen automatisk fortskott

**Problem:** Behåll-knockout-beslutet betyder att top 4 efter reputation får bye till kvartsfinal. Med 12 lag innebär det att 4/12 (33%) hoppar över förstarundan. Spelarens klubb hamnar typiskt mid-low reputation tidigt i karriären — innebär att spelaren **alltid** spelar förstarundan, medan AI-elitklubbarna inte gör det.

**Designkonsekvens:** Bias mot etablerade klubbar. Karaktärsdrag, men kanske inte vad vi vill.

**Alternativ:**
1. **Behåll top 4 bye** — verklighetstroget för "seedade lag", kapacitet för stora klubbar
2. **Top 2 bye** — bara två hoppar över, mer rättvist mot uppstickare
3. **Slumpa byes** — 4 random lag får bye varje säsong, oavsett reputation
4. **Inga byes** — alla 12 spelar förstarundan (6 matcher istället för 4), kvartsfinal har 6 lag (kräver bracket-justering)

**Rekommendation:** Behåll alt 1. Det är vad cupService gör nu, ingen kod-ändring. Realistiskt — i verkligheten är gruppspels-"seeding" baserad på rankning.

**Fix i specen:** Lägg till §11 i Beslutade scope-frågor:
> **B8: Top 4 bye-systemet i cupen** | Behåll | Stora klubbar prioriteras, realistiskt

---

### M-4 [SUBSTANTIELLT] Cup-finalist R1-timing — svag rekommendation

**Problem:** §7.4 ger två alternativ utan klar rekommendation:
> **Föreslås:** Lag som spelade cup-final får sin första ligamatch (R1) schemalagd `+3 dagar` jämfört med övriga lag.
>
> **Alternativt:** Behåll fast R1-datum för alla. Cup-finalisterna får träna med tröttare ben.

**Rekommendation:** Alt 2 — behåll fast R1-datum för alla. Skäl:
1. Skiljer 1-2 dagars vila är inte mätbart trötthetsmässigt
2. Asymmetriska scheman bryter "alla möts samma matchday"-logik
3. Spelet blir mer komplicerat utan motsvarande förhöjt djup

**Fix:** Ersätt §7.4 med:
> Cup-finalisterna får 5-6 dagars vila innan första ligamatch — tillräckligt. Inga schemajusteringar för cup-deltagande. Matchengine kan eventuellt få en `tirednessModifier: 1.05` för cup-finalister i deras R1-match som kosmetisk effekt.

---

### M-5 [SUBSTANTIELLT] Cup-matchvolym för spelaren varierar 1-4 matcher

**Problem:** Med knockout-format spelar spelarens klubb:
- 1 match om de förlorar förstarundan (top 8 lag)
- 0 matcher om de har bye + förlorar kvartsfinal (knockout efter bye)
- Wait — om man har bye spelar man kvartsfinal, så minst 1 match
- 1-4 matcher beroende på hur långt man når

För spelarens första säsong, om de hamnar i top 4-bye + tappar kvartsfinal direkt = bara 1 cup-match hela säsongen. Det är **väldigt** glest för en "försäsongsturnering".

**Fråga:** Är det OK att spelarens klubb ibland har bara 1 cup-match? Eller ska vi garantera minst N matcher?

**Möjligheter:**
1. **Acceptera glesheten** — vissa säsonger har klubben bara 1 cup-match. Ger "snabbare till liga"-känsla för dom åren
2. **Vänskapsmatcher som filler** — schemalägg automatiskt 2-3 vänskapsmatcher om cupen blir kort. Detta är B5 (senare-sprint-beslut).
3. **Garantera minst 3 matcher** — öka antalet cup-rundor eller tillåt loserbracket

**Rekommendation:** Acceptera glesheten i denna sprint. Spelaren får "snabb-till-liga"-säsonger ibland (när de tappar tidigt) och "lång cup-resa"-säsonger ibland (när de når final). Spelvariation är inte en bugg.

**Fix:** Lägg till anmärkning i §11 B7:
> Konsekvens: spelarens klubb spelar 1-4 cup-matcher per säsong beroende på hur långt de når. Ibland glest, ibland stort. Det är feature, inte bug.

---

### M-6 [SUBSTANTIELLT] Mall §6.3 inte synkad med §9.2 landslagspaus

**Problem:** §6.3 ger mall:
```
R6   (H)         lör/sön v.46                   Helgrunda
R7   (V, tis/fre) v.48                          Vardag (paus v.47 för landslag)
```

§9.2 säger:
> Lägg en obligatorisk paus mellan R6 och R7 (alltid ~2 veckor mellan dem)

Mellan R6 (v.46) och R7 (v.48) är **2 veckor** = 14 dagar. Stämmer.

Men för en **vardagsrunda v.48 tisdag** = ~16 dagar mellan R6-R7-tipoff. Och om R6 är **söndag v.46** vs **tisdag v.48** = 9 dagar (tisdag v.48 - söndag v.46 = ~9 dagar).

Mer konsistens: ange "minst 9 dagar mellan R6-tipoff och R7-tipoff" som regel, inte "ungefär 2 veckor".

**Fix:** Mindre — bara förtydliga §9.2.

---

### M-7 [NIT] isFinaldag vs isFinaldagen

§8.1 har `isFinaldag` (utan -en). §3.3 har "Bandyfinalen — SM-final" och hänvisning "isFinaldagen". Inkonsistens. Välj en. Förslag: `isFinaldag` (kortare, JS-standard).

---

### M-8 [NIT] Annandagsbandy-tipoff

§3.2 säger "Annandag jul: 13:15-17:00". Verifierat mot SAIK 25/26 — Hammarby spelar 13:15 nyårsafton enligt deras hemsida. Sirius 23/24 visar 13:15-17:00 för 26 dec. Realistiskt.

---

## Inkonsistenser mellan specs

### I-1 Pollningsfönster (BLOCKERARE)

Se V-1. SPEC_VADER §3.1 vs SPEC_MATCHDAGAR §9.3. Lös genom uppdatering av SPEC_VADER §3.1 till "hela säsongens period".

### I-2 Klimat-data omfattar cup-perioden

SPEC_VADER specar inte explicit att klimat-data ska samla in **augusti-september** också (för cup-matcher). SPEC_MATCHDAGAR §9.3 nämner det:
> Cup-data behöver också inkluderas i klimatpipelinen. Augusti-september-perioden (cup-rundor) ger temp-data för försäsongs-väder.

**Fix:** Spegla detta i SPEC_VADER §3.1 / §7 — klimat-data omfattar **augusti-mars** för att täcka både cup och liga.

### I-3 Sommarpaus inte formellt definierad

Båda specs antyder sommarpaus men ingen specar det formellt. seasonEndProcessor genererar nästa säsongs schedule direkt. preSeasonScreen finns med inbox-items daterade 15 september.

**Fynd från seasonEndProcessor.ts (verifierat):**
- `nextSeason = game.currentSeason + 1` direkt
- `generateSchedule(updatedClubs.map(c => c.id), nextSeason)` direkt
- `inbox_board_preseason_${nextSeason}` daterat `${nextSeason}-09-15`

Sommarpausen är "hopkopprad" — currentDate flyttar fram, inga matcher genereras. Ingen blocker.

**Fix:** Lägg till anmärkning i SPEC_MATCHDAGAR §8.3:
> Sommarpaus (mid-mars till mitten augusti) hanteras passivt via currentDate-framflyttning. Ingen formell game-state-period krävs. preSeasonScreen och inbox-items daterade `${nextSeason}-09-15` markerar säsongsstart.

---

## Saknade komponenter

### S-1 Cup-bye-feedback till spelaren

Om spelarens klubb är top 4 → automatisk bye. Spelaren bör få inbox-event:
> "Med er reputation som top 4-klubb hoppar ni över cupens förstarunda. Första cup-match är kvartsfinal v.36 mot [motståndare]."

Om spelarens klubb är 5-12 → spelar förstarundan:
> "Förstarundan i Svenska Cupen v.34. Hemma mot [motståndare]."

**Inte i specen.** Förslag: lägg till i SPEC_MATCHDAGAR fas 3 (specialdatum-events).

### S-2 Cup-finalisten får speciell behandling vid liga-start

Om spelarens klubb når cup-final → de får inbox-event efter cup-finalen:
> "Ni har spelat cup-final 5 oktober. Ligamatch börjar 5 dagar senare. Lineup-justering rekommenderas."

Smör. Lägg till.

### S-3 Klimat-data försäsongsperiod-commentary

SPEC_VADER §11 specar match-commentary triggers, men inte specifika triggers för **cup-perioden** (augusti-september). Cup spelas i **sensommar/höst** — svalare än maximalt sommarväder, men inte vinter.

Triggers:
- "Cup-finalen i strålande sensommarsol — andra världen mot ligadöden i februari"
- "Augusti-värmen testar isens tjocklek på Bastionen"
- "Slottsbron möter höstdimman över Vänern"

**Fix:** SPEC_VADER §11 utökas med cup-perioden-commentary.

---

## Sammanfattande rekommendationer för Code-handover

**Måste fixas i specerna innan Code-handover:**
1. V-1: Synca pollningsfönster (SPEC_VADER §3.1)
2. V-2: Specifiera weatherHistory på SaveGame (eller flytta stöpis till framtida sprint)
3. M-1: Tydliggör att CUP_AFTER_LEAGUE_ROUND i scheduleGenerator är primärkällan
4. M-2: Konkret migrationsplan för sparfiler

**Bör fixas men ej blockerare:**
5. V-3: Acceptera 3×30 period-skevhet (lägg till §5.4)
6. V-4: Skapa SMHI_STATIONS.md för Erik
7. V-5: Specifiera dimma-fördröjnings-hantering
8. M-3: Behåll top 4 bye, dokumentera som B8
9. M-4: Behåll fast R1-datum för cup-finalister
10. M-5: Acceptera 1-4 cup-matcher som feature

**Kan vänta:**
11. V-6, M-7: Encoding-bugg, fältnamn-konsistens
12. S-1, S-2, S-3: Inbox-events och commentary-triggers (fas 3)

**Tidsåtgång för spec-fixar:** ~30 min Opus.

**Efter spec-fixar:** Båda specs är implementeringsklara för Code Sprint 24 och 25. Erik kan börja parallellt på SMHI-skript när V-4 (SMHI_STATIONS.md) är klar.

---

## Slut SPEC-granskning
