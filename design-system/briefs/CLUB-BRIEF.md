# CLUB-BRIEF · Bandy Manager
*Klubbidentitet för de 12 bruksorterna. Drivs i FAS 4.*

---

## 🎯 Uppdraget

Ge varje klubb en **själ**, inte bara en logotyp. I bandyvärlden ÄR klubbmärket klubben — det sitter på mössan, på halsduken, på bruksportens skylt. Just nu är alla 12 klubbmärken generiska SVG-shields i `ClubBadge.tsx` med stereotyp­symboler (hammer, star, crown, elk, axe…). Det är **ontologisk brist**, inte bara estetisk.

Varje klubb förtjänar:
1. **Research** — bruksortshistoria, industri, lokal symbolik
2. **Märke** — handtecknat/vektoriserat, unikt, *inte* generic shield
3. **Stadssilhuett** — skorstenar, kyrktorn, bro → bakgrund i NextMatchCard
4. **Devis** (motto) — 1 rad på svenska
5. **Färger** — dominerande + stöd, kompatibel med systemets koppar/läder
6. **Supportergrupp** — namn + karaktär (kort text)
7. **Derby-paret** — vem är klubbens ärkerival?

---

## De 12 klubbarna

| # | Klubb | Ort | Län | Status idag |
|---|---|---|---|---|
| 1 | Forsbacka BK | Forsbacka | Gävleborg | Delvis utvecklad (devis "Hårda bollar. Hårda tag.") |
| 2 | Söderfors BK | Söderfors | Uppland | Placeholder |
| 3 | Västanfors BK | Västanfors | Västmanland | Placeholder |
| 4 | Karlsborgs BK (KBK) | Karlsborgsverken, Kalix | Norrbotten | Placeholder |
| 5 | Målilla BK | Målilla | Småland | Placeholder |
| 6 | Gagnef BK | Gagnef | Dalarna | Placeholder |
| 7 | Hälleforsnäs BK | Hälleforsnäs | Södermanland | Placeholder |
| 8 | Lesjöfors BK | Lesjöfors | Värmland | Placeholder |
| 9 | Rögle BK | (Skåne) | Skåne | **Ironisk blinkning** — BK står för *Bandyklubb*. SHL-hockeyklubben Rögle BK var från början bandyklubb. Behålls som inside joke. |
| 10 | Slottsbron BK | Slottsbron | Värmland | Placeholder |
| 11 | Skutskär BK | Skutskär | Uppland | Placeholder |
| 12 | Heros BK | Smedjebacken | Dalarna | Placeholder |

**Alla 12 klubbar är nu verifierade.** Designanteckningar per klubb nedan.

### Noterade insikter från användaren

- **Rögle BK** är med som *ironisk blinkning*. I verkligheten är SHL-hockeyklubben Rögle BK ursprungligen en bandyklubb — BK står för *Bandyklubb*. Spelet behåller namnet som inside joke mot svensk idrottshistoria. **Skånes** är Sverige­ligans sydligaste klubb, utan bruksorts­industri men med pastoral västerländsk klangfärg (åkrar, gårdar, vindriktning).
- **Karlsborgs BK (KBK)** är från *Karlsborgsverken* utanför Kalix i Norrbotten — ett industri­samhälle kopplat till SCA:s sulfat­massa­bruk. Inte att förväxlas med Karlsborgs fästning i Västergötland.
- **Heros BK** är från *Smedjebacken* i Dalarna. "Heros" är klubbens historiska namn (antikt-klingande, 1910-tals idrotts­romantik — passar spelets nostalgiska tonlag).

---

## Research-fält per klubb

För *varje* klubb, samla in (i research-dokumentet):

