import type { RefObject } from 'react'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { MatchWeather } from '../../../domain/entities/Weather'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { MatchEventType, WeatherCondition } from '../../../domain/enums'
import { eventIcon } from '../../utils/formatters'
import { getEventAlignment } from '../../screens/matchLiveHelpers'
import { SnowOverlay } from './SnowOverlay'

interface CommentaryFeedProps {
  displayedSteps: MatchStep[]
  currentMatchStep: MatchStep | null
  matchWeather?: MatchWeather
  liveSubs: { outId: string; inId: string; minute: number }[]
  fixture: Fixture
  game: SaveGame | null
  feedRef: RefObject<HTMLDivElement | null>
  matchDone?: boolean
  managedIsHome?: boolean
  onNavigateToReview?: () => void
}

function generateMatchSummary(home: number, away: number, managedIsHome: boolean, steps: MatchStep[]): string {
  const myScore = managedIsHome ? home : away
  const theirScore = managedIsHome ? away : home
  const totalGoals = home + away
  const margin = myScore - theirScore

  if (myScore > theirScore) {
    if (margin >= 3) return `Dominant insats från start till slut. ${totalGoals} mål totalt — publiken fick valuta för pengarna.`
    if (totalGoals >= 8) return `Vild match med ${totalGoals} mål. Offensivt spel som kunde gått åt båda hållen.`
    if (margin === 1) return `Jämn match som avgjordes sent. Nerverna höll hela vägen.`
    return `Kontrollerad seger. Laget visade mognad i de avgörande lägena.`
  }
  if (myScore < theirScore) {
    if (margin <= -3) return `Motståndarna dominerade från start. Mycket att jobba med inför nästa.`
    if (margin === -1) return `Nära men inte nog. Laget skapade chanser men saknade skärpa framför mål.`
    return `Motståndarna var starkare idag. Laget kämpade men det räckte inte.`
  }
  if (totalGoals >= 6) return `Målrikt kryss — ${totalGoals} mål och drama från båda sidor.`
  if (totalGoals === 0) return `Mållöst. Båda lagen var defensivt stabila men saknade den sista gnistan.`
  // steps param available for future use
  void steps
  return `Rättvis poängdelning. Båda lagen hade sina perioder.`
}

