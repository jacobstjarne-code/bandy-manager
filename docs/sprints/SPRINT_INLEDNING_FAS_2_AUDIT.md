# SPEC_INLEDNING_FAS_2 — audit

## Punkter i spec

- [x] **Datamodell: Club-entiteten** — BoardMember/ClubBoard interfaces tillagda i `Club.ts`, board? och clubhouse? på Club. Verifierat via: TypeScript build ren.
- [x] **ClubTemplate utökas** — ClubTemplate i worldGenerator.ts har board: ClubBoard och clubhouse: string. Verifierat via: build ren, worldGenerator.test.ts 3 tester passerar.
- [x] **Alla 12 CLUB_TEMPLATES patchade** — Exakta värden från spec kopierade bokstavligen för alla 12 klubbar. Verifierat via: test `inflätar arenanamn och styrelsemedlemmar per klubb — Forsbacka` och `— Målilla` gröna.
- [x] **Migration** — saveGameMigration.ts: gamla saves utan board/clubhouse får värdena från matching template. BoardMeeting/PreSeason pendingScreen rensas. Verifierat via: test `lägger till board och clubhouse på saves som saknar dem` + `bevarar befintliga board-värden`.
- [x] **BoardMeetingScene data** — `src/domain/data/scenes/boardMeetingScene.ts` med getBoardMeetingBeats() + shouldTriggerBoardMeeting(). 4 beats exakt enligt spec.
- [x] **Trigger via sceneTriggerService** — board_meeting triggar säsong 1 / matchday 0 / inte shownScenes. Prioritet: efter SM-final, före sunday_training.
- [x] **BoardMeetingScene React-komponent** — `src/presentation/screens/scenes/BoardMeetingScene.tsx` byggt. Beat-navigation med autoAdvance (beat 0) + CTA-knappar (beats 1-3).
- [x] **SceneScreen hanterar board_meeting** — case tillagt i switch.
- [x] **BoardMeetingScreen.tsx raderad** — git rm bekräftat.
- [x] **PreSeasonScreen.tsx raderad** — git rm bekräftat.
- [x] **AppRouter rensad** — /game/board-meeting och /game/pre-season borttagna. BoardMeetingGuard borttagen. PENDING_SCREEN_ROUTES har inte BoardMeeting/PreSeason.
- [x] **BottomNav HIDDEN_PATHS rensad** — /game/board-meeting och /game/pre-season borttagna.
- [x] **createNewGame: pendingScreen = null** — BoardMeeting triggade via scensystem istället.
- [x] **Tester skrivna** — 15 tester i `src/domain/data/scenes/__tests__/boardMeetingScene.test.ts`. Alla gröna.

## Kod-verifiering

- 654/654 tester gröna
- Build ren (✓ built)
- Stresstest: ej kört (data-tung sprint, ingen match-motor-förändring)

## Edge-cases verifierade

- **Saknat board på klubb:** getBoardMeetingBeats returnerar [] — testat
- **Befintliga board-värden:** migration skriver inte över — testad
- **matchday > 0:** trigger returnerar false — testat
- **shownScenes innehåller board_meeting:** trigger returnerar false — testat
- **säsong 2+:** trigger returnerar false — testat

## Avvikelser från spec

1. **`game.club` vs `game.clubs.find(...)`** — Specen skriver `game.club` (singular) men SaveGame har `game.clubs` (array). getBoardMeetingBeats anpassad till rätt datamodell.
2. **`p.contract?.endSeason`** — Specen skriver detta men Player-entiteten har `p.contractUntilSeason` (platt fält). expiringContractsCount anpassad.
3. **`club.cash`** — Specen skriver detta men Club-entiteten har `club.finances`. formatTkr anropas med club.finances.
4. **board och clubhouse på Club är optional (`?`)** — Spec säger required, men för att inte kräva ändringar i alla mock-skapande tester i kodbasen är de optional. Migration garanterar att alla saves har dem. Nya spel via worldGenerator får dem direkt.

## Ej verifierat / antaganden

- Visuell verifiering (mörk bakgrund, beat-progression, Georgia-typsnitt) kräver playtest i webbläsare. Markeras "awaiting playtest-verification".
- Animationer/fade-in är inte implementerade — scenen funkar utan dem. Kan läggas till i Fas 3 om önskat.
