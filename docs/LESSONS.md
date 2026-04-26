# LESSONS

Återkommande buggar och mönstret som orsakar dem. Läs vid sessionstart.
Lägg till ny lärdom när samma fel uppträder 2+ gånger.

Format per lärdom: Mönster (symptom), Rotorsak (varför), Fix, Känn igen (signal).

---

## 1. SVG width/height-attribut skriver över container

**Mönster:** Porträtt eller ikoner klipps av i cirkel-wrappers — bara en del syns.

**Rotorsak:** Hårdkodat `width="X" height="X"` på `<svg>`-elementet dominerar över CSS-storleken från wrapper-diven. SVG:en renderas i sin "egna" storlek och klipps av overflow: hidden.

**Fix:** Använd `viewBox` för koordinatsystemet, `preserveAspectRatio="xMidYMid meet"` för centrering, och `style="width:100%;height:100%;display:block"` för att följa container:
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"
  preserveAspectRatio="xMidYMid meet"
  style="width:100%;height:100%;display:block">
```

**Känn igen:** Visuell bugg där bara en del av en SVG syns, oftast övre vänstra hörnet av canvasen.

**Historik:** Porträtt-buggen uppträdde 3 gånger innan rotorsaken hittades.

---

## 2. Flex-child scrollar inte utan `minHeight: 0`

**Mönster:** Listor klipps av i botten. `overflow: auto` + `flex: 1` fungerar inte.

**Rotorsak:** Flexbox default har `min-height: auto` på flex-children, vilket förhindrar overflow. Child kan inte bli mindre än sitt innehåll, så scroll triggar aldrig.

**Fix:** Lägg till `minHeight: 0` på flex-child-containern som ska scrolla:
```tsx
<div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
  {/* lång content */}
</div>
```

**Känn igen:** Container med `flex: 1` och `overflow: auto` där scroll inte triggar.

**Historik:** GranskaScreen (Spelare-flik) och PlayerModal — två separata fall samma sprint. Tredje gången (2026-04-22): `GameGuard` hade `overflowY: 'auto'` på sin Outlet-wrapper → child med `height: 100%` fick naturlig contenthöjd istället för containerhöjden → intern scroll triggade aldrig. Fix: `overflow: 'hidden'` på GameGuard-wrappern. Variant på samma mönster: `overflowY: auto` i wrapper + `height: 100%` i child = child tror att "100%" är innehållets naturliga höjd. **Regel: wrapper som ska fungera som klipgräns för inre scroll ska ha `overflow: hidden`, inte `overflowY: auto`.**

---

## 3. Inline funktioner i useEffect-deps ger infinite loop

**Mönster:** "Maximum update depth exceeded" (React error #185). Appen kraschar under en interaktion.

**Rotorsak:** Förälder skickar `onX={() => ...}` som skapar ny funktion varje render → useEffect ser ändrad dep → kör effect → setState → re-render → ny funktion → loop.

**Fix:** Använd `useRef` för callback-propen:
```tsx
const onTimeoutRef = useRef(onTimeout)
useEffect(() => { onTimeoutRef.current = onTimeout }, [onTimeout])

