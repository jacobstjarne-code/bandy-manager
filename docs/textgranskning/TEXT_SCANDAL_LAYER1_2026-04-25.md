# Sprint 25h Lager 1 — Kurerad text för 7 arketyper (REVIDERAD)

**Levererat av:** Opus
**Datum:** 2026-04-25 (revision 2)
**Status:** Ersätter tidigare TEXT_SCANDAL_LAYER1_2026-04-25.md

## Ändringar från första leveransen

1. **Sponsorbeloppen krympta** — 400k → 25-40k. Spelets sponsorer ger
   ~30k-60k/säsong, inte 400k. En sponsorkollaps är irriterande, inte
   katastrofal.
2. **coach_meltdown är nu vuxen** — alkoholism och spelmissbruk antydda
   genom understatement. Klubben skyddar honom. "Olika syn på framtiden"
   var för snällt — det är språket man använder *när det är något annat*.
3. **Ny arketyp: `municipal_scandal`** — kan drabba spelarens egen klubb.
   Inspirerat av Leksand/gatstenen 2007. Politik händer omkring klubben.
   Frekvens 25%, ny fördelning nedan.
4. **"Assisterande tränare"** istället för "assistenttränare" (rätt
   sportspråk).
5. **Token-konvention** kvar: `{KLUBB}`, `{ANDRA_KLUBB}`,
   `{POLITIKER}` (ny — för kommun-skandaler), `{PARTI}` (ny).

## Reviderad fördelning

| Arketyp | Frekvens (av) | Mekanisk effekt |
|---------|---------------|-----------------|
| municipal_scandal | 25% | Varierande — drabbar managed möjligt |
| sponsor_collapse | 15% | -30k engångs + -3k/v resterande säsong |
| treasurer_resigned | 18% | Transferfreeze 3 omg |
| phantom_salaries | 13% | -2 poäng innevarande säsong |
| club_to_club_loan | 12% | -3 poäng nästa säsong (drabbar sekundärklubb) |
| fundraiser_vanished | 10% | reputation -8 (~motsv CS-15 för AI) |
| coach_meltdown | 7% | Form -15% i 4 omg + tränarbyte |

---

## 1. MUNICIPAL_SCANDAL — Kommun-skandal (NY)

Lager 1 men kan träffa managed club. Politiker beslutar saker, klubben
drabbas (positivt eller negativt). Refererar Leksands gatsten 2007.

### Inbox-titlar
1. **{POLITIKER} {PARTI}: "Bidraget till {KLUBB} omprövas"**
2. **Granskning av {KLUBB}-bidraget — Uppdrag Granskning intresserade**
3. **Kommunal markaffär ifrågasätts — {KLUBB} mitt i**

### Inbox-bodies
1. *{POLITIKER} {PARTI} har lämnat in motion om att se över kommunbidraget till {KLUBB}. "Vi har skola och omsorg som väntar." Beslut tas i nästa fullmäktige. Bidraget kan halveras.*

2. *En lokal tidning har börjat nysta i hur {KLUBB} fick köpa kommunens fastighet förra året. Trottoarkanten som skiftade ägare i samma affär väcker frågor. Skatteverket har efterfrågat papper.*

3. *Kommunen sålde en bit mark till {KLUBB} för en symbolisk summa. Oppositionen kräver utredning. "Det är inte första gången pengar rinner åt fel håll här", säger {POLITIKER} till lokalpressen.*

### Tidningsrubriker
1. **{KLUBB}-bidraget ifrågasätts: "Vart går pengarna?"**
2. **Kommunens markaffär med {KLUBB} granskas**
3. **{POLITIKER}: "Skola före bandy"**

### Kafferum
1. > **Vaktmästaren:** "Hörde att {POLITIKER} vill dra bidraget."
   > **Kioskvakten:** "Det är {PARTI}, det."
   > **Vaktmästaren:** "Som om dom någonsin gillat oss."

