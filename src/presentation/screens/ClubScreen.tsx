import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useManagedClub, useGameStore, useCurrentStanding } from '../store/gameStore'
import { TrainingType, TrainingIntensity } from '../../domain/enums'
import { TrainingProjectsCard } from '../components/club/TrainingProjectsCard'
import { TrainingSection } from '../components/club/TrainingSection'
import { EkonomiTab } from '../components/club/EkonomiTab'
import { KlubbTab } from '../components/club/KlubbTab'
import { AkademiTab } from '../components/club/AkademiTab'

// ── Main Screen ──────────────────────────────────────────────────────────────

type ClubTab = 'training' | 'ekonomi' | 'klubb' | 'akademi'

export function ClubScreen() {
  const club = useManagedClub()
  const game = useGameStore(s => s.game)
  const setTraining = useGameStore(s => s.setTraining)
  const activateCommunity = useGameStore(s => s.activateCommunity)
  const upgradeAcademy = useGameStore(s => s.upgradeAcademy)
  const promoteYouthPlayer = useGameStore(s => s.promoteYouthPlayer)
  const assignMentor = useGameStore(s => s.assignMentor)
  const removeMentor = useGameStore(s => s.removeMentor)
  const loanOutPlayer = useGameStore(s => s.loanOutPlayer)
  const recallLoan = useGameStore(s => s.recallLoan)
  const startTrainingProject = useGameStore(s => s.startTrainingProject)
  const cancelTrainingProject = useGameStore(s => s.cancelTrainingProject)
  const seekSponsor = useGameStore(s => s.seekSponsor)
  const setTransferBudget = useGameStore(s => s.setTransferBudget)
  const buyScoutRounds = useGameStore(s => s.buyScoutRounds)
  const standing = useCurrentStanding()
  const navigate = useNavigate()
  const location = useLocation()
  const VALID_TABS: ClubTab[] = ['training', 'ekonomi', 'klubb', 'akademi']
  const rawTab = (location.state as { tab?: string } | null)?.tab
  const [activeTab, setActiveTab] = useState<ClubTab>(
    rawTab && VALID_TABS.includes(rawTab as ClubTab) ? (rawTab as ClubTab) : 'training'
  )

  if (!club || !game) return null

  const training = game.managedClubTraining ?? { type: TrainingType.Physical, intensity: TrainingIntensity.Normal }

  const history = game.trainingHistory ?? []
  const recentSessions = history.length > 0
    ? history.slice(-3).reverse().map(session => {
        const inboxItem = game.inbox.find(item =>
          item.type === 'training' && item.body.includes(`Omgång ${session.roundNumber}`)
        )
        const injuryCount = inboxItem ? (inboxItem.body.split('⚠️').length - 1) : 0
        return { roundNumber: session.roundNumber, focus: session.focus, injuryCount }
      })
    : undefined

  const trainingInjuriesThisSeason = game.inbox.filter(item =>
    item.type === 'training' && item.body.includes('⚠️')
  ).reduce((sum, item) => sum + (item.body.split('⚠️').length - 1), 0)

  const TAB_LABELS: { key: ClubTab; label: string }[] = [
    { key: 'training', label: 'Träning' },
    { key: 'ekonomi', label: 'Ekonomi' },
    { key: 'klubb', label: 'Klubb' },
    { key: 'akademi', label: 'Akademi' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0',
        flexShrink: 0,
      }}>
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === key ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 90px' }}>

        {/* ── Tab 1: Träning ── */}
        {activeTab === 'training' && (
          <>
            <TrainingProjectsCard
              projects={game.trainingProjects ?? []}
              onStart={(type, intensity) => startTrainingProject(type, intensity)}
              onCancel={(id) => cancelTrainingProject(id)}
            />
            <TrainingSection
              focus={training}
              recentSessions={recentSessions}
              trainingInjuriesThisSeason={trainingInjuriesThisSeason}
              onChangeFocus={setTraining}
            />
          </>
        )}

        {/* ── Tab 2: Ekonomi ── */}
        {activeTab === 'ekonomi' && (
          <EkonomiTab club={club} game={game} seekSponsor={seekSponsor} activateCommunity={activateCommunity} setTransferBudget={setTransferBudget} buyScoutRounds={buyScoutRounds} />
        )}

        {/* ── Tab 3: Klubb ── */}
        {activeTab === 'klubb' && (
          <KlubbTab club={club} game={game} standing={standing} navigate={navigate} />
        )}

        {/* ── Tab 4: Akademi ── */}
        {activeTab === 'akademi' && (
          <AkademiTab
            club={club}
            game={game}
            upgradeAcademy={upgradeAcademy}
            promoteYouthPlayer={promoteYouthPlayer}
            assignMentor={assignMentor}
            removeMentor={removeMentor}
            loanOutPlayer={loanOutPlayer}
            recallLoan={recallLoan}
          />
        )}

      </div>
    </div>
  )
}
