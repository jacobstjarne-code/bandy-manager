# Final Architecture Refactor

Do all of these in order. Run `npm run build` after each step. Commit each step separately.

## 1. Extract Ekonomi tab from ClubScreen.tsx
Create `src/presentation/components/club/EkonomiTab.tsx`.
Move everything inside `{activeTab === 'ekonomi' && (() => { ... })()}` to this new component.
Props: `{ club, game, seekSponsor, activateCommunity, navigate }`
The component manages its own `sponsorFeedback` and `communityMsg` state.
Import SectionCard, formatCurrency from existing locations.
Update ClubScreen to import and render `<EkonomiTab ... />`.

## 2. Extract Klubb tab from ClubScreen.tsx
Create `src/presentation/components/club/KlubbTab.tsx`.
Move everything inside `{activeTab === 'klubb' && ( ... )}` to this new component.
Props: `{ club, game, standing, navigate }`
Uses local InfoRow and FacilityRow (move these to KlubbTab or a shared file).
Import SectionCard, StatBar.

## 3. Extract Akademi tab from ClubScreen.tsx
Create `src/presentation/components/club/AkademiTab.tsx`.
Move everything inside `{activeTab === 'akademi' && (() => { ... })()}` to this new component.
Props: `{ club, game, upgradeAcademy, promoteYouthPlayer, assignMentor, removeMentor, loanOutPlayer, recallLoan }`
The component manages its own state (upgradeMsg, promotionMsg, mentorMsg, loanMsg, selectedMentorSeniorId, etc.).

## 4. Split gameStore.ts into action slices
Current: single 50KB file with all actions.
Target structure:
- `store/gameStore.ts` — core state type, create store, selectors (~10KB)
- `store/actions/matchActions.ts` — saveLiveMatchResult, applyPressChoice
- `store/actions/trainingActions.ts` — setTraining, startTrainingProject, cancelTrainingProject
- `store/actions/transferActions.ts` — startEvaluation, placeOutgoingBid, startTalentSearch, seekSponsor
- `store/actions/academyActions.ts` — upgradeAcademy, promoteYouthPlayer, assignMentor, removeMentor, loanOutPlayer, recallLoan
- `store/actions/gameFlowActions.ts` — advanceRound, clearBoardMeeting, clearPreSeason, etc.

Each action file exports functions that take `(get, set)` and return an object of actions.
Main store merges them: `create<GameState>()((set, get) => ({ ...state, ...matchActions(get, set), ...trainingActions(get, set), ... }))`

## 5. Separate matchStepByStep.ts commentary data
Create `src/domain/data/matchCommentary.ts` with all commentary string arrays/templates.
Keep `matchStepByStep.ts` as pure simulation logic that imports commentary from the data file.
Target: matchStepByStep.ts drops from 66KB to ~30KB, matchCommentary.ts ~35KB.

## 6. Merge BudgetScreen into Ekonomi tab
Move the content from `BudgetScreen.tsx` (Klubbkassa summary, Arena capacity, Transferbudget slider) into `EkonomiTab.tsx`.
Remove the "Budget & transferbudget →" button from EkonomiTab.
Remove the `/game/budget` route from AppRouter.tsx.
Update RoundSummaryScreen.tsx to navigate to `/game/club` with state `{ tab: 'ekonomi' }` instead of `/game/budget`.
Delete BudgetScreen.tsx.

## Verification after all steps
```bash
npm run build
# Should compile with 0 errors

# Check file sizes improved:
# ClubScreen.tsx should be < 15KB
# gameStore.ts should be < 15KB  
# matchStepByStep.ts should be < 35KB
```

Commit format: `Refactor: [description]`
Push after final step.
