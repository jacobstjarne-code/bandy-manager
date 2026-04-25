# Sprint 25g — Audit

**Datum:** 2026-04-25  
**Scope:** Matchens karaktärer — domare + matchskador

---

## Status: LEVERERAD (förimplementerad)

Vid sessionstart 2026-04-25 verifierades att Sprint 25g var **fullständigt implementerad** innan sprinten formellt kördes. Ingen kod behövde skrivas.

---

## Punkter i spec

### Del 1 — Domare
- [x] `refereeService.ts` — 144 rader. `generateReferees()`, `pickRefereeForMatch()`, `updateRefereeRelation()`, `shouldTriggerRefereeMeeting()`, `getRefereeDisplayName()`
- [x] `refereeData.ts` — 109 rader. 8 namngivna domare: Ove Hansson, Tommy Bäckström, m.fl. Mix av veteran/rookie, strict/lenient/inconsistent. Fältdata inkl. town, style, personalityNote.
- [x] Vägd selektion implementerad i `pickRefereeForMatch()` — undviker samma domare i rad
- [x] `shouldTriggerRefereeMeeting()` — trigger på 3+ utvisningar ELLER straffmål + strict/inconsistent-stil
- [x] Relations-tracking via `game.refereeRelations` — påverkar framtida möten
- [x] `REFEREE_OPENING_COMMENTARY` + `REFEREE_MEETING_QUOTES` per stil — kurerade textsträngar
- [x] Domarmöte-scen renderas i `GranskaScreen.tsx`

### Del 2 — Matchskador
- [x] `matchInjuryService.ts` — 189 rader
- [x] 6 skadetyp-arketyper: skenan/fall_på_is/krock_målstolpe/boll_i_ansiktet/muskel/hjärnskakning
- [x] Frekvenser 1/500 till 1/25 per arketyp
- [x] Multiplikatorer: väder, derby, morale, taktik
- [x] Junior-skyddsregel implementerad (`playerAge < 18` → exkluderar boll_i_ansiktet)
- [x] `checkForMatchInjury()` + `applyMatchInjury()` + `generateInjuryInboxItem()`
- [x] Kommentarspoolar per skadetyp
- [x] `SubstitutionModal` i `MatchLiveScreen.tsx` öppnas vid allvarlig skada (>1 omgångs frånvaro)

---

## Observerat i UI

Tjänstefilerna existerar och är importerade. `GranskaScreen.tsx` renderar domarmöte-sektionen. `MatchLiveScreen.tsx` öppnar `SubstitutionModal` vid matchskada. `SaveGame`-entiteten har `refereeRelations`-fält.

---

## Ej levererat

Ingenting — all specad funktionalitet var på plats.

---

## Nya lärdomar till LESSONS.md

Inget nytt mönster. KVAR.md visade sprinten som "SPEC KLAR, REDO ATT IMPLEMENTERAS" — den var redan implementerad. Stale statusrader i KVAR.md bör inte förlitas på utan kodsökning vid sessionstart.
