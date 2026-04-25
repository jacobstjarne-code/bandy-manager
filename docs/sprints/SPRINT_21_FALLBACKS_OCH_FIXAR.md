# SPRINT 21 — TEKNISKA FALLBACKS & AUDIT-FIXAR

**Typ:** Stabilitet + buggfixar från flödes-audit
**Uppskattad tid:** 4–5h
**Princip:** Var tyst och ärlig — spelaren ska inte veta att något gick snett om det inte är nödvändigt. Hela sprinten handlar om att göra spelet mer robust utan att förändra upplevelsen vid "happy path".

---

## 21A — EventOverlay null-fallback (tyst)

**Problem:** Om `pressConference`-event eller journalist-data saknas, kraschar EventOverlay.

**Lösning:** Ingen visuell fallback. Eventet auto-resolveras tyst.

**Implementation:**

```typescript
// I EventOverlay-komponenten
useEffect(() => {
  if (!event || !journalist) {
    console.warn('[EventOverlay] Missing data, auto-resolving event', { eventId: event?.id })
    // Markera eventet som resolved utan UI
    resolveEvent(event?.id, { skipped: true })
    return
  }
  // ... normal rendering
}, [event, journalist])
```

Spelaren märker inget — eventet försvinner från kön utan modal. Konsol-warning används av oss när vi felsöker.

---

## 21B — HalftimeModal fallback (minimal UI)

**Problem:** Om `generateHalfTimeSummary()` kastar exception, blir det white screen.

**Lösning:** Try/catch runt summary-genereringen. Vid fel, visa minimal fallback-UI.

**Implementation:**

```tsx
// I HalftimeModal.tsx
function HalftimeModal(...) {
  const [summary, setSummary] = useState<HalftimeSummary | null>(null)
  const [error, setError] = useState(false)
  
  useEffect(() => {
    try {
      const s = generateHalfTimeSummary(...)
      setSummary(s)
    } catch (err) {
      console.error('[HalftimeModal] Summary generation failed', err)
      setError(true)
    }
  }, [...])
  
  if (error || !summary) {
    // Minimal fallback
    return (
      <OverlayBackdrop onClose={onContinue}>
        <div className="card-sharp" style={{ textAlign: 'center', padding: 24, maxWidth: 380 }}>
          <p className="text-label">{homeTeam} · {awayTeam}</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)', margin: '8px 0' }}>
            HALVVÄGS
          </h2>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>Du är igång med säsongen.</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Fortsätt för att återgå till dashboard.
          </p>
          <button className="btn btn-primary" onClick={onContinue} style={{ marginTop: 16, minWidth: 200 }}>
            FORTSÄTT
          </button>
        </div>
      </OverlayBackdrop>
    )
  }
  
  // ... normal halvtids-UI
}
```

Rubriken "HALVVÄGS" är samma som normalt — spelaren märker bara att det är mindre statistik, inte att något kraschade.

---

## 21C — beforeunload-varning mid-match

**Problem:** Om spelaren råkar refreshar eller stänger fliken mid-match, förloras pending-state.

**Lösning:** Native browser-dialog som varnar. Aktiveras bara när match pågår.

**Implementation:**

```tsx
// I MatchLiveScreen.tsx
useEffect(() => {
  if (matchDone) return  // ingen varning om matchen är klar
  
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = 'Matchen pågår. Om du lämnar nu spelas den klart utan dig och resultatet sparas.'
    return e.returnValue
  }
  
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [matchDone])
```

Browser visar standarddialog "Lämna den här sidan?" med våra texter. Inte alla browsers visar custom-texten — det är OK, varningen i sig är det viktiga.

Om spelaren ändå lämnar: auto-simulate (Sprint 19A) tar hand om matchen vid nästa dashboard-besök.

---

## 21D — SeasonSummary dubbelnavigering

**Problem från audit:** Både `gameFlowActions` och `pendingScreen` triggar navigation till SeasonSummary — det blir ibland dubbelnavigering.

**Undersök i koden:**
- `gameStore.ts` — sök `setPendingScreen('season-summary')`
- `gameFlowActions.ts` — sök motsvarande navigation

**Lösning:** Välj en mekanism. Troligtvis `pendingScreen` är bäst (redan kopplad till NavigationLock från tidigare sprint). Ta bort duplikatet.

Testa: spela klart säsong, verifiera att SeasonSummary visas en gång.

---

## 21E — Ceremony timer cleanup

**Problem:** `CeremonyCupFinal.tsx` och `CeremonySmFinal.tsx` har `setTimeout`-anrop i `useEffect` utan cleanup. Om komponenten unmountar mitt i ceremony körs timeouten ändå och kan modifiera state på unmountad komponent.

**Lösning:**

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    advanceCeremonyPhase()
  }, 3000)
  return () => clearTimeout(timer)  // ← saknas idag
}, [phase])
```

Gå igenom alla `useEffect` med `setTimeout`/`setInterval` i:
- `CeremonyCupFinal.tsx`
- `CeremonySmFinal.tsx`
- `FinalIntroScreen.tsx`
- `GoldConfetti.tsx`

Lägg till cleanup om saknas.

---

## 21F — Sponsor double-pay på second-pass

**Problem från audit:** Om `recalculateSponsorIncome` körs två gånger samma omgång (t.ex. en gång i roundProcessor, en gång i weekly-decision), betalas sponsor-intäkten dubbelt.

**Undersök:**
- `src/domain/services/sponsorService.ts` — sök `addFinances` eller liknande
- `src/application/useCases/roundProcessor.ts` — sök var sponsor-income kallas

**Lösning:** Idempotens-flagga per omgång:

```typescript
// Spara senast processade omgång
interface SponsorState {
  // ... befintliga
  lastPaidRound: number  // ← ny
}

