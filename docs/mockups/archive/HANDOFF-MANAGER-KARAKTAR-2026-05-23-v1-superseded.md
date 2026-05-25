# HANDOFF — #4 Manager som karaktär

**Från:** Design-Claude
**Datum:** 2026-05-23
**Mock:** `docs/mockups/2026-05-23_design_manager_karaktar.html`

## TL;DR

Manager (Sture/Margareta) får en plats i spelet: profil, burnout-mätare, tränaravtal, coach-rivalry. Stort spår — föreslå dela i två fas.

## Komponenter

- **Manager-profil-card** i ClubScreen ny "Tränare"-tab
- **Burnout-sparkline** över senaste omg (använder score-system `<Sparkline>`)
- **BurnoutMark** i Portal — pendant till PhaseMark, danger-tonad
- **Coach-rivalry-block** med H2H-rekord + karaktärs-citat
- **Tränaravtal** med förlängning, anbud, GameOver-konsekvens

## Datakrav

Ny entity: `ManagerProfile` med name, age, hometown, contractUntilSeason, monthlySalary, burnoutHistory: number[], careerRecord, coachRivalries.

## Burnout-formel

Per omgång:
- Decision-fatigue × 0.3
- Förluster senaste 3 omg × 10 vardera
- Inbox-pendingar × 2
- Återhämtning vid vinst: −5
- Drift mot 0 utan tryck

≥ 70 i 2+ omg → BurnoutMark triggas. Konsekvens: team-mood −10 eller "paus-omg".

## Fas-uppdelning

**Fas 1 (5h):** Profil + burnout + tab + BurnoutMark
**Fas 2 (5.5h):** Tränaravtal + coach-rivalry + förlängningsbeslut

## Designval öppna

1. Bio förändras över tid (familj flyttar, etc.) eller statisk?
2. Burnout mjuk eller hård (GameOver-risk)?
3. Coach-rivalry-citat — Opus pool eller LLM?
4. Spelaren ser sig själv åldras i bio?

## Estimat

~10.5h Code + ~30 Opus-strängar. Stort. Levereras efter Q1-Q4 bekräftade.

— Design-Claude, 2026-05-23