useEffect(() => {
  // använd onTimeoutRef.current() istället för onTimeout()
}, [phase, timerSeconds])  // ingen onTimeout i deps
```

**Känn igen:** Error #185, ofta i komponenter med timer eller auto-resolve-logik.

**Historik:** InteractionShell — upptäcktes i playtest efter Sprint 20.

---

## 4. "Klart" utan UI-verifiering missar luckor

**Mönster:** Sprint rapporteras klar men flera delar saknas i appen. Upptäcks först vid playtest.

**Rotorsak:** "Kod skriven" tolkas som "funktion levererad". Komponent kan existera som fil utan att importeras, utan att få props, eller utan att renderas i DOM.

**Fix:** Obligatorisk självaudit efter varje sprint — öppna appen, navigera till varje ny vy, beskriv i ord vad som syns. Skriv `docs/sprints/SPRINT_XX_AUDIT.md`.

**Känn igen:** Spec har N delar, bara K nämns i commit-meddelandet. Eller: audit-grep visar att filer saknas.

**Historik:** Sprint 19 — Taktiktavlan, ExpectationsCard, klack-leather-bar, animationer alla rapporterade klara men fanns inte.

---

## 5. Symptomfix istället för rotorsak

**Mönster:** Samma bugg återkommer flera playtest-rundor trots "fix".

**Rotorsak:** Fixen adresserar symptomet ("jag justerade koordinater") utan att förstå varför det gick fel från början ("alla y-värden hamnade i samma range eftersom formeln var `y = GOAL_Y + 20 + r2 * 50`").

**Fix:** Innan kod ändras — formulera rotorsaken i en mening. Om du inte kan formulera den, läs mer kod innan du rör något. Commit-meddelande ska innehålla rotorsak, inte bara fix:
```
fix: shotmap prickar klumpade — rot: nextPos('goal') y-range var
20-70 istf 10-90 så alla hamnade i målområdet
```

**Känn igen:** Commit som säger "fixed X" utan att förklara varför X var fel. Eller: samma bugg rapporteras 2+ gånger.

**Historik:** Shotmap-spridning (2 iterationer), porträtt-koordinater (3 iterationer).

---

## 6. Spec-dupliceringar bygger på varandra

**Mönster:** Samma information visas på flera skärmar för att olika specar lade till den oberoende av varandra.

**Rotorsak:** När specen skrivs, kontrolleras inte om informationen redan finns någonstans. "Lägg till konsekvenser-ruta i Analys" — men konsekvenser finns redan i Förlopp.

**Fix:** Innan ny feature specas — grep efter nyckelord i existerande kodbas. Innan ny info läggs till en vy — kolla om samma info finns i annan vy.

**Känn igen:** Spelaren scrollar genom två olika skärmar och ser samma siffror.

**Historik:** GranskaScreen Analys-steg — tabellplacering/ekonomi/bygdens puls dubblerade från Förlopp-steg.

---

## 7. useEffect-dep på state som effecten själv skriver till

**Mönster:** React error #185 under live-match-interaktioner (hörna, straff, kontring, frislag). Kraschar specifikt när `outcome` sätts.

**Rotorsak:** `useEffect` med `[outcome, phase]` i deps anropade `setPhase('locked')` — vilket ändrar `phase` → triggrar om effecten → `setPhase` igen → loop. Inte samma som lärdom 3 (inline-funktion) — här är det lokalt state i deps-arrayen som effecten själv muterar.

**Fix:** Ta bort allt state som effecten skriver till från deps-arrayen. Behåll bara den externa triggern:
```tsx
// Fel — phase är i deps men setPhase('locked') ändrar phase
useEffect(() => {
  if (!outcome) return
  setPhase('locked')
  const t = setTimeout(() => setPhase('revealed'), 600)
  return () => clearTimeout(t)
}, [outcome, phase])

// Rätt — bara den externa triggern
useEffect(() => {
  if (!outcome) return
  setPhase('locked')
  const t = setTimeout(() => setPhase('revealed'), 600)
  return () => clearTimeout(t)
}, [outcome])
```

**Känn igen:** Error #185 i kombination med `useState` + `useEffect` där samma state-variabel finns i deps OCH skrivs till inuti effecten. Kontrollera alla interaktionskomponenter (CornerInteraction, PenaltyInteraction, etc.).

**Historik:** Alla fyra interaktionskomponenter hade `[outcome, phase]` — fixades i Sprint 22.

---

## 8. Zustand-selektor returnerar nytt objekt varje render

**Mönster:** Komponent re-renderas vid varje store-uppdatering trots att det visade värdet inte ändrats. Kan eskalera till loop-problem eller märkbar lagg.

**Rotorsak:** Zustand använder `Object.is` för att jämföra selektor-output. `useGameStore(s => ({ locked: !!, reason: s... }))` skapar ett nytt objekt-literal varje anrop → `Object.is({}, {}) === false` → re-render.

**Fix:** Returnera primitives direkt från selektorn och bygg det sammansatta värdet utanför:
```tsx
// Fel — nytt objekt varje render
const { locked, reason } = useGameStore(s => ({
  locked: !!s.game?.pendingScreen,
  reason: s.game?.pendingScreen ?? null,
}))

// Rätt — primitives, stabila referenser
const pendingScreen = useGameStore(s => s.game?.pendingScreen ?? null)
const locked = !!pendingScreen
const reason = pendingScreen ? (REASON_MAP[pendingScreen] ?? 'Slutför pågående flöde') : null
```

**Känn igen:** `useGameStore(s => ({ ... }))` med objekt-literal. Letaefter i hooks som används i ofta-renderande komponenter (BottomNav, headers, wrappers).

**Historik:** `useNavigationLock` i BottomNav — bidrog till React #185 i Sprint 22.

---

## 9. Sticky-element flödar ovanpå modal-innehåll

**Mönster:** Knapprad eller footer syns utanpå ett modalt kort — inte förankrad till kortet, ser felfixad ut som ett floating-element.

**Rotorsak:** `position: sticky` med `bottom: X` inuti en scrollbar overlay placerar elementet relativt till scroll-containern, inte till det visuella kortet. Ser ut som att det "hänger i luften" utanpå kortet.

**Fix:** Flytta in elementet som normal flow-del av kortets scrollbara innehåll. Ta bort `position: sticky` och `bottom`-värdet. Om det måste stanna synligt — lägg det *utanför* scroll-diven men *inuti* kortets wrapper, inte med sticky:
```tsx
// Fel — sticky inuti overflowY: auto
<div style={{ overflowY: 'auto' }}>
  {/* ...innehåll... */}
  <div style={{ position: 'sticky', bottom: 60 }}>
    <button>Prata med spelaren</button>
  </div>
