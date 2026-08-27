# DOM — FRAMGÅNGSKURVAN (ersätter O5:s scope)

**Datum:** 2026-08-27 · **Av:** Opus
**Underlag:** `BANDY_MANAGER_AUDIT_6_SASONGER_2026-08-26.md` H2, H3, H6. Sex säsonger, två karriärer, mobilbredd.
**Ersätter:** `DOM_FRAMGANGSEKONOMIN_2026-08-17.md`s ramverk. Krafterna som byggdes står kvar; scopet var fel.

**Arbetskartan körd.** Fråga 1: H2/H3/H6 är tre symptom på ett fel, inte tre poster. Fråga 2: tre säsonger i verklig genomspelning väger tyngre än sex stresstestomgångar — de mäter upplevd konsekvens, inte fördelning. Fråga 3: kurvan dör vid säsong tre, alltså mitt i en tioårskarriär. Fråga 4: vi byggde nedåtriktningen i två veckor och aldrig uppåtriktningen. Fråga 7: auditen ger kriteriet — minst ett minnesvärt avstående per säsong för en dominant klubb.

---

## Vad som faktiskt är fel

`O5` byggdes som tre krafter: löneinflation med rykte, driftskostnad för byggt, styrelsekrav vid två miljoner.

**Alla tre är kostnader. Ingen är ett konkurrerande anspråk.**

Och en kostnad du kan betala är ingen kostnad. Med 2,3 miljoner i kassan är tio tusen i månaden för en spelare med 91 i förmåga inte ett beslut — det är en kvittering. Auditens egen mening: *jag såg inget beslut år tre där båda alternativen sved.*

Vi mätte fel sak i sex kalibreringspass. Fördelningen av kassan var rätt; det som saknades var att pengarna skulle vara **efterfrågade av flera samtidigt**.

---

## Principen

**Framgång ska skapa anspråk som konkurrerar om samma resurs, inte kostnader som dras från den.**

Ett ja ska vara ett nej någon annanstans. Det är samma sats som varsel-mallens femte punkt — två system som pekar isär — men tillämpad på ekonomin i stället för på en enskild händelse.

**Testet:** om en spelare kan säga ja till allt är inget av det ett val.

---

## Fyra anspråk, och de ska vara aktiva samtidigt

### 1 · Truppen vill ha det den är värd

En trupp som vunnit ligan tre år har spelare som vet det. Lönekrav vid förlängning ska följa **spelarens egna prestationer**, inte bara klubbens rykte — en skyttekung kräver mer än en reserv i samma klubb.

Det som gör det till ett anspråk: du kan inte betala alla. Väljer du toppskytten kan du inte hålla halvbacken.

### 2 · Framgång kostar folk

En dominant klubb blir en rekryteringsbas. Bud på dina bästa spelare ska komma **oftare** när du vinner, inte lika ofta.

Att behålla någon kostar pengar; att sälja kostar laget. Det är två system som pekar isär, och underlaget finns: `transferBidReceived` är redan en 5/5-systemhändelse.

### 3 · Styrelsen vill se pengarna arbeta

`investSurplus` finns men mäter saldo. Den ska mäta **investering** — har klubben byggt, förlängt, värvat? En kassa som växer utan att något händer är ett misslyckande i styrelsens ögon, inte en framgång.

Och den ska konkurrera med de två ovan: pengar som går till löner går inte till anläggningar.

### 4 · Orten vill ha sin del

En klubb som blivit stor har förpliktelser den inte hade som liten. Kiosken, ungdomsverksamheten, hallen — `communityStanding` ska **kosta mer att hålla uppe** när klubben är framgångsrik, för förväntningarna har stigit.

Det är den enda av de fyra som är helt obyggd, och den knyter framgångskurvan till ortsystemet i stället för att göra den till ren bokföring.

---

## H3 — utmattningen, och varför den hör hit

Auditen: fyra spelare startade finalen på 22–34 % kondition och klubben vann ändå 20–2–0.

`B9` gav positionsviktad utmattning och `O4` gav informationskvalitet. Ingen av dem gör trötthet **bindande** — de gör den synlig.

**Domen: trötthet ska kosta tillgänglighet, inte prestation.** En spelare under en tröskel ska ha förhöjd skaderisk och kunna bli otillgänglig nästa match. Då blir rotation ett tvång i stället för ett råd, och truppdjup blir en resurs som konkurrerar med de fyra anspråken ovan.

Att sänka prestationen är ett dolt straff. Att ta spelaren ur laget är en konsekvens man kan planera runt.

---

## H6 — ceremonin

SM-guldets CTA lovar en ceremoni som inte kommer i snabbläget. `CeremonySmFinal` finns och är wirad i fullmatchskärmen.

**Bygg den gemensamma vägen.** Att döpa om knappen är det billiga svaret, och framgångens största ögonblick ska få mer payoff, inte mindre — särskilt när hela domen ovan handlar om att framgång ska kännas.

---

## Vad domen inte är

**Inte högre kostnader.** Att skruva upp löner eller drift ger samma kurva förskjuten. Problemet är strukturen, inte talen.

**Inte att framgång ska straffas.** En dominant klubb ska kunna dominera. Den ska bara inte kunna göra det **utan att välja bort något varje säsong**.

**Inte en ny ekonomi.** De tre `O5`-krafterna står kvar. Det som saknas är att anspråken ska vara samtidiga och synliga som konkurrerande.

---

## Rapportera innan bygge

1. Vad avgör lönekrav vid förlängning i dag? Läser det spelarens säsongsprestation alls?
2. Hur ofta genereras inkommande bud, och skalar frekvensen med klubbens framgång?
3. Kan `investSurplus` mäta investering i stället för saldo, och vad finns att mäta mot?
4. Finns någon mekanism där `communityStanding` blir dyrare att hålla när klubben växer?
5. Kan trötthet göra en spelare otillgänglig, eller sänker den bara prestationen?

**Fråga 5 avgör om H3 är en kalibrering eller ett bygge.**

---

## Godkänd när

En spelare som vunnit ligan tre år i rad kan namnge minst ett avstående per säsong — något hen ville ha och inte kunde ta.

I dag kan hen namnge noll, och det är därför den svaga karriären kändes mer levande än dynastin.
