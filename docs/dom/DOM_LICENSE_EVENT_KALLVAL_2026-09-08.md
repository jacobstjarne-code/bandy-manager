# DOM — LICENSE-EVENT: källval efter tidsfråga (levande zon vs historisk post)

**Datum:** 2026-09-08 · **Av:** Opus · **Beställd av:** Jacob (liggare-ny-spåret) · **Utlöst av:** `liggare-ny-5` gejtad på Opus-dom. Skrivsidan (`buildLicenseEventLedgerEntry`) är byggd, men läskontraktet saknas — och risken är att `licenseStatus` (levande) och `license_event` (historisk) behandlas som en dubblett där den ena ska ersätta den andra.

## Diagnosen (kodläst)

Det finns två sidor, och de är inte konkurrenter — de svarar på olika frågor.

**Levande sidan** (`licenseService.ts`): `licenseRiskScore` är en 0–100-ackumulator (Jacobs dom 2026-08-26, RAPPORT_ACKUMULATOR_FORSLAG). `licenseZoneFromScore` mappar den till `LicenseStatus` (`clear`/`first_warning`/`point_deduction`/`license_denied`), och `LICENSE_ZONE_TEXT` bär den låsta zon-texten ("Ekonomin är ansträngd.", "Licensen är hotad.") som EkonomiTab visar. `checkLicenseStatus` kör vid säsongsslut och returnerar en `LicenseAction` med `type: 'cleared' | 'first_warning' | 'point_deduction' | 'license_denied'`. Detta är klubbens STÅENDE läge — en löpande signal som rör sig varje säsong och alltid pekar på nuet.

**Historiska sidan** (`clubHistoryLedgerService.buildLicenseEventLedgerEntry`): `type: 'license_event'`, semanticKey `license_event_${clubId}_s${season}`, significance 50/75/95, bär `licenseEvent { status, deficitKr?, pointsDeducted? }`. En post per klubb per säsong, fryst vid säsongsslut. Notera ontologin: `licenseEvent.status` är `LicenseAction.type` (`cleared` — vad nämnden GJORDE den säsongen), inte zonen `LicenseStatus` (`clear` — var klubben SITTER nu). Posten registrerar händelsen, inte tillståndet.

**Falsk motsättning:** att läsa dem som konkurrenter — härleda den historiska posten ur den levande poängen, eller låta zon-texten visa sig som en avslutad säsongs registrerade utfall. Samma klass som klockan (`currentChronology`: `buildSeasonCalendar` historiskt vs `game.fixtures` live) och mitt-i-säsongen-varningen (löpande oro vs historisk dom). Ordfamiljen `clear`/`cleared` är just fällan: samma ord, olika ontologi.

## Domen — en router, källval efter tidsfråga

`getSeasonLicenseConsequence(game, season)` väljer källa efter frågans tidshorisont:

- **Finns en `license_event`-post för `(clubId, season)` i `eventLedger`** → returnera den. Historisk dom, fryst. Gäller varje avslutad säsong, inklusive den nyss avslutade current-season SÅ SNART posten skrivits vid säsongsslut. Postens `status` bär händelsen (`cleared`/`point_deduction`/`license_denied`).
- **Annars** (säsongen är ännu inte avslutad, ingen post finns) → returnera den levande zonen: `LICENSE_ZONE_TEXT[licenseZoneFromScore(game.licenseRiskScore)]`, MÄRKT som löpande situation, aldrig som ett registrerat utfall. Det är oro, inte dom.

Ontologin får aldrig kollapsa: posten bär en ACTION (vad som hände), zonen bär ett STANDING (var klubben sitter nu). Samma sträng ska inte kunna komma ur båda grenarna.

## SKYDDAT — rör inte

- **`buildLicenseEventLedgerEntry` är låst.** Skrivsidan står: significance 50/75/95, `cleared`+`first_warning` delar 50 (medvetet, dokumenterat i funktionens kommentar). Routern LÄSER posten, skriver den aldrig.
- **`licenseRiskScore`/`checkLicenseStatus`/`LICENSE_ZONE_TEXT` är låsta** (Jacobs 2026-08-26-dom). Den levande ackumulatorn rörs inte.
- **Ingen härleder posten ur poängen, och tvärtom.** Två frågor, två källor. Om posten finns är den sanningen för den säsongen för alltid; ackumulatorn har då redan rullat vidare mot nästa säsongs situation.
- **Determinism:** posten är fryst, zonen är en ren funktion av score. Ingen ny slump.

## GODKÄNT NÄR

1. Krönika/årsbok läser en historisk säsongs licenskonsekvens via routern → får `license_event`-postens action, aldrig zon-texten.
2. EkonomiTab (nuläget) läser den levande zonen, oförändrat.
3. En nyss avslutad säsong: efter att posten skrivits returnerar routern posten, inte zonen.
4. `liggare-ny-5` konsumerar `license_event` i Krönikan utan att röra den levande sidan.

## Ägarskap & timing

Code: bygg eller aligna `getSeasonLicenseConsequence` per kontraktet ovan (kolla om en stub redan finns vid konsument-callsiten — aligna; annars skapa), peka Krönika/årsbok-konsumenten till den, lämna EkonomiTab på den levande zonen. Opus: domen (denna). Jacob: mandatet givet (liggare-ny-spåret); behövs bara om årsboken ska visa den historiska ontologin annorlunda än postens `status` bär.
