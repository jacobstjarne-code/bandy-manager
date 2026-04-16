#!/bin/bash
# Kör från projektrot: cd /Users/jacobstjarne/Desktop/code_projects/bandy-manager && bash docs/archive_cleanup.sh

DEST="docs/archive/completed-april"
mkdir -p "$DEST"

# Flytta alla utom de vi vill behålla
for f in docs/*.md; do
  base=$(basename "$f")
  case "$base" in
    STATUS.md|DESIGN_SYSTEM.md|THE_BOMB.md|SPEC_KLUBBUTVECKLING.md|GENOMGANG_OCH_VISION_20260406.md|ROADMAP.md|PLAYTEST_CHECKLISTA.md|CODE_NEXT_SESSION.md)
      echo "BEHÅLLER: $base"
      ;;
    *)
      mv "$f" "$DEST/" 2>/dev/null && echo "Arkiverade: $base"
      ;;
  esac
done

# Flytta lösa filer
[ -f "docs/trainerArcService_patch.ts" ] && mv "docs/trainerArcService_patch.ts" "$DEST/"
[ -f "docs/archive_old_specs.sh" ] && mv "docs/archive_old_specs.sh" "$DEST/"

echo ""
echo "=== KVAR I docs/ ==="
ls docs/*.md 2>/dev/null
