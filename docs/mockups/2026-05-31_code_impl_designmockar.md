# Spec — Code implementations-runda, design-mockar

Fyra ytor att implementera efter pixel-audit-fix-rundan. Designs mockar finns i `docs/mockups/`, Opus-copypools för text-tunga ytor i `docs/`. Implementationerna är oberoende — kan köras i ordning eller parallellt.

---

## 1 · Granska IA-pass

**Design:** `docs/mockups/2026-05-30_design_granska_ia.html`

Granska går från platt kortlista till tre grupper med avdelare:

- **Resultatet** — hero-MATCHEN (tappbar med chevron → MatchReportView) + kompakt resultat-strip (TABELL + FORM, två kolumner)
- **Klubben** — Träning + Orten+Ekonomi-par + Akademin (+ NY SKADA-rad om en sådan finns)
- **Omvärlden** — ANDRA MATCHER (med score-block per match) + Pressklipp

### Implementations-detaljer

- Grupp-avdelare: `⬩` + grupp-label + hairline-stripe (per mock)
- Vertikal rytm: 6px inom grupp, 14px mellan grupper
- Flavor-rad inom MATCHEN-kortet: `border-top` + padding, klipps aldrig mot underkanten
- BottomNav återställs på Granska (icke-overlay)
- Phase-strip uppe + BottomNav nere samexisterar
- ANDRA MATCHER använder ScoreBlock-primitiven, inte text
- NY SKADA-kortet: `danger`-stripe, visas bara om en ny skada existerar denna omg (gruppen krymper annars)
- Form-prickar tonade V/F/O (score-block-ton)

### Filer (verifiera vid bygge)

`presentation/screens/GranskaScreen.tsx` + ev. nya sub-komponenter för grupp-avdelare och hero-MATCHEN.

---

## 2 · Efterklang V2 — visuella refinements

**Design:** `docs/mockups/2026-05-30_design_efterklang.html`

Code byggde grundläggande V2 (header=objektnamn, tidsanvisning, modal). Designs mock lägger på:

- **Stripe-färg**: byt från `--cold` till `--warm` på Efterklang-kortet (laddad relation, inte kall info)
- **Subradsformulering**: `X omgångar pågående · senast Omg Y` (mono-font, pip-separator)
- **Chevron**: top:12px right:13px, `--warm-light`, opacity 0.8
- **Modal-tidslinje**: vertikal linje vänster med gradient (warm), nod-prickar per minne, senaste markerad med fylld nod + glow, äldre tonade (opacity 0.78)
- **Modal-foot**: kontext-rad i mono-italic, t.ex. *"En linje som löper genom säsongen. Nästa derby vänder bladet."*
- **Eyebrow i tråd**: omgång + "· senast" på senaste, mono-font, warm-light

### Filer

`presentation/components/portal/Efterklang*.tsx`, `presentation/components/portal/EfterklangThreadModal.tsx`, ev. nya CSS-tokens (warm-gradient för tidslinje).

---

## 3 · BoardMeeting säsong 2+

**Design:** `docs/mockups/2026-05-30_design_boardmeeting_s2plus.html`
**Copy-pool:** `docs/2026-05-31_copypool_boardmeeting_s2plus.md`

Triggers: `handleSeasonEnd → SeasonSummaryScreen → clearSeasonSummary → BoardMeetingScreen → Dashboard`. Säsong 1 har ArrivalScene (BoardMeeting disablad där).

### State-resolver (välj A/B/C)

Code beräknar måluppfyllelse av föregående säsong (antal uppfyllda mål / antal mål):

- **Säsong 2** (oavsett utfall) → A · Första gången
- **Säsong 3+** med uppfyllelse ≥ 80% → B · Bra säsong
- **Säsong 3+** med uppfyllelse < 50% → C · Dålig säsong
- **Säsong 3+** med uppfyllelse 50–80% → välj B eller C baserat på närmast utfall

### Komponenter att bygga

- `.scene` (portal-mörk yta, ärver ArrivalScene-vokabulär)
- `.genre` — "⬩ Styrelsemöte ⬩" med variant-färg per A/B/C (`--accent` / `--gold` / `--cold-light`)
- `.setting` — Georgia-italic rumsprolog, slumpad från copypool per state
- `.scene-title` — Georgia 23px, slumpad från copypool per state
- `.speaker` med name + line — Margareta default, klubbspecifik via `boardPersonalities`
- `.eval` — måluppfyllelse, **max 3 rows** (viktigast först per Opus-svar). "+N övriga" diskret rad om fler mål finns. Stripe-färg per utfall (`--cold` / `--success` / `--danger`)
- `.fin` — kassa + budget (två kolumner). Trend-sparkline (`success`/`danger`-stroke) på kassa
- `.goals` — nya mål som goal-cards (ikon + main + italic sub). Stretch-mål får `--gold` stripe
- `.scene-cta` — copper default, **gold ENDAST vid B** (reserverat för bra säsong, samma magi-princip som SM-final)

