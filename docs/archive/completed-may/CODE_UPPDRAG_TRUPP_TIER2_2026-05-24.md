# CODE-UPPDRAG — Trupp Tier 2 (squad-pulse + anniversary-eko) 2026-05-24

**Av:** Opus. Två uppdrag från `SPEC_TRUPP_FAS3_SYSTEM_2026-05-24.md`. Jacob beslut:
squad-pulse FULLT (ii), anniversary-eko JA. Manager-anteckning (Tier 1A) byggs separat
— detta är nästa steg efter den.

═══════════════════════════════════════════════════════════════════════════
## UPPDRAG A — Anniversary-eko (BYGGBAR NU, render + Opus-text)
═══════════════════════════════════════════════════════════════════════════

**Bakgrund:** `ActiveAnniversary` bär redan `subjectPlayerId` (verifierat,
clubMemoryService.ts rad 157). `findActiveAnniversaries(game)` returnerar dem matchade
mot currentMatchday. Ren render — ingen ny datamodell.

**Bygg:**
1. I SquadScreen: anropa `findActiveAnniversaries(game)` EN gång, memoisera. Skicka ner
   som prop till PlayerRow (anropa INTE per rad — samma beräkning för alla spelare, samma
   mönster som captainPlayerId hissades). Mappa per `subjectPlayerId === player.id`.
2. Render i PlayerRow: guld italic-rad under storyline-raden, samma `paddingLeft: 50`-rytm.
   Vid flera matchande anniversaries för en spelare — ta högsta `significance`/`echoSize`.
3. Texten: EKO, inte `originalEventText` rått (koden säger "Opus skriver eko"). Opus har
   skrivit grundformler (nedan). De väljs på `type` + `yearsAgo` + `outcome`.
4. Aktivera kroken `{/* VÄNTAR PÅ R5: Anniversary-eko */}`.

**FÖRST — rapportera till Opus innan eko-texten låses:** Vilka `type`-värden (MemoryEventType)
förekommer FAKTISKT med ett satt `subjectPlayerId`? Greppa byggarna (clubMemoryEventBuilders.ts
+ collectSeasonEvents i clubMemoryService.ts). Trolig delmängd: `player_milestone`,
`academy_promotion`, `retirement`, `storyline_resolution`. Opus kompletterar formlerna per
faktisk typ när rapporten kommer — bygg render-mekaniken nu, koppla in slutgiltig text sen.

**Eko-text (Opus — LÅST efter typ-rapport):**
Rapporten: bara fyra typer bär `subjectPlayerId`, och ALLA är `outcome: neutral`. Won/lost
finns bara på fixture-typer som bär subjectClubId, inte spelar-id. Alltså: eko väljs på
`type` + `yearsAgo`, ALDRIG på outcome. (Mina tidigare won/lost-formler var döda — borttagna.)
Varianter för variation, deterministiskt val på `eventId`-hash eller matchday (inte random).

*`player_milestone` (milstolpe — 100 matcher, 50 mål, debutåterkomst etc.):*
- `På dagen {yearsAgo} år sedan — milstolpen. Han bär den fortfarande.`
- `{yearsAgo} år sedan just denna omgång. Han skrev in sig då.`
- `Samma omgång för {yearsAgo} år sedan. Det är sådant orten minns.`

*`academy_promotion` (uppflyttad från P19):*
- `{yearsAgo} år sedan han kom upp från P19. Nu är han vår.`
- `På dagen {yearsAgo} år sedan steget upp från juniorerna.`
- `{yearsAgo} år i A-laget. Det började just den här omgången.`

*`storyline_resolution` (en spelar-storyline som löstes — villkorlig, kan sakna spelar-id):*
- `{yearsAgo} år sedan berättelsen fick sitt slut. Den sitter kvar.`
- `På dagen {yearsAgo} år sedan. Den som var med minns.`

*`retirement` (legend som slutat — triggar bara om spelaren ändå renderas i trupplistan,
alltså en hyllning till en veteran som bär minnet, inte en bortgången):*
- `{yearsAgo} år sedan avskedet. Tröjan hänger kvar i hallen.`
- `Orten glömmer inte. {yearsAgo} år sedan, samma omgång.`

*default (ny/okänd typ som råkar bära spelar-id):*
- `Samma omgång, {yearsAgo} år tillbaka. Klubben minns.`

Ingen presens-"han är med"-formulering — alla är neutrala minnen som funkar oavsett om
spelaren spelar bra eller dåligt just nu. {yearsAgo} renderas som siffra.

**Verifiering A:** En spelare med en aktiv anniversary visar guld-eko-rad i trupplistan.
Ingen rad om ingen anniversary matchar. Skärmdump.

═══════════════════════════════════════════════════════════════════════════
## UPPDRAG B — Squad-pulse FULLT (ny datamodell + sampling + Design-väntan)
═══════════════════════════════════════════════════════════════════════════

**Jacob valde (ii) FULLT** — inte enkel kondition-sparkline. Ny `teamFitnessHistory` med
alla komponenter. `fatigueHistory` (platt meter-värde) räcker INTE.

**Datakontrakt (SaveGame.ts — NY):**
```ts
teamFitnessHistory?: Array<{
  matchday: number
  avgFitness: number    // snitt fitness över managed-truppen
  avgMorale: number     // snitt morale
  injuryCount: number   // antal skadade i truppen
}>
```

**Bygg (datalager — byggbart NU):**
1. Sampla `teamFitnessHistory` vid omgångsövergång. SAMMA STÄLLE som `fatigueHistory`
   pushas (Code: greppa `fatigueHistory` push/sample-punkten — sannolikt i roundProcessor
   eller en service den anropar; `getFatigueState` i decisionFatigueService beräknar bara
   on demand, lagrar inte). Lägg en `teamFitnessHistory.push(sample)` på samma plats.
