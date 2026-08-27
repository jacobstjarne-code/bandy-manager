# Rapport: återkopplingsslingan hittad — och det är inte den jag gissade igår

2026-08-26. Din order: "mät återkopplingsslingan innan något balanseras." Gjort. Fyndet river upp gårdagens hypotes och pekar på ett tredje system.

## Gårdagens gissning var fel — kontrollerat och avfärdat

Hypotesen var: sundare kassa → råd att bygga anläggning/förstärka truppen → bättre resultat → högre fanMood → mer publik → ännu sundare kassa. Testat direkt: körde Heros vid communityStanding 71 och 90 (samma 15 seeds, samma säsongsordning), loggade `fanMood` och trupp-snittförmåga (`currentAbility`) säsong för säsong.

**Resultatet: fanMood- och truppförmåge-sekvenserna är i praktiken IDENTISKA mellan cs=71 och cs=90, seed för seed.** Ingen mätbar divergens inom fyra säsonger. Den gissade slingan finns inte i den här tidshorisonten — matchresultat och truppens utveckling drivs av annat än communityStanding, och communityStanding-skillnaden hinner inte ge dem tid att divergera.

## Den verkliga mekanismen: ett ANNAT system, ett diskret hårt fall

Direktjämförelse av samma 15 seeds vid cs=70 mot cs=71, säsong för säsong:

- **cs=70:** VARJE enskild säsong för ALLA 15 seeds är djupt negativ (−56 000 till −461 000 kr). Inget undantag i 60 säsongsobservationer.
- **cs=71:** helt annan karaktär — resultat sprider sig kring noll (−171 000 till +189 000 kr), verkligt blandat.

Det är inte en gradient som råkar korsa noll — det är ett REGIMSKIFTE. Roten hittad i `seasonEndProcessor.ts:121-140`, det parallella licenssystemet (`licenseReview`, kallat System A i gårdagens rapport — det som INTE sparkar direkt):

```ts
const licFinances = managedClubForLicense.finances   // ABSOLUT kassa, inte säsongens förändring
...
if (licFinances < -200000 || licenseWarningCount >= 3) {
  licStatus = 'denied'
}
```

Och vid `licStatus === 'denied'` (rad 879-902):
```ts
// Ta bort 3 slumpade spelare ur truppen
// reputation -15
// Ta bort 60% av sponsorerna (behåll bara 40%)
```

**Det här är klippan.** Vid cs=70 är veckoförlusterna så stora att den ABSOLUTA kassan (inte säsongens delta — den ackumulerade skulden) rusar under −200 000 kr, tidigt och upprepat. Varje gång det händer: tre spelare borta, ryktet −15, 60% av sponsorerna borta. Sponsorbortfallet sänker den återkommande veckointäkten permanent — vilket garanterar att nästa säsongs kassa blir ÄNNU sämre, vilket triggar samma straff igen. **Det är den verkliga återkopplingsslingan: ekonomi → absolut-kassa-tröskel → spelar-/sponsorförlust → sämre ekonomi → samma tröskel igen.** Inte fanMood, inte trupputveckling — ett explicit, diskret straff i ett system som inte är samma som det som faktiskt avskedar (System B, `checkLicenseStatus`), men som förgiftar bränslet System B mäter.

Vid cs=71 är veckoförlusterna små nog att den absoluta kassan sällan eller aldrig når −200 000 — straffet triggar inte, slingan startar aldrig, och klubben stannar i en mycket mildare, brusig men hanterbar ekonomi.

## Vad detta betyder för de två beställda fixarna

**Fix 2 (ackumulator istf binärt fyraårsvillkor) räcker INTE ensam.** Den adresserar bara System B:s räkneverk. Den dominerande, dramatiska delen av klippan sitter i System A:s diskreta −200 000-tröskel med sina kaskaderande straff (spelare/sponsorer/rykte) — en HELT SEPARAT mekanism som inte rörs av att göra System B:s räknare till en ackumulator. Om bara System B mjukas upp kommer System A:s klippa fortfarande finnas kvar, fast en nivå tidigare i kedjan.

**Fix 1 (licensvarningen)** bör nämna BÅDA systemen om den ska vara ärlig: dels System B:s räkneverk (år kvar innan avsked), dels System A:s egen, mer akuta risk (kassan närmar sig −200 000 → spelar-/sponsorförlust, oavsett om avsked är nära).

**Rekommendation, inte byggd:** dämpa System A:s kaskad, inte bara System B:s räknare. Konkret, för din dom: antingen (a) mjuka upp System A:s straff till en gradient (t.ex. andelen sponsorer/spelare som förloras skalar med HUR MYCKET under −200 000 kassan ligger, inte allt-eller-inget), eller (b) höja/mjuka tröskeln själv (en klubb med Heros ekonomi ska rimligen kunna dyka under −200 000 utan att omedelbart förlora 60% av sina sponsorer — den siffran salt kalibrerad för en annan klubbstorlek/ekonomi, inte verifierad mot rep<55-klubbarnas verklighet). Föreslår inga magnituder än — vill ha din riktning om VILKEN av de två (mjuka straffet, eller höja tröskeln) innan jag räknar på det.

Inget byggt. Går vidare till licensvarningens nuvarande renderingsyta (fråga 1) och väntar med fix 2:s magnituder tills du sett detta.
