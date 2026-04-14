import type { SaveGame } from '../entities/SaveGame'
import { InboxItemType } from '../enums'
import { getCharacterName } from './supporterService'

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

// Transfer-triggered exchanges — shown after a sale/buy
const TRANSFER_SALE_EXCHANGES: Array<[string, string, string, string]> = [
  ['Kioskvakten', '{name} lämnade. Synd, folk gillade honom.', 'Kassören', 'Pengarna gör nytta. Det är sporten.'],
  ['Materialaren', 'Tröjan med {name} på hänger fortfarande.', 'Vaktmästaren', 'Ge det ett tag. Det är inte sista tröjan vi hänger.'],
  ['Kassören', 'Affären gick igenom. Pengarna är inne.', 'Ordföranden', 'Bra. Nu handlar det om vad vi gör med dem.'],
  ['Vaktmästaren', '{name} sa hej till alla i korridoren på väg ut.', 'Materialaren', 'Det är det man minns.'],
]

const TRANSFER_BUY_EXCHANGES: Array<[string, string, string, string]> = [
  ['Vaktmästaren', 'Ny kille i omklädningsrummet. Sa knappt hej.', 'Kassören', 'Ge honom en vecka.'],
  ['Materialaren', 'Fick ta fram en ny tröja i förtid.', 'Kioskvakten', 'Numret är bra. Folk gillar jämna nummer.'],
  ['Kassören', 'Nyförvärvet kostar — men det kan bli bra.', 'Ordföranden', 'Det är investeringen som räknas.'],
  ['Kioskvakten', 'Folk frågade redan vem han är.', 'Vaktmästaren', 'Säg att han är ny. Det räcker.'],
]

const TRANSFER_DEADLINE_EXCHANGES: Array<[string, string, string, string]> = [
  ['Kassören', 'Telefonen ringer hela tiden.', 'Ordföranden', 'Svara inte.'],
  ['Materialaren', 'Hörde att folk sniffar runt.', 'Kioskvakten', 'De ska inte ha honom. Punkt.'],
  ['Vaktmästaren', 'Sista dagarna nu. Ryktena flyger.', 'Kassören', 'Lita på tränaren. Han vet vad han gör.'],
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

  let soldItem: typeof game.inbox[number] | undefined
  let boughtItem: typeof game.inbox[number] | undefined
  for (const item of (game.inbox ?? []).slice(-10)) {
    if (!soldItem && (item.type === InboxItemType.Transfer || item.type === InboxItemType.TransferBidReceived)) soldItem = item
    if (!boughtItem && item.type === InboxItemType.TransferOffer && !item.isRead) boughtItem = item
    if (soldItem && boughtItem) break
  }
  const deadlineRound = round >= 13 && round <= 15

  if (deadlineRound && seed % 5 === 0) {
    const idx = Math.abs(seed * 3) % TRANSFER_DEADLINE_EXCHANGES.length
    const ex = TRANSFER_DEADLINE_EXCHANGES[idx]
    return { speaker: ex[0], text: `"${ex[1]}" — ${ex[2]}: "${ex[3]}"` }
  }
  if (soldItem && seed % 3 === 0) {
    const idx = Math.abs(seed * 7) % TRANSFER_SALE_EXCHANGES.length
    const ex = TRANSFER_SALE_EXCHANGES[idx]
    const soldPlayer = soldItem.relatedPlayerId
      ? game.players.find(p => p.id === soldItem.relatedPlayerId)
      : null
    const name = soldPlayer ? soldPlayer.lastName : 'spelaren'
    return { speaker: ex[0], text: `"${ex[1].replace('{name}', name)}" — ${ex[2]}: "${ex[3]}"` }
  }
  if (boughtItem && seed % 3 === 1) {
    const idx = Math.abs(seed * 11) % TRANSFER_BUY_EXCHANGES.length
    const ex = TRANSFER_BUY_EXCHANGES[idx]
    return { speaker: ex[0], text: `"${ex[1]}" — ${ex[2]}: "${ex[3]}"` }
  }

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
