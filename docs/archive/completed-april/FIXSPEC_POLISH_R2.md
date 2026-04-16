# FIXSPEC: Granska + Dashboard + Taktik — polishomgång 2

---

## FIX 1: Presskonferens-knappar i GranskaScreen (KRITISK)

### Problem
Presskonferens-val i GranskaScreen reagerar inte på klick. Andra events (kiosk, spelarquotes) fungerar.

### Trolig orsak
`resolveEvent()` i gameStore hanterar inte presskonferens-eventets effect-typ. Andra events har `effect.type: 'noOp'`, `'acceptTransfer'` etc. Presskonferensen har troligen `effect: { type: 'pressChoice', value: 6, mediaQuote: '...' }` eller liknande som resolveEvent inte matchar.

### Debug-steg
1. Öppna webbläsarens DevTools → Console
2. Lägg tillfälligt en `console.log` i `handleChoice`:
```typescript
function handleChoice(eventId: string, choiceId: string, choiceLabel: string) {
  console.log('[GranskaScreen] handleChoice:', { eventId, choiceId, choiceLabel })
  const event = pendingEvents.find(e => e.id === eventId)
  console.log('[GranskaScreen] event choices:', event?.choices)
  ...
```
3. Kolla om handleChoice anropas alls (onClick saknas?) eller om resolveEvent kraschar tyst

### Mest sannolika fix
I `eventResolver.ts` (eller gameStore resolveEvent-action), lägg till case för presskonferens:

```typescript
case 'pressChoice':
case 'morale':
case 'press': {
  // Apply morale effect
  const moraleEffect = (choice.effect as any).value ?? 0
  const mediaQuote = (choice.effect as any).mediaQuote ?? ''
  // Update morale for managed players
  const updatedPlayers = state.players.map(p => 
    p.clubId === state.managedClubId
      ? { ...p, morale: Math.min(100, Math.max(0, p.morale + moraleEffect)) }
      : p
  )
  // Store media quote if journalist exists
  // ... update journalist memory
  break
}
```

Alternativt: om presskonferens-events har `effect.type: 'noOp'` men knapptexten visar morale-värden — då ska det redan fungera via resolveEvent's noOp-path. Problemet kan vara att eventet har `choices: []` (tom array) → inga knappar renderas. Kolla `generatePressConference()` output.

**Testa: logga `game.pendingEvents` i console och kolla presskonferensens choices-array.**

---

## FIX 2: Andra matcher — feta rader → markera vinnare

### Problem
Varannan rad i "Andra matcher" är fet. Oklart varför.

### Fix
Byt logik: `fontWeight: relevant ? 600 : 400` → `fontWeight` baserat på vinnare:

```tsx
{otherResults.map(f => {
  const homeWon = (f.homeScore ?? 0) > (f.awayScore ?? 0)
  const awayWon = (f.awayScore ?? 0) > (f.homeScore ?? 0)
  return (
    <div key={f.id} style={{ display: 'flex', alignItems: 'center', padding: '3px 0' }}>
      <span style={{
        flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontWeight: homeWon ? 700 : 400,
        color: homeWon ? 'var(--text-primary)' : 'var(--text-muted)',
      }}>{getClubShort(f.homeClubId)}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', width: 40, textAlign: 'center', flexShrink: 0 }}>
        {f.homeScore}–{f.awayScore}
      </span>
      <span style={{
        flex: 1, fontSize: 11, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontWeight: awayWon ? 700 : 400,
        color: awayWon ? 'var(--text-primary)' : 'var(--text-muted)',
      }}>{getClubShort(f.awayClubId)}</span>
    </div>
  )
})}
```

Ta bort `isRelevantFixture`-logiken — den ger fet text till rivaler och tabellgrannar oavsett resultat, vilket är förvirrande.

---

## FIX 3: Onboarding-hint omgång 2+ — integrera med ATT GÖRA

### Problem
Omgång 2 har lös "Justera träningen — Gå dit →"-rad OVANFÖR nudge-kortet. Fragmenterat.

### Fix
Integrera onboarding-hinten som en nudge i ATT GÖRA-listan istället för ett separat element:

```typescript
// I nudge-genereringen, lägg till onboarding som sista nudge:
if (game.onboardingStep !== undefined && game.onboardingStep <= 4 && nudges.length < 3) {
  const hints: Record<number, { text: string; screen: string; state?: Record<string, unknown> }> = {
    1: { text: 'Justera träningen', screen: 'club', state: { tab: 'training' } },
    2: { text: 'Kolla styrelsens uppdrag', screen: 'club', state: { tab: 'ekonomi' } },
    3: { text: 'Besök Orten', screen: 'club', state: { tab: 'orten' } },
  }
  const h = hints[game.onboardingStep]
  if (h) nudges.push({ text: h.text, screen: h.screen, state: h.state, done: visited.includes(h.screen), color: 'green' })
}
```

Ta bort den separata onboarding-hint-raden (`{!isFirstRound && game.onboardingStep...}`).

---

## FIX 4: Taktikvy — fler inställningar påverkar pitchen

### Problem
Bara mentalitet/formation flyttar prickarna. Bredd, press, anfallsfokus ska också ge synlig effekt.

### Fix
I TacticPreview.tsx, kolla att positionsberäkningen reagerar på ALLA relevanta taktikfält:

```typescript
// Width affects horizontal spread
const widthScale = tactic.width === 'wide' ? 1.2 : tactic.width === 'narrow' ? 0.7 : 1.0
x = centerX + (x - centerX) * widthScale

// Press affects defensive line height
if (isDefender) {
  y += tactic.press === 'high' ? -15 : tactic.press === 'low' ? 15 : 0
}

// Attack focus affects forwards + wide midfielders
if (isForward && tactic.attackingFocus === 'central') {
  x = centerX + (x - centerX) * 0.4  // compress toward center
}
if (isForward && tactic.attackingFocus === 'wings') {
  x = centerX + (x - centerX) * 1.5  // spread wide
}
if (isWideMid && tactic.attackingFocus === 'wings') {
  x = centerX + (x - centerX) * 1.3
}

// Tempo: no visual effect (it's speed, not position)
// Passing: no visual effect (it's style, not shape)
```

Kolla att TacticPreview tar emot hela tactic-objektet som prop, inte bara mentality.

---

## FIX 5: Ohanterade events — carry over

### Problem
Vad händer med events man inte klickar på i GranskaScreen?

### Fix
Events bör INTE försvinna. Om spelaren klickar "Nästa omgång →" utan att hantera alla events:

```typescript
function handleContinue() {
  // Unresolved events carry over — they'll appear on next GranskaScreen
  // or as EventOverlay on dashboard if player ignores them
  clearRoundSummary()
  navigate('/game/dashboard', { replace: true })
}
```

`game.pendingEvents` rensas bara via `resolveEvent`. Om spelaren inte klickar → eventet finns kvar → EventOverlay visar det på dashboard. Det är rätt beteende.

Lägg till en varning om ohanterade events:
```tsx
{pendingEvents.filter(e => !resolvedEventIds.has(e.id)).length > 0 && (
  <p style={{ fontSize: 10, color: 'var(--warning)', textAlign: 'center', margin: '0 0 4px' }}>
    {pendingEvents.filter(e => !resolvedEventIds.has(e.id)).length} ohanterad{pendingEvents.filter(e => !resolvedEventIds.has(e.id)).length > 1 ? 'e' : ''} händelse{pendingEvents.filter(e => !resolvedEventIds.has(e.id)).length > 1 ? 'r' : ''} — du kan hantera dem senare
  </p>
)}
```

Visa ovanför CTA-knappen.

---

## FIX 6: Pep-talk — bättre citat

### Problem
Pep-talk-texterna är mesiga och repetitiva.

### Fix
Sök inte på nätet — jag levererar citaten direkt. Byt/komplettera i `pressConferenceService.ts` eller `pepTalkService.ts` (eller var de genereras):

### Klassiker (anpassade till bandy):
```typescript
const PEP_TALKS_WIN = [
  '"Vi vann inte för att vi var bäst. Vi vann för att vi ville mest." — Sättet vi kämpade idag.',
  '"Tre poäng. Inget snack. Nu fokuserar vi framåt."',
  '"Det fanns ett beslut i omklädningsrummet före nedsläpp. Ni valde rätt."',
  '"Jag ser spelare som tror på varandra. Det är farligare än talang."',
  '"Bra matcher vinner man med fötterna. Stora matcher vinner man med huvudet."',
]

const PEP_TALKS_LOSS = [
  '"Vi förlorade en match. Inte vår identitet. Tillbaka på isen imorgon."',
  '"Ingen kommer ihåg den här matchen i mars. Men de kommer ihåg hur vi reagerade."',
  '"Ibland lär man sig mer av en förlust än tio vinster. Frågan är om ni har modet att lyssna."',
  '"Det enda jag inte accepterar är att ge upp. Och det gjorde ni inte idag."',
  '"Vi var inte tillräckligt bra. Punkt. Nu jobbar vi."',
]

const PEP_TALKS_DRAW = [
  '"En poäng kan vara guld eller skit. Beror på vad vi gör med den."',
  '"Vi hämtade en poäng borta. Minns det i mars när det skiljer ett poäng."',
  '"Inte nöjd. Men inte besviken. Det är mellanrummet där lag formas."',
]

const PEP_TALKS_CRISIS = [
  '"Ingen räddare kommer. Vi är räddarna. Varje omgång, varje duell."',
  '"Jag har sett lag i sämre läge vända. Men aldrig lag som slutade tro."',
  '"Om ni vill ha en tränare som ljuger och säger att allt är bra — hämta honom. Jag säger sanningen: vi måste bli bättre."',
]

const PEP_TALKS_TOP = [
  '"Vi är där. Men att komma dit och stanna är två helt olika saker."',
  '"Varje lag under oss jagar. Vi kan inte slappna av en sekund."',
  '"Njut inte ännu. Njut i mars."',
]
```

---

## FIX 7: TabellScreen — tightare spacing

### Problem
Tabell-skärmen (TabellScreen) har generösare spacing än övriga skärmar.

### Fix
Applicera samma regler som DashboardScreen:
- Card padding: `10px 12px` (inte 14px 16px)
- Row padding: `6px 0` (inte 8px 0)
- Gap: `4px` mellan rader
- Sektionslabels: fontSize 8, letterSpacing 2px

Gå igenom TabellScreen.tsx och strama åt.

---

## ORDNING

1. Fix 1 (presskonferens) — debug + fix, kritisk
2. Fix 3 (onboarding integrerad) — UI
3. Fix 2 (andra matcher vinnare bold) — UI
4. Fix 4 (taktikvy fler effekter) — feature
5. Fix 5 (ohanterade events) — UX
6. Fix 6 (pep-talk) — content
7. Fix 7 (tabellspacing) — polish

Committa per fix eller batcha 2+3 och 5+6.
