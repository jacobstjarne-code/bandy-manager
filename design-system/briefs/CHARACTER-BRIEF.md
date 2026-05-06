# CHARACTER-BRIEF · Bandy Manager
*Karaktärssystem för alla människor i spelet. Drivs i FAS 5.*

---

## 🎯 Uppdraget

Ge spelet ett **visuellt befolkat universum**. Just nu är alla mänskliga figurer placeholders (Mii-aktiga generiska avatarer för spelare, "PL"-cirkel för tränaren, ingen alls för styrelse/politiker/fans). Det gör världen **tom** trots att det är precis i det mellanmänskliga spelet tar plats: kontrakts­förhandlingar, styrelsemöten, patron-samtal, läktar­stämning.

Den här briefen definierar **ett enhetligt visuellt språk för alla karaktärer** och **ett generator­system för spelarportätten** (288+ kombinationer utan att rita 288 bilder).

---

## Övergripande stilreferens — hämta kraft från intro-bilden

Intro-bilden (`assets/intro-bg.jpg`) är stilkanon:

- **Platta färgfält, inga gradienter, inga skuggor**
- **Tjock svart kontur (1.5–2 px vid 48 px porträtt)** — som 70-talets skolböcker och affischer
- **Begränsad palett:** benvit hud­ton, warm blå klädsel, djupgrön bakgrunds­natur, varm koppar-röd för accent. Lägg till designsystemets koppar och läder där det passar.
- **Karaktär *i hållningen*, inte i ansiktsdrag** — en silhuett ska vara igenkännbar
- **Enkla ansikten:** ögon som prickar eller korta streck, mun som bågstreck, näsa som enskilt streck. *Inte* detaljerad, *inte* realistisk. Tove Jansson möter Stig Lindberg möter Rit-Ola.
- **Platt printkorn** (noise 3–5 % opacity) — ger den där *offset-tryckt 1974*-känslan

**Inte** Disney-tecknat. **Inte** Memoji/Mii (det är dagens placeholder och måste bytas). **Inte** realistiska porträtt. **Inte** anime.

**Filter:** *Förstärker detta bruksorts­kulturen, kontrasterar detta digitalt/modernt, eller är det bara sött?* Bara de två första passerar.

---

## ROLLGALLERI — 10 grupper

### 1. Spelarna (generator-system, 288+ unika)

**Krav:** 12 klubbar × 11 startspelare + 5-6 reserver = ~200 unika spelare. Omöjligt att handteckna alla. Därför **modulär generator**.

**Generator-parametrar:**
- **Ansiktstyp** (4): smal-lång, rund-bred, fyrkantig-markerad, mjuk-pojkaktig
- **Hår** (8): kortklippt, sidbena, bakåtstruket, flintskallig, lockigt mellan, mulet (1970-tals), pannlugg, mellanlång med skjutet. Två-tre av dessa finns även som "grått" för äldre spelare.
- **Skägg** (5): rakad, skäggstubb, mustasch, helskägg, snagg-hake
- **Hudton** (4): mycket ljus, ljus, mellan, mörkare — ingen av dem ska vara karikatyr-orange eller rosa; alla i en dämpad offset-palett
- **Ålder­skel** (3): ung (18–23), mitten (24–32), erfaren (33+)
- **Klubbtröja** (12 klubbar × 2 färger var)

**Resultat:** 4 × 8 × 5 × 4 × 3 = **1 920 kombinationer** (många orealistiska, men ca 300+ trovärdiga)

**Teknisk leverans:**
- SVG-komponent `<Player>` i React som tar props `{faceType, hair, beard, skinTone, age, clubColors}` och komponerar ihop
- Varje "lager" är ett rent SVG-element (ingen bild-composite)
- Målvakter får **målvaktshjälm + bröstskydd** som extra lager (overlay)
- Kapten får **kaptensbindel** som overlay

