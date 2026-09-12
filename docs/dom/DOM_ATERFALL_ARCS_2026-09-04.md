# DOM — ÅTERFALL OCH SKIP FÖR ARC-PRODUCENTERNA (Berättaren steg 9)

**Datum:** 2026-09-04 · **Av:** Opus · **Stänger Opus-grinden i:** MASTER `berattaren-beats-idempotens`, `berattaren-aterfall-ersatter-intro` · **Grund:** Codex producentinventering 2026-09-04, `arcService.ts` (kodläst: triggers, peak-events, resolutions, exit-texter), `redaktorenService.ts` (`semanticKeyStem`), `storylineLedgerService.hasPriorStorylineResolution`.
**Bygger:** Code. **Text:** låst nedan, kopieras ordagrant.

## Principen

En båge som redan har en `storyline_resolution` för samma person får inte köra sitt intro igen som om ingenting hänt. Tre utfall finns, och de döms per båge:

- **VARIANT** — andra gången är en berättelse i sig (torkan igen, veteranen igen). Intro/peak/resolution byts mot återfallstexterna nedan. Mekaniken (choices, effekter) oförändrad om inget annat sägs.
- **SKIP** — tredje gången (eller där en upprepning inte bär något) skapas ingen arc alls. Tyst. Matchhändelsen finns kvar i referatet; bågen tillför inget.
- **PER INSTANS** — bågar som är händelsebundna snarare än personbundna (derby_echo) körs varje gång men **minns** föregående instans i texten.

**Prior-check:** `hasPriorStorylineResolution` med nyckel = `semanticKeyStem` över typ + playerId (för derby_echo: typ + opponentClubId + season). Räknas över säsonger för personbågar — en torka nästa säsong ÄR ett återfall. Antal tidigare resolutioner styr: 0 = intro, 1 = variant, ≥ 2 = skip (undantag noterade).

## Per båge

| Båge | Prior-nyckel | 2:a gången | ≥ 3:e | Not |
|---|---|---|---|---|
| `hungrig_breakthrough` | typ + playerId | VARIANT | SKIP | Torkan igen är sann och stark. Tre gånger är tjat. |
| `joker_redemption` | `joker_vindicated` + playerId | VARIANT (bara om tidigare `joker_vindicated` finns — dvs. du trodde på honom och han levererade) | SKIP | Bänkad förra gången → ingen resolution skrevs → intro igen är korrekt (styrelsen minns inte en icke-händelse). |
| `veteran_farewell` | typ + playerId | VARIANT (efter `veteran_stayed`) | SKIP — ingen tredje förlängning erbjuds; pensionsflödet tar över | Mekanik ändras i varianten: förlängning = **1 år**, inte 2. |
| `lokal_hero` | typ + playerId | VARIANT | SKIP | "Ortens hjälte" två gånger räcker. Målet står i referatet oavsett. |
| `contract_drama` | typ + playerId | VARIANT (efter `extend_now`) | SKIP | Efter `let_go` finns ingen spelare — ingen prior-fråga uppstår. |
| `derby_echo` | typ + opponentClubId + season | PER INSTANS — varianttext efter samma motståndare samma säsong | — (aldrig skip) | Revanschen bor här. Över säsongsgräns: normal text; minnet bärs av agendan (`memory.press.revenge`). |
| skolkonflikten (dilemma) | producentens egen nyckel + playerId | VARIANT — en prefixmening | — (aldrig skip; skolan ringer varje år) | Codex: redan max en per spelare och säsong. Varianten gäller ny säsong, samma spelare. |

Övriga producenter (heltid, arbetsplatsband, uppsägningsräddning, kaptenslyft, befordring, burnout, journalist) är enligt inventeringen redan historikmedvetna eller instans-unika. Ingen åtgärd.

## Texterna (låsta)

`{name}` = spelarens fulla namn som idag; `{age}`, `{annualSalaryTkr}`, `{localPaper}`, `{opponentName}` = befintliga variabler. Emoji-prefix som i befintliga rader.

### hungrig_breakthrough — variant

Peak-event (ersätter intro-peak):
- title: *Journalisten frågar om {name} — igen*
- body: *{name} har det tungt igen. Förra gången höll du honom om ryggen, och han bröt isen. Nu står frågan där en gång till: tror du fortfarande?*
- choices oförändrade (back_him / pressure / alternatives, samma effekter och subtitles).

Resolution (spelaren gjorde mål): description/displayText: *{name} bröt isen. Igen.*

Exit (torkan höll): *{name}s andra torka. Hungern är kvar. Tålamodet är en annan sak.*

### joker_redemption — variant (kräver tidigare `joker_vindicated`)

