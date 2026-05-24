# CODE INSTRUCTION — F1 backend-wiring + audit-fynd

**Datum:** 2026-05-17
**Audience:** Code (Claude Code i VS Code)
**Avsändare:** Opus
**Status:** Två stages. Stage 1 = backend-wiring för deferred + smått ArrivalScene-städ. Stage 2 = source-specific secondary-kort + CooldownRow-integration. Plus en pixel-audit-blocker att läsa separat.

---

## BAKGRUND

F1 Beslutsekonomi UI implementerat 2026-05-16. Fyra komponenter på plats: `PortalActiveBudget`, `PortalQueueRail`, `CooldownRow`, `PortalInboxCounter`. 73/73 tester gröna, build ren.

**Två UI-redo komponenter har ingen backend-wiring än:**
- `PortalQueueRail` renderas när `game.deferredDecisions.length > 0`, men `deferredDecisions[]` populeras aldrig
- `CooldownRow` är fristående komponent, men ingen source-secondary-card använder den

Plus två audits från Design 2026-05-17:
- **Pixel-audit 10 inlåsta system:** 1 🟥 (stripes-inflation — alla sekundärer har samma 2 px copper, hierarkin platt), 5 🟧, 4 🟨, 12 ✅. Detaljer i `design-system/AUDIT-INLASTA-SYSTEM-PIXEL-2026-05-17.md` *(Jacob flyttar in den manuellt)*.
- **ArrivalScene rev2:** Alla tre OPEN THREADS funkar. 5 fynd A1–A5, inga BLOCK. Detaljer i `design-system/AUDIT-ARRIVAL-SCENE-REV2-2026-05-17.md`.

A1 (uppdatera CLAUDE.md) är redan stängd av Opus.

---

## STAGE 1 — Backend-wiring för deferred decisions + ArrivalScene-städ

**Estimerad effort:** 3-5 timmar.

### Uppgift 1A — `game.deferredDecisions[]`-population i roundProcessor

**Var:** `src/application/useCases/roundProcessor.ts`.

**Vad som ska byggas:**

1. Verifiera att `deferredDecisions: ActiveDecision[]` finns i `SaveGame`-typen. Om inte — lägg till med default `[]`.

2. Identifiera var nya decisions spawnas i roundProcessor (weeklyDecisionService, mecenatDinnerService, hallDebateData, smallAbsurditiesData, andra source-services).

3. Wrap decision-spawn i en helper:
   ```ts
   function tryActivateDecision(game: SaveGame, decision: ActiveDecision): SaveGame {
     const maxBudget = isSeason1Round1(game) ? 1 : 2
     if (game.activeDecisions.length >= maxBudget) {
       return { ...game, deferredDecisions: [...game.deferredDecisions, decision] }
     }
     return { ...game, activeDecisions: [...game.activeDecisions, decision] }
   }
   ```

4. När en active decision resolves (via `resolveDecision`-handler eller motsvarande):
   ```ts
   function resolveAndAdvance(game: SaveGame, resolvedId: string): SaveGame {
     const remainingActive = game.activeDecisions.filter(d => d.id !== resolvedId)
     const [nextFromQueue, ...restQueue] = game.deferredDecisions
     if (nextFromQueue) {
       return { ...game, activeDecisions: [...remainingActive, nextFromQueue], deferredDecisions: restQueue }
     }
     return { ...game, activeDecisions: remainingActive }
   }
   ```

5. Cap `deferredDecisions.length` vid 10 (förhindra obegränsad tillväxt om triggers spammar). När capen nås — dropp äldsta queue-item och logga.

**Verifiera mot kod:**
- Finns redan `activeDecisions` i SaveGame? Om ja — i vilken form? `ActiveDecision[]` eller annat?
- Finns en central spawn-funktion eller spawnar varje service direkt till `activeDecisions`?
- Vilken signatur har `resolveDecision`?

**Acceptanskriterier:**
- I säsong 1 omg 1 med 1 aktiv decision: nästa trigger landar i `deferredDecisions`
- I säsong 2+ med 2 aktiva decisions: nästa trigger landar i `deferredDecisions`
- När en active resolves: första från queue lyfts till active
- Queue capas vid 10
- Tester gröna

---

### Uppgift 1B — ArrivalScene A2-A5 (från Design-audit)

**Var:** `src/presentation/screens/ArrivalScene.tsx` + `src/styles/global.css`.

**A2 (🟧) — Refaktor `.arrival-board-card` → använd `.portal-secondary-card`**

Inline `::before`-stripe + duplicerad anatomi i `global.css` rader ~1100. Ersätt med:
```tsx
<div className="portal-secondary-card portal-card-stripe-copper arrival-board-objectives in">
  {/* innehåll */}
</div>
```

