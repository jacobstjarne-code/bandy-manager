# Event-klassificering — alla 43 GameEventTypes

**Datum:** 2026-05-04  
**Utförare:** Code  
**Status:** GODKÄND AV OPUS 2026-05-04 — väntar på Fas 2-integration (pausad pga shot-audit)  
**Ref:** SPEC_GRANSKA_VERIFIERING_2026-05-04 Fas 2, steg 2

---

## Klassificeringslogik

Fyra kategorier styr routing i Granska:

| Kategori | Visas i | Blockerar CTA | Auto-resolvas |
|---|---|---|---|
| **CRITICAL** | GranskaOversikt (max 3) | Ja, om olöst | Nej |
| **PLAYER** | GranskaSpelare "KRING SPELARNA" | Nej (utom om critical) | Nej |
| **REACTION** | ReaktionerKort "💬 KRING MATCHEN" | Nej | Ja, vid mount |
| **INBOX-only** | Inboxen nästa omgång | Nej | Nej |

Baseline i `granskaEventClassifier.ts`:
- CRITICAL_GRANSKA_TYPES: `patronEvent`, `criticalEconomy`, `transferBidReceived`
- PLAYER_TYPES: `starPerformance`, `playerPraise`, `playerMediaComment`, `dayJobConflict`, `hesitantPlayer`, `captainSpeech`, `playerArc`
- REACTION_TYPES: `mediaReaction`, `fanLetter`, `opponentQuote`
- Allt annat: inbox-only (defaultfall)

---

## Klassificering per typ

### CRITICAL — 12 typer (9 nya jämfört med baseline)

| Typ | I baseline | Motivering |
|---|---|---|
| `transferBidReceived` | Ja | Beslut krävs med deadline |
| `contractRequest` | NEJ — ny | Kontraktsförfrågan med deadline, kräver beslut. Spec explicit. |
| `playerUnhappy` | NEJ — ny | `getEventPriority` → `critical`. Spelare kan lämna om ej hanterat. |
| `criticalEconomy` | Ja | Ekonomisk kris, beslut krävs |
| `patronEvent` | Ja | Patron-relation är kärnkritisk |
| `economicStress` | NEJ — ny | `getEventPriority` → `critical`. Ekonomisk stress eskalerar. |
| `mecenatEvent` | NEJ — ny | `getEventPriority` → `critical`. Stor sponsor-händelse. |
| `mecenatWithdrawal` | NEJ — ny | Sponsor drar sig ur = akut ekonomisk konsekvens. [GRÄNSFALL — se nedan] |
| `varsel` | NEJ — ny | Personalvarsel = ekonomisk realitet, beslut. [GRÄNSFALL — se nedan] |
| `detOmojligaValet` | NEJ — ny | "Det omöjliga valet" — av designen ett forced dilemma. [GRÄNSFALL — se nedan] |
| `riskySponsorOffer` | NEJ — ny | Risk-beslut krävs, tidsbegränsat. [GRÄNSFALL — se nedan] |
| `bidWar` | NEJ — ny | Budsituation med fler klubbar, beslut krävs. [GRÄNSFALL — se nedan] |

---

### PLAYER — 10 typer (3 nya jämfört med baseline)

| Typ | I baseline | Motivering |
|---|---|---|
| `starPerformance` | Ja | Stjärnprestation kopplad till specifik spelare |
| `playerPraise` | Ja | Beröm kopplad till specifik spelare |
| `playerMediaComment` | Ja | Medieuttalande från spelare |
| `dayJobConflict` | Ja | Dagjobbskonflikt för specifik spelare |
| `hesitantPlayer` | Ja | Tveksam spelare |
| `captainSpeech` | Ja | Kaptenens tal |
| `playerArc` | Ja | Spelarutvecklingsbåge |
| `retirementCeremony` | NEJ — ny | Pensionsceremoni, spelarspecifik händelse. |
| `academyEvent` | NEJ — ny | Akademi-spelarhändelse. [GRÄNSFALL — se nedan] |
| `schoolAssignment` | NEJ — ny | Skola vs träning-konflikt för specifik spelare. |

---

### REACTION — 6 typer (3 nya jämfört med baseline)

| Typ | I baseline | Motivering |
|---|---|---|
| `mediaReaction` | Ja | Mediereaktion, auto-resolvas |
| `fanLetter` | Ja | Fanbrev, auto-resolvas |
| `opponentQuote` | Ja | Motståndarcitat, auto-resolvas |
| `supporterEvent` | NEJ — ny | Tifon-händelse, supporter-reaktion. Spec explicit: "Sara och tifon" → REACTION. |
| `refereeMeeting` | NEJ — ny | Domarens locker room. Spec explicit: → REACTION. |
| `bandyLetter` | NEJ — ny | Atmosfäriskt brev om bandy, `getEventPriority` → `low`, inga val som blockerar. [GRÄNSFALL — se nedan] |

---

### INBOX-only — 15 typer

