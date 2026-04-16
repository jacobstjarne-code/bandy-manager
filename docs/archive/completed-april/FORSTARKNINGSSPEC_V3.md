# FÖRSTÄRKNINGSSPEC V3 — SLUTGILTIG

Inkluderar allt från V1 + V2 plus:
- Emotionellt lager som binder ihop systemen
- Spelarröst (spelare pratar med media)
- Korsreferenser mellan system
- Kodkvalitetsregler för Code
- Erik-textgranskningsprocess

---

# DEL A — NYTT LAGER: MINNE OCH KÄNSLA

## ★ STORYLINES — Korsreferenser mellan system

### Koncept

Spelet spårar viktiga händelser per spelare och klubb.
Kommentatorer, journalister, event-texter och säsongssamman-
fattningar REFERERAR till dem. Det skapar känslan av att 
spelet minns — och att dina beslut hade konsekvenser.

### Datamodell

```typescript
// SaveGame — nytt:
storylines: StorylineEntry[]

interface StorylineEntry {
  id: string
  type: StorylineType
  season: number
  matchday: number
  playerId?: string
  clubId?: string
  description: string        // Maskinläsbar: "rescued_from_unemployment"
  displayText: string        // "Räddades från arbetslöshet efter varslet på Sandvik"
  resolved: boolean          // true = kan refereras, false = pågående
}

type StorylineType =
  | 'rescued_from_unemployment'   // Du hjälpte spelaren vid varsel
  | 'went_fulltime_pro'           // Blev heltidsproffs tack vare dig
  | 'refused_to_go_pro'           // Tackade nej till heltidskontrakt
  | 'left_for_bigger_club'        // Lämnade — du förlorade honom
  | 'returned_to_club'            // Kom tillbaka efter att ha lämnat
  | 'workplace_bond'              // Arbetskamrater som fått kemi
  | 'journalist_feud'             // Dålig relation med journalist
  | 'journalist_redemption'       // Journalist vände från kritisk till positiv
  | 'promotion_sacrifice'         // Tackade nej till befordran för bandyn
  | 'career_crossroads_stayed'    // Ung spelare valde att stanna
  | 'underdog_season'             // Överträffade förväntning stort
  | 'relegation_escape'           // Räddade sig kvar i sista stund
  | 'gala_winner'                 // Vann pris på Bandygalan
  | 'partner_moved_here'          // Sambon flyttade hit för bandyn
```

### Var referenserna dyker upp

**Matchkommentarer:**
```typescript
const playerStories = game.storylines.filter(
  s => s.playerId === scorer.id && s.resolved
)

if (playerStories.some(s => s.type === 'rescued_from_unemployment')) {
  commentary.push(
    `MÅL! ${scorerName} — mannen som nästan förlorade allt ` +
    `när ${employerName} varslade. Nu gör han säsongens viktigaste mål!`
  )
}
```

**Presskonferenser:**
```typescript
if (justWon && game.storylines.some(s => 
  s.type === 'underdog_season' && s.season === game.season
)) {
  question = `Ingen trodde på er i augusti. Nu leder ni serien. ` +
    `Vad säger du till tvivlarna?`
}
```

**Säsongssammanfattningen:**
```typescript
const seasonStories = game.storylines.filter(s => s.season === game.season)
// Bygg narrativ sektion med storyline-texter
```

### Skapande av storylines

Storylines skapas automatiskt i resolveEvent vid:
- Varsel-event + val "erbjud heltidskontrakt"
- Transfer ut
- Bandygalan
- Kaptenens tal

---

## ★ SPELARRÖST — Spelare pratar (ibland för mycket)

### Event-typer (3 nya)

**playerMediaComment** — Missnöjd spelare pratar med press
Trigger: morale < 30, speltid < 3/10, CA > 55

**playerPraise** — Spelare berömmer lagkamrat
Trigger: morale > 75, lagkamrat gjort mål, 15% per match

**captainSpeech** — Kaptenen samlar laget
Trigger: 3+ förluster i rad, kapten morale > 50, max 1/säsong

---

## ★ LEGACY — VAD SOM STANNAR KVAR

ClubLegend skapas vid pensionering (3+ säsonger).
Refereras i kommentarer och säsongssammanfattning.

---

# DEL B — KODKVALITET FÖR CODE

### B1. SJÄLVTEST EFTER VARJE FEATURE
npm run build + npm test + minst 3 tester per ny service