</div>

// Rätt — normal flow, scrollar med innehållet
<div style={{ overflowY: 'auto' }}>
  {/* ...innehåll... */}
  <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px' }}>
    <button>Prata med spelaren</button>
  </div>
</div>
```

**Känn igen:** `position: sticky` inuti `overflowY: auto`-container. Fråga alltid: "Ska detta scrolla med innehållet?" Om ja — normal flow. Om nej — placera utanför scroll-diven.

**Historik:** PlayerCard "Prata med spelaren"-footer — fixades efter playtest-feedback Sprint 23.

---

## 10. `as`-cast till enum från sträng — bypassar TypeScript-skyddet

**Mönster:** TypeError vid runtime: "Cannot read properties of undefined (reading 'X')" där X är en property på en map-lookup (t.ex. `ARCHETYPE_MULTIPLIERS[archetype][attr]`). Felet uppstår långt från där rotorsaken ligger.

**Rotorsak:** Någon har skrivit `'MinString' as MinEnum` istället för att använda enum-värdet direkt. TypeScript godtar detta utan varning — as-cast är en "litar på mig"-assertion, inte en check. Vid runtime är strängen INTE ett enum-värde, bara en vanlig sträng som inte matchar någon key i parallella map-konstanter.

Specifikt fall: `PlayerArchetype.TwoWaySkater = 'twoWaySkater'` (camelCase enum-värde), men två callsites hade hardkodat `'TwoWaySkater' as PlayerArchetype` (PascalCase sträng). `ARCHETYPE_MULTIPLIERS['TwoWaySkater']` = undefined, sen försök läsa `.skating` på undefined = krasch.

**Fix:** Ersätt rå-stringen med enum-värdet:
```ts
// Fel
archetype: 'TwoWaySkater' as PlayerArchetype

