# SPEC — Callback: minne i ögonblicket

**Datum:** 2026-06-22 · **Av:** Opus · **Till:** Code (triggers/wiring) + Opus (copy, skriven nedan)
**Status:** Spec-klar. **Bygger på beat-primitiven** (`SPEC_BEAT_PRIMITIV_2026-06-22.md`) — bygg den först. Callback är primitivens första konsument: en familj moment-ankrade minnes-beats, severity 0–1, som rider `firesBeforeNextFixture`.
**Paketets #1 killer-app — högsta hävstången.** Tesen: spelet har en romanförfattares minne men arkiverar det i flikar. Callback säger minnet i ögonblicket i stället. Inget nytt innehåll — datan finns redan.

---

## DIAGNOS — before/after

**BEFORE.** Inför en match är historien tyst. H2H-rekordet mot motståndaren ligger i Tränare-fliken. Landslagssnubben i ett gammalt inbox-mejl. Förra derbyts resultat i en begravd fixture. Spelaren går in i matchen utan att något påminner om vad som står på spel. Datan finns — den sägs bara aldrig när den betyder något.

**AFTER.** En lugn rad i portalen före matchen: *"Tre raka mot Sirius nu."* Säsongen känns ihågkommen. Samma data, sagd i ögonblicket. Det är hela killer-appen: callback före nytt innehåll.

---

## ANTI-BRUS (avgjort av primitivens mekanik, inte ny kod)

- Callbacks är **informational PortalBeats** (inga `choices`) → passerar beslutsbudgeten oräknade (KF3 `nonActionable`). De konkurrerar aldrig med beslut.
- `getActiveBeat` returnerar **ett** beat i taget → callbacks kan inte stacka.
- `keyFn` per moment + `shownBeats`-dedup → varje callback surfar en gång per relevant tillfälle.
- **Severity 0–1 endast** (lugnt minne / copper). Aldrig danger/kris — en callback är en påminnelse, inte ett larm.
- **Ordning i `PORTAL_BEATS` = prioritet.** Lägg callback-familjen UNDER severity-2/3-konsekvensbeats (deadline, styrelse-ultimatum) men ÖVER generisk atmosfär (`season_opener`, `first_win`). Specifika callbacks (snub/sale/derby-minne) före generiska (`first_derby`).
  - **⚠️ VERIFIERAT 2026-06-22 (fixa som del av detta bygge):** `board_failure` ligger idag felaktigt UNDER hela atmosfär-blocket i `PORTAL_BEATS` — en sev-3-ultimatum kan kvävas av t.ex. `transfer_window_open` (båda kan triggas omg 7). Mål-ordning top→botten: **`board_failure` (+ framtida deadline/sev2-3) → callbacks (snub, sale, derby-minne, h2h-streak) → generisk atmosfär (season_opener, first_win, first_derby, halftime, transfer_window_open, last_league_round) → `facility_completed`.** Flytta `board_failure` överst när callback-posterna läggs in.
  - Städa samtidigt `board_failure`-triggerns döda klausuler (`patience < 30 || patience < 50 ||` är redundant när `hasFailed` redan är true) → `trigger: (g) => (g.boardObjectives ?? []).some(o => o.status === 'failed')`.
- Valfri tuning om playtest visar trötthet: `lastCallbackRound`-cooldown (min 2 omg mellan callbacks). EJ v1-default — single-active + keyat räcker som baslinje.

---

## BEAT-FAMILJEN (v1 — fyra, alla klubbankrade och alltid tillgänglig data)

Copy är **Opus-satt, slutlig**, bandy-Sverige-understatement. `{klubb}`/`{spelare}` templatas. Varje beat: `severity`, `trigger` (via `firesBeforeNextFixture` om inget annat), `keyFn`, `text(game)`.

### 1 · H2H-streak — inför match mot klubb med svit
- **Källa:** `rivalryHistory[oppId].currentStreak`. Trigger: `|currentStreak| >= 2`.
- **Severity:** 1 (copper) vid förlustsvit (tryck), 0 (lugn) vid segersvit.
- **keyFn:** `callback_streak_{oppId}_{season}`.
- **Copy:**
  - Förlustsvit (`currentStreak <= -2`): `"{n} raka mot {klubb} nu. Någon gång ska det vändas."`
  - Segersvit (`currentStreak >= 2`): `"{klubb} har inte tagit dig på {n} möten. De vet om det."`

