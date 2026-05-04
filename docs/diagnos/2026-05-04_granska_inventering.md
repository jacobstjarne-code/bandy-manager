# Diagnos — Granska implementerings-inventering

**Datum:** 2026-05-04  
**Ref:** SPEC_GRANSKA_VERIFIERING_2026-05-04 Steg 1  
**Utförare:** Code  
**Inga kodändringar gjorda i detta steg.**

---

## Sammanfattning

SPEC_GRANSKA_OMARBETNING byggde rätt infrastruktur (granskaEventClassifier.ts, postMatchEventService.ts, ReaktionerKort-idén) men kopplade den aldrig till GranskaOversikt.tsx. Komponenten kör fortfarande den gamla rendering-logiken. Alla 6 problem från playtest kan spåras till detta.

---

## DIAGNOS A — Vad körs egentligen i Översikt?

**Renderingsordning i `GranskaOversikt.tsx` (aktuell kod):**

1. Resultat-hero ✅
2. Statistik ✅
3. **ALLA pendingEvents** — ingen klassificering, ingen cap (rader 142–179) ❌
4. `game.pendingPressConference` — dedikerat block (rader 182–213) ✅
5. `game.pendingRefereeMeeting` — dedikerat block (rader 215–247) ✅
6. Media — läser direkt från `game.inbox` (senaste `InboxItemType.MediaEvent`) (rader 249–273) ❌
7. Insändare — kallar `generateInsandare(game, fixture)` inline (rader 275–287) ❌
8. Nyckelmoment ✅
9. Motståndartränare — kallar `generatePostMatchOpponentQuote()` inline (rader 313–333) ❌

**Vad som saknas jämfört med SPEC_GRANSKA_OMARBETNING:**

| Specad funktion | Status |
|---|---|
| `classifyEventNature` används för att filtrera events | ❌ ALDRIG importerad i GranskaOversikt.tsx |
| `getCriticalEventsForGranska` + `.slice(0, 3)` cap | ❌ Inte implementerad |
| `ReaktionerKort` component | ❌ Finns inte som fil — sökning ger noll träffar |
| `getPlayerEventsForGranska` → Spelare-flik | ❌ Inte implementerad |
| `generateInsandare` migrerad till pendingEvents | ⚠️ Delvis — postMatchEventService genererar `fanLetter`-events OCH GranskaOversikt kallar fortfarande `generateInsandare()` direkt → dubblering |
| `generatePostMatchOpponentQuote` migrerad till pendingEvents | ⚠️ Delvis — postMatchEventService genererar `opponentQuote`-events OCH GranskaOversikt kallar fortfarande `generatePostMatchOpponentQuote()` direkt → dubblering |
| Media läses från pendingEvents (mediaReaction) | ❌ Läses fortfarande från `game.inbox` direkt |

**Scenario:** 3 + 4 kombinerat.

- **Scenario 3:** `ReaktionerKort` aldrig byggt, aldrig kopplat.
- **Scenario 4:** Migration av insändare/opponentQuote delvis genomförd (service finns) men GranskaOversikt.tsx aldrig uppdaterad att använda den.

---

## DIAGNOS B — Klassificeringen

`granskaEventClassifier.ts` finns och fungerar korrekt som funktion, men importeras i noll produktionsfiler (bara i test). Nedanstående klassificering är vad som *skulle* gälla om GranskaOversikt använde den.

**Events från playtest 2026-05-04 och deras klassificering:**

| Event (playtest-rubrik) | Trolig type | `classifyEventNature` → | `getEventPriority` →|
|---|---|---|---|
| Rekrytera funktionärer (1) | `communityEvent` eller liknande | `inbox-only` | `low` (default) |
| Presskonferens — Helena (2) | `pressConference` | `inbox-only`* | `high` |
| Kontraktsförfrågan — Mikko (3) | `contractRequest` | `inbox-only` | `normal` |
| Sara och tifon (4) | `supporterEvent` | `inbox-only` | `low` |
| Presskonferens — Helena (5) | `pressConference` | se dubbel-diagnos | — |
| Domarens locker room — Rögner (6) | `refereeMeeting` | `inbox-only` | `low` |

*Kommentar i granskaEventClassifier.ts rad 7 säger "pressConference is handled separately via game.pendingPressConference" — alltså avsiktligt exkluderad från CRITICAL_GRANSKA_TYPES.