// Rätt
archetype: PlayerArchetype.TwoWaySkater
```

Plus: defensiv guard i map-lookup med console.warn så framtida diskrepans rapporteras tyst istället för att krascha.

**Känn igen:** `as EnumName`-mönster i kod. Särskilt farligt när enum-värdena är camelCase men utvecklare skriver PascalCase strängar av gammal vana (eller tvärtom).

**Grep-kommando för jakt:**
```bash
grep -rn "' as \(PlayerArchetype\|PlayerPosition\|ClubStyle\|TacticMentality\)" src/ --include="*.ts" --include="*.tsx"
```

**Historik:** Hittat av stress-test-infrastruktur 2026-04-20 (BUG-STRESS-01). 2 callsites: `seasonEndProcessor.ts:890` och `matchSimProcessor.ts:35`. Fixades i Sprint 22.6.

---

## 11. [PLAYOFF] completedThisRound loggas tom upprepat — möjlig dubbelprocessning

**Mönster:** `[PLAYOFF] Series X: 3-0, winnerId=clubY, completedThisRound: ` (tom) loggas 5-8 gånger per serie efter att serien redan är klar (winnerId satt).

**Rotorsak:** Ej undersökt. Sannolikt att `advanceToNextEvent` anropas på fixture-matchdays som tillhör en redan avslutad serie, och playoff-koden körs men hittar inget att göra (completedThisRound = tom). Inga konsekvenser synliga i speldata.

**Känn igen:** Upprepade identiska PLAYOFF-loggrader med tom `completedThisRound` direkt efter en seriseger.

**Historik:** Observerat i stress-test baseline Sprint 22.6. Inte fixat — potentiell bugg, låg prio.

---

## 12. Auto-play-scenarios behöver safety net

**Mönster:** Funktioner som antar aktivt mänskligt ingripande (transfers, kontraktsförlängningar, rekrytering) degraderar gradvis spelet i auto-play (stress-test, passiva spelare) tills invariant-krasch.

**Rotorsak:** Replenishment-loopen i `seasonEndProcessor` skippade explicit managed club (`if (club.id === game.managedClubId) return club`). AI-klubbar fick kompensation varje säsong; managed club aldrig. Kontraktsexpiry + retirements tömde truppen −5 till −9 spelare/säsong utan påfyllning.

**Fix:** Definiera "minimum viable state" (trupp < 14 = kritisk) och auto-kompensera vid underskridning. Managed club får safety-net till 14 (bandy-minimum: 11 starter + 3 reserver). Inte 20 som AI — spelaren ska fortfarande känna press att rekrytera upp till full trupp.

**Känn igen:** Stress-test visar gradvis degradering 2–3 säsonger i. Trupp-storlek minskar varje säsong med ingen uppgång. `positionCoverage` eller `squadSize` invariant-kraschar vid säsong 2–4.

**Historik:** Sprint 22.7 (BUG-STRESS-02). Fixades med safety-net cap=14 + position-aware replenishment.

---

## 13. Fix-villkor kan missa edge-case där fixen inte triggas

**Mönster:** En fix löser 90% av fallen. Resterande 10% är ett scenario där fix-villkoret inte uppfylls — och det scenariot orsakar samma bugg igen.

**Rotorsak:** Sprint 22.7 lade `if (squadSize >= target) return club` — korrekt för total-storlek men ignorerar position-obalans. AI-transfers kan ta bort forwards från en klubb som har 20+ spelare totalt. Replenishment triggas aldrig (stopp-villkoret slår till), forward-count nås ≠ minimum.

**Fix:** Separera triggers. `needsMore = squadSize < target` OCH `needsRebalance = any position < minimum`. Exit bara om `!needsMore && !needsRebalance`. `needed = max(size-shortfall, position-shortfall)`.

**Känn igen:** Stress-test: positionCoverage-kraschar kvarstår men sker nu senare (säsong 5-9 istf 2-3). Positiv progress men inte 0. Mönster: "fix reducerar kraschfrekvens men eliminerar inte" = fix-villkor för brett eller för smalt.

**Check att göra efter varje fix:** Identifiera minst ett scenario där fixen INTE triggas och verifiera att det scenariot inte orsakar ny bugg.

**Historik:** Sprint 22.8 (BUG-STRESS-03). `positionCoverage: 0 violations` efter fix.

---

## 14. Asymmetriska state-transitions mellan liga och cup

**Mönster:** En status-transition som är giltig för ligamatcher introduceras generellt och appliceras även på cup-knockout. Buggen syns först säsonger senare när cup-matchen stöter på transitionen.

**Rotorsak:** Väderavbokning sätter `status: Postponed` på fixtures. Ligamatcher klarar `Postponed` — poängen väntar, matchen räknas inte. Cup-knockoutmatcher KAN inte — de måste ha en vinnare för att bracket ska fortsätta. En `Postponed` cup-match orphanar bracketen permanent: `winnerId` förblir `null`, `generateNextCupRound` triggas aldrig, invariant `cupBracket` kraschar.

**Fix:** Explicit fixture-typ-villkor vid state-transitions. Väder-cancel fick `&& !fixture.isCup`. Cup-matcher spelas alltid oavsett väder.

**Känn igen:** Ny feature (väder, skador, utvisningar, force majeure) som lägger till state-transitions på fixtures. Fråga alltid: "Hur hanteras detta i cup-knockout där varje match MÅSTE ha vinnare?" Farliga states för cup: `postponed`, `cancelled`, `abandoned`. Kontrollera mot `generateNextCupRound` och `advancePlayoffRound` — båda förutsätter `winnerId` satt.

**Historik:** Sprint 22.10 (BUG-STRESS-04). `cupBracket: 0 crashes` efter fix. 100/100 säsonger i 10×10.

---

## 15. Managed-gated kodblock kör inte i stress-test

**Mönster:** En motor-ändring mäts i stress-testet men ger mycket mindre utslag än förväntat. Orsak: logiken ligger inne i ett `if (managedIsHome !== undefined)`-block som inte aktiveras i headless-körningar.

**Rotorsak:** `matchCore.ts` har historiskt haft logik skriven för managed-klubbens perspektiv (narrativ, UX-triggar). När motorfysik konsoliderades i samma block stannade grinden kvar. Stress-testet kör headless utan managed klubb → hela blocket överhoppat → fysik-ändringar triggar aldrig i mätning. Dessutom bör fysiken tekniskt vara per lag, inte per match, eftersom hemma och borta kan vara i olika lägen samtidigt.

**Fix:** Bryt ut fysik-logiken ur managed-grinden och beräkna per lag. Exempel från Sprint 25a.2:
```ts
// Fel — hela blocket hoppas över i stress-test
if (step >= 30 && managedIsHome !== undefined) {
  const managedScore = managedIsHome ? homeScore : awayScore
  const mode = getSecondHalfMode(managedScore, opponentScore, step, matchPhase)
  // ... applicerar mode globalt
}

