# BANDY MANAGER — STATUS

**Uppdaterad:** 26 april 2026  
**Syfte:** Enda sanning om vad som är byggt, vad som funkar, och vad som återstår.

---

## VAD SOM ÄR BYGGT

### Spelkärna
- Enhetlig matchmotor (`matchCore.ts`) med matchprofiler (defensive_battle / standard / open_game / chaotic)
- matchEngine.ts som wrapper för AI-sim (fast mode)
- Matchflöde: lineup → taktik → pep-talk → live/snabbsim → halvtid → taktikändring → resultat
- Hörninteraktion, straffinteraktion, kontring, frislag, sista-minuten-press
- Taktikändring under pågående match (max 3 per match)
- **Per-lag comeback-dynamik i 2:a halvlek** (Sprint 25a.2) — chasing/controlling/cruise beräknas per lag, inte per match
- Övertid + straffar i knockout-matcher

### Omgångscykel
- Förbered → Spela → Granska (PhaseIndicator)
- GranskaScreen med: resultat-hero, tidningsrubrik (journalist-persona), nyckelmoment, inline presskonferens, andra matchers resultat (rival markerad), omgångssammanfattning, scouting, P19, shotmap med vit plan
- Dashboard med nudge-agenda, 2×2 grid, klackkort, dagbok (säsongsfas-kopplad), kafferum (kontextuellt), veckans beslut

### Taktiktavlan (Sprint 23)
- `getRecommendedFormation` — position-score beräknar bästa formation
- Rekommenderad formation får grön outline + ★ COACH-badge
- FORMATION_META med anatomy-tags och coach-quotes (svenska, kurerade)
- Taktik-översikt överst med klickbar "ändras i lineup"
- Interaktiv kemi med 6 branches (aktiva/tysta beroende på situation)
- Inbox-notis när rekommendation ändras mellan omgångar

### System som pratar med varandra
- Kafferummet reagerar på transfers, streaks, resultat, deadline
- Journalist med namn, persona, outlet — headlines i inbox och GranskaScreen
- Presskonferens med dedikerad visuell scen (PressConferenceScene)
- Matchkommentarer refererar dagsjobb, kapten, klackfavorit, akademispelare, nemesis, storylines
- Klacken sjunger vid avslag, halvtid, sena mål
- DailyBriefing med säsongsfas-specifika texter (SEASON_MOOD)
- **Skandalreferenser cross-system (Sprint 26, 2026-04-26)** — aktiv säsongsskandal syns i kafferum (25% chans per omgång, 7 typer × egna/andras), klack-commentary vid kickoff/halvtid (20% chans), pressfrågor (4-7 nya frågor per match-utfall), motståndartränare (8 skandal-quotes i SCANDAL_AFFECTED_LOST/WON)

### Orten & Community
- Anläggningsprojekt startbara med tre finansieringsalternativ (egen/kommun/mecenat)
- Kommunpolitiker med agenda, relation, bjud-in/budget/ansök
- Mecenater med happiness, bidrag, krav, social events
- Volontärer, bandyskola, kiosk
- Community standing med diminishing returns

### Säsongssammanfattning
- Årets Match (pickSeasonHighlight med poängsättning + klack-citat)
- DIN SÄSONG-timeline (keyMoments + arc storylines)
- SÄSONGENS BERÄTTELSER (storylines som prosa)
- Pensionerade spelare med farewell + bestMoment
- State of the Club (jämförelse mot föregående säsong)
- Poängkurva, hemma/borta-statistik, streaks, dina val
- Dela-din-säsong (shareSeasonImage)

### Spelarkort 2.0
- Status-bars (form/kondition/moral/skärpa)
- Dubbelliv-sektion med flexibilitetsbar
- Senaste 5 matcher formkurva (SVG sparkline)
- Potential-bar + CA-sparkline
- Relationer (kapten/klackfavorit/nemesis, senaste samtalet, mentor)
- Karriärresa (dagbok med kronologisk timeline)
- Prata med spelaren (sticky footer)

### Övrigt
- 12 fiktiva klubbar med SVG-emblem, arenanamn, klacknamn
- Trainer arc (newcomer → legendary)
- Nemesis-tracking
- Rivalitetshistorik med H2H
- Board objectives
- Transfer deadline events
- Reputation milestones
- Youth academy med P19-sim
- Loan deals
- Arc system med triggers och progression
- Styrelsecitat-bibliotek (kurerat, 48 citat)

---

## INFRASTRUKTUR (Sprint 22-24)

### Runtime-verifiering
- **Design-audit** (`window.__designAudit`) — kollar färger, padding, rubriker per skärm
- **Stress-test** (`npm run stress`) — 10 seeds × 5 säsonger, invariants + season-stats-logg
- **Analyze-stress** (`npm run analyze-stress`) — jämför stress-logg mot bandygrytan-targets
- **Calibrate v2** (`scripts/calibrate_v2.ts`) — 7 sektioners analys av bandygrytan + motorsimulering

