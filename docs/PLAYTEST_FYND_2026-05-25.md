# PLAYTEST-FYND + CODE-UPPDRAG 2026-05-25 (commit 3c6fac0)

**Av:** Opus. Playtest av Jacob (Målilla, cup-semifinal vs Karlsborg). Diagnos via
kodläsning — inte gissning. Tre regressioner + två trupp-frågor. Det som funkar: bud ej
viktigt, Wallin-budsekvens, matchtitel ("Cupen: Målilla–Gagnef 10–7"), träningssekvens.

═══════════════════════════════════════════════════════════════════════════
## REGRESSION 1 — Bandyskolan primary i cup-semifinal (3A var fel yta)
═══════════════════════════════════════════════════════════════════════════

**Jacobs fynd:** ORTEN-kortet (kommunens bandyskole-erbjudande) ligger överst, ovanför
cup-semifinalkortet. "Trodde vi åtgärdat detta?" — vi trodde 3A fixade det.

**ROOT CAUSE (kodläst, definitiv):** 3A var riktad mot FEL YTA. Vi la
`event_critical: 0.5, patron_demand_unmet: 0.5` i `CHARACTER_BIAS.cup_day` i portalBuilder.
Men ORTEN-kortet renderas INTE av buildPortal alls.

Renderingsordning i `PortalScreen.tsx`:
```
SituationCard (CUPEN-objektiv) → ... → PortalEventSlot (ORTEN!) → Primary (matchkort) → ...
```
`PortalEventSlot` läser `getCurrentAttention(game)` och visar nästa icke-kritiska
GameEvent inline. Bandyskolan är ett `communityEvent` (priority 'low', från `generateEvents`
i eventProcessor → pendingEvents). PortalEventSlot renderar det OVANFÖR matchkortet och har
NOLL round-character-medvetenhet — den skippar bara `critical` (de går till EventOverlay).

`CHARACTER_BIAS.cup_day` biasar bara CARD_BAG (primary/secondary/minimal-tier). PortalEventSlot
är en separat yta utanför buildPortal. Därför gjorde 3A (och 3B) ingenting för det här.

**PRINCIP (Opus sätter):** Ett icke-brådskande community-event får inte tränga undan en
höginsats-match i event-sloten. En bandyskole-rekrytering kan vänta tills cup-helgen är spelad.
PortalEventSlot måste respektera round-character — precis som kortbagen gör via cup_day.

**FIX (Code):** I `PortalEventSlot` (eller attentionRouter) — defer low/normal-priority
events när kommande managed-match är höginsats: cup-match, derby, eller SM-final. Återanvänd
befintliga triggers (`nextMatchIsBigGame`/`nextMatchIsDerby`/`nextMatchIsSMFinal` i
matchTriggers, eller `getRoundCharacter` === 'cup_day'/'pre_derby'). Behåll 'high'-events
(de har egen brådska). 'critical' hanteras redan av overlay.

VIKTIGT: deferring får INTE konsumera eventet. Returnera null från sloten → eventet ligger
kvar i pendingEvents (ej resolved) och surfar nästa icke-cup-omgång. Verifiera att kö/
decision-budget inte desyncar (PortalQueueRail/getActiveDecisionCount). Eventet ska VÄNTA,
inte försvinna.

**Verifiering:** Cup-semifinal-omgång → ORTEN/bandyskola syns INTE i event-sloten ovanför
matchen. Nästa vanliga liga-omgång → erbjudandet dyker upp igen, intakt. Skärmdump av båda.

═══════════════════════════════════════════════════════════════════════════
## REGRESSION 2 — "Tre poäng" i bandy + i cup (två fel staplade)
═══════════════════════════════════════════════════════════════════════════

**Jacobs fynd:** Media-rubrik "Tre poäng som inte ska tolkas för optimistiskt" efter cup-
match. Fel 1: bandy ger TVÅ poäng för vinst, inte tre (fotbolls-ism). Fel 2: i CUP delas
inga poäng ut alls.

**FEL 1 — ÅTGÄRDAT AV OPUS (svensk text, min yta):** journalistHeadlineStrings.ts —
tre "tre poäng" → "två poäng" (WIN supportive/sensationalist/critical), och draw critical
"Två tappade poäng" → "En tappad poäng" (i 2-poängssystem tappar man en poäng på oavgjort).
Plus narrativeProcessor.ts derby-preview "mer än tre poäng" → "mer än två poäng". KLART.

**FEL 2 — CUP-FRAMING — ÅTGÄRDAT AV OPUS (Jacob valde: filtrera bort):** `pickHeadline`
fick en valfri `isCup`-param (default false, andra anropare opåverkade). När isCup filtreras
poolen på `/poäng/i` — poäng-språk bort för cup, med guard så poolen aldrig töms.
`generatePostMatchHeadline` skickar `fixture.isCup`. Verifierat att `pickHeadline` bara
anropas därifrån (mediaService bygger media-items via annan väg, importerar inte pickHeadline).
Determinismen bevaras (samma fixtureId+matchday → samma filtrerade pool → samma val). KLART.

**Verifiering (Code):** Cup-vinst → ingen rubrik som nämner poäng. Liga-vinst → poäng-
rubriker kan fortfarande dyka upp (nu "två poäng", bandy-korrekt).

