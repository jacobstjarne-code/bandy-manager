# Åtgärdspass efter det separata nykarriärprovet

Datum: 2026-09-11. Underlag: `GRIND2_NYKARRIAR_LESJOFORS_2026-09-11.md` och Jacobs godkända åtgärdslista. Detta är en leverans- och verifieringsnot, inte en ny kanonisk statuslista; öppna poster finns i `docs/MASTER_OPPET.md`.

## Levererat

- **Burnout-minnet:** återfallsmarkören läser föregående verkliga terminala val ur liggaren för rätt manager. Ett nytt ärr denna säsong får inte skriva om minnet av det tidigare valet. Äldre saves utan tillräckligt belägg får neutral text. Poolindex och visningscooldown bevaras.
- **Matchfakta:** straffavgöranden räknas som verklig vinst/förlust; cup/slutspel använder inte ligapoäng eller ligatabell som felaktig förklaring. Senaste inbördes möte inkluderar slutspel. Hemma-/bortatext, bortaderbyeko, segermålsspråk och obelagd formationskommentar är rättade. Det felaktiga ordet ”skytteligget” är borta ur referatet.
- **Kalender och statistik:** januaribeatet kräver rätt januarifönster efter spelad annandag. Interaktivt hörnmål märks med den befintliga statistikens `isCornerGoal` och `origin: CORNER`.
- **Landslaget:** texten säger nu sanningsenligt VM-uttagning. Modellen innehåller inte den matchfrånvaro som den gamla texten utlovade. Ingen ny frånvaromekanik eller förändrad laguttagning har lagts till i detta pass.
- **Inkorgen:** ämnes- och röstintroduktion gäller även prioriterade och direkt inskrivna notiser när de passerar leveransredaktören. Namngivna mecenat-/patronproducenter skickar röstidentitet. ”Kräver svar” används för faktiskt öppna inkommande transferbud, inte som generell varningsetikett för skador, styrelsebesked eller skandalnyheter. Informationsbudgeten omfattar också dessa nyheter; verkliga öppna bud undantas fortsatt.
- **Uppskjutna berättelser:** nya köevent får ursprungstid, beröm får matchreferens och kort/Granska visar vad texten gäller. Maria-efterklangen använder bara färska minnen från aktuell säsong; äldre minnen finns kvar i relationshistoriken. Gamla saves utan ursprungstid får ingen påhittad datering. Halvsäsongsavstämningen får ett sant milstolpsankare.
- **Mecenatmiddagen/jakten:** portalens åtta slutkombinationer ersätts av ingången till den befintliga trefrågedialogen. Resolution sker vid slutet, inte vid ingången. Den hårdkodade Eklund-raden är borttagen.

Derbyekots identitet/cooldown landade redan i den parallella kodfixen `a36d60d4`. Detta pass återprovar den och rättar dessutom dess bortamatchtext; det gör inte anspråk på att ha byggt grundfixen.

## Verifiering

- Full testsvit: **5 137/5 137 tester**, **572 filer**, noll fel.
- Fullt releasebygge: TypeScript, produktionspaket och samtliga fem statiska grindar gröna. Befintlig varning om stor paketfil kvarstår; ingen gräns har flyttats.
- Riktat slutprov: **86/86 tester** över de kompletterade berättelse-, efterklangs-, omgångs-, kaffeko- och middagskontrakten. Tidigare testfixturer som byggde på gammal efterklang eller saknade explicita introduktioner uppdaterades utan att deras faktiska skadeutfallsassertioner togs bort.
- Riktig separat browserflik på egen lokal origin: portalens ”Följ med” → intro → tre frågor och reaktioner → avslut. Dialogen försvann först efter ”Avsluta kvällen”. Komponenttestet verifierar dessutom exakt ett resolutionsanrop med det sammansatta slutvalet. Detta är flödeskontroll, inte en full visuell bildgranskning.
- `git diff --check`: rent.

### Checkpoints och exakta scenprov

Det återkörbara verktyget `scripts/playtest-targeted-replay.ts` tar originalprovets evidenskatalog och en ny, ännu inte befintlig utdatakatalog. Det skriver inte över originalen.

Nio kontroller passerade:

1. Oförändrad checkpoint `00689-s2027-d5.json` ger det tidigare valet `stepped_back` och sann återfallstext.
2. De två reproducerade derbyekoparen hålls tillbaka med den nya visningsidentiteten. **Nya visningskvitton tillförs uttryckligen i provkopian**: det gamla kodpinnet skrev dem inte, så detta är inte belägg för att historiska saves redan innehöll dem.
3. Klackkonfliktens tre svar prövas i vardera av två säsongslägen, sex kontrollerade scenprov. Verklig tiforesolution och eventgenerator används, båda köerna förses avsiktligt med samma event, valet löses och saven laddas om. Exakt ett valkvitto, inga kvarvarande kopior, ingen nygenerering vid ytterligare generatoranrop och ingen effekt av dubbelt resolutionsförsök.

Scenproven styr datum/omgång, introducerad röst och slumpkälla. De är **inte sex naturligt uppkomna händelser i en genomspelad karriär**. Tolv före-/eftersaves, `result.json` och SHA-256-manifest ligger lokalt i projektets `artifacts/bandy-grind2-rattningar-repro-2026-09-11-v2`. Sparfiler och privata provartefakter ingår inte i kodleveransen.

## Gränser och kvarstående arbete

- Inga kalibreringsvärden, matchsimuleringsodds, ekonomiska belöningar, taktikkostnader eller interaktionstimers ändrades. Hörnändringen gäller klassificering av ett redan inträffat mål.
- **Galans gestaltning är inte ombyggd.** Bedömningen från nykarriärprovet kvarstår: teknisk engångsresolution gör inte i sig galan till en minnesvärd scen. Nästa designbeslut bör vara ett kort sammanhållet förspel, val och reaktion/landning, utan nya belöningar eller balansändring. Detta är separat från den återställda middagsdialogen.
- **Inget nytt styrt tvåsäsongsprov utfördes i detta åtgärdspass.** Den separata nykarriärkörningens kompletterande återprovsrad förblir öppen. Riktade tester ersätter inte dess återstående sammanhängande logik- och känsloprov.
- Den parallella rapporten `GRIND_2_ATERPROV_2026-09-11.md` och dess arkiverade `sluttest-grind2` har en egen passdom. Den skrivs inte om här. Varken den domen eller dessa scenprov får ometikettera det äldre separata nykarriärprovets observerade derbybrott till ett rent prov.

Användarens ordinarie browserflik och save har inte använts eller ändrats av återproven. Orelaterade porträtt- och klubbfaktaändringar lämnas utanför leveransen.