**Problem med klassificeringen:**
- `contractRequest` borde vara `critical` (kräver beslut om spelarkontrakt med deadline). Saknas i CRITICAL_GRANSKA_TYPES.
- `pressConference` är korrekt att hantera separat, men GranskaOversikt renderar den via pendingEvents-loopen ändå (se Diagnos C).
- Ingen av de 6 visade events klassas som `critical` av klassificeraren, men ALLA visas i Översikt eftersom pendingEvents-loopen saknar filter.

---

## DIAGNOS C — Dubbel presskonferens — rotorsak funnen

`generatePressConference` anropas på **två ställen** i roundProcessor-flödet:

**Källkod 1 — `src/domain/services/events/postAdvanceEvents.ts` rad 42–48:**
```ts
// 0. Press conference after managed match
if (justCompletedFixture) {
  const pressEvent = generatePressConference(justCompletedFixture, game, rand)
  if (pressEvent && !alreadyQueued.has(pressEvent.id)) {
    events.push(pressEvent)  // → allNewEvents → game.pendingEvents
  }
}
```

**Källkod 2 — `src/application/useCases/processors/matchSimProcessor.ts` → `roundProcessor.ts` rad 1081:**
```ts
pendingPressConference: simResult.pressEvent ?? undefined,  // → game.pendingPressConference
```

Samma `generatePressConference` → samma event-ID, men hamnar i:
1. `game.pendingEvents` (via postAdvanceEvents → allNewEvents)  
2. `game.pendingPressConference` (via matchSimProcessor → simResult.pressEvent)

GranskaOversikt renderar BÅDA:
- pendingEvents-loopen (rader 142–179) visar event från punkt 1
- dedikerat presskonferens-block (rader 182–213) visar event från punkt 2

**Rotorsak:** pressConference-generering duplicerades när postAdvanceEvents.ts skapades. Avsikten (per kommentar i roundProcessor rad 694) var att pressConference ska gå till `pendingPressConference`, inte till `pendingEvents`.

**Fix:** Ta bort pressConference-genereringen från `postAdvanceEvents.ts` (punkt 1). Behåll bara flödet via matchSimProcessor → pendingPressConference.

---

## DIAGNOS D — Skottbild-stats

**"Säsongen (X matcher)" — vilka matcher räknas?**

`GranskaShotmap.tsx` rad 221–225:
```ts
const completedFixtures = game.fixtures.filter(f =>
  f.report != null &&
  (f.homeClubId === managedClubId || f.awayClubId === managedClubId) &&
  f.id !== fixture.id
)
```
Inkluderar ALL abslutade managed-club matcher: liga + cup + slutspel + allt annat. Ingen filtrering på `isCup` eller `isPlayoff`.

**"44% ▼" — jämförelse mot vad?**

Beräkning (rad 239–244):
```ts
{seasonConversion > (totalShots > 0 ? Math.round(scoredCount / totalShots * 100) : 0) ? ' ▼' : ' ▲'}
```
`seasonConversion` = `seasonGoals / seasonShots * 100` (mål per totala skott, säsongen)  
Jämförs mot: `scoredCount / totalShots * 100` (mål per totala skott, denna match)

Pilen visar om säsongsgenomsnittet är bättre (▲) eller sämre (▼) än denna matchs konvertering. Riktningen är logisk men **etiketten nämner inte vad jämförelsen är** → spelaren förstår inte vad pilen betyder.

**"konv." — inkonsekvent definition i tre sammanhang:**

| Kontext | Formel | Definition |
|---|---|---|
| "Den här matchen" (rad 216) | `scoredCount / onTargetCount` | mål per skott PÅ MÅL |
| "Säsongen" (rad 234) | `seasonGoals / seasonShots` | mål per TOTALA skott |
| "Motståndaren" (rad 251) | `oppGoals / oppOnTargetDisplay` | mål per skott på mål (= vår MV:s räddningseffektivitets-komplement) |

Tre olika mätvärden under etiketten "konv." — förvirrande och potentiellt missvisande.

**Rekommendation:** Opus avgör vilken presentation som är tydligast. Förslag: ta bort säsongskonverteringen (oklart värde för omgång 1) eller visa explicit "Snitt (liga, 3 matcher)". Byt "konv." till "konvertering" med tydlig nämnare.

---

## DIAGNOS E — Shotmap avvikelser mot mock

Mock: `docs/mockups/shotmap_mockup.html`  
Implementation: `GranskaShotmap.tsx` rader 101–183

**Konkreta avvikelser per element:**

