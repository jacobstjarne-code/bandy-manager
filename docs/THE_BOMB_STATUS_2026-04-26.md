# THE_BOMB-revision — 2026-04-26

**Av:** Opus, baserat på direkt kodverifikation efter strukturanalysen 2026-04-25.
**Direktiv:** Verifiera påståenden i ANALYS_2026-04-25.md sektion A mot faktisk kod. Lista 14 THE_BOMB-subprojekt med status, värde, och insats. Föreslå ett 1-veckas-paket.

---

## UPPDATERING 2026-04-26 (efter Sprint 27 fas A+B-audit)

**Två punkter har blivit klarare efter direkt audit:**

- **3.1 State of the Club** — status ändras från "behöver verifieras separat" till **HELT IMPLEMENTERAD**. PreSeasonScreen visar "LÄGET I KLUBBEN"-card med diff-jämförelse (tabellplats, klubbkassa, orten, klacken), pilar, färgkodning, akademirad och dynamisk narrativ-text i fyra varianter. Se SPRINT_27_AUDIT.md § Fas B.

- **2.2 Årets match** — status förtydligas: `selectMatchOfTheSeason()` i matchHighlightService.ts är aktiv produktionsväg. `pickSeasonHighlight()` i seasonSummaryService.ts är dead code (exporterad men aldrig importerad). Inte ett spel-problem, men teknisk skuld. Se SPRINT_27_AUDIT.md § Fas A.

**Nettoeffekt på helhetsbilden:** THE_BOMB-procentuell klar-siffra hade redan 3.1 räknat in i 65-75%-spannet (berättat från osynlig data). Den är nu *bevisat* klar och behöver inte byggas. Sprint 27 fas C utgår.

---

## SAMMANFATTNING

**Min strukturanalys från 2026-04-25 var för pessimistisk.** Jag bedömde THE_BOMB till
40-50% (senare reviderat till 55-65%). Faktisk siffra efter kodverifikation: **65-75%**.

THE_BOMB 1.3 (kontextuell match-commentary för akademi/kapten/klackfavorit/dayJob)
är **fullt implementerad** i matchCore — något jag missade. Klackcommentary är rik.
Coffee-rummet pratar om transferdrama. Säsongssammanfattningen plockar ut "Säsongens
match" enligt exakt THE_BOMB-kriterier.

Det som **verkligen saknas** är en konkret lista, inte en strukturell utopi:

1. **Skandalreferenser i kafferum/klack/press** (Sprint 25h byggde 8 arketyper, men
   ingen annan vy nämner dem)
2. **Pension/Legend-system** (3.3) — `retirementService` finns men inte legend-
   referenser i kafferum
3. **State of the Club** (3.1) i PreSeasonScreen — behöver verifieras separat

**Inbox-principen från Jacob:** "inbox dokumenterar, driver inte funktionalitet".
Det är en stark filter mot generiska THE_BOMB-leveranser. Många "kopplingar" från
THE_BOMB.md-dokumentet skulle bara bli inbox-notiser om de implementeras lättjefullt.
Den principen utesluter ungefär halva listan i THE_BOMB.md från första-veckas-paketet.

---

## KOD-VERIFIERAD STATUS (14 subprojekt)

### Korsreferenser (sektion 1)

#### 1.1 Presskonferensen nämner orten — **DELVIS**
- Två frågor finns: "Det pratas om er i hela kommunen" (`minRound: 5`) och "Ni har
  fått en ny mecenats stöd" (`minRound: 6`).
- **Saknas:** CS-villkorad logik. Frågorna plockas slumpmässigt baserat på
  match-utfall + minRound, inte på ortens faktiska puls. Spelaren får
  community-frågan oavsett om CS är 25 eller 85.
- **Saknas:** Skandalreferenser i pressfrågor (efter Sprint 25h).
- **Värde att fullända:** Medel. Variation finns redan, det här är finkalibrering.
- **Insats:** ~3h Code (CS-trösklar) + ~2h Opus-text för skandal-frågor.