Borttagning: `.arrival-board-card`-specifik CSS. Inline-eyebrow (raderna 122-128) ersätts samtidigt i A5.

**A3 (🟨) — Mjuka dot-färgändringen**

`.beat-progress .dot` poppar idag från 30% alpha → full accent. Lägg:
```css
.beat-progress .dot { transition: background 0.4s ease; }
```

**A4 (🟨) — Aria-label på Hoppa över**

`<button className="scene-skip" aria-label="Hoppa över introduktionen" onClick={onComplete}>...`

**A5 (🟨) — Inline-eyebrow → klassbaserad**

Raderna 122-128 i `ArrivalScene.tsx` har inline-styled eyebrow som speglar `.portal-card-eyebrow` pixel för pixel. Ersätt:
```tsx
<div className="portal-card-eyebrow">{labelText}</div>
```

**Acceptanskriterier:**
- Visuellt oförändrat efter A2 (samma stripe, samma padding)
- Dot-prickar smyger in över 400ms
- Screen reader läser "Hoppa över introduktionen" på skip-knappen
- Eyebrow renderas via klass, inte inline-style

---

## STAGE 2 — Source-specific secondary-kort + CooldownRow-integration

**Estimerad effort:** 3-5 timmar. Separat sprint från Stage 1 om så önskas.

### Vad som ska byggas

Cooldown-systemet kräver att vi vet VILKEN källa en decision kom från, så vi kan tysta just den källan när dess decision resolves. Idag är secondaries i portalen generella ("WeeklyDecisionSecondary") — inte källa-specifika.

**Beslut som behöver fattas innan implementation:**

Två arkitektur-alternativ:

**Alt A — Skapa nya source-specific kort.**
- `KommunenSecondary`, `AkademinSecondary`, `MecenatSecondary`, `LokaltidningenSecondary`, etc.
- Var och en har egen trigger-condition i `portalCardBag.ts` + renderar CooldownRow när relevant
- Maximal flexibilitet men 4-6 nya komponenter

**Alt B — Generisk `SourceSecondaryCard` med source-prop.**
- En komponent: `<SourceSecondaryCard source="kommunen" cooldown={...} ... />`
- Konfigureras via data (label, ikon, ton) snarare än komponent
- Lägger sig i cardBag som N entries med source-prop
- Mindre duplicering

**Min rekommendation: Alt B.** Konsekvent anatomi, en sanning, lättare att lägga till nya källor (mecenat-spawn, halldebatt-källa, etc.).

### Konkret om Alt B

1. Skapa `src/presentation/components/portal/SourceSecondaryCard.tsx` med props:
   ```ts
   type Props = {
     source: 'kommunen' | 'akademin' | 'mecenat' | 'lokaltidningen' | 'hall_debatt' | ...
     hasActiveDecision: boolean
     cooldown?: { roundsLeft: number; totalRounds: number }
     // standard secondary-card props (title, body, ikon, ton)
   }
   ```

2. Card-bag-entry i `portalCardBag.ts`:
   - En entry per source
   - Trigger: source har aktiv decision ELLER source är i cooldown
   - Renderar `<SourceSecondaryCard ... />` med CooldownRow inbakad

3. När decision resolves från en källa:
   - I `resolveAndAdvance` (eller motsvarande), starta `source.cooldown = { roundsLeft: 3, totalRounds: 3 }`
   - I `roundProcessor` rad N: decrementera alla `source.cooldown.roundsLeft` per omgång
   - När `roundsLeft === 0`: ta bort cooldown-objektet helt

4. State-shape:
   ```ts
   // Antingen i SaveGame:
   sourceCooldowns: Record<SourceKey, { roundsLeft: number; totalRounds: number }>
   // Eller per source-config:
   // (mer normaliserat men mer arbete för att synka)
   ```

**Verifiera mot kod:**
- Vilka källor genererar idag decisions? Lista i `portalCardBag.ts` och source-services
- Vilka secondary-kort finns nu? Vilka kan bytas mot SourceSecondaryCard utan regression?

**Acceptanskriterier:**
- När decision från kommunen resolves: kommunen-kortet får `cooldown` 3 omg
- Cooldown-row visas med 3 amber-prickar fyllda
- Per omgång: en prick tickar ner (3 → 2 → 1 → bort)
- När roundsLeft = 0: källan kan trigga decisions igen
- Pixel-audit mot mock `docs/mockups/2026-05-17_design_beslutsekonomi.html` State 05 + 06

---

## PIXEL-AUDIT FYND — från `docs/AUDIT-INLASTA-SYSTEM-PIXEL-2026-05-17.md`

**1 🟥 BLOCK + 5 🟧 WARN + 4 🟨 OBSERV.** Läs full audit för detaljer. Sammanfattad åtgärdslista:

