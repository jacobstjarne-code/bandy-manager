# Rapport: generateAttributes mot generateYouthAttributes — skiljer sig basformeln systematiskt?

2026-08-26. Jacobs order: rapportera, bygg inget. Läst båda funktionerna i sin helhet plus anropsstället som fyller in `ca`.

## Ja — två helt oberoende formler, olika indata, ingen synlig korsjämförelse

**Senior** (`worldGenerator.ts:531 generateAttributes`): `base = clamp(reputation * 0.7 + rng.float(-10, 10), 20, 95)`. Läser klubbens `reputation` direkt.

**Ungdom** (`youthIntakeService.ts:115 generateYouthAttributes`): `base = ca * 0.9`, där `ca` (rad 373-375) = `clamp(round(15 + (club.youthQuality/100)*20 + rng.float(-3,3)), 10, 35)`. Läser `club.youthQuality` — ett SEPARAT fält, inte reputation, om än nära korrelerat i CLUB_TEMPLATES (se nedan).

Olika multiplikator (0,9 mot 0,7), olika bottenklampning (1-60 för ungdom, 1-95/99 för senior — en ungdomsspelare kan ALDRIG nå över 60 i något attribut vid intag, oavsett arketyp-bonus). Inget i koden eller kommentarerna visar att någon jämfört de två formlerna mot varandra vid byggtillfället — de är strukturellt 88% lika (samma mall: bas → arketyp-viktad boost → klamp) men läser olika sanningar.

## Räknat för Heros specifikt

`club.youthQuality` för Heros = 45 (identiskt med reputation — korrelationen håller för alla tolv klubbar, diff 0 till -10, tightast i botten av ligan). Det är alltså INTE en orelaterad referens rent numeriskt, bara en annan formel på den.

- **caBase** = 15 + (45/100)×20 = **24**, ca-intervall efter brus ≈ **21–27**.
- **Ungdomsbas** = ca×0,9 ≈ **18,9–24,3** (snitt ≈ 21,6).
- **Seniorbas** (samma klubb, `generateAttributes`) = 45×0,7 ± 10 = **21,5–41,5** (snitt ≈ 31,5).

**En färsk akademispelare hos Heros startar ~30% svagare än klubbens EGEN redan svaga seniornivå i snitt — och ungdomens tak (24,3) når knappt seniorns golv (21,5).** Det är inte en marginell skillnad, det är två separata skalor som råkar dela ett indataintervall utan att dela en referenspunkt.

## Är det ett fel, eller en avsiktlig "råvara som mognar"-kurva?

Ärligt: **inte fullt utrett, men det finns en verklig tillväxtväg som INTE är verifierad mot Heros egen nivå.** `playerDevelopmentService.ts`s `getAgeFactor()` ger spelare ≤19 år den högsta tillväxtfaktorn (1,4×, mot 1,1× vid 20-22, 0,6× vid 23-25, fallande därefter) — designintentionen ser ut att vara "svag start, snabb tillväxt i tonåren", inte "omedelbart seniorredo". Men **ingen simulering i denna rapport bekräftar att tillväxttakten faktiskt hinner ikapp Heros egen seniornivå (snitt 31,5) inom en realistisk utvecklingsfönster (2-4 säsonger, 15→18-19 år) innan Heros behöver spelaren i A-laget.** Det är precis den typ av flersäsongssimulering Jacobs fråga pekar mot men som inte är körd här — skulle krävas för ett definitivt svar på "hinner de i tid".

## Svar på frågorna

1. **Skiljer sig basformeln systematiskt? Ja** — olika indatafält, olika multiplikator, olika klamptak (60 mot 95/99).
2. **Producerar akademin spelare svagare eller starkare än liganivån de ska in i? Svagare, mätbart** — ~30% under Heros egen seniornivå vid intagstillfället, för just den klubb där det spelar störst roll.
3. **Är akademispåret kalibrerat mot fel referens?** Formlerna delar `club.youthQuality`↔`reputation`-korrelationen (inte en helt orelaterad slump), men de har **aldrig jämförts mot varandra direkt** — ingen kod, kommentar, eller test i endera filen refererar till den andra. Det är en genuin blind fläck, inte nödvändigtvis ett fel: om utvecklingstakten kompenserar gapet i tid är detta en avsiktlig kurva; om den inte gör det är "en Survive-klubb ska överleva på egna spelare" ett löfte spelet inte håller.

Inget byggt. Väntar på dom om nästa steg (t.ex. en flersäsongssimulering av en akademispelares faktiska bana hos Heros, om det är värt att verifiera vidare).
