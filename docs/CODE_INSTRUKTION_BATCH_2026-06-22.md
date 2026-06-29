# CODE-INSTRUKTION — Mekanik-batch 2026-06-22

**Av:** Opus · **Till:** Code · **Datum:** 2026-06-22
**Form:** Fyra oberoende mekanik-wirar i en pass. Inget delar infrastruktur, allt är lågrisk. Detaljspec ligger i de länkade dokumenten — det här är dispositionen + acceptans.

**VAD SOM MEDVETET INTE ÄR HÄR (bygg inte nu):** all *beat*-yta — board-rewards misslyckande-ultimatum, Callback, era-callback-rad, deadline-day-urgency, awayTrip context-rad, lastNationalSnub-trigger. De konsumerar samma eskalerande-konsekvens-beat-primitiv som ska designas först. Bygger du en beat här bygger vi den fel tre gånger. Beats kommer som separat spec efter primitiven.

---

## 1 · Stjärnskada → kaskad
**Fil:** `src/domain/services/rippleEffectService.ts` → `applyStarInjuryRipples`
**Detaljspec:** `docs/OPUS_RULING_STJARNSKADA_KASKAD_2026-06-22.md` (kod-block finns där, kopiera in)
**Kort:** bas fanMood −4 / supporterGroup.mood −3 för varje managed-stjärna (CA≥60); boardPatience −4 ENDAST vid `injuryDaysRemaining ≥ 28` × (kapten ELLER CA≥78). Aldrig form/morale. Inga nya fält.
**Acceptans:** stjärna skadas → fanMood + klack sjunker; långtidsskada på kapten/franchise → även boardPatience; kort skada på rotationsstjärna → bara bas. Killer-app #3:s trace plockar upp den (≥2 system) utan ny design.

## 2 · Board-rewards DATALAGER (ej beaten)
**Fil:** `src/domain/services/boardObjectiveService.ts` + ekonomi-/sponsor-service + `narrativeProcessor.ts` (drift)
**Detaljspec:** `docs/OPUS_BALANS_BOARD_REWARDS_2026-06-22.md`
**Bygg (datalagret):**
- `sponsorNetworkMood` → sponsorintäkts-multiplikator: `1 + (sponsorNetworkMood − 50) * 0.004`.
- **Drift mot 50 på `sponsorNetworkMood`, ~3 %/omg — spegla `FANMOOD_DRIFT_TARGET/STRENGTH`.** Utan driften ratchetar intäkten mot taket (KF8-fällan). Ej valfritt.
- `boardTrust`-fält (heltal): uppfyllt mål +1.
- Uppfyllt flaggskeppsmål → `sponsorNetworkMood +6`; rutinmål +3; misslyckat −4.
- Förtroendepott: vid `boardTrust ≥ 2` via uppfyllt flaggskepp två säsonger i rad → engångs fast 50–75 tkr, sen boardTrust→1. Aldrig procent av budget.
**Carve-out:** misslyckande-*beaten* (notering→varning→ultimatum) byggs INTE här — den är beat-arbete. Patience-träffen + sponsorNetworkMood-deltat räcker som datalager nu.
**Acceptans:** uppfyllt mål rör sponsorNetworkMood → mätbar (liten) sponsorintäkts-ändring nästa omgång; en bra säsong driver inte intäkten mot taket (driften håller emot); förtroendepott fyrar bara vid 2 raka flaggskepp och är kapad.

## 3 · Volunteers → motorn läser rolltyp
**Fil:** `volunteerService`
**Detaljspec:** `incoming → arkiverat` `CODE-ORDER-VOLUNTEERS-2026-06-22.md` (ligger i design-paket-arkivet, se INDEX)
**Kort:** motorn summerar per rolltyp med de effektvärden OrtenTab redan visar som sanningskälla (puls vs kr per roll), inte platt snitt. Ingen ny yta.
**Acceptans:** ändra rollfördelningen → de visade OrtenTab-effekterna ändrar faktiskt puls/ekonomi nästa omgång enligt samma siffror. Stänger sista öppna ⬜ i audit-täckningen.

## 4 · awayTrip → dödmarkera logistik-stubben
**Fil:** `roundProcessor.ts` (`generateAwayTrip`-anropet, `awayTrip: awayTripUpdate`), `managerKvittoText.ts` (`AWAY_ROUTINE_OUTCOMES`, `HOTEL_NAMES`, `RESOLVED_TEXTS`)
**Detaljspec:** `DESIGNRIKTNING-AWAYTRIP-2026-06-22.md` (design-paket-arkivet)
**Kort:** TA BORT (ej kommentera ut) manager-logistiken: `game.awayTrip`-objektet, `generateAwayTrip`-anropet i roundProcessor, `HOTEL_NAMES`/`RESOLVED_TEXTS`/`AWAY_ROUTINE_OUTCOMES`. **Rör INTE** klack-ritualet (`supporterGroup.awayTripSeason/awayTripMatchday` + `klackPresenter` + `getAwayTripNarrative`) — det fungerar.
**Carve-out:** `weatherWarning`-context-raden i bortamatcher är callback-familj → beat-arbete, inte nu.
**Acceptans:** `game.awayTrip` borta ur typer + state; klack-bortaresan orörd och fungerar; inga döda importer kvar (`AWAY_ROUTINE_OUTCOMES` ska vara borttagen, inte oimporterad-men-kvar).

---

## Handoff
Bygg de fyra, gröna tester, rapportera per punkt mot acceptansen ovan (visa diff/kod, inte "✅ klart"). När batchen är inne är nästa steg beat-primitiven — den specas separat och blir grunden Callback + board-rewards-ultimatum + deadline-day ärver. lastNationalSnub + anniversary-trösklar väntar (snubben blir Callback-trigger; anniversary kräver att Opus lokaliserar significance-gaten först).