2. > **Ordföranden:** "Tidningen har börjat ringa om markaffären."
   > **Kassören:** "Vad sa du?"
   > **Ordföranden:** "Ingen kommentar."

3. > **Materialaren:** "Dom säger att vi fick fastigheten för billigt."
   > **Vaktmästaren:** "Trettio miljoner värd, en krona kostnad?"
   > **Materialaren:** "Och en trottoarkant."

---

## 2. SPONSOR_COLLAPSE — Sponsor-kollaps (REVIDERAD: krympta belopp)

### Inbox-titlar
1. **Borgvik Bygg drar sig ur — söker ny sponsor**
2. **{KLUBB}s sponsoravtal sägs upp i förtid**
3. **30 000 borta — sponsorn lämnar**

### Inbox-bodies
1. *Borgvik Bygg AB har sagt upp sitt sponsoravtal med {KLUBB} med omedelbar verkan. Företagets VD har frivilligt lämnat efter en intern utredning. {KLUBB} mister 3 000 i veckan resten av säsongen — och letar redan ersättare.*

2. *{KLUBB}s mindre sponsor avslutar samarbetet. Klubben kommenterar inte anledningen, men 30 000 är borta från säsongsbudgeten. "Vi söker", säger ordföranden.*

3. *Telefonen ringde en gång på sportchefens kontor. Avtalet är uppsagt. Inte en stor sponsor — men ändå 30 000 borta från en redan tunn budget.*

### Tidningsrubriker
1. **{KLUBB} utan en av sina sponsorer — "vi söker"**
2. **Borgvik Bygg ut ur {KLUBB}-tröjan**

### Kafferum
1. > **Kassören:** "Borgvik Bygg är ute."
   > **Vaktmästaren:** "Vad hände?"
   > **Kassören:** "VD:n slutade. Hela företaget skakar."

2. > **Kioskvakten:** "Sponsorlistan blev kortare."
   > **Materialaren:** "Mycket?"
   > **Kioskvakten:** "Räcker att märkas."

---

## 3. TREASURER_RESIGNED — Kassör avgick

(Oförändrad från första leveransen — funkar som den var.)

### Inbox-titlar
1. **{KLUBB}s kassör avgick — transferaktivitet pausad**
2. **"Personliga skäl" — {KLUBB} utan kassör**
3. **Kassören borta, kontoret stängt**

### Inbox-bodies
1. *{KLUBB}s kassör har avgått efter 14 år. Klubben skriver "personliga skäl" i pressmeddelandet. Transferaktiviteten är pausad i tre omgångar medan en ny tar över räkenskaperna.*

2. *Det stod ett kuvert på köksbordet, säger ordföranden. Kassören har slutat. {KLUBB} kan inte göra affärer förrän bokföringen är genomgången — det kommer ta tre omgångar.*

3. *{KLUBB} bekräftar att kassören slutat. Klubben kommenterar inte vidare. Inga transfers genomförs förrän en ersättare är på plats — räkna med tre omgångar.*

### Kafferum
1. > **Kioskvakten:** "{KLUBB}s kassör slutade på en dag."
   > **Vaktmästaren:** "Hur då?"
   > **Kioskvakten:** "Brev på köksbordet."

---

## 4. PHANTOM_SALARIES — Fantomlöner

(Oförändrad — funkar.)

### Inbox-titlar
1. **Skatteverket granskar {KLUBB} — fantomlöner uppdagade**
2. **{KLUBB} drar tillbaka två spelare från lönelista**
3. **Spelare på pappret — Skatteverket nyfiken**

### Inbox-bodies
1. *Skatteverket har granskat {KLUBB}s lönelista. Två spelare har stått som anställda utan att ha spelat på två säsonger. Klubben förlorar 2 poäng den här säsongen och betalar tillbaka skatten.*

2. *"Det var ett administrativt misstag", säger ordföranden i {KLUBB}. Skatteverket håller inte med. Två spelare har lyfts ur lönelistan i efterhand. 2 poäng dras från innevarande säsong.*

