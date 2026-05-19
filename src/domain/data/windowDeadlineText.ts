export type SeasonContext = 'firstSeason' | 'relegationFight' | 'topRace' | 'midTable'

export const DEADLINE_PORTAL_TEXT: Record<SeasonContext, string[]> = {
  firstSeason: [
    'Transferfönstret stänger klockan 18. Din första deadline.',
    'Klockan tickar. Fönstret stänger 18:00. Sedan är truppen låst.',
    'En dag kvar. Sedan är det spel med det du har.',
  ],
  relegationFight: [
    'Transferfönstret stänger 18:00. Är truppen tillräcklig?',
    'Sista chansen att förstärka. Fönstret stänger klockan 18.',
    'Klockan tickar. Tre poäng ner till strecket. Vad mer behövs?',
  ],
  topRace: [
    'Fönstret stänger 18:00. Konkurrenterna rör sig. Håll koll.',
    'Deadline-dag. Topplaget behöver inte alltid förstärka — men de tänker på det.',
    'Fönstret stänger klockan 18. Det handlar om att hålla vad man har.',
  ],
  midTable: [
    'Transferfönstret stänger 18:00.',
    'Sista dagen. Sedan spelas det med det laget som finns.',
    'Klockan tickar mot 18:00. Fönstret stänger för säsongen.',
  ],
}

export const DEADLINE_KAFFERUM_TEXT: string[] = [
  '"Jag hörde att de pratar med en back från Ljusdal." – Rolf',
  '"Transferdagen. Det enda jag vet är att ingen vet något." – Gunnar',
  '"Har ni sett nyhetsflödet? Det ryker om fem affärer och inga av dem verkar stämma." – Bertil',
  '"Sista dagen. Sedan vet vi vad vi har för vinter." – Kurt',
  '"Telefonen hos managern ringer hela dagen, tydligen." – Göte',
]

export const DEADLINE_AI_BID_TEXT: string[] = [
  '{club} lägger ett bud på {player} i sista minuten.',
  'Sent på deadline-dagen — {club} är intresserade av {player}.',
  'Det kom ett bud. {club} vill ha {player} innan fönstret stänger.',
]
