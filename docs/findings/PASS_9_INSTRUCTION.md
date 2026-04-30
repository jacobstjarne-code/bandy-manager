# PASS_9_INSTRUCTION — Stänga loopen, deduplicera, hantera dam-blockaden

**Skapad:** 2026-04-26
**Förutsätter:** Pass 8 klart. 209 Q-facts, 46 findings, 0 besvarade Qn.
**Levereras till:** Code (största delen), Opus (granskning)
**Beräknad tid:** ~3-4 timmar

---

## SYFTE

Tre konkreta problem upptäckta efter pass 8-deploy:

1. **Inga Q-facts är besvarade.** 209 öppna, 0 stängda. Pipeline-Steg B
   från pass 7 har inte triggats — antingen för att backfill skapade
   Qn först (kausalitetsfel), eller för att Steg B inte är fullt
   implementerat. Det måste verifieras och fixas.

2. **Q-listan har duplikat.** String-match-dedupen från pass 7 missar
   omformuleringar. Q058+Q160 (1-0-ledningar vid halvtid), Q029+Q057+
   Q062+Q082+Q086 (alla "samma sak men i damserien") är exempel.
   Embeddings-dedup måste aktiveras (pass 8 prio C, nu reell).

3. **15+ Qn är strukturellt obesvarliga.** "Hur ser X ut i damserien?"
   när det inte finns någon damdata att besvara från. De ligger som
   öppna Qn för evigt och förorenar listan.

Pass 9 löser alla tre.

---

## DEL 1 — VERIFIERA PIPELINE STEG B

### 1.1 — Test

