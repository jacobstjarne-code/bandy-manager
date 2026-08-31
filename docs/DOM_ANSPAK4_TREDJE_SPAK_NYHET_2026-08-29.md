# DOM — ANSPÅK 4, TREDJE SPAKEN: nyhetstretmillen

**Datum:** 2026-08-29 · **Av:** Opus · **Beslut:** Jacob (väg A — bygg en verklig kostnad; ramen "ett topplag måste hela tiden hitta på nytt, annars blir supportrarna uttråkade"). Utökar `docs/DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md` med den spak de två godkända knapparna saknade.

## Varför en tredje spak behövs (mätt)
Code:s bygge (`96deea39`) visade att domens premiss var fel: att hålla orten nöjd KOSTAR inte, det TJÄNAR (3/9 aktiviteter gratis, 4 nettoplus). Att finansiera orten är +212 tkr/säsong BÄTTRE än att släppa den. Patron-hypotesen som skulle stänga gapet är refuterad (symmetrisk, för liten). Kriterium 1 ("bägge sidor svider") kan alltså inte nås med knob 1+2 — det finns ingen kostnad att väga mot truppen. Jacob godkänner en mandatutvidgning: en verklig kostnad, byggd som ett synligt val, inte en dold dränering.

## Domen — nyhet som färskvara

Ramen: en aktivitet är inte en permanent CS-källa. Supportrarna vänjer sig. Samma kiosk, samma lotteri, samma skolbesök år efter år ger allt mindre — de har sett det. **En aktivitets CS-effekt faller med hur länge den varit klubbens stående erbjudande (staleness).** Det är boredomen, gjord mekanisk.

För att hålla CS måste klubben komma med NYTT — en ny aktivitet, en uppgraderad variant, ett större grepp. **Nyheten återställer färskheten men kostar riktiga pengar** (till skillnad från de befintliga, som går plus). Det är den verkliga kostnaden som konkurrerar med truppen: pengarna till nästa grej är pengar som inte går till spelarköp eller lön.

**Och tretmillen accelererar med storlek.** Ett topplags supportrar är mer bortskämda — de gäspar snabbare. Staleness växer fortare ju större klubben är (knob 1:s rep-axel, nu med en begriplig orsak: jaded publik). En liten klubb kan köra samma kiosk i åratal; ett topplag måste rotera hela tiden. Så en stor klubb spenderar mer och oftare på nyhet bara för att stå still — och där konsumeras dominantöverskottet.

Valet som svider: betala för nästa nyhet (pengar från truppen) ELLER låt orten tröttna (CS glider → tappad publikintäkt via väg B:s 0,45 + de textade mecenat/patron-uttågen). Bägge sidor kostar nu.

### Mekanik (Code, bygger PÅ knob 1+2)
- **Staleness per aktivitet:** en aktivitets positiva csBoost faller med antal säsonger den varit aktiv (en kontinuerlig avtrappning, inte en binär tröskel — D031:s anda). Golv > 0 (en stående aktivitet slutar aldrig ge NÅGOT, bara mindre).
- **Storleksacceleration:** staleness-takten skalar med reputation via `csLinearRamp` — liten klubb: långsam; topplag: snabb. Detta ÄR knob 1, omtolkad. Behåll knob 1:s mätta faktor (0,85) som utgångspunkt, mät om mot det nya stalenessgolvet.
- **Nyhetsinvestering (den nya kostnaden):** en aktivitet kan "förnyas" (ny variant / uppgraderad tier) för en verklig kostnad som återställer dess färskhet. Kostnaden och den takt den behövs skalar med storlek. Detta är den tredje spaken — riktiga kronor, inget nettoplus.
- **Synligt val, inte dränering:** förnyelsebehovet surfar som ett dashboard-beslut (HIGH 11: "denna månad"-nivå för normalt, "måste"-nivå bara om CS är på väg under en uttågströskel). Spelaren SER "supportrarna tröttnar på X — förnya för Y kr?" och VÄLJER. Aldrig en tyst post från kassan.

### SKYDDAT
- **Små klubbar och Survive orörda:** vid låg rep är staleness-takten ~0 och nyhet behövs sällan. Orten är Survive-klubbens spak (H4) — gör den inte till en tretmill för dem.
- **Holdbarhet:** en stor klubb ska KUNNA hålla CS med förnyelse, bara dyrt. Aldrig omöjligt (samma anti-hård-vägg som D031).
- **Ingen dubbelräkning:** uttågen är konsekvensen av låg CS, tretmillen är trycket. Nyhetsinvesteringen sänker inte CS — den UTEBLIVNA investeringen låter staleness sänka den.
- **Ingen passiv dränering:** kostnaden är alltid ett val (förnya eller låt tröttna), aldrig en automatisk avdragspost.

### GODKÄNT NÄR (ommätt, med rätt rykte + aktiv patron)
1. **Kriterium 1 UPPNÅTT:** för en stor klubb kostar det att hålla orten nöjd MER än den intäkt en hög CS ger — att finansiera orten är inte längre +212 tkr bättre än att släppa den. Bägge sidor svider.
2. **Konsumerar överskottet:** en dominant klubb som håller orten fräsch ser sitt nettoöverskott krympa mätbart (~dominantöverskottet äts).
3. **Liten klubb + Survive opåverkade;** holdbarhet intakt; ingen dubbelräkning.
4. Magnitud (staleness-takt, nyhetskostnad, storleksskalning) via mätning. **D-fact krävs.**

## Ägarskap & timing
Detta är del av den KONSOLIDERADE baskonomi-omhärledningen (A-H2-raden): bygg tretmillen, omhärled WEEKLY_BASE_FLAT och mittenlag-break-even, och mät anspåk 4 mot kriterium 1 — allt i ETT pass mot de fixade ingångarna (rykte, patron), inte fler punktfixar. Opus: denna dom + texterna ("supportrarna tröttnar på X", förnyelse-beslutets copy, nyhetsvarianterna) när Code:s stalenessmodell finns. Code: bygg → mät 1–4 → D-fact → commit. Jacob: mandatet är givet (väg A); nästa gång du behövs är om mätningen kräver en magnitud- eller balanskall.