### B2. CHECKLISTA VID UI-ÄNDRINGAR
State initial values, null-hantering, svenska texter, disabled-states

### B3. SAVEGAME-MIGRATION
Default-värden i migration, neutrala defaults, kommenterad version

### B4. INGA WORKAROUNDS
Lös problemet, inte symptomen. TODO-kommentar om det inte går.

### B5. COMMIT-MEDDELANDEN
Format: [AREA] Kort beskrivning

---

# DEL C — ERIKS TEXTGRANSKNING

Alla nya svenska texter → docs/textgranskning/TEXT_REVIEW_{feature}_{datum}.md

---

# DEL F — EVENT-KVALITETSSTANDARD

## Problemet

Events droppar ner ur tomma intet. Spelaren vet inte:
- Vem som pratar
- Varför det händer just nu
- Vad konsekvenserna är
- Om det kommer en uppföljning

## REGELN: Varje event har 4 lager

### 1. AVSÄNDARE — Vem pratar?
Aldrig anonymt. Namngiven person med roll.

### 2. TRIGGER-KONTEXT — Varför händer det nu?
Eventet förklarar vad som utlöste det.

### 3. TYDLIGA KONSEKVENSER — Vad kostar/ger det?
Subtitle under varje choice med ikoner:
💰 pengar · ⭐ reputation · 💛 fanMood · 😊 morale · ⏰ tid/fitness · 🤝 relation · 🔮 framtid

### 4. UPPFÖLJNING — Spelade mitt val roll?
A) Inbox-notis (enkel, 3-5 matchdagar)
B) Uppföljnings-event (medel)
C) Storyline-koppling (djup)

## Konsekvens-visning i EventOverlay

```typescript
{choice.subtitle && (
  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
    {choice.subtitle}
  </div>
)}
```

## Uppföljningssystem

```typescript
// SaveGame:
pendingFollowUps: FollowUp[]

interface FollowUp {
  id: string
  triggerEventId: string
  matchdaysDelay: number
  createdMatchday: number
  type: string
  data?: Record<string, any>
}
```

Nedräkning i advanceToNextEvent. Genererar inbox eller event vid trigger.

## EVENT-STANDARD: Checklista

□ VEM? Namngiven avsändare med roll
□ VARFÖR NU? Tydlig trigger
□ VAD KOSTAR/GER DET? Synlig konsekvens-subtitle
□ VAD HÄNDER SEN? Uppföljning (minimum inbox)
□ ICKE-MONETÄR? Reputation/fanMood/relation ÄR konsekvenser
□ RÄTT NIVÅ? Talspråk, inte systemmeddelande

---

# DEL D — SAMMANSLAGEN IMPLEMENTATIONSORDNING

## Fas 0 — Playtest-fixar + Event-kvalitetspass

```
0a. Utvisning synlig på scoreboard (P2)
0b. Dubbelrapport-flödet (P4)
0c. Sponsor utan notis (P5)
0d. Kontrollknappar storlek (P1)
0e. Avkortade lagnamn i scoreboard (P3)
0f. Slutspelsvy kvartsfinal — bracket (S1)
0g. Kontrollera semifinal-bracket (S2)
0h. "Skicka dem" → singular/plural-fix (T2)
0i. Event-kvalitetspass: subtitle med konsekvens-ikoner
0j. Uppföljningssystem: pendingFollowUps
0k. Namngivna avsändare på alla events
0l. "Bandy för alla" omskriven
```

## Fas 1–5 — (redan implementerade i sprint 2–4 april)

---

# DEL E — GRAFISKA RIKTLINJER (OBLIGATORISKT)

## E1. FÄRGPALETT — BARA CSS-variabler (aldrig hex i .tsx)
## E2. FORMHIERARKI — tag(99px) / btn(8px+skugga) / card-sharp(8px) / card-round(14px)
## E3. TYPOGRAFI — Georgia display, system-ui body
## E4. KORT-TINTNING — getCardTint() per matchtyp
## E5. MATCH-ATMOSFÄR — getMatchAtmosphere() med tint+label+border
## E6. TEXTURER — trä+läder bara på mörka ytor
## E7. NY-KOMPONENT-CHECKLISTA — 8 frågor
## E8. ANIMATIONER — 4 tillåtna, 4 förbjudna
## E9. SPACING — tight mobilspel (14px 16px, margin 10px)
