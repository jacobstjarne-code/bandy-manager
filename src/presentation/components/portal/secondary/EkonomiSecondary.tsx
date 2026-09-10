import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { calcRoundIncome, buildRoundIncomeParamsForNextFixture } from '../../../../domain/services/economyService'
import { formatFinanceAbs } from '../../../utils/formatters'

/** Secondary-kort: kassan + burnrate. */
export function EkonomiSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const managedId = game.managedClubId
  const club = game.clubs.find(c => c.id === managedId)
  const squadPlayers = game.players.filter(p => p.clubId === managedId)
  const standing = game.standings.find(s => s.clubId === managedId)

  const legendSalaryCost = ((game.clubLegends ?? [])
    .filter(l => l.role === 'youth_coach' || l.role === 'scout').length) * 500

  // Preview-mönstret, "samma funktion, samma indata" (2026-08-26): se
  // buildRoundIncomeParamsForNextFixture-kommentaren i economyService.ts.
  const nextFixtureIncomeParams = buildRoundIncomeParamsForNextFixture(game)
  const { netPerRound } = calcRoundIncome({
    club: club!,
    players: squadPlayers,
    sponsors: game.sponsors ?? [],
    communityActivities: game.communityActivities,
    fanMood: game.fanMood ?? 50,
    ...nextFixtureIncomeParams,
    standing: standing ?? null,
    rand: () => 0.5,
    legendSalaryCost,
  })

  const finances = club?.finances ?? 0
  const netSign = netPerRound >= 0 ? '+' : ''
  const netStr = `${netSign}${Math.round(netPerRound / 1000)} tkr/omg`

  return (
    <div
      className="portal-secondary-card"
      onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}
    >
      {/* DOM_POLISH_PORTALHIERARKI_2026-09-10 §1/§3: T3 delar exakt en form —
          detta kortet hade en egen bespoke border/radie/padding, avvikande
          från de nio andra .portal-secondary-card-korten. Kall stripe
          (--cold) matchar mockens 💰 Ekonomi-exempel rakt av. */}
      <span className="portal-card-stripe portal-card-stripe-cold" />
      <div className="portal-card-eyebrow">💰 Kassa</div>
      <div
        className="h-display-sm"
        style={{
          // mörk portal-yta: roll-klassen sätter ingen färg → override krävs
          color: finances < 0 ? 'var(--danger)' : 'var(--text-light)',
          lineHeight: 1.3,  // bevarad (roll-klassens 1.15 avviker; behåll exakt)
        }}
      >
        {formatFinanceAbs(finances)}
      </div>
      <div style={{ fontSize: 9, color: netPerRound >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: 2 }}> {/* ds-exempt: netStr success/danger ternary */}
        {netStr}
      </div>
    </div>
  )
}
