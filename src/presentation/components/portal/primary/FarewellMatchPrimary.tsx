import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { getFarewellMatchPlayer } from '../../../../domain/services/retirementService'

/**
 * B2 (2026-07-19): primärkort för avskedsmatchdagen. Ceremonin byggdes i
 * pool 2 (MatchLaddningScene, FAREWELL_MATCH_ATMOSPHERE/KLACK) gated på
 * samma getFarewellMatchPlayer-signal som coffeeRoomService redan räknar
 * — men portalen varnade aldrig att ögonblicket kommer. Warm-tier
 * (primary-weight-2), inte gold: en avskedsmatch är inte en trofé-ceremoni.
 *
 * Undertexten ({player.lastName}s sista hemmamatch) är strukturell
 * (namn + fakta), inte narrativ — ingen placeholder-mekanism finns här,
 * det narrativa har sedan D4-regressionsfixen (2026-07-21) en egen yta:
 * FAREWELL_MATCH_STRINGS i kafferummet (coffeeRoomService.ts), samma
 * getFarewellMatchPlayer-signal som detta kortet.
 */
export function FarewellMatchPrimary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const managedId = game.managedClubId

  const nextFixture = game.fixtures
    .filter(f => f.status === 'scheduled' && (f.homeClubId === managedId || f.awayClubId === managedId))
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null

  if (!nextFixture) return null

  const farewellPlayer = getFarewellMatchPlayer(game, nextFixture)
  if (!farewellPlayer) return null

  const roundDateStr = nextFixture.date ?? ''
  const matchDate = roundDateStr ? new Date(roundDateStr) : null
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const DAYS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
  const dateStr = matchDate
    ? `${DAYS[matchDate.getDay()]} ${matchDate.getDate()} ${MONTHS[matchDate.getMonth()]}`
    : ''

  return (
    <div className="primary-card primary-weight-2" data-primary-card="true" style={{ borderRadius: 8, padding: '14px 16px', marginBottom: 14 }}>
      <div className="primary-eyebrow">🎽 AVSKEDSMATCH · IMORGON</div>
      <div className="h-display-sm" style={{ color: 'var(--text-light)', marginBottom: 6 }}>
        {farewellPlayer.firstName} {farewellPlayer.lastName}s sista hemmamatch
      </div>
      <div style={{
        fontSize: 12,
        color: 'var(--text-light-secondary)',
        lineHeight: 1.5,
        marginBottom: 10,
      }}>
        {dateStr}
      </div>
      <button
        onClick={() => navigate('/game/match')}
        className="btn btn-outline"
        style={{ width: '100%', marginTop: 12 }}
      >
        Sätt lineup →
      </button>
    </div>
  )
}
