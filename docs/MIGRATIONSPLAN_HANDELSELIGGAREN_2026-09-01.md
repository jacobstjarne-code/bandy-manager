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