**Spelarkort-avatar (36 × 36 px i cirkel):**
- Beskärning till huvud + axlar, *inte* Mii-stil bröst i cirkeln
- Liten klubb­märkes-dingbat i nedre vänstra hörnet (3 × 3 px) som "klistermärke"
- Inga studiofoto-bakgrunder — ren tröja-färg eller läder

**Statistisk distribution (för generatorn):**
- Flintskallig/grånad tuft → fler bland erfarna spelare
- Skäggstubb → jämnt fördelat
- Helskägg → ovanligt, bara 10%
- Mustasch → för äldre spelare (nostalgisk detalj) — en signal för "erfaren målvakt från 1980-talet"-vibe

---

### 2. Domarna (3 arketyper, fasta)

- **Den unge domaren** — mellan 25–30, tar matchen seriöst, korta manöver
- **Den erfarne gubben** — 55+, kuslig auktoritet, har sett allt
- **Den kvinnliga domaren** — modern, lugn, respekterad (bandy har fortfarande för få kvinnliga domare IRL; vi visar mer, det är en tyst aktivistisk handling)

**Klädsel:** svart-vit-randig tröja, svart shorts, svart armbindel med SBF-märke (stiliserat), visselpipa synlig. Ansiktsdrag: trötta, **aldrig glada**, alltid avvägande.

**Användning:** visas i kommentatorsfältet vid varning/utvisning, i protokollet efter match.

---

### 3. Styrelsen (6 arketyper, fasta)

Klubbstyrelsen är bruksortens **hjärta**. De är volontärer, inte proffs.

- **Ordföranden** — man, 55–65, kavaj med klubbmärke, glasögon, bänkar sig gärna
- **Kassören** — kvinna, 45–55, kardigan, alltid pärm under armen
- **Marknadsansvarig** — yngre (30–40), kan vara kvinna eller man, mer modern klädsel, ett par sneakers
- **Ungdomsansvarig** — medelålders, bär ofta keps, pratar alltid om barnen
- **Tekniska ansvariga** (arena/is) — byggnadsarbetartyp, overall eller slitna jeans, alltid en thermos
- **Hedersordförande** (emeritus) — 75+, går med stav, berättar historier från 1960-talet

**Användning:** visas i styrelsemöten­skärmen, i vissa press­citat, i klubb­profilsidan ("Styrelsen").

---

### 4. Politikerna / kommunen (4 arketyper, fasta)

- **Kommunalrådet** — man eller kvinna, kostym men inte snobbigt, alltid i kommunfullmäktige-miljö
- **Fritidsnämndens ordförande** — mer avslappnad, kavaj utan slips, ofta den som *kan* bandy
- **Förvaltningschefen** — teknokrat, glasögon, pappersbuntar, alltid försiktig
- **Oppositionsråd** — kritisk, armar i kors, alltid skeptisk mot klubbens äskanden

**Användning:** kommun­delegations­möten, ansöknings­flöden (arenabidrag, markavtal), pressnotiser från lokaltidningen.

---

### 5. Politiker / riksplan (1–2 karaktärer, spars)

Sällan, men när en riksdagspolitiker kommer på match eller uttalar sig om elbesparings­krav — låt det synas. Neutral kavaj­figur, inget parti synligt (vi tar inte politisk ställning).

---

### 6. Tränarteamet (4 karaktärer, plus din huvudtränar-karaktär)

- **Huvudtränaren** = du (spelaren), **editable karaktär** — se nedan
- **Assistent­tränaren** — medelålders, klädkod "gammal lagkapten som blev tränare", tar gärna kaffet
- **Målvakts­tränaren** — specialist, ofta egen mustasch-stil, fanatisk om detaljer
- **Fys/medicin** — ung, sportkläder, pad under armen
- **Materialförvaltaren** — äldre, bärnmössa, alltid med klubbpåse

**Användning:** match-shell ("coach-tip"), träningsskärm (område-ansvariga), bänken under match.

---

### 7. Din huvudtränar-karaktär (editable, 1 st)

Spelaren är manager. Hen ska känna ägarskap över sin karaktär.

