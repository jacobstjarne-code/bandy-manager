# Matchmotor-refactor — Syfte och avgränsning

## Bakgrund: vad auditen visade

En genomgång av den befintliga motorns taktiska representation (2026-04-26)
visar att `matchCore.ts` är en välkalibrerad frekvensmotor, inte en
positionsmotor. Det är ett arkitekturellt faktum att förhålla sig till —
inte ett problem som refactorn löser.

**Vad det konkret innebär:**

Åtta taktiska dimensioner (mentalitet, tempo, press, spelbredd,
passingsstil, hörnstrategi, utvisningsspel, formation) manifesteras som
viktjusteringar på sekvenstyper eller som multiplikatorer på score-värden.
Motorn räknar frekvenser — hur ofta händer X — men har inget begrepp om
var på planen bollen är, vilket lag som har initiativ vid ett givet steg,
eller hur lagformationerna faktiskt möter varandra rumsligt.

Starkaste mekaniska effekterna är press (fler transitioner och utvisningar
emergerar ur viktfördelningen), tempo (sekvensfördelningen ändras
strukturellt), och situation-AI (motorn anpassar vikterna baserat på
matchläge, oberoende av spelarens taktikval). Svagaste är formation,
passingsstil och utvisningsspel — alla parametriska multiplikatorer med
effektstorlek under ±3%.

Det finns fem taktiska varianter motorn inte kan särskilja alls: libero
mot man-to-man, stor man i boxen mot rörligt anfallsspel, defensiv hörna
kombinerad med låg press (stackeffekt), bred vs smal spelbredd (skiljer sig
bara via hörnfrekvens), och press som kumulativ trötthetseffekt.

---

## De tre strukturproblemen refactorn åtgärdar

**1. Managed-gating döljer motorlogik från kalibreringsskript**

Befintlig kod har logik innanför `if (managedIsHome !== undefined)`-block.
Stress-testet kör headless utan managed klubb — blocket hoppas över —
fysikändringar mäts aldrig. Sprint 25a visar konsekvensen: tre
parameterjusteringar, bara en synlig i kalibreringen (LESSONS.md #15).

**2. Blandning av fysik, event-emission och narrativ i samma generator**

`simulateMatchCore` i `matchCore.ts` gör allt: beräknar chanser, emitterar
events, plockar commentary-texter, hanterar interaktioner med spelaren. Det
gör varje ändring riskabel — man kan inte justera en frekvenskonstant utan
att riskera att röra commentary-kod.

**3. Kalibreringsskript och motor delar inga konstanter**

`calibrate_v2.ts` initierar `homeAdvantage: 0.14`.
`matchSimProcessor.ts` initierade `baseAdv = 0.05`. Motorn hade 36% av
den hemmafördel kalibreringen testade. Kalibreringsgapet var artefakt, inte
motorbugg (LESSONS.md #22). Utan delad konstantfil är divergens oundviklig.

---

## Projektbeskrivning

In-place-refactor av `matchCore.ts` och relaterade motorfiler. Inga
parallella motorer byggs. Koden refaktoreras i existerande filer.

Tre konkreta mål:

1. Separera fysik-, event- och narrativ-lager som idag är sammanvävda i
   `simulateMatchCore`-generatorn
2. Eliminera managed-gating ur fysiklogiken så att stress-test och
   kalibreringskörning mäter samma motor som spelet kör
3. Skapa en delad konstantfil (`matchConstants.ts`) som både
   kalibreringsskript och motor importerar — divergens ger kompileringsfel,
   inte kalibreringsgap

Kalibreringen ägs av det befintliga arbetet mot Bandygrytan. Refactorn
förändrar inte kalibreringsvärden — den förändrar strukturen kring dem.
Varje etapp verifieras med en kalibreringskörning som bekräftar att
aggregerade utfall är oförändrade mot föregående etapp.

---

## Etapp-tabell

| Etapp | Leverans | Verifieringsport |
|-------|----------|-----------------|
| 01 | Fysikfunktioner extraherade ur `simulateMatchCore` till separata funktioner i `matchCore.ts`. Managed-gated fysiklogik bruten ut till per-lag-beräkningar. Inga managed-gates i fysikfunktionerna. | `grep -n "managedIsHome" src/domain/services/matchCore.ts` — 0 träffar i fysikfunktioner. Kalibreringskörning ≥1000 matcher, aggregat inom ±2% mot baseline. |
| 02 | Event-lagrets PERSISTENT/TRANSIENT-taggning explicit i konstanter. Inga `continue` före `yield` i generatorn. Stats-tracking via flaggor på `Goal`, inte på strippade event-typer. | Event-tabell i LESSONS.md #20 verifierad. Kalibreringskörning ≥1000 matcher, aggregat oförändrade mot etapp 01. |
| 03 | Narrativ-lager separerat. Commentary-anrop och matchMoodService-anrop utflyttade ur fyzikloopen till en post-processing-funktion som anropas av `simulateMatchCore` efter sekvensen är klar. Generatorn yieldar bara physics-events. | `grep -rn "matchCommentary\|matchMoodService" src/domain/services/matchCore.ts` — träffar bara i post-processing-funktionen, inte i fysikloopen. Kalibreringskörning oförändrad. |
| 04 | Delad konstantfil `src/domain/services/matchConstants.ts`. Alla motorparametrar som kalibreringsskriptet använder importeras från denna fil. Inga hårdkodade motorvärden i `calibrate_v2.ts`. | `grep -n "homeAdvantage\s*[=:]\s*0\." scripts/calibrate_v2.ts` — 0 träffar. Värdet importeras. Kalibreringskörning oförändrad. |

Varje etapp avslutas med en godkänd audit (`docs/match-engine-refactor/AUDIT_etapp_NN.md`).
Kalibreringskörning sparas som `docs/match-engine-refactor/calibration_etapp_NN.md`.
Försämrad kalibrering mot föregående etapp blockerar nästa etapp.
