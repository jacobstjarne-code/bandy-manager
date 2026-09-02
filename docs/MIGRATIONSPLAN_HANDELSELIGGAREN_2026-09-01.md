# MIGRATIONSPLAN — HÄNDELSELIGGAREN (strangler, stegvis)

**Datum:** 2026-09-01 · **Av:** Opus · **Grund:** `DOM_HANDELSELIGGAREN_2026-09-01.md` (Jacob valde strangler) · **Typ:** exekverbar sekvens för lanes (Codex/Code), inte en dom. Varje fas är en lane-enhet.

## Invarianten (bryts aldrig)
1. **Dual-write före läsflytt.** En källa skriver BÅDE sitt gamla minne OCH en liggarpost innan någon konsument flyttas.
2. **Retire-last.** Ett spritt fält raderas FÖRST när dess sista läsare flyttat till liggaren. (`d0d4d923`-läxan upphöjd: radera aldrig ett minne med en kvarvarande läsare.)
3. **Ingen big-bang.** En källa/konsument i taget, grönt mellan varje.
4. **Ingen prosa i liggaren.** `text`/`emoji`/`sentence` flyttar till konsumentens vy, lagras aldrig.

## Beroendegrafen (kodläst — det här är vad som migreras)
| Minne | Skrivs av | Läses av | Form |
|---|---|---|---|
| `narrativeBeatLog` | ~8 källor via `logNarrativeBeat` (vid resolution) | `isOnCooldown`, `wasLoggedThisRound`, `systemhandelseBudgetOk` | tunn (semanticKey/säsong/omgång) — **närmast liggarens form** |
| `seasonDecisionCandidates` | `captureSystemDecision` (8 builders + facility, vid resolution, verifierad mot gameAfter) | årsboken | **strukturerad + prosa-`sentence`** — närmast liggarens INNEHÅLL |
| `clubMemory` | INGET lagrat — `getClubMemory` RE-HÄRLEDER ur 7 källor (fixtures/dagböcker/uppflyttningar/landslag/skandaler/storylines/legender) | klubbkrönika, anniversaries | prosa (`text`/`emoji`) inbakad |
| `collectActiveMemories` | aggregerar 9 fält ad hoc (moments/klack/journalist/nemesis/rivalSale/followUps/letters/boardHistory/crisis) | aktiva-minnen-ytorna | 9 olika former |
| ripple-kedjor | `describeRippleChain` (3 systemtriggers) → `pendingRippleChains` | ripple-UI | strukturerad (deltana) |

## FASERNA

### Fas 0 — bygg liggaren + skrivvägen (Code)
- `EventLedgerEntry`-schemat (dom:ens form: type/season/matchday/subject?/outcome?/significance/consequences?/madeByPlayer?), `game.eventLedger: EventLedgerEntry[]`, migration (default `[]`).
- EN skrivväg `logEvent()` — samma disciplin som `logNarrativeBeat` (ren, append, en väg).
- INGA konsumenter än. Verifiering: schemat migrerar rent, tester gröna. Detta är fundamentet, allt annat hänger på det.

### Fas 1 — orsak/verkan som FÖRSTA rena konsumenten (Code)
- Ripple-fångsten (ur `DOM_ORSAK_VERKAN_SCOPING`) skriver en liggarpost vid beslutsresolution (`eventResolver` har before/after) och orsak/verkan LÄSER liggaren. Ingen gammalt fält att retirera — den föds ren.
- **Varför först:** den bevisar liggaren end-to-end på EN feature utan migreringsrisk, och det var den ursprungliga fordran. `DOM_ORSAK_VERKAN_SCOPING` skrivs om: orsak/verkan ÄR liggarens första fönster, inte en fristående feature.

