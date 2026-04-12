import type { SaveGame } from '../entities/SaveGame'
import { getCurrentAct } from './seasonActService'

const PEP_WIN = [
  'Vi vann inte för att vi var bäst. Vi vann för att vi ville mest.',
  'Tre poäng. Inget snack. Nu fokuserar vi framåt.',
  'Det fanns ett beslut i omklädningsrummet före nedsläpp. Ni valde rätt.',
  'Jag ser spelare som tror på varandra. Det är farligare än talang.',
  'Bra matcher vinner man med fötterna. Stora matcher vinner man med huvudet.',
]

const PEP_LOSS = [
  'Vi förlorade en match. Inte vår identitet. Tillbaka på isen imorgon.',
  'Ingen kommer ihåg den här matchen i mars. Men de kommer ihåg hur vi reagerade.',
  'Ibland lär man sig mer av en förlust än tio vinster. Frågan är om ni har modet att lyssna.',
  'Det enda jag inte accepterar är att ge upp. Och det gjorde ni inte idag.',
  'Vi var inte tillräckligt bra. Punkt. Nu jobbar vi.',
]

const PEP_DRAW = [
  'En poäng kan vara guld eller skit. Beror på vad vi gör med den.',
  'Vi hämtade en poäng borta. Minns det i mars när det skiljer ett poäng.',
  'Inte nöjd. Men inte besviken. Det är mellanrummet där lag formas.',
]

const PEP_CRISIS = [
  'Ingen räddare kommer. Vi är räddarna. Varje omgång, varje duell.',
  'Jag har sett lag i sämre läge vända. Men aldrig lag som slutade tro.',
  'Om ni vill ha en tränare som ljuger — hämta honom. Jag säger sanningen: vi måste bli bättre.',
]

const PEP_TOP = [
  'Vi är där. Men att komma dit och stanna är två helt olika saker.',
  'Varje lag under oss jagar. Vi kan inte slappna av en sekund.',
  'Njut inte ännu. Njut i mars.',
]

export function getPepTalk(game: SaveGame): string | null {
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  if (!standing || standing.played === 0) return null

  const lastFixture = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.matchday - a.matchday)[0]

  if (!lastFixture) return null

  const isHome = lastFixture.homeClubId === game.managedClubId
  const myScore = isHome ? lastFixture.homeScore : lastFixture.awayScore
  const theirScore = isHome ? lastFixture.awayScore : lastFixture.homeScore

  // Use round number as deterministic seed for quote selection
  const seed = lastFixture.roundNumber

  // Crisis: position 11-12 or way more losses than wins
  if (standing.position >= 11 || standing.losses >= standing.wins + 3) {
    return PEP_CRISIS[seed % PEP_CRISIS.length]
  }

  // Top: position 1-3 after 5+ rounds
  if (standing.position <= 3 && standing.played >= 5) {
    return PEP_TOP[seed % PEP_TOP.length]
  }

  // Act-based suffix added to result quotes
  const act = getCurrentAct(lastFixture.roundNumber)
  const ACT_SUFFIX: Record<typeof act, string> = {
    1: ' Säsongen är ung — varje match är lärdom.',
    2: ' Vintern testar viljan. Ni bestämmer.',
    3: ' Tabellen klarnar. Varje poäng räknas nu.',
    4: ' Det är avgörandet. Inget mer att spara.',
  }
  const suffix = act >= 3 ? ACT_SUFFIX[act] : ''

  // Result-based
  if (myScore > theirScore) return PEP_WIN[seed % PEP_WIN.length] + suffix
  if (myScore < theirScore) return PEP_LOSS[seed % PEP_LOSS.length] + suffix
  return PEP_DRAW[seed % PEP_DRAW.length] + suffix
}
