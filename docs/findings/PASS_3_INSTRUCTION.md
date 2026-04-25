# PASS_3_INSTRUCTION — Validator-skript

**Skapad:** 2026-04-25
**Förutsätter:** Pass 1-2 klara (59 facts ligger i `docs/findings/facts/`)
**Levereras till:** Code

---

## VAD SKRIPTET GÖR

Tre saker, i ordning:

1. **Schema-validering.** Varje YAML-fil i `docs/findings/facts/**/*.yaml`
   och `docs/findings/hypotheses/**/*.yaml` måste ha de obligatoriska
   fälten enligt SCHEMA.md (fact_id, category, claim, verified_at,
   verified_by, status). `category` och `status` måste vara giltiga
   enum-värden.

2. **Invariant-check.** För varje fact, kör de invarianter som finns
   listade i `invariants:`-fältet:
   - Numeriska bounds (t.ex. `value > 60`) — exekveras direkt
   - Cross-fact (t.ex. `value >= S004.value`) — slå upp S004,
     jämför värden
   - Code-cross-reference (t.ex. `no_code_path_uses_yellow_card`) —
     parkerad enligt SCHEMA.md. Markeras som "skipped" i rapporten,
     felar inte.

3. **Rapport.** Skriv en markdown-fil
   `docs/findings/AUDIT_<datum>.md` med resultatet.

---

## KÖRNING

```bash
npm run check-facts
```

(Eller python-motsvarighet om Code väljer Python. TS-tooling är
naturligare i projektet.)

Returnerar exit code 0 om allt ok, 1 om någon invariant bryts eller
schema är felaktigt.

---

## RAPPORT-FORMAT

```markdown
# AUDIT 2026-04-26

**Resultat:** ✅ 59/59 facts validerade
**Skipped invariants:** 4 (code-cross-reference, ej implementerade)

## Per kategori
| Kategori | Antal | Schema OK | Invarianter OK |
|----------|-------|-----------|----------------|
| rules    | 25    | 25        | 23 (2 skipped) |
| stats    | 16    | 16        | 16             |
| ...      |       |           |                |

## Brutna invarianter
(Tom om allt ok)

## Skipped invarianter
- R011: no_code_path_uses_yellow_card (code-cross-reference, parkerad)
- ...
```

Vid brutna invarianter — en sektion per fact med:
- Fact-ID
- Vilken invariant som brötss
- Aktuellt värde vs förväntat

---

## STOP-CRITERIA

- [ ] Skriptet kör utan att krascha mot existerande 59 facts
- [ ] Schema-validering rapporterar 59/59 ok
- [ ] Invariant-check producerar en rapport (oavsett om alla
      invarianter passerar eller inte)
- [ ] Rapporten skrivs till `docs/findings/AUDIT_<datum>.md`
- [ ] Skriptet är dokumenterat i README eller liknande så Jacob
      kan köra det själv

Jacob läser rapporten. Om allt ok — UI-sprinten startar.

---

## VAD SKRIPTET INTE SKA GÖRA

- Inte modifiera facts (read-only)
- Inte uppdatera `verified_at` automatiskt
- Inte föreslå nya invarianter
- Inte rendera HTML — det är UI-sprintens jobb
- Inte hämta nya datakällor — facts är källan
