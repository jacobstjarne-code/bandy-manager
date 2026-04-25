# SCHEMA — Bandy-Brain fact-format

**Pass 1, version 0.1 — utkast 2026-04-25**

Detta dokument definierar formatet för facts i Bandy-Brain. Det är
specen Code följer när validator-skriptet (pass 3) byggs, och regeln
Opus följer när migrering (pass 2) sker.

---

## SYFTE MED SCHEMAT

Ett fact är en strukturerad post om något vi tror att vi vet om bandy
— som en regel, en statistisk parameter, ett designval, eller ett
världskanon-beslut. Formatet finns för tre saker:

1. **Spårbarhet.** Varje påstående har en källa och ett datum.
2. **Kohärens.** Invariant-regler kontrollerar att facts inte motsäger
   varandra eller verkligheten.
3. **Konsulterbarhet.** Code och Opus kan slå upp ett fact när en
   designfråga uppstår — istället för att gissa eller söka efter
   gamla samtal.

Det är inte ett system för att lagra all kunskap. Det är ett system
för att lagra de påståenden vi *bygger på*. Operativ data (rådata,
loggar, körrapporter) hör inte hit.

---

## MAPPSTRUKTUR

```
docs/findings/
├── SCHEMA.md              ← detta dokument
├── INDEX.md               ← redan existerande, fungerar parallellt
├── facts/
│   ├── rules/             ← bandyregler (R001-)
│   ├── stats/             ← Bandygrytan-fakta (S001-)
│   ├── design_principles/ ← spelets designval (D001-)
│   └── world_canon/       ← fiktiv värld (W001-)
├── hypotheses/            ← öppna frågor (H001-)
└── findings/              ← verifierade insikter (existerande, t.ex. 001_halvtidsledning.md)
```

`INDEX.md` och `001_halvtidsledning.md` (samt framtida finds) ligger
kvar i `docs/findings/`-roten. De är *narrativa* — analyser och
slutsatser. Facts är *atomära* — enskilda påståenden.

En finding kan referera till facts: "vi observerade X (S007) som
motsäger Y (S012)". Men en finding är inte ett fact.

---

## FACT-ID-KONVENTION

Fyra tecken: en bokstav (kategori) + tre siffror.

- `R001-R999` — rules
- `S001-S999` — stats
- `D001-D999` — design_principles
- `W001-W999` — world_canon
- `H001-H999` — hypotheses (separat namnrymd)

ID:n återanvänds inte. Om R047 visar sig vara fel — markera som
`status: deprecated`, behåll filen, skapa nytt fact med nytt ID om
ersättning behövs.

---

## FILNAMN

`{fact_id}_{kort_slug}.yaml`

Exempel:
- `R001_winning_points.yaml`
- `S003_ht_lead_win_pct.yaml`
- `D012_sponsor_magnitude.yaml`
- `W005_klubb_kallforshyttan.yaml`

Slug är på engelska, snake_case, max ~5 ord. Den är för människor,
inte för validatorn — validatorn bryr sig bara om `fact_id`-fältet
inuti filen.

---

## YAML-SCHEMA

### Obligatoriska fält

```yaml
fact_id: S003                  # str, matchar regex [RSDWH]\d{3}
category: stats                # enum: rules|stats|design_principles|world_canon|hypothesis
claim: "Vinst-procent när laget leder vid halvtid"  # str, mänsklig formulering
verified_at: 2026-04-25        # date, senaste verifiering
verified_by: code              # enum: opus|code|jacob|erik
status: active                 # enum: active|deprecated|disputed
```

### Värde-fält (för facts med mätvärde)

```yaml
value: 78.1                    # number eller str, beroende på fact-typ
unit: percent                  # str, fri men enhetlig (percent, goals/match, sek, etc.)
```

Inte alla facts har värde. En regel-fact ("2 poäng för vinst") kan
uttrycka regeln i `claim` och hoppa över `value`/`unit`.

### Källa

```yaml
source:
  type: dataset                # enum: dataset|rulebook|design_decision|observation|derived
  name: bandygrytan            # str, identifierare för källan
  match_count: 1124            # valfri, för dataset-källor
  seasons: ["2019-20", "..."]  # valfri, för dataset-källor
  doc: "Tävlingsbestämmelser §7"  # valfri, för rulebook-källor
  decided_by: jacob            # valfri, för design_decision-källor
```

