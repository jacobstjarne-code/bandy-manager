# META — Damdata-blockaden

**Skapad:** 2026-04-26
**Status:** Aktiv blockad

---

## Vad frågorna handlar om

31 Q-facts i Bandy-Brain ställer frågor om dambandy — specifikt om
Damelitserien (Svenska Bandyförbundets toppserie för damer). Frågorna
täcker samma analytiska territorium som herrserieanalysen men applicerat
på damserien:

- Hörneffektivitet och konverteringsgrad i damserien
- Målminutsfördelning och kluster (slutminuter, halvtidsgräns)
- Halvtidsledningens prediktiva kraft
- Hemma/borta-effekter
- Comeback-mönster och matchdynamik
- Jämförelser dam/herr för att testa om mönster är generella

De flesta frågorna är naturliga följdfrågor spawnade av herrserieanalysen:
"stämmer samma mönster i damserien?", "finns motsvarande data?",
"skiljer sig detta åt mellan könen?".

## Varför de inte kan besvaras nu

Bandygrytan-scrapern som driver findings-pipelinen täcker bara herrserien
(Elitserien). Bandygrytan.se har statistik för herrserien med tidsstämplade
mål och hörnstatistik. Damelitserien är antingen inte publicerad på
bandygrytan.se i samma format, eller har inte skrapats.

Fyra findings dokumenterar blockaden explicit:

- **Finding 020** — Dammatchdata saknas för jämförelse
- **Finding 023** — Damernas målfördelning saknar tillräcklig data
- **Finding 027** — Data saknas för taktisk hörnanalys
- **Finding 028** — Hörneffektivitet damserie: data saknas

Finding 007 (Dam vs herr) innehåller viss damdata (matchresultat,
halvtidsresultat, grundläggande hörnstatistik) men saknar tidsstämplade
målminutdata — vilket krävs för de flesta frågorna om timing och kluster.

## Blockerade Q-IDn (31 stycken)

Se DAMDATA_BLOCK_2026-04-26.md för fullständig lista.

Tematisk uppdelning:

**Hörneffektivitet i damserien (6 Qn):**
Q021, Q043, Q045, Q046, Q118, Q124

**Målminutsfördelning och timing (8 Qn):**
Q023, Q049, Q082, Q083, Q086, Q097, Q098, Q099

**Halvtidsledning och match-outcome (5 Qn):**
Q022, Q029, Q062, Q078, Q084

**Hemma/borta-effekter (5 Qn):**
Q050, Q057, Q159, Q173, Q183

**Comeback och matchdynamik (4 Qn):**
Q085, Q135, Q190, Q194

**Datastruktur och metodologi (3 Qn):**
Q096, Q120, Q125

## Vad som krävs för återöppning

1. **Dataskrapning av Damelitserien.** Minst 3 säsonger med
   tidsstämplade mål per match (minut + aktionstyp). Hörnstatistik
   separerad från öppet spel. Halvtidsresultat per match.

2. **Format-kompatibilitet.** Datan behöver laddas in i
   `bandygrytan_detailed.json`-formatet (se `docs/data/SCHEMA_DETAILED.md`)
   med `series: "dam"` som separat fält.

3. **Pipeline-konfiguration.** `analysis.py` behöver stödja
   `params: {series: "dam"}` för samtliga analystyper som idag
   kör mot herrdata.

4. **Återöppning av blockerade Qn.** Grep efter
   `unblocks_when: "Damelitserien skrapad"` — ändra alla till `status: open`.

## Omfång

Damelitserien har funnits sedan 1997. Bandygrytan.se borde ha data
från minst 2015 och framåt. En rimlig avvägning är att skrapa
säsongerna 2019–2026 (samma period som herrdata) för maximal
jämförbarhet.

Tidsuppskattning: 1–2 dagars arbete för scraping + pipeline-anpassning.
Analys-pipeline körs sedan automatiskt mot de nya frågorna.
