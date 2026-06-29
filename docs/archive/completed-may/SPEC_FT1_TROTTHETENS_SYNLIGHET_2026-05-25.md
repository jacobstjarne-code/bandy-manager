# SPEC — C-FT1: Trötthetens synlighet (del a) 2026-05-25

**Av:** Opus (äger del a end-to-end, design-i-kod — ingen Design-handoff). **Deadline:** lördag.
**Bakgrund:** Trötthet är mätt utfallsavgörande — utvilad trupp vinner +25,5 pp oftare
(`a70a2b2`, sekvens-test). Effekten *finns* och är inkopplad (fitness → `playerModifier` →
motor, bekräftat i AUDIT_MOTORKOPPLING). Men dess *storlek* syns inte. Backloggen: "viktigast
oavsett balans". Detta är samma tråd som dagens inkopplingsarbete, ett steg upp: mekaniken är
verklig — gör dess magnitud läsbar.

## PROBLEM (perceptionsgapet)
ff4a940 byggde primitiverna: per-spelare FitnessBar (grön ≥70 / warm 40-69 / röd <40),
"Hård match · vila rekommenderas" <40, StartStep-banner "⚠ TRUPPEN ÄR TRÖTT — {n} under 60%",
portal-sparkline. Konditionen *visas*. Men:
- Inget binder trötthet till **konsekvens**. Bannern är ett antal, inte "laget är svagare".
- Ingen **magnitud**. Spelaren ser inte att en trött elva är t.ex. 6 styrkepoäng under sitt tak.
- Ingen **motbild/rotationskrok**. Utan "en utvilad elva vore värd mer" uteblir rotationsbeslutet.

## PRINCIP — ärlig magnitud, inte falsk precision
Visa INTE vinstchans (−25,5% e.d.). 25,5 pp är ett sim-aggregat, motståndarberoende — falsk
precision på en enskild elva. Visa **lagstyrka**: vad tröttheten kostar elvans effektiva styrka
NU, härlett ur exakt den funktion motorn använder.

Beräkning (read-only, rör inte motorn): `evaluateSquad(starters, tactic)` med spelarnas
faktiska fitness → offense+defense-komposit = **lagstyrka idag**. Samma anrop med fitness pinnad
till 100 → **utvilat tak**. Gapet = vad tröttheten kostar, just nu, för just denna elva.
Sant per konstruktion (samma `playerModifier`, fitness×0.6). Räknas om när spelare byts.

## BYGGE (tre delar, design-i-kod)
1. **Lagstyrka-avläsning (magnituden).** På lineup-byggaren + StartStep: kompakt mått
   "Lagstyrka idag: 82 / 88 utvilat" med gapet markerat. Det är orsakskroken konkret:
   orsak (trötthet) → konsekvens (lägre lagstyrka) → storlek (talet), allt ur motorns egen
   funktion. Ordval: undvik "skärpa" (=sharpness) och "form" (=spelarform); använd "lagstyrka"
   / "utvilat". Avgörs i bygget mot känsla.
2. **StartStep-bannern → konsekvens + motbild.** Idag: "{n} spelare under 60%". Nytt: namnge
   konsekvensen och föreslå handlingen — laget ligger ~X under sitt utvilade tak, överväg att
   rotera/vila namngivna spelare. Tröskeln kan stå kvar men copyn binds till det beräknade
   gapet, inte bara antalet. Bandysvensk understatement, Opus skriver den direkt.
3. **Per-spelare "vila rekommenderas" ärlig.** Fyrar idag vid <40 statiskt. Bind den till
   spelarens faktiska bidragsförlust (modifier-delta) så rekommendationen speglar verklig kostnad.
   Litet.

## GUARDRAIL
Aldrig en fabricerad vinst-%-siffra i UI. Endast styrka härledd ur `evaluateSquad`. 25,5 pp lever
som designrationale, inte som UI-tal.

## DEL b + c — SENARE (balans/Code, ej denna vecka)
- **(b) Symmetri.** Backloggen: "generateAiLineup ger AI full styrka oberoende av fitness; AI
  tröttnar aldrig." VERIFIERA FÖRST i kod innan beslut: AI-spelarnas fitness uppdateras av
  playerStateProcessor (alla spelare), och matchCore kör `evaluateSquad` på AI-elvan med deras
  *faktiska* fitness — så asymmetrin kan vara enbart i ROTATION (AI byter inte för att vila), inte
  i att fitness-effekten saknas. Är så fallet är asymmetrin mildare än backloggen antyder. Mät
  innan symmetri-ändring spec:as. Balans/Code.
- **(c) Balans.** −15-25/match mot +8/runda: för brant för en tunn trupp som inte kan rotera?
  Hänger ihop med (a) — när kostnaden syns blir balansfrågan "är den rättvis givet truppdjup".
  Avgörs mot playtest efter att (a) landat. Balans/Code.

## ÅTERANVÄNDBART MÖNSTER (C-SY1-ryggraden)
Orsakskrok = UI-element som binder orsak → konsekvens → ärlig magnitud, där magnituden härleds ur
den faktiska motorfunktionen, aldrig fabriceras. Trötthet är första instansen; kemi och moral kan
återanvända samma mönster (lagstyrka med/utan kemi-modifierare, etc.).

— Opus, 2026-05-25
