import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import { MatchEventType } from '../../../domain/enums'
import { SectionLabel } from '../../components/SectionLabel'
import { getPortraitSvg } from '../../../domain/services/portraitService'
import { ratingColor } from './helpers'

interface GranskaSpelareProps {
  game: SaveGame
  fixture: Fixture | undefined
  isHome: boolean
  potmId: string | null | undefined
}

export function GranskaSpelare({ game, fixture, isHome, potmId }: GranskaSpelareProps) {
  if (!fixture || !fixture.report) return (
    <div className="card-sharp" style={{ margin: '0 0 6px', padding: '20px 14px', textAlign: 'center' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Spelarbetyg saknas</p>
    </div>
  )

  const myLineup = isHome ? fixture.homeLineup : fixture.awayLineup
  const ratings = fixture.report.playerRatings

  const starterIds = myLineup?.startingPlayerIds ?? []
  const benchIds = myLineup?.benchPlayerIds ?? []
  const captainId = myLineup?.captainPlayerId ?? game.captainPlayerId

  const starters = starterIds
    .map(id => game.players.find(p => p.id === id))
    .filter(Boolean) as Player[]
  starters.sort((a, b) => (ratings[b.id] ?? 0) - (ratings[a.id] ?? 0))

  const bench = benchIds
    .map(id => game.players.find(p => p.id === id))
    .filter(Boolean) as Player[]

  return (
    <>
      <div className="card-sharp" style={{ margin: '0 0 6px', overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border)' }}>
          <SectionLabel>STARTELVA — BETYG</SectionLabel>
        </div>
        {starters.map((p, i) => {
          const r = ratings[p.id] ?? 0
          const isCap = p.id === captainId
          const goals = fixture.events.filter(e => e.type === MatchEventType.Goal && e.playerId === p.id).length
          const assists = fixture.events.filter(e => e.type === MatchEventType.Assist && e.playerId === p.id).length
          const saves = fixture.events.filter(e => e.type === MatchEventType.Save && e.playerId === p.id).length
          const statParts: string[] = []
          if (goals > 0) statParts.push(`${goals} mål`)
          if (assists > 0) statParts.push(`${assists} assist`)
          if (saves > 0) statParts.push(`${saves} räddning${saves > 1 ? 'ar' : ''}`)
          const isPOTM = p.id === potmId

          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px',
              borderBottom: i < starters.length - 1 ? '1px solid var(--border)' : 'none',
              background: isPOTM ? 'rgba(196,122,58,0.06)' : 'transparent',
            }}>
              {/* TODO(FAS 5): byt mot riktig karaktärsillustration · se CHARACTER-BRIEF.md */}
              <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-surface)', border: isCap ? '1.5px solid var(--accent)' : '1px solid var(--border)' }}
                dangerouslySetInnerHTML={{ __html: getPortraitSvg(p.id, p.age, p.position) }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {isCap && <span style={{ marginRight: 2 }}>⭐</span>}
                  {isPOTM && <span style={{ marginRight: 2 }}>🏒</span>}
                  {p.firstName[0]}. {p.lastName}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                  {p.position}{statParts.length > 0 ? ` · ${statParts.join(' · ')}` : ''}
                </p>
              </div>
              <span style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 700, color: ratingColor(r), flexShrink: 0 }}>
                {r > 0 ? r.toFixed(1) : '–'}
              </span>
            </div>
          )
        })}
      </div>

      {bench.length > 0 && (
        <div className="card-sharp" style={{ margin: '0 0 6px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>BÄNKEN</span>
          </div>
          {bench.map((p, i) => {
            const r = ratings[p.id] ?? 0
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: i < bench.length - 1 ? '1px solid var(--border)' : 'none', opacity: 0.7 }}>
                {/* TODO(FAS 5): byt mot riktig karaktärsillustration · se CHARACTER-BRIEF.md */}
                <div style={{ width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  dangerouslySetInnerHTML={{ __html: getPortraitSvg(p.id, p.age, p.position) }} />
                <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{p.firstName[0]}. {p.lastName}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>{r > 0 ? r.toFixed(1) : '–'}</span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