3. *{KLUBB}s gamla kassör hade ett system där två spelare lönsattes utan att spela. Klubben säger att det var glömt. Skatteverket säger att det är skattebrott. 2 poäng går från säsongstabellen.*

### Tidningsrubriker
1. **{KLUBB} fast i fantomlöner — 2 poäng bort**
2. **Spelare på papper, lön på riktigt — {KLUBB} granskat**

### Kafferum
1. > **Kassören:** "{KLUBB} hade två spelare som inte fanns."
   > **Vaktmästaren:** "Hur då?"
   > **Kassören:** "På lönelista. Inte på plan."

2. > **Ordföranden:** "Skatteverket är klart med {KLUBB}."
   > **Materialaren:** "Och?"
   > **Ordföranden:** "Två poäng och tillbakabetalning."

---

## 5. CLUB_TO_CLUB_LOAN — Klubb-till-klubb-lån

(Oförändrad.)

### Inbox-titlar
1. **{KLUBB} och {ANDRA_KLUBB} delade pengar — Förbundet utreder**
2. **Pengaflyttar mellan grannklubbar — poängavdrag väntar**
3. **Två klubbar, samma kommun, samma kassa**

### Inbox-bodies
1. *{KLUBB} och {ANDRA_KLUBB} har skiftat 600 000 mellan sig under hösten. Förbundet kallar det "kreativ bokföring". {ANDRA_KLUBB} får 3 poängs avdrag nästa säsong.*

2. *Att stötta grannklubben är vacker tanke, säger Förbundet, men inte tillåten. Pengarna gick fram och tillbaka mellan {KLUBB} och {ANDRA_KLUBB} tre gånger. Det räckte för poängavdrag.*

3. *Två klubbar i samma kommun. Samma styrelseledamot på båda kanslierna. Samma 800 000 som dök upp i båda kassorna. {ANDRA_KLUBB} betalar med 3 poäng nästa säsong.*

### Kafferum
1. > **Ordföranden:** "Hörde att {KLUBB} och {ANDRA_KLUBB} har samma kassör."
   > **Kassören:** "Inte konstigt det rörde sig pengar."

2. > **Vaktmästaren:** "Förbundet kollade bokföringen i {ANDRA_KLUBB}."
   > **Materialaren:** "Och?"
   > **Vaktmästaren:** "Tre poäng nästa år."

---

## 6. FUNDRAISER_VANISHED — Insamling försvann

(Oförändrad.)

### Inbox-titlar
1. **Insamlingen försvann — {KLUBB}-supportrar rasande**
2. **300 000 borta, ingen vet vart**
3. **Korv-pengarna förintades — {KLUBB} i kris**

### Inbox-bodies
1. *Supportrarna sålde korv hela hösten. Sammanlagt drogs det in 300 000 till nytt omklädningsrum hos {KLUBB}. Pengarna är borta. Ingen vet hur. Klacken vill ha svar — och styrelsen har inga.*

2. *{KLUBB}s insamlingskonto är tomt. 300 000 från höstens korv- och lottinsamling har försvunnit. Klubben gör polisanmälan men supportrarna har redan börjat ifrågasätta hela styrelsen.*

3. *Det skulle bli ett nytt golv i omklädningsrummet. Det blir det inte. Insamlingen i {KLUBB} är tom — 300 000 är borta sedan i förra månaden, och styrelsen kan inte förklara vart.*

### Kafferum
1. > **Kioskvakten:** "Korven på Stålvallen var bortkastad."
   > **Vaktmästaren:** "Vad menar du?"
   > **Kioskvakten:** "Pengarna försvann från kontot."

2. > **Materialaren:** "Klacken i {KLUBB} kräver svar."
   > **Vaktmästaren:** "Och styrelsen?"
   > **Materialaren:** "Polisanmälan. Inget mer."

---

