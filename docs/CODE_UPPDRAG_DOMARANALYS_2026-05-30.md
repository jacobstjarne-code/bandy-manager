# CODE-uppdrag: Domaranalys från Bandygrytan

**Skapad:** 2026-05-30
**Beställare:** Jacob (Opus)
**Sekretess:** INTERN. Domarnamn får inte publiceras i Bandy Brain, GitHub-issues, eller någon publik kanal. Output ligger lokalt i `docs/data/` med `INTERNAL`-prefix.
**Tidsbudget:** ~4–6 timmar Code-tid. Stoppa och rapportera om steg 1 misslyckas.
**Deadline:** Söndag kväll om möjligt. Måndag morgon senast.

---

## Syfte

Bandygrytan har enligt Jacob domarnamn per match i Firebase preCache. Vi vill:

1. Verifiera att datan finns och i vilket format.
2. Extrahera den för Elitserien herr + dam, alla tillgängliga säsonger.
3. Korsläsa mot existerande matchdata för att hitta mönster per enskild domare.
4. Producera en intern rapport som Jacob kan använda som underlag — inte som leverans — inför möte med SBF-ordförande på måndag.

**Output är INTE en publik analys. Det är ett internt underlag. Tonen i rapporten ska vara deskriptiv, inte värderande — "domare X har snittfrekvens Y" inte "domare X är hård".**

---

## Steg 1 — Verifiera datatillgänglighet (fail-fast, 30 min)

Innan något annat: bekräfta att domarnamn finns i Bandygrytan-datan.

```
GET https://eu-bandygrytan-dev.firebaseio.com/preCache/getFixtureData/{fixtureId}.json?auth={token}
```

Leta efter fält som rimligen heter `referees`, `referee`, `officials`, `ref`, `huvuddomare`, `assistans`, `domare`, eller motsvarande. Plocka en handfull fixture-IDs från olika säsonger (en från 2019-20, en från 2022-23, en från 2025-26).

Dokumentera:
- Vilket fält det heter.
- Vilken struktur det har (string, array, object med roller).
- Om assistans-domare är separerade från huvuddomare.
- Om damernas matcher har samma format.

**Om datan INTE finns där:** Stoppa. Skriv en kort rapport (`docs/data/DOMARDATA_VERIFIERING.md`) om vad du letade efter och vad du hittade. Returnera till Jacob för beslut.

**Om datan finns:** Gå vidare till steg 2.

---

## Steg 2 — Scrape (utöka existing scraper)

Utöka `scripts/scrape-detailed.mjs` (och om dam-scrapern är separat: motsvarande) med domarextraktion. Skriv inte en ny scraper — bygg på den som finns.

För varje match, lägg till:
- `referees.main` — huvuddomare (string)
- `referees.assistants` — array av strängar (eller null om bara en domare loggad)
- `referees.raw` — den råa strukturen från Firebase, för felsökning

Behåll allt existerande beteende. Output samma fil (`bandygrytan_detailed.json`) men med utökat schema. Uppdatera `_meta.schemaVersion` till 3 och anteckna ändringen.

Om dam-matcher inte finns i `bandygrytan_detailed.json` — verifiera. Det är möjligt att damernas matcher ligger i en separat fil eller separat path. Hitta dem.

---

## Steg 3 — Aggregera per domare

Skapa `scripts/analyze-referees.py` (eller `.ts` om det passar bättre) som producerar två filer:

### Output A: `docs/data/INTERNAL_referee_per_match.json`

En rad per match:
```json
{
  "matchId": "...",
  "season": "2024-25",
  "phase": "regular",
  "series": "herr",
  "main_referee": "...",
  "assistants": ["...", "..."],
  "homeGoals": 4,
  "awayGoals": 3,
  "homeWin": true,
  "draw": false,
  "halfTimeHome": 2,
  "halfTimeAway": 1,
  "fouls_count": 5,
  "penalties_count": 1,
  "total_goals": 7,
  "corners_total": 22
}
```

### Output B: `docs/data/INTERNAL_referee_aggregates.json`

En post per domare (huvuddomare), endast de med n ≥ 30 matcher totalt över datasetet. Inkludera även damerna och slutspel som separata under-aggregat.

Per domare beräkna:

**Volym:**
- `match_count_total`
- `match_count_per_phase` (regular / qf / sf / final)
- `match_count_per_series` (herr / dam)
- `seasons_active` (lista)

**Spelmönster (snitt + 95 % konfidensintervall där det är meningsfullt):**
- `avg_goals_per_match`
- `avg_fouls_per_match` (utvisningar)
- `avg_penalties_per_match` (straffmål som proxy för tilldelade straffar)
- `avg_corners_per_match`

**Utfall:**
- `home_win_pct`
- `draw_pct`
- `away_win_pct`
- `ht_lead_win_pct` (när HT-ledning ej oavgjort)
- `first_goal_win_pct` (vinst för laget som scorade först)

**Tidsfördelning av utvisningar (per period 0–29, 30–59, 60–89, 90+):**
- Andel av domarens utvisningar i varje period
- Z-score mot ligamedel

**Skevhet vs ligamedel** (z-score eller binomial p-värde):
- `home_win_skew` — domarens hemmavinst% vs 50.2 % (herr) / 47.6 % (dam)
- `fouls_skew` — vs ligamedel per match
- `penalties_skew` — vs ligamedel
- `goals_skew` — vs ligamedel

Använd korrekt statistisk metod för varje:
- Binomialtest för andelar.
- Welchs t-test eller bootstrap för snitt.
- Bonferroni-korrigering över alla domare för varje mått (eller flagga utan korrigering men dokumentera multipel-test-problem).

---

## Steg 4 — Anomali-rapport

