# SPEC — Trupp-redesign (tre faser) 2026-05-24

**Av:** Opus. **Surface:** arkitektur + prioritering + designval. **Underlag:**
`HANDOFF-TRUPP-KORT/SYSTEM/POLISH-2026-05-23.md` (Design), mock
`docs/mockups/2026-05-23_design_trupp_kort.html`, samt kodläsning av
`SquadScreen.tsx`, `Player.ts`, `squadNuStrings.ts`.

## Utgångspunkt — det här är en redesign, inte ett nybygge

Trupp-tabben FINNS och fungerar. Kodläsning bekräftar: NU-vyn (skadade, avstängda,
låg moral, kontrakt-utgår, formation med coach-citat) är byggd med portrait +
`squadNuStrings`. TAKTIK har `chemistryStats` inkopplat i `TacticBoardCard`. Modalen
finns via `PlayerCard` med traits, storylines, talk/leadership-actions. `getPortraitSvg`,
`getRecentMatchRatings`, `TRAIT_META`, `loanDeals` är alla redan exponerade.

Designs tre handoffs beskriver en redesign ovanpå detta — inte ett system att bygga
från noll. Specen delas därför i tre faser efter BYGGBARHET mot nuvarande data, inte
efter Designs dokumentindelning.

**Princip (Jacob):** "Mjukt och synligt före hårt och dolt." Moral, lobby, skade-stadie
och kontraktsutgång ska bli synliga signaler innan de drabbar — inte dolda mekaniker.

---

## DELAT DESIGNSYSTEM (gäller Fas 1–2)

### Border-stripe — 3px vänster, EN färg per kort (prioriterad)
**ÖVERENSKOMMET med Design 2026-05-24.** Prioritet (högst vinner, övriga blir chips):
1. Skada / avstängd → `--danger`
2. Låg moral / lobby (`morale < 45` eller `availability ∈ {unhappy, want_to_leave}`) → `--warm`
3. Kontrakt utgår (`contractUntilSeason <= currentSeason`) → `--gold`
4. Ålder: <24 → `--cold` (utvecklas), 24–30 → `--success` (peak), >30 → `--text-muted` (avtar)

**Kapten bärs INTE av stripen.** Design: kapten visas via captain-band-tygmärket under
portrait (se identitetsmärken), så stripen slipper bära den. Stripen ägnas åt de
brådskande tillstånden; identitet (kapten/veteran/akademi) sitter runt portraitet och
konkurrerar inte om samma läsattention.

### Chip-rad — max 3 synliga, prioriterad
**ÖVERENSKOMMET med Design 2026-05-24.** Ordning: `skada-stadie > avstängd > lobby/sur >
kontrakt-utgår > national > lineup > trait > akademi > proffs/dagjobb`. Max 3 synliga i
raden; överskott syns i MODALEN, inte listan. Identitetsmärken (veteran-ring, akademi-pärla,
captain-band, corner-band) räknas INTE som chips — de sitter runt portraitet, inte i
chip-raden, och konkurrerar inte om samma läsattention. Max 3 chips + identitetsmärken
separat.

Full spill-prioritet vid 4+ relevanta chips (sällsynt): `injury > suspended > lobby >
contract-exp > national > lineup > role/dayjob`.

### Sparkline — ersätter Form-baren, INTE Kond
**ÖVERENSKOMMET med Design 2026-05-24.** Sparklinen ritar SENASTE BETYG (form/momentum) via
`getRecentMatchRatings` — inte CA-trend. Skäl: i trupplistan läser du "hur spelar han
nu" när du sätter lineup; CA-trend (karriärsbåge) hör hemma i modalen. Design föreslog
CA. Fitness (`fitness`) behålls som kompakt indikator (match-readiness är lineup-relevant
och får inte försvinna). Form-baren tas bort — den är redundant mot sparkline + CA-delta.

---

## FAS 1 — PlayerRow-redesign mot befintlig data (BYGGBART NU, ~2h)

Rör endast `PlayerRow` i `SquadScreen.tsx`. Alla fält finns på `Player`.

### Ändringar
1. **Border-stripe** enligt kaskaden ovan. Ett `stripeColor(player, game)`-hjälp som
   returnerar en färg. Sätt `borderLeft: 3px solid ${stripeColor}` + `borderRadius: 0`
   på vänsterkanten (rundade hörn funkar inte med ensidig border — se design-system).
2. **Sparkline** (form, 64×16) ersätter Form-baren. Behåll Kond-baren (fitness).
   Rita polyline från `getRecentMatchRatings(...)`. Stroke: stigande `--success`,
   fallande `--danger`, platt `--text-muted`.
3. **Chip-rad** med befintlig data:
   - skada-stadie: `getInjuryText(player.injuryDaysRemaining, player.id)` (finns)
   - avstängd: `getSuspensionText(...)` (finns)
   - sur/låg moral: härled från `morale < 45` + `lowMoraleDays` (text finns i `getMoraleText`)
   - kontrakt utgår: `contractUntilSeason <= currentSeason` (`getContractText` finns)
   - trait: `player.trait` → `TRAIT_META[trait]` (emoji + label + color)
   - akademi: `player.promotedFromAcademy` → "◆ Akademi"
   - proffs/dagjobb: `isFullTimePro` / `dayJob.title` (redan i koden idag)
   Max 3 synliga, kaskad-prioriterad.
4. **CA-badge** oförändrad (siffra + delta finns redan).

