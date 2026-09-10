# HANDOFF — Polish 4/5: Nudges (prioritering + tak)

**Från:** Design
**Till:** Code
**Pairas med mock:** `Polish-nudges.dc.html`
**Grundfynd:** Grind 3 — Portalen översköljs, uppskjuten beslutskö växte till 44
**Bygger på:** R1 decision-fatigue (queue-rail, pressure-states, åldrade chips). **Ingen ny mekanik.**

---

## 0 · TL;DR

Nudge-pillsen är del av Portalens överbelastning: alla staplas, alla väger lika, inget tak — så kön räknar upp till 44 och blir en fråga i sig. Polishen ger dem **prioritering + tak**: högst 3 pills visas, valda på urgency × ålder; resten kollapsar till **en dämpad överflödesrad** med en triage-väg. Ett lock på flödet, inte en ny komponent.

---

## 1 · De tre fixarna

| Problem idag | Fix |
|---|---|
| Inget tak → oändlig lista | **Tak vid 3** synliga pills, alltid |
| Platt vikt → brådskande drunknar | **Prioritering** urgency × ålder; topp-pill får kind-stripe (`--accent`/`--warm`/`--cold`) |
| Kön ber aldrig dig välja bort | **Överflödsrad** kollapsar "+41" till en dämpad rad + "Gå igenom →" triage |

Klarad nudge faller ur kön med grönt `✓` (§15 — samma färg @ full, aldrig separat blekt tillstånd). Belöningen syns.

---

## 2 · Prioriteringsregeln

```
score = urgency(nudge) * ageWeight(omgångar_i_kö)
```

- `urgency`: hård deadline (kontrakt löper ut, transferfönster stänger) > mjuk (press, orten).
- `ageWeight`: R1:s åldrings-trappa — aged-1 (warm) vid 3+ omg, aged-2 (danger) vid 5+.
- Topp 3 på score renderas som pills; resten in i överflöd. **Taket är hårt** — 3, oavsett kölängd.

---

## 3 · Vokabulär (ärvt från R1, oförändrat)

- **queue-rail** med pressure-state: `accent` (lugn) → `warm-pressure` → `hot-pressure` (kön röd). Räknaren visar nu "3 nu · 41 kan vänta" i stället för bara "44".
- **qr-chips** åldrade (aged-1/aged-2) + en `chip.more` (streckad, dämpad) för kollapsade kategorier.
- **nudge-pill**: card-sharp inline, 2px kind-stripe vänster, chevron `›` affordans (DS: tappable = chevron).

Token-not: `--warm` för aged-1-text via `color-mix`, `#E8A090` för aged-2 (samma som R1). Inget `--warm-light`/`--gold` (finns ej i DS).

---

## 4 · Frusna parametrar (mock)

Mars · hot-pressure (kön röd). **Variation:** byt pressure → rail-färg skiftar (accent → warm → hot) via R1-klasser; byt kön → topp-3 räknas om, taket står. Prioritering och tak är konstanta över alla tillstånd.

---

## 5 · Implementation

- `prioritizeNudges(queue)` → `{visible: top3, overflow: rest}`. Ren sortering, ingen ny state.
- Rendera max 3 pills + överflödsrad om `overflow.length > 0`.
- "Gå igenom →" öppnar en triage-vy (kan vara befintlig inkorg med filter) — medvetet tömmande, inte auto-dismiss.
- `✓`-fall: när en nudge klaras, animera ut med grönt (fadeIn-omvänt, 220ms), räknaren dekrementerar.
- Estimat: ~1h (sortering + tak + överflödsrad + ✓-fall).

---

— Design
