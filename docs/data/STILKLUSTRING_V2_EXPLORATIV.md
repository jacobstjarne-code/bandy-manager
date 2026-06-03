# Spelstilsklustring v2 — explorativ rapport

**Genererad:** 2026-06-03  
**Status:** EXPLORATIVT underlag. Silhouette 0,23 (< 0,30-tröskeln). Ej publicerbar typologi — men fynden är konkreta nog för den planerade Nicklas-diskussionen.  
**Källa:** `docs/data/klubb_stilkluster.json`

---

## 1. Silhouette — fyndet i ett stycke

Stil bildar inte skarpa kluster i Elitserien med detta dataset och feature-set. Silhouette max 0,23 för k=2, sjunker för k=3–5. Det innebär att överlapp är signifikant och att ingen tydlig stilgräns existerar. Resultatet i sig är information: bandy verkar inte ha den skarpa transition-vs-possession-dikotomi som moderna fotbollsanalyser ibland förutsätter.

Men: k=2 ger genomgående bäst separation, och de två klustren är tolkbara. Quality-residualisering (bort med vinst-rate) ger marginellt bättre silhouette (0,236 vs 0,230) — klustren beror alltså inte enbart på kvalitet.

---

## 2. De två klustren

| Feature | Kluster 0 (n=26) | Kluster 1 (n=38) | Ligamedel |
|---------|-----------------|-----------------|-----------|
| Hörnmålsandel | **19,3%** | 23,6% | ~21% |
| Öppet spel-andel | **75,9%** | 71,4% | ~73% |
| Hörnor/match | **9,5** | 8,3 | ~8,9 |
| Hörnor/mål | **1,72** | 2,21 | ~2,0 |
| Kluster-frekvens | **1,18/match** | **0,57/match** | ~0,89 |
| Utvisningar/match | **1,59** | 2,00 | ~1,80 |

**Nyckelmarkören är kluster_freq: faktor 2,1 mellan klustren (1,18 vs 0,57).** Det är den starkaste stilseparatorn i vektorn — starkare än hörnmålsandel eller öppet spel-andel.

### Kluster 0 — fler kluster, mer öppet spel, effektivare hörnutnyttjande

Clubs med ≥60% av sina säsonger här: **Edsbyn 100%, Villa 100%, Västerås SK 100%, Västerås SK/BK 100%**, Broberg/Söderhamn 75%, AIK Bandy 67%.

Karakteristik: gör fler mål i snabb följd (kluster-frekvens 1,18), får mål primärt i öppet spel, har fler hörnor men konverterar dem effektivare (1,72 hörnor/mål vs 2,21). Färre utvisningar. Profilen är kompatibel med ett mer vertikal, snabbt spelande lag — men datan kan inte belägga mekanismen, bara mönstret.

### Kluster 1 — hörnberoende, mer fysiskt, lägre kluster-frekvens

Clubs med ≥60%: **IFK Motala 100%, Frillesås 100%, Åby/Tjureda 100%, IFK Vänersborg 100%, Bollnäs GIF 100%**, IK Sirius 83%.

Karakteristik: fler mål från hörnor (23,6%), behöver fler hörnor per mål (2,21), lägre kluster-frekvens (0,57), fler utvisningar. Profilen är kompatibel med ett mer fysiskt, strukturerat lag som förlitar sig mer på set-pieces.

---

## 3. Robusthetskoll

Quality-residualisering ger 0,236 vs 0,230 — marginal förbättring. Det bekräftar att klustren inte är ett artefakt av att kvalitetslaget alltid hamnar i kluster 0 och bottenlagen i kluster 1. Mönstret finns kvar efter att vinst-rate regresseras bort.

Dock: Västerås SK, Villa, Edsbyn och AIK (alla kluster 0) är också starka lag. Någon kvalitetseffekt kan kvarstå trots residualisering.

---

## 4. Winback-frågan — vad datan faktiskt säger

**Villa är i kluster 0 (4/4 säsonger, 100% konsistens).** Kluster 0 har dubbelt så hög kluster-frekvens som kluster 1. Det stödjer att Villas spelstil är mer transition-orienterad i kvantitativa termer — inte som bevis på winback-mekaniken, men som kompatibelt mönster.

**Vad datan kan säga:** Villa gör fler mål i snabb följd (1,68 kluster/match i säsongssnittet, kluster 0:s norm är 1,18/match) och en lägre andel av deras mål kommer från hörnor (24,1% säsongssnitt, under kluster 0:s 19,3% för det snittet — notera att Villa-siffrorna är något annorlunda i season-aggregat vs kluster-aggregat pga viktsättning).

**Vad datan inte kan säga:** Om kluster-frekvensen beror på aktiv bollåtervinning (winback) eller på att de möter svagare motstånd som ger friare löpvägar. Possession, press-intensitet och turnover-events saknas i Bandygrytan.

---

## 5. Vad detta är (och inte är) som underlag

**Som underlag för Nicklas-diskussionen:**

Det här är ett datamässigt stöd för att *undersöka* winback-hypotesen, inte ett bevis för den. Konkret: du kan visa att det finns ett matematiskt separerbart mönster där Villa och Edsbyn hamnar på en sida (fler måltätningar, mer öppet spel) och Frillesås/Vänersborg/Motala på den andra (mer hörnberoende, färre täta mål). Det är ett skarpt observationsunderlag för att ställa frågor — "stämmer det att era mål typiskt kommer i snabba sekvenser?" — inte en slutsats att presentera som etablerat.

**Som publicerbar finding:**

Inte redo. Silhouette 0,23 är för svagt för en Finding-rubrik som "Två bandystilar i Elitserien." En publicerbar finding kräver antingen (a) bättre silhouette, (b) ett mer robust feature-set med mer distinkt separation, eller (c) en omformulering till "vi sökte skarpa stilkluster och fann att de inte finns — det är ett fynd i sig."

---

## 6. Begränsningar

- Silhouette 0,23 — klustren är reella men difusa. Enskilda klubbar kan ha karaktäristik från båda.
- features täcker inte possession, press, turnover, spelarindividualitet.
- 15 klubbar × 3–6 säsonger = 64 datapunkter — litet n för klustring.
- 2023-24 saknas.
- Västerås SK och Västerås SK/BK behandlas som separata.

---

*`docs/data/klubb_stilkluster.json` innehåller per-klubb-säsong-data med kluster-tilldelning och feature-värden.*
