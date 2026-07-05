# Underlag — foul / straff / power play (findings 057–059)

**Utförare:** Code. **Källa:** `bandygrytan_detailed.json`, alla matcher (herr 1321, dam 428). Reproducerbar: `python3 scripts/analyze_foul_penalty.py`.

Detta är den persisterade källan bakom de tre redan publicerade finding-sidorna. Den fullständiga A2 (PP-konvertering per duration, reform 25/26, shorthanded-mål) enligt `ANALYSSPEC_VAG2_OEXPLOATERAT.md` är en separat, mer rigorös körning.

## Finding 057 — sabotage per spelläge (herr)

| Spelläge | Sabotage/utv. | Andel | 95 % CI |
|---|---|---|---|
| leder | 149/1949 | 7.6 % | [6.5–8.9] |
| jämnt | 60/1087 | 5.5 % | [4.3–7.0] |
| under | 82/1951 | 4.2 % | [3.4–5.2] |

Leder/under-kvot: **1.82×** — ledande lag saboterar oftare.

## Finding 058 — straffkonvertering

| Serie | Straffar | Straffmål | Konvertering | 95 % CI |
|---|---|---|---|---|
| herr | 996 | 648 | 65.1 % | [62–68] |
| dam | 430 | 234 | 54.4 % | [50–59] |

## Finding 059 — power play (rate-matchat)

| Serie | PP mål/min | ES mål/min | Lyft | PP-andel av mål |
|---|---|---|---|---|
| herr | 6.7 % | 4.78 % | 1.4× | 20.2 % |
| dam | 6.46 % | 4.73 % | 1.37× | 19.8 % |

### Straff-timing per 15-min-fönster (herr, rå minut)

| Fönster | Straffar | Andel |
|---|---|---|
| 0-14 | 103 | 10 % |
| 15-29 | 125 | 13 % |
| 30-44 | 150 | 15 % |
| 45-59 | 170 | 17 % |
| 60-74 | 150 | 15 % |
| 75-89 | 243 | 24 % |

n = 996. Straffarna koncentreras till slutkvarten (75–89).

## Begränsningar

- PP-status härleds ur utvisningarnas start + längd; överlappande utvisningar (5v3) slås samman.
- Shorthanded-mål räknas till full styrka, vilket trycker ihop PP-lyftet något (försiktig skattning).
- Straff-timing per rå minut; fönstret 45–59 blandar 1H-tilläggstid och tidig 2H (se toppnot).
- 2023–24 saknas i datasetet.
