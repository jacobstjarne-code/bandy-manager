# HANDOFF — C-FT1 (a) Trötthets-synlighet

**Från:** Design-Claude
**Datum:** 2026-05-23
**Svarar på:** Opus DESIGN_OVERLAMNING_2026-05-22 punkt 3 (delfråga a)

## TL;DR

25,5pp-effekten är osynlig idag. (b) symmetri och (c) balans är speldesign — utanför mitt territorium. **(a) synlighet är ren design och löses här.** Tre platser visar trötthet, två är nya.

## Tre platser för fitness-synlighet

### 1 · TaktikScreen lineup-rad (NYTT)

Per spelar-rad: en fitness-indikator till vänster om namn. Inte siffra — **mini-bar** i tre färger:

```
[████████░░] J. Lindqvist  · A  · CA 78
[██████░░░░] H. Bergström  · MF · CA 72 ← warm
[███░░░░░░░] O. Andersson  · B  · CA 64 ← danger (50% effektivitet)
```

Vid danger-state (< 40%): text-undertext **"Hård match · vila rekommenderas"** under spelaren.

### 2 · Pre-match-varning på MatchScreen (NYTT)

Om managed har **3+ spelare i danger-state**, eller **avg fitness < 60%**, visa en banner före "Starta match"-knappen:

```
┌──────────────────────────────────────┐
│ ⚠️ TRUPPEN ÄR TRÖTT                  │
│ 4 spelare under 60% fitness.         │
│ Roteringsförslag tillgängligt.       │
└──────────────────────────────────────┘
```

Banner-färg `--warm` (märkbar), inte danger. **Bandysvenskt: varnar utan att skrika.**

### 3 · SquadStatusMinimal i Portal (UPPDATERA)

Idag: "22" i Portal-bar. **Föreslag**: ersätt med mini-sparkline över team-avg-fitness senaste 5 omg. Klickbart → TaktikScreen.

## Datakrav

Fitness-värdet finns redan på `Player.fitness` (verifierat). Inget nytt på Player. **Nytt:** `game.teamFitnessHistory: number[]` (snapshot per omg för sparkline).

## Designval öppna

**Q1:** Mini-bar (10-segment) eller en kontinuerlig stapel? Föreslag: 10-segment, läses snabbt.

**Q2:** Banner-trigger-tröskel: 3 spelare < 60%? Eller > 30% av truppen? Föreslag: räkna starting-eleven (inte hela truppen).

**Q3:** Visa exakt fitness-siffra eller bara färg + label? Föreslag: bara färg + label tills spelaren tappar in på rad → siffra visas.

## Estimat

Mini-bar på lineup: ~1h<br>
Pre-match-varning: ~30 min<br>
SquadStatusMinimal-uppdatering med sparkline + history-pipeline: ~1h<br>
**Total:** ~2.5h Code.

Levereras efter score-primitiverna är wired (mini-sparkline återanvänds).

— Design-Claude, 2026-05-23
