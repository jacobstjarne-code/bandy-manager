# SPEC — Playtest-fixar 2026-05-25 (cupfinal-session)

Åtta fynd från Jacobs playtest. Ordnade i allvarsordning. Varje punkt: symptom → rotorsak/var → åtgärd → verifiering.

**INNAN DU BÖRJAR:** grep-disciplin (CLAUDE.md Princip 2). För varje punkt som säger "grep" — kör den först, läs träffen, ändra sen. Bygg + test efter varje punkt, inte i klump.

Redan fixat av Opus (bara bygg + commit):
- **Screen 6 — cup-vinst-texten.** `src/domain/data/anslag/cupAnslag.ts`, `cup_done_winner` variant 2 omskriven (svenska fel: "det var oss" → "det var vi"; obegriplig sats → "årets första pokal som delats ut i svensk bandy"). Inget Code behöver göra utom bygga.

---

## 1. 🟥 Cupfinalen låser sig i live-läge (BLOCKERANDE)

**Symptom:** Cupfinalen startad i live (FÖRBERED → SPELA). Scoreboard visar HL1, klockan rör sig aldrig, MATCHFLÖDE är tomt. Reload → man hamnar tillbaka i portal. Sim av samma final fungerar.

**Rotorsak (att hitta):** Live-pathen för en cup-final-fixtur fallerar specifikt — ligamatcher live fungerar. Antingen saknar cup-final-fixturen ett fält som live-skärmen kräver (och bailar tyst), eller så fyrar en guard som redirectar till portal.

**Åtgärd:** Traca live-match-init för cup-final-fixturen vs en ligamatch:
- Var startar live-loopen, och vad gör att klockan inte tickar? (matchflöde-generering / advance-tick för cup-fixtur)
- Vilken guard skickar tillbaka till portal vid reload på en cup-final? Jämför villkoret mot ligamatch.
- Trolig misstänkt: cup-final-fixturen har annan struktur (isCup + final-flagga, ev. saknad `roundNumber`/`matchday`-koppling) som live-init inte hanterar men sim-pathen gör.

**Verifiering:** Spela cup-finalen live från FÖRBERED → mål faller, klockan tickar, GRANSKA nås. Reload mitt i → återgår till live, inte portal.

---

## 2. Bandyskola-erbjudande under cupfinalen

**Symptom (screen 1):** ORTEN-kortet "Kommunen erbjuder bidrag om ni startar en bandyskola…" visas samma vecka som cupfinalen. Tonalt fel — under finalen ska inte ett bandyskole-erbjudande poppa.

**Rotorsak:** ORTEN/community-eventet saknar fas-gating, till skillnad från playoff-suppressionen (R3).

**Åtgärd:** Suppressa ORTEN-community-eventet under cupfinal-fasen (`cup_final_pre` / cupfinalhelg). Använd samma mönster som playoff-suppressionen (`suppressIn` / fas-bias). Eventet får återkomma efter finalen.

**Verifiering:** Cupfinalveckan visar inte bandyskole-/ORTEN-erbjudanden. De återkommer omgången efter.

---

## 3. "RESULT" ska vara "RESULTAT"

**Symptom (screen 2):** Cup-resultatkortet (eyebrow + "Cupen: Karlsborg–Målilla 2–3 / Ni vann 3–2 borta") har eyebrow-label `RESULT` — engelska.

**Åtgärd:** `grep -rn '"RESULT"\|>RESULT<\|RESULT<' src/ --include="*.tsx" --include="*.ts"` — hitta eyebrow-strängen på cup-resultatkortet, ändra till `RESULTAT`. (Ligger inte i `LastResultCard.tsx` eller portal/secondary — grep brett.)

**Verifiering:** Kortet visar "RESULTAT".

---

## 4. Tomt presskort på cup-final-granska

**Symptom (screen 4):** GRANSKA efter cupfinalen, MEDIA-kortet visar journalistens namn ("Helena Wikström, Allehanda") men ingen rubrik/brödtext. Ligamatcher får rubrik (screen 8 fungerar) — tomheten är cup-specifik.

