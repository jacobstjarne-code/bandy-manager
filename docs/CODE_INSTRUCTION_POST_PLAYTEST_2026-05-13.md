# CODE_INSTRUCTION — POST-PLAYTEST 2026-05-13

Andra playtest-rundan efter master-specen 2026-05-12. Bra grund — alla 11 FIX i förra rundan funkar. Nya problem dök upp.

---

## INLINE-FIX REDAN PÅ DISK

| Fil | Vad |
|---|---|
| `MatchLiveScreen.tsx` | `second={0}` istället för `second={clockSecond}` i ScoreboardStalvallen — sekunder visas inte längre (Jacobs feedback: behövs ej) |

`clockSecond`-state och dess useEffects lever kvar men oanvända. Inget behöver ändras där.

---

## FIX-42 — Snabbspolning fungerar inte **(BLOCKER)**

**Symptom enligt playtest:** Klick på fast-forward-knappen ger ingen effekt. Matchen rullar inte vidare. Sekund-tickern (klockan) tickar inte heller — vilket är konstigt eftersom sekund-tickern *ska* pausa vid `isFastForward = true`.

**Diagnos-hypoteser:**
1. Knappen sätter inte `setIsFastForward(true)` — kolla `MatchControls.tsx` onClick-handler
2. `setIsFastForward(true)` triggas men useMatchTimer plockar inte upp den — kolla dep-array
3. Något annat blockerar timer-loopen (kanske en interaction state som inte rensades, eller phase-overlay som inte stängdes)

**Felsöknings-instruktion till Code:**

1. **Lägg till console.log:** I `MatchControls.tsx` på fast-forward-knappens onClick — logga `[FF] click, isFastForward before:`. I `MatchLiveScreen.tsx` runt useMatchTimer-effekten — logga `[FF] timer effect: isPaused=X isFastForward=Y currentStep=Z`.
2. **Verifiera state-flow:** Klicka FF, läs konsolen. Är knappen ansluten? Sätts state? Plockar useMatchTimer upp det?
3. **Specifik kandidat:** `useMatchTimer.ts` har troligen `if (isPaused && !isFastForward) return` ELLER `if (isPaused) return` — kolla att fast-forward bypassar pause-check.
4. **Baseline-delay:** Vid `isFastForward = true` är baseDelay ~50ms enligt tidigare spec. Verifiera att det inte är skrivet om till 0 (vilket skulle kunna ge inf-loop) eller bibehållit 1100ms (vilket skulle se ut som "ingenting händer").

**Acceptanskriterier:**
- Klick på FF rullar matchen snabbt till nästa milstolpe (interaktion, halvtid eller slut)
- Sekund-tickern pausar (sekunder visas inte alls eftersom Opus tagit bort det, men logik ska respektera flag)
- FF kan toggle:as av/på

---

## FIX-43 — Slutskärm för omfattande

**Jacobs feedback:** "räcker med de två raderna överst och nederst nu. cta längst upp. fel look på cta. konstigt svart fält. detta var bra i den gamla designen, kolla upp den och harmoniera."

**Vad detta sannolikt betyder:**
- Behåll: scoreboard (tavlan) + arena-rad + story + stats-rad (skott/hörnor)
- Slopa: events-lista (alla mål-rader), spelarbetyg-strip (POTM + alla 22 spelare), hörn-band
- Flytta CTA "Fortsätt →" från botten till TOPPEN (direkt efter scoreboarden eller efter arena-raden)
- Byt CTA-styling till samma look som befintliga primary-knappar i appen
- Lös "konstigt svart fält" — troligen tomt overlay-utrymme efter att CTA flyttats

**Bakgrund:** Mocken `match-report-stalvallen.html` är fortfarande korrekt referens för layouten av varje del, men SCOPE:n minskas. Vi visar bara essensen, inte alla detaljer.

**Implementation:**

1. **Hitta gamla MatchReportView/MatchSummaryScreen** — sök i git-historik (`git log --all -- '*MatchReport*' '*MatchSummary*'`) efter tidigare version före Stålvallen-redesign. Kolla hur den såg ut. "Detta var bra i den gamla designen" — använd den som referens för CTA-styling och layout-omfattning.

2. **Omstrukturera `MatchReportView.tsx`:**
   - **Topp:** Scoreboard (FT-state) — behåll oförändrad
   - **Strax under:** CTA "Fortsätt →" (primary button-stil från designsystemet, inte den copper-gradient som mocken har)
   - **Sen:** Arena-rad (oförändrad) + Story-block (oförändrad)
   - **Botten:** Stats-rad — skott + hörnor i en kompakt rad
   - **Slopa:** Events-lista, hörn-band (separata), spelarbetyg-strip, ratings-foot

3. **Säkerställ ingen ledig svart yta:** Container ska sluta strax efter stats-raden. Inga `min-height` eller `flex: 1` på overlay:en som skapar tomt utrymme.

