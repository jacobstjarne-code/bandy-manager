# PORTALEN — TAKREGEL OCH OMKOMPOSITION (YTA 1)

**Datum:** 2026-08-08 · **Av:** Opus (chat) · **Beslut:** Jacob — portalen är hjärtat och går före den begränsade releasen
**Underlag:** `docs/incoming/Implementationsaudit - tre ytor.dc.html` (yta 1) + läsning av `PortalScreen.tsx` (17 kB, senast rörd 21 juli)
**Kör efter:** `CODE_INSTRUKTION_SLUTTEST_RUNDA4` och baselinen i `CODE_INSTRUKTION_VISUELL_AUDIT_YTA2_YTA3` punkt 1.

---

## Diagnosen, skarpare än auditens

Auditen säger "ingen prioritetsbudget". Det stämmer inte riktigt, och skillnaden avgör var fixen ska sitta.

**Det finns redan en budget.** `buildPortal` returnerar ett rankat `layout` — `primary`, `storySlot`, `secondary`, `minimal` — och `recordPortalShown` matar tillbaka vilka kort som visats så stale-bias kan sänka dem nästa omgång. Det systemet fungerar.

**Budgeten börjar först vid Primary.** Allt ovanför är en platt, ovillkorlig lista i `PortalScreen.tsx`:

```
SituationCard · PortalPhaseMark · PortalUpptakt · PortalSpectatorMark ·
PortalAnniversaryMark · PortalBeat · PortalRoundMark · tutorial-frame ·
AnnandagsValEvent · CallupModal · PortalObjectiveAlert · PortalEventSlot
```

Varje komponent grindar sig själv inuti sin egen render och returnerar `null` när den inget har att säga. Var för sig är det disciplinerat. Men **skärmen kan inte veta vad de kommer att säga innan den renderat dem** — så ingenting kan prioritera mellan dem, och en omgång där sex av dem råkar ha något att säga blir en vägg före det som betyder något.

Fixen är alltså inte ett nytt viktsystem. Den är att lyfta marks från JSX till data, så att den befintliga budgeten kan gälla dem också.

---

## 1. Marks blir data före de blir JSX

Varje mark får en resolver i domänlagret som returnerar innehåll eller `null`:

```ts
resolveAnniversaryMark(game): MarkPayload | null
resolveBeat(game): MarkPayload | null
resolveUpptakt(game, subState): MarkPayload | null
resolveSpectatorMark(game): MarkPayload | null
resolveSituation(game): MarkPayload | null
```

Komponenten renderar en `MarkPayload`, den letar inte längre själv. Skärmen anropar resolvarna, får en lista över vad som *skulle* visas, och bestämmer sedan.

Flytta bara urvalslogiken — inte texten, inte formen. Om en mark i dag väljer sin rad ur en pool ska poolen och valet följa med till resolvern oförändrade.

---

## 2. Takregeln

**REVIDERAD 2026-08-09 efter Codes mätning.** Fördelningen över en simulerad säsong: 1 mark 16,6 %, 2 marks 75,5 %, 3 marks 7,9 %, aldrig fyra eller fem. Snittet är ~2, inte auditens "upp till tolv" — den siffran räknade in handlingar och kronologi, alltså komponenter som finns men sällan samtidigt. Väggen är verklig men två rader hög, inte sex.

Därför gäller: **taket är två rader nu, en rad om baselinen visar att Primary inte klarar vikningen med två.** Det är en mätfråga, inte en smakfråga, och den ska avgöras mot snapshotarna vid 390 px — inte gissas härifrån. Prioritetsordningen nedan byggs oavsett; den avgör vilken rad som ryker i de 7,9 procenten och vilken som ryker om taket sänks till en.

Atmosfärslagret är `SituationCard`, `PortalBeat`, `PortalAnniversaryMark`, `PortalUpptakt`, `PortalSpectatorMark`. När flera har innehåll vinner den mest förankrade — det som hänt, före det som är stämning:

1. `Anniversary` — daterad, sällsynt, syftar på klubbens egen historia
2. `Upptakt` — bara i eskaleringsfönstret, alltså redan sällsynt
3. `Spectator` — gäller bara åskådarläget
4. `Beat` — generisk pool, får fylla tomrummet
5. `Situation` — orientering, faller tillbaka när inget annat vinner

Vid lika: låt stale-bias avgöra via samma mekanik som `recordPortalShown` redan matar. Marks ska registreras där tillsammans med korten.

**Handlingar räknas inte mot taket.** `AnnandagsValEvent`, `CallupModal`, `PortalObjectiveAlert`, `PortalEventSlot` och veckans beslut är saker spelaren ska göra, inte stämning. De grindas av sina egna villkor och står kvar. Men de ska ligga **efter** Primary, inte före — matchen är veckans fråga, allt annat är veckans övriga frågor. Undantag: `PortalObjectiveAlert` när den faktiskt varnar (styrelsen är på väg att fälla dig) får stå före.

**Kronologi är inte innehåll.** `PortalPhaseMark` och `PortalRoundMark` säger vilken fas och omgång det är. Det hör hemma i headern, som redan bär klubbnamn och omgång, inte som egna rader i flödet. Flytta in dem där och ta bort raderna.

**Det som förlorar försvinner inte.** Demoterade marks går ned i `PortalQueueRail` som chips — auditens "Denna vecka"-rad är i praktiken den kön, utbyggd. **Bygg ingen ny komponent för det**; bygg ut `PortalQueueRail` så den bär både väntande beslut och demoterad atmosfär, med antalet synligt.

---

## 3. Ordningen efter omkompositionen

```
header (klubb · fas · omgång)
[en atmosfärsrad]
[ObjectiveAlert — endast i varningsläge]
PRIMARY
QueueRail — "Denna vecka", inkl. demoterade marks
storySlot
secondary
minimalBar
inboxCounter
sticky CTA + nextActionCue
```

Primary ska ligga över vikningen vid 390 px i varje läge utom när ObjectiveAlert varnar. Det är kravet, inte en ambition — mät det i baselinen.

---

## 4. Vad som INTE ändras

Sticky-CTA:n med `getNextActionCue`, grind-läget mot veckans beslut, `scrollToDecision`, `btn-gold`/`btn-warm`-logiken, `IllustrationScene` på finalhelgen, seasonal tone-varsen, auto-skip-effekten och `simulateRemainingStep`. Allt det fungerar och ligger utanför den här ordern.

Ingen ny färg, inget nytt token, ingen ny copy. Om omkompositionen behöver en rad text som inte redan finns: märk `[Opus]` och lämna den till mig.

---

## 5. Baseline — förutsättning, inte efterarbete

Portalen får inte röras innan snapshotarna finns. Fyra tillstånd vid 390 px och 375 px:

- **tom omgång** — ingen mark har något, bara Primary och kön
- **normal omgång** — en atmosfärsrad, två väntande i kön
- **full omgång** — fem marks har innehåll, fyra ska demoteras
- **grind-läge** — veckans beslut olöst, CTA låst, ObjectiveAlert i varningsläge

Utan dem går det inte att visa att omkompositionen är en förbättring i stället för en känsla.

---

## 6. Rapportera innan bygge

1. Vilka av de fem atmosfärsmarkerna har redan sin urvalslogik separerbar, och vilka har den intrasslad i JSX? Det avgör hur stor punkt 1 blir.
2. Registrerar `recordPortalShown` något som gör att marks kan matas in i stale-bias utan att kortens egen rotation störs?
3. Hur många marks har faktiskt innehåll samtidigt i en typisk omgång 14? Kör mätningen över en simulerad säsong och räkna. Auditen säger upp till tolv; jag vill veta snittet, inte taket.

Svara på de tre först. Om snittet visar sig vara två är taket redan nästan uppfyllt och den här ordern ska krympas.