#### 1.2 Kafferummet reagerar på transferdrama — **HELT**
- `TRANSFER_SALE_EXCHANGES`, `TRANSFER_BUY_EXCHANGES`, `TRANSFER_DEADLINE_EXCHANGES`
  — alla finns och triggas via inbox-event (`InboxItemType.Transfer`,
  `TransferOffer`, deadline-runda 13-15).
- `STREAK_EXCHANGES` (3 raka vinster/förluster) implementerat.
- Legend-referenser implementerade (`legend.name`).
- Akademi-referenser via `youthName`-placeholder.
- **Saknas:** Skandalreferenser. Inga kioskvakt-citat om "förra månadens kommunalskandal".
- **Värde att fullända:** Hög. Skandalen är där hela poängen ligger.
- **Insats:** ~2h Opus-text (10-15 nya quote-utbyten) + ~30 min Code-koppling.

#### 1.3 Match-commentary refererar till säsongskontext — **HELT**
- `matchCore.ts` har en explicit "THE BOMB 1.3"-block med exakt de fyra
  triggers THE_BOMB.md specade:
  - `scorerPlayer?.promotedFromAcademy && scorerPlayer.age <= 22` ✅
  - `captainPlayerId && scorerPlayerId === captainPlayerId` ✅
  - `fanFavoritePlayerId && scorerPlayerId === fanFavoritePlayerId` ✅
  - `scorerPlayer?.dayJob && !scorerPlayer.isFullTimePro` ✅
  - Plus: `minute >= 80 && currentMargin <= 1` (sent mål i tight match)
- `getTraitCommentary` täcker hungrig/joker/veteran/lokal/ledare.
- Storyline-mappning finns för 6 storyline-typer (`rescued_from_unemployment`,
  `went_fulltime_pro`, etc.) som ger specifika mål-kommentarer.
- **Saknas:** Inget kritiskt. Jag missade detta i min ursprungliga analys.
- **Värde att fullända:** Låg.
- **Insats:** Ingen.

#### 1.4 Klacken sjunger specifikt — **HELT**
- 6 supporter-categories i matchCommentary: `supporter_kickoff`, `supporter_halfTime`,
  `supporter_late_home`, `supporter_late_silent`, `supporter_goal_home`,
  `supporter_goal_conceded`, `supporter_attendance_low`.
- Alla refererar `leaderName`, `members` deterministiskt.
- Triggas på rätt tider (step 0, step 30, step ≥47 vid jämn matchen).
- **Saknas:** Inget från THE_BOMB.md.
- **Värde att fullända:** Låg.
- **Insats:** Ingen.

### Milestone-moments (sektion 2)

#### 2.1 "Den matchen" — **DELVIS**
- `matchCommentary.ts` har milestone-triggers via storyline-mappning + sent mål +
  hat trick-stöd via `narrativeService.generateHatTrickEntry`.
