# LESSONS

Återkommande buggar och mönstret som orsakar dem. Läs vid sessionstart.
Lägg till ny lärdom när samma fel uppträder 2+ gånger.

Format per lärdom: Mönster (symptom), Rotorsak (varför), Fix, Känn igen (signal).

---

## INNEHÅLL — 38 LÄRDOMAR i 6 kategorier

Använd Ctrl-F på numret för att hoppa.

**Designbeslut / migrationsprocess:**
- 37. Exkludering är en designdom — riv med pixlar, inte argument
- 38. Slentrianparkera inte väldefinierade uppgifter
- 39. Normer i dokument upprätthåller sig inte själva — grind > checklista
- 40. Ingen Math.random() i spellogik — bara seedad rand
- 41. Ytan får inte lova vad systemet inte håller (promise↔consequence)
- 42. Playtesta och audita mot HEAD-byggd, inte en stale build

**React / UI:**
- 1. SVG width/height skriver över container
- 3. useEffect-deps inline funktioner ger loop
- 7. useEffect-dep på muterat state
- 8. Zustand-selektor objekt-literal
- 9. Sticky-element ovanpå modal-innehåll
- 24. Hook-kedja — pool definierad ≠ pool nåbar
- 25. Pixel-jämförelse i integrations-vy
- 27. Portal-event dubbelrendering
- 31. Polish-tillägg utöver spec

**Scroll / layout:**
- 2. Flex-child scrollar inte utan minHeight: 0

**Process / spec / leverans:**
- 4. "Klart" utan UI-verifiering
- 5. Symptomfix istället för rotorsak
- 6. Spec-dupliceringar bygger på varandra
- 13. Fix-villkor missar edge-case
- 29. "Levererad spec" ≠ fungerar i playtest
- 32. Diagnostik-uppdrag — Code, inte spelaren
- 33. Opus utan PRE-SPEC CROSS-CHECK — missar befintlig kod

**Matchmotor / fysik / events:**
- 14. Asymmetriska state-transitions liga/cup
- 15. Managed-gated kodblock i stress-test
- 16. Missledande enum-namn (RedCard = utvisning)
- 19. continue i generator hoppar över yield
- 20. roundProcessor strippar event-typer
- 26. Multiplikativa modifiers + cap-hål = explosion
- 28. Generator-closure vs React state
- 30. Asymmetrisk halvleks-state

**Kalibrering / mätning:**
- 17. Fördelning utan normalisering ljuger
- 18. Mellanstegs-procent vs absolutfrekvens
- 21. Felnamngivet kalibreringsmål — analysera target först
- 22. Kalibreringsskript vs motor-defaults
- 23. cornerTrailingMod fel hävstång

**TypeScript / data / safety:**
- 10. as-cast bypassar TypeScript
- 11. PLAYOFF tom completedThisRound (låg prio)
- 12. Auto-play scenarios behöver safety net

**Arkitektur / screen lifecycle:**
- 34. Dead code-radering dödar tyst levande funktioner
- 36. State-mutation under render-loopen — läs- och skrivfält måste separeras

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

---

## 24. Hook-kedja — pool definierad ≠ pool nåbar

**Mönster:** Sprint rapporteras klar med alla tester gröna, men en gren av logiken är dead code — pool definierad, hook skriven, ändå triggas grenen aldrig eftersom flaggan som styr den sätts ingenstans.

**Rotorsak:** Strängpool och triggerlogik byggs i ett pass, men flaggan som triggern beror på (`weather.matchFormat`, `fixture.isFinaldag`, etc.) genereras i en helt annan del av kodbasen som inte är klar än, eller som passerar dataobjektet inline utan att kopiera fältet. Tester gröna eftersom de hånar flaggan som satt — i produktion sätts den aldrig.

**Fix:** För varje ny lore-pool eller villkorlig sträng-gren — skriv ett integrationstest som *följer kedjan från flagg-källa till render*. Inte bara enhetstest av poolen. Plus: när en gren byggs som beror på data från ett annat system (väder, fixture, schedule), markera explicit i koden var datat förväntas komma ifrån:

```typescript
// Trigger för 3×30-lore. Kräver weather.matchFormat satt av weatherService.
// Om fältet saknas faller vi tillbaka till standard-pool. INTE dead code
// — men endast aktiv när SPEC_VADER fas 1 levererar matchFormat.
if (weather?.matchFormat === '3x30') return FINALDAG_COMMENTARY_3X30
```

**Känn igen:** Tester gröna men en `if`-gren har aldrig triggats i live-spel. Ofta märks det först i playtest när en specialsituation uppstår och förväntad text inte syns. Indikatorer i kod-review: en villkorad pool där villkoret beror på ett fält i ett dataobjekt som byggs inline (`{ ... matchFormat: ??? }`) eller som passerar genom flera lager utan att uttryckligen vidarebefordras.

**Historik:** Sprint Specialdatum V2, 2026-04-27. `FINALDAG_COMMENTARY_3X30`-poolen definierad och testad, men `matchCore.ts` byggde `sdCtx.weather` inline utan att kopiera `matchFormat`-fältet. Hook fungerade i unit-test (mockat weather), men i produktion var fältet alltid `undefined`. Upptäckt i audit, fixad i samma sprint med interim-trigger på `temperature <= -17`. Test tillagt som följer kedjan från weather-generering till commentary-pool.

---

## 25. Pixel-jämförelse i isolation vs integrations-vy

**Mönster:** Pixel-audit rapporterar "inga avvikelser" för en ny komponent, men komponenten ser fel ut i live-app — fel bakgrund, tokens som krockar med omgivningen, eller layout-gap som bara syns när hela skärmen renderas.

**Rotorsak:** Komponent-audit verifierar komponenten mot dess egen mock, men inte mot *integrationsvyn* — den faktiska skärm där komponenten renderas tillsammans med befintliga wrappade komponenter. Klassexempel: `NextMatchCard` är byggd för DashboardScreen (ljust tema). `NextMatchPrimary` wrappar `NextMatchCard` utan token-anpassning. Pixel-audit av `NextMatchPrimary.tsx` i isolation visar inget fel — felet syns bara när Portal (mörk bakgrund) renderar kortet.

**Fix:** Lägg till en integrationsvy-check i auditen för varje ny komponent som renderas inuti ett befintligt system (Portal, GameShell, MatchLiveScreen, etc.): "I vilket sammanhang renderas denna komponent, och har jag verifierat den i *det* sammanhanget — inte bara i isolation?"

Konkret checklista:
- Ny Portal-primary/secondary: verifiera i `/game/dashboard` med faktisk game-state omgång 1.
- Ny scene-komponent: verifiera i `SceneScreen` med pendingScene satt.
- Ny dashboard-komponent: verifiera i DashboardScreen (om den fortfarande används) OCH i Portal.

**Känn igen:** Audit-rapport visar korrekt komponent-rendering, men Jacob hittar tokenkrock i playtest. Signal: ny komponent wrappas runt en *äldre* komponent som byggdes för ett annat tema.

**Historik:** Playtest 2026-04-28. `NextMatchPrimary` wrappade `NextMatchCard` (DashboardScreen-komponent, ljus tema). Pixel-audit av `NextMatchPrimary` och `SeasonSignatureSecondary` gjordes i isolation mot mock. `NextMatchCard`'s `card-sharp` + `var(--bg-surface)` renderade vit mot Portals `--bg-portal` mörka bakgrund. Fixat i commit `a41fff3` med CSS-var-override i wrapper.

---

## 26. Multiplikativa modifiers + cap-hål = explosionsrisk

**Mönster:** En spelmagnitud (mål, hörnor, ställningsdiff) blir orimligt hög trots att en cap finns dokumenterad. Resultatet kan förklaras matematiskt men matchar inte någon verklighet — 17–1 i halvtid, 10 mål av en spelare på 30 simulerade steg.

**Rotorsak — två mekanismer som triggar samma symptom:**

