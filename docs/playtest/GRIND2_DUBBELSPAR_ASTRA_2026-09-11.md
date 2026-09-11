# Grind 2 — dubbelspår Codex/Astra, 2026-09-11

## Dom

**UNDERKÄND.** Två sammanhängande säsonger spelades från en ny Lesjöfors-karriär
på MEDEL mot produktkoden i `6732d711d5f3b0053bb71ec0311dae6ca0e8f9ec`.
Claim-/dokumentcommiten `22c7f6d4` ändrade inte produkten. Körningen gjordes på
en isolerad origin; spelarens `localhost:3000` och befintliga save lämnades
orörda. Ingen matchbalans eller sannolikhet ändrades för att styra utfallet.

Provets passkriterium nåddes inte: kafferums-ekon bröt tvåsäsongers cooldown,
beslutskön både överskred avbrottsbudgeten och blev olöslig vid säsongsslut,
och den kanoniska klackkonflikten triggades aldrig. Burnout-taket och galans
engångsresolution höll i den naturliga körningen.

## Omfattning och slutresultat

- Säsong 2026/27: cupsemifinal, 9:e plats, 18 poäng. Ingen slutspelsplats.
- Säsong 2027/28: cupsemifinal, 8:e plats, 19 poäng. Kvartsfinalförlust 0–3
  mot seriesegraren Västanfors.
- Ingen match i en tredje säsong spelades. Rollovern till 2028/29 användes
  enbart för att läsa årsbok, inkorg och kvarvarande kö.
- Checkpoint-save gjordes i spelets sparplats före och efter de pivotalval som
  faktiskt triggades: tifo, båda burnout-taken och galan. Den isolerade
  browserprofilens sista save finns kvar, men ingen extern savefil kunde
  exporteras från den automatiserade browsern. Därför är de nedan angivna
  UI-observationerna reprobelägg; rapporten påstår inte att en fristående
  checkpoint-bunt har skapats.

## Spår A — logik

### 1. Burnout-taket — PASS

- 2026/27 nåddes taket efter flera omgångar på 100. Val: **Kliv tillbaka en
  period**. Inget andra terminalt burnout-val kom samma säsong.
- 2027/28 mindes scenen det tidigare valet korrekt: ”Du klev tillbaka förra
  gången …”. Val: **Kör vidare**. Inget andra terminalt val kom den säsongen.
- Sluttexterna motsade inte de två resolutionerna. Senare återhämtningskort
  är en möjlig dramatisk doseringsfråga, men inget brott mot terminalinvarianten.

### 2. Kafferums-eko — FAIL

Exakta replikpar återkom innan två säsongers cooldown hade löpt ut:

- ”Samma hög på bordet som förra veckan. Större nu.” / ”Mm. Den där växer om
  man inte tar i den.” — 2026/27 omgång 13 och 19, sedan 2027/28 omgång 7.
- ”Han gick hem sist igen. Lämnade lampan på.” / ”Jag släckte den. Sa inget.”
  — 2026/27 omgång 10 och 22, sedan 2027/28 omgång 18.
- ”Han bad om en veckas andrum i morse.” / ”Det är inte veckan som är
  problemet. Det är högen.” — 2026/27 omgång 7 och 2027/28 omgång 13.

Kodläsningen lokaliserar orsaken: `completeScene` skriver
`coffee_pool_<index>` till `narrativeBeatLog`, men den generella
fatigue-poolens selektor läser inte den tvåsäsongscooldownen. Den undviker bara
en kort svans i `lastCoffeeSceneIndices`; med åtta repliker blir återfall
förväntade efter några besök. Ingen exakt replik upprepades inne i de tre
kvartsfinalmatcherna, men den globala cooldown-invarianten är ändå bruten.

### 3. Bandygalan — PASS

`event_gala_2026` kom naturligt i den andra säsongens första cup-Granska,
sparades före/efter och löstes med **Gå på galan — visa upp klubben**. Eventet
återkom inte. Årsbokens gala 2028 är en ny upplaga och räknas inte som repris.

### 4. Klackkonflikten — EJ TÄCKT

Tifon och ett generiskt veckoval om musikbråk triggades, men den kanoniska
`supporter_conflict_<season>` / **Konflikt i klacken** kom aldrig under de två
säsongerna och syntes inte heller bland rollover-rapporterna. Veckovalet är en
annan producent och får inte ersätta riskscenen. Saknad täckning är uttryckligen
inte pass enligt instruktionen; inget konkret reprisbrott observerades.

### 5. Beslutskön — FAIL

- Vid slutspelsintroduktionen visade portalen **4 aktiva** samtidigt som den
  kanoniska avbrottsbudgeten är högst 3.
- Efter uttåget ur kvartsfinalen stod **16 i kön, 3 aktiva**, men inga kort
  gick att öppna eller lösa. Portalen erbjöd bara **Avsluta säsongen** och
  Match-sidan sade att säsongen var slut. ”Fruset Granska lösbart” bröts.
