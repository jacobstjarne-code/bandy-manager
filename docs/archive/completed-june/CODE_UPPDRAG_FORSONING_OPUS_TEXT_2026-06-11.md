# CODE-UPPDRAG — Opus-text: copy-pooler (försoningen §4) + frivillig-moral b

**Datum:** 2026-06-11
**Källa:** Design-audit Del 13 §3 (Anteckningar ×5) + Del 14 §3 (årsbokens tidslinje ×4) + Orten-leveransens parkerade beslut.
**Text skriven mot:** `WRITING_GUIDELINES_BANDY_MANAGER.md` (per-citat-testad) + tonexempel i `assistantCoachService.ts` (calm) och kodbasens anslag.
Strängarna nedan är FÄRDIGA — integrera ordagrant, skriv inte om.

---

## DEL A — Anteckningar: 'trött'-poolen (assistantCoachService.ts)

**Rotorsak:** `PLAYER_NOTE_QUOTES` har EN sträng per tag×personlighet. Fem trötta spelare → samma mening ×5 (tränarpersonligheten är fast per save).

**Ändring 1 — typ:** `PLAYER_NOTE_QUOTES['trött']` ändras från `Record<CoachPersonality, string>` till `Record<CoachPersonality, string[]>`. Val: `seededPick` (random.ts) seedad på `playerId` — samma spelare får samma variant inom omgången, olika spelare olika. Övriga taggar (glödande/missnöjd/skottform/vill-mer/sviktande) behåller singel-sträng tills repetition observeras — wrappa dem som 1-elements-arrayer om typen kräver.

**Pooler ('trött') — befintlig sträng behålls som variant 1:**

```ts
calm: [
  `${n} är sliten. Rekommenderar vila om det finns utrymme.`,
  `${n} har gått på reserverna ett tag. En omgång vid sidan räcker långt.`,
  `Benen är tunga på ${n}. Inget dramatiskt — men vila nu, inte sen.`,
],
sharp: [
  `${n} är slut. Ta honom från spel nu.`,
  `${n} tappar yta i varje byte. Vila honom.`,
  `Siffrorna ljuger inte — ${n} behöver stå över en match.`,
],
jovial: [
  `${n} ger allt men behöver återhämtning snabbt.`,
  `${n} springer på vilja nu. Ge honom helgen — han kommer tillbaka som ny!`,
  `Trött? ${n}? Ja, faktiskt. Till och med han behöver en paus ibland.`,
],
grumpy: [
  `${n} är slut. Jag sa det för matcher sedan.`,
  `${n} släpar sig runt på isen. Det ser ingen annan, tydligen.`,
  `Vila ${n}. Eller låt bli, det brukar ju bli som det blir.`,
],
philosophical: [
  `${n} behöver vila — det är ingen skam i det.`,
  `${n} har burit mycket den här hösten. Även det starka behöver ligga i träda.`,
  `Trötthet är kroppens sätt att säga sanningen. ${n} bör lyssna.`,
],
```

**Ändring 2 — aggregation (Del 13 §3):** max 3 individuella TRÖTT-kort renderas i Anteckningar; vid fler ersätts resten av EN aggregationsrad i MB:s röst. Tokens: `{n}` = antal aggregerade, `{opp}` = nästa motståndares shortName. Pool (seededPick på matchday):

```ts
const TROTT_AGGREGATION = [
  'Ytterligare {n} i samma läge — rotera mot {opp}.',
  '{n} till med tunga ben. Bänken finns av en anledning.',
  'Samma visa för {n} till. En omgångs vila nu sparar tre i januari.',
]
```

MB-summeringen ("7 spelare att hålla koll på") finns redan och behålls ovanför.

---

## DEL B — Årsbokens tidslinje: body-pooler (seasonSummaryService.ts, computeKeyMoments)

**Rotorsak:** en body-sträng per moment-typ → "En övertygande seger med N måls marginal. Laget visade klass." ×4. Flera befintliga bryter dessutom skrivguiden (superlativ "övertygande", coach-tal "Mental styrka", utskriven känsla "fansen var besvikna") — de UTGÅR, ersätts av poolerna nedan.

**Integration:** behåll `Omgång {round}: `-prefixet som idag; pool ersätter meningen efter. Val: `seededPick` på `fixture.id` (stabilt — årsboken visar samma text vid varje öppning). Tokens per typ enligt nedan.

