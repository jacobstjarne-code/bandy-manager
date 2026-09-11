# Klubbmärken — kontrakt + hjälte-bildprompter v2

Ersätter `KLUBBMARKEN_BILDPROMPTER_2026-09-10.md`. Bygger på Bilaga E (motiv/färg/proveniens) men löser två saker v1 missade: homogeniteten och tre svaga motiv.

## Vad som ändrades

- **Homogeniteten löst.** v1 låste "samma sköld över hela setet" → tolv ikoner ur en mall, läste som stock-ikoner. v2: **formen varierar** (sköld i olika snitt / roundel / vimpel / chief-rand / delat fält). Det gemensamma är **tonen**, inte formen — spelets slitna retro-screentryck. Formen bär nu separation tillsammans med siluetten.
- **Tre fixar** (Jacobs beslut): Forsbacka **masugn** (v1 "böjt järn" läste som bock/checkmark), Karlsborg **norrsken grönt-mot-svart** (läser äntligen som norrsken, inte ränder; lämnar gul/svart-klustret), Västanfors **gruvlave** (v1 järntecken läste som ♂/Mars).
- Söderfors (ankare) och Målilla (termometer) behålls — de funkade.

## Familjetråden — samma TON i varje prompt (klistras in exakt)

> Rendered as a worn vintage 1960s Swedish club badge — a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge.
> NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

## Vakter

- **10 px:** silhuetten måste bära vid liten storlek — texturen försvinner ändå, så retro-tonen är gratis där.
- **Kontrollerad heterogenitet, inte kaos:** allt måste fortfarande sitta i en tabellrad utan att skrika. Formen varieras, tonen håller ihop.
- **Separation:** inom varje färgkluster — olika FORM + olika MOTIV. (Blå: roundel/chief/vimpel. Röd: chief/sköld/delat. Gul-orange: sköld/sköld/roundel. Grön/teal: sköld/roundel/sköld.)
- **Abstrakt-varning:** Gagnefs våg-Y och Lesjöfors fjäder ligger närmast abstrakt (den klassen failade på Forsbacka/Karlsborg i v1). Gjorda maximalt konkreta nedan — håll ögonen på just dem vid granskning.
- **Monogram medvetet utelämnat:** Gemini garblar rena bokstäver. Formvariationen bärs av sköld-snitt/roundel/vimpel/chief/delat fält i stället.

## De tolv (form · motiv · färg)

| Klubb | Form | Motiv | Färg |
|---|---|---|---|
| Forsbacka | platt-bottnad sköld | masugn | gul/mörk |
| Söderfors | rundad sköld | ankare | orange/svart |
| Västanfors | sköld med chief | gruvlave | röd/vit |
| Karlsborg | roundel | norrsken | grönt på svart |
| Målilla | spetsig sköld | termometer | röd/vit |
| Gagnef | delat fält | våg-Y (älvmöte) | guld på rött |
| Hälleforsnäs | roundel | korsade hammare | blå |
| Lesjöfors | vimpel (svalstjärt) | industrifjäder | blå/guld |
| Rögle | hög smal sköld | fyr | teal |
| Slottsbron | sköld med chief | bro | blå |
| Skutskär | spadformad sköld | lax | grön/gul |
| Heros | roundel | segelbåt | gul/svart |

---

## Prompterna

### Forsbacka — masugn, platt-bottnad sköld, GUL
A worn vintage 1960s Swedish club badge as a flat-bottomed heater shield in muted yellow with a dark outline, a single bold dark blast-furnace silhouette centered (a tall tapering industrial furnace stack, heavy and simple). Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, checkmark, tick, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

### Söderfors — ankare, rundad sköld, ORANGE-SVART
A worn vintage 1960s Swedish club badge as a classic rounded heater shield in muted orange, a single bold black ship's anchor centered. Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

