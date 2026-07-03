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
      'Vi sjöng i en timme efter slutsignal. Det här minns vi om tio år.',
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
      'Två supportrar pratade om femtioåtta och nittioåtta. Vi har spelat det här förut. Och förlorat förut.',
      'Vi sjöng kortare ramsan idag. Den långa kände vi inte för.',
    ],
    kafferum: [
      'Det pratas inte om den söndagen. Inte på ett tag till.',
      'Min granne sa "det var orättvist". Jag sa inget. Det var inte orättvist.',
      'Gubbarna pratade om allt annat. Det är det säkraste tecknet.',
    ],
  },
  derby_draw: {
    klack: [
      'Oavgjort i derby är som att inte få äta den sista skinkmackan. Inget fel — bara inte allt.',
      'Vi sjöng när vi ledde. Vi tystnade när de vände. Vi började igen vid kvitteringen.',
      'Tabellen står still. Känslan också.',
    ],
    kafferum: [
      '"Oavgjort är inte förlust." "Nej. Men det är inte seger heller."',
      'Birger sa "jag tar det". Det tog honom hela söndagen att säga det.',
      'En poäng. Inte två. Inte noll. Det är vad det är.',
    ],
  },
  heavy_home_loss: {
    klack: [
      'Vi gick hem i halvtid. Halva läktaren ville inte se andra halvlek.',
      'Målen. Du minns dem genom hela veckan. Du räknar dem när du vaknar.',
      'Klacken sjöng inte den ramsan den här veckan. Skönt att den får vila.',
    ],
    kafferum: [
      'Magnus tände inte cigarillen efter matchen. Han bara stod där.',
      'Min son frågade vad siffran betyder. Jag sa "ingenting". Det var lögn.',
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
      '"Två poäng mot dem" — sa Birger sex gånger på söndagskvällen. Jag räknade.',
      'Min farbror ringde från Bollnäs. Han har inte ringt sen 14. Han var glad.',
      'Klubbhusets väggar är desamma. Men något känns annorlunda i kafferummet idag.',
    ],
  },
  storstad_loss: {
    klack: [
      'Storstaden är storstaden. Vi visste vad vi gick mot. Det gör inte ont mindre.',
      'Klacken stod ut hela matchen. Men efter slutsignal var det tystare än vanligt.',
      'Två gånger om året mot dem. Två gånger om året påminns vi om bandyn vi inte har.',
    ],
    kafferum: [
      'Birger sa "det är okej". Det är inte det. Men det är vad man säger.',
      'Min granne pendlade till storstan i fyra år. Han sa inget när han kom hem på söndagen.',
      'De stora vinner alltid mot oss. Det är inte konstigt. Det är bara hur det är.',
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
      'Sen derbyt säger min Birgitta att jag är lugnare än vanligt. Fortfarande.',
      'Sedan derbyt går jag förbi planen på vägen hem. Det glömmer jag inte.',
    ],
    kafferum: [
      'Sedan söndagen pratar gubbarna fortfarande om målet.',
      'Derbyt räcker fortfarande till lite skryt i affären.',
    ],
  },
  derby_loss: {
    klack: [
      'Derbyt hänger kvar. Jag har inte spelat in den senaste klacksången än.',
      'Sedan vi tappade derbyt har det varit tystare än vanligt på söndagskvällarna.',
    ],
    kafferum: [
      'Min granne har inte frågat om bandy sedan derbyt. Det säger något.',
      'Sen den söndagen talar vi om annat. Bara annat.',
    ],
  },
  derby_draw: {
    klack: [
      'Sedan derbykrysset räknar Birger målen om och om igen. Han räknar fel ibland.',
      'Vi vann inte och förlorade inte heller. Lustig känsla, den sitter i.',
    ],
    kafferum: [
      'Sedan oavgjorda derbyt har gubbarna inte landat — varken i firande eller sorgesnack.',
      'Krysset sitter i. Birger minns olika siffror varje gång.',
    ],
  },
  heavy_home_loss: {
    klack: [
      'Ett tag sedan smällen nu. Klacken börjar våga sjunga igen.',
      'Sedan den kvällen har ingen sagt "minns du"-något. Det får vänta.',
    ],
    kafferum: [
      'Sedan den matchen tänder Magnus cigarillen igen — men inte direkt efter slutsignal.',
      'Sedan smällen har gubbarna pratat om allt utom bandy. Det är välkomnande.',
    ],
  },
  top_team_win: {
    klack: [
      'Segern mot storstaden — jag har fortfarande inte slutat berätta om den.',
      'Sedan vi slog dem hemma sjunger klacken den långa ramsan oftare.',
    ],
    kafferum: [
      'Min farbror har inte slutat ringa sedan segern. Han ringer fortfarande.',
      'Segern lever kvar. Pojken frågar fortfarande om jag ska titta på inspelningen igen.',
    ],
  },
  storstad_loss: {
    klack: [
      'Storstaden. Vi vet vad det betyder — men det gör fortfarande ont.',
      'Sedan storstadsförlusten har klacken sjungit kortare ramsor.',
    ],
    kafferum: [
      'Min granne pendlar till storstan — han säger fortfarande inget om matchen.',
      'Storstadsmatchen, ja. Inget nytt att säga. Det är som det alltid är.',
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