### Historisk/kulturell profil
- **Dominerande industri** (idag + historiskt): järnbruk, pappersbruk, sågverk, stålverk, kopparhantering, smide, textil, mekanisk verkstad
- **Grundningsår** (av bruket/orten): årtal ger åldersdjup
- **Folkmun­symbolik**: vad associeras orten med lokalt? "Stålhjärtan", "Pappersmän", "Sågspån­orten"
- **Kyrktorn/landmärken**: den visuella siluetten
- **Vattendrag**: de flesta bruksorter har en fors/älv (ortsnamnet slutar ofta på -fors, -bron, -strand)
- **Nuvarande befolkning**: liten (500–3000) påverkar läktar­skildringen
- **Kända personer** från orten (idrott eller annat): kan bli spelarnamn-inspiration

### Fiktiv klubbhistorik
- **Klubbgrundning** (fiktivt år): välj 1918–1935 för att matcha riktig bandy-era
- **Guldsäsonger** (fiktiva): 1–2 guldår i klubbens historia, 70-tal eller 80-tal
- **Hedersspelare**: en fiktiv legend vars nummer hängts upp
- **Arenans namn** (finns i `worldGenerator.ts` — verifiera): ofta lokalt-klingande
- **Supportergruppens namn** (finns i `worldGenerator.ts` — verifiera)

### Visuell identitet
- **Dominerande klubbfärg**: *en* färg (djup blå, mörkröd, grön, etc.). Ska kontrastera mot de 11 andra så alla är urskiljbara.
- **Stödfärg**: vit, guld, svart, creme
- **Kontrastfärg för bortatröja** (ofta inverterad)
- **Primär symbol** i märket: en konkret sak från ortens historia
- **Sekundära detaljer**: vattenlinje om orten är vid älv, klocka om kyrktornet är landmärke, etc.

---

## Märket — designspec

### Format
- **SVG vektor**, viewBox `0 0 64 64` (eller `128 128` för högre detalj)
- **Badge-form**: inte alla ska vara shields! Variera formen för att ge igenkänning:
  - Vapensköld (traditionell bandy-badge)
  - Rund medalj (festlig, öppen)
  - Rektangulär skylt (industriell, bruksorts-aktig)
  - Oregelbunden silhuett (av klubbens landmärke)

### Stil
- **Platt eller svag 2-tons grafik**. Inga gradienter, inga skuggor, ingen bling.
- **Max 3 färger** per märke (dominerande + stöd + kontur/detaljer)
- **Tjock kontur** som matchar karaktärs- och ikonsystemet (2 px vid 64 px)
- **Typografi inuti märket**: Georgia eller en retro sans. **INTE** modern grotesque. Årtal ofta med, t.ex. "STIFTAD 1924"
- **Symbolik­tradition**: 
  - Järnbruk → hammare, städ, masugn
  - Sågverk → stock, sågblad
  - Pappersbruk → pappersrulle, ark
  - Kopparhantering → kopparkittel, degel
  - Älv/bro → vattenlinje, bro
  - Jordbruk → plog, ax, kvarnhjul
- Välj **den riktiga industrin** för orten, *inte* stereotyp

### Exempel på riktning per klubb (förslag att validera)

**Forsbacka BK** — Forsbacka är känt för *Forsbacka jernverk* (järnbruk, en av Sveriges äldsta). 
- Färger: **djup mörkröd + creme + järn­svart kontur**
- Symbol: **masugns­öppning** framifrån, med gnistor
- Form: rektangulär skylt (bruks­industriell)
- Devis: "Hårda bollar. Hårda tag." (redan etablerat — behåll)
- Supportergrupp: "Jernbärarna"

**Söderfors BK** — Söderfors är känt för *Söderfors bruk* (järnmanufaktur, välkända handsmidda ankare).
- Färger: **stålblå + creme + svart**
- Symbol: **ankare** (bruket tillverkade Krigs­marin­ankare i sekler)
- Form: rund medalj
- Devis: "Ankrade i orten."
- Supportergrupp: "Ankarklacken"

**Lesjöfors BK** — Lesjöfors är känt för *Lesjöfors AB* (fjädrar, mekanisk verkstad).
- Färger: **koppargrön + gul ocker**
- Symbol: **stålfjäder** (skruvfjäder, vertikal, stiliserad)
- Form: avlång vertikal sköld
- Devis: "Vi fjädrar tillbaka."
- Supportergrupp: "Fjädraklacken"

