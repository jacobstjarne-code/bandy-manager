# PLAYTEST-CHECKLISTA — April 2026

Starta nytt spel. Spela minst 10 omgångar (gärna en hel säsong).
Dokumentera buggar med screenshot om möjligt.

---

## GRUNDFLÖDE (omgång 1–3)

- [ ] Välj klubb → namn → nytt spel startar utan error
- [ ] Dashboard visar välkomstkort med nudges (omgång 1)
- [ ] NextMatchCard visar motståndare, väder, arena
- [ ] Gå till Trupp → välj 11 startspelare + bänk
- [ ] Gå till Match → taktikvy fungerar (prickar rör sig)
- [ ] Pep-talk visas med atmosfärstext
- [ ] Spela match (live) → kommentarer rullar
- [ ] Hörninteraktion triggas (minst 1 per match)
- [ ] Halvtid → taktikändring möjlig
- [ ] Slutsignal → navigeras till GranskaScreen

## GRANSKASKÄRMEN

- [ ] Resultat-hero med score, POTM, åskådare, arena
- [ ] Tidningsrubrik (📰) med journalist-namn och persona
- [ ] Nyckelmoment-timeline (mål hem/borta)
- [ ] Presskonferens inline (inte overlay) med journalist-namn
- [ ] Andra matchers resultat visas
- [ ] Rivalens match markerad (accent left-border)
- [ ] Omgångssammanfattning: tabellposition, ekonomi, orten med pilar
- [ ] CTA: "Nästa omgång →" fungerar

## DASHBOARD (omgång 2+)

- [ ] Nudge-agenda visar relevanta uppgifter
- [ ] Dagbok (DailyBriefing) visar text
- [ ] Kafferum visar kontextuellt citat (inte bara generiskt)
- [ ] 2×2 grid: tabell/senast/orten/ekonomi klickbara
- [ ] Klackkort med stämning
- [ ] Tränarkarrär-kort

## CUPEN (omgång 3+)

- [ ] Cupmatch dyker upp i rätt matchday
- [ ] **KRITISKT:** Inget lag paras mot sig själv
- [ ] Bracket visas i Tabell → Cup-flik
- [ ] Cupresultat visas i GranskaScreen

## TRANSFERS (omgång 5+)

- [ ] Scouting: starta utvärdering → rapport efter 1-2 omgångar
- [ ] Bud: lägg bud → vänta → accepterat/avvisat
- [ ] Kontraktsförnyelse: klicka förläng → spelaren försvinner från expiring-listan
- [ ] Transferdödline-indikator (omgång 13-15)

## ORTEN & COMMUNITY

- [ ] Anläggningsprojekt: gå till Klubb → Orten → se tillgängliga projekt → starta ett
- [ ] Kommun: bjud in politiker → relation stiger
- [ ] Community standing ändras (inte fastlåst)

## MECENATER (omgång 6-18, kräver CS ≥ 65, rep ≥ 55)

- [ ] Mecenat-event dyker upp (intro med val)
- [ ] Om accepterad: mecenat synlig i Orten-flik
- [ ] Happiness decay + social events
- [ ] **OBS:** Om inget mecenat-event dyker upp efter 18 omgångar med tillräckligt CS/rep → BUG

## SPELARKORT

- [ ] Tappa på spelare → kortet öppnar
- [ ] Status-bars (form/kondition/moral/skärpa) synliga
- [ ] Dubbelliv-sektion med dagsjobb + flexibilitet
- [ ] Senaste 5 matcher formkurva (efter 5 spelade matcher)
- [ ] Prata-knappar fungerar (Uppmuntra/Ställ krav/Framtid)
- [ ] Prata disablas om redan pratat denna omgång

## MATCH-SPECIFIKT

- [ ] Taktikändring under match (⚙-knapp, max 3 per match)
- [ ] Straffinteraktion triggas (sällsynt, ~0.5 per match)
- [ ] Matchresultat varierar (inte alla ~10 mål — en del defensive_battle, en del open_game)
- [ ] Matchprofil: notera snitt efter 10 matcher — borde vara 8-12

## HALVTIDSSAMMANFATTNING (omgång 11)

- [ ] HalfTimeSummaryScreen triggas efter omgång 11

## SLUTSPEL (efter omgång 22)

- [ ] PlayoffIntro visas
- [ ] Kvartsfinal (bäst av 5) fungerar
- [ ] Eliminerad → "Din säsong är slut"
- [ ] SM-final → ChampionScreen

## SÄSONGSSAMMANFATTNING

- [ ] Slutplacering + poäng + vinster/förluster
- [ ] Årets Match-kort med klack-citat
- [ ] DIN SÄSONG-timeline med nyckelmoment
- [ ] SÄSONGENS BERÄTTELSER (storylines)
- [ ] Pensionerade spelare (om någon pensioneras)
- [ ] Dela-din-säsong-knapp
- [ ] Starta ny säsong → BoardMeeting → PreSeason

## SÄSONG 2+

- [ ] Spelarnas ålder ökat
- [ ] Kontrakt löpt ut → spelare lämnat
- [ ] State of the Club jämförelse synlig
- [ ] Nya styrelsemål

---

## BUGGRAPPORT-FORMAT

```
SKÄRM: [var buggen syns]
OMGÅNG: [nummer]
FÖRVÄNTAT: [vad som borde hända]
FAKTISKT: [vad som händer]
REPRODUKTION: [steg för att återskapa]
```
