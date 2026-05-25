# HANDOFF — #5 Skade-narrativet

**Från:** Design-Claude
**Datum:** 2026-05-23
**Mock:** `docs/mockups/2026-05-23_design_skade_narrativ.html`

## TL;DR

Skador är idag en siffra. Mocken introducerar bandydoktorn (Henrik), rehab-progression i 4 stadier, långtidsskada-arc med timeline-sparkline, och DoktorSecondary i Portal.

## Komponenter

- **Bandydoktor-scen** (Henrik talar) vid skada-inträffande
- **Rehab-progression**: VILA → LÄTT → FULL → MATCH (4 stadier)
- **Långtidsskada-arc** (12+ omg) med timeline-sparkline över återkomst-stadier
- **DoktorSecondary** i Portal — subtila Henrik-citat med cooldown 2 omg

## Karaktär Henrik

Namngiven per save (som journalisten). `game.bandydoctor: { name, yearsAtClub, style }`. Liten karaktär men finns. Bandysvenskt understatement.

## Spela-på-mekanik

När Henrik säger N veckor och spelaren väljer spela: 40% risk att förlängas + −25% prestanda. Hård val. "Han måste vara med på derbyt"-känslan.

## Datakrav

`Player.injury: Injury | null` ersätter `injuryReturnRound`. Injury har: type, stage, startedRound, estimatedReturnRound, narrative: string[].

## Konsekvenser

- `InjuryStatusSecondary` mer informativ (visar stadie)
- SquadScreen player-rows får rehab-progression-track
- Inbox får skade-uppdateringar med Henrik-citat
- Långtidsskador kvalificerar för `MemoryEvent` (klubbminne, sig 60+)

## Designval LÅSTA av Jacob 2026-05-23

| Q | Beslut |
|---|---|
| Q1 scen vid varje skada / >3 omg | **Bara >3 omg.** Henrik vid varje stukning trubbar av. Småskador stannar som inbox-rad. |
| Q2 Henrik från första / etableras långsamt | **Från första.** Som journalisten — namngiven per save, finns dag ett. Konsekvent med befintligt mönster. |
| Q3 behandlingsval vid långtidsskada | **Ja — prioritera det.** Spela-på-mekaniken (40% förlängning + −25% prestanda) är spårets bästa idé. Behandlingsval förstärker den. Narrativet blir beslut, inte notis. |
| Q4 4 stadier eller 5 (MENTAL) | **Fyra räcker.** VILA→LÄTT→FULL→MATCH. MENTAL öppnar en psykologi-axel — eget spår med egen mock om det ska finnas. |

## Designval öppna

1. Skade-scen vid varje skada eller bara > 3 omg?
2. Henrik talar från första — eller etableras långsamt?
3. Långtidsskada — får spelaren välja behandling?
4. 4 rehab-stadier räcker eller behövs MENTAL som 5:e?

## Estimat

~8.5h Code + ~40 Opus-strängar.

— Design-Claude, 2026-05-23
