import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { MomentSource } from '../../../domain/entities/Moment'
import type { MomentLedgerEntry } from '../../../domain/services/momentLedgerService'
import { getClubMemory, momentKind } from '../../../domain/services/clubMemoryService'
import { getRecentMomentsFromLedger, resolveSubjectName } from '../../../domain/services/momentLedgerService'
import { renderMomentViewFromLedger } from '../../../domain/data/momentViewTemplates'
import { ClubMemorySeasonSection } from './ClubMemorySeasonSection'
import { ClubMemoryLegendsBlock } from './ClubMemoryLegendsBlock'
import { ClubMemoryRecordsBlock } from './ClubMemoryRecordsBlock'
import { ClubMemoryEmpty } from './ClubMemoryEmpty'
import { Spine } from '../shared/Spine'
import type { SpineItem } from '../shared/Spine'
import { seasonSpanLabel } from '../../../domain/utils/seasonYear'
import { readClubLedger } from '../../../domain/services/eventLedgerService'
import { swedishGenitive } from '../../../domain/utils/swedishGrammar'

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
    return `Säsong ${seasonSpanLabel(entry.season)}`
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
  const mentorshipLedger = readClubLedger(game).filter(entry =>
    entry.type === 'mentorship_started' || entry.type === 'mentorship_ended'
  )
  const history = game.mentorshipHistory ?? []
  const legends = game.clubLegends ?? []
  const items: SpineItem[] = []

  const ledgerPairs = new Set<string>()
  for (const [entryIndex, entry] of mentorshipLedger.entries()) {
    if (entry.type !== 'mentorship_started' || entry.subject?.kind !== 'player' || entry.subject2?.kind !== 'player') continue
    const pairKey = `${entry.subject.id}:${entry.subject2.id}`
    ledgerPairs.add(pairKey)
    // Samma duo kan bilda ett nytt band en senare säsong. Para därför varje
    // start med det FÖRSTA efterföljande slutet, inte parets senaste någonsin.
    const ended = mentorshipLedger.slice(entryIndex + 1).find(candidate =>
      candidate.type === 'mentorship_ended'
      && candidate.subject?.kind === 'player'
      && candidate.subject.id === entry.subject!.id
      && candidate.subject2?.kind === 'player'
      && candidate.subject2.id === entry.subject2!.id
    )
    const juniorName = resolveSubjectName(game, entry.subject, entry.subjectSnapshot) ?? 'En spelare'
    const mentorName = resolveSubjectName(game, entry.subject2, entry.subject2Snapshot) ?? 'Okänd mentor'
    if (!ended) {
      items.push({ label: mentorName, season: entry.season, text: `${juniorName} är ${swedishGenitive(mentorName)} adept.` })
      continue
    }
    const startedPayload = entry.mentorship && 'juniorCaAtStart' in entry.mentorship ? entry.mentorship : undefined
    const endedPayload = ended.mentorship && 'reason' in ended.mentorship ? ended.mentorship : undefined
    if (!startedPayload || !endedPayload) continue
    const seasonWord = endedPayload.seasons === 1 ? 'säsong' : 'säsonger'
    const outcome = endedPayload.reason === 'promoted'
      ? 'Klar för A-laget.'
      : endedPayload.reason === 'graduated'
        ? 'Uppflyttad.'
        : endedPayload.reason === 'aged_out'
          ? 'Fyllde 20 utan plats.'
          : 'Bandet bröts.'
    items.push({
      label: mentorName,
      season: ended.season,
      text: `${juniorName}, mentor ${mentorName} ${endedPayload.seasons} ${seasonWord}: ${startedPayload.juniorCaAtStart}→${endedPayload.juniorCaAtEnd}. ${outcome}`,
      dimmed: endedPayload.reason === 'cancelled' || endedPayload.reason === 'aged_out',
    })
  }

  // Retire-last: gamla sparfiler saknar mentorship_*-poster. Läs den äldre
  // historiken bara för par som ännu inte finns i den kanoniska liggaren.
  for (const record of history) {
    if (ledgerPairs.has(`${record.youthPlayerId}:${record.seniorPlayerId}`)) continue
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
      : `${juniorName} är ${swedishGenitive(seniorName)} adept.`
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
            const kind = momentKind(entry.type, entry)
            const text = renderMomentViewFromLedger(entry, {
              subjectName: resolveSubjectName(game, entry.subject, entry.subjectSnapshot),
              subject2Name: resolveSubjectName(game, entry.subject2, entry.subject2Snapshot),
              matchday: entry.matchday,
              season: entry.season,
              significance: entry.significance,
              eraLabel: entry.eraLabel,
              transferRole: entry.transferRole,
              matchCategory: entry.matchCategory,
            })
            if (!text) return null
            const { title, body } = text
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
          <div className="km-nyckel">
            <div className="km-nyckel-row">
              <span className="km-nyckel-cap">Kind — färgaxel</span>
              <span className="km-kchip"><span className="km-kdot" style={{ background: 'var(--accent)' }} />Triumf</span>
              {/* adherence-semantic-key: detta ÄR nyckeln — chippen namnger vad --danger betyder. */}
              <span className="km-kchip"><span className="km-kdot" style={{ background: 'var(--danger)' }} />Ärr</span>
              {/* adherence-semantic-key: detta ÄR nyckeln — chippen namnger vad --warm betyder. */}
              <span className="km-kchip"><span className="km-kdot" style={{ background: 'var(--warm)' }} />Laddat</span>
              <span className="km-kchip"><span className="km-kdot" style={{ background: 'var(--text-muted)' }} />Noterat</span>
            </div>
            <div className="km-nyckel-row">
              <span className="km-nyckel-cap">Familj — kategoristämpel</span>
              <span className="km-fchip"><span className="km-em">⚔️</span>Match</span>
              <span className="km-fchip"><span className="km-em">🏟️</span>Anläggning</span>
              <span className="km-fchip"><span className="km-em">👤</span>Personer</span>
              <span className="km-fchip"><span className="km-em">🤝</span>Relationer &amp; pengar</span>
              <span className="km-fchip"><span className="km-em">📋</span>Beslut &amp; epok</span>
            </div>
          </div>

          {clubMemory.seasons.map(seasonMemory => (
            <ClubMemorySeasonSection
              key={seasonMemory.season}
              game={game}
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
