# SPRINT INDEX — Vägen till public beta

**Uppdaterad:** 16 april 2026

14 sprintar. Varje är en session för Code. Efter sprint 14 → 2-3 dagars playtest → buggfix-sprint → public beta i snäv krets.

| # | Sprint | Kategori | Punkter | Mockup |
|---|--------|----------|---------|--------|
| 01 | Städning | Visuell hygien | 7 | nej |
| 02 | Kalibrering | Buggar | 3 | nej |
| 03 | Arc-systemet | System | 5 | nej |
| 04 | Ekonomi & transfer-narrativ | System + narrativ | 6 | nej |
| 05 | Presskonferens & journalist | Narrativ | 7 | ja |
| 06 | Klacken & orten | Narrativ | 5 | nej |
| 07 | Spelarliv | Narrativ | 8 | ja |
| 08 | Mecenat & klubb-ID | System + städning | 4 | nej |
| 09 | Världen (bortamatch, årsrytm) | Känsla | 6 | ja |
| 10 | Säsongsrytm (akademi, state, playoff) | Narrativ | 6 | ja |
| 11 | Taktik & matchrytm | System | 4 | ja |
| 12 | Dashboard & rösten | Visuell + text | 4 | ja |
| 13 | Arkitektur | Tekniskt | 11 | nej |
| 14 | Drömmar | Stora greppen | 7 | ja |

**Totalt:** 76 punkter i 14 sessioner.

---

## ARBETSSÄTT

Peka Code till sprintfilen. Standard-prompt:

> Kör Sprint N. Läs `docs/ATGARDSBANK.md` för ID-referenser. Läs `docs/sprints/SPRINT_NN_NAMN.md` för instruktioner. Implementera varje ID i ordning. För varje ID: gör ingreppet → verifiera enligt spec → rapportera `✅ / ⚠️ / ❌` på en rad. Efter alla ID: `npm run build && npm test`. Rapportera per ID plus sammanfattning.

Du markerar ✅ i ATGARDSBANK.md manuellt efter commit.

---

## EFTER SPRINT 14

1. **Playtest:** 2-3 dagar
2. **Buggfix-sprint:** Allt playtest hittar
3. **Public beta:** Erik + 5-10 vänner

---

## MOCKUPS

Ligger i `docs/mockups/sprint{NN}_{namn}.html`. Öppna i webbläsaren.
