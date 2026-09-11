# RELEASE-DEFINITION — mjuklansering (Jacob + Erik)

**Datum:** 2026-09-11
**Syfte:** en fryst lista att mäta "i mål" mot i stället för en känsla. Allt utanför MÅSTE-listan får skjutas till efter lansering — aldrig stoppa den. Nya fynd blir post-launch-rader, inte nålar som håller kvar.

## MÅSTE vara sant för att mjuklansera

Fyra saker. Inget mer.

1. **Grind 2 stängd.** Det naturliga tvåsäsongsprovet på fixad commit kommer tillbaka utan trasig invariant i ett flöde en testare garanterat når. Grind 3 är redan passerad.
2. **Saves överlever uppdateringar.** Migreringen håller över versionsbump — frekventa pushar under soft-launchen får inte döda karriärerna. (Verifierat via `migrateSaveGame`; håll det.)
3. **Kärnloopen spelbar end-to-end utan krasch.** Förbered → spela → granska → årsbok, säsongsskifte, avsked → ny klubb. Build + testsvit gröna.
4. **Hosting live med push AV.** Render Free grön, notiser släckta (behövs inte för två testare).

## Stoppregeln för Grind 2 (så återprovet inte blir oändligt)

Ett fynd i återprovet blockerar BARA om det (a) bryter ett kärnflöde, eller (b) får spelet att ljuga eller upprepa sig i en scen ett tvåsäsongsprov tillförlitligt når. Ett fel i en sällan-scen eller en kosmetisk kant → post-launch-rad, inte en nål. Baren är "förtroende i de flöden testaren faktiskt möter", inte noll buggar.

## Väntar till EFTER (post-launch, stoppar inte lansering)

- Galans gestaltning (känslopolish; funkar tekniskt).
- Resterande "spelet ljuger"-fynd som inte bryter ett kärnflöde.
- Porträtten (resterande ~88) och klubbmärkena — asset-arbete, platshållare duger för två testare.
- Gratis-DB-migreringen (villkorad mot push-timing; före 10 okt bara om push tänds).
- Kvalitativ 6–8-spelaruppföljning (senare, bredare test).
- Push-aktivering (Etapp 1B).
- Kommunvapen-/proveniens-lås för märkena.

## Regeln, rakt

Om ett nytt fynd inte träffar MÅSTE-listan eller stoppregeln ovan — det blir en post-launch-rad, punkt. Du fryser den här listan nu. Det som ändras härefter är att den kryssas av, inte att den växer.
