import type { SaveGame } from '../entities/SaveGame'
import type { EventLedgerEntry } from '../entities/Narrative'
import { FACILITY_COMPLETED_BEATS } from '../data/facilityPortalBeats'
import { readClubLedger } from './eventLedgerService'
import { resolveSubjectName } from './momentLedgerService'
import { academyOperatingCostPerRound } from './academyService'
import { formatSwedishCount } from '../utils/formatSwedishCount'

type LoanReturnedEntry = EventLedgerEntry & {
  loan: Extract<NonNullable<EventLedgerEntry['loan']>, { caAtReturn: number }>
}

function isLoanReturnedEntry(entry: EventLedgerEntry): entry is LoanReturnedEntry {
  return entry.type === 'loan_returned' && !!entry.loan && 'caAtReturn' in entry.loan
}

/** DOM_AKADEMI_LIGGARE §3: den låsta, sanningsbärande returraden. */
export function loanReturnAttribution(game: SaveGame, entry: EventLedgerEntry): string | null {
  if (!isLoanReturnedEntry(entry)) return null
  const playerName = resolveSubjectName(game, entry.subject, entry.subjectSnapshot) ?? 'En spelare'
  const destinationName = resolveSubjectName(game, entry.subject2, entry.subject2Snapshot) ?? 'låneklubben'
  const { caAtStart, caAtReturn, loanBonus, matches } = entry.loan

  if (matches === 0) {
    return `${playerName} tillbaka från ${destinationName}. Ingen match, ingen utveckling. Fel lån.`
  }
  if (loanBonus > 0) {
    return `${playerName} tillbaka från ${destinationName}: ${caAtStart}→${caAtReturn}. Lånet gav ${loanBonus}, träningen resten.`
  }
  return `${playerName} tillbaka från ${destinationName}: ${caAtStart}→${caAtReturn}. Lånet gav inget mätbart — matcherna gjorde han ändå.`
}

/** Senaste avslutade lån denna säsong, utan separat visnings-/minnesstate. */
export function latestLoanReturnAttribution(game: SaveGame): string | null {
  const entry = readClubLedger(game)
    .filter(candidate => candidate.season === game.currentSeason && isLoanReturnedEntry(candidate))
    .sort((a, b) => (b.matchday - a.matchday) || b.semanticKey.localeCompare(a.semanticKey))[0]
  return entry ? loanReturnAttribution(game, entry) : null
}

/**
 * DOM_AKADEMI_LIGGARE §5: årsbokens låsta ekonomirad, fryst medan den
 * avslutade säsongens matchday och liggare fortfarande är intakta.
 * Drift använder samma prisfunktion som den faktiska ekonomimutationen.
 */
export function academyEconomyYearbookLine(game: SaveGame, season = game.currentSeason): string {
  const seasonEntries = readClubLedger(game).filter(entry => entry.season === season)
  const startCost = seasonEntries.reduce((sum, entry) => {
    if (entry.type !== 'academy_upgrade_started' || !entry.academyUpgrade || !('costKr' in entry.academyUpgrade)) return sum
    return sum + entry.academyUpgrade.costKr
  }, 0)
  const promotedCount = seasonEntries.filter(entry => entry.type === 'academy_promotion').length
  const developmentGain = seasonEntries.reduce((sum, entry) => {
    if (!isLoanReturnedEntry(entry)) return sum
    return sum + Math.max(0, entry.loan.caAtReturn - entry.loan.caAtStart)
  }, 0)
  const completedRounds = season === game.currentSeason ? Math.max(0, game.currentMatchday ?? 0) : 0
  const operatingCost = academyOperatingCostPerRound(game.academyLevel ?? 'basic') * completedRounds

  return `Akademin: ${Math.round(startCost / 1_000)} + ${Math.round(operatingCost / 1_000)} tkr. Gav ${promotedCount} uppflyttade och ${developmentGain} i utveckling.`
}

interface RankedAcademyLine {
  significance: number
  matchday: number
  semanticKey: string
  text: string
}