1. **Multiplikativa modifiers staplas.** `profileMod × secondHalfMod × powerplayMod × trailingBoost` blir explosivt vid edge case (stort CA-gap + chaotic-profil + powerplay + underläge-boost). Var modifier för sig kalibrerad mot snitt; tillsammans bryter de mot det.
2. **Cap-checks finns i vissa goal-paths men inte alla.** `MATCH_GOAL_DIFFERENCE_CAP = 6` testas i attack-path men inte i counter-attack-/penalty-/corner-paths. Capen är då kosmetisk — den begränsar bara när boll-i-spel följer den "normala" vägen.

Båda är symptom av samma underliggande sak: magnitud-bygge utan **invariant-vakt på emit-tid**. Capen är logisk regel, inte mekaniskt skydd.

**Fix:**
1. Verifiera att samma cap-check anropas i ALLA paths som ökar magnituden — inte antas ärvt från attack-path. Lista samtliga `homeScore++` / `awayScore++` och bekräfta `canScore`-anrop ovanför varje.
2. Sänk multiplikatorer individuellt vid edge-case-explosion (chaotic 1.55→1.35) snarare än att försöka klippa toppen i efterhand. Stora multiplikatorer + hård cap = onaturliga resultatkurvor.
3. Lägg per-entitet-ceiling utöver total-cap: per-spelare-mål-cap är en separat invariant från total-diff-cap. Förstnämnda fixar "en spelare gör 10", den andra fixar "laget gör 17".
4. Stress-test 200+ matcher med varierad lagstyrka och assertions: per match `goals ≤ onTarget`, `onTarget ≤ shots`, `goalDiff ≤ cap`, `playerGoals[anyId] ≤ perPlayerCap`. Krasch-vid-violation, inte tyst rapport.

**Känn igen:** Spel-output som matematiskt går att förklara men "känns fel" — fysiskt omöjliga statistiksiffror, eller resultat som verklig bandy aldrig sett. Eller: en cap-konstant som existerar i koden men spelare-rapporterad violation som överstiger den.

**Historik:** 2026-05-03 playtest. Skutskär 17–1 Rögle vid halvtid, Kronqvist 10 mål på en halvlek. Roten: `chaotic` (1.55) × `largeCaDiff` (`wOpen+15`) × `powerplay` (1.20) × trailing-boost (1.16–1.48) staplade till absurd nivå. `MATCH_GOAL_DIFFERENCE_CAP = 6` kontrollerades inte i alla goal-paths — cap-hålet plus stapling gav 17–1. Fixades genom (a) cap-check infogad i counter-/penalty-/corner-paths, (b) `chaotic` 1.55→1.35 + `wOpen+15`→`+10`, (c) per-spelare-cap variant C (hård cap 5 + soft brake ×0.7 från 2:a målet).

---

## 27. Portal-event dubbelrendering — trigger utan priority-filter

**Mönster:** Portal visar samma event i två format — ett inline via `PortalEventSlot` och ett som primary-kort med "HÄNDELSE KRÄVER SVAR"-CTA. Spelaren ser dubbla knappar för samma beslut.

**Rotorsak:** `hasCriticalEvent()` och `EventPrimary` filtrerade på `e.type !== 'pressConference'` utan att kolla `priority === 'critical'`. Alla olösta events (inkl. priority=`normal` och `low`) aktiverade `EventPrimary` som primary-kort. `PortalEventSlot` visade samma event inline (korrekt beteende för normal-events). Två mekanismer, inget filter mellan dem.

**Fix:** Lägg till `(e.priority ?? getEventPriority(e.type)) === 'critical'`-check i BÅDE `hasCriticalEvent()` (eventTriggers.ts) och `EventPrimary.tsx`. Medium/normal/low-events renderas av PortalEventSlot. EventPrimary renderar bara faktiskt kritiska events.

**Känn igen:** Portal visar samma händelse med två olika UI-mönster — ett ljust inline-kort och ett mörkt primary-kort. Eller: `EventPrimary` visas för events som egentligen ska hanteras inline (transferbud, kontraktsönskemål, akademi-event).

**Historik:** 2026-05-03 playtest. `transferBidReceived` (priority=`normal`) dök upp i PortalEventSlot (korrekt) OCH som primary-kort via `EventPrimary` (bugg). `hasCriticalEvent` returnerade true för alla olösta events. Fixat i commits efter P4-diagnosen.

---

## 28. Two-source-of-truth state: generator-closure vs React state

**Mönster:** En spelare gör fler mål än lagets total (t.ex. 12 mål av 7 lagmål). Cap-kontrollen verkar ignoreras. Scoreboard desynkar med events i feeden.

**Rotorsak:** `simulateMatchCore`-generatorn håller sin egna closure (`playerGoals`, `homeScore`, etc). React-sidan håller `steps: MatchStep[]`. När interaktiva handlers anropar `regenerateRemainderWithUpdatedScore` skapas en **ny generator** med `playerGoals = {}` — nollställt. Cap-kontrollen i generatorn kollar bara mot sin lokala closure, inte det globala match-state. Varje regenerate ger spelaren en ny chans att samla mål från noll.

**Fix:** Lyft match-state till en enda källa. `useReducer(matchReducer, initialMatchState)` i MatchLiveScreen — reducer håller `playerGoals` globalt. Handlers dispatchar `INTERACTIVE_GOAL` som kollar mot global state. Generator-closuren spelar ingen roll längre för cap-kontroll.

**Känn igen:** Spelare med ovanligt höga målsiffror. Recovery-warnings i konsolen (`[MatchLive] Recovery: currentStep passed steps.length`). Score i scoreboard skiljer sig från events i commentary-feed.

**Historik:** P1.B-bugg rapporterad 2026-05-04 playtest (David Eklund, 12 mål). Grundorsaken var känd sedan TS-10 (2026-04-xx) men plåstrades med recovery-vakt. Livematch-refactorn (refactor/livematch-split) löste grundorsaken med matchReducer. Se `docs/diagnos/2026-05-04_player_goal_cap_bypass.md` för fullständig analys.

---

## 29. "Levererad spec" ≠ "fungerar i playtest". Symptomfix utan mock-check kan göra det värre.

**Mönster:** En spec markeras ✅ LEVERERAD i KVAR.md, men playtest avslöjar att UI:t inte matchar specens beskrivning. Någon (Opus eller Code) gör en symptomfix på det som syns fel — utan att gå tillbaka till mocken eller specen först. Fixen får symptomet att se bättre ut just i ögonblicket men rör implementationen *bort* från vad mocken säger. Nästa playtest hittar ännu en avvikelse — nu värre, eftersom fixen lade in ett tredje stilelement.

**Rotorsak:** Två sammanvävda problem.

1. **"Levererad" är en process-status, inte en sannings-status.** En spec kan markeras levererad när Code rapporterar färdigt, men det betyder inte att alla delar når upp till specens mål — bara att Code anser sig färdig med sin uppgift. KVAR.md har även explicit `⚠️ Awaiting browser-playtest`-noteringar på senast levererade specerna, men fördröjd playtest gör att avvikelser ackumuleras.

2. **Princip 4 (mock-driven design) gäller även Opus.** När Opus har `workspace:edit_file` och en bug rapporteras under playtest är friktionen för att fixa direkt lägre än friktionen för att först öppna mocken och verifiera. Det är en fallgrop: en "snabb fix" utan mock-check kan göra det värre genom att blanda in en *tredje* stil som varken matchar nuvarande implementation eller mocken.

**Fix:**
1. Innan ANY edit på en komponent som har en mock i `docs/mockups/`: öppna mocken först. Ta sedan ställning till om buggen är (a) implementation som avviker från mock → återimplementera enligt mock, eller (b) faktisk mock-spec-bug → uppdatera mock först, sedan implementation. Aldrig: "justera implementationen på måfå utan att kolla mocken".
2. "Levererad"-status verifieras genom playtest, inte genom Code-rapport. När en spec markeras levererad i KVAR utan playtest-verifiering: lägg `⚠️ Awaiting browser-playtest` på raden. Vid nästa playtest: kräv att spec-implementationen jämförs explicit mot specen och mocken — inte bara mot "ser det ut att fungera?".
3. När playtest avslöjar avvikelse från levererad spec: skriv inte ny spec. Skriv en *verifierings-spec* som börjar med diagnos: vad finns i koden, vad säger mocken, var är gapet? Först därefter fix.