Skapa `docs/data/INTERNAL_REFEREE_PATTERNS.md`. Strikt intern. Tonen är deskriptiv, inte värderande.

Strukturen:

### 1. Sammanfattning av datasetet
- Antal unika huvuddomare
- Antal matcher per domare (median, fördelning)
- Säsongsfördelning
- Eventuell skevhet i fas-allokering (vilka dömer flest playoff?)

### 2. Domare över anmärkningsvärda tröskelvärden

För varje mått (hemmavinst%, fouls/match, straff/match, ht-lead-win%), lista de domare där värdet ligger >2 standardavvikelser från ligamedel **och** sample size är tillräcklig (n ≥ 30 för det specifika måttet).

Format per upptäckt:
```
Domare: [namn]
Mått: hemmavinst%
Värde: 58.4% (n=87)
Ligamedel: 50.2%
Z-score: 2.34
Binomial p: 0.019 (icke-korrigerat)
Bonferroni-korrigerat p: 0.42 (28 jämförelser)
Kommentar: [neutralt deskriptiv, t.ex. "Sample n=87 över sex säsonger.
Effekten avtar (ej signifikant) efter multipel-test-korrigering."]
```

### 3. Fas-specifika mönster
- Vilka domare allokeras oproportionerligt till slutspel?
- Har de andra mått än grundserie-domare?

### 4. Säsongsstabilitet
- För toppdomare (>50 matcher): är deras mått stabila över säsonger eller har de förändrats?
- Är det skifte i någon riktning sedan "våga visa rött"-direktivet (säsong 25/26)?

### 5. Dam vs herr
- Vilka domare dömer båda?
- Skiljer sig deras mått åt mellan serierna?
- Är det olika domarpooler — och i så fall: skiljer sig poolernas snittmått?

### 6. Begränsningar
Lista uttömmande:
- `fouls[].team` är null — vi vet inte vilket lag som fick utvisningen
- Sample size per domare per fas är ofta liten
- Förlängning hanteras hur?
- Assistans-domare ingår inte i huvudanalysen
- Säsong 2023-24 saknas helt
- Multipel-test-problematik
- Korrelation ≠ kausalitet — alla mönster kan vara spelar-, klubb- eller schemamixdrivna

### 7. Frågor som datan inte kan svara på utan kompletterande data från SBF
Lista — det här är pitch-materialet till Jacob.

---

## Steg 5 — Säkerhet och git

Filerna `INTERNAL_*.json` och `INTERNAL_REFEREE_PATTERNS.md` ska INTE committas till publika repon. Två alternativ:

(a) Lägg dem i `.gitignore` (rekommenderas).
(b) Lägg dem i en privat directory utanför `bandy-manager/` om Jacob föredrar det.

Bekräfta med Jacob innan första commit. Som default: gitignore.

Bandy Brain (publika sajten) ska INTE få några domarnamn i sig. Befintliga findings refererar inga domare och det ska förbli så.

---

## Edge cases och beslut Code måste ta

1. **Förlängningsmatcher**: Räkna utvisningar och mål i förlängning eller bara ordinarie tid? Default: separera i två fält (`...ordinary_time`, `...incl_overtime`).

2. **Domare med få matcher**: Tröskel n≥30 för aggregat. Tröskel n≥30 för specifika mått om någon dimension har särskilt få datapunkter (t.ex. straff där baseline är låg).

3. **Olika stavning eller namnvarianter**: Normalisera. Loggning av varje normaliseringsbeslut.

4. **Assistans-domare**: Aggregera separat. Inkludera inte i huvudrapporten utan i bilaga.

5. **Säsong 23-24 saknas**: Notera per domare hur många säsonger de aktivt dömt — och om de var aktiva 22-23 och 24-25 men inte 23-24, så är det inte att de pausade utan att datan saknas.

6. **Damernas hemmavinst-baseline är 47.6 %** — använd separat baseline för dam, inte herr-baseline.

---

## Acceptanskriterier

- [ ] Steg 1 utförd, fält och format dokumenterat
- [ ] Scrape körd, alla tillgängliga säsonger inkluderade, schema uppdaterat
- [ ] `INTERNAL_referee_per_match.json` finns och har rätt antal rader
- [ ] `INTERNAL_referee_aggregates.json` finns och har korrekt struktur
- [ ] `INTERNAL_REFEREE_PATTERNS.md` finns och följer formatet
- [ ] `.gitignore` uppdaterad
- [ ] Begränsningar uttömmande listade — Code ska vara strängare än vad som känns naturligt
- [ ] Inga slutsatser om enskilda domares "kvalitet" eller "bias" formulerade — bara deskriptiva mönster
- [ ] Rapport till Jacob med en länk till alla tre filerna och en 5-raders sammanfattning av vad som faktiskt hittades

---

## Vad Code INTE ska göra

- Inte publicera något i Bandy Brain
- Inte commit:a domarnamn till publik repo
- Inte skriva värderande slutsatser ("domare X är dålig", "verkar opartisk")
- Inte göra spekulativa korrelationer ("domare X gillar Edsbyn")
- Inte korsläsa mot Bandypuls eller andra externa källor utan att fråga Jacob först
- Inte använda mer än ~6h utan att stämma av med Jacob — om steg 3 går överstyr, stoppa och rapportera

---

## Om datan visar sig vara tunn

Det är fullt möjligt att Bandygrytan loggar domarnamn för bara en del av matcherna, eller bara från en viss säsong. Om så är fallet — rapportera det rakt. En tunn dataset är fortfarande ett genuint fynd som Jacob kan ta med sig till mötet: *"Bandygrytan har domarnamn för ungefär X % av matcherna, mest från säsongerna Y och Z."* Det är värdefull information även utan färdig analys.