function payMonthlySponsorIncome(state: GameState, round: number) {
  if (state.sponsorState.lastPaidRound === round) {
    console.warn('[sponsorService] Already paid this round, skipping')
    return
  }
  // ... betala
  state.sponsorState.lastPaidRound = round
}
```

---

## 21G — Transfer window deadline check

**Problem från audit:** Om transfer-fönstret stänger medan spelaren har en pending bid (i modal), kan bidet fortfarande skickas.

**Lösning:** Vid submit av bid, kontrollera att fönstret fortfarande är öppet:

```typescript
function submitTransferBid(bid: TransferBid) {
  if (!isTransferWindowOpen(state)) {
    console.warn('[transferService] Window closed during bid, cancelling')
    showToast('Transferfönstret har stängt. Budet avbröts.')
    return
  }
  // ... skicka bid
}
```

Visa också en icke-störande toast så spelaren förstår varför det inte gick igenom.

---

## 21H — WeeklyDecision cooldown verification

**Problem från audit:** `WEEKLY_DECISION_COOLDOWN = 3` är baserat på *generation-round* inte *resolution-round*. Betyder att en decision som genererades runt 5 och löstes runt 5 fortfarande har cooldown till runt 8 (korrekt), men en som genererades runt 5 och löstes runt 7 har cooldown till runt 8 (fel — borde vara runt 10).

**Undersök:** `weeklyDecisionService.ts`.

**Lösning:** Byt cooldown-start till `resolvedRound` istället för `generatedRound`:

```typescript
interface WeeklyDecision {
  // ...
  resolvedRound?: number  // ← sätts när decision löses
}

function canGenerateDecision(category: string, currentRound: number, history: WeeklyDecision[]): boolean {
  const lastInCategory = history
    .filter(d => d.category === category && d.resolvedRound !== undefined)
    .sort((a, b) => (b.resolvedRound ?? 0) - (a.resolvedRound ?? 0))[0]
  
  if (!lastInCategory) return true
  return currentRound - (lastInCategory.resolvedRound ?? 0) >= WEEKLY_DECISION_COOLDOWN
}
```

---

## 21I — MatchLiveScreen replay-guard

**Problem från audit:** Om spelaren navigerar fram och tillbaka till MatchLiveScreen mid-match, triggas start-sekvensen flera gånger.

**Lösning:** `matchStartedAt`-timestamp på mount:

```tsx
// I MatchLiveScreen.tsx
useEffect(() => {
  const alreadyStarted = state.currentMatch?.matchStartedAt !== undefined
  if (alreadyStarted) {
    // Fortsätt där vi var, ingen omstart
    return
  }
  
  state.currentMatch = {
    ...state.currentMatch,
    matchStartedAt: Date.now(),
  }
  initializeMatch()
}, [])
```

---

## 21J — Kommun engångsstöd cooldown

**Problem från audit:** Kommunens engångsstöd kan triggas flera gånger samma säsong.

**Lösning:** Säsongs-flagga:

```typescript
interface CommunityState {
  // ...
  municipalSupportReceivedSeason: number | null
}

function canReceiveMunicipalSupport(state: GameState): boolean {
  return state.communityState.municipalSupportReceivedSeason !== state.currentSeason
}

function grantMunicipalSupport(state: GameState) {
  if (!canReceiveMunicipalSupport(state)) return
  addFinances(100000)
  state.communityState.municipalSupportReceivedSeason = state.currentSeason
}
```

---

## Acceptanskriterier

- [ ] EventOverlay null-fallback tyst, console.warn loggas
- [ ] HalftimeModal fallback-UI fungerar om summary-generering kraschar
- [ ] beforeunload varnar bara när match pågår
- [ ] SeasonSummary visas exakt en gång efter säsongsslut
- [ ] Alla ceremony timers cleanas korrekt
- [ ] Sponsor-intäkt kan inte betalas dubbelt samma omgång
- [ ] Transfer-bid avbryts om fönstret stängt
- [ ] WeeklyDecision cooldown räknas från resolvedRound
- [ ] MatchLiveScreen återstartar inte vid re-mount mid-match
- [ ] Kommunens engångsstöd triggas max en gång per säsong
- [ ] Inga nya testfel

---

## Filer som ändras

- `src/presentation/components/overlays/EventOverlay.tsx`
- `src/presentation/components/match/HalftimeModal.tsx`
- `src/presentation/screens/MatchLiveScreen.tsx`
- `src/presentation/store/gameStore.ts` (SeasonSummary navigation)
- `src/application/useCases/gameFlowActions.ts` (SeasonSummary navigation)
- `src/presentation/components/match/CeremonyCupFinal.tsx`
- `src/presentation/components/match/CeremonySmFinal.tsx`
- `src/presentation/components/match/FinalIntroScreen.tsx`
- `src/presentation/components/match/GoldConfetti.tsx`
- `src/domain/services/sponsorService.ts`
- `src/application/useCases/roundProcessor.ts`
- `src/domain/services/transferService.ts`
- `src/domain/services/weeklyDecisionService.ts`
- `src/domain/services/municipalService.ts` (om den finns — eventuellt annan fil)
