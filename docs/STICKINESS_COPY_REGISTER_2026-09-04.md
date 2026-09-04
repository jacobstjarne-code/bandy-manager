# STICKINESS — COPY-REGISTER (LÅST)

**Datum:** 2026-09-04 · **Av:** Opus · **Stänger:** MASTER `stickiness-copy-roster` · **Gäller:** Attention Engine → push/badge/memory_card enligt `RAPPORT_STICKINESS_NOTIFIERINGAR_PWA` §7–§8 och `SPEC_BERATTAREN` §5 Push.
Code kopierar ordagrant, översätter aldrig, lägger inte till adjektiv. Varje mall deklarerar sina **state-fält**; en mall får bara renderas när alla fält är belagda ur game state/agendan. Inga siffror eller namn som inte kommer ur fälten. Alla klubbnamn är spelvärldens tolv (`{Motståndare}`, `{Klubb}`) — aldrig riktiga föreningar. Rösterna återanvänder etablerad ton: assistenten (assistentanteckningarna), ordföranden (styrelsemötena), lokalpressen (journalisten), klubben (Klubbpärmens/liggarens torra röst), klacken (klackekot — sparsamt).

**Format:** push-titel ≤ 40 tecken, brödtext ≤ 100. Titeln är rubriken på låsskärmen; brödtexten är det som får en att öppna. Deep link anges per familj (allowlistade routes). Mallnyckel: `familj.röst.variant`.

**Förbjudet överallt:** "Dags att spela", "Din klubb behöver dig", "Du har inte spelat på…", "bonus", "streak", utropstecken i titel, mer än ett bindestreck per mall.

---

## 1. Matchförberedelse — laget ej bekräftat (aktiv redan)

State-fält: `{Motståndare}`, `{hemma|borta}`, `{dagar}` (0 = i dag, 1 = i morgon), `{rivalitet: bool}`, `{previousResult: W|L|D|none}`. Deep link: laguttagningen.

**Första bedömning — praktisk (assistenten):**
- `prep.assistant.a` — titel: *Laget är inte klart.* · body: *{Motståndare} {hemma|borta} {i morgon|i dag|om {dagar} dagar}. Elvan väntar på dig.*
- `prep.assistant.b` — titel: *Elvan väntar.* · body: *{Motståndare} på {lördag…}. Jag har ett förslag, men det är ditt lag.*
- `prep.assistant.c` — titel: *En sak kvar före {Motståndare}.* · body: *Laget. Resten är gjort.*

**Senare bedömning — ny kontext, aldrig samma argument:**
- `prep.assistant.rivalry` (kräver `rivalitet`) — titel: *Derbyt är {i morgon|på {dag}}.* · body: *Mot {Motståndare} vill ingen stå fel. Elvan är inte satt.*
- `prep.assistant.revenge` (kräver `previousResult = L`) — titel: *{Motståndare} igen.* · body: *Förra gången förlorade vi. Laget är inte klart än.*
- `prep.chair.pressure` (ordföranden, efter en ignorerad) — titel: *Styrelsen undrar.* · body: *{Motståndare} {i morgon|i dag}. Är laget satt? Jag frågar för att någon annan frågade mig.*
- `prep.club.deadpan` — titel: *{Motståndare}. {dagar} dagar.* · body: *Elva namn saknas.*

---

## 2. Kalenderankare — derby, cup, slutspel, final, annandag

State-fält: `{Motståndare}`, `{ankare: derby|cup|slutspel|final|annandag}`, `{dagar}`, `{hemma|borta}`, `{tabellplacering}` (egen), `{motståndarePlacering}`. Deep link: nästa match / Portalen. Läses ur Berättarens agenda (kind tension/triumph).

**Lokalpressen — förhandsrubrik:**
- `anchor.press.derby` — titel: *Derbyveckan är här.* · body: *{Klubb}–{Motståndare} {hemma|borta} på {dag}. Orten pratar inte om något annat.*
- `anchor.press.playoff` — titel: *Slutspelet börjar.* · body: *{Motståndare} i {kvartsfinal|semifinal}. {Klubb} har inte varit här sedan {årtal}.* *(kräver `sistaSlutspel` ur liggaren; annars utan sista meningen)*
- `anchor.press.final` — titel: *Final.* · body: *{Klubb} mot {Motståndare}. En match, ett år.*
- `anchor.press.cup` — titel: *Cupkväll i {ort}.* · body: *{Motståndare} på {dag}. Vinnaren går vidare, förloraren åker hem.*

