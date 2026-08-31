# ⛔ ERSATT AV `DOM_FRAMGANGSKURVAN_2026-08-27.md` — BYGG INTE PÅ DENNA

**Upptäckt i 2026-08-31-inventeringen:** denna dom saknade en supersede-pekare
trots att `DOM_FRAMGANGSKURVAN_2026-08-27.md` uttryckligen ersätter dess hela
ramverk med fyra konkurrerande anspråk (1–4), alla nu byggda. De tre krafterna
nedan (löneinflation/driftskostnad/styrelsekrav) lever vidare, men omtolkade
inom anspråk-strukturen — läs `DOM_FRAMGANGSKURVAN_2026-08-27.md` först.

---

# DESIGNDOM — FRAMGÅNGSEKONOMIN (HISTORISK)

**Datum:** 2026-08-17 · **Av:** Opus (chat)
**Underlag:** långspelsauditen, Västanfors 10 säsonger. Kassa 420 tkr → 11,0 mkr. Tio av tio säsonger med positiv kassaförändring, inklusive svaga år och trots byggande. Kvarvarande byggnoder år 10: 80–380 tkr mot en kassa på 9,9–11,0 mkr.

**Detta är en dom, inte en byggorder.** Den anger vad som ska gälla och varför. Code implementerar mot den, men punkterna markerade **RAPPORTERA** ska besvaras innan något byggs.

---

## Problemet, formulerat rätt

Det är inte att spelaren har för mycket pengar. Det är att **pengar upphör att vara ett val runt år fem.**

Ett managerspel består av att välja mellan saker man inte kan ha båda. Tar man bort begränsningen tar man bort spelet, oavsett hur bra allt annat är. Långspelsauditen svarar på frågan "vad får spelaren att vilja fortsätta år 6" med: slutspelsdrama, byggnoder och nyfikenhet på texterna. Två av tre tar slut. Ekonomin borde vara den tredje och är den inte.

Och det ska sägas rakt: detta är det tyngsta fyndet i hela auditen, tyngre än `.slice(-5)`. Karriärminnet är en rad kod och ett förtroendebrott. Det här är en saknad andra akt.

---

## Vad domen INTE är

**Inte att göra intäkterna mindre.** Att sänka publikbonus eller ligapriser gör tidiga säsonger svårare och löser ingenting år åtta — kurvan blir bara flackare, inte krokigare. En framgångsrik klubb *ska* ha råd med saker. Frågan är vad framgången kostar.

**Inte en straffspiral.** Ingenting i det här ska göra det värre att ha lyckats. Det ska göra det dyrare, vilket är en annan sak.

**Inte fler siffror att bevaka.** Spelaren ska inte behöva föra bok. Varje mekanism nedan ska synas som ett val, inte som en post.

---

## Domen: tre krafter, i prioritetsordning

Bygg dem i ordning. Var och en är meningsfull ensam; tillsammans räcker de.

### 1 · Löneinflation med rykte — den viktigaste

**Regeln:** när klubbens rykte stiger stiger också vad spelarna begär. Både vid kontraktsförlängning och vid nyförvärv.

Skälet att den är först: den är den enda kraften som växer med *exakt* det spelaren gör. Vinner du, vill folk spela hos dig — och de vill ha betalt för det. Det är inte en straffavgift, det är hur framgång faktiskt fungerar i idrott. En storklubb har inte samma lönekostnad som en småklubb med samma trupp.

Effekten på spelet: att behålla en truppen blir en återkommande kostnad i stället för ett engångsbeslut. Det gör kontraktsförlängningar till val, och de är i dag nästan gratis.

`economyService` skalar redan basintäkt med `reputation`. Lönesidan gör det inte — `salary / 4` är en fast division. Asymmetrin är rotorsaken till hela kurvan.

**RAPPORTERA innan bygge:** var sätts en spelares lönekrav vid förlängning respektive vid bud? Är det ett fält på `Player`, en beräkning i förhandlingen, eller ingenting alls? Och hur många ställen läser `salary` för att beräkna kostnad — jag vill veta om en ändring i lönebildningen får följder i värderingar, transferbudget eller AI-klubbarnas beslut.

### 2 · Driftskostnad för det man byggt

**Regeln:** varje färdig anläggningsnod kostar något varje säsong. Inte mycket per nod, men det ackumuleras — och det växer med hur mycket man byggt.