| Typ | Motivering |
|---|---|
| `pressConference` | Hanteras SEPARAT via `game.pendingPressConference`. Ska INTE läggas till CRITICAL_GRANSKA_TYPES. |
| `sponsorOffer` | Sponsorbud, inte akut. Inbox för övervägande. [GRÄNSFALL — se nedan] |
| `communityEvent` | Default inbox. Priority-override-regel: om event.priority === 'critical' → routing till CRITICAL. [GRÄNSFALL — se nedan] |
| `politicianEvent` | `getEventPriority` → `high`, men inte match-specifikt. Inbox. [GRÄNSFALL — se nedan] |
| `hallDebate` | `getEventPriority` → `high`, kommunal plan. Inbox. [GRÄNSFALL — se nedan] |
| `kommunMote` | `getEventPriority` → `high`, kommunmöte. Inbox. [GRÄNSFALL — se nedan] |
| `licenseHandlingsplan` | Licensåtgärdsplan, byråkratisk → inbox |
| `gentjanst` | Gentjänst/tjänsteutbyte → inbox |
| `icaMaxiEvent` | Lokal ICA-händelse → inbox |
| `patronInfluence` | Bakgrunds-patron-inflytande, inte akut beslut. [GRÄNSFALL — se nedan] |
| `spoksponsor` | Spökponsor → inbox. [GRÄNSFALL — se nedan] |
| `mecenatInteraction` | Allmän mecenat-interaktion, lägre stakes än mecenatEvent. [GRÄNSFALL — se nedan] |
| `mecenatDinner` | Middag med mecenat, `getEventPriority` → `high`, men ingen omedelbar kris → inbox. [GRÄNSFALL — se nedan] |
| `journalistExclusive` | Journalistexklusiv → inbox (presskonferens-flödet hanterar journalist-relation). [GRÄNSFALL — se nedan] |
| `playoffEvent` | Slutspelshändelse, `getEventPriority` → `normal`. [GRÄNSFALL — se nedan] |

---

## Gränsfall — kräver Opus-beslut

Dessa typer har jag klassificerat med osäkerhet. Opus avgör eller bekräftar.

### G1: `mecenatWithdrawal` → CRITICAL?

**Förslag:** CRITICAL  
**Argument för:** Sponsor som drar sig ur = akut ekonomisk konsekvens, sannolikt kräver beslut/åtgärd.  
**Argument emot:** Det kan vara ett fait accompli-event (redan hänt) som bara informerar — inga val att göra.  
**Fråga till Opus:** Har mecenatWithdrawal faktiskt val/choices i praktiken, eller är det read-only information?

### G2: `varsel` → CRITICAL?

**Förslag:** CRITICAL  
**Argument för:** Personalvarsel = ekonomisk realitet med konsekvenser, kräver reaktion.  
**Argument emot:** Kan vara administrativ info utan val.  
**Fråga till Opus:** Har varsel choices?

### G3: `detOmojligaValet` → CRITICAL?

**Förslag:** CRITICAL  
**Argument för:** Av namnet ett forced dilemma — definitivt beslut krävs.  
**Argument emot:** —  
**Bedömning:** Troligen säkert att lägga till CRITICAL.

### G4: `riskySponsorOffer` → CRITICAL?

**Förslag:** CRITICAL  
**Argument för:** "Risky" implicerar att beslut har konsekvens, tidsbegränsat.  
**Argument emot:** `sponsorOffer` är inbox — varför är risky-versionen kritisk?  
**Fråga till Opus:** Är riskySponsorOffer strukturellt annorlunda (t.ex. lägre fönster, större effekt) än sponsorOffer?

### G5: `bidWar` → CRITICAL?

**Förslag:** CRITICAL  
**Argument för:** Budsituation kräver beslut om spelarens framtid.  
**Argument emot:** Det är egentligen en variant av transferBidReceived — snarare PLAYER?  
**Fråga till Opus:** Ska bidWar klassas som CRITICAL (beslut) eller PLAYER (spelarspecifikt)?

### G6: `academyEvent` → PLAYER eller CRITICAL?

**Förslag:** PLAYER  
**Argument för:** Händer en akademispelare, rimlig plats i Spelare-flik.  
**Argument emot:** Akademibeslut (t.ex. "Satsa på junior") kan vara kritiska.  
**Fråga till Opus:** Kräver akademi-events i praktiken ett snabbt beslut eller är de observationer?

### G7: `bandyLetter` → REACTION eller INBOX?

**Förslag:** REACTION  
**Argument för:** `getEventPriority` → `low`, sannolikt atmosfäriskt. Liknar fanLetter.  
**Argument emot:** "bandyLetter" kan vara mer specifikt (officiellt brev från förbundet?).  
**Fråga till Opus:** Är bandyLetter alltid read-only/atmosfärisk, eller kan den ha val?

### G8: `communityEvent` — priority-override-regel

**Förslag:** Inbox-only som default, men om `event.priority === 'critical'` eller `event.priority === 'high'` → CRITICAL  
**Alternativ:** Alltid inbox-only, oavsett priority-fältet  
**Fråga till Opus:** Ska priority-override implementeras i classifyEventNature, eller är communityEvent alltid inbox-only?

