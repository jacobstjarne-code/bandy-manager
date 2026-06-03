# CODE-uppdrag: Minute-konvention recompute + deploy av Bandy Brain

**Skapad:** 2026-06-03
**Beställare:** Jacob (Opus)
**Sammanhang:** Opus har den här sessionen gjort en rad redaktionella rättningar i `bandy-brain/src/` (se nederst). Det här uppdraget gör den sista databeroende rättningen — minute-konventionen — och deployar sedan hela sajten.

---

## Del 1 — Minute-konvention recompute (data)

### Bakgrund
Vi fixade minute-konventionen tidigare: andra halvlek identifieras via en **half-flagga** (schemaVersion 4+), inte via `minute >= 46`. Den gamla tröskeln felplacerade 1:a-halvlekens tilläggstid (minut 45–53 i rådata) i andra halvlek. Comeback-findingsen (017, 041, 042, 043) är redan markerade som ersatta av 051. Men **andra findings som binnar mål/händelser per rådata-minut nära halvtidsgränsen kan fortfarande bära artefakten.**

### Uppgift
1. **Skanna findings 001–046** efter alla som binnar mål eller händelser per minut, särskilt buckets som spänner över eller ligger nära minut 45–46. Sannolika kandidater utifrån rubrikerna:
   - **008 "Klustret 40–50 är jämnt fördelat"** — 40–50-bucketen ligger rakt på halvtidsgränsen. Tydligaste fallet.
   - 005 "Mål faller inte jämnt", 009 "Mål faller tidigare i jämna matcher", 010 "Hörnmål toppar mitten, öppet spel slutet", 013 "Dam och herr likartad målminutsfördelning", 031 "Slutminutstopp". Verifiera vilka som faktiskt binnar per minut.
2. **Räkna om varje drabbad finding med half-flaggan** i stället för `minute >= 46`.
3. **Rapportera per finding:** gammalt värde, nytt värde, och om slutsatsen står eller revideras.
4. Verifiera även att de målminut-baserade siffrorna som nu står på **startsidan och i kalibreringsfindingsen** (t.ex. "54 % av målen i 2:a halvlek") är beräknade med half-flaggan.

### Vad som ska hända med resultatet
- **Slutsats står (siffran rör sig inte meningsfullt):** bekräfta, ingen ändring i texten behövs.
- **Slutsats revideras:** uppdatera findingens siffror, eller lägg en supersession-/korrigeringsbanner i samma stil som de på 017/041/042/043 (gul vänsterkant, `#c08a2e`). Behåll PoC-andan — findings får stå som hypoteser, vi rättar bara minute-artefakten.

### Vad Code INTE ska göra
- Inte röra findings vars slutsats inte flyttar sig — bara bekräfta.
- Inte ta bort findings. (Jacob vill ha kvar WIP-platshållare och kalibreringsloggar synliga som transparens.)
- Inte använda `minute >= 46` någonstans — bara half-flaggan.

### Output
- Recompute-rapport i `docs/data/` (per finding: gammalt/nytt/står-eller-revideras).
- Eventuella edits i berörda `bandy-brain/src/pages/findings/0NN/index.astro`.

---

## Del 2 — Bygg och deploya

Opus har den här sessionen ändrat följande i `bandy-brain/src/` (källändringar, ej byggda/deployade):

- `pages/findings/index.astro` — PoC-framing överst, rubriker för 052 (16 %) och 054
- `pages/findings/052/index.astro` — Base-titel 16 %, duration-begränsning → pekar till 055
- `pages/findings/053/index.astro` — asymmetri-tabellen ersatt med Sirius-disentanglingen (klass, inte plan), klubbnamns- och duration-noter
- `pages/findings/054/index.astro` — helt omskriven till v2 (kvalitetsneutral klustring, feature-tabell)
- `pages/findings/055/index.astro` — tolkningen omskriven ("låt färre passera", ingen gradinflation, broken-windows flaggad)
- `pages/findings/017,041,042,043/index.astro` — supersession-banners (ersatt av 051)
- `pages/index.astro` — hero omskriven (verklig data först), "Senaste finding" 004 → 051
- `pages/about/index.astro` — tvåspårsframing, 1 124 → 1 321 matcher, "perspectives" → "perspektiv"

**Efter Del 1:** kör `npm run build` i `bandy-brain/`, åtgärda eventuella byggfel (Astro klagar på obalanserade taggar eller oescapade `&`/`<` — alla mina tabeller använder entiteter, men dubbelkolla), och deploya till Vercel.

### Klubbnamns-normalisering (notera, inte blockerande)
Disentanglingen avslöjade att klubbnamn inte normaliseras: "Villa-Lidköping BK" och "Villa Lidköping BK" (och "Västerås SK" / "Västerås SK/BK") behandlas som separata lag, vilket splittrar matchup-aggregat. Lägg in det som en post i data foundation-auditen / `DATA.md` för åtgärd vid tillfälle — inte en del av det här uppdraget.
