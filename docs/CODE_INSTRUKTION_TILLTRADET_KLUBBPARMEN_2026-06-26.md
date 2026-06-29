# Code-instruktion — Tillträdet + Klubbpärmen

Källa: `docs/incoming/Intro & Guide - Tillträdet + Klubbpärmen (fristående).html` (Claude Design-canvas, 7 frames).
Förberedd av Opus 2026-06-26, grundad mot koden. Reviderad 2026-06-26 efter Codes fynd om `ArrivalScene` + `assistantCoach` (se "Relationen till ArrivalScene"). Läs detta före bygge — designmocken är riktning, inte färdig markup.

---

## Kärnan: två system, en leverans

Designen levererar två separata saker som inte får blandas ihop:

1. **Tillträdet** — ett *flöde*. Händer EN gång vid ny karriär, lämnar dig i Portal. Ersätter den nuvarande tooltip-onboardingen. Diegetiskt: den **befintliga ankomstscenen (styrelsen) körs först**, sen tar **assisterande tränaren** vid och lär dig det praktiska — du *gör* uppgifterna.
2. **Klubbpärmen** — en *plats*. Finns alltid, ett tryck bort i menyn. Ersätter "Hur funkar det?"-modalen. Växer när system låses upp.

F7 i mocken är arkitekturen: Tillträdet är gated engångsflöde (Splash → Namnval → Välj klubb → **ArrivalScene → Tillträdet** → Portal ⟳). Klubbpärmen är en menypost som öppnas när som helst. Bygg dem som två oberoende features.

---

## Relationen till ArrivalScene — alt 2, KLUBBAD

Det finns redan en diegetisk ankomstscen på `/intro`: `src/presentation/screens/ArrivalScene.tsx` (säsong 1; säsong 2+ använder `BoardMeetingScene`). Den är **styrelsebesöket** — kassör + ledamot välkomnar dig, `BoardObjectivesList` visar styrelsens krav, CTA "Sätt igång →".

**Beslut: två steg. Styrelsen först (ArrivalScene, orörd), sen tränaren (Tillträdet).**

- `ArrivalScene` **pensioneras INTE.** Den står kvar som scen 1. Enda ändringen: dess `onComplete` ska rutta till Tillträdet-routen i stället för rakt till `/game/dashboard` (idag `navigate('/game/dashboard', { replace: true })`).
- Tillträdet är scen 2 och framåt: tränar-lett F1–F4. Styrelsemålet visades nyss i ArrivalScene, så **Tillträdets F4 renderar INTE `BoardObjectivesList` igen** — det blir en callback i text (se F4).
- Konsekvens av tvåstegsvalet: en scen är passiv (styrelsen, läsning), nästa är aktiv (tränaren, görande). Det är den enda versionen som motiverar två scener i rad — bygg inte F1 som en tredje vägg av text, F1 är kort och leder rakt in i F2.

---

## Tränarens röst — assistantCoach är GENERERAD, inte "Ragnar"

`game.assistantCoach` (`AssistantCoach`) genereras deterministiskt vid NewGame ur en pool av svenska namn (Leif Berglund, Björn Lindqvist …) — **aldrig hårdkodat "Ragnar".** Den har en av fem personligheter (`calm | sharp | jovial | grumpy | philosophical`) och ett redan byggt citatsystem (`assistantCoachService.generateCoachQuote`).

Därför:

- F1/F2/F4-texten **templatear det riktiga namnet**: förnamn = `coach.name.split(' ')[0]`, efternamn = `coach.name.split(' ')[1]`. Hårdkoda inget namn.
- Texten nedan är medvetet **personlighetsneutral** — grundad och torr, läsbar oavsett om tränaren är `grumpy` eller `jovial`. Skriv inte fem varianter; det är en engångsyta.
- **F3 är undantaget:** coachtipset i öva-hörnan ska komma ur det riktiga systemet — `generateCoachQuote(coach, { type: 'corner', sub: 'default' })` — så det är personlighetskorrekt och matchar exakt den röst + mekanik spelaren möter live.
- Verifiera defensivt att `game.assistantCoach` finns innan Tillträdet (samma mönster som ArrivalScene har för `game.board`).

---

## Vad som ersätts (verifiera usage före radering)

