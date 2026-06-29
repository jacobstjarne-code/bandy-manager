# AUDIT + ANALYS — Synlighet (duka bordet inför Design lördag)

**Datum:** 2026-05-21
**Av:** Opus
**Syfte:** Verifiera skissens datakällor mot kod, jämföra med genren, och avgränsa vad som kan byggas UTAN designbeslut — så Design kommer till ett dukat bord.
**Status:** Audit gjord mot kodbasen. Genrejämförelse från kunskap. Plumbing-förslag konkret.

---

## 1 · Datakälle-audit — verifierat mot `SaveGame.ts`

Skissens åtta källor, kontrollerade mot faktisk kod:

| Källa | Status | Faktisk form |
|---|---|---|
| `klackEcho` | ✅ Finns | `{ type: NotableEventType, resultMatchday, initialWeight, currentWeight, decayPerRound }` — skissen missade `initialWeight`, annars exakt |
| `lastRivalSaleMatchday` | ✅ Finns | `number` (C-T9) |
| `pendingFollowUps` | ✅ Finns | `FollowUp[]` |
| `bandyLetters` | ✅ Finns | `BandyLetter[]` + `bandyLetterThisSeason` |
| `boardObjectiveHistory` | ✅ Finns | `Array<{ season, objectiveId, result: 'met'\|'failed', ownerReaction }>` — exakt som skissen |
| `nemesisTracker` | ✅ Finns | `Record<string, { playerId, name, clubId, goalsAgainstUs, inboxSentAt?, signedBy? }>` |
| `economicCrisisState` | ✅ Finns | `{ startedSeason, startedMatchday, phase, eventsFired[], outcome? }` |
| `journalist.memory[]` | ⚠️ Verifiera | `journalist?: Journalist` finns; `JournalistMemory` är typad. Fält-access (`.memory`) bör bekräftas mot `Narrative.ts` innan Efterklang-pickern rör den |

**Sju av åtta bekräftade direkt.** Skissen påstod "data existerar" — det stämmer, med små formavvikelser som inte ändrar något.

---

## 2 · FYND — byggda men osynliga narrativa system

Auditen avslöjade fler källor än skissen listade — och flera är *byggda men har ingen renderingsyta*:

| System | Fält | Status |
|---|---|---|
| **Moment-feed (M7)** | `recentMoments?: Moment[]` (max 5, newest first) | Populeras (12 källtyper). **Ingen komponent renderar den.** Sökning på `*Moment*`, `*Orten*`, `*Feed*` ger bara `OrtenMap` (karta), `MomentumBar` (matchgrafik) och `CommentaryFeed` (match) — ingen Orten-feed-yta |
| **Spelar-narrativ** | `Player.narrativeLog` (20 entries/spelare) | `narrativeService.ts` genererar rika rader (första målet, hattrick, debut, skada, milstolpar). Visas i spelarkort men aggregeras aldrig till klubbnivå |
| **Segrarens eko** | `pendingVictoryEcho` + `victoryEchoExpires` | Sprint 12. Byggt. Synlighet oklar |
| **Storylines** | `storylines?: StorylineEntry[]` | V1.0. Aggregeras inte till Portal |
| **Klubblegender** | `clubLegends?: ClubLegend[]` | V1.0. Egen yta, men kopplas inte till nutida eko |

`Moment`-systemets källtyper är redan precis det Efterklang vill visa:
`derby_win`, `star_injury`, `mecenat_left`, `nemesis_signed`, `sponsor_positive/negative`, `transfer_story`, `season_highlight`, `era_shift`, `rival_sale`, `captain_crisis`.

**Slutsats:** problemet är inte "inboxen gömmer bra innehåll". Problemet är att vi byggt fem-sex narrativa minnessystem och kopplat renderingsyta till nästan inget av dem. `Moment` är den tydligaste — den är designad som feed och har ingen feed.

Detta bevisar GPT/Design-diagnosen på datanivå: **systemen finns, synligheten saknas.** Det är inte en gissning längre.

---

## 3 · Genrejämförelse — hur de stora hanterar samma problem

### Football Manager (referensen)

Inboxen *är* ryggraden. Allt går genom den — nyheter, styrelse, scout, press, social feed. Tre grepp som är direkt överförbara:

1. **Actionable vs informational-split.** FM avbryter dig bara för saker som kräver ett *beslut*. Allt annat (resultat, ryktesnyheter, reaktioner) flödar till inboxen utan att stoppa dig. "Continue"-knappen stannar intelligent bara vid det som behöver din hand. **Det här är exakt lösningen på dash-kö-problemet (A).** Vi tvingar spelaren genom åtta avbrott varav de flesta är informational — FM hade skickat dem till feeden.

