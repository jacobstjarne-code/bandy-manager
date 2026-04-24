# Sprint 26b — Mätrapport

**Datum:** 2026-04-24
**Ändringar:** weeklyArenaCost ×8→×5, weeklyBase 2000→3000
**Stress-körning:** 10 seeds × 5 säsonger = 7328 matcher
**Build:** ✅ | **Stress:** 0 violations

---

## Kapital per seed, säsong för säsong

| Seed | Rep | Ssg1 | Ssg2 | Ssg3 | Ssg4 | Ssg5 |
|------|-----|------|------|------|------|------|
| forsbacka | r85 | +867k | +1186k | +2449k | +3386k | +4395k |
| soderfors | r55 | +157k | +106k | −101k | −394k | −727k |
| vastanfors | r78 | +393k | +793k | +1860k | +3141k | +4295k |
| karlsborg | r68 | +424k | +1167k | +1867k | +2581k | +3203k |
| malilla | r65 | +170k | −291k | −435k | −654k | −1022k |
| gagnef | r63 | +189k | +30k | +202k | +408k | +877k |
| halleforsnas | r60 | −142k | −751k | −1107k | −1376k | −1758k |
| lesjofors | r62 | +285k | +122k | −132k | −21k | −42k |
| rogle | r50 | +569k | +817k | +520k | +397k | +485k |
| slottsbron | r48 | +43k | −289k | −610k | −514k | −530k |

---

## Jämförelse mot Sprint 26-baseline och spec-targets

| Mått | Sprint 26 | Sprint 26b | Target | Status |
|------|-----------|------------|--------|--------|
| Söderfors ssg4 | −536k | **−394k** | runt −500k | ✅ (bättre än target) |
| Målilla ssg4 | −691k | **−654k** | runt −700k | ✅ (i range) |
| Forsbacka ssg4 | +2259k | **+3386k** | runt 2500k | ⚠️ >3M (flaggas) |
| Västanfors ssg4 | +2680k | **+3141k** | — | ⚠️ >3M (flaggas) |
| Andel negativt netto | 61% | **61%** | 30-45% lång sikt | samma |
| Puls-fördelning | oförändrat | oförändrat | — | ✅ |

---

## Effektanalys per ändring

### weeklyBase 2000 → 3000 (+1000/omg)
Alla klubbar får +1000/omg = +33k/säsong (33 omgångar inkl. träning).
Ren golv-höjning — proportionell för alla.

### weeklyArenaCost ×8 → ×5 (−37.5%)
Per omgång-besparing:
- Forsbacka (cap ~745): −2235/omg = −74k/ssg
- Målilla (cap ~605): −1815/omg = −60k/ssg
- Söderfors (cap ~535): −1605/omg = −53k/ssg

Kombinerat: **Söderfors +86k/ssg, Målilla +93k/ssg** jämfört med Sprint 26.

---

## Flaggningar

### ⚠️ Forsbacka/Västanfors >3M ssg4

Forsbacka 3386k och Västanfors 3141k vid ssg4 — båda över gränsen i spec.
Stora klubbar gynnas proportionellt mer av arena-besparingen (högre kapacitet).
Per spec: flaggas, men ingen ändring i denna sprint. Progressiv skatt eller
inkomstskalning för stora klubbar är Sprint 27-kandidat om det anses problematiskt.

### ℹ️ Hällefors fortfarande i kraftig spiral

Hällefors (r60): −142k → −751k → −1107k → −1376k ssg4. Utanför spec-scope
(spec fokuserar r55/r65) men mönstret är konsekvent. Möjlig djupare rotorsak:
rep 60 är i en zon där lönekostnad + fasta kostnader inte täcks av intäkter
trots ändringarna. Kräver separat analys om Hällefors är ett realistiskt
gameplay-scenario (lag som degraderas mot ekonomisk kollaps) eller ett motorfel.

---

## Slutsats

Sprint 26b-målen uppnådda. Söderfors och Målilla bromsar spiralen tydligt.
Negativ ekonomi kvarstår på lång sikt för svaga klubbar — per design.
Stora klubbar drar lite väl iväg (>3M ssg4) men är acceptabelt tills vidare.
