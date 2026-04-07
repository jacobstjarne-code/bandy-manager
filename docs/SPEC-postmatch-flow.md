# SPEC: Post-match flow — systematisering

## Nuvarande problem

1. **Live:** Matchhändelserna scrollar förbi — ingen paus vid slutsignal
2. **Snabbsim:** `advance()` anropas TVÅ gånger (MatchScreen + MatchResultScreen)
3. **Events** dyker upp först på Dashboard — långt efter matchen, bryter känslan
4. **MatchDoneOverlay** och **MatchResultScreen** visar delvis samma info (score, målskyttar)
5. **Presskonferens** finns bara i live, inte snabbsim
6. **Inkonsekvent visuell design** mellan stegen

## Önskat flöde

```
LIVE:     MatchLive → [SLUTSIGNAL - paus] → Matchresultat → [Events] → RoundSummary → Dashboard
SNABBSIM: MatchScreen → advance() → Matchresultat → [Events] → RoundSummary → Dashboard
```

### Principer
- **Ett flöde, inte två.** Live och snabbsim konvergerar vid Matchresultat.
- **Events efter match, före RoundSummary.** Spelaren ser händelser medan matchen fortfarande är färsk.
- **Presskonferens i båda flöden.** Genereras alltid, visas som event.
- **Ingen dubbel advance().** advance() anropas EN gång.
- **Paus vid slutsignal.** Spelaren måste trycka vidare — händelserna hinner läsas.

## Steg-för-steg

### Steg 1: Match (live eller snabbsim)

**Live:** MatchLiveScreen kör som idag. Vid slutsignal (`matchDone = true`):
- Händelseflödet STANNAR (redan implementerat)
- En "SLUTSIGNAL"-banner visas i feeden
- En knapp "Se resultat →" visas LÄNGST NER i feeden (inte overlay)
- saveLiveMatchResult() anropas (som idag)
- Spelaren kan scrolla upp och läsa händelser i lugn och ro

**Snabbsim:** MatchScreen kör advance() EN gång. Navigerar direkt till `/game/match-result`.

### Steg 2: Matchresultat (konvergerad vy)

MatchResultScreen visar (samma för båda flöden):
- Score + flavor text + målskyttar
- Attendance
- Bästa spelare (POTM)
- Nyckelstatistik (skott, hörnor, utvisningar) — kompakt
- "Se fullständig rapport →" (frivillig fördjupning)
- **KNAPP: "Fortsätt →"** — anropar INTE advance(), bara navigerar vidare

### Steg 3: Events (ny plats)

**Ändring:** EventOverlay ska visas MELLAN matchresultat och RoundSummary.

Implementation: Istället för att events blockeras av `!!roundSummary`, ändra flödet:
1. MatchResultScreen "Fortsätt →" navigerar till `/game/round-summary`
2. RoundSummary-sidan VISAR events FÖRST (om de finns), sedan sammanfattningen
3. Alternativt: en dedikerad `/game/events`-steg, men enklare = visa events direkt på RoundSummary

**Enklast:** Ta bort `!!roundSummary`-blockeringen i EventOverlay. Events visas som overlay OVANPÅ RoundSummaryScreen. Spelaren löser events → ser sammanfattningen.

### Steg 4: RoundSummary

Som idag men utan advance()-anrop. Data redan beräknad.

"Nästa omgång →" → Dashboard.

### Steg 5: Dashboard

Rent. Inga events att lösa (de löstes i steg 3).

## Filer att ändra

### MatchLiveScreen.tsx
- MatchDoneOverlay: TA BORT "Fortsätt"-knappen som anropar advance()
- Istället: visa en "Se resultat →" knapp i feeden efter slutsignal
- Denna knapp navigerar till `/game/match-result` (INTE advance())
- Presskonferens: flytta till eventService (genereras som GameEvent)

### MatchResultScreen.tsx
- "Fortsätt →" knapp: navigerar till `/game/round-summary` (INTE advance())
- Snabbsim: advance() redan körd i MatchScreen → data finns
- Live: saveLiveMatchResult() redan körd → data finns
- TA BORT advance()-anropet i handleContinue()

### MatchScreen.tsx (snabbsim-path)
- handlePlayMatch snabbsim: advance() → navigate('/game/match-result') (som idag, OK)

### gameFlowActions.ts
- advance() action: efter advance(), sätt roundSummary + navigera till match-result (inte round-summary)
- ELLER: behåll navigation till round-summary, men visa events där

### EventOverlay.tsx
- TA BORT `!!roundSummary`-blockeringen
- Events visas OVANPÅ RoundSummary (blockerar tills lösta)

### MatchDoneOverlay.tsx
- Förenkling: visa bara score + stats + POTM
- TA BORT presskonferens (flyttas till event)
- TA BORT "Fortsätt" knapp (ersätts av in-feed knapp)
- ELLER: behåll som overlay men knappen navigerar till /game/match-result

## Presskonferens som GameEvent

Flytta presskonferens-logik:
1. `generatePressConference()` returnerar redan ett GameEvent-liknande objekt
2. Istället för lokal state i MatchLiveScreen → pusha till `game.pendingEvents`
3. Visas som vanligt event i EventOverlay (steg 3)
4. Fungerar identiskt för live och snabbsim

## Designkonsistens

Alla steg: padding `0 12px`, card-sharp med `10px 14px`, knappar `gap: 8`.

## Risker

- RoundSummary-data sätts av advance() i gameFlowActions. Om vi tar bort advance() i MatchResultScreen, måste datan redan finnas.
- Live-path: saveLiveMatchResult() sparar matchen men kör INTE roundProcessor. advance() måste köras NÅGONSTANS för ekonomi, skador, etc.

## Lösning för advance()-timing

**Live:** saveLiveMatchResult() + advance() körs BÅDA vid matchslut (i useEffect vid matchDone). Spelaren ser resultatskärm → events → summary utan att behöva triggra advance manuellt.

**Snabbsim:** advance() körs i handlePlayMatch (som idag). Allt redan klart.

Nyckeln: advance() körs EN gång, tidigt. Efterföljande skärmar läser bara data.
