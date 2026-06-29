# CODE-uppdrag: Domaranalys, djupare körningar

**Skapad:** 2026-05-30, kl ca 18
**Beställare:** Jacob (Opus)
**Sekretess:** INTERN. Alla nya filer markeras `INTERNAL_*` och ligger i `.gitignore`. Namnsättning får använda riktiga domarnamn — det är hela poängen.
**Tidsbudget:** ~12–15 timmar Code-tid totalt. Stoppa och rapportera efter varje prioritet (P0/P1/P2). Skicka inte hela paketet i ett enda svar.
**Bygger på:** `CODE_UPPDRAG_DOMARANALYS_2026-05-30.md` (steg 1–5 färdiga) och de tre INTERNAL-filerna från första körningen.

---

## Övergripande ändringar att göra först

**Skriv om `INTERNAL_REFEREE_PATTERNS.md` med riktiga namn.** Anonymiseringen var en missuppfattning av specen — INTERNAL-filerna är gitignored, namnen ska användas. Behåll allt annat innehåll, byt ut "Domare A/B/C" mot faktiska namn. 15 min.

All ny output i den här rundan ska också använda riktiga namn.

**Effektstorlek bredvid p-värde.** Genomgående ska Cohens d, rå skillnad mot ligamedel och 95 %-CI redovisas tillsammans med p-värden. Signifikans utan effektstorlek är intetsägande.

---

## Output-struktur

En konsoliderad huvudrapport: `docs/data/INTERNAL_REFEREE_DEEP_DIVE.md`. Sektionerna nedan blir kapitel i den. Plus en bilaga `docs/data/INTERNAL_REFEREE_PROFILES.md` med en sida per domare (analys 1).

Stödfiler i `docs/data/`:
- `INTERNAL_referee_season_trends.json` (analys 4)
- `INTERNAL_referee_penalty_attribution.json` (analys 5)
- `INTERNAL_referee_pair_analysis.json` (analys 6)
- `INTERNAL_referee_dam_herr.json` (analys 7)
- `INTERNAL_referee_clubmix.json` (analys 8)

Alla i `.gitignore`.

---

## P0 — Måste levereras innan midnatt söndag

### Analys 1: Profil per domare (n≥30)

Bygg ut en bilaga `INTERNAL_REFEREE_PROFILES.md` med en sektion per domare. Innehåll per profil:

```
## [Namn]
Total: n=X matcher (Y säsonger aktiv)
Säsonger: 2019-20, 2020-21, ...

### Fas-allokering
Grundserie: A, KVF: B, SF: C, Final: D

### Serie-fördelning
Herr: X, Dam: Y (av total)

### Karriärbåge (matcher per säsong)
2019-20: A, 2020-21: B, ...

### Spelmönster (snitt ± 95% CI)
Mål/match: X (liga: Y, Δ: Z, Cohens d: W)
Utvisningar/match: ...
Straffmål/match: ...
Hörnor/match: ...

### Utfall
Hemmavinst%: X% (liga: 50.2%, p=Y, Cohens h: Z)
HT-lead-win%: ...
First-goal-win%: ...

### Tidsfördelning utvisningar
0–29: X%, 30–59: Y%, 60–89: Z%, 90+: W%
Z-score mot ligamedel per period.

### Trend över säsonger (om n per säsong ≥10)
Utvisningar/match: 19/20: X, 20/21: Y, ... — slope ± SE
```

Sortera profilerna efter total match-count, fallande.

### Analys 4: "Våga visa rött"-effekten — säsongstrender

Jämför säsong 25/26 mot tidigare på följande mått, både totalt och per domare där n per säsong ≥10:

- Total utvisningsfrekvens per match
- Andel utvisningar i 0–29 (om "tidigare" är direktivets idé, ska den andelen ha ökat)
- Spridning mellan domare (variation i utvisningsfrekvens — har den ökat?)
- Antal röda kort om Bandygrytan loggar det. Leta efter `red_cards`, `expulsions`, `redCards`, eller motsvarande fält i `getFixtureData`. Om det inte finns: rapportera negativt.

Per domare: har deras eget mått förändrats säsong 25/26 vs deras 22/23 + 24/25-snitt? Statistisk test (Welch eller bootstrap).

Output: `INTERNAL_referee_season_trends.json` med per-säsong och per-domare-mått, plus sektion i huvudrapporten med plottar (ASCII eller mermaid om Code kan, annars beskrivande prosa) och 1–2 sidors slutsats.

### Analys 5: Straff-asymmetri per domare

Straffmål har målgörare → målgörarens lag är känt. Använd det för att approximera straff-attribution per lag.

