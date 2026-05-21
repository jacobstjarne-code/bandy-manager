import type { SaveGame } from '../entities/SaveGame'
import type { ActiveAnniversary } from '../services/clubMemoryService'

interface AnniversaryMarkCopy {
  eyebrow: string
  quote: string
  helper: string
}

/**
 * Copy för PortalAnniversaryMark — visas bara vid big eko (significance >= 90).
 * Tonregel (spec 0.5): peka tillbaka på den specifika händelsen.
 * {subject} resolvas av komponenten till spelarnamn/klubbnamn.
 */

function yearLabel(yearsAgo: number): string {
  if (yearsAgo === 1) return 'Ett år sedan'
  return `${yearsAgo} år sedan`
}

const WON_MARKS: Omit<AnniversaryMarkCopy, 'eyebrow'>[] = [
  { quote: 'Guldet. Samma vecka, förra säsongen.', helper: 'Klacken minns. Spelarna också.' },
  { quote: 'SM-guldet känns längre bort än så här.', helper: 'Bilderna hänger kvar i klubbhuset.' },
  { quote: 'Vi stod överst. Det var den här veckan.', helper: 'Sånt glöms inte i en bruksort.' },
]

const LOST_MARKS: Omit<AnniversaryMarkCopy, 'eyebrow'>[] = [
  { quote: 'Finalen vi förlorade. Idag, fast då.', helper: 'Sånt sätter sig. Det vet alla här.' },
  { quote: 'Här tog det slut förra året. Samma vecka.', helper: 'Vi bär det med oss, vare sig vi vill eller inte.' },
  { quote: 'Förlusten som blev kvar i väggarna.', helper: 'Klacken pratar om den fortfarande.' },
]

const NEUTRAL_MARKS: Omit<AnniversaryMarkCopy, 'eyebrow'>[] = [
  { quote: '{subject} spelade sin sista match den här veckan, i fjol.', helper: 'Tröjan hänger i klubbhuset nu.' },
  { quote: 'Ett år sedan {subject} la av. Tiden går fort.', helper: 'Killarna nämner honom ibland.' },
]

const FALLBACK: AnniversaryMarkCopy = {
  eyebrow: '⬩ Eko ⬩',
  quote: '',
  helper: '',
}

export function pickAnniversaryMarkCopy(
  echo: ActiveAnniversary,
  game: SaveGame,
): AnniversaryMarkCopy {
  const pool =
    echo.outcome === 'won' ? WON_MARKS :
    echo.outcome === 'lost' ? LOST_MARKS :
    NEUTRAL_MARKS

  if (pool.length === 0) return FALLBACK

  const seed = echo.originalSeason + echo.matchday + game.managedClubId.charCodeAt(0)
  const picked = pool[seed % pool.length]

  return {
    eyebrow: `⬩ ${yearLabel(echo.yearsAgo)} ⬩`,
    quote: picked.quote,
    helper: picked.helper,
  }
}
