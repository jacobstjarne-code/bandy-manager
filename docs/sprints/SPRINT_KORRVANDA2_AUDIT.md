# Korrvända 2 — stängningsaudit (2026-07-28)

**Underlag:** `docs/CODE_INSTRUKTION_KORRVANDA2_2026-07-28.md` (denna omgångens
order) + `docs/mockups/Sprint 1 - pre-match-ytor.html` (visuell spec) +
`docs/CODE_INSTRUKTION_KORRVANDA2_2026-06-23.md` (originalordern).

## Verifieringsmetod — läs detta först

Denna session kör i en VS Code-extension-miljö utan browser-pane eller
dev-server-kontroll (verifierat: `tool_search` efter playwright/browser/
devtools/screenshot gav noll träffar). **STEG C är enligt ordern i sin helhet
UI-verifiering på 375px — den kunde jag INTE göra.** Där jag skriver
"verifierat i kod" nedan betyder det: läst render-logiken, spårat villkor,
i vissa fall jämfört mot motsvarande fungerande kod på en annan yta — aldrig
en observation av pixlar. CLAUDE.md är tydlig på den punkten (och en
overifierad, nyligen tillagd sektion i samma fil hävdar att Code i skrivande
stund SKA ha browser-tillgång — se separat rad i "Ej levererat" nedan).

---

## STEG A — copy-läckor (blockerande)

- [x] **A1** — `SeasonArcCard.tsx`. Verifierat i kod: OPUS_COPY-markören +
  Codes draft-uttryck (`+form / –ben` m.fl.) borttagna, ersatta med exakt
  stängningsorderns final-uttryck (`form ↑ långsamt` / `stabilt` / `3 upp,
  sen svacka` / `vila ben, form ↓`). Commit `8717eb3d`.
- [x] **A2** — `TransfersScreen.tsx`, tomma marknaden. Verifierat i kod:
  markör borttagen, rubrik/brödtext/knapptext bytt till exakt given
  final copy, knappen är nu `className="btn btn-primary"` (grep bekräftar:
  enda `btn-primary` på skärmen). Commit `47e4f53d`.
- [x] **A3** — svep. `grep -rn "OPUS_COPY" src/` gav 3 träffar, **ingen är en
  läcka**, ändrade INGET av dem (textägarskap är Opus, ordern var explicit):
  - `TranareTab.tsx:74` — `.filter(e => e.text !== '// OPUS_COPY')`: en
    GUARD som filtrerar BORT det sentinel-värdet om det förekommer i data,
    inte ett läckt värde i sig. Grep-verifierat att ingen datakälla någonsin
    SÄTTER `text: '// OPUS_COPY'` — guarden är i praktiken död kod idag, men
    ofarlig kvar.
  - `TabIntro.tsx:8` — samma guard-mönster, samma slutsats.
  - `CeremonyRetirement.tsx:53` — `{/* Ceremony headline — OPUS_COPY */}` är
    en ATTRIBUERINGSKOMMENTAR ovanför redan levererad, färdig text
    ("Läktaren reser sig en sista gång...") — inte en platshållarmarkör i
    samma mening som A1/A2 hade. Ingen läcka.

## STEG B — restfynd

- [x] **B1** — notis-pricken. Verifierat i kod: `incomingBids` renderades
  aldrig på Marknad (bara `groups`-listan där), men Sälj-fliken har redan en
  🔥-badge per spelarrad med samma filter (rad ~354) — utan egen prick.
  Valde: flytta signalen dit payoffen faktiskt är (Sälj), inte bara ta bort
  den. Commit `47e4f53d`.
- [x] **B2** — klack-citatets avsändare. Verifierat i kod, INGEN ändring
  behövdes: `KlackenSecondary.tsx:36` navigerar redan med exakt
  `state: { tab: 'orten', section: 'klack' }`, och `ClubScreen.tsx:42-43`
  läser `location.state.tab`/`.section` och skickar vidare till `OrtenTab`,
  som redan mappar `klack → 'section-supporter'` och scrollar dit. Hela
  kedjan var redan hel.
