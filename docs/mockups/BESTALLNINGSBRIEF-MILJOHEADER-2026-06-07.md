# BESTÄLLNINGSBRIEF — Miljö-header: "Den närvarande bruksorten"

**Från:** Design-Claude · **Datum:** 2026-06-07
**Par till:** `BESTALLNINGSBRIEFER-ILLUSTRATIONER-2026-06-05.md` (de fem ceremoni-bilderna)
**Mock-referens:** `2026-06-07_design_narvarande_bruksort.html` — kompositionen och väder/säsong-tänket är rätt; SVG:erna där är **bara proxy** och ska ersättas. De är avsiktligt enkla men hör inte hemma i spelet — den riktiga bilden ska ha samma elegans och kvalitet som de tre befintliga (intro/final/annandagen).
**Kanon:** DESIGN-DECISIONS.md → "Visuell rikedom — tre lager, skild frekvens (2026-06-07)". Detta är *miljö*-lagret.

---

## Vad detta är — och hur det skiljer sig från de fem ceremoni-bilderna

De fem ceremoni-bilderna är **händelser**: sällsynta, de stoppar dig (annandagen, derby, final, nedflyttning, kafferum). Den här är **textur**: konstant närvarande, omger varje vardagsskärm, tävlar aldrig om fokus. Det är spelets *grundton* — det som gör att en mittenmatch i mars också ser ut som en plats, inte bara text och ramar.

**En enda bild.** Inte per-tillfälle, inte per-klubb (i v1). Den tintas i kod per säsong och väder via overlay-lager — så samma bas blir november-natt, mars-töväder, oktober-gryning utan nya bilder.

## Format

- **Liggande/header-format: ~1100 × 520 px** (bred, kort höjd — sitter som ett band överst på skärmen, kroppen/korten ligger under i ljust papper).
- Viktigt motiv i den **nedre 2/3** av bilden (himlen upptill blir tint-yta + plats för klubbnamn/säsong-chrome i överkant).
- Komposition måste tåla en **mjuk fade nedtill** mot ljust papper (`#efe9df`) — undvik kritiskt motiv längst ned.

## Motiv — den neutrala vardags-bruksorten

En svensk bruksort i skymning/blå timme (neutralt dygnsläge som tål att tintas åt både natt och dag):

- **Tegelbruket** — låg tegelröd industribyggnad med skorsten, mittpunkten. Några **upplysta fönster** i varmt guld — bildens enda varma accent, dess "copper-moment".
- **Bygden** — en handfull små hus/stugor längs en linje, något enstaka upplyst fönster.
- **Den floodlit isplanen** i förgrunden — en blek isyta med ett par strålkastarstolpar. Bandyns hjärta, men stillsamt, ingen match pågår.
- **Naturen** — snötyngd granskog bakom, en aning av älv/vatten. Bruksort-skala: industri + bygd + natur i samma bild.
- **Himlen** — stor, lugn, tom upptill (blir tint-yta). Eventuellt en blek måne eller tidiga stjärnor som tål att döljas av tint.

## Stil — samma som de tre befintliga

- Platt vektor / woodcut / risograf-kant. **Ingen fotorealism, ingen 3D.**
- Samma palett: navy #1f3a4d · slate #4a6680 · ice #7095b8 · tegel #b5532e · ljus #e8b95c.
- Elegant och återhållsam — **inte barnslig, inte plottrig**. Färre, säkrare former hellre än många små detaljer. Tänk Inside / Disco Elysium / Frostpunk-vardag: vacker, stämningsfull, men aldrig pratig.
- Människor om de finns: silhuetter, små, aldrig porträtt.
- Stillsam. Detta är en plats som *finns där*, inte en scen som händer.

## Hur den används (för att förstå motiv-kraven)

- Sitter som **header-band** överst på vardagsytor (portal full höjd ~168px; trupp/granska komprimerad ~120px — så bilden måste tåla beskärning i höjd via `object-position`).
- **Tintas i kod** per säsong/väder: himmel-gradient-overlay (navy-natt → ljusgrå töväder → varm gryning) + partikel-lager (snöfall, dis, sol-glow) + fönsterljus on/off. Basbilden ska vara **neutral nog** att bära alla dessa lägen — därför skymning som utgångsläge.
- Mörk-rik header mot ljust pappers-kropp ger ljus-mörk-rytm. Bilden är "vyn ut", korten är "liggaren på bordet".

## Leverans

En bild, `bruksort-header.jpg`, i **`public/assets/illustrations/`** (referens `/assets/illustrations/bruksort-header.jpg` — samma plats som intro/final/annandagen, INTE `src/`). Tills den finns: **rendera ingen proxy** — header faller tillbaka på ren säsongstonad gradient (header-bg utan motiv) så inget barnsligt syns. Mockens SVG:er används inte i spelet.

---

## Opus-bekräftelse på öppna frågor (2026-06-07)

