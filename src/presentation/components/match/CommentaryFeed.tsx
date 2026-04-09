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

function generateMatchSummary(
  home: number, away: number, managedIsHome: boolean, steps: MatchStep[],
  game: SaveGame | null, _fixture: Fixture,
): string {
  const myScore = managedIsHome ? home : away
  const theirScore = managedIsHome ? away : home
  const totalGoals = home + away
  const margin = myScore - theirScore
  const allEvents = steps.flatMap(s => s.events)
  const goals = allEvents.filter(e => e.type === MatchEventType.Goal)

  // Hitta målskyttar
  const scorerCounts: Record<string, number> = {}
  const scorerNames: Record<string, string> = {}
  goals.forEach(e => {
    if (e.playerId) {
      scorerCounts[e.playerId] = (scorerCounts[e.playerId] ?? 0) + 1
      const p = game?.players.find(pl => pl.id === e.playerId)
      scorerNames[e.playerId] = p ? p.lastName : 'Okänd'
    }
  })
  // Kolla vändning (trailed at halftime)
  const htStep = steps.find(s => s.step === 30)
  const htHome = htStep?.homeScore ?? 0
  const htAway = htStep?.awayScore ?? 0
  const myHt = managedIsHome ? htHome : htAway
  const theirHt = managedIsHome ? htAway : htHome
  const wasComeback = myScore > theirScore && myHt < theirHt

  // Sent avgörande (mål efter minut 55)
  const lateGoals = goals.filter(e => (e.minute ?? 0) >= 55)
  const lateDecider = lateGoals.length > 0 && Math.abs(myScore - theirScore) <= 1

  // Alla målskyttar sorterade
  const allScorers = Object.entries(scorerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([pid, n]) => ({ name: scorerNames[pid] ?? 'Okänd', n }))

  function scorerSummary(): string | null {
    if (allScorers.length === 0) return null
    if (allScorers.length === 1 && allScorers[0].n === 1) return `${allScorers[0].name} satte det enda målet.`
    if (allScorers.length === 1) return `${allScorers[0].name} svarade för samtliga ${allScorers[0].n} mål.`
    const top = allScorers[0]
    if (top.n >= 3) return `${top.name} dominerade målprotokollen med ${top.n} mål. ${allScorers.slice(1, 3).map(s => `${s.name} (${s.n})`).join(', ')} stod för resten.`
    if (top.n === 2) {
      const rest = allScorers.slice(1).map(s => s.name).join(', ')
      return `${top.name} sköt två. Övriga mål: ${rest}.`
    }
    return allScorers.slice(0, 4).map(s => `${s.name} (${s.n})`).join(', ') + '.'
  }

  // Bygg sammanfattning
  const lines: string[] = []

  if (myScore > theirScore) {
    if (wasComeback) {
      lines.push(`Laget låg under i paus men vände och tog hem det till ${myScore}–${theirScore}. En mental prestation lika mycket som en teknisk.`)
    } else if (margin >= 4) {
      lines.push(`Stormatch. ${myScore}–${theirScore} och det var aldrig i närheten av en dramatisk avslutning.`)
      if (totalGoals >= 10) lines.push(`${totalGoals} mål totalt — en fest för alla som var på planen.`)
    } else if (margin >= 2) {
      lines.push(`Kontrollerad seger, ${myScore}–${theirScore}. Laget tog täten och höll den.`)
    } else if (lateDecider) {
      lines.push(`Nervpirrande till det sista. Avgörandet kom sent och slutade ${myScore}–${theirScore}.`)
    } else {
      lines.push(`Knapp seger, ${myScore}–${theirScore}. Jämnt länge men laget hade den avgörande kvaliteten när det gällde.`)
    }
  } else if (myScore < theirScore) {
    if (margin <= -4) {
      lines.push(`Tungt. ${myScore}–${theirScore} och motståndarna visade varför de är ett hot. Det fanns sällan svar på deras press.`)
    } else if (margin <= -2) {
      lines.push(`${myScore}–${theirScore}. Motståndarna var ett snäpp bättre i de flesta delar av spelet — det syntes i slutresultatet.`)
    } else if (myHt > theirHt) {
      lines.push(`Ledde i paus men tappade greppet i andra halvlek. Slutade ${myScore}–${theirScore} — ett resultat som svider mer än siffran visar.`)
    } else if (lateDecider) {
      lines.push(`Länge jämnt, men ett sent mål fällde avgörandet till motståndarnas fördel. ${myScore}–${theirScore}.`)
    } else {
      lines.push(`${myScore}–${theirScore}. Motståndarna var starkare idag — det är svårt att säga något annat.`)
    }
  } else {
    if (totalGoals >= 8) {
      lines.push(`Målfest och rättvis poängdelning, ${myScore}–${theirScore}. ${totalGoals} mål och publiken var med hela vägen.`)
    } else if (totalGoals === 0) {
      lines.push(`Mållöst kryss. Båda lagen var defensivt solida men offensivt utan genomslag.`)
    } else if (lateDecider) {
      lines.push(`Utjämning sent höll kryss vid liv — ${myScore}–${theirScore}. Poängen känns rimlig.`)
    } else {
      lines.push(`Rättvis poängdelning, ${myScore}–${theirScore}. Båda lagen hade sina perioder.`)
    }
  }

  // Halvtidsbild om den berättar något
  if (myScore !== theirScore && !wasComeback) {
    if (myHt === theirHt && myHt > 0) lines.push(`I paus stod det ${myHt}–${myHt}.`)
    else if (Math.abs(myHt - theirHt) >= 2) lines.push(`Halvtidsläge ${myHt}–${theirHt} speglade det som hände i andra halvlek.`)
  }

  // Målskyttar
  const sc = scorerSummary()
  if (sc) lines.push(sc)

  return lines.join(' ')
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
        const summary = generateMatchSummary(home, away, managedIsHome ?? false, displayedSteps, game, fixture)
        return (
          <div style={{ padding: '0 12px 8px' }}>
            <div className="card-sharp" style={{
              padding: '14px 16px', textAlign: 'center',
              margin: '8px 0',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Domaren blåser av!
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                {summary}
              </p>
            </div>
            <button
              onClick={onNavigateToReview}
              className="texture-leather"
              style={{
                width: '100%', padding: '16px', margin: '8px 0',
                background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))',
                color: 'var(--text-light)',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
                letterSpacing: '2px', textTransform: 'uppercase',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
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

