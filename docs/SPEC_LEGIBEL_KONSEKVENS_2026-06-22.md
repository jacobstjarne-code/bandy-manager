# SPEC — Legibel konsekvens: visa dominokedjan i ögonblicket

**Datum:** 2026-06-22 · **Av:** Opus · **Till:** Code (mekanik/wiring) + Opus (copy, skriven nedan)
**Status:** Spec-klar. **Bygger på beat-primitiven** + är dess severity-2-ben (konsekvens, inte lugnt minne som Callback). Paketets killer-app #3.
**Tesen:** `rippleEffectService` kaskaderar redan (skada → puls → styrelse; mecenat ut → orten → styrelse → klack; derbyseger → fyra system). Men spelaren ser bara SLUTtillståndet — tre separata siffror som rört sig, aldrig kedjan. #3 visar dominot en gång, i ögonblicket. Det är känslan av att systemen pratar med varandra.

---

## DIAGNOS — before/after

**BEFORE.** Lindqvist skadas. Bakom kulisserna kör `applyStarInjuryRipples`: fanMood −4, klack −3. Spelaren ser möjligen att stämningen och klacken sjunkit — som två orelaterade siffror, om hen ens märker det. Kedjan (skadan ORSAKADE oron) är osynlig. Datan finns, sambandet sägs aldrig.

**AFTER.** En konsekvens-beat i portalen samma omgång: *"Lindqvist borta i fyra veckor. Klacken oroas, stämningen sjunker."* Ett enda nedslag som visar dominot — orsak och verkan i en mening. Spelaren känner att systemen hänger ihop.

---

## MEKANIK — `applyRipples` finns, lägg till kedje-INSPELNING

`applyRipples(game, trigger)` returnerar idag bara den ripplade staten. Lägg till en ren beskrivnings-funktion bredvid (rör inte ripple-logiken):

```ts
// rippleEffectService.ts
export interface RippleChainStep { label: string; dir: 'up' | 'down' }
export interface RippleChain {
  trigger: 'star_injured' | 'big_derby_win' | 'mecenat_left'
  subjectName?: string          // spelarnamn / mecenatnamn / undefined för derby
  round: number
  season: number
  steps: RippleChainStep[]       // systemen som rörde sig, i kaskadordning
}

const FIELD_LABELS: Record<string, string> = {
  fanMood: 'Stämningen',
  supporterGroup: 'Klacken',
  communityStanding: 'Orten',
  boardPatience: 'Styrelsen',
  sponsorNetworkMood: 'Sponsorerna',
}

/** Diffar before/after på RIPPLE_AFFECTED_FIELDS → kedjan av system som rörde sig. */
export function describeRippleChain(
  before: SaveGame, after: SaveGame,
  trigger: RippleChain['trigger'], subjectName: string | undefined,
  round: number, season: number,
): RippleChain {
  const steps: RippleChainStep[] = []
  const fanD = (after.fanMood ?? 50) - (before.fanMood ?? 50)
  if (fanD !== 0) steps.push({ label: FIELD_LABELS.fanMood, dir: fanD > 0 ? 'up' : 'down' })
  const klackD = (after.supporterGroup?.mood ?? 50) - (before.supporterGroup?.mood ?? 50)
  if (klackD !== 0) steps.push({ label: FIELD_LABELS.supporterGroup, dir: klackD > 0 ? 'up' : 'down' })
  const csD = (after.communityStanding ?? 50) - (before.communityStanding ?? 50)
  if (csD !== 0) steps.push({ label: FIELD_LABELS.communityStanding, dir: csD > 0 ? 'up' : 'down' })
  const boardD = (after.boardPatience ?? 70) - (before.boardPatience ?? 70)
  if (boardD !== 0) steps.push({ label: FIELD_LABELS.boardPatience, dir: boardD > 0 ? 'up' : 'down' })
  const sponsD = (after.sponsorNetworkMood ?? 50) - (before.sponsorNetworkMood ?? 50)
  if (sponsD !== 0) steps.push({ label: FIELD_LABELS.sponsorNetworkMood, dir: sponsD > 0 ? 'up' : 'down' })
  return { trigger, subjectName, round, season, steps }
}
```

### Wiring i roundProcessor
Vid varje `applyRipples`-anrop, fånga kedjan från before/after:
```ts
// star_injured (i newlyInjured-loopen):
const before = gameAfterRipples
gameAfterRipples = applyRipples(gameAfterRipples, { type: 'star_injured', playerId: player.id })
roundRippleChains.push(describeRippleChain(before, gameAfterRipples, 'star_injured',
  `${player.firstName} ${player.lastName}`, nextMatchday, game.currentSeason))

// big_derby_win (efter derbyseger): samma mönster, subjectName = rivalklubbens namn
// mecenat_left: VERIFIERA att ripplen har ett anropsställe (jag såg star_injured + big_derby_win
//   i roundProcessor men INTE mecenat_left). Om mecenat_left-ripplen är definierad men aldrig
//   anropad → flagga; kaskaden är vilande och mecenat-konsekvensbeaten fyrar inte förrän den wiras.
```