### Fas 2 — seasonDecisionCandidates (närmast formen, låg risk) (Code)
- `captureSystemDecision` DUAL-WRITAR: fortsätt returnera kandidaten OCH skriv en liggarpost (den strukturerade delen — sentence:en INTE med).
- Flytta prosa-genereringen (`sentence`) till årsbokens VY: den läser den strukturerade posten och komponerar meningen där (mallarna finns redan i `seasonDecisionSentences.ts`).
- När årsboken läser liggaren → retirera `seasonDecisionCandidates`.
- **Varför näst:** formen matchar redan (strukturerad + prosa), builders verifierar redan mot state, en enda konsument (årsboken). Renaste migreringen, bevisar retire-cykeln.

### Fas 3 — narrativeBeatLog subsumeras (Code, FÖRSIKTIGT)
- Liggarposten bär `semanticKey` + de rikare fälten → `logEvent` ersätter `logNarrativeBeat`.
- Migrera de TRE läsvägarna (`isOnCooldown`/`wasLoggedThisRound`/`systemhandelseBudgetOk`) till att läsa liggarens semanticKey/säsong/omgång. **De gatar produktionslogik (cooldowns, säsongsbudget) — dual-write, verifiera varje läsväg mot befintliga tester, retirera `narrativeBeatLog` sist.**
- **Varför efter Fas 2:** det är den mest inbäddade av de rena loggarna; gör den efter att retire-cykeln bevisats på seasonDecision.

### Fas 4+ — de stora skanningarna (OPPORTUNISTISKT, ingen schemalagd marsch)
Strangler-regeln, inte ett stopp-allt-pass:
- **clubMemory:** de 7 härledningskällorna skriver liggarposter när de ändå rörs (en fixtur avgörs → liggarpost; en skandal → liggarpost); `getClubMemory` läser liggaren i stället för att skanna, prosan flyttar till vyn. En källa i taget.
- **collectActiveMemories:** de 9 fälten skriver liggarposter vid ändring; aggregatorn läser liggaren. Ett fält i taget.
- **ripple/moments:** sist, när de ändå rörs.
- **Regeln:** allt NYTT konsekvens-skrivande går till liggaren från dag ett (Fas 0). Gammalt migreras när dess feature nästa gång arbetas — aldrig ett eget städpass. Ett fält retireras när dess sista läsare flyttat.

## STANDING RULE (efter Fas 0, gäller alla)
Från och med att liggaren finns: **varje ny konsekventiell händelse skriver en liggarpost. Ingen ny feature får bygga ett eget spritt minne.** Det är så strangler stänger — inte genom att migrera allt gammalt, utan genom att inget nytt läggs till högen, och högen krymper när den ändå rörs.

## ÄGARSKAP & LANES
- **Code:** Fas 0–3 (fundamentet + de tre rena migreringarna) — sekventiellt, grönt mellan varje, en fas per commit.
- **Codex:** Fas 4+ när en av de stora skanningarna ska migreras (brett-och-mekaniskt: en källa skriver dual, en läsare flyttar, ett fält retireras). Håll dig i den källans filer.
- **Opus:** `EventLedgerEntry`-schemats exakta fält (jag skriver det som en kort spec när Fas 0 startar), och dömer om en migrering hotar tappa vad ett gammalt minne bar. Jag domar INTE varje fas-steg — planen ÄR domen.
- **Jacob:** inget mer beslut behövs — strangler vald, sekvensen satt. Nästa gång du behövs är om en fas avslöjar att ett gammalt minne bar något schemat inte fångar (då är det ett vägval, inte en migrering).

**Starta Fas 0. Allt annat hänger på att liggaren + skrivvägen finns.**

---

## EVENTLEDGERENTRY-SCHEMA (låst 2026-09-01, Opus)

Grundregeln: liggaren bär det STRUKTURERADE, aldrig prosan. Varje fält är ett faktum en konsument tolkar fritt, eller en nyckel den slår på. Inget fält bär ton.