**Känn igen:** Känslan av att samma yta fixas om och om igen utan att bli bra. Eller: skärmdumpsjämförelser som visar tre olika versioner av samma vy över tre playtest-omgångar, utan att någon matchar mocken.

**Historik:** Skottbild 2026-05-04. SPEC_SHOTMAP_OMARBETNING markerades ✅ LEVERERAD i KVAR.md ("halvcirkel-geometri ersätter rektangulära boxar", "↑ VI ANFALLER / DE ANFALLER ↓ i separator-strecket"). Playtest skärmdump 17:22 visade fortfarande rektangulära boxar och "MOTSTÅNDARMÅL"/"VÅRT MÅL"-text. Opus gjorde en symptomfix samma session: streckad mittlinje + flyttade etiketter till respektive mål. **Fixen flyttade implementationen *bort* från mocken** — mocken har grå separator + riktningspilar, inte streckad linje med etiketter. Jacob flaggade detta: "den borde ju implementeras som den är mockad". Fixen ska revertas och shotmap implementeras enligt `docs/mockups/shotmap_mockup.html` bokstavligen. Dokumenterat i SPEC_GRANSKA_VERIFIERING_2026-05-04 Fix E.


---

## 30. Asymmetrisk state-övergång mellan halvlekar — vissa fält förs över, andra initialiseras till noll. Workaround i UI maskerar bug i datamodellen.

**Mönster:** En tracking-metrik visar systematiskt lägre värden än förväntat — inte tydligt fel, bara "ungefär rätt". Stresstest visar t.ex. 7,85/match där förväntat är 15-18. Ingen krasch. Inga warnings. Bara skev rapportering. Kan leva odetekterat länge eftersom UI ofta har workarounder eller alternativa beräkningsvägar som maskerar problemet.

**Rotorsak:** Generator-funktion eller process som körs i två separata anrop (första halvlek + andra halvlek) initialiserar tracking-state vid varje anrop. Vissa fält förs över via input-objektet (t.ex. `secondHalfInput.shotsHome`), andra glöms bort och initialiseras till `0` i andra anropet. Asymmetri i state-management — halva pendangerna i koden, resten förglömda.

**Fix:** Vid händelse-tracking i process som körs flera gånger, verifiera att ALLA tracking-fält har en motsvarande överförings-rad. Konkret för matchEngine-stället:

```typescript
// Före (bug)
let onTargetHome = 0  // ← nollställs mellan halvlekar
let shotsHome    = fhs?.shotsHome ?? 0  // ← förs över korrekt

// Efter (fix)
let onTargetHome = fhs?.onTargetHome ?? 0  // ← även detta förs över
let shotsHome    = fhs?.shotsHome    ?? 0
```

**Känn igen:** Stats visar "ungefär rätt" siffror som ligger systematiskt under förväntade. Inte krasch, inte tydligt fel. Plus: kommentar i koden som förklarar bort en avvikelse ("corner goals are excluded which causes conversion% > 100%") — om kommentaren är teoretisk istf empiriskt verifierad kan den dölja en bugg av denna typ.

**Sökbart pattern:** I varje generator/process med first-half + second-half-anrop, löp igenom alla `let X = 0`-rader i second-half-init och verifiera att motsvarande first-half-värde förs över via input-objektet.

**Sekundär insikt — Workarounder i UI maskerar datamodell-buggar:** `GranskaShotmap.tsx` räknade `onTargetCount = scoredCount + savedCount` istf att läsa `report.onTargetHome` direkt, p.g.a. en (felaktig) kommentar om corner-exkludering. Visualiseringen blev korrekt, men buggen i datamodellen förblev osynlig för alla andra delar av appen som läser fältet direkt. Workarounden kvar med korrekt förklaring (robust mot interaktiva hörn-mål som inte inkrementerar onTarget i matchReducer — det är en separat, legitim anledning).

**Historik:** Shot data audit 2026-05-04. `onTargetHome/Away` initialiserades till `0` i `simulateMatchCore` istf `fhs?.onTargetHome ?? 0`. `report.onTargetHome` reflekterade bara andra halvlekens värde. Stresstest: 7,85/match mot bandygrytan ~15.8. Fixat i samma session: lade till `initialOnTargetHome/Away` i `StepByStepInput`, `SecondHalfInput`, matchCore-räknare och matchEngine `secondHalfInput`. Stresstest efter fix: 15.4/match.

---

## 31. Polish-tillägg utöver spec introducerar buggar

**Mönster:** Code implementerar enligt spec men lägger till "design polish" som inte finns i specen — fade-in, delays, animationer, opacity-states. Tillägget introducerar timing-buggar som blockerar kärnfunktionen. Buggen yttrar sig som att UI:t inte beter sig som specen beskriver, fast koden formellt följer specen.

**Rotorsak:** Implementations-friheten töjs från "följ specen" till "förbättra utifrån vad jag tycker är snyggt". Polish-tillägg som `setTimeout(1700)` + `useEffect`-cleanup interagerar med Reacts livscykler (StrictMode dubbel-mount, parent-re-render-loops) på sätt som inte test-verifieras. Resultatet: en mekanism som spec-tester inte täcker eftersom mekanismen inte finns i specen.

**Fix:**
1. Code: följ specen bokstavligen. Om "polish" är värd att lägga till — fråga eller PR:a det separat efter spec-implementationen är verifierad.
2. Opus: granska Code-implementation mot spec innan godkännande. Leta efter `useEffect`/`setTimeout`/`opacity`-mekanik som inte finns i specen.
3. När en bug rapporteras på en yta som specifikt följer spec — börja med att lista *vad som finns i implementationen som inte finns i specen*. Där ligger ofta buggen.

**Känn igen:** Spec säger "CTA visas". Implementation har `ctaReady`-state med 1700ms delay, opacity-fade, pointerEvents-toggle. Spec nämner inget av det. Spec-tester täcker inte mekanismen. Bug uppstår i mekanismen som inte borde finnas.

**Historik:** ArrivalScene-reboot 2026-05-08. Spec sa "CTA visas direkt när stage renderas". Code la in `ctaReady`-mekanik för mjuk fade-in. StrictMode dubbel-mount + parent-re-render kombinerade till att `setTimeout` clearas innan `setCtaReady(true)` fyrar. CTA blev evigt osynlig. Fix: ta bort hela `ctaReady`-mekaniken, låt CTA renderas direkt enligt spec. Polish kan komma senare som separat insats.

---

## 32. Diagnostik-uppdrag — Code kör tester, inte spelaren

**Mönster:** Vid bug-jakt skriver Code `console.log` i koden och ber spelaren öppna webbläsaren, navigera till bug-yta, öppna DevTools, kopiera loggar och klistra in dem. Spelaren tappar tålamod — hen ska inte behöva göra teknisk diagnostik.

**Rotorsak:** Uppdragsfördelning glider. Code tror sig sakna webbläsar-access och delegerar dit. Opus förstärker felet genom att vidarebefordra Code's instruktion istället för att korrigera den. Spelaren ska enligt skrivna preferenser slippa tekniskt arbete — "hela poängen med att ha dig och Code parallellt är att jag ska slippa".

**Fix:** Vid bug-rapport — Code kör `npm run dev` lokalt, öppnar bug-yta i egen webbläsare, läser DevTools-loggar själv. Spelaren rapporterar bara symptomet. Code och Opus diagnostiserar och löser.

När diagnostik behöver mer info än vad spelarens skum-rapport kan ge:
- Code: starta dev-server, repro buggen själv
- Opus: läs relevant kod via workspace-MCP och resonera om rotorsaken
- Spelaren: bara om något tekniskt verkligen kräver hens öppna spel-instans — och då specifikt formulerat: "vilken klubb valde du, vilken säsong är det, ser du X på skärmen?"

**Känn igen:** Code-instruktion som innehåller "öppna webbläsaren", "öppna DevTools", "klistra in loggarna". Eller Opus-meddelande som vidarebefordrar sådan instruktion till spelaren. Bägge är symptom på fel uppdragsfördelning.

