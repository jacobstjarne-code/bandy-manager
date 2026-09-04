# SPEC — B12-KONSUMENTEN: "MATCHENS SAMBAND" I GRANSKA

**Datum:** 2026-09-04 · **Av:** Opus · **Grund:** kodläst `matchCore.ts` (B12-fälten, `buildSequenceWeights`, `currentContributingFactors`), `tacticModifiers.ts`, `Fixture.ts` (MatchEvent/MatchReport), `GranskaAnalys.tsx`; GPT:s taktiktest 2026-09-03; MASTER `sluttest-b12-konsument-b5` (högsta prio).
**Stänger:** taktiktestets HIGH 1 ("matchrapporten gör inte spelaren bättre") och MEDIUM 4 (återkoppling på dimensionerna) — så långt motorn faktiskt bär det.

## 1. Problemet

GPT, 35 matcher: "Rapporten är bra på att berätta vad som hände, men svag på att förklara varför matchbilden blev sådan." Bara hörnor och trötthet förklaras; formation, bredd, fokus, passningar, positionspassning saknar orsak–verkan. Därför "upplevs hörnorna både som starkare och mer begripliga än resten av taktiken."

Kodläst orsak: `GranskaAnalys.tsx` NYCKELINSIKTER räknar konvertering, hörnantal, matchens spelare och marginal — utfall, inte orsak. B12:s fyra fält skrivs på varje händelse i matchCore och läses av **ingen** (konsumentkartans klass: skriv-utan-läs, en nivå under liggaren).

## 2. Vad motorn faktiskt vet — och inte

**Per händelse (MatchEvent, B12 steg 2, redan byggt):**
- `manpowerState { ownSuspended, opponentSuspended }` — numerärt läge när det hände.
- `tacticalFactors` — det egna lagets AVVIKANDE taktikval vid händelsen: `tempo_high` / `tempo_low`, `press_high`, `width_wide`, `cornerStrategy_aggressive`, `passingRisk_direct`, `mentality_offensive`. Defensiva val (låg press, smalt, säkra passningar, defensiv mentalitet) ger INGEN etikett — tom lista = grundläge. Byts taktik i paus bär 2H-händelserna de nya etiketterna.
- `contributingFactors` — motorförhållanden som faktiskt multiplicerades in i chansen: `hot_hand`, `derby`, `weather`, `second_half_mode` (2H-läge + post-paus-urgency ihop), `equalizer_momentum`.
- `origin` — `OPEN_PLAY` / `CORNER` / `PENALTY`.

**Per match (MatchReport):** skott, på mål, räddningar, hörnor, straffar, bollinnehav, betyg, matchens spelare, `managerChoiceLog` (paussnack, pausändring, trötta startande, kapten).

**Motorns mekanism per taktikval (tacticModifiers.ts + buildSequenceWeights) — det är DETTA som gör sambanden sanna:**

| Val | Ger (nytta) | Kostar |
|---|---|---|
| `tempo_high` | +attack-, +hörn-sekvenser; tempo ×1.15 | +foul-sekvenser; fatigueRate +0.20 |
| `press_high` | +omställnings-sekvenser; press ×1.15 (initiativ) | +foul-sekvenser; discipline +0.15; fatigue +0.10 |
| `width_wide` | +hörn-sekvenser; corner ×1.08; offense +0.05 | defense −0.05 |
| `cornerStrategy_aggressive` | +hörn-sekvenser; hörnkonvertering ×1.15; corner ×1.15 | discipline +0.08 |
| `passingRisk_direct` | +attack; offense +0.05 | +bollförlust-sekvenser; −halvchanser; discipline +0.05; **extra bollkontrollstraff i snö/dimma/tö** (`computeWeatherTacticInteraction`) |
| `mentality_offensive` | +attack, +halvchanser; offense +0.10 | defense −0.10 |
| numerärt läge | powerplay ×1.20 attack | egen utvisning ×0.65 attack |

**Vad motorn INTE skriver, och vad specen därför INTE lovar:** effektstorlek per händelse (ingen "den här pressen gav det här målet"); sekvenstyp — omställningsmål stämplas `OPEN_PLAY` (se §4 för en liten rättelse); formationen (liten effekt i `tacticModifiers`, inte etiketterad — utanför v1, väntar formationsdomen); tröttheten som tal (fatigueRate finns men ingen per-spelare-utmatning i fixturen — V2).

## 3. Designen — ett kort, tre rader

**"MATCHENS SAMBAND"** — nytt kort i Granska/Analys, ovanför FORMSPELARE, som ersätter NYCKELINSIKTER (retire-last när det står; matchens-spelare-raden flyttar till Översikt/hero-score, d1).

Max **tre rader**. Varje rad är ett samband med **nytta och kostnad i samma mening** där båda finns, och en enda riktning där bara en finns. Raderna väljs av en poängregel (§5), inte av en fast ordning. Finns inget samband med bevis: en (1) ärlig rad om vad som avgjorde i stället (§4 K), eller inget kort. **Hellre ingen mening än falsk.**