/**
 * DOM_AKADEMI_LIGGARE §3/§6: högst tre akademirader, valda ur kanon och
 * frysta i SeasonSummary. All prosa är återanvänd från domens låsta rader
 * eller redan etablerade akademirader i spelet.
 */
export function academyYearbookLines(game: SaveGame, season = game.currentSeason): string[] {
  const ledger = readClubLedger(game)
  const seasonEntries = ledger.filter(entry => entry.season === season)
  const lines: RankedAcademyLine[] = []

  const youthIntakes = seasonEntries.filter(entry => entry.type === 'youth_intake' && entry.youthIntake)
  if (youthIntakes.length > 0) {
    const count = youthIntakes.reduce((sum, entry) => sum + (entry.youthIntake?.count ?? 0), 0)
    const rankEntry = [...youthIntakes].sort((a, b) => (b.significance - a.significance) || (b.matchday - a.matchday))[0]
    lines.push({
      significance: rankEntry.significance,
      matchday: rankEntry.matchday,
      semanticKey: rankEntry.semanticKey,
      text: `${count} nya spelare rekryterades`,
    })
  }

  for (const entry of seasonEntries) {
    if (isLoanReturnedEntry(entry)) {
      const text = loanReturnAttribution(game, entry)
      if (text) lines.push({ significance: entry.significance, matchday: entry.matchday, semanticKey: entry.semanticKey, text })
      continue
    }

    if (entry.type === 'mentorship_ended' && entry.mentorship && 'reason' in entry.mentorship) {
      const started = [...ledger].reverse().find(candidate =>
        candidate.type === 'mentorship_started'
        && candidate.subject?.id === entry.subject?.id
        && candidate.subject2?.id === entry.subject2?.id
        && (candidate.season < entry.season || (candidate.season === entry.season && candidate.matchday <= entry.matchday))
        && candidate.mentorship
        && 'juniorCaAtStart' in candidate.mentorship
      )
      if (!started?.mentorship || !('juniorCaAtStart' in started.mentorship)) continue
      const juniorName = resolveSubjectName(game, entry.subject, entry.subjectSnapshot) ?? 'En spelare'
      const mentorName = resolveSubjectName(game, entry.subject2, entry.subject2Snapshot) ?? 'okänd mentor'
      const seasonWord = entry.mentorship.seasons === 1 ? 'säsong' : 'säsonger'
      const outcome = entry.mentorship.reason === 'promoted'
        ? 'Klar för A-laget.'
        : entry.mentorship.reason === 'graduated'
          ? 'Uppflyttad.'
          : entry.mentorship.reason === 'aged_out'
            ? 'Fyllde 20 utan plats.'
            : 'Bandet bröts.'
      lines.push({
        significance: entry.significance,
        matchday: entry.matchday,
        semanticKey: entry.semanticKey,
        text: `${juniorName}, mentor ${mentorName} ${entry.mentorship.seasons} ${seasonWord}: ${started.mentorship.juniorCaAtStart}→${entry.mentorship.juniorCaAtEnd}. ${outcome}`,
      })
      continue
    }

    if (entry.type === 'youth_aged_out' && entry.youthAgedOut) {
      const name = resolveSubjectName(game, entry.subject, entry.subjectSnapshot) ?? 'En spelare'
      lines.push({
        significance: entry.significance,
        matchday: entry.matchday,
        semanticKey: entry.semanticKey,
        text: `${name}, ${formatSwedishCount(entry.youthAgedOut.stars, 'stjärna', 'stjärnor')}, lämnade akademin vid tjugo års ålder.`,
      })
      continue
    }

    if (entry.type === 'academy_upgrade_completed' && entry.academyUpgrade && 'level' in entry.academyUpgrade) {
      const key = entry.academyUpgrade.level === 'elite' ? 'akademi_3' : 'akademi_2'
      lines.push({
        significance: entry.significance,
        matchday: entry.matchday,
        semanticKey: entry.semanticKey,
        text: FACILITY_COMPLETED_BEATS[key],
      })
    }
  }

  return lines
    .sort((a, b) => (b.significance - a.significance) || (b.matchday - a.matchday) || a.semanticKey.localeCompare(b.semanticKey))
    .slice(0, 3)
    .map(line => line.text)
}
