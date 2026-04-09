# FIXSPEC: Omgångscykeln — polishomgång

Baserat på playtest 9 april. Kör i ordning. npm run build efter varje.

---

## FIX 1: Granska — presskonferens-knappar klickbara

### Problem
Event-choices (presskonferens-citaten) i GranskaScreen går inte att klicka.

### Fix
Knapparna måste anropa `resolveEvent(eventId, choiceId)`. Kolla att:
1. GranskaScreen har tillgång till `resolveEvent` från gameStore
2. Varje choice-knapp har `onClick={() => resolveEvent(event.id, choice.id)}`
3. Efter resolve: eventet försvinner från `game.pendingEvents` → kortet kollapsar

Trolig bugg: knapparna renderas men saknar onClick, eller eventets choices har fel format.

---

## FIX 2: Granska — "Se fullständig rapport" → "Se fullständig matchrapport"

Ändra texten. Spelaren är redan i en rapport-liknande vy, "rapport" är tvetydigt.

---

## FIX 3: Granska — "Andra matcher" grupperingar

### Problem
Resultatraderna har färgade staplar till vänster om lagnamnen. Oklart vad de betyder.

### Fix
Om staplarna indikerar hemmalag (koppar = managed club's nästa motståndare, grå = övriga): lägg till en legend-rad ovanför. Alternativt: ta bort staplarna och använd bold för managed club's namn istället. Det enklare alternativet.

---

## FIX 4: Dashboard — tydligare rubrik på agendadelen

### Problem
"Inför matchen" är subtilt. Borde tydligare signalera att det är en att-göra-lista.

### Fix
Byt "INFÖR MATCHEN" till "ATT GÖRA". Behåll "N av M klart" till höger.

---

## FIX 5: Nudge-navigering — förläng kontrakt

### Problem
"Förläng kontrakt: Niklas Järvinen" navigerar till /game/transfers (marknad) istället för kontraktsförnyelse.

### Fix
Navigera till `/game/transfers` med state `{ tab: 'squad', highlightPlayerId: player.id }` eller bättre: navigera till `/game/squad` med state `{ showRenew: player.id }` om det finns en renew-modal som kan öppnas direkt. Om inte: navigera till `/game/squad` (spelaren hittar spelaren i truppen).

---

## FIX 6: Nudge-navigering — styrelseuppdrag "Fan mood"

### Problem
"Styrelseuppdrag: Fan mood ska nå 70" navigerar till /game/club med tab 'training'. Fan mood påverkas av orten/community, inte träning.

### Fix
I DashboardNudges.tsx, ändra board objective-nudgens onClick:
```typescript
onClick: () => navigate('/game/club', { state: { tab: 'orten' } })
```

---

## FIX 7: Orten — text slår i knapp

### Problem
"Installera konstfrusen is"-texten krockar med en knapp i orten-vyn.

### Fix
Kolla `FacilityProject`-rendering i ClubScreen/OrtenTab. Ge texten `paddingRight` eller se till att knappen har `flexShrink: 0` och texten har `flex: 1, minWidth: 0, overflow: hidden, textOverflow: ellipsis`.

---

## FIX 8: Dagboken — P19-briefing actionable

### Problem
"🎓 Tobias Dal (P19) visar A-lagsklass. Styrka 19." — Styrka 19 är meningslöst lågt (CA 19 av 100). Och texten är inte länkad — spelaren vet inte vad hen ska göra.

### Fix
A) Visa bara spelare med CA ≥ 35 (realistisk A-lagsnivå). Ändra villkoret i `dailyBriefingService.ts`:
```typescript
// Bara visa om spelaren faktiskt har A-lagsklass
const prospect = youthPlayers.find(p => p.currentAbility >= 35)
```

B) Gör texten klickbar → navigera till `/game/club` med `{ tab: 'akademi' }`.

C) Ändra texten till: "🎓 {namn} (P19) börjar visa A-lagsklass — befordra?" så spelaren förstår att det finns en handling att ta.

---

## FIX 9: Cupen visas två gånger

### Problem
Cup-kortet visas två gånger i dashboard inför omgång 2.

### Fix
Kolla DashboardScreen — troligen renderas CupCard BÅDE i enraders-sektionen (🏆 CUPEN) OCH som en expanded CupCard längre ner. Ta bort en av dem.

Logik: om cupen har en expanded card (med motståndare, hemma/borta etc.) → visa BARA den. Visa INTE enraders-kortet samtidigt.

```typescript
const showExpandedCup = game.cupBracket && !cupEliminated && nextCupFixture
// I enraders-sektionen:
{!showExpandedCup && game.cupBracket && (
  <OneLineCard label="🏆 CUPEN" info="..." />
)}
// Expanded cup card separat:
{showExpandedCup && <CupCard ... />}
```

---

