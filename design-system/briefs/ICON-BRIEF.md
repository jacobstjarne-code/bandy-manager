# ICON-BRIEF · Bandy Manager
*Ikonografi-system för hela appen. Drivs i FAS 1.*

---

## ⚠️ Produktionsregler (uppdaterat 2026-04-24)

**SVG vs bildasset — vad renderas med vad:**

| Kategori | Metod | Motivering |
|---|---|---|
| **Geometriska piktogram** (hus, sköld, verktyg, mål, pokal, kontrakt, rapport, diagram) | SVG direkt i kod | Raka kanter, symmetri, skalar rent, lätt att underhålla. |
| **Organiska silhuetter** (bandyklubba, spelare, domare, fans, ansikten, djur) | **Bildasset (PNG/SVG-export från illustrator)** — *aldrig* hand-kodad SVG | Kräver kurvor och proportioner som inte går att få rätt via path-koordinater. Diminishing returns. |

**Regel:** Om en ikon har en *levande form* eller *en referens från verkligheten med specifik anatomi* → bildasset. Kodar man den som SVG blir det en approximation av en approximation.

**Workflow för bildassets:**
1. Samla in 2–3 referensbilder från verkligheten.
2. Generera bildasset via bildverktyg med referens + designbrief (palett, stil, storlek).
3. Exportera som transparent PNG i 3 storlekar (16, 24, 48 px) + en källa-SVG om möjligt.
4. Lägg i `assets/icons/organic/` och registrera i `preview/brand-icons.html`.

**Markering i denna brief:** ikoner som kräver bildasset har `📷 bildasset` i kolumnen.

---

## 🎯 Uppdraget

Ersätta **alla emoji** som kategori- och funktionsmarkörer med ett **egen­designat piktogramsystem** i en konsekvent linje­snittstil. Totalt **49 ikoner** över fem grupper.

Emoji funkar **inte** med designsystemets läder- och pappersestetik: de är färgglada plastytor på en yta som ska kännas sliten, tryckt och pålitlig. Piktogram löser det.

---

## Designprinciper (gemensamma för alla 49)

1. **70-tals linjesnitt, inte outline-pack.** Referens: svenska skolplanshers symbollexikon, idrotts­förbundens manualer 1971–1984, ISO 7000-liknande men värmlandsversion. *Inte* Tabler-style fina hairlines; *inte* Heroicons.
2. **Monokrom, ingen fyllning som standard.** Varianter:
   - `default` — linjer endast (färg = currentColor)
   - `solid` — för aktiva navigations-states (filled silhouette)
   - `copper` — endast när ikonen är *aktiv primary* (t.ex. vald bottom-nav-tab)
3. **Stroke:** 1.5 px vid 24 px grid. 1.75 px vid 20 px. 2 px vid 16 px. Ingen skalning av strokes — redraw per storlek.
4. **Linjeändar:** `round`. Aldrig kvadratiska — det är för hårt.
5. **Samma linje­tjocklek inom en ikon.** Ingen variabel vikt, ingen handtecknings­känsla. Disciplin.
6. **Platt framifrån-vinkel.** Inga isometriska perspektiv. Inga 3/4-vy. *Förutom* matchhändelse-ikoner som får en antydan av rörelse (pil, båge).
7. **Konceptuellt specifika.** En "Mål" ska inte vara en fotboll — det ska vara en **bandymålbur med boll i garnet**. En "Räddning" ska inte vara en hand — det ska vara en **målvaktshandske med klubba**. Gör det *till bandy*, inte generiskt.

**Filter:** *Förstärker detta (känns bandy/bruksorts­idrott), kontrasterar detta (gammal form / modern betydelse), eller är det bara kul?* → bara de två första passerar.

---

## Grupp 1 — KATEGORIER (24 ikoner, 16 px)

Ersätter `docs/DESIGN_SYSTEM.md §2`. Renderas vid SECTION LABEL-text på 16 px (**inte** 8 px; piktogram behöver mer yta än emoji).

