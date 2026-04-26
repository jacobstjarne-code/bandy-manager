# TEXT_REVIEW — Sprint 26 skandalreferenser

**Datum:** 2026-04-26
**Författare:** Opus + Jacob (kurerad iteration)
**Status:** GODKÄND
**Total textmängd:** 65 strängar fördelade på 4 system

Det här dokumentet innehåller alla nya svenska strängar för Sprint 26
(cross-system-skandalreferenser). Code läser detta dokument och kopierar
strängarna in i respektive datafil. Inga formuleringar ska ändras utan
godkännande av Opus.

**Tonriktlinjer som styr alla strängar:**
- Parkerings-ton, understatement
- Konkreta detaljer (sponsor-namn, summor, kuvert, tröjor)
- Inga LLM-meningspar där rad två förklarar rad ett
- Bisatser dödar humor → enrader när det går
- Klacken erkänner aldrig skandalen — synkproblem visar oron
- Motståndartränaren använder inte TV-floskler
- Pressfrågor är vagt formulerade → fungerar oavsett skandaltyp

---

## DEL 1 — DASHBOARD-KAFFERUM

**Fil:** `src/domain/services/coffeeRoomService.ts`

**Datastruktur:** Två nya konstanter `SCANDAL_DASHBOARD_OWN` och
`SCANDAL_DASHBOARD_OTHER`, indexerade per skandaltyp. Format som befintliga
`TRANSFER_*_EXCHANGES` — `[speaker1, line1, speaker2, line2]`.

**Triggermekanik:**
- Kontrollera `game.scandalHistory` filtrerat på `triggerRound >= round - 1`
  och `season === currentSeason` och `type !== 'small_absurdity'`
- 25% chans (`seed % 4 === 0`) — annars vanlig coffeeroom-quote
- Välj OWN-pool om `scandal.affectedClubId === game.managedClubId`,
  annars OTHER-pool
- Max en skandal-quote per omgång

### 1A — Egen klubb drabbad

#### `municipal_scandal` (kommunbidraget granskas)
1. `Kioskvakten: "Hörde att Granskning ringde i veckan." Vaktmästaren: "Lokaltidningen eller riktiga?" Kioskvakten: "Riktiga."`
2. `Kassören: "Jag har räknat fram det tre gånger." Ordföranden: "Stämmer det?" Kassören: "Det är därför jag räknat tre gånger."`
3. `Vaktmästaren: "Politikern har slutat svara." Materialaren: "Bra. Då slipper han säga något."`

#### `sponsor_collapse` (sponsor lämnade)
1. `Kassören: "Tröjorna ska tryckas om." Materialaren: "När då?" Kassören: "När någon betalat."`
2. `Kioskvakten: "Han ringde inte ens." Vaktmästaren: "Bara mejl?" Kioskvakten: "Bara mejl."`
3. `Ordföranden: "Nya förfrågningar har inte kommit än." Kassören: "Det går två veckor till."`

#### `treasurer_resigned` (kassören slutade)
1. `Vaktmästaren: "Är det någon som öppnat kontoret?" Kioskvakten: "Inte sen i tisdags." Vaktmästaren: "Då." Kioskvakten: "Då."`
2. `Materialaren: "Jag försökte få fram papperna till skatteverket." Ordföranden: "Och?" Materialaren: "Pärmen är där hon lämnade den."`
3. `Kioskvakten: "Hon kom in på matchen i lördags." Kassören: "Sa hon något?" Kioskvakten: "Hon köpte korv."`

#### `phantom_salaries` (Skatteverket dragit poäng)
1. `Kassören: "Två poäng." Ordföranden: "Två." Kassören: "Det är en match."`
2. `Vaktmästaren: "Vi hade kunnat göra någonting bättre med tiden." Materialaren: "Vad menar du?" Vaktmästaren: "Allt."`
3. `Kioskvakten: "Det var inte ens samma kassör som lade upp det." Materialaren: "Spelar ingen roll nu."`

#### `club_to_club_loan` (vi lånade till grannklubb)
1. `Ordföranden: "Det skulle hjälpa bägge." Kassören: "Det blev så." Ordföranden: "Hjälpen gick åt fel håll."`
2. `Vaktmästaren: "Hörde att de fick poängavdraget igår." Kioskvakten: "Bra för dem att vi hjälpte till." Vaktmästaren: "Mhm."`

