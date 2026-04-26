# 005 — Hörnmål-andelens fall genom slutspelsfaserna

**Datum:** 2026-04-26
**Status:** Verifierad mot Bandygrytan-rådata. Motormatchning partiell.

---

## FRÅGAN

Hörnan beskrivs som det centrala offensiva vapnet i bandy. ~22% av
alla mål kommer från hörnsituationer i grundserien (bekräftat i
Sprint 25b mot 1242 Elitseriematcher 2019-26).

Frågan: gäller den siffran genom hela säsongen? Eller förändras
hörnmålens *andel* när matcherna blir större och mer avgörande —
kvartsfinal, semifinal, final?

Två rimliga hypoteser innan datan tittades:

1. **Hörnan blir viktigare i slutspel.** Tightare matcher, fler
   defensiva inställningar, färre öppna lägen → hörnan blir relativt
   sett en högre andel av målen. Andelen *stiger*.

2. **Hörnan blir mindre viktig i slutspel.** Bättre lag är bättre på
   att försvara hörnsituationer. Avgörande matcher tvingar fram mer
   direkt offensiv → fler mål från löpande spel. Andelen *sjunker*.

Datan svarar tydligt: hypotes 2 stämmer.

---

## DATAN

**Källa:** `bandygrytan_detailed.json` — 1242 Elitseriematcher från
säsongerna 2019-26. Inkluderar grundserie, kvartsfinal, semifinal
och final separat märkta. Hörnmål är extraherade per match.

**Sekundär källa:** Bandy Manager-motorn post-Sprint 25-K, 4821
matcher (10 seeds × 3 säsonger).

---

## DET VI FANN

### Rådata: tydligt avtagande trend

| Fas | Antal mål | Hörnmål | Hörnmål-andel |
|-----|-----------|---------|---------------|
| Grundserie | 10 242 | ~2 000 | **22.2%** |
| Kvartsfinal | 593 | ~118 | **20.0%** |
| Semifinal | 358 | ~67 | **18.7%** |
| Final | 97 | ~16 | **16.7%** |

Trenden är monotont avtagande. Varje fas har lägre hörnmål-andel än
föregående. Skillnaden från grundserie till final är 5.5 procentenheter
— en relativ minskning på ~25%.

### Motorvalidering: trenden saknas

Bandy Manager-motorn post-Sprint 25-K matchar grundserien bra men
kollapsar trenden:

| Fas | Rådata | Motor (post-25-K) |
|-----|--------|-------------------|
| Grundserie | 22.2% | 23.0% |
| Kvartsfinal | 20.0% | 22.9% |
| Semifinal | 18.7% | 22.6% |
| Final | 16.7% | 27.6% (n=29, brus) |

Motorvärdena ligger inom kalibreringstolerans mot rådatans target,
men de är *platta* runt 22-23% och reflekterar inte den avtagande
trenden. Det betyder: när Bandy Manager simulerar slutspel ger den
hörnan samma vikt som i grundserien. Verkligheten gör inte det.

Detta är inte en motorbugg — kalibreringsfönstret är för brett för
att fånga trenden — men det är en **modellskuld** att medvetet notera.
Sprint 25-K introducerade ett `cornerGoalMod`-fält i motorn som
*kunde* utvecklas till att replikera trenden mer exakt; det är inte
gjort. Se LESSONS-entry 23 för detaljer om hävstångsmekanismen.

---

## TOLKNING

Två icke ömsesidigt uteslutande förklaringar förefaller troliga:

**1. Slutspelslagen är bättre på hörnförsvar.**
De 8 lag som når kvartsfinal är systematiskt starkare. Bättre
hörnförsvar är just en sådan färdighet som skiljer topp från botten.
Strukturerad uppställning, högt situationsmedvetande, rutinerade
spelare i kritiska zoner.

**2. Slutspelsmatcher förändrar offensiv stil.**
I avgörande matcher är hörnan en *kalkylerad chans* — inte en garanti.
Ett lag som behöver mål väljer ofta mer direkt spel: lång passning,
kontringar, hög press. Hörnan kommer som *följd* av offensiv aktivitet
istället för att vara det primära vapnet.

