# CODE-uppdrag: Dam vs herr — strukturell jämförelse (Bandy Brain-finding)

**Skapad:** 2026-06-03
**Beställare:** Jacob (Opus)
**Beroende:** Kör efter klubbnamns-normaliseringen (vissa metriker aggregerar per klubb).
**Sekretess:** Publik Bandy Brain-finding, liganivå. Förbundsrelevant och icke-känslig — damsidan är ett prioområde för SBF.
**Tidsbudget:** ~3–4h.

---

## Varför

Dam-anomalin har dykt upp gång på gång: reformeffekten +22 % mot herrarnas +16 % (Finding 052), annan 10-min-fördelning i reform-mekanismen (29 % av dam-ökningen mot herrarnas 7 %, Finding 055). Damreglerna är **identiska** med herrreglerna (se REGLER.md), så strukturella skillnader är äkta — inte regelartefakter. En fokuserad jämförelse är värd ett eget fynd.

## Uppgift

Jämför dam och herr på de strukturmetriker vi redan beräknat för herr:

- Mål/match och hörnmålsandel
- Comeback-frekvens och post-paus-fönstret (Finding 051-metoden, half-flaggan)
- Utvisningsstruktur: 5/10-uppdelning, orsaksfördelning, reform-effekt (redan delvis i 052/055)
- Hemma/borta-fördel
- Stilfördelning (om dam-data räcker för 054-metoden)

## Epistemik (läs)

- **Behandla dam och herr symmetriskt.** Herr är inte normen och dam avvikelsen — rapportera skillnader i båda riktningar utan att en sida är referens.
- **Rapportera likheterna lika tydligt som skillnaderna.** Det troliga utfallet är att det mesta är *likt* — det är det tråkiga-men-validerande resultatet. De äkta skillnaderna (där de finns) blir mer trovärdiga mot den bakgrunden.
- **Dam-datasetet är litet (~376 matcher).** Flagga varje metrik där n är för litet för ett påstående. Övertolka inte småtals-skillnader — en skillnad som ryms inom konfidensintervallen är ingen skillnad.

## Vad Code INTE ska göra

- Inte dra strukturella slutsatser på undermåligt n utan att flagga det.
- Inte förklara skillnader kausalt (spelarmaterial, fysik, taktik) — vi rapporterar mönster, domänexperten tolkar.
- Inte använda `minute >= 46`.

## Output

- Publik Bandy Brain-finding (ny findingnummer), liganivå, dam vs herr.
- Underlagsrapport i `docs/data/`.

## Rapportering

Vad är likt (validering), vad skiljer sig äkta (med n och CI), och vilka skillnader som är för små för att vara annat än brus. Den ärliga ramen: damsidan är inte en sämre kopia av herrsidan — den är sitt eget strukturella objekt.
