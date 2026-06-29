# Code-uppdrag — R1 Decision-fatigue (kö-åldring + tryckindikator)

**Av:** Opus, 2026-05-23. **Pairas med:** `docs/mockups/HANDOFF-R1-DECISION-FATIGUE-2026-05-23.md`
+ `docs/mockups/2026-05-23_design_decision_fatigue.html`.
**Bygger på:** F1 Beslutsekonomi (queue-rail finns), score-system-Sparkline.
**Status:** BLOCKERAD tills score-uppdraget steg 3 (Sparkline byggd). Läs §0 först.

---

## 0 · TVÅ SAKER INNAN EN RAD KOD

### 0.1 — BEROENDE: R1 kan inte byggas före score-Sparkline
R1:s tryckindikator ÄR en score-system `<Sparkline>` (mocken bekräftar — se 0.2).
Den kan inte byggas förrän `CODE_UPPDRAG_SCORE_SYSTEM_2026-05-22.md` steg 3
(Sparkline-komponenten) är levererad. Bygg INTE R1 parallellt med score-block —
vänta tills Sparkline finns och importera den. Sekvens: score steg 1–3 → R1.

### 0.2 — MOTSÄGELSE I HANDOFFEN: sparkline vs bar (Opus verifierade mot mock)
Handoffens §3-kodexempel och §8-acceptanskriterier beskriver en **fatigue-BAR**
(`fatigue-bar-track` + `fatigue-bar-fill` med `width: %`, "tre fill-state").
**Det är GAMMALT.** Mocken (`2026-05-23_design_decision_fatigue.html`) använder
en **SPARKLINE** — `.fatigue-spark` är en `<svg viewBox="0 0 200 22">` med
`<polyline>`, exakt score-systemets mönster. Handoffens prosa (§3 övre stycke)
säger också sparkline. Mocken är sanningen.

