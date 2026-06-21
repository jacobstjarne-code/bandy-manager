# SPEC — KF4: Styrelse-konsolidering till en modell (2026-06-21)

**Ägare:** Code (implementation). Opus har skrivit specen, beslutet är loggat i `docs/DECISIONS.md` 2026-06-21.
**Varför Code, inte Opus-direkt:** berör ~6 filer, kräver save-migration av befintliga spel + stress-test-loop för att verifiera att inga objektiv/scen-flöden bryts. Iteration-tungt.

---

## INNAN DU BÖRJAR — läs dessa, i ordning

1. `docs/DECISIONS.md` → posten **2026-06-21 — Styrelsen konsolideras till en modell (KF4)** (beslut + alternativ).
2. Den här specens **Bakgrund** nedan.
3. Filerna i **Berörda ställen** — läs varje läs/skriv-ställe i sin kontext innan du rör något.

Ingen mock behövs — detta är en datamodell-refaktor utan ny visuell yta. ArrivalScene och boardMeetingScene ändrar *datakälla*, inte layout. Pixel-jämförelse krävs ändå på de två scenerna efteråt (de renderar styrelsenamn, och hela poängen är att namnet nu är konsekvent).

---

## Bakgrund — rotorsaken

Styrelsen beskrivs idag på två oberoende ställen som aldrig länkas:

**A. `club.board: ClubBoard`** (`src/domain/entities/Club.ts`)
- `ClubBoard = { chairman, treasurer, member }`, var och en `BoardMember = { firstName, lastName, age, gender }`.
- Skapas i `worldGenerator.ts:828` från `CLUB_TEMPLATES[].board` (handskrivna namn per klubb).
- Läses av ArrivalScene (säsong 1), boardMeetingScene (säsong 2+), och resolver-fallback.

**B. `game.boardPersonalities: BoardMember[]`** (`src/domain/entities/Community.ts`, fält i `SaveGame.ts:170`)
- `BoardMember = { name, role, personality }`, `role ∈ ordförande|kassör|ledamot`.
- Skapas i `createNewGame.ts:274` via `generateBoardMembers()` som slumpar från `BOARD_PROFILES` (`boardData.ts`) — **andra namn än templates**.
- Läses av resolver (chairmanName), objectives (`generateBoardObjectives`), eventResolver (lägger till ledamot).

**Tre defekter:**
1. **Dubbelnamn.** Ordföranden i ArrivalScene/boardMeetingScene (template-namn) ≠ ordföranden i resolver (boardPersonalities-namn, med `?? 'Margareta'`). Samma styrelse, två namn.
2. **Typnamnskollision.** `BoardMember` definieras i BÅDE Club.ts och Community.ts.
3. **Kön ⊥ personlighet.** Pronomen finns bara på A, personlighet bara på B, ingen `id` länkar dem, kardinaliteten divergerar (eventResolver:1019 lägger fjärde ledamot på B; A är fast trippel).

---

## Målmodell

EN array på game-nivå. Namn/kön/ålder från templates (handskrivna namn vinner), personlighet slumpas in vid skapande, roll från slot.

```ts
// src/domain/entities/Club.ts — ENDA BoardMember-definitionen
export type BoardRole = 'ordförande' | 'kassör' | 'ledamot'
export type BoardPersonality = 'supporter' | 'ekonom' | 'traditionalist' | 'modernist'

export interface BoardMember {
  id: string                  // stabil: `${role}-${index}` räcker, t.ex. 'ordforande-0'
  firstName: string
  lastName: string
  age: number
  gender: 'm' | 'f'           // pronomen i beats
  role: BoardRole
  personality: BoardPersonality
}
```

- `ClubBoard`-interfacet **utgår**. `club.board?: ClubBoard` på Club-entiteten **utgår**.
- `game.board?: BoardMember[]` ersätter `game.boardPersonalities`.
- `BoardRole` / `BoardPersonality` flyttas till Club.ts (eller behåll i Community.ts och importera — välj ett ställe, exportera därifrån). **`BoardMember` i Community.ts raderas.**

**Designval som redan är taget (rör inte):** template-namnen vinner. BOARD_PROFILES degraderas till en ren personlighetspool — dess namn slutar visas. Behåll BOARD_PROFILES som array men använd bara `personality` därifrån, ELLER inline:a personlighetslistan i generatorn och radera BOARD_PROFILES-namnen. Code väljer det minst invasiva; rapportera vilket.

---

## Berörda ställen — checklista (grep-verifierad 2026-06-21)

Bocka av varje. "Verifierat" = du har läst stället och bekräftat att det läser den nya modellen.

