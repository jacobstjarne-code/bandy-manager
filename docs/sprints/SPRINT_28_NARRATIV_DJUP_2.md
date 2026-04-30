# Sprint 28 — Narrativ djup-paket 2

**Status:** READY TO START (med fas-gates)
**Estimat:** 5-7h totalt
**Förutsätter:** Sprint 27 stängd. CLAUDE.md tre designprinciper.
**Risk:** Låg-Medel — bygger på existerande infrastruktur.

---

## SYFTE

Sprint 27 levererade pension/legend-system och karriärs-tidslinje. Sprint 28
bygger på det med tre delar som tillsammans gör spelet *mer dela-värt* utan
att lägga till delningsfunktionalitet i traditionell mening.

Researchen om socialt momentum (2026-04-26) visade att FM-communityns mest
delade content är **vanliga skärmdumpar av spelet** — inte specialgenererade
share-images. Det viralvärda kommer från innehållet, inte formatet.

**Slutsats:** Bygg innehåll som är dela-värt, inte delningsmekanik.

Tre delar:

1. **28-A: Pension-impact på morale** — pension manifesteras i kvarvarande
   spelares morale. Inbox-principen i full effekt.
2. **28-B: Match-commentary för legend** — när en aktiv legend-spelare
   gör nyckelmoment, specialkommentar i feeden. THE_BOMB D.3.
3. **28-C: Skärmdump-vänlighet-audit** — Opus går igenom 5-10 vyer och
   identifierar visuella problem som hindrar spelare från att vilja
   skärmdumpa. Inte ny kod — en åtgärdslista.

**Audit-gates mellan varje** för att inte spårbyta utan stopp.

---

## FAS A — PENSION-IMPACT PÅ MORALE (Code+Opus)

**Mål:** När en kapten/legend pensioneras, kvarvarande spelare påverkas
narrativt och mekaniskt. Inbox-principen: pension manifesteras inte bara
i kafferum + lön (Sprint 27), utan också i truppens moralvärden.

**Estimat:** 2-3h Code + ~30 min Opus-text.

### A.1 — Mekanik

I `seasonEndProcessor.ts` där pension-event genereras (Sprint 27):

För varje pensionerad spelare som var **kapten** eller **legend** (≥3 säsonger
i klubben), efter pensions-event:

```typescript
const wasCaptain = player.id === game.captainPlayerId
const wasLongtime = (player.careerStats?.seasonsPlayed ?? 0) >= 3

if (wasCaptain || wasLongtime) {
  // För varje kvarvarande spelare i samma klubb:
  for (const teammate of remainingTeammates) {
    const sharedSeasons = countSharedSeasons(teammate, player)
    if (sharedSeasons >= 2) {
      // Mer påverkan ju längre de spelat tillsammans
      const moraleHit = wasCaptain
        ? Math.min(15, 5 + sharedSeasons * 2)  // -5 till -15
        : Math.min(10, 3 + sharedSeasons)       // -3 till -10
      teammate.morale = Math.max(0, teammate.morale - moraleHit)
    }
  }
}
```

**Ny utility:** `countSharedSeasons(p1, p2)` i playerDevelopmentService eller
ny fil. Räknar antal säsonger båda var i samma klubb baserat på `seasonHistory`.

### A.2 — Kapten-vakuum

Om pensionerad spelare var **aktuell kapten** (`game.captainPlayerId === player.id`):

- Sätt `game.captainPlayerId = undefined` (vakuum)
- Generera inbox-event: "Ny kapten behövs" — länkar till PreSeasonScreen
  (som redan har kaptenval-UI)
- Lägg på `game.pendingScreen = PendingScreen.PreSeason`? Nej — det
  triggar redan av säsongsslut. Bara inbox-event räcker.

### A.3 — Narrativ inbox-text

Opus skriver 3-4 varianter beroende på relation. Triggas EN gång per pension
(inte per spelare som påverkas):

**Vid kapten-pension med många trogna lagkamrater:**
*"Omklädningsrummet är tystare än vanligt. Halva truppen spelade med [namn]
i fyra år. Det märks i morgonens träning."*

**Vid kapten-pension med mest nya spelare:**
*"De som var nya när [namn] ledde laget pratar inte mycket om det. De som
var där länge säger inget alls."*

**Vid legend-pension utan kaptenskap:**
*"[Namn] var inte kapten. Men han var [namn]. Det är skillnad. Det märks
nu när han inte är där."*

**Vid pension utan särskild relation till truppen (kort tid i klubben):**
Ingen narrativ inbox. Bara den befintliga pensions-ceremonin.

### A.4 — Audit-krav (Opus)

Edge cases att verifiera:
- Kapten med 0 lagkamrater som varit där 2+ säsonger → ingen morale-hit
  triggas, men kapten-vakuum sätts ändå