| Emoji idag | Kategori | Piktogram-koncept | Metod |
|---|---|---|---|
| 🏒 | Match/spel | Korslagda bandyklubbor + boll | 📷 bildasset |
| 💰 | Ekonomi | Myntpung med snöre — bruks­kassörens väska, inte moderna kassetill | SVG |
| 👥 | Trupp | Tre huvuden i silhuett, 70-tals lagfoto-komposition | 📷 bildasset |
| 👤 | Patron | Kavaj med nål, inte "höga hatten" — se CHARACTER-BRIEF | 📷 bildasset |
| 🏋️ | Träning | Bandyklubba lutad mot bänk + svetthandduk |
| 🏠 | Bygdens puls | Klockstapel / kyrktorn (lokal­samfundets hjärta) |
| 🏘️ | Orten | Skorstenssiluett med rök — bruksorten själv |
| 🏛️ | Kommun | Trä­pulpet med klubba (kommunstyrelse, inte parthenon) |
| 🏟️ | Anläggning | Läktar­bänk i profil + strålkastare |
| 🏆 | Cup | Pokal i enkel kontur, inget heraldiskt |
| ⚔️ | Slutspel | Korslagda klubbor med blixt — inte svärd |
| 📬 | Inkorg | Brevlåda med öppet lock (svensk gul brevlåda, stiliserad) |
| 🩹 | Skador | Kryss-plåster med isbandage |
| 🎓 | Akademi | Skolklocka + liten bandyklubba |
| 🔍 | Scouting | Anteckningsbok + blyerts­penna (inte kikare — en scout ser inte *nu*, hen antecknar) |
| 📋 | Kontrakt | Hopvikt papper med stämpelsigill |
| 💼 | Transfers | Två pilar i U-form runt en bandyklubba |
| 🔥 | Derby | Masugnsöppning — bruksindustrins eld, inte brasa |
| ⭐ | Betyg | Fem­hörnstjärna **i linje**, inte fyllt galleri-stjärna |
| 📊 | Tabell | Stapel­diagram, tre staplar, olika höjder |
| 📈 | Form | Linje­diagram med små krosspunkter — tryckt läroboksgraf |
| 🩺 | Bandydoktorn | Stetoskop böjt runt bandyklubba |
| 📖 | Spelguide | Uppslagen bok med tryckvinkel |
| 📣 | Pep-talk | Megafon *i profil*, 70-tals idrottsledare |

**Leverans:** 24 SVG-filer @ 16 × 16 px grid, även 20 px och 24 px varianter. Namnkonvention: `ico-cat-{snake_case}.svg`.

---

## Grupp 2 — BOTTOM NAV (6 ikoner, 24 px)

Sex tabbar: Hem · Trupp · Match · Tabell · Transfers · Klubb.
Default: linjer, 1.75 px stroke. Aktiv: fyllt silhouette i koppar.

| Tabb | Nu (lucide) | Piktogram-koncept |
|---|---|---|
| Hem | `Home` | **Klubbhus** — bruksidrotts­föreningens träbyggnad med enkel gavel, inte generiskt hem |
| Trupp | `Users` | Tre huvuden på läktar­bänk från sidan |
| Match | `Swords` | Korslagda bandyklubbor (ej svärd) |
| Tabell | `Table2` | **Prispall** med siffror 1-2-3 — tabell som tävlings­resultat |
| Transfers | `ArrowLeftRight` | Två händer som skakar hand, 70-tals bruk­sorts­avtal |
| Klubb | `Building2` | Klubbhusets **gavel** frontalt, med fönster och dörr |

**Leverans:** 12 SVG (6 default + 6 solid). Namnkonvention: `nav-{hem|trupp|...}-{line|solid}.svg`.

---

## Grupp 3 — MATCHHÄNDELSER (8 ikoner, 16 px)

Används i commentary feed i matchvyn. En färgkod per typ (redan i `_screens.css`), ikonen är monokrom och tar färg från sin rad.

| Händelse | Emoji idag | Piktogram-koncept |
|---|---|---|
| Mål | 🏒 | **Boll i nät** — stiliserat bandy­mål med rörelse­linjer |
| Assist | — | Pil som böjs runt en prick — enkel "passning" |
| Räddning | 🧤 | **Målvaktshandske i profil** med boll framför |
| Hörna | 📐 | Hörnflagga på pinne, sett från sidan |
| Straff | 🎯 | **Straffpunkt med pil** mot mål |
| Utvisning | 🟥 | **Utvisnings­bänk** (bruksorts-UX: inte kort som i fotboll) — liten bänk med 10 i bakgrund |
| Byte | 🔄 | Två pilar i motriktning (*inte* cirkel av loop-emoji — en pil ut, en in) |
| Skada | 🩹 | Bandyklubba + plåster i kors |