**Slottsbron BK** — Slottsbron är en pappersbruksort vid Vänern.
- Färger: **mörkblå + kalkvit**
- Symbol: **bro över vågor** (ortsnamnet är bokstavligt)
- Form: vapensköld med vågkant
- Devis: "Över vattnet, över dom."
- Supportergrupp: "Brobyggarna"

**Skutskär BK** — Skutskär är industrisamhälle (Stora Enso, cellulosa).
- Färger: **skogsgrön + creme**
- Symbol: **cellulosa-ark** (3 staplade, lätt böjda)
- Form: rektangulär
- Devis: "Pappret håller."
- Supportergrupp: "Maskinhallen"

**Gagnef BK** — Gagnef är en folklig Dalaort, jordbruk + småindustri.
- Färger: **Dalarna-röd + varm gul**
- Symbol: **dalahäst­silhuett** (men stiliserad, inte turist-dalahäst — tänk: träsnideri)
- Form: rund medalj
- Devis: "Hemma i Dalarna."
- Supportergrupp: "Röda Hästen"

**Västanfors BK** — Västanfors är en del av Fagersta (järnverksort).
- Färger: **kol­svart + eldröd**
- Symbol: **hammare över städ** (järnsmidets klassiska märke men stilrent ritat)
- Form: sköld
- Devis: "Smidda för segern."
- Supportergrupp: "Städstormen"

**Karlsborgs BK (KBK)** — Karlsborgsverken utanför Kalix, SCA sulfatmassebruk vid Kalix älv.
- Färger: **djupblå + blekbrun (sulfat­papp)**
- Symbol: **pappersrulle sedd från sidan** med vatten­linjer under (Kalix älv)
- Form: rektangulär skylt (industriell)
- Devis: "Massan håller."
- Supportergrupp: "Sulfaten" eller "Älvfolket"

**Målilla BK** — Målilla är känt för *Målilla Hembygdspark* + speedway (Dackarna), litet jordbrukssamhälle.
- Färger: **varm gul + grön**
- Symbol: **kvarn­hjul** (gamla vattenkvarnen)
- Form: rund medalj
- Devis: "Malet och klart."
- Supportergrupp: "Kvarnklacken"

**Hälleforsnäs BK** — Hälleforsnäs har *Hälleforsnäs bruk* (äldsta bruket, gjuteri).
- Färger: **järngrå + mörkkoppar**
- Symbol: **gjutform** (open-face, med smält järn-droppar)
- Form: rektangulär (brukets skyltar är alltid rektangulära)
- Devis: "Gjuten i bruket."
- Supportergrupp: "Gjuteriet"

**Heros BK** (Smedjebacken) — Smedjebacken är järnhantering­ssamhälle i södra Dalarna vid Barken-sjöarna. Ortsnamnet *smedja-backen* är bokstavligt. Klubbnamnet *Heros* är från 1910-tals idrotts­romantik och passar spelets heraldiska ton.
- Färger: **järn­svart + varm gulocker**
- Symbol: **smedjebacke** — siluett av en kulle med smedja längst upp, gnistor som flyger
- Form: rund medalj (heros = klassisk hjälte, rund form matchar)
- Devis: "Eld och jern."
- Supportergrupp: "Smedjans barn"

**Rögle BK** — Den ironiska blinkningen. Skånsk klubb, ingen bruksorts­industri men bördigt lantbruks­landskap. I spelet är Rögle *utlänning* bland bruksorterna — alla andra 11 klubbar har brukar, Rögle har åkrar. Det är en del av deras identitet och skämtet.
- Färger: **bordeaux + krämvit** (Rögle-hockeyns faktiska färger, en direkt visuell hyllning)
- Symbol: **axkrona** (vete­ax formad som krona) — jordbruks­hjältar
- Form: vapensköld (men utan industri­symbolik)
- Devis: "Bandyklubben. Sedan 1932." (referens till att BK faktiskt betyder bandyklubb)
- Supportergrupp: "Åkerklacken"