- [ ] **B3** — sex flikar på ClubScreen. **INTE kodfixad, riskflaggad.**
  `TAB_LABELS` har 6 poster (Träning/Ekonomi/Orten/Akademi/Minne/Tränare),
  `<TabBar>` anropas utan `variant`-prop → default `'segment'`, dokumenterad
  för ≤5 flikar. CSS (`tabs.css`): `.tab-bar-seg-btn { flex:1; white-space:
  nowrap }`, ingen `overflow-x`/ellipsis-fallback på `.tab-bar-segment` —
  vid overflow växer raden bredare än viewport (ingen wrap, ingen scroll),
  inte döljs bakom clip. 4 av 6 etiketter är 7 tecken (bold, versaler,
  0.8px letter-spacing, 11px) i en 375px-bredd delad på 6 — matematiskt
  trångt. **Inte visuellt bekräftat** (ingen browser). Fixade INTE själv:
  ordern föreslår "korta etiketter" som lösning, men att korta en etikett
  är att skriva ny spelarvänd svensk text — Codes hårda regel (CLAUDE.md:
  "SVENSK TEXT — CODE SKRIVER ALDRIG") förbjuder det. Behöver antingen
  Opus-korta etiketter eller en ren CSS-åtgärd (mindre font/padding/
  letter-spacing) — den senare rör jag inte utan Jacobs go, eftersom jag
  inte kan se om det faktiskt löser det utan att se skärmen.
- [x] **B4** — `FACILITY_INTRO`. Verifierat i kod: raden satt inuti
  `mode==='betrakta'`-blocket, flyttad ut så den renderas oavsett läge.
  Commit `664c576f`.

## STEG C — overifierade mock-punkter (samtliga: ingen browser tillgänglig)

- [ ] **mock-A1** — intro-overlay-opacitet. **Ej lokaliserad.** Sökte igenom
  tre kandidatskärmar (`IntroSequence.tsx`, `ArrivalScene.tsx`,
  `TilltradeScreen.tsx` steg 1 OCH steg 4) — alla tre har en STATISK
  overlay-gradient (ingen fas-/stegberoende opacitetsskillnad någonstans).
  Hittade ingen kod där ett "sluttillstånd" har en LÄGRE overlay-opacitet än
  ett tidigare läge. Antingen ligger detta i en fjärde skärm jag inte
  identifierat, eller så är ändringen genuint ogjord. Mock-filen
  (`Sprint 1 - pre-match-ytor.html`) är ett bundlat/komprimerat HTML-skal
  jag inte kunde läsa rakt av. **Behöver Jacob/Opus peka ut exakt skärm +
  moment**, annars gissar jag på fel fil.
- [x] **mock-A2** — klickhand på styrelsekort i intro. **Redan korrekt,
  ingen ändring.** `BoardObjectivesList`s `ObjRow` sätter `obj-row-clickable`
  (som bär `cursor:pointer`) BARA när `onNavigate`-prop finns.
  `ArrivalScene.tsx:165` anropar `<BoardObjectivesList objectives={objectives}
  max={3} />` — ingen `onNavigate` — ingen pekare-cursor. Portalens
  `BoardObjectivesSecondary.tsx` wrappar samma lista i `.portal-secondary-
  card` (som SJÄLV har `cursor:pointer` i CSS) och en `onClick` som
  navigerar till Orten — pekaren finns kvar där. Grepp bekräftar: ingen
  `cursor:pointer`-träff kopplad till styrelsekort i intro-kontext.
- [x] **mock-C1** — knapp-radbrytning i Värvning. **Redan fixad, ingen
  ändring behövdes.** Strängen "Uppgradera till Satsning (50 tkr)" kommer
  från `AkademiTab.tsx:37`s `nextLevelLabel`, renderad i knappen på rad
  176-183 — den har REDAN `style={{ maxWidth: 220, whiteSpace: 'nowrap' }}`
  (rad 180). Ordens gissning på `ScoutingTab.tsx`/`BidModal.tsx` stämde
  inte (rätt fil är `club/AkademiTab.tsx`) — kontrollerade båda gissade
  filerna också, inga liknande långa knapptexter där.
