# CODE-INSTRUKTION — LÅNGSPELSAUDIT (10 SÄSONGER)

**Datum:** 2026-08-17 · **Av:** Opus (chat)
**Underlag:** långspelsauditen, Västanfors 10 säsonger, spelad live mot `2539fb2`. Ligger i uppladdningen — läs den i sin helhet först.

**Rättelse innan något annat:** rykteskedjeutredningen jag beställde efter tvåsäsongsauditen är **avskriven**. Tio säsonger visar placering 1,1,1,3,2,1,2,1,3,3 och poäng 39→28. De två identiska säsongerna var slump, inte bevis. Ligan reagerar sportsligt. Bygg ingenting där, och notera i auditen att ordern drogs tillbaka på nytt underlag — inte att den glömdes.

---

## Vad som ÄR en byggorder, och vad som inte är

Fyra av punkterna nedan är avgränsade fixar. Två är arkitektur och har rapportera-först. Fyra saker i auditen är speldesign och ligger inte här alls.

Att blanda de tre kategorierna är hur ordrar blir ytliga. Auditens `.slice(-5)` är en rad; dess `MatchOutcomeContext` är en ombyggnad av en tjänst auditen själv kallar "en stor kombination av frågor, taggar, overrides och fallback". De ska inte behandlas likadant.

---

# DEL A — avgränsade fixar

## A1 · Karriärminnet kapas vid fem säsonger

`seasonEndProcessor.ts:1240` gör `.slice(-5)`. Efter tio säsonger fanns 2031/32–2035/36; år 1–5 var borta. Fem SM-guld och sju cuptitlar stod kvar som räknare, men åren de vanns fanns inte.

Det här är det enskilt värsta fyndet i auditen, och skälet är inte storleken. Bandy Manager är ett spel om att minnas — Krönikan, årsdagarna, `builtSeason`, hela historiematerialet. En produkt som raderar spelarens första fem år motsäger sin egen premiss.

**Bygg:** behåll en kompakt sammanfattning per säsong för hela karriären — säsong, placering, poängrad, titlar, ekonomi vid årets slut, narrativt ankare. Begränsa **detaljdata**, inte säsongsidentitet. Om listan behöver virtualiseras i UI är det en renderingsfråga, inte ett skäl att kasta data.

**Test:** spara och rendera vid 1, 5, 6, 10 och 20 säsonger. Assert att antalet sammanfattningar är lika med antalet spelade säsonger, inte kapat.

**Migration:** befintliga saves har redan tappat sina tidiga säsonger. Gissa inte bakåt — de åren är borta och ska förbli borta. Nya saves bär allt.

## A2 · Råa mallvariabler renderas

`{motståndare}` och `{resultat}` syntes bokstavligt efter semifinalförlust år 7 och finalsilver år 8. `AnslagOverlay.tsx:78–102` ersätter tokens bara när en `eliminatingSeries` hittas; annars lämnas mallen rå.

**Bygg två saker:**

Lös motståndare och resultat till en view model **när uttåget registreras**, lagra den med eventet. Ersättningen ska inte behöva leta i state vid renderingstillfället — det är därför den kan misslyckas.

Och en grind, samma princip som dubbelrenderingsgrinden: vid rendering, faila om `/\{[^}]+\}/` matchar i någon renderad textnod. Kör den över alla visuella scener. Det är billigare än att hitta nästa token i ett speltest.

## A3 · Finalbeats efter eliminering

Efter semifinaluttåg följde ändå "Finalen. Birger…". `playoffNarrativeService.ts:44–52` genererar en generell finalhändelse; ingenting kontrollerar att managerklubben fortfarande är finalist när eventet konsumeras.

**Bygg:** gatea finalevent på att klubben är aktuell finalist i bracketen vid konsumtionstillfället, inte vid genereringstillfället. Rensa köade slutspelsevent vid eliminering.

Detta är samma familj som H-02 i tvåsäsongsauditen (event som överlever rollover). Om du inte redan byggt H-02 — gör dem ihop, det är en rensningsregel och inte två.

## A4 · Byggflikens copy och lås

Två separata fel i samma yta.

`FacilityScreen.tsx:84–92` implementerar löpande bygge, `FacilityTree.tsx:231` säger "Betrakta · val görs i säsongsstarten". Löpande är avsikten — byt copy till "Ett bygge åt gången".

`facilityNodes.ts:162–168`: Akademi 3 kräver både `traningshall` och `akademi_2`, men låstexten visar inte hela mängden. Lista varje krav med uppfyllt/ej uppfyllt separat.

## A5 · Årsbokens styrelsemening

"2:a plats uppfyller styrelsens krav på att vinna ligan" (år 7). "Förstaplatsen överträffade alla förväntningar" när styrelsen förväntade sig ligaseger (år 8).

**Bygg:** härled meningen ur samma objective-resultat som påverkar `boardPatience`, inte ur placeringstier. Tabelltest över placering × mål × uppfyllt/misslyckat.

Detta är samma rot som styrelsemålens `growFanbase`-etikett i sluttestet: två källor beskriver samma sak och glider isär.

---

# DEL B — arkitektur, RAPPORTERA FÖRST

Bygg ingenting i B1 och B2 innan rapporten är läst och jag dömt.

## B1 · Kanonisk matchkontext för presskonferensen

**Symptomen:** straffsegrar rapporteras som "Oavgjort, vi tar en poäng". Cupfinal ger "Två viktiga poäng". Hemmakryss ger "En poäng på bortaplan". Clean-sheet-press efter 9–8. Icke-derbyfinal erbjuder derbyreplik.

**Varför detta inte är fem fixar:** varje symptom har sin egen felaktiga härledning ur `homeScore`/`awayScore` och sin egen saknade gate. Fixas de en och en får vi fem lappar och en sjätte symptom nästa svep.