**Acceptanskriterier:**
- Slutskärmen får plats utan scroll på 380px viewport
- CTA syns direkt efter scoreboarden (övre tredjedelen)
- Inga events- eller spelarbetyg-listor
- Inget svart utrymme efter sista innehållet
- CTA-styling matchar `.btn-primary` eller motsvarande befintlig knapp-stil

**Fallback från förra rundan:** `savedFixture?.report` ska fortfarande ha race-condition-skydd (`savedFixture?.report ? <View /> : <button>Se sammanfattning →</button>`). Behåll det.

---

## FIX-44 — "Fyll bästa elvan" funkar inte i taktikvyn

**Var:** Förmodligen samma "Fyll bästa elvan"-knapp som finns i Plan-fliken (FIX-17), men i en annan vy — taktikvyn (kanske `TacticsScreen` eller där tactik-formationen sätts).

**Symptom:** Knappen syns (screen 3 visar den) men klick gör ingenting.

**Felsöknings-instruktion till Code:**

1. **Hitta knappen:** Sök i kodbasen efter `"Fyll bästa elvan"` — bör returnera 2+ ställen. Plan-fliken har FIX-17 implementerad. Taktikvyn har förmodligen samma label men kopplad till annan handler eller ingen alls.
2. **Verifiera handler:** Knappen i taktikvyn ska anropa motsvarande `handleAutoFill` (eller den befintliga funktion FIX-17 använde).
3. **Återanvänd logik:** FIX-17:s auto-fill-logik bör lyftas till en hook eller utility-funktion som båda vyerna kan använda. Undvik duplicering.

**Acceptanskriterier:**
- Klick på "Fyll bästa elvan" i taktikvyn fyller lineupen med bästa 11
- Samma resultat som i Plan-fliken
- Inga console-errors

---

## FIX-45 — Ticker-färg starkare kontrast

**Var:** `stalvallen-match.css` eller `ScoreboardStalvallen.tsx` — `.module-text-track > span` är den rullande textremsan.

**Idag:** `color: var(--led-red)` med text-shadow för glow. Mot mörk panel-bakgrund (#0A0908) blir röd LED svår att läsa, särskilt på små skärmar (380px). Screen 1 visar "+5° · MULET · V" som klipps mid-meningen.

**Fix-alternativ (välj enligt vad som passar visuellt):**

**A. Byt till amber (gul) LED-färg.**  Matchar klock-displayen och period-mark. Mer kontrast än röd på mörk bakgrund.
```css
.module-text-track > span {
  color: var(--led-amber);
  text-shadow: 0 0 5px rgba(255, 170, 0, 0.55);
}
.module-text-track > span.dim {
  color: rgba(255, 200, 100, 0.55);
}
```

**B. Behåll röd men öka intensitet.**
```css
.module-text-track > span {
  color: #FF6655;  /* ljusare än #FF2A18 */
  text-shadow: 0 0 6px rgba(255, 80, 60, 0.7);
}
```

**Rekommendation:** A (amber). Röd LED reserveras för tavlans NU-prick och kritiska markörer.

**Acceptanskriterier:**
- Ticker-text läsbar mot panel-bakgrund vid 380px
- Mocken-pixel-konsistens — verifiera att resten av LED-paletten fortfarande funkar

---

## FIX-46 — 9-8 stats-notis (valfri, mindre prio)

**Jacobs feedback:** "två matcher med 9-8 — gör en notis, det KAN ju rent teoretiskt bli så."

**Vad:** Vid mål-summa ≥ 15 i en match, lägg till en notis i post-match-anslag eller media-rummet. Inte buggfix — feature.

**Implementation:**
- Trigger: `homeScore + awayScore >= 15` ELLER `Math.abs(homeScore - awayScore) >= 6`
- Anslag: "Mest mål på en match denna säsong" eller "Klassisk målfest"
- Skapa template i `anslag/seasonAnslag.ts` eller motsv.

**Detta är inte blocker — skjut till nästa runda om tid saknas.**

---

## COMMIT-STRATEGI

1. **Commit 1 — Snabbspolning + sekunder:** FIX-42 (BLOCKER). Plus verifiera att Opus inline-fix för sekunder är med.
2. **Commit 2 — Slutskärm + taktikvy:** FIX-43 + FIX-44. Två separata ändringar men relaterade till "första klagomålet efter playtest".
3. **Commit 3 — Visual polish:** FIX-45 (ticker-färg). FIX-46 om tid finns.

---

## KRITISKA INSTRUKTIONER

**Mekaniken är ORÖRD.** Slutskärm-omstrukturering ändrar bara VAD som visas, inte hur data räknas eller spelarbetyg beräknas.

**Snabbspolning är blocker.** Spelet kan inte verifieras helt utan FF. Fixa först.

**Rapportera per FIX med ✅ / ⚠️ / ❌ + en mening.** För FIX-42 specifikt: lista vilka av diagnos-hypoteserna som var rätt orsak.

**Förslag på diagnos-output för FIX-42:** Skicka konsolloggar från en FF-klick-attempt. Visar exakt var state-flödet bryter.
