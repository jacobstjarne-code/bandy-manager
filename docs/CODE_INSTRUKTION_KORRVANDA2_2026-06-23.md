# CODE-INSTRUKTION — Korrvända 2 (pre-match-ytor)

**Datum:** 2026-06-23 · **Av:** Opus · **Till:** Code
**Källa:** `docs/incoming/Sprint 1 - pre-match-ytor.html` (Fable-mock, target-states) + `docs/incoming/KORRVANDA-2-FYND-2026-06-23.md` (backlog). Mocken ÄR den visuella specen för ytorna — den här filen sekvenserar + löser ägarskap. Svensk text markeras `// OPUS_COPY` där Opus äger den (skriv inte Fables draft-copy rakt in — Opus ratificerar).

## STEG 0 — P1: bugg + touch-blockerare (FÖRST)

**H2 — Bjud-in oändlig relation (BUGG).** På Orten kan "Bjud in" klickas i loop → relation stiger obegränsat. Lokalisera invite-handlern (Orten/communityService). Fix: en inbjudan per period (omg ELLER säsong — välj omg, mer kännbart) + tak. Diminishing returns valfritt ovanpå. Ren logikfix, ingen yta.

**H5 — Säsongsbågens knappar odekodbara på touch (touch-blockerare).** Två fix, target i mockens sektion 01:
- (a) **Läges-ratten** (Bygg·Håll·Toppa·Vila) visar bara namn → lägg en mikro-effektrad under varje läge. Dra ur `getPhaseConsequence` om den ger en kort etikett; annars dessa (final): Bygg "form ↑ långsamt", Håll "stabilt", Toppa "3 upp, sen svacka", Vila "vila ben, form ↓".
- (b) **Per-spelare-undantagen "H"/"V"/"↩"** = enbokstäver bakom `title`-tooltip (finns ej på touch). **Skriv ut orden** på knappen (final): "Håll" / "Vila" / "Följ truppen". Ingen hover.

## STEG 1 — P1: tomt-state som vägleder

**G2 — Marknad tom utan väg vidare.** Target i mockens sektion 02. Två fix:
- Notis-pricken på Marknad-pillen tas bort när listan är tom (lova inte handling som inte finns).
- Tomt-state byts från konstaterande ("Inga spelare tillgängliga") till vägledande guide-kort (final copy): rubrik **"Marknaden är tom just nu"**, brödtext **"Spelare dyker upp när klubbar säljer. Vill du hitta egna talanger — skicka ut en scout."**, knapp **"Gå till Scouting →"** (byter aktiv flik till scouting).

## STEG 2 — P2: struktur + densitet (Fable-mock = spec)

**B2 — Klubb pill-nav scrollar/kapas.** Target i mockens sektion 03: byt scrollande pill-rad mot jämnfördelat segment-nav med underline-aktiv (samma språk som FÖRBERED/SPELA/GRANSKA). Gäller ALLA vyer med samma pill-rad — en komponent, ett mönster. Vid 6+ flikar: korta etiketter, aldrig dold scroll.

**G1·G3 — Värvning densitet + enhetlig rad.** Target i mockens sektion 02: spelarrad-typografin normaliseras, **Scouting-raden = sanningskälla** (Georgia-namn, samma täthet). Sälj/Marknad/Fria rättas till den. Tightare dropdown-höjd i Scouting → kortare vy.

**C3·B3·C2 — Intro-texter normaliseras.** Target i mockens sektion 05: en delad `TabIntro`-komponent `{icon, label, text}`. **`src/domain/data/tabIntros.ts` ÄR SKRIVEN (content-complete, Opus)** — exporterar `TAB_INTROS` (10 flikar, nycklar = flik-id exakt), `TabIntro`-typ, `TabIntroKey`. Code bygger BARA komponenten som läser `TAB_INTROS[tab]` och wirar in den under TabBar i BÅDE ClubScreen och TransfersScreen. **Ta samtidigt bort de två konkurrerande intro-ytorna** som finns idag i ClubScreen: `tabDescriptions`-recordet OCH de två `FirstVisitHint`-texterna (orten/ekonomi) — ekonomi-hinten är just den "Kassan/Sponsorer"-text mocken flaggade (B3). En yta, en komponent, en sanningskälla. (Samma FirstVisitHint finns i TransfersScreen — ersätt med TabIntro där också.)

## STEG 3 — P2/P3: Bygget + polish

**E1·E2 — Bygget kontrast + förklaring.** Target i mockens sektion 04: solida kort istället för bleka dashed, hierarki (byggbara lyfts, låsta dimmas medvetet), lås-ikon med villkor utskrivet ("🔒 Värmestuga"), en förklaringsrad överst + en rad om vad varje nod gör. **Copyn ÄR SKRIVEN (Opus):** `FACILITY_DESC` (per nod) + `FACILITY_INTRO` (förklaringsrad) i `src/domain/data/facilityDescriptions.ts` — wira in, ingen OPUS_COPY kvar. **E3 (ratificerat): FÖRBERED aktiv i fas-navet när Bygget öppnas.**

**A1 (ratificerat) — intro-overlay lättas ~15–20 % relativt.** Sänk sluttillståndets overlay-opacity ett snäpp, behåll vinjetten. Ingen ljus skärm.

**A2 — klickhand i intro.** Stäng av `cursor:pointer` + hover-affordans när styrelsekortet renderas i intro-kontext. Behåll på portal (där leder det till Orten).

**C1 — knapp-radbrytning Värvning.** Min-bredd / `white-space:nowrap` eller kortare etiketter så knappar inte bryts mitt i ord.

**D1 — verifiera "Visa introduktionen igen".** I "?"-modalen: bekräfta att knappen triggar portal-intro-overlayn, ej död/dubblerad. Fixa om bruten.

**H1 (ratificerat) — klack-citatets destination.** Deep-link citatet till klack-/supporterkontexten på Orten (surfa/scrolla-till supportersektionen), inte generiska Orten. Finns ingen klack-sektion på Orten → bygg den minimalt så Elin/Bergskurvan möts. Verifiera först.

## COPY-HANDOFF
Opus-copyn för Korrvända 2 är KOMPLETT — ingen OPUS_COPY-runda kvar:
- tabIntros: `src/domain/data/tabIntros.ts` (`TAB_INTROS`, 10 flikar)
- Bygget: `src/domain/data/facilityDescriptions.ts` (`FACILITY_DESC` + `FACILITY_INTRO`)
- G2 guide-text, H5 läges-/knapp-etiketter: final copy inline ovan.
Code wirar in dem; inga literala `// OPUS_COPY`-markörer ska nå spelaren.

## ORDNING
STEG 0 (bugg + touch-block) → STEG 1 (tomt-state) → STEG 2 (struktur) → STEG 3 (polish). Rapportera per steg. Triage: `docs/incoming/` ska tömmas — mock → `docs/mockups/`, backlog → `docs/`, cruft (.DS_Store, _RADERAS/) bort. Gör triagen samma session (README-regel).
