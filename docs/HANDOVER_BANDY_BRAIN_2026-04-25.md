# HANDOVER — Bandy-Brain (kunskapslager-projektet)

**Skapad:** 2026-04-25 av Opus efter en lång arbetssession med Jacob
**Syfte:** Ge nästa Opus-instans full kontext för att starta Bandy-Brain
**Förutsätter:** Bandy Manager grundprojekt redan etablerat

---

## VAD BANDY-BRAIN ÄR

Ett kunskapslager-projekt som lever *inom* Bandy Manager-repot men är
konceptuellt separat. Det samlar:

1. **Etablerade fakta** om bandy som spel och liga (`facts/`)
2. **Öppna hypoteser** som väntar på verifiering (`hypotheses/`)
3. **Verifierade insikter** från simulering + datanalys (`findings/`)

Syftet är trefaldigt:
- Ackumulera kunskap över tid istället för att deponera engångsinsikter
- Validera nya fynd mot etablerade fakta (motsägelser flaggas)
- Ge Erik (domänexpert) en läsbar yta att kommentera på

---

## VARFÖR

Den utlösande händelsen: 2026-04-25 upptäckte Code att
`htLeadWinPct: 46.6` i `bandygrytan_calibration_targets.json` var fel.
Hela Sprint 25-serien (25b, 25e, 25f) hade kalibrerats *bort* från
verkligheten istället för mot. Verkligt värde är ~78%.

Insikt: hade ett kunskapslager funnits med en invariant-regel
*"htLeadWinPct ≥ homeWinPct (halvtidsledning är starkare prediktor än
hemmaplan)"* — då hade 46.6 flaggats automatiskt vid lagring.

Det här är poängen med kunskapslagret. Inte att lagra data — utan att
*upprätthålla kohärens* mellan vad vi tror vi vet och vad datan säger.

---

## ARKITEKTUR-VAL: NIVÅ 2

Tre nivåer diskuterades:

- **Nivå 1** — Strukturerad markdown (`facts/`, `hypotheses/`, `findings/`).
  Disciplin via läsning av tidigare facts. Inga verktyg.
- **Nivå 2** — Strukturerad data (YAML/JSON) + validator-skript som
  kontrollerar invarianter och flaggar avvikelser.
- **Nivå 3** — Kunskapsgraf (Neo4j eller liknande). Overkill för
  Bandy Manager-skala.

**Beslut:** Börja på Nivå 2. Skäl:
- Innehållet finns redan utspritt (CLAUDE.md, JSON-targets, designsystem)
- Migreringen *är* värdet — den tvingar fram tydlighet om källor
- Code är kompetent nog att bygga validatorn på dagar, inte veckor

Risken: bygga infrastruktur utan att fylla med innehåll.
**Mitigering:** Hård deadline en vecka för pass 1+2. Skala ner ambition
om det inte hinns.

---

## KATEGORIER (FÖRSLAG)

```
docs/findings/
├── INDEX.md
├── facts/
│   ├── rules/                 — bandyregler (10-min-utvisning, 2 poäng/vinst)
│   ├── stats/                 — Bandygrytan-fakta (10.2 mål/match, etc.)
│   ├── design_principles/     — designval i spelet (sponsor 300-1700/v)
│   └── world_canon/           — etablerade saker om spelets värld
├── hypotheses/                — öppna frågor
└── findings/                  — verifierade insikter
```

Varje kategori har samma YAML-format men olika invariant-regler.

---

## FACT-FORMAT (FÖRSLAG)

```yaml
fact_id: F001
category: stats  # rules | stats | design_principles | world_canon
claim: "Genomsnittligt mål per match i Elitserien herr"
value: 9.12
unit: goals/match
source:
  type: dataset       # dataset | rulebook | design_decision | observation
  name: bandygrytan
  match_count: 1124
  seasons: ["2019-20", ..., "2025-26"]
verified_at: 2026-04-25
verified_by: opus    # opus | code | jacob | erik
invariants:
  - "value > 0"
  - "value < 20"  # sanity check
related_facts: [F002, F003]
notes: |
  Frittext-noter om felkällor, varianter, etc.
```

