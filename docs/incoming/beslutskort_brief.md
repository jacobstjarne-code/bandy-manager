repo: jacobstjarne-code/bandy-manager
branch: main
path: docs/visual-review/ci-baselines-2026-09-06 + ci-baselines-runda2-2026-09-07

## Last sync
date: 2026-09-07T13:50:00Z
commit: 3cd208f7 (CI-run 34061448219, Runda 2 pixel-dömd; repo-HEAD 9bcba406)

### Updated in this project
- Runda 2 klar: pixel-dömde de 11 nya diffarna ur ci-baselines-runda2-2026-09-07/. Alla 65 = 45 acceptera / 18 Code-läsning / 2 timeout.
- Rotorsak för R2: abs.-säsongsetikett-ändringen böt säsongsHELTALET dev-scenerna renderar på → matar etikett ("2033/34"), seededPick-poolrad OCH scheduleGenerator-datum. Copy-deltat är reseed-bieffekt av förbefintliga Opus-pooler (boardMeetingCopy.ts/seasonSummaryElimText.ts, daterade 2026-05-31), inte ny text.
- R2-dom: acc = season-header, sm-victory, season-noplayoffs, season-share. Code-läsning = board-a/b/c + upptakt (bekräfta poolseeding seedad vs oseedad slump), portal (kortkomposition), primary-smfinal-vs-deadline + primary-event-vs-farewell (MÖJLIGA primärhierarki-regressioner — läs först).
- Min preliminära R2-lista hade fel 5 av 11 (career-break/season-a/b/c/journalist var INTE nya; portal/primary-*/sm-victory/upptakt var det). Rättat mot artefakten.
- Byggde Klubbparm-prompt.dc.html — tre former för förstagångs-erbjudandet av Klubbpärmen (1a dockad rad, 1b centrerad modal, 1c coachmark), grundade i ArrivalScene.tsx/TilltradeScreen.tsx/KlubbparmOverlay.tsx. Väntar på Jacobs pick.

## Screen map
| Skärm/leverabel | Byggd från |
|---|---|
| CI Baselinedom.dc.html | tests/visual/sceneRegistry.ts, tests/visual/baseline.visual.ts, tests/visual/routeSceneCoverage.ts, docs/visual-review/ci-baselines-2026-09-06/ (index.md + 52 before/after/diff-tripplar) |
| Klubbparm-prompt.dc.html | src/presentation/screens/ArrivalScene.tsx, src/presentation/screens/TilltradeScreen.tsx, src/presentation/components/KlubbparmOverlay.tsx, docs/CODE_INSTRUKTION_TILLTRADET_KLUBBPARMEN_2026-06-26.md |
| Notisinstallningar.dc.html | src/domain/attention/types.ts + narrativePushAdapter.ts + narrativePushCopyResolver.ts (AttentionCategory-nycklar), src/presentation/components/GameHeader.tsx (inställnings-dropdown), src/presentation/components/KlubbparmOverlay.tsx (overlay-skal) |
| Forbered-flode.dc.html | src/presentation/components/match-flow/MatchFlowFrame.tsx + styles/match-flow.css (RPS/subtab/stamp-chrome), match/LineupStep.tsx, match/PreMatchContext.tsx, tactic/FormationView.tsx, docs/DESIGN_UPPDRAG_FORMATCHVINJETT_2026-09-06.md |
| Beslutskort-brief.dc.html | docs/archive/completed-june/CODE_DECISION_CARD_KONSOLIDERING_2026-06-20.md, src/presentation/components/DecisionCard.tsx + DecisionChoices.tsx + EventOverlay.tsx, screens/scenes/shared/SceneChoiceButton.tsx, design-system/briefs/DESIGN-BRIEF-TAKTIKTAVLA-VIKTNING-2026-09-08.md, ci-baselines-runda2 primary-event-vs-farewell |