#### `fundraiser_vanished` (insamlingen försvann)
1. `Materialaren: "Birger frågade igen idag." Kioskvakten: "Vad sa du?" Materialaren: "Att vi tittar på det."`
2. `Kioskvakten: "Vi ska ha medlemsmöte." Vaktmästaren: "Frivilligt?" Kioskvakten: "Inte direkt."`
3. `Kassören: "Polisen har inte hört av sig." Ordföranden: "Det är en månad sedan." Kassören: "Jag vet."`

#### `coach_meltdown` (vår tränare tar paus)
1. `Vaktmästaren: "Jag plogade tidigt idag. Han var där redan." Materialaren: "Sa något?" Vaktmästaren: "Bara hej."`
2. `Kioskvakten: "Assisterande verkar göra vad han kan." Materialaren: "Han är inte tränaren, det är skillnaden." Kioskvakten: "Vi får hoppas."`
3. `Kassören: "Ingen frågar efter ett presskonferensdatum." Ordföranden: "Bra." Kassören: "Ja. Det är bra."`

**Subtotal 1A:** 21 utbyten

### 1B — Annan klubb drabbad

`{KLUBB}` ersätts med faktiska klubbnamnet av Code via lookup på
`scandal.affectedClubId`. `{ANDRA_KLUBB}` (där det förekommer) ersätts via
`scandal.secondaryClubId`.

#### `municipal_scandal`
1. `Kioskvakten: "Politiker bråkar om {KLUBB}-bidraget igen." Vaktmästaren: "Igen?" Kioskvakten: "Tredje gången på fem år."`
2. `Kassören: "{KLUBB} ska skolas av kommunen." Ordföranden: "Det skulle vi också." Kassören: "Vi har ingen mark att sälja."`
3. `Materialaren: "Hörde att {KLUBB} fick stryk i fullmäktige." Vaktmästaren: "Av vem?" Materialaren: "Alla."`

#### `sponsor_collapse`
1. `Kioskvakten: "{KLUBB} förlorade en sponsor i veckan." Kassören: "Stor?" Kioskvakten: "Lagom."`
2. `Vaktmästaren: "Tror dom hade Borgvik Bygg också." Materialaren: "Då har dom det jobbigt." Vaktmästaren: "Det har alla."`
3. `Ordföranden: "{KLUBB} söker ny huvudsponsor enligt tidningen." Kassören: "Lycka till."`

#### `treasurer_resigned`
1. `Materialaren: "{KLUBB}s kassör är borta." Kioskvakten: "Vad hände?" Materialaren: "Personliga skäl, står det."`
2. `Kassören: "Hörde att {KLUBB} inte kan göra transfers nu." Ordföranden: "Inte?" Kassören: "Pärmarna är låsta."`
3. `Vaktmästaren: "Hon var hyfsat ung." Kioskvakten: "Vem?" Vaktmästaren: "{KLUBB}s kassör."`

#### `phantom_salaries`
1. `Kassören: "{KLUBB} fick två poäng dragna." Ordföranden: "På vad?" Kassören: "Spelare som inte fanns."`
2. `Kioskvakten: "Skatteverket var tydligen klara med {KLUBB}." Materialaren: "Och?" Kioskvakten: "Det stod två poäng på fakturan."`
3. `Vaktmästaren: "Bra att vi har vår kassör." Materialaren: "Hon räknar två gånger." Vaktmästaren: "Tre."`

#### `club_to_club_loan`
1. `Ordföranden: "{KLUBB} och deras grannar gjorde en deal." Kassören: "Kreativ?" Ordföranden: "Det säger Förbundet."`
2. `Materialaren: "Tre poäng nästa säsong för {KLUBB}." Vaktmästaren: "Det är en tabellplats." Materialaren: "Minst."`
3. `Kioskvakten: "Hörde att kassören sitter på båda klubbarnas kontor." Vaktmästaren: "Då blev det som det blev."`

#### `fundraiser_vanished`
1. `Kassören: "{KLUBB}s korv-pengar är borta." Vaktmästaren: "300 spänn?" Kassören: "300 tusen."`
2. `Kioskvakten: "Klacken i {KLUBB} står utanför kansliet." Materialaren: "Och?" Kioskvakten: "Ingen kommer ut."`
3. `Ordföranden: "Det är en sån grej man lär sig av." Kassören: "Att räkna oftare." Ordföranden: "Mhm."`

