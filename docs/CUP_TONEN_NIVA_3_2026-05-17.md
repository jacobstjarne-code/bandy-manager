# Cup-tonen Nivå 3 — cup_atmosphere + cup_finalweekend

**Datum:** 2026-05-17
**Av:** Opus (Nivå 3 enligt `CUP_TONEN_DIREKTIV_2026-05-16.md`)
**Status:** Redo för Code-integration. Slutar cup-skrivuppdraget — Nivå 1 + 2 + 3 är komplett tonal cup-prägel.
**Tonalt rättesnöre:** Bandysvensk understatement. Konkreta bilder, inte metaforer. Eko från cupAnslag.ts utan kopiering.

---

## STRÄNGARNA — direkt att klistra in

```ts
cup_atmosphere: [
  "Termosen ångar på läktaren. Det är första bandyn för säsongen för många.",
  "Nyspolad is, kylan doftar i näsan, men ingen vinter än.",
  "Höstens första riktiga match. Försäsongsträningen syns i skridskoskären.",
  "Mindre publik än vanligt. Stammisarna är där.",
  "Doften av korv hänger över läktaren.",
  "Strålkastarna tänds redan innan avslag.",
  "Sju grader på termometern. Halva publiken stampar.",
  "Cupen är cupen. Inte den finaste, men den första.",
],

cup_finalweekend_atmosphere: [
  "Bollnäs är full sedan en timme. Det är cup-finalhelg.",
  "Glöggen är slut redan klockan tio. Inte konstigt.",
  "Fyra färger på läktaren. Bandy-Sverige på en plats.",
  "Sävstaås. Fyrverkerier vid avslag.",
  "Lokalradion är på plats. TV-bilen står parkerad.",
  "Bollnäs centrum är fullt sedan i går. Långresta gäster.",
],
```

**Total:** 14 strängar. 8 + 6.

---

## INTEGRATIONSANVISNING

### Var keys ska tilläggas

`src/domain/data/matchCommentary.ts` — efter cup-pool-blocken från Nivå 1 och 2.

### Trigger-villkor

```ts
const isCupMatch = match.competition === 'cup'
const isCupFinalWeekend = isCupMatch && (match.cupRound === 'semi' || match.cupRound === 'final')
```

**cup_atmosphere:**
- Plockas ibland istället för generic `atmosphere`-pool när `isCupMatch === true && match.cupRound !== 'final'`
- Föreslagen andel: ~40% cup_atmosphere, ~60% generic atmosphere
- Motivering: atmosphere är hög-frekvent pool, för stor cup-andel blir trött

**cup_finalweekend_atmosphere:**
- Plockas ibland istället för generic `atmosphere` när `isCupFinalWeekend === true`
- Föreslagen andel: ~50% cup_finalweekend, ~30% cup_atmosphere, ~20% generic
- Motivering: cup-final-helgen är speciell, generic-andel kvar för variation, cup_atmosphere som mid-tier

### Pseudokod

```ts
function pickAtmosphereForCup(match, season, matchday, rng) {
  const r = rng()
  if (isCupFinalWeekend(match)) {
    if (r < 0.5) return pickCommentary(cup_finalweekend_atmosphere, rng)
    if (r < 0.8) return pickCommentary(cup_atmosphere, rng)
    return pickCommentary(atmosphere, rng)
  }
  if (isCupMatch(match)) {
    if (r < 0.4) return pickCommentary(cup_atmosphere, rng)
    return pickCommentary(atmosphere, rng)
  }
  return pickCommentary(atmosphere, rng)
}
```

---

## VAD JAG MEDVETET INTE LADE TILL

- **Väder-specifika cup-strängar.** Existing `weather_*`-pooler hanterar väder. Cup-atmosphere håller sig till tidpunkt + plats + känsla, inte väderlek.
- **Klubb-specifika atmosfärer i cup-finalhelgen.** "Forsbacka-fansen står tysta sedan tredje halvleken" hör hemma i klubb-supporter-pools, inte cup-pool.
- **Spelarspecifika cup-strängar.** Hör hemma i `legend_*` eller spelarprofil-pools, inte atmosphere.

---

## CUP-TONEN SAMMANFATTAT (Nivå 1 + 2 + 3)

Totalt levererat över de tre nivåerna:

| Pool | Antal | Trigger |
|---|---|---|
| cup_kickoff | 5 | Cup-omg 1/kvart/semi, 60% sampling |
| cup_goal | 5 | Cup-omg 1/kvart/semi, 60% sampling |
| cup_goalOpener | (del av cup_goal #4) | Matchens första mål i cup-match |
| cup_fullTime_win | 4 | Cup-omg 1/kvart/semi, 100% sampling |
| cup_fullTime_loss | 4 | Cup-omg 1/kvart/semi, 100% sampling |
| cup_final_kickoff | 4 | Cup-final, 100% sampling |
| cup_final_goal | 4 | Cup-final, 60% sampling |
| cup_final_fullTime_win | 4 | Cup-final, 100% sampling |
| cup_final_fullTime_loss | 4 | Cup-final, 100% sampling |
| cup_atmosphere | 8 | Cup-match (ej final), 40% av atmosphere-plock |
| cup_finalweekend_atmosphere | 6 | Cup-finalhelg, 50% av atmosphere-plock |

**Total:** 48 strängar (Nivå 1: 18, Nivå 2: 16, Nivå 3: 14).

Cup-fasen får nu egen tonal identitet i hela flödet: kickoff (Nivå 1+2), goals (Nivå 1+2), fullTime (Nivå 1+2), atmosphere (Nivå 3). Bandysvensk understatement, oktober-känsla, "inte ligan, inte SM — men det första".

---

## EFTER LEVERANS

När Code integrerat alla tre nivåer:
- Verifiera samplingen i playtest (cup-strängar plockas i rätt frekvens)
- Verifiera att cup-finalen separeras från SM-final tonalt
- Verifiera att cup_atmosphere och generic atmosphere blandas naturligt
- Tester gröna

Cup-skrivuppdraget är då **klart**. Inga fler cup-pooler planerade. Eventuell justering av enskilda strängar baserat på Jacobs playtest-fynd.