**Historik:** ArrivalScene CTA-bug 2026-05-08. Code la in `console.log('[ArrivalScene] stage-advance:', ...)` och bad Jacob köra testrunda. Opus skickade vidare instruktionen istället för att korrigera. Jacob: "jag orkar inte hålla på med det där. det har jag sagt 1000 gånger." Korrekt approach: Code kör dev-server och läser loggar själv, eller Opus läser koden via MCP och hittar bugg via kod-analys istället för runtime-data.

---

## 33. Opus skriver spec utan PRE-SPEC CROSS-CHECK — missar befintlig kod

**Mönster:** Opus levererar spec som innehåller parallell-implementation av kod som redan finns. Spec föreslår ny modell/datastruktur (`Player.transferPersonality`, fem-bucket-regioner, `fixedRivalryList`, journalist-pool) trots att motsvarande redan är implementerat i kodbasen (`rivalries.ts`, `worldGenerator.region`, `game.journalist`-enhet). Specen riskerar antingen dubbelarbete eller dum-och-felaktig integration som ignorerar befintlig data.

**Rotorsak:** Opus skriver spec från minnet och kategori-tänkande ("transfers behöver rivalitet → jag bygger en lista"), inte från kodbasens faktiska tillstånd. Princip 2 i CLAUDE.md ("PRE-SPEC CROSS-CHECK") anger att 30-60 sekunders grep ska göras innan spec, men det är systematiskt skippat när Opus känner sig säker på domänen. Känslan av säkerhet är exakt när grep behövs mest — då antas det att vad som finns i minnet motsvarar vad som finns i koden.

**Fix:**
1. Före VARJE Code-brief eller spec som innehåller nya domain-entiteter, services eller datastrukturer — obligatorisk grep enligt CLAUDE.md sessionsstart kategori B:
   ```bash
   grep -rn "huvudkoncept\|relaterat_koncept" src/domain/services \
     src/domain/data src/domain/entities --include="*.ts" | head -20
   ```
2. Träff på grep → läs den filen helt innan spec fortskrider. Återanvänd eller medvetet ersätt med dokumenterad anledning.
3. Ingen träff → grep bredare på synonymer/relaterade termer innan första meningen skrivs. Ingen träff är endast trovärdigt efter 2-3 olika sniff-queries.
4. Spec som nämner namngivna entiteter (rivalry-par, journalister, klubbar) ska aldrig nämna real-world-namn när spelet använder fake-värld — verifiera i `worldGenerator.ts`/motsv vilka namn som faktiskt finns.

**Känn igen:** Spec som nämner specifika klubbnamn, journalist-namn, eller datatyper utan att först ha grepat efter dem. Spec som föreslår ny enum/typ utan att lista befintliga på samma nivå. Design-Claude eller Jacob påpekar "den filen finns redan" eller "den datan finns redan som X".

**Historik:**
- 2026-04: Strukturanalys missade att THE_BOMB 1.3 (kontextuell match-commentary för akademi/kapten/klackfavorit/dayJob) var fullt implementerad i `matchCore.ts`. En 30-sekunders grep på "promotedFromAcademy" hade visat det. Dokumenterat i CLAUDE.md Princip 2.
- 2026-05-20 (samma session, två missar): Opus skrev spec för C-T1 + C-T9 (transfer-personality + geografi) som föreslog `fixedRivalryList` med real-world bandy-klubbar (Bollnäs↔Edsbyn, Sandviken↔Hammarby) trots att `rivalries.ts` redan innehöll 9 par för fake-klubbarna (Upplandsderbyt, Bruksderbyt, Daladerbyt etc.). Plus fem-bucket-region-modell trots att klubbar redan har `region: string` som landskap. Design-Claude fläckade det — verifierade mot koden och rapporterade i `SPEC-SVAR-TRANSFER-RESPONSE-2026-05-20.md`.
- 2026-05-20 (samma session): Opus skrev spec för C-B1 (CS-press) som föreslog "Helena Wikström från befintlig pool om finns, annars random" trots att `game.journalist` är EN namngiven entitet per save med `relationship`-state och `memory[]`. Design-Claude fläckade det i `SPEC-SVAR-CS-PRESSFRAGA-2026-05-20.md`.
- Plus: Jacob påpekade vid samma session att CLAUDE.md inte upprättats vid sessionsstart — obligatorisk läsning var överhoppad. Fölt direkt sjukt: utan CLAUDE.md är Princip 2-disciplinen inte etablerad i sessions-kontexten. Fix: ny "SESSIONSSTART — MINIMUM-LÄSNING"-sektion överst i CLAUDE.md som kategoriserar läsning per uppgiftstyp och flagar PRE-SPEC CROSS-CHECK som obligatorisk för kategori B.

---

## 34. Dead code-radering dödar tyst levande funktioner

**Mönster:** En skärm raderas som "dead code". En funktion eller CTA som fanns på den skärmen försvinner för spelaren — men handlern i storen lever kvar. Felet syns inte i build, syns inte i tester, syns inte förrän spelaren saknar funktionen.

**Rotorsak:** Radering av en skärm inventerar inte vad skärmen ensamt exponerade mot spelaren. Handler lever → ingen TypeScript-varning. Store-funktion anropas aldrig → inget runtime-fel. Tyst förlust.

**Fix:** Innan en skärm raderas som dead code: lista alla CTA:er och unika store-anrop i filen. Kontrollera att varje en antingen (a) finns exponerad via annan vy, eller (b) medvetet avvecklas och handlern tas bort ur storen.

**Känn igen:** Store-action som inte anropas från någon vy men fortfarande exporteras. Funktion som Jacob rapporterar som "försvunnen" fast koden finns kvar.

**Historik:** `simulateRemainingStep` i `gameFlowActions.ts` levde kvar när `DashboardScreen.tsx` (1208 rader) raderades 2026-05-03 (commit 4a41789). Jacob märkte funktionen saknats i "spelet tre första månader" och rapporterade det 2026-05-22. Återställd till `PortalScreen.tsx` efter ~3 veckors tyst förlust. Beslut loggat i DECISIONS.md 2026-05-22.

---

## 36. State-mutation under render-loopen — läs- och skrivfält måste separeras

**Mönster:** Portal fryser intermittent med "Maximum update depth exceeded" efter omgångar
med stor inbox-aktivitet (derby + skandal, final + media). Crashen är icke-deterministisk
och repros bara när viss kombination av inbox-items finns.

**Rotorsak:** `buildPortal` läste `game.lastStorySlotType` för rotationsregeln (FREKVENTA
×0.5). `recordPortalShown` (useEffect på `[layout]`) *wrote* `lastStorySlotType`. Varje
skrivning gav ny `game`-ref → ny `layout` via useMemo → effekten triggades igen. Med två
FREKVENTA-kandidater flippade ×0.5 vinnaren varje varv — oändlig loop.

Mönstret i korthet: **samma fält läses av renderberäkning och skrivs av render-effekt → loop**.

**Fix:** Separera läs- och skrivfälten.
- Nytt `currentStorySlotType` — skrivs av `recordPortalShown` (render-sida).
- Befintliga `lastStorySlotType` — läses av `buildPortal`, muteras aldrig under matchdagen.
- `roundProcessor` promotar `current → last` vid matchdagsövergång — enda platsen som
  känner matchday-gränsen säkert.

**Känn igen:** Zustand-guard `if (same value) return state` fångar inte fallet om värdet
*varierar* varje varv (som rotation gör). Guard måste skydda mot oscillation, inte bara
identitet. Signal: crash är intermittent och beror på antal kandidater av samma klass —
det är aldrig ett "random" crash, det är alltid en oscillations-trigger.

**Historik:** `portalBuilder` + `recordPortalShown` + `PortalScreen.tsx`, 2026-05-24.
Fix i commit `ae90f13`.

---

## 35. Statuspåståenden om koden är värdelösa utan kodläsning — oavsett källa

