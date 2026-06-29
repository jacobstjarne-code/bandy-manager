# DESIGN-HANDOVER — Spelkänsla, audit & fyra killer-apps

**Datum:** 2026-06-22
**Av:** Fable / Design · **Till:** Opus (systemkartan) + Code
**Status:** Samlad handover. Ett state-of-the-game-svep + fyra färdiga killer-app-designer. Allt spårat mot kod samma session — varje förslag bygger på tjänster/entiteter som redan finns. Inga nya tokens.

---

## 0 · Läs detta först — den röda tråden

Efter att hela backloggen landat gjorde jag en fri speldesign-läsning av domänen (130+ tjänster, 30 entiteter). En tes föll ut, och allt nedan följer ur den:

> **Spelet har en romanförfattares minne, men arkiverar det i flikar i stället för att säga det i ögonblicket.**

Ni har inte ett innehållsproblem — ni har ett **callback-problem**. Datan har minne (`narrativeLog`, `coachRivalries`, `recentMoments`, `clubLegends`, `burnoutHistory`); ögonblicket kallar nästan aldrig tillbaka det. De fyra killer-apparna är fyra uttryck för **ett** designspråk: *minne i ögonblicket, känsla före tal.* De delar två återanvända komponenter — `PortalBeat` (callback) och `spine` (tidslinje) — och tre små nya datafält. **Inte fyra features. Ett språk, fyra uttryck.**

Hävstångsordning (gäller oavsett byggordning): **callback före nytt innehåll → aggregera spridda röster → slut bågarna synligt.**

---

## 1 · State of the game — var ni står (svepet)

Spårat rad för rad mot koden. **Backloggen landade** — spelkänsla är inte längre den svaga punkten.

**Verifierat i kod (9):** mittsäsongsrytm (StillnessSection/PortalMinimalBar) · B1-navet (Bygget in, Värvning villkorad) · Bygget som egen flik + Orten-rensning · mentor-bandet m. vilande-tillstånd · moments-ytan (ClubMemoryView läser `recentMoments` direkt) · portal-beatet · platt taktikvy · Valet i Bygget · nav-ansvar avknutet (GameShell/BottomNav).

**Utvecklat förbi förslaget (2):** beslutsbudgeten → "en fråga åt gången" (lugnare än min pill-budget) · bygg-beatet → generell `portalBeatService`.

**Fronten har flyttat till:** ikon-/märkesprojekten (24 piktogram, 6 nav-ikoner, 12 klubbmärken — alla `⚠·⚠` i SYNC.md) + komponent-polish (Button/Tag/GameHeader/PhaseIndicator-tillstånd).

**Två ärliga nyanser:** puls/fanMood slogs aldrig ihop — de fick olika roller (funkar troligen, värt en blick) · spelarkortets ~14 sektioner: bekräfta att de grupperats i de tre lägena.

*Källa:* `mockups/2026-06-22_state_of_the_game.html`

---

## 2 · Killer-app #1 — Callback *(bygg först)*

**Beslut:** callback är en **beat-familj på `PORTAL_BEATS`**, inte en ny yta. `getActiveBeat` finns; ett callback är nya poster med en `trigger(game)` som upptäcker att nu speglar då, och en `text(game)` som väver ihop dem.

**Taxonomi (alla ur befintlig data):** rivaliteten *(flaggskepp)* · återkomsten (spelare möter gammal klubb) · situationen (då=nu) · milstolpen (framåt-eko).

**Flaggskepp — rivalitets-callback:** trigger läser `coachRivalries` (serie ≥3 eller intensity ≥6); text = nu-mening + `generatePreMatchOpponentQuote`; `keyFn` nycklar på matchuppet → en gång inför mötet.

**Disciplin:** bara meningsfull historik · en gång per tillfälle · konkurrerar i beat-prioritet · mot beslutsbudgeten · tystnad är rätt · recency vinner.

**Ton (avgörande):** ett callback är en **spets, inte en statistik**. "Nordin — tre raka mot dig" på beatet; siffran `2-2-4` lever i h2h-raden på nästa-match-kortet, ett klick bort. Beatet bär känslan, kortet bär datan.

**Code:** ny post i `domain/data/portalBeats.ts` + liten `getNextOpponentRivalry`-helper + `callbackStrings.ts` (speglar `mentorshipStrings`). Inget nytt UI — `PortalBeat.tsx` renderar redan.

*Källa:* `mockups/2026-06-22_callback_design.html`

---

## 3 · Killer-app #4 — Generationsloopen

