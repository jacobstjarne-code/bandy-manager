# SKISS — Synlighetssprinten (GPT-baserad)

**Datum:** 2026-05-20
**Status:** Skiss, inte spec. För senare designrunda när Spectator-säsongen är wired och playtestad. Konvergerar med Design-Claudes diagnos från annat håll.
**Bakgrund:** GPT's reviderade analys 2026-05-20 efter Opus push-tillbaka. Kärnformulering: *"Ni har byggt djup. Nu måste spelaren känna djupet."* Inte fler system — bättre synlighet, hierarki, kausalitet.

---

## 0 · Sammanfattning

GPT föreslår fem konkreta tickets. Fyra är design + bygge (1-4). Femte är aktivitet (extern playtest). Denna skiss översätter ticket 1-4 till Bandy Manager-konkretion: var landar de i kod, vad finns redan att synliggöra, vad behöver byggas. Ticket 5 är Jacobs sak att exekvera parallellt.

Total uppskattning av sprinten: **~3 designrundor (Opus/Design-Claude) + ~12–15h Code**, beroende på scope-val per ticket.

---

## 1 · Ticket: Efterklang på Portal (GPT #1)

**GPT-formulering:** "1–3 aktiva minnen från klack/press/lag/styrelse. Kort text, inte ny stor vy."

### Vad finns att hämta in (data existerar)

| Källa | Fält | Vad det säger |
|---|---|---|
| `klackEcho` | `{ type, resultMatchday, currentWeight, decayPerRound }` | Klacken minns notable_event upp till 3 omg |
| `journalist.memory[]` | `JournalistMemory[]` | Vad journalisten frågat om + svar + relation-delta |
| `lastRivalSaleMatchday` | number | När senast vi sålde till rival |
| `pendingFollowUps[]` | `FollowUp[]` | Försenade event-konsekvenser |
| `bandyLetters[]` | `BandyLetter[]` | Brev från supporters |
| `boardObjectiveHistory[]` | season + result + ownerReaction | Styrelsens minne av tidigare säsong |
| `nemesisTracker` | per opponent-spelare som målat mot oss | Hot från rivalspelare |
| `economicCrisisState` | phase, eventsFired[] | Ekonomisk båge pågående |

### Vad som behöver byggas

**Ny secondary-komponent: `EfterklangSecondary`** (intern arbetsnamn — bättre namn vid designrunda).

Renderar 1–3 rader, en per aktiv minne, prioriterat efter recency × weight × emotionell laddning. Format:

```
KLACKEN MINNS · omg 18
"De sjunger fortfarande om Andersson-affären."

PRESSEN MINNS · omg 14
"Hon öppnar kyligare än vanligt efter ditt svar senast."

LAGET REAGERAR · omg 19
"Pep-talk:t satte sig — spelarna pratar fortfarande om det."
```

### Scope / risker

- Komponent: ~2h
- Picker-logik (vilka 1–3 minnen visas just nu, prioritets-algoritm): ~3h
- Beslut: ska detta vara secondary (väger 60–70) eller egen tier? Designrunda krävs
- Risk: vid många aktiva minnen (mid-säsong) kan komponenten bli rörig. Picker måste vara bra

### Värde

🌟🌟🌟 — högst. Detta är synlighetens kärna. Data finns men spelaren ser den inte just nu.

---

## 2 · Ticket: Orsakskrok på reaktiva texter (GPT #2)

**GPT-formulering:** "Efter ditt pressvar..." / "Sedan rivalförsäljningen har tonen varit hårdare på läktaren."

### Vad som behöver göras

Selektiv refaktorering av befintliga textpools så de IBLAND får en cause-prefix när orsaken är spårbar. Inte alla strängar — bara där det finns klar orsak i game state.

**Kandidat-pools för cause-prefix:**

| Pool | Cause-källa | Exempel |
|---|---|---|
| `klackEchoText.ts` | `klackEcho.type` | "Sedan rivalförsäljningen — `[befintlig sträng]`" |
| `kafferum: RIVAL_SALE_KAFFERUM` | `lastRivalSaleMatchday` | "Tre veckor efter affären — `[befintlig sträng]`" |
| `journalist (csPressEventText)` | `journalist.memory[last]` | "Efter ditt svar senast — `[fråga]`" |
| `pendingFollowUps`-render | `followUp.cause` | "Som följd av styrelsemötet — `[konsekvens]`" |

