---
name: Push after each major update
description: Always git push after committing in the bandy-manager project
type: feedback
---

Always run `git push` after committing in the bandy-manager project.

**Why:** Render deploys from the remote — without pushing, the deployment falls behind local commits.

**How to apply:** After every `git commit` in this repo, immediately follow with `git push`.