Per domare:
- Straffmål till hemmalag / match
- Straffmål till bortalag / match
- Ratio (hemma/borta)
- Jämför mot ligamedel
- Bonferroni-korrigerat p

Subgruppsanalys där datan tillåter:
- Endast i nära matcher (resultat ±1 vid straffmål-tidpunkt) — om Code kan rekonstruera ställningen
- Endast i 60+-minuten av matchen
- Bara grundserie vs bara playoff

**Begränsning som måste flaggas tydligt:** Straffmål är inte samma sak som tilldelad straff. Konverteringsfrekvensen är ca 60–70 % vilket innebär att ~30 % av straffarna inte är synliga. Om det finns systematiska skillnader i konvertering mellan hemma/borta blir hela analysen biased. Code ska dokumentera detta.

Output: `INTERNAL_referee_penalty_attribution.json` + sektion i huvudrapporten med per-domare-tabell, sorterad efter ratio-avvikelse.

### Analys 7: Dam-anomalin per domare

Damernas hemmaplansfördel är icke-existerande (47.6/48.1) jämfört med herrarnas (50.2/38.3). Vi vill testa om domarkollektivet kan vara en delförklaring.

Konkreta körningar:

- Vilka domare dömer dam-matcher? Hur många matcher per dam-domare? (Förmodligen mindre n per individ.)
- Hemmavinst% per dam-domare vs förväntat 47.6 %.
- Är dam-domarpoolen separat från herr-domarpoolen, eller är det överlapp?
- För domare som dömt båda serierna: skiljer sig deras egna mått åt mellan herr och dam? Utvisningsfrekvens, straff, hemmavinst%, ht-lead-win%?
- Är dam-domarna i snitt yngre/mindre erfarna baserat på match-count?
- Är ht-lead-win% (45.9 % i dam) jämnt fördelad mellan dam-domare, eller dragen av några få?

Output: `INTERNAL_referee_dam_herr.json` + sektion i huvudrapporten. Detta är den enskilt politiskt mest värdefulla analysen — gör den noga.

---

## P1 — Levereras om P0 är klart före midnatt

### Analys 2: Djupgrävning av de fyra avvikande domarna

För de fyra domare Code hittade med signifikant avvikande utvisningsfrekvens:

- Är avvikelsen stabil över säsonger eller koncentrerad till en period? (Per-säsong-mått med CI.)
- Är den fas-specifik? (Per fas: grundserie / KVF / SF / Final.)
- Är den serie-specifik? (Herr vs dam för var och en.)
- Klubb-mix-justering: vilka klubbar dömer de oftast? Vad är de klubbarnas baseline-utvisningsfrekvens (med andra domare)? Om domaren oftast får hårda klubbar, hur stor del av avvikelsen försvinner när man justerar för klubbmix?
- Effektstorlek: rå skillnad i utvisningar/match, Cohens d.

Output: sektion i huvudrapporten, en delsektion per domare, ~1 sida per individ.

### Analys 3: Domarallokering — finns implicit ranking?

- Fördelning playoff vs grundserie per domare (av de 18).
- Korrelation mellan playoff-andel och deras mått (utvisningsfrekvens, hemmavinst%, ht-lead-win%, varians på alla mått).
- "Årets domare"-vinnare över åren: var ligger de statistiskt? Niclas Schultz vann 24/25 — var lägger han sig på alla mått? Är topp-domarna statistiska medianer (vilket implicerar att förbundet rankar på något annat än de mått vi har) eller outliers (vilket implicerar att de mått vi har faktiskt korrelerar med förbundets bedömning)?

Output: sektion i huvudrapporten + `INTERNAL_referee_allocation.json`.

### Analys 8: Klubbmix-effekten generaliserad

För varje av de 18 domarna:
- Top 5 klubbar de oftast dömer
- Top 5 matchups (klubb-par) de oftast dömer
- Klubbarnas baseline utvisningsfrekvens med andra domare som referens
- Schema-mix-justerat värde: vad skulle domarens utvisningsfrekvens vara om de hade dömt ett ligamedel-mix av klubbar?

Output: `INTERNAL_referee_clubmix.json` + sektion i huvudrapporten.

Detta är delvis överlappande med analys 2 men för alla 18, inte bara outliers. Om tiden är knapp — kör bara för de 18 övergripande, hoppa över matchup-paren.

---

## P2 — Bonus om tid finns

### Analys 6: Domarpar och assistanseffekter

Mer exploratoriskt. Förmodligen tunt på data.

- Vilka huvuddomare/assistans-par jobbar oftast ihop?
- Per huvuddomare: skiljer sig deras mått åt beroende på vilken assistans de har? (Tröskel: assistans-par måste ha ≥10 gemensamma matcher för att räknas.)
- Finns det "domarteam" där alla tre tillsammans har avvikande mått som inte var och en för sig?