Jacob ställer en testfråga via `/ask/`-formuläret som matchar en
befintlig öppen Q. Förslag: ställ Q012:s exakta fråga ("Är målminuts-
fördelningen faktiskt jämn, eller finns det kluster?").

Förväntat utfall enligt pass 7 Steg C:

1. Issue skapas med label `new-question`
2. Pipeline läser issue
3. Pipeline kör dedup mot öppna Qn → matchar Q012
4. Pipeline kommenterar issue med Q012-länk och stänger som duplicate
5. Pipeline genererar finding som besvarar Q012
6. Finding får frontmatter `answers: [Q012]`
7. Q012 uppdateras till `status: answered, answered_by: finding:047`

### 1.2 — Vad som troligen kommer hända

Med stor sannolikhet kommer steg 3-7 inte fungera fullt ut. Pass 7
specade Steg B/C men de implementerades samtidigt som backfill-
scriptet, och backfill kördes utan att Steg B/C testats end-to-end
mot en verklig user-fråga.

Code rapporterar exakt var det går fel:

- Faller pipelinen helt? (matchar inte Q-format)
- Kör pipelinen men hittar inte Q012? (dedup-bug)
- Kör pipelinen, hittar Q012, men uppdaterar inte status? (skriver
  inte tillbaka till YAML)
- Allt kör men finding-frontmatter saknar `answers:`? (output-mall
  uppdaterar inte fältet)

Beroende på fel: Code fixar punktvis och kör testet igen.

### 1.3 — Backfill av besvarade Qn

När Steg B fungerar finns en bredare fråga: har någon av de 209 öppna
Qn redan ett svar i en befintlig finding men ingen markering?

Exempel: Q012 frågar om målminutsfördelning. Finding 005, 008, eller
någon senare finding kan ha analyserat just detta utan att frontmatter
fick `answers:`-fältet (eftersom Q012 inte fanns vid finding-
generering — backfill kom efteråt).

**Code kör en engångs-LLM-pass:**

För varje öppen Q, kontrollera mot alla findings: finns det en finding
som besvarar denna fråga? Om ja → uppdatera finding.frontmatter och
Q.status. Om tveksamt → flagga för Opus-granskning.

Output: `docs/findings/Q_RETROACTIVE_ANSWERS_2026-04-26.md` med:
- Tydliga matchningar (Code uppdaterar direkt)
- Tveksamma matchningar (Opus avgör)
- Q-fact-IDn som förblir öppna

Förväntat utfall: 30-60 av 209 Qn får retroaktiv markering.

---

## DEL 2 — EMBEDDINGS-DEDUP

### 2.1 — Implementation

Lägg till embeddings-baserad dedup i `scripts/pipeline/dedup.py`:

```python
# Pseudokod
def find_duplicate(new_question_text, open_questions):
    # 1. String-match först (snabbt, ~80% av fallen)
    string_match = simple_dedup(new_question_text, open_questions)
    if string_match:
        return string_match

    # 2. Embeddings-fallback
    new_emb = embed(new_question_text)
    similarities = [(q, cosine(new_emb, embed(q.claim))) for q in open_questions]
    similarities.sort(key=lambda x: -x[1])

    if similarities and similarities[0][1] > 0.95:
        return similarities[0][0]  # auto-link
    elif similarities and similarities[0][1] > 0.85:
        return ('suggest', similarities[0])  # suggest-link
    return None
```

Embeddings-källa: Anthropic eller OpenAI. Code väljer.

Cache embeddings för befintliga Qn lokalt för att undvika upprepade
API-anrop. Cache invalideras när claim ändras.

### 2.2 — Engångs-dedup-pass på existerande 209 Qn

Code kör `scripts/pipeline/dedup_existing.py`:

1. Embedda alla 209 Qn (engångskostnad)
2. För varje Q: hitta de 5 mest lika andra Qn
3. Producera `docs/findings/DEDUP_2026-04-26.md` med:
   - Par/grupper med similarity > 0.95 (auto-merge-kandidater)
   - Par/grupper med 0.85-0.95 (förslag — Opus granskar)
   - Statistik: hur många auto-merges, hur många förslag

### 2.3 — Opus-granskning

Opus läser DEDUP-rapporten. För varje grupp:

- Är detta samma fråga? → markera den nyaste som `closed,
  superseded_by: <äldsta-Q-id>`. related_questions uppdateras
  bidirektionellt.
- Är de relaterade men distinkta? → uppdatera bara `related_questions`,
  båda förblir öppna.

Förväntat utfall: 209 Qn → ~150-170 unika.

### 2.4 — Aktivera dedup framåt

Pipelinens Steg A uppdateras att alltid köra embeddings-dedup vid
ny Q-skapande. Tröskeln 0.95 = auto-link, 0.85 = related.

---

## DEL 3 — DAM-BLOCKADEN

### 3.1 — Identifiera dam-Qn

Code skriver enkel klassificerare:

```python
def is_damdata_question(q):
    keywords = ['dambandy', 'damserien', 'damelitserien',
                'dameliten', 'damernas', 'damlag']
    return any(kw in q.claim.lower() for kw in keywords)
```

Förväntat: 15-20 Qn. Lista dem i `DAMDATA_BLOCK_2026-04-26.md`.

### 3.2 — Utöka stängningsmekanismen

Idag har Q-facts: `status: open | answered | closed`.

Lägg till ny stängningsorsak: `closed_reason:`. Värden:

- `superseded` — annan Q tog över (befintligt mönster)
- `data_unavailable` — frågan kan inte besvaras med tillgänglig data
- `out_of_scope` — frågan ligger utanför projektets ramar
- `too_vague` — frågan är inte operationaliserbar (etablerat i pass 7)

`closed_reason: data_unavailable` med ny obligatorisk fält:

```yaml
data_required: damdata
unblocks_when: "Damelitserien skrapad"
```

Det här gör att Qn inte försvinner — de väntar. När damdatan
existerar kan en sprint öppna alla `unblocks_when: damdata`-Qn på
en gång.

### 3.3 — Stäng dam-Qn

Code uppdaterar alla identifierade dam-Qn:

```yaml
status: closed
closed_at: 2026-04-26
closed_reason: data_unavailable
data_required: damdata
unblocks_when: "Damelitserien skrapad"
notes: |
  Frågan är giltig men kan inte besvaras med nuvarande dataunderlag.
  Bandygrytan-scrapern täcker bara herrserien. Frågan återöppnas om
  och när damdata finns tillgänglig.
```

### 3.4 — Skapa damdata-meta-finding

Inte ett vanligt fynd, men ett strukturerat dokument som förklarar
blockaden:

`docs/findings/META_DAMDATA_2026-04-26.md`:

- Vad damdata-frågorna handlar om (sammanfattning av de 15-20 Qn)
- Varför de inte kan besvaras nu
- Vad som krävs för att lösa upp blockaden (omfång på scrapning,
  vilka säsonger som finns publikt, etc.)
- Lista över Qn som väntar på damdata

Detta gör problemet synligt utan att forena 20 öppna Qn som verkar
oansade.

### 3.5 — UI-uppdatering

`/questions/`-listan får ny filter-toggle:
- "Alla" (default)
- "Endast öppna"
- "Inkludera blockerade"

`closed_reason: data_unavailable` visas inte i default-listan men kan
göras synliga via filter. Det håller sidan ren utan att gömma frågorna.

På respektive Q-detaljsida (om Q-detaljvy finns från pass 8): "Denna
fråga är blockerad — väntar på damdata. Se META_DAMDATA."

---

## DEL 4 — KONTROLLER FRAMÅT

### 4.1 — Validator-uppdatering

`validate_brain.py` får tre nya kontroller:

1. **Q-koppling-konsistens.** Om Q.answered_by = finding:047, kontrollera
   att finding 047:s frontmatter har `answers: [Q-id]`. Tvåvägslänk
   måste stämma. (Specat i pass 7, verifiera att det fungerar.)

2. **Stängningsfält obligatoriska vid status: closed.** Om
   `status: closed` saknar `closed_reason` → fel. Säkrar att
   stängningar kan filtreras och förstås.

3. **Embeddings-dedup-täckning.** Varje öppen Q har embeddings
   beräknade och cachade. Om ny Q saknar embedding → varning.

### 4.2 — Pipeline kvalitetsgrind

Innan en finding publiceras måste pipelinen kontrollera:

- Har findingen `answers:`-fält? (Om frågan kom via /ask/ — ja, alltid)
- Är alla Q-IDn i `answers:` aktuellt öppna Qn?
- Stänger pipelinen alla matchade Qn när finding deployas?

Om något steg fallerar → finding går inte live, issue skapas till
Jacob.

---

## DEL 5 — VAD SOM INTE INGÅR

**Damdata-scraping.** Eget projekt. Pass 9 erkänner blockaden,
löser den inte.

**H-fact-backfill.** Pass 8 prio A specade detta men jag (Opus)
har inte sett bekräftelse på att det körts. Om inte gjort: kör som
del av pass 9 prio B (egen del 6 nedan, valfri). Annars hoppa.

**Trädvisualisering med besvarade Qn.** Behövs när 30+ Qn faktiskt
är besvarade. När pass 9 är klart förväntas 30-60 Qn besvarade
retroaktivt — då är /tree/ värd att utvidga med "answered_by"-kanter.
Kort UI-uppdatering, läggs till i del 7 nedan.

---

## DEL 6 — H-FACT-BACKFILL (om ej körd i pass 8)

[Hoppa om pass 8 prio A redan körts — Code rapporterar status först.]

Om H-fact-backfill från pass 8 inte körts:

1. Code kör `h_backfill.py` mot 46 findings
2. Producerar `H_BACKFILL_2026-04-26.md`
3. Opus granskar
4. Code skriver kuraterade H-facts

Detta är samma instruktion som pass 8 del 2. Ingen ändring.

---

## DEL 7 — UTVIDGAD /tree/

Efter del 1.3 (retroaktiva svar) finns sannolikt 30-60 besvarade Qn.
Då är /tree/ inte längre tom på answered_by-kanter.

Code uppdaterar Mermaid-genereringen:

```mermaid
graph LR
  F004 -.spawned.-> Q012
  Q012 -.answered_by.-> F005    %% nya kanten
```

Filter på sidan:
- Default: visa bara besvarade Qn (mest informativt)
- Toggle: visa alla Qn (kan bli rörigt)

Om grafen blir oläslig (>50 noder): paginera per finding eller per
kluster av relaterade frågor.

---

## ARBETSORDNING

1. **Code** verifierar pipeline Steg B/C (1.1-1.2). Fixar bugs.
   (~30 min — beroende på vad som hittas)

2. **Code** kör retroaktiv Q-svar-pass (1.3). Producerar rapport.
   (~45 min)

3. **Opus** granskar Q_RETROACTIVE_ANSWERS-rapporten. (~30 min)

4. **Code** implementerar embeddings-dedup (2.1). (~45 min)

5. **Code** kör engångs-dedup mot 209 Qn (2.2). (~30 min)

6. **Opus** granskar DEDUP-rapporten (2.3). (~30 min)

7. **Code** identifierar dam-Qn och skapar utökad
   stängningsmekanism (3.1-3.3). (~30 min)

8. **Code/Opus** skriver META_DAMDATA-meta-finding (3.4). (~20 min)

9. **Code** uppdaterar /questions/-UI med filter (3.5). (~15 min)

10. **Code** uppdaterar validator (4.1) och pipeline-kvalitetsgrind
    (4.2). (~30 min)

11. **Code** utvidgar /tree/ med answered_by-kanter (del 7).
    (~20 min)

12. **Code** producerar AUDIT_PASS_9_2026-04-26.md med:
    - Antal Qn besvarade retroaktivt
    - Antal Qn deduplicerade
    - Antal Qn stängda som data_unavailable
    - Antal Qn fortsatt öppna
    - Pipeline Steg B/C-status (fungerar/buggar fixade)
    - Validator-uppdateringar
    (~15 min)

---

## STOP-CRITERIA

- [ ] Pipeline Steg B/C verifierad fungerande end-to-end
- [ ] Retroaktiv Q-svar-pass körd, rapport granskad av Opus
- [ ] Embeddings-dedup implementerad och cachad
- [ ] Engångs-dedup körd, DEDUP-rapport granskad av Opus
- [ ] Dam-Qn klassificerade och stängda som data_unavailable
- [ ] META_DAMDATA-finding publicerad
- [ ] /questions/-filter uppdaterat
- [ ] Validator har tvåvägslänk-, closed_reason- och embeddings-kontroller
- [ ] /tree/ visar answered_by-kanter
- [ ] AUDIT_PASS_9 producerad

Förväntat utfall:
- 209 Qn → ~120-140 unika öppna Qn
- 30-60 Qn besvarade
- 15-20 Qn blockerade på damdata
- 5-10 Qn stängda som duplikater

---

## OBSERVATION OM PROJEKTETS RIKTNING

Bandy-Brain har gått från facts-system → publik sajt → autonom
pipeline → 209 frågor utan svar.

Det är ett mönster värt att notera. Pipelinen är produktiv på att
*generera frågor* men har ingen inneboende mekanism för att *driva
mot svar*. Varje ny finding väcker fler frågor än den besvarar.
Trädet växer på spawning-sidan men inte på answered-sidan.

Det är inte fel — det är ett kunskapssystem som upptäcker att
domänen är djupare än vad Bandygrytan kan svara på. Men det
betyder att det blir frustration på sajten om förhållandet mellan
"frågor" och "svar" inte balanseras.

Tre möjliga vägar framåt efter pass 9:

**(a) Frågedrift.** Pipelinen styrs explicit mot att besvara öppna
Qn istället för att generera nya. /ask/-formulär och questions.yaml
prioriteras över LLM-genererade nya frågor. Fokus blir att stänga
loopar.

**(b) Domänutbidning.** Mer data → fler frågor blir besvarbara.
Damdata-scraping, allsvenskan-fokus, kvaldata, etc. Det här gör
basmaterialet rikare.

**(c) Hypotes-driven analys.** Istället för att frågor spawnar
findings, hypoteser spawnar findings. Pipelinen formulerar H-facts
och designar specifika tester. Mer rigoröst men kräver att
pipelinen blir vetenskaplig istället för utforskande.

Inget av detta är pass 9. Men det är värt att veta att pass 9
löser de akuta strukturella problemen — det löser inte den
underliggande riktningsfrågan. Den behöver Jacob avgöra explicit.
