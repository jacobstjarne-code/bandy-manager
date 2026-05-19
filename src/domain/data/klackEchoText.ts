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
      'Andralaget i serietabellen idag. Som de var igår också.',
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