- `src/presentation/components/CoachMarks.tsx` — **ersätts av Tillträdet.** Renderas idag i `PortalScreen` gated på `game.coachMarksSeen`. Designen pekar ut denna explicit (F1/F6).
- `src/presentation/components/HelpOverlay.tsx` — **ersätts av Klubbpärmen.** Designen pekar ut denna explicit (F6).
- `src/presentation/screens/ArrivalScene.tsx` — **ersätts INTE.** Står kvar som scen 1 (se ovan), enda ändringen är `onComplete`-routen.
- `src/presentation/components/FirstVisitHint.tsx` — används i `MatchLiveScreen`. Designen rör den INTE. Lämna orörd.
- `OnboardingHint.tsx`, `ContextualNudges.tsx`, `DashboardNudges.tsx` — bekräftade döda (definierade, exporterade, noll importer, föräldralösade sedan april–maj). Separat `git rm`-städfråga, blockerar inget, körs av Jacob/Code utanför detta flöde.

Deprecieringen i detta pass = CoachMarks + HelpOverlay. Inget annat.

---

## Tillträdet — bygg

### Placering i flödet
ArrivalScene (`/intro`) → ny Tillträdet-route → första Portal-mount. Tillträdet körs när `onboardingComplete` är osatt, annars hoppas det över. ArrivalScene-routingen ändras till att lämna av i Tillträdet, inte i dashboard.

### Fyra steg — med text

`{Tränare}` = `coach.name.split(' ')[0]`, `{Efternamn}` = `coach.name.split(' ')[1]`.

**F1 Ankomst** — diegetisk scen (mörk, `--bg-scene`-tokens, `.h-scene-*`-roller finns redan i `global.css`). Spelaren lämnar precis styrelsebordet; tränaren fångar upp hen.

> **{Tränare} {Efternamn}** · Assisterande tränare
> "Styrelsen gav dig målet. Jag ger dig laget. Två saker innan första matchen — sätt elvan, och lär dig hur vi slår en hörna. Sen är du igång."

CTA: "Visa mig"

**F2 Sätt din elva** — KRITISKT: detta får INTE bli en separat pitch-attrapp. Spelet har redan en startelva-/lineup-yta (matchflödet kollar `game.managedClubPendingLineup`). F2 ska **driva den riktiga lineup-komponenten** med ett tunt tutorial-lager ovanpå (highlight tomt MV-slot, gated CTA tills elvan är giltig). Bygg inte en andra elva-UI.

Framing:
> "Här är truppen. Elva på isen. Du bestämmer — jag säger till om något skaver."

Vid giltig/bekräftad elva:
> "Bra. Det där är ditt lag nu."

**F3 Öva en hörna** — driv den **riktiga hörn-mekaniken**, inte en kopia. `cornerInteractionService.resolveCorner` med `CornerSetup { zone, delivery }`. Zoner = `near | center | far` (NÄRA/MITT/BORTRE), leverans = `hard | low | short` (HÅRT/LÅGT/KORT) — labels redan trogna enums, hämta dem ur enums, hårdkoda inte. Återanvänd `CornerInteraction` i ett "övningsläge" utan matchkonsekvens (ingen state-mutation, bara visa utfall). **Coachtipset = `generateCoachQuote(coach, { type: 'corner', sub: 'default' })`** — inte handskriven text.

Framing:
> "En hörna innan det gäller. Du väljer var den läggs och hur hårt. Titta på zonerna."

Efter slaget:
> "Så funkar det. Under match får du fem sekunder. Nu fick du så lång tid du ville."

**F4 Klart** — överlämning till Portal. Renderar **INTE** `BoardObjectivesList` (visades i ArrivalScene) — callback i text:

> "Det var allt jag har. Resten lär du dig på vägen. Du vet vad styrelsen vill ha. Jag vet vad laget tål. Däremellan spelas säsongen."

CTA (gradient + → + puls — reserverad för *att avancera*, återanvänd den inte på matchhändelse-knappar): "Första omgången →"

Sätt `onboardingComplete = true` när F4 slutförs.

### Överlapp att lösa
PortalScreen har idag (a) en auto-advance-on-mount-effekt och (b) en `isSeason1Round1`-tutorialram ("Lugnare första veckan / En fråga åt gången"). När Tillträdet äger "sätt elva" + "spela omgång 1", avgör: behåller Portal sin season1round1-ram, eller absorberar Tillträdet den? Rekommendation: behåll ramen i Portal (den hör till decisionBudget, inte onboarding) — men verifiera att den inte krockar visuellt direkt efter handoff.

---

## Klubbpärmen — bygg

### Shell
In-world föreningspärm i menyn (F5). Header-band (`--bg-leather`), flik-index, öppet kapitel med prosa. Designen ger den visuella tonen; bygg shell + navigation.

### Kapitel-registry med unlock-predikat
Flikarna i mocken: Hörnor, Matchen, Orten, Klacken, Ekonomi, Slutspel🔒. "Växer när system låses upp" betyder varje kapitel behöver ett unlock-predikat mot riktig game-state, inte en statisk lista.

