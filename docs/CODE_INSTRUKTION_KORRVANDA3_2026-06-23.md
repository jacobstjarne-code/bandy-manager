# CODE-INSTRUKTION — Korrvända 3 (match-flödet)

**Datum:** 2026-06-23 · **Av:** Opus · **Till:** Code
**Källa:** `docs/incoming/KORRVANDA-3-MATCHFLODE-2026-06-23.md` (Fable-fynd M1–M15) + två mockar i `docs/incoming/`: `CTA mot bottennav - monsterfix.html` (M1/M2/M3, delad CSS-regel) och `Inbox + Dina val - tathet och hierarki.html` (M12/M15). Mockarna ÄR target-state. Den här filen sekvenserar + bär mina rulings + final copy.

**FÖRST — committa working-tree.** `tabIntros.ts` (14 flikar) och `facilityDescriptions.ts` (10 noder + intro) är ifyllda av Opus men OCOMMITTADE (de var OPUS_COPY-stubbar i fabcd0a4). Plus GAP 1–3-copyn i createNewGame/roundProcessor/seasonEndProcessor/HistoryScreen/CeremonyRetirement. **Committa dem — fyll dem INTE på nytt; de är klara.** Verifiera med en läsning om handover-noten säger annat.

## STEG 0 — P1: CTA bakom bottennav (blockerare — du kan inte starta match)

**M1+M3 + systemfix.** Mock `CTA mot bottennav` sektion 03 = spec. Roten: fullskärmsscener och modaler tar inte höjd för det fasta bottennavet (60 px). Fixa MÖNSTRET, inte de två instanserna:
- Varje fullskärmsyta/scrollregion: `padding-bottom: calc(var(--bottom-nav-height) + var(--safe-bottom) + 12px)`.
- Flytande/sticky CTA: `position: sticky; bottom: calc(var(--bottom-nav-height) + var(--safe-bottom))` — aldrig under navet.
- Modaler: `max-height: calc(100dvh - var(--bottom-nav-height) - 28px)`, flexkolumn, `.modal-body { overflow-y:auto }`, CTA = sista icke-krympande barnet (sticky i kortets botten).
- **Referens:** portalen efter cup-match gör redan rätt — match-intro + halvtidsmodal ska ärva den layouten.
- Lägg en regression-vakt: primär-CTA ska ha ≥ nav-höjd marginal till viewport-botten.

**M2 + M2-bekräftat — blå fokusruta i navet (systemiskt, syns på Trupp/Tabell/Match).** Webbläsarens default `:focus`-outline läcker. En `:focus-visible`-regel för hela bottennavet med appens egen markering (accent), aldrig blå systemruta. En regel löser alla flikar.

## STEG 1 — P1: copy/label som tappades (små, exakta)

**M5 — "HELGEN" → "CUPHELGEN".** Genre-label i pre-portal-scenen, cup-finalhelg-varianten, står fortf. "⬩ HELGEN ⬩". Byt till **"CUPHELGEN"**. (Begärdes förra korrvändan, tappades.)

**M6 — ta bort tautologin.** Cupfinal-modalen har genre-rubrik "⬩ CUPFINALEN ⬩" + textrubrik "Cupfinal." direkt under. **Ta bort textrubriken**, låt brödtexten börja direkt på "Två lag kvar…". Gäller troligen fler scen-varianter med samma dubblering (genre-label + identisk h-rubrik) — rensa dem alla.

## STEG 2 — P1/P2: match-flödets sanning (mina rulings)

**M7 — visa straffarna som händelser.** Straffläggningen avgör matchen men syns bara som slutsiffra ("Straffar 4–3"). Visa varje straff (skytt/miss) som händelse i tidslinjen + live-flödet. Design→Code, ingen mock — följ befintlig händelse-radstil.

