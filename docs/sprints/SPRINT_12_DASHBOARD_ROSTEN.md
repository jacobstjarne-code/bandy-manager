# SPRINT 12 — DASHBOARD + RÖST

**Berör ID:** VIS-001, VIS-002, VIS-005, WEAK-014  
**Kostnad:** ~1 session  
**Typ:** Städ + redigerande  
**Mockup:** `docs/mockups/sprint12_dashboard_prioriterad.html`

---

## SYFTE

Dashboard är 11+ kort som alla kämpar för uppmärksamhet. Emoji-bruset gör varje kort till ett rop. Texterna svajar mellan sportkommentar, ämbetsmannaton och vardaglig dialog. Segerns eko försvinner. Denna sprint skär bort för att det viktiga ska synas.

---

## ID 1: VIS-001 — Dashboard prioriteras per omgång

**Plats:** `DashboardScreen.tsx`

### Problem

11+ kort idag: välkomstkort/agenda, matchkort, dagbok, träning, karriär, tabell-senast-orten-ekonomi (2×2 grid), klack, trupp, cup/slutspel, akademi, bracket, CTA, kafferum, veckans beslut, peptalk.

### Princip: "Ett kort måste få dominera"

Per omgång: identifiera DET primära kortet. Låt det dominera. Degraderar resten.

### Dominans-logik

```typescript
function getPrimaryCard(game: SaveGame): DashboardPriority {
  // 1. Aktiv mecenat-intro eller kritisk event → 'event'
  if (hasPendingCriticalEvent(game)) return 'event'
  
  // 2. Veckans beslut finns → 'weekly_decision'
  if (game.pendingWeeklyDecision) return 'weekly_decision'
  
  // 3. Pre-match kritisk: ingen lineup satt → 'match'
  if (nextMatch && !game.lineupConfirmedThisRound) return 'match'
  
  // 4. Aktiv crisis arc (trainerArc === 'crisis') → 'arc'
  if (game.trainerArc?.current === 'crisis') return 'arc'
  
  // 5. Senast spelade match med drama (POTM + win + derby) → 'last_match_glory'
  if (lastMatchWasSpecial(game)) return 'last_match_glory'
  
  // Default: vanlig ordning
  return 'default'
}
```

### UI-effekt

Det primära kortet får:
- Större storlek (padding ökar 50%)
- Kanter (border 2px accent)
- Position: direkt under agenda, före matchkort
- Andra kort kollapsar till en-radiga sammanfattningar

```tsx
{primaryCard === 'weekly_decision' && (
  <PrimaryCard>
    <WeeklyDecisionExpanded decision={game.pendingWeeklyDecision!} />
  </PrimaryCard>
)}

// Nedprioriterad rendering:
<CollapsedKlackCard /> istället för expanderat klackkort
```

### Kollapsbara sekundärkort

Resten visas som en-radiga indikatorer:

```tsx
<CollapsedRow icon="📊" label="Tabell" value={`${standing.position}:a · ${standing.points}p`} onClick={...} />
<CollapsedRow icon="💰" label="Ekonomi" value={formatFinance(club.finances)} onClick={...} />
<CollapsedRow icon="🏘" label="Orten" value={`CS ${cs}`} onClick={...} />
```

### Kritiskt — inga bort

Allt ska fortfarande vara klickbart och reachable. Det är INTE rensning genom borttagning. Det är rensning genom prioritering.

---

## ID 2: VIS-002 — Emoji-disciplin

**Plats:** Hela `src/presentation/` — nytt designsystem-dokument

### Regel

**Emoji får användas där de fungerar som ikon (navigational/structural). Inte där de fungerar som betoning eller ljud.**

### OK

- Kort-rubrik som navigationsikon: `📊 Tabell`, `💰 Ekonomi`, `🏘 Orten`
- Matchevent-indikator: `⚽` för mål, `🟨` för kort (etablerad sport-konvention)
- Statusindikator: `⚠️` för varning

### INTE OK

- Som "förstärkning": `🔥 Stor seger!`, `💪 Bra jobbat`
- Som stämningsmarkör: `😊`, `😢`
- Som kommentar från systemet: `🎉 Grattis!`
- I kommentarflöde eller narrativ text
- I knapptexter: `Spela nu! ⚽` (har redan knapp, behöver ingen emoji)

### Förbjudna zoner

Emoji FÅR INTE förekomma i:
- Matchkommentar (`matchCommentary.ts`)
- Presskonferens-frågor eller -svar
- Dagboken/DailyBriefing-text
- Kafferumscitat
- Journalist-headlines
- Inbox-titel eller -body
- Tidningsrubrik (redan rätt)
- SeasonSummary-narrativ