### 2 · Derby-minne — inför derby, förra mötets utfall
- **Källa:** `getRivalry(managed, opp) != null` + senast spelade derby mot `oppId` (resultat ur fixtures).
- **Severity:** 1 (copper).
- **keyFn:** `callback_derby_{oppId}_{season}`.
- **Ordning:** FÖRE generiska `first_derby` (lägre index) — det specifika minnet vinner när båda triggar.
- **Copy:** `"Förra derbyt mot {klubb}: {hemmamål}–{bortamål}. Klacken har inte glömt."`

### 3 · Landslagssnubb — spelaren med något att bevisa
- **Källa:** `lastNationalSnub` `{playerId, season, round}`; villkor `season === currentSeason` + spelaren i managed-truppen + ej skadad.
- **Severity:** 1 (copper).
- **keyFn:** `callback_snub_{playerId}_{season}`.
- **Trigger:** `firesBeforeNextFixture` (vilken match som helst nära snubben) — eller direkt om snubben är denna omgång.
- **Copy:** `"{spelare} förbigicks i landslaget. Han har något att säga i kväll."`
- Detta är lastNationalSnubs hem — som beslutat, en Callback-trigger, ingen egen yta.

### 4 · Rival-sale-återförening — första mötet med klubben du sålde till
- **Källa:** `lastRivalSaleInfo` `{soldPlayerName, buyerClubName}` + nästa fixtures motståndare = buyerClub.
- **Severity:** 1 (copper).
- **keyFn:** `callback_sale_{season}_{buyerClubName}`.
- **Copy:** `"Första mötet med {buyerClub} sedan {spelare} gick dit. Det blir laddat."`
- **⚠️ Datanotis:** `lastRivalSaleInfo` lagrar klubb-NAMN, inte id. För robust trigger-matchning mot fixturens `oppId`: utöka `lastRivalSaleInfo` med `buyerClubId` vid skrivning i roundProcessor (liten ändring), annars sträng-matcha namn (skört). Bygg id-vägen.

---

## CODE-DEL

1. Lägg fyra `PortalBeat`-poster i `PORTAL_BEATS` (`portalBeats.ts`), i prioritetsordning enligt anti-brus ovan, med `severity`-resolver + `keyFn` + `text(game)`-funktioner som läser källorna ovan. Copy klistras in verbatim.
2. H2H/derby/sale-triggers via primitivens `firesBeforeNextFixture(game, predicate)`. Snub-triggern: spelaren i trupp + snubben denna säsong.
3. `text(game)`-funktionerna templatar `{klubb}`/`{spelare}`/`{n}`/`{resultat}` från `rivalryHistory`, fixtures, `lastNationalSnub`, `lastRivalSaleInfo`.
4. Utöka `lastRivalSaleInfo` med `buyerClubId` (beat 4-prerequisit).
5. Inga nya entiteter, ingen ny yta, ingen beslutsbudget-interaktion. Allt rider PortalBeat + primitiven.

## VERIFIERING
- Möt en klubb du förlorat 2+ raka mot → streak-callback (copper) surfar före matchen, en gång den säsongen.
- Möt en rival efter att ha sålt en spelare dit → sale-callback surfar.
- En snubbad spelare i truppen → snub-callback inför nästa match.
- Två callbacks triggade samma omgång → bara den högst prioriterade (lägst index) visas; övrig surfar nästa relevanta tillfälle.
- Ingen callback räknas mot beslutsbudgeten (verifiera i KF3-trace: de ligger i `nonActionable`).

## HANDOFF
Code: bygg beat-primitiven först, sedan dessa fyra beats + `lastRivalSaleInfo.buyerClubId`-tillägget. Rapportera mot verifieringen — visa `PORTAL_BEATS`-ordningen i diffen (prioritet mot övriga beats). Copy är skriven; rör den inte. Nästa killer-app efter Callback är #4 Generationsloopen eller #3 Legibel konsekvens (Opus+Jacob väljer ordning när Callback står).