**Klubben — torrt:**
- `anchor.club.annandag` — titel: *Annandagen.* · body: *{Motståndare} {hemma|borta}. Som varje år.*
- `anchor.club.derby` — titel: *Derby på {dag}.* · body: *{Motståndare}. Du vet.*
- `anchor.club.final` — titel: *Det är final på {dag}.* · body: *Mot {Motståndare}. Ingen påminnelse behövs, men här är en.*

**Klacken — sparsamt, bara vid derby/final, kräver `klackMood ≥ 60`:**
- `anchor.fans.derby` — titel: *Läktaren är redan där.* · body: *Derby mot {Motståndare}. Klacken sjunger sedan i onsdags.*
- `anchor.fans.final` — titel: *Hela orten åker.* · body: *Final mot {Motståndare}. Bussarna är fulla.*

---

## 3. Säsongsläge — tabell, slutspelskamp, serieseger, nedflyttning

State-fält: `{placering}`, `{poängTill: slutspel|serieseger|säkerhet}`, `{omgångarKvar}`, `{form: W/L-serie}`. Deep link: Tabell. Läses ur agendan (`season_highlight`, `season_finish`-prognos) eller direkt ur standings — bara när läget är laddat (≤ 3 poäng från en gräns, eller serie ≥ 3).

**Ordföranden — kort, organisatorisk:**
- `season.chair.playoff_edge` — titel: *{poängTill} poäng till slutspel.* · body: *{omgångarKvar} omgångar kvar. Styrelsen räknar. Det gör vi alla.*
- `season.chair.relegation` — titel: *{placering}:e plats.* · body: *{poängTill} poäng till säkerhet, {omgångarKvar} omgångar. Vi behöver inte prata om vad det betyder.*
- `season.chair.title` — titel: *Serieseger inom räckhåll.* · body: *{poängTill} poäng, {omgångarKvar} omgångar. Ordföranden har inte sovit.*

**Klubben — torrt:**
- `season.club.streak_w` (kräver `form ≥ 3W`) — titel: *{N} raka.* · body: *{Motståndare} nästa. Serien håller tills den inte gör det.*
- `season.club.streak_l` (kräver `form ≥ 3L`) — titel: *{N} raka förluster.* · body: *{Motståndare} på {dag}. Något måste ändras, eller inte.*
- `season.club.table` — titel: *{placering}:e i tabellen.* · body: *{omgångarKvar} omgångar kvar. Siffrorna står där de står.*

**Assistenten — med egen uppfattning:**
- `season.assistant.opinion_playoff` — titel: *Slutspelet går att nå.* · body: *{poängTill} poäng på {omgångarKvar} matcher. Jag tror på det. Laget vet inte än.*
- `season.assistant.opinion_relegation` — titel: *Vi ligger illa.* · body: *{placering}:e, {poängTill} poäng till säkerhet. Jag säger det rakt, för ingen annan gör det.*

---

## 4. Narrativ återkomst — ur liggaren via agendan

State-fält per post: `{Namn}` (subjectSnapshot), `{Motståndare}`, typ. Deep link: nästa match eller Krönikan. Detta är Berättarens ämnen; texten säger *vad liggaren vet*, inte mer.

**Revansch** (post `big_loss`/`derby_result` L mot samma motståndare, ≤ 1 säsong):
- `memory.press.revenge` — titel: *Revanschen väntar.* · body: *{Motståndare} slog {Klubb} med {resultat} {förra säsongen|i höstas}. På {dag} möts de igen.*
- `memory.club.revenge` — titel: *{Motståndare}. Igen.* · body: *{resultat} förra gången. Den siffran står kvar i Krönikan.*

**Ex-spelare i motståndarlaget** (post `transfer_sold`/`transfer_story`, subject i motståndarens trupp):
- `memory.press.ex_player` — titel: *{Namn} kommer tillbaka.* · body: *Såld till {Motståndare} {i somras|förra året}. På {dag} spelar han mot {Klubb}.*
- `memory.club.ex_player` — titel: *{Namn} i fel tröja.* · body: *Ni sålde honom. Nu möter ni honom.*

**Återkomst till gamla klubben** (managerns karriärpost, första matchen mot förra `clubId`):
- `memory.press.return` — titel: *{Manager} tillbaka i {ort}.* · body: *Första gången mot {Motståndare} sedan avskedet. Läktaren minns.*
- `memory.club.return` — titel: *Tillbaka till {ort}.* · body: *Första matchen mot dem sedan du gick. Åt båda hållen.*

**Återkommande taktiskt misslyckande** (B12-post: samma kostnadsrad tre matcher i rad, t.ex. utvisningar under 5-2-3):
- `memory.assistant.pattern` — titel: *Samma sak tredje gången.* · body: *{kostnadsrad, t.ex. "Tre utvisningar under 5-2-3"}. Jag säger inget mer. Jo, en sak: byt.*

