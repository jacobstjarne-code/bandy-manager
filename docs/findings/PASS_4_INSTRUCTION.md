# PASS_4_INSTRUCTION — Domänseparation och städuppgifter

**Skapad:** 2026-04-26
**Förutsätter:** Pass 1-3 klara. 59 facts validerade. AUDIT_PASS_3 rent.
**Levereras till:** Code (de flesta uppgifter), Opus (där markerat)
**Beräknad tid:** ~2 timmar totalt

---

## SYFTE

Två saker som behöver vara på plats innan UI-sprinten startar:

1. **Domänseparation.** Facts faller i två grundläggande domäner:
   bandyverkligheten (R + S) och spelvärlden (D + W). Den distinktionen
   är otydlig idag och måste bli tydlig — särskilt inför publik sajt.

2. **Tre städuppgifter** identifierade vid Opus granskning av AUDIT_PASS_2/3:
   saknade D-facts, schema-drift, en otydlig not.

---

## DEL 1 — DOMÄNSEPARATION

### Bakgrund

Granskningen identifierade en kategoriförvirring i `facts/`-mapparna.
De fyra kategorierna är inte sidoordnade — de tillhör två olika
sanningsdomäner:

**Bandy-domänen — externa sanningar:**
- `rules/` (R-facts) — vad SBF säger om bandy
- `stats/` (S-facts) — vad Bandygrytan visar att bandy är
- Citat från denna domän = "bandy fungerar så här"

**Spel-domänen — interna sanningar:**
- `design_principles/` (D-facts) — vad vi valt för Bandy Manager
- `world_canon/` (W-facts) — den fiktiva världen i Bandy Manager
- Citat från denna domän = "Bandy Manager fungerar så här"

**Hypoteser** kan tillhöra båda domäner. H001 handlade om hur regelboken
tolkas (bandy-domän med spel-implications).

### Varför det är viktigt

För en bandyperson som läser publik sajt: R-fact "bandyserien har 14 lag"
och D-fact "Bandy Managers fiktiva serie har 12 lag" är fundamentalt
olika typer av påståenden. Det första är information om bandy. Det andra
är information om vårt spel. De ska inte presenteras som likvärdiga källor.

Worse: utan separation riskerar sajten suggerera att Bandy Manager är
auktoritet om bandy. Det är inte. Bandy Manager är en simulator som
*använder* bandyfakta.

### Lösning — minimalt invasiv

**Ingen mappförändring.** R/S/D/W behåller sina platser. Validator,
filsökvägar, README:s — allt orört.

**Tillägg i SCHEMA.md** av en ny sektion `## Domäner` (placeras före
`## FACT-ID-KONVENTION`):

```markdown
## Domäner

Facts faller i två sanningsdomäner. Distinktionen är central för hur
facts citeras och presenteras — särskilt på publika gränssnitt.

**Bandy-domänen — externa sanningar om bandy:**
- R-facts (rules) — fastställda regler från SBF/FIB
- S-facts (stats) — empiriska mönster i verkligt bandy

**Spel-domänen — interna sanningar om Bandy Manager:**
- D-facts (design_principles) — designval för spelet
- W-facts (world_canon) — fiktiv värld i spelet

**Hypoteser** (H-facts) tillhör en av domänerna beroende på vad de
handlar om. Ange `domain:` (`bandy` eller `game`) i hypotes-YAMLen.

### Citatregler

När en finding citerar facts från olika domäner ska det framgå:

- Bandy-domän-citat skrivs naturligt i prosa: "Bandygrytan visar 22%
  hörnmålsandel [S008]" — läsaren förstår att S008 är en bandyfakta.
- Spel-domän-citat ska kontextualiseras: "I Bandy Manager-motorn
  modelleras detta som... [D005]" eller "Bandy Manager:s fiktiva
  serie har 12 lag istället för regelbokens 14 [D006 vs R023]".

Aldrig citera ett D-fact som om det vore en bandyobservation.
```

**Valfritt fält i schemat:** `domain:` i hypothesis-YAMLen.
Default: hypoteser måste ange `domain: bandy` eller `domain: game`.
Existerande H001 uppdateras: `domain: bandy` (eftersom hypotesen
handlade om regelboksparagraf).

### Konsekvens för UI-sprinten

UI_SPRINT_INSTRUCTION:s `/sources/`-struktur måste delas:

```
/bandy/                 ← Bandy-domänen (R + S)
/bandy/rules/R014       ← Detaljvy regelfakta
/bandy/stats/S008       ← Detaljvy statistikfakta

/spelet/                ← Spel-domänen (D + W)
/spelet/design/D005     ← Detaljvy designval
/spelet/varlden/W001    ← Detaljvy fiktiv klubb

/findings/              ← oförändrad
/data/                  ← oförändrad
```

Förstasidan kan ha två mindre footnoter: "Källor om bandy" → /bandy/,
"Om spelet" → /spelet/. De får inte vara likvärdiga toppnav-poster
— findings är huvudet, källor är footnoter, och spel-sanningar är
sub-footnoter.

UI_SPRINT_INSTRUCTION uppdateras separat när detta är på plats. Code
kan göra den uppdateringen som del av pass 4.

---

## DEL 2 — TRE STÄDUPPGIFTER

### 2.1 — Skapa D-facts för medvetna avvikelser från regelboken

Två R-facts noterar i prosa att Bandy Manager avviker, men D-factsen
existerar inte. Det är ett hål — koden bär besluten ensam.

**Skapa D006:**
```yaml
fact_id: D006
category: design_principles
claim: "Bandy Manager simulerar 12-lags fiktiv Elitserie istället för regelbokens 14 lag"
value: 12
unit: teams
source:
  type: design_decision
  decided_by: jacob
  doc: "src/domain/services/worldGenerator.ts (CLUB_TEMPLATES)"
verified_at: 2026-04-26
verified_by: code
status: active
invariants:
  - "value == 12"
related_facts: [R023]
notes: |
  Designval: 12 lag ger en hanterlig serie för spelet utan att förlora
  spelmekaniken. Regelboken (R023) anger 14 lag i verklig Elitserie Herr.
  Avvikelsen är medveten — alla 12 W-facts (W001-W012) är konsistenta
  med detta antal.
```

**Skapa D007:**
```yaml
fact_id: D007
category: design_principles
claim: "Bandy Manager kör KVF best-of-3 istället för regelbokens best-of-5"
value: 3
unit: max matches
source:
  type: design_decision
  decided_by: jacob
  doc: "src/domain/services/playoffEngine.ts eller motsvarande — Code anger exakt sökväg"
verified_at: 2026-04-26
verified_by: code
status: active
invariants:
  - "value == 3"
related_facts: [R025]
notes: |
  Designval: best-of-3 håller slutspelet kortare för spelets tempo.
  Regelboken (R025) anger best-of-5 i verklig Elitserie. Avvikelsen är
  medveten. Om spelet senare utvidgas till längre slutspel, uppdatera
  värdet och lägg en revisions-post.
```

**Granska om fler D-facts saknas:** Code går igenom R-fact-noterna
och letar efter formuleringar som "Bandy Manager implementerar X
istället" eller "spelet förenklar detta som". Varje sådan avvikelse
ska ha ett D-fact.

Sannolika kandidater att granska (inte uttömmande):
- R024 (Allsvenskan-struktur)
- R029 (Matchuppställning) — speltidstecken på 16 spelare?
- R014 (utvisningar) — bekräftar implementation 10-min-utvisning ensam,
  redan diskuterat i H001

Om Code hittar fler än 2 avvikelser ovan, skapa D008+ enligt samma
mönster och uppdatera related_facts cross-references.

### 2.2 — Schema-drift

Två fält har införts ad-hoc utan att SCHEMA.md uppdaterats:

**`closed_at` och `closed_by` i hypoteser** (H001 använder dem för
livscykel-hantering).

**`breakdown:` i stats** (S017 använder strukturerat objektvärde när
en stat har naturlig uppdelning på t.ex. matchfas).

Lägg till en sektion i SCHEMA.md (efter `## Revisioner`):