// Rätt — per-lag, alltid aktivt
if (step >= 30) {
  const homeMode = getSecondHalfMode(homeScore, awayScore, step, matchPhase)
  const awayMode = getSecondHalfMode(awayScore, homeScore, step, matchPhase)
  // ... applicerar respektive mode på respektive lags attack
}
```

**Känn igen:** En ändring ska ge X procents effekt men stress-test visar <X/3. Leta efter `managedIsHome`-grinden i matchCore.ts runt det ändrade området. Samma mönster kan finnas i andra engines som byggts med en "hero-perspektiv"-historia.

**Historik:** Sprint 25a ändrade tre konstanter; bara en (trailingBoost) körde i stress-testet eftersom de andra två satt innanför grinden. Upptäcktes genom avvikelse mätt-vs-förväntat effekt. Sprint 25a.2 bryt ut per-lag.

---

## 16. Missledande enum-namn gömmer tracking-buggar

**Mönster:** Ett mätvärde ligger nära noll trots att motorn observerbart genererar händelsen. Orsak: loggningskoden filtrerar på fel enum-namn eftersom det faktiska enum-värdet har ett namn som inte passar fenomenet.

**Rotorsak:** Bandy har 10-minuters utvisning, inte rött kort. Men `MatchEvent`-typen ärvdes från ett ramverk och behöll `MatchEventType.RedCard` som enum-värde även för bandy-utvisningar. Mätkod i stress-test filtrerade på `MatchEventType.Suspension` (intuitivt namn för utvisning) som inte existerar → 0 utvisningar loggade trots att motorn genererade dem.

**Fix:** När ett missledande enum-namn upptäcks, lägg alltid en kommentar vid användningspunkten:
```ts
} else if (ev.type === MatchEventType.RedCard) {
  // Bandy uses 10-min suspensions (MatchEventType.RedCard in matchCore.ts)
  suspensions.push({ minute: ev.minute, team })
}
```

Långsiktig fix: byt enum-värdet till `Suspension` och migrera alla användningspunkter. Kortare väg om tidspress: kommentarer på båda sidor (emit + consume) så nästa utvecklare inte missar det.

**Känn igen:** Ett gap mellan "vad motorn borde göra" och "vad mätningen visar" som är exakt 0 eller nära 0. Första hypotes: tracking-bugg, inte motor-bugg. Leta efter enum-filter i loggkällan och jämför mot de enum-värden motorn faktiskt emitterar.

**Historik:** Sprint 24.1 (post-Sprint-24). `avgSuspensionsPerMatch` loggades som 0.00 trots att motorn triggade utvisningar. Filtrering på icke-existerande `MatchEventType.Suspension`. Fixades genom att filtrera på `RedCard` + kommentar.

---

## 17. Fördelning utan normalisering ljuger

**Mönster:** Klubbdata visar sned fördelning (t.ex. "X% av utvisningar sker vid ledning") och man drar slutsatsen att fenomenet är situations-känsligt. Men det är tid-i-situation-artefakt: topplag är i ledning 70% av tiden och får automatiskt 70% av sina utvisningar där.

**Rotorsak:** Rå procentfördelning utan normalisering mot tillgänglig tid. En siffra "54% av utvisningar vid ledning" betyder ingenting tills man vet hur mycket tid laget tillbringar i varje läge.

**Fix:** Alltid normalisera mot tid-i-tillstånd innan slutsatser om situations-känslighet dras. Format:
```
Ledning    X minuter    Y utvisningar    Z per 1000 min    Relation 1.0x
Jämnt      X minuter    Y utvisningar    Z per 1000 min    Relation 0.Xx
Underläge  X minuter    Y utvisningar    Z per 1000 min    Relation 1.0x
```
Relation nära 1.0x i alla rader → situationen påverkar inte frekvens. Stora avvikelser → verklig situations-känslighet.

**Känn igen:** Fördelningsdata utan nämnaren. "X procent av Y sker vid Z" utan "av total tid Z tas W procent av matchen". Kräver att nämnaren görs explicit innan tolkning.

**Historik:** Sprint 24.2. Klubbrapporter visade 54% utvisningar vid ledning för Nässjö (topplag, 66% vinstprocent). Hypotes: domarbias. Efter normalisering: 22.5/22.5/19.6 per kmin för ledning/underläge/jämnt — nästan jämnt. Hypotes förkastad. Infrastruktur för normalisering i SCORELINE_REFERENCE.md.

---

## 18. Mellanstegs-procent istället för absolutfrekvens

**Mönster:** En multiplikator beräknas via procent-andelar i flera steg. Resultatet ser rimligt ut men introducerar avrundnings- och definitionsfel.

**Rotorsak:** "22.5% av straffar faller i minut 75-89 som är 17% av speltid → 1.35x baseline" ser logiskt ut men:
- 75-89 är 15 av 90 minuter = 16.7%, inte 17%
- "17%" är redan en avrundning som bakas in i multiplikatorn
- 22.5/17 = 1.32, 22.5/16.7 = 1.35 — olika värden beroende på vilken approximation

**Fix:** Vid kalibreringsvärden som går direkt in i motorn, räkna multiplikatorer från absolutfrekvens i minuter, inte mellanstegs procent:
```
// Fel
const peakMod = 22.5 / 17  // 1.32 — fel 17 i nämnaren

