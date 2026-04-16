# BANDY MANAGER — STATUS

**Uppdaterad:** 16 april 2026  
**Syfte:** Enda sanning om vad som är byggt, vad som funkar, och vad som återstår.

---

## VAD SOM ÄR BYGGT

### Spelkärna
- Enhetlig matchmotor (`matchCore.ts`) med matchprofiler (defensive_battle / standard / open_game / chaotic)
- matchEngine.ts som wrapper för AI-sim (fast mode)
- Matchflöde: lineup → taktik → pep-talk → live/snabbsim → halvtid → taktikändring → resultat
- Hörninteraktion, straffinteraktion, kontring, frislag, sista-minuten-press
- Taktikändring under pågående match (max 3 per match)
- Kalibrering mot 1124 Elitseriematcher (Bandygrytan)
- Övertid + straffar i knockout-matcher

### Omgångscykel
- Förbered → Spela → Granska (PhaseIndicator)
- GranskaScreen med: resultat-hero, tidningsrubrik (journalist-persona), nyckelmoment, inline presskonferens, andra matchers resultat (rival markerad), omgångssammanfattning, scouting, P19
- Dashboard med nudge-agenda, 2×2 grid, klackkort, dagbok (säsongsfas-kopplad), kafferum (kontextuellt), veckans beslut

### System som pratar med varandra
- Kafferummet reagerar på transfers, streaks, resultat, deadline
- Journalist med namn, persona, outlet — headlines i inbox och GranskaScreen
- Presskonferens med dedikerad visuell scen (PressConferenceScene)
- Matchkommentarer refererar dagsjobb, kapten, klackfavorit, akademispelare, nemesis, storylines
- Klacken sjunger vid avslag, halvtid, sena mål
- DailyBriefing med säsongsfas-specifika texter (SEASON_MOOD)

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

---

## INTE VERIFIERAT I GAMEPLAY

Följande finns i koden men har inte bekräftats fungera genom playtest:

1. **Cup-lottning** — Har lag parats mot sig själva? (historisk bugg)
2. **Mecenat-spawn** — Triggas mecenater vid CS ≥ 65 / rep ≥ 55? Hanterar eventResolver aktiveringen korrekt?
3. **Kontraktsförnyelse** — Försvinner spelaren från expiring-listan efter förlängning?
4. **Matchprofiler** — Ger defensive_battle lägre scoring och chaotic högre? Håller snittet ~10?
5. **Presskonferens community-frågor** — Ställs frågor om orten/mecenat/anläggning?
6. **Storylines i matchkommentarer** — Refererar kommentarerna verkligen storylines vid mål?
7. **Pensionsceremoni** — Triggas retirement-event vid säsongsslut för veteraner?
8. **Anläggningsprojekt** — Kan spelaren starta, betala, och se resultat?

---

## FRAMTIDSVISION (ej implementerat)

Från THE_BOMB.md och SPEC_KLUBBUTVECKLING.md — idéer som INTE är i koden:

- **Ortens kalender** — händelser mellan matchdagar (stroke hos volontär, kommunal rondell, julbord)
- **Mecenatens middag** — interaktiv scen (jakt, bastu, whisky) med maktspelsbeslut
- **Kommunval** — var 4:e säsong, ny kontakt med ny agenda
- **Halvtidsanalys** — momentumgraf, bollinnehav, hotfullaste spelaren
- **Spelarnas arbetsdagbok** — synlig koppling dagsjobb → missad träning
- **Taktikdjup** — hörnplanering som visuell spelplan, motståndaranpassad taktik
- **Share-images** — matchhighlight som delbar bild
- **Ljudeffekter** — opt-in (mål, visselpipa, trumma)

---

## AKTIVA DOCS

| Fil | Syfte | Status |
|-----|-------|--------|
| `CLAUDE.md` (root) | Kodregler för Code | Aktivt — uppdatera vid behov |
| `docs/DESIGN_SYSTEM.md` | 20 designregler | Aktivt |
| `docs/STATUS.md` | Denna fil | Aktivt — uppdatera efter varje sprint |
| `docs/THE_BOMB.md` | Narrativ vision | Referens — långsiktig |
| `docs/SPEC_KLUBBUTVECKLING.md` | Ekonomisk progression | Referens — långsiktig |
| `docs/GENOMGANG_OCH_VISION_20260406.md` | Ursprunglig analys | Referens |

Alla andra specar ligger i `docs/archive/`.