**Mönster:** Ett dokument, en summering eller ett minne påstår något om kodens
tillstånd — "de tre spåren är byggda", "typerna finns", "den mätningen behöver
byggas", "trupp är tre lager levererade". Varje gång påståendet faktiskt
verifieras mot källkoden visar det sig vara fel eller ofullständigt. Åtgärd på
ett overifierat påstående leder till bygge mot något som inte finns, eller
dubbelarbete för att bygga något som redan finns.

**Rotorsak:** Tre olika parter (Opus, Code, Design) producerar status-text, och
alla tre tenderar att skriva från kategori-tänkande eller från förra summeringen
istället från koden. En statusline eller handoff KÄNNS som sanning men är en
andrahandskälla. Detta är #33 sett bredare: inte bara "grep innan du specar nytt"
utan "läs källan innan du agerar på NÅGOT statuspåstående", inklusive påståenden
om att något är färdigt, saknas, eller måste byggas.

**Fix:** Korsläsning slår självaudit. Innan ett spår förklaras klart, ett uppdrag
skrivs, eller ett system sägs saknas — låt en part som inte producerade påståendet
läsa den faktiska koden. Opus läser via workspace-MCP. Konkreta steg: (1) en
Code-summering "klart/pushat" verifieras genom att läsa garden/funktionen, inte
genom att lita på raden. (2) Ett "saknas"-påstående verifieras genom grep innan
det leder till nybygge — datan kan finnas under annat namn. (3) Ett "måste byggas"
verifieras mot `scripts/` och befintliga services — verktyget kan redan finnas.

**Känn igen:** Vilket påstående som helst om kodens tillstånd som inte följs av
ett verb som "jag läste". "Det finns nog ingen...", "Code rapporterar klart",
"de sju typerna", "hela X är levererat". Ju säkrare påståendet låter, desto mer
värd är en läsning — säkerheten är ofta minne, inte kunskap.

**Historik (alla 2026-05-23, en session):**
- Portal kändes statisk → läsning av `portalBuilder` visade att den TVÄRTOM har
  full dynamisk prioritering; problemet var tom korg, inte trasig algoritm.
- Designs sju inbox-typnamn → läsning av `enums/index.ts` visade att 6 av 7 inte
  fanns som enum-värden. Hade Code byggt mot dem hade inget lyfts.
- `playerMilestone`/`nemesis` påstods "saknas" → läsning av narrativeService +
  Codes grep visade att båda finns som `BoardFeedback` med titel-prefix. Golv-regeln
  vilade på riktig data.
- Målmotor-mätning: Opus skrev uppdrag att BYGGA en batch-mätning → `scripts/`
  visade att `analyze-stress.ts` + 7666-match `season_stats.json` redan gör exakt
  det. Uppdraget omframades från "bygg" till "kör befintligt".
- Tre Code-spår påstods byggda i summering → läsning av roundProcessor bekräftade
  snapshot-gard (4 villkor) + fatigueHistory korrekt. Den gången stämde det —
  men det visste vi först efter läsningen, inte före.
- Trupp "tre lager levererade" → list_directory visade att KORT-filen saknades
  initialt (Design hade inte listat den). Endast efter att alla sex filer fanns
  på disk var påståendet sant.
- 2026-05-25: Opus specade score-primitiver, OpponentForm-migration och C-FT1 plats-3
  mot den staila 2026-05-23-score-auditen utan att läsa koden eller DESIGN-DECISIONS.md
  först. Alla tre visade sig REDAN byggda — tre no-op-pass i rad. Pekade dessutom Code
  mot `HANDOFF-SCORE-SYSTEM-2026-05-20.md` som inte existerar (specen bodde i mockens
  notes-sektion). Jacob: "vi går igenom saker 2 eller 3 gånger för att du slararar med
  det som står i claude.md." Fix-bekräftelse: läs kodläget + DESIGN-DECISIONS INNAN
  spec. En audit daterad >2 dagar tillbaka är en andrahandskälla, inte sanning —
  migreringar sker parallellt och hinner förbi auditen samma vecka.

---

## 37. Exkludering är en designdom — riv med pixlar, inte argument

**Mönster:** En yta exkluderas från en migration med motivering ("byte = regression"). Vid nästa migration ignoreras exkluderingen med ett konsekvens-argument ("gold-varianten används konsekvent nu") istället för att designdomen rivs explicit med pixel-bevis.

**Rotorsak:** Exkluderingar dokumenteras sällan som designdomar — de sitter i en commit-kommentar eller implicitit i att filen inte rördes. Nästa ingenjör ser möjligheten, inte förbudet.

**Fix:** Innan du migrerar en exkluderad yta: öppna dev-galleriet (`/dev/scenes`), ta screenshot av nuläget, jämför mot målbilden. Om pixlarna visar att den gamla lösningen fortfarande är bättre — dokumentera det explicit. Om de visar att migrationen håller — riv exkluderingen och genomför.

**Känn igen:** "Konsekvensvinsten" som argument för att genomföra en migration ingen bett om. Speciellt riskabelt när ytan inte finns i dev-galleriet och aldrig skärmdumpats.

**Historik (2026-05-26/27):** VictoryScore hade 64px Georgia-hjälte, exkluderades från Score Våg 1 som "regression". Score Våg 2 migrerade ändå till ScoreBlock default (16px) med motivering "gold reserveras rätt nu". Dev-galleriet bekräftade regression. ScoreBlock hero (48px, ingen border-left) behövde byggas. Kostade tre sessionsmoment.

---

## 38. Slentrianparkera inte väldefinierade uppgifter

**Mönster:** En uppgift är välspecad och färdigbeskriven men parkeras med "tas nästa gång" utan specifikt skäl. Nästa session börjar med att återidentifiera uppgiften och förstå varför den parkerades.

**Rotorsak:** Parkering används som default-val istället för genomförande. Konsekvensen är dubbeljobb och missade kopplingar till annan pågående kod.

**Fix:** Om en uppgift är väldefinierad och Code har verktygen — genomför direkt. Parkera bara om: (a) uppgiften beror på något som inte finns ännu, (b) Jacob explicit ber om att parkera, eller (c) specen är ofullständig och behöver Opus-runda.

**Känn igen:** "Det här kan göras senare" utan konkret beroende. "Tas i nästa sprint" utan förklaring.

---

## 39. Normer i dokument upprätthåller sig inte själva — grind > checklista, en sanningskälla

**Mönster:** Designsystemet dokumenteras (DESIGN-DECISIONS, mockar, referens) men uttrycket glider ändå isär — hårdkodad rgba, off-scale-radie, guld-creep återkommer. En konsekvens-audit städar en gång, men utan stående spärr startar driften om. Två handgjorda "sanningskällor" (referens-mock + besluts-logg) hinner säga emot varandra inom en session.

**Rotorsak:** En Definition-of-Done ("grep-rent vid block-stängning") är en engångskontroll, inte en stående egenskap. Och två parallellt handunderhållna artefakter med samma värden driver alltid isär. Drift uppstår när Code tolkar prosa/tal i stället för att läsa en token.

**Fix:** (1) Lyft grep-villkoren till en stående CI-grind (`scripts/check-design-tokens.mjs` + `npm run lint:design` i GitHub Actions på appen), ratchet: error först efter att baslinjen är grep-rent. (2) Generera spegeln (`colors_and_type.css`) ur `global.css` — handsynk desyncar (hände med `--radius-md` + scen-tokens juni 2026). (3) En sanktionerad sanningskälla per sak: tokens i `global.css` för värden, `DESIGN-DECISIONS.md` för beslut. Mockar är illustrativa, inte sanning. (4) Tokens är enda API:t mot paletten; råvärden är en bugg.

**Känn igen:** "Klart när checklistan är grön" (vem kör checklistan om åtta veckor?). En referens-mock som anges som "enda sanningskällan" men inte är maskinläsbar. Ett värde som lever på två ställen.

**Historik (2026-06-07):** Konsekvens-auditen (DB-1…9 + R2 + Q1–4) städade uttrycket, men appen hade ingen lint och ingen app-CI — bara `tsc`+`vitest` lokalt. Designs implementations-referens-mock, tänkt som pixel-sanningskälla, motsäger redan besluts-loggen på glow (40 vs 35%), pill-alpha (8/40 vs 6/30) och hjälte-CTA-mått — på de exakta värden som eskalerats för beslut. Bevis för att parallella handgjorda källor driver. Försoning samlad i `docs/mockups/CODE-LEVERANS-2026-06-07.md §1`; efterlevnads-grinden specad där §4.