### Scanna och städa

```bash
grep -rn "[🔥💪🎉😊😢⚡🎭🎩]" src/domain/data/ src/domain/services/
```

Ta bort alla träffar i nämnda services/data.

---

## ID 3: VIS-005 — Rösten enhetlig

**Plats:** Textfiler i `src/domain/data/` och `src/domain/services/`

### Princip

Bandy Manager är en svensk bruksort under en lång vinter. Texten ska vara:

**Nykter.** Inte dramatisk.  
**Konkret.** Inte abstrakt.  
**Gammal-svensk-rakt.** Inte reklam-svenska.  
**Vardagligt.** Inte högtidligt.

### Exempel på voice-skifte

| Nuvarande | Problem | Bättre |
|-----------|---------|--------|
| "Redo — spela omgång 14 →" | OK, vardagligt | Behåll |
| "Kontrollerad seger, 4–2. Laget tog täten." | Sportjournalistisk | "4–2. Laget höll skärpan hela vägen." |
| "Det pratas om er i hela kommunen. Är det press eller inspiration?" | Formellt, reklamlikt | "Hela bygden följer er. Är det en börda?" |
| "🔥 Stor seger!" | Reklamigt | "Stor seger." (utan emoji) |
| "Grattis till uppflyttningen!" | Insmickrande | "En uppflyttning. Sekretariatet bjuder på kaffe i morgon." |
| "Din klubb är i krisläge." | Dramatiskt | "Det har varit tre raka förluster. Det märks i korridorerna." |
| "Sponsorerna är missnöjda!" | Alarmistiskt | "Två sponsorer har bett om ett möte. Inte ilsket. Bara ett möte." |

### Röst-guide (ska läggas i DESIGN_SYSTEM.md)

```markdown
## TONE OF VOICE

### Grundhållning
Texten talar till spelaren som en äldre, erfaren sekreterare i en bandyförening gör:
rakt, utan smicker, utan drama. Rösten kan bära obehag. Den pekar på saker, 
inte åt dig.

### Tre regler

1. **Visa, beskriv inte.** "Tre sponsorer har bett om möte" hellre än "Sponsorerna är oroliga".
2. **Undvik intensifierare.** Inte "jättebra", "otroligt", "fantastiskt". Byt till tystnad eller konkretion.
3. **Använd nämning, inte klichéer.** Inte "klackens kärlek" utan "Tommy, Håkan och de andra som åker buss till alla bortaplanser".

### Förbjudna ord/fraser
- "Grattis!"  → ersätt med konsekvens: "Ekonomin lyfter med 40k."
- "Stor seger!" → "Seger. Och derby dessutom."
- "Krisläge!" → beskriv vad som syns: "Tre förluster i rad."
- "Spännande!" → ingen motsvarighet — ta bort
- Emoji i narrativ text → aldrig
```

### Revision

Gå igenom dessa filer och revidera texterna enligt guiden:

- `src/domain/data/matchCommentary.ts`
- `src/domain/data/seasonPhases.ts` (SEASON_MOOD)
- `src/domain/services/coffeeRoomService.ts`
- `src/domain/services/dailyBriefingService.ts`
- `src/domain/services/pepTalkService.ts`
- `src/domain/services/journalistService.ts`
- `src/domain/services/pressConferenceService.ts`
- `src/presentation/screens/*.tsx` — endast hårdkodade UI-strängar

Fokus på: **intensifierare, clichéer, emoji i text.**

---

## ID 4: WEAK-014 — Segrarens silence

**Plats:** Ny service `src/domain/services/postVictoryNarrativeService.ts`, integration i `roundProcessor.ts`

### Problem

5-0 derby-vinst i playoff → finalWhistleSummary + klack-citat. Sen inget. Segern ekrar inte.

### Fix: Eko i nästa omgång

När en match klassificeras som "special" (derby-vinst, playoff-vinst, comeback, stor-seger) → nästa omgång generera:

1. **Dagbokssträng** som referar segern
2. **Kafferum-citat** som nämner segern
3. **Ev. styrelsemeddelande** (bara vid playoff-vinst)

### Klassificering

