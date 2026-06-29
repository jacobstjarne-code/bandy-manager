# Code-instruktion — MatchLive-omdesign (live-vyn)

Källa: `docs/incoming/Live-vy - före och efter (fristående).html` (Claude Design, 5 frames + interaktionsmodell-note).
Förberedd av Opus 2026-06-26, grundad mot `MatchLiveScreen.tsx` render-stacken. Sammanflätas med typografi-passet (kanonen) på den här skärmen — se sist.

---

## Tesen

Feeden är ryggraden. Allt annat slimmas, viks in eller dockar så att den synliga feeden växer från ~196 px (3–4 rader) till ~528 px (8–9 rader) — **utan att något tas bort**. Bandykänslan rörs inte: tavlan-som-tavla, referatrösten, hörn-/utvisningsdramat står kvar. Det här är den konkreta fixen för auditens matchvy-punkt (tavla + status äter toppen, händelserna hamnar under viklinjen).

## Nuvarande stack (verifierad i `MatchLiveScreen.tsx` return)

Inuti `<LedgerFrame phase="spela">`, i ordning: `ScoreboardStalvallen` (bär `ticker`, `events`, penalties, period/minut) → `MatchControls` (kontroller + `momentumHistory` + stats-footer) → referee-strip (inline IIFE, rå `rgba` + `--font-mono`) → **aktiva interaktionspaneler** (`CornerInteraction`/`Penalty`/`Counter`/`FreeKick`/`LastMinutePress`, wrappade i `flexShrink:0`-div **ovanför** feeden) → `SentValCard` (spakB) → `CommentaryFeedStalvallen` (feeden, sist) → modaler/overlays.

---

## Fem grepp — mot riktiga komponenter

**Grepp 4 — slimma ledger-chromet under spel (+30 px).** `LedgerFrame phase="spela"` ska rendera en tunn rad live: `Forsbacka 3–2 Skutskär · OMG. 2 · SPELA`, inte full klubb/manager/säsong-header. Orientering behövs en gång, inte hela matchen. Ändringen bor i `LedgerFrame` (phase-styrd), inte i MatchLiveScreen.

**Grepp 2 — vik in tickern i feeden (+18 px).** Sluta skicka `ticker={atmosphericTicker}` till `ScoreboardStalvallen`. Injicera istället `atmosphericTicker`-källan som `kind:'atmosphere'`-rader i `feedRows` (feeden har redan atmosphere-rader). Atmosfärstexten levde på två ställen — nu en, där den hör hemma. Tavlan tappar sin ticker-rad.

**Grepp 1 + 5 — momentum + siffror i utfällbar låda (+130 px), tidslinjerna slås ihop.** `MatchControls` buntar idag kontroller + momentum + stats. Dekomponera: **kontrollerna stannar dockade** (slim rad: MATCH ⏸ ⏩ ⇄ ⚙), **momentum-grafen + stats-footern flyttar in i en ny utfällbar SIFFROR-låda** med handtagsrad vid nederkanten (tryck → fälls upp över nedre feeden, dra ner → stäng — spelaren lämnar aldrig matchen). Tavlans mål-tidslinje och momentum-grafen delar x-axel → en räcker; målmarkörerna bakas in i momentum-grafen i lådan. Detta är det strukturellt tyngsta greppet (MatchControls-dekomponering) — ta det medvetet.

**Grepp 3 — tavlan komprimeras mellan moment (+136 px), BAKOM FLAGGA.** `ScoreboardStalvallen` får ett kompakt läge under spel (≈64 px) som **expanderar och tänds** vid mål/paus/straff (mer dramatiskt, inte mindre). I mocken är detta en Tweaks-toggle. **Bygg bakom en feature-flagga, default AV.** De andra greppen (slim ledger, ticker-fold, SIFFROR-låda) är säkrare och ska landa först; tavel-kompressionen är den dramatiska biten som kräver playtest innan den slås på.

## Interaktionsmodellen — den verkliga strukturella deltan

Idag renderas de aktiva interaktionspanelerna **inline ovanför feeden** (`flexShrink:0`), så när en hörna fyr trycks feeden ner och allt reflowar. Mocken vill ha dem **dockade underifrån som ett överlägg** — tavla + feed står kvar och reflowar inte, panelen glider upp från nederkanten. Det är ändringen: flytta `{(activeCorner || …) && (…)}` -blocket från inline-position till ett botten-dockat lager (position/överlägg), feeden behåller scroll-position bakom.

