# CODE-LEVERANS — Orten-fliken redesign + mekanik-fynd

**Datum:** 2026-06-09
**Layout-källa:** `docs/incoming/2026-06-09_design_orten_recut.html` (Fable, godkänd). Implementera Orten-fliken + OrtenMap mot mocken.
**Bygger på:** Patron/Mecenat Fas 2 (commit 8b2beed) — patron-panelen är redan borttagen från KlubbTab; redesignen ska INTE återinföra den.

## Filer
- `src/presentation/.../KlubbTab` (Orten-fliken)
- `src/presentation/components/club/OrtenMap.tsx`

## Låsta designbeslut (från mocken)
1. **Progress-bar-differentiering: ~13 → ~4–5.** Bara actionable/föränderliga får full bar (Bygdens puls, Kommun-relation, Klubbrenommé, Frivilliga-total). Statiska sub-värden (Anläggning/faciliteter) → kompakta siffror/chevron-expand, inte barer.
2. **Gold-token bort** från Frivilliga-siffrorna → `--success`/`--accent`. Guld reserverat för final/mästare.
3. **"Neutral"-status döljs** — relations-tagg bara när relationen rör sig (warm/cold).
4. **Kommun-raden lyft** — copper-ram, fullbredds-knappar (Bjud in/Budget/Bidrag).
5. **Puls-hero med trendpil.**
6. Säsong via `seasonSpanLabel`.
7. **Inget innehåll tappat** — allt komprimerat nås via chevron-rader (mockens princip).

## OrtenMap — noderna bär info nu (Fable-fynd 1)
Idag är kartan vacker men informationslös. Lägg på varje nod: status-prick (färg efter värde, samma trösklar som idag) + subrad (nivå/antal/nästa val). Kartan blir rangordningen i sig — bygdens läge ska gå att läsa ur kartan utan barerna. Behåll nod-topologin + Ortenpuls-mitten. Patronen är INTE en nod (Fas 2 — han står utanför nätverket).

**Nod-fråga (rek, verifiera):** "Sponsorer"-noden matas idag av `sponsorNetworkMood` (kommersiella sponsorer). Per beslut B är Orten bygdens *relations*-yta och mecenaterna är det publika nätverket — kommersiella sponsorer är ekonomi. Rek: noden representerar **Mecenater** (matad av mecenat-data), inte sponsorer. Bekräfta att ingen annan konsument förväntar sig sponsor-noden innan bytet; flagga annars.

## Mekanik-fynd att bygga (display + lätt wiring)
1. **Kommun-agenda hint-rad (Fable-fynd 2).** Surfa agendans koppling till spelarens handlingar ("Bandyskolan räknas"). Verifiera om agenda→aktivitet-linkagen redan finns (`localPolitician.agenda` + `communityActivities`). Finns den → surfa som hint-rad (display). Finns den inte → lägg en read-only mappning agenda→vilka aktiviteter som räknas. Gör dold mekanik synlig.
2. **"I fara"-styrelseuppdrag ekar på Portalen (Fable-fynd).** Ett `boardObjective` med status "i fara" ska ge en portal-signal, inte bara ligga inne på Orten. Liten cross-surface-koppling.

## Rider med (liten städning)
**`sponsorData`-omdöpning.** Fas 2:s patron-emergence bäddar patron-data i ett fält `sponsorData`. Döp om det generiska event-payload-fältet till neutralt (`eventPayload`/`entityData`) eller lägg ett typat patron-slot — så patron inte lever i sponsor-namngivet fält (samma conflation-frö vi rensat två faser i rad).

## PARKERAT — kräver Jacobs beslut, bygg INTE nu
**Frivillig-moral-spaken (Fable-fynd 3).** Kjell på 31 utan handling = mätare utan spak. Två vägar: (a) "uppmuntra"-handling, eller (b) moralen följer pulsen (ingen ny knapp — passar densitets-bantningen bättre). Mekanik-beslut, inte display. Lämna frivillig-moral-visningen som mocken har den tills beslutet är fattat; bygg ingen ny lever förrän dess.

## Acceptans
- Orten-fliken matchar recut-mocken: ~4–5 barer, gold borta, Neutral dold, kommun lyft, puls-trendpil.
- OrtenMap-noder bär status-prick + subrad.
- Agenda-hint synlig; "I fara" ekar på Portal.
- `sponsorData` omdöpt.
- Inget innehåll tappat (chevron-expand för det komprimerade).
- Ingen patron-panel återinförd.
- `npx tsc --noEmit` + test rena.

## INTE röra
Patron/Mecenat-logiken (Fas 1+2 står). Sponsor-systemet (kommersiellt). Frivillig-moral-mekaniken (parkerad). scheduleGenerator, matchCore, currentMatchday utanför säsongsövergång.

**Rapportera:** redesign · map · agenda-hint · Portal-eko · sponsorData var för sig; flagga Sponsorer/Mecenater-nod-frågan.

— Opus, 2026-06-09
