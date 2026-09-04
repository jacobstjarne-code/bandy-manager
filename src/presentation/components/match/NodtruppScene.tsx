import { useNavigate } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { PlayerPosition } from '../../../domain/enums'
import { useGameStore } from '../../store/gameStore'
import { positionShort, positionLong, formatSalary } from '../../utils/formatters'
import { computeContractMinSalary, computeLeaguePositionAverages } from '../../../domain/services/economyService'
import { getContractSalaryRange } from '../../../domain/services/contractNegotiationService'

/**
 * CODE_ORDER_NODTRUPP — soft-lock-skydd: visas FÖRE lineup när managed klubb har
 * < 11 spelklara, istället för LineupSteps disablade vägg. Tre lager (akademi
 * primärt → fri agent → walkover som sista utväg). Blockerar aldrig: så länge
 * akademin eller fri-agent-poolen har någon kan spelaren alltid nå elva, och
 * walkover finns som absolut backstop. När truppen når 11 spelklara faller
 * MatchScreen igenom till lineup automatiskt (denna vy avmonteras).
 */

const MIN_PLAYABLE = 11

interface Props {
  game: SaveGame
  availableCount: number
  nextFixtureId: string
}

export function NodtruppScene({ game, availableCount, nextFixtureId }: Props) {
  const navigate = useNavigate()
  const promoteYouthPlayer = useGameStore(s => s.promoteYouthPlayer)
  const signFreeAgent = useGameStore(s => s.signFreeAgent)
  const concedeWalkover = useGameStore(s => s.concedeWalkover)

  const squad = game.players.filter(p => p.clubId === game.managedClubId)
  const injured = squad.filter(p => p.isInjured).length
  const suspended = squad.filter(p => p.suspensionGamesRemaining > 0).length
  // A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md): en tredje, skild orsak till
  // otillgänglighet — inte skadad, inte avstängd, bara vilande/överbelastad.
  const resting = squad.filter(p => (p.restGamesRemaining ?? 0) > 0).length
  const need = Math.max(0, MIN_PLAYABLE - availableCount)

  // Positionsbrist: hur många spelklara per position (för att prioritera rätt junior).
  const availByPos = (pos: PlayerPosition) =>
    squad.filter(
      p => p.position === pos && !p.isInjured && p.suspensionGamesRemaining <= 0 && (p.restGamesRemaining ?? 0) === 0
    ).length
  const posDeficit = (pos: PlayerPosition) => (pos === ('goalkeeper' as PlayerPosition) ? 1 : 2) - availByPos(pos)

  const youth = [...(game.youthTeam?.players ?? [])].sort((a, b) => {
    const d = posDeficit(b.position) - posDeficit(a.position)
    return d !== 0 ? d : b.currentAbility - a.currentAbility
  })
  const freeAgents = [...(game.transferState?.freeAgents ?? [])]
    .filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)   // bara spelklara — annars löser de inte nödläget
    .sort((a, b) => b.currentAbility - a.currentAbility)
    .slice(0, 6)

  const deadEnd = youth.length === 0 && freeAgents.length === 0
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const leagueAverages = computeLeaguePositionAverages(game)

  function emergencySalary(player: (typeof freeAgents)[number]): number {
    if (!managedClub) return player.salary
    const range = getContractSalaryRange(computeContractMinSalary(player, managedClub, leagueAverages))
    return Math.ceil((range.max * 1.15) / 1000) * 1000
  }

  function handleWalkover() {
    concedeWalkover(nextFixtureId)
    navigate('/game/dashboard', { replace: true })
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: '24px 16px 90px' }}>
      <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Läget */}
        <div className="card-round" style={{ padding: '16px 18px' }}>
          <div className="h-label" style={{ color: 'var(--danger-text)', marginBottom: 6 }}>
            Nödläge i truppen
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            {availableCount} spelklara. Det krävs elva.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {[
              injured > 0 ? `${injured} skadade` : null,
              suspended > 0 ? `${suspended} avstängda` : null,
              resting > 0 ? `${resting} vilande` : null,
            ].filter(Boolean).join(', ')}
            {(injured > 0 || suspended > 0 || resting > 0) ? '. ' : ''}
            Du behöver kalla in {need} till innan ni kan spela.
          </p>
        </div>

        {/* Lager 1 — akademin */}
        {youth.length > 0 && (
          <div className="card-sharp" style={{ padding: '12px 14px' }}>
            <div className="h-label" style={{ marginBottom: 8 }}>
              Kalla upp från akademin
            </div>
            {youth.map(y => (
              <div key={y.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', minWidth: 22 }}>{positionShort(y.position)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{y.firstName} {y.lastName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{y.age} år · {positionLong(y.position)} · styrka ~{y.currentAbility}</div>
                </div>
                <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }} onClick={() => promoteYouthPlayer(y.id)}>
                  Kalla upp
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Lager 2 — fri agent */}
        {freeAgents.length > 0 && (
          <div className="card-sharp" style={{ padding: '12px 14px' }}>
            <div className="h-label" style={{ marginBottom: 8 }}>
              Nödvärva fri agent
            </div>
            {freeAgents.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', minWidth: 22 }}>{positionShort(a.position)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.firstName} {a.lastName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.age} år · {positionLong(a.position)} · styrka ~{a.currentAbility} · {formatSalary(emergencySalary(a))}</div>
                </div>
                <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }} onClick={() => signFreeAgent(a.id, emergencySalary(a), 3)}>
                  Ring in
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Lager 3 — walkover (sista utväg, bara vid äkta återvändsgränd) */}
        {deadEnd && (
          <div className="card-sharp" style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
              Akademin är tom och inga fria agenter svarar. Då återstår bara att lämna matchen.
            </p>
            <button className="btn btn-outline" style={{ width: '100%', fontSize: 13, color: 'var(--danger-text)' }} onClick={handleWalkover}>
              Lämna walkover — förlust 0–5
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