### Implementering

Två alternativ:

**Alt A — Inflätad prefix per string-variant.** Varje pool får 2-3 nya varianter med cause-prefix. Picker väljer cause-variant när orsak finns att referera till.

**Alt B — Wrapper-funktion.** `withCausePrefix(text, cause)` lägger på prefix utanför pool-pickern. Mer DRY men kräver att alla render-sites updateras.

Designrunda krävs för att välja. Min instinkt: **Alt A** — det ligger närmare textpool-paradigmet och ger naturligare prosa per variant. Alt B kan ge generisk staccato ("Sedan rivalförsäljningen. [punkt]").

### Scope / risker

- Per pool: ~1h textförfattande + ~30 min logik för cause-detect och picker-uppdatering
- 4 pools × 1.5h = ~6h om alla görs i en sprint
- **Värd att inte göra allt på en gång.** Plocka 1–2 högvärdes pools (klackEcho + journalist) som pilot. Mät om spelaren märker skillnad. Skalа sedan.
- Risk: överanvändning gör spelet didaktiskt ("För varje sak du gör finns en konsekvens"). Bättre att bara 30–40% av reaktiva texter har cause-prefix, så det blir överraskning när det dyker upp

### Värde

🌟🌟 — högt, men det är finlir. Förutsätter att ticket #1 (efterklang-komponent) inte redan löser kausalitet via dedikerad yta. Om #1 finns blir #2 kanske onödig.

---

## 3 · Ticket: Portal-hierarki (GPT #3)

**GPT-formulering:** "En primär sak. En sekundär sak. Resten lägre. Stor skillnad mellan ett spel som säger 'här är åtta relevanta saker' och 'det här är vad du måste bry dig om nu'."

### Vad finns redan

Portal har redan tre tiers (primary/secondary/minimal) via CARD_BAG-arkitekturen. Hierarkin är *teknisk* — frågan är om den är *visuellt synlig*.

### Vad som behöver göras

**Detta är inte ett bygge — det är en designrunda.** Specifikt:

1. Layout-audit av Portal — räkna hur mycket visuell vikt varje tier får. Idag verkar primary, secondary och weekly-decision/event/queue-rail alla kämpa om uppmärksamhet
2. Beslut: ska primary få mer dominans? Större font, mer luft, distinkt bakgrund?
3. Beslut: ska secondary-section synas mindre? Kollapsad som default?
4. Beslut: ska "dagens viktigaste beslut" (`pendingWeeklyDecision`) lyftas upp till primary-tier vid hög-vikt-beslut?

### Risker

- Stor risk för regression. Portal är central och har många kort som testats individuellt över tid
- Kräver att 15-min-testet är gjort innan — vi vet inte vilken vy som faktiskt drunknar förrän vi sett någon spela
- Riskerar att bryta R3-arbetet (endgame-tonalitet) om CSS-tokens omflyttas

### Värde

🌟🌟 — högt potentiellt värde, men ska INTE göras innan 15-min-testet. Underlaget från testet styr riktningen.

---

## 4 · Ticket: Efter-match-kvitto (GPT #4)

**GPT-formulering:** "Inte bara matchhändelser. En rad om hur spelarens val märktes." Exempel: "Din defensivare andra halvlek minskade deras chanser." / "Beslutet att starta den slitne libero:n syntes efter minut 70."

### Vad finns redan

`MatchReport` (`Fixture.ts`) innehåller `playerRatings`, `shots`, `corners`, `playerOfTheMatchId`, `matchProfile`. Match-events är `MatchEvent[]`. `MatchResultScreen.tsx` renderar resultatet.

Inget spårar uttryckligen "spelarens val × matchutfall" idag. Däremot finns data att härleda:

- Halvtidstaktik-byten (om de loggas i match-event-strömmen)
- Startande lineup vs benchade spelare med dålig kondition (`Player.condition`)
- Pep-talk-val (om sparas i state)
- Kapten utsedd (`game.captainPlayerId`)
- Aktiv tränararvet-fas (`game.trainerArc?.phase`)

