# BANDY MANAGER — ÅTGÄRDSBANK

**Uppdaterad:** 17 april 2026 (efter Sprint 16 — KOMPLETT)  

---

## 📊 SLUTSTATUS

**✅ Klart: 90 av 92**

| Kategori | ✅ | Kvar |
|----------|---|------|
| Buggar (17) | 17/17 | — |
| Svaga punkter (22) | 22/22 | — |
| Död kod (3) | 3/3 | — |
| Narrativ (7) | 7/7 | — |
| Arkitektur (8) | 8/8 | — |
| Visuellt (9) | 9/9 | — |
| Utveckling (13) | 13/13 | — |
| Drömmar (17) | 15/17 | DREAM-008/009 post-beta |

**Kvar (2 st, medvetet parkerade):**
- DREAM-008 — Kollektiva Sverige leaderboard (kräver backend)
- DREAM-009 — Podden efter match (kräver TTS-integration)

---

Nu kör granskningen. Ge Code den mekaniska prompten:

```
Kör dessa kontroller och rapportera resultatet exakt, ingen tolkning:

1. npm run build && npm test
2. grep -rn "Math.random" src/ — lista alla träffar
3. grep -rn "TODO\|FIXME\|HACK\|XXX" src/ — lista alla
4. grep -rn "console.log\|console.error" src/domain/ — lista alla
5. grep -rn "any" src/domain/entities/ — lista alla untyped
6. grep -rn "as any" src/ | wc -l
7. grep -rn "dangerouslySetInnerHTML" src/ — lista alla
8. npx ts-node scripts/calibrate.ts — rapportera alla 5 targets
9. find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20
```

Skicka mig Sonnets output rakt av. Jag granskar resultatet + läser de 5 riskfilerna.
