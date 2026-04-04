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
// I commentary-generering, kolla storylines:
const playerStories = game.storylines.filter(
  s => s.playerId === scorer.id && s.resolved
)

if (playerStories.some(s => s.type === 'rescued_from_unemployment')) {
  commentary.push(
    `MÅL! ${scorerName} — mannen som nästan förlorade allt ` +
    `när ${employerName} varslade. Nu gör han säsongens viktigaste mål!`
  )
}

if (playerStories.some(s => s.type === 'went_fulltime_pro')) {
  commentary.push(
    `${scorerName} igen! Han slutade som ${oldJob} för att ` +
    `satsa heltid — och det har betalat sig.`
  )
}

if (playerStories.some(s => s.type === 'left_for_bigger_club')) {
  // Spelaren lämnade dig och du möter honom nu
  commentary.push(
    `Där var det. ${scorerName} gör mål mot sin gamla klubb. ` +
    `Det här ville han bevisa.`
  )
}
```

**Presskonferenser:**
```typescript
// Journalisten refererar:
if (justWon && game.storylines.some(s => 
  s.type === 'underdog_season' && s.season === game.season
)) {
  question = `Ingen trodde på er i augusti. Nu leder ni serien. ` +
    `Vad säger du till tvivlarna?`
}

if (playerStories.some(s => s.type === 'career_crossroads_stayed')) {
  question = `${playerName} funderade på att sluta förra året. ` +
    `Hur viktigt var ditt samtal med honom?`
}
```

**Säsongssammanfattningen:**
```typescript
// I årsbok-generering:
const seasonStories = game.storylines.filter(
  s => s.season === game.season
)

// Bygg narrativ sektion:
// "Säsongens mest dramatiska ögonblick var varslet på Sandvik 
//  i november. Tre spelare riskerade att förlora jobbet. 
//  Tränaren valde att erbjuda heltidskontrakt — ett modigt 
//  beslut som kostade 18 000 kr/mån men räddade backlinjen.
//  I februari avgjorde just Ström derbyt med ett mål i 88:e."
```

**Inbox vid säsongsslut:**
```
📖 SÄSONGENS BERÄTTELSE

Den här säsongen handlade om:
• Varslet på Sandvik — och hur klubben höll ihop
• Nilssons genombrott (från Student till Årets Nykomling)
• Vår rivalry med Edsbyn (2 segrar av 4 matcher)
• Anna Lindqvist som ÄNTLIGEN skrev något positivt

Dessa saker kommer att refereras nästa säsong.
```

### Skapande av storylines

Storylines skapas automatiskt i resolveEvent:

```typescript
// Vid varsel-event, val "erbjud heltidskontrakt":
game.storylines.push({
  type: 'rescued_from_unemployment',
  playerId: affectedPlayer.id,
  description: `rescued_from_unemployment`,
  displayText: `Räddades från arbetslöshet efter varslet på ${employer}`,
  resolved: true,
})

// Vid transfer ut:
game.storylines.push({
  type: 'left_for_bigger_club',
  playerId: leavingPlayer.id,
  displayText: `Lämnade ${myClub} för ${newClub}`,
  resolved: true,
})

// Vid Bandygalan:
game.storylines.push({
  type: 'gala_winner',
  playerId: winner.id,
  displayText: `Vann ${awardName} på Bandygalan ${season}`,
  resolved: true,
})
```

---

## ★ SPELARRÖST — Spelare pratar (ibland för mycket)

### Koncept

Spelare är inte stumma. De pratar med lokaltidningen, 
klagar på bänkplats, berömmer lagkamrater. Det skapar 
konsekvenser som tränaren måste hantera.

### Event-typer (3 nya)

**SPELARE PRATAR MED PRESSEN (playerMediaComment)**

Trigger: spelare med morale < 30, speltid < 3 av 10 matcher, 
personality 'ambitious' (om personlighet finns, annars CA > 55)
Frekvens: max 1 per 8 matchdays per spelare

```
📰 {namn} till Lokaltidningen: "Jag vill spela"
{namn} har pratat med {journalist.name} och uttryckt 
frustration över brist på speltid.

"Jag tränar varje dag och gör mitt bästa. Men jag 
sitter bara på bänken. Det är klart att jag funderar 
på mitt framtid."

[Prata med spelaren privat]     
  → morale +8, men om han inte startar nästa match: morale -12