### 🟥 BLOCK — fixas innan playtest

**H.1 — Stripes-inflation i full Portal-stack.**
Nu: alla sekundärer + EventSlot + queue-rail har 2 px copper-stripe. När 4+ kort radas blir hierarkin platt.

*Åtgärd:* Aktivera `.portal-card-stripe-copper-wide` som 3 px för "action-card" (EventSlot, aktiv WeeklyDecision). Övriga sekundärer dimmas till 2 px med opacity 0.4 (`rgba(196,122,58,0.4)`). Severity-systemet (`--cold`/`--warm`) påverkas inte.

**3.4 — WeeklyDecision capturedDecision-race.**
Nu: `capturedDecision.current` ref:as i `useEffect` med 1500 ms resolved-fade. Om en ny decision triggas under dessa 1500 ms — race?

*Åtgärd:* Verifiera flödet med explicit test. Förmodligen OK eftersom `setResolvedInfo(null)` körs vid ny decision, men bestämt en test.

### 🟧 WARN — inom samma sprint

- **10.2** — ActiveArcsSecondary eyebrow `"Arcs"` → `"I blickfånget"` (svenska först-principen).
- **7.1–7.3** — MecenatDinnerEvent stilrefaktor: bryt ut inline-CSS till `.mecenat-*`-klasser i `stalvallen-portal.css`. Byt `--bg` → `--bg-portal-surface`. Använd `.btn .btn-outline` / `.btn .btn-primary` på knappar (inte left-align full-width-rader). Justify-content `center` på modal.
- **1.2** — BoardObjectivesList: flytta inline-styles (rader 49–77) till `.obj-row` / `.obj-row-hovered` / `.obj-progress-bar` i `stalvallen-portal.css`.
- **3.2** — WeeklyDecision resolved-state-timeout 1500 → 2400–2800 ms (läsbarhet för effekt-text).
- **H.2** — EventCardInline egen eyebrow-inline-stil → använd `.portal-card-eyebrow`-klassen.
- **H.3** — PortalInboxCounter behöver `border-top: 1px dashed rgba(196,122,58,0.18)` + min 14 px margin-top mot sekundär ovanför (kollisionsrisk).
- **8.3 / 5.2** — Kommunen/Lokaltidningen cooldown-UI saknas. Adresseras i Stage 2 (source-specific kort).
- **10.5** — Urgent-arc visuell signal: `warm`-halo eller `--warm`-glyph när `isUrgent`.
- **1.4** — BoardObjectives `formatOwnerInitial(ownerId)` kan rendera `m. ember_anders` om `ownerId` är raw-id. Mappa via `boardPersonalities`.

### 🟨 OBSERV — ej akut, notera

- **H.4** — Tutorial-band + ActiveBudget redundans i Säsong 1 Omg 1. Skippa ActiveBudget den första veckan; tutorial-bandet bär informationen.
- **10.4** — Död kod: `getGlyphVariant`-grenen för `derby_echo` nås aldrig (arc-typen filtreras bort). Rensa.
- **6.1** — PlayerCard voice-block använder `--bg-elevated` (vit). Verifiera mörkkontext.
- **9.1, 5.1, 4.1, 2.1** — system som renderas utanför Portal. Avgränsade från hierarki-audit.

### Efter åtgärd — skärmdumpar

Tre skärmdumpar för att flytta system från 🟠 till 🟢 i `INLASTA_SYSTEM.md`:
1. Portal full stack Säsong 1 Omg 1 (tutorial)
2. Portal mid-season Omg 14 (fullt med 8 kort)
3. Portal endgame Omg 22 (krympt)

---

## SAMMANFATTAD ARBETSORDNING

Förslag, anpassa efter capacity:

1. **Stage 1A** (deferred decisions backend) — gör först. Snabb-vinst.
2. **Stage 1B** (ArrivalScene A2-A5) — kan göras parallellt eller efter, smått.
3. **Pixel-audit stripes-inflation** — när Jacob flyttat in fil, läs audit, implementera.
4. **Stage 2** (source-specific kort + CooldownRow) — separat sprint. Diskutera Alt A vs Alt B med Jacob först.

---

## EFTER LEVERANS

När Stage 1 är pushad:
- Uppdatera `docs/KVAR.md` "AKTUELLT LÄGE" med status
- Notera commit-hash
- Rapportera till Opus så vi kan flytta F1 från "REDO FÖR PIXEL-AUDIT" till "REDO FÖR PLAYTEST" i `design-system/CLAUDE.md`

När Stage 2 är pushad:
- Samma uppdatering
- Plus pixel-audit-jobb för Design (verifiera State 05 + 06 i kontext)
