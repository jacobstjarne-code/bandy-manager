# GRANSKA DEL 4 — registret kompletterat, Omgångssammanfattning omdöpt (2026-08-12)

Svar på Jacobs tre beslut + rapporterad lista.

## 1. Bracketblock — bekräftat, INTE byggt
Ingen ändring. Turneringsläge bär värdet i text (redan levererat och inkopplat).

## 2. Omgångssammanfattning → SEDAN SIST
`SectionLabel` bytt från "OMGÅNGSSAMMANFATTNING" till "SEDAN SIST". Ekonomiradens `/omg`-suffix borttaget — `{formatFinance(financesDelta)}` utan svans. Matrisens cell oförändrad (⚠ för cup/slutspel-icke-final, ✕ för final/avsked — `visasFor('omgangssammanfattning', ...)` orörd, bara rubriken och en rad inuti kortet ändrades).

Browser-verifierat: `granska`/`granska-cup`/`granska-slutspel` visar "SEDAN SIST", ingen kvarvarande "OMGÅNGSSAMMANFATTNING" eller `/omg` någonstans i de sex scenerna.

## 3. Avsked — registret utökat istf en fysisk gren

### Fullständig lista: sex sektioner som renderade men aldrig fanns i matrisens tolv rader

| Sektion | Vad den är | Varför den missades av matrisen |
|---|---|---|
| Kritiska events (+ "X spelarhändelser i Spelare-fliken" + "X notiser i inboxen") | Upp till tre beslutskort ur `pendingEvents` (transferbud, kontraktskrav, ekonomikris, m.fl.) | Event-driven, oberoende av match — matrisen kartlade bara de tolv "match-info"-sektionerna |
| Presskonferens (`game.pendingPressConference`) | Tidskritisk beslutsprompt | Samma skäl — förväxlas lätt med matrisens "Press/Media"-rad, men är en annan mekanism (interaktivt beslut, inte en passiv rubrik) |
| CS-pressfråga (`game.pendingCSPress`) | Beslutsprompt, community standing | Samma skäl |
| Domarmöte (`game.pendingRefereeMeeting`) | Beslutsprompt | Samma skäl |
| ReaktionerKort ("💬 KRING MATCHEN") | Passiva reaktioner på tidigare beslut | Egen komponent, aldrig granskad mot matrisen |
| NY SKADA (`rs.injuries`) | Skadelarm, danger-stripe-kort | Ligger i samma "Klubben"-grupp som Omgångssammanfattning men är en egen, ogated sektion |

Sex stycken — matchar din gissning ("sannolikt fler än de sex du hittade" var rätt: min ursprungliga lista blandade av misstag in Media, som redan är matrisens "Press/Media"-rad. De verkliga sex är de ovan.)

**Alla sex är ✓ i varje tävlingstyp/skede** — inte för att jag inte kunde komma på en ✕-cell, utan för att skälen till varje potentiell ✕ visade sig vara samma insikt som fällde det första tribute-gren-försöket: en väntande presskonferens eller en skadeanmälan handlar inte om matchen, den handlar om saker som fortfarande kräver ditt beslut oavsett vilken match som just spelades. Att tysta dem vore samma regression i registerform.

### Implementation
`granskaSectionRegistry.ts`: `GranskaSection`-typen utökad med `criticalEvents | pressConference | csPress | refereeMeeting | reaktioner | nySkada`, alla `return true` i `visasFor`. Samtliga sex JSX-block i `GranskaOversikt.tsx` gated med `visasFor(...)`, trots att värdet alltid är sant — det gör registret till den fullständiga kartan över skärmen (ditt ord: "utan att någon kod behöver veta att avsked är speciellt"), inte bara de rader som råkade granskas. En framtida ändring (om någon sektion NÅGONSIN ska bli ✕ för en matchtyp) är då en enradsändring i registret, inte en sökning genom JSX:en.

Ingen fysisk avgrening av avsked byggd — onödig nu när registret är komplett. Visuellt identiskt med om en gren hade byggts (samma sektioner syns/döljs), men utan risken en andra fysisk gren skulle upprepa.

## Avsked, oavgjort
Tredje raden inkopplad i `helpers.ts`: "Sista matchen på hemmaisen. Oavgjort, och ingen brydde sig särskilt." — `generateQuickSummary` returnerar den när `tavlingstyp==='avsked'` och varken vinst eller förlust (ett äkta oavgjort, eftersom avsked till skillnad från final/slutspel inte alltid är `isKnockout`).

## Bifynd, inte åtgärdat (utanför det som begärdes)
Under den fullständiga genomläsningen av `GranskaScreen.tsx` för att hitta de sex sektionerna hittades en trolig sjunde: `unresolvedCritical + unresolvedPC + unresolvedRM` (raden som räknar "X ohanterade händelser" och visas ovanför "KLAR — NÄSTA OMGÅNG") **räknar inte `pendingCSPress`**. En obesvarad CS-pressfråga skulle alltså inte trigga varningen, till skillnad från de tre andra beslutstyperna. Detta är inte en registrets-fullständighet-fråga (CS-pressfrågan RENDERAS korrekt, det är räknaren för "kan jag gå vidare"-varningen som missar den) — en annan klass av bugg, i en annan fil. Inte fixat här: det ändrar spärrlogik för att avancera omgången, vilket jag inte vill göra utan ditt go.

## Kod-verifiering
- `npx tsc --noEmit`: rent.
- `npm test -- --run`: 1542/1542 gröna (155 filer).
- `npm run build`: rent, `ds-guard: på baslinje ✓`.
- `npm run lint:design` / `lint:text-guard`: gröna.
- Browser-verifierat samtliga sex granska-scener: "SEDAN SIST" syns där matrisen säger ✓/⚠, inte alls där den säger ✕ (cup-final, SM-final, avsked). Ingen kollateral regression — de sex nya gates:arna är no-ops (alla `true`), verifierat att inget försvann.
- Lokal Playwright: samma mönster som tidigare (pixel-diffar mot Mac-lokala, gitignorade baselines — innehållet ändrades avsiktligt).
