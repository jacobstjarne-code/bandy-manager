# CODE-UPPDRAG — Spelartillstånd → motor: sharpness + moral 2026-05-25

> **STATUS 2026-05-25 — LANDAD (motor v1.4.0, commit eacf801).** Båda inkopplingarna verifierade
> i kod mot spec: sharpness `base × (0.90 + 0.10·sharpness/100)` i `playerModifier`, centrerad vid
> full skärpa = ×1.0; moral via form-drift ±1/omg, neutralzon 30–80. Kalibrering höll: 9.09 vs 9.12.
> **Del 3 (UI-ärlighet) KLAR** — NU-vyns "LÅG MORAL" har en ärlig ram ("tär på formen över tid"),
> prata-med-spelare visade redan formdeltat (ingen ändring behövdes), och PlayerCards STATUS-
> staplar (form/kond/moral/skärpa) blev ärliga av sig själva när alla fyra nu matar motorn.
> Bieffekt: pep-talkets "Tre poäng" → "Två poäng" (bandy-korrekthet).

**Av:** Opus. **Surface:** arkitektur + spec. **Bakgrund:** Audit (`AUDIT_MOTORKOPPLING_2026-05-25.md`)
visade att **moral** och **sharpness** uppdateras varje omgång men inte når motorn på någon väg
(ej i `playerModifier`, squad-poäng, matchCore-styrka eller utveckling). Båda är per-spelare →
hör hemma i `playerModifier`, inte som lineup-multiplikator (det är kemi, separat spec).

**VIKTIGT — verifiering:** detta rör `evaluateSquad` via `playerModifier`, som används både i
matchCore (utfall) OCH i matchEngines matchProfile-härledning OCH ev. i UI-styrkevisning. Bredare
blast-radius än kemi. MÅSTE recalibreras: kör måldistributions-/säsongstesterna. Opus kan inte
köra dem (ingen testkörare i chatten) → spec, inte direktredigering. Bygg atomiskt + recalibrera.

═══════════════════════════════════════════════════════════════════════════
## DEL 1 — SHARPNESS (matchrust) → playerModifier
═══════════════════════════════════════════════════════════════════════════

**Semantik:** sharpness 0-100. Startspelare +10/omg, bänk −5, ej spelat −3. Regelbundna
startspelare ligger nära 100; roterade/comeback-spelare driver ned. En ringrostig spelare ska
prestera något sämre tills han spelat in sig.

**Insättningspunkt:** `squadEvaluator.ts`, funktionen `playerModifier`:
```ts
function playerModifier(player: Player): number {
  const base = (player.form / 100) * 0.4 + (player.fitness / 100) * 0.6
  // Centrerad rust-faktor: full sharpness (100) → ×1.0 (baslinjen, ingen gratis-boost).
  // Låg sharpness → liten straff. Endast rust kostar.
  const sharpnessFactor = 0.90 + 0.10 * (player.sharpness / 100)  // 0.90..1.00
  return base * sharpnessFactor
}
```

**Kalibrerings-egenskap:** en normalt spelande elva ligger nära sharpness 100 → faktor ≈ 1.0 →
säsongssnittet rör sig minimalt. Effekten biter på roterade/nykomna/comeback-spelare. Det är
poängen. **Code:** verifiera att en fullt skarp liga ger oförändrad distribution (10,0 mål/match,
50,7 % hemma). Om snittet sjunker märkbart för att ligan i snitt inte är 100-skarp → höj golvet
(0.92 ist. 0.90) eller centrera mot ligamedel-sharpness istället för 100.

**Spänn (designval):** 0.90-golvet ger max −10 % för en helt kall spelare. *Rek: börja där, tuna
mot playtest. En spelare 3 omg utan match (~85 sharpness) får ~−1,5 %, kännbart men inte brutalt.*

═══════════════════════════════════════════════════════════════════════════
## DEL 2 — MORAL → form-drift (inte direkt styrke-modifierare)
═══════════════════════════════════════════════════════════════════════════

**Designval (Jacob äger):** moral kan kopplas in på två sätt.
- **A (rek): moral → form-drift över tid.** Ihållande låg moral eroderar form långsamt; form är
  redan inkopplat. Inget nytt motor-lager, ingen dubbelräkning, realistiskt.
- B: liten direkt moral-term i `playerModifier`. Snabbare effekt men gör moral till ännu en
  ad-hoc-multiplikator och dubbelräknar mot form.

**Insättningspunkt för A:** `playerStateProcessor.ts`, i `updatedPlayers.map`, EFTER att moralen
uppdaterats (dagjobb/pro-block), lägg en moral-driven form-drift:
```ts
// Moral → form-drift. Routar moral genom den redan inkopplade form-kanalen.
// Liten per omgång — ihållande moral-läge ackumulerar.
if (updated.morale < 30)      updated.form = Math.max(0, updated.form - 1)
else if (updated.morale > 80) updated.form = Math.min(100, updated.form + 1)
// 30-80: ingen drift (neutralzon, undviker brus)
```

**Varför inte direkt:** spelet har redan en tydlig arbetsdelning — form = on-pitch-valuta,
moral = off-pitch (tillgänglighet/lobby/transfers/kapten-kaskad). Att routa moral→form gör
UI-löftet sant ("låg moral skadar laget") utan att kollapsa de två valutorna till en.

**Kalibrering:** form-drift ±1/omg är litet men ackumulerar. **Code:** verifiera att det inte
systematiskt inflaterar/deflaterar form över en säsong (de flesta spelare ligger 30-80 = ingen
drift). Om för stark hävstång → kräva 2 omg i låg-zon innan drift, eller drift 0.5.

═══════════════════════════════════════════════════════════════════════════
## DEL 3 — UI-ärlighet (oavsett wiring)
═══════════════════════════════════════════════════════════════════════════

Om moral kopplas via form-drift (A) blir effekten fördröjd och indirekt. Då bör NU-vyns
"LÅG MORAL"-yta och prata-med-spelare formuleras som "påverkar form och sammanhållning över tid",
inte som en omedelbar matchstyrke-spak — annars är löftet fortfarande lätt missvisande. Liten
textjustering, Opus skriver den när wiringen är beslutad. (Skrivuppgift = Opus direkt, inte Code.)

═══════════════════════════════════════════════════════════════════════════
## VERIFIERING (Code, innan landning)
═══════════════════════════════════════════════════════════════════════════

1. Kalibrering hålls med skarp/normal-moral-liga (sharpness ≈ ligamedel, moral mest i 30-80-zon).
2. Determinism: samma seed + samma player-state → identiskt utfall.
3. Playtest: rotera en stjärna ut/in, känn sharpness-effekten. Kör ett lag i låg moral en
   halvsäsong, se att formen — och därmed resultaten — sakta viker.

— Opus, 2026-05-25
