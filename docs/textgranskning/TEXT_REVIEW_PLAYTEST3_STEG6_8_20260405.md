# Textgranskning: Playtest-fixspec 3 — Steg 6-8
Datum: 2026-04-05
Granskare: Erik

## Steg 6 — Dashboard liv

### LastResultCard.tsx

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 1 | "🎉 Storstilat!" (4+ mål vinst) | |
| 2 | "😊 Kontrollerad seger" (2-3 mål vinst) | |
| 3 | "😅 Tight vinst" (1 mål / straffar / övertid) | |
| 4 | "😐 Poängdelning" (oavgjort) | |
| 5 | "😤 Nära men inte nog" (1 mål förlust) | |
| 6 | "😞 Tungt" (2-3 mål förlust) | |
| 7 | "💀 En kväll att glömma" (4+ mål förlust) | |

### DashboardScreen.tsx

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 8 | "Slutspelszonen" (plats 1-8) | |
| 9 | "Utanför slutspel" (plats 9-10) | |
| 10 | "Nedflyttningszonen" (plats 11-12) | |

## Steg 7 — Patron intro

### patronEvents.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 11 | "💼 {namn} visar intresse" (titel) | |
| 12 | "{namn} från {företag} har hört om er förening och vill diskutera ett samarbete." | |
| 13 | "Jag har alltid brunnit för bandy. Ni gör ett fantastiskt jobb — jag vill hjälpa till." | |
| 14 | "Välkomna samarbetet" — "🤝 Patron-relation startar · 💰 bidrag varje säsong" | |
| 15 | "Tack, men vi tar det lugnt" — "🤝 Relation startar försiktigt" | |

## Steg 8 — Träning

### TrainingSection.tsx

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 16 | "Ställ in intensitet för varje träningsområde. Högre = snabbare utveckling men ökad skaderisk." | |
| 17 | Profilknappar: "Lätt" / "Balanserat" / "Intensivt" | |

## Tab-beskrivningar (från navigation-steg)

### TransfersScreen.tsx

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 18 | "Spelare som är tillgängliga för transfer just nu." (marknad) | |
| 19 | "Utvärdera spelare eller sök nya talanger." (scouting) | |
| 20 | "Förläng avtal med dina spelare innan de löper ut." (kontrakt) | |
| 21 | "Kontraktslösa spelare som kan värvas utan transfersumma." (fria) | |
| 22 | "Sätt dina spelare till salu på marknaden." (sälj) | |

### ClubScreen.tsx

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 23 | "Klubbkassa, budget, intäkter och utgifter." (ekonomi) | |
| 24 | "Lokalstöd, sponsorer, patron och föreningsaktiviteter." (orten) | |
| 25 | "Ungdomslag, talangutveckling och intag." (akademi) | |

## Att tänka på

- Låter emoji-sammanfattningarna (steg 6) rätt?
- Är patron-citatet (steg 7) naturligt?
- Funkar "Balanserat" som profil-namn?

Returnera filen till Jacob.