```ts
export interface EventLedgerEntry {
  // VAD
  type: EventLedgerType        // sluten union, se nedan — aldrig fri sträng
  semanticKey: string          // narrativeBeatLogs nyckel, bärs från dag ett (Fas 3)
  // NÄR
  season: number
  matchday: number             // kronologi, ALDRIG rond-identitet i UI
  // VEM (valfritt — polymorft så en mecenat/framtida entitet får en VEM-plats
  // utan att schemat växer per typ. `kind` är sluten union, växer medvetet.)
  subject?: { kind: 'player' | 'club' | 'mecenat'; id: string }
  // VAD BLEV DET
  outcome?: 'won' | 'lost' | 'neutral'
  significance: number         // 0-100, samma skala som clubMemory/weights
  consequences?: LedgerConsequence[]  // = ripples åtta fält, vad som SKALVADE
  // BESLUTS-NATUR (bara `type: 'decision'`-poster sätter dessa — A-H9:s
  // rangordningsvektor, så pickSeasonDecision kan rekonstrueras EXAKT ur
  // liggaren. En derby-vinst/skada sätter dem ALDRIG.)
  irreversible?: boolean       // A-H9 fält 2 — beslutets natur, ej dekoration
  tension?: boolean            // A-H9 fält 3 — pekade valet åt olika håll
  systemsAffectedCount?: number // A-H9 fält 4 — HUR BRETT beslutet rörde. EGET
                                // fält, INTE consequences.length: spelartrupp/
                                // mecenatrelation är verkliga dimensioner utanför
                                // ripples åtta fält (6/9 byggare underräknar annars)
  moneyAmount?: number         // A-H9 fält 5, sista skiljedomaren
  // URSPRUNG
  madeByPlayer?: boolean       // HIGH 6:s attributions-skillnad, ärvd aldrig tappad
  systemhandelse?: boolean     // O19:s säsongsbudget-klassning, satt vid event-
                               // skapande. EGEN axel — ett event kan vara
                               // systemhandelse OCH auto-resolvat; ej härledbar
                               // ur type/madeByPlayer.
}

export interface LedgerConsequence {
  field: 'fanMood' | 'communityStanding' | 'boardPatience'
       | 'sponsorNetworkMood' | 'supporterMood' | 'playerMorale'
       | 'finances' | 'transferBudget'   // = describeRippleChains fältmängd
  dir: 'up' | 'down'
  magnitude: 'knappt' | 'tydligt' | 'kraftigt'   // ripple-kedjans skala, återanvänd
}
```

**`type` är en sluten union.** Startmängd = clubMemorys `MemoryEventType` + besluts-typen: `'decision' | 'season_finish' | 'cup_final' | 'sm_final' | 'derby_result' | 'big_win' | 'big_loss' | 'player_milestone' | 'academy_promotion' | 'retirement' | 'facility_built' | 'transfer_signed' | 'transfer_sold' | 'mecenat_change' | 'storyline_resolution' | 'scandal' | 'national_team_callup'`. Utöka unionen när en migrerande källa bär en typ den inte täcker — aldrig en fri sträng som flykt.

**Motivering, där den inte är självklar:**
- `semanticKey` bärs från Fas 0 även om Fas 3 är senare — så att narrativeBeatLogs tre läsvägar kan flytta utan bakåtfyllning.
- `consequences` återanvänder `describeRippleChain`s fältmängd + magnitud-skala EXAKT — ripple-kedjan blir en LÄSNING av liggarposten, inte ett separat minne. `LedgerConsequence` = `RippleChainStep` utan `label`/`scope` (vy-beslut).
- **Ingen `text`/`emoji`/`sentence`/`kind`/`title`** — prosan/tonen genereras i respektive vy ur fälten ovan. "Rå sanning i botten, all mening i ytorna" i typen.
- **Ingen `id` på posten** — append-only + season+matchday+type+subject är identitet nog (clubMemorys `buildEventId` konstruerar den ur just de fälten — bevis att de räcker).