[Konfrontera honom om att gå till media]  
  → morale -5, men tydligt att DU bestämmer
[Ignorera — det blåser över]    
  → 40% att det eskalerar (ny rubrik: "Konflikten i {klubb} växer")
  → 60% att det tystnar
```

**SPELARE BERÖMMER LAGKAMRAT (playerPraise)**

Trigger: spelare med morale > 75, lagkamrat gjort mål/assist
Frekvens: 15% per match där villkoret uppfylls
Ingen konsekvens, bara positiv flavor.

```
📰 {namn1} om {namn2}: "Bästa jag spelat med"
{namn1} berättade för Bandypuls om sitt samarbete med {namn2}.

"Vi har en förståelse på planen som inte kräver ord. 
{namn2} vet alltid var jag vill ha bollen."

→ Automatiskt: +3 morale för båda, 
  +passningskemi sinsemellan
```

**KAPTENENS ORD (captainSpeech)**

Trigger: 3+ förluster i rad, kaptenen har morale > 50
Frekvens: max 1 per säsong

```
📣 Kaptenen tar ton i omklädningsrummet
{kaptennamn} samlade laget efter träningen:

"Det räcker nu. Vi är bättre än det här. Varenda en 
av er vet det. Imorgon börjar vi om."

→ Automatiskt: +5 morale ALLA spelare i truppen
→ Storyline: 'captain_rallied_team'
→ Kommentator nästa match: "Kaptenen tog ton i veckan 
  — frågan är om det biter."
```

---

## ★ LEGACY — VAD SOM STANNAR KVAR

### Koncept

När en spelare slutar, lämnar han ett avtryck. Inte bara 
statistik — ett minne. Spelare som betytt mycket lever kvar 
i kommentarer och events.

### Datamodell

```typescript
// SaveGame:
clubLegends: ClubLegend[]

interface ClubLegend {
  name: string                // "K. Nilsson"
  seasons: number             // Antal säsonger i klubben
  totalGoals: number
  totalAssists: number
  titles: string[]            // ["SM-guld 2028", "Årets spelare 2027"]
  memorableStory?: string     // Från storylines
  retiredSeason: number
}
```

### Trigger

Vid spelarens pensionering eller avslutad karriär (ålder 35+, 
eller CA < 25):

Om spelaren spelat 3+ säsonger i klubben:
```
🎖️ EN LEGEND TACKAR FÖR SIG
{namn} hänger upp skridskorna efter {x} säsonger i {klubb}.

{goals} mål · {assists} assist · {titles}

"{memorableStory}"

Fansen: "Tack för allt, {smeknamn}!"

→ Reputation +2
→ Legend sparas i clubLegends
```

### Referens i framtiden

```typescript
// Vid mål av ny spelare på samma position:
if (clubLegends.some(l => l.position === scorer.position)) {
  commentary.push(
    `${scorerName} gör mål från samma position som ` +
    `klubblegendaren ${legend.name} en gång dominerade.`
  )
}

// Vid säsongssammanfattning:
// "Nilsson-eran är över, men hans arv lever vidare 
//  genom ungdomsspelaren Ström som tog hans plats."
```

---

# DEL B — KODKVALITET FÖR CODE

## Obligatoriska regler vid ALL implementation

### B1. SJÄLVTEST EFTER VARJE FEATURE

```
EFTER att du implementerat en feature:

1. npm run build — MÅSTE vara rent
2. npm test — MÅSTE ha 0 failures
3. Skriv MINST 3 nya tester per ny service-fil:
   - Normalfall (happy path)
   - Kantfall (tom data, null, extremvärden)
   - Integrationstest (fungerar det i spelflödet?)
4. Gör en MANUELL genomläsning av din egen kod och kolla:
   - Är alla nya fält tillagda i SaveGame?
   - Finns migration för befintliga saves? (default-värden)
   - Har du importerat alla nya moduler?
   - Finns det off-by-one i matchday-beräkningar?
   - Returnerar alla nya funktioner rätt typ?
   - Är alla template-variabler ({namn}, {klubb}) substituerade?
```

### B2. CHECKLISTA VID UI-ÄNDRINGAR

```
EFTER att du ändrat en screen:

1. Kolla att alla nya state-variabler har initial value
2. Kolla att conditional rendering hanterar null/undefined
3. Kolla att onClick-handlers inte kraschar om data saknas
4. Kolla att textsträngar som visas för användaren är 
   på SVENSKA och inte har osubstituerade {variabler}