Om data är för tunn för att ge meningsfulla siffror: skriv 3 rader om varför, slut.

Output: `INTERNAL_referee_pair_analysis.json` + kort sektion i huvudrapporten.

---

## Huvudrapportens struktur

`INTERNAL_REFEREE_DEEP_DIVE.md` ska struktureras som:

```
1. Sammanfattning (1 sida)
2. Dataset och metodologi
3. Analys 4 — "Våga visa rött"-effekten över säsonger
4. Analys 5 — Straff-asymmetri per domare
5. Analys 7 — Dam-anomalin per domare
6. Analys 2 — Djupgrävning, de fyra outliers (om P1 nås)
7. Analys 3 — Domarallokering (om P1 nås)
8. Analys 8 — Klubbmix-effekten (om P1 nås)
9. Analys 6 — Domarpar (om P2 nås)
10. Begränsningar (uttömmande)
11. Frågor som datan inte kan svara på utan komplettering från SBF
```

Profil-bilagan är separat fil.

Tonen genomgående: deskriptiv, inte värderande. "Andreas Broberg har snittfrekvens X (95% CI Y–Z)" — inte "Andreas Broberg är hård".

---

## Edge cases och beslut

**Säsong 23/24 saknas** — alla per-säsong-analyser måste hantera detta utan att felaktigt rapportera "inaktiv".

**Förlängningsmatcher** — Code beslutade i förra rundan att separera ordinarie tid vs inkl. förlängning. Behåll det.

**Cup-matcher** — om Bandygrytan har dem och Code har scrappat dem, inkludera dem som egen fas. Om inte: dokumentera frånvaron, inte ett problem.

**n-trösklar:**
- Per-domare-aggregat: n≥30 totalt (som tidigare)
- Per-säsong-aggregat: n≥10 per säsong för trend-analys
- Per-fas-aggregat: n≥10 per fas för fas-specifik analys
- Per-serie (dam/herr) för overlap-domare: n≥10 i varje serie
- Domarpar: n≥10 gemensamma matcher

Om en domare faller under en tröskel för en specifik analys, redovisa det explicit i deras profil snarare än att hoppa över.

**Multipel testning** — Bonferroni över alla domare för varje mått, som tidigare. Antal jämförelser ökar nu rejält (fler mått) — räkna noga. Alternativ: FDR (Benjamini-Hochberg) om Bonferroni blir för konservativt. Code får avgöra och dokumentera valet.

**Klubbmix-justering** — använd genomsnitt-av-skillnader-metoden (för varje klubb, beräkna utvisningsfrekvens med andra domare än den studerade domaren, viktat med hur ofta studerad domare dömer den klubben). Dokumentera metodval.

---

## Acceptanskriterier

- [ ] `INTERNAL_REFEREE_PATTERNS.md` omskriven med riktiga namn
- [ ] `INTERNAL_REFEREE_DEEP_DIVE.md` finns och är komplett för P0
- [ ] `INTERNAL_REFEREE_PROFILES.md` finns med profil per domare ≥30
- [ ] Alla JSON-stödfiler finns och valideras mot sina respektive schema
- [ ] `.gitignore` täcker alla nya filer
- [ ] Effektstorlekar redovisas genomgående jämte p-värden
- [ ] Begränsningar är uttömmande (Code ska vara strängare än vad som känns naturligt)
- [ ] Inga värderande slutsatser om enskilda domare
- [ ] Allt prosaspråk på svenska

---

## Vad Code INTE ska göra

- Inte publicera något i Bandy Brain
- Inte commit:a till publik repo
- Inte göra spekulativa korrelationer ("domare X gillar Edsbyn")
- Inte göra externa lookups (Wikipedia, Bandypuls) utan att fråga Jacob först
- Inte använda mer än ~15h utan att stämma av
- Inte hoppa över edge cases för att "det blir bättre prosa"

---

## Rapporteringsrytm

Stoppa och rapportera till Jacob mellan varje prioritetsnivå:

1. **Efter omskrivning av PATTERNS-filen** — 1 raders bekräftelse, ingen åtgärd från Jacob behövs.
2. **Efter P0 (analys 1, 4, 5, 7)** — sammanfattning på 8–10 rader, ange ev. anomalier eller datafynd. Jacob beslutar om P1 fortsätter direkt eller om något ska prioriteras om.
3. **Efter P1 (analys 2, 3, 8)** — samma format.
4. **Efter P2 om den körs** — kort notis.

Ingen tystnad i mer än 4h utan rapport om Code fortfarande arbetar.
