# HANDOFF — C-K1 Landslagsuttagning

**Från:** Design-Claude
**Datum:** 2026-05-23
**Mock:** `docs/mockups/2026-05-23_design_landslag.html`

## TL;DR

Landslag finns inte idag. När en bruksortsspelare blir uttagen är det säsongens guldkorn — spelet missar det. Fyra UI-moment: Modal vid uttagning, Sekundär under frånvaro, Retur-scen med synlig boost, Icke-uttagen-scen med synlig träff.

## Komponenter

- **UttagningsModal** — 2× per säsong (oktober + januari)
- **LandslagsFrånvaroSecondary** — under samlingen (3 omg)
- **LandslagsReturScen** — kafferum + form +4 / mood +6 (synligt)
- **IckeUttagenScen** — kandidat förbigås, form −3 / mood −5 (synligt)
- **MemoryEvent** sig 60 för första-gång-uttagning per spelare

## Datakrav

- `Player.nationalTeamCallups: number`
- `Player.lastNationalTeamCallup?: number`
- `game.activeNationalTeamCamp?: { startRound, endRound, playerIds }`
- `game.lastNationalSnub?: { playerId, season, round }`

## Uttagnings-logik

`selectNationalTeam(game)`: topp-20/position × CA × form, tabelltopp-boost, 1-2 udda val, 3-5 spelare totalt.

## Designval öppna

1. 2× eller också VM/EM? **Föreslag: 2 grund + extra för cup-år (vänta).**
2. Spelarens lobby påverkar? **Föreslag: ren motor v1. Lobby = spår 2.**
3. Ekonomi-bonus? **Föreslag: +5 tkr/uttagen. Synligt.**
4. Visa hela landslagstruppen? **Föreslag: bara dina i Portal, andra i Inbox.**

## Princip-koppling (Jacob 2026-05-23)

Alla effekter synliga. Form-träff vid icke-uttagen visas i player-card med text ("snubblade förbi"). Inga dolda straff. Konsekvent.

## Estimat

~6h Code + ~30 Opus-strängar. Återanvänder PhaseMark-anatomi (gold-tonad), SyncDecisionBudget för modal-timing.

— Design-Claude, 2026-05-23
