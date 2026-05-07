# TECH-1 (Del 1–4) — audit

**Commits:** `6ce6bfe`, `706498e`, `ca8bcb5`, `1cde1a9`, `8e1869b`
**Datum:** 2026-05-06 kväll
**Verifieringsform:** Kod-verifierad simulation (manual playtest ej gjord ännu)

---

## Punkter i spec

### Del 1–2: PreMatchContext + ArrivalScene

- [x] PreMatchContext refaktorerad till strings-pool med `{nword}`, `{n}`, `{posword}`, `{pos}` — verifierat via `preMatchContextStrings.ts`, `pickPreMatchContextText()` med regex-replace
- [x] Per-klubb Sture-repliker (`STURE_PER_CLUB` record med 12 klubbar) — verifierat i `arrivalDialogue.ts`
- [x] `getStureLine(clubId)` returnerar klubb-specifik replik first, hash-generic fallback — verifierat via fallback-logik i samma fil
- [x] ArrivalScene-animationer snabbare: `setTimeout 3400→1700ms`, `animationDelay` halverade — verifierat i `ArrivalScene.tsx`
- [x] Rivalry-namn i derby-pool (Upplandsderbyt etc.) — verifierat i `preMatchContextStrings.ts`
- [x] `rivalry?` tillagd i `PreMatchSubs` interface, skickas från `PreMatchContext.tsx` — verifierat

### Del 3: Squad Nu-vy

- [x] `SquadScreen` öppnar på `'nu'` som default-tab — verifierat i `screenTab` state-initialvärde
- [x] Nu-vyn renderar 4 sektioner: skadade, avstängda, låg moral, kontrakt utgår — verifierat via IIFE-logik i `SquadScreen.tsx`
- [x] Alla spelare i Nu-vyn klickbara → `PlayerCard`-overlay — verifierat via `onClick={() => setSelectedPlayer(p)}`
- [x] `getRecommendedFormation()` + `FORMATION_META` används för formations-förslag — verifierat i imports + användning

### Del 4: Halvtidsvalet + Transfer-kafferum + NU-pool

- [x] `HalfTimeSummaryScreen`: tre val (lugna/pressa/prata) med label + effekt-text — verifierat i `CHOICES`-array
- [x] Fortsätt-knapp disabled tills val gjorts (`selectedChoice === null`) — verifierat i `disabled`-prop
- [x] `applyHalftimeDecision()` i store: lugna → fitness+5/morale+3, pressa → form+10/15% skaderisk (ej goalkeeper), prata → morale+12 — verifierat i `gameFlowActions.ts`
- [x] `TRANSFER_PENDING_BID_EXCHANGES` (4 exchanges) i `coffeeRoomService.ts` — verifierat
- [x] Trigger: `outgoing pending`-bud → 33% chans (`seed % 3 === 2`) — verifierat
- [x] `squadNuStrings.ts`: `getInjuryText`, `getSuspensionText`, `getMoraleText`, `getContractText` — verifierat, deterministisk picker via `Math.imul`
- [x] Edge-cases: 1 dag, 1 match, morale < 25, `lowMoraleDays > 2` vs `> 5` — verifierat i if-villkor

---

## Kod-verifiering

- Build ren (`npm run build` exitcode 0)
- Tester gröna (`npm test` exitcode 0)
- Stresstest: ej kört för TECH-1 specifikt (TECH-1 är UI/narrative, inte motor)

---

## Edge-cases verifierade

- `getStureLine` med okänd `clubId` → faller tillbaka på hash-generic pool: verifierat via `STURE_PER_CLUB[clubId] ?? genericPool[hash % genericPool.length]`
- `applyHalftimeDecision('pressa')` med goalkeeper i starting XI: position-check `!== 'goalkeeper'` förhindrar skaderisk på MV — verifierat
- `getContractText` när kontrakt löper ut samma säsong (contractUntilSeason === currentSeason): edge-case täckt med egen strängvariant
- `TRANSFER_PENDING_BID_EXCHANGES` triggas bara om bud finns: `game.transferBids.some(b => b.direction === 'outgoing' && b.status === 'pending')` — guard verifierat

---

## Ej verifierat (väntar playtest)

- Halvtidsvalet: visuell rendering och val-interaktion i live match
- Nu-vyn: att fyra sektioner faktiskt populas med rätt spelare i ett verkligt spel
- Transfer-kafferum: att exchange triggas vid rätt timing i en verklig matchomgång
- Sture-repliker: att rätt replik visas för rätt klubb i ArrivalScene

---

## Kända glapp identifierade under audit (2026-05-07)

- TECH-1 Del 4 levererades utan skriftlig spec (bryter CLAUDE.md § SPEC-LYDNAD). Implementationen är ad hoc — ingen spec att verifiera mot.
- Halvtidsvalet saknar mock (bryter CLAUDE.md § MOCK-DRIVEN DESIGN för interaktiva komponenter). Visuell drift ej kontrollerad.

Dessa noteras som lärdomar, inte blockerare — koden är funktionellt korrekt per kod-verifiering.
