# A5 — Momentum och svarsmål

**Analys:** ANALYSSPEC A5. **Utförare:** Code. Fable skriver finding.

**Motorns mekanik:** `equalizeMomentumTeam: ×1.30 attack-boost avtagande över ~6 min till kvitterande lag`.

## Metod

För varje mål: nästa måls tid och lag (samma lag = utökning, motståndaren = svar). Kvitteringsmomentum = mål som gör ställningen jämn; testar om det kvitterande laget gör nästa mål (tar ledningen) oftare än baslinjen. Verklig data (herr/dam) via halvleksflagga; sim-mål ur motorn (`matchCore` via `roundProcessor`), rå motorklocka. Primärjämförelse: verklig herr vs sim. Wilson-CI på andelar.

Baslinje för kvitteringsmomentum ~= hemmamålsandel (~50%). Styrkeheterogenitet konfunderar bägge dataset likartat; primärjämförelsen är verklig vs sim, inte mot 50%.

## Huvudjämförelse (herr vs motor)

| Mått | Verklig (herr) | Sim (motor) |
|---|---|---|
| Utökningsgrad (nästa mål samma lag) | 55.0% [54.1–56.0] (n=10398) | 47.7% [46.8–48.6] (n=11561) |
| **Kvitteringsmomentum** (kvitterare tar ledn.) | 51.0% [48.4–53.6] (n=1439) | 46.0% [43.8–48.2] (n=1919) |
| — därav inom 6 min (boost-fönstret) | 21.1% [19.0–23.2] (n=1439) | 24.9% [23.0–26.9] (n=1919) |
| Snabbt svar ≤5 min | 43.2% [41.8–44.6] (n=4677) | 42.9% [41.7–44.2] (n=6048) |

Median tid till svarsmål: verklig 7 min, sim 6 min. Median efter kvittering: verklig 8 min, sim 6 min.

## Tolkning — stämmer motorn?

Kvitteringsmomentum: verklig **51.0%** vs sim **46.0%** → **motorn underdriver momentum**. (Baslinje utan momentum ≈ hemmamålsandel, verklig 53.6% / sim 52.9%.)

## Svarsfrekvens per ledning efter målet (herr vs sim)

Andel där motståndaren gör nästa mål (svar), villkorat på målskyttens ledning direkt efter målet.

| Ledning efter mål | Verklig svar% | Sim svar% |
|---|---|---|
| -7 | 64.0% (n=25) | — |
| -6 | 65.1% (n=43) | — |
| -5 | 63.6% (n=77) | 46.8% (n=109) |
| -4 | 66.5% (n=164) | 47.3% (n=169) |
| -3 | 63.7% (n=248) | 39.0% (n=323) |
| -2 | 59.7% (n=439) | 53.1% (n=733) |
| -1 | 48.9% (n=785) | 50.5% (n=1138) |
| +0 | 49.0% (n=1439) | 54.0% (n=1919) |
| +1 | 45.8% (n=2607) | 50.6% (n=3155) |
| +2 | 43.3% (n=1647) | 50.4% (n=1926) |
| +3 | 39.5% (n=1065) | 57.4% (n=1149) |
| +4 | 36.0% (n=680) | 53.8% (n=533) |
| +5 | 38.8% (n=449) | 53.2% (n=280) |
| +6 | 32.0% (n=266) | 100.0% (n=127) |
| +7 | 29.5% (n=166) | — |
| +8 | 27.5% (n=102) | — |
| +9 | 18.0% (n=61) | — |
| +10 | 17.0% (n=47) | — |
| +11 | 40.7% (n=27) | — |

## Verklig dam (referens)

Kvitteringsmomentum dam: 50.8% [44.6–57.0] (n=248). Utökningsgrad 71.1% [69.6–72.6] (n=3336).

## Begränsningar

- Styrkeheterogenitet konfunderar utöknings-/momentum-måtten (starkare lag gör fler mål i rad oavsett momentum). Verklig-vs-sim-jämförelsen är robust mot detta eftersom bägge har heterogenitet.
- Sim-mål saknar halvleksflagga; halvlek härledd ur rå motorminut (motorklockan är ren).
- Sim: 1490 matcher (3 seeds × 3 säsonger), managed + AI-matcher blandat.
- 2023-24 saknas i verklig data.

## Öppna Q-nummer som berörs

Momentum-/svarsmåls-frågorna i `docs/findings/facts/questions/` samt motorkalibrering av `EQUALIZE_MOMENTUM` (D-fact om värdet justeras).
