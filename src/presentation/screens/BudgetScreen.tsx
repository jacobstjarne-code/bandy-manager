import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { calcWeeklyEconomy } from '../../domain/services/economyService'

function formatMoney(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} mkr`
  return `${sign}${Math.round(abs / 1_000)} tkr`
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 10,
}

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '16px',
}

const BODY_STYLE: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-primary)',
}

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
}

export function BudgetScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const setTransferBudget = useGameStore(s => s.setTransferBudget)
  const buyScoutRounds = useGameStore(s => s.buyScoutRounds)

  const club = game?.clubs.find(c => c.id === game.managedClubId)

  const [pendingTransferBudget, setPendingTransferBudget] = useState<number | null>(null)
  const [savedFeedback, setSavedFeedback] = useState(false)

  if (!game || !club) {
    navigate('/game', { replace: true })
    return null
  }

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const totalSalary = managedPlayers.reduce((sum, p) => sum + (p.salary ?? 0), 0)
  const { weeklyIncome, weeklyWages, netPerRound } = calcWeeklyEconomy(
    club.reputation,
    game.sponsors ?? [],
    game.communityActivities,
    totalSalary,
  )

  const currentTransferBudget = pendingTransferBudget ?? club.transferBudget
  const sliderMax = club.finances > 0 ? Math.min(club.finances * 0.5, club.finances) : 0
  const sliderDisabled = club.finances <= 0

  function handleSaveTransferBudget() {
    setTransferBudget(currentTransferBudget)
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 1800)
  }

  const scoutBudget = game.scoutBudget ?? 0
  const canBuyScout = club.finances >= 15000 && scoutBudget < 30
  const scoutMaxReached = scoutBudget >= 30

  function handleBuyScoutRounds() {
    if (!canBuyScout) return
    buyScoutRounds()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 20px',
      zIndex: 500,
      overflowY: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: 390,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6,
          }}>
            EKONOMI
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>
            Budget & ekonomi
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{club.name}</p>
        </div>

        {/* Klubbkassa */}
        <div style={CARD_STYLE}>
          <p style={LABEL_STYLE}>Klubbkassa</p>
          <div style={ROW_STYLE}>
            <span style={{ ...BODY_STYLE, color: 'var(--text-secondary)' }}>Saldo</span>
            <span style={{
              fontSize: 20, fontWeight: 800,
              color: club.finances >= 0 ? 'var(--success)' : 'var(--danger)',
            }}>
              {formatMoney(club.finances)}
            </span>
          </div>
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 10,
            marginTop: 4,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={ROW_STYLE}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Intäkter / omgång</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                +{formatMoney(weeklyIncome)}
              </span>
            </div>
            <div style={ROW_STYLE}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Lönekostnader / omgång</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>
                -{formatMoney(weeklyWages)}
              </span>
            </div>
            <div style={{
              ...ROW_STYLE,
              borderTop: '1px solid var(--border)',
              paddingTop: 8,
              marginTop: 2,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Netto / omgång</span>
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: netPerRound >= 0 ? 'var(--success)' : 'var(--danger)',
              }}>
                {netPerRound >= 0 ? '+' : ''}{formatMoney(netPerRound)}
              </span>
            </div>
          </div>
        </div>

        {/* Arena */}
        {club.arenaCapacity != null && (
          <div style={CARD_STYLE}>
            <p style={LABEL_STYLE}>Arena</p>
            <div style={ROW_STYLE}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Kapacitet</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {club.arenaCapacity.toLocaleString('sv-SE')} åskådare
              </span>
            </div>
          </div>
        )}

        {/* Transferbudget */}
        <div style={CARD_STYLE}>
          <p style={LABEL_STYLE}>Transferbudget</p>
          <div style={ROW_STYLE}>
            <span style={{ ...BODY_STYLE, color: 'var(--text-secondary)' }}>Avsatt budget</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
              {formatMoney(currentTransferBudget)}
            </span>
          </div>

          {sliderDisabled ? (
            <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 6 }}>
              Kassan är negativ — transferbudget kan inte sättas just nu.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, marginTop: 4 }}>
                Sätt avsatt transferbudget
              </p>
              <input
                type="range"
                min={0}
                max={Math.round(sliderMax / 10000) * 10000}
                step={10000}
                value={currentTransferBudget}
                onChange={e => setPendingTransferBudget(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)', marginBottom: 12 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>0 tkr</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatMoney(Math.round(sliderMax / 10000) * 10000)}</span>
              </div>
              <button
                onClick={handleSaveTransferBudget}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: savedFeedback ? 'rgba(34,197,94,0.15)' : 'rgba(196,122,58,0.12)',
                  border: `1px solid ${savedFeedback ? 'var(--success)' : 'rgba(196,122,58,0.35)'}`,
                  borderRadius: 8,
                  color: savedFeedback ? 'var(--success)' : 'var(--accent)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {savedFeedback ? 'Sparat!' : 'Spara transferbudget'}
              </button>
            </>
          )}

          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
            Transferbudget räknas aldrig av kassan förrän ett köp görs.
          </p>
        </div>

        {/* Scouting */}
        <div style={CARD_STYLE}>
          <p style={LABEL_STYLE}>Scouting</p>
          <div style={ROW_STYLE}>
            <span style={{ ...BODY_STYLE, color: 'var(--text-secondary)' }}>Scoutronder kvar</span>
            <span style={{
              fontSize: 20, fontWeight: 800,
              color: scoutBudget > 5 ? 'var(--accent)' : scoutBudget > 0 ? 'var(--text-primary)' : 'var(--danger)',
            }}>
              {scoutBudget}
            </span>
          </div>

          {scoutMaxReached && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
              Max antal scoutronder uppnått (30).
            </p>
          )}

          <button
            onClick={handleBuyScoutRounds}
            disabled={!canBuyScout}
            style={{
              width: '100%',
              padding: '12px',
              background: canBuyScout ? 'rgba(196,122,58,0.12)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${canBuyScout ? 'rgba(196,122,58,0.35)' : 'var(--border)'}`,
              borderRadius: 8,
              color: canBuyScout ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 700,
              cursor: canBuyScout ? 'pointer' : 'not-allowed',
              marginTop: 4,
            }}
          >
            Köp 5 scoutronder — 15 tkr
          </button>

          {club.finances < 15000 && !scoutMaxReached && (
            <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>
              Otillräckligt saldo (kräver 15 tkr).
            </p>
          )}
        </div>

        {/* Tillbaka */}
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: 4,
            padding: '14px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 12,
            color: 'var(--text-secondary)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Tillbaka
        </button>
      </div>
    </div>
  )
}
