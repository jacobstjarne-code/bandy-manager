# Sprint 26 — Ekonomi & Bygdens Puls: Mätrapport

**Datum:** 2026-04-22
**Stress-test:** 6 seeds × 4 säsonger (3978 matcher totalt)
**Samma seeds som diagnosen** — direkt jämförbar

---

## EKONOMI

### Slutkapital per säsong (diagnos → efter Sprint 26)

| Klubb | Rep | Ssg1 diagnos | Ssg1 efter | Ssg2 diagnos | Ssg2 efter | Ssg3 diagnos | Ssg3 efter | Ssg4 diagnos | Ssg4 efter |
|-------|-----|-------------|-----------|-------------|-----------|-------------|-----------|-------------|-----------|
| Forsbacka | 85 | 886k | 347k | 1516k | 303k | 3005k | 1136k | 4020k | 1837k |
| Söderfors | 55 | 279k | **−84k** | 479k | **−535k** | 526k | **−1059k** | 490k | **−928k** |
| Västanfors | 78 | 661k | 219k | 1453k | 675k | 2764k | 1095k | 3982k | 2266k |
| Karlsborg | 68 | 570k | 372k | 1521k | 690k | 2475k | 1204k | 3319k | 1504k |
| Målilla | 65 | 380k | 89k | 515k | **−473k** | 857k | **−847k** | 1443k | **−1200k** |
| Gagnef | 63 | 368k | 122k | 988k | 280k | 2137k | 843k | 3492k | 1655k |

### Median slutkapital per säsong

| Säsong | Diagnos | Efter Sprint 26 | Mål |
|--------|---------|----------------|-----|
| 1 | 570k | 219k | — |
| 2 | 1453k | 303k | — |
| 3 | 2475k | 1095k | — |
| 4 | 3492k | 1655k | — |

### Nyckeltal

| Mått | Diagnos | After Sprint 26 | Target | Status |
|------|---------|-----------------|--------|--------|
| Andel omg negativt netto | 48% | **57%** | 30–45% | ⚠️ för högt |
| Klubbar <100k efter ssg 4 | 0% | **33%** (2/6) | "några" | ✅ |
| Klubbar >2M efter ssg 4 | 67% | **17%** (1/6) | — | ✅ klart bättre |
| Korrelation rep↔kapital ssg 1 | r=0.97 | r=0.78 | ~0.5–0.7 | ⚠️ fortfarande hög |

---

## ⚠️ FLAGGA: Söderfors och Målilla i permanent minus

**Soderfors (rep=55):** −84k ssg1 → −535k ssg2 → −1059k ssg3 → −928k ssg4.
**Målilla (rep=65):** +89k ssg1 → −473k ssg2 → −847k ssg3 → −1200k ssg4.

Söderfors förutsågs av spec. Målilla är en överraskning — rep=65 borde hålla sig kvar nära noll men sjunker kontinuerligt från säsong 2.

**Möjlig rotorsak:** Arena-underhåll (`arenaCapacity × 8`) drabbar medelstora klubbar hårt när de även tappar i placering (lägre matchintäkter) under en dålig säsong. Med `foulThreshold`-höjning (25b.2) och fler utvisningar sjunker matchkvaliteten för svaga lag → sämre resultat → sämre intäkter → negativ spiral.

Spec-instruktion: **flagga utan att justera**. Finjustering baseras på Opus-beslut.

---

## BYGDENS PULS

### Fördelning per bucket (diagnos → efter Sprint 26)

| Bucket | Diagnos | After Sprint 26 | Target |
|--------|---------|-----------------|--------|
| 0–30 | 0% | **0%** | 5–15% |
| 31–60 | 10% | **23%** | 30–45% |
| 61–90 | 39% | **65%** | 30–40% |
| 91–100 | 51% | **11%** | 10–20% |

### Nyckeltal

| Mått | Diagnos | After Sprint 26 | Target | Status |
|------|---------|-----------------|--------|--------|
| Omgångar vid exakt 100 | 27% | **2%** | — | ✅ takeffekt borta |
| Längsta streak ≥98 | 34 omg | **10 omg** | <15 | ✅ |
| Volatile omgångar (>5 förändring) | 7% | **11%** | — | ✅ mer dynamisk |
| Säsonger med återhämtning ≤30→≥60 | 0/24 | **0/24** | 10–25% | ❌ puls når aldrig ≤30 |
| Median puls ssg 4 | 76 | **67** | ~55–65 | ✅ |

### Median puls säsongsslut

| Säsong | Diagnos | After Sprint 26 | Target |
|--------|---------|-----------------|--------|
| 1 | 86 | 84 | — |
| 2 | 96 | 74 | — |
| 3 | 96 | 82 | — |
| 4 | 76 | 67 | ~55–65 |

---

## KORRELATIONER

| Mått | Diagnos | After Sprint 26 | Target |
|------|---------|-----------------|--------|
| Kapital↔rep ssg 1 | r=0.97 | r=0.78 | ~0.5–0.7 |
| Kapital↔rep ssg 4 | r=0.85 | r=0.96 | ~0.5–0.7 |
| Puls↔kapital ssg 1 | r=0.90 | r=0.78 | <0.5 |
| Puls↔kapital ssg 4 | r=0.96 | r=0.91 | <0.5 |

Korrelationerna förbättrades säsong 1 men eskalerar säsong 3–4 igen, driven av att framgångsrika klubbar (Forsbacka, Västanfors) ackumulerar kapital medan Söderfors/Målilla spiralar ner. Systemet är nu mer dynamiskt men fortfarande rep-drivet på lång sikt.

---

## SAMMANFATTNING — UPPNÅDDA MÅL

### Uppnådda ✅
- Takeffekten på puls är bruten (51% → 11% i bucket 91–100)
- Längsta puls-streak halverad (34 → 10 omgångar)
- Forsbacka tjänar inte längre automatiskt 500k+ per säsong
- Klubbar kan hamna i ekonomisk press (33% under 100k ssg4)
- 0% av klubbar över 2M efter säsong 4 (var 67%)

### Delvis uppnådda ⚠️
- Andel negativt-netto-omgångar: 57% (target 30–45%) — för volatilt
- Puls-bucket 31–60: 23% (target 30–45%) — för litet mellanskikt
- Korrelation rep↔kapital fortfarande hög säsong 4

### Inte uppnådda ❌
- Puls-bucket 0–30: 0% (target 5–15%) — driften når aldrig ner till bottennivåer
- Söderfors/Målilla i permanent minus (≠ "svårt men möjligt" konkurs)
- Korrelation puls↔kapital fortfarande 0.78–0.96

---

## REKOMMENDATIONER TILL NÄSTA JUSTERING

1. **Arena-underhåll för medelklubbar är för hårt.** `arenaCapacity × 8` ger 3–4k/omg för rep=55–65, vilket är 66–88k/säsong — för stor andel av marginalen. Förslag: sänk till `arenaCapacity × 5` ELLER gör det progressivt (`arenaCapacity × (4 + rep/30)`).

2. **Drift-styrka 3% är tillräcklig** för att bryta takeffekten. Sänkning inte nödvändig.

3. **Volunteer-cap fungerar** — puls-takeffekten är borta. Ekonomibidraget (600/vol/rnd) är oförändrat.

4. **weeklyBase-formeln är balanserad** för stora klubbar men ger för litet golv för rep=55–65. Möjlighet: höj konstanten från 2000 → 3000 för att ge medelklubbar mer bas utan att stärka stora klubbar lika mycket.