**Rotorsak (att hitta):** Antingen anropar cup-final-granskan inte rubrikgenereringen (`pickHeadline` i `journalistHeadlineStrings.ts`, via `journalistService`), eller så saknar `pickHeadline` en kategori som matchar cup-final-kontexten (t.ex. högt målande, förlängning, cup).

**Åtgärd:** Traca GRANSKA→MEDIA-rubrikflödet för cup-final-fixturen. Två utfall:
- Wiring (rubrik genereras inte/passas inte för cup) → fixa anropet.
- Pool-glapp (`pickHeadline` saknar matchande kategori) → **rapportera vilken kategori som saknas till Opus, fyll inte själv** (svensk text = Opus, CLAUDE.md hård regel).

**Verifiering:** Cup-final-granskan visar en faktisk rubrik, inte journalistnamnet som fallback.

---

## 5. Vinstscenen saknar sidfot

**Symptom (screen 5):** Cup-vinst-scenen (CUPMÄSTARE 2026, SP5) ser bra ut men sidfoten/bottomnav fattas — svart yta under CTA:n ner till build-hashen.

**Åtgärd:** Rendera sidfot/bottomnav på cup-vinst-scenen som på övriga skärmar. Om scenen medvetet är fullskärm utan nav — bekräfta med Jacob, men default: lägg sidfoten.

**Verifiering:** Scenen har samma sidfot som andra skärmar.

---

## 6. DINA VAL — oklart + repetitivt + fel pool

**Symptom (screen 7):** Tre saker, alla i `src/presentation/screens/granska/GranskaOversikt.tsx`:

**6a. Oklart vad sektionen är.** Lägg underrubrik under "📋 DINA VAL"-labeln. Opus-text (kopiera exakt):
> Dina beslut den här matchen, och hur de föll ut.

**6b. started_tired-rewiren är inte byggd.** Skärmdumpen visar fortfarande "Rotationen gav energi" på en STARTADE TRÖTT-rad. `STARTED_TIRED_OUTCOMES` finns redan i `managerKvittoText.ts`. Peka `started_tired`-grenen i kvitto-pickern dit i stället för `LINEUP_ROTATION_OUTCOMES`, importera den. (Specat tidigare, landade aldrig.)

**6c. Repetition.** Två rader visar samma "syntes varken på gott eller ont". Rotorsak: seed är match-konstant (`homeScore + awayScore`), så samma typ+riktning ger samma pool-index. Variera per rad: använd `seed + index` (radens loop-index) som pool-index.

**Verifiering:** STARTADE TRÖTT-rader visar trötthetstext (inte rotering); två rader av samma typ+riktning visar olika varianter; underrubriken syns under labeln.

---

## 7. Inkorg-gallring

**Symptom (screen 8):** 47 notiser i inkorgen efter 4 omgångar. Ackumuleras utan utgång.

**Regel (beslutad med Jacob 2026-05-25):**
- Lästa, informativa notiser arkiveras efter 2 omgångar.
- Olästa notiser ligger kvar tills lästa.
- Åtgärdskrävande notiser (beslut/queue-items) ligger kvar tills hanterade, oavsett ålder.

**Åtgärd:** Verifiera först att `InboxItem` (i `SaveGame`) har: läst-flagga, skapad-matchday, och typ-klassning (informativ vs åtgärdskrävande). Saknas något — lägg till (informativ = default). I round-processorn vid omgångsavancering: arkivera (eller ta bort från huvudinkorgen) lästa informativa items vars skapad-matchday är ≥ 2 omgångar bakåt. Rör inte olästa eller åtgärdskrävande.

**Verifiering:** Efter ~4 omgångar ligger inkorgen på en rimlig nivå (lästa informativa gallrade), men olästa och beslut är kvar.

---

## Ordning

3 (🟥 live-hang) först — den blockerar finalspel. Sen 2, 3, 5, 6 (snabba, isolerade). 4 kräver tracing. 7 sist (rör InboxItem-struktur + round-processor, störst yta).
