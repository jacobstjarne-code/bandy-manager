# TEXTPOOLER — Matchhallens prövning

**Datum:** 2026-06-12 · **Av:** Opus (pre-flight: WRITING_GUIDELINES omläst i sin helhet, tonexempel hallDebateData + matchCommentary-atmosfär + klackEchoText + anniversary-galleriet, per-citat-test per block, Lärdom #8/#9 applicerade)
**Till:** Code — integreras när prövningens domänmodell byggs (SPEC_MATCHHALL_PROVNING §7 punkt 1). Strängarna är FÄRDIGA, integrera ordagrant.
**Persongalleri:** Sture, Birger (klackledare, Västra Sidan), kassören, Kioskvakten, gubbarna — samtliga etablerade. Inga nya namn.

---

## §A Kafferum & klack per processteg

Stage-ambienta pooler, plockas som kafferums-/klackrader medan prövningen är i respektive steg (samma konsumtionsmönster som KLACK_ECHO, seedat på matchday). Inga påhittade siffror — gubbomdömen och iakttagelser.

```ts
export const PROVNING_AMBIENT: Record<HallTrialStage, { kafferum: string[]; klack: string[] }> = {
  forankring: {
    kafferum: [
      'Hallfrågan är uppe igen. Hälften vid bordet tycker. Andra hälften tiger.',
      '"Tak", sa någon vid kaffet. Det räckte för en halvtimmes diskussion.',
      'Kassören har börjat dricka kaffe med oss. Han har siffror med sig.',
      'Ingen säger hall rakt ut längre. Alla vet ändå vad som menas.',
    ],
    klack: [
      'Birger samlar Västra Sidan efter matchen. Ingen banderoll än — bara samtal.',
      'Klacken sjöng den gamla vinterramsan extra länge i dag. Det var inget sammanträffande.',
    ],
  },
  krav: {
    kafferum: [
      'Papper på bordet i klubbhuset nu. Förbundet vill se siffror, inte känslor.',
      'Publiksiffrorna räknas på riktigt i år. Varje termos på läktaren är ett argument.',
      'Kassören sover dåligt, säger hans fru på Konsum.',
    ],
    klack: [
      'Klacken vet att den räknas i kravlistan. Den sjunger därefter.',
    ],
  },
  forhandling: {
    kafferum: [
      'Kommunalrådet var på matchen i lördags. Satt kvar hela andra halvlek. Folk noterade.',
      'Det förhandlas i stadshuset nu. Gubbarna gissar olika om utgången — alla med samma säkerhet.',
    ],
    klack: [
      'Västra Sidan har skickat ett eget brev till kommunen. Birger skrev under först.',
    ],
  },
  bygge: {
    kafferum: [
      '"Snart spelar vi inomhus", sa någon. Det blev tyst vid bordet en stund.',
      'Pålarna syns från landsvägen nu. Folk saktar in när de kör förbi.',
    ],
    klack: [
      'Kranen står där den står. Klacken har inte bestämt vad den tycker om den än.',
      'Sture går förbi bygget varje morgon. Han säger inget. Han går dit ändå.',
    ],
  },
}

export const PROVNING_RESOLUTION = {
  bordlagd: 'Medlemsmötet sköt på frågan. Den ligger kvar i en pärm i klubbhuset — och i bakhuvudet på alla.',
  nedlagd_fall: 'Hallfrågan föll. Birger bjöd på kaffe efteråt. Han var storsint nog att inte le.',
  nedlagd_egen: 'Du la ner frågan själv. Västra Sidan noterade det. Sånt glöms inte — på det bra sättet.',
}
```

## §B Förankringens tre decisions (weekly-decision-format)

```ts
export const PROVNING_DECISIONS_FORANKRING = [
  {
    id: 'medlemsmotet',
    title: 'Medlemsmötet i klubbhuset',
    body: 'Fullsatt i klubblokalen, kaffet räcker inte. Hallfrågan står sist på dagordningen men det är den alla väntat på. Ordet är ditt när du vill ta det.',
    choiceA: { label: 'Lyssna färdigt — låt medlemmarna äga kvällen', hint: 'Tryggt. Stödet växer långsamt.' },
    choiceB: { label: 'Ta ordet — lägg fram hela kalkylen', hint: 'Vågat. Kan vinna rummet eller tappa det.' },
  },
  {
    id: 'birger_mote',
    title: 'Birger vill ses',
    body: 'Han väntar vid kiosken efter träningen, mössan i händerna. Västra Sidan har frågor, säger han. Inga banderoller än — men det beror på det här samtalet.',
    choiceA: { label: 'Ta mötet nu', hint: 'Klacken hörs. Det märks.' },
    choiceB: { label: 'Be honom vänta till efter helgens match', hint: 'Birger väntar inte gärna.' },
  },
  {
    id: 'enkaten',
    title: 'Lokaltidningen ringer',
    body: 'De gör en enkät om hallfrågan. Journalisten vill ha klubbens linje — inte styrelsens protokoll, din röst. Det hamnar på förstasidan oavsett vad du svarar.',
    choiceA: { label: 'Svara öppet — hela resonemanget', hint: 'Öppenhet bygger. Och binder.' },
    choiceB: { label: 'Avböj — frågan ägs av medlemmarna', hint: 'Tystnad tolkas. Ibland fel.' },
  },
]
```

## §C Förhandlingens decisions + fördyringseventet

```ts
export const PROVNING_DECISIONS_FORHANDLING = [
  {
    id: 'kommunens_villkor',
    title: 'Kommunens villkor',
    body: 'Kommunalrådet lägger papperet på bordet: medfinansiering mot ungdomstimmar — hallen ska vara full av ortens unga på vardagarna. Det är ett rimligt krav. Det är också en kostnad varje vecka, året om.',
    choiceA: { label: 'Acceptera ungdomstimmarna', hint: 'Ungdom ↑ · drift −/säsong' },
    choiceB: { label: 'Föreslå delad drift istället', hint: 'Lägre uppsida · högre ja-odds' },
  },
  {
    id: 'patronens_erbjudande',
    title: '{patron} bjuder in till kontoret',
    body: 'Kaffet serveras i porslin. Han har läst kalkylen bättre än kommunen gjort, säger han. Han kan stå för borgen — eller mer. Sen tittar han ut genom fönstret och låter erbjudandet ligga kvar på bordet.',
    choiceA: { label: 'Ta emot borgen', hint: 'Kravet löst. Patronen glömmer inte.' },
    choiceB: { label: 'Tacka nej — klubben bär det själv', hint: 'Respekt. Och hela kassakravet kvar.' },
  },
]

export const PROVNING_EVENT_FORDYRING = {
  title: 'Beskedet från bygget',
  body: 'Byggledaren ringer före åtta. Grunden bär inte som beräknat — det blir dyrare, och det blir det nu. Han behöver besked före helgen.',
  choiceA: { label: 'Skjut till — bygget fortsätter', hint: 'Kassa −20 % av byggsumman' },
  choiceB: { label: 'Pausa en säsong', hint: 'Kassan andas. Bygget står.' },
}
```

## §D Hall-atmosfären — ersättningspoolen (Själ-priset i språket)

Ersätter utomhus-atmosfärpoolen i matchCommentary när `hallTrial.stage === 'klar'`. Utomhuspoolen (kåsan, vallen, marschallerna, snön) FASAS UT för hemmamatcher — den lever kvar för bortamatcher på utomhusvallar. Samma vardagsvärme, ny akustik. Vemod tillåtet, gnäll inte.

```ts
export const HALL_ATMOSPHERE: string[] = [
  'Sorlet studsar i taket. Det tar några matcher att vänja örat.',
  'Termosarna blir färre — kaffet köps varmt vid kiosken innanför entrén. Kön är densamma.',
  'Plus fem och vindstilla, varje match. Någon på läktaren saknar att ha något att klaga på.',
  'Konstljuset är jämnt över hela isen. Inga skuggor att skylla på längre.',
  'Barnen står närmast sargen nu. Det gick inte i tjugo minus.',
  'Det luktar fortfarande skrapad is. Det följde med in.',
  'Mössorna åker av inne i hallen. Folk ser varandras ansikten på ett nytt sätt.',
  'Utanför faller snön. Den får falla ifred numera.',
]

// Klack-grundrader post-hall (mood-neutrala; Västra Sidan-arcen — försoning eller
// utvandring — specas separat och får egna pooler)
export const HALL_KLACK_BASE: string[] = [
  'Klacken har hittat sin nya kortsida. Ekot gör ramsorna större än de är.',
  'Västra Sidans flaggor hänger i taket nu istället för på vallen. Någon ordnade det utan att fråga.',
]
```

## §E Stödmätarens lägen + trädnodens stage-rader

```ts
export const STOD_LABELS = {
  low: 'Stödet sviktar. Bygden är inte med.',          // < 40
  mid: 'Bygden väger fram och tillbaka. Inget är avgjort.',  // 40–59
  high: 'Bygden lutar åt ja. Mötet närmar sig.',        // ≥ 60
}

export const HALLNODE_SUBS: Record<HallTrialStage, string> = {
  vilande: 'Öppnar prövningen — förankring krävs ›',     // finns i mocken
  forankring: 'Förankring pågår · stöd {n}',
  krav: 'Krav {x}/3 uppfyllda',
  forhandling: 'Förhandling med kommunen pågår',
  bygge: 'Bygge · klar {season}',                        // cooldown-kanon
  bordlagd: 'Bordlagd · kan väckas igen',
  nedlagd: 'Nedlagd · vilar till {season}',
  klar: 'Byggd {year}',
}
```

## §F Integrationsnoter
1. **hallDebateData återanvänds** i förankringssteget: `BOARD_HALL_QUOTES` + news-poolerna är förankringens röst-råmaterial — §A-poolerna KOMPLETTERAR, ersätter inte.
2. **Utfasningen (§D) är villkorad, inte global:** utomhusatmosfären lever för bortamatcher. Växeln sitter på hemmamatch + `stage === 'klar'`.
3. **Per-citat-test körda** (block om ≤10): inga superlativ, inga AI-kontraster, inga påhittade spelfakta (Lärdom #9 — "snart", "hälften vid bordet", "några matcher" är gubbomdömen, inga systemclaims), rytmfördelning per guidens DEL 4.
4. **Grep-tillägg till slutsvepet:** utöka F2-namn-grepen med `Vänersborg|Edsbyn` — skrivguiden DEL 1 förbjuder dem som klubbar, och smallAbsurditiesData har en "Forsbacka åkte till Vänersborg"-rad som ska till Opus-dom (seriematch-implikation = fel; omvärlds-omskrivning möjlig).

— Opus, 2026-06-12
