# SPEC — Klubbminne (audit DEL A + R5 anniversary DEL B)

**Datum:** 2026-05-20
**Status:** Klar för Code. Q1-Q5 besvarade av Opus. PRE-SPEC CROSS-CHECK gjord 2026-05-20.
**Pairas med:**
- `design-system/HANDOFF-KLUBBMINNE-ANNIVERSARY-2026-05-20.md` (Design-Claudes handoff)
- `docs/mockups/2026-05-20_design_klubbminne_anniversary.html` (visual mock)

---

## 0 · Sammanfattning

Klubbminne v1 (ClubMemoryView + 5 sub-komponenter + clubMemoryService + event-builders) är **redan levererat** och fungerar. Detta är inte green-field — det är två separata jobb ovanpå befintlig kod:

**DEL A — Audit-fix** (~3h): Inline-styles → ny `club-memory.css`-fil, hardcoded hex → tokens, severity-system per event-typ, era-band per säsong, featured-klass för signature events. Ren upprensning, ingen ny funktionalitet.

**DEL B — R5 Anniversary-system** (~4h): Nytt: ekon av tidigare säsongers events triggas på matchande omgång året efter. Eko visas både i ClubMemoryView (memory-row-markör) och passivt på Portal (PortalAnniversaryMark vid big eko). Kafferum + klacken-banderol-koppling vid medium/big eko.

**§G (score-block + formkurva)** är INTE i denna spec — separat backlog-rad C-SY2, väntar på score-system-spec från Design.

**Total estimat:** ~7h Code + ~50–70 strängar Opus (Anniversary-text levereras separat).

---

## 0.5 · Bärande princip — synlig kausalitet

Anniversary-systemet är *direkt fortsättning* på synlighets-tesen från Spectator-säsongen. Eko triggas inte för att skapa text — det triggas för att synliggöra spelets befintliga minne av spelarens tidigare beslut.

**Princip för all anniversary-copy:** ekot ska peka tillbaka på den specifika händelsen, inte allmänt. Inte "Det är ett år sedan något viktigt hände" — hellre "Ett år sedan Andersson-affären. Klacken minns fortfarande." Konkret datum, konkret namn, konkret scen.

Detta gäller även för PortalAnniversaryMark, kafferum-jubileum och klacken-banderol — alla tre kanaler refererar samma underliggande event men i sin egen ton.

---

## 1 · PRE-SPEC CROSS-CHECK — fynd

Verifierat mot kod 2026-05-20. Design-Claudes antaganden bekräftade plus två fynd att hantera.