### G9: `hallDebate` och `kommunMote` → INBOX eller CRITICAL?

**Förslag:** INBOX (trots `getEventPriority` → `high`)  
**Argument för inbox:** Infrastruktur-beslut, inte match-specifikt, kan vänta.  
**Argument för CRITICAL:** priority:high, har val, tidskänsliga kommunbeslut.  
**Fråga till Opus:** Ska dessa vara CRITICAL eller INBOX i Granska-kontexten?

### G10: `politicianEvent` → INBOX eller CRITICAL?

**Förslag:** INBOX  
**Argument:** Politiker-event är bakgrundsarbete, inte akuta post-match-beslut.  
**Fråga till Opus:** Bekräfta INBOX.

### G11: `patronInfluence` → INBOX eller CRITICAL?

**Förslag:** INBOX  
**Distinktion:** `patronEvent` (akut patron-kris) → CRITICAL. `patronInfluence` (bakgrunds-inflytande) → INBOX.  
**Fråga till Opus:** Bekräfta att patronInfluence är lägre stakes än patronEvent.

### G12: `spoksponsor` → INBOX

**Förslag:** INBOX  
**Motivering:** Spökponsor = potentiell sponsor som inte är bekräftad, utforskande → inbox.  
**Fråga till Opus:** Bekräfta.

### G13: `mecenatInteraction` → INBOX eller CRITICAL?

**Förslag:** INBOX  
**Distinktion:** `mecenatEvent` (kritisk) → CRITICAL. `mecenatInteraction` (allmän interaktion) → INBOX.  
**Fråga till Opus:** Bekräfta att dessa är strukturellt olika stakes.

### G14: `mecenatDinner` → INBOX

**Förslag:** INBOX  
**Motivering:** Middag = social handling, inte ekonomisk kris. Kan vänta.  
**Fråga till Opus:** Bekräfta.

### G15: `journalistExclusive` → INBOX

**Förslag:** INBOX  
**Motivering:** Journalist-flödet hanteras via pressConference-mekanismen.  
**Fråga till Opus:** Bekräfta, eller ska journalistExclusive gå en annan väg?

### G16: `playoffEvent` → INBOX eller CRITICAL?

**Förslag:** INBOX  
**Motivering:** `getEventPriority` → `normal`. Kan vara en PLAYER-event (prestationsrelaterat) eller INBOX.  
**Fråga till Opus:** Vad genererar playoffEvent i praktiken — beslut om spelet eller atmosfärisk info?

### G17: `sponsorOffer` → INBOX

**Förslag:** INBOX  
**Motivering:** Sponsorbud är inte akut post-match. Kan hanteras i inbox.  
**Fråga till Opus:** Bekräfta — eller ska sponsorOffer vara CRITICAL om det är tidsbegränsat?

---

## Slutgiltig klassificering (godkänd av Opus 2026-05-04)

### CRITICAL_GRANSKA_TYPES (12):
`transferBidReceived`, `contractRequest`, `playerUnhappy`, `criticalEconomy`, `patronEvent`, `economicStress`, `mecenatEvent`, `mecenatWithdrawal`, `varsel`, `detOmojligaValet`, `riskySponsorOffer`, `bidWar`

### PLAYER_TYPES (10):
`starPerformance`, `playerPraise`, `playerMediaComment`, `dayJobConflict`, `hesitantPlayer`, `captainSpeech`, `playerArc`, `retirementCeremony`, `academyEvent`, `schoolAssignment`

### REACTION_TYPES (6):
`mediaReaction`, `fanLetter`, `opponentQuote`, `supporterEvent`, `refereeMeeting`, `bandyLetter`

### INBOX-default (15):
`pressConference` (special — pendingPressConference-flödet, ej via classifier), `sponsorOffer`, `communityEvent`, `politicianEvent`, `hallDebate`, `kommunMote`, `licenseHandlingsplan`, `gentjanst`, `icaMaxiEvent`, `patronInfluence`, `spoksponsor`, `mecenatInteraction`, `mecenatDinner`, `journalistExclusive`, `playoffEvent`

### Generell priority-override (G8 — VIKTIG ARKITEKTURÄNDRING):

```ts
export function classifyEventNature(event: GameEvent): EventNature {
  if (CRITICAL_GRANSKA_TYPES.has(event.type)) return 'critical'
  if (PLAYER_TYPES.has(event.type)) return 'player'
  if (REACTION_TYPES.has(event.type)) return 'reactions'
  // Generell eskalering — vilken INBOX-typ som helst med priority='critical' → CRITICAL
  // 'high' är fortfarande inbox-värdigt; bara 'critical' blockerar CTA
  if (event.priority === 'critical') return 'critical'
  return 'inbox-only'
}
```

Innebär: `communityEvent`, `academyEvent`, `playoffEvent` etc kan dynamiskt eskaleras till CRITICAL om event-instansen har `priority: 'critical'` satt vid generering — utan att ändra typ-listorna.

---

**Status: Fas 2-integration väntar på shot-audit-beslut (Utfall A/B/C).**