Panelernas **innehåll ändras inte** — `CornerInteraction` m.fl. ÄR designsystemets ratificerade matchpanel (zoner NÄRA/MITT/BORTRE + leverans HÅRT/LÅGT/KORT mot `cornerInteractionService`). Det som ändras är (a) dockningspositionen och (b) commit-knappens stil.

**Commit-knappen är INTE spelets advance-CTA.** Flat koppar, ingen pil, ingen gradient, tidsstyrd dränering (5s). Gradient + → + puls är reserverat för att avancera — samma kanon som Tillträdet F4 och `LedgerFrame`-stampen i DESIGN-DECISIONS. Om `CornerInteraction`-commit idag använder gradient/pil ska den bytas till flat-koppar-varianten.

Högsta risken i hela passet ligger i två ställen: MatchControls-dekomponeringen (grepp 1) och interaktions-dockningen (z-index-lager, feeden som behåller scroll, 5s-timerns dränering). Ta dem var för sig med playtest emellan.

---

## Rör inte (bandy-identiteten)

Tavlan som tavla, referatrösten i feeden, hörn-/utvisnings-/räddningsdramat — allt kvar. Detta är komprimering av dubbletter och omflyttning av lager, inte en ny matchvy. `ScoreboardStalvallen`-identiteten (LED, vi/dom-färger) rörs inte i grepp 4/2; bara dess ticker-rad (grepp 2) och dess kompakt/expand-läge bakom flagga (grepp 3).

## Canvas-artefakter att ignorera

`<sc-if value="{{ showMeasures }}">`, `efterBoardExpanded`, "TAVLA ≈64 px"/"≈528 px"-mätchipsen, `data-screen-label`, `data-drags-parent` = canvas-mätverktyg och frame-metadata. Bygg dem inte.

---

## Sammanflätning med typografi-passet

Kartan (`MAP-TYPOGRAFI-MIGRERING`) lägger MatchLive sist i skärm-ordningen, sammanflätat med den här omdesignen — gör dem tillsammans på den här skärmen så den inte rörs två gånger. MatchLive-siter i kartan: `MatchLiveScreen:1469` (`micro-ruling` + rå `rgba` → token — det är referee-strippen i stacken ovan). När du ändå bygger om strippen/lagren: applicera `.h-micro` + tokenisera den råa `rgba`-domarmetan samtidigt. Övriga match-relaterade siter (`MatchHeader`, `MatchLaddning*`, `Ceremony*`) följer sina kart-rader.

## Kö mot noll — ordning

1. `LedgerFrame phase="spela"` → slim-rad (grepp 4). Lägst risk, gör först.
2. Ticker → feed-rader (grepp 2). `atmosphericTicker` blir atmosphere-rader; ta bort `ticker`-propen från tavlan.
3. Dekomponera `MatchControls`: kontroller dockade + ny SIFFROR-låda (momentum + stats + sammanslagen tidslinje) (grepp 1/5). Playtest.
4. Docka interaktionspanelerna underifrån + commit-knapp till flat koppar (interaktionsmodellen). Playtest.
5. Tavel-kompression bakom flagga, default AV (grepp 3). Slå på i playtest, utvärdera dramat.
6. Samtidigt på den här skärmen: `.h-micro` + rå-`rgba`-token på referee-strippen och övriga MatchLive-kart-siter.

---

## Källgrundning 2026-06-26 — tre korrigeringar (Opus, mot faktisk `MatchLiveScreen.tsx` + `MatchControls.tsx` + `CornerInteraction.tsx`)

Stacken ovan är verifierad oförändrad. Tre saker justerar bygget:

**1. MatchControls-dekompositionen är INTE den tunga biten — riskbilden i grepp 1/5 var fel.** `MatchControls` är ren presentation utan egen state: tre prop-drivna block (kontrollrad, `<MomentumBar>` prop-driven, `<StatsFooter stats={calculateLiveStats(currentMatchStep)}>` — ren funktion). `momentumHistory` + `currentMatchStep` beräknas i MatchLiveScreen och skickas ner. Att lyfta ut SIFFROR-lådan är därför en mekanisk split (flytta `MomentumBar` + `StatsFooter` till en ny `SiffrorDrawer`-komponent, kontrollraden stannar), inte en state-utfläkning som MatchScreen. **Den verkliga risken är enbart låd-mekaniken** — slide-up över feed, z-index, scroll-bevarande. Och det är SAMMA risk som interaktions-dockningen.