Behåll EN kedja per omgång (mest signifikant: mecenat_left > star_injured-med-styrelse > star_injured > big_derby_win). Lägg på `game.pendingRippleChain` (transient; rensas när beaten dismissas). De befintliga `star_injury`/`derby_win`-Moments står kvar — Moment = arkiv (Minne-fliken), beaten = ögonblicket. De ersätter inte varandra.

---

## KONSEKVENS-BEATEN (rider primitiven, severity 1–2)

```ts
{
  id: 'ripple_consequence',
  emoji: '⛓️',                      // kedja
  kicker: 'Konsekvens',
  severity: (g) => {
    const c = g.pendingRippleChain
    if (!c) return 0
    if (c.trigger === 'big_derby_win') return 0        // positivt → lugnt
    if (c.trigger === 'mecenat_left') return 2          // strukturellt slag → danger
    return c.steps.some(s => s.label === 'Styrelsen') ? 2 : 1  // skada: styrelse-träff = allvar
  },
  trigger: (g) => !!g.pendingRippleChain && g.pendingRippleChain.round === g.currentMatchday,
  text: (g) => renderChain(g.pendingRippleChain),       // se copy
  keyFn: (g) => `ripple_${g.pendingRippleChain?.trigger}_${g.pendingRippleChain?.round}_s${g.pendingRippleChain?.season}`,
  oncePerSeason: false,
}
```
**Placering:** konsekvens-regionen, efter `board_failure`, före callbacks. (Endast ett beat visas/omgång — co-förekomst är sällsynt, ordningen lågrisk.) nonActionable (inga choices) → passerar KF3 oräknat.

---

## COPY (Opus-satt, slutlig) — trigger-klausul + kedja

`renderChain(c)` bygger en mening: orsak + dominots steg som mjuka verb. Steg-verben per system och riktning:

```
Stämningen   ↓ "stämningen sjunker"    ↑ "stämningen lyfter"
Klacken      ↓ "klacken oroas"          ↑ "klacken tänds"
Orten        ↓ "orten känner det"       ↑ "orten reser sig"
Styrelsen    ↓ "styrelsen tappar tålamod" ↑ "styrelsen nickar"
Sponsorerna  ↓ "sponsorerna drar öronen åt sig" ↑ "sponsorerna hör av sig"
```

Trigger-klausuler:
```
star_injured   — "{spelare} är borta ett tag."
big_derby_win  — "Derbysegern sitter kvar."
mecenat_left   — "{mecenat} drog sig ur."
```

Mönster: `{trigger-klausul} {steg-verb-1}, {steg-verb-2}[, {steg-verb-3}]`. Max tre steg i texten (de mest signifikanta), bandy-understatement, ingen utropston. Exempel som faller ut:
- Skada: *"Lindqvist är borta ett tag. Klacken oroas, stämningen sjunker."*
- Mecenat: *"Bergström drog sig ur. Orten känner det, styrelsen tappar tålamod, klacken oroas."*
- Derby: *"Derbysegern sitter kvar. Stämningen lyfter, klacken tänds, orten reser sig."*

`renderChain` kapar till 3 steg, sätter punkt mellan trigger och kedja, kommatecken mellan steg, punkt sist. Tom kedja (0 steg) → returnera bara trigger-klausulen (defensivt; ska inte hända då beaten kräver pendingRippleChain).

---

## VERIFIERING
- Skada en stjärna → konsekvens-beat surfar samma omgång med "{namn} … klacken oroas, stämningen sjunker", severity 1 (eller 2 om styrelsen träffades).
- Mecenat lämnar → beat med 3-stegskedja, severity 2 (danger-tint). **Om den inte fyrar: verifiera att mecenat_left-ripplen överhuvudtaget anropas** (misstänkt vilande — fanns ej i roundProcessor-flödet jag läste).
- Stor derbyseger → beat severity 0, positiv kedja.
- Beaten passerar beslutsbudgeten oräknad (nonActionable, KF3-trace).
- `star_injury`/`derby_win`-Moments finns kvar i Minne-fliken parallellt.

## HANDOFF
Code: lägg `describeRippleChain` + typerna i `rippleEffectService.ts`, fånga kedjan vid varje `applyRipples`-site i roundProcessor (star_injured + big_derby_win bekräftade; **hitta + wira mecenat_left, flagga om ripplen är vilande**), behåll mest signifikant kedja → `pendingRippleChain` (transient SaveGame-fält), lägg `ripple_consequence`-beaten i konsekvens-regionen, implementera `renderChain` med copy ovan (rör inte texten). Rapportera mot verifieringen + säg om mecenat_left visade sig vilande. Copy är skriven — Opus rör den, inte Code.