- [ ] **mock-D1** — "Visa introduktionen igen". **Hittade ingen sådan knapp
  eller "?"-modal alls.** Genomsökte: `GameHeader.tsx`s två ikonknappar
  (`BookOpen` → Klubbpärmen, `Settings` → en meny med bara "Spara spel"/
  "Ladda spel"), grep efter "introduktionen", "Visa intro", `HelpCircle`/
  `CircleHelp`, "portal-intro"/"IntroOverlay" i hela `src/` — noll träffar
  utöver `ArrivalScene.tsx`s "Hoppa över introduktionen" (en annan knapp,
  hoppar över introt, inte visar det igen). Funktionen ordern beskriver
  ("?"-modal med en re-trigger-knapp för portal-intro-overlayn) verkar inte
  finnas i kodbasen under något namn jag hittat. Kan inte avgöra om den är
  trasig — den ser ut att aldrig ha byggts. Behöver Opus/Jacob bekräfta.

## Kvalitetsportar

```
npx tsc --noEmit                                    → rent
npm test -- --run                                   → 1399/1399 gröna
npm run build                                       → grönt, lint:design-guard ✓
grep -rn "OPUS_COPY" src/                           → 3 träffar, alla klassade ovan (A3), inga läckor
grep -rn "#[0-9a-fA-F]{6}" src/presentation/*.tsx    → alla träffar pre-existerande, dokumenterade undantag
                                                        (ClubBadge.tsx heraldik, ConfettiParticles.tsx
                                                        SPEC-LYDNAD, DevScenesScreen.tsx dev-only,
                                                        KlubbparmOverlay.tsx hex bara i kommentar)
npm run lint:text-guard / lint:design               → gröna
```

## Ej levererat (med orsak)

- **B3** — riskflaggad, inte kodfixad. Kräver antingen Opus-korta etiketter
  eller Jacobs go på en ren CSS-justering (utan att jag kan se resultatet).
- **mock-A1** — inte lokaliserad. Ingen av de tre rimliga kandidatskärmarna
  har en fasberoende overlay-opacitet. Behöver exakt skärmpekare.
- **mock-D1** — funktionen (en "?"-modal med re-trigger-knapp för
  portal-introt) hittades inte alls i kodbasen. Kan vara ospecificerad,
  aldrig byggd, eller byggd under ett namn jag missat.
- **STEG C i sin helhet** — ingen av punkterna är visuellt bekräftad på
  375px. Allt ovan är kodläsning, inte observation.
- **En separat notering, inte del av denna ordern:** `CLAUDE.md` innehåller
  (overkommitterat, filtidsstämpel 2026-07-27) en ny sektion
  "BROWSER-VERIFIERING FÖRE RAPPORT" som hävdar Code i desktop-appen har en
  inbyggd browser-pane och kan starta dev-servern. Denna sessionen (VS Code-
  extension) har ingen sådan tillgång — flaggat till Jacob i föregående
  svar, orört här, rör jag inte filen vidare utan besked.

## Nya lärdomar till LESSONS.md

Inget nytt mönster som inte redan täcks av befintliga lärdomar (SVENSK
TEXT-regeln höll: stoppade mig från att själv korta B3:s etiketter). Värt
att notera för nästa audit-runda: Opus egna filgissningar i ordertexten
(ScoutingTab/BidModal för mock-C1, generisk "?"-modal för mock-D1) stämde
inte alltid — värt att verifiera platsen innan man antar att en gissad fil
är rätt, särskilt när "MCP-avbrott" nämns som skäl till att auditen inte
nådde fram (dvs. gissningarna själva är overifierade, inte bara fynden).
