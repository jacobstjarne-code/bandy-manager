# DOM — A-H2b: RETENTION, INTE BUDGET (femte omtaget, det avgörande)

**Datum:** 2026-08-28 · **Av:** Opus · **Beslut:** Jacob (väg 1 + mellanled, 2026-08-28)
**Ersätter:** hela budgettrycks-ansatsen i `DOM_AH2B_BUDGETTRYCK_KORORDER_2026-08-28.md`. Den körordern är därmed avslutad; dess STEG 1-DOM (wageBudget rådgivande) står kvar som fynd men dess metrik är övergiven.
**Grund:** `DOM_FRAMGANGSKURVAN_2026-08-27.md` anspåk 1 + 2. Fem mätpass: `anspark1-condition2-*`, `anspark1-villkor-omdesign-*`, `anspark1-budgettryck-ekonomi-matning-2026-08-28.ts`.

---

## Varför fem pass kraschade — samma sten, fem håll

Tier-relativ verdict, absolut topp-3/titel, marginal mot egen tvåa, wageBudget, cashGrowth. Alla mätte **lönekrav i kronor mot en resurs framgången själv trycker**. En dominant klubb tjänar snabbare än den ådrar sig lönekostnader — median +501k överskott mot ~107k krav (ekonomimätningen). Prispengar och ryktesdriven publik växer med segern långt fortare än prestationslönerna. Varje kronmått frågar "har vinnaren råd med X", och svaret är alltid ja, för att vinna gör klubben rik.

Det är inte ett tröskelproblem. Det är fel bärare. **Lönekrav mätt i pengar kan aldrig göra framgång dyr, för framgång är i den här ekonomin nära ren välståndsökning.**

## Domen: kostnaden är truppen, inte kassan

A-H2b är inte en budgetmekanik. Den är en **retentionsmekanik**. Domens egna ord är "kan inte *hålla* halvbacken" — förlora honom, inte ha råd med honom. En överpresterande spelare du inte betalar till marknadsnivå blir en spelare marknaden tar.

Det löser hela felklassen på en gång: kostnaden mäts i **spelare**, inte i en valuta framgången skapar. Det finns ingen denominator kvar att gissa fel på. Och det kopplar ihop anspåk 1 (truppen vill ha det den är värd) med anspåk 2 (framgång kostar folk) — samma mekanik från två håll, det ena redan byggt (`computeBidChance`, transferService.ts).

## Mekaniken (mellanled — Jacobs val)

Tre led, inget kronmått:

**1 · Aktivt krav vid säsongsslut.** En förstalagsspelare vars nuvarande `salary` ligger under sin `computeContractMinSalary` (economyService.ts:321 — höjd av `performanceFactor` för den som överpresterat mot ligasnittet) har ett **obemött marknadskrav**. Idag är formeln passiv: den läses bara om spelaren råkar bli förlängd (`renewContract`/`createOutgoingBid`). Kravet ska bli aktivt — kraven landar TILLSAMMANS vid säsongsövergången som ETT beslut (möt / möt inte), inte dribblas genom individuella förlängningsklick. Det är momentet domen vill ha.

**2 · Obemött krav → moral (mellanledet).** Att inte möta kravet (ingen förlängning till/över den nya golvnivån) eroderar spelarens moral. Ett synligt, planeringsbart förlopp: du ser missnöjet byggas och kan ändra dig nästa fönster. Detta är mellanledet Jacob valde framför direkt budsårbarhet — en konsekvens man kan planera runt slår en osynlig, samma princip som A-H3:s förvarnade tillgänglighet.

**3 · Moral → budsårbarhet.** Låg moral (från obemött krav) matar två befintliga budhookar:
   - `generateIncomingBids` (transferService.ts) väljer idag budmål på **currentAbility** (topp 40 %, viktat mot bäst, exkl. kapten) — moral läses inte. Lägg moral som urvalsfaktor: en missnöjd underbetald stjärna är den marknaden kommer efter.
   - `playerAcceptsTransfer` (transferService.ts) väger idag **personlighet/geografi/rivalitet** — moral läses inte. Låg moral höjer ja-sannolikheten: den underbetalde säger ja när budet kommer.

## Varför ordningen blir rätt UTAN denominator

Både signalerna skalar med framgång, åt samma håll:
- **Kravantal:** en dominant klubb har fler överpresterare (ekonomimätningen: median 16 kravställare/säsong mot mittenlagets 5) → fler samtidiga krav → fler spelare i risk om de inte möts.
- **Budfrekvens:** `computeBidChance = 0.15 · clamp(positionFactor · reputationFactor, 0.4, 3.0)` — en mästare (pos 1, högt rykte) landar ~0.45/omgång, en bottenklubb ~0.045. ~10× fler bud.

De två anspåken **komponerar**: en dominant klubb får både fler krav OCH fler bud, så obemötta krav omsätts i faktiska avgångar. Ett mittenlag har få överpresterare OCH få bud — mekaniken rör det sällan. Ingen tuning krävs för att vända ordningen rätt; den är rätt av konstruktion.

## Var biten sitter (och varför fri kassa inte upphäver den)

