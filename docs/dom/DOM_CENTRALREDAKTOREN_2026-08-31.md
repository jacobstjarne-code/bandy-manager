# DOM — CENTRALREDAKTÖREN: en dirigent över det som ytar per omgång

**Datum:** 2026-08-31 · **Av:** Opus · **Beställd av:** Jacob (koordineringslager, auditens #3) · **Utlöst av:** människoupplevelse-auditen 2026-08-31: stickiness faller i en framgångsrik andra säsong för att vardagen repeterar — samma pressfrågor snabbt, gamla svar följer med, två presskanaler samtidigt.

## Diagnosen (kodläst)

Repetitionen är inte ETT trasigt system. Det är FEM okoordinerade som inte läser varandras nyliga historik:

1. **`generatePostAdvanceEvents`** — den enda genereringspunkten för ~20 event-typer per omgång, prioritetsordnad, kapad vid `events.length >= 2`. Redan en halv dirigent (kapar volym, ordnar prioritet). MEN varje generator gatar med sin EGEN recency: `alreadyQueued`, säsongsscopade id:n, round-period-id:n, rand-chans.
2. **Pressen** (pressConference/csPress) genereras UTANFÖR den funktionen, med sin egen eligibility (templateEligibilityService). Den känner inte till event-blocket, och tvärtom → **två kanaler samma omgång**.
3. **`sourceCooldownService`** — per-källa-spärrar (5 källor), startade vid resolution.
4. **Uppföljningarna** (`pendingFollowUps`) — ett eget spår, 3–5 omgångar senare.
5. **Beat-budgeten** (`systemhandelseBudgetOk`) — ett eget frekvenstak för systemhändelse-taggade beats.

**Men substratet finns redan:** `narrativeBeatLog` loggar `semanticKey` + källa + säsong + omgång för VARJE resolverad händelse och varje källcooldown. Och EN generator använder det rätt: journalistExclusive (A-H4a) läser loggen för säsongsspärr (`journalistExclusiveFiredThisSeason`) OCH subjektsrotation (`pickJournalistExclusiveSubject` — "inte samma spelare förrän hela truppen rullat ett varv"). Det mönstret är beviset att koordinering via `narrativeBeatLog` fungerar. Det är inte byggt från noll — det är generaliserat.

## Domen — en dirigent, tre uppgifter, på befintligt substrat

Dirigenten river INTE de fem systemen. Den lägger ETT beslutslager vid surfacing som alla generatorer (event-blocket OCH pressen) konsulterar, och som läser den delade liggaren.

### 1. Kanal-exklusivitet
Definiera KANALER (press, transfer, orten/mecenat, personal/spelare, ekonomi). Regel: **högst en händelse per kanal per omgång, och ett globalt tak** (dagens `>= 2` blir dirigentens regel, inte en magisk siffra i en funktion). Pressen och event-blocket konsulterar SAMMA tak — surfar pressen redan denna omgång, håller event-blocket tillbaka en press-lik kanal, och vice versa. Det stänger "två presskanaler samtidigt".

### 2. Innehålls-recency
Generalisera journalistExclusive-mönstret till en delad `recentlySurfaced(semanticKey, withinRounds, game)` som läser `narrativeBeatLog`. Varje generator frågar den i stället för sin egen ad-hoc-gate: **samma semanticKey ytar inte inom sitt recency-fönster.** Fönstren per kanal är en designmagnitud (Opus föreslår, mätning bekräftar): press ~4–5 omgångar, personliga beats ~3, systemhändelser säsongstak (som i dag). Gamla SVAR som följer med (auditens fynd) är samma sak en nivå ned — pressvarianten som redan spelats loggas och utesluts tills fönstret passerat.

### 3. Subjekts-rotation
Generalisera `pickJournalistExclusiveSubject` (rotera bort redan figurerade spelare tills poolen rullat ett varv) till en delad `rotateSubject(pool, semanticKeyPrefix, game)`. Star-performance, player-praise, media-comment, captain — alla plockar subjekt via den, så samma spelare inte återkommer förrän truppen roterat. Det gör vardagen VARIERAD utan nytt innehåll: samma malltyp, nytt ansikte.

## SKYDDAT — rör inte
- **De fem systemen står kvar.** Dirigenten är en gate ovanpå, inte en omskrivning. `sourceCooldownService`, press-eligibility, follow-ups, beat-budget behåller sin mekanik — de får en koordinator som läser deras utfall via `narrativeBeatLog`.
- **`narrativeBeatLog` är substratet** — bygg inte en parallell liggare. Om dirigenten behöver se PENDING (inte bara resolverat) läser den `pendingEvents` direkt (finns).
- **Determinismen:** per-fixture-seedingen (`fixtureSeed`) rörs inte — rotationen ska vara deterministisk per save, inte Math.random.
- **journalistExclusive-koden** är mönstret, inte en dubblett att lämna kvar — när den delade helpern finns, pekas A-H4a om till den (en källa).

## GODKÄNT NÄR (mät över en 2-säsongssim, auditens scenario)
1. Aldrig två kanaler samma omgång (kanal-exklusivitet håller).
2. Ingen semanticKey återkommer inom sitt recency-fönster; inget gammalt svar följer med.
3. Subjekt roterar — samma spelare figurerar inte i två personliga beats i rad.
4. Repetitionskänslan i säsong 2 mätbart lägre (färre identiska ytor per 26 omgångar).
Magnitud (recency-fönster per kanal, kanal-tak) via mätning. **D-fact innan commit.**

## Ärlig gräns
Dirigenten STOPPAR repetition; den skapar inte innehåll. "Vardagen utvecklas inte i takt med kassan" är till hälften rotation (denna dom) och till hälften POOL-DJUP (auditens #5, mer innehåll) — som ingen dirigent trollar fram. Den här domen gör det som finns färskare och köper tid; den ersätter inte fler pressfrågor och beats. Räkna med att #5 följer, annars går den fräschaste rotationen till slut varvet runt.

## Ägarskap & timing
Code: bygg de tre delade helpers (`surfacingBudget`/kanal-tak, `recentlySurfaced`, `rotateSubject`) mot `narrativeBeatLog`, peka event-blocket OCH pressgenereringen till dem, peka om journalistExclusive till den delade rotationen → mät 1–4 → D-fact → commit. Opus: recency-fönstren + kanaldefinitionerna (designmagnituder, jag föreslår mot mätning), och dömer utfallet. Jacob: mandatet är givet (koordineringslager); nästa gång du behövs är om kanal-taket blir en känslo-kall, eller när #5 (pool-djupet) ska prioriteras.

---

## OPUS-DEL: kanaler, exklusivitet, recency-fönster, rotation (startvärden 2026-08-31)

Designmagnituderna dirigenten byggs mot. Kanalindelningen och exklusivitetsregeln är LÅSTA designbeslut; fönster- och rotationstalen är STARTVÄRDEN som mätningen ska bekräfta eller justera (D-fact).

### Kanaler (låst)
- **press:** pressConference, csPress, journalistExclusive, playerMediaComment, mediaReaction
- **transfer:** transferBidReceived, bidWar, hesitantPlayer, contractRequest
- **orten:** sponsorOffer, riskySponsorOffer, spoksponsor, mecenatEvent/Interaction/Dinner/Alliance/Conflict/Intervention, patronEvent/Influence, hallDebate/Process, kommunMote, politicianEvent, gentjanst, communityEvent, communityActivityRenewal
- **personal:** playerUnhappy, starPerformance, playerPraise, captainSpeech, dayJobConflict, promotionOffer, shiftConflict, coworkerBond, schoolAssignment
- **manager:** burnoutRelief

### Exklusivitet (låst)
- **Högst 1 per kanal per omgång.** Det är regeln som stänger "två presskanaler samtidigt".
- **Globalt tak 2 per omgång** (behåll dagens känsla — `>=2` blir dirigentens tak, delat mellan event-blocket och pressen).
- **UNDANTAGNA från taket:** `systemhandelse:true` (varsel, detOmojligaValet — en gång/säsong, själva poängen är att de avbryter), retirementCeremony, och HIGH 11:s måste-tier (kontrakts-/licensdeadline). De är sällsynta och pivotala — samma princip som måste bypassar throttlen i HIGH 11. Taket styr ÅTERKOMMANDE flavor, aldrig det sällsynta viktiga.

### Recency-fönster (startvärden — mät + D-fact)
- **press semanticKey: 5 omgångar.** Ingen pressfråga/variant återkommer inom 5 — auditens "samma frågor snabbt" och "gamla svar följer med" är bägge denna gate på semanticKey-nivå.
- **personal beat semanticKey: 3 omgångar.**
- **orten:** de befintliga källcooldownsen står som kanal-nivå (mecenat 4, kommunen 8, orten 6, lokaltidningen 3); dirigenten lägger semanticKey-recency 4 inom en källa ovanpå.
- **systemhändelser:** säsongstak, oförändrat.

### Subjekts-rotation (startvärden)
- Uteslut de senaste `min(poolstorlek − 3, K)` subjekten per semanticKey-prefix, **K = 5**. Garanterar alltid ≥3 färska kandidater så en trupp på ~15 roterar naturligt utan att repetera ett ansikte i rad.
- **journalistExclusive** behåller sitt career-breda varv (hela truppen före upprepning) — rör inte, det är mallen; peka bara om det till den delade helpern.

### Vad mätningen avgör
Om 2-säsongssimen visar att press ännu känns repetitiv vid 5 → höj fönstret (men då slår pool-djupet, #5, i taket fortare — det är signalen att #5 behövs). Om taket 2/omgång känns tomt (för lite händer) → Jacobs känslo-kall, inte en mätning. Talen ovan är golv att börja från, inte låsta sanningar.