#### `coach_meltdown`
1. `Vaktmästaren: "{KLUBB}s tränare är borta." Kioskvakten: "Vad hände?" Vaktmästaren: "Personliga skäl."`
2. `Materialaren: "Han ringde en kollega här i veckan." Kassören: "Sa något?" Materialaren: "Sa att han söker hjälp."`
3. `Kioskvakten: "Det är såna grejer man inte glädjs över." Vaktmästaren: "Nej." Kioskvakten: "Spelar ingen roll vilket lag."`

**Subtotal 1B:** 21 utbyten

---

## DEL 2 — KLACK-COMMENTARY

**Fil:** `src/domain/data/matchCommentary.ts` + `src/domain/services/matchCore.ts`

**Datastruktur:** Ny category `supporter_scandal_recent` i `commentary`-objektet.

**Triggermekanik (i matchCore.ts):**
```typescript
const ownScandalThisSeason = (game.scandalHistory ?? []).some(s =>
  s.season === game.currentSeason &&
  s.affectedClubId === managedClubId &&
  s.type !== 'small_absurdity'
)
if (ownScandalThisSeason && supporterCtx && rand() < 0.20) {
  commentaryText = fillTemplate(pickCommentary(commentary.supporter_scandal_recent, rand), sv)
}
```

**Variabler:** `{leader}` (klackledarens namn), `{members}` (antal medlemmar),
`{groupName}` (klackens namn).

**Princip:** Klacken erkänner aldrig skandalen i sina egna handlingar.
Berättaren observerar att synkningen är off, takten knaggar, klackledaren
får jobba hårdare. Klacken sjunger på som vanligt.

```
supporter_scandal_recent: [
  '📯 {leader} börjar slå trumman tidigt. Ramsorna kommer inte med på första försöket.',
  '📣 "Hejsan alla är ni klara?" Svaret kommer från halva läktaren. {leader} drar den en gång till.',
  '🎵 Växelramsan tappar i bortre sektionen. {leader} tittar dit, tar i lite mer.',
  '📯 Trumslagen kommer i takt. Sångerna ligger ett halvt slag efter.',
  '{leader} går runt arenan ändå. Tunn tröja, bara handskar — som alltid. Som om ingenting hade hänt.',
  '📣 "Öka takten sista kvarten" — fjärde gången idag. {leader} hittar inte rätt timing ikväll.',
  '🎵 {members} på läktaren. Ljudtopparna är där. Bottnarna är längre än vanligt.',
  '📯 Trumman går. Flaggorna går. Det går — men det knaggar i synkningen.',
],
```

**Subtotal:** 8 strängar

---

## DEL 3 — PRESSKONFERENSFRÅGOR

**Fil:** `src/domain/services/pressConferenceService.ts`

**Datastruktur:** Lägg till nya `PressQuestion`-objekt till befintliga
QUESTIONS-pooler (loss, bigLoss, win, bigWin, draw). Nytt fält:
`minScandalThisSeason: true`.

**Filterlogik vid frågeval:** Om `q.minScandalThisSeason === true`, kräv att
`game.scandalHistory.some(s => s.season === game.currentSeason)`. Annars
filtrera bort frågan från poolen.

**Princip:** Vagt formulerade — fungerar oavsett vilken skandaltyp som
triggade och oavsett om det är spelarens egen klubb eller annan klubb.

### För `loss` och `bigLoss`-poolerna
1. `Det rör om i ligan med skandaler den här säsongen. Påverkar det stämningen i omklädningsrummet?`
2. `Förbundet har sina händer fulla just nu. Stör det fokuset på matchen?`

### För `win` och `bigWin`-poolerna
3. `Bandysverige skakas av rubriker just nu — ni vinner ändå. Är det ett tecken på något?`
4. `Det är turbulent runt sporten den här säsongen. Hur håller ni er fokuserade?`

### För `draw`-poolen
5. `En match i en orolig säsong — för bandyn i stort. Vad säger du om läget i ligan?`

### Generell — för alla pooler
6. `Tidningarna pratar mer om ekonomi än bandy just nu. Hur landar det hos er?`
7. `Det är inte den lugnaste säsongen för svensk bandy. Märks det i kalendern eller bara på rubrikerna?`

**Notering till Code:** `preferIds`-arrayen behöver fyllas av Code med
befintliga response-IDs som passar tonen. Förslagsvis IDs som motsvarar
"vi fokuserar på vårt jobb"-svar (t.ex. `bw_d1`, `cl04`, `l_h9`).

