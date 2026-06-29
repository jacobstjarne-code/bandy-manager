# SPEC — Tränarens berättelse: du som karaktär

**Datum:** 2026-06-22 · **Av:** Opus · **Till:** Code (mekanik/wiring + spine-komponent) + Opus (copy)
**Status:** Spec-klar. Paketets killer-app #2. Binder ihop serien — ärver callback (#1) + delar `spine` med generationsloopen (#4).
**Tesen:** Manager är den enda entiteten UTAN `narrativeLog`. Spelare har karriärsbåge, legender eftermäle. Du — den enda som spelar varje match i åtta säsonger — har en statistiksida. Tränare-fliken har redan röst (`getManagerBio`, burnout-citat, persona-repliker) men presenterar den som NULÄGE, en stapel stat-kort. Det som fattas är tråden.

---

## TRE GREPP

### 1. `managerNarrativeLog` — enda nya datan
Spegel av `Player.narrativeLog` på `ManagerProfile`:
```ts
// ManagerProfile.ts
narrativeLog?: {
  season: number
  matchday: number
  type: 'arrival' | 'burnout_peak' | 'era_shift' | 'rivalry' | 'milestone'
  text: string
}[]
```
**Skrivställen — logga vid befintliga ögonblick, inte nya:**
- `arrival` — vid ny save / managerprofil-skapande (en gång).
- `burnout_peak` — när `burnoutScore` passerar en zon-gräns uppåt (samma trösklar som burnout-zonscitaten redan använder). Logga vid passagen, inte varje omgång över gränsen.
- `era_shift` — när `clubEraService` rapporterar nytt era (samma signal som `era_shift`-Momentet i roundProcessor redan fångar — logga parallellt).
- `rivalry` — rivalitets-milstolpe (se nemesis nedan; logga när nemesis-status etableras eller vid en avgörande h2h-vändning).
- `milestone` — karriärrekord (X segrar, Y säsonger i klubben) vid passage.

Copy för varje typ skrivs av Opus (understatement, första person — det är din röst). EJ specad till Code som text.

### 2. Tenure-arc — TranareTab byter stat-stack mot tidslinje
`managerNarrativeLog` renderad i **`spine`-komponenten** (delad med #4 blodslinjen). Bion (`getManagerBio`) sätter tonen överst som en öppning, inte ett kort; resten är banan. Burnout-topparna blir kapitel, inte bara en sparkline. Behåll bio + burnout-citat + persona-repliker — de blir innehåll I arcen.

**`spine`-komponent (delas med #4):** vertikal tidslinje, en nod per post. Se BYGGORDNING nedan — vem som bygger spine först.

### 3. Utsedd nemesis — härledd, ingen ny data
```ts
const nemesis = (profile.coachRivalries ?? [])
  .map(r => ({ r, score: nemesisScore(r) }))
  .sort((a, b) => b.score - a.score)[0]?.r
// nemesisScore = intensity-vikt × (h2hLosses − h2hWins) × recency
```
Den rival med högst score blir DIN nemesis — en utpekad tråd, inte en av tre rader. Visar minne ("Tre möten i rad förlorade"), knyter an till tenure-arcens svacka.

---

## ⚠️ CALLBACK-GLIPAN (måste hanteras i detta bygge)

Designen säger "nemesisen talar via rivalitets-callbacket (#1)". Men den levererade Callbacken (`3aec938b`) har `callback_streak` byggd på **`rivalryHistory[clubId].currentStreak`** (klubb-streak) — INTE på `coachRivalries` (coach-h2h, där nemesisen bor). Det finns ingen coach-nemesis-callback. Två vägar, välj en:

**A (rekommenderas).** Lägg en NY callback-beat `callback_nemesis` i `PORTAL_BEATS` (konsekvens-regionen/callback-bandet), som läser den härledda nemesisen + `coachRivalries` h2h och fyrar via `firesBeforeNextFixture` när nästa motståndare = nemesisens klubb. Severity 1. Opus-copy. Det är den beat designen faktiskt menar.

**B.** Återanvänd `callback_streak` och acceptera att "nemesis" = klubb-streak, inte coach-h2h. Billigare men trubbigare — tappar det personliga (Nordin, inte Lesjöfors). Mot designens intention.

Default A. `coachRivalries` saknar coach-NAMN (bekräftat i `ManagerProfile.ts`: `{clubId, personality, h2hWins/Draws/Losses}`) → callbacken klubbankras ("Lesjöfors-tränaren"), om inte ett persona/namn-fält finns att läsa. **Code verifierar om coachRivalries bär ett visningsnamn; om inte, flagga — nemesis-copy blir klubbankrad tills namn finns.**

---

## BYGGORDNING (#2 vs #4 — spine)
`spine` byggs av den som kommer först. Rekommendation: **bygg `spine` som fristående presentationskomponent i detta bygge** (#2), så #4 återanvänder den rakt av. Lägg den i `src/presentation/components/shared/` (eller motsvarande), props-driven (noder in, ingen domänlogik). #4-specen pekar på samma komponent.

---

## VERIFIERING
- Ny save → `arrival`-post i `managerNarrativeLog`; TranareTab visar bio-öppning + en-nods-spine.
- Burnout passerar zon → `burnout_peak`-post surfar som kapitel i arcen.
- Era-skifte → `era_shift`-post (parallellt med befintligt Moment).
- Nemesis utses ur `coachRivalries` (högst score), egen sektion, minne visas.
- Inför match mot nemesisens klubb → `callback_nemesis` fyrar (väg A), severity 1. **Säg om coachRivalries saknar namn → klubbankrad copy.**
- Bio/burnout-citat/persona-repliker finns kvar, nu i arcen.

## HANDOFF
Code: lägg `managerNarrativeLog` på ManagerProfile + skriv vid de fem ögonblicken (copy från Opus), bygg `spine` som delad props-driven komponent, byt TranareTab till tenure-arc, härled nemesis (score-funktion), lägg `callback_nemesis` (väg A) i PORTAL_BEATS. **Verifiera coachRivalries-namnfältet + rapportera.** Copy (narrativeLog-texter + nemesis + callback) är Opus — skrivs när strukturen står, rör den inte.
