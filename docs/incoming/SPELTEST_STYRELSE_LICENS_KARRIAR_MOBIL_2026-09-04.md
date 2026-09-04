# Speltest: styrelse, licens och karriärkonsekvenser

**Testbas:** lokal app på HEAD `5db04f75`, med det aktuella ocommittade arbetsträdet ovanpå. Det här är alltså ett test av den lokala arbetsversionen, inte av live-deployen. Live visade `7a6e8d1` och användes inte för slutsatserna. Arbetsversionen var inte en fryst checkpoint: utvecklingsservern laddade om flera ändrade filer under sessionen. Varje fynd nedan reproducerades i den UI-version som var laddad när fyndet noterades, men rapporten ska inte användas som bevis för att en enskild commit ensam innehåller samtliga fel.

**Viewport:** 390 × 844.

**Karriär:** Slottsbron, SVÅR, manager Styrelsetest. Två hela säsonger samt sommarinträdet till säsong tre.

## Kort dom

Kärnan fungerar bättre än i de gamla nedsidetesten: en svår klubb kan börja uselt, återhämta sig utan fusk och överträffa styrelsens krav. Jag blev inte sparkad, och inget i dessa två säsonger tydde på ett godtyckligt avsked. Slottsbron gick från 10:e plats till 5:e plats och semifinal, samtidigt som ekonomin stod nästan still.

Det största problemet i detta svep är inte avskedsformeln utan att flera system fortfarande presenterar parallella sanningar utan en gemensam redaktör. Burnout kan lägga ett vanligt lättnadsval bakom ett irreversibelt takval. Granska kan lova en match efter att laget slagits ut. Årsboken kan kalla licensnämndens status för spelarens val och återge samma burnout-handling tre gånger. Händelseliggaren minns nu mycket, men ytorna behöver fortfarande välja och rangordna vad minnet betyder.

## Förlopp som faktiskt observerades

### Säsong 2026/27

- Cup: utslagen i första rundan.
- Liga: 10:e, 18 poäng, 4–10–8.
- Ekonomi: 320 tkr → 342 tkr.
- Styrelsen visades som **Stabilt — Styrelsen har inget att invända** även sent på säsongen.
- Årsboken bedömde tiondeplatsen som vad styrelsen väntade sig, men lade samtidigt till: **Ett uppdrag hängde löst ända in i mars.**

### Säsong 2027/28

- Cup: kvartsfinal, förlust 2–7 mot Västanfors.
- Liga: start 0–1–4 och 12:e plats; sedan fyra raka segrar och slutligen 5:e plats, 22 poäng, 9–4–9.
- Slutspel: slog Målilla 3–2 i matcher efter 4–3 borta i avgörandet. Förlorade semifinalen 0–3 mot Västanfors: 2–6, 4–10, 5–7.
- Ekonomi: 342 tkr → 324 tkr.
- Årsboken valde det irreversibla burnout-beslutet som säsongens viktigaste: **Du klev tillbaka en period när det tog för hårt. Första gången du valde dig själv.** Det var också det beslut jag själv mindes bäst.

### Sommar 2028

- Styrelsen behöll nivån **Överleva** och målen **Undvik nedflyttning** samt **Håll ekonomin i balans**.
- Åtta kontrakt löpte ut utan förlängning.
- Fem kvarvarande spelare ställde samlade lönekrav.
- Årsboken visade licensstatusen **Ekonomin är ansträngd**. En handlingsplan skapades i koden för den kommande säsongen, men jag hann inte verifiera dess faktiska valkort innan teststoppet.

## Fynd

### HIGH 1 — Burnout-takval och vanligt burnout-val kan köas samtidigt

**Reproduktion**

1. Driv burnout till taket under säsong två.
2. Nå det irreversibla kortet och välj **Kliv tillbaka en period**.
3. Gå vidare till nästa slutspelsmatch.

**Expected**

Takvalet ersätter eller konsumerar samma episodens vanliga lättnadsval. Nästa beat ska handla om den valda återhämtningen, inte fråga på nytt hur pressen ska hanteras.

**Actual**