| Element | Mock | Implementation | Diff |
|---|---|---|---|
| Målgård topp | `<path d="M 118 4 A 22 22 0 0 1 162 4">` halvcirkel | `<rect x={105} y={GT} width={70} height={20}>` rektangel | ❌ fel geometri |
| Straffområde topp | `<path d="M 65 4 A 75 75 0 0 1 215 4">` halvcirkel | `<rect x={80} y={GT} width={120} height={46}>` rektangel | ❌ fel geometri |
| Separator | `<rect x="0" y="100" width="280" height="30" fill="rgba(0,0,0,0.07)">` grå block | `<line ... strokeDasharray="3 3">` streckad linje | ❌ symptomfix 2026-05-04 |
| Riktning uppe | `↑ VI ANFALLER` vid y=119 (i separatorn) | `MOTSTÅNDARMÅL` vid y=14 (nära topp-mål) | ❌ |
| Riktning nere | `DE ANFALLER ↓` vid y=119 (i separatorn) | `VÅRT MÅL` vid y=H-4 (nära botten-mål) | ❌ |
| Målgård botten | `<path d="M 118 226 A 22 22 0 0 0 162 226">` halvcirkel | `<rect x={105} y={186} width={70} height={20}>` rektangel | ❌ fel geometri |
| Straffområde botten | `<path d="M 65 226 A 75 75 0 0 0 215 226">` halvcirkel | `<rect x={80} y={160} width={120} height={46}>` rektangel | ❌ fel geometri |
| viewBox höjd | `0 0 280 230` | `0 0 280 210` (H=210 → GB=206) | ❌ 20px kortare |

**Historik för symptomfix 2026-05-04 (Opus):**  
Den streckade linjen på rad 121 (`strokeDasharray="3 3"`) lades till idag som symptomfix. Den ersatte ingen grå rect — den streckade linjen är ett nytt element utöver originalet. Originalet hade ingen separator (eller möjligen en solid linje som togs bort). Oavsett: mocken har `<rect>` med grå bakgrund, inte streckad linje.

**Slutsats:** Hela shotmap-geometrin skiljer sig från mocken. SPEC_SHOTMAP_OMARBETNING levererade inte halvcirkel-paths — de rektangulära boxarna är originalkoden. Symptomfixens streckade linje + etikettflyttning är ny divergens ovanpå det.

**Fix:** Revert symptomfix. Implementera shotmap exakt enligt mock-HTML:
- Ersätt alla `<rect>` straffområde/målgård-paths med `<path d="M ... A ...">` halvcikel-paths
- Ersätt streckad linje med grå `<rect x="0" y="100" width="280" height="30" fill="rgba(0,0,0,0.07)">`
- Ersätt text-etiketter vid målen med riktningstexter vid separator (y=119)
- Uppdatera viewBox till `0 0 280 230` och GB=226

---

## Fix-rekommendation (till Opus)

**Prioritet 1 (dubbel presskonferens — Fix C):**  
Ta bort `pressConference`-genereringen från `postAdvanceEvents.ts` rad 42–48. Enkel radikalfix, 1 fil, låg risk. Presskonferens körs kvar via matchSimProcessor-flödet.

**Prioritet 2 (GranskaOversikt total-fix — Fix Scenario 3+4):**  
GranskaOversikt.tsx behöver skrivas om för att använda granskaEventClassifier.ts. Konkret:
1. Importera `getCriticalEventsForGranska`, `getPlayerEventsForGranska`, `getReactionEventsForGranska`
2. Visa bara `getCriticalEventsForGranska(pendingEvents).slice(0, 3)` i Översikt
3. Bygga `ReaktionerKort`-komponent (auto-resolvar fanLetter/opponentQuote/mediaReaction)
4. Ta bort inline `generateInsandare()` och `generatePostMatchOpponentQuote()` (ersätts av ReaktionerKort)
5. Sätta hänvisning till Spelare-flik om `getPlayerEventsForGranska(pendingEvents).length > 0`

**Prioritet 3 (shotmap — Fix E):**  
Revert symptomfix. Implementera SVG-geometri enligt mock bokstavligen.

**Prioritet 4 (knappstil — Fix B), stats-clarity (Fix D), saker-länk (Fix C):**  
Kan fixas i samma PR som Prioritet 2.

---

## INTE i scope för denna rapport

- EventCardInline-knappar på Portal (Fix B) — berörs av EventCardInline.tsx rad 129: `borderRadius` saknas. Noted men fix-spec finns i SPEC_GRANSKA_VERIFIERING.
- GranskaSpelare-fliken — denna diagnos berör bara GranskaOversikt.
- pressConferenceService interna — diagnosen visar duplikering i caller, inte i service.