// Rätt
const peakFraction = 0.225             // 22.5% av straffar
const peakMinutesPerMatch = 15         // minut 75-89
const baselineFraction = peakMinutesPerMatch / 90  // 0.1667
const peakMod = peakFraction / baselineFraction    // 1.35
```

**Känn igen:** Kalibreringsvärde som ser rimligt ut men härleds från procentuella mellansteg. Misstänk alltid att någon av procentsatserna är avrundning.

**Historik:** Sprint 24.2-rapport skrev "17%" som speltid-andel för minut 75-89. Rätt värde är 16.7%. Liten skillnad i detta fall men värt att etablera vanan. Sprint 25b.1-specen använde absolutfrekvens.

---

## 19. `continue` i generator hoppar över yield — events når aldrig consumern

**Mönster:** Logik i en `function*`-generator bygger upp en event-array korrekt men den konsumerande koden (t.ex. `fix.events`) ser aldrig eventen. Mekanismen körs, state uppdateras, men datan försvinner.

**Rotorsak:** I en generator driver `yield` varje iteration av consumer-loopen. Om en kodväg i loopen använder `continue` före `yield`-satsen skippas hela yield:en för det steget. Eventen som pushades till `stepEvents` innan continue:en kommer aldrig ut ur generatorn.

```ts
function* simulate() {
  for (let step = 0; step < 60; step++) {
    const stepEvents: MatchEvent[] = []
    
    // Tidig trigger som pushar till stepEvents och sedan continue:ar
    if (penaltyTriggered) {
      stepEvents.push(penaltyEvent)  // läggs till
      continue                        // MEN yield:en nedan skippas!
    }
    
    // Normal logik
    yield { step, events: stepEvents }  // NÅS ALDRIG när continue triggas
  }
}
```

**Fix:** Använd en flagga istället för `continue` så yield-satsen alltid nås:
```ts
let penaltyFiredThisStep = false
if (penaltyCondition) {
  stepEvents.push(penaltyEvent)
  penaltyFiredThisStep = true
}

if (!penaltyFiredThisStep) {
  // Normal logik som annars skulle köras
}

yield { step, events: stepEvents }  // NÅS ALLTID
```

**Känn igen:** Du pushar events/state i en generator men consumer-sidan (fix.events, state-dumps, UI) visar dem inte. Om du kan lägga en console.log före `yield` och se att raden aldrig triggas i rätt step → förmodligen en `continue`/early-return som hoppar över yield:en.

**Historik:** Sprint 25b.1. Straff-triggers i attack-sekvensen pushade penalty- och goal-events men `fix.events` visade dem aldrig. Motor körde rätt (homeScore/awayScore ökade) men stats.ts såg inga events → penaltyGoalPct förblev 0%. Fixades genom `penaltyFiredThisStep`-flagga istället för `continue`.

---

## 20. roundProcessor strippar event-typer för minne — tracking dör tyst

**Mönster:** Ett mätvärde ligger nära noll trots att motorn observerbart emitterar eventen. Enum-namnet stämmer (till skillnad från #16). Generatorn yieldar korrekt (till skillnad från #19). Men någonstans mellan match-generator och stats-extraktion försvinner eventen.

**Rotorsak:** `roundProcessor.ts` (`stripCompletedFixture`) strippar event-typer från `fix.events` efter match för att minska save-game-storlek. Events som bara behövs för live-commentary räknas bort. Om stats-kod förlitar sig på strippade events → tyst misslyckande.

**Komplett lista (verifierad Sprint 25b.1):**

| Event-typ | Status | Kommentar |
|---|---|---|
| `Goal` | ✅ PERSISTENT | Bär `isCornerGoal`, `isPenaltyGoal` flaggor |
| `RedCard` | ✅ PERSISTENT | Bandy 10-min utvisning (kallas RedCard i enum) |
| `YellowCard` | ✅ PERSISTENT | Finns i filtret men emitteras aldrig av matchCore |
| `Assist` | ❌ TRANSIENT | Strippad — används för ratings under match |
| `Save` | ❌ TRANSIENT | Strippad — används för GK-ratings under match |
| `Corner` | ❌ TRANSIENT | Strippad — räknare på stepEvent, ej persistent |
| `Penalty` | ❌ TRANSIENT | Strippad — använd `isPenaltyGoal` flagga på Goal |
| `Substitution` | ❌ TRANSIENT | Strippad — live-commentary |
| `Shot` | ❌ TRANSIENT | Emitteras aldrig av matchCore (räknare only) |
| `Injury` | ❌ TRANSIENT | Emitteras aldrig av matchCore |
| `Suspension` | ❌ TRANSIENT | Emitteras aldrig av matchCore (RedCard används) |
| `FullTime` | ❌ TRANSIENT | Emitteras aldrig i fix.events (yield-fas only) |

Kommentar tillagd ovanför strip-filtret i `src/application/useCases/roundProcessor.ts`.

**Fix:** Förlita dig på flaggor direkt på persistent-events:
```ts
// Fel — Penalty-event strippas, penaltyMinutes alltid tom
const penaltyMinutes = new Set(
  fix.events.filter(e => e.type === MatchEventType.Penalty).map(e => e.minute)
)
const isPenaltyGoal = penaltyMinutes.has(goal.minute)   // alltid false