Källtyperna är viktiga:
- `dataset` — räknat från Bandygrytan eller motsvarande
- `rulebook` — från Svenska Bandyförbundets regler
- `design_decision` — Jacobs val för spelet
- `observation` — från simulering eller spel

---

## FYRA PASS (FÖRSLAG)

### Pass 1 — Schema + kategorier (~2h Code, ~1h Opus)

Definiera:
- YAML-schema (med JSON Schema-validation)
- Kategorier + invariant-regler per kategori
- Mapp-struktur i `docs/findings/`
- Konvention för fact-IDs (F001, F002...)

Output: `docs/findings/SCHEMA.md` + tomma katalog-skelett.

### Pass 2 — Migrera befintligt innehåll (~3h Code, ~2h Opus)

Plocka ur:
- **CLAUDE.md** → `facts/rules/` (bandyspecifika regler), `facts/world_canon/` (12 fiktiva klubbar)
- **economyService.ts** → `facts/design_principles/` (sponsor-magnitud, kommunbidrag-formel)
- **bandygrytan_calibration_targets.json** → `facts/stats/` (alla siffror med riktiga källor)
- **DESIGN_SYSTEM.md** → `facts/design_principles/` (knappstilar, kortsystem)

**Viktigt:** Behåll markdown-filerna men låt dem *referera till facts*.
Exempel: CLAUDE.md "Bandyspecifika regler" blir en lista med
fact_id-referenser.

Det är i pass 2 som motsägelser och otydligheter kommer fram. Det är
själva migreringen som är värdet.

### Pass 3 — Validator (~1d Code)

Skript: `npm run check-facts`

Funktioner:
- Validera YAML-format mot schema
- Köra invariant-regler per kategori
- Flagga avvikelser >2pp mellan stored value och rådata-räkning
- Korsreferens facts → kod (om en regel säger "10-min-utvisning" — finns
  det kod som hanterar 5-min eller 15-min utvisningar? Då varning.)

Output: rapport-fil `docs/findings/AUDIT_<datum>.md`

### Pass 4 — Hypotesgenerator + webbgränssnitt (~2d Code)

**Hypotesgenerator:** Strukturerad utforskning, INTE AI-mönsterletande.
Bibliotek av frågor man kan ställa, baserat på etablerade facts:

```bash
npm run findings -- "halvtidsledning vs storlek"
# Output: tabell över htLeadWinPct splittat på 1/2/3+ måls ledning
```

Frågorna *vet* om existerande facts. Exempel:
- "splitta X på Y" — där X är ett befintligt fact
- "korrelera X med Z" — när Z är en variabel som finns i datan
- "tidsserie för X" — när X varierar över säsonger

**Webbgränssnitt:** MkDocs först (~30 min). Renderar markdown +
inkluderar referenser från facts. Erik får en URL och kan läsa allt.

Eventuellt egen Vite-app senare när MkDocs blir trögt — men inte i
första versionen.

---

## EXEMPEL — INITIAL DATAINMATNING

När pass 2 körs ska följande facts finnas dag 1:

```yaml
# facts/stats/F001_avg_goals_per_match.yaml
fact_id: F001
category: stats
claim: "Genomsnittligt mål per match — Elitserien herr"
value: 9.12
unit: goals/match
source:
  type: dataset
  name: bandygrytan
  match_count: 1124
  seasons: ["2019-20", "2020-21", "2021-22", "2022-23", "2024-25", "2025-26"]
verified_at: 2026-04-14
verified_by: code
invariants:
  - "value > 5"
  - "value < 15"
notes: |
  Snitt 8.2-10.3 per säsong. Säsongsvariation finns.
```

```yaml
# facts/stats/F002_home_win_pct.yaml
fact_id: F002
category: stats
claim: "Hemmavinst-procent — Elitserien herr"
value: 50.2
unit: percent
source:
  type: dataset
  name: bandygrytan
  match_count: 1124
verified_at: 2026-04-14
verified_by: code
invariants:
  - "value > 30"
  - "value < 70"
related_facts: [F003]
```

