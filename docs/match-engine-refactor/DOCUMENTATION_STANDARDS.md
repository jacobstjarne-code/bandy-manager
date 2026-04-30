# Dokumentations- och arbetsprinciper för matchmotor-refactorn

Projektet ärver alla principer från Bandy Manager. Det här dokumentet lyfter
fram de som är mest relevanta för refactor-arbete, med exakta lärdomar ur
LESSONS.md och CLAUDE.md som bakgrund.

---

## Sessionsstart — obligatorisk läsning

1. `docs/LESSONS.md` — 23 återkommande buggmönster. Läs inte sammanfattningar;
   läs hela posten för mönstret du tror är relevant.
2. `docs/match-engine-refactor/PURPOSE.md` — vad projektet är och inte är, etapp-mål.
3. Aktuellt etapp-dokument (`docs/match-engine-refactor/etapp_NN_spec.md`).

---

## Rotorsak före fix

Innan kod ändras för att fixa en bugg: formulera i en mening VARFÖR buggen
uppstod. Om formuleringen är vag — läs mer kod.

Commit-meddelande ska innehålla rotorsaken:

```
fix: homeMode applicerades globalt — rot: managed-gate dolde per-lag-logik
för stress-test (LESSONS #15)
```

Inte:
```
fix: homeMode-beräkning uppdaterad
```

---

## Managed-gate-principen (refactor-specifik)

Fysik-logik FÅR INTE ligga innanför `if (managedIsHome !== undefined)`.
Det gör den osynlig i stress-test och omöjlig att kalibrera (LESSONS.md #15).

Regel: om logiken ska gälla i kalibreringskörning måste den ligga utanför
managed-grinden. Narrativ och UX-triggers FÅR vara managed-gated. Fysik
aldrig.

---

## Kalibreringskrav mellan varje etapp

Kalibreringskörning mot minst 1000 matcher med motorns faktiska
produktion-defaults — inte skriptets egna initialiserade värden (LESSONS.md #22).

```bash
# Verifiera att skript-default och motorns startvärde matchar INNAN körning:
grep -n "homeAdvantage" scripts/calibrate_v2.ts src/domain/services/matchSimProcessor.ts
```

Rapport sparas som `docs/match-engine-refactor/calibration_etapp_NN.md`.
Försämring i kalibrering mot föregående etapp blockerar nästa etapp.

---

## Självaudit efter varje etapp

Ingen etapp markeras klar utan `docs/match-engine-refactor/AUDIT_etapp_NN.md`.

Mall:

```markdown
# Etapp NN — audit

## Punkter i spec
- [x] NN-A Beskrivning — verifierat i: [konkret output, inte "filen finns"]
- [ ] NN-B Beskrivning — EJ LEVERERAD, orsak: [vad som blockerade]

## Kalibreringskörning
- Antal matcher: 1000
- Rapport: docs/match-engine-refactor/calibration_etapp_NN.md
- Sektioner inom tolerans: A✅ B✅ C⚠️ (gap 2.1pp, motivering)

## Managed-gate-check
grep -n "managedIsHome" src/domain/services/matchCore.ts
[output — ska vara 0 träffar i fysikfunktioner]

## Ej levererat med orsak

## Nya lärdomar till LESSONS.md
```

"Verifierat i" ska vara faktisk observerad output, inte filexistens.

---

## Event-persistens-tabell (refactor-kritisk)

Alla event-emissioner måste följa tabell i LESSONS.md #20.
Persistenta events: `Goal` (med flaggor `isCornerGoal`, `isPenaltyGoal`),
`RedCard` (bandy 10-min utvisning).

Transiente events strippas av `stripCompletedFixture` i roundProcessor.
Bygg aldrig stats-tracking på transiente event-typer — använd flaggor på
persistenta events istället.

```ts
// Fel — Penalty-event strippas
const goals = fix.events.filter(e => e.type === MatchEventType.Penalty)

// Rätt — flaggan överlever strip
const penaltyGoals = fix.events.filter(e => e.type === MatchEventType.Goal && e.isPenaltyGoal)
```

---

## Formelvariablers hävstång (refactor-specifik)

Innan en parameterjustering specas — spåra parametern i formeln och kontrollera
vilken term den faktiskt multiplicerar (LESSONS.md #23).

En modifier som multiplicerar en liten delta-term har minimal aggregerad
effekt även med stora värden. Rätt hävstång är den term som dominerar
formeln i de vanligaste körfallen.

Kontroll:
```ts
// Identifiera vilken term som dominerar goalThreshold i normalfallet
// Logga cornerBase vs (cornerChance - defenseResist) * 0.30 * stepGoalMod * cornerStateMod
// för 100 hörnsituationer
```

---

## Spec-lydnad

- Kopiera spec-given kod bokstavligt. Ändra inget utan att fråga.
- Ändra aldrig spec-givna värden (px, konstanter, sannolikheter).
- Inga "förbättringar" av spec-kod.
- Visa exakt diff efter varje edit. Om diffen inte matchar specen: stoppa och fråga.

---

## Kvalitetsportar före commit

1. **Build + test:** `npm run build && npm test` — commit aldrig broken build.
2. **Managed-gate-grep:** `grep -n "managedIsHome" src/domain/services/matchCore.ts` — 0 träffar
   i fysikfunktioner.
3. **Event-tabell-check:** alla nya event-emissioner verifierade mot
   PERSISTENT/TRANSIENT-tabell i LESSONS.md #20.
4. **Formel-hävstång-spår:** om ny konstant introduceras — visa vilken term
   den multiplicerar och genomsnittligt inflytande.
5. **Dupliceringskontroll:** grep på nyckelkoncept innan ny funktion skapas.
   Träff = läs och återanvänd, bygg inte parallellt.

---

## Commit-konvention

```
fix: [symptom] — rot: [rotorsak] ([LESSONS #N om relevant])
feat: [leverans]
refactor: [vad som ändrades och varför]
calibration: etapp NN — [sektioner och gap]
docs: [vad som dokumenterades]
```

---

## Återkommande buggar

Om samma bugg rapporteras igen:
1. Skriv test som reproducerar buggen
2. Kör testet — bekräfta att det FAILAR
3. Fixa buggen
4. Kör testet — bekräfta att det PASSERAR
5. Commit: `fix: [bugg] — REGRESSION, added test`
6. Uppdatera LESSONS.md med ny historik-rad

---

## Branch-strategi

Refactor-arbete sker på feature-branchar med prefix `refactor/match-engine-NN-namn`.
Merge till main kräver godkänd audit + godkänd kalibreringskörning.

---

## Pre-spec cross-check

Innan ny modul specas:

```bash
# 60-sekunders grep på huvudkonceptet
grep -rn "keyword" src/domain/services --include="*.ts" | head -20
```

Träff → läs den filen innan spec skrivs. Beslut: återanvänd eller ersätt
med dokumenterad anledning. Ingen träff → bygg.

---

## Kalibreringstarget-audit (före motorsprint)

Om kalibreringsgap >10pp utan tydlig motorhypotes — räkna om metriken
från rådata i `bandygrytan_detailed.json` innan sprint specas (LESSONS.md #21).

```bash
node -e "
const d = require('./docs/data/bandygrytan_detailed.json')
// Räkna måttet direkt från rå matchdata
// Jämför mot stored target i calibrationTargets
"
```

Gap mot stored target >2pp = fixa JSON, inte motorn.