### Vad som behöver byggas

**Ny komponent: `ManagerImpactRow`** i `MatchResultScreen.tsx` (eller motsvarande match-rapport-yta). Renderar 1 rad (sällan 2) om manager-val som syntes i matchen.

Picker-logik måste härleda detta från matchen post-hoc — vilket är icke-trivialt. Möjliga heuristiker:

- Om starting lineup hade spelare med condition < 40 och hen hade rating < 6.0 → "Lind verkade sliten — du startade honom ändå."
- Om halvtid taktik-bytes och andra halvlek hade lägre xG-against → "Försvarsändringen i andra minskade deras lägen."
- Om benchad spelare med condition > 80 och laget tappade tempo → "Olsson satt på bänken. Med honom hade tempot kanske hållit."

### Scope / risker

- Picker-logik per heuristik: ~2h per (5-6 heuristiker = ~10-12h)
- Komponent: ~1h
- Risk: heuristikerna kan kännas konstgjorda om de bygger på korrelation snarare än kausalitet. Spelet ser inte direkt orsak-verkan eftersom matchsimuleringen inte vet vilka val som var "viktiga"
- Mildring: hellre färre starka heuristiker (3-4) än många svaga
- Alternativ approach: spara explicit `managerChoiceLog` under matchen som lagras med `MatchReport`. Då kan picker bygga på faktiska val, inte härledning. Större jobb men renare data

### Värde

🌟🌟🌟 — högt. Detta är *exakt* vad GPT pekar på — matchen ska kännas som test av spelarens beslut, inte simulerad händelse. Värt även om bara 3 heuristiker landar bra.

---

## 5 · Ticket: 15-min extern playtest (GPT #5)

**Inte design, inte bygge.** Jacobs aktivitet:

- Hitta någon icke-utvecklare (Hanne, Erik, annan i kretsen)
- Be dem spela 15 min med skärm-rec och tänkhögt
- Mät:
  - Sekunder från klubbval till första matchresultat
  - Antal "vad ska jag göra nu?" + "spelar det här någon roll?"
  - Final-fråga: "vill du spela en match till?"
- Skicka inspelning + observationer

Detta levererar **underlaget** för att prioritera ticket 1-4 mot varandra. Utan det gissar vi.

---

## 6 · Prioriterad ordning (Opus rekommendation)

**Fas 1 (parallellt med Spectator-säsongen):**
- Ticket #5 — playtest. Jacobs. Sätts upp inom 1 vecka

**Fas 2 (efter Spectator-säsongen wired):**
- Ticket #1 — Efterklang på Portal. Designrunda + bygge. Mest direkt synliggörande av befintlig data. Värde 🌟🌟🌟

**Fas 3 (efter playtest-data + Efterklang-erfarenhet):**
- Ticket #3 — Portal-hierarki. Designrunda först, styrt av playtest-fynd
- Ticket #4 — Efter-match-kvitto. Designrunda + bygge

**Fas 4 (sist, om kvar):**
- Ticket #2 — Orsakskrok på reaktiva texter. Selektiv refaktorering. Kanske onödig om #1 redan löser kausalitet via dedikerad yta

---

## 7 · Vad denna skiss INTE är

- Inte spec — ingen Code-brief levereras härifrån utan designrunda per ticket
- Inte komplett — picker-algoritmer (ticket #1, #4), prefix-pattern (ticket #2), layout-tokens (ticket #3) är öppna frågor
- Inte färdigprioriterad — playtest-fynd kan flytta om ordningen helt

---

## 8 · Sammanvägd diagnos

GPT och Design-Claude konvergerar från olika håll på samma observation: **systemen finns, synligheten saknas**. Design-Claudes top-1 (Spectator-säsongen) stänger ett *narrativt hål*. GPT:s top-3 (Efterklang + Hierarki + Efter-match-kvitto) gör *befintliga system synliga*. Båda är värdefulla. De är inte samma sprint.

Konkret sekvens: Spectator-säsongen klar → playtest → designrundor på Efterklang → bygge → playtest igen → vidare beslut. Det är 4-6 veckors arbete om allt går smidigt. Inte 1 sprint.

---

— Opus, 2026-05-20