```yaml
# facts/stats/F003_ht_lead_win_pct.yaml
fact_id: F003
category: stats
claim: "Vinst-procent när laget leder vid halvtid"
value: 78.1  # NB: tidigare felmärkt som 46.6
unit: percent
source:
  type: dataset
  name: bandygrytan
  match_count: 907  # bara matcher med halvtidsledning
verified_at: 2026-04-25
verified_by: code
invariants:
  - "value >= F002.value"  # MÅSTE vara större än hemmavinst
  - "value > 60"  # halvtidsledning är stark prediktor
  - "value < 90"
notes: |
  Ersätter felaktig target 46.6 från 2026-04-14. Felet upptäcktes
  under Sprint 25-HT-analysen 2026-04-25. Ledde till Sprint 25b/25e/25f
  ska revideras.
related_facts: [F002]
revisions:
  - date: 2026-04-14
    value: 46.6
    note: "Felmärkt som vinst-procent. Möjligen förlust-procent eller annat."
  - date: 2026-04-25
    value: 78.1
    note: "Verifierat från rådata."
```

```yaml
# facts/rules/R001_winning_points.yaml
fact_id: R001
category: rules
claim: "2 poäng för vinst i bandy (inte 3 som i fotboll)"
source:
  type: rulebook
  name: "Svenska Bandyförbundets tävlingsbestämmelser"
verified_at: 2026-04-25
verified_by: jacob
invariants:
  - "no_code_path_grants_3_points_for_win"
notes: |
  Detta är en regel, inte en designvalfråga. Får inte ändras utan
  konsekvensanalys mot ligastruktur, slutspelsregler, etc.
```

```yaml
# facts/rules/R002_no_yellow_cards.yaml
fact_id: R002
category: rules
claim: "Bandy har inte gula/röda kort — 10 minuters utvisning används"
source:
  type: rulebook
  name: "Svenska Bandyförbundets tävlingsbestämmelser"
verified_at: 2026-04-25
verified_by: jacob
invariants:
  - "no_code_path_uses_yellow_card"
  - "no_code_path_uses_red_card"
  - "suspension_duration in [10, 5]"  # 10 huvudregel, 5 vid lättare
notes: |
  10-min utvisning är huvudregeln. 5 minuter förekommer vid lättare
  förseelser. Inga andra varianter.
```

---

## VAD SOM BLOCKERAR PASS 1

**Inget nu.** 46.6-fyndet är upptäckt och Code är på väg att verifiera
det formellt. När Code's verifiering kommer in (förväntad inom dagar)
finns:
- Konkret första-fact att lägga in (F003 ovan)
- Validering att invariant-systemet är värdefullt (det fångade ju 46.6)
- Motivering för hela projektet

Pass 1 kan starta så snart Code's verifiering är klar.

---

## VAD SOM EJ ÄR BESTÄMT

1. **Validator-format.** YAML är förslag — JSON funkar också. Code får
   välja det som passar bäst med deras validation-bibliotek.

2. **Cross-reference till kod.** Att fact R002 säger "no_code_path_uses_yellow_card"
   — hur implementeras den invarianten? grep? AST-analys? Manuell granskning?
   Code får föreslå pragmatisk lösning.

3. **Erik's roll.** Han kan validera facts (signera som `verified_by: erik`)
   men kan inte koda. Frågan: ska facts vara redigerbara via web-UI,
   eller ska han kommentera och Jacob/Opus uppdaterar? Senare frågan.

4. **Versionering av facts.** Om F003 revideras (som ovan) — hur
   hanteras gamla värdens histor? Förslag är `revisions:`-arrayen i
   filen, men finns andra lösningar (separat changelog, git-historia räcker, etc.).

---

## SAMARBETE — UPPGIFTSFÖRDELNING

**Opus** (i ny chat):
- Skriver pass 1-spec (schema, kategorier, format-detaljer)
- Skriver pass 2-spec (vilka filer som migreras, hur)
- Migrerar innehåll *själv där det är textbaserat* (regel-extraktion ur CLAUDE.md, design-principles ur DESIGN_SYSTEM.md)
- Skriver första 5-10 facts som handhandlade exempel