→ **Bygg den botten-dockade overlay-primitiven EN gång** (slide upp från nederkant över feeden, dra ner för att stänga, feeden behåller scroll bakom, z-index-lager). Återanvänd den för BÅDA: SIFFROR-lådan (grepp 1/5) och interaktions-dockningen. Det reducerar "två högrisk-bitar" till "en delad primitiv + två konsumenter". Bygg primitiven först, isolerat, med playtest — sen hänger båda på den.

**2. Grepp 2 (ticker→feed) har en dubblett-fälla.** `atmosphericTicker` är inte ren atmosfär — den bygger `parts` av väder + publik + **de tre senaste målen** + andra matchers resultat. Målen ligger REDAN i feeden som goal-events. Dumpar du hela `atmosphericTicker` som atmosphere-rader dubbeltrycks målen. → Vik bara in de delar som inte redan finns i feeden: väder, publik, andra-matchers-resultat. Hoppa recent-goals-delen (feeden äger den). Ticker-propen tas bort från tavlan som planerat.

**3. Commit-knappens kanonbrott är PILEN, inte gradienten.** Verifierat: `CornerInteraction` använder redan `cta={{ variant: 'copper' }}` → `interaction-cta-copper` (flat koppar, ingen gradient). Men labeln är `'Slå hörnan →'` — med den reserverade `→`. Pilen är förbehållen avancera-CTA:n. → Ta bort pilen: `'Slå hörnan'`. Gradienten behöver inte röras (finns inte). Verifiera samma sak på `PenaltyInteraction`/`CounterInteraction`/`FreeKickInteraction`/`LastMinutePress` commit-labels — droppa ev. `→` där också.

**Justerad körordning efter grundningen:** steg 1 (LedgerFrame slim) och steg 2 (ticker→feed, med dedup ovan) är ofarliga — gör först. SEDAN: bygg botten-dock-primitiven isolerat (playtest), montera SIFFROR-lådan på den (grepp 1/5), montera interaktionspanelerna på den + droppa commit-pilen (interaktionsmodellen). Tavel-kompression (grepp 3) sist, bakom flagga. Typografi-siten (referee-strippen) tas när strippen ändå rörs.

---

## Botten-dock-primitiven — grundad spec 2026-06-27 (Opus, mot `LedgerFrame.tsx` + `CommentaryFeedStalvallen.tsx` + `global.css` z-skala + `#root`)

Det Jacob kallar grepp 3 (SIFFROR-panelen) och grepp 4 (interaktions-dock) delar **en** primitiv. Här är den specad mot källan så Code inte gissar lager/positionering.

**Positioneringskontext — kritiskt.** `#root` är `max-width: 430px; margin: 0 auto; position: relative; overflow: hidden`. En `position: fixed`-dock spiller ut till hela desktop-bredden (fel — den ska ligga i 430px-kolumnen). Docken ska därför vara `position: absolute; left: 0; right: 0; bottom: 0` inom en positionerad förälder. Sätt `.lf-root` (LedgerFrame) till `position: relative` och montera docken där. Då hålls den i matchkolumnen, inte viewporten.

**Z-lager — använd befintliga tokens, uppfinn inga.** `global.css` har redan skalan:
- Interaktions-dock → `z-index: var(--z-interaction)` (500). Blockerande, kräver svar, ligger över allt annat i matchvyn. Token finns och är semantiskt exakt.
- SIFFROR-lådan → `z-index: var(--z-overlay)` (400). Informativ peek, ligger över feed/innehåll men UNDER en aktiv interaktion (400 < 500 — en hörna ska aldrig döljas av siffror).
- Feeden och scen-innehållet ligger kvar under båda (ingen egen z behövs).

**Feeden behåller scroll — varför det funkar.** `CommentaryFeedStalvallen` har sin egen intern scroll-container (`.commentary-feed`, `scrollTop=0` på nya rader, nyast överst). En absolut-positionerad dock över nederkanten reflowar INTE feedens box → scroll-tillståndet rörs inte. Det som idag pushar feeden är att interaktionspanelerna renderas inline (`flexShrink:0`) OVANFÖR den. Flytta dem till docken → ingen reflow. Nyaste raderna sitter överst och förblir synliga; docken täcker äldre rader längst ned, vilket är ok (den är transient).

**Slide-mekanik.** `transform: translateY(100%) → translateY(0)`, ~220ms ease-out (matchar `.screen-enter`/scen-transitionerna). Stäng = omvänt. Lägg en pull-handtag-affordans överst på SIFFROR-lådan (dra ner / tap utanför stänger). Interaktions-docken stängs inte manuellt — den löser sig själv (svar → utfall → feed-rad → auto-dismiss).

