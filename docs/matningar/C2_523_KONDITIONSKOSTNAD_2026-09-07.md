# C2 — kalibrering av 5-2-3:s konditionskostnad

**Datum:** 2026-09-07  
**Status:** verifierad sammanställning  
**Beslut:** `FORMATION_523_EXTRA_FITNESS_COST = 10`

## Vad som mättes

Mätningen sökte det minsta heltalsvärde som gör att en staplad offensiv taktik inte längre är dominant över en hel serie. Balanserad och staplad taktik kördes på samma seeds genom den riktiga rundprocessorn, så kondition, återhämtning, rotation, avstängningar och nödtrupp följde med mellan matcherna.

- Klubb: Målilla (`club_malilla`)
- Seeds: 10 000 parade seeds med start på 70 000
- Omfattning: två profiler × 22 ligamatcher × 10 000 seeds = 440 000 simulerade matcher
- Profiler: `balanced` och `stacked`
- Mätverktyg: `scripts/c2-season-tactic-measurement.ts`
- Kommando: `npm run analyze:c2-season-tactics -- --seeds=10000 --json`
- Fel och walkovers: 0

Acceptanskravet var att staplad taktik över säsongen skulle förlora minst lika ofta som den vann mot balanserad taktik på samma seed.

## Resultat

| Extra kostnad | Staplad bättre | Lika | Staplad sämre | Poängdelta, staplad − balanserad | Godkänd |
|---:|---:|---:|---:|---:|:---:|
| 3 | 5 423 | 883 | 3 694 | +1,06 | Nej |
| 9 | 4 590 | 876 | 4 534 | +0,05 | Nej |
| 10 | 4 485 | 867 | 4 648 | −0,06 | Ja |

Vid kostnad 10 var den genomsnittliga slutkonditionen 39,02 för staplad taktik och 49,19 för balanserad. Staplad taktik krävde i genomsnitt 0,35 nöduppflyttningar per säsong mot 0,10 för balanserad. Det visar att kostnaden biter genom säsongsslitage, inte genom att försvaga formationens enskilda match.

## Slutsats och låst beslut

Kostnad 10 är det minsta verifierade heltalet som klarade säsongskravet. Kostnad 9 föll precis utanför. Därför låses värdet till 10.

Kostnaden appliceras efter matchen. Den tidigare engångsmätningen, där staplad taktik vann 57,0 procent mot balanserads 45,8 procent i gynnsam kontext, lämnas därmed orörd: 5-2-3 får vara starkt kortsiktigt men kostar över en serie.

Om 5-2-3 senare visar sig vara för lockande som standardval ska 11 prövas med samma parade säsongsmätning. Värdet ska inte höjas på känsla.

## Spårbarhet

- Engångsbaslinje: `7980e385`
- Säsongsharness: `fb029d82` och `43c38feb`
- Implementering och kalibreringsbeslut: `d117d1660062dbaf6f4d0ef52241fec47b71a48d`
- Stängning i MASTER: `564505eb6b47c26a55cd5edcdee6e46f27054913`
- Regressionstest: `src/application/useCases/processors/__tests__/playerStateProcessorFatigue.test.ts`
- Verifiering vid beslutet: 485 testfiler, 4 607 tester och produktionsbygge gröna

## Dataintegritet

Detta dokument är en separat, verifierad sammanställning av resultat som redan var bevarade i MASTER och commit-historiken. Den exakta JSON-utskriften från acceptanskörningen sparades inte som rådatafil. Därför ska dokumentet inte citeras som rådata på seednivå.

Sammanfattnings-JSON kan återskapas genom att checka ut den kompatibla mätkoden och köra kommandot ovan. Verktyget skriver aggregerad JSON till standardutmatningen; det sparar inte en fil och innehåller inte resultat per seed i JSON-objektet.