Direkt nästa match visades återfallskortet igen: **Du känner igen bläddrandet...** med valen **Låt assistenten ta pressen / Sänk tempot på träningen / Be styrelsen om andrum**. Det irreversibla valet kändes därför inte som en faktisk brytpunkt. Det kvarvarande kortet behövde dessutom lösas vid säsongsslutet.

**Sannolik rotorsak**

`src/application/useCases/processors/eventProcessor.ts` genererar först `burnoutRelief` och därefter `burnoutCeiling` med två oberoende villkor. Det finns ingen ömsesidig uteslutning när takhändelsen kvalificerar. `burnoutCeilingChoiceOffered` hindrar bara ännu ett takkort; den rensar inte ett vanligt lättnadskort som redan skapats samma omgång.

**Rekommenderad fix**

Gör takhändelsen dominant i samma episod. Beräkna taktriggern först och generera inte `burnoutRelief` när `burnoutCeiling` kvalificerar. Som defensivt skydd bör resolution av takvalet även ta bort ett olöst `burnoutRelief` med samma season/matchday eller episod-id.

**Regressionstest**

- Burnout vid taket: exakt ett olöst burnout-event efter eventprocessorn, och det är `burnoutCeiling`.
- `step_back`: nästa portal innehåller inget äldre `burnoutRelief` från samma episod.
- Ny eskalering efter avslutad återhämtning kan fortfarande skapa ett verkligt återfall.

### HIGH 2 — Granska lovar nästa match efter att semifinalserien är förlorad

**Reproduktion**

1. Förlora en avgörande slutspelsserie.
2. Öppna Granska efter den sista matchen.

**Expected**

Ingen framåtpekare till ännu en match mot samma motståndare. Sidan ska avsluta serien och peka mot säsongsavslutningen.

**Actual**

Efter 0–3 i semifinalserien visades **Sen väntar Västanfors hemma. Formstarka just nu — det blir en mätare.** På samma sida stod korrekt att Slottsbron var en match från SM-final men utslaget.

**Sannolik rotorsak**

`src/presentation/screens/granska/GranskaOversikt.tsx` gör en egen fixture-sökning med `status !== 'completed'`. Den inkluderar därmed inställda rester i en avgjord serie och saknar elimineringsgaten. Den kanoniska `getNextManagedFixture()` i `src/domain/services/portal/triggers/matchTriggers.ts` har redan elimineringslogik, men används inte här.

**Rekommenderad fix**

Byt Granskas lokala sökning mot `getNextManagedFixture(game)` och returnera ingen pekare när hjälparen ger `null`. Lägg test för utslagen kvart-/semifinalist med kvarvarande `cancelled` fixtures.

### MEDIUM 3 — Slutspelskontexten försvinner ur headern på uttågsmatchen

**Reproduktion**

1. Förlora sista semifinalmatchen.
2. Öppna Granska.

**Expected**

Headern behåller **Semifinal · match 3** medan just den matchen granskas.

**Actual**

Headern föll tillbaka till **Omg 22**.

**Sannolik rotorsak**

`src/presentation/components/GameHeader.tsx` beräknar `reviewedPlayoffFixture`, men använder den bara inne i `if (isInPlayoff)`. `isInPlayoffBracket()` blir falsk så fort bracketen är `Completed`, alltså exakt efter uttågsmatchen.

**Rekommenderad fix**

Låt en verifierad `reviewedPlayoffFixture` vinna över bracketens aktuella status. Den granskade matchens identitet är historisk och ska inte försvinna när turneringens state går vidare.

### MEDIUM 4 — Årsbokens “Dina val” innehåller ett systembesked, inte ett val

**Reproduktion**

1. Avsluta en säsong där licensstatusen inte är `clear`.
2. Läs årsboken.

**Expected**

**Dina val** innehåller bara handlingar spelaren faktiskt valde. Licensstatus hör hemma under ekonomi/licens eller som konsekvens.

**Actual**

Den enda raden under **Dina val** var **Licensnämnden: Ekonomin är ansträngd.** Jag hade inte fattat ett licensbeslut.

**Sannolik rotorsak**

`src/domain/services/seasonDecisionsService.ts:77–83` lägger alltid till `game.licenseStatus` i `collectSeasonDecisions()`. Funktionen och rubriken lovar beslut, men denna gren samlar ett tillstånd.