| Kapitel | Unlock-predikat (klubbat) |
|---|---|
| Hörnor | Alltid (lärs i Tillträdet) |
| Matchen | Alltid |
| Orten | Alltid |
| Klacken | När klack-systemet är aktivt (klackEcho/supporter-flagga) |
| Ekonomi | När B1 Klubbutveckling är upplåst |
| Slutspel | `game.playoffBracket` finns ELLER omgång ≥ 22 |

Bygg en `chapterRegistry` där varje post = `{ id, label, isUnlocked(game): boolean, content }`. Code äger registry + unlock-logik + rendering. Code äger INTE kapiteltexten.

---

## Vad som INTE är Codes

**Kapiteltexten i Klubbpärmen skrivs av Opus**, inte av Code. Prosan ska ha bruksortens protokoll-röst (se mockens Hörnor-kapitel och "Tumregel"-callout för ton). Bygg kapitlen som ett content-modul (`klubbparmContent.ts` e.dyl.) som Opus fyller — Code lägger inte egen text i kapitlen och fabricerar inte platshållarprosa. Lämna content-fälten tomma/stubbade och flagga till Opus vilka kapitel som väntar text.

Tillträdets F1–F4-text står redan i denna instruktion (ovan), godkänd av Jacob. Den är Opus-skriven — Code ändrar inte i den, templatear bara namnet.

---

## Design-canvas-artefakter att ignorera

- `<sc-if value="{{ showReplaces }}">`-blocken och "Ersätter CoachMarks…"-bildtexterna är annoteringar i canvasen, INTE UI.
- `data-screen-label`, `data-drags-parent`, `$preview`-props = canvas-metadata. Ignorera.

---

## Beslut — KLUBBADE 2026-06-26 (bygg enligt detta)

