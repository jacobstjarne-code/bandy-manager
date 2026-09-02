# DOM — HIGH 1: burnout-taket dual-writar till eventLedger (självmotsägelsen)

**Datum:** 2026-09-02 · **Av:** Opus · **Utlöst av:** GPT:s omtest HIGH 1 — årsboken sa "Inget beslut stack ut i vintras" OCH "Första gången du satte dig själv först. Det sätter sig, ett sånt beslut." på samma sida. Intern självmotsägelse.

## Rotorsak (kodläst, eventResolver.ts burnoutCeiling-blocket)

Burnout-brytpunkten (`event.type === 'burnoutCeiling'`) skriver `managerProfile.diary` + `managerProfile.burnoutScar` — men INTE `eventLedger`. Alla ANDRA spelar-beslut i `resolveEvent` skriver liggaren (`captureDecisionRipple` → `logEvent`, och `captureSystemDecision` → `buildDecisionLedgerEntry` → `logEvent`). Burnout-valet är det ENDA stora beslutet som kringgår kanon.

Och "Säsongens beslut" (`pickMostImportantDecisionText`, seasonEndProcessor) läser BARA `eventLedger`. Så:
- Årsbokens managersektion läser `diary` → ser ärret → "Första gången du satte dig själv först".
- "Säsongens beslut" läser `eventLedger` → ser inget burnout-val → "Inget beslut stack ut".

Två minnesfickor, samma händelse, motsägande svar. Det är händelseliggarens hela poäng bruten: ett beslut i en silo i stället för i kanon.

## Domen — dual-writa burnout-brytpunkten till eventLedger

I `burnoutCeiling`-blocket (efter scar-skrivningen), lägg en `logEvent`-skrivning parallellt med diary-skrivningen — samma dual-write-mönster som `buildDecisionLedgerEntry` redan använder. `EventLedgerEntry`-posten ska bära:

- `type: 'decision'` — det ÄR ett spelar-beslut (samma type som seasonDecision-posterna).
- `semanticKey: 'burnoutCeiling:step_back'` / `'burnoutCeiling:push_through'` — finkornigt per gren, så composeSeasonDecisionSentence kan skilja dem.
- `season` / `matchday`: `updatedGame.currentSeason` / `updatedGame.currentMatchday` (GLOBAL, samma som scar-raden — konsekvent skala).
- `irreversible: true` — valet ÄR märkt permanent i eventet; rankningen ska behandla det som det.
- `tension: true` — bägge grenar svider (framgångskurvans form), ett äkta vägval.
- `systemsAffectedCount`: HÖGT (säg 4) — burnout-valet rör manager-tillstånd, träning, styrelse-tålamod, laget. Det är brett, och rankningen (A-H9-vektorn: irreversibelt → tension → antal system) ska lyfta det över triviala beslut.
- `madeByPlayer: true` — redan gated av blocket (`if (madeByPlayer && ...)`).
- `subject`: ingen (det är managern själv, inte en spelare/klubb) — utelämnas.
- INGEN prosa. "Säsongens beslut"-meningen komponeras av composeSeasonDecisionSentence ur `semanticKey` — samma som alla andra decision-poster. Så en NY gren i composeSeasonDecisionSentence behövs för `burnoutCeiling:step_back`/`push_through` → **det är en [Opus]-textrad**, jag skriver den när Code:s composer-gren står.

## Konsekvens
"Säsongens beslut" ser nu burnout-valet, rankar det högt (irreversibelt + tension + brett), och väljer det som säsongens viktigaste när det inträffar — som det borde. Självmotsägelsen försvinner: bägge ytorna (managersektionen OCH säsongens beslut) läser samma händelse, från samma kanon.

## SKYDDAT
- **Dual-write, inte flytt.** Diary + burnoutScar-skrivningen står kvar (managersektionen läser dem). Liggarposten är NY, parallell — inte en ersättning. Samma invariant som hela migreringen.
- **madeByPlayer-gaten** är redan där — ett auto-resolvat burnout-val (ska aldrig ske, rollover=expire) skriver varken diary eller ledger.
- **Skala:** global matchday, samma som scar-raden — ingen ligarond i en global-skalad array.
- **Rankningen får inte svälja andra beslut.** systemsAffectedCount högt är rätt för DET HÄR valet, men Code verifierar att det inte råkar tränga undan ett genuint större beslut samma säsong (det ska KUNNA vinna, inte ALLTID vinna).

## GODKÄNT NÄR (GPT omtest, samma karriär)
1. Välj "Kliv tillbaka" / "Kör vidare", avsluta säsongen.
2. "Säsongens beslut" nämner burnout-valet (inte "inget beslut stack ut").
3. Managersektionen OCH säsongens beslut säger samma sak om samma händelse.
4. Ett genuint större beslut samma säsong kan fortfarande vinna över burnout-valet (rankningen är inte hårdkodad till burnout).

## ÄGARSKAP
Code: `logEvent`-skrivning i `burnoutCeiling`-blocket med posten ovan (bygg `EventLedgerEntry` direkt, `type: 'decision'`, fälten specificerade). Ny composeSeasonDecisionSentence-gren för `burnoutCeiling:step_back`/`push_through`, mall `[Opus]`. Opus: den komponerade "säsongens beslut"-meningen för de två grenarna, mot composer-strukturen. Jacob: inget beslut väntar — domen följer trestegsmodellen + händelseliggaren, bägge etablerade.
