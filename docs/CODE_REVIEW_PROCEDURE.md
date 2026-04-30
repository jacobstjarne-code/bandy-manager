# CODE_REVIEW_PROCEDURE — Hur Code granskar och refaktorerar systematiskt

**Skapad:** 2026-04-28
**Författare:** Opus
**Syfte:** Strukturera hur kodgranskning och refaktorering körs som regelbunden vana, inte som reaktion när något kraschar.

---

## När detta dokument används

Tre tillfällen:

### 1. Efter varje 2-3 sprintar (regelbunden hälsa-check)
Snabb genomgång (~30 min). Fångar accumulering av små problem innan de blir stora.

### 2. Inför ny större feature (förebyggande)
När en ny komplex feature är på väg in, granska närliggande kod först. Säkerställ att grunden är ren.

### 3. När något specifikt smärtar (reaktiv)
"Den här filen är 800 rader och jag vågar inte röra den" — då är det dags. Reaktiv refactor är OK men ska inte vara dominerande mode.

---

## Tre granskningstyper

### Typ A: Filstorleks-audit (15 min)
Kör en specifik kommando, lista alla filer som vuxit över rimlig gräns. Identifiera kandidater för uppdelning.

```bash
# Komponenter över 200 rader
find src/presentation -name "*.tsx" -exec wc -l {} \; | sort -rn | head -20

# Services över 250 rader
find src/domain/services -name "*.ts" -exec wc -l {} \; | sort -rn | head -20

# Datafiler över 300 rader (datafiler får vara större men inte oändligt)
find src/domain/data -name "*.ts" -exec wc -l {} \; | sort -rn | head -10
```

**Tröskelvärden:**
- Komponentfil >150 rader: kandidat för uppdelning
- Service-fil >200 rader: kandidat för uppdelning  
- Datafil >500 rader: kandidat för uppdelning
- Något >800 rader: akut, gå först

### Typ B: Duplicerings-audit (30 min)
Sök efter tecken på duplicerad logik. Specifika mönster:

```bash
# Form-beräkningar (en känd hotspot)
grep -rn "getFormGuide\|getFormResults\|recentForm" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# Attendance-beräkningar
grep -rn "attendance\|Attendance" src/domain/services/ --include="*.ts" | head -20

# Datum-formattering
grep -rn "formatDate\|dateString\|toLocaleDateString" src/ --include="*.ts" --include="*.tsx" | head -20

# Hard-coded färger (regression från CSS-token-disciplin)
grep -rn '#[0-9a-fA-F]\{3,8\}' src/presentation/ --include="*.tsx" | grep -v "ClubBadge\|svg\|SVG"
```

**Vad som flaggas:**
- Samma utility-funktion implementerad i 2+ filer
- Hårdkodade hex-färger i .tsx (utom undantag)
- Datum-format-strängar spridda i många filer
- Attendance/income/cost-formler som upprepas

### Typ C: Kontextuell granskning (45 min)
Specifikt för en del av kodbasen. Läs filerna i ordning, leta efter:

- Lager-brott (presentation läser från application istället för domain)
- Tight coupling mellan oberoende moduler
- Komponenter som vet för mycket om bag-systemet eller andra moduler de inte borde
- Pure functions som har sneakat in side effects över tid
- TypeScript-typer som blivit `any` eller `unknown` utan motivering

**Triggers:** "Jag vill bygga X men måste först ändra Y och Z" — det är couplings-symptom. Kör Typ C på området.

---

## Format för granskningsrapport

`docs/code-review/REVIEW_YYYY-MM-DD_<typ>.md`:

```markdown
# Code review YYYY-MM-DD — <typ>

**Commit:** <hash>
**Typ:** A (filstorlek) / B (duplicering) / C (kontextuell)
**Område:** <vilken del av kodbasen>
**Tid:** <hur länge>

---

## Vad granskades
(Filer / mappar / kommandon kört)

## Fynd

### Akut (måste fixas innan nästa sprint)
- <Fil>:<rad> — <vad är fel> — <varför akut>

### Medium (bör fixas inom 2 sprintar)
- <Fil>:<rad> — <vad är fel>

### Notering (lägg i ATGARDSBANK)
- <Fil>:<rad> — <vad kan förbättras>

## Inga fynd
(Områden som granskades och var rena)

## Slutsatser

- Refactor-sprint behövs: <ja/nej>
- Värt att ta upp med Opus: <vad>
- Lägg till verifieringsregel i CLAUDE.md: <ja/nej, vilken>
```