Formen är protokollets: koppar-sektionsrubrik, tre rader Georgia 13, ingen ikon per rad. Samma dimensioner som taktikens sammanfattning (alla åtta, Codex d7303c82) så spelaren möter en modell före och efter matchen.

## 4. Sambandskatalogen — bevis, tröskel, text (TEXT LÅST)

Notation: `{N}` tal, `{Motståndare}` kortnamn. "Vi/våra" = managerad klubb. Alla räkningar per `clubId`, per `origin`, per halvlek (`minute` < 45 / ≥ 45), per `manpowerState`.

**A. Hög press** — kräver `press_high` på våra händelser.
- Bevis nytta: omställningsmål ≥ 1 (se rättelse nedan). Bevis kostnad: våra utvisningar ≥ 2, och/eller insläppta med `ownSuspended > 0` ≥ 1.
- Text båda: *Hög press gav {N} omställningsmål — men kostade {M} utvisningar, och {K} av deras mål kom i ert undertal.*
- Bara nytta: *Hög press gav {N} omställningsmål. Bollvinsterna kom högt upp.*
- Bara kostnad: *Hög press utan utdelning: {M} utvisningar, {K} insläppta i undertal, inga omställningsmål.*

**B. Högt tempo** — `tempo_high`.
- Bevis nytta: våra skott ≥ deras + 5, eller hörnor ≥ 8. Kostnad: utvisningar ≥ 2, eller insläppta efter 70:e ≥ 2 (tröttheten syns i det motorn skriver — sena insläpp — inte i ett tal den inte skriver; texten säger "sent", inte "trötta").
- Båda: *Högt tempo gav {N} skott mot deras {M} — och {K} insläppta efter 70:e. Tempot tog betalt i slutet.*
- Bara nytta: *Högt tempo: {N} skott, {H} hörnor. Ni ägde bollen där det gjorde skillnad.*
- Bara kostnad: *Högt tempo utan skott att visa: {K} insläppta efter 70:e.*

**C. Aggressiva hörnor** — `cornerStrategy_aggressive`.
- Bevis nytta: hörnmål ≥ 1 (`isCornerGoal`). Kostnad: utvisningar ≥ 2 (discipline +0.08) — bara om A/B inte redan tagit utvisningarna (ingen dubbelräkning, §5).
- Båda: *Aggressiva hörnor: {N} av {M} hörnor blev mål. Priset var {K} utvisningar.*
- Bara nytta: *Aggressiva hörnor: {N} av {M} blev mål. Där satt den.*
- Bara kostnad: *{M} hörnor, inget mål. Aggressiviteten gav bara utvisningarna.*

**D. Brett spel** — `width_wide`.
- Bevis nytta: hörnor ≥ 8. Kostnad: insläppta i öppet spel ≥ 3 (defense −0.05).
- Båda: *Brett spel gav {N} hörnor — och öppnade er: {M} insläppta i öppet spel.*
- Bara nytta: *Brett spel drog isär dem: {N} hörnor.*
- Bara kostnad: *Brett spel öppnade er mer än dem: {M} insläppta i öppet spel, {N} hörnor att visa.*

**E. Direkt spel** — `passingRisk_direct`.
- Bevis kostnad (MEKANISK, kräver inget utfall): väder = snö/dimma/tö OCH `weather` i våra `contributingFactors` → motorn straffade bollkontrollen extra. Bevis nytta: våra skott ≥ deras + 5.
- Kostnad i väder: *Direkta passningar i {snön/dimman/tövädret} — motorn tar extra på bollkontrollen då. Ni tappade fler bollar än ni behövde.*
- Nytta: *Direkt spel gav {N} skott mot deras {M}.*
- Väder + nytta: *Direkt spel i {snön} gav {N} skott ändå — men bollkontrollen kostade; det syns inte i skotten, det syns i tempot ni tappade.*

**F. Offensiv mentalitet** — `mentality_offensive`.
- Bevis: våra mål ≥ 3 och insläppta ≥ 3 (köpte målen med försvaret); eller mål ≥ 3, insläppta ≤ 1 (bara nytta); eller mål ≤ 1, insläppta ≥ 3 (bara kostnad).
- Båda: *Offensiv mentalitet: {G} mål, {C} insläppta. Ni köpte målen med försvaret.*
- Bara nytta: *Offensiv mentalitet betalade sig: {G} mål, {C} insläppta.*
- Bara kostnad: *Offensiv mentalitet utan mål: {G} gjorda, {C} insläppta. Öppet åt fel håll.*

**G. Numerärt** — oberoende av taktikval.
- Bevis: mål med `opponentSuspended > 0` ≥ 1, eller insläppta med `ownSuspended > 0` ≥ 1.
- *{N} av era mål kom i numerärt överläge; {M} insläppta i undertal.* (utelämna den halva som är 0)