---

## 40. Ingen Math.random() i spellogik — bara seedad rand

**Mönster:** `Math.random()` smuglar sig in i spellogikfiler (processors, services) och bryter determinism-kontraktet: samma seed ger olika utfall vid repris.

**Rotorsak:** Enkel reflex — `Math.random() < 0.02` är kortare att skriva än att ta in `localRand` ur scope. Felet är osynligt tills man försöker reproducera ett scenario.

**Fix:** Alla spellogikfiler (processors, matchSim, services) använder `mulberry32`-seedad rand eller `localRand` från yttre scope. `Math.random()` är tillåtet BARA i UI/kosmetik (inbox-id-generering, UI-text utan speleffekt). Lägg till `seededPick` / `mulberry32` vid filskapande; aldrig `Math.random()` för game-state.

**Känn igen:** Ny kod i `src/domain/services/` eller `src/application/useCases/processors/` som innehåller `Math.random()`. Grep-check: `grep -rn "Math.random" src/domain/services src/application/useCases/processors --include="*.ts"`.

**Historik (2026-06-12):** Kartfynd (PRIO 1) identifierade 4 determinism-brott i simulationskedjan: `playerStateProcessor`, `statsProcessor`, `transferProcessor`, `weeklyDecisionService`. Alla ersatta med seedad rand.

---

## 41. Ytan får inte lova vad systemet inte håller (promise↔consequence)

**Mönster:** En spelar-vänd yta — etikett, citat, förfrågan, notis — utlovar eller antyder en effekt/relation som systemet inte levererar. Playtesten möter det som "det här makes no sense" eller "vad händer om jag klickar?", en bugg i taget.

**Rotorsak:** Ytan skrivs mot en avsedd mekanik som aldrig byggdes klart (stub), eller mot fel kontext (eko i rématch-röst på en ambient yta). Varje enskild yta är rimlig; tillsammans bryter de kontraktet "det jag ser betyder något".

**Fix:** Varje löfte spelaren ser måste backas av en riktig, läsbar konsekvens. Stub-etiketter byggs klart, inte ometiketteras ner eller skrotas (DECISIONS 2026-06-18). Citat som antyder kontext (rématch, närhet) grindas mot att kontexten faktiskt råder. Notiser som ber om handling får en handlingsyta eller routar dit. Kör en promise↔consequence-audit systematiskt i stället för att vänta på att playtesten matar fram dem.

**Känn igen:** "+taktikinsikt" utan taktikinsikt-mekanik. "Slottsbron igen" före en match mot någon annan. En förfrågan i inkorgen utan svarsknapp. En etikett vars effekt-fält har en kommentar som "use proxy".

**Historik (2026-06-18):** Playtest ytade fyra på en session — efterklang i rématch-röst utan rématch, veckans-beslut "+taktikinsikt"/"+positionering" som noop/boardpatience-proxy, Frida-tifo som förfrågan utan action, "Fönstret öppet" utan referent/länk. Samma klass, namngiven som lärdom #9 för interaktion.

---

## 42. Playtesta och audita mot HEAD-byggd, inte en stale build

**Mönster:** En diagnos läggs på en bugg som redan är fixad i arbetsträdet — den syns bara för att den spelade/auditerade builden ligger bakom HEAD. Tid bränns på att felsöka det som redan är löst, och man drar fel slutsats om koden.

**Rotorsak:** Builden som körs (deployad eller lokalt byggd) är inte densamma som trädet. Diagnos mot körningen blandar ihop "fel i koden" med "fel i den gamla builden".

**Fix:** Notera alltid build-hash vs HEAD vid playtest/audit. Diagnostisera mot KÄLLAN (läs filen), inte bara mot den körande builden. När en stor pass (Code-runda) är på väg att ändra många filer — playtesta/audita EFTER att den landat och byggts om, inte mot mellanläget. Kör inte stora Design-audits/genomspel mot en build som strax ändras.

**Känn igen:** Footer/version visar en hash äldre än senaste commit. En "bugg" som inte finns när du läser källan. En grind/gate som finns i koden men inte i beteendet.

**Historik (2026-06-18):** Spelkänsle-playtesten kördes mot c78a22d, bakom arbetsträdet. Efterklang-grinden (playedLeague<5) fanns redan i trädet men visades i builden; flera copy-fixar var redan inne. Diagnoserna höll mot källan men byggstatusen måste alltid noteras.

---

## 43. Kartlägg HELA klassen före första fixen — den partiella fixen ser komplett ut

**Mönster:** Ett systemfel (determinism-brott, fel term, sovande grind) upptäcks, fixas där det syns, och rapporteras som löst. Samma fel dyker upp igen nästa pass, på en annan rad i samma fil. Varje enskild fix var korrekt; kedjan tog tre rundor där en hade räckt.

**Rotorsak:** Reflexen är att fixa det man ser och flagga resten "för senare" — vilket är rätt beteende för *okända* fynd men fel för en *känd klass*. När felklassen är identifierad ("RNG på väggklocka", "fotbollsterm", "grind som ligger över faktiskt läge") är kartläggningen billig och partialiteten dyr: mellanläget SER komplett ut i commit, test och rapport, så ingen letar vidare.

**Fix:** När en felklass namnges — GREP HELA YTAN FÖRST (filen, mappen, kodbasen beroende på klass), lista alla instanser, fixa sedan. Rapporten ska svara på "är det slut?", inte bara "är det jag hittade fixat?". Sluta med ett verifierande slutgrep som visar noll levande träffar.

**Känn igen:** En fix-commit som säger "även hittade N till, flaggade ej fixade". En grind vars baslinje ligger långt över faktiskt läge. Ett ärende med suffix (PT-7 → PT-9 → PT-10).

**Historik (2026-07-13):** Determinism i `MatchLiveScreen.tsx` krävde TRE pass: PT-7 seedade matchstegen och flaggade sju interaktions-RNG:er; PT-9 seedade fyra av de sju (utfallen) och flaggade fem `Math.random()` till; PT-10 stängde resten. Först då var samma fixture reproducerbar. Ett slutgrep i pass ETT hade gett hela listan. Samma mönster: text-guarden (regressionstermer levde vidare i filer auditen aldrig nådde), ds-guard-baslinjen (stod 165/128/75 mot faktiska 40/59/65 — grinden kunde inte larma), bye-antagandet (M66e + PT-3-harnesset, två instanser innan mönstret sattes).

## 44. Två anropsställen för samma hjälpare, ett storleksatt och ett inte — kodläsning på det ena ger fel svar om det andra

**Mönster:** En hjälpfunktion (`getPortraitSvg`) anropas från flera ställen i presentationslagret. Vid EN anropssida är resultatet wrappat i en storleksatt container (`width:40, height:40, flexShrink:0, overflow:hidden`); vid en ANNAN saknas wrappern helt (`<div dangerouslySetInnerHTML={...} />`, ingen `style`, ingen `className`). Auditören läser det förstnämnda stället, ser att det är korrekt, och drar slutsatsen att fyndet ("porträttet blåses upp") är inaktuellt — trots att buggen lever fullt ut på det andra stället, i en annan del av samma skärm.

**Rotorsak:** Samma klass som `respondToIncomingBid` mot `resolveEvent` (två kodvägar till samma tillståndsförändring, bara en grindad) — men i presentationslagret: två kodvägar till samma RENDERING, bara en storleksatt. `git log -1` på filen räcker inte för att avfärda ett fynd; filen kan ha EN korrekt och EN trasig instans av samma mönster, och blame visar bara att NÅGOT i filen ändrades senast, inte VILKEN rad.

**Fix:** Innan ett visuellt fynd avfärdas som inaktuellt utifrån kodläsning — grep ALLA anropsställen för samma hjälpare (`grep -rn "getPortraitSvg"`), inte bara det första som råkar dyka upp. Jämför varje anropssidas wrapper mot varandra. Skiljer de sig, är minst en av dem trasig — browser-verifiera den specifika ytan fyndet faktiskt pekar på (rätt scen, rätt state), inte en angränsande yta som råkar dela hjälparen.