**Rekommenderad fix**

Ta bort licensstatus från `collectSeasonDecisions`. Visa den i en separat konsekvens-/licensrad. Om ett handlingsplansval har fattats kan just det spelarvalet hämtas ur ledgern med `madeByPlayer: true` och visas här.

### MEDIUM 5 — Årsbokens managersektion återger rå ledger i stället för en säsongsberättelse

**Reproduktion**

1. Välj **Låt assistenten ta pressen** flera gånger under samma säsong.
2. Läs **Din säsong som tränare**.

**Expected**

Sektionen komprimerar samma återkommande handling till ett förlopp eller väljer första/sista betydelsefulla förekomsten.

**Actual**

Meningen **Du lät assistenten ta pressen.** förekom tre gånger i samma kort. Mellan dem låg andra viktiga beats. Minnet var sant men oredigerat och därför mindre meningsfullt.

**Sannolik rotorsak**

`getBurnoutSeasonMemory()` i `src/domain/services/burnoutReliefService.ts` projicerar varje `decision` med semantic key `burnoutRelief:*` till en egen dagboksrad. `generateSeasonSummary()` i `src/domain/services/seasonSummaryService.ts` slår sedan ihop diary och hela burnout-projektionen och sorterar, men deduplicerar eller grupperar inte återkommande handlingar.

**Rekommenderad fix**

Redigera per episod, inte per rå post. Behåll första valet, den tydligaste förändringen och avslutet; eller gruppera upprepningar till en sann rad, exempelvis antal gånger plus det slutliga utfallet. Lägg ett tak för antal managerbeats och prioritera takval/ärr/återfall över upprepade standardval.

### MEDIUM 6 — Samma AI-spelare flyttar två gånger under samma sommar

**Reproduktion**

1. Avsluta säsong två.
2. Läs **Medan ni var borta · serien** i sommarvyn.

**Actual**

Två rader visades i samma sommar:

- **Oskar Mattsson flyttade från Västanfors till Karlsborg.**
- **Oskar Mattsson flyttade från Karlsborg till Målilla.**

**Expected**

En spelare ska normalt inte köpas av två AI-klubbar i samma transferfönster.

**Sannolik rotorsak**

`src/domain/services/aiTransferService.ts` itererar klubbar sekventiellt och bygger kandidatlistan från den redan uppdaterade spelarlistan. En nyss flyttad spelare kan därför väljas igen av en senare klubb om den nya säljarens trupp fortfarande är större än 20. Ingen `movedPlayerIds`-spärr finns.

**Rekommenderad fix**

Spåra spelare som redan flyttat under körningen och exkludera dem från senare kandidatlistor. Regressionstest: varje `playerId` får förekomma högst en gång i `result.transfers` per fönster.

### LOW 7 — Burnout-bågen minns, men återkopplingen efter brytpunkten är motsägelsefull

Det positiva är att återfallstexterna faktiskt refererade bakåt: **Samma sak som förra gången** och **Du känner igen bläddrandet**. Årsboken mindes dessutom ärrbeslutet och valde det som viktigast. Problemet är alltså inte längre avsaknad av historik, utan att standardvalet kan fortsätta prata ovanpå den större brytpunkten. Detta är samma rot som HIGH 1, inte en separat featurebegäran.

### LOW 8 — Ett nostalgibrev kan få en ålder/års-kombination som försvagar trovärdigheten

Brevet kom från en 77-åring som såg sin första Slottsbron-match med sin far 2009 och fick en filt lagd över sig. År 2027 innebär det ungefär 59 års ålder vid minnet. Det är inte logiskt omöjligt, men prosan kodar ett barndomsminne.

`src/domain/services/bandyLetterService.ts` väljer `age` och `memYear` oberoende från samma seedintervall. Härled minnesåret från födelseår plus en rimlig ålder för just barndomsmallen, eller skriv om mallen så att den inte implicerar ett barn.

### LOW 9 — Orsak/verkan kallar global matchdag för omgång

