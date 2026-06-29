# CODE-uppdrag: Klubbnamns-normalisering + re-run av 053/054

**Skapad:** 2026-06-03
**Beställare:** Jacob (Opus)
**Prioritet:** Kör FÖRST av de tre nya uppdragen — motor-kalibreringen och dam/herr använder uppdaterade 053/054-siffror.
**Tidsbudget:** ~2–3h.

---

## Problem

Klubbnamn normaliseras inte i datasetet. Disentanglingen avslöjade att "Villa-Lidköping BK" och "Villa Lidköping BK" behandlas som **separata lag** — Sirius–Villa låg i två poster (n=14 + n=4) med olika mönster. Samma sak med "Västerås SK" / "Västerås SK/BK". Det splittrar alla matchup- och klubbnivå-aggregat och förvränger 053 (temperatur) och 054 (stil).

## Uppgift

1. **Bygg en kanonisk klubbnamns-karta.** Börja med de kända varianterna (Villa, Västerås) men **skanna hela lag-namnlistan** efter fler — fuzzy match på t.ex. Levenshtein-avstånd, plus en manuellt granskningsbar lista över alla föreslagna sammanslagningar innan de tillämpas.
2. **Tillämpa kartan vid dataladdning** (en normaliseringsfunktion, inte hårdkodade ersättningar spridda i koden).
3. **Kör om 053 (temperatur) och 054 (stilklustring)** mot normaliserad data.
4. **Rapportera vilka siffror som ändras** — matchup-temperaturer, klustertillhörighet, hemma/borta-record.

## Kritisk varning

Slå INTE ihop lag som faktiskt är olika. En klubb som bytt namn (samma kontinuitet) ska slås ihop; två olika klubbar med snarlika namn ska INTE. Vid minsta tvekan — lägg i granskningslistan för Jacob, slå inte ihop automatiskt. Hellre en kvarstående dubblett än en felaktig sammanslagning.

## Vad som ska hända med findings

- Om 053/054-siffrorna rör sig meningsfullt: uppdatera finding-sidorna (`bandy-brain/src/pages/findings/053/` och `054/`). Notera särskilt om Sirius–Villa-bilden eller någon klustertillhörighet ändras.
- Hemmafördels-siffrorna (Villa 82,7 % / 83,9 %, Sirius 53,1 % / 50,0 %) bör räknas om på normaliserad data — de blir motor-kalibreringens hemmafördels-mål.

## Output

- Kanonisk namnkarta (committad, granskningsbar).
- Refresh:ade 053/054-tal + uppdaterade finding-sidor om de rör sig.
- Post i `DATA.md`:s audit-lista: normalisering åtgärdad, med kartan som referens. (Fyndet finns redan noterat i `INTERNAL_DATA_NOTES.md` — länka dit.)

## Rapportering

Vilka sammanslagningar gjordes, vilka 053/054-tal ändrades, och om någon slutsats påverkades. Om inget rör sig meningsfullt är det också ett svar — då var splittringen kosmetisk.