**Fokus-dim för interaktion (valfri men rekommenderad).** För den blockerande interaktions-docken: dimma feeden bakom med en scrim. Mönstret finns redan i `coachPulse` (`box-shadow: 0 0 0 4000px rgba(0,0,0,0.65)`) eller en enkel scrim-div på `z-index: 499` (precis under docken). SIFFROR-lådan får INGEN scrim — den är en peek, inte en modal.

**Botten-offset.** Matchvyn (LedgerFrame) har ingen BottomNav (likt `.arrival-scene`). Ankra docken i `.lf-root`-botten med `padding-bottom: var(--safe-bottom)`. Om `.lf-stamp` (commit-CTA) ska synas samtidigt som SIFFROR-lådan, lägg lådans botten ovanför stämpelhöjden; interaktions-docken bär sin egen CTA (flat koppar, ingen pil) och behöver inte samexistera med stämpeln.

**Innehållet är oförändrat — bara MONTERINGEN flyttar.** Interaktionspanelerna (`CornerInteraction` m.fl.) renderas idag inline; flytta mount-punkten till docken, rör inte panelernas inre. SIFFROR-lådan = `MomentumBar` + `StatsFooter` lyfta ur `MatchControls` (mekanisk split, se korrigering 1) in i lådan; kontrollraden stannar i sin nuvarande position.

**Bygg primitiven först, isolerat, med playtest** (tom dock som slidar upp/ner på rätt lager i 430px-kolumnen) innan någon konsument hängs på. Sen: SIFFROR-lådan, sen interaktions-docken.

---

## CODE-TICKET — botten-dock-primitiven

Speccen ovan ("Botten-dock-primitiven — grundad spec") är förarbetet. Denna sektion är den körbara ticketen. Läs speccen först; börja sedan här.

### Leverabel

En `<BottomDock>`-komponent i `src/presentation/components/match/BottomDock.tsx` med tillhörande CSS-klasser i `src/presentation/styles/ledger.css` (inga nya filer utöver dessa två). Komponenten monteras i `MatchLiveScreen.tsx` som en tom debug-instans utan konsument-innehåll.

### Interface

```ts
interface BottomDockProps {
  open: boolean
  variant: 'peek' | 'block'  // peek = SIFFROR-låda, block = interaktionspanel
  onClose?: () => void        // obligatorisk för peek; block stängs programmatiskt
  height?: number             // pixlar, default 280 (peek) / auto (block)
  children?: React.ReactNode
}
```

### CSS-klasser i ledger.css

```css
.lf-dock                  /* wrapper: position:absolute left/right/bottom:0, translateY(100%), transition */
.lf-dock.open             /* translateY(0) */
.lf-dock--peek            /* z-index: var(--z-overlay) [400], ingen scrim */
.lf-dock--block           /* z-index: var(--z-interaction) [500], scrim på z 499 */
.lf-dock-handle           /* pull-handtag överst på peek-varianten (24px bred, 4px hög pil) */
.lf-dock-scrim            /* absolut bakgrundsdim för block-varianten */
```

Slide-mekanik: `transform: translateY(100%)` → `translateY(0)`, `transition: transform 220ms ease-out`. Matchar `.screen-enter` i global.css.

Notera: `.lf-root` har redan `position: relative` (ledger.css rad 21) — ingen ändring behövs där.

### Acceptanskriterier — binärt pass/fail

1. **Kolumnlåst:** med docken öppen på desktop (1280px viewport) sitter dockens kanter innanför 430px-kolumnen. Kontrollera: `getComputedStyle(dockEl).width` ≈ `430px`, inte `1280px`.
2. **Z-lager korrekt:** `peek` renderas på z-index 400 (`--z-overlay`), `block` på z-index 500 (`--z-interaction`). Scrim för `block` på z-index 499. `peek` har ingen scrim.
3. **Slide in/ut:** öppna → docken glider upp inom 220–240 ms. Stäng → glider ner. Ingen teleport (display:none toggle utan transition).
4. **Pull-handtag på peek:** tap på handtaget eller tap på scrim-ytan (om ingen scrim — tap utanför dockens box) anropar `onClose`. För `block`: ingen handtag, `onClose` saknas i propen.
5. **Feed-scroll orörd:** med `block`-docken öppen, öppna webbinspektören, kolla `.commentary-feed`s `scrollTop` före och efter mount — värdet ska vara oförändrat. Inga reflows i feedens föräldraelement.
6. **Safe-bottom:** dockens innehåll har `padding-bottom: var(--safe-bottom)` (env-variabeln, 0 på desktop, säker zon på iOS-notch).
7. **Build + tester gröna.**

