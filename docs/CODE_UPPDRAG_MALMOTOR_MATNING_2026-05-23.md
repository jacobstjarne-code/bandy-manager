# CODE-UPPDRAG — Mät målmotorn innan vi rör den (2026-05-23)

**Av:** Opus. **Surface:** mätning/analys, INTE kalibrering. **Läs detta först:**
detta uppdrag ändrar INGENTING i motorn. Det MÄTER. Vi har sett 9–8 (cup omg 2)
och 10–5 (liga) i Jacobs playtest. Frågan är: otur (svans) eller fel kalibrering
(snitt)? Det avgör vi med data, inte gissning. Skruva INTE på `GOAL_RATE_MOD`,
`MATCH_TOTAL_GOAL_CAP`, profil-vikter eller något annat förrän mätningen är gjord
och Jacob sett siffrorna.

## Bakgrund — vad koden säger

`matchCore.ts` är kalibrerad mot ~9.12 mål/match (kommentar: `GOAL_RATE_MOD =
9.12 / 9.748 = 0.936`). `MATCH_TOTAL_GOAL_CAP = 17` (99:e percentilen Elitserien).
9–8 = 17 mål = exakt capet. 10–5 = 15 mål. Båda ligger i svansen om snittet är
friskt — MEN två höga matcher på få omgångar väcker frågan om snittet glidit,
särskilt i cup (som saknar egen defensiv profil-justering: `isPlayoff`/`isFinal`
drar ner mål, men en vanlig cup-gruppmatch kör standardvikterna 20/55/20/5).

## Vad du ska bygga — ett mät-script, inte en motorändring

Ett körbart script (test eller standalone i `scripts/` eller en `.test.ts` som
loggar) som kör `simulateMatch` (matchEngine, fast mode) i stor batch och
rapporterar fördelning. Återanvänd setup-mönstret från
`matchEngineParity.test.ts` (finns redan — den vet hur man riggar lineups,
players, fixture för en sim).

### Batch-design

Kör **minst 2000 matcher per kategori**, fyra kategorier separat:
1. **Liga grundserie** (`isPlayoff: false`, `isCup: false`, ingen final)
2. **Cup-gruppmatch** (`isCup: true`, INTE finalhelg) ← misstänkt
3. **Playoff** (`isPlayoff: true`)
4. **SM-final** (`isFinaldag: true`)

Varierade seeds (loopa seed 1..2000), neutrala/genomsnittliga lag (samma trupp
båda sidor så lagstyrka inte snedvrider — vi mäter MOTORN, inte matchningar).
Kör gärna en andra körning med CA-diff (largeCaDiff) för att se om
open_game/chaotic-profilerna driver upp svansen.

### Rapportera per kategori (tvingande output)

För varje kategori, skriv ut:
- **Snitt totalmål/match** (target liga ~9.1; cup okänt — det är det vi mäter)
- **Median** totalmål
- **Percentiler:** p50, p75, p90, p95, p99
- **Andel matcher som träffar capet** (17 mål) — om denna är >2-3% är capet en
  vägg som svansen klustrar mot, inte en sällsynt gräns
- **Andel som gick till förlängning** (`wentToOvertime`) och **straffar**
  (`wentToPenalties`) — för cup/playoff/final. OT lägger på mål; vi vill veta hur
  mycket av cup-svansen som är OT-mål ovanpå ordinarie tid
- **Max-resultat** sett i batchen
- **Fördelning av målskillnad** (hur ofta diff > `MATCH_GOAL_DIFFERENCE_CAP` = 6
  trots capet — sanity-check att diff-capet håller)
- **Bonus om enkelt:** andel mål per väg (attack/transition/corner/freekick/
  penalty) — visar OM en målväg är överviktad

### Format

En läsbar tabell i konsol/testoutput. Exempel:
```
LIGA GRUNDSERIE (n=2000)
  snitt 9.14 · median 9 · p90 13 · p95 14 · p99 17
  cap-träff 1.2% · OT 0% · max 9–8 (17)
CUP-GRUPPMATCH (n=2000)
  snitt XX.X · median XX · ...
```

## Vad mätningen avgör (tolkning — för Opus/Jacob, inte för dig att åtgärda)

- **Liga snitt ~9, cap-träff <2%:** motorn frisk, 9–8/10–5 var otur. Ingen åtgärd.
- **Cap-träff hög (>3%):** capet är en vägg, svansen klustrar vid 17. Åtgärd
  senare: mjuk broms nära capet istället för hård vägg.
- **Cup-snitt klart högre än liga:** cup-profilen saknar dämpning. Åtgärd senare:
  ge cup-gruppmatch en defensiv bias (mildare än playoff).
- **Någon målväg överviktad:** kalibrera den vägen. Senare.

**Återigen: bygg mätningen, kör den, rapportera tabellen. Ändra inget i motorn.**
Opus och Jacob läser siffrorna och beslutar åtgärd separat. Detta är "mät först" —
exakt det vi INTE gjorde när vi såg 9–8 och var frestade att gissa.

## Leverans
Script + en kort `docs/MALMOTOR_MATNING_2026-05-23.md` med tabellen klistrad och
en rad per kategori om vad du faktiskt såg (ingen tolkning krävs av dig — bara
siffrorna och ev. uppenbara avvikelser du la märke till).

— Opus, 2026-05-23