- Vid första rollover fanns 21 rapporter och totalt 25 olästa inkorgsposter;
  vid den andra 16 rapporter och 20 olästa. Åldrar upp till 35 globala omgångar
  syntes. Kön kändes inte bara stor utan bar gammalt, obearbetat material.
- Samma semantiska familj återkom bland uppskjutna/utrullade rapporter:
  **Jobbet kolliderar med träningen** för Hugo Berg minst fem gånger första
  året och tre gånger andra; även Esa Hård och Noah Dahlberg återkom.
  `starPerformance`, `playerMediaComment` och den generiska ”Hög — rann ut”
  förekom också flera gånger. Det är reproduktion/svält på semantisk nivå även
  om interna instans-id:n kan vara olika.

## Pivotal liggare

- 2026/27 O5: `Maja och tifon` → **Klart, låna lokalen**; före/efter-save.
- 2026/27 O14: burnout-tak → `step_back`; före/efter-save; ingen terminal repris.
- 2026/27 O13→O19: första verifierade exakta fatigue-reprisen.
- Rollover 2027: 21 rapporter, upprepade vardagsjobb, äldsta 35 globala omgångar.
- 2027/28 cup O1: `event_gala_2026` → gå; före/efter-save; ingen repris.
- 2027/28 O12: burnout-tak → `push_through`; före/efter-save; ingen terminal repris.
- 2027/28 slutspelsintro: 4 aktiva.
- Efter kvartsfinal 3: 16 i kö, 3 aktiva, inget lösbart Granska-kort.
- Rollover 2028: 16 rapporter, fortsatt semantisk reproduktion; ingen kanonisk
  klackkonflikt i liggaren.

## Spår B — spelupplevelse

### Säsong 1

Den primära handlingen var tydlig: en tunn Lesjöforstrupp pressades hårt,
burnout och skador kom, och laget försökte rädda säsongen med en sen vändning.
13 poäng under andra halvan gav verkligt hopp, men niondeplatsen landade som
ett trovärdigt misslyckat slutspel. Frågan som drog vidare var om den egna
belastningen hade byggt en starkare grupp eller bara förbrukat den.

### Säsong 2

Bågen blev ännu tydligare: fem raka serieförluster, återhämtning, säkrad
slutspelsplats genom 4–1 i derbyt mot Hälleforsnäs och sedan tre raka, jämna
förluster mot ettan Västanfors. Valet att köra vidare genom burnout gav
säsongen en personlig kostnad. Det gjorde avancemanget minnesvärt även utan
semifinal.

### Över två säsonger

- Matchrytmen blev bättre med åttasekundersvalen; fullmatch kändes mindre
  ryckig än med fem sekunder.
- Cupen hölls begripligt skild från serien och dess poäng. Cupförlustens
  landning tillbaka mot serien fungerade.
- Burnout bar dramatisk vikt och mindes det tidigare valet. Galan var tekniskt
  tydlig men emotionellt tunn: i praktiken en vinnarlista och två knappar.
  Det stödjer den redan öppna galagestaltningsraden, inte en ny balansåtgärd.
- Tifon och derbyekon gav supportertråden kontinuitet, men den specifika
  klackkonflikten kunde inte upplevas.
- Köreservationen från Grind 3 är **inte lyft**. ”+N fler”, mycket gamla
  poster och två massiva rollover-inkorgar tyngde rytmen. När kön dessutom
  blev olösbar vid säsongsslut slutade den vara bakgrund och blev ett stopp.

## Övriga reproducerade kvalitetsfynd

- Årsboken motsade styrelsens mål båda åren. Portalen sade **Sluta topp 6**
  och inkorgen markerade misslyckande, men årsboken kallade 9:e respektive
  8:e plats för vad styrelsen väntat sig eller bättre än begärt.
- Samma derbytriumf stod dubbelt i båda årsböckerna: Slottsbron första året,
  Hälleforsnäs andra.
- Inför Forsbacka visade ett mediakort den gamla motståndaren Slottsbron.
- ”Gabriel Hedlund är kallade till Sveriges P19-samling” ska vara ”är kallad”.
- Matchkvitto läckte intern formulering: ”Det du valde i matchdag 4: Kassan
  knappt ner.”
- Mecenatvalens två alternativ lovade samma positiva patronutfall i
  förhandstexten.

## Åtgärdsordning

1. Gör säsongsslutskön lösbar och stoppa rollover-svält/semantiska dubbletter.
2. Låt alla kafferumspooler använda den redan skrivna identiteten och den
   avsedda tvåsäsongscooldownen.
3. Säkerställ att alla portalproducenter räknas in i samma budget på max tre.
4. Reparera årsbokens sanningskälla för styrelsemålet och derbydedupen.
5. Kör ett riktat naturligt återprov tills den kanoniska klackkonflikten
   faktiskt triggats; ett syntetiskt producenttest får bara komplettera.

Matchmotorn och den tidigare datadrivna resultatbalansen lämnas orörda. De två
säsongernas resultat är plausibla för ett svagt Lesjöfors och ger inget belägg
för omkalibrering.