### Verifiering Fas 1
- En skadad spelare: röd stripe, skade-stadie-chip, fallande sparkline. Stripe vinner
  över ålder.
- En ung spelare utan problem: cold stripe (utvecklas), trait/akademi-chips.
- En kapten i peak utan problem: peak-grön stripe + captain-band under portrait (kapten bärs av bandet, inte stripen).
- Densitet: aldrig fler än 3 chips. Skärmdump av 4 kort med olika signaler.

---

## FAS 2 — integrationer av data som FINNS men inte visas (BYGGBART, ~2.5h)

Data finns på `Player` / `game` men exponeras inte i trupp-ytan idag.

1. **Storyline-rad** (~1h): `player.narrativeLog` (senaste `type:'storyline'`-posten)
   som italic Georgia-rad under chips. En åt gången. Finns redan i modalen via
   `storylines` — lyft den senaste till kortet.
2. **Klubblegend + veteran** (~30 min): `isClubLegend` → guld-markering;
   `careerStats.seasonsPlayed` / `seasonHistory` → veteran-corner-band ("8 år").
   Identitetsmärken, permanenta.
3. **Kemi i TAKTIK** (~1h): `game.chemistryStats` finns redan inkopplat i
   `TacticBoardCard` men visas inte som rader. Lägg kemi-par-rader (topp 3 + "se alla")
   med trend. Detta är Designs SYSTEM-handoff #2 — datan finns, bara inte renderad.
4. **Lobby grov-version via `availability`** (~kort): `PlayerAvailability`-enumen
   (`unhappy`, `want_to_leave`, `contract_expiring`, `surplus`) ger en lobby-signal
   IDAG utan att vänta på Manager v1. Mappa till lobby-chip. Detta är en delmängd av
   Fas 3:s fulla lobby — bygg den grova nu, förfina senare.

### Verifiering Fas 2
- En spelare med storyline visar italic-rad; utan storyline ingen rad.
- En klubblegend visar guld-markering; en 8-årsveteran corner-band.
- TAKTIK visar kemi-par med trend.
- En `unhappy`-spelare visar lobby-chip (warm stripe).

---

## FAS 3 — förberedda krokar (SPECAS, BYGGS INTE — data saknas)

**KRITISKT: bygg INTE dessa mot påhittad data.** Var och en kräver ett system som inte
finns. Lägg `// VÄNTAR PÅ <system>`-kommentar där kroken ska sitta, men rendera inget
förrän datakontraktet uppfylls. Att bygga en chip mot data som inte produceras ger döda
signaler som aldrig tänds — exakt det kodgranskningsregeln finns för att fånga.

| Krok | Väntar på | Datakontrakt som måste finnas först |
|---|---|---|
| Squad-pulse-sparkline (NU-hero) | C-FT1 / R1 | `game.teamFitnessHistory: Array<{matchday, fitness, morale, injuries}>` — finns ej |
| Landslags-chip (guld) | C-K1 | Fält på Player el. `game` som markerar uttagen/förbigången — finns ej |
| Manager-anteckning | NY datamodell | `player.managerNote?: string` (max 80 tecken) + edit via long-press. Design: visa INTE ens tom placeholder-slot tills fältet finns. |
| Anniversary-eko (guld-rad) | R5 | `game.activeAnniversaries` kopplat till spelare — ej bekräftat |
| Full lobby-kategorisering | Manager v1 + R1 | Lobby-objekt med motiv (lön/uttagning/speltid) + decision-queue — `availability` ger bara grov version (Fas 2) |
| Klacken-favorit-chip | narrativeLog-mappning | Härledning från Klacken-events — kräver mappnings-pass |

När ett system landar: aktivera motsvarande krok, verifiera att signalen tänds i ett
verkligt spelläge, ta bort `// VÄNTAR`-kommentaren.

---

## VAD SOM INTE ÄNDRAS
- NU-vyns struktur (skadade/avstängda/moral/kontrakt/formation) — den fungerar, polera
  bara stilen till samma stripe/chip-språk.
- Modalen (`PlayerCard`) — behåll. Eventuell tab-struktur (Designs SYSTEM #5) är ett
  separat pass, inte del av detta.
- Lineup-tabs, filter, sort — bevara.
- `getPortraitSvg` — wrappa ev. i `<Portrait>`-komponent (Designs SYSTEM) men byt inte
  ut förrän riktiga illustrationer finns (`player.illustrationUrl`).

## MIGRATION-ORDNING
1. Fas 1 (PlayerRow: stripe + sparkline + chips) — ~2h, fungerar isolerat, synligt direkt.
2. Fas 2 (storyline + legend/veteran + kemi-rader + grov lobby) — ~2.5h.
3. Fas 3 — INGET nu. Krokar läggs in tomma med `// VÄNTAR PÅ`-kommentar när Fas 1–2
   byggs, aktiveras när respektive system finns.

Total byggbar nu: ~4.5h. Fas 3 aktiveras inkrementellt när systemen kommer.

## DESIGNVAL — AVGJORDA med Design 2026-05-24
1. Stripe-prioritet: skada/avstängd > moral/lobby > kontrakt > ålder. Kapten bärs av
   captain-band under portrait, inte av stripen.
2. Sparkline ritar form (senaste betyg), ej CA. Fitness behålls som indikator.
3. Manager-anteckning → Fas 3 (kräver ny datamodell). Visa inte ens tom slot tills fältet finns.
4. Densitet: max 3 chips i raden, identitetsmärken räknas separat. Spill vid 4+ → modalen.

— Opus, 2026-05-24