---

## Refactor-strategier

### Strategi 1: Dela upp komponentfil (när >200 rader)

**Vanligt mönster:**
- En "screen"-komponent har växt
- Den har 5-8 underdelar som alla är inline
- Delarna har inga beroenden mellan varandra utom genom screen-state

**Refactor:**
- Extrahera varje underdel till egen fil i `components/<screen-name>/`
- Screen blir orkestrator, varje underdel är fokuserad
- State pasas som props, callbacks pasas som props
- Inga komponenter-importerar-andra-komponenter-direkt — bara screen

**Krav efter refactor:**
- Filstorlek per komponent <150 rader
- Screen <100 rader
- Tester passerar utan ändring

### Strategi 2: Bryt service i hjälpfiler (när >250 rader)

**Vanligt mönster:**
- En service har växt med flera relaterade men distinkta funktioner
- Vissa funktioner är pure helpers
- Andra är main API

**Refactor:**
- Behåll main API i ursprungsfilen
- Flytta pure helpers till `<service-name>Helpers.ts` eller liknande
- Behåll alla imports stabila — använd re-exports om nödvändigt
- Tester pasar oförändrat

### Strategi 3: Extrahera dubblerad logik (när 2+ implementationer)

**Vanligt mönster:**
- Två filer beräknar samma sak (form, attendance, datum)
- Implementationerna har drift — små skillnader

**Refactor:**
- Skapa `<utility>.ts` med kanonisk implementation
- Båda anroparna importerar därifrån
- Verifiera att utility ger samma output som båda gamla
- Tester för utility separat
- Ta bort gamla implementationerna

**Risk:** En av implementationerna kan vara avsiktligt annorlunda. Granska skillnader noggrant innan extrahering.

### Strategi 4: Lager-rensning (när presentation läser från application)

**Vanligt mönster:**
- En presentation-komponent importerar från `application/useCases/`
- Det bryter lager-arkitekturen som CLAUDE.md beskriver

**Refactor:**
- Identifiera vad presentation behöver (oftast en value)
- Flytta logiken till en domain-service eller selector
- Presentation importerar bara från `domain/`
- Application anropas via store-action, inte direkt

---

## Vad refactor INTE är

- **Inte att skriva om från scratch.** Refactor är att flytta, dela, namnge om — inte att börja från noll.
- **Inte att ändra beteende.** Tester måste passera *innan* och *efter* utan ändring. Om testerna måste ändras är det inte refactor utan en feature-ändring.
- **Inte en förevändning för "förbättringar".** Code ska inte introducera nya features eller "smarta lösningar" under refactor. Bara strukturell rensning.
- **Inte ad hoc.** Det här dokumentet finns för att refactor ska vara strukturerat — granskning först, plan sen, exekvering med tester innan/efter.

---

## Hur Code rapporterar refactor till Jacob

Före refactor:
> "Hittat <X> i Typ B-granskning. Förslag: extrahera till <Y>. Berör <N> filer. Tester ändras inte. Får jag köra?"

Efter refactor:
> "Refactor klar. <X> filer ändrade. Tester passerar oförändrat. Filstorlek: <före> → <efter>. Commit: <hash>."

**Viktigt:** Refactor får aldrig kombineras med feature-ändring i samma commit. En refactor-commit ska vara *behaviorally identical* — bara struktur ändras.

---

## Schemalagd granskning

Default-schema framåt:

| Tillfälle | Typ | Tid |
|---|---|---|
| Efter varje sprint | A (filstorlek) | 15 min |
| Var 3:e sprint | B (duplicering) | 30 min |
| Inför ny komplex feature | C (kontextuell, fokuserad på området) | 45 min |
| Inför större refactor | C (full kontextuell) | 60+ min |

Code initierar dessa själv när de uppfylls. Rapporterar fynd till Jacob.

---

## Kopplingar till andra dokument

- **CLAUDE.md** — verifieringsprotokoll och designprinciper. När en ny återkommande regression upptäcks, lägg till i CLAUDE.md.
- **LESSONS.md** — för buggmönster som upptäcks under granskning.
- **DECISIONS.md** — för arkitektur-beslut tagna i samband med refactor.
- **ATGARDSBANK.md** — för medium-prioritets fynd som inte är akuta.

---

## Slut CODE_REVIEW_PROCEDURE
