# SPEC — FÖRHANDLINGENS TERMER (C-T8): HANDPENNING, BOENDE, JOBB, ANSIKTE

**Datum:** 2026-09-04 · **Av:** Opus · **Stänger:** MASTER `c-t8-signon-bonus`, `c-t8-boendebidrag`, `c-t8-jobbgaranti`, `c-t8-imagerights` · **Grund:** kodläst `contractNegotiationService.ts` (spann, längdfaktor, personlighet, motvilja), `contractDemandService.ts` (marknadslön, säsongskrav), `RenewContractModal.tsx`, transfertestet 2026-09-04 ("en intressant spelarlista med ofärdiga affärsflöden"), `heltid`-storylinen (spelare har jobb), sponsorEvents `icamaxi_visit`/`send_player`, kanon §7 (bruksortens ekonomi).
**Bygger:** Code. **Text:** låst (§6). **Liggarkontrakt (CLAUDE.md B):** §7.

## 1. Varför

Förhandlingen har två reglage: lön och år. Det är en fotbollsförhandling i en sport där de flesta spelare har ett jobb, där klubbarna traditionellt ordnar lägenhet, och där en handpenning från mecenaten är vanligare än en hög månadslön. GPT:s transfertest: förhandlingen "löst på förhand", affärsflödena "ofärdiga". Codex lade spannet och längdfaktorn. Det som saknas är *innehållet* — vad man faktiskt pratar om vid bordet på en bruksort.

Fyra termer, alla ur bandyns verklighet, alla med en kostnad för klubben och ett värde för spelaren som **inte är samma tal** — det är det som gör förhandlingen till ett spel.

## 2. Modellen

Dagens: `required = clamp(minSalary × längd × personlighet)` inom spannet; accept om `offered ≥ required` (med motvilja-tärning i det övre bandet).

Ny: erbjudandet är `{ salary, years, terms[] }`. Varje term har `clubCost` (vad den kostar klubben, i kr/mån-ekvivalent eller engång) och `playerValue` (vad spelaren värderar den till, i kr/mån-ekvivalent, beroende på vem han är). Resolvern räknar:

```
effectiveOffer = salary + Σ playerValue(term)
accept om effectiveOffer ≥ required   (samma motvilja-logik som idag ovanpå)
```

Klubben betalar `salary + Σ clubCost(term)`. När `playerValue > clubCost` har klubben hittat något spelaren vill ha mer än det kostar — det är förhandlingens poäng. När `playerValue < clubCost` betalar klubben för något spelaren inte bryr sig om — det är misstaget.

Alla tal nedan är **startvärden**, mäts i kalibreringsrundan mot GPT:s transfertest-omkörning.

## 3. De fyra termerna

### A. Handpenning (sign-on) — `signOnBonus`

*Vad:* en engångssumma vid påskrift. Bandyns mecenatpeng.
*Klubbkostnad:* beloppet, ur kassan NU (inte lönebudgeten). Kräver kassa ≥ beloppet.
*Spelarvärde:* `bonus / (12 × years) × f_pers` där `f_pers` = ambitious 1,3 · standard 1,0 · homebound/family 0,8. En ambitiös spelare vill ha pengarna nu; en familjeperson räknar per månad.
*Tillgänglig:* alltid, i steg om 10 tkr, max 12 × required (ett årslönebelopp).
*Konsekvens:* `decision`-posten bär `signOnKr`; årsbokens generiska sats visar "Kostade {bonus} nu".

### B. Boende — `housing`

*Vad:* klubben ordnar lägenhet. Bruksbostäderna. Bandyns mest specifika term.
*Klubbkostnad:* 3 tkr/mån under kontraktstiden (startvärde), ur lönebudgeten som "boende", synligt i Ekonomi.
*Spelarvärde:* beror på om han **behöver** flytta: `isHomegrown || trait === 'lokal'` → 0 (han bor här); annars 3 tkr × f_pers där family 1,5 · homebound 1,4 · standard 1,2 · ambitious 0,9. En familj värderar lägenheten över dess pris; en ambitiös ser en bruksort.
*Tillgänglig:* alltid i v1. **V2:** knyts till en anläggningsnod "Klubblägenhet" eller till patron/kommun — då blir boende en kapacitet, inte en rad.
*Konsekvens:* `decision`-payload `housing: true`; om spelaren släpps/säljs upphör kostnaden. Inget mer i v1.

### C. Jobbgaranti — `jobGuarantee`

