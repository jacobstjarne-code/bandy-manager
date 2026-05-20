# SPEC — Spectator-säsongen (R5 del 1)

**Datum:** 2026-05-20
**Status:** Spec klar för Code. Q1-Q4 besvarade av Opus efter PRE-SPEC CROSS-CHECK.
**Pairas med:**
- `design-system/HANDOFF-SPECTATOR-SASONGEN-2026-05-20.md` (Design-Claude's handoff)
- `docs/mockups/2026-05-20_design_spectator_sasongen.html` (visual mock — Code refererar för layout)

---

## 0.5 · Bärande princip — Spårbarhet över kosmetik

**Tonregel för Opus textpool-leverans:** Varje åskådar-event ska när möjligt nämna varför det spelar roll för spelarens klubb — rivalkontext i WatchOthers, avgörande spelaren i ElimAnslag, konkret orsak i SpectatorPrimary-fokus. Inte ett nytt system — bara en regel för hur strängar skrivs.

Data finns i playoffBracket.loserId, nemesisTracker, rivalries.ts. Exempel:
- WatchOthers: "Laget vi föll mot spelar vidare" (lost_to_finalist-kontexten)
- ElimAnslag: nämner motståndarens namn via `{motståndare}`-variabeln
- SpectatorPrimary kontrakt: "X spelare har kontrakt som löper ut i vår" — konkret siffra, inte vag formulering

---

## 0 · Sammanfattning

När managed klubb elimineras i playoff fortsätter säsongen 2–8 omgångar. Spelet har idag ingen designerad känsla för den perioden. Denna spec lägger till:

1. **Eliminationsanslag** — ceremonial overlay direkt efter eliminationsmatchen (integrerat i AnslagOverlay)
2. **`PortalSpectatorMark`** — engångsmarkör vid första spectator-Portal
3. **`SpectatorPrimary`** — primary-card-variant när managed inte har match
4. **`WatchOthersSecondary`** — secondary som visar slutspels-fixtures för andra lag
5. **`isManagedClubSpectator(game)`** — helper-funktion
6. **SeasonSummary-rad som minns eliminationen** — smal integration i befintliga säsongssammanfattning

**Total estimat:** ~5h Code (kortare än Design's ~5h eftersom AnslagOverlay återanvänds, plus ~30 min för SeasonSummary-rad).

---

## 0.5 · Bärande princip — spårbarhet över kosmetik

Denna sprint är första konkretisering av spelbart minne. Inte bara "mer text efter utslagning" — utan ett första konkret steg mot att Portal yter befintlig kausalitet.

**Princip för all copy-leverans i denna spec:** varje åskådar-event ska när möjligt kopplas till varför det spelar roll för spelarens klubb. Konkret:

- **WatchOthersSecondary**-reflektion-copy ska nämna rivalkontexten: "Laget som slog ut er står i semifinal nu." Inte bara "Söderfors spelar."
- **ElimAnslag**-varianter ska nämna *motståndaren* + *avgörande spelaren* + *scenen* — inte bara konstatera elimination. Inte "Vi åkte ut". Hellre "Pålsson avgjorde med fyra minuter kvar."
- **SpectatorPrimary**-fokus ska när möjligt referera *vad* som gör fokus relevant just nu: "Tre kontrakt löper ut i april. Fördröjningen kostar." Inte bara "Kontrakt."

Detta är inte ett separat system — det är en *tonregel* för Opus textpool-leverans. Inga nya kausalitets-spårningsfunktioner krävs i kod; data finns redan i `playoffBracket.loserId`, `nemesisTracker`, `rivalries.ts` etc.

---

## 1 · Helper — `isManagedClubSpectator(game)`

**Plats:** `src/domain/data/seasonPhases.ts` (samma fil som `isManagedClubInPlayoff`)

```typescript
export function isManagedClubSpectator(game: SaveGame): boolean {
  if (!game.playoffBracket) return false

  const allSeries = [
    ...game.playoffBracket.quarterFinals,
    ...game.playoffBracket.semiFinals,
    ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
  ]

  // Andras playoff pågår — det finns scheduled fixturer i någon serie där managed INTE deltar
  const otherPlayoffMatchesRemaining = allSeries.some(s => {
    const managedInSeries = s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId
    if (managedInSeries) return false  // Bara andras matcher räknas
    return s.fixtures.some((fid: string) => {
      const f = game.fixtures.find(ff => ff.id === fid)
      return f?.status === FixtureStatus.Scheduled
    })
  })

  if (!otherPlayoffMatchesRemaining) return false

  // Managed deltog OCH är eliminerad
  const managedEliminated = allSeries.some(s => s.loserId === game.managedClubId)
  // ELLER managed kom aldrig till playoff (8:e plats)
  const managedInBracket = allSeries.some(s =>
    s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId
  )

  return managedEliminated || !managedInBracket
}
```

**Notering:** Använd `FixtureStatus.Scheduled`, inte sträng `'scheduled'`. Importera från `../enums`.

**Invariant (test):** `isManagedClubInPlayoff(game) && isManagedClubSpectator(game)` ska aldrig båda vara `true` samtidigt. Skriv enhetstest som verifierar detta över ett par states.

---

## 2 · Eliminationsanslag — integrerat i AnslagOverlay

**ÄNDRING från Design's förslag:** Ingen separat `ElimAnslag.tsx`-komponent. ElimAnslag blir tre nya `AnslagKey`-värden i `playoffAnslag.ts` (NY fil) som renderas av befintliga `AnslagOverlay`-komponenten.

### 2.1 Ny fil — `src/domain/data/anslag/playoffAnslag.ts`

```typescript
import type { AnslagText } from './types'

export type PlayoffAnslagKey =
  | 'playoff_eliminated_kf'    // eliminerad i kvartsfinal
  | 'playoff_eliminated_sf'    // eliminerad i semifinal
  | 'playoff_eliminated_smf'   // förlorade SM-finalen (silvermedalj)

export const PLAYOFF_ANSLAG: Record<PlayoffAnslagKey, AnslagText> = {
  playoff_eliminated_kf: {
    chapter: '⬩ Säsongens slut ⬩',
    variants: [
      // Opus levererar — 3 varianter, bandysvensk understatement
      // Format: motståndare gick vidare, scen-bild, hallen tystnade
    ],
  },
  playoff_eliminated_sf: {
    chapter: '⬩ Säsongens slut ⬩',
    variants: [
      // Opus levererar — 3 varianter, tyngre vikt (närmare guld)
    ],
  },
  playoff_eliminated_smf: {
    chapter: '⬩ Silvermedalj ⬩',
    variants: [
      // Opus levererar — 3 varianter, silver-erkännande utan att lufta seger
    ],
  },
}
```

### 2.2 Utvidga `anslagService.ts`

I `AnslagKey`-unionen:
```typescript
export type AnslagKey = CupAnslagKey | LeagueAnslagKey | BoardAnslagKey | PlayoffAnslagKey
```

I `getAnslagData`:
```typescript
if (key in PLAYOFF_ANSLAG) return PLAYOFF_ANSLAG[key as PlayoffAnslagKey]
```

### 2.3 Trigger i `computeNextAnslag`

Logiken som idag finns i `anslagService.ts` (avsnittet `computeNextAnslag`) ska utvidgas:

```typescript
// Efter playoff_start, season_done — INNAN cup_done_winner etc:

if (game.playoffBracket) {
  const allSeries = [
    ...game.playoffBracket.quarterFinals,
    ...game.playoffBracket.semiFinals,
    ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
  ]
  const eliminatingSeries = allSeries.find(s =>
    s.loserId === game.managedClubId && s.winnerId !== null
  )
  if (eliminatingSeries) {
    const key: PlayoffAnslagKey =
      eliminatingSeries.round === PlayoffRound.QuarterFinal ? 'playoff_eliminated_kf' :
      eliminatingSeries.round === PlayoffRound.SemiFinal ? 'playoff_eliminated_sf' :
      'playoff_eliminated_smf'
    if (!game.seenAnslag?.includes(key)) return key
  }
}
```

**INGET nytt fält behövs i SaveGame** — `seenAnslag` (befintligt `AnslagKey[]`-fält) räcker. Idempotens är inbyggd i AnslagOverlay-flödet via `markAnslagSeen`.

### 2.4 Template-variable resolution

I `AnslagOverlay.tsx` (rad 16+) finns redan template-resolution för `{vsLabel}`, `{motståndare}` osv. Lägg till motsvarande för playoff-eliminations-anslag:

```typescript
if (anslagKey.startsWith('playoff_eliminated_')) {
  const eliminatingSeries = /* hitta serien via game state */
  const opponentId = eliminatingSeries.winnerId
  const opponent = game.clubs.find(c => c.id === opponentId)
  const lastFixture = /* hitta senaste matchen i serien */
  variantBody = variantBody
    .replace('{motståndare}', opponent?.shortName ?? opponent?.name ?? 'okänd')
    .replace('{rond}', getRoundLabel(eliminatingSeries.round))
    .replace('{resultat}', `${lastFixture.homeScore}–${lastFixture.awayScore}`)
}
```

Opus textpool kommer använda `{motståndare}`, `{rond}`, `{resultat}` som template-variabler.

---

## 3 · `PortalSpectatorMark` — ny komponent

Följer Design's förslag exakt. Mönster identiskt med `PortalPhaseMark`.

**Plats:** `src/presentation/components/portal/PortalSpectatorMark.tsx`

**State i SaveGame:** Lägg INTE till nytt fält. Återanvänd `phaseMarksSeen` med ny pseudo-fas `'spectator'`. Detta kräver att `SeasonPhase`-typen utvidgas:

```typescript
// seasonPhases.ts
export type SeasonPhase = 'pre_season' | 'early' | 'mid' | 'endgame' | 'playoff' | 'spectator'
```

OCH `getSeasonPhase` returnerar `'spectator'` när `isManagedClubSpectator(game) === true`:

```typescript
export function getSeasonPhase(leagueRound: number, isPlayoff: boolean, isSpectator: boolean = false): SeasonPhase {
  if (isSpectator) return 'spectator'
  if (isPlayoff) return 'playoff'
  // ... existing logic
}
```

**OBS:** Detta påverkar `dashboardCardBag.ts` `suppressIn`-logik. Befintliga kort med `suppressIn: ['playoff']` (coffee_room_card, journalist_card, season_signature_card) behöver **EJ** suppressa i spectator-mode — kafferum/journalist ska fortsätta i åskådar-läget (det är R3-fixens hela poäng). Verifiera att de fortsätter visas.

**Component:**

```typescript
import { useGameStore } from '../../store/gameStore'
import { isManagedClubSpectator } from '../../../domain/data/seasonPhases'
import { pickSpectatorMarkCopy } from '../../../domain/data/spectatorMarkText'  // Opus levererar
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props { game: SaveGame }

export function PortalSpectatorMark({ game }: Props) {
  if (!isManagedClubSpectator(game)) return null
  const seen = game.phaseMarksSeen ?? []
  if (seen.includes('spectator')) return null

  const copy = pickSpectatorMarkCopy(game)  // returnerar { eyebrow, quote, helper }

  return (
    <div className="portal-spectatormark">
      <div className="portal-spectatormark-eyebrow">{copy.eyebrow}</div>
      <div className="portal-spectatormark-quote">"{copy.quote}"</div>
      <div className="portal-spectatormark-helper">{copy.helper}</div>
    </div>
  )
}
```

**Placering i PortalScreen.tsx** (rad 174 idag):
```tsx
<SituationCard game={game} />
<PortalPhaseMark game={game} />
<PortalSpectatorMark game={game} />   {/* NY — placeras efter PhaseMark */}
<PortalBeat game={game} />
```

**CSS:** Identisk med `.portal-phasemark` men `--cold` istället för `--accent`. Se mockens spalt 02 för exakt anatomi.

---

## 4 · `SpectatorPrimary` — ny komponent

Följer Design's förslag i grunden, MED EN ÄNDRING (Q4 nedan).

**Plats:** `src/presentation/components/portal/primary/SpectatorPrimary.tsx`

**CARD_BAG-tillägg** (i `PORTAL_CARDS`-array i `initCardBag.ts`):

```typescript
{
  id: 'spectator_primary',
  tier: 'primary',
  weight: 50,
  triggers: [
    (game) => isManagedClubSpectator(game),
    (game) => !game.fixtures.some(f =>
      f.status === FixtureStatus.Scheduled &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    ),
  ],
  Component: SpectatorPrimary,
},
```

**Q4-beslut — kontextuell, inte cyklisk fokus.** Design föreslog `(currentMatchday % 3)` mellan Trupp/Akademi/Kontrakt. Min spec ändrar till kontextuell-prio:

```typescript
function pickSpectatorFocus(game: SaveGame): SpectatorFocus {
  // Prio 1: kontrakt som löper ut denna säsong
  const expiringContracts = game.players.filter(p =>
    /* managed club squad */ p.contractUntilSeason === game.currentSeason
  ).length
  if (expiringContracts > 0) return { type: 'kontrakt', count: expiringContracts }

  // Prio 2: akademitalanger redo för promotion
  const readyTalents = (game.youthTeam?.players ?? []).filter(p =>
    /* readyForPromotion-logik */
  ).length
  if (readyTalents > 0) return { type: 'akademi', count: readyTalents }

  // Prio 3: utvecklingssamtal — default
  return { type: 'trupp', count: /* squad size */ }
}
```

**Motivering:** Cyklisk fokus blir mekanisk över 6–8 omgångar. Kontextuell knyter ihop med synlighets-prinicipen — "vad är värt att titta på just nu" är hela poängen. Om ingen kontrakt löper ut och inga talanger är redo → fokus blir trupp-utvecklingssamtal (mjuk fallback). Spelaren ser alltid sin verkliga prioritet.

**CSS:** Per Design's förslag (mockens spalt 03).

---

## 5 · `WatchOthersSecondary` — ny komponent

Följer Design's förslag. Med ETT FÖRTYDLIGANDE (Q3 nedan).

**Plats:** `src/presentation/components/portal/secondary/WatchOthersSecondary.tsx`

**Q3-beslut — endast playoff i denna komponent.** Design öppnade för cup-final-integration ("`--accent` istället för `--cold`"). Min spec håller fast vid playoff-only. Anledning:
- Cup-final har redan eget anslag (`cup_final_pre`) och syns redan via befintliga kanaler
- Att bunta playoff + cup ger semantisk röra ("Slutspelet pågår — och cup-final också")
- Om cup-final behöver mer synlighet på Portal blir det egen secondary i framtida sprint

**CARD_BAG-tillägg:**

```typescript
{
  id: 'watch_others',
  tier: 'secondary',
  weight: 75,
  triggers: [
    (game) => isManagedClubSpectator(game),
    (game) => {
      // Det finns scheduled playoff-fixturer inom 7 dagar
      const playoffFixtures = game.fixtures.filter(f =>
        f.status === FixtureStatus.Scheduled &&
        !f.isCup &&
        /* är en playoff-fixture — hitta via bracket.fixtures-arrayer */
      )
      return playoffFixtures.some(f => daysUntilFixture(game, f) <= 7)
    },
  ],
  Component: WatchOthersSecondary,
},
```

**Notering:** Använd `playoffBracket.quarterFinals[].fixtures` + semi + final för att avgöra om en fixture är playoff. **Inte** `matchday > 22` (Design's förslag) — det är fragilt om scheduling ändras.

**SM-Final-variant:** `--gold`-stripe när någon scheduled fixture inom 7 dagar är `PlayoffRound.Final`. Per Design's mock.

**Reflektion-copy:** 3 kontexter (förlorade mot finalist / förlorade mot annan / aldrig i playoff). Opus textpool levererar.

---

## 5.5 · SeasonSummary-integration — eliminationsrad

Tillagt 2026-05-20 efter GPT-analys: säsongssammanfattningen ska veta att spelaren åkte ut.

### Vad som läggs till

En rad i `SeasonSummaryScreen.tsx` (eller `SeasonSummary`-byggaren) som kontextspecifikt minns var säsongen tog slut:

- **Eliminerad i KF:** "Kvartsfinalen mot {motståndare} blev slutpunkten. Det är där berättelsen om {säsong} fortfarande skaver."
- **Eliminerad i SF:** "Semifinalen mot {motståndare} — fyra minuter från SM-final. Det är vad som finns kvar av {säsong}."
- **Förlorade SMF:** "Silver. Nära. Aldrig nära nog."
- **Nådde aldrig playoff:** "Vi var inte där när det avgjordes. Det här är vad vi tar med oss till hösten."

### Placering

Inte ny komponent. Lägg till en rad i befintliga SeasonSummary-rendering, mellan slutposition och tabell-statistik. Stil: `font-family: var(--font-display)`, `font-style: italic`, samma format som befintliga reflektionsrader i SeasonSummary.

### Trigger

Vid `SeasonSummaryScreen`-mount, hämta eliminationskontexten via samma logik som ElimAnslag (`game.playoffBracket` + `loserId === managedClubId`-lökup). Om managed vann SM → ingen rad. Om managed är 8:e+ utan att ha varit i playoff → "Nådde aldrig playoff"-variant.

### Copy — Opus levererar

4 varianter (KF/SF/SMF/no-playoff). Samma tonprincip som ElimAnslag — bandysvensk understatement, konkret detalj, ingen melodrama. Opus levererar i ny fil `seasonSummaryElimText.ts` eller utvidgar befintlig `seasonSummaryText.ts` om sådan finns. Verifieras vid sprint-start.

### Anti-scope

Ingen ny vy. Ingen ny komponent. Ingen ändring av SeasonSummary-layout. Bara en rad till.

---

## 5.5 · SeasonSummary — eliminationsrad

Smal scope: en rad i befintliga säsongssammanfattning som minns var säsongen tog slut. Ingen ny vy, ingen ny komponent, ingen layout-ändring.

**Plats:** `SeasonSummaryScreen.tsx` — direkt efter befintlig `playoffResultLabel`-rad

**4 varianter:**

| playoffResult | Text |
|---|---|
| `quarterfinal` | *Säsongen tog slut i kvartsfinalen.* |
| `semifinal` | *Säsongen tog slut i semifinalen.* |
| `finalist` | *Säsongen nådde SM-finalen — men inte hela vägen.* |
| `didNotQualify` | *Laget kvalade inte till slutspelet.* |
| `champion` | (ingen rad — vinnaren behöver inget förtydligande) |

**Stil:** `fontSize: 12, color: var(--text-muted), fontStyle: italic` — diskret under den starka playoff-rubrikraden.

---

## 6 · Q1-Q2 — designval

**Q1 — Modal eller inline för eliminationsanslag?**
**Beslut: Modal via AnslagOverlay** (befintliga komponenten). Det är samma pattern som `cup_done_winner`, `playoff_start`, `season_done` — ceremoniellt avbrott är rätt. Eliminationsmomentet förtjänar att inte glida förbi.

**Q2 — Auto-advance i spectator-mode?**
**Beslut: Behåll auto-advance.** PortalScreen rad 33-49 har redan auto-skip för rundor utan managed-fixture. CTA-text behöver uppdateras till spectator-läge — Design's mock visar "Fortsätt — söndag" / "Säsong 3 förbereds". Implementera i `advanceButtonText`-logiken i `PortalScreen.tsx`:

```typescript
if (isManagedClubSpectator(game)) {
  const nextPlayoffMatch = /* hitta nästa scheduled playoff-fixture */
  if (nextPlayoffMatch) return `Fortsätt — ${formatWeekday(nextPlayoffMatch.date)}`
  return 'Säsong klar →'
}
```

---

## 7 · State + migration

**Inga nya fält i SaveGame.** Två befintliga återanvänds:
- `seenAnslag: AnslagKey[]` täcker eliminationsanslag (`playoff_eliminated_kf` etc)
- `phaseMarksSeen: SeasonPhase[]` täcker spectator-mark (kräver att `'spectator'` läggs till i `SeasonPhase`-union)

**Migration behövs ENDAST för:**
- `SeasonPhase`-typen utökas — befintliga saves behöver inte migreras (fält är `SeasonPhase[]`, nya pseudo-faser tolereras som okända = inte visade)
- Inga nya fält → ingen `?? []`-fallback behövs

---

## 8 · Code-brief — leveransordning

Code arbetar i denna ordning:

1. **Helper + types** (~20 min)
   - `isManagedClubSpectator` i `seasonPhases.ts`
   - Utvidga `SeasonPhase` med `'spectator'`
   - `getSeasonPhase` tar `isSpectator?: boolean`-arg
   - Enhetstest: invariant att inPlayoff + isSpectator aldrig båda true
2. **Anslag-system** (~1h)
   - Ny fil `playoffAnslag.ts` med 3 keys (varianter blank — Opus fyller separat)
   - Utvidga `AnslagKey`-union och `getAnslagData`
   - Trigger i `computeNextAnslag` med round-mapping
   - Template-resolution i `AnslagOverlay.tsx` för `{motståndare}`, `{rond}`, `{resultat}`
3. **SpectatorMark** (~30 min)
   - Komponent `PortalSpectatorMark.tsx` (CSS-pattern återanvänd från PhaseMark)
   - Integrera i `PortalScreen.tsx` efter `PortalPhaseMark`
   - Opus textpool i ny fil `spectatorMarkText.ts`
4. **SpectatorPrimary** (~1h)
   - Komponent `SpectatorPrimary.tsx` med kontextuell focus-picker
   - Tillägg i `PORTAL_CARDS`-array
   - Opus textpool i `spectatorPrimaryText.ts`
5. **WatchOthersSecondary** (~1h)
   - Komponent `WatchOthersSecondary.tsx`
   - Helper `daysUntilFixture` (om inte finns)
   - SM-Final-variant via klass-toggle
   - Tillägg i `PORTAL_CARDS`-array
   - Opus textpool i `watchOthersReflectionText.ts`
6. **CTA-text spectator-mode** (~20 min)
   - Uppdatera `advanceButtonText` i `PortalScreen.tsx`
7. **Tester** (~30 min)
   - Helper-invariant
   - ElimAnslag triggas exakt en gång per säsong
   - SpectatorMark visas en gång per säsong
   - SpectatorPrimary aktiveras endast när managed inte har scheduled match
   - WatchOthersSecondary triggas inom 7 dagar av playoff-fixture

**Total Code-tid:** ~4–5h (anslag-arbete är kortare än Design's beräkning eftersom AnslagOverlay återanvänds).

**Opus textpool-leverans (parallellt med Code):**
- 9 ElimAnslag-varianter (3 per round) i `playoffAnslag.ts`
- 3+ SpectatorMark-varianter i `spectatorMarkText.ts`
- 12 SpectatorPrimary-varianter (4 per fokus × 3 fokus) i `spectatorPrimaryText.ts`
- 6 WatchOthers-reflektioner (3 per kontext, 2 final-typer = 6) i `watchOthersReflectionText.ts`

---

## 9 · Acceptanskriterier

- [ ] `isManagedClubSpectator(game)` returnerar true när managed eliminerad ELLER aldrig kom till playoff OCH andras playoff pågår
- [ ] Invariant: `isManagedClubInPlayoff && isManagedClubSpectator` aldrig båda `true`
- [ ] ElimAnslag visas exakt en gång per säsong vid elimination, via AnslagOverlay (samma chrome som playoff_start/season_done)
- [ ] `PortalSpectatorMark` visas exakt en gång per säsong vid första spectator-Portal
- [ ] `SpectatorPrimary` renderas när managed är ute OCH inga scheduled matcher finns för managed. Focus är kontextuell, inte cyklisk
- [ ] `WatchOthersSecondary` visas när spectator + playoff-fixture inom 7 dagar. `--gold`-variant vid SM-Final
- [ ] Kafferum/journalist/säsongssignatur fortsätter visas i spectator-mode (inte suppressas av ny `'spectator'`-fas)
- [ ] CTA-text byter till spectator-läge ("Fortsätt — söndag" / "Säsong klar →")
- [ ] Pre-migration saves laddar utan crash (inga nya fält → automatiskt OK)
- [ ] Inga hex-värden i nya TSX. Alla färger via `var(--*)`
- [ ] Inga `var(--gold-deep)` / `var(--shadow-gold)` inline-fallbacks — om de krävs, lägg till tokens i CSS-roten först

---

## 10 · Inte i denna spec

- **R5 förlust-eko in i nästa säsong** — separat spec, levereras när denna är wired och playtestad
- **SM-final silvermedaljör-variant** av ElimAnslag — `playoff_eliminated_smf`-key finns specifierad här men variant-leverans kan delas i två omgångar (KF/SF först, SMF-silver i andra runde) om Opus vill
- **Cup-elimination round 1** — använder befintliga `cup_eliminated_round1`-anslag
- **Cup-fortsättning vid playoff-elimination** — befintlig logik. Om managed har cup-match kvar visas NextMatchPrimary som vanligt
- **Dedikerade elim-aware narrativa pools för kafferum/klack/journalist/styrelse** — GPT-analys 2026-05-20 pekade på detta som värdefullt men det hör hemma i R5 förlust-eko (Design-Claude TIER 1.2 separat handoff). Befintliga kafferum/journalist-pools fortsätter visas i `'spectator'`-fas via R3-fixens logik — i sin endgame-default-form. Specifika elim-aware varianter levereras separat
- **Manager som karaktär** — Design-Claude TIER 1.3, GPT-varning 2026-05-20 om att det är ett identitetsbeslut (klubbens berättelse vs tränarens). Inte i scope här

---

## 11 · Ändringslogg för denna spec

| Datum | Ändring |
|---|---|
| 2026-05-20 | Spec skapad efter Design-Claudes handoff + Opus PRE-SPEC CROSS-CHECK |
| 2026-05-20 | **Två tillägg efter GPT-analys 2026-05-20:** (1) Sektion 0.5 "Bärande princip — spårbarhet över kosmetik" som tonregel för copy-leverans, (2) Sektion 5.5 SeasonSummary-eliminationsrad (4 varianter, smal scope). Övriga GPT-punkter (elim-aware kafferum/klack/journalist-pools) parkerade till R5 förlust-eko (TIER 1.2). |

---

— Opus, 2026-05-20
