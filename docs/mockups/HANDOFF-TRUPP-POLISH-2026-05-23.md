# HANDOFF — Trupp-kort polish-pass + extra integrationer

**Från:** Design-Claude
**Datum:** 2026-05-23
**Mock:** `docs/mockups/2026-05-23_design_trupp_polish.html`
**Bygger på:** `HANDOFF-TRUPP-SYSTEM-2026-05-23.md`

## TL;DR

Polish-pass över trupp-systemet. Lekfullhet inom 70-talsliggar-vokabulären + sju nya integrationspunkter som föll mellan stolarna.

## Lekfullhets-tillägg

| Tillägg | Bandysvensk förankring |
|---|---|
| Position-shield (heraldisk badge) | Lagets emblem-tradition |
| Captain-band under portrait | Riktiga lag har kaptensband |
| Veteran-ring i guld | 5+ år vid klubben är klubbidentitet |
| Legend-glow (10+ år) | För Magnus-Lindqvist-typer |
| Akademi-pärla | Permanent identitetsmärke |
| Veteran-corner-band ("8år") | Tjänsteår-medalj |
| CA-sparkline area-fill | Mer visuell tyngd |
| Trait-stamps copper | Typografisk stämpel-effekt |

## Sju nya integrationspunkter

| System | Data | Visualisering |
|---|---|---|
| Akademi-uppflyttning | `player.promotedFromAcademy` | Akademi-pärla + trait-stamp |
| Player-traits | `TRAIT_META` (oanvänt idag) | Top-3 trait-stamps |
| Storylines | `player.narrativeLog` | Storyline-rad italic Georgia |
| Klubbveteranskap | `seasonsAtClub` | Veteran-ring + corner-band |
| Anniversary-eko (R5) | `activeAnniversaries` | Eko-rad gold |
| Klacken-favorit | narrativeLog + Klacken-events | Chip "📣 Klacken-favorit" |
| Manager-anteckning | NY: `player.managerNote?: string` | ✎-prefixad italic-rad |

## Manager-anteckning (ny data-modell)

Fri text max 80 tecken per spelare. Sparas i `player.managerNote`. Visas under chips. Editas via long-press eller Modal-knapp.

Bandysvenskt: "Förargad. Förläng innan han hör från Söderfors." — minne för en själv.

## Densitets-disciplin

Ett kort kan visa upp till 12 system samtidigt. Aldrig alla. Prioritet:
1. Alltid: portrait + namn + position-shield + CA + sparkline + stats
2. När aktivt: status-dot + border-stripe
3. När relevant: max 3 trait-stamps + max 2 chips
4. Vid trigger: storyline/anniv/manager-note (en åt gången)
5. Identitetsmärken: veteran-ring, captain-band, akademi-pärla — permanenta

## Vad som INTE adderats

- Mentor-roll → Modal Relationer-tab
- Loan-out → egen vy (utlånade spelare osynliga i trupp)
- Coach-rivalry → Manager-profil-tab
- Patron-favorit → kafferum-scen
- Player-voice quotes → Modal-hero
- Förläng-pågående → bekräfta om chip behövs

## Designval öppna

1. Captain-band placering — under (föreslag) eller över portrait?
2. Veteran-tröskel — år vid klubben (föreslag) eller karriärs-säsonger?
3. Manager-note — fri text (föreslag) eller pool?
4. Trait-stamps — top 3 alltid (föreslag) eller alla?
5. Klacken-favorit — auto från narrativeLog (föreslag) eller manuell?

## Estimat polish-pass

~7.5h Code utöver tidigare trupp-redesign:
- Position-shield + veteran-ring + akademi-pärla + captain-band + area-fill: ~2h
- Trait-stamps + TRAIT_META: ~1h
- Storyline-rad: ~1h
- Anniversary-eko (beror på R5): ~30 min
- Manager-note state + edit: ~1.5h
- Klacken-favorit-mapping: ~1h
- Veteran-corner-band: ~30 min

— Design-Claude, 2026-05-23