1. **Gating-flagga:** ny `game.onboardingComplete`. Gamla `coachMarksSeen` retireras tillsammans med CoachMarks — migrera inte, pensionera. Sätt `onboardingComplete = true` när F4 slutförs.
2. **Klubbpärmens unlock-predikat:** enligt tabellen ovan.
3. **Emoji:** funktionella state-emoji behålls (🔒 på låst kapitel). Dekorativa/menyikon-emoji → lucide: 📖 → `BookOpen`, 🔔 → `Bell`, ⚙ → `Settings`, 📐 (F3-rubrik) → utan ikon. Linje med typografi-kanonens restriktiva emoji-hållning.
4. **ArrivalScene-relationen: alt 2.** Styrelsen (ArrivalScene) först, orörd; tränaren (Tillträdet) sen. ArrivalScene `onComplete` → Tillträdet-routen, inte dashboard. F4 renderar inte `BoardObjectivesList` — styrelsemålet visas i ArrivalScene, F4 refererar det i text. (Detta ersätter det tidigare beslut #4 om ett board-goal-mikrosteg i F4 — det gällde ett alternativ där styrelsemålet foldades in i Tillträdet; under alt 2 lever det i ArrivalScene.)
5. **Tränarens röst:** `game.assistantCoach` är genererad + personlighetsbärande. F1/F2/F4-text templatear `coach.name`, personlighetsneutral. F3-coachtips = `generateCoachQuote(coach, {type:'corner', sub:'default'})`. Inget hårdkodat "Ragnar".

---

## Kö mot noll — ordning

1. Code: `ArrivalScene.onComplete` → Tillträdet-route (i stället för dashboard).
2. Code: Tillträdet-route + `onboardingComplete`-flagga + F1/F4-scener (rena scen-komponenter, `.h-scene-*`, text enligt ovan, namn templatat).
3. Code: F2 wirear riktiga lineup-komponenten; F3 wirear `CornerInteraction` i övningsläge med `generateCoachQuote`-tips. (Kärnan — riktig mekanik, inte attrapper.)
4. Code: Klubbpärm-shell + `chapterRegistry` med unlock-predikat, content-fält stubbade.
5. Opus: skriver kapiteltext i protokoll-röst.
6. Code: koppla in Klubbpärmen i menyn, ta bort HelpOverlay; ta bort CoachMarks när Tillträdet är verifierat i kontext.

---

## F3 — timer i övningsläge (KLUBBAT 2026-06-26, grundat mot källan)

Codes förslag godkänt, med en precisering och en risk avskriven.

**Risken finns inte.** Jag verifierade `CornerInteraction.tsx` + `InteractionShell.tsx`: hörnan löses redan via `cta={{ label: 'Slå hörnan →', onClick: handleConfirm }}`. `onTimeout` är bara fallbacken som auto-väljer `('near','hard')` om 5s rinner ut. Att släcka timern strandar alltså ingenting — CTA:n bär upplösningen. Practice behöver ingen ny bekräfta-affordans.

**Off-switchen hör hemma på timern, inte på en parallell mekanism.** `InteractionShell` kör idag alltid intervallet i `phase==='choosing'` med `totalSeconds = timer?.seconds ?? timerSeconds ?? 5`. Gör opt-out EXPLICIT — inte "timer saknas = av" (det skulle tyst släcka timern på varje live-panel som utelämnar propen → regression). Lägg `untimed?: boolean` (eller `timer={{ seconds: 0 }}`-konvention) på `InteractionShell`: när satt, (i) starta inte intervallet och anropa inte `onTimeout`, (ii) rendera ingen timer-badge/ring. Default 5s kvar för match → noll regression på de fem live-panelerna.

**`CornerInteraction`** får en `practice?: boolean` som forwardar `untimed` till shellen. Det är ENDA ändringen i komponenten.

**Konsekvens-suppression är INTE CornerInteractions ansvar.** Den hör till Tillträdet-harnesset: practice-`onChoose` resolvar lokalt via `cornerInteractionService.resolveCorner` och matar tillbaka utfallet som `outcome`-propen — ingen store-mutation. Bunta inte ihop "ingen konsekvens" med `practice` inne i CornerInteraction; håll dem isär.

**Coachtipset rörs inte.** `CornerInteraction` genererar redan `generateCoachQuote(coach, {type:'corner', sub:'default'})` internt när den får `coach`. Skicka in den riktiga `game.assistantCoach` — tipset blir personlighetskorrekt gratis.

---

## F2 — vilken lineup-yta (KLUBBAT 2026-06-26, grundat mot källan)

**Den inbäddningsbara vyn är `LineupStep.tsx`.** Verifierat: den är ren presentation — äger ingen state, allt injiceras via props (`startingIds`, `tacticState`, `groupedPlayers`, `canPlay`, `injuredInStarting` + handlers: `onTogglePlayer`, `onAutoFill`, `onSlotClick`, `onAssignPlayer`, `onRemovePlayer`, `onSwapPlayers`, `onFormationChange`, `onNext`). Återanvänd den. Bygg ingen andra elva-UI.

**Harnesset går INTE att återanvända som container.** Lineup-state-maskinen lever inline i `MatchScreen.tsx` (seedning `savedLineup ?? nudge ?? default`, alla handlers, `matchStep` lineup→tactic→start) och är kopplad till match-routing, playoff/elimination-logik, match-modes, laddning, `advance()`. Att montera `MatchScreen` i scen-kontext drar in allt det. Alternativ A (återanvänd containern) = NEJ.

**Klubbat: extrahera harnesset till en hook.** Lyft lineup-state + handlers ur `MatchScreen` till `useLineupEditor(game)` som returnerar `{ startingIds, groupedPlayers, tacticState, canPlay, injuredInStarting, onTogglePlayer, onAutoFill, onSlotClick, onAssignPlayer, onRemovePlayer, onSwapPlayers, onFormationChange }` + själva write-pathen (`setPlayerLineup`). `MatchScreen` refaktoreras att konsumera hooken (beteendebevarande); Tillträdet-F2 konsumerar SAMMA hook och renderar `LineupStep`.

**Varför hook och inte en duplicerad mini-harness:** elvan som sätts i Tillträdet MÅSTE skriva till samma riktiga `game.managedClubPendingLineup` via `setPlayerLineup` — annars sätter spelaren elvan i tutorialen och den följer inte med till första matchen. Det vore ett brott mot promise↔consequence (lektion #41). En duplicerad state-maskin är en mjukare version av samma synd ("bygg inte en andra elva") även om vyn återanvänds. Hooken garanterar identisk write-path och single source.

**Tutorial-lagret är tunt.** `onNext` → gå till F3 (inte `setMatchStep('tactic')`); relabela CTA:n (ge `LineupStep` en `nextLabel?`-prop, ELLER dölj dess footer i practice och rendera Tillträdets egen gate-CTA som läser samma `canPlay`). Coach-framing ovanför. Highlight av tomt MV-slot behövs knappt — `LineupStep` ytar redan no-GK-varningen; luta dig mot den befintliga valideringen.

**Enda verkliga risken — flagga:** hook-extraktionen rör `MatchScreen`, den mest säkerhetskritiska skärmen. Den ska vara beteendebevarande: samma seedningsordning, samma handlers, tester gröna, verifiera att MatchScreens lineup beter sig identiskt INNAN Tillträdet monteras. Det är Codes implementeringspass.

**Körordning F2/F3 efter dessa beslut:** (1) `InteractionShell` `untimed` + `CornerInteraction` `practice`-forward → F3-harness med practice-`onChoose`. (2) `useLineupEditor`-extraktion, MatchScreen grön. (3) F2 monterar hook + `LineupStep` med `onNext`→F3.
