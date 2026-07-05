# A1 — Win probability-modell

**Analys:** ANALYSSPEC_VAG2_OEXPLOATERAT.md A1. **Utförare:** Code. Fable skriver finding.

## Metod

Per-match tillståndslinje ur `goals[]`. För varje matchminut 1–90 och målskillnad hemma−borta (trunkerad till [−3,+3] med kantklasser) empirisk utfallsfördelning (hemmavinst / oavgjort / bortavinst) i grundserien. Ett mål i minut m får effekt från minut m+1; flera mål samma minut resolveras tillsammans. Celler med n≥30 markeras `reliable`.

**Minutkonvention:** per rå matchminut (tillstånd vid en speltidsminut). Halvleksflaggan gäller halvleks-*bucketing* — här indexeras på rå minut, korrekt för en win-prob-tidslinje. Minut 45–50 blandar 1H-tilläggstid och tidig 2H i speltid; noteras som begränsning, påverkar ej tillståndslogiken.

**Underlag:** herr grundserie 1124 matcher, dam grundserie 376 matcher.

## Hemmavinst-sannolikhet per målskillnad (herr, P_home, * = n<30)

- **diff +3:** min15: 90% (n=30) | min30: 96% (n=112) | min45: 98% (n=191) | min60: 97% (n=272) | min75: 99% (n=307) | min89: 100% (n=346)
- **diff +2:** min1: 100%* (n=1) | min15: 77% (n=105) | min30: 75% (n=150) | min45: 80% (n=123) | min60: 81% (n=102) | min75: 91% (n=111) | min89: 98% (n=108)
- **diff +1:** min1: 69%* (n=26) | min15: 64% (n=274) | min30: 60% (n=236) | min45: 61% (n=209) | min60: 65% (n=158) | min75: 63% (n=151) | min89: 79% (n=112)
- **diff +0:** min1: 50% (n=1068) | min15: 50% (n=412) | min30: 45% (n=259) | min45: 40% (n=226) | min60: 40% (n=184) | min75: 32% (n=130) | min89: 18% (n=125)
- **diff -1:** min1: 31%* (n=29) | min15: 30% (n=207) | min30: 32% (n=185) | min45: 27% (n=147) | min60: 19% (n=143) | min75: 12% (n=131) | min89: 2% (n=107)
- **diff -2:** min15: 19% (n=73) | min30: 19% (n=94) | min45: 17% (n=95) | min60: 12% (n=106) | min75: 6% (n=90) | min89: 0% (n=83)
- **diff -3:** min15: 4%* (n=23) | min30: 10% (n=88) | min45: 3% (n=133) | min60: 1% (n=159) | min75: 0% (n=204) | min89: 0% (n=243)

## "Match död"-tröskel — första minut där utfallet är ≥95 % säkert (reliable)

| Målskillnad | Herr | Dam |
|---|---|---|
| 3 | min 30 | min 19 |
| 2 | min 84 | min 31 |
| 1 | aldrig <90 | aldrig <90 |
| -1 | aldrig <90 | aldrig <90 |
| -2 | min 84 | min 52 |
| -3 | min 55 | min 18 |

## Halvtid (minut 45) — jämförelse mot findings 001/011/038

Findings 001/011/038 anger halvtidsledning→vinst ~78 % (herr). Denna modell ger tillståndet vid exakt minut 45:

| diff vid min 45 | P_home herr | n | P_home dam | n |
|---|---|---|---|---|
| 3 | 98% | 191 | 100% | 90 |
| 2 | 80% | 123 | 93% | 30 |
| 1 | 61% | 209 | 62% | 55 |
| 0 | 40% | 226 | 44% | 45 |
| -1 | 27% | 147 | 7% | 44 |
| -2 | 17% | 95 | 11% | 37 |
| -3 | 3% | 133 | 0% | 75 |

*Not:* modellens "+1 vid minut 45"-cell är den direkta motsvarigheten till findings 001/011/038:s halvtidsledning. Findingsen aggregerar alla ledningar ≥1; denna modell särskiljer +1/+2/+3.

## Täckning

- Herr: 585/620 celler reliable (n≥30).
- Dam: 447/621 celler reliable — glesare grid (376 matcher); celler med n<30 flaggade, ej utelämnade.

## Begränsningar

- Grundserie endast; slutspel ej inkluderat (annan dramaturgi, bäst-av-format).
- Tre-utfallsmodell: oavgjort redovisas som eget utfall, ej hopslaget.
- Minut 45–50 blandar 1H-tilläggstid/tidig 2H i speltid (se metod).
- Empirisk grid, ingen utjämning/regression — glesa celler brusiga (flaggade).
- 2023–24 saknas i datasetet.

## Öppna Q-nummer som berörs

Win-prob-tidslinjen ger direkt underlag till halvtidslednings-frågorna bakom findings 001/011/038 och till varje Q i `docs/findings/facts/questions/` som rör matchläges-prediktion över tid. (Ingen enskild Q stängs helt — modellen är ett verktyg, inte ett enkelt ja/nej.)
