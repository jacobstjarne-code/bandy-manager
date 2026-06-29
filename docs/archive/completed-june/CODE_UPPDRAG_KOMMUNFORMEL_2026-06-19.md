# CODE-ORDER — Kommun-formeln i hall-prövningen (B1 §5 fix)

> ⚠️ **MOOT 2026-06-19.** Code byggde denna (commit `3d7d8389`, `calcMaxKommunAndel`) — bra hantverk, men den opererar på `buildKommunEvent`/`maxKommunAndel` som RIVS i hall-prövningens omarbete mot 06-12-modellen (`CODE_UPPDRAG_HALLPROVNING_OMARBETE_2026-06-19.md`). 06-12:s kommunförhandling är decisions med odds ur kommunrelationen — ingen andel-av-kostnad-formel finns. `calcMaxKommunAndel` tas bort i omarbetet. Bygg INTE vidare på denna. Behåll som historik.

**Datum:** 2026-06-19
**Från:** Opus
**Fil:** `src/domain/services/events/hallProcessService.ts` → `buildKommunEvent`
**Status:** Code-redo. Ren formelfix, ingen text (label/subtitle/body rörs ej). En gate-runda.

---

## Vad som ska ändras och varför
`buildKommunEvent` bestämmer hur stor andel av hallkostnaden kommunen kan stå för med en platt 2×2-tabell:

```ts
const agendaFriendly = politician.agenda === 'infrastructure' || politician.agenda === 'prestige'
const highRelation = politician.relationship > 70
const maxKommunAndel = agendaFriendly ? (highRelation ? 0.50 : 0.35) : (highRelation ? 0.25 : 0.15)
```

Tre problem (avviker från SPEC_HALLPROVNING:s "återanvänd `calculateKommunBidrag`-formen"):
1. **`generosity` läses inte.** Två infrastructure-politiker med relation 75 ger identiskt utfall även om generosity är 50 resp. 90. Per-politiker-karaktären försvinner i just den förhandling där den borde märkas mest.
2. **`communityStanding` väger inte.** B1-temat (klubben som samhällsinstitution) ska påverka om kommunen backar hallen — här gör det inte det.
3. **Hård klippkant vid relation 71.** Vänlig agenda ger 0.35 vid relation 70 och 0.50 vid 71 — +15 procentenheter på en enda poäng. Känns godtyckligt i spel.

## Mallen: `calculateKommunBidrag` (politicianService.ts)
Använd dess form — multiplikativ med kontinuerliga moddar + agenda/relations-term:
```ts
const generosityMod = (politician.generosity ?? 60) / 100        // ~0.2–0.9
const communityMod  = communityStanding / 50                      // 0–2, clampa
// agendaBonus + relBonus additivt
```
Den blandar redan generosity (kontinuerlig) × standing (kontinuerlig) med stegade bonusar. Vi vill samma blandning, fast utfallet är en ANDEL (0–1) av hallkostnaden, inte ett kronbelopp.

## Den nya formen (ersätt maxKommunAndel-raden)
```ts
// Basandel per agenda-klass — hur välvilligt inställd kommunen är i grunden
const agendaBas =
  (politician.agenda === 'infrastructure' || politician.agenda === 'prestige') ? 0.34
  : (politician.agenda === 'youth' || politician.agenda === 'inclusion') ? 0.24
  : 0.16  // savings (och övrigt)

// Kontinuerliga moddar — politikerns karaktär + klubbens anseende
const generosityMod = 0.7 + ((politician.generosity ?? 60) / 100) * 0.6   // ~0.82–1.24
const standingMod   = 0.7 + Math.min(Math.max((game.communityStanding ?? 50) / 50, 0), 2) * 0.3 / 2  // ~0.7–1.0... se nedan
// Relation som GLIDANDE term (ej >70-cliff): 0 vid relation 0, +0.15 vid relation 100
const relTerm = (politician.relationship / 100) * 0.15

const maxKommunAndel = Math.min(0.50, Math.max(0.10, agendaBas * generosityMod + relTerm * standingMod))
```

**OBS — kalibrera moddarnas spann så att utfallet hamnar i ~0.10–0.50** (samma yttergränser som idag, så balansen inte hoppar). Exakta koefficienterna ovan är förslag, inte heliga — det viktiga är FORMEN:
- agenda sätter basnivån (tre klasser, inte bara vänlig/ovänlig)
- generosity skalar kontinuerligt (en snål politiker ger mindre även med rätt agenda)
- communityStanding skalar (hög standing → kommunen vågar mer)
- relationen glider (ingen klippkant), och väger tyngre när standing är hög
- `Math.min/max`-clamp håller spannet 0.10–0.50

Justera koefficienterna så att: en idealpolitiker (infrastructure, generosity 90, standing 80, relation 90) når ~0.50; en fientlig (savings, generosity 25, standing 40, relation 30) hamnar nära 0.10–0.13. Verifiera med ett par handräknade fall i PR-beskrivningen.

## Vad som INTE ändras
- `kommunAndelDelta`-beräkningen i de två valen (`maxKommunAndel * 0.5` resp. `* 0.8`) — formen där är OK, den läser bara nya maxKommunAndel.
- Subtitle-strängarna (`~${Math.round(maxKommunAndel * 50)}%` etc.) — de räknar redan på maxKommunAndel, följer med automatiskt.
- All label/title/body-text — Opus-skriven, rör ej.
- `canGodkanna`-tröskeln (0.30), STYRELSE_THRESHOLD, kravMultiplikator — separata trim-värden, ej i denna order.

## Gate
`build` (tsc) · `npm test` · `lint:design`. Lägg gärna ett litet enhetstest som låser att (a) generosity 90 > generosity 30 ger högre andel vid samma agenda+relation+standing, och (b) det inte finns någon diskontinuitet kring relation 70 (71 ≈ 70 + epsilon, inte +0.15). Rapportera commit + de handräknade fallen.
```