**Känn igen:** "Koden ser redan rätt ut" som slutsats baserad på EN läst kodrad, när samma hjälpare har fler anropsställen. En audit-post märkt OKLAR i väntan på browser-verifiering trots att en snabb kodläsning "redan svarade".

## 45. Fyra kompletta no-ops bakom stora löften — felet var inte i texten utan i att systemet inte klagade

**Mönster:** Ett `EventChoice`-val lovar en tydlig konsekvens i UI (kaptenstal höjer moral, varsel-stöd höjer moral, offer_pro gör spelaren heltidsproffs) — och konsekvensen uteblir helt, tyst, utan fel i konsolen eller röd test. Fyra separata val i `eventResolver.ts` var kompletta no-ops i månader: `boostMorale` konstruerades utan `targetPlayerId` (captainSpeech, varsel support/nothing), och `multiEffect`s sub-resolver saknade helt en gren för `makeFullTimePro` (varsel offer_pro).

**Rotorsak:** Resolverns cases var skrivna som `if (pid) { ...tillämpa effekt... }` utan `else` — ett saknat obligatoriskt fält gjorde att hela blocket hoppades över i tystnad istället för att klaga. Samma sak i `multiEffect`s sub-typ-switch: en sub-typ som inte matchade NÅGON `else if`-gren försvann rakt igenom loopen utan spår. Ingenting i typsystemet, testsviten eller runtime fångade detta — `EventEffect`-typen tillät fälten som optional, så TypeScript klagade aldrig, och ingen befintlig test konstruerade ett ofullständigt effektblock för att bevisa att resolvern skulle klaga.

**Fix:** Varje case som kräver ett obligatoriskt fält ska kasta (`if (!pid) throw new Error(...)`) istället för att tyst hoppa över blocket — ett fel vid resolutionstillfället är billigare att hitta än en spelare som aldrig märker att kaptenstalet inte gjorde något. `multiEffect`s `try/catch` runt `JSON.parse` fick separeras från valideringen (parse-fel ska tystas, saknat-fält-fel ska INTE fångas av samma catch) — annars slår den nya vaktens `throw` ihjäl sig själv i samma block den skulle skydda.

**Känn igen:** Ett `EventChoice`.subtitle som lovar en siffra/effekt som inte syns i state efter resolution. Ett effektblock konstruerat utan alla fält typen tillåter som optional. `if (x) { ... }` utan `else` runt en effekttillämpning i en resolver-switch.

**Historik (2026-08-17):** Choice-label-svepet (2.5) jämförde alla `EventChoice`-etiketter mot faktiskt `effect`-beteende och hittade fyra sådana no-ops samtidigt — se `docs/CHOICE_LABEL_SVEP_2026-08-17.md`. En femte, angränsande bugg (`varsel offer_pro`s storyline skrevs oberoende av om effekten lyckades) visar samma familj en nivå upp: inte bara "effekten uteblev tyst" utan "narrativet firade en händelse som aldrig hände".

**Historik (2026-08-17):** Å5 i SLUTTEST-KÖN — GPT:s fynd "skadeporträttet blåses upp till ~150px" verkade motsägas av `SquadScreen.tsx:249` (huvudlistans rad), korrekt storysatt sedan 2026-05-24. Kodläsning där gav slutsatsen "fyndet är inaktuellt". Browser-verifiering vid 390px på rätt scen (`trupp-kris`, kris-raden för skador/avstängningar/moral/utgående kontrakt) visade SVG:er på 208–221px — buggen levde på `SquadScreen.tsx:568`, ett helt annat anropsställe för samma `getPortraitSvg`-hjälpare, utan någon wrapper alls. Fyra andra anropsställen (`GranskaSpelare.tsx` ×2, `LockerRoomCard.tsx`, `LockerRoomMap.tsx`) var samtliga korrekt storysatta — enda trasiga instansen.

## 46. En scen som failar ibland lär oss att ignorera röda scener — flakar den igen är det grindproblemet, inte otur

**Mönster:** `visual-regression`-jobbets `taktik`-scen (EXTRA_HEIGHT, 3600px-viewport) failade en gång (2026-08-18, körning `32191934694`, commit `43f9e3f7`) på en höjdmismatch (2155px→2184px, 61311 pixlar olika) trots att ingenting i de två föregående commitsen rörde `TaktikScreen.tsx` eller delad CSS. Omkörning av samma jobb (samma commit) gav grönt — `taktik` var inte med i den andra körningens fellista.

**Rotorsak för LOGGEN, inte för buggen:** projektet har redan dokumenterad historik av instabilitet just i höga/EXTRA_HEIGHT-scener (sticky dev-nav vid stitchning, cross-OS-fontrendering, DevScenesScreens scroll-sammanhang — se DEV-SCENSKALET-sektionen i `CLAUDE.md`). Ett enda flak i en känd instabil scenklass klassificerades som miljöbrus efter en omkörning, inte som en kodregression — men det är precis den bedömningen som är farlig att göra slentrianmässigt.

**Varför det här är en egen lärdom och inte bara "flakes händer":** en scen som failar ibland fostrar en vana — att se en röd `taktik`-rad och tänka "known flake, kör om". Den vanan är själva risken. Om `taktik` (eller en annan EXTRA_HEIGHT-scen) flakar en ANDRA gång ska den INTE köras om och glömmas — två flak i samma scen är ett mönster, inte otur, och då ska scenens EGEN mätmetod utredas (stitchning, viewport-hantering, timing) precis som `tapTargetGate.visual.ts`s `navGate`-tillägg och `sceneRegistry.ts`s `EXTRA_HEIGHT`-hantering redan är svar på tidigare instanser av samma klass.

**Känn igen:** ett `visual-regression`-fel i en EXTRA_HEIGHT-scen där diffen är en HÖJDMISMATCH (inte en färg-/layoutdiff) och ingen ändrad fil har någon rimlig koppling till scenen. Reflexen "kör om" är rätt EN gång. Andra gången är reflexen fel.

## 47. Fjärde skalet-stör-fotot-buggen — men denna gången var det inte skalet

**Mönster:** CLAUDE.md:s regel "DEV-SCENSKALET FÅR INTE PÅVERKA DET SOM FOTOGRAFERAS" dokumenterar tre incidenter (sticky dev-nav vid stitchning, `zIndex:999` över `--z-modal`, saknat eget scroll-sammanhang). En fjärde incident (2026-08-22, BatchStack-verifiering): varje mitt-i-säsongen Portal-dev-scen (`portal-tom/normal/full/grind/bid-*`) visade en full-viewport `AnslagOverlay` som täckte allt, oavsett scen-param, scroll eller `pendingScene`-overrides.

**Skillnaden mot de tre tidigare:** den här gången var det INTE skalet. `AnslagOverlay` (`PortalScreen.tsx`, `z-index:300`, appens egna modallager) är korrekt appkod — den gjorde exakt vad den ska givet ett tillstånd. Rotorsaken satt i FABRIKEN: `gameStateFactory.ts`s `atRound()` fejkar en mitt-i-säsongen-historik (fixtures/standings) utan att röra `game.seenAnslag`, så varje seedad scen såg ut som ett tillstånd ingen riktig spelare kan nå (halva säsongen spelad, noll anslag någonsin sedda) — `computeNextAnslag()` hittade därför alltid ett att visa.

**Varför det tog tre gånger längre att hitta:** symptomet ("skärmdumpen visar fel sak") var identiskt med de tre skal-incidenterna, så felsökningen letade i skalet (DevScenesScreen.tsx:s nav/wrapper) först, hittade inget, och landade på "okänd, pre-existing harness-bugg" innan roten faktiskt spårades till fixtur-datan. En `elementFromPoint`-gate (se nedan) hade sparat den rundan genom att peka på VILKET element som täckte, inte anta att skalet var boven.

