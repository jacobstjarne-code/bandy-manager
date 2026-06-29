# SPEC: Cup-scen-justeringar (efter anslag-implementation)

**Datum:** 2026-05-08
**Författare:** Opus
**Status:** SPEC — väntar Code-implementation efter anslag-variants är klart
**Beroende:** Anslag-variants-migration (`docs/CODE_INSTRUCTION_ANSLAG_VARIANTS_2026-05-08.md`) ska vara klar och pushed först.

---

## Bakgrund

Krockanalysen i `docs/NARRATIVE_FRAMEWORK_2026-05-08.md` identifierade **en verklig krock** mellan anslag och scener:

**`cup_intro` beat 1 dubblerar `cup_start`-anslaget.** Beat 1 säger fas-info ("Förstarunda i cupen. Innan serien drar igång.") som anslaget täcker bättre i sitt narrativa lager. När båda triggas vid säsongsstart får spelaren samma information två gånger — först som anslag-overlay, sen som scen-beat.

Två andra moments i NARRATIVE_FRAMEWORK var *falska* krockar (olika tidpunkter eller olika lager) — de behöver bara **verifieras**, inte ändras.

---

## CUPSCEN-01 · Korta beat 1 i cup_intro

**Fil:** `src/domain/data/scenes/cupIntroScene.ts`

### Befintlig beat 1:

```ts
{
  id: 'inramning',
  autoAdvance: true,
  durationMs: 3500,
  body: `Förstarunda i cupen. Innan serien drar igång.

*"Lottningen kunde varit värre."*`,
},
```

### Justera till:

```ts
{
  id: 'inramning',
  autoAdvance: true,
  durationMs: 2500,
  body: `*"Lottningen kunde varit värre."*

Replik från klubbhuset. Ingen vet vem som sa det först.`,
},
```

### Motivering

— **Borttagen rad:** "Förstarunda i cupen. Innan serien drar igång." — det är fas-info som `cup_start`-anslaget täcker bättre. Spelaren har redan sett anslaget när de når match-scenen.

— **Behållen replik:** "Lottningen kunde varit värre." — karaktäristisk klubbnivå-röst, inte fas-info. Hör hemma i scenen.

— **Ny ramning:** "Replik från klubbhuset. Ingen vet vem som sa det först." — etablerar ATT det är en replik från klubbens vardag, inte berättarröst. Sture-Forsbacka-stil.

— **Kortare durationMs:** 3500 → 2500. Mindre text att läsa, snabbare övergång till beat 2 (motståndare).

### Påverkan på beat 2 och 3

**Inga ändringar.** Beat 2 (motståndare) och beat 3 (avslut) är match-fokuserade och påverkas inte. De bär scenens kärnvärde — vem motståndaren är, vad som står på spel.

---

## CUPSCEN-02 · Verifiera sm_final_victory triggar för cup-final-vinst

**Fil:** `src/domain/services/sceneTriggerService.ts` (verifiering, inte ändring)

### Bakgrund

`shouldTriggerSMFinalVictory` triggar på:
```ts
const isFinal = lastManaged.isFinaldag === true ||
  (lastManaged.isCup === true && lastManaged.roundNumber >= 4)
```

Det betyder funktionen **också triggar för cup-final-vinst** — eftersom cup-final har `isCup=true` och `roundNumber=4`. Funktionen är felnamngiven (gäller alla finalvinster, inte bara SM) men logiken stämmer.

### Sekvens vid cup-final-vinst (för spelaren):

1. Cup-final spelas
2. `shouldTriggerSMFinalVictory` triggas (felnamngiven men korrekt logik) → `sm_final_victory`-scen renderas (fullskärm, dramatisk)
3. Spelaren klickar vidare → tillbaka till Portal
4. Portal renderas → `computeNextAnslag` returnerar `cup_done_winner` → AnslagOverlay (lugn, italic Georgia)

Match-celebration först, säsongs-reflektion sedan. Ingen krock — olika lager.

### Verifierings-test

Lägg till i `sceneTriggerService.test.ts`:

```ts
describe('shouldTriggerSMFinalVictory — cup-final', () => {
  it('triggas när managed club vinner cup-final', () => {
    const game = makeGame({
      managedClubId: 'forsbacka',
      fixtures: [
        makeFixture({
          isCup: true,
          roundNumber: 4,
          status: FixtureStatus.Completed,
          homeClubId: 'forsbacka',
          awayClubId: 'sandviken',
          homeScore: 4,
          awayScore: 3,
          matchday: 4,
        }),
      ],
      shownScenes: [],
    })
    expect(shouldTriggerSMFinalVictory(game)).toBe(true)
  })
  
  it('triggas INTE när managed club förlorar cup-final', () => {
    const game = makeGame({
      managedClubId: 'forsbacka',
      fixtures: [
        makeFixture({
          isCup: true,
          roundNumber: 4,
          status: FixtureStatus.Completed,
          homeClubId: 'forsbacka',
          awayClubId: 'sandviken',
          homeScore: 2,
          awayScore: 3,
          matchday: 4,
        }),
      ],
      shownScenes: [],
    })
    expect(shouldTriggerSMFinalVictory(game)).toBe(false)
  })
  
  it('triggas vid straffsegervinst i cup-final', () => {
    const game = makeGame({
      managedClubId: 'forsbacka',
      fixtures: [
        makeFixture({
          isCup: true,
          roundNumber: 4,
          status: FixtureStatus.Completed,
          homeClubId: 'forsbacka',
          awayClubId: 'sandviken',
          homeScore: 3,
          awayScore: 3,
          penaltyResult: { home: 5, away: 4 },
          matchday: 4,
        }),
      ],
      shownScenes: [],
    })
    expect(shouldTriggerSMFinalVictory(game)).toBe(true)
  })
  
  it('triggas inte om scenen redan visats', () => {
    const game = makeGame({
      managedClubId: 'forsbacka',
      fixtures: [/* cup-final-vinst */],
      shownScenes: ['sm_final_victory'],
    })
    expect(shouldTriggerSMFinalVictory(game)).toBe(false)
  })
})
```

---

## CUPSCEN-03 (valfritt) · Byt namn på `sm_final_victory` till `final_victory`?

Funktionen är felnamngiven — den triggar både SM-final och cup-final. Två alternativ:

**A. Behåll namnet som det är.** Det är historiskt och fungerar. Fil-justering kan göras senare om det behövs.

**B. Refactor till `final_victory`.** Mer korrekt namngivning, men kräver:
- Byta SceneId-typ
- Byta data-fil-namn  
- Söka och uppdatera alla referenser
- Säkerställa att SaveGame migration (om scenen sparats i shownScenes som 'sm_final_victory') hanteras

**Min rekommendation: A.** Refactor-värdet är litet jämfört med risken. Lägg till en JSDoc-kommentar i `shouldTriggerSMFinalVictory` som klargör att den triggar både SM-final och cup-final.

```ts
/**
 * Triggas vid managed clubs vinst i ANY final — både cup-final och SM-final.
 * Funktionsnamnet är felnamngivet av historiska skäl.
 */
export function shouldTriggerSMFinalVictory(game: SaveGame): boolean {
  // ... (befintlig kod)
}
```

---

## VAD DU INTE SKA GÖRA

- **Inte ändra** beat 2 och beat 3 i `cup_intro`. De är match-fokuserade och korrekta.
- **Inte ändra** `shouldTriggerSMFinalVictory`-logiken. Den fungerar för både cup-final och SM-final.
- **Inte ta bort** repliken "Lottningen kunde varit värre." — det är scenens karaktär.
- **Inte refactor:a** `sm_final_victory` namn till `final_victory` om det inte är trivialt. Risk större än värdet.

---

## ACCEPTANSKRITERIER

- [ ] Beat 1 i `cup_intro` justerad enligt CUPSCEN-01
- [ ] `durationMs` ändrad till 2500
- [ ] Verifierings-tester för `shouldTriggerSMFinalVictory` och cup-final-vinst gröna
- [ ] JSDoc-kommentar tillagd i `shouldTriggerSMFinalVictory` (om CUPSCEN-03 = A)
- [ ] Befintliga tester fortfarande gröna

---

## RAPPORTERA NÄR KLART

Per CUPSCEN-XX punkt: ✅ / ⚠️ / ❌ med en mening om vad som gjordes. Pusha som egen commit eller bunta med anslag-variants-implementationen.
