import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import type { SpectatorFocusType } from '../../../../domain/data/spectatorPrimaryText'
import { SPECTATOR_PRIMARY_TEXT } from '../../../../domain/data/spectatorPrimaryText'
import { FixtureStatus } from '../../../../domain/enums'

function pickFocus(game: CardRenderProps['game']): { type: SpectatorFocusType; count: number } {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club) return { type: 'trupp', count: 0 }

  const expiringCount = game.players.filter(
    p => club.squadPlayerIds.includes(p.id) && p.contractUntilSeason === game.currentSeason
  ).length
  if (expiringCount > 0) return { type: 'kontrakt', count: expiringCount }

  const readyTalents = (game.youthTeam?.players ?? []).filter(p => p.readyForPromotion === true).length
  if (readyTalents > 0) return { type: 'akademi', count: readyTalents }

  return { type: 'trupp', count: club.squadPlayerIds.length }
}

function pickVariant(type: SpectatorFocusType, seed: number) {
  const pool = SPECTATOR_PRIMARY_TEXT[type]
  return pool[seed % pool.length]
}

export function SpectatorPrimary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const focus = pickFocus(game)
  const seed = game.currentSeason + game.currentMatchday
  const variant = pickVariant(focus.type, seed)

  const plural = focus.count !== 1 ? 'er' : ''
  const body = variant.body
    .replace('{count}', String(focus.count))
    .replace('{plural}', plural)

  const hasScheduled = game.fixtures.some(
    f => f.status === FixtureStatus.Scheduled &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  if (hasScheduled) return null

  const handleCta = () => {
    if (focus.type === 'akademi') navigate('/game/academy')
    else navigate('/game/squad')
  }

  return (
    <div className="portal-spectator-primary card-sharp" data-primary-card="true" style={{ padding: '14px 12px', marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cold, var(--text-muted))', marginBottom: 6 }}>
        {variant.headline}
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.5 }}>
        {body}
      </p>
      <button className="btn btn-outline" style={{ width: '100%', padding: '10px' }} onClick={handleCta}>
        {variant.cta}
      </button>
    </div>
  )
}
