import type { SaveGame } from '../entities/SaveGame'

interface CoffeeQuote {
  speaker: string
  text: string
}

const GENERIC_EXCHANGES: Array<[string, string, string, string]> = [
  ['Kioskvakten', 'Ingen kommer betala 25 kr för en korv i den här kylan.', 'Kassören', 'Det sa du förra året. Vi sålde slut.'],
  ['Materialaren', 'Tre klubbor gick sönder igår.', 'Vaktmästaren', 'Beställ fem. Det blir kallt i veckan.'],
  ['Kassören', 'Har vi råd med nya tröjor?', 'Ordföranden', 'Har vi råd att INTE ha nya tröjor?'],
  ['Webbredaktören', 'Hemsidan hade 400 besök igår.', 'Kioskvakten', 'Hur många köpte korv?'],
  ['Vaktmästaren', 'Jag var ute klockan fem imorse.', 'Materialaren', 'Du säger det varje dag.'],
  ['Kassören', 'Sponsoravtalet med ICA går ut.', 'Ordföranden', 'Ring dom. Bjud på kaffe. Och korv.'],
  // Placeholder — byts ut mot dynamisk ungdomsspelare i getCoffeeRoomQuote
  ['Ungdomstränaren', '{youthName} i P19 börjar likna något.', 'Materialaren', 'Ge honom inte för stora tröjor.'],
]

const RESULT_EXCHANGES: Record<'win' | 'loss' | 'draw', Array<[string, string]>> = {
  win: [
    ['Kioskvakten', 'Vi sålde dubbelt idag. Seger säljer.'],
    ['Vaktmästaren', 'Publiken sjöng hela vägen ut. Länge sen sist.'],
    ['Kassören', 'Tre poäng och plusresultat. Jag sover gott.'],
  ],
  loss: [
    ['Kioskvakten', 'Tyst vid kiosken efteråt. Ingen ville ha korv.'],
    ['Vaktmästaren', 'Jag plogade ändå i en timme. Isen förtjänade bättre.'],
    ['Kassören', 'Vi behöver inte prata om det. Eller?'],
  ],
  draw: [
    ['Kioskvakten', 'Kryss igen. Folket vet inte om de ska vara nöjda.'],
    ['Vaktmästaren', 'En poäng är en poäng. Isen klagade inte.'],
  ],
}

export function getCoffeeRoomQuote(game: SaveGame): CoffeeQuote | null {
  const round = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)

  if (round === 0) return null

  const lastFixture = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.matchday - a.matchday)[0]

  const seed = round * 7 + game.currentSeason * 31
  const pick = <T>(arr: T[]): T => arr[Math.abs(seed) % arr.length]

  if (lastFixture && (seed % 2 === 0)) {
    const isHome = lastFixture.homeClubId === game.managedClubId
    const myScore = isHome ? lastFixture.homeScore : lastFixture.awayScore
    const theirScore = isHome ? lastFixture.awayScore : lastFixture.homeScore
    const result: 'win' | 'loss' | 'draw' = myScore > theirScore ? 'win' : myScore < theirScore ? 'loss' : 'draw'
    const pool = RESULT_EXCHANGES[result]
    const [speaker, text] = pick(pool)
    return { speaker, text }
  }

  const volunteers = game.volunteers ?? []
  const exchange = pick(GENERIC_EXCHANGES)
  const speakerName = volunteers.length > 0
    ? volunteers[Math.abs(seed + 3) % volunteers.length]
    : exchange[0]

  // Resolve dynamic placeholders
  let text = `"${exchange[1]}" — ${exchange[2]}: "${exchange[3]}"`
  if (text.includes('{youthName}')) {
    const youthPlayers = game.youthTeam?.players ?? []
    const youthName = youthPlayers.length > 0
      ? youthPlayers[Math.abs(seed + 5) % youthPlayers.length].lastName
      : 'någon i P19'
    text = text.replace('{youthName}', youthName)
  }

  return { speaker: speakerName, text }
}