2. **En feed värd att läsa.** FM:s inbox/social-feed är där berättelsen om din save lever. Spelare läser den för att den är bra. Bandy Manager *har* innehållet (Moment, narrativeLog, Allehanda, Per Berg) men antingen osynligt (Moment) eller begravt (inbox) — medan medelmåttiga avbrott trycks i ansiktet. **Bakvänt mot FM.**

3. **Konfigurerbar avbrottströskel.** FM låter dig välja vilka kategorier som avbryter vs går tyst till inbox. Vi behöver inte gå hela vägen dit, men principen — *spelaren ska inte tvingas genom allt* — är kärnan.

### Out of the Park Baseball

Samma inbox-tyngd, plus en nyhets-ticker med konfigurerbar viktströskel. Lärdom: en *digest* (en skannbar vy) slår *sekvens* (N popups) när mycket händer samtidigt.

### Motorsport Manager

Pre-race-briefing som EN strukturerad skärm, inte sekventiella popups. Relevant för guide-vid-start-frågan: en digest-skärm, inte en overlay-kedja (vilket var det som inte funkade förr).

### Post-match (FM:s data hub)

Tränarens påverkan visas via stat-deltan (xG före/efter ett byte), inte påståenden. Det är Ticket #4 (efter-match-kvitto) gjort med data, inte med text som hävdar orsak. Stöder skissens "managerChoiceLog → riktig data"-spår framför härledning.

### Tre överförbara mönster

1. **Actionable/informational-split** → löser A (kön)
2. **En narrativ feed värd att läsa** → löser B (Moment/narrativeLog finns, saknar yta)
3. **Digest framför sekvens** → löser både A och guide-vid-start

---

## 4 · Vad som kan byggas NU — plumbing, noll designbeslut

Auditen ändrar plumbing-planen. Aggregatorn ska inte byggas från noll — `Moment` är redan ryggraden.

### 4.1 · `collectActiveMemories(game): ActiveMemory[]` — unifierande aggregator

Normaliserar alla narrativa minnen till EN ström:

```typescript
interface ActiveMemory {
  source: 'moment' | 'klack' | 'journalist' | 'nemesis' | 'rival_sale'
        | 'follow_up' | 'letter' | 'board_history' | 'economic_crisis'
  matchday: number
  season: number
  weight: number        // recency × källvikt — RÅ vikt, ingen prioritering
  kind: 'triumph' | 'scar' | 'tension' | 'neutral'
  title: string
  body: string
  subjectPlayerId?: string
  subjectClubId?: string
}
```

`recentMoments` mappas rakt in (den har redan title/body/source/matchday). De övriga sju källorna wrappas till samma form. **Ingen picker, ingen rendering, inget visningsbeslut** — bara datalagret samlat och normaliserat. Design bestämmer sen vilka som visas och hur. ~3h.

### 4.2 · `classifyInterrupt(item): 'actionable' | 'informational'` — FM-greppet

Ren funktion som taggar varje väntande avbrott (anslag / event / veckobeslut / fas-markör) som beslut-krävande eller FYI. **Tröskeln/policyn är Designs beslut** — men klassificeringsfunktionen och instrumenteringen byggs nu. Detta är infrastrukturen som gör A-problemet lösbart. ~2h.

### 4.3 · `managerChoiceLog` i `MatchReport` — råvara för Ticket #4

Fånga manager-val under match (halvtidsbyten, start av sliten spelare, pep-talk, kapten) och lagra i `MatchReport`. Efter-match-kvittot bygger då på faktiska val, inte härledning. Design formulerar kvittot — råvaran finns. ~2h.

### 4.4 · Kö-instrumentering — hård data om A

Räkna avbrott per advance, kategoriserat. Då vet vi om det är åtta, och vilka typer som dominerar. Underlag för Designs throttle-beslut. ~1h.

### 4.5 · Verifiera Moment-writern — audit-uppföljning

`recentMoments` *deklareras* i SaveGame, men skrivs den under spel? Måste bekräftas att feeden faktiskt populeras innan vi bygger en yta för den (annars är den död som board_meeting var). ~30 min verifiering.

---

## 5 · Vad som väntar Design lördag — besluten

Picker-algoritm (vilka minnen, vilken vikt), Efterklang som secondary eller egen tier, throttle-tröskel för kön, kvittots formulering, Moment-feedens placering och form, guide-vid-start (digest, inte overlay — overlay testades och föll). Allt omdöme om vad spelaren ska *se*.

---

## 6 · Det dukade bordet

När Design kommer lördag finns:
- `collectActiveMemories` — allt narrativt minne i en normaliserad ström, redo att prioriteras och visas
- `classifyInterrupt` + kö-mätning — A-problemet kvantifierat och lösbart
- `managerChoiceLog` — kvittot har riktig data
- Verifierad Moment-writer — vi vet om feeden lever

Då blir lördagen designbeslut, inte infrastruktur. Och vi vet redan riktningen från genren: färre tvingade avbrott (A), en feed värd att läsa av material vi redan genererar (B).

---

— Opus, 2026-05-21
