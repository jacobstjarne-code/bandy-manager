# Femte passet — avskedsdiagnos, de sex kvarvarande seeden (2026-08-23)

Jacobs order: spåra de sex kvarvarande avskeden individuellt, pröva två hypoteser. Script: `scripts/o5-avsked-diagnos-2026-08-23.ts`, samma 20 seeds/klubb/harness som acceptanstestet, nu med full per-säsong-dekomponering (löpande term vs. säsongsslut+objektiv-term) och en fullständig bygglogg.

**Kort svar: båda hypoteserna avfärdas. Den verkliga rotorsaken är en tredje sak — meritbuffertens SCOPE, inte dess magnitud.**

---

## H1 — bygger E-STRESS1 mer aggressivt än en förnuftig spelare? AVFÄRDAD

Bygglogg för samtliga sex (se full data i scriptets output): modesta, tidiga noder (kiosk/stralkastare, 80 000 kr styck) byggs när kassan har god marginal, byggandet **pausar korrekt** när kassan blir ansträngd — seed 70000 och 70004 bygger ingenting alls efter säsong 1, exakt vad en förnuftig spelare hade gjort med en kassa som inte återhämtar sig. Ingen enskild byggnad ser ut som ett dåligt beslut givet kassan vid tillfället; det dyraste enskilda köpet (`laktare_ostra`, 300 000 kr, seed 70006 säsong 5) lämnade fortfarande 318 617 kr kvar.

## H2 — når kassaspänningen boardPatience via en okartlagd väg? AVFÄRDAD

**Konkursvägen är tyst:** 0 av 32 säsongssampel (de sex körningarnas alla spelade säsonger) träffade någonsin `game-over`-tröskeln (< −2 mkr) eller ens `license-denial` (< −1 mkr). Bara 2 sampel nådde `warning` (< −500k) — långt under vad som krävs för att konkursvägen ska aktiveras.

**Ingen kodväg finns heller mellan kassa och matchstyrka.** Fristående kodgranskning (denna session): `wageWarning`/`wagePressure` är rent kosmetiska UI-flaggor utan mekanisk effekt. `boardPatience` läses aldrig tillbaka in i spelarstatistik eller matchsimulering. Den enda verkliga (men separata) väg som finns är licensnämndens trupp-nedskärning vid `finances < -200 000` sustained — en mycket hårdare tröskel än något av de sex fallen någonsin närmade sig.

Skiftet i VILKA seeds som sparkas mellan de två körningarna (57000/70003/70005 nya, 70007/70009/70010 nu överlevande) är sannolikt en ordinär RNG-kaskadeffekt — E-STRESS1:s byggpolicy förbrukar RNG-tillstånd annorlunda från runda till runda beroende på spelläge, vilket sprider sig till matchsimuleringen. Inte ett tecken på en dold ekonomisk feedback-loop.

## Den verkliga rotorsaken: meritbufferten skyddar fel DEL av säsongsslutet

Full dekomponering, alla sex körningar, 32 säsongssampel:

| Term | Summa | Andel negativa säsonger |
|---|---|---|
| Löpande term (svit/vinst/förlust, redan taket 5 omgångar) | −123,0 | 19/32 |
| **Säsongsslut + objektiv-term** | **−276,0** | **21/32** |

Säsongsslutstermen är alltså den STÖRRE boven — inte den löpande termen, vilket var min ursprungliga arbetshypotes innan dekomponeringen. Men här är den avgörande detaljen: **meritbufferten (`computeBoardPatienceUpdate`) ser BARA positionsdelen av säsongsslutstermen — objektivkostnaden (`OBJECTIVE_PATIENCE_COST`: met +3/at_risk −2/active 0/failed −5) läggs på HELT SEPARAT, efteråt, i `seasonEndProcessor.ts`, utan att bufferten någonsin får chansen att absorbera den.**

Konkret bevis, seed 70000 säsong 3: slutplacering 4 — exakt på ChallengeTop-ankaret (gap=0). Positionstermen ger alltså **0** i delta. Ändå visar dekomponeringen säsongsslut+objektiv = **−12,0**. Hela den siffran är objektivkostnad — tre misslyckade uppdrag (3×−5=−15, eller en blandning av failed/at_risk) som bufferten aldrig såg, aldrig kunde skydda mot, eftersom den bara byggdes för att bevaka `computeBoardPatienceUpdate`s positionsdelta.

Samma mönster upprepas i nästan varje säsong i alla sex körningar — säsongsslut+objektiv-deltat är genomgående kraftigare negativt än vad positionstermen ensam kan förklara (t.ex. 70000 S4: position ger −12 (gap=−3, slope 4), observerat säsongsslut+objektiv = −27,0 — mellanskillnaden, −15, är objektivkostnad).

**Det här förklarar varför seed 70014 (den ursprungliga treepeat-klubben) klarar sig men dessa sex inte gör det:** 70014:s tre golden-säsonger höll objektiven mötta (kassörens/styrelsens uppdrag lyckas naturligt när laget vinner allt), så det fanns aldrig någon objektivkostnad att skydda mot. De sex som fortfarande sparkas är klubbar i en LÅNGSAMMARE, mer realistisk nedgång — där både position OCH uppdrag glider isär samtidigt, och bufferten bara följer med på halva resan.

## Rekommendation, inte byggd — Jacobs dom

Meritbufferten (`computeBoardPatienceUpdate`) behöver troligen utökas till att ALSO absorbera det negativa `objectiveDelta`-bidraget, inte bara positionstermen — samma "förbrukas innan patiensen rör sig"-princip, bara på en bredare bas. Två sätt att göra det, ingendera byggd:

**A. Flytta objektivkostnaden in i `computeBoardPatienceUpdate`s scope.** Kräver att `seasonEndProcessor.ts` skickar med `objectiveDelta` som ett extra argument till `computeBoardPatienceUpdate`, så samma buffer-logik (`delta >= 0` bankar, `delta < 0` förbrukar bufferten först) appliceras på position+objektiv SUMMERAT, inte position isolerat.

**B. Behåll uppdelningen, men låt objektivkostnaden också kunna dras mot bufferten separat** — en andra, mindre invasiv ändring i `seasonEndProcessor.ts` där `objectiveDelta < 0` också förbrukar återstående `meritBuffer` innan den träffar `boardPatience`.

Båda kräver antingen en högre `MERIT_BUFFER_CAP` (eftersom bufferten nu skulle behöva täcka mer skada per säsong) eller en andra, separat buffert för objektiv. **Domen jag väntar på:** är det avsiktligt att uppdragsmisslyckanden ska kosta "på riktigt" oskyddat (styrelsens tålamod med LÖFTEN är skilt från tålamod med TABELLPLACERING), eller ska meritbufferten täcka hela säsongsslutet som en enhet? Det är en designfråga, inte bara en magnitudfråga — det jag ursprungligen trodde skulle vara hela svaret.