### Entiteter / typer
- [ ] `src/domain/entities/Club.ts:4-15` — ersätt `BoardMember`-trippelformen + `ClubBoard` med ny `BoardMember`. Ta bort `board?: ClubBoard` från `Club` (rad 61).
- [ ] `src/domain/entities/Community.ts:16-23` — **radera** `BoardMember`-interfacet här. Behåll/flytta `BoardPersonality`, `BoardRole` (avgör ett hem, exportera därifrån).
- [ ] `src/domain/entities/SaveGame.ts:31,36,170` — byt importerad/re-exporterad `BoardMember` till Club-varianten. Byt fält `boardPersonalities?: BoardMember[]` → `board?: BoardMember[]`.

### Skapande
- [ ] `src/domain/services/worldGenerator.ts:1,126,828` — `t.board` (ClubBoard) flödar inte längre till `club.board`. Behåll template-board-datan som *namnkälla* för createNewGame (se nedan), men `Club`-objektet får inte längre `board`. Avgör: läs template-board direkt i createNewGame istället. Rapportera hur du löser att createNewGame behöver managed-klubbens template-namn (worldGenerator returnerar klubbar utan board nu).
- [ ] `src/application/useCases/createNewGame.ts:17,119-154,274,335,363` — `generateBoardMembers` bygger nu `BoardMember[]` med fulla fält: namn/kön/ålder från managed-klubbens template-board (chairman→ordförande, treasurer→kassör, member→ledamot), personlighet slumpas (samma diversitets-logik som idag: kassör ≠ ordf personlighet, ledamot helst ny). Sätt `id`. Returnera till `game.board`. `generateBoardObjectives(...)`-anropet (rad 335) tar nu `game.board`.

### Läsning — scener
- [ ] `src/presentation/screens/ArrivalScene.tsx:8,21,70-71,192,202` — läs managed-styrelsen från `game.board.find(m => m.role === ...)` istället för `club.board.treasurer/.member`. `treasurer`/`member` blir find-by-role. Behåll all copy och layout. Hårdkodade fas-namn 'margareta'/'sture' (rad ~78-79): dessa är *narrativa* fasnamn, inte data — lämna, men verifiera att texten som visas drar rätt namn från `game.board`.
- [ ] `src/domain/data/scenes/boardMeetingScene.ts:10,32-35` — importera `BoardMember` från Club.ts (samma typ nu). `const { chairman, treasurer, member } = club.board` → find-by-role från `game.board`. `speaker?: BoardMember` funkar oförändrat. Body-texten `${chairman.firstName} ${chairman.lastName}` läser nu samma källa som resolver → **dubbelnamnet är borta**.
- [ ] `src/presentation/screens/scenes/BoardMeetingScene.tsx:96` — `data.chairmanName / data.chairmanRole` kommer från resolver (se nedan) — ingen ändring om resolvern fixas.

### Läsning — logik
- [ ] `src/application/services/boardMeetingStateResolver.ts:103-108` — ta bort dubbel-källan. `const chair = game.board?.find(m => m.role === 'ordförande')`. `chairmanName = chair ? \`${chair.firstName} ${chair.lastName}\` : '[fallback]'`. Ta bort `?? 'Margareta'`-strängen ELLER ersätt med en kommenterad sista-utväg (men efter migration ska game.board alltid finnas, så fallback ska vara död kod).
- [ ] `src/domain/services/boardObjectiveService.ts:186-196,...` — `boardMembers: BoardMember[]` är nu Club-varianten. `.role`/`.personality` finns kvar; objektiv-byggarna (`balanceBudget(kassör, ...)` m.fl.) som läser namn drar nu `firstName/lastName` — **kontrollera varje byggares namnformat** (`.name` finns inte längre; byt till `${m.firstName} ${m.lastName}`).
- [ ] `src/application/useCases/seasonEndProcessor.ts:910-911` — `game.boardPersonalities` → `game.board`.
- [ ] `src/domain/services/events/eventResolver.ts:1018-1023` — `spoksponsor accept` lägger till ledamot. Bygg full `BoardMember` (id, firstName/lastName från 'Okänd'/'Investerare' eller behåll 'Okänd Investerare' uppdelat, age default, gender default, role 'ledamot', personality 'modernist'). `boardPersonalities` → `board`.

### Migration
- [ ] `src/infrastructure/persistence/saveGameMigration.ts:43-52,126,287-290` — kärnan. Se migrationsplan nedan. Bumpa `CURRENT_SAVE_VERSION`.

### Dev/test
- [ ] `src/presentation/screens/dev/DevScenesScreen.tsx:427,450-452` — uppdatera mock-`boardPersonalities` → `board` med fulla fält.
- [ ] `src/domain/data/scenes/__tests__/boardMeetingScene.test.ts` — uppdatera fixtures till nya modellen.
- [ ] `src/domain/data/boardData.ts` — BOARD_PROFILES degraderas (se Designval ovan).

