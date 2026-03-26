import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

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
  color: '#4A6080',
  marginBottom: 10,
}

const CARD_STYLE: React.CSSProperties = {
  background: '#0e1f33',
  border: '1px solid #1e3450',
  borderRadius: 12,
  padding: '16px',
}

const BODY_STYLE: React.CSSProperties = {
  fontSize: 14,
  color: '#F0F4F8',
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
  const weeklyWages = Math.round(totalSalary / 4)

  const activeSponsors = (game.sponsors ?? []).filter(s => s.contractRounds > 0)
  const avgSponsorIncome = activeSponsors.length > 0
    ? Math.round(activeSponsors.reduce((sum, s) => sum + s.weeklyIncome, 0))
    : 0
  const weeklyIncome = Math.round(club.reputation * 150) + avgSponsorIncome
  const netPerRound = weeklyIncome - weeklyWages

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
      background: 'rgba(6,14,25,0.97)',
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
            textTransform: 'uppercase', color: '#C9A84C', marginBottom: 6,
          }}>
            EKONOMI
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F4F8' }}>
            Budget & ekonomi
          </h1>
          <p style={{ fontSize: 14, color: '#8A9BB0', marginTop: 4 }}>{club.name}</p>
        </div>

        {/* Klubbkassa */}
        <div style={CARD_STYLE}>
          <p style={LABEL_STYLE}>Klubbkassa</p>
          <div style={ROW_STYLE}>
            <span style={{ ...BODY_STYLE, color: '#8A9BB0' }}>Saldo</span>
            <span style={{
              fontSize: 20, fontWeight: 800,
              color: club.finances >= 0 ? '#22c55e' : '#ef4444',
            }}>
              {formatMoney(club.finances)}
            </span>
          </div>
          <div style={{
            borderTop: '1px solid #1e3450',
            paddingTop: 10,
            marginTop: 4,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={ROW_STYLE}>
              <span style={{ fontSize: 13, color: '#8A9BB0' }}>Intäkter / omgång</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>
                +{formatMoney(weeklyIncome)}
              </span>
            </div>
            <div style={ROW_STYLE}>
              <span style={{ fontSize: 13, color: '#8A9BB0' }}>Lönekostnader / omgång</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>
                -{formatMoney(weeklyWages)}
              </span>
            </div>
            <div style={{
              ...ROW_STYLE,
              borderTop: '1px solid #1e3450',
              paddingTop: 8,
              marginTop: 2,
            }}>
              <span style={{ fontSize: 13, color: '#8A9BB0' }}>Netto / omgång</span>
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: netPerRound >= 0 ? '#22c55e' : '#ef4444',
              }}>
                {netPerRound >= 0 ? '+' : ''}{formatMoney(netPerRound)}
              </span>
            </div>
          </div>
        </div>

        {/* Transferbudget */}
        <div style={CARD_STYLE}>
          <p style={LABEL_STYLE}>Transferbudget</p>
          <div style={ROW_STYLE}>
            <span style={{ ...BODY_STYLE, color: '#8A9BB0' }}>Avsatt budget</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#C9A84C' }}>
              {formatMoney(currentTransferBudget)}
            </span>
          </div>

          {sliderDisabled ? (
            <p style={{ fontSize: 13, color: '#ef4444', marginTop: 6 }}>
              Kassan är negativ — transferbudget kan inte sättas just nu.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 8, marginTop: 4 }}>
                Sätt avsatt transferbudget
              </p>
              <input
                type="range"
                min={0}
                max={Math.round(sliderMax / 10000) * 10000}
                step={10000}
                value={currentTransferBudget}
                onChange={e => setPendingTransferBudget(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#C9A84C', marginBottom: 12 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#4A6080' }}>0 tkr</span>
                <span style={{ fontSize: 12, color: '#4A6080' }}>{formatMoney(Math.round(sliderMax / 10000) * 10000)}</span>
              </div>
              <button
                onClick={handleSaveTransferBudget}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: savedFeedback ? 'rgba(34,197,94,0.15)' : 'rgba(201,168,76,0.12)',
                  border: `1px solid ${savedFeedback ? '#22c55e' : 'rgba(201,168,76,0.35)'}`,
                  borderRadius: 8,
                  color: savedFeedback ? '#22c55e' : '#C9A84C',
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

          <p style={{ fontSize: 12, color: '#4A6080', marginTop: 10, lineHeight: 1.5 }}>
            Transferbudget räknas aldrig av kassan förrän ett köp görs.
          </p>
        </div>

        {/* Scouting */}
        <div style={CARD_STYLE}>
          <p style={LABEL_STYLE}>Scouting</p>
          <div style={ROW_STYLE}>
            <span style={{ ...BODY_STYLE, color: '#8A9BB0' }}>Scoutronder kvar</span>
            <span style={{
              fontSize: 20, fontWeight: 800,
              color: scoutBudget > 5 ? '#C9A84C' : scoutBudget > 0 ? '#F0F4F8' : '#ef4444',
            }}>
              {scoutBudget}
            </span>
          </div>

          {scoutMaxReached && (
            <p style={{ fontSize: 13, color: '#8A9BB0', marginBottom: 10 }}>
              Max antal scoutronder uppnått (30).
            </p>
          )}

          <button
            onClick={handleBuyScoutRounds}
            disabled={!canBuyScout}
            style={{
              width: '100%',
              padding: '12px',
              background: canBuyScout ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${canBuyScout ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8,
              color: canBuyScout ? '#C9A84C' : '#4A6080',
              fontSize: 14,
              fontWeight: 700,
              cursor: canBuyScout ? 'pointer' : 'not-allowed',
              marginTop: 4,
            }}
          >
            Köp 5 scoutronder — 15 tkr
          </button>

          {club.finances < 15000 && !scoutMaxReached && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>
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
            border: '1px solid #1e3450',
            borderRadius: 12,
            color: '#8A9BB0',
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
