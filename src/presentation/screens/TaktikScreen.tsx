import { useNavigate } from 'react-router-dom'
import { useGameStore, useManagedClub, useManagedPlayers, useLastCompletedFixture } from '../store/gameStore'
import { TacticBoardCard } from '../components/tactic/TacticBoardCard'
import type { Tactic } from '../../domain/entities/Club'
import { getNextManagedFixture } from '../../domain/services/portal/triggers/matchTriggers'
import { getTacticDeltaLine, getTacticChangeHistoryLines } from '../utils/tacticData'
import { getBurnoutTacticSuppression, suppressTacticRecommendation, burnoutEffectSeed } from '../../domain/services/burnoutReliefService'

export function TaktikScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const club = useManagedClub()
  const players = useManagedPlayers()
  const updateTactic = useGameStore(s => s.updateTactic)
  const setTacticAdvancedMode = useGameStore(s => s.setTacticAdvancedMode)
  const lastFixture = useLastCompletedFixture()
  const coach = game?.assistantCoach
  const captainPlayerId = game?.captainPlayerId

  const { nextOpponentName, nextOpponentAnalysis } = (() => {
    if (!game) return { nextOpponentName: undefined, nextOpponentAnalysis: undefined }
    const nf = getNextManagedFixture(game)
    if (!nf) return { nextOpponentName: undefined, nextOpponentAnalysis: undefined }
    const oppId = nf.homeClubId === game.managedClubId ? nf.awayClubId : nf.homeClubId
    const opp = game.clubs.find(c => c.id === oppId)
    const rawAnalysis = game.opponentAnalyses?.[oppId]
    // O4 (DOM_BURNOUT_2026-08-17.md, 2026-08-23): "assistentens taktik-
    // rekommendation uteblir ibland/oftare" — deterministisk per omgång,
    // samma seed som SquadScreen.tsx:s TacticBoardCard-montering.
    const suppressed = getBurnoutTacticSuppression(game.managerProfile, burnoutEffectSeed(game))
    return {
      nextOpponentName: opp?.shortName ?? opp?.name,
      nextOpponentAnalysis: suppressed ? suppressTacticRecommendation(rawAnalysis) : rawAnalysis,
    }
  })()

  // O15 (2026-08-18/19): delta-radens {Motståndare} är motståndaren i förra SPELADE
  // matchen (lastFixture), inte nästa motstånd — "sedan sist" i spelarens minne.
  const lastOpponentName = (() => {
    if (!game || !lastFixture) return undefined
    const oppId = lastFixture.homeClubId === game.managedClubId ? lastFixture.awayClubId : lastFixture.homeClubId
    const opp = game.clubs.find(c => c.id === oppId)
    return opp?.shortName ?? opp?.name
  })()

  if (!game || !club || !coach) {
    return (
      <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        Ingen aktiv säsong.
      </div>
    )
  }

  // O15: standard är default (tacticAdvancedMode undefined → false) tills spelaren
  // aktivt växlar — och växlingen persisteras då via setTacticAdvancedMode.
  const advancedMode = game.tacticAdvancedMode ?? false
  const deltaLine = getTacticDeltaLine(club.activeTactic, lastFixture, game.managedClubId, game.currentSeason, lastOpponentName)
  const historyLines = getTacticChangeHistoryLines(game.tacticChangeLog)

  function handleTacticChange(tactic: Tactic) {
    updateTactic(tactic)
  }

  return (
    <div style={{ padding: '0 0 calc(var(--bottom-nav-height, 60px) + 16px)' }}>
      {/* Back header */}
      <div style={{
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '0.5px solid var(--border)',
        background: 'var(--bg-surface)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', color: 'var(--accent)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '2px 0',
          }}
        >
          ← Tillbaka
        </button>
        <p className="h-label" style={{ marginLeft: 'auto' }}>
          TAKTIKTAVLAN
        </p>
      </div>

      <div style={{ padding: '8px 12px' }}>
        <TacticBoardCard
          club={club}
          players={players}
          coach={coach}
          captainPlayerId={captainPlayerId}
          chemistryStats={game.chemistryStats ?? {}}
          onTacticChange={handleTacticChange}
          matchday={game.currentMatchday}
          nextOpponentName={nextOpponentName}
          opponentAnalysis={nextOpponentAnalysis}
          advancedMode={advancedMode}
          onToggleAdvancedMode={setTacticAdvancedMode}
          deltaLine={deltaLine}
          historyLines={historyLines}
        />
      </div>
    </div>
  )
}