| Vad | Status |
|---|---|
| `ClubMemoryView` + 5 sub-komponenter | ✓ Finns |
| `getClubMemory(game)` aggregator | ✓ Finns i `clubMemoryService.ts` |
| `MemoryEvent` + 15 `MemoryEventType` | ✓ Komplett |
| `clubMemoryEventBuilders.ts` med 4 byggare | ✓ Finns |
| `SIGNIFICANCE_THRESHOLD = 30` | ✓ |
| `MAX_SEASONS = 5` | ✓ |
| Inline-styles i `ClubMemorySeasonSection` | ✓ Bekräftat (Design's WARN A.3) |
| `eraName` per säsong | ⚠️ **LUCKA** — sätts bara för current season |
| `event.text.includes('förlust')` som severity-källa | ⚠️ **FRAGILT** — Design föreslog detta i A.4 |

---

## 2 · DEL A — Audit-fix

### 2.1 · Ny CSS-fil `club-memory.css`

**Plats:** `src/presentation/styles/club-memory.css` (ny fil)

Flytta alla inline-styles från `ClubMemoryView`, `ClubMemoryEventRow`, `ClubMemoryLegendsBlock`, `ClubMemoryRecordsBlock`, `ClubMemorySeasonSection`, `ClubMemoryEmpty` till denna fil. Klassnamn enligt mockens struktur i `docs/mockups/2026-05-20_design_klubbminne_anniversary.html`.

**CSS-variabler som ska användas (inga hex-värden i ny CSS):**
- `--bg-portal-surface` istället för `--bg-leather` (Design's audit-fynd A.7)
- `--accent` (rgba `196,122,58`) istället för rgba `184,136,76` (Design's audit-fynd A.3)
- `--text-primary`, `--text-secondary`, `--text-muted` för text-färger
- `--border`, `--border-strong` för linjer
- `--cold` för kalla/season-end-events
- `--gold` för championship/triumf
- `--danger` för förlust/scar

**Saknas tokens (Design's flagga från R3+-audit):** `--gold-deep` och `--shadow-gold` finns inte i tokens-filen. Om de behövs för featured-events, lägg till dem i `src/presentation/styles/tokens.css` (eller motsvarande) FÖRST. Inte inline-fallbacks.

### 2.2 · Severity per event-typ — `outcome`-fält tillagt

**Justering mot Design's A.4-förslag:** Design föreslog `event.text.includes('förlust')` som diskriminator för "scar"-styling. Det är fragilt eftersom text varierar i variantformer ("förlust", "föll mot", "åkte ut", "tappade poäng" osv).

**Bättre lösning:** Lägg till `outcome: 'won' | 'lost' | 'neutral'` på `MemoryEvent`-typen + populera i `buildEventFromFixture` baserat på fixture-resultat (managed perspektiv). Då kan severityClass titta på struct-data, inte text.

**Plats:** `src/domain/entities/MemoryEvent.ts` (eller där typen är definierad — verifiera) + `clubMemoryEventBuilders.ts`.

**Severity-mapping** (klass på `<div className="memory-row">`):

| MemoryEventType | outcome | severityClass |
|---|---|---|
| `fixtureCupFinal`, `fixturePlayoffFinal` | `won` | `legendary` |
| `fixtureCupFinal`, `fixturePlayoffFinal` | `lost` | `scar` |
| `fixtureDerby` | `won` / `lost` | `derby` |
| `fixturePlayoffEliminated`, `fixtureRelegation` | (alltid `lost`) | `scar` |
| `legendRetirement` | — | `legendary` |
| `academyPromotion` | — | (default) |
| `scandal` | — | `scar` |
| `facilityCompleted` | — | (default) |
| övriga | — | (default) |

CSS-klasserna: `.memory-row.scar` får `--danger`-stripe, `.memory-row.legendary` får `--gold`-stripe, `.memory-row.derby` får `--accent`-stripe.

### 2.3 · Era-band per säsong

**Lucka:** `eraName` sätts bara för current season i game state. Tidigare säsongers eror är okända.

**Fix — utöka `seasonStartSnapshot`** med `era: ClubEra` fält. Vid sessions-start: när en ny säsong startar, snapshotta `currentEra` i `seasonStartSnapshot`. För historiska säsonger som inte har snapshot: fall tillbaka på `'unknown'` (era-band visas inte).

**Migration:** Befintliga saves: lägg till `era: 'unknown'` på alla existerande snapshot-poster. Inga kraschar.

**Rendering i `ClubMemorySeasonSection`:** Era-band ovanför season-header. Format enligt mock: "ETABLERINGSÅRET" / "FOTFÄSTET" / "LEGACY"-text med band-styling. Endast när era !== 'unknown'.

### 2.4 · `featured`-klass för significance >= 90

`MemoryEvent` har redan `significance`-fält. Lägg till klass `memory-row-featured` på rader där `significance >= 90`. CSS: tjockare stripe, lite mer luft, hint av `--gold-deep`-färgskugga om token finns.

Bandysvensk understatement gäller — featured är inte stort utropstecken, det är subtil markering att eventet är värt att lägga märke till.

---

## 3 · DEL B — R5 Anniversary-system

### 3.1 · Helper `findActiveAnniversaries(game)`

**Plats:** `src/domain/services/clubMemoryService.ts` (samma fil som `getClubMemory`)

```typescript
export interface ActiveAnniversary {
  eventId: string                    // unique ID på den minnesvärda eventen
  originalSeason: number             // när det hände
  yearsAgo: number                   // 1, 2, 3... (max 5 för MAX_SEASONS)
  matchday: number                   // matchday i ursprungsåret (matchas mot nuvarande)
  type: MemoryEventType
  outcome: 'won' | 'lost' | 'neutral'
  significance: number               // 0-100
  echoSize: 'small' | 'medium' | 'big'
  subjectPlayerId?: string
  subjectClubId?: string
  originalEventText: string          // för referens (visas inte direkt — Opus skriver eko)
}

export function findActiveAnniversaries(game: SaveGame): ActiveAnniversary[] {
  const currentMatchday = game.currentMatchday
  const allEvents = getClubMemory(game).flatMap(s => s.events)

  return allEvents
    .filter(e => {
      // Måste matcha matchday inom +/- 1 (slacka pga schemavariation)
      if (Math.abs(e.matchday - currentMatchday) > 1) return false

      // 1 år initialt — significance >= 30
      const yearsAgo = game.currentSeason - e.season
      if (yearsAgo < 1) return false
      if (yearsAgo === 1) return e.significance >= 30

      // 2+ år bakåt — endast för significance >= 95 (SM-guld, SM-final-förlust, etc)
      // Q2-beslut: symmetri mellan smärta och stolthet
      if (e.significance >= 95) return yearsAgo <= 5
      return false
    })
    .map(e => ({
      eventId: `${e.season}-${e.matchday}-${e.type}-${e.subjectPlayerId ?? e.subjectClubId ?? 'x'}`,
      originalSeason: e.season,
      yearsAgo: game.currentSeason - e.season,
      matchday: e.matchday,
      type: e.type,
      outcome: e.outcome ?? 'neutral',
      significance: e.significance,
      echoSize:
        e.significance >= 90 ? 'big' :
        e.significance >= 60 ? 'medium' :
        'small',
      subjectPlayerId: e.subjectPlayerId,
      subjectClubId: e.subjectClubId,
      originalEventText: e.text,
    }))
}
```

**Tests:**
- En event från förra säsongen på matchande matchday → returneras
- En event från förra säsongen med significance 25 → filtreras bort
- En event från 3 år sedan med significance 96 → returneras (SM-guld-eko)
- En event från 3 år sedan med significance 80 → filtreras bort

### 3.2 · Nya SaveGame-fält

**Plats:** `src/domain/entities/SaveGame.ts`

```typescript
interface SaveGame {
  // ... existerande fält
  activeAnniversaries?: ActiveAnniversary[]   // populeras vid omgångsstart
  anniversariesSeen?: string[]                // eventIds som dismissats
}
```

**Migration:** Båda fält optional med `?? []`-fallback. Befintliga saves laddar utan ändring.

### 3.3 · Trigger i `gameFlowActions.advance()`

**Plats:** `src/presentation/store/gameFlowActions.ts` (eller motsvarande store-action)

Vid varje `advance()`-anrop (omgångsövergång):

```typescript
const anniversaries = findActiveAnniversaries(newGame)
const previouslySeen = newGame.anniversariesSeen ?? []
const fresh = anniversaries.filter(a => !previouslySeen.includes(a.eventId))

newGame = {
  ...newGame,
  activeAnniversaries: fresh,
}
```

**Notering:** `fresh` populeras varje advance. När Portal visar PortalAnniversaryMark eller komponenten i ClubMemoryView klickas bort, läggs eventId till i `anniversariesSeen`. Då försvinner ekot.

### 3.4 · `PortalAnniversaryMark`-komponent

**Plats:** `src/presentation/components/portal/PortalAnniversaryMark.tsx` (ny)

Visas på Portal när minst en `big`-eko finns aktiv. Endast en åt gången (välj highest significance). Engångsmarkör per event — markeras som seen via `markAnniversaryAcknowledged(eventId)`.

```tsx
import { useGameStore } from '../../store/gameStore'
import { pickAnniversaryMarkCopy } from '../../../domain/data/anniversaryMarkText'

export function PortalAnniversaryMark() {
  const game = useGameStore(s => s.game)
  const markAnniversaryAcknowledged = useGameStore(s => s.markAnniversaryAcknowledged)
  if (!game?.activeAnniversaries) return null

  const bigEcho = game.activeAnniversaries.find(a => a.echoSize === 'big')
  if (!bigEcho) return null

  const copy = pickAnniversaryMarkCopy(bigEcho, game)

  return (
    <div className="portal-anniversarymark" onClick={() => markAnniversaryAcknowledged(bigEcho.eventId)}>
      <div className="portal-anniversarymark-eyebrow">{copy.eyebrow}</div>
      <div className="portal-anniversarymark-quote">{copy.quote}</div>
      <div className="portal-anniversarymark-helper">{copy.helper}</div>
    </div>
  )
}
```

**Placering i PortalScreen.tsx:** Direkt efter `PortalSpectatorMark`, före `PortalBeat`.

**CSS:** Pattern identiskt med `PortalPhaseMark` men med `--gold` (för triumfer) eller `--danger` (för scars) beroende på `bigEcho.outcome`. Verifieras mot mock.

### 3.5 · Kafferum + klack-banderol vid medium/big eko

**Kafferum:** I `coffeeRoomService.ts`, lägg till ny pool `ANNIVERSARY_KAFFERUM` som triggas när `game.activeAnniversaries` har minst en `medium`-eller-bättre eko som inte är seen. Pool levereras av Opus separat.

**Klack-banderol:** I `klackEchoText.ts`-mönstret, lägg till anniversary-variant. Triggas när `big`-eko + matchdag-överlapp. Pool levereras av Opus separat.

**Anti-mekanik (Q3-beslut):** v1 är PASSIV — ekot ger inga moral/CS-deltas, ingen mekanisk effekt. Bara narrativ närvaro. Mekanisk koppling kan komma i v2 om Jacob ser att det är värt det.

### 3.6 · Memory-row-eko-markör i `ClubMemoryView`

I `ClubMemoryEventRow.tsx`: om eventets `id` matchar någon `activeAnniversaries[i].eventId`, lägg till klass `memory-row-echoing` + en liten markör/label på raden (t.ex. "Eko · S3 omg 8" enligt mockens stil).

CSS: subtil glow eller stripe-färgändring. Bandysvensk understatement gäller — det är inte ett stort utropstecken, det är en markör för den som tittar.

---

## 4 · Q1-Q5 — Opus-beslut

**Q1 — Endast scars eller även triumfer?** **Båda.** Klubbidentitet byggs av allt — SM-guld eko är lika värdefullt som derby-förlust. Asymmetri vore underligt.

**Q2 — Hur många år tillbaka triggar eko?** **1 år initialt** för alla events med `significance >= 30`. **2–5 år tillbaka endast för `significance >= 95`** (SM-guld, SM-final-förlust). Symmetri mellan smärta och stolthet — och håller eko-mängden hanterbar.

**Q3 — Passiv eller mekaniskt aktiv eko?** **Passiv i v1.** Klacken-banderol kan ge mood-boost om vinst men det är §G2-territorium, inte v1. Mekanisk inverkan kommer i v2 om det visar sig värt det vid playtest.

**Q4 — Copy-pool ~50–70 strängar.** Opus levererar separat. Pools:
- `anniversaryMarkText.ts` (PortalAnniversaryMark) — ~15 strängar (varianter per outcome × yearsAgo-kontext)
- `anniversaryKafferumText.ts` (kafferum) — ~20 strängar
- `anniversaryKlackText.ts` (klack-banderol) — ~15 strängar
- `anniversaryMemoryRowText.ts` (memory-row-eko-markör) — kort label, ~10 strängar

**Q5 — §G score-block + formkurva.** **SEPARAT.** Inte i denna spec. Backlog-rad C-SY2. Väntar på score-system-spec från Design lördag.

---

## 5 · Tekniska justeringar (sammanfattat)

| Område | Justering |
|---|---|
| Severity-källa | `outcome`-fält på `MemoryEvent`, inte text-includes |
| Era-rendering | Utöka `seasonStartSnapshot` med `era`-fält + migration |
| Anniversary vs ElimAnslag | ElimAnslag har högre prio på samma omgång — om båda triggas samtidigt, ElimAnslag visas först. PortalAnniversaryMark väntar tills ElimAnslag är seen. |

---

## 6 · Code-brief — leveransordning

Code arbetar i denna ordning:

1. **DEL A.1 + A.7 (CSS-flytt)** (~1h)
   - Skapa `club-memory.css`
   - Flytta inline-styles, byt `--bg-leather` mot `--bg-portal-surface`, byt rgba `184,136,76` mot `--accent`
   - Verifiera att inga hex-värden finns i ny CSS
   - Lägg till `--gold-deep` + `--shadow-gold` i tokens om de behövs

2. **DEL A.4 (outcome-fält + severity)** (~1h)
   - Lägg till `outcome: 'won' | 'lost' | 'neutral'` på `MemoryEvent`-typen
   - Populera i `buildEventFromFixture` baserat på fixture-resultat (managed-perspektiv)
   - severityClass-mapping per tabell ovan
   - Tester: en `fixturePlayoffEliminated` med outcome `lost` → får klass `scar`

3. **DEL A.3 (era-band + seasonStartSnapshot.era)** (~1h)
   - Utöka `seasonStartSnapshot`-typen med `era`
   - Snapshot vid säsongsstart
   - Migration: `era: 'unknown'` på befintliga
   - Render era-band ovanför season-section när era !== 'unknown'

4. **DEL A.5 (featured-klass)** (~15 min)
   - Klass på `significance >= 90`

5. **DEL B.1 (`findActiveAnniversaries`-helper)** (~1h)
   - Implementera helper
   - Tester per acceptanskriterium

6. **DEL B.2 + B.3 (SaveGame-fält + advance-trigger)** (~30 min)
   - Två nya fält med migration
   - Populera i advance()

7. **DEL B.4 (`PortalAnniversaryMark`)** (~45 min)
   - Komponent + CSS-pattern från PortalPhaseMark
   - Placering i PortalScreen.tsx
   - `markAnniversaryAcknowledged`-action
   - Opus textpool i `anniversaryMarkText.ts` (NY fil — Opus levererar separat)

8. **DEL B.5 (kafferum + klack-trigger)** (~45 min)
   - Pool-trigger i `coffeeRoomService.ts`
   - Pool-trigger i klack-systemet (`klackEchoText.ts` eller motsvarande)
   - Opus textpooler i `anniversaryKafferumText.ts` + `anniversaryKlackText.ts` (NYA filer — Opus levererar separat)

9. **DEL B.6 (memory-row-eko-markör)** (~30 min)
   - Klass + label i `ClubMemoryEventRow.tsx`
   - Opus label-pool i `anniversaryMemoryRowText.ts` (NY fil — Opus levererar separat)

10. **Tester** (~30 min)
    - Helper-tester
    - Component-tester för PortalAnniversaryMark
    - Migration-tester

**Total Code-tid:** ~7h.

**Opus parallellt:** 4 textpooler (~50–70 strängar) levereras separat. Code lämnar varianter-arrayer tomma med kommentar `// Opus levererar` — INTE skriva egna placeholders. Om komponenter kraschar utan text, godkänt initialt — Opus levererar inom 24h.

---

## 7 · Acceptanskriterier

- [ ] `club-memory.css` finns, inga inline-styles kvar i clubmemory-komponenter
- [ ] Inga hex-värden i CSS (alla via `var(--*)`)
- [ ] `MemoryEvent.outcome` populerat för alla fixture-events
- [ ] severityClass-mapping enligt tabell, verifierad i tester
- [ ] Era-band renderas över historiska säsonger (när era !== 'unknown')
- [ ] `featured`-klass på `significance >= 90`
- [ ] `findActiveAnniversaries` returnerar rätt resultat per acceptanskriterium ovan
- [ ] `activeAnniversaries` populeras vid advance, sees-state respekteras
- [ ] PortalAnniversaryMark visas vid big eko, dismissas vid klick
- [ ] Anniversary-kafferum + klack-banderol triggas vid medium/big eko
- [ ] Memory-row-eko-markör på matchande rader
- [ ] ElimAnslag har högre prio än PortalAnniversaryMark vid simultan trigger
- [ ] Pre-migration saves laddar utan crash (alla nya fält optional)
- [ ] Inga textpools skrivna av Code — alla utelämnade för Opus
- [ ] Alla 907+ tester gröna efter PR

---

## 8 · Inte i denna spec

- **§G score-block + formkurva** — backlog-rad C-SY2, väntar score-system-spec från Design lördag
- **Mekanisk anniversary-effekt** (moral-/CS-deltas) — v2 om värt vid playtest
- **Manager-karaktären** — Design-Claude TIER 1.3, separat spec senare
- **Skade-narrativet** — Design-Claude TIER 1.5, separat spec senare

---

## 9 · Ändringslogg

| Datum | Ändring |
|---|---|
| 2026-05-20 | Spec skapad efter Design-Claudes handoff + Opus PRE-SPEC CROSS-CHECK. Q1-Q5 besvarade. Tekniska justeringar mot Design's förslag: `outcome`-fält istället för text-includes; `seasonStartSnapshot.era` istället för parallellt era-system. |

---

— Opus, 2026-05-20
