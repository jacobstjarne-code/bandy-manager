# CODE_INSTRUCTION — MASTER 2026-05-12

Komplett spec för nästa Code-runda. Tre block: inline-fixar redan på disk, match-vy audit (se separat fil), dashboard- och kafferum-fixar.

---

## A. INLINE-FIXAR REDAN PÅ DISK

Dessa är fixade av Opus direkt och måste ingå i din nästa commit. Inget mer behöver göras — verifiera bara att de är med.

| Fil | Vad |
|---|---|
| `src/presentation/screens/match/MatchLiveScreen.tsx` | FIX-30: `setIsPaused(false)` mellan `setShowHalftime(false)` och `setCurrentStep(31)` i `handleApplyTactic` — andra halvlek startar automatiskt efter halvtidsmodal |
| `src/presentation/screens/match/MatchLiveScreen.tsx` | FIX-31: Två nya states `clockSecond` + `displayedMinute`, två nya useEffects för tickande (sekunder per 1000ms, minuter per 1500ms men capped på `nextStep.minute - 1`), prop-byten i ScoreboardStalvallen `minute={displayedMinute}` + `second={clockSecond}` |
| `src/domain/services/sceneTriggerService.ts` | FIX-32: `if (sinceLast < 1) return false` i `shouldTriggerCoffeeRoom` — blockerar kafferum-retrigger-loop när override-trigger (streak ≥3) är aktiv |
| `src/domain/data/anslag/cupAnslag.ts` | Textfix: `"Cupen är gjort"` → `"Cupen är avgjord"` i cup_done variant 3 |

**Observera:** FIX-31 tickrate och cap kommer att JUSTERAS i FIX-34 (se audit-filen) — du behöver inte ändra något nu, FIX-34 hanterar det.

---

## B. MATCH-VY AUDIT (FIX-33 till FIX-38)

**Detaljerad spec i separat fil:** `docs/CODE_INSTRUCTION_MATCH_VY_AUDIT_2026-05-12.md`

**Sammanfattning:**

| FIX | Område | Storlek |
|---|---|---|
| **FIX-33** | Återinför slutskärm enligt `match-report-stalvallen.html` (tavla i FT-state + papper med story/events/hörn-band/spelarbetyg/POTM) | STOR (2-4h) |
| **FIX-34** | Klockan rullar jämnt — tickrate 1500ms → 1000ms, ta bort `nextStep.minute - 1` cap | XS |
| **FIX-35** | Livehändelser delay — 1500ms post-choice innan nästa step | S |
| **FIX-36** | Atmosfärisk ticker (variant B) — väder + publik + senaste händelser + andra ligamatcher istället för redundant resultat-string | M |
| **FIX-37** | Hint "Matchen rullar..." försvinn efter 12s + fade | XS |
| **FIX-38** | 4-pack designjusteringar (legend bort, kontrast, typsnitt sans-serif, "Matchflöde"-rubrik) | S |

**Inte djupgranskat i audit:** HalftimeModal (FIX-30 löste auto-start), MatchControls (FIX-19 räcker), Phase-overlays. Anses OK tills annat påvisas.

---

## C. HEM-DASHBOARD (FIX-39)

**Var:** Dashboard-skärmen (sök efter `DashboardScreen.tsx` eller motsv. där Styrelsen och Järnklacken-korten renderas).

**Idag (se screenshot från playtest):** Styrelsen-kortet och Järnklacken-kortet renderas vertikalt ("brutna konstigt") med ovanligt smala kolumner och radbruten text:
```
Fan
mood
ska
nå 70
```
Detta är inte rätt vertikal layout — det är ofrivillig text-wrap pga för smal kolumn.

**Fix:** Korten ska vara HORISONTELLA inom respektive rad. Två kort på samma rad eller staplade vertikalt med full bredd vardera — inte två smala kolumner som tvingar text att brytas i singelord.

**Layout-alternativ (välj efter vad som passar designsystemet):**
- **A.** Flex-row med två kort på samma rad, equal width (50/50), tillräcklig minimum-bredd så text inte bryter mitt i ord
- **B.** Stacked vertikalt — varje kort full bredd, ordnade Styrelsen ovanför Järnklacken eller vice versa

**Acceptanskriterier:**
- Inga single-word-radbrytningar i kort-titlar ("Fan mood ska nå 70" på en eller två rader, inte fyra)
- Text läsbar utan att zooma in på mobile (380px)
- Mood, member count, framsteg-bar synliga på samma rad

**Datakontrakt orörd** — bara presentationen ändras.

---

## D. KAFFERUM (FIX-40, FIX-41)

### FIX-40 — Nav i kafferummet

**Var:** `src/presentation/screens/scenes/CoffeeRoomScene.tsx`

**Idag:** Scenen renderas i full-screen utan nav-bar. Användaren kan inte navigera bort från scenen utom via "Tillbaka till klubben"-knappen. Detta är inkonsistent med övriga scener och dashboard-flödet.

**Fix:** Lägg till BottomNav (samma komponent som används på dashboard, trupp, match etc.) längst ner i CoffeeRoomScene-renderingen. Active tab = "Hem" (eftersom kafferummet är ett dashboard-state).

**Implementations-hint:** Sök efter `BottomNav`-komponenten där den används i andra screens — kopiera mount-mönstret. Behöver troligen `navigateTo` för tab-switching.