Källtypens betydelse:

- `dataset` — räknat ur en datakälla (Bandygrytan, stresstest-output)
- `rulebook` — fastställd regel (Svenska Bandyförbundet)
- `design_decision` — Jacobs (eller Eriks) val för spelet
- `observation` — fält-observation utan formell datakälla, t.ex. en
  spelmekanik som upptäckts under playtest
- `derived` — räknat ur andra facts (t.ex. medelvärde av S001 och S004)

### Invarianter

```yaml
invariants:
  - "value > 60"
  - "value < 90"
  - "value >= S002.value"        # cross-fact
  - "no_code_path_uses_yellow_card"  # code-cross-reference
```

Tre typer (validatorn implementerar dem stegvis i pass 3):

1. **Numeriska bounds** — vanlig jämförelse mot konstant
2. **Cross-fact** — jämförelse mot annat facts värde
3. **Code-cross-reference** — påstående om att kodbasen följer regeln

Typ 3 är inte avgjord. Code föreslår implementation i pass 3
(grep-baserad? AST? manuell granskning per release?). Tills dess kan
sådana invarianter skrivas men inte exekveras.

### Relationer och noter

```yaml
related_facts: [S002, S004]    # valfri, lista av fact_ids
notes: |
  Frittext, flera rader. Förklaringar, varianter, felkällor,
  historisk kontext.
```

### Revisioner

```yaml
revisions:
  - date: 2026-04-14
    value: 46.6
    note: "Felmärkt — innehöll homeHtLeadFraction istället."
  - date: 2026-04-25
    value: 78.1
    note: "Verifierat från rådata efter audit."
```

`revisions:` är inte git-ersättning. Git har den fullständiga historien.
`revisions:` är för revisioner som är *meningsfulla för förståelsen*
— typiskt rättningar, omtolkningar, eller stora omkalibreringar.
Vardagliga uppdateringar (verified_at flyttas fram) hör inte hit.

---

## EXEMPEL — FYRA FACTS

### S003 — stats med invariant och revision

```yaml
fact_id: S003
category: stats
claim: "Vinst-procent när laget leder vid halvtid"
value: 78.1
unit: percent
source:
  type: dataset
  name: bandygrytan
  match_count: 907
  seasons: ["2019-20", "2020-21", "2021-22", "2022-23", "2024-25", "2025-26"]
verified_at: 2026-04-25
verified_by: code
status: active
invariants:
  - "value > 60"
  - "value < 90"
  - "value >= S002.value"
related_facts: [S002]
notes: |
  Halvtidsledning är en stark prediktor i bandy. Datan splittas inte
  här på 1-måls vs flermåls-ledning — det kan bli ett separat fact
  (S004+) eller en finding-rapport.
revisions:
  - date: 2026-04-14
    value: 46.6
    note: |
      Felmärkt. Fältet innehöll homeHtLeadFraction (andel matcher där
      hemmalaget leder vid halvtid), inte vinst-procent. Upptäcktes i
      Sprint 25-HT-analysen.
  - date: 2026-04-25
    value: 78.1
    note: "Verifierat från rådata under audit."
```

### R001 — regel utan värde

```yaml
fact_id: R001
category: rules
claim: "Bandy ger 2 poäng för vinst (inte 3 som i fotboll)"
source:
  type: rulebook
  name: "Svenska Bandyförbundets tävlingsbestämmelser"
verified_at: 2026-04-25
verified_by: jacob
status: active
invariants:
  - "no_code_path_grants_3_points_for_win"
notes: |
  Detta är en strukturell regel. Påverkar tabellberäkning, slutspel,
  motivationsekonomi i klubbarna.
```

### D012 — designval

```yaml
fact_id: D012
category: design_principles
claim: "Sponsor-bidrag ligger i intervallet 300-1700 SEK/vecka"
value: [300, 1700]
unit: SEK/week
source:
  type: design_decision
  decided_by: jacob
  doc: "src/domain/services/economyService.ts:142"
verified_at: 2026-04-25
verified_by: opus
status: active
invariants:
  - "len(value) == 2"
  - "value[0] < value[1]"
  - "value[0] > 0"
notes: |
  Magnituden är kalibrerad mot fiktiv klubb-ekonomi i div 1-2,
  inte verklig sponsor-marknad. Påverkar mecenat-systemets balans.
```