På Granska efter ligaomgång 2 visades **Det du valde i omgång 4**. Ledgerpostens `matchday` är den globala axeln, där cupveckor ligger före serien; UI-raden kallar den ändå omgång.

Roten finns i `src/presentation/screens/granska/GranskaOversikt.tsx`, som interpolerar `decision.matchday` direkt i ordet *omgång*. Använd den befintliga kronologiprojektionen till ligarond när det går; annars skriv **matchdag N**.

## Det som fungerade bra

- En SVÅR klubb var inte hopplös. Den usla starten gick att vända till 5:e plats och semifinal utan sabotage eller fusk.
- Styrelsens slutdom var rimlig i säsong två: femteplatsen överträffade kravet att överleva.
- Burnout återkom över säsongsgränsen med explicit minne. Det var tydligt att spelet visste att detta hänt förut.
- Det irreversibla burnout-valet blev korrekt **Säsongens beslut** och var också det val jag spontant mindes.
- Årsbokens viktigaste match var den dramatiska 4–3-segern i kvartsfinalen, vilket överensstämde med upplevelsen.
- Karriärhistoriken bar båda säsongerna, ekonomin, rivalen, cup/slutspel och patronens inträde/utträde på ett användbart sätt.
- Ekonomin var inte gratis: 342 tkr blev 324 tkr trots ett mycket bättre sportsligt år, och sommarens fem lönekrav skapade ett verkligt framtida tryck.
- Mobilvyn höll ihop utan innehållsoverflow eller avklippta ordinarie CTA:er under liga, cup, slutspel, årsbok och historik.

## Vad testet inte bevisade

- **Avsked inträffade inte.** Det betyder inte att avsked inte kan inträffa. Den här karriären överträffade kraven under säsong två och var därför inte ett giltigt avskedsscenario.
- **Licensnekad/poängavdrag inträffade inte.** Årsboken visade första ekonomiska riskzonen, men testet stannade innan en ny licensprövning.
- **Game Over och spel efter avsked testades inte i detta svep.**
- **Styrelseuppdragets varningskort observerades inte säkert.** Årsboken sade att ett uppdrag hängde löst, men jag kan inte slå fast om varningen aldrig renderades eller om den passerade mellan två spelade vyer. Koden uppdaterar målstatus endast vid ligaomgång 7, 14 och 22.
- Den fasta lokala debugknappen med build-hash överlappar vissa nedersta knappar i 390 px-vyn. Den är uttryckligen en debugyta och tas därför inte upp som spelarfel i prioriteringen.

## Föreslagen fokuserad regressionssvit

1. **Burnout mutual exclusion:** taktrigger och lättnadstrigger kvalificerar samma omgång; endast takkortet får köas.
2. **Burnout aftermath:** `step_back` ger återhämtningsfönster, inget gammalt standardkort och en kuraterad årsboksrad.
3. **Playoff elimination truth:** förlorad kvartsfinal, semifinal och final; Granska visar korrekt matchrubrik och ingen nästa match.
4. **Season-summary authorship:** varje rad under **Dina val** måste kunna beläggas med `madeByPlayer: true` eller en annan explicit spelarinmatning.
5. **Manager-memory curation:** tre identiska burnoutval samma säsong ger inte tre identiska meningar.
6. **AI transfer uniqueness:** inget `playerId` flyttar mer än en gång per sommar.
7. **Objective warning continuity:** ett mål går `active → at_risk → met/failed`; portalvarningen syns vid rätt check-in och årsboken motsäger inte den synliga resan.
8. **License journey:** first warning → handlingsplan → återhämtning respektive point deduction → denied; kontrollera både val, ekonomisk effekt, styrelseröst och årsboksklassificering.
9. **Chronology labels:** cup före serie och slutspel efter omgång 22; ingen global matchday får kallas ligarond i UI.

## Prioriterad åtgärdsordning

1. Burnout-eventens ömsesidiga uteslutning.
2. Granskas kanoniska nästa-match-hjälpare samt headerns uttågskontext.
3. Årsbokens gräns mellan spelarval och systemstatus.
4. Kuratering/dedup av managersektionen.
5. AI-transferfönstrets unikhetsspärr.
6. Kronologietikett och nostalgibrevsdatum.
