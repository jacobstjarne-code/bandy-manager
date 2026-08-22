# Skutskär-auditens fixordning — genomförande (2026-08-22)

Jacobs order: kör auditens egna fixordning (`docs/incoming/bandy-manager-skutskaer-audit-52009671-2026-08-20.md`, "Rekommenderad fixordning"), punkt 1 och 3–7. Punkt 2 (styrelsens enhetliga dommodell) redan gjord i tidigare session (Grind 1-passet + sex koefficientrundor). Exakt byggordning och scope enligt Jacobs egen numrerade lista i beställningen — High 5 (BatchStack) och Medium 2 (mecenatpoolen) INTE med i den listan, alltså inte byggda i detta pass.

## 1. High 4 — Pressminnet (fixordning punkt 1, del 1) — KLAR

**Rot:** `generatePressConference()`s sex storyline-överlagringar (kaptenstal, kontraktsdrama, heltidsproffs, m.fl.) hade ENDA spärren en per-match slumpchans — ingen räkning av hur många gånger DEN HÄR storylinen redan fått sin fråga. Kaptenfrågan återkom ~åtta gånger, kontraktsfrågan sex raka matcher.

**Byggt:**
- `storylineBudgetOk(story)` i `pressConferenceService.ts` — läser `game.narrativeLog` (Jacobs order: "den byggdes för detta"), max två poster (`press_storyline_${story.id}`) per säsong = en huvudfråga + en uppföljning.
- `GameEvent.storylinePressKey` (nytt fält) — satt av `generatePressConference()` när en storyline-fråga faktiskt väljs. Callern (`roundProcessor.ts`, direkt efter `applyRiskySponsorMaturation`) skriver narrativeLog-posten NÄR FRÅGAN VISAS, inte vid resolution.
- State-gate: `tp_liv1` ("Han går till jobbet klockan sex...") exkluderas helt ur svarspoolen (alla tre slots + fallback, inte bara preferIds) när frågans spelare är `isFullTimePro === true`. `buildPressResponses()` tar nu en `excludedResponseIds`-parameter.

**Tester:** `pressConferenceStoryMemory.test.ts` — 5 tester (dagjobbs-gate positiv/negativ, budget frisk/uttömd/ny-säsong).

## 2. High 6 — Skadekortet (fixordning punkt 1, del 2) — KLAR

**Rot:** `playThroughInjury`-eventet bar redan `relatedPlayerId` OCH en titel med spelarens efternamn (`eventProcessor.ts`) — men `EventCardInline.tsx` renderade bara titeln för `hallDebate`-events. Flera samtidiga skadekort gick inte att skilja åt.

**Byggt:** `getInjuryTag(event, players)` — ren, exporterad funktion i `EventCardInline.tsx`. Bygger `"Förnamn Efternamn · [Mjuk/Mild] skada · N dagar kvar"` från `getInjurySeverity()` + `injuryDaysRemaining`, samma tag-pill-stil som `EventOverlay.tsx`s spelar-tagg (accent-ton, återanvänd, inte omritad).

**Tester:** `EventCardInlineInjuryTag.test.ts` — 5 tester (namn+dagar, mjuk/mild-gräns, två spelare ger två urskiljbara taggar, ingen tagg för andra typer/saknad spelare).

## 3. Medium 6 — Domarcitatet (fixordning punkt 1, del 3) — KLAR

**Rot:** `REFEREE_MEETING_QUOTES.inconsistent` innehöll "Bandy är marginaler. Idag föll de åt er. Ibland inte." — en vinst-fras, vald slumpmässigt OAVSETT matchresultat. Auditen fångade den efter en 3–4-förlust.

**Byggt:** `REFEREE_MEETING_QUOTES_INCONSISTENT` delad i `{ win, loss, neutral }`. `getRefereeMeetingQuotePool(style, outcome)` — neutral-raderna gäller alltid, win/loss läggs bara till för sitt eget utfall, oavgjort får bara neutral. `strict`/`lenient` oförändrade (inga outcome-hävdande rader hittades vid genomläsning) men går genom samma funktion för enhetlig kontrakt. Callern (`matchSimProcessor.ts`) räknar faktiskt utfall från `result.fixture`.

**Text-lucka, ärligt flaggad:** `loss`-hinken har ingen riktig rad — `'[Opus]'`-platshållare. CLAUDE.md:s hårda regel (Code skriver aldrig citat) gäller även här; en förlust-variant av domarcitatet väntar Opus.

**Tester:** `refereeMeetingQuoteOutcome.test.ts` — 16 tester, kontexttabell över alla tre stilar × tre utfall (aldrig tom pool, aldrig fel riktning hävdad, strict/lenient outcome-invarianta).

## Kvalitetsportar (steg 1–3, gemensam batch)

Stash-test-cykel körd (23 nya test-failures mot återställd kod, alla tre delfynd). 2366/2366 gröna (full svit), build ren, stress 10×5 — 0 krascher, 0 invariant-brott.

## Återstår (fixordning punkt 3–7)

4. High 3 — Playoff-barriären
5. Medium 5 (säsongsslutsbarriär) + Medium 1 (sponsordedupe) + Low 1 (next-action)
6. High 2 — Utmattningen (RAPPORT innan kalibrering, inte byggd)
7. Medium 4 (critical per instans) + Medium 3 (Form-etiketten)
8. Medium 7 (deep-link) + Low 2 (PWA-versionsskifte)