---

## Stadssilhuetten — designspec

Tunn silhuett i bottenkanten av GameHeader när klubben är aktiv.

### Format
- SVG, viewBox `0 0 400 40` (bred & låg)
- **En linje + fyllning nedåt** (som en stadssiluett, ingen detalj ovan­linjen)
- Högst 2 färger: en silhuett­färg (mörk koppar eller läder) + transparent

### Innehåll per klubb
- **3–5 landmärken** i siluett: kyrktorn, bruksbyggnad med skorsten, bro, fabrik, vatten­tun, skog­rand
- **Skala**: kyrktornet lite högre, skorstenen ännu lite högre, bruksbyggnaden mellan
- **Stilisering**: enkel, 70-tals turistkarta-estetik. *Inte* detaljerad arkitektur. *Inte* realistisk.

**Användning:**
- **GameHeader bakgrund** (tunn under kopparlinjen)
- **NextMatchCard** (blekare, som bakgrund)
- **Klubbprofilsidan** (full bredd, mer framträdande)

---

## Klubbmärken tillsammans — visuell distinktion

Kritiskt: de 12 klubbmärkena måste vara **urskiljbara på avstånd**. Vid design:

1. **Färgkontrast**: ingen klubb ska ha samma primärfärg. Distribuera över 12 distinkta toner.
2. **Formkontrast**: minst 3 olika badge-former (sköld, rund, rektangulär) blandat.
3. **Symbol­kontrast**: ingen dublett. Om två orter hade *samma* bruksindustri → välj två olika symboler (ett ankare vs en hammare).

**Test:** lägg alla 12 märken i en 4 × 3-grid på 32 × 32 px. Går det att identifiera alla 12? Om nej, justera.

---

## Per-klubb deliverables

För varje av 12 klubbar:

```
assets/clubs/{slug}/
├── badge.svg              (logotyp, primär, 64 × 64)
├── badge-mono.svg         (monokrom variant för print/inverted)
├── silhouette.svg         (400 × 40 stadssilhuett)
├── palette.ts             (primary, secondary, text-on-primary)
└── info.json              (devis, supportergrupp, derby, arena)
```

Plus:
```
briefs/clubs/{slug}.md     (research-dokumentet)
preview/club-{slug}.html   (visar märke + silhuett + palett + devis)
```

---

## Scope gate

- **Behandla inte som asset-produktion**. Behandla som *att ge klubbarna en själ*. Tempot är 1–2 klubbar per vecka, inte 12 på en dag.
- **Kör research och märke tillsammans**, aldrig märket utan research. Generic shields är *exakt* vad vi försöker undvika.
- **Få användarens validering** efter varje klubb — vi vill inte göra 12 och sen få veta att vi missat grunden i Lesjöfors-kulturen.
- **Undvik politiskt laddade symboler** (parti­symboler, religiösa symboler utöver generisk kyrko­silhuett).
- **Ingen AI-genererad text-på-märket** (tidigare försök har gett fel­stavade latin­ord). Allt typografi-arbete är hand­satt.

---

## Beroenden

- Behöver **faktisk research** per ort — bibliotekskällor, Wikipedia, hembygds­föreningar. Ej datorintuition.
- Kan köras **parallellt med FAS 5** (karaktärsgalleriet) — fans-grupperna per klubb hör ihop.
- **Inte** beroende av FAS 1 (ikoner) eller FAS 2-3 (skärmar).

---

## Estimerad tidsåtgång

Per klubb: **3–4 dagar** (research 1 dag, design 1–2 dagar, silhuett 0.5 dag, validering 0.5 dag).

**Totalt 12 klubbar × 3.5 dagar ≈ 6–8 veckor** med en illustratör + research.

Kan parallelliseras om två illustratörer jobbar samtidigt — då halveras tiden men kräver strikt stil-konsistens-granskning mellan varje klubb.