**Tvingande:** bygg tryckindikatorn som `<Sparkline>` över `fatigueHistory`,
INTE som en progress-bar. Ignorera handoffens §3-bar-kod och §8-kriteriet
"fatigue-meter renderas korrekt (0-100, tre fill-state)" — det är bar-språk från
en tidigare version. Om du bygger mot bar-kriteriet bygger du fel sak (LESSONS
#29 — levererad spec ≠ mock; mocken vinner).

Färg per pressure-state (mocken): lugn → `--accent`, warm → `--warm`, hot →
`--danger`. Sparkline `stroke`-prop tar redan dessa.

---

## 1 · DATAKRAV (datamodell — flagga anrop-platser för Opus)

### 1.1 — `GameEvent.deferredAt`
```typescript
interface GameEvent {
  deferredAt?: number   // matchday när eventet hamnade i deferred
}
```
Sätts i `tryQueueDecision` när budget full:
```diff
- const newDeferred = [...(game.deferredDecisions ?? []), event]
+ const newDeferred = [...(game.deferredDecisions ?? []), { ...event, deferredAt: game.currentMatchday ?? 1 }]
```

### 1.2 — `game.fatigueHistory: number[]`
Rullande senaste 7 omgångars meter-värde. Uppdateras vid varje `advance()`.
**FLAGGA TILL OPUS före bygge:** var exakt i advance/roundProcessor anropet ska
ligga, så det inte dubbelkörs vid cup-matchdays (LESSONS #14 — liga/cup
asymmetri, samma fälla som score-snapshot-pipelinen). Detta är samma klass av
anrop — koordinera placeringen med score steg 5 om båda byggs nära varandra.

### 1.3 — `game.fatigueHotStreak: number`
Räknar consecutive omgångar med hot pressure. Reset vid icke-hot. Driver
fatigue-scenen (§4).

---

## 2 · HELPER (`src/domain/services/decisionFatigueService.ts`)

Enligt handoff §2 — `getFatigueState(game)` + `getItemAge(event, currentMatchday)`.
Trösklar BEKRÄFTADE av Jacob (se §6-beslut): warm vid maxAge≥3 ELLER count≥5,
hot vid maxAge≥5 ELLER count≥7. Meter = `min(100, count×10 + maxAge×8)`.

**Tvingande:** `fatigueHistory` matar Sparkline. `getFatigueState` returnerar
nuvärdet; historiken är de senaste 7 meter-värdena. Sparkline kräver ≥5 punkter
(score-system regel 2) — så de första omgångarna har för få punkter. **Tom-
tillstånd:** < 5 punkter → Sparkline visar sitt tom-tillstånd (score §B2.5),
INTE en stympad linje. Verifiera att det ser rimligt ut i lugn-läge tidigt i en
säsong.

---

## 3 · UI — PortalQueueRail (mocken är sanningen)

Tre pressure-states på själva rail: default / `warm-pressure` / `hot-pressure`
(CSS i mocken). Chips får age-suffix (`{age} omg`) och aged-klass:
aged-1 vid 3–4 omg (warm), aged-2 vid 5+ (danger). Tryckindikatorn under chips
är Sparkline över `fatigueHistory` (0.2), med label "Tryck" + ord-nivå
"Lugn/Märkbart/Hög" (mockens tre ord, INGEN alarm-text, inga utropstecken).

**Tvingande:**
1. Sparkline, inte bar (0.2). BEVIS: ingen `width: %`-fill i koden; en `<svg>`
   med polyline via score-`<Sparkline>`.
2. Verifiera i KONTEXT — portalen med faktisk deferred-kö i alla tre states
   (lugn/warm/hot). Skärmdump av varje (LESSONS #25). Mocken visar exakt hur de
   tre ska se ut.
3. Ord-nivå, inte procent, som synlig text. "Lugn/Märkbart/Hög".

---

## 4 · FATIGUE-SCEN — MJUK (Jacobs beslut, se §6)

Ny coffeeRoomService-trigger: när `fatigueHotStreak >= 2` → ersätt vanlig
coffee-scen med fatigue-version. **MJUK version (Jacob beslutade):** scenen är
TONAL — Sture verkar trött, Magnus kommenterar. INGEN moral-träff, INGEN
styrelse-relation−2, INGET "kräver respons". Handoffens §5 + mockens notes
nämner en "kräver respons / moral-träff"-variant — **den byggs INTE.** Bara
tonalt skifte.

Skälet (för Code:s förståelse): C-FT1 idag visade att en stor osynlig
konsekvens känns orättvis. Fatigue-scenen gör trycket SYNLIGT (Sture märks trött)
utan att straffa i det dolda. Hård version kan komma senare när den är synlig.

**Tvingande:** ingen `boardPatience`/relation-delta i fatigue-scenen. Om Code
hittar sådan kod i handoff-förslaget — hoppa den, flagga till Opus.

---

## 5 · AGED DECISION-CARD
Promoterad deferred decision med total-ålder ≥4 omg → `aged-1`/`aged-2`-klass +
age-tag i eyebrow ("4 omg gammal"). Enligt handoff §4 + mock. Rakt fram.

---

## 6 · JACOBS BESLUT PÅ DESIGNS Q&A (2026-05-23)
- **Q1 trösklar:** BEKRÄFTADE (3=warm, 5=hot). Notering: triggar på endera
  maxAge eller count — avsett.
- **Q2 scen-konsekvens:** MJUK. Tonalt skifte, ingen moral-träff. (§4.)
- **Q3 copy:** Opus levererar 4 warm + 4 hot kafferumsrader. Code lämnar
  strängar TOMMA (`'[Opus]'`) tills levererade — skriv ALDRIG egen svensk text
  (CLAUDE.md hård regel). Opus skriver direkt när UI:t står.

---

## 7 · OPUS COPY — levereras av Opus, inte Code
4 warm-rader + 4 hot-rader kafferumsfatigue. Bandysvensk understatement, inga
utropstecken, ingen alarm-ton. Mockens exempel sätter nivån: warm = "Magnus
räknade högt: 'Kommunen har ringt tre gånger.' Sture nickade utan att svara." /
hot = "Magnus la ifrån sig koppen. 'Du måste börja säga ja eller nej, Sture.'"
Opus skriver dessa när §3-UI:t är byggt och Sparkline finns.

---

## 8 · ESTIMAT + ORDNING
Handoffens ~3.5h håller MINUS moral-konsekvensen (Q2 mjuk → §4 enklare).
Reviderat: deferredAt + helper ~45min, queue-rail med Sparkline ~45min, aged
dec-card ~30min, fatigue-scen-trigger (mjuk, ingen moral) ~30min, tester ~30min.
**~3h Code + Opus copy.** EFTER score steg 3 (Sparkline).

— Opus, 2026-05-23
