# HANDOFF — C-SY1 Ticket #1 Efterklang på Portal

**Från:** Design-Claude
**Datum:** 2026-05-23
**Svarar på:** Opus DESIGN_OVERLAMNING_2026-05-22 punkt 4 (C-SY1 #1, kod-verifikation 2026-05-22)

## TL;DR

Datan finns (alla 8 källor verifierade på SaveGame). Komponenten är ren UI + picker-logik. **Score-system-primitiverna passar perfekt här** — använd `<ScoreBlock>` för enskilda minnen, `<Sparkline>` för relations-trend.

## Anatomi

`EfterklangSecondary` — ny Portal-secondary, egen tier mellan primary och vanliga secondaries. Stripe `--cold` (det är ett "minne-eko", inte action).

```
┌─────────────────────────────────┐
│ ⏳ EFTERKLANG · 3 minnen        │ ← cold eyebrow
├─────────────────────────────────┤
│ [2–3] kvarts · Söderfors S2     │ ← ScoreBlock compact + text
│ ↻ Ett år sedan idag.            │ ← memory-row-eko
├─────────────────────────────────┤
│ 📰 Helena ringde efter 3-1      │ ← icon + text
│ Relation: ──╱── ●               │ ← Sparkline mini
└─────────────────────────────────┘
```

## Picker-algoritm (designval, ej låst)

`pickEfterklang(game, max=3)`:
- Källor: klackEcho, journalist.memory, pendingFollowUps, bandyLetters, boardObjectiveHistory, nemesisTracker, economicCrisisState, lastRivalSaleMatchday
- Score per item = `recency × vikt × laddning` (justeras)
- Anniversary-kandidat (significance ≥ 70, +1 år) får +30% bonus
- Returnera topp-3 unika typer (ej två journalist-rader)

**Q1 till Jacob:** Är 3 minnen rätt mängd, eller 1-2? För många = brus.

## Tier-val

**Q2:** Egen tier, eller secondary?

**Föreslag:** Secondary med högre vikt (75-80). Ger `--cold`-stripe-undantag dokumenterat som "memory/eko-domän". Inte ny tier — tier-systemet får inte växa per feature.

## Estimat

`EfterklangSecondary` + picker + integration: ~2h Code. Använder befintliga primitiv från score-system + R5 anniversary. **Levereras efter score-primitiverna är wired.**

— Design-Claude, 2026-05-23