**Subtotal:** 7 frågor

---

## DEL 4 — MOTSTÅNDARTRÄNAREN

**Fil:** `src/domain/services/opponentManagerService.ts`

**Datastruktur:** Två nya quote-arrays — en för utfall där motståndaren
förlorade matchen, en för där motståndaren vann. Plus en generell array
för udda fall.

**Triggermekanik:**
```typescript
const opponentScandal = (game.scandalHistory ?? []).find(s =>
  s.affectedClubId === opponentClubId &&
  s.season === game.currentSeason &&
  s.type !== 'small_absurdity'
)
if (opponentScandal) {
  // välj från SCANDAL_AFFECTED_QUOTES baserat på matchresultat
}
```

**Princip:** Värdig, något stoiskt, ibland uppgivet. Inte triumferande,
inte offerlik. Bandytränare är pragmatiska — de säger "det är som det är"
och hänvisar till spelarna. Inga TV-floskler ("Spelarna har gett allt"
är förbjudet).

### A) Drabbade klubben förlorade matchen
1. `"Det har varit mycket runtomkring oss. Spelarna har försökt — det är allt jag kan säga om saken."`
2. `"Vi förlorade. Vi vet varför. Lagets fokus har inte varit perfekt, men det är inte en ursäkt — det är en förklaring."`
3. `"Det är säsongen vi haft. Vi får ta det här och gå vidare. Inget mer än så."`
4. `"Vi har grejer att lösa hemma också. Det här var inte lätt, men det är inget vi kan dröja vid."`

### B) Drabbade klubben vann matchen
5. `"Killarna höll fokus. Det är inte självklart i läget vi är i."`
6. `"Truppen har stängt allt utanför planen ute. Det är jag stolt över. Mer behöver inte sägas."`
7. `"Bra för killarna. De förtjänar att slippa rubriker en gång."`

### C) Generell — oavsett utfall
8. `"Vi spelade. Det är vad jag bryr mig om idag."`

**Subtotal:** 8 quotes

---

## SAMMANFATTNING

| Del | System | Antal | Fil |
|-----|--------|-------|-----|
| 1A | Coffee-room (egen klubb) | 21 | `coffeeRoomService.ts` |
| 1B | Coffee-room (annan klubb) | 21 | `coffeeRoomService.ts` |
| 2 | Klack-commentary | 8 | `matchCommentary.ts` + `matchCore.ts` |
| 3 | Pressfrågor | 7 | `pressConferenceService.ts` |
| 4 | Motståndartränaren | 8 | `opponentManagerService.ts` |
| **Totalt** | | **65** | |

---

## INSTRUKTIONER TILL CODE

1. **Kopiera bokstavligt.** Inga formuleringar ska ändras utan godkännande.
   Kommatecken, bindestreck (em-dash —), punkter — exakt som det står.

2. **Variabel-substitution:**
   - `{KLUBB}` → `club.name` via lookup på `scandal.affectedClubId`
   - `{ANDRA_KLUBB}` → `secondaryClub.name` via lookup på
     `scandal.secondaryClubId` (fallback: `'grannklubben'`)
   - `{leader}`, `{members}`, `{groupName}` → som befintliga
     `supporter_*`-categories

3. **Filterlogik:**
   - `type !== 'small_absurdity'` — small_absurdity hanteras separat via
     `mediaProcessor` och ska INTE trigga skandalreferenser i andra system
   - Endast `season === game.currentSeason` — gamla säsongers skandaler
     är borta från diskussion
   - För coffee-room: `triggerRound >= round - 1` — bara förra eller
     innevarande omgångs skandaler

4. **Verifiering efter implementation:**
   - Lägg till test som verifierar att `getCoffeeRoomQuote` returnerar
     skandal-quote när `scandalHistory` har relevant entry och `seed % 4
     === 0`
   - Manuell verifiering: starta spel, spela till första skandalen
     triggar (omgång 6-8), spela en omgång till och kontrollera att
     dashboard-kafferum ibland refererar skandalen

5. **Rapportera tillbaka i `SPRINT_26_AUDIT.md`:**
   - Faktiska skärmdumpar/copy-paste av genererade strängar i appen
   - Bekräftelse att inbox-flödet är oförändrat
   - 1895/1895 grönt
