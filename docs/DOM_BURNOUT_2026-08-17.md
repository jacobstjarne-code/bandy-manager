# DOM — BURNOUT

**Datum:** 2026-08-17 · **Av:** Opus · **Post:** O4 i `SLUTTEST_KO.md`
**Underlag:** fyra auditer, samma fynd i alla fyra.

---

## Fyndet

Burnoutkortet visades varje säsong från år två. Texten sade att tränaren behövde vila "på riktigt". Det fanns ingen väg att lätta schemat, delegera, ta ledigt eller acceptera en kostnad.

`managerProfileService:146-185` räknar värdet ur de tre senaste förlusterna, beslutströtthet och oläst inkorg, och minskar det vid seger eller naturlig decay. En sökning efter konsumenter hittade visning och narrativ logg. **Ingen gameplay-effekt någonstans.**

Efter många omgångar slutade signalen betyda fara och blev bakgrundsbrus. Stickiness-auditens formulering: en mätare med retorisk tyngd men utan en full loop.

---

## Domen: spelbar, inte nedtonad

Båda vägarna var giltiga. Jag väljer den spelbara av tre skäl.

**Mätaren finns redan och är väl konstruerad.** Tre senaste förluster, beslutströtthet, oläst inkorg — den mäter faktiskt hur pressad managern är, och den mäter det ur spelarens eget beteende. Att tona ned en fungerande mätare för att ingen kopplade in den är att kasta bort arbetet.

**Det saknas en resurs som inte är pengar.** Framgångsekonomin (`O5`) gör kronor knappa igen, men ett spel där allt kostar samma sak har bara en spak. Managerns egen kapacitet är en andra valuta, och den är redan modellerad.

**Den bär `O3` och Sommaren.** Spelarens eget säsongsmål och sommarens återhämtning blir båda tyngre om det finns något att återhämta sig *från* som faktiskt biter.

---

## Vad som byggs

### Effekten — en, inte fem

Hög burnout ska göra **en** sak: försämra kvaliteten på den information spelaren får.

Vid `Under press`: assistentens taktikrekommendation uteblir ibland. Motståndaranalysen blir grövre — "farliga forwards" i stället för namn och siffror.

Vid `Utmattad`: rekommendationen uteblir oftare. Spelarbetygen efter match visas med en dags fördröjning. Inkorgens sammanfattning slutar prioritera.

**Varför informationskvalitet och inte prestation:** en utmattad manager fattar sämre beslut därför att hen ser sämre, inte därför att laget plötsligt spelar sämre. Det senare vore ett dolt straff — samma sak jag avvisade när det gällde rivalernas catch-up-budget. Det förra är begripligt, synligt och möjligt att spela runt.

### Handlingarna — tre, med verkliga priser

**Delegera pressen.** Assistenten tar presskonferensen. Burnout sjunker. Priset: du tappar relationen till journalisten, och svaret blir det assistenten hade valt — inte ditt.

**Sänk träningsintensiteten en period.** Burnout sjunker. Priset: spelarutvecklingen bromsar under perioden.

**Be styrelsen om andrum.** Burnout sjunker mest. Priset: `boardPatience` faller. Det här är den enda handlingen som kan kosta dig jobbet, och den ska vara synlig som sådan.

Alla tre uppfyller innehållskontraktet (`O11`): trigger är burnout-zonen, effekten är ett tal i ett känt fält, livslängden är angiven, återkallningsytan är Granska och årsboken.

**Ingen av dem är gratis.** En återhämtning utan pris är en knapp, inte ett val — `O2`.

### Sommarens roll

`5.1` har redan regeln: återhämta hälften av avståndet ner till 30, aldrig under 30 om värdet låg över 60. Den står.

Golvet betyder att en manager som körde sig i botten bär något in i nästa år. Med den här domen betyder det något konkret: du börjar säsong tre med sämre information tills du gör något åt det.

---

## Vad domen INTE är

**Inte en straffspiral.** Alla tre handlingarna ska vara tillgängliga i varje zon. Är du utmattad ska du kunna ta dig ur det — till ett pris.

**Inte fler mätare.** `burnoutScore` finns. Zonerna finns (`getBurnoutZone`). Ingen ny siffra.

**Inte högre volym.** Burnoutkortet visas i dag varje säsong och blev brus. Med `D1` ska det vara ambient tills zonen ändras — då är det normal. Aldrig pivotal.

---

## Texten

Kortet ska säga vad som händer, inte hur det känns. Det senare finns redan i `BurnoutMark`s citat och de ska stå kvar som atmosfär.

**Under press:** *Du hinner inte förbereda som du vill. Det märks på vad du ser.*
**Utmattad:** *Du läser inte rapporterna längre. Du bläddrar förbi dem.*

**Handlingarna:**
- *Låt assistenten ta pressen* — "Han säger det du hade sagt. Ungefär."
- *Sänk tempot på träningen* — "Laget vilar. Utvecklingen väntar."
- *Be styrelsen om andrum* — "De lyssnar. De räknar också."

---

## Beroenden och ordning

**Kan byggas oberoende av `O5` och `U1`** — till skillnad från varsel-mallen. Burnout är en egen valuta och kräver inte att kronor är knappa.

**Kräver `D1`** för att vetas hur kortet ska väga i olika zoner.

**Bygg i denna ordning:** effekten först (informationskvaliteten), sedan handlingarna. Effekten ensam gör mätaren verklig; handlingarna utan effekt är knappar som löser ett problem som inte finns.

**Rapportera först:** var i koden konsumeras assistentens taktikrekommendation och motståndaranalysens detaljnivå? Går de att gradera, eller är de binära? Det avgör om effekten kan byggas som beskriven.

---

## Godkänd när

En spelare kan säga vad burnout kostade hen — och vad hen gjorde åt det.

I dag kan ingen säga något av de två.