*Vad:* klubben ordnar ett jobb via sponsor eller patron. Det Sjölund lämnade för heltid. Semi-pro-kontraktets kärna.
*Klubbkostnad:* **ingen kassa** — men en sponsorfavör: en aktiv sponsors "jobbkapacitet" tas i anspråk (max **två** jobb per sponsor per säsong; patron räknas som en sponsor med kapacitet tre). Använd kapacitet syns i Sponsorer-vyn. Ingen ledig kapacitet → termen erbjuds inte.
*Spelarvärde:* motsvarar ett halvtidsjobbs inkomst i spelets skala — startvärde **4 tkr/mån** — × f_pers där family 1,3 · homebound 1,2 · standard 1,0 · **ambitious 0,5** (han vill spela, inte arbeta). Spelare med aktiv `heltid`-storyline (redan heltidsproffs) värderar den till 0.
*Konsekvens, det som gör termen levande:* jobbet är bundet till sponsorn. **Om sponsorn lämnar** (`sponsor_negative` med utträde, eller patron_withdrawal) förlorar spelaren jobbet → event `jobbet_forsvann` (§6): moral −15, och han kräver kompensation (lön + 4 tkr) eller vill gå. Det är en verklig, sen kostnad — den sorten GPT saknade.
*Liggare:* `decision`-payload `jobGuarantee: { sponsorId }`; `jobbet_forsvann` skriver `transfer_story`-variant `job_lost` (subject spelaren, subject2 sponsorn).

### D. Ansikte — `imageRights`

*Vad:* spelaren blir en lokal sponsors ansikte (ICA-affischen, bruksbladets baksida). Formaliserar `icamaxi_visit`/`send_player`.
*Klubbkostnad:* ingen kassa; sponsorn betalar spelaren direkt — men klubben ger upp sin andel: sponsorintäkten från den sponsorn −10 % under kontraktstiden.
*Spelarvärde:* `2 tkr × profil × f_pers` där profil = 1,0 vid CA ≥ 55 eller kapten eller aktiv `lokal_hero`-resolution, annars 0 (ingen vill ha en okänd på affischen) — termen erbjuds inte då; f_pers ambitious 1,4 · standard 1,0 · homebound 0,9 · family 0,8.
*Tillgänglig:* kräver en aktiv sponsor + profil.
*Konsekvens:* pressen får en fråga (Berättaren k11-stam, ny): spelaren är synlig → `journalist`-relationen kan bli laddad om han underpresterar (form < 40 två matcher i rad → pressfråga "affischnamnet"). Ingen ny mekanik utöver pressfrågan i v1.

## 4. Resolvern och motbudet

`evaluateContractOffer(player, minSalary, offer: { salary, years, terms }, rand, context)`:
1. `required` som idag.
2. `effective = salary + Σ playerValue`.
3. `effective < required` → avslag med **motbud som föreslår en term**, inte bara en siffra: spelaren säger vad han vill ha (§6 reaktioner). Regel: motbudet föreslår den term med högst `playerValue` som klubben inte redan erbjudit och som är tillgänglig; finns ingen → motbud i lön som idag.
4. `effective ≥ required` → samma motvilja-tärning som idag, MEN varje erbjuden term med `playerValue > 0` sänker `rejectChance` med 0,05 (han känner sig sedd).
5. Premiumregeln (≥ 1,15 × required) gäller på `effective`.

Fria agenter: samma resolver, samma termer (Codex gjorde vägen gemensam).

## 5. UI

RenewContractModal och budmodalen får under lön/år en rad **Villkor** med upp till fyra chips (bara de tillgängliga visas): *Handpenning* · *Lägenhet* · *Jobb* · *Ansikte*. Vald chip visar sin klubbkostnad som underrad. Summeringsrad under: *Kostar klubben: {lön} + {termer}/mån{, {bonus} nu}.* Spelarens reaktion visas efter bud (§6). Design mockar chips i systemet; Code bygger.

## 6. Text (LÅST)

**Chips + underrad:**
- Handpenning · *{N} tkr nu, ur kassan*
- Lägenhet · *3 tkr/mån så länge kontraktet gäller*
- Jobb · *Via {Sponsor}. Ingen kostnad — en tjänst.*
- Ansikte · *{Sponsor} betalar honom direkt. Ni släpper tio procent.*

**Summering:** *Kostar klubben: {lön} tkr/mån{ + {termer} tkr/mån}{, {bonus} tkr nu}.*

