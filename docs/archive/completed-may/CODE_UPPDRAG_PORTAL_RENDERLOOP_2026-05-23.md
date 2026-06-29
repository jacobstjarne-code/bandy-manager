# CODE-UPPDRAG — Portal story-slot render-loop (KRITISK) 2026-05-23

**Av:** Opus. **Surface:** kategori D (logik/state). **Funnen i:** audit av portal-kurering
före playtest. **Allvar:** crash-class (React "Maximum update depth exceeded"), intermittent.

## Symptom
Portalen kan frysa/krascha efter omgångar där inboxen innehåller två FREKVENTA-kandidater
samtidigt (t.ex. ett `bigResult` + ett `journalistHot`, eller `scandal` + `journalistHot`).
Vanligast efter stora vinster/derbyn/skandaler — de skapar både MatchResult- och Media-items.

## Rotorsak
`buildPortal` läser `game.lastStorySlotType` för rotationsregeln (FREKVENTA-typ som tog
sloten ×0.5). `recordPortalShown` SKRIVER `lastStorySlotType` på varje render (useEffect
på `[layout]`). Eftersom `layout = useMemo(buildPortal(game, seed), [game, seed])` ger varje
skrivning ny `game`-ref → ny layout → effekten igen.

Med två FREKVENTA-kandidater flippar ×0.5 vinnaren varje varv:
- journalist (80) vinner → lastType=journalist → journalist×0.5=40 < bigResult 65 → bigResult vinner
- → lastType=bigResult → bigResult×0.5=32.5 < journalist 80 → journalist vinner → LOOP

Guarden `if (staleUnchanged && kindUnchanged) return state` fångar inte fallet eftersom
`kind` växlar varje varv (kindUnchanged alltid false).

Begreppsfelet: `lastStorySlotType` ska betyda "slot:en från FÖRRA matchdagen" men muteras
mitt under den nuvarande. buildPortal måste läsa ett värde som är FRYST genom hela matchdagen.

## Fix — separera läsning från skrivning (4 punkter)

### 1. SaveGame — nytt fält
Lägg `currentStorySlotType?: string` bredvid befintliga `lastStorySlotType?: string`.
- `currentStorySlotType` = slot:en som visats UNDER den pågående matchdagen (skrivs vid render).
- `lastStorySlotType` = slot:en från FÖREGÅENDE matchdag (läses av buildPortal, frys under matchdagen).

### 2. recordPortalShown (gameStore.ts) — skriv current, INTE last
Ändra så att story-slot-delen skriver `currentStorySlotType`, inte `lastStorySlotType`.
Behåll stale-tracking-delen och guarden oförändrad i övrigt.
```ts
recordPortalShown: (cardIds, storySlotKind) => {
  set(state => {
    if (!state.game) return state
    const current = state.game.cardStaleTracking ?? {}
    const next = computeCardStaleTracking(current, cardIds, state.game.currentMatchday)
    const staleUnchanged = cardIds.every(id => {
      const e = current[id]; const n = next[id]
      return e?.firstShownAt === n?.firstShownAt && e?.lastShownAt === n?.lastShownAt
    }) && cardIds.length > 0
    const currentUnchanged = storySlotKind === undefined || storySlotKind === state.game.currentStorySlotType
    if (staleUnchanged && currentUnchanged) return state            // guard: samma ref, ingen loop
    const currentStorySlotType = storySlotKind ?? state.game.currentStorySlotType
    return { game: { ...state.game, cardStaleTracking: next, currentStorySlotType } }
  })
}
```
Nu är buildPortals rotationsinput (`lastStorySlotType`) ALDRIG muterad under matchdagen →
buildPortal är stabil över recompute → vinnaren slutar flippa → loop omöjlig.

### 3. buildPortal (portalBuilder.ts) — oförändrad rotationsmatte
Rotationsregeln läser fortfarande `game.lastStorySlotType`. Ingen matchday-gate behövs —
värdet är nu frust per matchdag (skrivs bara vid omgångsövergång, punkt 4). Lämna koden:
```ts
if (FREKVENTA.has(card.kind) && card.kind === game.lastStorySlotType) w *= 0.5
```

### 4. Omgångsövergång — promota current → last EN gång per matchdag
Hitta där `currentMatchday` inkrementeras (sannolikt `roundProcessor.ts` eller
`advanceToNextEvent.ts` — grep `currentMatchday:` / `currentMatchday =` / `currentMatchday +`).
DÄR, när matchdagen ökar, gör:
```ts
lastStorySlotType: prev.currentStorySlotType ?? prev.lastStorySlotType,
// currentStorySlotType lämnas — skrivs över av nästa matchdags renders
```
Detta är den enda platsen som vet matchday-gränsen säkert (render-pathen ligger alltid
ett steg efter pga useMemo→useEffect-ordningen). Resultat: när PortalScreen renderar
matchdag N har `lastStorySlotType` redan = slot:en från N-1, fryst hela N. Rotationen
fungerar som specat OCH loopen är omöjlig.

## Verifiering (tvingande)
1. Skapa ett läge med både `bigResult` och `journalistHot` i inboxen samma matchdag.
   Öppna portalen → ingen frys, ingen "Maximum update depth"-error i konsolen. EN stabil
   story-slot renderas.
2. Spela omgång N med journalist i sloten, gå till N+1 med journalist-kandidat kvar +
   ett bigResult → bigResult ska vinna sloten i N+1 (rotation straffar journalist). Skärmdump.
3. Determinism: samma save + matchday → samma story-slot, oavsett hur många gånger portalen
   re-renderas.

## Vad som INTE ändras
Golv-regeln (SALLSYNTA +25), DEL 1-mappningen, round-character, vikterna. Bara rotations-
inputens livscykel (current vs last) + promotion vid omgångsövergång.

— Opus, 2026-05-23
