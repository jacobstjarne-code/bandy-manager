import type { SaveGame } from '../entities/SaveGame'
import { getCharacterName } from './supporterService'

interface CoffeeQuote {
  speaker: string
  text: string
  hash?: number
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
  const lastHash = game.lastCoffeeQuoteHash ?? -1
  // pick avoiding the index that matches lastHash to prevent same quote two rounds in a row
  const pick = <T>(arr: T[]): T => {
    const idx = Math.abs(seed) % arr.length
    const lastIdx = ((lastHash % arr.length) + arr.length) % arr.length
    if (idx === lastIdx && arr.length > 1) {
      return arr[(idx + 1) % arr.length]
    }
    return arr[idx]
  }

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

  // 20% chance: replace with supporter-karaktär-citat
  const sg = game.supporterGroup
  if (sg && (seed % 5 === 0)) {
    const leader  = getCharacterName(game, 'leader')
    const veteran = getCharacterName(game, 'veteran')
    const youth   = getCharacterName(game, 'youth')
    const family  = getCharacterName(game, 'family')
    const favPlayer = game.players.find(p => p.id === sg.favoritePlayerId)
    const favName = favPlayer ? favPlayer.lastName : 'spelaren'
    const groupName = sg.name

    // Rykte-reaktioner: academyNoticed och reputationWarning
    const resolvedIds = new Set(game.resolvedEventIds ?? [])
    const season = game.currentSeason
    if (resolvedIds.has(`rep_academy_${season}`)) {
      return { speaker: youth, text: `"Såg ni? LANDSLAGET tittar på oss!" — ${leader}: "Jag vet. Det är stor grej."` }
    }
    if (resolvedIds.has(`rep_warning_${season}`)) {
      return { speaker: veteran, text: `"Det var bättre förr. Och jag menar det den här gången." — ${family}: "Kom igen nu, Sture."` }
    }

    const supporterQuotes: Array<[string, string, string, string]> = [
      [leader, `${groupName} är med oavsett. Det är det enda som gäller.`, veteran, 'Det är vad vi alltid sagt.'],
      [youth,  `${favName} är den bäste just nu. Ingen pratar om det tillräckligt.`, leader, 'Jag vet. Han levererar.'],
      [veteran, `Jag har följt laget i trettio år. Det här laget har något.`, family, 'Barnen älskar matchdagarna.'],
      [family, `${youth} hade med sig en ny banderoll. Det var fin.`, leader, 'Hon lägger ner mer tid än oss alla.'],
      [youth,  `Bortaresan var bäst i år. Vi var nitton stycken.`, veteran, `${leader} förstår att organisera.`],
      [leader, `Klacken börjar växa. Folk märker det.`, family, 'Det syns när man sitter på läktaren.'],
      [veteran, `${favName} — den killen är orten igenom.`, youth, 'Alla älskar honom. Han är en av oss.'],
    ]

    const qIdx = Math.abs(seed + 9) % supporterQuotes.length
    const sq = supporterQuotes[qIdx]
    return { speaker: sq[0], text: `"${sq[1]}" — ${sq[2]}: "${sq[3]}"` }
  }

  return { speaker: speakerName, text }
}
