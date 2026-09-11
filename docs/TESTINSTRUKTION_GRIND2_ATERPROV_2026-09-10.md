# TESTINSTRUKTION — Grind 2 återprov (2 säsonger, logik och spelupplevelse)

**Datum:** 2026-09-10
**Grund:** villkoret i `DOM_GRIND_2_3_2026-09-10.md`. Grind 3 är passerad. Det här provet stänger Grind 2.
**Kör med:** en stark logisk modell. Jacobs tillägg 2026-09-11: två spår i samma genomspelning — invariantkoll i bakgrunden och läst, upplevd spelrytm i förgrunden. Rapportera dem separat.

## Förutsättning (blockerande)

Kör EFTER att kö-/portalvågen landat och arkiverats: portalhierarki, nudges-åldersviktning, supporter-dedupen. Pinna commit-hashen provet körs mot. Körs det mot rörligt maskineri bevisar ett grönt prov ingenting.

## Spår A — logiken (golvet)

Felen som underkände Grind 2 var reprises/motstridigheter över tid — de hittades av tioårskörningen, inte av enhetstest. Regressionstesterna täcker de KÄNDA instanserna; det här provet letar de okända emergenta. Metoden är därför: modellen för en **händelseliggare** (varje pivotal-/uppskjutet event: id, typ, säsong, omgång, resolution) och **asserterar invarianterna nedan löpande**, med checkpoint-save före/efter varje pivotal resolution så ett brott kan reproduceras.

## Omfattning

Två säsonger på aktuell save. Inte åtta. Men **styrda, inte slumpade** — en neutral körning triggar kanske aldrig de riskabla scenerna. Spela adversariellt mot dem:

- pressa burnout (spela överbelastat så taket faktiskt kan fyra),
- låt kafferum-ekon ackumulera och nå ett djupt slutspel (där ×4 uppstod),
- bygg upp en stor uppskjuten kö (där reproduktion/svält uppstod),
- ta klubben till lägen där galan och klackkonflikten fyrar.

## Invarianterna (pass = noll brott)

1. **Burnout-taket:** högst ett slutval per säsong. Inga oförenliga/motstridiga slutval över de två säsongerna. Efter det irreversibla "Kliv tillbaka" återkommer INTE taket samma säsong.
2. **Kafferums-eko:** stabil event-identitet. Ingen reprisering inom två säsongers cooldown. Aldrig samma replik flera gånger i ett slutspel.
3. **Bandygalan:** återkommer INTE efter resolution.
4. **Klackkonflikten:** samma semantiska konflikt-event nygenereras INTE efter resolution (den spårade supporter-buggen).
5. **Beslutskön:** inget uppskjutet beslut reproduceras eller fastnar olösligt. Fruset Granska-kort är lösbart även efter köpromotion. Central dedupe håller över pending + deferred. Avbrottsbudgeten visar högst tre; åldersprioriteringen svälter inga deadline-lösa beslut.

## Pass-kriterium

Noll invariantbrott över de två säsongerna, PÅ de triggade scenerna → Grind 2 flippar till **passerad**, båda grindraderna arkiveras. Varje brott → den specifika buggen återöppnas som rad, med checkpoint-saven som repro.

## Spår B — spelupplevelsen (taket)

Spela och läs samma två säsonger i gränssnittet. För varje säsong dokumenteras konkreta ögonblick som belägger:

- Är den primära handlingen tydlig?
- Vilken nästa olösta fråga drar vidare?
- Vilken landning gör just denna säsong minnesvärd?

Över båda säsongerna: bär bågen och känns den stora beslutskön lättare efter portalhierarki och åldersviktning? Har burnout, kafferum, galan och klackkonflikten kvar sin dramatiska tyngd när repetitionen försvinner? Bevaka även kausalitetens dosering och supporterhumöret enligt de konsoliderade Grind 2-frågorna.

Håll isär naturliga spelarval och eventuella konstruerade kompletteringsprov. En otriggad riskscen innebär saknad täckning, aldrig ett godkänt delprov. Syntetiska prov ersätter inte genomspelningen eller dess upplevelsebedömning.

## Rapport och dom

Spår A redovisar täckning, liggare, checkpoint-saves och invariantbrott. Noll brott ger pass först när samtliga riskscener faktiskt prövats. Spår B redovisar upplevelsen med belägg från samma körning. En bra upplevelse räddar aldrig en bruten invariant; en ren logg är inte bevis för en bra upplevelse. Grind 3:s tidigare dom står kvar, med en färsk kvalitativ uppföljning av dess köreservation. Arkivera bara grindrader som fortfarande är öppna och först när pass-kriteriet är uppfyllt.