// Rätt — flaggan sitter på Goal-eventet och överlever strip
const isPenaltyGoal = ev.isPenaltyGoal ?? false
```

**Känn igen:** Ny stats-tracking som läser Penalty/Save/Corner/Assist-events från `fix.events`. Ställ frågan: "är denna event-typ PERSISTENT enligt tabellen ovan?" Om nej — flytta signalen till en flagga på ett persistent event, eller lägg till typen i strip-filtret.

**Historik:** Sprint 25b.1. `stats.ts` byggde på Penalty-event-lookup för `isPenaltyGoal`. Penalty-events strippades → penaltyMinutes alltid tom → penaltyGoalPct loggades som ~0% trots att motorn gjorde straffmål. Fixades med `ev.isPenaltyGoal ?? false`.

---

## 21. Felnamngivet kalibreringsmål — analysera targeten INNAN du specsar sprinten

**Mönster:** Analyze-stress visar ett massivt gap (t.ex. motor 82% vs target 47% = −35pp). Man specsar en motorsprint för att sluta gapet. Hela sprinten löser ett problem som inte existerar.

**Rotorsak:** Kalibreringstarget-värdet stämmer inte med vad nyckelnamnet antyder. Värdet hamnade under fel nyckel när calibrationTargets byggdes — samma rådata, fel rubrik. Eftersom targets sällan verifieras mot rå källdata lever felet vidare tills någon frågar sig "vänta, ska en win-rate verkligen vara 46%?"

**Konkret fall:** `calibrationTargets.herr.htLeadWinPct = 46.6` innehöll egentligen `homeHtLeadFraction` (andel matcher hemmalaget leder vid halvtid, ~47%). Motorsimuleringen gav 80.4% — ett korrekt värde mot korrekt target 78.1%. Felet hittades under Sprint 25-HT genom att räkna om måttet direkt från rå matchdata.

**Fix:** Innan en motorsprint specas för ett specifikt target — räkna om det måttet från rådata i `bandygrytan_detailed.json` och jämför mot stored target. Om stored ≠ beräknat med >2pp: fixa JSON, inte motorn.

```bash
# Räkna htLeadWinPct ur rådata:
node -e "
const d = require('./docs/data/bandygrytan_detailed.json')
const ms = d.herr.matches.filter(m => m.phase === 'regular')
const leads = ms.filter(m => m.htHomeGoals !== undefined && (m.htHomeGoals > m.htAwayGoals || m.htAwayGoals > m.htHomeGoals))
const leadWins = leads.filter(m => {
  const homeLeads = m.htHomeGoals > m.htAwayGoals
  return homeLeads ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals
})
console.log((leadWins.length / leads.length * 100).toFixed(1) + '%')
"
```

**Känn igen:** Target-värdet hamnar utanför förväntad range för den metriken (win-rates bör vara 60-90%; en win-rate på 46% ska trigga skepticism). Kalibreringsgap >10pp utan tydlig motorhypotes = börja med target-audit, inte motorsprint.

**Historik:** Sprint 25-HT, 2026-04-25. `htLeadWinPct: 46.6` i JSON fixades till 78.1 och nytt fält `homeHtLeadFraction: 46.6` lades till. Motor 80.4% = +2.3pp mot korrekt target — väl inom tolerans. Ingen motorsprint behövdes. Fullständig target-audit dokumenterad i `docs/findings/REVISION_2026-04-25_calibration_targets.md`.

---

## 22. Kalibreringsskript måste köra med motorns produktion-defaults

**Mönster:** Stresstest visar ett gap (t.ex. awayWinPct +5.6pp). Man kalibrerade en motor som inte är samma motor som spelet använder.

**Rotorsak:** Kalibreringsskriptet (`calibrate_v2.ts`) initierar parametrar med ett värde, motorns runtime-kod (`matchSimProcessor.ts`) initierar med ett annat. Skriptet mäter en hypotetisk motor; spelet kör en annan. Kalibreringen är värdelös tills synket återställs.

**Konkret fall:** `calibrate_v2.ts:1050` körde med `homeAdvantage: 0.14`. `matchSimProcessor.ts:266` initierade `baseAdv = 0.05`. Spelet hade alltså 36% av den hemmafördel som kalibreringen förutsatte. awayWinPct landade +3.9pp över target eftersom motorn aldrig fick det `homeAdvantage`-värde kalibreringen testade.

**Fix:** Vid varje kalibreringsändring — diffa skriptets parametrar mot motorns startvärden. Eller bättre: importera samma konstant båda håll. Värdet ska existera på *en* plats.

```ts
// matchSimProcessor.ts
const baseAdv = homeClub?.hasIndoorArena ? 0.14 * 0.85 : 0.14