**Rapportera, innan bygge:**

1. Hur många ställen i `pressConferenceService.ts` klassificerar matchutfall eller tävlingstyp självständigt? Lista dem.
2. `matchTypeAxes.ts` finns redan sedan Granska del 4 med `tävlingstyp | skede | plats`. Vad **saknas** i den för presskonferensens behov — faktisk vinnare efter förlängning/straffar, om ligapoäng finns, derby? Kan de tre axlarna utökas, eller behövs ett separat utfallsobjekt vid sidan av?
3. Vad är den minsta ändringen som gör att alla fem symptomen blir omöjliga snarare än lagade?

**Villkoret jag redan sätter:** det ska bli **en** kontextmodell, inte två. `matchTypeAxes` byggdes för sektionsvalet i Granska. Bygger vi ett parallellt `MatchOutcomeContext` har vi två sanningar om samma match, och det är precis den klass av fel vi jagat i tio dygn — `RoundSummaryScreen` mot `GranskaScreen`, `respondToIncomingBid` mot `resolveEvent`, `isNeutralVenue` som proxy för final.

## B2 · Narrativt minne över säsonger

**Symptomet:** "Finalen. Birger…" kom ordagrant år 5, 7, 8, 9 och 10. Helena/Folke-profilen återkom flera säsonger. Samma Tord-modal stoppade två semifinalomgångar i rad.

**Rotorsaken auditen anger:** event-ID:n är unika per säsong, inte per karaktärsbåge, och cooldown finns lokalt per källa men inte delat mellan scener, portalbeats och eventkö.

**Rapportera, innan bygge:**

1. Hur många oberoende cooldown-/dedupmekanismer finns i dag? Auditen säger "lokala system för vissa källor" — namnge dem.
2. Hur många distinkta narrativa event-typer finns totalt, och hur många av dem skulle behöva en `semanticKey`? Det talet avgör om detta är en dags arbete eller en veckas.
3. Kan `semanticKey` härledas maskinellt ur befintliga ID:n, eller kräver varje event ett manuellt beslut om vilken båge det tillhör?

**Det jag redan vet att jag vill:** ett delat minne med `semanticKey`, senaste visning (säsong + omgång), antal visningar, och hård flerårscooldown på pivotal beats. Men om svaret på fråga 2 är "trehundra event-typer" är ordningen en annan — då börjar vi med de pivotal ögonblicken och lämnar ambient beats orörda.

---

# DEL C — öppna designfynd, ägare Opus, skrivs härnäst

**Rättelse (2026-08-17):** rubriken "ligger INTE här" lästes tidigare som att de fyra fynden nedan var avfärdade eller "by design". De är det inte. Alla fyra är verkliga problem — och tre av dem (Framgångsekonomin, Dynasty state, Eventköns viktning) är tyngre än något i Del A. Skillnaden mot Del A är inte om det ska göras, bara vem som beslutar: Del A har ett självklart rätt svar och kan byggas direkt. De fyra nedan kräver ett produktval med flera giltiga svar — bygger Code dem väljer Code designen som ett sidoresultat av en implementation, inte av ett beslut.

**Ägare: Opus. Status: öppet, inte accepterat. Tidpunkt: härnäst i Opus egen kö — före allt annat Opus tar sig an, inte "senare".** Bygg dem inte, och föreslå dem inte som lappar:

**Framgångsekonomin.** 420 tkr → 11,0 mkr över tio säsonger, tio av tio år med ökande kassa, byggnoder på 80–380 tkr mot en kassa på tio miljoner. Pengar upphör att vara ett val runt år fem. Det är inte en siffra som ska justeras — det är att spelet saknar en andra akt för den som lyckas.

**Dynasty state.** Topp tre ger +15 eller +20 `boardPatience` och nollställer misslyckandesviten, så en klubb som alltid är topp tre kan aldrig ackumulera press. Motkraften saknas, inte svårighetsgraden.

**Burnout.** Kortet återkom varje säsong från år 2 utan att någon konsekvens följde. Antingen blir det uttryckligen atmosfäriskt, eller får det verklig effekt. Båda är giltiga; att låta ytan antyda något som mekaniken inte bär är inte.

**Eventköns viktning.** Fem event i finaluppladdningen, alla lika höga. `DecisionCard` gav rätt gemensam grammatik men ingen prioritering. Tre nivåer — ambient auto-loggas, normal batchas, pivotal blockerar — är riktningen, men den ska skrivas ordentligt.

**Sommaren** ligger redan hos Design (`DESIGN_UPPDRAG_SOMMAREN_2026-08-17.md`) och rör samma rytmfråga. Auditen bekräftar den från ett annat håll: burnout bärs oförändrad in i nästa säsong, och premiären är cupkvartsfinal med full kö.

---

## Ordning

A1 → A2 → A3 (+ H-02 om den inte är klar) → A4 → A5 → B1-rapport → B2-rapport.

A1 först eftersom varje spelad säsong under tiden är fem år som en framtida spelare tappar.

## Vad som inte ingår

`LOW`-fyndet om målrikedom: auditen säger själv att 95–73 år 10 var sundare än 147–99 år 2 och att detta inte bevisar att fördelningen är fel. Ingen balansändring utan seedmatris. H-03-grinden från tvåsäsongsauditen står kvar som beställd, oförändrad.

Språkfelen (`LOW`): samla dem i en lista till mig i stället för att fixa dem en och en. Jag skriver om raderna.

## Innan något markeras klart

Browser-verifiering enligt CLAUDE.md — och för A2:s grind, kör den över alla scener och rapportera antalet träffar. Om den hittar tokens vi inte kände till är det fyndet, inte grinden.