## FIX 10: Match — paus vid slutsignal

### Problem
Vid full tid scrollar händelserna förbi utan paus. Spelaren kan inte läsa matchen. Specen sa att det ska pausa vid slutsignal med möjlighet att scrolla.

### Fix
I MatchLiveScreen, vid `matchDone = true`:

1. **Stoppa auto-scroll.** Kommentarsflödet stannar.
2. **Infoga en "slutsignal"-kommentar** i feeden:
```typescript
// Lägg till en sista entry i displayedSteps:
<div style={{
  padding: '12px 16px', textAlign: 'center',
  borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
  margin: '8px 0',
}}>
  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
    Domaren blåser av!
  </p>
  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
    {/* 2-3 raders sammanfattning */}
    {generateMatchSummary(homeScore, awayScore, managedIsHome, keyMoments)}
  </p>
</div>
```

3. **Visa "Se resultat →"-knapp** UNDER feeden (inte overlay):
```tsx
<button
  onClick={() => navigate('/game/review', { replace: true })}
  className="btn btn-primary"
  style={{ width: '100%', padding: '14px', margin: '8px 0' }}
>
  Se resultat →
</button>
```

4. **Spelaren kan scrolla upp** och läsa hela matchen i lugn och ro.
5. **MatchDoneOverlay visas INTE** längre — ersätts av in-feed slutsignal + knapp.

`generateMatchSummary()` — enkel funktion:
```typescript
function generateMatchSummary(home: number, away: number, managedIsHome: boolean, steps: MatchStep[]): string {
  const myScore = managedIsHome ? home : away
  const theirScore = managedIsHome ? away : home
  const totalGoals = home + away
  if (myScore > theirScore + 2) return 'Dominant insats. Tre poäng utan diskussion.'
  if (myScore > theirScore) return 'Tre viktiga poäng. Bra insats av laget.'
  if (myScore === theirScore) return 'Rättvis poängdelning. Båda lagen hade sina chanser.'
  if (myScore < theirScore - 2) return 'Tung dag. Mycket att jobba på inför nästa match.'
  return 'Snävt. Det kunde gått åt båda hållen.'
}
```

---

## FIX 11: Taktikvy — visuell uppgradering (STÖRRE)

### Koncept
Taktikvyn är funktionell men statisk. Den borde VISA effekten av valen visuellt.

Lägg till en **mini-pitch** högst upp i TacticStep som reagerar på taktikval:

```
         ┌─────────────────────┐
         │    ○   ○   ○        │  ← anfallare
         │      ○   ○          │  ← mittfält
         │  ○    ○    ○        │  ← halvback
         │    ○   ○   ○   ○    │  ← backar
         │         ●           │  ← MV
         └─────────────────────┘
```

- **Mentalitet Offensiv** → prickarna dras uppåt (anfallarna nära motståndarmål)
- **Mentalitet Defensiv** → prickarna dras nedåt (kompakt försvar)
- **Bredd Smal** → prickarna klumpar ihop centralt
- **Bredd Bred** → prickarna sprider ut sig mot kanterna
- **Press Hög** → hela formationen skjuts uppåt
- **Anfallsfokus Kanter** → ytterhalvarna breddar sig

Det är 11 prickar (5-3-3 eller 4-3-2-1 beroende på formation) som animerar mjukt (`transition: all 0.3s`) när spelaren ändrar taktik. Ger DIREKT feedback.

Pitchen: 200px hög, svag grön/vit bakgrund (isyta), prickar som cirklar (12px, koppar). Kan vara en SVG.

Implementera som `TacticPreview.tsx` i `components/match/`. Placera ovanför SPELPLAN-kortet.

### Alternativ (enklare)
Om mini-pitch är för komplex: lägg till **konsekvens-etiketter** under varje val:

```
Mentalitet: [Offensiv] ← vald
  ↳ +15% skottchanser · -10% försvar · Hög energiförbrukning
```

Italic, 10px, color `var(--accent)`. Visar vad valet faktiskt GÖR mekaniskt. Finns redan delvis ("Fokus på anfall. Fler chanser men sårbarare bak.") men kan bli mer specifikt.

---

## ORDNING

1. Fix 1 (presskonferens klickbar) — kritisk bugg
2. Fix 10 (paus vid slutsignal) — stor UX-förbättring
3. Fix 9 (cup dubbel) — visuell bugg
4. Fix 5+6 (nudge-navigering) — snabba fixes
5. Fix 4 (rubrik) — text
6. Fix 2 (rapport-text) — text
7. Fix 7 (text overflow) — CSS
8. Fix 8 (P19 briefing) — logik + text
9. Fix 3 (matchresultat grupperingar) — design
10. Fix 11 (taktikvy) — SIST, större feature

Committa per fix eller batcha 3-5+6 och 2+4.