### Kalibreringsdata
- `bandygrytan_detailed.json` — 1124 grundserie + 68 KVF + 38 SF + 12 Final = 1242 elitseriematcher (2019-26)
- `SCORELINE_REFERENCE.md` — utvisningar och straffar per spelläge × period × fas, normaliserat
- `ANALYS_MATCHMONSTER.md` — comeback-frekvens, utvisningstid, hörnmål-per-spelläge, hemmafördel-kurvan
- `ANALYS_SLUTSPEL.md` — grundserie vs KVF vs SF vs final

### Kalibreringsstatus (efter Sprint 25b.2.2 + 25d.2)

Stress-test (3978 matcher, 6 seeds × 4 säsonger) vs bandygrytan:

| Mått | Motor | Target | Status |
|---|---|---|---|
| goalsPerMatch | 9.58 | 9.12 | ✅ inom tol |
| homeWinPct (grundserie) | 46.1% | 50.2% | ✅ |
| drawPct | 10.0% | 11.6% | ✅ |
| awayWinPct | 43.9% | 38.3% | ❌ +5.6pp |
| htLeadWinPct | 80.4% | 78.1% | ✅ +2.3pp (target var felinmatat) |
| cornerGoalPct | 26.2% | 22.2% | ❌ eskalerar i slutspel |
| penaltyGoalPct | 3.7% | 5.4% | ✅ inom tol (3-7%) |
| avgSuspensionsPerMatch | 3.75 | 3.77 | ✅ |
| Comeback −1 | 16.8% | 13.6% | ✅ (target var felinmatat, rådata visar 13.6%) |
| playoff_final mål/match | 9.17 | 7.00 | ❌ +2.17 |

### Pågående och vilande motor-kalibrering
- **Sprint 25b.1** — LEVERERAD (straff separerad till egen trigger, penaltyGoalPct ✅)
- **Sprint 25b.2** — LEVERERAD (utvisnings-basfrekvens wFoul 12 → 24)
- **Sprint 25b.2.2 + 25d.2** — LEVERERAD (foulThreshold 1.25→1.46, avgSusp ✅)
- **Sprint 25d** vilande — fas-konstanter vs slutspelsdata (delvis täckt av 25d.2)
- **Sprint 25-HT** LEVERERAD 25 april — target var felinmatat (46.6 var homeHtLeadFraction, korrekt target 78.1 %). Motor 80.4 % = +2.3 pp gap. Ingen motorsprint krävs.
- **Sprint 25E** LEVERERAD 26 april — powerplay-effektivitet, riktig comeback-mekanik
- **Sprint 25L** LEVERERAD 26 april — KVF/SF goalMod-kalibrering
- **Sprint 25f+25g** vilande — domare + matchskador (paketerade)

### Sprint 25h — Bandyskandaler (LEVERERAD 25 april 2026)
Tre-lagers skandalsystem fullt implementerat och textat:

**Lager 1 — Världshändelser (AI-klubbar):**
- 8 arketyper: sponsor_collapse, club_to_club_loan, treasurer_resigned, phantom_salaries, fundraiser_vanished, coach_meltdown, municipal_scandal, small_absurdity
- Triggerfönster omg 6-8, 12-14, 18-20, 24-26 (25% chans/fönster)
- municipal_scandal kan drabba managed club; small_absurdity = ren atmosfär, noll effekt
- 70 kurerade svenska strängar (revision 2 av Opus)

**Lager 2 — Egna beslut:**
- 2A: Löneöverskridande trackas per omgång → Licensnämnden-varning vid 5, poängavdrag vid 10
- 2B: Skum sponsor-erbjudande (4 varianter, 8-20 tkr/säsong) med riskexponering 6-12 omg senare (3 konsekvens-varianter)
- 2C: Mecenat lämnar i ilska efter 3+ ignorerade krav (3 personlighetsanpassade varianter)

**Lager 3 — Licensnämnden:**
- Konsekutiva förlustsäsonger → first_warning → point_deduction (−3p) → license_denied (sparkad)
- 11 kurerade strängar med {KLUBB}-token

**Refactor TS-1 (bas för 25h):**
- roundProcessor delad i processors (preRoundContext + postRoundFlags)
- isSecondPassForManagedMatch som skipSideEffects-option på alla processors
- Stress-test identiskt utfall = 0 determinism-brott

---

## EKONOMI & PULS (Sprint 26)

Levererad 22 april. Mätrapport: `docs/sprints/SPRINT_26_BALANCE_MEASUREMENT.md`.

Fem motkrafter implementerade:
1. weeklyBase halverad (`rep × 120` → `2000 + rep × 50`)
2. Arena-underhåll som återkommande kostnad (`capacity × 8`)
3. Kommunbidrag kvadratiskt istället för linjärt
4. Volontärers puls-bonus cappad till +1.5/omg
5. Community standing drift mot 60 (3%/omg)

