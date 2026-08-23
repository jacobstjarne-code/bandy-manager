# ÅRSBOKENS TVÅSANNINGSMENING

**Datum:** 2026-08-23 · **Av:** Opus
**Post:** High 1:s sista del i Skutskär-auditen. Kräver `SeasonSummary.objectiveOutcome`.

**Rättelse 2026-08-24:** raden ovan var stale redan när den skrevs — `objectiveOutcome` fanns redan i `seasonEndProcessor.ts` (`evaluateObjective()`-resultatet skrevs dit innan denna fil öppnades). Tredje stale statusraden i samma serie (efter O4/matchvyn) — se LESSONS.md.

---

## Problemet

Skutskär slutade åtta av tolv med `AvoidBottom` som styrelsemål. Årsboken sade *mer än nöjd*. Två uppdrag låg samtidigt under rubriken `STYRELSEUPPDRAG I FARA` i portalen.

Båda var sanna. Placeringen överträffade målet; uppdragen missades. Årsboken valde den ena och tystade den andra, och då lät den som att den inte visste vad som hänt.

---

## Regeln

**När placeringsdomen och uppdragsutfallet pekar åt olika håll ska båda stå i samma mening.** Inte som två meningar efter varandra — som en, med ett `men`.

Pekar de åt samma håll står bara den ena. En mening som säger *bra, och också bra* är brus.

---

## De fyra fallen

`objectiveOutcome` ger `{ failed, atRisk, met }`. Placeringsdomen ger ett betyg 1–5.

### Placering bra, uppdrag missade

> **{Placeringsdom}, men {N} uppdrag {missades}.**

- *Åttondeplatsen överträffade målet, men två uppdrag missades.*
- *Ni höll er kvar, men publikmålet nåddes aldrig.*

Enstaka missat uppdrag namnges; två eller fler räknas.

### Placering dålig, uppdrag mötta

> **{Placeringsdom}. Uppdragen höll ni däremot.**

- *Elfte plats var under det de bad om. Uppdragen höll ni däremot.*

### Placering bra, uppdrag hotade men inte missade

> **{Placeringsdom}. {N} uppdrag hängde löst ända in i mars.**

`at_risk` som aldrig blev `failed` är värt att nämna — det är skillnaden mellan att klara sig och att klara sig knappt, och den skillnaden är hela vitsen med att `at_risk` inte längre plattas till `failed`.

### Båda pekar åt samma håll

Ingen tvåsanningsmening. Bara placeringsdomen, som i dag.

---

## Ordningen i meningen

**Placeringen först, uppdragen sist.** Skälet: uppdragen är det spelaren kan påverka mest direkt, och det som står sist är det man bär med sig. En mening som slutar i placeringen låter som ett facit; en som slutar i uppdragen låter som något att göra något åt.

---

## Vad meningen inte gör

**Den dömer inte.** *Två uppdrag missades* är information. *Två uppdrag missades, vilket styrelsen inte glömmer* är en hotelse spelet inte behöver skriva — `boardPatience` har redan rört sig, och `BoardPatienceMinimal` visar det.

**Den förklarar inte varför.** Uppdraget missades; varför står i uppdragets egen rad.

**Den ursäktar inte.** Ingen variant med *trots att* eller *ändå*. Två fakta bredvid varandra, förbundna med `men`.

---

## Vad som krävs i data

`SeasonSummary.objectiveOutcome: { failed: number, atRisk: number, met: number }`, skriven i `generateSeasonSummary()` från de värden som redan beräknas i `seasonEndProcessor` men aldrig skickas vidare.

För namngivning av ett enstaka missat uppdrag behövs även dess etikett — samma sträng som `BoardObjectivesList` redan visar.

---

## Godkänd när

En spelare som läser årsboken efter en säsong som Skutskärs kan inte bli förvånad av vad `boardPatience` gör härnäst.