**Editerbart vid nytt game:**
- Ansiktstyp (samma 4 som spelar-generatorn)
- Hår (samma 8)
- Skägg (samma 5)
- Hudton (samma 4)
- Kön/presentation (3 val: han/hon/hen, påverkar kropp­silhuett subtilt)
- Glasögon ja/nej
- Kepsa / kavaj / halsduk (3 klädsel­val)

**Ingen namngivning av kropps­typer/könsuttryck** — *"3 kroppstyper"* räcker. Inga sliders, inga ytterligare val. Minimal men tillräcklig agency.

**Användning:** match-shell coach-avatar, kontrakt­förhandlingar, pep-talks, pressbild efter match.

---

### 8. Fansen (8 arketyper, använda i scen-kompositioner)

Fansen är miljö, inte karaktärer du pratar med. De ska finnas som **bakgrunds­befolkning** i lämpliga vyer.

- **Den trogne gubben** — 70+, tyst, nätterm, tumlar gula snus­dosan
- **Klackledaren** — 25–35, megafon, scarf, trumma
- **Familjen** — mamma + pappa + två barn, en av barnen har klubbmössa
- **Ungdoms­gänget** — 15–20, gemensamma tröjor, mobil ute
- **Bortasupportern** — blå-gul-tröja från annan klubb, ensam i läktarhörn, antingen nöjd eller sur
- **Den ensamme mannen med öl** — 45–60, rosig näsa, stövlar, *aldrig* skrattande
- **Brukspensionärerna** — par, 70+, termos, matsäck, filtar
- **Den unga familjen** — 25–35, bebis i vagn, liten bandyhjälm för pappa

**Användning:** läktar­renderingar, bakgrund i scoreboard-bilder, klubbprofilens "våra fans"-sektion, matchrapport-bilder.

---

### 9. Patronen / mecenat-roller (3 karaktärer, fasta)

**Patron: inte hög hatt, inte Monopol-gubben.** (Det är en aktiv korrigering från användaren.)

- **Lokal­patronen** — 55–70, vanlig kavaj, pipan ibland, bärnsten­ring, står alltid i grupper. En *ordförande­figur* mer än industri­magnat. Tänk: småföretagare som bygger bandyhallen.
- **Utbölings­patronen** — ny rik, flyttar till orten, har en bil. Kavaj men modernare, annorlunda hårnacke. Klubben är skeptisk, han vill godhjärtat.
- **Kvinnliga mecenaten** — 50–65, entreprenör, rakt ansikte, kort hår­klippning, praktisk klädsel. Respekterad.

**Användning:** patron-meddelanden, middag/uppvaktnings­flöde, investeringar i arena.

---

### 10. Press / scouter (3 karaktärer, fasta)

- **Lokaljournalisten** — 40–55, sliten anteckningsbok, åldrad kamera runt halsen, *alltid* där. Kanske huvudfigur i "Bygdens Puls"-flödet.
- **Scouten** — hatt (diskret, *inte* fedora), kappa, anteckningsbok i fönstret. Ofta oidentifierad i skuggan.
- **Sport­kommentatorn** (radio) — mustasch, headset, *inte* tv-modern, gammaldags

**Användning:** press­ citat i dagliga briefings, inter­vjuer efter match, scout-rapporter.

---

## Spelar­kortets avatar-redesign (specifik deliverable inom FAS 5)

Nuvarande avatar i spelarkortet (se referensbild) är **Mii-liknande** — runt ansikte, 3D-liknande näsa, generisk hår­grafik. Det bryter mot alla principer ovan.

**Ny avatar:**
- 36 × 36 cirkel-mask
- Platt illustration i 70-tals­stil
- Tjock svart kontur
- Ansikte + axlar + klubb­tröja synlig, ingen bakgrund
- Liten klubb­märkes-dingbat som klistermärke i hörnet
- Vid tap → zoomar upp till porträttstorlek (120 × 120) med **full hall­foto-stil** (enkel bakgrundsväv, som ett lagfoto)

---

## Personlighet­skopplingar (planeras efter FAS 5)

