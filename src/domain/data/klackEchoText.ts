/**
 * Klack-echo — pool av strängar som plockas nästa omgång efter notable
 * resultat. Klacken (Birger-röst) och kafferum (gubb-röst) har båda minne.
 *
 * Plockas av matchCommentary baserat på game.klackEcho.event och
 * klackEcho.weight (sjunker över tid).
 */

export type NotableEventType =
  | 'derby_win'
  | 'derby_loss'
  | 'derby_draw'
  | 'heavy_home_loss'
  | 'top_team_win'
  | 'storstad_loss'

interface EchoPool {
  klack: string[]      // Birger-klackledare-röst
  kafferum: string[]   // bygdens gubbar-röst
}

export const KLACK_ECHO: Record<NotableEventType, EchoPool> = {
  derby_win: {
    klack: [
      'Förra veckan sjöng vi i en timme efter slutsignal. Det här minns vi om tio år.',
      'Min Birgitta lagar mat. Hon sa: ni har inte varit så här lugna sen 97.',
      'Det var inte bara segern. Det var sättet.',
    ],
    kafferum: [
      'Sex personer kom in idag och sa "såg du målet". Jag har inte missat att de såg det.',
      'Tre av gubbarna har skrutit i affären sen söndag. En av dem var inte ens på matchen.',
      'Jag har bandat den. Spelar den för pojken på kvällen. Han suckar men ler.',
    ],
  },
  derby_loss: {
    klack: [
      'Tystare på läktaren idag. Inte fientligt — bara stilla.',
      'Två supportrar pratade om femtonåttiotvå och nittioåtta som vi spelat förut. Och förlorat förut.',
      'Vi sjöng kortare ramsan idag. Den långa kände vi inte för.',
    ],
    kafferum: [
      'Två veckor sen söndag. Och två veckor till tystnad om det.',
      'Min granne sa "tre-fyra var orättvist". Jag sa inget. Det var inte orättvist.',
      'Gubbarna pratade om allt annat. Det är det säkraste tecknet.',
    ],
  },
  derby_draw: {
    klack: [
      'Oavgjort i derby är som att inte få äta den sista skinkmackan. Inget fel — bara inte allt.',
      'Vi sjöng glatt sen sex-sex. Vi tystnade när det blev sex-sju. Vi började igen vid sju-sju.',
      'Andralaget i serietabellen i dag. Som de var i går också.',
    ],
    kafferum: [
      '"Oavgjort är inte förlust." "Nej. Men det är inte seger heller."',
      'Birger sa "jag tar det". Det tog honom hela söndagen att säga det.',
      'Två poäng. Inte tre. Inte noll. Det är vad det är.',
    ],
  },
  heavy_home_loss: {
    klack: [
      'Vi gick hem i halvtid. Två tusen som inte ville se andra halvlek.',
      'Sju mål. Du minns dem genom hela veckan. Du räknar dem när du vaknar.',
      'Klacken sjöng inte den ramsan i den här veckan. Skönt att den får vila.',
    ],
    kafferum: [
      'Magnus tände inte cigarillen efter matchen. Han bara stod där.',
      'Min son frågade vad sju betyder. Jag sa "ingenting, det är bara en siffra". Det var lögn.',
      'Tre veckor minst innan vi pratar om det igen i affären.',
    ],
  },
  top_team_win: {
    klack: [
      'Storstaden trodde inte vi kunde det. Vi visste.',
      'Jag har sett oss vinna mot dem fyra gånger i mitt liv. Den här minns jag mest.',
      'Klacken sjöng tre minuter efter slutsignal. Spelarna stod kvar. Det är det fina.',
    ],
    kafferum: [
      '"Tre poäng mot dem" — sa Birger sex gånger på söndagskvällen. Jag räknade.',
      'Min farbror ringde från Bollnäs. Han har inte ringt sen 14. Han var glad.',
      'Klubbhusets väggar är samma. Men något känns annorlunda i fika-rummet idag.',
    ],
  },
  storstad_loss: {
    klack: [
      'Sandviken är Sandviken. Vi visste vad vi gick mot. Det gör inte ont mindre.',
      'Klacken stod ut hela matchen. Men efter slutsignal var det tystare än vanligt.',
      'Två gånger om året mot dem. Två gånger om året påminns vi om bandyn vi inte har.',
    ],
    kafferum: [
      'Birger sa "det är okej". Det är inte det. Men det är vad man säger.',
      'Min granne pendlade till Sandviken i fyra år. Han sa inget när han kom hem på söndagen.',
      'Bollnäs vinner alltid mot oss. Det är inte konstigt. Det är bara hur det är.',
    ],
  },
}

