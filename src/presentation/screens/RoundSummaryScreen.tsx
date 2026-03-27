import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export function RoundSummaryScreen() {
  const navigate = useNavigate()
  const roundSummary = useGameStore(s => s.roundSummary)
  const clearRoundSummary = useGameStore(s => s.clearRoundSummary)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!roundSummary) {
      navigate('/game/dashboard', { replace: true })
    }
  }, [roundSummary, navigate])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  if (!roundSummary) return null

  const {
    round, date, temperature,
    matchPlayed, matchResult, matchScorers,
    communityStandingBefore, communityStandingAfter, communityStandingChanges,
    financesBefore, financesAfter,
    injuries, newInboxCount,
    youthMatchResult,
  } = roundSummary

  const financesDelta = financesAfter - financesBefore
  const csDelta = communityStandingAfter - communityStandingBefore

  function formatFinances(n: number) {
    const abs = Math.abs(n)
    const sign = n > 0 ? '+' : n < 0 ? '-' : ''
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} mkr`
    return `${sign}${Math.round(abs / 1_000)} tkr`
  }

  function communityColor(cs: number) {
    if (cs > 70) return '#4CAF50'
    if (cs > 50) return '#FFC107'
    if (cs > 30) return '#FF9800'
    return '#f44336'
  }

  const formattedDate = (() => {
    const d = new Date(date)
    return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })
  })()

  const tempDisplay = temperature !== undefined
    ? `${temperature > 0 ? '+' : ''}${temperature}°`
    : null

  const baseTransition = 'opacity 0.4s ease'
  const sectionStyle = (delay: string): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transition: baseTransition,
    transitionDelay: delay,
    marginBottom: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: '14px 16px',
  })

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: 1.5,
    opacity: 0.45,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 8,
  }

  function handleContinue() {
    clearRoundSummary()
    navigate('/game/dashboard', { replace: true })
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0D1B2A',
      color: '#F0F4F8',
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        padding: '20px 20px 14px',
        borderBottom: '1px solid #1e3450',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        flexShrink: 0,
      }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: '#4A6080', textTransform: 'uppercase', marginBottom: 4 }}>
          SAMMANFATTNING
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F0F4F8', letterSpacing: 2 }}>
          Omgång {round}
        </h1>
        <p style={{ fontSize: 13, color: '#8A9BB0', marginTop: 4 }}>
          {formattedDate}
          {tempDisplay && (
            <span style={{ marginLeft: 8, color: temperature !== undefined && temperature <= 0 ? '#60a5fa' : '#8A9BB0' }}>
              {temperature !== undefined && temperature <= -5 ? '❄️ ' : ''}{tempDisplay}
            </span>
          )}
        </p>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px', paddingBottom: 120 }}>

        {/* MATCHEN */}
        {matchPlayed && (
          <div style={sectionStyle('0s')}>
            <div style={labelStyle}>MATCHEN</div>
            {matchResult && (
              <div style={{ fontSize: 17, fontWeight: 800, color: '#C9A84C', marginBottom: 6, letterSpacing: 0.5 }}>
                {matchResult}
              </div>
            )}
            {matchScorers && matchScorers.length > 0 && (
              <div style={{ fontSize: 13, color: '#8A9BB0' }}>
                {matchScorers.join(' · ')}
              </div>
            )}
            {!matchResult && (
              <div style={{ fontSize: 13, color: '#8A9BB0' }}>Match spelad</div>
            )}
          </div>
        )}

        {/* ORTEN */}
        <div style={sectionStyle('0.1s')}>
          <div style={labelStyle}>ORTEN</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏘️</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: communityColor(communityStandingAfter) }}>
              {communityStandingAfter}
            </span>
            {csDelta !== 0 && (
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: csDelta > 0 ? '#4CAF50' : '#f44336',
              }}>
                {csDelta > 0 ? `+${csDelta}` : `${csDelta}`}
              </span>
            )}
            <span style={{ fontSize: 13, color: '#8A9BB0' }}>
              ({communityStandingBefore} → {communityStandingAfter})
            </span>
          </div>
          {/* Progress bar with animated fill */}
          <div style={{ marginTop: 8, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: communityColor(communityStandingAfter),
              borderRadius: 3,
              width: visible ? `${communityStandingAfter}%` : `${communityStandingBefore}%`,
              transition: 'width 0.8s ease 0.3s',
            }} />
          </div>
          {communityStandingChanges.map((ch, i) => (
            <div key={i} style={{ fontSize: 12, color: ch.delta > 0 ? '#4CAF50' : '#f44336', marginTop: 6 }}>
              {ch.delta > 0 ? '↑' : '↓'} {ch.reason} ({ch.delta > 0 ? '+' : ''}{ch.delta})
            </div>
          ))}
        </div>

        {/* AKADEMIN */}
        {youthMatchResult && (
          <div style={sectionStyle('0.2s')}>
            <div style={labelStyle}>AKADEMIN</div>
            <div style={{ fontSize: 13, color: '#8A9BB0' }}>
              🎓 P17: {youthMatchResult}
            </div>
          </div>
        )}

        {/* EKONOMI */}
        <div style={sectionStyle('0.3s')}>
          <div style={labelStyle}>EKONOMI</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: financesAfter < 0 ? '#f44336' : '#F0F4F8' }}>
              {(() => {
                const abs = Math.abs(financesAfter)
                return abs >= 1_000_000
                  ? `${(financesAfter / 1_000_000).toFixed(1)} mkr`
                  : `${Math.round(financesAfter / 1_000)} tkr`
              })()}
            </span>
            <span style={{
              fontSize: 14,
              fontWeight: 600,
              color: financesDelta >= 0 ? '#4CAF50' : '#f44336',
            }}>
              {formatFinances(financesDelta)}
            </span>
          </div>
        </div>

        {/* HÄNDELSER */}
        {(injuries.length > 0 || newInboxCount > 0) && (
          <div style={sectionStyle('0.4s')}>
            <div style={labelStyle}>HÄNDELSER</div>
            {injuries.map((inj, i) => (
              <div key={i} style={{ fontSize: 13, color: '#f59e0b', marginBottom: 4 }}>
                🩹 {inj}
              </div>
            ))}
            {newInboxCount > 0 && (
              <div style={{ fontSize: 13, color: '#8A9BB0', marginTop: injuries.length > 0 ? 8 : 0 }}>
                📬 {newInboxCount} nya meddelanden i inkorgen
              </div>
            )}
          </div>
        )}

      </div>

      {/* Fixed bottom: Fortsätt button */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        padding: '12px 20px',
        paddingBottom: 'calc(12px + var(--safe-bottom, 0px))',
        background: 'linear-gradient(to top, #0D1B2A 80%, transparent)',
        zIndex: 50,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        transitionDelay: '0.5s',
      }}>
        <button
          onClick={handleContinue}
          style={{
            width: '100%',
            padding: '17px',
            background: '#C9A84C',
            color: '#0D1B2A',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            border: 'none',
            boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
            cursor: 'pointer',
          }}
        >
          Fortsätt →
        </button>
      </div>
    </div>
  )
}