5. Kolla att nya knappar har disabled-state när de inte 
   ska vara klickbara (budget=0, pågående sökning, etc.)
```

### B3. SAVEGAME-MIGRATION

```
VARJE gång du lägger till ett fält i SaveGame:

1. Lägg till default-värde i laddnings-/migrationskoden
2. Default SKA vara det mest neutrala värdet (tom array, 0, null)
3. Testa att ett gammalt save UTAN det nya fältet laddar korrekt
4. Dokumentera i en kommentar: // Added in v0.3 - scouting system
```

### B4. INGA WORKAROUNDS

```
Regel: ALDRIG göra workarounds. Lös det verkliga problemet.

INTE OK: Gömma en komponent som kraschar med {display: 'none'}
INTE OK: Tvinga live-mode för cupmatcher istället för att fixa simuleringen
INTE OK: Returnera hårdkodade värden istället för att beräkna

OM du inte kan lösa ett problem, skriv en kommentar:
// TODO: [beskrivning av problemet] — behöver diskuteras
...och gå vidare till nästa uppgift.
```

### B5. COMMIT-MEDDELANDEN

```
Format: [AREA] Kort beskrivning

Exempel:
[SCOUTING] Add talentScoutService with search + resolve
[MARKET] Market value drives AI transfer bids
[MEDIA] Add journalist character with memory
[FIX] Off-by-one in matchday countdown
[TEST] Tests for opponentAnalysisService
```

---

# DEL C — ERIKS TEXTGRANSKNING

## Regel: Alla nya texter genererar en granskningsfil

### Process

VARJE GÅNG ny svenskspråkig text läggs till i koden 
(kommentarer, event-texter, UI-labels, scout-notes, 
journalist-frågor, mediarubriker, scoutrapporter, 
bandydoktorn-texter, anything) — generera en fil:

```
docs/textgranskning/TEXT_REVIEW_{feature}_{datum}.md
```

### Format

```markdown
# Textgranskning: {featurenamn}
Datum: {datum}
Granskare: Erik

## Nya texter att granska

### {källfil}

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| 42  | "Snabb forward med bra skott. Kan vara redo för ett steg upp." | |
| 43  | "Kreativ passningsspelare. Ser ytor andra missar." | |
| 44  | "Bra spelsinne och teknik. Dirigerar anfallsspelet." | |

### {källfil 2}

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| 15  | "Ingen trodde på er i augusti. Nu leder ni serien." | |
| 18  | "Supportrarna buade. Förstår du dem?" | |

## Att tänka på vid granskning

- Stämmer bandyterminologin? (skridskoåkning, inte löpning)
- Låter det som P4-radio / Bandypuls, inte AI?
- Är ortsnamn och företagsnamn rimliga?
- Är tonen rätt för situationen?
- Språkfel, stavfel, konstiga formuleringar?

## Instruktion till Erik

Fyll i "Eriks kommentar"-kolumnen med:
- ✅ (ok)
- ❌ {föreslagen ändring}
- ⚠️ {fråga/tveksamt}

Returnera filen till Jacob.
```

### Automatisering

Code ska köra detta EFTER varje implementation:

```bash
# Hitta alla nya/ändrade svenska textsträngar:
git diff --unified=0 HEAD~1 -- '*.ts' '*.tsx' | \
  grep "^+" | grep -E "'[A-ZÅÄÖ]|\"[A-ZÅÄÖ]|\`[A-ZÅÄÖ]" | \
  grep -v "^+++" > /tmp/new_texts.txt