Du KAN kronmässigt möta alla krav — det bekräftade mätningen. Biten är inte "har du råd". Biten är:
- **Bud kommer oavsett** (positionsdrivet, inte moralgatat). Du kan aldrig helt skydda en dominant trupp; framgång betyder att marknaden vill ha dina spelare. Att möta ett krav *sänker* avgångsrisken, nollar den inte.
- **Att möta kraven är pengar som inte går någon annanstans.** Kassan är fri relativt lönekraven ensamma, men inte relativt ALLA anspåk samtidigt — löner + anläggning (anspåk 3) + värvningar. Väljer du att säkra truppen väljer du bort det andra. Det är framgångskurvans "ett ja är ett nej någon annanstans", nu sant genom vad du förlorar, inte genom ett saldo.

Den som betalar allt förlorar ändå enstaka spelare till bud, men får behålla ryggraden. Den som lägger pengarna på anläggningen förlorar fler, och de hen försummade. Det är valet.

## Rapportera innan bygge

1. Finns ett säsongsövergångs-moment där kraven kan presenteras samlat, eller måste det byggas? (`seasonEndProcessor.ts` / förutsättningsfasen.)
2. `renewContract` ger idag moral −12 vid förlängning på EXAKT `minSalary`. Det är sannolikt fel-tecknat för den här mekaniken (att betala marknadsnivå ska inte förolämpa). Reconcile: möta kravet = nöjd, obemött krav = moraltappet. Rapportera var −12:an kom ifrån innan den rörs.
3. Vilken moral-tröskel/kurva i `generateIncomingBids` urvalet och `playerAcceptsTransfer` ger en märkbar men icke-explosiv effekt? Rapportera fördelning innan magnituden låses — samma distribution-först-disciplin som förr.
4. Bär `Player.morale` redan säsongsövergången, eller nollas/dämpas den vid rollover så ett obemött krav från i höstas inte finns kvar när budet kommer?

## Mät mot AVGÅNGAR, inte kronor

Målet när mekaniken står, för Code att kalibrera mot:
- En dominant klubb som **försummar** kraven förlorar märkbart fler oönskade spelare/säsong än en som möter dem (levern fungerar).
- En dominant klubb förlorar ~1 spelare/säsong den helst behållit även om den betalar (anspåk 2:s grundpris för framgång står kvar).
- Ett mittenlag rör mekaniken sällan (få överpresterare × låg budchans).

Ingen lastkvot. Ingen denominator. Måttet är folk som går.

## Handoff

**Opus (jag):** texten (kravkortet vid säsongsslut, moralbeskeden) skrivs när mekaniken och dess magnituder står — inte mot en ospecad mekanik.
**Code:** rapportera 1–4, bygg de tre leden, kalibrera mot avgångar. Parallellt med A-H9 och A-H3 (olika filer).
**Jacob:** inget mer beslut krävs — väg 1 + mellanled är dömt. Delfrågan hård-vs-sannolikhet från A-H3 gäller inte här; mellanledet ÄR det mjuka valet.

---

## NOT (2026-08-29): Villkor 2 byggt — SLUTTEST_KO A-H2b-fyndet stängt

Leg 1 ovan levererades (`a55d4139`) med bara villkor 1 (individuellt obemött
marknadskrav). Den ABSOLUTA klubbframgångsgrinden — "minst ETT av tre: topp
tre, vunnit serien/cupen, eller förbättrat placeringen mot föregående
säsong" (definitionen i sin helhet står i `DOM_AH2B_BUDGETTRYCK_KORORDER_
2026-08-28.md`, ärvd ordagrant hit) — implementerades aldrig, vilket ett
kodläst fynd (SLUTTEST_KO.md A-H2b-raden, 2026-08-28) upptäckte: mittenlag
såg 6-7 krav/säsong trots att klubben själv inte lyckats.

Byggt 2026-08-29 i `contractDemandService.ts` (`clubSatisfiesSeasonSuccessGate`,
AND:ad in i `computeSeasonEndContractDemands` FÖRE per-spelar-loopen).

**Mätt effekt** (`scripts/anspark1-villkor2-matning-2026-08-29.ts`): mittenlagets
kravfrekvens går från 6.85 → 3.61/säsong — en halvering, men INTE "sällsynt"
som förutspått. Rotorsak: dörr (c), positionsförbättring mot föregående
säsong, slår in ~50 % av säsongerna för ett mittenlag av ren positionsbrus
(ett lag utan dominans studsar upp och ner i tabellen år för år). Dörr a+b
ensamma (topp-3/titel/cup, utan positionsjämförelsen) ger 1.88/säsong — det
ÄR sällsynt. Dominant klubb opåverkad av dörr c (9.36→7.24 med bara a+b,
7.46–7.52 med alla tre) — den träffar a/b nästan varje säsong ändå.

Implementerat exakt som doktrinens tre dörrar specificerar — fyndet ovan är
en rapport, inte en avvikelse. Om "sällsynt för mittenlag" är ett hårt krav
snarare än en riktningsförväntan är det en ny domfråga (skärp dörr c, eller
stryk den och luta på a+b) — inte löst av detta bygge.