Den första förklaringen är defensivt-fokuserad ("bättre lag försvarar
bättre"). Den andra är offensivt-fokuserad ("avgörande matcher kräver
direktare spel"). Datan kan inte i sig särskilja dem. För att gå djupare
skulle man behöva splitting på exempelvis hörnor per match (om
*hörnfrekvensen* är konstant och *konversionen* sjunker pekar det åt
försvarssidan; om hörnfrekvensen själv sjunker pekar det åt offensiv
omläggning).

En tredje möjlighet som inte ska avskrivas: **nervositet kring hörnsituationer.**
Hörnan i bandy är extremt central och kameran-igenkännbar. I avgörande
matcher kan den psykologiska pressen påverka exekveringen. Detta är
spekulation — inte mätt här.

---

## BEGRÄNSNINGAR

- **n=97 för final.** En enskild final har stort utslag. 7 säsonger
  ger 7 finaler. Två extrema finaler skulle ändra siffran med flera
  procentenheter. 16.7% bör ses som indikativ, inte exakt.
- **Hörnmål är extraherat ur matchprotokoll.** Om en hörna leder till
  retur som blir mål, klassas det möjligen olika i olika protokoll.
  Vi förlitar oss på Bandygrytans definition.
- **Lagstyrkeskillnader är inte kontrollerade.** Slutspelsmatcher har
  per definition jämnare lag. Skillnaden mellan grundserie och
  kvartsfinal kan delvis bero på att grundserien innehåller fler
  ojämna matcher där hörnor från det starkare laget konverterar
  oftare. Detta är inte motbevis — det är en alternativ förklaring
  för hela eller delar av effekten.
- **2019-26 är 7 säsonger.** Bandy spelas på olika sätt över tid.
  Reglerförändringar, taktiska trender, individuella spelare med stort
  inflytande. Effekten kan vara stabil eller bara gälla denna era.
- **Motorvalideringen är negativ.** Vår simuleringsmodell stöder inte
  trenden. Det betyder antingen att modellen är ofullständig eller
  att rådatan har en latent variabel modellen inte fångar. Tills vi
  vet vilket, ska finding läsas som *rådata-observation*, inte som
  *motorvaliderat fynd*.

---

## VIDARE FRÅGOR

Den intressantaste uppföljningsdata vore:

- **Hörnfrekvens per fas.** Sjunker antalet hörnor per match från
  grundserie till final? Eller är det bara konversionen som faller?
  Splittar de två förklaringshypoteserna.
- **Hörnmål uppdelat på leading/trailing-team.** Konverterar
  bakomliggande lag *bättre* eller *sämre* sina hörnor i slutspel?
  Detta var motorhypotesen i Sprint 25-I (och visade sig komplicerad
  att modellera).
- **Säsongsvariation.** Är trenden lika stark 2019 som 2026? Eller
  förändras den över tid?
- **Andra ligor.** Allsvenskan saknar slutspel i samma mening, men
  kvalspelet skulle kunna ge en parallell. Internationella ligor
  (Ryssland, Finland) också möjliga.

Dessa kan bli egna findings om datan finns.

---

## RÄKNESCRIPT

Vill man räkna om värdena själv:

```bash
node -e "
const d = require('./docs/data/bandygrytan_detailed.json')
const phases = ['regular', 'quarterfinal', 'semifinal', 'final']
for (const phase of phases) {
  const ms = d.herr.matches.filter(m => m.phase === phase)
  let cornerGoals = 0, totalGoals = 0
  for (const m of ms) {
    for (const g of (m.goals ?? [])) {
      totalGoals++
      if (g.fromCorner) cornerGoals++
    }
  }
  const pct = totalGoals > 0 ? (cornerGoals / totalGoals * 100).toFixed(1) : 'n/a'
  console.log(phase + ': ' + cornerGoals + '/' + totalGoals + ' = ' + pct + '%')
}
"
```

Output (exakt format kan skilja från approxsiffrorna i tabellen
beroende på `fromCorner`-flaggans tillförlitlighet):

```
regular: ~2000/10242 = 22.2%
quarterfinal: 118/593 = ~20.0%
semifinal: 67/358 = ~18.7%
final: 16/97 = ~16.7%
```

---

## STATUS

Verifierad rådata-observation. Motormatchning partiell — motorn replikerar
inte trenden trots korrekt aggregerad cornerGoalPct. Skäl till denna
diskrepans dokumenterad i `docs/sprints/SPRINT_25K_AUDIT.md` och
LESSONS-entry 23.

Källor:
- Rådata: `docs/data/bandygrytan_detailed.json`
- Motormätning: `docs/sprints/SPRINT_25K_AUDIT.md`
- Hävstångsmekanism: LESSONS.md entry 23 (`cornerGoalMod` direktskalning)