```typescript
export function classifyVictory(fixture: Fixture, game: SaveGame): VictoryType | null {
  if (!isManagedWin(fixture, game.managedClubId)) return null
  
  const isDerby = getRivalry(fixture.homeClubId, fixture.awayClubId) !== null
  const isPlayoff = fixture.matchday > 22
  const scoreDiff = Math.abs(fixture.homeScore! - fixture.awayScore!)
  
  if (isPlayoff && isDerby) return 'playoff_derby_win'
  if (isPlayoff) return 'playoff_win'
  if (isDerby && scoreDiff >= 3) return 'big_derby_win'
  if (isDerby) return 'derby_win'
  if (scoreDiff >= 4) return 'blowout'
  
  return null
}
```

### Generera eko

```typescript
export function generateVictoryEcho(
  type: VictoryType,
  fixture: Fixture,
  opponentName: string,
): { diaryLine: string; coffeeLine: string; boardMessage?: string } {
  const score = `${fixture.homeScore}-${fixture.awayScore}`
  
  switch (type) {
    case 'playoff_derby_win':
      return {
        diaryLine: `Triumfen över ${opponentName} eker fortfarande i korridorerna. Ingen hade sovit ordentligt på tre dagar.`,
        coffeeLine: `Kioskvakten: "Jag sålde korv till fyra personer som grät. Dom bad inte om ursäkt."`,
        boardMessage: `Ordföranden: "Det är sånt här som gör att jag satt mig i den här stolen. Tack."`,
      }
    case 'playoff_win':
      return {
        diaryLine: `Slutspelsvinsten mot ${opponentName} satte sig. Klubben känns tyngre på ett gott sätt.`,
        coffeeLine: `Sekreteraren: "Det ringde tre gamla medlemmar i förmiddags. Ingen ville något. De bara ville prata."`,
      }
    case 'big_derby_win':
      return {
        diaryLine: `${score} mot ${opponentName} är redan en berättelse. Det kommer pratas om den i fem år.`,
        coffeeLine: `Materialaren: "Jag hittade fyra flaskor i sargarna. Två var tomma."`,
      }
    case 'derby_win':
      return {
        diaryLine: `Derbyvinsten sitter bra. Bygden kan andas en vecka till.`,
        coffeeLine: `Någon skrev "VI ÄGER ${opponentName.toUpperCase()}" på tavlan i omklädningsrummet. Ingen har tagit bort det.`,
      }
    case 'blowout':
      return {
        diaryLine: `${score} är en hård siffra. Det vet vi. Men det var en säsong vi behövde den.`,
        coffeeLine: `Ingen sa mycket efter match. Det var inte tystnaden efter förlust. Det var tystnaden efter en stor middag.`,
      }
  }
}
```

### Integration

I `roundProcessor.ts` efter en match är klar:

```typescript
const victoryType = classifyVictory(completedFixture, game)
if (victoryType) {
  const echo = generateVictoryEcho(victoryType, completedFixture, opponent.name)
  
  // Spara eko i game för nästa omgångs DailyBriefing + Kafferum
  game.pendingVictoryEcho = echo
  game.victoryEchoExpires = currentMatchday + 1
  
  // Ev. styrelsemeddelande
  if (echo.boardMessage) {
    game.inbox.push({
      id: `victory_board_${completedFixture.id}`,
      type: 'board',
      title: 'Efter vinsten',
      body: echo.boardMessage,
      date: game.currentDate,
      isRead: false,
    })
  }
}
```

### Rendering i DailyBriefing + Kafferum

```tsx
// DailyBriefing.tsx
{game.pendingVictoryEcho && (
  <p style={{ fontSize: 11, fontStyle: 'italic', lineHeight: 1.5 }}>
    {game.pendingVictoryEcho.diaryLine}
  </p>
)}
```

```tsx
// Kafferum (redan existerande)
// I coffeeRoomService — om game.pendingVictoryEcho finns: använd den istället för vanligt citat denna omgång
```

---

## ORDNING

1. VIS-002 emoji-disciplin (~2h, scan + städning)
2. VIS-005 rösten enhetlig (~3h, revidera flera text-filer)
3. WEAK-014 segrarens eko (~2h, ny service + integration)
4. VIS-001 dashboard-prioritet (~3h, refaktor av DashboardScreen)

**Verifiering:**
- VIS-002: `grep -rn "[🔥💪🎉]" src/domain/` ger 0 träffar
- VIS-005: Läsa igenom hårda fall av reklam-svenska — ska kännas dämpade
- WEAK-014: Vinn ett derby → nästa omgångs dagbok referar segern
- VIS-001: Omgång med kritiskt event → det kortet dominerar, andra kollapsar

## SLUTRAPPORT

```
VIS-001: ✅/⚠️/❌
VIS-002: ✅/⚠️/❌
VIS-005: ✅/⚠️/❌
WEAK-014: ✅/⚠️/❌
```
