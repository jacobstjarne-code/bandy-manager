---
name: Delegera implementationspass till Agent-verktyget
description: Bandy-brain pass-arbete (och liknande avgränsade spec-styrda uppgifter) ska delegeras via Agent, inte köras direkt i huvudkontexten
type: feedback
---

Avgränsade uppgifter med en tydlig spec-fil ska delegeras via Agent-verktyget med en kort prompt som pekar på specen. Exempel:

> "Bandy-Brain pass 3 — bygg validatorn enligt PASS_3_INSTRUCTION.md i docs/findings/."

Code läser specen, levererar, returnerar. Sedan läser du AUDIT-rapporten och avgör nästa steg.

**Why:** Håller huvudkontexten ren. Arbetar enligt etablerat spec-flöde. Undviker att Sonnet tar beslut som Opus borde ta (t.ex. välja invariant-implementationsansats utan att läsa spec).

**How to apply:** När det finns en *_INSTRUCTION.md-fil och uppgiften är implementation (bygg, migrera, validera) — skicka till Agent med spec-referensen som prompt.