**Skärpning 2026-09-01 (Fas 2-vägval, Opus dom):** `irreversible`/`tension`/`moneyAmount`/`systemsAffectedCount` tillagda + `subjectPlayerId`/`subjectClubId` ersatta av polymorft `subject`. Fas 2 avslöjade att jag mappade schemat mot RIPPLE-fältmängden och antog att den var samma som A-H9 rangordnar på — den är den inte, på två sätt:
- **`systemsAffectedCount` är ett EGET fält, INTE `consequences.length`.** Code:s korskontroll mot alla nio byggare: 6/9 underräknar, side_mec1/2 till NOLL. "Spelartrupp" (roster) och "mecenatrelation" (happiness) är verkliga A-H9-dimensioner utanför ripples åtta fält. `consequences` behålls smalt (= ripples åtta, en LÄSNING av kedjan); `systemsAffectedCount` bär den bredare frågan. Två olika frågor, två fält — inte en genväg via length.
- **`subject` är polymorft** (`kind: 'player'|'club'|'mecenat'`), inte `subjectPlayerId`/`subjectClubId`. Tre byggare bär en MECENAT som namngiven person, som varken player- eller club-id täcker — utan detta skulle deras `namedPerson`-tiebreak tyst scoras som namnlös. Ett fjärde `subjectMecenatId?` skulle bara flytta problemet till nästa entitetstyp; polymorfin bär alla utan att schemat växer per typ. `pickSeasonDecision`s `namedPerson ? 1 : 0` blir `subject !== undefined`.

Bägge bärs BARA av beslutsbyggarna (utom `subject`, som också bär VEM för entitets-händelser). Lärdomen: ripples fältmängd är inte "alla system ett beslut rör" — att anta det var en elegant-men-fel genväg.

**Skärpning 2 (Fas 3-vägval, 2026-09-01):** `systemhandelse?` tillagt — O19:s säsongsbudget-klassning som `systemhandelseBudgetOk` filtrerar på. EGEN axel, ej härledbar ur `type`/`madeByPlayer` (ett event kan vara systemhandelse OCH auto-resolvat). Tredje schema-utökningen — mönstret är nu namngivet: jag underspecificerade schemat mot de GENERELLA händelserna och missade de klassnings-axlar de befintliga minnena redan bar (systemsAffectedCount, subject-mecenat, systemhandelse). Låt inte den befintliga strukturen bestämma vad en post får bära — låt postens faktiska natur bestämma strukturen.

**SKALA-DOM (Fas 3, 2026-09-01, Opus):** narrativeBeatLogs `round`-fält är i dag INKONSEKVENT — `eventResolver`+de flesta `gameFlowActions` skriver `getCurrentLeagueRound` (ligarond), `roundProcessor`s siter skriver `nextMatchday` (global). `wasLoggedThisRound` har alltså jämfört två numreringssystem beroende på vilken familj som skrev posten — en preexisterande BUGG liggaren råkade lysa upp, inte ett Fas 3-problem. **Dom: standardisera ALLA skrivare på global matchday SOM DEL av migreringen** (liggarens `matchday` är per regel global-only; att migrera in blandningen vore att gjuta buggen i fundamentet). MEN det är en LIVE beteendeändring för ligarond-skrivarna, så: (1) regressionstest som fångar cooldown/wasLoggedThisRound-beteendet FÖRE ändringen; (2) Code verifierar att ingen cooldown-fönster-längd är kalibrerad mot ligarond-skalan — om en är det (t.ex. "6 omgångar" som menade ligaronder) blir den kortare i realtid på global skala, och då är det ett ANDRA vägval (justera konstanten), Code stannar igen.

**Två saker medvetet UTE (återinför inte):**
- Ingen `text`/prosa (ovan).
- **Ingen `rippleChainId`/`decisionCandidateId`-referens tillbaka till det gamla minnet.** Frestelsen under dual-write är att länka posten till sitt gamla jag "för säkerhets skull" — gör inte det, då blir liggaren beroende av det den ska ersätta och retire-steget kan aldrig köras. Posten står på egna ben från Fas 0.

Om en migrerande källa bär något schemat inte fångar — STANNA och flagga, det är ett vägval (dom), inte en tyst fältutökning.