**Fixen, generellt formulerad:** när en fejkad historik simulerar "spelaren är vid omgång N" måste den även simulera "spelaren har sett allt som en riktig spelare vid omgång N redan sett" — inte bara de fält som direkt driver den vy man testar. `computeNextAnslag()` är redan en tillståndsmaskin; att loopa den till uttömning (istf att räkna upp `AnslagKey`-unionen för hand) backfyller `seenAnslag` korrekt utan att duplicera dess regler.

**Förslag på grind (rapporterat, inte byggt):** en generell ockluderings-check i `tests/visual/scenes.visual.ts` — för varje registrerad scen, `document.elementFromPoint()` på målmarkörens (`data-scene-content` eller scenens egen root) bounding-box-centrum + några interiöra samplingspunkter, och assertera att träffen är markören själv eller en ättling. Fångar BÅDE skal-läckage och legitima-men-fel-tillstånd-överlägg (som denna) utan en underhållen blocklista av "kända fel-scener" — bredare än det tidigare z-index/geometri-fokuset, som per definition inte hade fångat den här varianten (overlayen var legitim UI på rätt lager, inte scaffold-läckage).

**Känn igen:** en dev-scene-screenshot visar fel innehåll och DOM-inspektion (`getBoundingClientRect`) bekräftar att RÄTT element faktiskt finns och är korrekt positionerat — då är något ANNAT ovanpå det. Fråga först "vilket element täcker?" (elementFromPoint), inte "vilket skal-mönster känner jag igen?" — annars letar man i fel lager.

## 48. Grönt test ≠ nåbar kodväg — komponenttestet bevisade mekanismen, inte källan

**Mönster (2026-08-21/22):** `postMatchEventService.ts`s `generatePostMatchEvents()` togs som bevis för att BatchStack-mekanismen (Batch-av-tre, D1 punkt 4) hade en verklig källa — `fanLetter`/`opponentQuote` taggades med samma `triggerGroupId`, commit `51a058ad`, och `PortalEventSlotBatch.test.tsx` var grönt både före och efter. Men den taggade källan kunde ALDRIG nå BatchStack: båda event-typerna är hårdkodade till `choices: []`, `isAmbientEvent()` (`eventQueueService.ts:36-38`) är `event.choices.length === 0`, och `PortalEventSlot.tsx:47-49` returnerar `<AmbientEventRow>` och avslutar komponenten INNAN batch-koden (rad 61, `getBatchSiblings`) någonsin nås. Strukturellt omöjligt, inte ett sällsynt missfall.

**Varför testet inte fångade det:** `PortalEventSlotBatch.test.tsx`s `makeEvent()`-hjälpare default:ar till ett ICKE-tomt `choices`-fält (`[{ id: 'c', label: 'Ett val', ... }]`) — en form ingen riktig ambient-händelse (fanLetter/opponentQuote, båda `REACTION_TYPES` i `granskaEventClassifier.ts`, alltid `choices: []`) någonsin har. Testet bevisade att BatchStack fungerar för normal-prioriterade händelser MED val — en riktig, framtida källa för den klassen skulle fungera. Det bevisade ingenting om huruvida den SPECIFIKA källa som faktiskt taggades kunde nå dit. Två olika påståenden, och bara det första var testat.

**Rotorsaken bakom rotorsaken:** synthetisk testdata (`makeEvent()`) formad efter vad som var BEKVÄMT att skriva i testet, inte efter vad produktionskoden FAKTISKT producerar för den event-typ som skulle bevisas. En grön assertion mot en hjälpfunktion är inte samma bevis som en grön assertion mot en riktig generator.

**Åtgärd 2026-08-22:** taggningen togs bort (`postMatchEventService.ts` — fel klass av källa, ambient/choices-lösa events kan aldrig batchas givet dagens routing). BatchStack-mekanismen i sig är oförändrad och korrekt — den väntar nu medvetet vilande på en generator som producerar ≥2 NORMAL-prioriterade (icke-ambient, riktiga `choices`) events ur samma delade orsak. Ingen sådan finns i kodbasen idag.

**Förslag på grind (rapporterat, inte byggt):** ett dedikerat test (samma familj som `entityDedup.ts`/`occlusionGate.ts`) som scannar KÄND produktionskod för `triggerGroupId`-tilldelningar och assererar att INGEN av dem samtidigt har `choices: []` i samma objektlitteral eller samma konstruktionsfunktions returvärde — dvs. testa mot den riktiga generatorns faktiska output (kalla `generatePostMatchEvents(game, fixture)` med en realistisk fixture, inte `makeEvent()`), inte en hjälpfunktion formad för testets bekvämlighet. Vacuously grön idag (ingen källa sätter `triggerGroupId` längre) — aktiveras automatiskt den dag en ny generator gör det, och skulle ha fångat exakt detta fel innan commit.

**Känn igen:** ett komponenttest är grönt, en mekanism "har en källa" enligt en tidigare commit — men ingen har körd testet mot VAD DEN RIKTIGA KÄLLAN FAKTISKT PRODUCERAR, bara mot en handskriven testdata-hjälpare som råkar ha rätt form för att testet ska passera. Fråga: "skulle det här testet fortfarande vara grönt om jag bytte testdatan mot produktionsfunktionens riktiga output?" Om osäker — byt det, kör om.

**Historik (2026-08-18):** Enda observerade instansen hittills — `taktik`, körning `32191934694` → omkörning `95888984429` (grön). Ingen andra instans loggad än. Om/när nästa uppstår, länka hit och uppgradera denna post från "observerat en gång" till "mönster, utrett".

## 49. Statusfältet är minnet av en order, inte koden — verifiera mot koden innan du bygger runt en "EJ"-rad

**Mönster (samma serie, 2026-08-23/24):** i EN sammanhängande sessionskedja påstod kön (`SLUTTEST_KO.md`/BACKLOG-artefakter) tre gånger att något var obyggt eller saknade konsument, när det redan var färdigt: (1) `MatchLiveScreen` saknade `/dev/scenes`-täckning enligt "Skydd eller illusion?"-auditen (2026-08-20) — registrerad i `sceneRegistry.ts` redan 2026-08-23, alltså stale samma dag den lästes. (2) `O4` (burnout) stod som väntande på D1:s viktning i kön — byggd och committad (`721be4d6`) dagen INNAN kön lästes. (3) `ARSBOKENS_TVASANNINGSMENING_2026-08-23.md` öppnade med "`objectiveOutcome` — datafältet är inte byggt" — fältet fanns redan i `seasonEndProcessor.ts` när raden skrevs.

**Rotorsaken är alltid densamma:** en post skrivs vid ORDERTILLFÄLLET ("bygg X näst") och läses senare som STATUS ("X är obyggt"). Mellan de två tidpunkterna hinner X bli byggt av en annan sessionsgren, en parallell agent, eller samma session tidigare samma dag — men ingen går tillbaka och stänger raden. Kön blir därmed ett protokoll över VAD SOM BESTÄLLDES, inte ett register över VAD SOM FINNS, och de två divergerar tystast just när arbetet går snabbt (flera leveranser samma dag, som här).

**Åtgärd, obligatorisk innan en "EJ byggd"/"väntar på"-rad tas som sanning:** grep:a efter den påstått saknade funktionen/fältet/registreringen i koden FÖRST (samma disciplin som PRE-SPEC CROSS-CHECK, princip 2 i CLAUDE.md, men riktad bakåt mot en påstådd lucka istf framåt mot en ny spec). En rad som säger "X finns inte" är en hypotes att verifiera, inte en fakta att bygga vidare på. Om grep:en hittar X — rapportera fyndet och rätta raden SAMMA session (som denna lärdom självt gör för alla tre instanser, se `SLUTTEST_KO.md` O17-posten och `BACKLOG.md`s clubMemory-rad), fortsätt inte bygga en fjärde implementation av något som redan finns.

**Känn igen:** en instruktion eller köpost som ber dig bygga/fixa X, formulerad som att X saknas — särskilt om ordern är några dagar (eller till och med några timmar) gammal, eller om sessionen vet att flera parallella grenar/agenter arbetat i samma kodbas. Fråga innan du börjar: "har jag verifierat att X inte finns, eller litar jag på minnet av en order?"
