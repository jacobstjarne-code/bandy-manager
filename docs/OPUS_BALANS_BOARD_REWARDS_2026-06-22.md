# OPUS-BALANS — Board-rewards: vikterna + en vakt Design missade

**Datum:** 2026-06-22 · **Av:** Opus (balans) · **Till:** Code + Design
**Slottar in i:** `incoming/downloads 3/DESIGNRIKTNING-BOARD-REWARDS-2026-06-22.md`
**Källverifierat:** `boardObjectiveService.ts` — `successReward`/`failureConsequence` är strängar, `checkInObjectives` pushar dem som inbox-text; enda mekaniska följden är patience (+sack-trigger). Designens diagnos bekräftad. `sponsorNetworkMood` rörs av ripple (derby +5) men har noll nedströms-konsument — bekräftat i `rippleEffectService`.

## Jag godkänner modellen — mjukt default, hårt sällan, sponsorNetworkMood som den inneslutna spaken. Här är talen.

### Mjuka belöningar (default, varje uppfyllt mål)
- Behåll patience-headroom som idag.
- Nytt persistent fält: `boardTrust` (heltal). Uppfyllt mål → `+1`. Det är minnet som gör nästa mål tyngre.
- **Inga pengar i default-lagret.**

### sponsorNetworkMood — deltan (det enda ekonomiska flödet)
- Uppfyllt **flaggskeppsmål** (sporting/economic huvudmål): `sponsorNetworkMood +6` (strax över derbyts +5 — ett säsongsmål väger mer än en match).
- Uppfyllt rutinmål: `+3`.
- Misslyckat mål: `−4`.

### sponsorNetworkMood → sponsorintäkt (modifieraren)
Liten, kontinuerlig, neutral vid 50:
```
sponsorIncomeMultiplier = 1 + (sponsorNetworkMood − 50) * 0.004
```
Spann 0–100 → ~0.80×–1.20× sponsorintäkt. ±20 % i ytterlägena, 0 % vid neutralt 50. Sponsorintäkt är EN intäktsström, inte hela budgeten — så ±20 % är kännbart utan att spräcka ekonomin. Koefficienten 0.004 justeras efter en genomspelning.

### ⚠️ VAKTEN DESIGN MISSADE — sponsorNetworkMood saknar mean reversion
Det här är samma fälla som KF8 (fanMood ratchetade mot taket utan drift). Om `sponsorNetworkMood` blir intäktsspak men aldrig driver tillbaka mot 50, ratchetar en bra säsong (derby +5, mål +6, mål +6…) sponsorintäkten mot 1.20× och stannar där — runaway-överskott. **Krav, ej valfritt:** lägg drift mot 50 på `sponsorNetworkMood`, ~3 %/omgång, exakt som `FANMOOD_DRIFT_TARGET/STRENGTH` i `narrativeProcessor.ts`. Utan driften är intäktsspaken en ekonomibugg, inte en feature.

### Hårda belöningar (sällsynt, kapat)
- "Förtroendepott" låses upp ENDAST vid `boardTrust ≥ 2` *uppnått via uppfyllt flaggskeppsmål två säsonger i rad*.
- Engångs, fast kapat belopp: **50–75 tkr** facility-/transferkredit. Aldrig procent av budget.
- Fyrar en gång, sen `boardTrust → 1` (inte 0 — behåll minnet). Sällsynt + kapat + fast belopp = säkert.

### Misslyckande-beat (eskalerande röst, ej tyst siffra)
Patience-träffen står kvar. Lägg den synliga rösten ovanpå, skalad på `boardTrust`-fall / konsekutiva missar:
- 1:a miss: **notering** (lågmäld ägar-rad).
- 2:a i rad: **varning** (skarpare ton).
- 3:e i rad: **ultimatum** (sack-skuggan syns).
Detta ÄR en callback-beat (killer-app #1:s familj) — bygg den på `PortalBeat`/anslag, inte som eget system.

## Handoff
- **Code:** (1) `sponsorNetworkMood` → sponsorintäkts-multiplikator enligt formeln. (2) **Drift mot 50 på `sponsorNetworkMood` — speglar KF8/narrativeProcessor.** (3) `boardTrust`-fält + delta-logik vid met/failed. (4) Förtroendepott-utlösning vid boardTrust≥2 konsekutiv flaggskepps-uppfyllnad, fast kapat belopp. (5) Misslyckande-beat som eskalerande PortalBeat/anslag.
- **Design:** ytan (förtroende-steg + belönings-/misslyckande-beat) — mocka om Jacob vill se den före bygge.
- **Två fynd, en wire:** prio 4 (board-rewards verkliga) + prio 5 (sponsorNetworkMood får konsument) löses ihop, plus drift-vakten ovan.