# Om filen inte är tom → skapa TEXT_REVIEW-fil
```

Alternativt (enklare): Code samlar manuellt alla nya 
svenska strängar i en textgranskningsfil efter varje batch.

---

# DEL D — SAMMANSLAGEN IMPLEMENTATIONSORDNING

Hela förstärkningen i en ordning. Varje steg avslutas med:
`npm run build && npm test` + textgranskningsfil om ny text.

## Fas 1 — Snabba vinster (grundförbättringar)

```
1. SaveGame-migration: alla nya fält med defaults
2. Marknadsvärde → AI-bud (1A) + synliga värdeförändringar (1B)
3. Prestationsbaserad värdeförändring (1C)
4. Synligt supporterhumör i dashboard + matchvy (3D)
5. Fler pressfrågor (25+) med villkor (3A)
```
→ Textgranskningsfil: TEXT_REVIEW_FAS1_{datum}.md

## Fas 2 — Dubbelliv på riktigt

```
6.  Träningsrapport med jobbspecifika texter (2A)
7.  Arbetsplatsnätverk — localEmployers (2E)
8.  Fler jobbkonflikt-typer: 5 event-typer (2B)
9.  Flyttpusslet — PlayerDemands i transfers (2F)
10. Heltidsproffs svårare + identitetseffekt (2C + 2D)
```
→ Textgranskningsfil: TEXT_REVIEW_FAS2_{datum}.md

## Fas 3 — Media med personlighet

```
11. Journalist som karaktär med minne (3F)
12. Mediaprofil med persona + konsekvenser (3B)
13. Vägra presskonferens (3G)
14. Mediarubriker med bett + personreferens (3C)
15. Spelarröst — spelare pratar med pressen (ny)
```
→ Textgranskningsfil: TEXT_REVIEW_FAS3_{datum}.md

## Fas 4 — Emotionellt lager

```
16. Storylines — datamodell + skapande i events (ny)
17. Storyline-referenser i kommentarer (ny)
18. Storyline-referenser i presskonferenser (ny)
19. Storyline-referenser i säsongssammanfattning (ny)
20. Kaptenens ord + spelarberömning (ny)
```
→ Textgranskningsfil: TEXT_REVIEW_FAS4_{datum}.md

## Fas 5 — Höjdpunkter

```
21. Bandygalan — nomineringar + priser + effekter (3H)
22. Legacy — clubLegends + pensionsceremoni (ny)
23. Gratis-transfers som grundmodell (1E)
24. Värvningsrykte — synlig efterfrågan (1F)
25. Transferlista med fynd-potential (1D)
26. Narrativ arc — tränarsäsongen (3E)
```
→ Textgranskningsfil: TEXT_REVIEW_FAS5_{datum}.md

---

# KOMPLETT SAMMANFATTNING

## Alla features per system

### MARKNADSVÄRDEN (6 st)
1A. Marknadsvärde styr AI-bud ✦ V1
1B. Synliga värdeförändringar (pilar, inbox) ✦ V1
1C. Prestationsbaserad värdeförändring ✦ V1
1D. Transferlista med fynd-potential ✦ V1
1E. Gratis transfers — lönen är kostnaden ★ V2
1F. Värvningsrykte — "3 klubbar har frågat" ★ V2

### DUBBELLIV (8 st)
2A. Synlig jobbpåverkan i träning (TrainingReport) ✦ V1
2B. 5 jobbkonflikt-typer ✦ V1
2C. Heltidsproffs svårare och dyrare ✦ V1
2D. Proffs-kvot påverkar klubbidentitet ✦ V1
2E. Arbetsplatsnätverk — fabriken + varsel ★ V2
2F. Flyttpusslet — hela livssituationen ★ V2
2G. Spelarröst — spelare pratar med media ★ V3
2H. Kaptenens ord ★ V3

### MEDIA (10 st)
3A. 25+ pressfrågor med villkor ✦ V1
3B. Mediaprofil med persona + konsekvenser ✦ V1
3C. Mediarubriker med bett ✦ V1
3D. Synligt supporterhumör ✦ V1
3E. Narrativ arc — tränarsäsongen ✦ V1
3F. Journalist som karaktär med minne ★ V2
3G. Vägra presskonferens ★ V2
3H. Bandygalan ★ V2

### TVÄRSGÅENDE (3 st)
X1. Storylines — händelseminne ★ V3
X2. Legacy — clubLegends + pension ★ V3
X3. Storyline-referenser överallt ★ V3

---

# DEL E — GRAFISKA RIKTLINJER (OBLIGATORISKT)

Alla nya komponenter, skärmar och UI-ändringar MÅSTE följa 
dessa regler. Referens: docs/DESIGN_IMPLEMENTATION.md och 
docs/MOCKUP_IMPLEMENTATION_GUIDE.md.

## E1. FÄRGPALETT — Använd BARA CSS-variabler

ALDRIG hårdkoda hex-värden i .tsx-filer. Alltid `var(--token)`.

```
BAKGRUNDER
--bg: #EDE8DF                    Sidbakgrund (varm pergament)
--bg-surface: #FAF8F4            Kortbakgrund (varm vit)
--bg-elevated: #FFFFFF           Popups, modaler
--bg-dark: #0E0D0B              Header, mörka sektioner
--bg-dark-surface: #1E1D19      Mörka kortytor
--bg-dark-elevated: #2C2A24     Mörka upphöjda element
--bg-leather: #3D3A32           Läder-textur headers

