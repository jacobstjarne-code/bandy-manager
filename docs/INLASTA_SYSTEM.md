# Inlåsta system — synliggörande-tracker

**Skapad:** 2026-05-06
**Senast uppdaterad:** 2026-05-06

## Rot-problem

Audit:n "Bandy Manager — Genomgång maj 2026" identifierade tio bakomliggande system som finns i kod men aldrig nådde spelaren. Detta är spelets största "vi vet men gör inte"-gap. Jacob har påpekat att system-gapet återkommer trots upprepade flaggor — denna fil existerar för att hindra glömska.

## Princip

**Ingen ny feature-yta påbörjas innan minst 1 inlåst system per session lyfts ett steg i status.**

Sessioner ska alltid avancera trackerns sammanlagda status. Mock + spec räknas som ett steg. Implementation räknas som nästa. Verifierad playtest räknas som tredje. Tio system × tre steg = trettio status-steg som ska klockas av.

## Statusnyckel

- 🔴 Inte adresserat — ingen spec, ingen mock, ingen implementation
- 🟡 Spec + mock klar (Opus levererat, väntar Code)
- 🟠 Implementation klar (Code committat, ej playtest-verifierad)
- 🟢 Verifierad i playtest (Jacob bekräftat synlighet i appen)

## Status-tabell

| # | System | Status | Senast | Spec/Mock | Anteckning |
|---|---|---|---|---|---|
| 1 | `boardObjectiveService` | 🟡 | 2026-05-06 | spec + mock i mockups/ | Opus levererat, Code inventerar API härnäst |
| 2 | `opponentAnalysisService` | 🔴 | — | Planerad | Pre-match-yta, bygger på PreMatchContext |
| 3 | `weeklyDecisionService` | 🔴 | — | Planerad | Loop-fråga: vad gör spelaren mellan matcher |
| 4 | `leadershipService` + `useLeadershipAction()` | 🔴 | — | — | Ledarskapshandlingar på spelare, oklar UI-yta idag |
| 5 | `rumorService` | 🔴 | — | — | Triggas av roundProcessor men oklart synlighet |
| 6 | `playerVoiceService` | 🔴 | — | — | "Prata med spelaren", oklart unikt innehåll |
| 7 | `mecenatDinnerService` | 🔴 | — | — | Entiteter finns, oklart om når spelaren |
| 8 | `hallDebateData` | 🔴 | — | — | Kommunfullmäktige-debatter, data finns |
| 9 | `smallAbsurditiesData` | 🔴 | — | — | Slumpmässiga humorhändelser |
| 10 | `arcService` + storylines | 🔴 | — | — | Visas i SeasonSummary, inte under säsong |

**Sammanlagd status:** 1/30 status-steg klockade.

## Prio-ordning för Opus-leveranser

1. ✅ `boardObjectiveService` (klar 2026-05-06)
2. `opponentAnalysisService` — bygger på PreMatchContext, gameplay-impact pre-match
3. `weeklyDecisionService` — adresserar loop-fråga
4. `leadershipService` — kräver ny UI-yta i spelarvy
5. `mecenatDinnerService` — narrativrik social mekanism
6. `arcService` — synliggör arcs under säsong, inte bara vid slut
7. `rumorService` — passiv synlighet i kafferum/journalist
8. `playerVoiceService` — spelar-dialog som beslutspunkt
9. `hallDebateData` — politisk yta, kräver design-arbete
10. `smallAbsurditiesData` — humor-events, lägst gameplay-impact

## Avhakningsregler

- När spec+mock landat: status → 🟡, datum uppdateras, länkar läggs in i tabellen.
- När Code rapporterar implementation klar: status → 🟠.
- När Jacob bekräftat synlighet i playtest: status → 🟢.
- Endast 🟢 räknas som "klar".
- Om något system regrederar (försvinner från UI igen) → status tillbaka till 🟠 eller lägre.

## Arbetsregler

- **Varje session:** kontrollera tracker först. 
- **Vid playtest:** notera vilka inlåsta system som faktiskt syntes.
- **Vid feature-pitch:** om någon föreslår ny feature medan ≥7 system är 🔴, fråga: kan denna feature vänta tills minst 5 system är 🟡?
