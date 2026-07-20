import type { NextOpponentTeaserFacts } from '../services/nextOpponentTeaserService'

const SWEDISH_MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
]

function monthName(dateStr: string): string {
  return SWEDISH_MONTHS[new Date(dateStr).getMonth()]
}

export interface NextOpponentHook {
  title: string
  factLine: string
}

/**
 * B3 (Spår B, 2026-07-20) — framåtkrokens mall i Granska. Fable äger
 * orden (mallen nedan är hennes, ordagrant). Code äger valet av VILKEN
 * faktarad som är starkast tillgänglig, och all interpolering.
 *
 * Prioritetsordning (starkast till svagast), L#9 — alla fakta databackade:
 * 1. Obesegrad hemma (bara när vi spelar borta — det är DE som är hemmalag)
 * 2. Tidigare möte denna säsong (förlust/vinst/oavgjort)
 * 3. Tabellgrannar — verkligen två poäng, inte "nära"
 * 4. De ligger strax under oss — verkligen en placering under
 * 5. Fallback — obligatorisk, inte valfri. Utan den går kroken sönder
 *    när ingen fakta är stark nog (vanligt tidigt på säsongen).
 */
export function buildNextOpponentHook(facts: NextOpponentTeaserFacts): NextOpponentHook {
  const title = `Nästa: ${facts.opponentShortName} ${facts.isHome ? 'hemma' : 'borta'}`

  if (!facts.isHome && facts.opponentUnbeatenStreakAtVenue > 0) {
    if (facts.opponentUnbeatenStreakSinceDate) {
      return { title, factLine: `De har inte förlorat hemma sedan ${monthName(facts.opponentUnbeatenStreakSinceDate)}.` }
    }
    return { title, factLine: 'Ingen har vunnit där i år.' }
  }

  const prior = facts.previousMeetingThisSeason
  if (prior) {
    if (prior.managedScore < prior.opponentScore) return { title, factLine: 'Sist tog de två poäng av er.' }
    if (prior.managedScore > prior.opponentScore) return { title, factLine: 'Ni vann senast. De minns det.' }
    return { title, factLine: 'Sist skildes ni oavgjorda.' }
  }

  if (
    facts.managedLeaguePoints !== null && facts.opponentLeaguePoints !== null &&
    Math.abs(facts.managedLeaguePoints - facts.opponentLeaguePoints) === 2
  ) {
    return { title, factLine: 'Två poäng skiljer er i tabellen.' }
  }

  if (
    facts.managedLeaguePosition !== null && facts.opponentLeaguePosition !== null &&
    facts.opponentLeaguePosition === facts.managedLeaguePosition + 1
  ) {
    return { title, factLine: 'De ligger strax under er. Det gör dem farliga.' }
  }

  return { title, factLine: 'Inget särskilt på pappret. Det brukar betyda något annat på isen.' }
}