**Leverans:** 8 SVG @ 16 px. Namnkonvention: `event-{typ}.svg`.

---

## Grupp 4 — TRÄNINGSOMRÅDEN (6 ikoner, 20 px)

Används på träningsskärmen och i spelarprofilen (attribut-sektioner).

| Område | Emoji idag | Piktogram-koncept |
|---|---|---|
| Teknik | 🎯 | **Boll på klubbans blad** — preciserad passning |
| Kondition | 💪 | **Stoppur + löpspår** |
| Försvar | 🛡️ | **Korslagda klubbor** i blockposition |
| Anfall | ⚡ | **Pil** som går genom en försvars­prick |
| Taktik | 🧠 | **Tavla med krita­märken** — taktiktavla, inte hjärna |
| Styrka | 🏋️ | **Skivstång** horisontellt |

**Leverans:** 6 SVG @ 20 px. Namnkonvention: `train-{område}.svg`.

---

## Grupp 5 — GRANSKA-NAV (5 ikoner, 24 px)

Nav-rad i granska-skärmen efter match.

| Vy | Emoji idag | Piktogram-koncept |
|---|---|---|
| Översikt | 📊 | **Protokoll­blad** med rader |
| Spelare | 👥 | Tre huvuden (samma som kategori-ikon men större) |
| Shotmap | 📈 | **Plan i fågelperspektiv** med prickar — det här är en ikon där själva innehållet syns |
| Förlopp | ⚡ | **Tidslinje** med händelse-prickar |
| Analys | 🎓 | **Blyerts­penna över anteckningsbok** |

**Leverans:** 5 SVG @ 24 px (nav-storlek). Namnkonvention: `rev-{vy}.svg`.

---

## Övriga glyfer (ingår, men inte räknade in i 49)

- **Väder­ikoner** (5 st) — snö, sol, dimma, vind, regn. Redan delvis i bruk men inkonsekvent. Ska få samma linje­snittsestetik. Placeras i header och matchkortets väderrad.
- **Arena-etikett-ornament** (1 st) — liten bandyklubba-dingbat som sitter på scoreboardens ram, typ "Westerstrand 1974"-estetik.
- **Chevron `›`, pilar `→ ↑ ↓`, punkter `• ✓`** — oförändrade, redan del av design­systemet.

---

## Leverans­format per ikon

Varje ikon levereras som:
- **`.svg`** — vektor, currentColor, viewBox `0 0 24 24` (eller `16`/`20` beroende på grupp), `<title>` och `<desc>` inbakat för a11y
- **`.tsx`** — React-komponent enligt befintlig pattern i kodbasen
- **Preview-kort** i `preview/brand-icons.html` (ersätter nuvarande lucide-listan)

Inga PNG, inga sprites, inga icon-fonts. SVG-only.

---

## Stil­referenser att dela med illustratören

- **Skolplansher** från 1970-tal (svenska skolor, ISO 7000-era)
- **Svenska bandyförbundets** gamla manualer — man kan hitta skanningar
- **Westerstrand­tavlor** — solgubben i Karlstad ("Solen skiner i Karlsta") är stil­kanon för *naivistisk idrotts­ikonografi*
- **Dan Olofsson**-pamfletter, idrottsnämnden­s trycksaker 1974–1980
- **Otl Aicher × svensk bruksestetik** — om det fanns en version av München-OS-piktogrammen tecknad av en verkstadsklubb i Forsbacka, det är ljudet

---

## Scope gate (ingen scope creep)

Dessa ikoner ska **endast** täcka:
- Kategori­markörer i section labels
- Bottom-nav-tabbar
- Matchhändelse-feed
- Tränings­områden
- Granska-nav

**INTE:** sociala ikoner (Facebook/Twitter — behövs inte), settings-gear (lucide `Settings` stannar), generiska UI-glyfer (close X, chevron, checkmark — de stannar).

---

## Beroenden

- Ingen. ICON-BRIEF kan utföras helt fristående.
- FAS 2 (scoreboard + matchestetik), FAS 3 (taktik), och alla skärmar i allmänhet **väntar** på dessa ikoner för att kunna bli "klara".

---

## Estimerad tidsåtgång

En illustratör med erfarenhet av ikon­system: **2–3 veckor**. Generator-AI + handkorrigering: **1 vecka**. I båda fallen följt av 2–3 dagars finkorrigering när de möter skärmarna i FAS 2-4.
