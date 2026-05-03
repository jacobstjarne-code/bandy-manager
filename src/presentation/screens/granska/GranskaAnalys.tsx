import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import { csColor, formatFinance } from '../../utils/formatters'
import { SectionLabel } from '../../components/SectionLabel'
import { generateCoachQuote } from '../../../domain/services/assistantCoachService'

interface GranskaAnalysProps {
  game: SaveGame
  fixture: Fixture | undefined
  isHome: boolean
  won: boolean
  lost: boolean
  myScore: number
  theirScore: number
  potm: Player | null
  standing: { clubId: string; position: number } | undefined
  standingBefore: number | null
  financesDelta: number
  csDelta: number
  cs: number
}

export function GranskaAnalys({ game, fixture, isHome, won, lost, myScore, theirScore, potm, standing, standingBefore, financesDelta, csDelta, cs }: GranskaAnalysProps) {
  const coach = game.assistantCoach
  const coachItem = game.inbox
    .filter(i => i.tone === 'coach')
    .sort((a, b) => b.date.localeCompare(a.date))[0]

  return (
    <>
      {coach && (() => {
        const quote = coachItem?.body ?? (coach ? generateCoachQuote(coach, {
          type: 'match-result',
          result: won ? 'win' : lost ? 'loss' : 'draw',
          score: `${myScore}–${theirScore}`,
        }) : null)
        if (!quote) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--accent)', height: 22, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{coach.initials}</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: '#fff' }}>{coach.name.toUpperCase()} · ASSISTENTTRÄNARE</span>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                "{quote}"
              </p>
            </div>
          </div>
        )
      })()}

      {/* Consequences */}
      {standing && (
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
          <SectionLabel style={{ marginBottom: 8 }}>KONSEKVENSER</SectionLabel>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tabellplacering</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {standingBefore && standingBefore !== standing.position
                ? `${standingBefore} → ${standing.position}`
                : `${standing.position}:a`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ekonomi denna omgång</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: financesDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatFinance(financesDelta)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Bygdens puls</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: csColor(cs) }}>
              {csDelta !== 0 ? `${csDelta > 0 ? '+' : ''}${csDelta} → ${cs}` : `${cs}`}
            </span>
          </div>
        </div>
      )}

      {/* Form players */}
      {fixture?.report && (() => {
        const ratings = fixture.report.playerRatings
        const managedLineup = isHome ? fixture.homeLineup : fixture.awayLineup
        const starterIds = managedLineup?.startingPlayerIds ?? []
        const best = starterIds
          .map(id => ({ id, r: ratings[id] ?? 0 }))
          .sort((a, b) => b.r - a.r)
          .slice(0, 3)
        const worst = starterIds
          .map(id => ({ id, r: ratings[id] ?? 0 }))
          .sort((a, b) => a.r - b.r)
          .slice(0, 1)

        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 8 }}>FORMSPELARE</SectionLabel>
            {best.map(({ id, r }) => {
              const p = game.players.find(pl => pl.id === id)
              if (!p) return null
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.firstName[0]}. {p.lastName}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)', color: r >= 7 ? 'var(--success)' : 'var(--text-primary)' }}>{r.toFixed(1)}</span>
                </div>
              )
            })}
            {worst.map(({ id, r }) => {
              const p = game.players.find(pl => pl.id === id)
              if (!p || r >= 5.5) return null
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Svagaste länken: {p.firstName[0]}. {p.lastName}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: 'var(--danger)' }}>{r.toFixed(1)}</span>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Key insights */}
      {fixture?.report && (() => {
        const insights: string[] = []
        const shots = isHome ? fixture.report.shotsHome : fixture.report.shotsAway
        const goals = myScore
        const conversion = shots > 0 ? goals / shots : 0
        if (conversion > 0.5) insights.push(`Effektivt anfallsspel — ${Math.round(conversion * 100)}% målkonvertering.`)
        else if (shots > 0 && conversion < 0.15) insights.push(`Ineffektivt framåt — ${shots} skott gav bara ${goals} mål.`)
        const myCorners = isHome ? fixture.report.cornersHome : fixture.report.cornersAway
        if (myCorners >= 8) insights.push(`Kontinuerligt hörnstryck — ${myCorners} hörnor under matchen.`)
        const potmPlayer = potm
        if (potmPlayer) insights.push(`${potmPlayer.firstName} ${potmPlayer.lastName} utsågs till matchens bästa spelare.`)
        if (won && (myScore - theirScore) >= 3) insights.push('En klar seger som styrker lagets nuvarande form.')
        if (lost && (theirScore - myScore) >= 3) insights.push('En tungt förlust att analysera grundligt.')
        if (insights.length === 0) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 8 }}>NYCKELINSIKTER</SectionLabel>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7 }}>
              {insights.map((ins, i) => (
                <li key={i} style={{ color: 'var(--text-secondary)' }}>{ins}</li>
              ))}
            </ul>
          </div>
        )
      })()}
    </>
  )
}