Spelet har **personlighet­sbeskrivningar** i karaktärs­datat (t.ex. "säljare vid sidan om", "tystlåten", "frispråkig"). Användaren plockar ut dem när vi kommer till implementation.

**Inte handtecknade unika karaktärer per personlighet** — det är för dyrt. Men **små subtila tags** på generatorn:
- Personlighet "säljare" → spelaren har en blazer-antydan (inte i aktiv spelardräkt, men i civilkläder-vyn om det finns en)
- Personlighet "tystlåten" → ansiktet *lite* mer nedåt­riktat
- Personlighet "frispråkig" → leende­mun istället för neutral

Dessa kopplingar definieras när personlighets­datat är tillgängligt.

---

## Tekniska krav

**Alla karaktärer som SVG-komponenter.** Ingen pixel-illustration; ingen PNG-export som primär leverans. Detta gör att:
- Paletten kan skifta med säsongs­gradient (höst-wash vs vinterlig­skarp)
- Storlek skalas utan kvalitet­sförlust
- Klubbfärger injiceras programmatiskt

**Namnkonvention:**
- `char-player.tsx` (generator)
- `char-referee-{young|veteran|woman}.tsx`
- `char-board-{ordforande|kassoren|...}.tsx`
- `char-politician-{kommunalrad|...}.tsx`
- `char-coach-manager.tsx` (editable)
- `char-coach-{assistant|goalie|fys|materiel}.tsx`
- `char-fan-{trogne|klackledaren|...}.tsx`
- `char-patron-{lokal|utboling|kvinna}.tsx`
- `char-press-{journalist|scout|kommentator}.tsx`

**Preview-kort:** `preview/brand-characters.html` — visar alla arketyper i rutnät, med generator-demo för spelare.

---

## Palett (delas med intro-bilden)

Begränsad palett för enhetlighet:

| Roll i bilden | Token | Hex |
|---|---|---|
| Hudton ljus | `--char-skin-1` | #F3D8B8 |
| Hudton mellan | `--char-skin-2` | #D4A477 |
| Hudton djupare | `--char-skin-3` | #A87050 |
| Hudton mörk | `--char-skin-4` | #6E3F22 |
| Hår mörkt | `--char-hair-dark` | #1F1912 |
| Hår brunt | `--char-hair-brown` | #6A4826 |
| Hår blont | `--char-hair-blond` | #C9A566 |
| Hår grått | `--char-hair-grey` | #8A8580 |
| Klädsel­blå | `--char-cloth-blue` | #3D5A78 |
| Klädsel­brun | `--char-cloth-brown` | #6B4824 |
| Klädsel­grå | `--char-cloth-grey` | #5A5750 |
| Kontur (all) | `--char-outline` | #1A1A18 |

Klubbfärger injiceras ovanpå dessa.

---

## Scope gate

- **INTE:** sexualisering, skämtsamma karikatyrer, stereotyper på ålder/etnicitet/kön. Bruksorten är rak och rättfram men inte trångsynt. Se över med användare innan första publicering.
- **INTE:** målade realistiska porträtt (kostar 100×). Platt illustration är *beslutet*.
- **INTE:** djur, maskotar (om klubbarna har dem kommer de i CLUB-BRIEF, inte här).

---

## Beroenden

- **Behöver personlighets­datat** för att finjustera generatorns tags — *kan utföras senare*, systemet fungerar utan.
- **Intro-bilden** som stil­referens — redan tillgänglig.
- **Palettens koppar/läder-tokens** — redan definierade.

---

## Estimerad tidsåtgång

- **Stilutveckling + 3 pilot-karaktärer** (huvudtränar + 1 spelare + 1 fan): 1 vecka
- **Generator-systemet (spelare)**: 2 veckor
- **Övriga 9 rollgrupper** (ca 35 fasta karaktärer): 3 veckor
- **Preview-kort + integration i befintliga skärmar**: 1 vecka

**Totalt: 7 veckor** med en illustratör + utvecklare. Kan pågå parallellt med FAS 4 (klubbidentitet) eftersom fans och styrelser kopplas klubbvis.
