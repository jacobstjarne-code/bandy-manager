# 4.2 — Storyline- och arc-frågornas saknade topikanpassade svar

**Efterfrågad tre gånger, aldrig levererad förrän nu.** SLUTTEST_KO.md post 4.2: "13 storyline-frågor saknar topikanpassade svar" + "4 arc-aware-frågor med samma bugg, inte medräknade i de 13". Jacobs order 2026-08-19: arc-frågorna ingår ("samma bugg är samma bugg"), listan läggs i `docs/`, Jacob skriver svaren samma dag den finns.

**Roten (samma för alla 17):** `pressConferenceService.ts`s override-block väljer en topikanpassad `text` men återanvänder ordagrant `preferIds` från frågan som gällde INNAN overriden — den ursprungliga, ämneslösa matchfrågan. Mönstret upprepas identiskt på alla 17 rader:

```ts
question = { text: '...', preferIds: question.preferIds }  // ← preferIds hör till FÖRRA frågan
```

Följden: spelarens svarsalternativ (`bw_*`/`w_*`/`cl*`-koderna som styr vilka fördefinierade svar som visas) matchar aldrig den nya frågans ämne — svaren är korrekta för en helt annan fråga.

**Vad som behövs per rad:** ett nytt, topikanpassat `preferIds`-set (samma svarsbanks-ID-format som redan finns i filens huvudbank, rad 30-60) som faktiskt besvarar DEN HÄR frågan. Jacob skriver dessa; Code wire:ar in dem rakt av när listan är ifylld — samma mekaniska fix på alla 17 rader, ingen ny kod krävs bortom att byta ut `preferIds: question.preferIds` mot de nya listorna.

---

## De 13 storyline-/community-standing-frågorna

### Storyline-triggade (8), `pressConferenceService.ts` ~rad 657–696

| # | Ämne | Frågetext | Trigger |
|---|---|---|---|
| 1 | Underdog, vann | "Ingen trodde på er i augusti. Vad säger du till tvivlarna?" | `storyline: underdog_season`, matchen vunnen |
| 2 | Underdog, tappar | "Ingen trodde på er i augusti. Vad hände?" | `storyline: underdog_season`, laget har ≥3 förluster |
| 3 | Kaptenens tal | "Kaptenen tog ton i omklädningsrummet. Har det gett effekt?" | `storyline: captain_rallied_team` |
| 4 | Räddad från varsel, matchhjälte | "Berätta om {spelare}s resa tillbaka." | `storyline: rescued_from_unemployment`, spelaren gjorde mål i matchen |
| 5 | Räddad från varsel, allmänt | "Varslet drabbade era spelare hårt. Hur har klubben hanterat situationen?" | `storyline: rescued_from_unemployment`, ingen målskytt-koppling |
| 6 | Heltidsproffs | "{spelare} slutade jobbet för att satsa på bandyn. Har det betalat sig?" | `storyline: went_fulltime_pro` |
| 7 | Återvänt till klubben | "Berätta om {spelare}s resa tillbaka till klubben." | `storyline: returned_to_club` |
| 8 | Galavinnare | "{spelare} vann galan. Hur viktigt är det för laget?" | `storyline: gala_winner` |

### Community-standing-triggade (5), `pressConferenceService.ts` ~rad 697–714

| # | Ämne | Frågetext | Trigger |
|---|---|---|---|
| 9 | Hög status i orten | "Det pratas om er i hela kommunen. Är det press eller inspiration?" | `communityStanding > 75` |
| 10 | Låg status i orten | "Publiken sviker. Hur påverkar det laget?" | `communityStanding < 35` |
| 11 | Ny mecenat | "Ni har fått {mecenat}s stöd. Gör det skillnad i omklädningsrummet?" | mecenat anländ denna säsong |
| 12 | Bygge pågår | "Det byggs vid arenan. Hur påverkar det koncentrationen?" | aktivt anläggningsbygge, omgång ≥8 |
| 13 | Ung akademispelare imponerar | "{spelare} imponerar. Hur hanterar ni trycket på en så ung spelare?" | spelare befordrad ur akademin, ålder ≤20, omgång ≥4 |

---

## De 4 arc-aware-frågorna (tidigare inte medräknade)

`pressConferenceService.ts` ~rad 640–655, samma bugg (`preferIds: question.preferIds`), triggas när en spelares karaktärsbåge är i fasen `'peak'`.

| # | Ämne | Frågetext | Arc-typ |
|---|---|---|---|
| 14 | Genombrott, tveksam | "{spelare} har det tungt. Tror du fortfarande på honom?" | `hungrig_breakthrough` |
| 15 | Jokern, delade meningar | "{spelare} delar fansen. Kostar han mer än han ger?" | `joker_redemption` |
| 16 | Veteranens sista säsong | "Blir det här {spelare}s sista säsong?" | `veteran_farewell` |
| 17 | Kontraktsrykten | "Rykten säger att {spelare} kan lämna. Kommentar?" | `contract_drama` |

---

## Format för svaren

Samma struktur som filens befintliga svarsbank (rad 30-60): en lista `preferIds: string[]` per fråga, där varje ID pekar mot ett fördefinierat svarsalternativ i samma bank. Om en fråga kräver HELT NYA svarsalternativ (inget befintligt `bw_*`/`w_*`/`cl*`-svar passar ämnet) — namnge dem, Code lägger till dem i banken i samma sving som `preferIds` wire:as in.
