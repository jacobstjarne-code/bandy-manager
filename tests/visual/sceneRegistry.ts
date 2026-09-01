/**
 * Ren data, INGA test()-anrop. Skäl (2026-08-17, Skutskär-auditen B-01-
 * grannfynd): tapTargetGate.visual.ts och rawTokenGate.visual.ts importerade
 * tidigare SCENES direkt från scenes.visual.ts — men den filen kör sina egna
 * test()-anrop på modulnivå. Ett import drar in HELA modulen, så varje fil
 * som importerade SCENES registrerade av misstag ÄVEN scenes.visual.ts:s
 * pixel-diff-tester i sin egen körning. Osynligt lokalt (mina -g-filter
 * exkluderade dem av en slump), men CI:s tap-target-gate-jobb kör filen utan
 * filter — där föll scenes.visual.ts:s egna baseline-asserts inne i FEL jobb.
 * Den här filen är den enda sanningen för scenlistan; ingen av de tre
 * konsumenterna (scenes.visual.ts, tapTargetGate.visual.ts,
 * rawTokenGate.visual.ts) äger den längre.
 */
export const EXTRA_HEIGHT = 3600

// Tredje fältet (snapshotName) krävs bara när flera SCENES-rader delar samma
// scen-id (t.ex. Granskas fyra flikar) — annars kolliderar test-titel och
// snapshot-filnamn på id ensamt.
//
// Fjärde fältet (fixedOverlay) gäller EventOverlay/PressConferenceScene —
// position:fixed/inset:0-modaler positionerar sig mot HELA viewporten, inte
// mot data-scene-content-elementets egen (ofta nedskjutna) box, så en
// element-screenshot av data-scene-content fångar fel yta helt. fixedOverlay
// skippar den croppen och tar en vanlig sid-screenshot istället — rätt
// eftersom modalen FAKTISKT täcker hela skärmen i produktion.
//
// Femte fältet (extraHeight) gäller UTESLUTANDE taktik/granska-spelare/
// -shotmap/-analys/primary-smfinal-vs-deadline/primary-event-vs-farewell —
// SEX scener, inte fyra (se tapTargetGate.visual.ts:s egen EXTRA_HEIGHT-
// rättelse-kommentar för varför den gamla "uteslutande fyra"-uppgiften var
// stale). dev-navet (statiskt, ~1500px vid 390px bredd) + dessa ytors egen
// höjd överskrider vad Playwrights scroll-och-stitch klarar pålitligt genom
// DevScenesScreens egen overflow:auto-container. Ingen av dem används för
// vikningsbedömning — extraHeight påverkar aldrig ett mått ordern faktiskt
// behöver (det gör bara PORTAL_VIEWPORT i baseline.visual.ts).
export const SCENES: [string, string?, string?, boolean?, number?][] = [
  ['cup-victory'], ['sm-victory'], ['season-arc'], ['portal-cards'], ['efterklang'],
  ['squad'], ['portal'], ['tranare'], ['board-a'], ['board-b'], ['board-c'],
  ['stillness'], ['granska'], ['upptakt'], ['ekonomi'], ['playercard'],
  // AUDIT DEL 3 (2026-08-10): Granska matchtypsmatrisen — förberedelse för
  // Design-uppdraget (DESIGN_UPPDRAG_GRANSKA_DEL4_2026-08-10.md steg A).
  ['granska-cup'], ['granska-cup-final'], ['granska-slutspel'], ['granska-sm-final'], ['granska-avsked'],
  // AUDIT DEL 4 (2026-08-12) — baseline-täckning: Granskas tre övriga flikar
  // saknade helt egen snapshot (granska-* täckte alltid bara Översikt, default-
  // fliken) — TacticBoardCard/BÄNKEN/GranskaShotmap-fixarna denna dag var
  // därmed osynade oavsett hur mycket de ändrades.
  ['granska', 'text="Spelare"', 'granska-spelare', undefined, EXTRA_HEIGHT],
  ['granska', 'text="Shotmap"', 'granska-shotmap', undefined, EXTRA_HEIGHT],
  ['granska', 'text="Analys"', 'granska-analys', undefined, EXTRA_HEIGHT],
  ['season-a'], ['season-b'], ['season-c'],
  ['miljoheader-karlsborg'], ['miljoheader-rogle'],
  ['tabell'], ['season-header'], ['season-noplayoffs'], ['season-fired'], ['finalhelg'], ['annandagen'],
  // 5.1 Sommaren (SLUTTEST_KO.md, 2026-08-18) — fyra baseline-scener, CODE_
  // INSTRUKTION_SOMMAREN_2026-08-17.md:s matris. Saknade baseline fram till
  // denna rad — osynade av hela svepet tills nu, samma lucka-klass som
  // AUDIT DEL 4:s Taktiktavlan/EventOverlay-fynd ovan.
  ['sommaren-s2'], ['sommaren-titelforsvarare'], ['sommaren-tomt'], ['sommaren-siffra'],
  // V1-uppföljning (RELÄ-Code-DS-konformans-svep1-3.md, 2026-08-20): HalfTimeSummaryScreen
  // saknades helt — inte bara i denna lista utan i hela dev-scenes-galleriet (se
  // DevScenesScreen.tsx). Ingen grind svepte den, så V1:s "två btn-primary" (strukturellt
  // ofarligt idag, try/catch-grenar) hade inte fångats om det slutat vara ofarligt.
  ['halftime-summary'],
  ['transfers-closed'], ['transfers-open-nobids'], ['transfers-onebid'], ['transfers-multibids'],
  ['arrival'], ['squad-trupp', 'button:has-text("Trupp")'],
  ['momentumbar'], ['tacticmodal'], ['submodal'], ['spakb'],
  // AUDIT DEL 3 (2026-08-11): baseline före ombyggnad, Club 'Klubben i korthet'.
  ['club-fresh'], ['club-established'],
  // AUDIT DEL 4 (2026-08-12) — baseline-täckning: Taktiktavlan, EventOverlay,
  // PressConferenceScene saknade tidigare varje dev-scen (se DevScenesScreen.tsx).
  ['taktik', undefined, undefined, undefined, EXTRA_HEIGHT],
  ['event-overlay', undefined, undefined, true],
  ['press-conference', undefined, undefined, true],
  // AUDIT DEL 4 (2026-08-12) — täckningslucka: Primary-rangordningen
  // (initCardBag.ts) hade aldrig fotograferats i konkurrens. De fyra
  // takregel-scenerna (baseline.visual.ts) varierar bara atmosfärslagret —
  // deadline (90) vann Primary-platsen i tre av fyra bara för att inget
  // högre viktat villkor råkade vara sant samtidigt. Samma lucka-klass som
  // lät FÖRESLÅS-badgen vara osynlig en månad.
  ['primary-smfinal-vs-deadline', undefined, undefined, undefined, EXTRA_HEIGHT],
  ['primary-event-vs-farewell', undefined, undefined, undefined, EXTRA_HEIGHT],
  // "Skydd eller illusion?"-fyndet (SLUTTEST_KO.md, 2026-08-20): tio scener
  // fanns redan i DevScenesScreen.tsx:s galleri men var osvepta av alla fem
  // grindar — samma lucka-klass som halftime-summary ovan (V1-uppföljning),
  // bara aldrig stängd. lineup-filled (withLongestSurnames) är dessutom
  // 6.4 post 21:s enda befintliga edge-case-fixtur (extremt långa
  // efternamn) — den satt redan byggd, bara oregistrerad.
  ['trupp-blandat'], ['trupp-kris'], ['lineup-empty'], ['lineup-filled'],
  ['portal-tom'], ['portal-normal'], ['portal-full'], ['portal-grind'],
  ['portal-bid-single'], ['portal-bid-multi'],
  // Skutskär-auditen, test 21 (2026-08-23): MatchLiveScreen ("spelets mest
  // komplexa skärm") hade NOLL dev-scene-täckning — samma familj som
  // halftime-summary/lineup-filled ovan, bara aldrig byggd förrän nu (se
  // DevScenesScreen.tsx för hur location.state fejkas via <MemoryRouter>).
  ['match-live'],
  // Människoupplevelse-auditen (7024f8a, 2026-08-24), H1: Bygget hade NOLL
  // dev-scene-täckning — inte importerad i DevScenesScreen.tsx alls, samma
  // lucka-klass som "Skydd eller illusion?" (SLUTTEST_KO.md rad 112-117).
  // Bara trädet (stängt) registreras här för allmän occlusion/raw-token/
  // screenshot-svep. 'bygget-avveckling' (H1:s nav-kollisionsfynd) är EN
  // egen scen i DevScenesScreen.tsx men INTE i denna lista — den kräver två
  // riktiga klick (Bygg ut → nod) för att nå sheeten, vilket clickText-fältet
  // (ETT klick) inte kan uttrycka. Den scenen sveps istället av en egen
  // regressionstest, se tapTargetGate.visual.ts.
  ['bygget'],
  // Jacobs order (2026-08-24): avskedsvägen lyft ur ratchet-skulden. Ingen
  // BottomNav-produktionsrutt (GameGuard-blocket) — allmän svep räcker.
  ['game-over'], ['game-over-historik'],
  // Dev-scen-integritet 2026-09-01: byggda ytor som tidigare saknade varje
  // permanent svep. CallupModal är position:fixed och kräver sid-screenshot.
  ['club-selection'], ['season-share'], ['callup-modal', undefined, undefined, true],
  // Route-ratchet 2026-09-01: tre riktiga slutspelsskärmar på samma
  // deterministiska resa — öppning, avgjorda kvartsfinaler och SM-guld.
  ['playoff-intro'], ['qf-summary'], ['champion'],
]