**H. Pausändringen** — `managerChoiceLog` har `halftime_tactic` eller `pep_talk`, OCH 1H- och 2H-`tacticalFactors` skiljer sig (eller pep_talk finns).
- Bevis: 1H-facit vs 2H-facit.
- *Ni {ändrade} i paus: {1H mål}–{1H insläppta} före, {2H mål}–{2H insläppta} efter.* — `{ändrade}` ur `detail`: lowered_tempo → "tog ner tempot"; increased_pressure → "höjde pressen"; pep_talk push → "gick på i paus"; calm → "lugnade ner det"; hold → "höll kursen". Ingen värdering — facit talar.

**I. Motorförhållanden** (ur `contributingFactors`, en rad högst):
- `second_half_mode` med jakt (vi låg under vid 45:e): *Ni jagade från paus — motorn öppnar upp då: {N} mål, {M} insläppta i jakten.*
- `derby`: *Derbyt jämnade ut det — i derbyn drar motorn lagen mot varandra. Skillnaden i klass räknades mindre.*
- `hot_hand` med ≥ 2 mål inom 6 min: *Målen kom i skur: {N} inom {K} minuter.*
- `equalizer_momentum` med ledningsmål ≤ 6 min efter kvittering: *Kvitteringen bar: ledningsmålet kom {K} minuter senare.*

**J. Positionspassning** — INTE ur B12 utan ur `lineup` + `report.playerRatings`: antal startande utanför naturlig position (samma bedömning som Truppens grönt/gult/rött) och deras snittbetyg mot de på rätt plats.
- Bevis: utanför ≥ 2 OCH betygsgap ≥ 0,6.
- *{N} spelare utanför naturlig position — snittbetyg {x} mot {y} för de på rätt plats. Det syntes.*
- Halvens dubbelroll (kanon §2): en halv spelad som mittfältare räknas INTE som utanför position.

**K. Ingen taktiskt avvikelse med bevis** — fallback, en rad:
- Om `contributingFactors` har något: rad ur I. Annars: *Taktiken stack inte ut åt något håll. Det här avgjordes på individer och tur — {Matchens spelare} var skillnaden.* (bara om potm finns; annars inget kort.)

**Liten motorrättelse (Code, samma pass):** `origin` utökas med `'TRANSITION'` och sätts i transition-grenen i matchCore (rad där "Omställningsmål av" skrivs). Det är inte att uppfinna ett värde motorn inte har — sekvensen ÄR separat i motorn, bara inte stämplad. Utan den kan A inte bevisa nyttan. Tills den finns: matcha på `description.startsWith('Omställningsmål')` som interim.

## 5. Urvalsregeln

1. Bygg alla kandidater A–J som uppfyller sitt bevis.
2. Poäng = bevisstyrka: summan av de tal som ingår, normerad per rad (utvisningar ×2, mål ×2, skott ×0,3, hörnor ×0,5; mekaniskt bevis (E i väder) = 3 fast).
3. Ingen händelse räknas två gånger: har A tagit utvisningarna tar C dem inte (C visas då bara med nytta eller inte alls).
4. Välj topp 3. Om resultatet var förlust och ingen vald rad bär en kostnad: byt den svagaste mot den starkaste kostnadsraden — spelaren ska aldrig få tre nyttor efter en förlust. Omvänt vid seger.
5. H (pausändringen) prioriteras alltid in om den finns — det är spelarens eget beslut, och det är den återkoppling GPT kallade "utmärkt" när den fanns.
6. Under 1 kandidat: K. Under 1 kandidat och inget potm: inget kort.

## 6. Placering och samspel

- Granska/**Analys**, ovanför FORMSPELARE. NYCKELINSIKTER retireras när kortet står (retire-last; potm-raden flyttar till hero-score-ögonblicket, d1).
- Rör inte **DET DU VALDE** (k4, orsak/verkan ur liggaren) — det är säsongsbeslutens konsekvenser, inte matchens taktik. Två kort, två frågor.
- SM-final och slutspel: samma kort (Granska finns nu där, Codex d7303c82).
- Taktikskärmens sammanfattning visar alla åtta axlar; kortet talar om samma axlar med samma ord — `tempo`, `press`, `bredd`, `hörnor`, `passningar`, `mentalitet`. Formation och anfallsfokus nämns inte i v1 (ingen etikett i motorn; formationsdomen väntar).

## 7. Arbetsform

- Code: en pass. Ren konsument — läser fixture.events/report/lineup, ingen motorändring utom `origin: 'TRANSITION'` (en rad). Positionspassningen (J) återanvänder Truppens bedömning, ingen ny logik.
- Tester: en fixtur per katalograd (A–J) med händelser byggda av matchCore i fast mode (inte handskrivna events — LESSONS #50), assertera vald rad och text; urvalsregelns förlust-/segerbalans; K-fallet; "ingen dubbelräkning".
- Opus: text låst ovan. Inga fler strängar.
- Efter bygge: GPT kör taktiktestets fråga 1 igen ("kan jag förstå varför en taktisk förändring lyckas eller misslyckas?") på tre matcher. Det är godkänt-när.

## Ägarskap

**Code:** byggbar nu. **Opus:** text låst; dömer GPT:s omtest. **Jacob:** ingen kall — men läs §2:s tabell en gång; det är första gången motorns taktikmekanik står på ett papper någon kan visa en spelare.
