# PORTRAIT_REGISTER — spelarporträtt, kurerat register

**Författare:** Opus + Jacob · **Etablerad:** 2026-09-08 · **Status:** kontrakt låst, veteranfacket skrivet och godkänt. Ung/mid/erfaren skrivs härnäst. Produktion (generering) ej påbörjad.

Companion till `PORTRAIT_STYLE.md`. Den filen bär stilbeslutet; den HÄR filen bär registret — vem varje av de ~120 porträtten är, så inga två i en trupp blir för lika och luckorna fylls medvetet. Registret är den levande källan för den aktuella basprompten (PORTRAIT_STYLE:s arbetsprompt är den tidigare, nu förfinad nedan).

## Kontraktet (låst 2026-09-08)

**Fack-band — kodens, inte gissade** (`portraitService.ts` `ageToPortraitTier`): ung ≤21 · mid 22–26 · erfaren 27–31 · veteran 32+. Ett porträtts skenbara ålder MÅSTE ligga i sitt facks band, annars visar spelet fel porträtt.

**Åldersverklighet** (`worldGenerator.ts` `AGE_DISTRIBUTION` = 18–31, 16/klubb, median ~24): veteranfacket är TOMT vid spelstart och fylls först när spelare åldras förbi 31 — den sist sedda tiern. Ung-facket är tunt men verkligt från start (~4/trupp). Akademi-uppflyttning (`promoteYouthPlayer`, kan fyra "early") injicerar spelare UNDER 18 — därför når ung-facket ner till ~16.

**Etnisk mix** (spelets `nationality` = svenska 80% / norska+finska+ryska 20% — Norden + Ryssland, inga utomeuropeiska nationaliteter): bas nordisk/slavisk (svenskt/finskt/ryskt läser vitt-nordiskt i platt porträtt, variationen inom bär anti-klon). Ovanpå ett måttligt representations-lager, ~15% synligt icke-nordiska, invävt ODRAMATISKT — andra generationen från orten, samma grå tröja, aldrig markerad. Porträtt tilldelas på ålder, inte nationalitet, så mixen krockar inte med datan; representations-lagret är ett medvetet överstyre av spelets Norden-Ryssland-värld, inte något datan bär (Jacobs beslut 2026-09-08).

**Stil (låst, förfinad från PORTRAIT_STYLE):** platt grafisk / mid-century screentryck. Få platta färgfält per yta (en hudton, en skuggton, högst en mellanton), hårda kanter, inget airbrush/gradient/3D, lätt papperskorn. Kall skiffergrå opak bakgrund. Huden enda värmen. Vädrad arbetarklass, inte glamorös — men inte överdrivet väderbiten; två tredjedelar är ganska ordinära (kodningen 2026-09-08: prydligt och konventionellt dominerar). Kit-neutral slät grå tröja, ALDRIG märke/logga/krage/emblem. Referens-ankaret är det landade veteran-porträttet — mät alltid mot det, inte mot ord.

**Komposition:** huvud + axlar, centrerat med marginal (UI:t hårdklipper till cirkel — profil/decentrerat kapas). Lugnt neutralt uttryck ALLTID (aldrig leende/dramatiskt — ses hundratals gånger i listor). Huvudvinkel varierad i smalt band: lätt trekvartsvridning, blick mot eller strax vid sidan av kameran, aldrig alla dödsraka (bryter mugshot).

**Produktion:** ETT porträtt per generering, ALDRIG rutnät/ark (små ansikten + osnitt­bart). Gemini Nano Banana 2 i Thinking/Pro-läge (instruktionsföljning; Fast driver iväg över 120). Lås basprompten ord för ord, variera bara person + vinkel, eget frö per bild. Granska varje fack som GRUPP mot ankaret, regenerera avvikare i yta/palett/beskärning. Filnamn `portrait_{tier}_{n}.png`.

**Kurerade extremer (8–12 i HELA poolen, glest):** Krig-typen (rakad skalle + fullt rödbrunt gråstänkt skägg), 2 rödhåriga med fräknar, den ärrade/väderbitne, 1–2 tydligt grånade elder-veteraner (37+), den ende tydligt kraftige, en riktigt gänglig lång. Grått och rött hör ENBART hit — aldrig i ryggraden.

## Aktuell basprompt (låst — variera bara person + vinkel)

