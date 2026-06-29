# CODE-INSTRUKTION — mät sponsorgunst-hävstångens kännbarhet (script, ej playtest)

**Datum:** 2026-06-22 · **Av:** Opus · **Till:** Code
**Syfte:** Avgöra om board-rewards → sponsorNetworkMood → sponsorintäkt-kedjan ger en KÄNNBAR ekonomisk effekt, eller om deltana är för små för att märkas. Wiringen är källverifierad (producent i roundProcessor, konsument `sponsorMoodMultiplier` i economyService). Detta mäter magnituden — det går inte att spela sig till, det måste räknas.

## Varför inte playtest
Per omgång är effekten ~någon procent på sponsorintäkten, som driftar mot 50 med 3 %/omg. I ett spelat parti drunknar den i matchintäkt, löner, kommunbidrag m.m. Mät isolerat med ett script.

## Vad scriptet ska göra
Fristående Node/ts-script (lägg i `scripts/`, kör utanför spel-loopen, committa inte till spel-bundeln):

1. **Mood-banor.** Simulera `sponsorNetworkMood` över en 22-omgångssäsong för tre scenarier, med driften `mood += (50 − mood) × 0.03` varje omgång och check-in-deltan vid omg 7/14/22:
   - **A (flaggskepp×3):** +6 vid 7, 14, 22.
   - **B (rutin×3):** +3 vid 7, 14, 22.
   - **C (miss×3):** −4 vid 7, 14, 22.
   - **D (blandat):** +6 vid 7, −4 vid 14, +6 vid 22.
   Starta varje bana på mood = 50.

2. **Intäktsöversättning.** För varje omgång, räkna `sponsorMoodMultiplier = 1 + (mood − 50) × 0.004` och applicera på en representativ sponsorbas. Använd TVÅ baser: en låg (t.ex. 8 000 kr/omg, bruksklubb) och en hög (t.ex. 25 000 kr/omg, etablerad). Hämta gärna faktiska `weeklyIncome`-summor ur en seedad nystart om enkelt, annars dessa schabloner.

3. **Rapportera per scenario:**
   - Mood-kurvan omg 1–22 (eller bara brytpunkterna 6/7/8, 13/14/15, 21/22).
   - `sponsorMoodMultiplier` vid varje check-in-topp och var den landar omgången före nästa check-in (hur mycket driften ätit).
   - Kronor/omgång-delta mot baslinjen (mood 50, ×1.0) vid toppen, för båda baserna.
   - **Säsongssumma:** total sponsorintäkt scenario vs baslinje, i kronor och procent, för båda baserna.

## Frågan scriptet ska besvara
Är säsongssumma-deltat för flaggskepp×3 stort nog att en spelare ska bry sig (känsla: ≥ någon enstaka procent av sponsorintäkten, helst kännbart i kassan), eller är det <1 % och därmed kosmetiskt? Om kosmetiskt: rapportera vad `0.004`-koefficienten och check-in-deltana (+6/+3/−4) skulle behöva skalas till för att ge t.ex. ±5–10 % säsongseffekt vid flaggskepp respektive miss.

## Leverans
Kör scriptet, klistra in tabellen (scenario × bas → toppmultiplikator, drift-erosion, säsongsdelta kr + %). Ingen kod till spel-bundeln — bara mätningen + en rekommendation: behåll koefficienterna eller skala upp, med föreslagna värden om uppskalning. Opus tar balansbeslutet utifrån siffrorna.