### W005 — världs-kanon

```yaml
fact_id: W005
category: world_canon
claim: "Källforshyttan IF är fiktiv klubb i div 2 norra Svealand"
source:
  type: design_decision
  decided_by: jacob
verified_at: 2026-04-25
verified_by: jacob
status: active
notes: |
  En av 12 fiktiva klubbar etablerade i CLAUDE.md. Hemmaarena
  Källforshyttans IP. Klubbfärger blå/vit.
```

---

## VAD SOM EJ INGÅR I SCHEMAT (avgränsningar)

- **Operativ data.** Bandygrytan-rådatan ligger i `docs/data/`. Den
  ska inte kopieras in i facts. Facts refererar till den via
  `source.name: bandygrytan`.

- **Findings.** Narrativa rapporter som `001_halvtidsledning.md` är
  inte facts. De *kan* referera till facts.

- **Sprint-historik.** Vad som ändrats kod-mässigt hör hemma i
  HANDOVER och DECISIONS. Endast om en sprint *etablerar* ett nytt
  fakta-värde (t.ex. ny kalibreringskonstant) skapas/uppdateras
  motsvarande fact.

- **Erik's UI.** Hur facts presenteras för domänexperten är pass 4 —
  inte pass 1.

---

## ÖPPNA FRÅGOR

1. **YAML eller JSON?** Schemat är skrivet i YAML här. JSON funkar
   tekniskt lika bra och är säkrare för validering. Code har sista
   ordet i pass 3.

2. **Code-cross-reference-invarianter (typ 3 ovan).** Hur
   implementeras `no_code_path_uses_yellow_card`? Pragmatiskt
   förslag från Code i pass 3.

3. **`derived`-källtypen.** Om S010 = (S001 + S002) / 2, bör S010 ha
   en automatisk uppdatering när S001/S002 ändras? Eller är `derived`
   bara dokumentation och människan uppdaterar manuellt? Pass 3-fråga.

4. **Hypotes-kategorin H.** Den ligger i en separat mapp
   (`hypotheses/`) men har samma schema. Behövs egna fält
   (predicted_value, test_method)? Avvaktar tills första hypotesen
   skrivs.

---

## NÄSTA STEG

Pass 1 är klart när:

- [x] SCHEMA.md skriven
- [x] Jacob har granskat och godkänt (2026-04-25)
- [x] Mappstruktur skapad (`facts/rules/`, `facts/stats/`,
      `facts/design_principles/`, `facts/world_canon/`,
      `hypotheses/`)
- [x] En README per kategori-mapp som förklarar dess avgränsning

**Pass 1 godkänt 2026-04-25.**

---

## PASS 2 — Migrering (klar 2026-04-25)

59 facts skapade från 4 källtyper. Se [AUDIT_PASS_2_2026-04-25.md](AUDIT_PASS_2_2026-04-25.md) för fullständig rapport.

**Stats (S001–S016):** 16 facts från `calibrationTargets.herr` i
`bandygrytan_detailed.json` — verifierade mot REVISION_2026-04-25.

**Rules (R001–R015):** 15 facts från SvBF-Regelbok-2025-2026.pdf
(Regler 1, 3, 4, 8, 10, 11, 14-16). PDFen nedladdad till `docs/data/`.

**Rules (R020–R029):** 10 facts från SvBF-TB-Bilaga-9-2025-2026.pdf
(poängsystem, seriestruktur, slutspelsformat). PDFen nedladdad till `docs/data/`.

**Design principles (D001–D005):** 5 facts från `economyService.ts`.

**World canon (W001–W012):** 12 facts, en per fiktiv klubb, från `worldGenerator.ts`.

**Öppen hypotes (H001):** Konflikt identifierad — CLAUDE.md:s "inga gula kort"
stämmer inte med §16 i regelbok 2025/2026 som anger varning + matchstraff.
Kräver Jacobs beslut.

Pass 3 (validator-skript) kan nu starta.