**Code:**
- Implementerar validator-skriptet (pass 3)
- Bygger hypotesgeneratorn (pass 4)
- Sätter upp MkDocs eller Vite-app för Erik
- Skriver tester för validator + hypotesgenerator

**Jacob:**
- Bekräftar fact-schema innan Code bygger
- Validerar att invarianter är rimliga för domänen
- Beslutar prioritet om scope växer

**Erik (när det finns något att läsa):**
- Granskar facts för domänkorrekthet
- Föreslår nya facts från sin bandykunskap
- Föreslår hypoteser värda att testa

---

## VIKTIGA REFERENSER

**Filer som ska läsas innan pass 1 startar:**

- `docs/HANDOVER_BANDY_BRAIN_2026-04-25.md` (denna fil)
- `docs/findings/INDEX.md` (befintlig grov struktur)
- `docs/findings/001_halvtidsledning.md` (utkast som väntar på data)
- `docs/data/bandygrytan_calibration_targets.json` (innehåller felet 46.6)
- `docs/findings/REVISION_2026-04-25_calibration_targets.md` (ska finnas
  när Code's verifiering är klar)
- `CLAUDE.md` (innehåller bandyspecifika regler som ska migreras)
- `docs/DESIGN_SYSTEM.md` (innehåller designprinciper som ska migreras)
- `src/domain/services/economyService.ts` (innehåller magnituder som
  inte är dokumenterade någonstans annars)

---

## DAGENS ARBETSSESSION (kontext)

Den 2026-04-25 hade Jacob och Opus en lång session som täckte:

- Sprint 25g (matchens karaktärer) — domare + matchskador, kurerad text
- TS-1 (roundProcessor refactor) — tre pass, 1305 → ~600 rader
- Sprint 25h (bandyskandaler) — tre lager + småskandal-arketyp + addendum
- Lager 2 + Lager 3 kurerad text (30 strängar)
- Småskandal-data (6 absurditeter inkl. hund-på-planen, bandyklubba-på-buss)
- 46.6-fyndet — Code upptäckte att htLeadWinPct-target är fel
- Diskussion om kunskapslager → denna handover

Allt detta är *separat* från Bandy-Brain-projektet men ger kontext.
Bandy-Brain handlar inte om att göra om Sprint 25-arbetet — det handlar
om att *förebygga* att samma typ av fel uppstår igen.

---

## NÄR PASS 1 SKA STARTAS

Två signaler:

1. Code har levererat `REVISION_2026-04-25_calibration_targets.md` med
   verifiering av 46.6-fyndet och granskning av övriga targets
2. Jacob är klar med playtest av Sprint 25g+25h och har eventuell
   feedback att integrera

Vänta på båda. När båda är klara: starta ny chat med "Bandy-Brain pass 1
— läs HANDOVER_BANDY_BRAIN_2026-04-25.md".

---

## DESIGN-PRINCIP — VIKTIG

Bandy-Brain är inte ett separat projekt med eget repo. Det är en
**arbetssätt-förändring** för Bandy Manager-projektet. Skillnaden:

- **Innan:** kunskap deponeras i kommentarer, README, slumpvisa md-filer
- **Efter:** kunskap har en hemvist (`facts/`), en process (validator),
  och en konsument (hypotesgeneratorn + Erik via webb-UI)

Det gör Bandy-Brain till **del av utvecklingsdisciplinen**, inte en
sidoaktivitet. När en ny feature byggs ska berörda facts uppdateras
parallellt. När en stresstest avslöjar ny insikt ska den landa som ett
fact. När en designvalfråga uppstår ska existerande facts konsulteras.

Det är poängen. Allt annat är bara struktur.

---

## SLUT

Nästa Opus: läs igenom hela detta dokument innan du svarar Jacobs första
fråga. Det blir lättare att hjälpa när du har överblick.

Lycka till. Detta blir bra om det görs disciplinerat.