**Acceptanskriterier:**
- BottomNav syns längst ner i CoffeeRoomScene
- Hem-fliken är aktiv
- Klick på annan flik navigerar bort från kafferummet
- "Tillbaka till klubben"-knappen fortsätter fungera oförändrat

### FIX-41 — Kafferum som modal ovanpå dashboard

**Var:** `src/presentation/screens/scenes/CoffeeRoomScene.tsx` + `SceneScreen.tsx` + dashboard-routing.

**Idag:** När `pendingScene === 'coffee_room'` ruttas användaren till SceneScreen som renderar CoffeeRoomScene full-screen. Detta bryter dashboard-kontexten.

**Mål:** Kafferummet ska visas som en MODAL ovanpå dashboard, samma pattern som övriga modaler i appen (typ HalftimeModal, weekly decision modal, anslag modal). Dashboard renderas under, kafferum-innehållet ovanpå med backdrop.

**Implementations-strategi:**

1. **Behåll innehållet i CoffeeRoomScene** — bara wrap:a det i en modal-shell istället för full-screen-div.

2. **Sök efter befintligt modal-pattern** i appen — t.ex. hur HalftimeModal eller annat anslag visas. Återanvänd det.

3. **Ändra routing:** Istället för att navigera till `/game/scene` när `pendingScene === 'coffee_room'`, behåll användaren på dashboard och rendera kafferum-modal ovanpå när `pendingScene === 'coffee_room'`.

4. **Stänglogik:** "Tillbaka till klubben"-knappen anropar `completeScene('coffee_room')` som rensar `pendingScene` (befintlig logik, FIX-32 säkerställer ingen loop).

5. **När kafferum är modal försvinner behovet av FIX-40 (nav)** — modal:en har dashboard-nav synlig under sig. Implementera FIX-41 FÖRST. Om FIX-41 är klar, hoppa över FIX-40.

**Acceptanskriterier:**
- Dashboard syns under kafferum-modal:en (eventuellt dimmad)
- BottomNav synlig och fungerande
- Stäng-knappen rensar pendingScene och modal försvinner
- Inga visuella glitches när modalen öppnas/stängs

**Anteckning till Code:** Detta är en routing-refactor som påverkar SceneScreen. Andra scener (sunday_training, journalist_relationship, board_meeting, cup_intro, cup_final_intro, sm_final_victory, season_signature_reveal) ska FÖRBLI full-screen — bara coffee_room ändras till modal-pattern. Verifiera att de andra scenerna fortsätter fungera oförändrat.

---

## E. COMMIT-STRATEGI

Tre commits rekommenderat:

**Commit 1 — Match-vy interaktivitet och slutskärm**
- FIX-33 (slutskärm — största jobbet)
- FIX-34 (klocka 1000ms)
- FIX-35 (livehändelser post-choice delay)

**Commit 2 — Match-vy ytfixar**
- FIX-36 (atmosfärisk ticker)
- FIX-37 (hint fade)
- FIX-38 (legend/kontrast/typsnitt/"Matchflöde")

**Commit 3 — Dashboard och kafferum**
- FIX-39 (Styrelsen/Järnklacken horisontella)
- FIX-41 (kafferum som modal — gör denna före FIX-40, kan göra FIX-40 onödig)
- FIX-40 (kafferum nav — bara om FIX-41 inte räcker)

Inline-fixar (FIX-30/31/32 + textfixar) ingår automatiskt i commit 1 eftersom de redan ligger på disk.

---

## F. KRITISKA INSTRUKTIONER

**Mekaniken är ORÖRD.** Alla services (cornerInteractionService, penaltyInteractionService, counterAttackInteractionService, freeKickInteractionService, lastMinutePressService, coffeeRoomService) behåller sina rates, modifierare och defaults. Bara presentationen ändras.

**Pixel-audit krävs för FIX-33 och FIX-38.** Öppna mocken (`docs/match-live-bundle/match-report-stalvallen.html` och `match-live-stalvallen.html`) i Chrome DevTools sida vid sida med din build vid 380px bredd. Verifiera färger, fonts, spacing.

**Rapportera per FIX med ✅ / ⚠️ / ❌ + en mening.** Specifikt för FIX-33: lista vilka delar av papper-laget som är klara (arena-rad, story-block, events-lista, hörn-band, spelarbetyg-strip, POTM-rad, ratings-foot, CTA).

**Lärdom från tidigare:**
- Läs PARENT-skärmfilen först (MatchLiveScreen.tsx är PARENT till alla interaction-komponenter och slutskärm)
- Verifiera mot mocken i Chrome DevTools, inte mot minnesbild
- Story-text använder `--font-display` (Georgia serif), inte LED-mono
- Story-prosa max ~80 ord, line-height 1.65
- 0-0-stresstestet är viktigt — events-empty måste fungera

---

## G. SCOPE OUT

**Ingår INTE i denna runda:**
- Granska post-match screen (separat audit krävs)
- Halftime summary screen (annan komponent)
- Press/media-separation (FIX-spec 5 i IMPLEMENTATION-SPEC.md, för senare)
- Portal secondary cards (FIX-spec 4 i IMPLEMENTATION-SPEC.md, för senare)