Uppnått: puls-takeffekt bruten (91-100 bucket 51% → 11%), längsta streak 34 → 10 omgångar, 0% klubbar >2M efter 4 säsonger (var 67%).

Öppet beslut för Opus: Söderfors (r55) och Målilla (r65) i permanent minus från säsong 2. Finjustering väntar — se `KVAR.md`.

---

## INTE VERIFIERAT I GAMEPLAY

Följande finns i koden men har inte bekräftats fungera genom playtest-runda 3:

1. **Sprint 22.15-fixar** — dashboard-tomrum, BottomNav under match, events-placering i GranskaScreen, commentary-bold, "slår igenom"-anglicism, shotmap-labels
2. **Sprint 23-leverans** — taktiktavlan med grön outline, FORMATION_META, taktik-översikt, interaktiv kemi
3. **Cup-lottning** — Har lag parats mot sig själva? (historisk bugg, ej verifierad efter 22.10-fix)
4. **Mecenat-spawn** — Triggas mecenater vid CS ≥ 65 / rep ≥ 55?
5. **Kontraktsförnyelse** — Försvinner spelaren från expiring-listan efter förlängning?
6. **Presskonferens community-frågor** — Ställs frågor om orten/mecenat/anläggning?
7. **Storylines i matchkommentarer** — Refererar kommentarerna verkligen storylines vid mål?
8. **Pensionsceremoni** — Triggas retirement-event vid säsongsslut för veteraner?
9. **Anläggningsprojekt** — Kan spelaren starta, betala, och se resultat?

---

## FRAMTIDSVISION (ej implementerat)

Från THE_BOMB.md och SPEC_KLUBBUTVECKLING.md — idéer som INTE är i koden:

- **Ortens kalender** — händelser mellan matchdagar
- **Mecenatens middag** — interaktiv scen (jakt, bastu, whisky)
- **Kommunval** — var 4:e säsong, ny kontakt med ny agenda
- **Halvtidsanalys** — momentumgraf, bollinnehav, hotfullaste spelaren
- **Spelarnas arbetsdagbok** — synlig koppling dagsjobb → missad träning
- **Taktikdjup** — hörnplanering som visuell spelplan, motståndaranpassad taktik
- **Share-images** — matchhighlight som delbar bild
- **Ljudeffekter** — opt-in (mål, visselpipa, trumma)
- **Kurerade texter** — Tommy Lindqvist omtag, insändare, journalist-öppningar, coffee-room-ämnen

---

## AKTIVA DOCS

| Fil | Syfte | Status |
|-----|-------|--------|
| `CLAUDE.md` (root) | Kodregler för Code | Aktuell |
| `docs/LESSONS.md` | 20 återkommande buggmönster | Aktuell |
| `docs/DECISIONS.md` | Arkitekturbeslut kronologiskt | Aktuell |
| `docs/DESIGN_SYSTEM.md` | 20 designregler | OK |
| `docs/KVAR.md` | Aktuell karta + pågående + parkerat | Aktuell |
| `docs/HANDOVER_2026-04-26.md` | Senaste handover | Aktuell |
| `docs/STATUS.md` | Denna fil | Aktuell |
| `docs/THE_BOMB.md` | Narrativ vision | Referens |
| `docs/SPEC_KLUBBUTVECKLING.md` | Ekonomisk progression | Referens |
| `docs/data/SCORELINE_REFERENCE.md` | Empirisk referens för motor-kalibrering | Aktuell |
| `docs/data/ANALYS_MATCHMONSTER.md` | Bandygrytan-analys (hela matchen) | Referens |
| `docs/data/ANALYS_SLUTSPEL.md` | Bandygrytan-analys (slutspel) | Referens |

Arkiverat:
- Alla gamla sprintdokument i `docs/archive/`
- Genomgång och vision från april 6 (samlad i GENOMGANG_OCH_VISION_20260406.md)

Aktiva sprintdokument (lever kort, arkiveras efter audit):
- `docs/sprints/SPRINT_26_ECONOMY_BALANCE.md` — levererad, finjustering kvar
- `docs/sprints/SPRINT_26_BALANCE_MEASUREMENT.md` — mätrapport
- `docs/sprints/SPRINT_25H_PASS1_AUDIT.md` — lager 1 audit
- `docs/sprints/SPRINT_25H_PASS2_AUDIT.md` — lager 2 audit
- `docs/sprints/SPRINT_25H_PASS3_AUDIT.md` — lager 3 audit
- `docs/sprints/SPRINT_25H_ADDENDUM_AUDIT.md` — revision 2 + small_absurdity
- `docs/sprints/SPRINT_25H_TEXT_INTEGRATION_AUDIT.md` — textintegration
- `docs/textgranskning/TEXT_SCANDAL_LAYER1_2026-04-25.md` — revision 2-text (lager 1)
- `docs/textgranskning/TEXT_SCANDAL_LAYER2_LAYER3_2026-04-25.md` — revision 2-text (lager 2+3)
