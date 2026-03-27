import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { playSound } from '../audio/soundEffects'

export function RoundSummaryScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const roundSummary = useGameStore(s => s.roundSummary)
  const clearRoundSummary = useGameStore(s => s.clearRoundSummary)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!roundSummary) navigate('/game/dashboard', { replace: true })
  }, [roundSummary, navigate])

  const soundsPlayed = useRef(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!roundSummary || soundsPlayed.current) return
    soundsPlayed.current = true
    const csDelta = (roundSummary.communityStandingAfter ?? 0) - (roundSummary.communityStandingBefore ?? roundSummary.communityStandingAfter ?? 0)
    if (csDelta > 0) setTimeout(() => playSound('communityUp'), 400)
    else if (csDelta < 0) setTimeout(() => playSound('communityDown'), 400)
    if (roundSummary.youthMatchResult?.includes('vann')) setTimeout(() => playSound('youthGoal'), 600)
    if (roundSummary.injuries && roundSummary.injuries.length > 0 && (roundSummary.communityStandingAfter ?? 50) < 20)
      setTimeout(() => playSound('crisis'), 800)
  }, [roundSummary])

  if (!roundSummary || !game) return null

  const {
    round, date, temperature,
    matchPlayed, matchResult, matchScorers,
    communityStandingBefore, communityStandingAfter, communityStandingChanges,
    financesBefore, financesAfter,
    injuries, newInboxCount,
    youthMatchResult,
  } = roundSummary

  const financesDelta = financesAfter - financesBefore
  const csDelta = communityStandingAfter - (communityStandingBefore ?? communityStandingAfter)

  const trainingFocus = game.managedClubTraining
  const activeProjects = (game.trainingProjects ?? []).filter(p => p.status === 'active')
  const loanDeals = game.loanDeals ?? []

  function fmt(n: number) {
    const abs = Math.abs(n)
    const sign = n > 0 ? '+' : n < 0 ? '-' : ''
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} mkr`
    return `${sign}${Math.round(abs / 1_000)} tkr`
  }

  function fmtAbs(n: number) {
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mkr`
    return `${Math.round(n / 1_000)} tkr`
  }

  function csColor(cs: number) {
    if (cs > 70) return '#22c55e'
    if (cs > 50) return '#C9A84C'
    if (cs > 30) return '#f59e0b'
    return '#ef4444'
  }

  const formattedDate = new Date(date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })

  const LABEL: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
    textTransform: 'uppercase', color: '#4A6080', marginBottom: 4,
  }

  function TappableCard({ label, summary, detail, onClick, accent }: {
    label: string; summary: React.ReactNode; detail?: React.ReactNode
    onClick?: () => void; accent?: string
  }) {
    return (
      <div onClick={onClick} style={{
        background: '#0e1f33', border: '1px solid #1e3450', borderRadius: 12,
        padding: '14px 16px', marginBottom: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        cursor: onClick ? 'pointer' : 'default',
      }}>
        <div style={{ flex: 1 }}>
          <div style={LABEL}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: accent ?? '#F0F4F8' }}>{summary}</div>
          {detail && <div style={{ fontSize: 12, color: '#8A9BB0', marginTop: 3 }}>{detail}</div>}
        </div>
        {onClick && <span style={{ fontSize: 18, color: '#4A6080' }}>›</span>}
      </div>
    )
  }

  function handleContinue() {
    const pendingCount = game?.pendingEvents?.length ?? 0
    clearRoundSummary()
    navigate(pendingCount > 0 ? '/game/events' : '/game/dashboard', { replace: true })
  }

  const trainingLabel: Record<string, string> = {
    skating: 'Skridskoåkning', ballControl: 'Bollkontroll', passing: 'Passning',
    shooting: 'Skott', defending: 'Försvar', cornerPlay: 'Hörnor',
    physical: 'Fysik', tactical: 'Taktik', recovery: 'Återhämtning', matchPrep: 'Matchförberedelse',
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0D1B2A', color: '#F0F4F8' }}>
      {/* Header */}
      <div style={{
        textAlign: 'center', padding: '20px 20px 14px', borderBottom: '1px solid #1e3450',
        opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease', flexShrink: 0,
      }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: '#4A6080', textTransform: 'uppercase', marginBottom: 4 }}>
          OMGÅNG {round}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>{formattedDate}</h1>
        {temperature !== undefined && (
          <p style={{ fontSize: 13, color: temperature <= 0 ? '#60a5fa' : '#8A9BB0', marginTop: 4 }}>
            {temperature <= -5 ? '❄️ ' : temperature <= 0 ? '🌨 ' : '🌤 '}{temperature > 0 ? '+' : ''}{temperature}°C
          </p>
        )}
      </div>

      {/* Scrollable cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: 120, opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease 0.1s' }}>
        {matchPlayed ? (
          <TappableCard
            label="MATCHEN"
            summary={matchResult ?? 'Match spelad'}
            detail={matchScorers?.join(' · ')}
            accent="#C9A84C"
            onClick={() => navigate('/game/match-result')}
          />
        ) : (
          <TappableCard label="MATCHEN" summary="Ingen match denna omgång" accent="#4A6080" />
        )}

        <TappableCard
          label="TRÄNING"
          summary={trainingLabel[trainingFocus?.type ?? ''] ?? 'Okänt fokus'}
          detail={activeProjects.length > 0 ? `${activeProjects.length} aktiva projekt` : 'Inga aktiva projekt'}
          onClick={() => navigate('/game/club')}
        />

        {youthMatchResult && (
          <TappableCard label="AKADEMIN P17" summary={youthMatchResult} onClick={() => navigate('/game/club')} />
        )}

        {loanDeals.length > 0 && (
          <TappableCard
            label="UTLÅNADE"
            summary={`${loanDeals.length} spelare på lån`}
            detail={loanDeals.map(d => d.destinationClubName).join(', ')}
            onClick={() => navigate('/game/squad')}
          />
        )}

        <TappableCard
          label="ORTEN"
          summary={
            <span>
              Lokalstöd: <span style={{ color: csColor(communityStandingAfter) }}>{communityStandingAfter}</span>
              {csDelta !== 0 && (
                <span style={{ color: csDelta > 0 ? '#22c55e' : '#ef4444', fontSize: 12, marginLeft: 6 }}>
                  {csDelta > 0 ? `+${csDelta}` : csDelta}
                </span>
              )}
            </span>
          }
          detail={communityStandingChanges?.map((c: any) => c.reason).join(' · ') || undefined}
          onClick={() => navigate('/game/club')}
        />

        <TappableCard
          label="EKONOMI"
          summary={fmtAbs(financesAfter)}
          detail={financesDelta !== 0 ? fmt(financesDelta) + ' denna omgång' : undefined}
          accent={financesAfter < 0 ? '#ef4444' : '#F0F4F8'}
          onClick={() => navigate('/game/budget')}
        />

        {injuries.length > 0 && (
          <TappableCard
            label="SKADOR"
            summary={`${injuries.length} ny${injuries.length > 1 ? 'a' : ''} skada`}
            detail={injuries.join(' · ')}
            accent="#ef4444"
            onClick={() => navigate('/game/squad')}
          />
        )}

        {newInboxCount > 0 && (
          <TappableCard label="INKORG" summary={`${newInboxCount} nya meddelanden`} onClick={() => navigate('/game/inbox')} />
        )}
      </div>

      {/* Fixed bottom button */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, padding: '12px 20px',
        paddingBottom: 'calc(12px + var(--safe-bottom, 0px))',
        background: 'linear-gradient(to top, #0D1B2A 80%, transparent)',
        zIndex: 50, opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease 0.3s',
      }}>
        <button onClick={handleContinue} style={{
          width: '100%', padding: '17px', background: '#C9A84C', color: '#0D1B2A',
          borderRadius: 12, fontSize: 16, fontWeight: 800, letterSpacing: '1.5px',
          textTransform: 'uppercase', border: 'none',
          boxShadow: '0 4px 20px rgba(201,168,76,0.3)', cursor: 'pointer',
        }}>
          Fortsätt →
        </button>
      </div>
    </div>
  )
}