═══════════════════════════════════════════════════════════════════════════
## REGRESSION 3 — "🛡 Gagnef" obegriplig enradare — ÅTGÄRDAD AV OPUS
═══════════════════════════════════════════════════════════════════════════

**Jacobs fynd:** "🛡 Gagnef" bar i inboxens NYHETER. 1C-fixen täckte Media/MediaEvent-titlar
men inte detta.

**ROOT CAUSE (kodläst):** Det är opponentQuote-eventet (postMatchEventService, titel
`🛡 {opponentClubName}`). När low-events spiller över cap (`MAX_ATMOSPHERIC_PER_ROUND`=2 /
`MAX_LOW_IN_QUEUE`=5) i roundProcessor mappas de till inbox med `title: e.title` rakt av.
Så event-titeln ÄR inbox-titeln.

**ÅTGÄRDAT (Opus, svensk text):** opponentQuote-titeln → `🛡 {opp} efter matchen` /
`🛡 {opp} efter derbyt`. Subjekt + vad det är, inte bara klubbnamn. Eftersom inbox-spillet
återanvänder event.title propagerar fixen dit. KLART.

**Verifiering (Code):** Efter en match med 3+ måls marginal → inbox visar
"🛡 {motståndare} efter matchen", inte bar klubbnamn.

═══════════════════════════════════════════════════════════════════════════
## TRUPP-FRÅGA A — Taktik "skulle inte den byggas om?"
═══════════════════════════════════════════════════════════════════════════

**Svar (Opus):** Nej — taktik var ALDRIG i trupp-redesignens scope. Redesignen täckte
NU-vyn (statushubb), TRUPP (PlayerRow-listan) och PlayerCard (modal). TAKTIK-fliken behöll
sin befintliga `TacticBoardCard` (formationstavla, KEMI, ANTECKNINGAR). Den renderas oförändrad.

Om taktik SKA byggas om är det ett eget scope-beslut (Jacob äger), inte en bugg. Ingen spec
säger att den skulle röras nu. Säg till om den ska in i en framtida sprint så specar Opus den.

═══════════════════════════════════════════════════════════════════════════
## TRUPP-FRÅGA B — Squad-pulse "trist att den är tom i början" + kontradiktion
═══════════════════════════════════════════════════════════════════════════

**Jacobs fynd:** NU-vyns puls-hero visar "61 ↓5" OCH "Pulse-data byggs upp" samtidigt
(skärmdump 4). Och den känns tom/trist i början.

**TVÅ PROBLEM (kodläst):**

1. **Kontradiktion (Code, liten fix):** SquadPulseHero visar värde+delta ("61 ↓5") så
   snart `prevPulse` finns (≥2 datapunkter), MEN autoRad säger "Pulse-data byggs upp" när
   `!hasData` (`win.length < MIN_POINTS`). Med 2-4 punkter visas BÅDE "61 ↓5" OCH "byggs upp"
   — inkoherent. Designs edge-spec sa "visa BARA aktuellt värde + byggs upp" ("bara" = ingen
   delta). Så deltan som visas bryter mot spec. Minsta fix: dölj deltan tills `hasData`.

2. **"Trist och tom" (Design-fråga — Opus rekommendation):** Detta är en DESIGN-fråga, inte
   bara en bugg — Design specade "<5 datapunkter → byggs upp"-beteendet. Men det landar dåligt.

   **Opus rekommendation (grundad i datamodellen):** "Pulse-data byggs upp" är konceptuellt
   FEL. Vi har FULL komponent-data från omgång 1 — fitness, moral, skador är alla kända direkt.
   Puls-VÄRDET är beräkningsbart från omgång 1. Det enda som "byggs upp" är TRENDEN (sparkline-
   formen + deltan). Så:
   - Visa värdet + en RIKTIG komponent-baserad auto-rad från omgång 1 ("Truppen är frisk." /
     "Två skadade...") — de funkar direkt, vi vet komponenterna NU.
   - Visa sparklinen så snart ≥2 punkter finns (en kort linje är en giltig linje), inte tom
     20px-spacer.
   - Reservera trend-raderna (fallande/stigande) och deltan till ≥MIN_POINTS.
   - Släng "Pulse-data byggs upp" helt (eller reservera den till bokstavligen noll data, dvs
     allra första rendern innan någon omgång spelats).

   Det gör starten levande istället för tom. autoRad-poolen Opus skrev har redan alla
   komponent-rader — det är bara gatingen (`if (!hasData) return 'byggs upp'`) som tänder
   "byggs upp" för tidigt. Konkret kod-ändring i getPulseAutoRad: ta bort tidiga `!hasData`-
   returen, gata bara trend-grenarna (delta-baserade) på hasData:
   ```
   if (n >= 2) return ...skador...
   if (avgFitness < 60) return ...kondition...
   if (avgMorale < 55) return ...moral...
   if (hasData && delta <= -8) return ...fallande...
   if (hasData && delta >= 8) return ...stigande...
   return ...frisk...
   ```
   Plus: dölj delta-spannet i headern tills hasData (löser kontradiktionen i samma veva).

   **Jacob beslutar:** kör Opus rekommendation (visa värde + komponent-rad från omg 1, släng
   "byggs upp"), eller behåll Designs ursprungliga "<5 → byggs upp" och nöj dig med att bara
   dölja deltan? Opus rek: det förra — det löser både kontradiktionen OCH "trist och tom".

— Opus, 2026-05-25