2. Sample-beräkning: avgFitness/avgMorale = snitt över managed-klubbens spelare,
   injuryCount = antal med `isInjured`. Rullande fönster ~10 omgångar (slice).
3. Migration: odefinierat = tom historik, börjar fyllas nästa omgångsövergång.

**Squad-pulse-formel (Opus + Design — viktning):**
Opus förslag att förankra med Design: `puls = avgFitness × 0.5 + avgMorale × 0.4 −
injuryCount × 5`, klampad 0–100. Fitness väger tyngst (matchduglighet), morale näst
(vilja), skador drar ner (varje skada −5). Komponenterna SYNLIGA på tap, inte dolda.
Design får justera viktningen — men formeln ska vara läsbar, inte en svart låda.

**VISUALISERING — DESIGN HAR LEVERERAT (ritning låst):**
Hero-sparkline överst i NU-vyn, ovanför status-korten. Design-ritning:
- **Placering:** topp av NU-vyn, ovanför status-cards. Kollapsad ~80px, expanderad ~160px.
- **Header-rad:** `TRUPPENS PULS · 7 omg` + aktuellt pulsvärde + delta (↓-12) högerställt.
- **Sparkline-area:** full bredd minus 14px padding båda sidor, 40px höjd, area-fill
  (gradient under linjen, samma som CA-trend på trupp-kort). Rullande 7 omg.
- **Auto-rad:** italic, under sparklinen (Opus-pool nedan).
- **Stroke per nivå:** ≥80 success · 60-79 accent · 40-59 warm · <40 danger.
  Border-left-stripe samma färg som stroke (cardet ärver tonalitet).
- **Slut-dot:** 2.5px cirkel i stroke-färg, gold ring om ≥85.
- **Tap → expandera INLINE** (Design-val, inte modal — hero ska inte avbryta NU-flödet):
  tre sub-sparklines (20px höjd var, 7-omg-fönster): Fitness=accent, Moral=warm,
  Skadade=danger. Värde till vänster, spark till höger. Formelrad längst ner i mono,
  muted, ej fet: `68 = 72×.5 + 65×.4 − 2×5`.
- **Ingen duplicering mot status-cards (Design-lösning):** pulse = aggregat, cards =
  specifikt. När en komponent är i danger-zon får motsvarande status-card samma färg-stripe
  (injuries danger → "Skadade"-sektionen får danger-stripe). Visuell länkning utan
  scroll-skript.
- **Crisis (<40 i 2+ omg):** pulse-card får `box-shadow: 0 0 8px rgba(176,80,64,0.25)`.
  Samma princip som SM-final-gold-CTA — sparad för riktigt allvar.
- **Edge: <5 datapunkter** → visa bara aktuellt värde + auto-rad "Pulse-data byggs upp".

**Bygg (render — Design klar, byggbart):**
4. Sparkline-hero i NU-vyn enligt ritning ovan (återanvänd `Sparkline`-primitiven).
5. Tap expanderar inline → tre sub-sparklines + formelrad.
6. Danger-zon-länkning till status-cards (delad stripe-färg).
7. Aktivera squad-pulse-kroken (NU-vyn).

**Auto-rad-copy (Opus-pool, svensk text — INTE hårdkodad):**
Squad-pulsen syns varje gång NU-vyn öppnas — en hårdkodad rad skaver snabbt. Pool per
tillstånd, väljs på VILKEN komponent som drar ner mest (eller "frisk"/"bygger upp").
Välj rad deterministiskt på matchday (inte Math.random) så den inte hoppar vid omrender.

*Frisk (allt ≥80, inga skador):*
- "Truppen är frisk."
- "Inga självklara bekymmer just nu."
- "Stadigt över hela linjen."

*Låg kondition (avgFitness < 60, dominerande):*
- "Lägre kondition senaste omgångarna."
- "Benen är tunga i truppen."
- "Konditionen sviktar — träningsdosen syns."

*Låg moral (avgMorale < 55, dominerande):*
- "Stämningen är dämpad i laget."
- "Moralen ligger lågt just nu."
- "Det gnisslar något i omklädningsrummet."

*Skador (injuryCount ≥2, dominerande):*
- "{n} skadade. Tunnare trupp än vanligt."
- "{n} på skadelistan — det märks i bredden."
- "Sjukstugan är full: {n} borta."

*Fallande trend (delta ≤ −8, ingen enskild komponent dominerar):*
- "Pulsen pekar nedåt."
- "Något tappar fart i truppen."

*Stigande trend (delta ≥ +8):*
- "Det vänder uppåt."
- "Truppen repar sig."

*<5 datapunkter:*
- "Pulse-data byggs upp."

Kombi (t.ex. både skador OCH låg kondition): prioritera skador > kondition > moral >
trend. Code: om två komponenter är lika låga, ta den med högst prioritet enligt ordningen.
Auto-raden visar EN rad, inte flera.

═══════════════════════════════════════════════════════════════════════════

## Ordning
A (anniversary) byggbar direkt — render nu, eko-text när typ-rapport kommer.
B HELA squad-pulse byggbar nu — datalager (steg 1-3) + render (steg 4-7), Design har
levererat ritningen och Opus auto-rad-poolen. Inget blockerar längre.

En sak till Opus innan A:s text låses: anniversary typ-rapport (vilka MemoryEventType
förekommer med satt subjectPlayerId). Render byggs nu, text kopplas in sen.

Formel-viktningen (`fitness×.5 + moral×.4 − skador×5`) är Opus förslag — Design fick
den i ritningen och formelraden visar den, så den är implicit förankrad. Bygg med den.

— Opus, 2026-05-24
