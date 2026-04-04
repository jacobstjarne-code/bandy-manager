# Textgranskning: Fas 3 — Media med personlighet
Datum: 2026-04-04
Granskare: Erik

## Nya texter att granska

### src/domain/services/pressConferenceService.ts (ny vägra-option)

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| — | "Vägra presskonferens" (knapptext) | |
| — | "Tränaren vägrade kommentera efter matchen. Det skickar en signal." | |

### src/domain/services/journalistService.ts (headline-prefix)

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| — | "{namn} i {tidning}: " (supportive, positive) | |
| — | "{tidning} — analys: " (analytical) | |
| — | "{tidning}: SENSATION! " (sensationalist, positive) | |
| — | "{tidning}: KRIS! " (sensationalist, negative) | |
| — | "{tidning} — granskning: " (analytical, negative) | |

### Journalist-namn (genererade vid spelstart)

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| — | Förnamn: Anna, Erik, Karin, Lars, Maria, Peter, Sofia, Johan, Lena, Magnus, Helena, Nils, Camilla, Anders | |
| — | Efternamn: Lindqvist, Bergström, Holmgren, Sandberg, Nordin, Wikström, Eklund, Hedlund, Gustafsson, Johansson | |

## Att tänka på vid granskning

- Stämmer bandyterminologin?
- Låter det som P4-radio / Bandypuls, inte AI?
- Är journalist-namnen rimliga för svenska sportjournalister?
- Är tonen rätt för situationen?

## Instruktion till Erik

Fyll i "Eriks kommentar"-kolumnen med:
- ✅ (ok)
- ❌ {föreslagen ändring}
- ⚠️ {fråga/tveksamt}

Returnera filen till Jacob.
