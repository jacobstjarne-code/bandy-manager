# Brief — diagnos-körning matchmotor (mät, ändra inget)

**Datum:** 2026-05-22
**Av:** Opus, efter `season_analysis.md` (5 säsonger) + Jacobs påpekande att
spelet bara har utvisningar, inte röda kort i fotbollsmening.
**Till:** Code.
**Hård regel:** Denna körning ÄNDRAR INGEN motorkod. Den mäter rätt saker mot
rätt måttstockar och rapporterar. Vi vet inte än om C-M1/M2/M3 är verkliga fel
eller rapportartefakter — mät innan någon rör en parameter.

---

## 0 · Varför

`season_analysis.md` flaggade tre saker (röda kort ❌, mål ⚠️, hörnmål ⚠️). Två
av flaggorna är misstänkta som ARTEFAKTER, inte motorfel:

- Skriptets idealskala ser fotbollsärvd ut (röda kort 0,1–0,5/match; mål-mål 5,5).
- Motorn använder internt `MatchEventType.RedCard` OCH `activeSuspensions` om
  vartannat (matchEngine viktar `RedCard` −1,2 i betyg, och för in
  `initialHomeSuspensions` mellan halvlekarna). Det antyder att "RedCard" i koden
  kan betyda en vanlig tidsutvisning, inte matchstraff.

Om "RedCard" = tidsutvisning (5/10 min) är 3,5/match rimligt för bandy. Om det =
utesluten ur matchen är det absurt. **Den frågan måste besvaras först.**

---

## 1 · Fråga A — vad ÄR ett `RedCard`-event egentligen? (kodläsning, ingen körning)

Läs i `matchCore.ts` (och matchUtils om relevant) var `MatchEventType.RedCard`
skapas och hur `activeSuspensions` fungerar:

- Sätter ett `RedCard`-event spelaren ur matchen resten av matchen, eller bara
  en tidsbestämd period (5/10 min) varefter laget blir fulltaligt igen?
- Hur länge räknas `activeSuspensions` som aktiv? Finns en timer/återgång?
- Finns flera utvisningsgrader (5-min / 10-min / matchstraff), eller är allt
  samma `RedCard`-event?

**Rapportera vad termen faktiskt representerar i spelvärlden.** Det avgör om C-M1
är ett motorfel eller ett namn-/måttstocksproblem. Döp INTE om något än — bara
fastställ vad som gäller.

## 2 · Fråga B — bryt ned utvisningarna (ny körning, samma 5 seeds)

Kör om analysen men rapportera utvisningar UPPDELAT, inte som ett tal:

- Antal per match fördelat på grad (5-min / 10-min / matchstraff) om graderna
  finns. Om allt är samma typ — säg det.
- Snitt aktiva utvisningar samtidigt på isen (det är det som påverkar spelet —
  numerärt underläge), inte bara totalantal events.
- Jämför mot rätt måttstock: vad är faktisk utvisningsfrekvens i Elitserien?
  Skriptets 0,1–0,5 är misstänkt fotbollsärvd. Om vi inte har en bandysiffra,
  flagga att måttstocken saknas — gissa inte.

## 3 · Fråga C — mål mot kalibreringsreferensen, inte mot 5,5 (ny körning)

- Läs `calibration_targets` (eller var 1124-Elitserie-kalibreringen bor) och
  rapportera mål/match mot DEN siffran (10,0), inte mot skriptets 5,5.
- Om referensen säger 10,0 är 9,35 nära rätt och C-M2 är ett RAPPORT-fel:
  skriptets ideala mål-intervall ska skrivas om mot bandy, inte motorn justeras.
- Rör ingen mål-parameter. Detta är ett mät- och beslutssteg.

## 4 · Fråga D — hörnmål via flaggan (ny körning)

- Räkna hörnmål strikt via `isCornerGoal`-flaggan (den infördes just för att
  ersätta tidsnärhetsheuristiken). Rapportera %.
- Om det fortfarande är ~21% mot bandy-ideal: är 8–18% rätt måttstock för bandy,
  där hörnan är ett centralt offensivt vapen? Flagga om måttstocken är osäker.

## 5 · Leverans

En kort rapport som svarar A–D. Inga motorändringar, inga parameterjusteringar,
inga omdöpningar. Resultatet avgör vilka av C-M1/M2/M3 som är verkliga fel (→ blir
spec) och vilka som är rapportartefakter (→ fixa skriptets måttstockar istället).

Det troliga utfallet, att vara beredd på: C-M1 visar sig vara tidsutvisningar mot
fotbollsmåttstock (artefakt + namnförvirring), C-M2 visar sig vara nära 10,0
(rapportmål fel), C-M3 kräver en bandy-måttstock. Men det är en hypotes — mät.

— Opus, 2026-05-22