```markdown
### Tilläggsfält per kategori

Vissa fält är specifika för en kategori och dokumenteras här
istället för i basformatet:

**Hypoteser (H-facts):**
- `domain:` (obligatorisk) — `bandy` eller `game`
- `closed_at:` (vid stängning) — datum när hypotesen avgjordes
- `closed_by:` (vid stängning) — vem som avgjorde
- `status: deprecated` används när hypotes stängs (verifierad,
  motbevisad, eller obsolet)

**Statistik (S-facts) med uppdelning:**
- `breakdown:` (valfri) — strukturerat värde när statiken har
  naturlig fas/grupp-indelning. Exempel: `breakdown.regular: 22.2`,
  `breakdown.quarterfinal: 20.0`. Cross-fact-invarianter kan referera
  enskilda nycklar: `breakdown.regular > breakdown.quarterfinal`.

  När `breakdown:` används kan `value:` sättas till `null` eller
  utelämnas. `unit:` gäller alla värden i `breakdown:`.

**Designval (D-facts) med ekvivalens till regel:**
- `related_facts:` ska inkludera motsvarande R-fact när designvalet
  avviker från regelboken. Notes ska tydligt ange att avvikelsen är
  medveten.
```

### 2.3 — Skriv om R024:s notes

Aktuell formulering:
> "13 × 2 = 26 matcher per lag men 24 omgångar p.g.a. serieformat."

Det är inkonsistent. 13 lag i rak dubbelserie ger 24 omgångar för hela
serien (varje lag står över 2 omgångar i ett ojämnt antal). Antalet
matcher per lag är 24, inte 26.

Skriv om till:
```yaml
notes: |
  13 lag i rak dubbelserie. Varje lag spelar 24 matcher (möter
  varje motståndare två gånger = 12 × 2 = 24). Serien har 24 omgångar
  totalt; varje lag står över 2 omgångar eftersom antalet lag är ojämnt.

  Lag 1 upp till Elitserien, lag 2-3 till positivt kval, lag 12-13 till
  negativt kval mot Division 1.
```

---

## ARBETSORDNING

1. **Code** uppdaterar SCHEMA.md med `## Domäner`-sektion och
   `### Tilläggsfält per kategori`-sektion. (~20 min)

2. **Code** skapar D006 och D007. Granskar R-fact-noterna för fler
   avvikelser och skapar D008+ vid behov. (~30 min)

3. **Code** uppdaterar related_facts cross-references mellan
   nyskapade D-facts och deras motsvarande R-facts. (~10 min)

4. **Code** skriver om R024:s notes-fält. (~5 min)

5. **Code** uppdaterar H001 med `domain: bandy`. (~2 min)

6. **Code** kör validatorn. Förvänta `RENT` med `61+` facts (de nya
   D-factsen ska validera utan invariant-fel). (~5 min)

7. **Code** uppdaterar UI_SPRINT_INSTRUCTION:s strukturdiagram så
   `/bandy/` och `/spelet/` ersätter `/sources/`. Förstasidan får
   inte presentera dem som likvärdiga. Findings förblir huvudvyn.
   (~20 min)

8. **Code** producerar AUDIT_PASS_4_2026-04-26.md med:
   - Antal nya facts (D006-Dxxx)
   - Schema-tillägg (lista av nya fält)
   - Bekräftelse att validatorn är ren
   - Lista över updaterade filer

9. **Opus** läser AUDIT-rapporten och bekräftar innan UI-sprinten
   startar.

---

## STOP-CRITERIA

- [ ] SCHEMA.md har `## Domäner`-sektion
- [ ] SCHEMA.md har `### Tilläggsfält per kategori`-sektion
- [ ] D006 (12-lag) och D007 (best-of-3) skapade och valida
- [ ] Eventuella ytterligare D-facts för avvikelser skapade
- [ ] R024:s notes omskrivna och aritmetiskt konsistenta
- [ ] H001 har `domain: bandy`
- [ ] Validatorn rapporterar `RENT` på alla facts
- [ ] UI_SPRINT_INSTRUCTION uppdaterad med /bandy/ och /spelet/
- [ ] AUDIT_PASS_4 producerad

---

## VAD SOM INTE INGÅR

**Inga mappförändringar.** R/S/D/W stannar i sina nuvarande mappar.
Domänseparationen är konceptuell + UI-rendrering, inte filstruktur.

**Inga ändringar i validatorn.** Den behöver inte veta om domäner —
det är ett konceptuellt lager för människor och UI.

**Inga findings-ändringar.** 005_hornmal_per_slutspelsfas behöver
inte uppdateras — den citerar redan korrekt domän (bandy-domän via S008).

**Ingen ny hypotes-kategori.** H-facts förblir en samlad mapp.
Domänen anges i fältet, inte i mappstrukturen.