Skälet: i dag är noderna engångskostnader på sammanlagt 1,72 mkr. Man bygger dem, sedan är de gratis för evigt. Det gör byggträdet till en checklista med en ände, och auditen bekräftar att det tog slut kring år tio och att framåtdriften försvann då.

Med drift blir en byggd anläggning ett åtagande. Och det öppnar ett beslut som inte finns i dag: att lägga ner något man byggt. Det är ett bra beslut — det gör kartan levande i stället för monoton.

Kalibrering: driften ska vara märkbar men aldrig kunna sänka en välskött klubb. Riktning, för Code att föreslå exakt: total drift för ett fullt utbyggt träd ska ligga i storleksordningen en tredjedel av en normal säsongsintäkt. Nog för att synas i budgeten, inte nog för att vara ett hot.

**RAPPORTERA:** har `facilityNodes` någon plats för ett återkommande belopp i dag, eller är `cost` enbart engångs? Och finns det ett sätt att avveckla en nod, eller måste det byggas?

### 3 · Styrelsens investeringskrav

**Regeln:** när kassan växer förbi en gräns börjar styrelsen förvänta sig att pengarna används. Inte som ett straff, som ett krav bland de andra: *"Vi har 4 miljoner på kontot och en läktare från femtiotalet."*

Skälet: en full kassa är i dag helt konsekvenslös. Ingen frågar varför du sparar. Det är den enda av de tre krafterna som gör passivitet till ett aktivt val — och den passar direkt in i `boardObjectiveService`, som redan har måltyper, mätfunktioner och en checkin-rytm.

Detta är också vad som gör de andra två krafterna kännbara. Kan man alltid spara sig ur allt är löneinflation bara en långsammare tillväxtkurva.

**RAPPORTERA:** kan `boardObjectiveService` uttrycka ett mål av formen "spendera X" eller "kassan får inte överstiga Y", eller är alla måltyper riktade uppåt?

---

## Vad som medvetet lämnas ute

**Rivalernas catch-up-budget.** Auditen föreslår att motståndarna ska få mer pengar när du dominerar. Jag avvisar det. Det är dolt mottryck som spelaren inte kan se, förstå eller påverka — och det stjäl av det sportsliga, som enligt samma audit fungerar: placeringarna 1,1,1,3,2,1,2,1,3,3 visar en liga som redan bjuder motstånd. Att skruva AI:ns plånbok i bakgrunden är att göra spelet svårare utan att göra det rikare.

**Dynasty state som en egen mekanism.** Den ligger som separat post i Del C, men efter den här domen är frågan om den behövs. Löneinflation *är* dynastipress, i en form spelaren kan se och hantera. Jag avgör det när de tre krafterna finns.

**Nya intäktskällor.** Inte nu. Problemet är att pengar inte kostar, inte att de är för få.

---

## Hur vi vet om det fungerade

Ett kriterium, i produkttermer, och det ska vara ett acceptanskrav i balanssviten:

**En framgångsrik klubb ska år åtta ha minst ett ekonomiskt val där båda alternativen svider.**

Inte "kassan ska vara under X". Inte "utgifterna ska ha ökat med Y procent". Ett val. Om simuleringen visar en klubb med tio miljoner och inget att bry sig om har vi misslyckats, oavsett vad siffrorna säger.

**RAPPORTERA:** kan det mätas mekaniskt i en simulering — exempelvis att kassan vid något tillfälle under säsong 8 understiger kostnaden för det billigaste tillgängliga åtagandet? Om inte, säg det, så blir det ett manuellt kriterium i speltestet i stället för ett falskt automatiserat.

---

## Ordning

RAPPORTERA-punkterna först, alla fyra, i en rapport. Sedan bygger vi 1, 2, 3 i den ordningen, en åt gången, med `npm run stress` före och efter varje.

Kalibreringen görs mot Skutskär (SVÅR) lika mycket som mot Västanfors (LÄTT). Alla tre krafterna riskerar att göra en svag klubb ospelbar, och nedåtkedjan är helt oprövad — Skutskär-testet pågår och dess svar ska vägas in innan kalibreringen låses.

**Ingen av de tre byggs innan Skutskär-auditen är läst.** Vi vet vad uppsidan behöver. Vi vet ingenting om vad nedsidan tål.
