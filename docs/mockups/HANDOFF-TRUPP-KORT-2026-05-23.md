# HANDOFF — Trupp-kort audit + redesign

**Från:** Design-Claude
**Datum:** 2026-05-23
**Mock:** `docs/mockups/2026-05-23_design_trupp_kort.html`

## TL;DR

Audit av `SquadScreen.PlayerRow` (rader 65-260) + relaterad `PlayerCard.tsx`. Kortet är informativt men **aktiverar inte systemen runt sig**. Inga signaler för skade-narrativ, landslag, lobby, moral. Redesign bevarar density, adderar systemkopplingar via border-stripe + chips + sparkline.

## Audit-fynd (10 punkter)

| # | Sev | Fynd |
|---|---|---|
| 1 | 🟥 | Ingen skade-integration (#5) — bara "Skadad"-pill, inget om diagnos/stadie/vecka |
| 2 | 🟥 | Ingen landslags-signal (C-K1) — uttagna spelare osynliga i listan |
| 3 | 🟥 | Ingen lobby-signal (Manager v1) — spelare som tjatar syns inte |
| 4 | 🟧 | CA-block utan trend — bara siffra + delta, ingen vart-är-vi-på-väg |
| 5 | 🟧 | Form/Kond redundant med CA-delta — tre datapunkter för samma trend |
| 6 | 🟧 | Inga moral-signaler — `Player.morale` finns men visas inte (osynligt straff) |
| 7 | 🟨 | Kontrakt-info bara i modal — borde vara chip |
| 8 | 🟨 | Inga inline-actions — varje åtgärd kräver modal |
| 9 | 🟨 | Ingen border-stripe-konvention — saknar visuell ålders-/role-signal |
| 10 | 💎 | Bevaras: portrait, namn, nummer, captain-indikator, klick→modal |

## Designsystem-konsistens

**Border-stripe (3px left):**
- Utvecklas (<24) → `--cold`
- Peak (24-30) → `--success`
- Avtar (>30) → `--text-muted`
- Skadad → `--danger`
- Lobby/surar → `--warm`
- Captain → `--accent`

Konflikthantering: skada > ålder > captain. En färg per kort.

**Chip-system (7 varianter):**
`injury > suspended > lobby > contract-exp > national > morale-low > pro/dayjob > role`. Max 4 per kort (prioriterad listed).

**Score-primitiv:** Mini-sparkline (56×12) över CA-trend ersätter Form-bar. Stroke per riktning.

## Spellogik-aktiveringar

| System | Idag | Med redesign |
|---|---|---|
| Skade-narrativ (#5) | "Skadad"-pill | Diagnos + stadie + vecka inline |
| Landslag (C-K1) | Inget | Gold chip + lobby-chip för förbigångna |
| Manager v1 | Inget | Lobby-chip = spelare som tjatar/begär |
| Decision-fatigue (R1) | Inget | Lobby-decisions köas — chips här, queue i Portal |
| Score-system | Två bars | Mini-sparkline över CA, första trupp-migrering |
| Klubbminne | Inget | Captain + landslag bidrar till MemoryEvent-significance |
| Transfers | Modal | Inline contract-exp chip + Förläng-action |

## Inline-actions (tap → expand)

4 knappar contextuellt: Prata · Förläng (bara om utgående) · Sätt i lineup (bara taktik-tab) · Öppna profil →. Modalen behålls för djuplodning.

## Designval öppna

1. Lobby-copy: Opus-pool kategoriserad per motiv (lön/uttagning/spel-tid)?
2. Landslags-chip alltid (career) eller bara under samling?
3. Sparkline över CA eller form? **Föreslag:** CA-trend = karriär.
4. Inline-actions: max 4, kontextprioriterade?

## Migration-prioritet

1. Kosmetisk refaktor (border-stripe + chips + sparkline) — ~2h, fungerar isolerat
2. Skade-integration — ~1h, beror på #5
3. Lobby-chips — ~1.5h, beror på Manager v1 + R1
4. Landslags-chip — ~30 min, beror på C-K1
5. Inline-actions — ~1.5h, sista efter playtest

**Total:** ~7.5h spridda Code.

## Princip-koppling (Jacob 2026-05-23)

Hela redesignen följer "mjukt och synligt före hårt och dolt": morale, lobby, skade-stadie och kontraktsutgång blir alla **synliga signaler** istället för dolda mekaniker. Spelaren ser konsekvenserna innan de drabbar.

— Design-Claude, 2026-05-23
