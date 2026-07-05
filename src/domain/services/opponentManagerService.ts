import type { Club } from '../entities/Club'
import { seededPick } from '../utils/random'

// DREAM-001 + WEAK-016: Opponent manager generation and quote system

const MANAGER_FIRSTNAMES = ['Hans', 'Bengt', 'Lars', 'Ulf', 'Mats', 'Kenneth', 'Peter', 'Anders', 'Roger', 'Sven-Erik', 'Leif', 'Göran', 'Margareta']
const MANAGER_LASTNAMES = ['Nordin', 'Eklund', 'Holm', 'Sjögren', 'Friberg', 'Dahlström', 'Lundmark', 'Berg', 'Åhlén', 'Vikström']
const PERSONAS: Array<'confident' | 'defensive' | 'cryptic' | 'professorial'> = ['confident', 'defensive', 'cryptic', 'professorial']

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

export function generateOpponentManager(rand: () => number): Club['opponentManager'] {
  return {
    name: `${pick(MANAGER_FIRSTNAMES, rand)} ${pick(MANAGER_LASTNAMES, rand)}`,
    persona: pick(PERSONAS, rand),
    yearsAtClub: Math.floor(rand() * 8) + 1,
  }
}

// M58 (textaudit 2026-07-04): seed = fixtureId (+ discriminator-suffix, så
// pre-/post-match-citat för samma fixture inte råkar dela index). Samma
// klass som M35 (insandareService) — Math.random() bröt determinismen.
export function generatePreMatchOpponentQuote(opponentClub: Club, isDerby: boolean, seed: string): string {
  const mgr = opponentClub.opponentManager
  if (!mgr) return ''

  const quotes: Record<string, string[]> = {
    confident: [
      `${mgr.name}: "Vi räknar med att vinna det här${isDerby ? ' derbyt' : ''}."`  ,
      `${mgr.name}: "Respekt för motståndaren, men poängen ska stanna hemma."`,
    ],
    defensive: [
      `${mgr.name}: "Vi tar ingenting för givet. Det blir en tuff match."`,
      `${mgr.name}: "Vår taktik är vår egen sak."`,
    ],
    cryptic: [
      `${mgr.name}: "Bandyn skriver sina egna historier. Vi får se."`,
      `${mgr.name} sa ingenting efter frågan om skadeläget — bara en axelryckning.`,
    ],
    professorial: [
      `${mgr.name}: "Statistiskt sett är det jämnt. Men statistik räcker inte."`,
      `${mgr.name}: "De har en svaghet i omställningsspel. Vi vet var vi ska slå."`,
    ],
  }

  const pool = quotes[mgr.persona] ?? quotes.defensive
  return seededPick(pool, `${seed}_pre`)
}

const SCANDAL_AFFECTED_LOST = [
  '"Det har varit mycket runtomkring oss. Spelarna har försökt — det är allt jag kan säga om saken."',
  '"Vi förlorade. Vi vet varför. Lagets fokus har inte varit perfekt, men det är inte en ursäkt — det är en förklaring."',
  '"Det är säsongen vi haft. Vi får ta det här och gå vidare. Inget mer än så."',
  '"Vi har grejer att lösa hemma också. Det här var inte lätt, men det är inget vi kan dröja vid."',
]

const SCANDAL_AFFECTED_WON = [
  '"Killarna höll fokus. Det är inte självklart i läget vi är i."',
  '"Truppen har stängt allt utanför planen ute. Det är jag stolt över. Mer behöver inte sägas."',
  '"Bra för killarna. De förtjänar att slippa rubriker en gång."',
]

const SCANDAL_AFFECTED_GENERIC = [
  '"Vi spelade. Det är vad jag bryr mig om idag."',
]

export function generatePostMatchOpponentQuote(opponentClub: Club, theyWon: boolean, hasScandal: boolean | undefined, seed: string): string {
  const mgr = opponentClub.opponentManager
  if (!mgr) return ''

  if (hasScandal) {
    const pool = theyWon
      ? [...SCANDAL_AFFECTED_WON, ...SCANDAL_AFFECTED_GENERIC]
      : [...SCANDAL_AFFECTED_LOST, ...SCANDAL_AFFECTED_GENERIC]
    const quote = seededPick(pool, `${seed}_post_scandal`)
    return `${mgr.name}: ${quote}`
  }

  const quotes: Record<string, string[]> = {
    confident: theyWon
      ? [`${mgr.name}: "Vi visste att vi hade det i oss."`, `${mgr.name}: "Förväntad seger."` ]
      : [`${mgr.name}: "Det här accepterar vi inte. Nästa gång."`, `${mgr.name}: "Besviken är bara förnamnet."`],
    defensive: theyWon
      ? [`${mgr.name}: "Bra defensivt arbete. Precis som vi ville."`, `${mgr.name}: "Laget levererade."` ]
      : [`${mgr.name}: "Vi gav inte upp. Men det räckte inte."`, `${mgr.name}: "Det är ett minusresultat."`],
    cryptic: theyWon
      ? [`${mgr.name}: "Bollen rullar inte alltid rätt. Idag rullade den."`, `${mgr.name}: "Inget att tillägga."`]
      : [`${mgr.name}: "Märklig match. Märkligt resultat."`, `${mgr.name}: "…"`],
    professorial: theyWon
      ? [`${mgr.name}: "Modellen gav oss ett par tiondelar i övertag. Den höll."`, `${mgr.name}: "Analytiskt sett en korrekt seger."`]
      : [`${mgr.name}: "Modellerna missade något. Det ska vi titta på."`, `${mgr.name}: "Ett avvikande utfall. Det händer."`],
  }

  const pool = quotes[mgr.persona] ?? quotes.defensive
  return seededPick(pool, `${seed}_post`)
}
