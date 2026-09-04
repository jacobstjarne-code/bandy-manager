import type { SaveGame } from '../entities/SaveGame'
import type { ActiveAnniversary } from '../services/clubMemoryService'
import { seededPick } from '../utils/random'

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
  { quote: 'Vi vann. Samma vecka, ett annat år.', helper: 'Klacken minns. Spelarna också.' },
  { quote: 'Guldet känns längre bort än så här.', helper: 'Bilderna hänger kvar i klubbhuset.' },
  { quote: 'Vi stod överst. Det var den här veckan.', helper: 'Sånt glöms inte i en bruksort.' },
]

const LOST_MARKS: Omit<AnniversaryMarkCopy, 'eyebrow'>[] = [
  { quote: 'Finalen vi förlorade. I dag, fast då.', helper: 'Sånt sätter sig. Det vet alla här.' },
  { quote: 'Här tog det slut. Samma vecka, då.', helper: 'Vi bär det med oss, vare sig vi vill eller inte.' },
  { quote: 'Förlusten som blev kvar i väggarna.', helper: 'Klacken pratar om den fortfarande.' },
]

const NEUTRAL_MARKS: Omit<AnniversaryMarkCopy, 'eyebrow'>[] = [
  { quote: '{subject} spelade sin sista match den här veckan, ett annat år.', helper: 'Tröjan hänger i klubbhuset nu.' },
  { quote: '{subject} la av den här veckan. Tiden går fort.', helper: 'Killarna nämner honom ibland.' },
]

// Big-neutralt eko utan spelare = serieettan (season_finish pos 1, sig 100).
// NEUTRAL_MARKS ({subject}-pensionering) skulle ljuga OCH läcka oresolverad
// token för det ekot. (Textaudit domän 2, 2026-07-03.)
const SEASON_TOP_MARKS: Omit<AnniversaryMarkCopy, 'eyebrow'>[] = [
  { quote: 'Vi vann serien. Samma vecka, ett annat år.', helper: 'Tabellen från det året hänger i klubbhuset.' },
  { quote: 'Serieettan säkrades den här veckan, då.', helper: 'Sånt glöms inte i en bruksort.' },
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
  // Ett stort neutralt minne utan spelarsubjekt är inte automatiskt en
  // serieseger. Sedan liggaren breddades kan det också vara exempelvis ett
  // patronuttåg eller ett epokskifte. Använd då den redan verifierade,
  // frysta händelsetexten i stället för att fabricera en titel.
  if (echo.outcome === 'neutral' && !echo.subjectPlayerId && echo.type !== 'season_finish') {
    return {
      eyebrow: `⬩ ${yearLabel(echo.yearsAgo)} ⬩`,
      quote: echo.originalEventText,
      helper: '',
    }
  }

  const pool =
    echo.outcome === 'won' ? WON_MARKS :
    echo.outcome === 'lost' ? LOST_MARKS :
    echo.subjectPlayerId ? NEUTRAL_MARKS :
    SEASON_TOP_MARKS

  if (pool.length === 0) return FALLBACK

  const seed = echo.originalSeason + echo.matchday + game.managedClubId.charCodeAt(0)
  const picked = seededPick(pool, seed)

  return {
    eyebrow: `⬩ ${yearLabel(echo.yearsAgo)} ⬩`,
    quote: picked.quote,
    helper: picked.helper,
  }
}
