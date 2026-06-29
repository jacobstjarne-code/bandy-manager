# SCENE_STYLE — husstil för BM scen-illustration

**Författare:** Opus · **Etablerad:** 2026-06-23 (tillsammans med Jacob, genom Nano Banana 2-loop)
**Status:** Husstil låst. Två referensplattor godkända. Receptet bevisat tre körningar i rad.

Det här är mallen för varje scen-illustration i Bandy Manager. Den finns för att du ska slippa återuppfinna stilen för varje ny scen — kör mot rätt referensplatta + receptet, så håller serien ihop i stället för att glida.

---

## Husstil (låst)

**Bildspråk:** stiliserat, grafiskt — mid-century screenprint / skandinavisk affischtradition. Platta former och starka silhuetter, byggt av färg- och valörmassor, INTE av konturlinjer. Synligt korn/textur i ytorna så de inte blir döda. Detta är ett medvetet grafiskt språk, inte måleriskt-realism (den vägen testades och revs — för svår att hålla konsistent och krockade med UI:t).

**Palett:** kall och begränsad, men aldrig monokrom. Skiffer/blågrått i botten, avmättad teal-grön i skog och skugga, varmgrått i trä och snöskuggor. Snö är svalt off-white, aldrig rent vitt.

**Värme = signal, inte dekor.** Den enda varma kulören kommer från ljuskällor (strålkastare, gatlykta, lampa = varmt gulbärnsten) och enstaka varm rekvisita (en brun portfölj, en röd lampskärm). Värmen ska vara tydligt närvarande som scenens enda accent och dra blicken till rätt punkt. Allt annat är kallt.

**Ljus:** low-key, atmosfäriskt, dramatisk valörkontrast. Djupa mörker mot ljus snö. Pölar av varmt ljus mot kall omgivning. Dagscener får högre key men behåller den svala paletten — ingen grann sol, ingen munterhet.

**Stämning:** lågmäld, vemodig, ensam. Plats som karaktär. Det får göra ont. Den grafiska stilen får aldrig kalna till ren dekoration — vemodet är själen, formspråket bara bäraren.

**Format:** stående 9:16 (text läggs som UI ovanpå i appen).

---

## Receptet (bevisat — så körs varje scen)

Nano Banana 2 (Flash), inte Pro. Flash följer instruktioner; Pro övertänker och "förbättrar" det du inte bad om. Ingen kvalitetsskuld — Flash går också till 4K.

**Mata alltid in bild(er), inte bara text.** Text ensam driver iväg; referensbilden låser handslaget.

**Ny scen (du har ingen bild än):** referensplattan (rätt platta, se nedan) som STIL + fullt beskrivande motivtext. Beskriv vad som händer (plats, ljuskälla, rekvisita, stämning, var den lugna overlay-ytan ligger) — INTE penseldrag/färg, det bär referensen.

**Omrendering (du har en bild du vill behålla):** två bilder, innehållet FÖRST, stilreferensen SEN. Kort instruktion: "Re-render the FIRST image in the style of the SECOND. Keep composition/props/window. STYLE ONLY from the second."

**Negativ — säg dem explicit varje gång (omrendering ärver källans fel):**
- Inga konturlinjer / line art. Former definieras av platta färg- och valörmassor. ("remove all outlines, flat shape-based only" — detta är hävstången mot cartoony.)
- Ingen läsbar text någonstans. Kalendrar = blanka rutor, muggar/skyltar = abstrakta märken. Riktig text läggs som UI-overlay, aldrig genererad.
- Inte monokromt — begränsad men rik palett (skiffer + teal + varmgrått).
- Inte platt/munter affisch — behåll djupa mörker och vemod.

**Lås en overlay-zon i varje scen:** en lugn lågkontrastyta (himmel, snöfält, vägg) där UI-text kan ligga. Designa in den, hoppas inte på den.

**Loop:** generera → klistra för granskning mot speccen → justera → när godkänd blir scenen själv referens, så stilen stramas åt i stället för att glida.

---

## Referensplattor (lås)

Två godkända plattor. Spara PNG:erna i `design-system/assets/` med exakt dessa namn så speccen pekar på riktiga filer:

- **`assets/scene-ref-outdoor-nedflyttning.png`** — UTOMHUS/anläggning. Stiliserad version: soptunna med portfölj i förgrund, strålkastare som glöder varmt, by på höjden, berg och månskära. Kör alla utomhus-/anläggningsscener mot denna.
- **`assets/scene-ref-indoor-kafferum.png`** — INOMHUS/interiör. Klubbhusköket: grönt panel, varm lampglöd, fönster mot rink, lagfoto/radio/klocka/kalender. Kör alla interiörscener mot denna.

