# SPRINT HANDOFF #9 — ArrivalScene — audit

**Spec:** `design-system/briefs/ARRIVAL-SCENE-SPEC.md`
**Datum:** 2026-05-05

---

## Punkter i spec

- [x] Kontinuerlig scen — ingen route-byte mellan steg 0–3
- [x] Ingen GameHeader, ingen BottomNav
- [x] Background `--bg-scene` består hela vägen
- [x] Genre-etikett "⬩ Ankomsten ⬩" stationär, byts aldrig
- [x] State `step` (0|1|2|3|4) + `arrivalDone` med setTimeout 3400ms
- [x] Inramningsblock dimmas (opacity 0.42, font-size shrink) men försvinner inte
- [x] Tunn divider tonas in när step >= 1
- [x] Progress (4 streck) syns bara step >= 1
- [x] Copper glow dimmas (0.3) när step >= 1 (.dim klass på .arrival-scene)
- [x] CoffeeRow Margareta steg 1 (vänster), Pelle steg 2 (höger), Sture steg 3 (vänster)
- [x] CTA label byts per step: "Gå in →" / "Förstått" / "Det går bra" / "Då börjar vi"
- [x] CTA disabled + opacity 0 i steg 0 tills arrivalDone
- [x] Steg 4: full-cover overlay fades in, navigerar till /game/dashboard efter 800ms
- [x] formatKr() helper: 380000→"380 tkr", 1200000→"1.2 mkr"
- [x] Dynamiska data: clubName, chairman, treasurer, member, squadSize, expiringContracts, cashKr, transferBudgetKr, currentDate
- [x] expectedRankLow/High baserat på boardExpectation
- [x] Sture-variants med TODO(Opus)-kommentar

---

## Filer skapade / ändrade / borttagna

**Skapade:**
- `src/presentation/screens/ArrivalScene.tsx` — ny kontinuerlig intro-scen

**Ändrade:**
- `src/presentation/navigation/AppRouter.tsx` — lade till `/intro` route med `<ArrivalScene>`
- `src/presentation/screens/ClubSelectionScreen.tsx` — navigerar till `/intro` (istf `/game/dashboard`) efter newGame()
- `src/styles/global.css` — lade till `.arrival-scene`, `.beat-progress`, `.coffee-row`, `.scene-cta`, `.arrival-exit`, `@keyframes fade-in-soft`, `@keyframes fade-in-static`, `.fadein`
- `design-system/HANDOFF.md` — HANDOFF #9 markerad `[x]`
- `design-system/SYNC.md` — Intro/Ankomsten rad uppdaterad till ✓

**Borttagna:**
- Inga filer raderade. `IntroSequence.tsx` används fortfarande på `/` (start-skärmen) och behålls.

---

## Steg 0–4 — vad renderas

| Step | Vad visas | CTA |
|---|---|---|
| 0 | Arrival-scene med copper glow. Klubbnamn fadear in (600ms delay). Tid+plats (1400ms). Styrelsenamn + kaffekoppar (2400ms). | "Gå in →" — osynlig/disabled tills 3400ms |
| 1 | Inramning dimmad (opacity 0.42, fontSize 18/12px). Divider. Margareta (M-cirkel, vänster) med lägesrapport. Copper glow dimmat. | "Förstått" |
| 2 | + Pelle (P-cirkel, höger) med placeringssexpektation. Progress: 2 aktiva streck. | "Det går bra" |
| 3 | + Sture (S-cirkel, vänster) med ortens replik. Progress: 3 aktiva streck. | "Då börjar vi" |
| 4 | Full-cover overlay (fade-in-static 0.8s) med "→ Dashboard". navigate('/game/dashboard') triggas efter 800ms. | — |

---

## TypeScript prop-typer

```ts
interface ArrivalSceneProps {
  clubName: string
  chairman: string
  treasurer: string
  member: string
  squadSize: number
  expiringContracts: number
  cashKr: number
  transferBudgetKr: number
  expectedRankLow: number
  expectedRankHigh: number
  currentDate: Date
  onComplete: () => void
}
```

`ArrivalScene` (exporterad) är wrappers som läser från gameStore — inga props behövs i router.

---

## Build-status

```
✓ tsc — inga TypeScript-fel
✓ vite build — 3.25s, 2147 moduler transformerade
✓ PWA precache 45 entries
```

Pre-existing test failures (8 st, ej relaterade till ArrivalScene):
- boardMeetingScene.test.ts (4 st)
- PortalScreen.test.ts (1 st)
- sceneTriggerService.test.ts (3 st)

---

## Awaiting

- Manuell playtest — klicka igenom hela flödet steg 0→4
- Pixel-jämförelse mot `ui_kits/intro_flode/Intro Flode v1.html`
- Opus: fyll i per-klubb Sture-varianter (se `TODO(Opus)` i ArrivalScene.tsx)
