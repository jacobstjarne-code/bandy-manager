# Cup-tonen Nivå 2 — cup-final-separation från SM-final

**Datum:** 2026-05-17
**Av:** Opus (Nivå 2 enligt `CUP_TONEN_DIREKTIV_2026-05-16.md`)
**Status:** Redo för Code-integration. Bygger på Nivå 1 (`CUP_TONEN_NIVA_1_2026-05-17.md`).
**Tonalt rättesnöre:** Pokalen är INTE SM-guldet. Lågmäld dramatik, ingen "Sveriges Superbowl"-prägel. Eko av `cup_finalweekend_pre`, `cup_final_pre`, `cup_done`, `cup_done_winner` från anslagen.

---

## STRÄNGARNA — direkt att klistra in

```ts
cup_final_kickoff: [
  "Domaren blåser. {team} mot {opponent}. Cupfinalen.",
  "Avslag. Bollnäs. En match. Inget omspel.",
  "Om 90 minuter har pokalen hittat hem.",
  "Cupfinal. Två lag. En match. Vinnaren tar allt.",
],

cup_final_goal: [
  "MÅL! {player} med {score}. {team} är ett steg närmare.",
  "Den sitter. {player} hittar nätet. {score}. Cupfinalmål.",
  "{player}! {score}. Första steget mot pokalen är taget.",
  "MÅL för {team}. {player}. {score}. Det är cupen som står på spel.",
],

cup_final_fullTime_win: [
  "Slutsignal. {team} tar hem pokalen. {score}.",
  "Det är klart. {team} vinner cupen. Inte den främsta pokalen — men den första vi vunnit på länge.",
  "Domaren blåser. {team} är cupmästare. {score}.",
  "Slutspelat. Pokalen är vår. Lite blank. Lite lätt.",
],

cup_final_fullTime_loss: [
  "Slutsignal. {opponent} tar hem pokalen. För {team} stannar det vid finalförlust. {score}.",
  "Det är över. Pokalen blev någon annans. {score}.",
  "Slut. {team} kom så långt. Men det räckte inte hela vägen.",
  "Domaren blåser. {opponent} är cupmästare. {team} reser hem.",
],
```

**Total:** 16 strängar. 4 + 4 + 4 + 4.

---

## INTEGRATIONSANVISNING TILL CODE

### Var keys ska tilläggas

`src/domain/data/matchCommentary.ts` — placera direkt efter cup-pool-blocket från Nivå 1.

### Trigger-villkor

```ts
const isCupFinal = match.competition === 'cup' && match.cupRound === 'final'
```

- `cup_final_kickoff` plockas 100% av tiden vid kickoff i cup-final (inte 60/40)
- `cup_final_fullTime_win/loss` plockas 100% av tiden vid fullTime
- `cup_final_goal` plockas ~60% av tiden vid mål, generic `goal`/`goalOpener`/`goalLead` 40%

**Motivering för 100% på kickoff/fullTime:** Det är ETT ögonblick per säsong. Inte slöseri att lägga det på cup-pool varje gång.

**Motivering för 60/40 på goals:** En cupfinal har 3-7 mål. Pool om 4 räcker inte för variation. Generic-fallback håller stilen utan att tappa cup-prägeln.

### Vad som INTE ska användas i cup-finalen

- `final_kickoff` (SM-final-pool) — ska INTE plockas
- `final_goal` (SM-final-pool) — ska INTE plockas
- `final_fullTime_win/loss` (SM-final-pool) — ska INTE plockas
- `cup_kickoff/cup_goal/cup_fullTime_*` (Nivå 1) — ska INTE plockas i finalen

Cup-final är sitt eget register. SM-final-pooler reserveras för SM-final.

### Befintliga keys som FORTSATT plockas i cup-final

- `context_cup_final` (3 strängar, pre-match-pool) — kvar som-är
- Generic `goal` / `goalOpener` / `goalLead` / `goalEqualizer` — för 40%-fallback
- `corner` / `save` / `miss` / `neutral` / `atmosphere` — generic match-flavor
- Weather-pooler — påverkas inte av cup-final-status

---

## TONALT REGISTER — vad varje pool gör

### cup_final_kickoff
- **#1** är default. "Cupfinalen." som efterhängd word ger vikt utan att överdramatisera.
- **#2** är platsen — Bollnäs. Direkt eko från `cup_finalweekend_pre`-anslaget.
- **#3** är räknande — 90 minuter, en pokal, en någons. Kort och vägd.
- **#4** är distinktion — säger vad det ÄR (cupfinal, två lag, en match, pokalen). Ingen poesi.

### cup_final_goal
- **#1** ekar "Pokalen lutar" — bandyformulering för att vågen tippar. Direkt, inte poetiskt.
- **#2** kombinerar Nivå 1's "Den sitter" med cupfinal-prägeln.
- **#3** har stigen-metafor — varje mål är ett steg mot pokalen. Tål 4-5 mål i samma match utan att bli upprepande tack vare placeholders.
- **#4** är funktionell — säger vad som hände, vad som ligger på spel.

### cup_final_fullTime_win
- **#1** är minimum-form. Slutsignal, pokal, score.
- **#2** är centralcitatet — direkt eko från `cup_done_winner`-anslaget. "Inte den finaste pokalen — men den första vi vunnit på länge." Det är *cupens egen ton om sig själv*.
- **#3** är formell — "är cupmästare". Sportradio-prägel utan att vara Hollywood.
- **#4** ekar slut-bilden från `cup_done_winner`: "Lite blank. Lite lätt." Pokalen på byrån. Försökt INTE använda "blev vad det blev"-formulering.

### cup_final_fullTime_loss
- **#1** är funktionell — "stannar det vid finalförlust". En kvalifikation, inte krossande.
- **#2** är direkt — pokalen blev någon annans. Klassisk sport-fras.
- **#3** är "så långt — men inte hela vägen". Klassisk svensk understatement om att förlora en final.
- **#4** är funktionell igen — sluta, motståndare cupmästare, vi reser hem. Inget krasch.

**Notering:** Cup-final-förluster är AVSIKTLIGT inte krossande på samma sätt som SM-final-förluster (`final_fullTime_loss` antar SM). Cupen "är cupen", förlust där betyder du fortfarande har säsongen kvar. Det skiljer från SM-final där förlust betyder allt-eller-inget.

---

## EFTER LEVERANS

När Code integrerat:
- Verifiera att cup-final-matcher plockar cup_final_*-pooler (inte SM-final-pooler eller Nivå 1 cup-pooler)
- Verifiera att alla 16 strängar har korrekta placeholders ({team}, {opponent}, {player}, {score})
- Verifiera tester gröna
- Vid playtest av cup-final: ton sittande?

Om tonen sitter: Cup-tonen är klar. Nivå 3 (cup_atmosphere + cup_finalweekend_atmosphere för Bollnäs-helgen) blir nästa skrivuppdrag.

Om tonen behöver justeras: säg vilka strängar — jag skriver om individuellt.
