# Sprint 22.7 — Diagnostikrapport BUG-STRESS-02 (squad-depletion)

**Körning:** `STRESS_DEBUG=true npm run stress -- --seeds=3 --seasons=5`  
**Datum:** 2026-04-20

---

## Raw data — managed club per fas och säsong

### Seed 1 — Forsbacka (MANAGED), kraschar säsong 3

| Säsong | Fas | Spelare | GK | DEF | MID | FWD |
|--------|-----|---------|----|----|-----|-----|
| 1 | AFTER_YOUTH | 20 | 2 | 4 | 8 | 6 |
| 1 | AFTER_RETIRE | 20 | 2 | 4 | 8 | 6 |
| 1 | AFTER_CONTRACT_EXPIRY | 20 | 2 | 4 | 8 | 6 |
| 1 | AFTER_LICENSE | 20 | 2 | 4 | 8 | 6 |
| 1 | AFTER_AI_TRANSFERS | 20 | 2 | 4 | 8 | 6 |
| 1 | AFTER_REPLENISH | 20 | 2 | 4 | 8 | 6 |
| 2 | AFTER_YOUTH | 24 | 2 | 6 | 9 | 7 |
| 2 | AFTER_RETIRE | 24 | 2 | 6 | 9 | 7 |
| **2** | **AFTER_CONTRACT_EXPIRY** | **19** | **2** | **5** | **7** | **5** |
| 2 | AFTER_LICENSE | 19 | 2 | 5 | 7 | 5 |
| 2 | AFTER_AI_TRANSFERS | 19 | 2 | 5 | 7 | 5 |
| 2 | AFTER_REPLENISH | 19 | 2 | 5 | 7 | 5 |
| 3 | AFTER_YOUTH | 23 | 5 | 5 | 8 | 5 |
| 3 | AFTER_RETIRE | 23 | 5 | 5 | 8 | 5 |
| **3** | **AFTER_CONTRACT_EXPIRY** | **14** | **5** | **4** | **4** | **1** ← KRASCH |
| 3 | AFTER_LICENSE | 14 | 5 | 4 | 4 | 1 |
| 3 | AFTER_AI_TRANSFERS | 14 | 5 | 4 | 4 | 1 |
| 3 | AFTER_REPLENISH | 14 | 5 | 4 | 4 | 1 |

### Seed 2 — Söderfors (MANAGED), kraschar säsong 2 (AI-klubb Lesjöfors)

| Säsong | Fas | Spelare | GK | DEF | MID | FWD |
|--------|-----|---------|----|----|-----|-----|
| 1 | AFTER_CONTRACT_EXPIRY | 19 | 2 | 4 | 9 | 4 |
| 1 | AFTER_REPLENISH | 19 | 2 | 4 | 9 | 4 |
| 2 | AFTER_CONTRACT_EXPIRY | 18 | 3 | 3 | 8 | 4 |
| 2 | AFTER_REPLENISH | 18 | 3 | 3 | 8 | 4 |

*Krasch orsakas av Lesjöfors (AI-klubb) — managed clubs composition är inte problemet för seed 2.*

### Seed 3 — Västanfors (MANAGED), kraschar säsong 3

| Säsong | Fas | Spelare | GK | DEF | MID | FWD |
|--------|-----|---------|----|----|-----|-----|
| 1 | AFTER_CONTRACT_EXPIRY | 19 | 2 | 5 | 9 | 3 |
| 1 | AFTER_REPLENISH | 19 | 2 | 5 | 9 | 3 |
| 2 | AFTER_CONTRACT_EXPIRY | 17 | 1 | 5 | 7 | 4 |
| 2 | AFTER_REPLENISH | 17 | 1 | 5 | 7 | 4 |
| 3 | AFTER_CONTRACT_EXPIRY | 15 | 1 | 3 | 7 | 4 |
| 3 | AFTER_REPLENISH | 15 | 1 | 3 | 7 | 4 |

---

## Rotorsaksanalys

### Bug A: Managed club skippas explicit i replenishment (PRIMÄR)

`seasonEndProcessor.ts`, replenishment-loopen:

```typescript
const replenishedClubs = clubsAfterLicense.map(club => {
  if (club.id === game.managedClubId) return club  // ← managed club aldrig replenishad
  const squadSize = club.squadPlayerIds.length
  if (squadSize >= 20) return club
  // ... generera spelare ...
})
```

**Konsekvens:** Varje säsong tappar managed club spelare via kontraktsutgång utan att någon kompensation läggs in. Squad krymper säsong för säsong. Data bekräftar: alla faser från AFTER_AI_TRANSFERS till AFTER_REPLENISH är identiska för managed club — replenishment-steget gör ingenting för dem.

**Varför skippar koden managed club?** Sannolikt designval: spelaren ska sköta sina egna transfers/kontraktssigneringar via UI. Men konsekvensen är att om spelaren inte aktivt signerar ersättare urholkas truppen.

### Bug B: Position-cycling garanterar inte minimum forwards (SEKUNDÄR, AI-klubbar)

`replenishPositions`:
```typescript
const replenishPositions = [
  PlayerPosition.Goalkeeper,
  PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender,
  PlayerPosition.Midfielder, PlayerPosition.Midfielder,
  PlayerPosition.Forward, PlayerPosition.Forward,
]
```

Positionen väljs via `i % replenishPositions.length`. Om ett lag behöver exakt 5 spelare (för att nå 20) får det positionerna [0..4] = GK, DEF, DEF, DEF, MID — ingen FWD tillagd. Om laget redan hade 0 FWD kvarstår det vid 0 FWD efter replenishment.

**Konsekvens:** Seed 2 kraschar på Lesjöfors (AI-klubb) trots replenishment — positional gap fylldes inte.

### Bidragande faktor: Kontraktsexplosion

Många spelare i originaltruppen genererades med liknande kontraktslängder (2-3 säsonger från säsong 2026). Det skapar en "expiry wave" vid säsong 2-3 där 5-9 spelare lämnar simultant. Kombinerat med Bug A = omedelbar kollaps.

---

## Nettodelta per säsong (managed club, seed 1)

| Fas-transition | Förändring | Förlorade FWD |
|---|---|---|
| AFTER_RETIRE → AFTER_CONTRACT_EXPIRY (säsong 2) | −5 spelare | −2 FWD |
| AFTER_CONTRACT_EXPIRY → AFTER_REPLENISH (säsong 2) | **±0** | **±0** |
| AFTER_RETIRE → AFTER_CONTRACT_EXPIRY (säsong 3) | −9 spelare | −4 FWD |
| AFTER_CONTRACT_EXPIRY → AFTER_REPLENISH (säsong 3) | **±0** | **±0** |

**Replenishment bidrar alltid exakt 0 spelare till managed club.**

---

## Frågor till Opus för fix-spec

1. **Bug A (managed club):** Ska replenishment köras för managed club om squad < 14? Eller ska en annan mekanism triggas (t.ex. "fri agent"-pool som spelaren kan signa)? Spelupplevelsen skiljer sig beroende på val.

2. **Bug B (AI-klubbar):** Ska `replenishPositions` ersättas med en position-garanterande logik (t.ex. "fyll alltid upp till minimum 2 FWD/GK/DEF")? Eller räcker det att cykla fler varv och prioritera saknade positioner?

3. **Kontraktsexplosion:** Är detta ett symptom värt att adressera separat (sprida kontraktslängder), eller accepteras det som naturlig spelmekanik?

---

## PAUSA — VÄNTAR PÅ FIX-SPEC

Fix implementeras inte i detta steg. Diagnosen är komplett.