---

## Migrationsplan (saveGameMigration.ts)

Befintliga saves har `game.boardPersonalities` (namn/roll/personlighet, ev. extra ledamöter) OCH `club.board` på managed-klubben (namn/kön/ålder). Bygg `game.board` genom att **slå ihop dem per roll**, så att personlighet (som redan drivit objektiv) bevaras och namnet/könet (som spelaren sett i scener) bevaras:

```
För managed-klubben:
  1. Läs gammal club.board (chairman/treasurer/member) → namn, kön, ålder per roll.
  2. Läs gammal boardPersonalities → personlighet per roll (matcha på role).
  3. För varje roll: skapa BoardMember med template-namn/kön/ålder + boardPersonalities personlighet.
     - Ordförande: club.board.chairman + boardPersonalities.find(role==='ordförande').personality
     - Kassör:     club.board.treasurer + ...kassör.personality
     - Ledamot[0]: club.board.member + första ledamot-personlighet
  4. Extra ledamöter i boardPersonalities (eventResolver-tillägg, t.ex. 'Okänd Investerare'):
     lägg till som egna array-poster — namn = boardPersonalities.name uppdelat,
     kön/ålder = deterministisk default, personlighet bevaras.
  5. Sätt id på alla.
  6. Radera game.boardPersonalities och club.board.

Saknas club.board (gammal save före board fanns): seeda från CLUB_TEMPLATES via managedClubId.
Saknas boardPersonalities: defaulta personlighet deterministiskt (som defaultBoardPersonalities gör idag).
```

`defaultBoardPersonalities` (rad 43) byggs om till `defaultBoard(clubId): BoardMember[]` som seedar fulla fält från template + deterministisk personlighet.

**Regel (INGA FEATURE FLAGS):** migrerade saves ska ha `game.board` ifyllt och fungera direkt. Ingen toggle.

---

## Gate — verifiering

### Teknisk
- [ ] `npm run build && npm test` grönt.
- [ ] `grep -rn "boardPersonalities" src --include="*.ts" --include="*.tsx"` → **0 träffar** (utöver ev. migration-kommentar som förklarar bortmappningen).
- [ ] `grep -rn "ClubBoard\|club.board\|\.chairman\|\.treasurer" src` → 0 träffar i logik/scener (migrationen får referera gamla formen via `as` på `raw`).
- [ ] Bara EN `interface BoardMember` i hela `src` (Club.ts).

### Funktionell (kod-verifierad simulation, mall i CLAUDE.md)
- [ ] **Dubbelnamn borta:** dumpa `resolveBoardMeetingState(game).chairmanName` och `getBoardMeetingBeats(game)[0].body` för samma game — ordförandenamnet ska vara **identiskt**. Detta är hela poängen; visa output.
- [ ] **Migration av gammal save:** ladda en pre-migration-save (eller konstruera en med boardPersonalities + club.board med olika namn), kör migrate, dumpa `game.board` — verifiera att namn = template-namn, personlighet = bevarad, extra ledamot bevarad.
- [ ] **Objektiv-generering:** kör `generateBoardObjectives` mot nya `game.board`, dumpa ett objektiv som läser styrelsemedlemsnamn — verifiera `firstName lastName` renderas (inte `undefined`).
- [ ] **eventResolver spoksponsor accept:** trigga, dumpa `game.board` — fjärde ledamoten finns med full form.
- [ ] Edge: tom/saknad `boardPersonalities` i gammal save; managed-klubb utan `club.board`.

### Manuell playtest (perception-tunga scener — kod-simulation räcker INTE)
- [ ] ArrivalScene (ny manager, säsong 1): kassör + ledamot visar rätt namn/pronomen, layout oförändrad. Pixel-jämför mot nuläge.
- [ ] BoardMeetingScene (säsong 2+): ordförande/kassör/ledamot rätt namn, **samma ordförandenamn som i ev. resolver-summering**. Pixel-jämför.
- Markera `awaiting playtest-verification` i KVAR tills Jacob spelat.

---

## Self-audit (obligatoriskt, `docs/sprints/`)

Använd kod-verifierad simulation för logik/migration + manuell för de två scenerna. Rotorsak i commit:
```
refactor: KF4 styrelse-konsolidering — rot: två okopplade källor (club.board +
boardPersonalities) gav ordföranden två namn; en BoardMember[] på game.board
bär nu namn+kön+roll+personlighet, template-namn vinner
```
Refactor-disciplin: specen listar ~6 kärnfiler + migration + tester. Ändrar du fler — pausa, rapportera, fortsätt efter Jacobs ok.
