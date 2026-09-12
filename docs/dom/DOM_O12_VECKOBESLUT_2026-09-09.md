# DOM — O12 utvidgad till WeeklyDecision (veckobeslutens förhandstext)

**Datum:** 2026-09-09 · **Av:** Opus · **Beställd av:** Jacob (via Codex O12-veckobeslutsrapport) · **Grund:** `RAPPORT_O12_VECKOBESLUT_BROWSER_2026-09-09` (Codex, kodläst + browserbelägg), `weeklyDecisionService.ts` (`WeeklyDecisionOption.effect`), `WeeklyDecisionSecondary.tsx`, `DOM_O12_FORHANDSTEXT_KONTRAKT_2026-09-09` (EventChoice-domen). Utvidgar den domen till en andra beslutstyp.

## Diagnosen (Codex-kodläst, jag bekräftar mönstret)

`WeeklyDecisionOption.effect` är EN presentationssträng som visas både före klicket och i 2,5-sekunderskvittot efteråt. `corner_extra_training` visar `+3 hörnskicklighet` FÖRE valet — exakt icke-penga-facit, mot O12:s produktregel. Samma sjukdom som `EventChoice.subtitle`, men en SEPARAT parallell kontraktsväg som EventChoice-domen och dess grind inte rör. Katalogen läcker på flera rader (`player_weekend_off` −1 kondition·+5 moral, `away_trip_bus` −5 stämning, `tifo_contribution`, `reporter_klacken` ±3 kommunstatus, `survival_emergency_lotto`s slumpade nedsida).

## Domen — utvidga, inte undanta

Veckobeslut ska INTE vara ett O12-undantag. Samma princip som EventChoice: kvalitativ riktning FÖRE, exakt utfall EFTER, pengar exakta båda. Konkret (Codex punkt 1–4, ratificerade):
- `WeeklyDecisionOption` får ett separat KVALITATIVT förhandsfält.
- Store-resolvern returnerar ett STRUKTURERAT kvitto ur den faktiska clampade före/efter-diffen (inte den återanvända previewsträngen).
- `WeeklyDecisionSecondary` visar förhandsfältet före klicket, det faktiska kvittot efter.
- Bygggrinden utvidgas till hela `WeeklyDecision`-katalogen.
- INTE en strängändring (den bevarar kvittot men läcker facit, eller tvärtom).

## Vokabulären

Befintliga resurser mappar mot EventChoice-domens vokabulär:
- **supporterstämning** = fanMood → + "lyfter stämningen på läktaren" · − "grumlar stämningen"
- **kommunstatus** = communityStanding → + "orten värmer" · − "orten kyler"
- **moral** → + "lyfter humöret" · − "riskerar missnöje" / "grumlar humöret"

Nya resurser veckobesluten använder, som EventChoice-domen inte namngav — låsta här:
- **kondition** → + "piggare" · − "tröttare" (eller ansträngningsformen: "kostar kondition")
- **hörnskicklighet** (offensiv) → + "vassare i hörnorna" · − "tappar i hörnorna"
- **hörnförsvar** → + "stabilare i hörnförsvaret" · − "skakigare i hörnförsvaret"
- **skapad motståndaranalys** → "du får läsa nästa motståndare" (kvalitativ vinst, ingen siffra)

Pengar-lika, alltså EXAKTA (inte kvalitativa):
- **scoutbudget** — en kr-pool spelaren kan räkna på; anges exakt i kr, som pengar. Inte kvalitativ.
- vanliga tkr-belopp (`away_trip_bus` −3 tkr, `survival_emergency_lotto` +5 tkr) exakta som förut.

## Slumpade utfall (survival_emergency_lotto)

Uppsidan (+5 tkr) är pengar, exakt tillåtet före. Den slumpade NEDSIDAN kan inte beskrivas sant av en statisk rad före valet — förhandstexten blir kvalitativ: "en chansning — kan slå åt bägge håll." Det exakta slumpade utfallet visas i kvittot EFTER, ur den faktiska diffen.

## Ägarskap

Code: bygg den delade datavägen (separat förhandsfält + strukturerat efterkvitto ur clampad diff), utvidga grinden till hela katalogen, regressionstester per Codex punkt 5 (attribut, moral+kondition, clampad supporter-/ortseffekt, pengar+annan resurs, slumpad lotto, noop). Opus: denna dom + vokabulären (skriver om en rad om en resurs saknas). Jacob: byggbeslutet — samma O12-program som EventChoice-delen (redan byggd `b5e6dfad`).
