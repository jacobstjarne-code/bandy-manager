# HANDOFF — Trupp-tab fullt system

**Från:** Design-Claude
**Datum:** 2026-05-23
**Mock:** `docs/mockups/2026-05-23_design_trupp_system.html`
**Föregående:** `HANDOFF-TRUPP-KORT-2026-05-23.md` (PlayerRow-fokus, denna utökar)

## TL;DR

Fullt audit av Trupp-tabben — alla fyra ytor: **NU** (status) · **TRUPP** (lista) · **TAKTIK** (formation+kemi) · **PlayerCard-modal** (832 rader djup). Plus portrait-placeholder som förbereder för riktiga karaktärsillustrationer.

## Fyra ytor — vad varje gör

| Yta | Roll | Förslag |
|---|---|---|
| NU | Sammanfattning ("hur mår truppen?") | Squad-pulse-sparkline hero + status-cards med portrait + formation-card |
| TRUPP | Djup spelarlista | Förra handoffens redesign (border-stripe + chip + sparkline) |
| TAKTIK | Formation + relationer | Pitch med kemi-färgkodade dots + kemi-par-rader med sparkline |
| Modal | Historik per spelare | Hero med stor portrait + CA-trend + tabs (Stats/Karriär/Skador/Relationer) |

## Portrait-placeholder

Gradient-cirkel per arketyp + initial + status-dot. Sex varianter:
- finisher (röd) · playmaker (blå) · defensive (grön) · gk (gul) · dribbler (cyan) · twoway (lila)

Status-dot: injury (röd) · lobby (warm) · national (gold) · suspended (röd). Max en åt gången, prioritet `injury > suspended > lobby > national`.

**Övergångsstrategi:** Ny `<Portrait player={p} />`-komponent wrappar både placeholder och kommande riktiga illustrationer. Switchar källa på `player.illustrationUrl`. Befintlig kod behöver inte ändras.

## Audit-fynd över hela systemet

| # | Sev | Yta | Fynd |
|---|---|---|---|
| 1 | 🟥 | NU | 4 sektioner platt — Squad-pulse-sparkline behövs som hero |
| 2 | 🟥 | TAKTIK | Ingen kemi-synlighet trots `chemistryStats` i state |
| 3 | 🟧 | NU | Status-cards utan portrait — bryter konsistens med Trupp |
| 4 | 🟧 | TRUPP | Summary-card statisk — sparkline + portrait för stjärnan |
| 5 | 🟧 | Modal | 832 rader utan tab-struktur |
| 6 | 🟨 | Filter | Chip-konsistens — btn-copper/btn-ghost vs trupp-chips |
| 7 | 🟨 | TAKTIK | Pitch-dots utan kemi-färgkodning |
| 8 | 💎 | Lineup-tabs | Bevara — bara polera stil |
| 9 | 💎 | NU-formation | Bra grund — polera coach-citat-läge |

## Spellogik-aktiveringar (totalt över systemet)

- **Squad-pulse** aktiverar `teamFitnessHistory` (R1 + C-FT1-data) → synlig trötthet
- **Kemi-rader** aktiverar `chemistryStats` → trend över omg per par
- **Status-dot på portrait** → snabbskannning utan att läsa chips
- **Modal-tabs** integrerar #5 Skade-narrativ via "Skador"-tab

## Migration · 6 steg (~11.5h Code)

1. Portrait-placeholder-komponent (~1.5h)
2. Chip-system + border-stripe (~2h) — från förra handoffen
3. NU-vy redesign med Squad-pulse (~2h)
4. TAKTIK kemi-rader (~2h)
5. Modal tab-struktur refaktor (~3h)
6. Summary-card med sparkline (~1h)

Inkrementellt, 3-4 sprintar.

## Designval öppna

1. Squad-pulse-formel — föreslag: viktad fitness×moral×injuries×form, synlig
2. Status-dot — max en, prioriterad listed
3. Kemi-rader — topp 3 + "se alla" länk
4. Modal-tabs — 4 räcker (Lön i Karriär)

— Design-Claude, 2026-05-23