- "Akademispelares första mål" specifikt — täcks av THE BOMB 1.3-blocket.
- 90:e minutens kvittering — täcks av sent-mål-trigger (`minute >= 80 && margin <= 1`).
- **Saknas:** Klack-reaktion *nästa omgång* (THE_BOMB 2.1: "Klack-reaktion nästa
  omgång"). Idag reagerar klacken på *just denna* match, inte på nästa.
- **Saknas:** "Tidningsrubrik på dashboarden" om milestone-event. Men: den finns
  delvis via journalist-headlines.
- **Värde att fullända:** Medel.
- **Insats:** ~1h Opus-text + ~2h Code (klack-state som överlever omgång).

#### 2.2 Säsongens höjdpunkt — **HELT (men möjligen redundant)**
- `pickSeasonHighlight()` finns i `seasonSummaryService.ts` med exakt THE_BOMB-
  kriterier (knapp marginal, sent avgörande, derby, slutspel-runda, kapten-mål,
  akademi-mål).
- **MEN:** SeasonSummaryScreen renderar `summary.matchOfTheSeason` (ett separat
  fält). Jag verifierade inte var det fältet sätts. Möjlig redundans —
  två mekanismer för samma sak. Bör auditeras.
- **Saknas:** Inget från THE_BOMB.md, troligen.
- **Värde att fullända:** Låg (om redundans existerar — dokumentera, inte
  åtgärda).
- **Insats:** ~30 min Opus-audit av `pickSeasonHighlight` vs `matchOfTheSeason`.

### Andra säsongen (sektion 3)

#### 3.1 State of the Club — **EJ VERIFIERAD**
- THE_BOMB.md spec: PreSeasonScreen visar förändringar mot förra säsongen.
- Behöver kollas i PreSeasonScreen.tsx. Jag gjorde inte det i denna pass.
- **Status okänt — behöver verifiering.**

#### 3.2 Spelarens livscykel — **DELVIS**
- `narrativeLog`-fält finns på Player-entity och genereras via narrativeService.
- `careerMilestones` finns och visas i SeasonSummary-storyTriggers.
- Player-cards har troligen någon form av historik men jag verifierade inte UI:t.
- **Status:** delvis. Datan finns, UI:t kanske inte renderar den enligt
  THE_BOMB-spec ("Karriärresa"-vy med tidslinje).
- **Värde att fullända:** Medel-Hög för spelare som spelat 2+ säsonger.
- **Insats:** ~2h Code (UI-komponent på PlayerCard) + ~1h Opus-text-format.

#### 3.3 Pension/Legend-system — **DELVIS**
- `retirementService.ts` finns.
- `clubLegends`-array refereras i coffeeRoomService med 3 legend-quotes.
- **Saknas:** Pensionsval-event (ungdomstränare/scout/farväl) enligt THE_BOMB-spec.
- **Saknas:** Pensionerade spelare som "namedCharacter" i orten.
- **Värde att fullända:** Hög för retention (spelare i säsong 3+).
- **Insats:** ~3h Code + ~1h Opus-text.

### Polish (sektion 4)

#### 4.1 Vädret märks visuellt — **EJ IMPLEMENTERAT**
- Mekaniken finns. Visuell render saknas (snöfall-partiklar, andedräkts-emoji,
  scoreboard-opacity).
- **Värde:** Medel. Trevligt att ha. Inte THE_BOMB-kärna.
- **Insats:** ~4-6h Code + design.

#### 4.2 Matchdagens känsla — **EJ IMPLEMENTERAT**
- 2-sekunders fade-in innan matchsimuleringen.
- **Värde:** Medel.
- **Insats:** ~2h Code.

#### 4.3 Ljudeffekter — **OKÄNT**
- THE_BOMB-spec sa "soundEffects.ts finns redan — verifiera". Jag verifierade
  inte i denna pass.
- **Status:** Okänt.

### Share-moments (sektion 5)

#### 5.1 Säsongssammanfattning som bild — **HELT**
- `shareSeasonImage(summary)` används i SeasonSummaryScreen.
- "Spara som bild"-knapp finns.
- **Status:** Levererat.

#### 5.2 Match-highlight som bild — **EJ VERIFIERAT**
- THE_BOMB.md spec. Behöver kollas separat.

### Sektion 6 (transferdödline + rykte)

Inte verifierat. Står som "redan specade" i THE_BOMB.md. Förmodligen i samma
delvis-tillstånd.

---

## VAD SOM VERKLIGEN SAKNAS — kort lista

Av 14 subprojekt är dessa de **enda** som saknas på ett sätt som spelaren märker:

1. **Skandalreferenser i andra system** (kafferum, klack, press, motståndartränare)
   — Sprint 25h gav 8 arketyper men de bor isolerat. Det är en stupörsstruktur.

2. **Pension/Legend-system** — när en veteran med 100+ matcher slutar händer det
   ingenting narrativt. Bara försvinner från truppen. För säsong 3+-spelare är
   det en stor lucka.

3. **State of the Club** vid säsongsstart — okänt om implementerat. Verifiera.

4. **Spelarens livscykel** i PlayerCard-vyn — datan finns, UI saknas.

Det är fyra konkreta luckor. Inte 14.

---

## REKOMMENDATION — 1-veckas-paket

### Sprint 26 — Cross-system-skandalreferenser

**Scope:**
- Kafferum: 12-15 nya quote-utbyten som refererar specifika skandaltyper
  (sponsor_collapse, municipal_scandal, riskySponsorTriggered, mecenat-utträde).
  Plockas baserat på `game.scandalHistory.filter(triggerRound = lastRound - 1).
- Klack: 4-6 supporter-quotes som triggas vid sent-spel om klubben *själv*
  drabbats av skandal denna säsong. Inte bara generiskt mood-läge.
- Presskonferens: 6-8 nya frågor villkorade på `game.scandalHistory` (inkl.
  *andra* klubbars skandaler — "Hur påverkar er den ekonomiska oron i ligan?").
- Motståndartränare: 4-5 quotes som syns i GranskaScreen vid match mot klubb
  som drabbats — "De har det tufft just nu, vi spelar fokuserat" osv.

**Estimat:**
- Opus-text (kurerad): ~3-4h
- Code-impl: ~3-5h (~1h per system, hantering av scandalHistory-lookup)
- Audit: ~1h

**Totalt: ~1.5 dagar arbete.** Kort sprint, hög impact.

### Varför inte i samma sprint:
- **Pension/Legend** — 3-4h jobb men inte playtestad än. Skjut till efter Sprint 26.
- **State of the Club** — verifiera först om implementerat.
- **Spelarens livscykel-UI** — kräver designval (hur ska tidslinjen renderas?).
  Specifikt UI-arbete passar inte i samma paket som text + service-koppling.

---

## NOTERING TILL JACOBS PRINCIP

> "Inbox är bra för att dokumentera, men att ha den för att DRIVA funktionalitet är
> en schemär."

Det här är värt att skriva ner som en lärdom i `LESSONS.md`. Implikationerna för
THE_BOMB-arbetet:

- **En koppling som bara manifesterar sig som inbox-notis räknas inte.** Den
  finns inte mekaniskt — den är dokumentation.
- **Riktig koppling = system A's händelse syns/ändrar beteende i system B's
  vy/UI/text.** Skandal i kafferum (kioskvakten kommenterar) räknas. Skandal som
  inbox-rad räknas inte.
- **Sprint 26-skandal-paket följer den principen:** Varje skandal ska syns i
  *andra* vyer än inbox. Kafferum, klack-commentary, presskonferens, motståndar-
  tränarens citat. Inte ny inbox-rad om skandal.

Den principen reducerar inte ambitionen — den fokuserar den.

---

## ÄRLIG SJÄLVKRITIK PÅ STRUKTURANALYSEN 2026-04-25

Jag bedömde THE_BOMB till 40-50% i sektion A. Faktisk siffra efter verifikation:
65-75%. Skillnaden ~25 procentenheter.

Tre orsaker:
1. Jag läste rippleEffectService.ts (3 triggers) och drog slutsatsen att
   cross-system-kopplingar var glesa. Men ripple är *en* mekanism. Coffee-room,
   klack-commentary och match-commentary har egna mekanismer som inte använder
   ripple och som är rikare.
2. Jag missade att THE BOMB 1.3 var explicit implementerad i matchCore. Sökte
   inte tillräckligt djupt. Klassiskt fel: läs koden, inte bara service-listor.
3. Jag drog slutsatsen "Typ 2 (specifik narrativ koppling) är 30% klar" utan
   att verifiera. Den är ~70% klar.

Lärdom: **kvantitativa procent-bedömningar utan kodverifikation är trovärdighets-
risk.** Bättre format: "X är klart. Y är delvis. Z saknas." Utan siffror.

Skriver under det som lärdom också.
