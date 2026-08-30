# DOM — HIGH 11: dashboardens beslut i tre nivåer

**Datum:** 2026-08-29 · **Av:** Opus · **Beslut:** Jacob (tre nivåer, måste = kontraktsdeadline + licenskrav) · **Utlöst av:** audit 2026-08-29 HIGH 11 + DecisionCard-hierarki (visuell LOW).

## Fyndet (kodläst, `decisionBudgetService.ts`)

Idag: en PLATT budget — max 3 aktiva beslut (säsong 1 omg 1: max 1), överskott till `deferredDecisions` (max 10, äldst först). Vid rollover nollställs `deferredDecisions` helt (`seasonEndProcessor.ts`, `deferredDecisions: []`). Ingen nivåskillnad: en kontraktsdeadline throttlas bakom bakgrundsbrus av 3-taket, och en obesvarad hög (auditen såg 7–9) försvinner tyst vid säsongsbyte utan utfall. `DecisionCard` renderar alla med samma skal och vikt — dramatisk hierarki försvinner.

## Domen

Tre nivåer i stället för en kö. Nivån är en TAGG på varje beslut/event, satt vid generering.

**1 · Måste före nästa match** — deadline-drivna oåterkalleliga förluster. Bryter framåtrörelsen. **Medlemskap (Jacobs dom): kontraktsdeadline och licenskrav/handlingsplan.** Principen: agerar du inte före fristen förlorar du något oåterkalleligt (spelaren lämnar gratis; handlingsplanens frist går ut). Måste-nivån är UNDANTAGEN throttlen — den surfar alltid som det primära kortet, throttlas aldrig bakom 3-taket, defereras aldrig. En deadline kan inte vänta på budget.

Skada-som-kräver-laguppställning hör INTE hit — den har inget oåterkalleligt deadline-straff (autofyllen tar den, och A3 varnar redan i uppställningen). Den bor i uppställningsflödet, inte som dashboard-kort.

**2 · Denna månad** — väntar begripligt men syns. Sponsor, mecenat, anläggning. Batchas till ETT sekundärt kort med räkning ("3 väntar"), inte tre likvärdiga kort.

**3 · Bakgrund** — press, orten, småval. Hålls tyst tills spelaren öppnar dem. Ingen dashboard-yta.

### Visning
Högst ETT primärt kort (översta måste, annars översta månad) + ETT batchat sekundärt (resten av månad, räknat). Bakgrund syns inte förrän spelaren går in i respektive system.

### Rollover — aldrig tyst
Den nuvarande engros-nollställningen av `deferredDecisions` är FÖRBJUDEN. Vid rollover får varje obesvarat beslut ANTINGEN:
- ett dokumenterat default-utfall (tillämpat + EN inboxrad: "X löstes av sig självt: [utfall]"), ELLER
- en uttrycklig utrinning ("X hann aldrig behandlas och rann ut").

Varje defererbart event måste alltså deklarera sitt default-utfall. Ett måste-event som skulle rinna ut med en oåterkallelig förlust ska dessutom få en förvarning FÖRE fristen ("2 kontrakt löper ut om 3 omgångar" — auditens MEDIUM 16, exakt).

### DecisionCard — tre semantiska nivåer (skild axel från tier)
Tier styr NÄR/VAR kortet surfar; nivån styr HUR det ser ut. Tre lägen i samma system, inte sex komponenter: **lågmäld notis · verkligt dilemma · dramatisk brytpunkt.** Varje event deklarerar sitt läge; läget styr visuell vikt. En måste kan vara ett dilemma (kontrakt: betala/sälj) eller en brytpunkt (licens nekad); en bakgrund är en lågmäld notis.

## SKYDDAT — rör inte
Throttlen (max 3 aktiva, säsong 1 omg 1 = 1) står kvar för månad/bakgrund — det är rätt anti-överbelastning. Bara måste är undantagen. Bygg inte om DecisionCard till sex handgjorda komponenter; tre lägen i det befintliga skalet.

## Ägarskap
Mest Code: tier- + läges-taggar på event-typerna, undantag för måste från throttlen, visningsregeln (ett primärt + ett batchat), och rollover-passet (resolve-or-expire per event-typ i stället för engros-clear). Opus-text: rollover-raderna (default-utfall + utrinning, per event-typ när Code:s pass finns), förvarningsraden ("N kontrakt löper ut om M omgångar"), och ev. läges-etiketter. Jacob: tier-medlemskapet är dömt (måste = kontraktsdeadline + licenskrav).
