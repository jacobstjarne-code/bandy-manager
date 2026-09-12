# DOM — mecenat/patron: per-säsong-rullning + patron-ramp (cs blir en spak)

**Datum:** 2026-09-08 · **Av:** Opus · **Beställd av:** Jacob (beslut 1+2) · **Grund:** `RAPPORT_MECENATGENERERING_2026-08-26`, frekvensmätningen (2000 körningar/cs-nivå), `mecenatService.ts` (flat `rand()<0.15` per omgång), `patronData.ts` (`PATRON_EMERGE_CS=60`), `mecenatCapForCs` (diskret tak 1/2/3 vid cs 65/70/85). Stänger `mecenat-patron-modellform`, `cs-patron-sannolikhetsrullning`, `mecenat-patron-modellform`-familjen.

## Diagnosen (mätt, kodläst)

Frekvenstabellen är nästan PLATT över cs 40–100: mecenaten fyller sitt tak nästan varje gång, patronen anländer nästan alltid säsong 1–2, oavsett cs. Rot: en per-omgångs-rullning (1–15%) upprepad 130–220 gånger över en karriär konvergerar mot säkerhet — communityStanding blir i praktiken ingen kännbar spak. Patronen är dessutom binär (`PATRON_EMERGE_CS=60`: 100% över, 0% under), den empiriska spärren för att Heros aldrig får en patron. Bägge är samma sjukdom: cs betyder ingenting i utfallet.

## Domen — ETT pass, de hänger ihop

**Mecenat:** byt från per-omgångs-rullning till per-SÄSONG-rullning. Chansen utvärderas EN gång per säsong (säsongsstart), inte varje omgång — då konvergerar den inte mot säkerhet. Sannolikheten SKALAR med communityStanding, så cs blir en verklig skillnad. Taket `mecenatCapForCs` (1/2/3 vid cs 65/70/85) står oförändrat — det avgör HUR MÅNGA samtidiga, säsongsrullningen avgör OM en ny dyker upp.

**Patron:** ersätt den binära `PATRON_EMERGE_CS=60`-tröskeln med en mjuk sannolikhetsramp, också per säsong, som skalar med cs runt tröskeln. Patronen kan dyka upp under 60 (gradvis avtagande sannolikhet), inte 0%/100%. Golv och tak kalibrerar Code mot mätning.

Bygg dem tillsammans — samma fix-form, samma sjukdom.

## SKYDDAT

- `mecenatCapForCs`-taket rörs inte (HUR MÅNGA, inte OM).
- Mecenat/patron-AVHOPPSLOGIKEN (happiness/demands) rörs inte — annan axel, egen rad om den ska cs-kopplas.
- Determinism: säsongsrullningen seedas per save+säsong, ingen ny wall-clock, ingen `Math.random` utan seed.

## GODKÄNT NÄR

Ommätning (2000 körningar/cs-nivå, samma script som förra gången) visar att kurvan nu LUTAR med cs — låg cs (Heros) får patron/mecenat märkbart mer sällan men inte 0, hög cs oftare. Den platta tabellen ska vara borta. Det är beviset på att cs blev en spak.

## Ägarskap

Code: bygg per-säsong-rullningen (mecenat) + rampen (patron), mät om, bekräfta lutningen. Opus: denna dom. Jacob: besluten (per-säsong + ramp) givna.