**Generisk bruksort i v1 — ja, men per-klubb-identiteten ska finnas redan i v1, billigt.** Inte via 12 målningar (det är en lyx senare om det bär), men inte heller "generisk överallt" — då tappar vi halva värdet (plats utan tillhörighet). Per-klubb-identiteten bärs av det billiga overlay-lagret: **klubbmärke som vattenstämpel + klubbton i tinten + klubbnamn i chrome**. Den per-klubb-tonen förutsätter att de tolv **fiktiva** klubbarna har definierade ort-karaktärer (nordlig/sydlig, mörk/ljus). Finns de inte ännu är *det* förutsättningsuppgiften (innehåll, skrivs av Opus), och v1 blir generisk målning + märke + namn + säsong/väder-tint tills klubbkaraktärerna är skrivna. (OBS: Karlsborg/Rögle i mock-noterna är riktiga orter/hockey — klubbarna är fiktiva, så karaktären kopplas till deras egna orter, inte lånade.)

**Väder-animation — ja, men bara på portalen.** Långsam och låg (drivande snö), bakom `prefers-reduced-motion`, billig CSS (det är en PWA — ingen tung loop som tömmer batteriet). Statiskt på inre vyer (trupp/granska) där man arbetar.

**Header-höjd — ja:** full på portal (~168), komprimerad inre (~120) via `object-position`. Behåll nyckelmotivet (tegelbruket) i det band som överlever en topp-beskärning, så identiteten inte kroppas bort på inre vyer.

**Prioritet (Opus-flagga):** per impact-per-bild är detta den **högst** rankade beställningen, inte den lägst — headern syns på varje skärm, ceremoni-bilderna sällan. Om illustratörs-kapaciteten är begränsad går headern före de rarare ceremoni-bilderna (varsol, kafferum, nedflyttning).

**Vakt mot creep (kanon):** headern ska matcha ceremoni-bildernas *hantverk och palett, inte deras drama*. Den ska vara det vackraste *glömbara* i spelet — recederar, plats inte scen. Inget guld utöver fönsterljus-accenten, ingen laddad händelse. Ceremonin behåller sin kraft genom att *avbryta lugnet*, inte genom att vara den enda bilden.

---

## Bygg-spec (Code) — header-lagret kan byggas NU, utan bilden

Code bygger hela lagret nu mot fallback; bilden droppas in när den finns, ingen omarkitektur. Per Jacobs direktiv: tomma ytor/gradient med stämpel tills bilden finns.

**Komponent:** `<MiljoHeader>` överst på vardagsytor (portal, trupp, granska). Höjd: portal ~168px, inre ~120px. Bilden beskärs i höjd via `object-position` (behåll nedre 2/3 — tegelbruket — vid komprimering). Mjuk fade nedtill mot papper `#efe9df`.

**Bildkälla + fallback (stämpel-regeln):**
- Bild finns (`/assets/illustrations/bruksort-header.jpg`) → rendera fullbleed med tint-overlay.
- Bild saknas → **ren säsongstonad gradient** (motivlös, navy→tegel-ton per säsong). PLUS en **dev-only stämpel** `⌧ bruksort-header saknas` (synlig i `/dev/scenes` + dev-build, dold i produktion). Så du ser exakt vad som fattas i playtest, men en spelare ser aldrig en barnslig platshållare. Aldrig en SVG-proxy.

**Tint-system — två tidsskalor på EN axel (kallt↔ljust):**
- **Säsong** (långsam bas): himmel-gradient-overlay glider oktober→mars (varm gryning → navy-natt → ljusgrå töväder).
- **Väder** (snabb modulation inom basen): partikel-lager (snöfall/dis/sol-glow) + fönsterljus on/off. Komponeras *ovanpå* säsongsbasen, grumlar den inte.
- Animation: bara portal, långsam drivande snö, bakom `prefers-reduced-motion`, billig CSS. Statiskt på inre vyer.

**Per-klubb-identitet (v1, ur befintligt data — ingen ny content, inga 12 målningar):** tintens karaktär nycklas på `clubExtendedInfo.klimateArchetype`. Mappning:

| klimateArchetype | Klubbar | Tint-karaktär |
|---|---|---|
| `arctic_coast` | Karlsborg | Mörkast, blåast, tidigast mörker — polär |
| `sm_highland_extreme` | Målilla | Extrem köld, klar, högkontrast |
| `valley_coldpit` | Lesjöfors | Djup stillastående köld, klar (köldhål) |
| `scanian_coast` | Rögle | Mildast, ljusast, salt dis — sydligt |
| `vanern_effect` | Slottsbron | Dimma, storm, sen is, stor himmel |
| `gulf_coast` | Skutskär | Kustdis, Bottenhavet |
| `bruk_river_island` | Söderfors | Älvdis, tidig is, broar |
| `valley_inland` | Gagnef | Dalgång, inlandsköld |
| `bruk_lakeside` | Forsbacka, Västanfors, Hälleforsnäs, Heros | Sjödimma, standard-bruk |

Plus billigt overlay som mocken föreslog: `ClubBadge` som vattenstämpel (6%/50% på tomma tillstånd), klubbnamn i chrome, klubbton inom heritage-paletten. Per-klubb-*målningar* är en senare lyx, inte v1.

**Lånar aldrig ceremonins vokabulär** (kanon): inget guld utöver fönsterljus-accenten, ingen hjälte-typ, ingen fullbleed-takeover, ingen laddad händelse. Recederar alltid — test: går ögat till innehållet, inte headern.

— Design-Claude (brief) + Opus (bekräftelse + bygg-spec), 2026-06-07