**Beslut:** synliggör en loop som **redan sluts** (youthIntake → mentorships → narrativeLog → clubLegends). Tre grepp:
- **Avskedskapitlet** — pensionen lyfts från beslutskort/rad till ett eftermäle som kallar tillbaka karriären (ärver callback). `RetirementData` (farewell/bestMoment/isLegend) finns redan.
- **Blodslinjen** — mentor-kedja över säsonger i Minnet (Eriksson → Lundqvist → Henriksson). Klubbens DNA. Belönar långt spel = retention.
- **Legend-callbacks** — legenden stannar redan kvar (kafferum, skolbesök, lön); ett beat när lärlingen bär bindeln.

**⚠ Dataspärr (Code, måste komma först):** `mentorships` filtreras på `isActive` — historiken tappas. Behövs en kvarstående `game.mentorshipHistory: MentorshipRecord[]` (sluts aldrig). Utan minne av avslutade mentorskap finns ingen tråd att rita.

*Källa:* `mockups/2026-06-22_generationsloop_design.html`

---

## 4 · Killer-app #3 — Legibel konsekvens

**Beslut:** val-konsekvens är **redan löst** (event-`subtitle`, `getTacticConsequence`, Valets `consequenceLine`) — rör den inte. Luckan är den **reaktiva** kaskaden som merge:as tyst i `roundProcessor`.

- **Därför-kedjan** — rita orsakslinjen en gång när en äkta kaskad fyrar. Ärlig mot motorn: `big_derby_win` (fanMood +8, klack +10, community +5, sponsor +5) och `mecenat_left` (community −8, boardPatience −10, klack −5) ÄR kaskader; rita dem.
- **Disciplin:** bara ≥2 system · en gång vid källan · orsaken överst · känsla före tal.

**⚠ Ärlig not till Opus:** `star_injured` är idag bara `fanMood −5` — ingen kaskad, så den ritar ingen kedja. Vill ni att en skadad nyckelspelare ska kaskadera bredare (klack oroas, styrelse nervös) är det en **mekanik-utbyggnad i `rippleEffectService`** — ert bord. Designen ritar den så fort kaskaden finns.

**Code:** låt `mergeRippleDeltas` behålla deltan i en `RippleTrace` i stället för att slå ihop tyst; `roundProcessor` sätter `pendingRippleTrace` vid `steps.length ≥ 2`; ny `RippleTrace.tsx` + `rippleStrings.ts`.

*Källa:* `mockups/2026-06-22_legibel_konsekvens_design.html`

---

## 5 · Killer-app #2 — Tränarens berättelse *(bygg sist — binder ihop)*

**Beslut:** Manager är den **enda entiteten utan `narrativeLog`**. Tränare-fliken har redan röst (`getManagerBio`, burnout-citat, persona-repliker) men presenterar den som nuläge — en stapel stat-kort.
- **Tenure-arc** — `managerNarrativeLog` renderad i `spine`-komponenten (delas med blodslinjen). Burnout-toppar blir kapitel, inte bara sparkline.
- **Nemesisen** — utse (inte bara lista) den rival med högst `intensity × historik × recency`; en löpande tråd med minne som **talar via rivalitets-callbacket** (#1).

**⚠ Ny data (Code):** `ManagerProfile.narrativeLog` — spegel av `Player.narrativeLog`. Skrivställen återanvänder befintliga ögonblick (ankomst, burnout-zongräns, era-skifte via `clubEraService`, rivalitets-milstolpe). Nemesis = härledd, ingen ny data.

*Källa:* `mockups/2026-06-22_tranarens_berattelse_design.html`

---

## 6 · Sammanfattning för Code — totala datakostnaden

Fyra killer-apps, **tre små nya datafält** + två återanvända komponenter:

| App | Ny data | Återanvänder | UI |
|---|---|---|---|
| #1 Callback | — (helper) | `PortalBeat` · `shownBeats` | poster i `PORTAL_BEATS` + h2h-rad |
| #4 Generationsloop | `mentorshipHistory` | `spine` · ceremoni-chrome | avskedsscen + Minne-vy |
| #3 Konsekvens | `RippleTrace` (ur befintlig delta) | beat-engångsmönster | `RippleTrace.tsx` |
| #2 Tränarens berättelse | `managerNarrativeLog` | `spine` · `PortalBeat` (nemesis) | TranareTab → arc |

**Byggordning:** #1 callback (grunden alla ärver) → #4 generationsloop eller #3 konsekvens → #2 tränarens berättelse (binder ihop). Allt på befintliga tokens, befintlig copy-ton, inga nya färger.

**Genomgående princip:** minne i ögonblicket, känsla före tal, tystnad är rätt, aldrig rått tal där en mening duger.
