export interface SmallAbsurdity {
  id: string
  newspaperHeadline: string
  coffeeRoomExchange: { speaker: string; line: string }[]
}

export const SMALL_ABSURDITIES: SmallAbsurdity[] = [
  {
    id: 'bandy_klubba_buss',
    newspaperHeadline: '"Vapen" på buss var bandyklubba',
    coffeeRoomExchange: [
      { speaker: 'Kioskvakten', line: 'Polisen drog vapen i Linköping igår.' },
      { speaker: 'Vaktmästaren', line: 'Mot vad?' },
      { speaker: 'Kioskvakten', line: 'En bandyklubba.' },
    ],
  },
  {
    id: 'hund_pa_planen',
    newspaperHeadline: 'Hund på planen avbröt hörna — "verkade som en hemmaspelare"',
    coffeeRoomExchange: [
      { speaker: 'Kioskvakten', line: 'Den var ute i sju minuter.' },
      { speaker: 'Vaktmästaren', line: 'Vad gjorde den?' },
      { speaker: 'Kioskvakten', line: 'Hörndomaren sa att den parerade ett skott.' },
    ],
  },
  {
    id: 'banan_straffen',
    newspaperHeadline: 'Lesjöfors-spelare gick miste om straff — slet i sig en banan',
    coffeeRoomExchange: [
      { speaker: 'Vaktmästaren', line: 'Han skulle slå straffen.' },
      { speaker: 'Kioskvakten', line: 'Och?' },
      { speaker: 'Vaktmästaren', line: 'Han hade en banan i handen.' },
    ],
  },
  {
    id: 'pizza_soderhamn',
    newspaperHeadline: 'Söderfors fick ingen mat på borta-resan — beställd till fel adress',
    coffeeRoomExchange: [
      { speaker: 'Kioskvakten', line: 'Pizzan kom till Söderhamn.' },
      { speaker: 'Materialaren', line: 'Och dom var i Söderfors?' },
      { speaker: 'Kioskvakten', line: 'Det är 200 km.' },
    ],
  },
  {
    id: 'fel_trojor',
    newspaperHeadline: 'Forsbacka spelade hela första halvlek med fel tröjor',
    coffeeRoomExchange: [
      { speaker: 'Materialaren', line: 'Dom märkte det i pausen.' },
      { speaker: 'Vaktmästaren', line: 'Hur då?' },
      { speaker: 'Materialaren', line: 'Domaren räknade nummer.' },
    ],
  },
  {
    id: 'bortglomda_matchbollar',
    newspaperHeadline: 'Materialaren glömde matchbollarna — fick låna av motståndaren',
    coffeeRoomExchange: [
      { speaker: 'Vaktmästaren', line: 'Forsbacka åkte till Vänersborg utan bollar.' },
      { speaker: 'Kioskvakten', line: 'Och?' },
      { speaker: 'Vaktmästaren', line: 'Vänersborg lånade ut tre.' },
    ],
  },
]