BORDERS
--border: #DDD7CC               Standard borders
--border-dark: #C4BAA8          Starkare borders, dividers

TEXT
--text-primary: #1A1A18         Primär text (ljus bg)
--text-secondary: #6B6760       Sekundär text
--text-muted: #8A857A           Dämpad/label-text
--text-light: #F5F1EB           Text på mörk bakgrund
--text-light-secondary: #C4BAA8 Sekundär text på mörk bg

ACCENTER
--accent: #C47A3A               Primär accent (koppar/terrakotta)
--accent-dark: #A25828          Mörkare koppar (knappar, emphasis)
--accent-deep: #8B4820          Djupaste koppar

STATUS
--success: #5A9A4A              Vinst, positiva siffror
--danger: #B05040               Förlust, skador, negativt
--ice: #7EB3D4                  Istemperatur, kyla
```

## E2. FORMHIERARKI — 4 nivåer

Varje UI-element tillhör EN av fyra formkategorier.
Code ska ALDRIG blanda eller hitta på nya.

### PILL-TAG (border-radius: 99px)
Passiv information. Går ALDRIG att klicka på.
Användning: "🟢 Form", "MV", "2 omg. kvar", "Flex 60%"

```css
.tag { 
  border-radius: 99px; 
  padding: 2px 8px; 
  font-size: 9px; 
  font-weight: 600; 
  font-family: system-ui, sans-serif;
}
```

Varianter:
- `tag-fill` — filled copper (aktiv status)
- `tag-outline` — border only (neutral info)
- `tag-copper` — copper border (accent)
- `tag-green` — grön (vinst, positiv)
- `tag-red` — röd (förlust, skada)
- `tag-ice` — blå (väder, is)

### KNAPP (border-radius: 8px + skugga)
Interaktiv. ALLTID box-shadow. Tydligt tappbar.
Användning: "Starta match", "Skicka bud", "Spara"

```css
.btn {
  border-radius: 8px;
  padding: 10px 20px;
  font-family: system-ui, sans-serif;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary {
  background: var(--accent-dark);
  color: var(--text-light);
  box-shadow: 0 4px 16px rgba(162,88,40,0.35);
}
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border-dark);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
```

### CARD-SHARP (border-radius: 8px)
Data/status-display. Ren fakta. Ingen narrativ ton.
Användning: tabell, truppstatus, ekonomi, träningsrapport,
             statistik, scoutrapporter, marknadsvärden

```css
.card-sharp {
  background: var(--bg-surface);
  border-radius: 8px;
  border: 1px solid var(--border);
}
```

### CARD-ROUND (border-radius: 14px)
Narrativ, stämning, interaktion. Har karaktär.
Användning: matchkort, events, presskonferens, 
             inkorg, bandydoktorn, storylines, Rolf-citat

```css
.card-round {
  background: var(--bg-surface);
  border-radius: 14px;
  border: 1px solid var(--border);
}
```

### BESLUTSTRÄD — vilken form?

```
Är det klickbart/tappbart?
  → JA → Är det en liten aktion (en rad)?
          → JA → .btn (8px + skugga)
          → NEJ → Är det narrativt/har karaktär?
                   → JA → .card-round (14px)
                   → NEJ → .card-sharp (8px)
  → NEJ → Är det en kort label/status?
           → JA → .tag (pill, 99px)
           → NEJ → Ren text, ingen container