Regel: utomhus → utomhusplattan, inomhus → interiörplattan. Blanda aldrig modeller (Flash genomgående) eller plattor mitt i en serie.

---

## Shotlist (scener BM behöver)

Markerad med platta (U = utomhus/nedflyttning, I = inomhus/kafferum) och status.

**Finns / etablerade**
- Ankomsten (I) — intro, narrativ över bild. ArrivalScene. Bör köras om i husstilen.
- Nedflyttning (U) — KLAR, är referensplattan.
- Kafferummet (I) — KLAR, är referensplattan.

**Säsongens båge (prio)**
- Säsongsslut (U) — smältande rink, tö, ensam orange boll som enda värme. Motivet finns, kör i husstilen.
- Seger / SM-final (U el. I) — triumf, men i samma svala register; värmen får bära glädjen, inte färgmättnad.
- Cupfinal (U) — stora scenen, neutral arena.
- Derby (U) — laddning, hetta i ett kallt landskap.

**Händelser**
- Skada (I el. U) — vemod, en spelare ur spel.
- Sparken/avsked (I) — tömt kontor, packad låda. Syskon till nedflyttningsbilden i ton.
- Uppflyttning (U) — motvikt till nedflyttning, försiktig ljusning.
- Transferfönster (I) — väntan, telefon, bud.

**Generella**
- Klubbhuset dag (U), första träningen (U), tom läktare (U) — fyllnadsscener i samma språk.

Trösklar och exakt scenurval är dina att vikta — det här är utgångsläget.

---

## Lärdom (för lessons.md)

Måleriskt-realism revs till förmån för grafisk stilisering av två skäl: konsistens (färre frihetsgrader = Nano Banana träffar pålitligare över en hel serie) och UI-passning (platta former bär text-overlay och matchar det återhållna designsystemet bättre än måleri). Risken — att stiliseringen kalnar till dekoration — navigerades genom att låsa den kalla paletten och tvinga varm glöd i ljuskällorna. "Stilisera formerna, behåll stämningen." Hävstången mot cartoony var alltid samma rad: inga konturer, målade/platta massor.

---

## Klubbscener (mall) — etablerad 2026-06-23, Forsbacka som testklubb

Varje klubb i BM har TRE identitetslager (se CLUB-BRIEF.md): **märke** (vektor, textlöst, Nano Banana), **scen** (denna husstil, Nano Banana), **info** (devis/klack/derby/palett, text). Scenen är en variant av utomhusplattan, bunden till klubbens specifika landskap.

**Palett först — icke förhandlingsbart.** Lås klubbens färg ur CLUB-BRIEF.md INNAN märke eller scen, och mata båda från samma rad. `CLUB_BADGES` i `ClubBadge.tsx` är legacy-placeholders och ljuger (Forsbacka står som blå där, men är mörkröd). Drog man scenen ur fel källa fick klubben två identiteter — samma dubbelkälla-mönster som kaptenbuggen, fast för färg. Lås paletten, skriv den till `assets/clubs/{slug}/palette.ts`, mata allt därifrån.

**Receptet:** utomhusplattan (soptunnan) som stilreferens + tre datadrivna rader ur `clubExtendedInfo.ts` + `palette.ts`:
1. **Industri** (klubbens bruk) → byggnad i siluett: järnverk med skorsten, pappersbruk, gjuteri.
2. **Arketyp-landskap** (`klimateArchetype`) → omgivningen: bruk_lakeside = naturis bland furor vid sjöutlopp; arctic_coast = mörk kust; sm_highland_extreme = höglandsplatå; scanian_coast = öppet kustlandskap.
3. **Klubbfärg** (`palette.primary` + secondary) → som UPPLYST accent.

**Banderoll-greppet (för kalla klubbfärger).** Klubbens primärfärg ska läsa som identitet mot den kalla paletten. Varma färger (Lesjöfors orange, Gagnef röd) lyser av sig själva. Kalla färger (Slottsbron blå, Hälleforsnäs grön, Karlsborg djupblå) drunknar — lägg dem i en **upplyst banderoll med koppartrim** vid strålkastarna. Banderollen ger färgen en egen yta och strålkastarljuset gör den varm utan att värma hela bilden. Forsbacka: mörkröd banderoll, creme + järnsvart, upplyst.

