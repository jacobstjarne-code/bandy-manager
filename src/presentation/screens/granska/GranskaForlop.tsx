import { useNavigate } from 'react-router-dom'
import type { SaveGame, RoundSummaryData } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import { MatchEventType, InboxItemType } from '../../../domain/enums'
import { csColor, formatFinance } from '../../utils/formatters'
import { getRivalry } from '../../../domain/data/rivalries'
import { SectionLabel } from '../../components/SectionLabel'

interface GranskaForlopProps {
  game: SaveGame
  fixture: Fixture | undefined
  isHome: boolean
  rs: RoundSummaryData | null
  standing: { clubId: string; position: number } | undefined
  standingBefore: number | null
  financesDelta: number
  csDelta: number
  cs: number
  otherResults: Fixture[]
}

export function GranskaForlop({ game, fixture, isHome, rs, standing, standingBefore, financesDelta, csDelta, cs, otherResults }: GranskaForlopProps) {
  const navigate = useNavigate()

  const allEvents = fixture?.events
    .filter(e => e.type === MatchEventType.Goal || e.type === MatchEventType.RedCard || e.type === MatchEventType.Corner || e.type === MatchEventType.Penalty)
    .sort((a, b) => a.minute - b.minute) ?? []

  const getClubShort = (id: string) => game.clubs.find(c => c.id === id)?.shortName ?? game.clubs.find(c => c.id === id)?.name ?? '?'

  return (
    <>
      {/* Other matches */}
      {rs && (
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
          <SectionLabel style={{ marginBottom: 8 }}>OMGÅNGSSAMMANFATTNING</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {standing && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/tabell')}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📊 Tabellplacering</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {standingBefore && standingBefore !== standing.position
                    ? `${standingBefore} → ${standing.position} ${standingBefore > standing.position ? '↑' : '↓'}`
                    : `${standing.position}:a`}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>💰 Ekonomi</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: financesDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatFinance(financesDelta)}/omg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🏘 Bygdens puls</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: csColor(cs) }}>
                {csDelta !== 0 ? `${rs.communityStandingBefore ?? cs} → ${cs} ${csDelta > 0 ? '↑' : '↓'}` : `${cs}`}
              </span>
            </div>
            {rs.injuries && rs.injuries.length > 0 && (
              <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/squad')}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🩹 Skador</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
                  {rs.injuries.map((inj: string, i: number) => <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>{inj}</span>)}
                </div>
              </div>
            )}
            {rs.youthMatchResult && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'akademi' } })}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🎓 P19</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{rs.youthMatchResult}</span>
              </div>
            )}
            {rs.newInboxCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', cursor: 'pointer' }} onClick={() => navigate('/game/inbox')}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📬 Inkorg</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{rs.newInboxCount} nya</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match event timeline */}
      {allEvents.length > 0 && (
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
          <SectionLabel style={{ marginBottom: 8 }}>HÄNDELSETIDSLINJE</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {allEvents.map((e, i) => {
              const isManagedEvent = isHome ? e.clubId === fixture?.homeClubId : e.clubId === fixture?.awayClubId
              const icon = e.type === MatchEventType.Goal ? (e.isCornerGoal ? '📐' : '🏒')
                : e.type === MatchEventType.Corner ? '🔄'
                : e.type === MatchEventType.Penalty ? '🎯'
                : '🟥'
              const p = e.playerId ? game.players.find(pl => pl.id === e.playerId) : null
              const name = p ? `${p.firstName[0]}. ${p.lastName}` : ''
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 22, textAlign: 'right', flexShrink: 0 }}>{e.minute}'</span>
                  <span style={{ fontSize: 11 }}>{icon}</span>
                  <span style={{ fontSize: 11, flex: 1, color: isManagedEvent ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {name || e.description}
                  </span>
                  {!isManagedEvent && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>mot</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Other results */}
      {otherResults.length > 0 && (() => {
        const rivalClubId = game.clubs
          .filter(c => c.id !== game.managedClubId)
          .find(c => getRivalry(game.managedClubId, c.id))?.id ?? null
        let rivalSummary: string | null = null
        if (rivalClubId) {
          const rivalFixture = otherResults.find(f => f.homeClubId === rivalClubId || f.awayClubId === rivalClubId)
          if (rivalFixture) {
            const rivalIsHome = rivalFixture.homeClubId === rivalClubId
            const rivalScore = rivalIsHome ? rivalFixture.homeScore : rivalFixture.awayScore
            const oppScore = rivalIsHome ? rivalFixture.awayScore : rivalFixture.homeScore
            const rivalWon = rivalScore > oppScore
            const rivalDrew = rivalScore === oppScore
            const rivalPos = game.standings.find(s => s.clubId === rivalClubId)?.position
            const rivalName = game.clubs.find(c => c.id === rivalClubId)?.shortName ?? 'Rivalen'
            const resultWord = rivalWon ? 'vann' : rivalDrew ? 'spelade kryss' : 'förlorade'
            rivalSummary = rivalPos ? `${rivalName} ${resultWord} — nu på plats ${rivalPos}` : `${rivalName} ${resultWord}`
          }
        }
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 6 }}>🏒 ANDRA MATCHER</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {otherResults.map(f => {
                const homeWon = (f.homeScore ?? 0) > (f.awayScore ?? 0)
                const awayWon = (f.awayScore ?? 0) > (f.homeScore ?? 0)
                const isRivalMatch = rivalClubId && (f.homeClubId === rivalClubId || f.awayClubId === rivalClubId)
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', padding: '3px 0 3px 6px', borderLeft: isRivalMatch ? '2px solid var(--accent)' : '2px solid transparent' }}>
                    <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: homeWon ? 700 : 400, color: homeWon ? 'var(--text-primary)' : 'var(--text-muted)' }}>{getClubShort(f.homeClubId)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', width: 40, textAlign: 'center', flexShrink: 0 }}>{f.homeScore}–{f.awayScore}</span>
                    <span style={{ flex: 1, fontSize: 11, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: awayWon ? 700 : 400, color: awayWon ? 'var(--text-primary)' : 'var(--text-muted)' }}>{getClubShort(f.awayClubId)}</span>
                  </div>
                )
              })}
            </div>
            {rivalSummary && <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6, fontStyle: 'italic' }}>{rivalSummary}</p>}
          </div>
        )
      })()}

      {/* Scouting */}
      {(() => {
        const scoutItems = game.inbox.filter(i => i.type === InboxItemType.ScoutReport && !i.isRead).slice(-2)
        if (scoutItems.length === 0) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 6 }}>🔍 SCOUTING</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {scoutItems.map((item, i) => (
                <div key={i} style={{ borderBottom: i < scoutItems.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: i < scoutItems.length - 1 ? 5 : 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </>
  )
}
