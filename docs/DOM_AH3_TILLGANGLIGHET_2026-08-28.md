# DOM — A-H3: TRÖTTHET KOSTAR TILLGÄNGLIGHET

**Datum:** 2026-08-28 · **Av:** Opus
**Grund:** `DOM_FRAMGANGSKURVAN_2026-08-27.md` (H3), `HIGH2_UTMATTNINGEN_FORSLAG_2026-08-22.md`, samt kodläsning `matchInjuryService.ts`, `squadEvaluator.ts:41`, `setLineup.ts`.
**Status:** BYGGE (fråga 5 besvarad: skaderisk läser aldrig fitness). Godkänd av Jacob 2026-08-28.

---

## Vad som är fel i dag

Trötthet kostar bara **prestation**, och den kostnaden är både dold och obindande.

`playerModifier` (`squadEvaluator.ts:41`) väger `effectiveFitness` 60 % multiplikativt mot varje positionsscore. En trött spelare presterar alltså sämre — men du ser aldrig VARFÖR (ingen yta säger "tunga ben sänkte honom"), och du kan starta honom ändå och vinna 20–2. `checkForMatchInjury` (`matchInjuryService.ts`) lägger multiplikatorer för väder, derby, humör, taktik och skadebenägenhet, men **läser aldrig fitness**. `setLineup.ts`s enda spärr är `isInjured` + avstängning. Trötthet är därmed aldrig ett tvång, bara ett råd.

Auditen: fyra spelare startade finalen på 22–34 % kondition och klubben vann 20–2–0.

---

## Domen

**Trötthet ska kosta tillgänglighet, och kostnaden ska vara synlig innan matchen.**

Två ben. Det andra är hela poängen.

### Ben 1 — förhöjd skaderisk om du startar trött

Lägg en `fatigueMult` i `checkForMatchInjury`, i samma multiplikatorkedja som de fem befintliga (väder 1.5, derby 1.3, humör 1.2, taktik 1.25, benägenhet 0.5–1.5). `fitness >= 50` ger 1.0; under det en ramp uppåt så att 0 % landar runt 2.0×. Den komponerar med de andra — en trött spelare i töväder i ett derby blir en verklig risk, inte en teoretisk.

**Magnituden (taket ~2.0 och att rampen börjar vid 50) är det enda som ska kalibreras med en mätning innan låsning.** Allt annat kan Code bygga på domen. Kör en förkörning: hur ofta skadas en spelare som startar under 30 % fitness över en säsong, med kandidattaket 2.0 mot t.ex. 1.5 och 2.5? Rapportera innan talet låses.

### Ben 2 — kan bli otillgänglig nästa match, och det ska synas i förväg

Det är här trötthet blir bindande. En spelare som **startar under ett hårt golv** riskerar att stå över nästa match — inte skadad, utan vilande/överbelastad. Det gör rotation till ett tvång och truppdjup till en resurs som konkurrerar med framgångskurvans fyra anspråk.

**Den skarpa punkten, icke förhandlingsbar:** konsekvensen måste visas i uppställningen INNAN matchen — ett synligt märke: "spelar han i dag riskerar du honom nästa match". Domens egen logik är "en konsekvens man kan planera runt". Ett kast som avgörs EFTER matchen är exakt det dolda straff vi ville bort från, bara flyttat från prestation till tillgänglighet. För en tunn klubb (Skutskär, ingen ersättare) blir en osynlig efterhandsspärr ett straff hen inte kan planera runt. Bygg den som **förhandsvarning**, inte som post-match-roll.

**Min rekommendation på det du lämnade öppet (hårt vs sannolikhet):** gör det till en **förhöjd sannolikhet du kan chansa mot**, inte ett definitivt "står över". Att starta honom ska vara ett vägbart risktagande (kanske klarar han sig, kanske förlorar du honom), inte en garanterad förlust. Det är mer läsbart och det bevarar valet för den tunna klubben som kanske måste chansa. Vill du ha hårt (definitivt över) i stället, säg till — det är en enradsändring i mekaniken, men jag tror sannolikhet bär bättre.

---

## Tröskeln — dela tal med HIGH2, inför inte ett tredje

Låt ben 2:s tillgänglighetsgolv **dela konstant** med HIGH2:s spelklarhetsgrind (Jacobs 20–25 %-spann, föreslaget `~22–25`). Ett golv, två konsekvenser: under det exkluderas spelaren ur "Fyll bästa" (HIGH2) OCH riskerar att stå över (A-H3). Ben 1:s skaderisk-ramp börjar högre, vid 50, där `playerModifier` redan halverar bidraget. **Två tal, inte tre — en sanning, ett ställe.**

Det gör A-H3 och HIGH2 till *ett* bygge. De rör samma golv och samma spelarupplevelse. HIGH2:s andra halva ("Fyll bästa optimerar mot matchvärdering, inte CA") är redan löst: `getSelectionScore` (`squadEvaluator.ts`) finns och använder `playerModifier`. Det som återstår av HIGH2 är golvet, och det golvet är detsamma som A-H3:s.

---

## Vad domen INTE är

**Inte att ta bort fitnessens prestationsvikt.** `playerModifier`s 60 % står kvar — en trött spelare presterar fortfarande sämre, det är realistiskt. Domens "inte prestation" betyder att prestationsskatten inte längre är LEVERN som ska få rotation att spela roll (den är dold och obindande). Tillgänglighet och skaderisk är levern. Att nolla fitnessens matchvikt vore en annan lögn — då spelar tunga ben ingen roll alls i matchen.

**Inte ett straff utan förvarning.** Se ben 2. Allt binder synligt, i förväg.

---

## Rapportera innan bygge

1. Var sätts fitness→prestations-multiplikatorn i den faktiska matchvägen (bekräfta `playerModifier` är enda stället, eller lista alla), så ben 1/2 läggs ovanpå utan att röra den.
2. Skaderisk-mätningen ovan: skadefrekvens för start under 30 % fitness vid kandidattak 1.5 / 2.0 / 2.5.
3. Finns redan ett fält för "otillgänglig utan skada" (vila/överbelastning), eller ska det modelleras? Om `isInjured` är enda availability-flaggan i `setLineup.ts`, behövs en skild flagga så texten inte kallar en vilande spelare skadad.
4. Var i uppställnings-UI:t kan förhandsvarningsmärket sitta (samma yta som `isInjured`/avstängning redan visas)?

---

## Godkänd när

En manager med en tunn trupp tvingas rotera för att hålla spelare tillgängliga över en tät period, och kan i uppställningen se vem han riskerar att förlora om han startar trött. En dominant klubb med djup slipper det — och det är truppdjupet, en resurs som konkurrerar med de fyra anspråken, som är skillnaden.

---

## Handoff

**Code:** rapportera 1–4, kalibrera ben 1:s tak, bygg båda benen + HIGH2-golvet som ETT pass. Delad golvkonstant.
**Jacob:** en öppen delfråga — hård (definitivt över) eller sannolikhet (chansbar). Jag rekommenderar sannolikhet; säg till om du vill flippa.