### boardPersonalities-system (bygg minimum om inte existerande)

```ts
interface BoardPersonality {
  name: string;
  role: 'Ordförande' | 'Kassör' | 'Ledamot';
  toneTag?: 'formell' | 'nedrig' | 'optimist' | 'bitter';
}
```

Lägg `boardPersonalities: BoardPersonality[]` på Club-entiteten. Default per klubb: minst en ordförande. Margareta default-fallback i BoardMeetingScene om saknas. `toneTag` påverkar inte rendering i V1 (alla speaker-lines är universella) — finns för senare poolfiltrering.

### Copy-pool-integration

Parsea `docs/2026-05-31_copypool_boardmeeting_s2plus.md` eller spara som TypeScript-data i `src/domain/data/boardMeetingCopy.ts` med `settings`, `titles`, `speakerLines`, `goalMotivations` per A/B/C. Slumpa utan upprepning per spelinstans (no-repeat-tracker per pool).

### Filer

`presentation/screens/scenes/BoardMeetingScene.tsx`, `src/domain/entities/Club.ts` (boardPersonalities), `src/domain/data/boardMeetingCopy.ts`, ny `src/application/services/boardMeetingStateResolver.ts`.

---

## 4 · NU-stiltje (C-N1)

**Design:** `docs/mockups/2026-05-23_design_nu_stiltje.html`
**Handoff:** `docs/mockups/HANDOFF-C-N1-NU-STILTJE-2026-05-23.md`
**Copy-pool:** `docs/2026-05-31_copypool_nustiltje.md`

Implementera fem lager på NU-fliken som tillsammans gör att skärmen aldrig blir tom utan att skrika.

### Designval bekräftade (Designs Q1–Q3, svarade av Opus)

- Stämningskurva: ALLTID synlig
- Heritage-rad: bara EXAKTA jubileum (samma datum, hela år sedan)
- Mikrohändelser: ENBART narrativa, INGA mood-effekter

### Lager-implementation

1. **Stillness-beat** — alltid synlig. Italic-rad från `stillnessBeatPool` (i copy-pool). Roterar per dag, väder-typ, säsong-fas. Light-cold border-left enligt mock.

2. **Veckans rytm** — alltid synlig. Träningsschema mån-sön + nästa match. "Idag"-rad markerad. Ny komponent: `WeekRhythmCard`. Läser `game.trainingHistory` + `game.nextFixture`.

3. **Stämningskurva** — alltid (per bekräftat designval). Sparkline över team-puls senaste 7 dagar.
   - **NY data:** `game.teamPulseHistory: number[]` (snapshot per omg, slice(-7))
   - **Beräkning:** pulse = avg(team-mood, recent-form, injury-free-%)
   - **Komponent:** återanvänd `<Sparkline>` från score-system

4. **Mikrohändelser** — 1–3 per omg, slumpat från `microStillnessPool` (copy-pool). Kombinera med befintliga `smallAbsurditiesData` där det passar. No-repeat-tracker per pool.

5. **Heritage-rad** — 1 per dag om jubileum träffar. Helper: `findEventsOnDate(game, currentDate)` som söker `clubMemoryEvents` på samma månad-dag och returnerar bara exakta jubileum (hela år sedan). Återanvänder R5-anniversary-logik.

### Två regler

- **Stillness är inte tomhet** — lager 1–5 alltid där om inget brinner
- **När något brinner** (decision i kön / skada / event) tar det plats överst; lager 2–5 stannar men sjunker till bakgrund (lugn yta, inte konkurrens)

### Filer

`presentation/screens/NuTab.tsx` (eller motsv.), `presentation/components/StillnessBeat.tsx`, `presentation/components/WeekRhythmCard.tsx`, `presentation/components/MoodSparkline.tsx`, `src/domain/data/stillnessBeatPool.ts`, `src/domain/data/microStillnessPool.ts`, `src/application/services/clubHistoryService.ts` (findEventsOnDate-helper).

---

## Migrationsordning

1. **Granska IA** först — visuellt största påverkan på efter-match-flödet, basics
2. **Efterklang V2 refinements** — små ändringar på existerande V2, snabba
3. **NU-stiltje** — fem lager + ny data-pipeline (teamPulseHistory) + copy. Större
4. **BoardMeeting säsong 2+** — sist; kräver boardPersonalities-system + state-resolver

## Verifiering

Dev-galleriet får en yta per implementation:

- Granska efter spelad match (resultat-strip + alla tre grupper, med och utan NY SKADA)
- Efterklang-modal med 3-minnes-tråd (senaste markerad, äldre tonade)
- BoardMeeting A/B/C på portal-mörk (tre kort sida vid sida)
- NU-stiltje vid omg 9 (lugn vecka) + NU-halv-stiltje (något brinner)

Pixel-jämför mot Designs mockar innan release.
