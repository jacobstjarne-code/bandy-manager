# B1 financing-kalibrering — utfallstabell (Code, 2026-06-18)

**Av:** Code · **Order:** `BESTALLNING_CODE_B1_CLOSEOUT` steg 6 — *rapportera, döm inte*. Inga värden ändrade. Siffrorna läggs framför Opus/Jacob för beslut.

## Ekonomimodellen (referens, `economyService.ts`)
- `weeklyBase = 3000 + reputation × 50` (varje omgång)
- Matchintäkt (hemma): `kapacitet × närvarograd × biljettpris`, `biljettpris = 50 + rep×0.3`, `kapacitet = arenaCapacity ?? rep×7+150`
- `netPerRound = weeklyBase + sponsor + matchintäkt + community`

**Typklubbar (worldGenerator):** rep 55–85, kassa 350k–800k. Referensfall nedan: **mittenklubb rep 55, kassa 350k** (svagaste typiska).
- weeklyBase = 3000 + 55×50 = **5 750/omg**
- kapacitet ≈ 535, biljett ≈ 66 → hemmamatch ≈ 535×0.7×66 ≈ **24,7k** (≈ varannan omgång) → matchsnitt ≈ 12k/omg
- net ≈ **15–25k/omg** (exkl. sponsor-spread) → ≈ 150–300k över en halvsäsong

## Utfallstabell — klubbens kostnad per finansiering (clubCost = cost×(1−share))

| Nod | cost | Egen kassa | Kommun (share/minRel) | Mecenat (share) |
|-----|------|-----------|----------------------|-----------------|
| kiosk | 80k | 80k | **56k** (0.3 / 40) | **48k** (0.4) |
| strålkastare | 80k | 80k | **56k** (0.3 / 40) | **48k** (0.4) |
| värmestuga | 120k | 120k | **84k** (0.3 / 40) | **72k** (0.4) |
| akademi_2 | 120k | 120k | **84k** (0.3 / 40) | **60k** (0.5) |
| gym | 150k | 150k | **105k** (0.3 / 40) | **90k** (0.4) |
| belysning | 240k | 240k | **144k** (0.4 / 45) | **144k** (0.4) |
| akademi_3 | 250k | 250k | **150k** (0.4 / 55) | **125k** (0.5) |
| läktare östra | 300k | 300k | **210k** (0.3 / 55 + standing 50) | **180k** (0.4) |
| träningshall | 380k | 380k | **228k** (0.4 / 50) | **190k** (0.5) |

## Observationer (ingen dom)
- **Små noder (80–150k)** är betalbara ur kassan för en mittenklubb (350k) utan medfinansiering — finansieringsvalet är en bonus, inte en spärr. Stämmer med "låg tröskel så svaga klubbar inte stängs ute".
- **Stora noder (300–380k egen kassa)** är nära-prohibitiva ur ren kassa för en svag klubb (skulle dränera 350k → tight). Med kommun/mecenat faller de till 180–228k — en halvsäsongs nettoinkomst, byggbart. Det är där Orten-relationen får mening (kartfynd 14: kassan får ett syfte).
- **Tröskelstegen** (rel 40 små → 55 stora, + standing 50 på läktare) gör att de stora co-finansieringarna kräver en upparbetad relation — en svag klubb måste först bygga Orten-förtroende. Konsekvent princip.
- **belysning** har samma clubCost via kommun och mecenat (båda 144k) — kommun-share höjd till 0.4 (ungdomsargument) möter mecenat-0.4. Ingen avvikelse, bara värt att notera att de sammanfaller.

## Frågor till Opus/Jacob (beslut, ej Code)
1. **Är stora noders egen-kassa-kostnad avsiktligt nära-prohibitiv** (tvingar Orten-relationsvägen)? Ser ut som design-intentionen men bör bekräftas.
2. **Mecenat-share 0.4–0.5 vs kommun 0.3–0.4** — mecenat tar genomgående en större andel än kommunen. Avsiktligt (mecenat = djupare ficka, mer personlig relation)? Eller ska kommun vara den generösare för de ungdomsinriktade noderna?

Inga värden ändrade. Väntar på dom innan ev. justering.
