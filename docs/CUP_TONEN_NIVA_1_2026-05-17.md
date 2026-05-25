# Cup-tonen Nivå 1 — faktiska commentary-pooler

**Datum:** 2026-05-17
**Av:** Opus (Nivå 1 enligt `CUP_TONEN_DIREKTIV_2026-05-16.md`)
**Status:** Redo för Code att klistra in i `src/domain/data/matchCommentary.ts`. Nivå 2 + 3 + 4 kommer senare.
**Tonalt rättesnöre:** Bandysvensk understatement, oktober-känsla, "inget riktigt men ändå allt", inte överdramatisera, sparsamma utropstecken. Eko av cupAnslag.ts utan kopiering.

---

## STRÄNGARNA — direkt att klistra in

```ts
cup_kickoff: [
  "Domaren blåser. {team} mot {opponent}.",
  "Avslag. Oktober. Bandyåret börjar nu.",
  "Och så drar det igång. Cupens första riktiga kraftmätning.",
  "{team} tar emot. Spelarna är inte i form, isen ligger knappt.",
  "Avslag. Det är fortfarande höst — men ändå redan bandy.",
],

cup_goal: [
  "Den sitter. {player} med {score}. I cupen räknas alla mål.",
  "{player}! Bollen ligger där. {score}. Något att ta med till tisdagsträningen.",
  "MÅL för {team}. {player} hittar nätet. {score}.",
  "Det första målet i cupen kommer ofta överraskande tidigt. {player}. {score}.",
  "{player} sätter dit den. {score}.",
],

cup_fullTime_win: [
  "Slutsignal. {team} går vidare. Kvarten väntar.",
  "Det är slut. {score}. {team} har en match till i cupen.",
  "Domaren blåser. {team} klarar sig.",
  "Slutspelad. {team} vidare, {opponent} hem. Det blev sista cupmatchen för dem i år.",
],

cup_fullTime_loss: [
  "Slutsignal. Cupen är slut för {team}. {score}.",
  "Det är över. {team} åker ur. Söndagar fria fram till ligastart.",
  "{team} nådde inte ända fram. Bara en match — och den är slut.",
  "Domaren blåser. {opponent} vidare. {team} har 22 omgångar att se fram emot.",
],
```

**Total:** 18 strängar. 5 + 5 + 4 + 4.

---

## INTEGRATIONSANVISNING TILL CODE

### Var keys ska tilläggas

`src/domain/data/matchCommentary.ts` — lägg som nya keys i `commentary`-objektet. Föreslagen placering: efter `final_fullTime_loss` (rad ~140), före `playoff_general`. Cup hör tonalt mellan slutspel och liga.

### Vilken logik som ska välja cup-pool

Cup-matcher (omg 1, kvart, semi) ska plocka:
- `cup_kickoff` istället för `kickoff` när `match.competition === 'cup' && match.cupRound !== 'final'`
- `cup_goal` istället för `goal`/`goalOpener`/`goalLead` när `match.competition === 'cup' && match.cupRound !== 'final'`
- `cup_fullTime_win` eller `cup_fullTime_loss` istället för `fullTime` baserat på resultat

**Andelar enligt direktiv:** Plocka cup-specifika strängar ~60% av tiden, fall tillbaka till generic 40%. Det ger variation utan att cupen tappar prägeln.

Lämplig implementation:
```ts
function pickCupOrGeneric(cupPool: string[], genericPool: string[], rng: () => number): string {
  const useCup = rng() < 0.6
  return useCup ? pickCommentary(cupPool, rng) : pickCommentary(genericPool, rng)
}
```

### Vad som INTE ska ändras

- `final_kickoff`, `final_goal`, `final_fullTime_*` — dessa antar SM-final och ska FORTSÄTTA göra det. Cup-finalen får separata `cup_final_*`-pooler i Nivå 2 (senare leverans).
- `context_cup_final` (3 strängar) — befintliga, kvar. Plockas som pre-match-context från `context-pool`-systemet.
- `playoff_*`, `quarterfinal_*`, `semifinal_*` — dessa är slutspels-pooler för LIGAN, inte cupen. Berör inte.

### Cup-finalen (notering)

Cup-finalen i denna leverans plockar fortfarande från generic `final_*`-pooler. Det är medvetet — Nivå 2 löser separationen mellan cup-final och SM-final. Tills dess accepteras att cup-finalen tonar mer åt SM-final-håll än anslaget ("Pokalen är inte den finaste") signalerar. Kvitterar tonalt gap.

---

## TONALT REGISTER — vad varje pool gör

### cup_kickoff
- **Variant 1** är default. Minimalistisk, direkt.
- **Variant 2** etablerar oktober-tidskoden ("Bandyåret börjar nu" eko från anslaget).
- **Variant 3** refererar cupens karaktär utan att förklara.
- **Variant 4** är den längsta — ge variation, plus tonal-uttryck ("just därför finns det här" är cupens existensberättigande).
- **Variant 5** har en oktober-konkret detalj ("frosten kvar i bollen") som signalerar tidpunkt utan vädertickern.

### cup_goal
- **Variant 1, 5** understryker stake-naturen ("inga omspel"). Cupens distinktion.
- **Variant 2** ekar tisdagsträning-referensen från anslaget — vardaglig påminnelse.
- **Variant 3** har en lågmäld klausul ("om det räcker hela vägen"). Inte kavalleri.
- **Variant 4** observerar mönster snarare än celebrerar — "det första målet kommer ofta överraskande tidigt".

### cup_fullTime_win
- **Variant 1, 2** är funktionella. Sju ord.
- **Variant 3** ekar anslagets cup_done ("Nu vet vi att vi kan spela bandy igen").
- **Variant 4** noterar att motståndaren åker ut — cupens ena-väg-natur synlig.

### cup_fullTime_loss
- **Variant 1, 2, 3** kortar progressivt — slut, ut, klar.
- **Variant 4** ekar anslagets cup_done ("Det blev vad det blev"). Mest stalt-Forsbacka-resignerat.

---

## VAD JAG MEDVETET INTE GJORDE I NIVÅ 1

- **Cup-final-separation från SM-final.** Nivå 2-jobb.
- **Cup_atmosphere och cup_finalweekend_atmosphere.** Nivå 3-jobb. Atmosphere-tickers fungerar ändå generiskt under cupen tills dess.
- **Specifika reduceringsmål / kvitteringar / ledningsmål för cup.** Cup använder generic `goalOpener`/`goalEqualizer`/`goalLead` när andelslogiken faller på generic. Räcker för Nivå 1.
- **Specifika cup-suspension- och cup-save-pooler.** Bortom Nivå 1. Cupens karaktär förmedlas tillräckligt via kickoff/goal/fullTime.

---

## EFTER LEVERANS

När Code integrerat:
- Verifiera att cup-matcher (omg 1, kvart, semi) plockar cup-pooler ~60% av tiden
- Verifiera att cup-finalen FORTFARANDE plockar `final_*` (ingen regression)
- Verifiera tester gröna
- Jacob playtester en cup-match (helst första omgången) — granska tonen i kontext

Om tonen sitter: Nivå 2 (cup_final-separation) blir nästa skrivuppgift.
Om tonen behöver justeras: säg vilka strängar som hostar fel — jag skriver om individuellt.