```ts
bigWin: [   // {margin}, {opp}
  'Två poäng och {margin} mål tillgodo. En sån kväll.',
  '{opp} hängde med en halvlek. Sen inte.',
  'Allt satt. Hörnorna, kontringarna, humöret på läktaren.',
  'Sådana marginaler vänjer man sig aldrig vid. {margin} mål.',
],
bigLoss: [   // {margin}, {opp}
  '{margin} mål åt fel håll. Tyst i omklädningsrummet efteråt.',
  'Det gick sönder tidigt och lagade sig aldrig.',
  'Inte mycket att säga. {opp} var bättre på det mesta.',
],
comeback: [   // {opp}
  'Underläge i paus, två poäng vid slutsignal. Sånt bär långt in i veckan.',
  '{opp} ledde och trodde på det. Sen vände det.',
  'Vändningen kom när den behövdes. Läktaren glömmer inte sånt.',
],
lateWinner: [   // {name}
  '{name} avgjorde när klockan nästan gått ut. Sånt minns en läktare.',
  'Sent, sent — och sen satt den. {name}.',
  'Matchen var på väg mot ett kryss. {name} hade andra planer.',
],
hatTrick: [   // {name}, {goals}
  '{goals} mål av en och samma man. {name}s kväll.',
  '{name} satte {goals}. Bollen åkte hem med honom, enligt traditionen.',
  'Hattrick av {name}. Vissa kvällar väljer en spelare.',
],
derbyWin: [   // {opp}, {score}
  'Derbyt. Vårt, den här gången.',
  'Halva byn såg det. Andra halvan får höra om det ett tag framöver.',
  '{score} mot {opp}. Det räcker som beskrivning häromkring.',
],
derbyLoss: [   // {opp}
  '{opp} tog derbyt. Det kommer på tal på Konsum ett tag.',
  'Förlorat derby. Vissa matcher väger mer än två poäng.',
  'Tyst efteråt, tyst på måndagen. Derbyn gör så.',
],
```

**OBS poängsystem:** strängarna är skrivna mot 2-poängssystemet (changelog 2026-05-25: "Bandy-poäng tre→två"). Sanity-checka vid integration att vinst fortfarande ger 2 poäng.

**Rider med (Del 14 §3, kod inte text):** tidslinjens numrering — tvåsiffrig paddning (01…22), inte 018/022/033; post-serie-poster (galan etc.) får etikett istället för nummer.

---

## DEL C — Notisdiet B3: utgångs-konsekvenser (ersätter [Opus]-placeholders)

Hör till `CODE_UPPDRAG_NOTISDIET_EXPIRES_2026-06-11.md` DEL B3. En notis per utgång, oläst. Två varianter per typ, seededPick på item-id:

```ts
budWithdrawn: [   // {klubb}, {namn}
  '{klubb} drog tillbaka budet på {namn}. De tröttnade på att vänta.',
  'Budet på {namn} gick ut. {klubb} har gått vidare.',
],
captainAutoAssigned: [   // {namn}
  'Truppen väntade inte längre — {namn} bär bindeln från och med nu.',
  '{namn} är ny kapten. Omklädningsrummet löste det du sköt upp.',
],
sponsorExpired: [   // {sponsor}
  'Erbjudandet från {sponsor} gick ut. De ringer inte två gånger.',
  '{sponsor} hittade någon annan att synas hos.',
],
contractSilence: [   // {namn}
  '{namn} slutade vänta på besked. Det märks på träningarna.',
  'Tystnaden gav {namn} sitt svar. Inte det han hoppades på.',
],
```

---

## DEL D — Frivillig-moral: beslut b (mekanik, Jacobs beslut 2026-06-11)

Parkerat i `CODE-LEVERANS-ORTEN-REDESIGN-2026-06-09.md` — nu avgjort: **alternativ b, moralen följer pulsen. Ingen ny knapp.**

- Frivillig-moral driftar mot Bygdens puls: per omgång `morale += clamp((puls − morale) × 0.15, −3, +3)` (mean-reversion mot puls, samma idiom som volunteerMorale-driften i `b1c7ca3` — återanvänd mönstret, kalibrera faktorn mot den).
- Ingen ny spelarhandling, ingen ny yta. Visningen i Orten står som recut-mocken har den.
- Effekt: Kjell på 31 är inte längre en mätare utan spak — spaken är allt som höjer pulsen, vilket spelaren redan har.

---

## Acceptans
- 'trött' ger olika citat för olika spelare samma omgång; >3 trötta → aggregationsrad.
- Årsbokens tidslinje: inga två poster med identisk body i samma årsbok (seedat på fixture.id); poängantal verifierat mot 2-poängssystemet; numrering paddad.
- Notisdiet-placeholders ersatta.
- Frivillig-moral följer puls; ingen ny UI.
- tsc + tester gröna.

**Rapportera:** A/B/C/D var för sig + poängverifieringen explicit.

— Opus, 2026-06-11
