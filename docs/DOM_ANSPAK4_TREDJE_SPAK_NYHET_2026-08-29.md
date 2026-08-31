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
- **Synligt val, inte dränering:** förnyelsebehovet surfar som ett dashboard-beslut på HIGH 11:s "denna månad"-nivå. Spelaren SER "supportrarna tröttnar på X — förnya för Y kr?" och VÄLJER. Aldrig en tyst post från kassan. **MÅSTE-ESKALERINGEN STRUKEN 2026-08-31:** domens tidigare "'måste'-nivå om CS är på väg under en uttågströskel" byggdes inte och byggs inte — måste-listan är stängd på TYPNIVÅ (Jacobs HIGH 11-dom: contractRequest + licenseHandlingsplan), och ett per-instans-tier-åsidosättande skulle öppna den stängda dörren. Redundant ändå: när CS faktiskt kraterar fyrar mecenat/patron-uttågen (month/brytpunkt) — spelaren varnas där.

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

---

## VÄG C — konsekvensen flyttar från CS till PUBLIK (Jacobs beslut 2026-08-31)

**Varför:** D038 mätte att nyheten inte bet — att förnya köpte +0,3 CS för 318 tkr, så "håll men förnya aldrig" dominerade. Rotorsak: staleness rör bara aktiviteternas 0,67 CS medan volontärbonusen (1,5) bär hela ortsspaken. CS är fel spak. Jacobs ram — "supportrarna tröttnar" — ÄR att de slutar komma. Alltså: nyhetens konsekvens är PUBLIK, inte CS. Rent pengar-mot-pengar, och det sidsteppar att CS domineras av volontärer.

### Mekanik (Code, kodläst mot economyService.ts)
- **TA BORT staleness från aktiviteternas csBoost** (D038:s nyhets-på-CS-bit — den tandlösa). BEHÅLL: förnyelsemekaniken (kostnad 25→100 tkr rep-skalad, cooldown 6), staleness-KURVAN (retention^s per aktivitet), och knob 1/2 (rep-skalad CS-baslinje). Bara KONSEKVENSEN av staleness flyttar.
- **Aggregera** klubbens per-aktivitets-staleness till en `ortFreshnessFactor` ∈ [golv, 1,0]. Färsk klubb → 1,0; stor klubb med stale aktiviteter → mot golvet.
- **`computeAttendanceRate` får en `freshnessFactor`-parameter (default 1,0)**, multiplicerad in i den slutliga raten (inom det befintliga `ATTENDANCE_CAP`). Båda anroparna — `calcRoundIncome` (intäkt) och `calcAttendance` (den visade siffran) — skickar klubbens freshness. SAMMA delade funktion, forka den inte (den är medvetet en sanning, ett ställe).
- **Förnyelse** återställer staleness → freshness → publik. Den konkurrerande fordran är nu ren: förnyelsekostnad mot tappad publikintäkt.

### SKYDDAT
- **Freshness är OBEROENDE av CS** — det är hela poängen. En separat multiplikator, inte en CS-term. En stor klubb tappar de uttråkade marginalfansen även med hög CS.
- **Små/Survive:** vid låg rep är staleness ~1,0 → freshness 1,0 → opåverkade. Verifiera.
- **Golv > 0 (holdbarhet):** en helt stale stor klubb drar fortfarande MERPARTEN av sin publik — freshness-golvet är den marginella "uttråkade"-förlusten, aldrig en kollaps. Aldrig omöjligt att hålla.
- **Väg B:s attendance-vikter** (fanMood/CS/position/cap) orörda — freshness är en ny multiplikator ovanpå. **economyService aktivitetsintäkter orörda.**

