#!/bin/bash
# Arkivera alla avslutade specar till docs/archive/completed-april/
# Kör från projektets rot: bash docs/archive_old_specs.sh

DEST="docs/archive/completed-april"
mkdir -p "$DEST"

# Alla FIXSPEC-filer
mv docs/FIXSPEC_*.md "$DEST/" 2>/dev/null
mv docs/FIXSPEC-*.md "$DEST/" 2>/dev/null

# Alla SPRINT-filer
mv docs/SPRINT_*.md "$DEST/" 2>/dev/null

# Alla SPEC-filer (utom SPEC_KLUBBUTVECKLING som är vision)
for f in docs/SPEC*.md; do
  base=$(basename "$f")
  if [ "$base" != "SPEC_KLUBBUTVECKLING.md" ]; then
    mv "$f" "$DEST/" 2>/dev/null
  fi
done

# Avslutade specar med specifika namn
for f in \
  ARCHITECTURE_REVIEW.md \
  ARKITEKTURSPEC_FILSPLIT.md \
  BRIEF_KLUBBRAPPORTER.md \
  BRIEF_KLUBBRAPPORTER_FIX.md \
  BRIEF_KLUBBRAPPORTER_SPELARNAMN.md \
  BRIEF_NEXT_CHAT.md \
  BUGFIX_SPRINT3.md \
  CODE_FILSPLIT_PROMPT.md \
  CODE_REVIEW_NOTES.md \
  CODE_SPRINT2.md \
  CODE_SPRINT_PLAYTEST2.md \
  CRITICAL_FEATURES.md \
  DESIGN_BUGG_SPRINT.md \
  DESIGN_POLISH_R2.md \
  DESIGN_POLISH_SPRINT.md \
  ERIK_FEEDBACK.md \
  ERIK_PLAYTEST_2.md \
  ERIK_TEXT_CHANGES.md \
  FEATURE_BOARD_OBJECTIVES.md \
  FEATURE_MATCHVY_DESIGN.md \
  FEATURE_ORTENS_MAKTSPEL.md \
  FINAL_REFACTOR.md \
  FINAL_REVIEW.md \
  FIX_HEADER.md \
  FIX_LINEUP_DISPLAY.md \
  FORENING_FIX_LIST.md \
  FORSTARKNINGSSPEC_V3.md \
  FULL_REVIEW.md \
  INDEXEDDB_SCHEDULE_SPEC.md \
  INTRO_GRAFIK.md \
  MASTERPLAN-sprint-apr6.md \
  MASTERSPEC_NEXT_PHASE.md \
  MATCHVY_DESIGN_SPRINT.md \
  MOCKUP_IMPLEMENTATION_GUIDE.md \
  NEW_FEATURES.md \
  PLAYTEST_BUGGAR_KVÄLL.md \
  PLAYTEST_RAPPORT_20260406.md \
  PLAYTEST_STOR_RUNDA.md \
  RAPPORT_SESSION_14APR.md \
  RESTLISTA.md \
  SQUAD_OVERHAUL.md \
  TODO_REMAINING.md \
  UI_OVERHAUL_LIGHT_THEME.md \
  VERIFIERAD_RESTLISTA.md \
  bandy_manager_SPEC.md \
  bandy_manager_feature_roadmap.md \
  season_analysis.md \
  trainerArcService_patch.ts
do
  [ -f "docs/$f" ] && mv "docs/$f" "$DEST/"
done

echo "Arkiverat. Kvar i docs/:"
ls docs/*.md 2>/dev/null