export function CommentaryFeed({
  displayedSteps,
  currentMatchStep,
  matchWeather,
  liveSubs,
  fixture,
  game,
  feedRef,
  matchDone,
  managedIsHome,
  onNavigateToReview,
}: CommentaryFeedProps) {
  const background = (() => {
    if (!currentMatchStep) return undefined
    const step = currentMatchStep
    const hasSusp = step.activeSuspensions.homeCount > 0 || step.activeSuspensions.awayCount > 0
    if (hasSusp) return 'rgba(176,80,64,0.03)'
    const isLateAndTight = step.minute >= 55 && Math.abs(step.homeScore - step.awayScore) <= 1
    if (isLateAndTight) return 'rgba(196,122,58,0.04)'
    const recentSteps = displayedSteps.slice(-5)
    const recentHomeShots = recentSteps.length > 1
      ? (recentSteps[recentSteps.length - 1]?.shotsHome ?? 0) - (recentSteps[0]?.shotsHome ?? 0)
      : 0
    const recentAwayShots = recentSteps.length > 1
      ? (recentSteps[recentSteps.length - 1]?.shotsAway ?? 0) - (recentSteps[0]?.shotsAway ?? 0)
      : 0
    if (recentHomeShots >= 3 && recentAwayShots === 0) return 'rgba(196,122,58,0.03)'
    if (recentAwayShots >= 3 && recentHomeShots === 0) return 'rgba(126,179,212,0.03)'
    if (matchWeather?.weather.condition === WeatherCondition.Fog) return 'linear-gradient(to bottom, rgba(200,210,220,0.04), transparent)'
    if (matchWeather?.weather.condition === WeatherCondition.Thaw) return 'rgba(100,130,160,0.03)'
    return undefined
  })()

  return (
    <div
      ref={feedRef}
      style={{
        flex: 1, overflowY: 'auto', padding: '8px 0', position: 'relative',
        background,
        transition: 'background 2s ease',
      }}
    >
      {matchWeather?.weather.condition === WeatherCondition.HeavySnow && <SnowOverlay />}
      {matchDone && (() => {
        const lastStep = displayedSteps[displayedSteps.length - 1]
        const home = lastStep?.homeScore ?? 0
        const away = lastStep?.awayScore ?? 0
        const summary = generateMatchSummary(home, away, managedIsHome ?? false, displayedSteps)
        return (
          <div style={{ padding: '0 12px 8px' }}>
            <div style={{
              padding: '12px 16px', textAlign: 'center',
              borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
              margin: '8px 0',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Domaren blåser av!
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, margin: '4px 0 0' }}>
                {summary}
              </p>
            </div>
            <button
              onClick={onNavigateToReview}
              style={{
                width: '100%', padding: '14px', margin: '8px 0',
                background: 'var(--accent)', color: 'var(--bg)',
                border: 'none', borderRadius: 0, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.02em',
              }}
            >
              Se sammanfattning →
            </button>
          </div>
        )
      })()}
      {[...displayedSteps].reverse().flatMap((s, idx) => {
        const hasGoal = s.events.some(e => e.type === MatchEventType.Goal)
        const hasSuspension = s.events.some(e => e.type === MatchEventType.RedCard)
        const hasCorner = s.events.some(e => e.type === MatchEventType.Corner) && !hasGoal
        const hasYellow = s.events.some(e => e.type === MatchEventType.YellowCard)
        const isDerby = s.isDerbyComment || s.commentary.toLowerCase().includes('derby')
        const hasCornerGoal = s.events.some(e => e.type === MatchEventType.Goal && e.isCornerGoal)

        let borderLeft = 'none'
        let background = 'transparent'
        let fontSize = 13
        let fontWeight: number | string = 400
        let color = 'var(--text-secondary)'
        let paddingLeft = 16
        let boxShadow: string | undefined = undefined

        if (hasGoal) {
          background = 'rgba(196, 122, 58, 0.12)'
          borderLeft = '3px solid var(--accent)'
          fontSize = 14
          fontWeight = 600
          color = 'var(--accent)'
          paddingLeft = 12
          boxShadow = 'inset 3px 0 0 var(--accent)'
        } else if (hasSuspension) {
          borderLeft = '3px solid var(--danger)'
          color = 'var(--danger)'
          fontWeight = 500
        } else if (hasYellow) {
          borderLeft = '3px solid var(--warning)'
          color = 'var(--text-primary)'
        } else if (hasCorner) {
          borderLeft = '3px solid rgba(196,122,58,0.4)'
          color = 'var(--text-primary)'
          fontWeight = 500
        } else if (isDerby) {
          borderLeft = '3px solid rgba(220,80,30,0.7)'
          paddingLeft = 8
        }

        const primaryEvent = s.events.find(e =>
          e.type === MatchEventType.Goal || e.type === MatchEventType.RedCard ||
          e.type === MatchEventType.YellowCard || e.type === MatchEventType.Save ||
          e.type === MatchEventType.Corner
        )
        const icon = primaryEvent ? eventIcon(primaryEvent.type) : ''

        const sidedEvent = s.events.find(e =>
          (e.type === MatchEventType.Goal || e.type === MatchEventType.RedCard) && e.clubId
        )
        const isAwayEvent = sidedEvent ? getEventAlignment(sidedEvent.clubId, fixture.homeClubId) === 'away' : false

        const rows: React.ReactNode[] = [
          <div
            key={idx}
            style={{
              display: 'flex', alignItems: 'flex-start',
              flexDirection: isAwayEvent ? 'row-reverse' : 'row',
              padding: `8px 16px 8px ${paddingLeft}px`,
              borderLeft: isAwayEvent ? 'none' : borderLeft,
              borderRight: isAwayEvent ? borderLeft : 'none',
              background, gap: 8,
              animation: 'fadeInUp 250ms ease-out both',
              boxShadow: isAwayEvent ? (boxShadow ? boxShadow.replace('inset 3px', 'inset -3px') : undefined) : boxShadow,
              textAlign: isAwayEvent ? 'right' : 'left',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28, paddingTop: 1, flexShrink: 0 }}>
              {s.minute}'
            </span>
            {icon && <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>}
            <span style={{ fontSize, fontWeight, color, lineHeight: 1.4 }}>
              {hasCornerGoal ? `📐 HÖRNMÅL! ${s.commentary}` : s.commentary}
            </span>
          </div>
        ]

        s.events.filter(e => e.type === MatchEventType.Substitution).forEach((e, si) => {
          rows.push(
            <div
              key={`htsub-${idx}-${si}`}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '6px 16px', gap: 8,
                borderLeft: '3px solid rgba(196,122,58,0.35)',
                animation: 'fadeInUp 250ms ease-out both',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28, flexShrink: 0 }}>{e.minute}'</span>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🔄</span>
              <span style={{ fontSize: 13, color: 'var(--accent)' }}>{e.description.replace('🔄 ', '')}</span>
            </div>
          )
        })

        liveSubs.filter(ls => ls.minute === s.minute).forEach((ls, si) => {
          const inPlayer = game?.players.find(p => p.id === ls.inId)
          const outPlayer = game?.players.find(p => p.id === ls.outId)
          const inName = inPlayer ? `${inPlayer.firstName} ${inPlayer.lastName}` : '?'
          const outName = outPlayer ? `${outPlayer.firstName} ${outPlayer.lastName}` : '?'
          rows.push(
            <div
              key={`livesub-${idx}-${si}`}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '6px 16px', gap: 8,
                borderLeft: '3px solid rgba(196,122,58,0.35)',
                animation: 'fadeInUp 250ms ease-out both',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28, flexShrink: 0 }}>{ls.minute}'</span>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🔄</span>
              <span style={{ fontSize: 13, color: 'var(--accent)' }}>{inName} IN för {outName}</span>
            </div>
          )
        })

        return rows
      })}
    </div>
  )
}

