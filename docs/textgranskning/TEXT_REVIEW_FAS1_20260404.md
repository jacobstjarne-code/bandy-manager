# Textgranskning: Fas 1 — Grundförbättringar
Datum: 2026-04-04
Granskare: Erik

## Nya texter att granska

### src/application/useCases/roundProcessor.ts (marknadsvärde-notiser)

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| 1020 | "📈 {namn} — marknadsvärde +{X} tkr" | |
| 1021 | "Nytt värde: {X} tkr (+{Y}%)" | |
| 1020 | "📉 {namn} — marknadsvärde -{X} tkr" | |

### src/domain/services/attributeVisibility.ts (CA-display)

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| — | "~{CA}" (tilde-prefix på estimerade värden) | |
| — | "?" (okänd spelare) | |

### src/presentation/screens/TransfersScreen.tsx (budget-widget + labels)

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| — | "🔍 Scoutbudget:" | |
| — | "Styrka ?" (okänd fri agent) | |

### src/domain/services/events/politicianEvents.ts (pronomen-fix)

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| 180 | "{namn} ringer och vill diskutera kommunens bidrag. {Hon/Han} oroar sig för föreningens ekonomi." | |
| 187 | "{namn} vill att föreningen satsar mer på ungdomar. {Hon/Han} ser positivt på bandyskolan." | |
| 193 | "{namn} vill att kommunen syns med laget. {Hon/Han} ser er som ett varumärke för regionen." | |
| 249 | "{namn} hör av sig diskret. {Hennes/Hans} {systerdotter/brorson} är en ung talang..." | |
| 253 | "Klart, välkommen att prova" | |

## Att tänka på vid granskning

- Stämmer bandyterminologin? (skridskoåkning, inte löpning)
- Låter det som P4-radio / Bandypuls, inte AI?
- Är ortsnamn och företagsnamn rimliga?
- Är tonen rätt för situationen?
- Språkfel, stavfel, konstiga formuleringar?

## Instruktion till Erik

Fyll i "Eriks kommentar"-kolumnen med:
- ✅ (ok)
- ❌ {föreslagen ändring}
- ⚠️ {fråga/tveksamt}

Returnera filen till Jacob.
