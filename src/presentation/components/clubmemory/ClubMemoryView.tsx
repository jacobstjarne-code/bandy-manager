import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { MomentSource } from '../../../domain/entities/Moment'
import type { MomentLedgerEntry } from '../../../domain/services/momentLedgerService'
import { getClubMemory, momentKind } from '../../../domain/services/clubMemoryService'
import { getRecentMomentsFromLedger, resolveSubjectName } from '../../../domain/services/momentLedgerService'
import { MOMENT_VIEW_TEMPLATES } from '../../../domain/data/momentViewTemplates'
import { ClubMemorySeasonSection } from './ClubMemorySeasonSection'
import { ClubMemoryLegendsBlock } from './ClubMemoryLegendsBlock'
import { ClubMemoryRecordsBlock } from './ClubMemoryRecordsBlock'
import { ClubMemoryEmpty } from './ClubMemoryEmpty'
import { Spine } from '../shared/Spine'
import type { SpineItem } from '../shared/Spine'

const KIND_LABEL: Record<string, string> = {
  triumph: 'Triumf',
  scar:    'Ärr',
  tension: 'Laddat',
  neutral: 'Noterat',
}

/**
 * SKALA-BUGGEN steg B (2026-09-02), gränsfallet — Moment-mängden är blandad:
 * matchbundna källor (kan vara liga ELLER cup/slutspel) och rena system-
 * händelser (ingen match alls). Jacobs vägval: gren på typ, inte en
 * enhetlig etikett åt bägge håll — en ligamatch ska visa sin serieomgång,
 * en systemhändelse (skada, mecenatbeslut) ska bara visa säsongen, samma
 * mönster TranareTab.tsx redan använder för dagboksrader (Spine.tsx:37).
 */
const MATCH_BOUND_MOMENT_SOURCES = new Set<MomentSource>(['derby_win', 'season_highlight'])

function momentRoundLabel(entry: MomentLedgerEntry, game: SaveGame): string {
  if (!MATCH_BOUND_MOMENT_SOURCES.has(entry.type)) {
    return `Säsong ${entry.season}`
  }
  const fixture = game.fixtures.find(f =>
    f.matchday === entry.matchday && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  if (fixture && !fixture.isCup && !fixture.isKnockout) return `Omg ${fixture.roundNumber}`
  // Cup/slutspel, eller fixturen hittas inte längre — samma ärliga fallback
  // ("Matchdag N") som cupbracket-precedenset i TabellScreen.tsx.
  return `Matchdag ${entry.matchday}`
}

interface Props {
  game: SaveGame
}

export function buildBlodslinje(game: SaveGame): SpineItem[] {
  const history = game.mentorshipHistory ?? []
  if (history.length === 0) return []
  const legends = game.clubLegends ?? []
  const items: SpineItem[] = []
  for (const record of history) {
    const seniorLegend = legends.find(l => l.playerId === record.seniorPlayerId)
    const seniorPlayer = game.players.find(p => p.id === record.seniorPlayerId)
    const seniorName = seniorPlayer
      ? `${seniorPlayer.firstName} ${seniorPlayer.lastName}`
      : seniorLegend?.name ?? record.seniorName ?? 'Okänd'
    const juniorPlayer = game.players.find(p => p.id === record.youthPlayerId)
      ?? game.youthTeam?.players.find(p => p.id === record.youthPlayerId)
    const juniorName = juniorPlayer
      ? `${juniorPlayer.firstName} ${juniorPlayer.lastName}`
      : record.youthName ?? null
    if (!juniorName) continue
    const label = seniorName
    const text = record.outcome === 'graduated'
      ? `${juniorName} tog steget upp.`
      : record.outcome === 'ended'
      ? `${juniorName} och ${seniorName} gick skilda vägar.`
      : `${juniorName} är ${seniorName}s adept.`
    items.push({ label, season: record.endSeason ?? game.currentSeason, text, dimmed: record.outcome === 'ended' })
  }
  return items
}

export function ClubMemoryView({ game }: Props) {
  const clubMemory = getClubMemory(game)
  // MIGRATIONSPLAN_HANDELSELIGGAREN Fas 4 (Moment-läsytan): läser liggaren
  // i stället för det cappade game.recentMoments — se momentLedgerService.ts.
  const recentMoments = getRecentMomentsFromLedger(game, 5)
  const blodslinjeItems = buildBlodslinje(game)

  return (
    <div className="club-memory-container">

      {recentMoments.length > 0 && (
        <div className="moment-block">
          <div className="moment-block-header">Det som hänt</div>
          <div className="moment-block-subheader">Säsongen</div>
          {recentMoments.map(entry => {
            const kind = momentKind(entry.type)
            const { title, body } = MOMENT_VIEW_TEMPLATES[entry.type]({
              subjectName: resolveSubjectName(game, entry.subject),
              subject2Name: resolveSubjectName(game, entry.subject2),
              matchday: entry.matchday,
              season: entry.season,
              significance: entry.significance,
              eraLabel: entry.eraLabel,
              transferRole: entry.transferRole,
              matchCategory: entry.matchCategory,
            })
            return (
              <div key={entry.semanticKey} className={`moment-row ${kind}`}>
                <div className="moment-row-meta">
                  <span className={`moment-row-kt ${kind}`}>{KIND_LABEL[kind]}</span>
                  <span className="moment-row-matchday">{momentRoundLabel(entry, game)}</span>
                </div>
                <div className="moment-row-title">{title}</div>
                <div className="moment-row-body">{body}</div>
              </div>
            )
          })}
        </div>
      )}

      {clubMemory.totalEventsAcrossSeasons < 3 ? (
        recentMoments.length === 0 && <ClubMemoryEmpty />
      ) : (
        <>
          {clubMemory.seasons.map(seasonMemory => (
            <ClubMemorySeasonSection
              key={seasonMemory.season}
              seasonMemory={seasonMemory}
              activeAnniversaries={game.activeAnniversaries ?? []}
            />
          ))}

          {clubMemory.legends.length > 0 && (
            <ClubMemoryLegendsBlock legends={clubMemory.legends} />
          )}

          {blodslinjeItems.length > 0 && (
            <div className="card-sharp" style={{ padding: '14px 16px', margin: '0 12px' }}>
              <div className="h-label" style={{ marginBottom: 12 }}>
                🩸 BLODSLINJE
              </div>
              <Spine items={blodslinjeItems} />
            </div>
          )}

          {clubMemory.records && (
            <ClubMemoryRecordsBlock records={clubMemory.records} />
          )}
        </>
      )}

    </div>
  )
}