**Tre lärdomar från Målilla (gäller alla kvarvarande klubbar):**
1. **Arketyp-namnet är en etikett, inte en landskapsbeskrivning.** `sm_highland_extreme` betyder "småländska höglandets extrema kyla", INTE kalfjäll. Första Målilla-scenen blev öppen tundra/fjäll — fel. Småland är tät granskog som tränger in. Läs `briefDescription` och ortens faktiska geografi, tolka aldrig fältnamnet bokstavligt.
2. **Klubbfärgen sitter i något PERMANENT** — banderoll spänd på sargen, fast flaggstång, eller byggnaden. Aldrig ett uppfällt fältstativ (Nano gav det först — läser "tillfälligt arrangemang", fel för en hemmaplan). Be om "permanent banner fixed to the boards, belongs to the place, not a temporary folding stand".
3. **Leta efter datadetaljen som blir klubbens motiv.** Målillas "termometern på torget" (ur clubExtendedInfo) blev både scenens blickfång OCH märkets symbol — starkare än briefens generiska kvarnhjul. Varje klubb har en sådan detalj i `briefDescription`/`arenaNote`; hitta den.

**Variera tid på dygnet och stämning per klubb (Eriks input 2026-06-23).** Risken med en låst kall natt-stil är att hela serien blir enformigt dyster — inte varje klubb är natt-och-depp. Säsongsslut-scenen bevisade att kall DAGER funkar i stilen. Bind tiden på dygnet till klubbens karaktär ur `briefDescription`:
- Kämpande/överskuggad (Forsbacka "klämd mellan stadsklubbarnas skuggor") → natt, vemod.
- Trotsig/stolt överlevare (Västanfors "bandyn lever kvar när stål och gruva tystnat") → ljus kall dag.
- Arktisk (Karlsborg "mörker och köld är vardag") → natt/polarmörker.
- Sydlig/pastoral (Rögle, Skåne) → ljus öppen dag.
Behåll ALLTID den svala begränsade paletten — ljusare betyder aldrig varmare eller gladare, bara annan tid på dygnet. Dagscen-rad: "crisp cold winter daylight, bright but cold, pale luminous sky, NOT warm, NOT cheerful, keep the cold palette".

**Forsbacka-prompten (referens, byt de tre raderna per klubb):**
> [utomhusplattan som stil] + Establishing scene of a small Swedish ironworks-town bandy ground. Natural-ice rink among tall pines at the outlet of a large lake, frost pocket by the water. Old ironworks building with a tall chimney silhouetted on the hillside, mill-town houses, a church spire. Night, floodlights and a single club banner glowing DEEP DARK RED with CREAM and iron-black — the club's colours — as the one warm identity accent against the cold slate-and-teal palette. Stylized graphic screenprint, bold flat shapes, grain, no outlines, no readable text. Vertical 9:16, calm sky for overlay.

## Märke (mall) — Nano Banana, men med disciplin

Nano Banana gör klubbmärken bra (testat, Forsbacka masugn). Tre regler:
- **Textlöst.** Aldrig genererad text på märket — Nano stavar fel i små bokstäver (CLUB-BRIEF.md varnar). Be om "NO text, no lettering". Namn/årtal läggs som riktig typografi efteråt.
- **Namnge feltolkningarna.** Ovanliga industrisymboler driver mot närmaste välbekanta föremål — en masugn blev först en fotogenlampa, sedan en kanon. "NOT a lantern, NOT a cannon, a stone furnace tower" löste det. Samma disciplin som "no outlines" på scenerna: stäng fel dörrar explicit.
- **Flat vektor, max tre färger, inga gradienter/skuggor** — annars en blank 3D-medalj som inte skalar till 32px.
- OBS: Nano ger raster. CLUB-BRIEF.md vill SVG. Vektorisering av märket är ett senare steg, inte löst här.

## Lärdom — klubbidentitet

Opus hade fel om verktyget: påstod att Nano Banana var fel för märken (vektor-heraldik). Jacob hade konkret erfarenhet av motsatsen och hade rätt. Nano gör både märke och scen bra med användarens öga i loopen. Det enda hårda skälet som höll var briefens varning om genererad text — löst genom textlösa märken. Opus roll var disciplinen (palett först, textlöst, namnge feltolkningar, datadrivna scenrader, klubbfärg som upplyst accent), inte att underkänna verktyget.
