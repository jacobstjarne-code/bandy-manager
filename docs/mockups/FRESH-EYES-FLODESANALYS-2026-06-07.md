# FRESH-EYES FLÖDESANALYS — Bandy Manager

**Av:** Design-Claude (fresh-eyes-förgranskning, ej ersättning för Opus)
**Datum:** 2026-06-07
**Vad detta är:** En bred genomläsning av spelets flöde och logiska luckor, läst ur koden. **Förgranskning som matar Opus** — inte ett speldesign-utlåtande. Varje fynd är märkt:
- 🔍 **OBSERVATION** — läsbart i kod, jag är säker det stämmer mekaniskt
- 💭 **HYPOTES** — kräver Jacobs playtest för att bekräfta, jag kan ha fel
- ❓ **FRÅGA** — jag förstår inte nog för att bedöma, Opus avgör

Jag har aldrig spelat spelet. Den blinda fläcken gäller hela dokumentet.

---

## A · ROND-LOOPEN (Förbered → Spela → Granska)

### A1 · 🔍 Loopen är mekaniskt sluten — men feedback-tajmingen splittras
`advance()` i `gameFlowActions` bygger en `RoundSummaryData` med matchresultat, skador, ekonomidelta, community-delta, anniversaries. Det är en *bra* feedback-payload. Men den landar i **Granska**, medan beslutens *konsekvenser* (mood, relation, fatigue) muteras i state utan att samlas i samma summary. Spelaren ser "vad hände i matchen" tydligt, men "vad mina val ledde till" är spritt över portalen nästa rond.