**Spelarens reaktioner (motbud som föreslår term):**
- vill ha handpenning: *{Namn} nickar åt lönen men tittar på golvet. "Det är det första året som är svårt." Han vill ha något i handen nu.*
- vill ha lägenhet: *"Var ska jag bo?" Det är hela frågan. Ordna en lägenhet, så är resten enkelt.*
- vill ha jobb: *{Namn} har en familj och ett liv någon annanstans. "Finns det ett jobb?" Utan det är lönen bara en siffra.*
- vill ha ansikte: *Han vet vad han är värd på en affisch. "Prata med {Sponsor}." Det är inte pengarna — det är att synas.*
- bara lön (som idag, term-lös motpart): *{Namn} skakar på huvudet. Inte det där. Han säger ett tal.*

**Accept med term (en rad per term, ersätter generisk bekräftelse):**
- handpenning: *{Namn} skrev på. Handpenningen gick till något du inte behöver veta.*
- lägenhet: *{Namn} skrev på. Han flyttar in i februari — nycklarna ligger på kansliet.*
- jobb: *{Namn} skrev på. Måndag börjar han hos {Sponsor}. Träning tisdag.*
- ansikte: *{Namn} skrev på. Om en vecka hänger han på {Sponsor}s skyltfönster.*

**Event `jobbet_forsvann`** (när sponsorn lämnar):
- title: *{Namn}s jobb är borta*
- body: *{Sponsor} lämnade — och med dem jobbet du lovade {Namn}. Han står i kansliet med en fråga du inte kan svara på med ett leende.*
- val: *Höj lönen* (+4 tkr/mån, moral oförändrad) · subtitle *Kompensationen han bad om* / *Vi hittar något* (moral −15, ny jobbkapacitet söks nästa omgång — lyckas bara om annan sponsor har ledig kapacitet, annars upprepas frågan) · subtitle *Ett löfte till* / *Det var inte vårt löfte att hålla* (moral −25, spelaren begär transfer nästa fönster) · subtitle *Ärligt, men han glömmer det inte*

**Pressfråga (k11-stam, ansikte):** *{Namn} hänger på {Sponsor}s affischer och har inte gjort mål på {N} matcher. Är han värd sin plats — på planen eller på väggen?*

## 7. Liggarkontrakt (CLAUDE.md B, obligatoriskt)

- **Skriver:** `decision` (befintlig) med payload `{ terms: { signOnKr?, housing?, jobGuarantee?: { sponsorId }, imageRights?: { sponsorId } } }`; `transfer_story` variant `job_lost` när jobbet försvinner (subject spelaren, subject2 sponsorn, significance 55).
- **Läses av:** årsbokens generiska beslutssats (`arsbok-generisk-beslutssats` — kostnaden "{bonus} nu", "{termer}/mån"), Krönikan (`job_lost` som scar, personer), Berättaren (agenda → push `memory.press.ex_player`-klass om spelaren säljs), pressen (k11, ansikte-stammen).
- **Återfall:** `job_lost` för samma spelare två gånger → variant *"Andra jobbet han förlorat på ditt löfte."* (prefixmening i body). Prior-check via `semanticKeyStem`.

## 8. Arbetsform

- Code, en pass: `terms`-typ på erbjudandet, resolvern (§4), tillgänglighetsregler (§3), sponsorkapacitet (2/sponsor/säsong, patron 3), chips + summering + reaktioner i båda modalerna, `jobbet_forsvann`-eventet kopplat till sponsorutträde, `decision`-payload, `job_lost`-varianten. Tester: varje term × varje personlighet ger väntad riktning på `effective`; motbudet föreslår rätt term; jobb utan kapacitet erbjuds inte; ansikte utan profil erbjuds inte; sponsorutträde med bundet jobb ger eventet exakt en gång.
- Kalibrering: talen i §3 mäts mot GPT:s transfertest-omkörning (fråga 3: "gör ekonomin och kontrakten besluten svåra?"). Godkänt när minst en av tre förhandlingar i testet vinns med en term i stället för lön, och ingen term dominerar.
- Design: chips i designsystemet (Villkor-raden), Design mockar mot RenewContractModal.

## 9. Vad det inte är

Inte en ny förhandlingsskärm. Inte agentfigurer. Inte fler än fyra termer. Inte procentsatser spelaren ser — han ser vad han vill ha, i ord. Talen är motorns.