// calibrate_v2.ts
homeAdvantage: 0.14   // måste vara samma
```

**Känn igen:** Ett kalibreringsgap som inte kan förklaras av motormekanik. Innan motorändring — verifiera att skriptet och motorn kör på exakt samma parametervärden. Om de inte gör det är gapet artefakt, inte motorbugg.

**Historik:** Sprint 25-I/J, 2026-04-26. `baseAdv 0.05 → 0.14` löste awayWinPct-gapet utan annan motorändring. En rad. Misstaget hade levt sedan kalibreringen senast tunades.

---

## 23. cornerTrailingMod är fel hävstång — multiplicerar deltatermet, inte cornerBase

**Mönster:** Spec hypotetiserar `cornerTrailingMod` som rotorsak till per-fas cornerGoalPct-avvikelse. Implementation av spec-värde-justering ger insignifikant effekt (−0.5pp per 0.15 parameter-steg). Spec verkade ha rätt rotorsak, men effekten är minimal.

**Rotorsak:** `cornerStateMod` (= cornerTrailingMod eller cornerLeadingMod) multiplicerar bara *deltatermet* i `goalThreshold`-formeln:

```ts
goalThreshold = clamp(
  (cornerChance - defenseResist) * 0.30 * stepGoalMod * cornerStateMod + cornerBase,
  min, max
)
```

`cornerBase ≈ 0.105 * phaseGoalMod` dominerar `goalThreshold` i de flesta hörnsituationer. När `cornerStateMod` ändras från 1.20 till 1.05, påverkas bara den lilla deltatermen — `cornerBase` förblir oförändrad. Aggregerad cornerGoalPct rör sig därför minimalt.

**Fix:** Rätt hävstång är `cornerBase` direkt, via ett separat `cornerGoalMod`-fält i PHASE_CONSTANTS som skalar `cornerBase` och `cornerClampMin`. Nyckelobservation: en formelvariabels namn (cornerTrailingMod) säger ingenting om dess inflytande — det är *positionen i formeln* som avgör. En modifier som multiplicerar en liten delta-term har minimal aggregerad effekt även med stora värden.

**Sidoeffekt att bevaka:** `cornerGoalMod` reducerar både cornerGoalPct och totalmål proportionellt. Vid sänkning av cornerGoalMod i KVF/SF sjunker mål/match med ~0.5. Kompensera vid behov via `goalMod`.

**Känn igen:** En spec-justering av en fas-konstant ger förvånansvärt liten effekt på den targetade metriken. Innan ny iteration — spåra parametern i formeln och kontrollera vilken term den faktiskt multiplicerar. Om den sitter på en liten delta är det fel hävstång.

**Historik:** Sprint 25-K, 2026-04-26. Spec föreslog `cornerTrailingMod` 1.20→1.05 (QF) och 1.05→0.93 (SF). Implementation gav −0.5pp förändring trots korrekt parameterskifte. Verifiering avslöjade att `cornerStateMod` är fel hävstång. Ny mekanism `cornerGoalMod` infördes som direktskalar `cornerBase`.
