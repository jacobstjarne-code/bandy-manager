# DOM — påståendekontraktet skiva 2: hallProcessService (ratificerande)

**Datum:** 2026-09-08 · **Av:** Opus · **Beställd av:** Jacob (ratificera hall) · **Grund:** `DOM_PASTAENDE_GENERERINGSKONTRAKT_2026-09-08` (piloten), Codes pilotrapport 2026-09-08. Auktoriserar `hallProcessService.ts` som skiva två och ratificerar de redan pushade annoteringarna, villkorat av granskning.

## Grund: piloten är grön, formen höll

Pilotrapporten är entydig: 47/47 patron-/kontraktstester gröna, TypeScript rent, produktionsbuild och alla fyra lintgrindar gröna. Och det som räknades: alla åtta faktiska patron-event passade `state-predicate`, noll behövde `ledger`, noll behövde `timeless`, inget påstående föll utanför de tre formerna. Backstory-/citatpooler är stämning, inte verifierbara påståenden, korrekt utanför grinden.

Pilotdomen sa "en skiva i taget, nästa domas när piloten är grön". Piloten ÄR grön. Villkoret är uppfyllt. Skiva två auktoriseras.

**Ett förbehåll som står i kontraktet framåt:** att noll patron-event föll på `ledger`/`timeless` bevisar att formen HÅLLER, inte att de två grenarna är onödiga. hallProcessService bär hallhistorik (bordlagda/nedlagda byggen, kommunbeslut) — där lär `ledger`-grenen (facility_trial_outcome-posten) och möjligen `timeless` träffas. Formen är bekräftad på patronEvents, inte förenklad.

## Domen: ratificera, inte revertera

De 11 proofSource-annoteringarna mot `hallProcessService.ts` skrevs FÖR TIDIGT — innan en dom auktoriserade filen — och är redan pushade. Men de är inte fel: de är skrivna mot kontraktet, och kontraktet höll på piloten. Att reverta riktiga annoteringar bara för att återställa ordningen vore att förstöra gott arbete för principens skull. Fel var ordningen, inte innehållet.

Så: `hallProcessService.ts` är skiva två, och de 11 annoteringarna ratificeras — villkorat av granskning, inte blint.

## GODKÄNT NÄR (samma tröskel som piloten)

Code granskar de 11 hall-annoteringarna mot den BEVISADE formen, på samma sätt som patronEvents granskades:
- Varje annotering bär rätt gren för sitt påstående (`state-predicate` / `ledger` / `timeless`), inte bara kompilerar.
- state-predicate-guarderna är faktiskt wirade vid genereringen.
- Håller alla → de står. Håller någon inte → just den rättas, inte hela filen revertas.
- Build + tsc + test + lintgrindar gröna på hallProcessService efteråt.
- Bekräfta vilka grenar hallProcess faktiskt träffade (förväntat: ledger och/eller timeless dyker upp här, till skillnad från patron).

## SKYDDAT / ordning framåt

- STOPP efter hall står kvar. `postAdvanceEvents.ts`, `eventFactories.ts`, `eventResolver.ts` rörs INTE förrän hall är grön-bekräftad och nästa skiva domd. En fil i taget — det var strukturen som fångade felexpansionen; den överges inte för att den tänjdes en gång.
- Nästa skiva (`postAdvanceEvents`) domas när hall är grön-bekräftad.
- Huvudradens status: öppen, väntar på nästa namngivna dom (som Code föreslog). Inte stängd förrän hela populationen är genomgången skiva för skiva.

## Ägarskap

Code: granska de 11 hall-annoteringarna mot formen, rätta ev. avvikare, bekräfta grönt + vilka grenar som träffades. Codex: speltesta empiriskt efter (hall-påståendena fyrar med sina guards). Opus: denna dom + nästa skivas dom när hall är grön. Jacob: ratificeringen given.

## Verifieringsutfall — Code 2026-09-08

**GRÖNT, ingen kodändring krävdes.** Alla 11 `GameEvent`-konstruktioner i
`hallProcessService.ts` granskades mot sina faktiska genereringsguards och
runtime-prover. Varje `proofSource.evaluatedTrue` återanvänder den namngivna
boolean som gejtar samma konstruktion.

Grenfördelningen blev **11 `state-predicate`, 0 `ledger`, 0 `timeless`**.
Domens förväntan att hallhistoriken möjligen skulle träffa `ledger` infriades
inte, men det är korrekt ontologi: `facility_trial_outcome` skrivs först när
ett hallval har lösts. De elva påståendena görs före resolution och handlar om
levande FSM-state — frister, lösta delbeslut, stöd, krav, kommunrelation,
ortsstöd, aktiv patron och deterministisk fördyringsrisk. Ingen historisk post
finns ännu att belägga dem med. Inget påstående saknade state och behövde
`timeless`.

Verifiering: 41/41 fokustester gröna (kontrakt, hallsekvens, resolution och
`facility_trial_outcome`-liggare), TypeScript rent, produktionsbuild samt alla
fyra lintgrindar gröna. Empirisk 390 px-browserkontroll visade den verkliga
hallprövningsytan i `FÖRANKRING` med `STÖD I BYGDEN 56/100`. Ytans stora tomma
fält är redan spårat av `design-p1-tysta-ytor`; ingen dubblettpunkt skapades.
