# Design-brief — B1 Klubbutvecklings nya ytor

**Datum:** 2026-06-11
**Till:** Design (Fable)
**Från:** Opus
**Parar med:** `docs/B1-SPRINTORDNING-KLUBBUTVECKLING-2026-06-10.md` (strävan + sprintar, läs den först), `docs/SPEC_KLUBBUTVECKLING.md` (mekaniken), facility-trädets domänmodell-relay (Code, parallellt). **Bygg inom** försoningssprintens ratificerade system (`design-system/DESIGN-DECISIONS.md` systempatch 2026-06-11) — inga nya mönster, använd kanon.

Försoningssprinten städar *befintliga* ytor. Den här briefen gäller de ytor B1 *inför* och som ännu inte finns. Mockas när systemet satt sig efter försoningen — men strävan är låst, så specen kan ligga klar nu.

---

## Strävan — designa mot den här känslan, inte mot glans

I FM sträcker man sig mot glans. Inte här. I bandyn är matchhallen inte drömmen utan närmare ett hot mot själen — den driver publikdöden, och utomhus är så sporten *spelas*. Strävan är att **hålla det riktiga vid liv och i form:** den fulla läktaren, akademin som ger orten egna spelare, klubben som består *som sig själv* — utomhus, ortens, levande — säsong efter säsong. Beständighet av det äkta, inte ett monument. Vädret är texturen, inte en bugg.

Ytorna ska andas det. En klubb som väljer vad den vill vara, inom verkliga ramar — inte en uppgraderingsbutik.

---

## Ytorna att mocka

### 1. Utbyggnadsträdet (anläggning)
**I dag:** read-only anläggningsvy i Klubb/Orten (stjärn-legend, nivåer). **B1:** ett träd med dependencies, tre grenar — Anläggning · Verksamhet · Akademi. Aspirativt men inte triumfalt.

Hallfrågan i tre lager, och lagren måste *läsas olika* visuellt:
- **Konstis = baseline.** Klubben har den sedan 60-talet. Ingen byggnod — bakgrund, inte mål. Visa den som *given*, inte som något att sträcka sig mot.
- **Träningshall = accepterad.** Normalt, själs-bevarande steg (ungdom, åretrunt-träning). Ofarlig nod, ingen laddning.
- **Matchhall = den laddade gaffeln.** Sent, gated, valfritt. **Får ALDRIG rendera som trädets triumfala topp.** Den ska se *tyngre och mer tveksam* ut än noderna runt — en gren med ett pris, inte kronan på verket. Det här är den svåraste designuppgiften i hela B1: en "uppgradering" som visuellt signalerar tvekan.

### 2. PreSeason "Valet" — välj EN sak
Säsongsstartens beslut: läktare · värmestuga · träningshall · akademi (konstis är inget val). Ett *verkligt* vägval — läktare nu (fler på plats i år) eller akademin (ingenting i år, egna spelare om tre säsonger).

- **D1 landar här.** Det här beslutet ska väga **tyngre i kortgrammatiken än bussresan** — det är ett säsongs-definierande val, inte ett rutinbeslut. Ceremoni-nivå (typografiska scenen, om den passar), inte vanligt beslutskort.
- Varje alternativ bär **konsekvensraden** (se nedan): vad det ger *och* kostar, åt vilken horisont (i år / om tre säsonger).
- Känslan: en klubb som väljer sin identitet, med knappa medel. Inte en meny.

### 3. Matchhall-gaffeln
Sent, valfritt, **aldrig klimax.** Processen (förankring → krav → kommunförhandling → bygge) är inramning; dramat är *vägvalet*. Åretrunt-spel och tv-pengar mot publiken och själen.

- Den tyngsta värdebeslutsytan i spelet. Ska kännas tyngre än varje annan uppgradering — för att den kan vara ett svek.
- Konsekvensraden här visar kostnaden **åt båda håll** (publik/moral *ned*, ekonomi/åretrunt *upp*) — datamodellen bär den dubbelriktningen, ytan ska visa den ärligt. Ingen yta som säljer in hallen som rent plus.
- Spelaren ska få *leva* argumentationen (Västra Sidans röst mot kassans), inte klicka en uppgradering.

---

## Konsekvensraden (försoningens förbättring #5)
Det här är inte en egen yta — det är en **konvention på B1:s beslutskort.** Varje bygg-/vägval visar vad det påverkar: publik · ekonomi · ungdom · själ, severity-viktat enligt den ratificerade severity-skalan. Det är där #5 landar, och det är samma nerv som D1 (viktgradering) och D2 (konsekvens vid ignorering). En svag konsekvensrad gör besluten till kvitton; en ärlig gör dem till val.

---

## Gör INTE
- Matchhallen som mål, dröm eller trädets topp. Den är en gaffel med ett pris.
- Radera hallfrågan — den är ett verkligt dilemma, inte en bugg. Designa *spänningen*, inte bort den.
- Vädret/kylan som problem att lösa. Texturen i utomhusspelet.
- Konstis som aspiration. Den finns.
- Nya kort-/typmönster. Bygg i den ratificerade kanon.

---

## Sekvensering
Trädets **domänmodell** (Code-relay i B1-dokumentet) är ren data och går parallellt — ingen design-grind. **Mockarna** kör du när försoningssprinten satt systemet, så B1:s ytor byggs en gång på ren grund. Strävan och ytorna är låsta här; det enda som kan vända dem är Erik-playtesten (kan visa att strävan behöver kännas annorlunda än vi tror).