- Legend med 3 säsonger men 0 lagkamrater → inget händer
- Två pensioner samma säsong → båda triggar separat
- Spelare som spelat tillsammans i 10 säsonger → max -15 morale (cappad)

---

## FAS B — MATCH-COMMENTARY FÖR LEGEND (Code+Opus)

**Mål:** När en aktiv legend-spelare gör mål, assist, eller nyckelmoment
(räddning av MV, sen kvittering), special-commentary i match-feeden.
Detta är THE_BOMB D.3 — exakt det FM-communityns viralvärda content är.

**Estimat:** 2h Code + ~1h Opus-text för 15-20 commentary-strängar.

### B.1 — Trigger-villkor

I `matchCore.ts` där commentary genereras, lägg till en check **innan**
ordinarie commentary-pool plockas:

```typescript
// Legend-commentary check
const scorer = event.playerId ? game.players.find(p => p.id === event.playerId) : null
if (scorer?.isClubLegend && scorer.clubId === game.managedClubId) {
  // 70% chans att special-commentary plockas (annars ordinarie pool)
  if (rand() < 0.70) {
    commentaryText = pickLegendCommentary(scorer, event, game)
    // Hoppa över ordinarie commentary
  }
}
```

`pickLegendCommentary()` är ny funktion. Returnerar en commentary-sträng
baserat på event-typ och spelarens karriärstats.

### B.2 — Variabler tillgängliga för text

- `{name}` — spelarens namn
- `{lastName}` — efternamn
- `{seasons}` — antal säsonger i klubben
- `{totalGoals}` — career-totala mål
- `{minute}` — minut i matchen
- `{yearsAgo}` — säsonger sedan han började (game.currentSeason - debutSeason)

### B.3 — Commentary-kategorier

**Mål av legend (12 strängar):**

```
'Den där killen igen. {seasons} säsonger. Han har gjort det här tusen gånger.',
'{lastName} hittar nätet. Som han alltid gjort.',
'{minute}:e minuten — och det är {lastName}. Naturligtvis.',
'Klacken sjunger {lastName}s namn innan bollen ens lämnat klubban.',
'Tröjan är gammal. Skotten är nya. {lastName} är fortfarande {lastName}.',
'Han skulle ha slutat förra säsongen, sa de. {lastName} har annat på gång.',
'{totalGoals} mål för klubben nu. Han räknade aldrig själv.',
'Det är som att se ett gammalt fotografi röra sig. {lastName} skjuter, bollen går in.',
'Pensionärer i klacken minns hans första mål. Ungdomar lär sig av det här.',
'Nya nummer på tröjan, samma kille under. {lastName} igen.',
'Bortalaget visste vad som väntade. Det hjälpte inte. {lastName} hittade vägen.',
'En generation har gått sedan {lastName} kom till klubben. Han är fortfarande här.',
```

**Assist av legend (4 strängar):**

```
'{lastName} ser passningen. Som han alltid sett dem.',
'En sån passning gör inte vem som helst. {lastName} gör dem i sömnen.',
'Han hade kunnat skjuta själv. {lastName} valde att ge bort den. Som vanligt.',
'Bollen kommer från ingenstans — fast vi vet att det var {lastName}. Det är alltid {lastName}.',
```

**MV-räddning av legend (om legenden är målvakt) (3 strängar):**

```
'{lastName} står där. {seasons} säsonger på samma plats. Han vet vart bollen ska.',
'Räddning av {lastName}. Klacken har sett tusen sådana. De jublar ändå.',
'Den räddningen — den var av en spelare som varit här länge. {lastName} läser spelet.',
```

**Sen kvittering/avgörande av legend (3 strängar):**

```
'{minute}:e minuten. Det är {lastName}. Det är så det ska vara.',
'En match att minnas. {lastName} avgör — som han gjort sedan han var ung.',
'Sista minuterna. {lastName} hittar utrymmet. Ingen är förvånad. Alla jublar ändå.',
```

### B.4 — Audit-krav

- Verifiera att legend-commentary inte triggar för opponentens legends
  (bara `clubId === game.managedClubId`)
- Verifiera 70%-chansen — gå inte ner i 100% (vi vill ha viss variation
  så det inte blir förutsägbart)
- Edge case: om en spelare blir legend mitt i säsongen, fungerar det?
  (spelare blir `isClubLegend = true` vid pension i Sprint 27 — alltså
  endast pensionerade spelare. Verifiera om det finns *aktiva* legends
  i kodbasen. Om inte: utvidga `isClubLegend`-flaggan till att gälla
  spelare med ≥5 säsonger + ≥100 matcher som fortfarande spelar.)

**Notera till Code:** Verifiera först om aktiva legends existerar. Om
`isClubLegend` bara sätts vid pension i nuvarande kod, behöver vi
*generation-logik* som flaggar aktiva spelare som möter kriterierna.
Lägg den i `playerDevelopmentService` eller liknande, och anropa varje
omgång eller säsongstart.