> Flat graphic stylized portrait of a Swedish bandy player, [PERSON + ANGLE], head and shoulders, centered, calm neutral expression, with generous margin above the hair and below the chin so a circular crop won't clip the head. Plain crew-neck top in flat neutral grey — ABSOLUTELY no crest, logo, collar, anchor or emblem, completely plain chest. Mid-century screenprint / retro sports-program style: a FEW flat colour planes per surface (one base skin tone, one shadow tone, at most one mid-tone) with hard clean edges between them, no blended or airbrushed modelling; features read from the shape of the flat shadow shapes. Subtle even paper-grain over everything. Cold slate-grey background filling the frame. Natural skin tone as the only warmth. Weathered, understated, working-class athlete — not glamorous. Square 1:1.
> NEGATIVE: warm or parchment background, smooth 3D rendering, glossy highlights, airbrush gradient, photorealism, frame, border, text, colour bars, spritesheet, multiple people, scenery, dramatic lighting, smiling, profile view, head off-centre, coloured or logo jersey.

## Fack: VETERAN (32+, tyngdpunkt 32–35, svans 38–40; tomt vid start, åldras in)

Godkänt 2026-09-08. ~4 representation (8, 11, 17, 23 ≈ 13%), 15/26 ryskt/finskt inom nordisk bas, grått bara i 30, extremer 28–30.

1. 32, kort brunt sidbena, stubb, ovalt väderbitet, slank — lätt vänstervridning
2. 33, kort mörkblont snagg, renrakat, fyrkantig käke, medel — blick vid sidan
3. 32, kort brunt tunnande vid tinningar, kort brunt skägg, djupa pannlinjer, kompakt — trekvart höger
4. 34, kort brunt, stubb, bruten näsa, långsmalt, slank
5. 33, kort blont, renrakat, rödlätt vindpiskad, fyrkantig, medel
6. 35, tunnande mellanbrunt, kort skägg, fårad panna, medel-kompakt — lugnt bevakad blick
7. 32, kort brunt sidbena, lätt stubb, ovalt, slank-lång
8. 34, kort mörkt, tätt mörkt skägg, oliv hy, mellanösternsk bakgrund (andra gen), medel — slät grå, odramatiskt
9. 33, kort brunt snagg, stubb, litet ärr genom ögonbryn, medel
10. 35, vikande kort blont, renrakat, blek väderbiten, smalt, slank
11. 34, kort svart hår, kort mörkt skägg, ljus-oliv, balkansk bakgrund, medel
12. 32, kort brunt rufsigt, lätt stubb, rundare ansikte, medel-satt
13. 33, mycket kort buzz, renrakat, hårt fyrkantigt, tjock nacke — kompakt back
14. 36, tunnande brunt, kort fullt skägg, grövre fårat, medel
15. 34, kort mörkblont, stubb, bredare kindben (ryskt drag), ljus, medel
16. 32, kort brunt sidbena, renrakat, ovalt, slank-lång, blick vid sidan
17. 35, kort vikande hår, kort skägg, brun hy, afrikansk bakgrund (andra gen), lugn samlad — slät grå, odramatiskt
18. 33, kort blont snagg, lätt stubb, fyrkantig käke, medel
19. 34, kort mörkt, tätt skägg, djupt sittande ögon, väderbiten, slank
20. 32, kort mellanbrunt, renrakat, ljus, kompakt
21. 35, kort brunt, stubb, ovalt, slank, blick vid sidan
22. 36, vikande kort blont, kort skägg, blek, smalt, medel
23. 34, kort mörkt snagg, lätt skägg, oliv-brun hy, latinamerikansk bakgrund, kortklippt, lugn
24. 33, kort dark-blond, renrakat, rödlätt, fyrkantig, medel
25. 37, tunnande kort brunt, kort fullt skägg, djupa pannlinjer, kompakt — börjar läsa elder, mörkt hår
26. 32, kort brunt sidbena, stubb, finskt drag, ljus, medel-slank
27. 34, kort svart hår, tätt skägg, väderbiten ljus-oliv, medel
28. EXTREM (Krig-typ): 34, rakad skinande skalle (val, ej flint), fullt tjockt rödbrunt skägg med gråstänk, ljusblå ögon, väderbiten hårding, medel-stark — rak stadig blick
29. EXTREM (ärrad): 36, mycket kort brunt, kort skägg, gammalt ärr på kindben, djupt vindpiskad rödlätt, grövre
30. EXTREM (elder räv, poolens grå-outlier): 39, kort grått tunnande hår, kort grått skägg, djupt fårat lugnt ansikte, kompakt — gamle målvaktstypen, enda tydligt grå i facket

## Fack: UNG (≤21, ner till ~16 för akademi-uppflyttningar) — SKRIVS HÄRNÄST
## Fack: MID (22–26) — ej skrivet
## Fack: ERFAREN (27–31) — ej skrivet

## Extrem-budget (hela poolen, 8–12)

Använda i veteran: Krig-typ (28), ärrad (29), grå elder (30). Kvar att placera: 2 rödhåriga med fräknar (hör i ung/mid), den gänglige långe (ung), den ende kraftige (mid/erfaren), ev. en andra grå elder.
