# O12 — naturligt beslutsprov och deploykontroll

**Datum:** 2026-09-11  
**Kör:** Codex, utan avsiktlig spridning av val  
**Produktion:** `bandy-manager.vercel.app`, aktiv build `4202986`  
**Dom:** **RÖTT** — O12:s 80-procentsgrind är inte passerad.

## Underlag

Det äldre, medvetet balanserade tre-save-provet uteslöts. Det naturliga
långspelsunderlaget består av två exporter av **samma** karriär
(`save_1788938909612`, manager `Grindtest 2`), vid säsong 2030 respektive
2037. Exporterna gav tillsammans 158 unika, analyserbara spelarval efter
deduplicering; 187 auto-resolutioner, 13 kvittenser, 16 äldre/okända poster
och 4 dubbletter uteslöts. Den senare exporten ligger på 200-posterscapen,
så kombinationen är användbar som karriärhistorik men är fortfarande bara en
beslutsfattare — inte en oberoende spelargrupp.

Ett separat naturligt produktionsprov startades med Gagnef på medelsvårighet.
Valen gjordes efter den synliga situationen, inte för att påverka statistiken:

- matchförberedelse valdes framför extra hörnträning inför cupkvartsfinalen,
  eftersom motståndarläsningen pekade ut en sårbar back;
- bandyskolan startades eftersom klubben hade råd och styrelsens mål krävde
  ett akademilyft;
- patronens samarbete välkomnades eftersom alternativet var strikt bättre än
  det försiktiga svaret.

## Entropi från det naturliga långspelet

Återkommande typer över 80 procent:

- `burnoutRelief`: `delegate` 8/8, **100 %**;
- `communityActivityRenewal`: `decline` 9/9, **100 %**;
- `burnoutCeiling`: `step_back` 7/8, **87,5 %**;
- `refereeMeeting`: `respect` 20/23, **87,0 %**.

Vanliga typer som klarade grinden omfattar `sponsorOffer` (78,6 %),
`transferBidReceived` (69,2 %) och `contractRequest` (47,6 %). Enstaka
event med n=1 redovisas av verktyget som dominanta men kan inte populations-
bedömas.

## Verifierat grindfel 1 — domarmötet är mekaniskt dominant

`refereeMeeting` erbjuder `respect` (+1 domarrelation), `neutral` (0) och
`protest` (−1) utan motkostnad eller andra systemeffekter. `respect` är
strikt bättre på den enda mekaniska axeln och bryter därför både 80-procents-
grinden och domens grundregel om minst två separat hanterade system. Det här
är inte bara ett litet urval: koden visar dominansen och 20 av 23 naturliga
val bekräftar att spelaren ser den.

## Verifierat grindfel 2 — patronintroduktionen maskeras av aggregeringen

I produktion visades två val med samma kvalitativa förhandsbeskrivning:
`Välkomna samarbetet` och `Tack, men vi tar det lugnt`. Båda säger att valet
gläder patronen och att det årliga bidraget fortsätter. Koden och det exakta
efterkvittot visar +20 respektive +5 patron happiness, utan annan skillnad.
Det första valet är alltså strikt bättre.

Entropiverktyget grupperar däremot på bred `eventType`. Alla olika
`patronEvent`-mallar läggs i samma fördelning, som därför ser frisk ut trots
att en enskild mall har ett dominant alternativ. Samma blindhet kan finnas i
andra samlingstyper som `communityEvent` och `mecenatEvent`. O12 måste mätas
per stabil beslutsmall/choice-set-identitet, inte bara per eventtyp.

## Deploykontroll av före/efter-kontraktet

Produktionsbuilden höll den byggda O12-principen:

- veckobeslutet visade kvalitativ riktning före klicket;
- bandyskolan visade exakt pengakostnad före och ett faktiskt kvitto
  `Kassan −5 000 kr` efter;
- patronvalet dolde den exakta relationsdeltan före och visade det faktiska
  kvittot `Patronens tålamod (Stefan Lindberg) +20` efter.

Rödfärgen gäller alltså dominans och mätgranularitet, inte den byggda
förhands-/efterkanalen.

## Nästa beslut

1. Döm en stabil beslutsmallsidentitet för telemetrin och analysera på den.
2. Gör patronintroduktionen till ett verkligt val eller ambient — +20 mot +5
   i samma system får inte ligga kvar som två knappar.
3. Gör domarmötet till ett verkligt val eller ambient; dagens +1/0/−1 är en
   rangordning, inte en avvägning.
4. Låt `burnoutRelief`, `communityActivityRenewal` och `burnoutCeiling` stå
   som hypoteser tills fler oberoende beslutsfattare finns; de har verkliga
   motkostnader och ska inte dömas enbart från en karriär.

## Mekaniskt åtgärdat efter provet

Commit `319ccd93` stänger två av provets verifierade fel:

- varje nytt `ResolvedChoice`-kvitto sparar en stabil
  `decisionTemplateKey`; standarden är eventtyp plus den sorterade
  choice-seten och producenter kan ange ett explicit mall-id när två olika
  beslut medvetet återanvänder samma choice-id:n;
- analysen grupperar nu per beslutsmall och exkluderar äldre kvitton som
  saknar säker mallidentitet, så en frisk fördelning i en bred eventfamilj
  inte längre kan dölja en dominant mall;
- patronintroduktionen är en ambient enknappskvittens utan state-effekt.
  Den tidigare gratisrangordningen +20 mot +5 är borta, medan både patronens
  introduktionsstämpel och röstregistret uppdateras när kortet konsumeras.

Verifiering: riktade kontrakt 77/77 gröna och full build inklusive TypeScript
och fem grindar grön. Helsviten gav först 5 187/5 192 därför att fem exakta
schemaassertioner fortfarande väntade det gamla kvittoformatet; efter att de
uppdaterats kördes samtliga berörda resolver-, patron- och entropivägar grönt
26/26.

O12 är fortfarande öppet. `refereeMeeting` väntar en spelmässig dom, och
80-procentsgrinden behöver därefter ny naturlig population från aktuell main.
