# Textgranskning: Fas 6 — Kvarvarande features
Datum: 2026-04-05
Granskare: Erik

## Nya texter att granska

### src/domain/services/bandyGalaService.ts

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| — | "🏆 Bandygalan" (event-titel) | |
| — | "Bandygalan {år} — årets prisutdelning!" | |
| — | "{klubb} har {X} pristagare!" | |
| — | "Gå på galan — visa upp klubben" | |
| — | "Skippa — fokusera på träning" | |
| — | "🏆 {namn} vann {pris}!" (inbox) | |
| — | "{namn} vann {pris} på Bandygalan {år}" (storyline) | |
| — | Priser: "Årets spelare", "Årets forward", "Årets målvakt", "Årets nykomling", "Årets veteran" | |

### src/domain/services/pressConferenceService.ts (storyline-frågor)

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| — | "Ingen trodde på er i augusti. Nu leder ni serien. Vad säger du till tvivlarna?" | |
| — | "Kaptenen tog ton i omklädningsrummet förra veckan. Har det gett effekt?" | |
| — | "Varslet drabbade era spelare hårt. Hur har klubben hanterat situationen?" | |
| — | "{namn} slutade jobbet för att satsa på bandyn. Har det betalat sig?" | |

### src/presentation/components/club/TrainingSection.tsx

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| — | "👷 Jobbpåverkan" | |
| — | "{X} heltidsproffs (full träningseffekt) · {Y} deltidsspelare" | |
| — | "⚠️ Låg flexibilitet — deltidsspelare får sämre träningseffekt" | |

### src/presentation/screens/TransfersScreen.tsx

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| — | "🔥 {X} klubbar intresserade" (värvningsrykte) | |

## Att tänka på vid granskning

- Stämmer bandyterminologin?
- Låter det som P4-radio / Bandypuls, inte AI?
- Är Bandygala-priserna rimliga? Saknas något?

## Instruktion till Erik

Fyll i "Eriks kommentar"-kolumnen med ✅, ❌ {föreslagen ändring}, eller ⚠️ {fråga}.