```

## E3. TYPOGRAFI

```css
--font-display: 'Georgia', 'Times New Roman', serif;
--font-body: system-ui, -apple-system, sans-serif;
```

### Georgia (serif) för:
- Klubbnamn
- Stora siffror (tabellplacering, resultat)
- Stämningstext (Rolf-citat, storyline-narrativ)
- "vs" i matchkort
- Spelarnamn i hero-context (PlayerCard-header)
- Sektionsrubriker med känsla ("Säsongens berättelse")

### System-UI (sans-serif) för:
- ALLT annat: labels, knappar, taggar, metrics, 
  bar-labels, navigation, formulär, body text, 
  scout-notes, mediarubriker, pressfrågor

### REGEL: Blanda aldrig inom samma element.

## E4. KORT-TINTNING baserat på innehåll

Alla kort har `var(--bg-surface)` som bas. Lägg till 
subtil bakgrundstint för att signalera typ:

```typescript
function getCardTint(type: string): string {
  switch (type) {
    case 'derby':       return 'rgba(196,80,50,0.03)'
    case 'playoff':     return 'rgba(196,168,76,0.04)'
    case 'annandagen':  return 'rgba(100,140,80,0.03)'
    case 'cup':         return 'rgba(126,179,212,0.04)'
    case 'community':   return 'rgba(196,122,58,0.02)'
    case 'alert':       return 'rgba(196,122,58,0.04)'
    case 'negative':    return 'rgba(176,80,64,0.03)'
    default:            return 'transparent'
  }
}
```

Applicera som `background: var(--bg-surface)` med en 
gradient-overlay eller inset box-shadow.

## E5. MATCH-ATMOSFÄR

Nya komponenter som visar matchinfo MÅSTE ha atmosfär:

```typescript
function getMatchAtmosphere(fixture, game) {
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
  const isPlayoff = fixture.isCup || fixture.playoffRound
  const isAnnandagen = getSeasonPhase(fixture.matchday) === 'annandagen'
  
  return {
    tint: rivalry ? 'derby' 
        : isPlayoff ? 'playoff' 
        : isAnnandagen ? 'annandagen' 
        : undefined,
    label: rivalry ? `🔥 DERBY — ${rivalry.name}`
         : isPlayoff ? '🏆 SLUTSPEL'
         : isAnnandagen ? '🎄 ANNANDAGEN'
         : undefined,
    borderAccent: rivalry ? 'var(--danger)' 
                : isPlayoff ? 'var(--accent)' 
                : undefined,
  }
}
```

## E6. TEXTURER (bara på mörka ytor)

```css
/* Trätextur — mörka headers */
.tx-wood {
  background: repeating-linear-gradient(
    92deg,
    rgba(160,130,90,.04) 0px,
    rgba(160,130,90,.02) 2px,
    transparent 2px,
    transparent 8px
  );
}

/* Lädertextur — leather bars */
.tx-leather {
  background-image: url("data:image/svg+xml,%3Csvg width='6' 
    height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'
    %3E%3Ccircle cx='1' cy='1' r='.4' fill='%23000' 
    opacity='.03'/%3E%3C/svg%3E");
}
```

Läder-bar ska BARA finnas i NextMatchCard (dashboard).
ALDRIG i andra kort.

## E7. NYA KOMPONENTERS CHECKLISTA

```
INNAN du skapar en ny komponent, svara på:

□ Vilken formkategori? (tag / btn / card-sharp / card-round)
□ Vilken font? (Georgia display / system-ui body)
□ Använder jag BARA CSS-variabler? (inga hex-värden i tsx)
□ Behöver kortet tint? (derby/playoff/etc)
□ Finns det interaktiva element? → btn med skugga
□ Finns det status-labels? → tag med rätt variant
□ Har jag kollat att designen matchar befintliga skärmar?
□ Är all text på SVENSKA?

OM du är osäker: kolla DashboardScreen.tsx — den är referens-
implementationen för hur alla mönster ska se ut.
```

## E8. ANIMATIONER (sparsamt)

Tillåtna animationer:
- `slideUp` — kort som fades in (0.35s ease-out)
- `pulseCTA` — CTA-knapp glow (bara en per skärm)
- Snöpartiklar — bara i header vid HeavySnow
- Confetti — bara ChampionScreen och Bandygalan

FÖRBJUDET:
- Bounce, shake, eller uppmärksamhetsfångande animationer
- Animerade siffror som tickar upp
- Blinkande element
- Animationer på data-kort (card-sharp)

## E9. SPACING

```
Page padding: 0 12px
Card margin-bottom: 10px
Card internal padding: 14px 16px
Section gap (mellan sektioner i ett kort): 12px
Label-to-content gap: 6px
Tag gap (mellan taggar): 4px
```

Använd ALDRIG `margin: 20px` eller större inom kort.
Håll det tight — det är mobilspel, inte desktop.