**Nemesis** (post `nemesis_signed`, spelare rival tog):
- `memory.press.nemesis` — titel: *Han valde {Motståndare}.* · body: *{Namn}, som {Klubb} jagade. På {dag} står han på andra sidan.*

---

## 5. Stateförändring — kopplas på när livscykeln är klar (spärrad)

State-fält: `{Namn}`, `{händelse: tillbaka från skada|tillbaka från lån|uppflyttad}`, `{nästaMatch}`. Deep link: Trupp.
- `state.assistant.available` — titel: *{Namn} är tillbaka.* · body: *{Från skada|Från lånet}. Klar till {Motståndare}. Det ändrar elvan.*
- `state.assistant.promoted` — titel: *{Namn} är uppe.* · body: *Från P19 till A-laget. Jag skulle ge honom {Motståndare}.*
- `state.club.contract` (kräver `kontraktLöperUt ≤ 3 omgångar`) — titel: *{Namn}s kontrakt.* · body: *Går ut om {N} omgångar. Ingen har pratat med honom.*

---

## 6. Celebration / observation — ingen handling krävs (spärrad)

State-fält: `{resultat}`, `{Motståndare}`, `{Namn}`, milstolpe. Deep link: Granska / Krönikan. Bara vid `big_win`, `player_milestone` ≥ 60, `derby_win`, `season_highlight`.
- `celebrate.assistant.big_win` — titel: *Ingen taktisk analys i dag.* · body: *{resultat} mot {Motståndare} räcker.*
- `celebrate.club.derby_win` — titel: *Derbyt.* · body: *{resultat}. Orten sover gott.*
- `celebrate.club.milestone` — titel: *{Namn}: {milstolpe}.* · body: *Det står i Krönikan nu.*
- `celebrate.fans.big_win` (kräver `klackMood ≥ 70`) — titel: *De sjöng hem.* · body: *{resultat} mot {Motståndare}. Bussen var hög.*
- `celebrate.press.record` (kräver rekordpost) — titel: *Rekord i {ort}.* · body: *{Namn}: {milstolpe}. Lokalpressen har fått sin rubrik.*

---

## 7. Permission-flödet (låst)

**Pre-prompt** (visas efter första lästa Granska när nästa match har obekräftat lag — `stickiness-permission-ogonblick`):
titel: *Vill du att klubben hör av sig när något faktiskt är värt att veta?*
body: *Matcher, beslut och klubbhändelser. Inga dagliga påminnelser, ingen bonus.*
knappar: *Ja, hör av er* / *Inte nu*

**iOS-hemskärm** (visas före pre-prompt på Safari utan installation):
titel: *Lägg Bandy Manager på hemskärmen först.*
body: *Då kan klubben höra av sig. Dela → Lägg till på hemskärmen.*
knapp: *Jag har gjort det*

**Avslag (Inte nu):** ingen text — frågan tystnar i 30 dagar eller tills nästa stora säsongshändelse (rapportens §10).

**Inställningar — kategorier** (Design mockar; etiketter låsta):
*Matchförberedelse* · *Derbyn, cup och slutspel* · *Tabelläget* · *Klubbens minne* · *Spelarnyheter* · *När det gått bra*
Underrad: *Tyst 21.30–08.00. Högst en om dagen.*

**Avregistrering** (raderar allt server-side): titel: *Klubben tystnar.* · body: *Inga fler notiser. Allt om den här installationen raderas hos oss.* · knapp: *Tysta*

---

## 8. Regler för Code vid rendering

1. Välj mall ur familjen agendan gav; välj röst enligt kandidatens `voice`-fält; välj variant i rotation, aldrig samma variant två leveranser i rad för samma installation.
2. Saknas ett state-fält: mallen är ogiltig — ta nästa, eller skicka inget. Aldrig tom platshållare, aldrig "okänd".
3. Titel utan avslutande utropstecken; brödtext får ha punkt eller frågetecken.
4. `{dag}` renderas som veckodag ("på lördag"), `{dagar}` 0 → "i dag", 1 → "i morgon", 2–6 → "på {veckodag}", ≥ 7 → "om {N} dagar".
5. `{resultat}` alltid ur `result`-fältet (k9), egen klubb först: "4–2" om vi vann, "2–4" om vi förlorade.
6. Push-copyn går genom textgrinden (forbudslistan, opusPlaceholderGate) som all annan text.
7. Ny mall = ny rad här med state-fält deklarerade, sedan Code. Aldrig tvärtom.