### GODKÄNT NÄR (ommätt)
1. **Bägge sidor svider I KRONOR:** FÖRNYA vs SPARA (coasta, låt stale) netto/säsong — coasting tappar nu nog publikintäkt att förnyelse är konkurrenskraftig, inte "förnya aldrig"-dominant. +0,3 CS-problemet borta; frågan är kronor mot kronor.
2. En stor klubb som aldrig förnyar ser publik/intäkt synligt erodera (läsbart "supportrarna slutade komma").
3. Små/Survive opåverkade (freshness 1,0, mätt).
4. Holdbarhet: förnyelse återställer alltid publiken till en kostnad; en stale klubb kraterar aldrig (golvet).
5. Konsumerar överskottet (förnyelsekostnaden, nu genuint betald för att den är värd publiken).
Magnitud (freshness-golv, staleness→freshness-aggregeringen, per-aktivitets-vikt) via mätning. **D-fact (D038-tillägg) innan commit.**

### Text — orörd
Förnyelsetexten (`communityRenewalText.ts`, skriven 2026-08-31) passar väg c ord för ord: "{wear} av **dragningskraften** finns kvar" — dragningskraften ÄR publikdraget. `{wear}`-token pekas bara om från CS-staleness-multiplikatorn till `ortFreshnessFactor` (samma begrepp, publiksidan).

### Ägarskap
Code: flytta konsekvensen (bort staleness-på-CS, in freshness-på-publik), mät 1–5, D-fact, commit. Opus: dömer ommätningen om den landar i gråzon — särskilt holdbarhets-golvet och Survive.

### MÄTNING 1 MISSLYCKADES → REKALIBRERING (2026-08-31)

Mätning 1: SPARAR (aldrig förnya) netto **+288 tkr/säsong MER** än FÖRNYAR för dominant. Förnyelse kostar 318 tkr, köper +0,028 freshness / +18 åskådare ≈ 21 tkr publikintäkt. ~15× fel håll — SAMMA fel som väg a, flyttat från CS till kronor.

**Diagnos — två fel, kopplade. Naiv "bit hårdare på freshness" fixar det INTE (holdbarhetsväggen):**
1. **Staleness rör knappt freshness (+0,028).** En dominant klubb som aldrig förnyar ska driva till LÅG freshness (~0,6–0,7), inte 0,97. Aggregeringen/kurvan är för flat — erosionen när man INTE förnyar måste vara brant.
2. **Förnyelsekostnaden (318 tkr) sattes för SURPLUS-KONSUMTION, men publikspaken — bunden av holdbarhet — kan inte motivera den kostnaden.** För att 318 tkr ska betala sig måste staleness förstöra >318 tkr publikintäkt = ~60 % av en dominant klubbs matchintäkt. Det kraterar en stale klubb → bryter holdbarhet.

**Rekalibrering (KOPPLAD, inte bara freshness-magnituden):**
- a. Staleness ska FAKTISKT flytta freshness — brant erosion när man inte förnyar.
- b. Förnyelsekostnaden NER till under den holdbarhets-bundna publikintäkten-i-risk. Kostnaden var dimensionerad för surplus; den måste rymmas under holdbarhetstaket.

**Prioritet (medveten avvägning, Opus-dom):** kriterium 1 (förnyelse BETALAR) VINNER över surplus-konsumtion. Förnyelse blir ett proportionerligt betalande val; konsumerar mindre surplus. Holdbarhet är den HÅRDA gränsen — en helt stale dominant klubb tappar en meningsfull men inte kraterande andel.

**Strukturell gräns (ärlig):** väg c kan vara ett proportionerligt betalande val ELLER en stor surplus-sink, inte båda — holdbarhet kapar hur mycket publik staleness får förstöra, vilket kapar kostnaden. Om dominantöverskottet fortfarande behöver konsumeras (verifiera först att det ens är stort vid `WEEKLY_BASE_FLAT`=3000) är det en SEPARAT spak, inte tretmillen. Försök inte tvinga tretmillen att bära båda — det var det som gick sönder.

**GODKÄNT (oändrat i andan):** FÖRNYA ≥ SPARAR (förnyelse betalar), en aldrig-förnyande dominant klubb tappar synlig publik, stale klubb kraterar aldrig (golv), små/Survive orörda. Magnitud (freshness-erosion, kostnad, golv) via mätning + D-fact.