Building-inbox: title: *📰 {localPaper}: "{name} — igen"* · body: *{name} — igen.*

Peak-event:
- title: *Styrelsen frågar om {name} igen*
- body: *Du trodde på {name} förra gången, och han gav er rätt. Nu sitter han utvisad igen. Styrelsen vill veta om det är samma svar.*
- choices oförändrade (back_joker / bench_joker).

Resolution (backad + bidrog): *{name} — joker i hjärtat. Andra gången.*

### veteran_farewell — variant (kräver tidigare `veteran_stayed`)

Peak-event:
- title: *{name} vill stanna — igen*
- body: *Två år sedan du förlängde. {name} fyller {age} och vill ha ett år till. Ett, säger han, inte två. Han är inte bättre än den som väntar — det var han inte då heller. {annualSalaryTkr} tkr i året, samma som förut.*
- choice `extend_veteran`: label *Förläng ett år* · subtitle *Kontrakt +1 år · klackens stämning +6* · effekt: `extendContract` **contractYears: 1** (ändrad från 2), supporterMood +6 oförändrad.
- choice `farewell_veteran`: oförändrad.

Resolution:
- extended: description *{name} skriver på igen. Ett år. Ingen tårta den här gången — men han log.* · displayText *🏅 {name} stannar ett år till*
- farewelled: description *{name} tömde skåpet själv. Han hade väntat på det i två år.* · displayText samma som description.

Tredje gången: ingen arc. Pensionsflödet (`retirement`) hanterar slutet.

### lokal_hero — variant

Peak-inbox: title: *📰 {localPaper}: "{name} gjorde det igen"* · body: *Två derbyn, två mål. Orten har slutat bli förvånad.*

Resolution: description/displayText: *🏠 {name} — ortens hjälte, andra gången*

Exit-text (fallback): *{name} gjorde det igen. Orten räknar med det nu — det är en annan sorts press.*

### contract_drama — variant (kräver tidigare `extend_now`)

Peak-event:
- title: *{name} ber om ett möte igen*
- body: *Förra året förlängde ni ett år. Nu är budet tillbaka och kontraktet går ut igen. Han vill inte ha samma samtal två gånger.*
- choices oförändrade (extend_now / wait_drama / let_go).

Resolution (let_go): description *{name} lämnade klubben. Andra gången frågan ställdes fick han sitt svar.* · displayText *📋 {name} lämnade*

### derby_echo — per instans, minns samma motståndare samma säsong

Om `derby_echo_resolved` finns mot samma `opponentClubId` innevarande säsong, styr paret (förra, nu):

| förra | nu | headline (inbox-titel) | body + resolution |
|---|---|---|---|
| loss | win | *Revanschen tog {Klubb}* | *🏆 Revansch mot {opponentName}* |
| win | win | *Två derbyn, två segrar* | *🏆 Dubbelt mot {opponentName}* |
| loss | loss | *Derbyt förlorat igen* | *💔 Dubbel derbyförlust mot {opponentName}* |
| win | loss | *{opponentName} tog tillbaka det* | *💔 Derbyförlust mot {opponentName} — de kvitterade* |
| draw / annat | — | befintliga texter | befintliga texter |

Första derbyt mot motståndaren en säsong: befintliga texter, oförändrade.

### skolkonflikten — variant, ny säsong samma spelare

Body får en prefixmening före befintlig text: *Samma samtal som förra året.* Titel och val oförändrade.

## Regler för Code

1. Prior-checken går genom `hasPriorStorylineResolution`/`semanticKeyStem` — inte genom `activeArcs` (som bara spärrar den pågående instansen).
2. Räkna prior-resolutioner: 0 → intro, 1 → variant, ≥ 2 → skip (utom derby_echo och skolkonflikten enligt tabellen).
3. En variant skriver en NY `storyline_resolution` med samma typ — det är det som gör att tredje gången kan kännas igen.
4. Varianttexten ersätter intro-texten helt; inga hopklistrade "igen"-suffix på befintliga rader.
5. Tester per båge: intro → variant → skip; joker utan prior vindication → intro igen; veteran variant ger 1 år; derby loss→win ger revanschraden; skolkonflikt ny säsong får prefixen.
6. Rör inte effekter, subtitles eller sender annat än där domen säger det (veteranens 1 år).

## Vad detta ger

GPT:s tre rapporter hittade "Kristoffers måltorkekort återkom som ny händelse" och "en skolkonflikt återkom som om den aldrig hänt". Efter den här domen kan det inte ske: andra gången är en annan berättelse, tredje gången tyst. Steg 2 (minns) blir regel för alla personbågar — det burnout och pressen redan hade.
