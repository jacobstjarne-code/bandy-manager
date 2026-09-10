# HANDOFF — Taktiktavlan: viktning + primär-hierarki + uppställning

**Från:** Design
**Till:** Code (implementerar efter dom), Jacob (fäller domen)
**Pairas med mock:** `Taktiktavla-viktning.dc.html`
**Rör:** Förbered → Taktiktavlan. Samlar tre trådar som är samma primär-fråga.

---

## 0 · TL;DR

Taktiktavlan bär redan **uppställning** (SVG-plan) och **viktning** (spakar). Det som inte är löst är **primär-hierarkin**: tavlan visar idag *två* kopparfyllda knappar samtidigt —

- **"Följ rådet"** (`TacticBoardCard`, assistentens rekommendation)
- **"Bäst för dagens match"** (`FormationView`, auto-optimerad XI)

DS §5 säger **en primär per skärm**. Mocken visar tavlan med problemet löst som A/B — samma tavla, olika bärare av kopparn (den andra tonas ner, inte bort).

Domen är Jacobs. Den hänger ihop med Portal-slottens rangordning (`initCardBag`) som **samma primär-regel** — se beslutskort-briefen.

---

## 1 · De tre benen (alla tre finns redan i koden)

| Ben | Komponent | Status |
|---|---|---|
| **Uppställning** | SVG-plan 280×400, arketyp-prickar, kaptensring (guld), ★rekommenderad formation, tom-slot-ring | ✅ Klar — rörs ej |
| **Viktning** | Mentalitet · Tempo · Press som spakar med **beskrivna rytm-konsekvenser** (Spak C), assistent-citat | ✅ Klar — konsekvens-raderna behålls |
| **Primär-hierarki** | De två CTA-knapparna + skärmstängaren | 🟥 Obeslutad — detta är domen |

---

## 2 · Domalternativen (mock 1a / 1b)

### 1a · Assistenten bär primären

- Kopparn ligger på **"✓ Följ assistentens råd"** — ett tryck accepterar rekommenderad XI + spakar.
- **"Ställ upp bäst för dagens match"** blir en outline-genväg (kvar, men tyst).
- Passar den tränarröst som redan präglar Portal, kafferum och pärmen.
- Risk: en van manuell-optimerare kan tycka rådet tar plats.

### 1b · Uppställningen bär primären

- Kopparn ligger på **"⚡ Ställ upp bäst för dagens match"** — mätbar auto-optimering (lagstyrka/trötthet/kemi vägs).
- **"Följ rådet"** degraderas till en textlänk i assistent-citatet.
- Passar spelaren som vill ha kontroll + en snabb "gör det bäst"-knapp.
- Risk: tränarrösten tystnar — assistenten blir verktyg, inte röst.

---

## 3 · Nyckeln till att §5 håller — det ceremoniella registret

Skärmstängaren **SPELA OMGÅNG →** (`.btn-cta`) räknas **inte** som in-content-primär. Den lever i eget ceremoniellt register (versal, radius 12, pulse-affordans). I mocken är det förtydligat visuellt: **in-content-primären är flat koppar** (`--accent-dark`), medan **CTA:n är koppargradienten** (`#DD9555 → #8B4820`). Två register, inte två primärer.

Detta är regeln som också löser rad 2 i beslutskort-briefen: en tredje knappstil (scenens Georgia-pilknapp) är tillåten *om* den är ett dokumenterat ceremoni-register, precis som `.btn-cta` här.

---

## 4 · Kopplingen till Portal-slotten (samma regel)

"En primär per skärm" bryts på Taktik *synligt* (två knappar) och på Portal *över tid* (fel kort vinner primärslotten mellan omgångar — R2-diffarna `primary-event-vs-farewell` och `primary-smfinal-vs-deadline`). Domen på Taktik sätter principen; Portal-slottens rangordning ärver den. Döm dem ihop, inte var för sig.

---

## 5 · Implementation (efter dom)

- Ingen ändring av SVG-planen eller viktnings-spakarna.
- Byt `FormationView`/`TacticBoardCard` så att **exakt en** av de två kontrollerna får `.btn-primary`; den andra `.btn-outline` (1a) eller textlänk (1b).
- Behåll `.btn-cta` för skärmstängaren orörd.
- Ingen visuell baseline rörs innan domen fallit (samma ordning som resten av kön).

---

— Design