## 7. COACH_MELTDOWN — Tränaren-haveri (REVIDERAD: vuxen ton)

Spelat sammanbrott. Ingen säger ordet rakt ut. Klubben skyddar honom.
Det är så bandy-Sverige fungerar.

### Inbox-titlar
1. **{KLUBB}s tränare avgick — "personliga skäl"**
2. **Tränarbyte i {KLUBB} efter en längre period**
3. **{KLUBB}s tränare tar paus — assisterande tar över**

### Inbox-bodies
1. *{KLUBB}s tränare har lämnat klubben. Klubben skriver "personliga skäl" i pressmeddelandet och vill inte säga mer. En kollega som ringt redaktionen säger att "han söker hjälp nu, det är det viktiga". Assisterande tränare tar över i fyra omgångar. Form -15% under perioden.*

2. *Det har varit oroligt en längre tid kring {KLUBB}s tränare. Sena ankomster, en match utan honom på bänken, tystnad om varför. Nu meddelar klubben att han tar paus. Ingen säger vad. Det behövs inte. Form -15% i fyra omgångar medan assisterande tränare leder.*

3. *Det blev en sak att inte prata om i {KLUBB}. Spelarna märkte det först. Sen styrelsen. Nu är tränaren borta. "Han behöver tid", säger ordföranden, och alla förstår vad det betyder. Assisterande tränare leder laget i fyra omgångar.*

### Tidningsrubriker
1. **{KLUBB} byter tränare — "personliga skäl"**
2. **Tränaren i {KLUBB} tar paus**

### Kafferum
1. > **Vaktmästaren:** "{KLUBB}s tränare är borta."
   > **Kioskvakten:** "Hörde det. Visste väl alla."
   > **Vaktmästaren:** "Hoppas han fixar det."

2. > **Materialaren:** "Han var inte på bänken förra matchen heller."
   > **Kassören:** "Andra gången på en månad."
   > **Materialaren:** "Tredje."

---

## SAMMANSTÄLLNING

| Arketyp | Titlar | Bodies | Rubriker | Kafferum |
|---------|--------|--------|----------|----------|
| municipal_scandal | 3 | 3 | 3 | 3 |
| sponsor_collapse | 3 | 3 | 2 | 2 |
| treasurer_resigned | 3 | 3 | 0 | 1 |
| phantom_salaries | 3 | 3 | 2 | 2 |
| club_to_club_loan | 3 | 3 | 0 | 2 |
| fundraiser_vanished | 3 | 3 | 0 | 2 |
| coach_meltdown | 3 | 3 | 2 | 2 |

**Totalt:** 70 strängar.

---

## NOTERINGAR FÖR CODE

1. **`municipal_scandal` är ny arketyp** — kan drabba managed club.
   Tidigare regel ("egen klubb träffas aldrig av lager 1") luckras upp
   för just den här typen. Mekaniskt: kommunbidraget kan halveras
   eller frysas i 5-8 omgångar. Variant: positiv version där politiker
   stöttar (extra bidrag, prestige-bonus). 50/50 negativ/positiv vid
   trigger.

2. **Token-utökning:** `{POLITIKER}` ersätts av en slumpad politiker
   från `POLITICIAN_PROFILES` i `politicianData.ts`. `{PARTI}` är
   politikerns partibeteckning.

3. **Reviderade fördelningar** kräver justering av
   `SCANDAL_TYPE_DISTRIBUTION` i `scandalService.ts`.

4. **Sponsorbeloppen** — uppdatera `applyScandalEffect` för
   `sponsor_collapse`: byt -400k engångs mot -30k engångs + -3k/v
   reduktion av sponsorIncome resterande säsong.

5. **`coach_meltdown`-tonen är vuxen** — om Anthropic/spelpolicy kräver
   tydligare distansering kan en flaggparam läggas till. Min bedömning:
   tonen är inom ramarna — ingen förhärligar missbruk, det refereras
   genom understatement.
