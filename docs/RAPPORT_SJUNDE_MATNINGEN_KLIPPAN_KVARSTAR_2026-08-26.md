# Rapport: sjunde mätningen — klippan är kvar, min tidigare diagnos höll inte

2026-08-26. Ärligt svar på "har klippan blivit en gradient": nej. Och det betyder att gårdagens rotorsaksfynd var fel, eller ofullständigt nog att räknas som fel.

## Standardkörningen, alla tolv (communityStanding orört, default 50)

| Klubb | Sjätte mätn. (före kaskad+ackumulator) | Sjunde mätn. (efter) |
|---|---|---|
| Forsbacka | 25% | 15% |
| Söderfors | 75% | 60% |
| Västanfors | 5% | 10% |
| Karlsborg | 55% | 60% |
| Målilla | 55% | 55% |
| Gagnef | 40% | 35% |
| Hälleforsnäs | 70% | 45% |
| Lesjöfors | 95% | 85% |
| **Rögle** | **100%** | **100%** |
| Slottsbron | 90% | 90% |
| Skutskär | 80% | 60% |
| **Heros** | **100%** | **100%** |

Några klubbar förbättras måttligt (Hälleforsnäs, Skutskär, Lesjöfors) — troligen den skalande ryktesförlusten och sponsor-en-i-taget som gör mindre skada än den gamla kaskaden. **Men de två klubbar hela H4-utredningen kretsat kring, Rögle och Heros, står kvar på exakt 100%.**

## Klippan, finmaskigt omätt — identisk, inte en gradient

Samma sveep som i går (communityStanding 65-90 i steg om 1-5), nu med kaskaden borttagen OCH ackumulatorn aktiv:

| communityStanding | Avsked |
|---|---|
| 50-68 | 100% |
| 70 | 95% |
| **71** | **10%** |
| 72-90 | 5-10% |

**Identisk med i går, inom mätfel.** Klippan sitter kvar mellan exakt samma två punkter.

## Jag grävde djupare — och min gårdagens diagnos höll inte

Jämförde säsong-för-säsong nettoresultat vid cs=70 mot cs=71, samma metod som i går, MED kaskaden borttagen:

- **cs=70:** 0 av 40 säsongsobservationer positiva, snitt −237 000 kr.
- **cs=71:** 15 av 40 positiva, snitt −14 000 kr.

**Det här är i praktiken IDENTISKT med mätningen jag gjorde före kaskadborttagningen.** Att ta bort licenseReview-kaskaden (3 spelare, −15 rykte, 60% sponsorer) ändrade INTE den underliggande nettoresultat-fördelningen mätbart. Det betyder att min rapport igår (`RAPPORT_ATERKOPPLINGSSLINGAN_HITTAD_2026-08-26.md`), som pekade ut den kaskaden som förklaringen till 100x-avvikelsen, var **fel eller kraftigt ofullständig** — kaskaden var en verklig, självförstärkande mekanism värd att ta bort på egna meriter (spelaren ska välja, inte systemet), men den var inte den dominerande orsaken till KLIPPAN specifikt.

**Jag har inte hittat den verkliga orsaken än.** `computeAttendanceRate` är bevisat linjärt (läst rad för rad, ingen tröskel). En enhets skillnad i communityStanding ger en direkt intäktsskillnad på i storleksordningen 1 500 kr/säsong via den formeln — inte de över 200 000 kr som faktiskt observeras. Något annat i den fulla simuleringen (matchmotor, säsongsslutsekonomi, eller en interaktion jag inte hittat) skapar en skarp övergång som inte finns i någon enskild formel jag hittills läst. Kandidater jag INTE hunnit utesluta: en tröskel i `postRoundFlagsProcessor.ts`s konkurskoll (finances<−2M, en helt annan, orörd mekanism), en interaktion med `autoBuildCheapestAffordableFacility`s egen säkerhetsmarginal-tröskel i stressriggen, eller något i hur säsongsslutets engångsposter (kommunbidrag/prispengar/patron) samverkar med den löpande ekonomin över flera säsonger.

## Rekommendation

Jag vill inte gissa mig fram längre i den här rapporten — det var precis det som gick fel igår. Om du vill att jag fortsätter gräva föreslår jag en dedikerad, långsammare utredning (instrumentera varje omgångs nettoresultat vid cs=70 kontra 71, seed för seed, för att se VAR i en säsong de två banorna faktiskt divergerar) snarare än fler aggregerade stresskörningar. Säg till om det är värt tiden, eller om H4 ska vila här — Rögle/Heros oförändrat 100% trots tre raka fixar (Survive-undantaget, publikformeln, licenskaskaden+ackumulatorn) är ett påtagligt mönster i sig: kanske pekar det tillbaka mot den ALLRA första roten (`worldGenerator.ts`s attributformel, `RAPPORT_FORLUSTDRIVARE_OCH_FORMELNS_TAK_2026-08-25.md`) snarare än mot ekonomin överhuvudtaget.
