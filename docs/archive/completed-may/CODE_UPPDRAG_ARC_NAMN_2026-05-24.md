# CODE-UPPDRAG — Arc-kort visar "?" istället för spelarnamn 2026-05-24

**Av:** Opus. **Surface:** kategori D (komponent + ev. arc-generering). **Funnen i:**
Jacobs playtest omg 4 — "I BLICKFÅNGET: ? — efter utvisningen". Glyfen "A" är korrekt
(arc-glyf A/B/C per index, medvetet). Problemet är titeln: "?" istället för spelarnamn.

## Rotorsak
`ActiveArcsSecondary.tsx` anropar `getArcHeadline(arc, undefined)` — andra argumentet
(`player?: ArcPlayer`) skickas aldrig. `getArcHeadline` faller då tillbaka på
`arc.subject ?? '?'`. Att "?" visas betyder att BÅDE player-argumentet OCH `arc.subject`
saknas. Komponenten HAR `arc.playerId` (den används redan i onClick) men slår aldrig
upp spelaren.

## Fix 1 (löser skärmen) — skicka spelaren till getArcHeadline
I `ActiveArcsSecondary.tsx`, i `ArcRow` / där `getArcHeadline(arc, undefined)` anropas:
slå upp spelaren ur `game.players` på `arc.playerId` och skicka in den.

- `ArcRow` behöver tillgång till spelaren. Enklast: gör uppslaget i `ActiveArcsSecondary`
  (som har `game`) och skicka `player` som prop till `ArcRow`, ELLER skicka `game` till
  `ArcRow`. Välj det som passar befintlig propstruktur.
- `getArcHeadline` vill ha `{ firstName, lastName }` (typ `ArcPlayer`). `game.players`-
  posten har de fälten.
- Kod (i ActiveArcsSecondary, där arcs mappas):
  ```ts
  const player = arc.playerId
    ? game.players.find(p => p.id === arc.playerId)
    : undefined
  // skicka player till ArcRow, och i ArcRow:
  <div className="arc-headline">{getArcHeadline(arc, player)}</div>
  ```
- Resultat: "A. Nilsson — efter utvisningen" i stället för "? — efter utvisningen".

## Fix 2 (skydd mot kantfall, lägre prio) — sätt arc.subject vid generering
Även med Fix 1 kan "?" återkomma om `arc.playerId` pekar på en spelare som inte längre
finns i `game.players` (såld/pensionerad). Säkerställ att `arc.subject` sätts till
spelarens namn när arcen SKAPAS (i `arcService.ts` / `detectArcTriggers`), så fallbacken
i `getArcHeadline` (`arc.subject ?? '?'`) ger ett namn, inte "?".
- Verifiera var ActiveArc skapas och sätt `subject: \`${firstName[0]}. ${lastName}\``
  (eller motsv. format) vid skapandet.
- Om subject redan sätts någonstans men inte når detta kort: spåra varför det är tomt.

## Verifiering
1. Trigga en arc (t.ex. joker_redemption efter utvisning, eller hungrig_breakthrough).
   Kortet visar spelarens namn, inte "?". Skärmdump.
2. `hungrig_breakthrough`: verifiera att även `${games} matcher utan mål` fylls
   (data.gamesWithoutGoal) — annars blir det "N. Namn — ? matcher utan mål".
3. Kantfall: om en arc-spelare säljs mitt i arcen, visas fortfarande ett namn (via subject),
   inte "?".

## Vad som INTE ändras
Glyfen (A/B/C), fas-dots, "Akt 1 · N omg kvar"-raden — allt korrekt. Bara namnupp-
slaget i titeln.

— Opus, 2026-05-24
