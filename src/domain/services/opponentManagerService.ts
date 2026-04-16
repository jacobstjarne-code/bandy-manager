import type { Club } from '../entities/Club'

// DREAM-001 + WEAK-016: Opponent manager generation and quote system

const MANAGER_FIRSTNAMES = ['Hans', 'Bengt', 'Lars', 'Ulf', 'Mats', 'Kenneth', 'Peter', 'Anders', 'Roger', 'Sven-Erik', 'Leif', 'Göran']
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

export function generatePreMatchOpponentQuote(opponentClub: Club, isDerby: boolean): string {
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
  return pool[Math.floor(Math.random() * pool.length)]
}

export function generatePostMatchOpponentQuote(opponentClub: Club, theyWon: boolean): string {
  const mgr = opponentClub.opponentManager
  if (!mgr) return ''

  const quotes: Record<string, string[]> = {
    confident: theyWon
      ? [`${mgr.name}: "Vi visste att vi hade det i oss."`, `${mgr.name}: "Förväntade seger."` ]
      : [`${mgr.name}: "Det här accepterar vi inte. Nästa gång."`, `${mgr.name}: "Jag är besviken. Det underdriver det."`],
    defensive: theyWon
      ? [`${mgr.name}: "Bra defensivt arbete. Precis som vi ville."`, `${mgr.name}: "Laget levererade."` ]
      : [`${mgr.name}: "Vi gav inte upp. Men det räckte inte."`, `${mgr.name}: "Det är ett minusresultat."`],
    cryptic: theyWon
      ? [`${mgr.name}: "Bollen rullar inte alltid rätt. Idag rullade den."`, `${mgr.name}: "Inget att tillägga."`]
      : [`${mgr.name}: "Märkliga match. Märkligt resultat."`, `${mgr.name}: "…"`],
    professorial: theyWon
      ? [`${mgr.name}: "Xg-modellen visade +0.4 till oss. Den höll."`, `${mgr.name}: "Analytiskt sett en korrekt seger."`]
      : [`${mgr.name}: "Modellerna missade något. Det ska vi titta på."`, `${mgr.name}: "Outlier. Det händer."`],
  }

  const pool = quotes[mgr.persona] ?? quotes.defensive
  return pool[Math.floor(Math.random() * pool.length)]
}