### Playtestprotokoll (innan konsumenter monteras)

Montera en debug-instans i `MatchLiveScreen` med två knappar utanför feeden:

```tsx
<BottomDock open={peekOpen} variant="peek" onClose={() => setPeekOpen(false)} height={280}>
  <div style={{ padding: 20, color: 'var(--text-light)' }}>PEEK debug</div>
</BottomDock>
<BottomDock open={blockOpen} variant="block" onClose={() => setBlockOpen(false)}>
  <div style={{ padding: 20, color: 'var(--text-light)' }}>BLOCK debug</div>
</BottomDock>
```

Kör playtestet på smal vy (375 px) och på desktop. Alla sju acceptanskriterier ska passera. Ta bort debug-knapparna och debug-innehållet vid commit — de ska inte ligga kvar i koden.

### Avgränsning — explicit ut ur denna ticket

- `MomentumBar` / `StatsFooter` lyfts INTE ut ur `MatchControls` än (nästa ticket)
- `CornerInteraction` / `FoulResolution` / övriga interaktionspaneler monteras INTE i docken än
- Commit-pilens restyling görs INTE
- Tavlans kompaktläge (grepp 3) rörs INTE
- Ticker-to-feed-rader (grepp 2) ingår INTE

Risken i hela MatchLive-passet bor i slide-mekaniken + z-lagringen. Isolera den här. Konsumenter hängs på när Jacob godkänt primitiven i playtest.

---

## UPPFÖLJNING 2026-06-27 — dedikerad dock-slot i LedgerFrame (clip-fix)

Grundat av Opus mot `MatchLiveScreen.tsx` (debug-mount) + `LedgerFrame.tsx` + `ledger.css`.

**Fynd:** debug-`<BottomDock>` monteras som direkt barn till `<LedgerFrame>`, vilket placerar
den inuti `.lf-content { overflow: hidden }`. Docken är `position: absolute` mot `.lf-root`
(relative) — så den reflowar inte feeden (kriterium 6 håller på den punkten). MEN klippning
styrs av `overflow` på DOM-förfäder, inte av offset-föräldern. Eftersom docken bor i
`.lf-content`-subträdet kan `.lf-content`s `overflow: hidden` klippa den del av docken som
går utanför `.lf-content`s box.

**Varför det oftast funkar ändå (men är skört):** `.lf-content` är `flex: 1` och slutar vid
`.lf-root`-botten när ingen stämpel/flikrad finns. Under spel finns `.lf-stamp` bara vid
matchslut/paus, så oftast sammanfaller botten och docken klarar sig. En stämpel eller flikrad
flyttar `.lf-content`-botten upp och då klipps dockens nederkant.

**Åtgärd:** ge `LedgerFrame` en dedikerad dock-slot som renderas direkt i `.lf-root`,
UTANFÖR `.lf-content`. Konkret:
- Lägg en valfri prop `dock?: ReactNode` på `LedgerFrame`.
- Rendera `{dock}` som syskon till `.lf-body`/`.lf-stamp`, direkt i `.lf-root` (som redan är
  `position: relative`). Då är `.lf-root` offset-förälder OCH närmaste `overflow`-klippare
  — ingen `.lf-content`-clip.
- MatchLiveScreen skickar `<BottomDock>`-instanserna via `dock=` istället för som children.
- `.lf-root` har redan `overflow: hidden` — docken slidar upp inifrån `.lf-root`-botten,
  vilket är exakt rätt klippgräns (inget sticker ut nedanför matchkolumnen).

**Avgränsning:** rör INTE `BottomDock`-API:t (open/variant/onClose/height/children) eller
CSS-klasserna. Det här är bara WHERE docken monteras — en slot i LedgerFrame. Ren rendering.

**Acceptans:** PEEK och BLOCK slidar upp fullt synliga oavsett om `.lf-stamp` finns (testa
både under spel och vid matchslut då stämpeln "TILL GRANSKNING" syns). Ingen avklippt topp.

**Sekvens:** efter Jacobs PEEK/BLOCK-playtest. Visar playtestet ingen synlig clip i praktiken
är det fortfarande värt att göra — men då som härdning, inte brådska. Visar det clip är det
blockeraren för att hänga SIFFROR-lådan på primitiven.
