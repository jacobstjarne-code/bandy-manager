# Code-instruktion — Slinga 1: Beslut → följd (KORRIGERAD, grundad mot källan)

Källa: Överlämning fil 4 (ytor 1–2) + prototyp 5. Grundad av Opus 2026-06-27 mot
faktisk kod: `PortalScreen.tsx`, `WeeklyDecisionSecondary.tsx`, `weeklyDecisionService.ts`,
`portalBeats.ts` (`ripple_consequence` + `renderChain`), `rippleEffectService.ts`, `SaveGame.ts`.

**Denna fil ersätter en tidigare chat-levererad slinga-1-spec som byggde på fel premiss
om ripplen.** Grundningen nedan kollapsar arbetet kraftigt: yta 2 är redan skeppad.

---

## YTA 2 (ripple "Därför hände det") — REDAN YTLAGD, inget bygge

Tidigare antagande (handover + min chat-spec): `describeRippleChain` ger bara `{label,dir}`
utan prosa → måste ytas, "högsta prioritet, ren ytning".

**Grundat mot källan stämmer det inte.** `portalBeats.ts` har redan ett skeppat beat:
- `ripple_consequence` (⛓️, kicker "Konsekvens"). `trigger`: `pendingRippleChain && round === currentMatchday`.
- `text: renderChain(pendingRippleChain)` — och `renderChain` ger full prosa: `TRIGGER_CLAUSE`
  (star_injured/big_derby_win/mecenat_left → mening) + `STEP_VERBS` (Stämningen/Klacken/Orten/
  Styrelsen/Sponsorerna → "lyfter/sjunker"-verb). Severity-graderat, dismissbart, egen nyckel.
- Filhuvudet: "Texterna är Opus-satta och slutliga."

→ **Bygg ingenting här.** "Därför hände det" finns för sina tre triggers.

Två öppna poster, BÅDA utanför denna ticket:
1. **Design-scope, inte ytning:** prototyp 5 visar en rikare kedja med magnituder
   (humör −15, puls −8). Det är en TYNGRE presentation än det skeppade enradiga beatet,
   inte "yta det som saknas". Om den rikare vyn vill byggas är det ett medvetet designval
   ovanpå något som redan fungerar — Jacobs prioritering, inte en surfacing-uppgift.
2. **Decision→ripple-loopen finns inte:** `describeRippleChain.trigger` är unionen
   star_injured | big_derby_win | mecenat_left. Ett veckobeslut genererar INGEN RippleChain.
   Så "beslut → därför hände det" som en kausal tråd är inte wirad — det är F7
   (gemensam besluts-modell), sekvenserad senare. Fejka inte länken här.

---

## YTA 1 (grindad CTA, anti-autopilot) — det faktiska arbetet

Detta står kvar och är den enda reella biten i slinga 1.

Beslutskortet finns (`WeeklyDecisionSecondary.tsx` — fråga, A/B, effekt, ✓-kvitto, kopplat
till `game.pendingWeeklyDecision` + store-action `resolveWeeklyDecision(choice)`). Bygg inte om det.
Arbetet är grinden.

### 1a. Grinda avancera-CTA:n
`PortalScreen.tsx`, sticky-knappen `data-coach-id="cta-button"`:
- Idag: `disabled={!canClickAdvance || isAdvancing}`.
- Lägg till: gated när `game.pendingWeeklyDecision != null`.
- Låst läge: muted + lås-affordans, "Hantera veckans beslut först" (ingen gradient/puls).
  Öppet läge: oförändrad `advanceButtonText`.

### 1b. ANTI-SOFT-LOCK (viktigast)
`WeeklyDecisionSecondary` ligger i `layout.secondary`, byggd med bag-of-cards + stale-bias —
ett pending-beslut är inte garanterat med varje omgång. Grindar du CTA:n men kortet inte
renderas → hård soft-lock.
→ Pinna kortet: när `pendingWeeklyDecision` finns och grindar CTA:n, tvinga in kortet i
layouten (eller rendera separat ovanför CTA:n). Grind och kort = samma villkor. Verifiera
i kontext att kortet syns när knappen är låst.

### 1c. Smal scope
- Grinda BARA den användarklickade CTA:n. Auto-advance-on-mount (omgångar utan managed-match)
  anropar `advance()` direkt och ska INTE grindas — beslutet rider med till nästa portal.
- Grinda INTE spectator/sim-remaining-flödena.
- Grinda på `pendingWeeklyDecision` ENBART, inte hela `getActiveDecisionCount`/decisionBudget.
- `isSeason1Round1`-ramen säger redan "En fråga åt gången" — grinden förstärker, krockar inte.

---

## Sammanfattning
Slinga 1 = yta 1 (grindad CTA, ovan). Yta 2 är redan skeppad. Loopen decision→ripple är F7.
Ett pass, en yta. Om den rikare ripple-vyn (prototyp 5) ska byggas är det ett separat designbeslut.