---

## FAS C — SKÄRMDUMP-VÄNLIGHET-AUDIT (Opus)

**Mål:** Identifiera 5-10 vyer i appen där spelaren kan vilja ta
skärmdump för att dela. För varje, lista visuella problem som hindrar
det.

**Estimat:** ~1h Opus.

**Inte ny kod.** Resultat = lista i `docs/SCREENSHOT_AUDIT_2026-04-26.md`
med konkreta åtgärder. Sedan blir det små fix-jobb i framtida sprintar.

### C.1 — Vyer att granska

1. **MatchLiveScreen** efter slutsignal — när hela matchen sammanfattas
2. **GranskaScreen** (post-match analys) — score, POTM, andra matcher
3. **SeasonSummaryScreen** — säsongsslut med matchOfTheSeason
4. **PreSeasonScreen** — "Läget i klubben" med diff-kort
5. **PlayerCard** med CareerJourney — för en legend
6. **Pension-ceremoni-modal** (Sprint 27 fas D)
7. **TabellScreen** med form-prickar — när klubben klättrat
8. **Coffee-room-quote** med legend-referens
9. **Inbox-rad** med dramatiskt rubrik (transferdrama, skandal)
10. **Klubb-sidan** med arena, klacknamn, patronyl

### C.2 — Granska per vy

För varje vy, svara på:
- Ser det visuellt komplett ut? (header, footer, content)
- Är alla viktiga element synliga? (inte avhuggen text, inte clipped)
- Är layouten symmetrisk eller balanserad?
- Är klubblogo / klubbnamn synligt? (för identifikation av delning)
- Skulle någon dela detta? Varför / varför inte?

### C.3 — Output

`docs/SCREENSHOT_AUDIT_2026-04-26.md` med format:

```markdown
## [Vy-namn]

**Status:** ✅ Skärmdump-värd / 🟡 Med fix / 🔴 Inte värd

**Problem:**
- [konkret problem]
- [konkret problem]

**Föreslagna fix:**
- [konkret fix, ~30 min Code-jobb]
- [konkret fix]

**Skärmdump-värdighet (1-5):** N
```

Inga fix implementeras i denna sprint. Bara listan.

---

## SAMMANFATTNING & ORDNING

| Fas | Vad | Vem | Estimat | Aktiveras |
|-----|-----|-----|---------|-----------|
| A | Pension-impact på morale | Code+Opus | 2-3h | Alltid |
| B | Match-commentary för legend | Code+Opus | 2-3h | Alltid (med pre-check) |
| C | Skärmdump-audit | Opus | 1h | Alltid |

**Total estimat:** 5-7h.

**Ordning:**
1. Fas A först — bygger direkt på Sprint 27, momentum
2. Fas B andra — kräver verifiering av aktiva legends (gate)
3. Fas C tredje — Opus-audit, blockerar inget annat

**Audit-gate mellan A och B:** Om fas A's morale-impact ger oväntade
resultat (för stora hits, eller fel triggers), justera innan B börjar.

---

## EFTER LEVERANS

`docs/sprints/SPRINT_28_AUDIT.md` med separata sektioner per fas.
Kod-verifierad simulation enligt CLAUDE.md § SJÄLVAUDIT.

KVAR.md uppdateras: Sprint 28 stängd. Skärmdump-audit-fynd läggs som
fix-rader i KVAR.

---

## VAD SOM INTE INGÅR

- **Berättelsens slut-bilder** (specifika moment-bilder för delning).
  Den får egen Sprint 29 som ny spec efter att skärmdump-audit (fas C)
  visat var de mest värdefulla momenten ligger.
- **Generisk säsongsslut-share-image.** Researchen visade att specifika
  ögonblick > generisk sammanfattning. Vi specar specifika moment efter
  audit-fynd.
- **Väder-polish, ljudeffekter (THE_BOMB 4.x).** Polish-paket för senare.
- **Legend-merch-mock i UI.** Kuriös idé från researchen, inte i scope.

---

## PRINCIPER SOM TILLÄMPAS

**Princip 1 (Inbox-principen):** Pension-impact är fasens hela poäng —
pension manifesteras i morale, inte bara i inbox. Match-commentary för
legend manifesteras i match-feeden, inte bara i karriärlogg.

**Princip 2 (Pre-spec cross-check):** Specen kräver verifiering av om
aktiva legends existerar (fas B.4). Skärmdump-audit (fas C) är
strukturellt en pre-spec cross-check för Sprint 29.

**Princip 3 (Integration-completeness):** Pension-impact listar tre
manifestationer: morale (mekanisk), kapten-vakuum (UX), inbox-narrativ
(text). Match-commentary för legend listar fyra event-kategorier (mål,
assist, MV, sen kvittering).