💭 **HYPOTES:** beslut→konsekvens-loopen känns lösare än match→resultat-loopen, just för att den ena har en summary-skärm och den andra inte. Det är samma synlighetsproblem vi jagat i UI — men här är det *strukturellt*: matchen har ett kvitto, besluten har inte (förrän Manager-kvitto C-SY1 #4 byggs). **Bekräfta i playtest: känns dina beslut "gratis"?**

### A2 · 🔍 Auto-advance-loopen döljer rond-räkning
`advance()` auto-looper genom omgångar där managed klubb saknar fixtur (cup-byes, post-elimination). Koden noterar själv att "omgång 1 re-appears confusingly" var en bugg de patchat. Det är fixat — men mönstret avslöjar en strukturell skörhet: **spelaren och systemet har olika uppfattning om "vilken omgång det är"** (matchday vs leagueRound vs displayRound — tre olika tal beräknas i samma funktion).

💭 **HYPOTES:** vid cup-veckor och slutspel kan spelaren tappa känslan av var i säsongen de är. Tre rond-tal som inte alltid stämmer = orienteringsförlust. **Kolla i playtest: vet du alltid vilken omgång det är, särskilt runt cup och slutspel?**

### A3 · ❓ Pre-match-momentet — finns det en anledning att bry sig om *just denna* match?
Arkiverade noteringar (2026-05-04) flaggar: "Spelaren klickar 'Spela omgång X' och hamnar direkt i matchen. Ingen 30-sekunders skärm som etablerar varför just denna match är värd uppmärksamhet." Jag kan inte se i koden att detta byggts sedan dess.

💭 **HYPOTES (stark):** detta är en av de större upplevelseluckorna. Varje match får samma vikt vid ingången — derby, bottenstrid och meningslös mittenmatch startar likadant. R3+/C-SD2-arbetet ger *portalen* eskalering, men *match-ingången* är fortfarande platt. En match förtjänar sin laddning innan avspark, inte bara i tabellen efteråt.

---

## B · SÄSONGSBÅGEN

### B1 · 🔍 Säsongen har en tydlig båge — men "mittfält utan dramatik" är en död zon
`seasonContextService` klassar säsongsläget: firstSeason / relegationFight / topRace / **midTable**. Tre av fyra har inneboende spänning. midTable har ingen — och C-SD2-arbetet bekräftade medvetet att ett mittenlag inte får upptakt-portal ("ingen falsk spänning"). Det är rätt beslut. Men det lämnar en fråga obesvarad:

💭 **HYPOTES:** vad *driver* en spelare som ligger 6:a utan slutspelschans och utan nedflyttningshot? Säsongsmålen (board objectives) borde bära det, men om de redan är uppfyllda eller omöjliga finns ett motivationshål i mitten av tabellen, mitten av säsongen. **Tålamodskortet (vardagsrytm-mocken) är delvis ett svar** — det ger det långsamma en scen när dramat saknas. Men det löser en lugn *vecka*, inte en hel meningslös *säsong*.

### B2 · 🔍 Säsongsövergången är välbyggd men beroende av en lång kedja
`handleSeasonEnd → SeasonSummary → BoardMeeting → Dashboard` + SeasonEndChoreographer (C-SD1) + anniversary-systemet. Många system möts här. C-SD1 löste ordningsbuggarna. Men:

❓ **FRÅGA:** vad är spelarens *mål* över flera säsonger? En enskild säsong har tabell + cup + slutspel. Men vad är den långa kroken — det som får dig att vilja spela säsong 5? Klubbminne/R5 bygger *minne* bakåt, men finns en *strävan* framåt? (Bygga klubben från bruksort till storklubb? Vinna allt? Det kanske finns i board-progression — jag ser det inte tydligt i koden.) Detta är Opus-territorium men värt att flagga: **lång-loopen är mindre synlig än rond- och säsongsloopen.**

---

## C · EKONOMI

### C1 · 🔍 Game-over-tröskeln är hård och ensam
`evaluateFinanceStatus`: healthy > −500k warning > −1M license-denial > −2M **game-over**. Det är en ren förlust-spiral-vakt. Men jag ser ingen *uppåt*-motsvarighet — ingen ekonomisk *ambition*, bara en avgrund att inte falla i.

💭 **HYPOTES:** ekonomin är defensiv (undvik konkurs) men inte aspirativ (bygg något). En bruksortsklubb som går från fattig till välmående är en stark båge — men om pengar bara är "undvik −2M" finns ingen glädje i att tjäna dem. **Kolla i playtest: känns det bra att ha en stark kassa, eller är pengar bara en bristvara man bevakar?**

### C2 · 🔍 Kassa-historiken rekonstrueras bakåt, finns inte som tidsserie
`deriveKassaHistory` noterar uttryckligen: "Ingen dedikerad tidsserie finns — vi rekonstruerar bakåt." Det fungerar för sparkline (Våg 4), men avslöjar att ekonomin **inte har minne** — den är ett saldo, inte en berättelse. Jämför klubbminnet som *har* minne.

💭 **HYPOTES:** "säsongen vi nästan gick under" eller "året sponsorn räddade oss" finns inte som ekonomisk minneshändelse. economicScar-typen i Efterklang antyder att det *borde* — men datat är tunt om kassan bara är ett tal. **Möjlig koppling: economicScar-eko behöver en ekonomisk MemoryEvent att referera, annars är det poetik utan förankring.**

---

## D · BESLUTSSYSTEMEN (tvärsnitt)

### D1 · 🔍 Många parallella beslutskällor, en gemensam budget — men olika synlighet
Weekly decision, away-trip, coffee-room, journalist, mecenat-dinner, CS-press, hall-debate, retirement, anniversary, annandags-val. Alla går (mer eller mindre) genom decision-budget + portal. F1/R1 byggde kö + fatigue. Men de har **väldigt olika vikt och synlighet** — en weekly decision och ett retirement-val ser nästan likadana ut i flödet trots vitt skild tyngd.

💭 **HYPOTES:** beslutens *betydelse* kommuniceras inte i deras *form*. Ett livsavgörande val (pensionera en legend) och ett trivialt (bidra till bussen) har samma kort-grammatik. Story-slot/round-character lyfter *vad som visas*, men inte *hur tungt det känns att välja*. **Detta är en gradering-lucka i beslutsformen, parallell till match-ingången (A3).**

### D2 · ❓ Vad händer med ett ignorerat beslut?
R1 fatigue mäter kö-åldring. Men jag ser inte tydligt: om ett beslut aldrig tas — expirerar det? Med vilken konsekvens? Eller ligger det för evigt? Fatigue-trycket stiger, men leder det till en *forcerad* upplösning eller bara mer warm-färg?

💭 **HYPOTES:** om beslut kan ignoreras utan slutkonsekvens är "fatigue" tandlös — den ser allvarlig ut men biter inte. R1-handoffen valde medvetet "mjuk" konsekvens (Jacobs princip). Men mjuk får inte betyda *ingen*. **Bekräfta: kan du strunta i allt och bara klicka Spela, eller tvingar systemet fram beslut till slut?**

---

## E · DE STÖRSTA LUCKORNA (sammanfattning, rangordnad)

| # | Lucka | Typ | Var |
|---|---|---|---|
| 1 | **Match-ingången är platt** — ingen anledning att bry sig om just denna match före avspark | 💭 stark hypotes | A3 |
| 2 | **Beslut har inget kvitto** — match→resultat-loopen är synlig, beslut→konsekvens är det inte | 🔍+💭 | A1, D1 |
| 3 | **Lång-loopen saknas/osynlig** — vad strävar man mot över säsonger? | ❓ | B2 |
| 4 | **Mittfält-säsongen är en motivationsöken** | 💭 | B1 |
| 5 | **Ekonomin är defensiv, inte aspirativ** — pengar är bristvara, inte byggsten | 💭 | C1, C2 |
| 6 | **Beslutsform graderar inte tyngd** — trivialt och livsavgörande ser lika ut | 💭 | D1 |
| 7 | **Rond-orientering vacklar** runt cup/slutspel (tre rond-tal) | 💭 | A2 |
| 8 | **Ignorerade beslut** — oklart om fatigue biter | ❓ | D2 |

---

## F · VAD JAG INTE KUNDE BEDÖMA (ärliga blinda fläckar)

- **Balans:** matchmotorn, ekonomins siffror, om en strategi dominerar — kräver simdata, inte kodläsning.
- **Är det kul:** loopen är sluten och systemen rika, men om det *känns* roligt över tre timmar avgör Jacob, inte jag.
- **Svårighetskurva:** ser inte hur svårt det är, eller om det blir lättare/svårare över säsonger.
- **Narrativ kvalitet:** texterna är Opus, jag bedömer struktur inte prosa.

---

## G · MIN STARKASTE REKOMMENDATION (om jag fick välja en sak att ge Opus)

**Match-ingången (A3) + beslutskvittot (A1/D1) är samma problem:** spelets två kärnhandlingar — att spela en match och att fatta ett beslut — saknar båda *inramning före* och *kvitto efter* i den grad matchresultatet har. Spelet är bra på att visa vad som *hände* (granska, resultat) men svagare på att ladda vad som *ska hända* (varför denna match, hur tungt detta val) och att kvittera vad mina *val* gav.

Det är en variant av synlighetsprincipen vi jagat i UI — men en nivå djupare: inte "syns systemet" utan "har handlingen en båge: laddning → handling → kvitto". Match-resultatet har den. Resten av spelet bara delvis.

**Det är min hypotes. Jacob spelar, Opus avgör.**

— Design-Claude, 2026-06-07