/**
 * C-SY1 #2 — cause-prefixade varianter (parallell pool, Alt A).
 * Plockas i 35% av visningarna när orsaken är färsk (1–4 omg sedan eventet).
 * Naturlig prosa per variant — inte mekanisk "Sedan X. [text]"-ihopklistring.
 * 2 per voice per event-type. Samma persongalleri som KLACK_ECHO.
 */
export const KLACK_ECHO_CAUSE_PREFIXED: Record<NotableEventType, EchoPool> = {
  derby_win: {
    klack: [
      'Tre veckor sen derbyt — och min Birgitta säger fortfarande att jag är lugnare än vanligt.',
      'Sedan derbyt går jag förbi rinken på vägen hem. Den glömmer jag inte.',
    ],
    kafferum: [
      'Sedan söndagen pratar gubbarna fortfarande om målet i tre-fyra.',
      'Tre veckor sedan derbyt. Det räcker fortfarande till lite skryt i affären.',
    ],
  },
  derby_loss: {
    klack: [
      'Det är två veckor sedan derbyt. Jag har inte spelat in den senaste klacksången än.',
      'Sedan vi tappade derbyt har det varit tystare än vanligt på söndagskvällarna.',
    ],
    kafferum: [
      'Min granne har inte frågat om bandy sedan derbyt. Det säger något.',
      'Två veckor sen söndagen. Och två veckor av att tala om annat.',
    ],
  },
  derby_draw: {
    klack: [
      'Sedan derbyts oavgjorda fortsätter Birger att räkna mål. Han räknar fel ibland.',
      'Tre veckor sedan vi inte vann och inte heller förlorade. Lustig vecka.',
    ],
    kafferum: [
      'Sedan oavgjorda derbyt har gubbarna inte landat — varken i firande eller sorgesnack.',
      'Två veckor sen sex-sex. Eller var det sju-sju? Birger säger båda.',
    ],
  },
  heavy_home_loss: {
    klack: [
      'Det är två veckor sedan sjumålsmatchen. Klacken börjar våga sjunga igen.',
      'Sedan sjuan har ingen sagt "minns du"-något. Det får vänta.',
    ],
    kafferum: [
      'Tre veckor sedan sjumålsmatchen. Magnus tänder cigarillen igen — men inte direkt efter slutsignal.',
      'Sedan smällen har gubbarna pratat om allt utom bandy. Det är välkomnande.',
    ],
  },
  top_team_win: {
    klack: [
      'Tre veckor sen segern mot storstaden — och jag har fortfarande inte slutat berätta om den.',
      'Sedan vi slog dem hemma sjunger klacken den långa ramsan oftare.',
    ],
    kafferum: [
      'Min farbror har inte slutat ringa sedan segern. Han ringer fortfarande.',
      'Tre veckor sen storsegern. Pojken frågar fortfarande om jag ska titta på inspelningen igen.',
    ],
  },
  storstad_loss: {
    klack: [
      'Två veckor sedan Sandviken. Vi vet vad det betyder — men det gör ont kvar.',
      'Sedan storstadsförlusten har klacken sjungit kortare ramsor.',
    ],
    kafferum: [
      'Min granne pendlade till Sandviken — han säger fortfarande inget om matchen.',
      'Tre veckor sedan storstaden. Inget nytt att säga. Det är som det alltid är.',
    ],
  },
}

/** Cause-prefix taket — 35% av visningarna när orsaken är färsk. */
export const KLACK_ECHO_CAUSE_PREFIX_THRESHOLD = 0.35

/** Cause är färsk nog att referera explicit (1–4 omg sedan eventet). */
export function klackEchoCauseIsRelevant(currentMatchday: number, resultMatchday: number | undefined): boolean {
  if (resultMatchday === undefined) return false
  const delta = currentMatchday - resultMatchday
  return delta >= 1 && delta <= 4
}

/**
 * Väljer echo-text för given voice. Returnerar cause-prefixad variant i 35% av
 * fallen när orsaken är färsk, annars vanlig pool. Deterministisk via rand().
 * resultMatchday undefined → ingen cause-prefix (degraderar till vanlig pool).
 */
export function pickKlackEchoText(
  klackEcho: { type: NotableEventType; resultMatchday?: number },
  currentMatchday: number,
  voice: 'klack' | 'kafferum',
  rand: () => number,
): string | null {
  const relevant = klackEchoCauseIsRelevant(currentMatchday, klackEcho.resultMatchday)
  const useCausePrefix = relevant && rand() < KLACK_ECHO_CAUSE_PREFIX_THRESHOLD
  const pool = useCausePrefix
    ? KLACK_ECHO_CAUSE_PREFIXED[klackEcho.type]?.[voice]
    : KLACK_ECHO[klackEcho.type]?.[voice]
  if (!pool?.length) return null
  return pool[Math.floor(rand() * pool.length)]
}