### Västanfors — gruvlave, sköld med vit chief, RÖD-VIT
A worn vintage 1960s Swedish club badge as a heater shield in muted red with a white chief (a solid horizontal band across the top third), a single bold dark mine head-frame silhouette centered on the red field (a tall pit-head winding tower / gruvlave, an angled timber-and-steel frame with a winding wheel at the top). Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, gender symbol, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

### Karlsborg — norrsken, roundel, GRÖNT PÅ SVART
A worn vintage 1960s Swedish club badge as a circular club roundel in near-black, a stylized green aurora borealis across the upper half — a few bold curved ribbons of green light hanging and arcing like a curtain across the top of the roundel (curtain-like, NOT vertical stripes). Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, vertical stripes, water waves, text, letters, numbers, wordmark, stars, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

### Målilla — termometer, spetsig sköld, RÖD-VIT
A worn vintage 1960s Swedish club badge as a pointed shield in muted red, a single tall simple white thermometer centered (a straight vertical tube with a round bulb at the bottom). Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, scale ticks, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

### Gagnef — våg-Y (älvmöte), delat fält, GULD PÅ RÖTT
A worn vintage 1960s Swedish club badge as a shield in muted red with a divided field, a single bold gold forked river-confluence centered (two gently wavy water channels coming down from the top corners and merging into one wavy stem toward the bottom — clearly two rivers meeting into one, a wavy Y). Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, tree, arrow, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

### Hälleforsnäs — korsade hammare, roundel, BLÅ
A worn vintage 1960s Swedish club badge as a circular club roundel in muted blue, two bold crossed smith's hammers centered in cream/off-white. Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

### Lesjöfors — industrifjäder, vimpel, BLÅ-GULD
A worn vintage 1960s Swedish club badge as a swallowtail pennant / triangular club flag in muted blue, a single bold gold industrial coil spring centered (a helical compression spring seen from the side, a few clear even coils, unmistakably a metal spring). Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, spiral swirl, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

### Rögle — fyr, hög smal sköld, TEAL
A worn vintage 1960s Swedish club badge as a tall narrow shield in muted teal sea-green, a single bold cream lighthouse tower centered (a simple tapering tower with a lantern room on top). Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, light beams, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

### Slottsbron — bro, sköld med chief, BLÅ
A worn vintage 1960s Swedish club badge as a heater shield in muted blue with a lighter-blue chief (a horizontal band across the top third), a single bold cream bridge silhouette centered on the lower field (a simple beam bridge deck resting on two or three vertical piers). Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, water waves, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

### Skutskär — lax, spadformad sköld, GRÖN-GUL
A worn vintage 1960s Swedish club badge as a curved spade-shaped shield in muted green, a single bold yellow leaping salmon centered (a stylized curved fish). Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, multiple fish, water lines, tree, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

### Heros — segelbåt, roundel, GUL-SVART
A worn vintage 1960s Swedish club badge as a circular club roundel in muted yellow, a single bold black sailboat silhouette centered (a simple hull with one triangular sail). Rendered as a screen-printed, part-embroidered cloth patch with slightly misregistered flat colour, a muted faded palette, soft felt-and-thread texture, imperfect hand-printed edges and a little honest age and wear; NOT a clean modern vector icon or app icon. One bold simple motif with a strong silhouette that still reads clearly at very small size. Square 1:1, transparent background around the badge. NEGATIVE: clean vector sharpness, glossy 3D, gradient shading, photorealism, modern flat app-icon look, text, letters, numbers, wordmark, water lines, bear, multiple emblems, busy fine detail, drop shadow, background scenery, realistic photo.

---

## Efter generering

Granska de tolv som GRUPP: läser formvariationen som "olika klubbar, samma värld" och inte som kaos? Håller varje motiv vid 10 px? Är abstrakt-paret (Gagnef, Lesjöfors) konkreta nog? Proveniens-låset (sju kommunvapen + tre svaga färger, Bilaga E öppet-lista) står kvar innan setet fryses. Och Code-beroendet: de små SVG:erna i `ClubBadge.tsx` måste uppdateras till samma motiv/form/färg när hjälte-bilderna landat.
