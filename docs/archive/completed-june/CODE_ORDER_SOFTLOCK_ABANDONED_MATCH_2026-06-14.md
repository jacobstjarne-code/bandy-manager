# CODE-ORDER — Soft-lock: övergiven match efter reload (KRITISK)

**Datum:** 2026-06-14 · **Av:** Opus · **Rotorsakad i källan** (MatchLiveScreen + matchActions). Detta är en RC-blockerare av samma klass som GAP-1 (save-state-loop) i RC_BEDOMNING.
**Modell:** Sonnet räcker — rotorsak och fix är fastställda nedan, ingen arkitekturöppen fråga.

## Symptom (Jacobs repro)
Ladda om spelet → startskärm → "Ladda spel" → portal → "Spela match" → matchen förbereds → klicka starta → **tillbaka till portal**. Upprepas i all oändlighet; matchen går aldrig att spela.

## Rotorsak (verifierad)
1. `MatchLiveScreen` första `useEffect` (rad ~258):
```js
if (liveFixture?.matchStartedAt && liveFixture.status === 'scheduled') {
  navigate('/game', { replace: true })   // ← studsar, men återställer inget
}
```
2. `markMatchStarted` (matchActions) sätter `matchStartedAt: Date.now()` + persisterar lineups SÅ SNART simuleringen börjar. Resultatet sparas först i `matchDone`-effekten (`saveLiveMatchResult` + `advance`).
3. Laddar spelaren om (eller kraschar) mellan start och slut → save:n har en fixture med `matchStartedAt` satt men `status: 'scheduled'`.
4. Den fixturen är fortfarande "nästa schemalagda match" → prep-skärmen visar den → spelaren förbereder → startar → live-skärmen mountas → guard-effekten (ligger FÖRE simuleringseffekten) läser det kvarvarande `matchStartedAt` → studsar till portal innan `markMatchStarted` ens körs. Loop.
5. `beforeunload`-varningen lovar "Lämnar du nu simuleras resten automatiskt" — men auto-simuleringen körs bara på in-app-navigation, ALDRIG vid reload (JS-kontexten dör först). Löftet bryts, fixturen fastnar.

## Fixen — återställ, studsa inte (mekanismen finns redan)
`matchActions.ts` har redan `simulateAbandonedMatch(fixtureId)` byggd för precis detta: fast-simulerar fixturen via `simulateMatch`, assistenttränaren tar över, postar en inkorgsrad ("Du lämnade matchen innan den var klar"), sätter status `completed`. Den är medvetet anti-savescum — rätt designval, behåll det.

**Guarden ska anropa den istället för att studsa tomt.** I `MatchLiveScreen`s första useEffect:

```js
useEffect(() => {
  if (!fixture || !game) return
  const liveFixture = game.fixtures.find(f => f.id === fixture.id)
  if (liveFixture?.status === 'completed') {
    navigate('/game', { replace: true })
    return
  }
  // Övergiven match (startad i tidigare session, aldrig slutförd — t.ex. reload mitt i):
  // återställ via assistenten istället för att studsa tomt (annars soft-lock-loop).
  if (liveFixture?.matchStartedAt && liveFixture.status === 'scheduled') {
    simulateAbandonedMatch(fixture.id)   // hämta ur useGameStore
    navigate('/game/review', { replace: true })  // visa resultatet assistenten producerade
  }
}, []) // eslint-disable-line
```

**Varför detta är säkert:** vid guard-tidpunkten (mount) betyder `matchStartedAt` satt ALLTID "startad i en tidigare session/försök" — `markMatchStarted` körs i simuleringseffekten som ligger EFTER guarden. Färsk match har inget `matchStartedAt` → guarden passerar → simuleringen markerar start. Ingen risk för falsk träff på legitim förstagångsstart.

## Verifieringskrav (rapportera)
1. Finns det redan en anropare av `simulateAbandonedMatch` på LADDNINGS-vägen (gameFlowActions / portal-mount)? Om ja: varför fångar den inte denna fixture? Om nej: guard-fixen är den enda återställningspunkten — bekräfta att den täcker både reload OCH in-app-abandon.
2. Reproducera: starta en match, ladda om sidan mitt i, ladda spelet, gå till match. Förväntat EFTER fix: matchen avgörs av assistenten, inkorgsrad förklarar, nästa match blir spelbar. Ingen loop.
3. StrictMode dubbel-fire (dev): bekräfta att guarden inte dubbel-simulerar (idempotens — `simulateAbandonedMatch` mot redan `completed` fixture ska vara no-op; lägg en `status === 'scheduled'`-check om den inte redan finns).

## Commit
`fix: återställ övergiven match via assistenten istället för soft-lock-loop (reload mid-match)`

---

## BIFOGAT — B1 Sprint 1 status (på record, inte ny order)
B1 Sprint 1 KLAR + pushad: OrtenTab "Anläggning & faciliteter" visar fyra FacilityRow-värden + aktiv build + "Visa trädet ›" → `/game/facility`; FacilityScreen renderar FacilityTree i betrakta-mode; all gammal inline-köp-UI borttagen ur OrtenTab.

**OBSOLET — ersatt av V2-spec.** Texten nedan om "köp kan inte initieras / kommunstöd stryks om den inte behövs" är INAKTUELL. Aktuell plan: `SPEC_B1_FINANSIERING_V2_2026-06-15.md` — finansieringen (kommun/mecenat) ska INTE strykas, den flyttas IN i nya `FacilityNodeDef`-modellen, och gamla modellen fasas ut. §5.2-domen klar (gym + strålkastare portas). Läs V2 + `KORLISTA_CODE_RC.md` för status, inte detta block.

— Opus, 2026-06-14