**M9 (Opus-ruling) — straffar i statistiken, ingen dubbelräkning.** Bekräftat: **straffar i ordinarie matchtid räknas som skott + på mål (P2) — behåll, det är konsekvent.** Straffläggningen (M7) är en SEPARAT fas efter oavgjort och får **aldrig** mata skott-/på-mål-/mål-räknarna i shotmap/konvertering — den är presentationell i tidslinjen + egen slutsiffra. Säkerställ i matchCore att shootout beräknas skilt från skottaggregeringen (gör det redan — verifiera bara att M7:s nya händelse-rendering inte råkar inkrementera skottstatistiken).

**M8 (Opus-ruling) — EN konverteringsdefinition.** Idag två formler under samma namn: `GranskaShotmap.tsx:211` använder `scoredCount/onTargetCount` (83%), rad 229 + `GranskaAnalys:144` använder `goals/shots` (47%). **Renodla till `mål / totala skott` överallt** (matchar Hittills + Analys), etikett "Målkonvertering". Då blir matchens 83% → ~21% och slutar se tokig ut. (Alternativet — behåll båda men döp om till "träffsäkerhet" vs "målkonvertering" — är rikare men lägger UI-yta; välj enhetlig om inte Jacob säger annat.)

## STEG 3 — P2: hierarki-mockar (Fable-mock = spec)

**M12 — inboxen andas.** Mock `Inbox + Dina val` sektion 01 = spec. Tre grepp: (a) "Kräver svar" som kort, "Nyheter" som tunna en-radsposter (ikon + titel + omg); (b) lästa dämpas (muted text) så olästa drar blicken; (c) repeterade typer rullas ihop till en grupp-post med antal + "Visa ›" som expanderar. Samma anti-brus-princip som portal-beats. **Grupp-etiketter (final copy):** `"{n} nemesis-uppdateringar"`, `"{n} mediaröster · {källa}"`, `"{n}× {titel}"` (t.ex. "2× Birgitta Nordin på besök"). Singular faller tillbaka till normal post (gruppera först vid ≥2).

**M15 — "Dina val" som utfallsrader.** Mock sektion 02 = spec. Varje val = resultat-stripe (grön/grå/röd) + beslut-rubrik + spelarnamn + utfallsmening + siffran framträdande till höger (trötthet-% eller ✓). **Outcome-copy (final, Opus):** kapten som gav effekt → `"Ledarorden satte sig i omklädningsrummet."` (grön, ✓ "gav effekt"). Startade trött (neutral) — rotera deterministiskt så tre i rad inte är identiska: `"Klarade matchen utan att sjunka."` / `"Höll måttet, ingen påverkan."` / `"Gjorde sitt, varken mer eller mindre."` (grå, %-tal + "trötthet"). Behåll berättelsen i underraden, men siffran och stripen bär snabbläsningen.

## STEG 4 — P2/P3: cupvinst-polish

**M10 — cupvinst-skärmen: behåll bottennavet.** Idag ligger app-headern kvar men navet är borta → ser ut som bugg. Eftersom headern finns ska navet också finnas (konsekvent chrome). Design→Code.

**M11 — cupvinst-modalens backdrop för ljus.** Standardisera scen-modal-backdropen till EN delad token/overlay-stil (samma dämpning som Cuphelgen-modalen), inte per-modal opacitet. Alla pre-portal-scener identiskt mörka bakom.

## GODKÄNT (ingen åtgärd)
M4 presskonferensen, M13 Trupp, M14 Portal/Tabell/Cup, M-straff matchsammanfattning — alla ✓ enligt Fable.

## COPY-HANDOFF
All Korrvända-3-copy är final i denna fil (M5 label, M12 grupp-etiketter, M15 outcome-rader). Ingen OPUS_COPY-runda.

## ORDNING
STEG 0 (CTA/nav-blockerare + fokusring) → STEG 1 (label/tautologi) → STEG 2 (straffar + konvertering) → STEG 3 (inbox + Dina val) → STEG 4 (cupvinst). Rapportera per steg. **Triage:** töm `docs/incoming/` samma session — två mockar → `docs/mockups/`, `KORRVANDA-3-MATCHFLODE` → `docs/`, cruft (.DS_Store, _RADERAS/) bort.
