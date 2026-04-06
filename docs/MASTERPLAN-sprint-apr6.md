# MASTERPLAN — Bugfix + Feature Sprint 6–7 april 2026

## Ansvarig: Opus (granskning, direktfixar, specskrivning)
## Utförande: Code (specs som kräver build/test)

---

## STATUSÖVERSIKT

### Redan specade (redo för Code)
| Spec | Status | Prio |
|------|--------|------|
| SPEC-publik-attendance.md | Redo | Medel |
| SPEC-orten-narrativ.md | Redo | Hög |
| SPEC-cup-screen.md | ✅ Implementerad av Code | Done |
| SPEC-matchresultat-konsolidering.md | Redo | Medel |
| FIXSPEC-orten-kommun-ui.md | Delvis implementerad | Hög |

### Opus fixar direkt (denna session)
| # | Fix | Status |
|---|-----|--------|
| D1 | Event-konsekvenser synliga i EventOverlay | ⬜ |
| D2 | Storylines i matchkommentarer | ⬜ |
| D3 | CupCard → cupen-flik koppling | ⬜ |
| D4 | BoardMeetingScreen OnboardingShell | ⬜ |
| D5 | "rink" → "plan" verification | ⬜ |
| D6 | Scouting-påminnelse i dashboard | ⬜ |
| D7 | politicianLastInteraction → SaveGame-typ | ⬜ |
| D8 | KlubbTab standing-prop cleanup | ⬜ |

### Nya specs att skriva (denna session)
| # | Spec | Prio |
|---|------|------|
| S1 | SPEC-anlaggningsprojekt.md | Hög |
| S2 | SPEC-storylines-payoff.md | Hög |
| S3 | SPEC-spelarhistorik.md | Medel |
| S4 | SPEC-event-konsekvenser.md | Hög |
| S5 | SPEC-scouting-workflow.md | Medel |

---

## IMPLEMENTATION FÖR CODE — Prioritetsordning

### Sprint 1: Synliggör dolda system (mest värde per insats)
1. **SPEC-orten-narrativ.md** — inbox-notiser kommun/mecenat
2. **SPEC-event-konsekvenser.md** — subtitle med ikoner på alla event-val
3. **SPEC-publik-attendance.md** — publik i matchflödet

### Sprint 2: Visuell polish
4. **FIXSPEC-orten-kommun-ui.md #7** — spelarkort overlay
5. **SPEC-matchresultat-konsolidering.md** — tre vyer → en design
6. **SPEC-storylines-payoff.md** — kommentarer + press refererar storylines

### Sprint 3: Nya features
7. **SPEC-anlaggningsprojekt.md** — startbara projekt i Orten
8. **SPEC-spelarhistorik.md** — mål/matcher per säsong i PlayerCard
9. **SPEC-scouting-workflow.md** — påminnelser + integration

---

## VERIFIERING EFTER VARJE SPRINT

Code kör: `npm run build && npm test`
Opus granskar: render-flöden, prop-kopplingar, designsystem-compliance
Jacob playtester: gameplay-känsla, narrativ payoff
