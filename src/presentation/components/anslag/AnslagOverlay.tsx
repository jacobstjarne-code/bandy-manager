import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { AnslagKey } from '../../../domain/services/anslagService'
import { pickAnslagVariant, getAnslagData, isClubDirektkvalad } from '../../../domain/services/anslagService'
import { IllustrationScene } from '../illustration/IllustrationScene'

// Anslag som bär en hero-band-illustration (band-läge). Bilden droppas i public/; tills
// dess fallback-gradient + stämpel. Fler anslag (derby, nedflyttning) läggs till här.
const ANSLAG_BAND_IMAGE: Record<string, string> = {
  league_midwinter: 'annandagen',
}

interface AnslagOverlayProps {
  game: SaveGame
  anslagKey: AnslagKey
  onDismiss: () => void
}

export function AnslagOverlay({ game, anslagKey, onDismiss }: AnslagOverlayProps) {
  const anslag = getAnslagData(anslagKey)
  const bracket = game.cupBracket
  const club = game.clubs.find(c => c.id === game.managedClubId)

  let variantBody = pickAnslagVariant(anslag, game.currentSeason, anslagKey, game.managedClubId)

  // Template-variable resolution for cup anslag with {vsLabel} and {motståndare}
  if (anslagKey === 'cup_final_pre') {
    const finalFixture = game.fixtures.find(f =>
      f.isCup && f.roundNumber >= 4 &&
      f.season === game.currentSeason &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (finalFixture) {
      const isHome = finalFixture.homeClubId === game.managedClubId
      const opponentId = isHome ? finalFixture.awayClubId : finalFixture.homeClubId
      const opponent = game.clubs.find(c => c.id === opponentId)
      const vsLabel = isHome ? 'Hemma mot' : 'Borta mot'
      const motståndare = opponent?.shortName ?? opponent?.name ?? 'okänd'
      variantBody = variantBody
        .replace('{vsLabel}', vsLabel)
        .replace('{motståndare}', motståndare)
    }
  }

  if (anslagKey === 'cup_first_match') {
    const round1Fixture = game.fixtures.find(f =>
      f.isCup && f.roundNumber === 1 &&
      f.season === game.currentSeason &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (round1Fixture) {
      const isHome = round1Fixture.homeClubId === game.managedClubId
      const opponentId = isHome ? round1Fixture.awayClubId : round1Fixture.homeClubId
      const opponent = game.clubs.find(c => c.id === opponentId)
      const vsLabel = isHome ? 'Hemma mot' : 'Borta mot'
      const motståndare = opponent?.shortName ?? opponent?.name ?? 'okänd'
      variantBody = variantBody
        .replace('{vsLabel}', vsLabel)
        .replace('{motståndare}', motståndare)
    }
  }

  const isDirektkvalad = anslagKey === 'cup_start' && bracket && club
    ? isClubDirektkvalad(bracket, club.id)
    : false
  const finalBody = variantBody + (
    isDirektkvalad && anslag.bodyDirektkval && club
      ? anslag.bodyDirektkval.replace('{clubName}', club.name)
      : ''
  )

  // Template-variable resolution for playoff elimination anslag
  if (anslagKey.startsWith('playoff_eliminated_')) {
    const allSeries = [
      ...(game.playoffBracket?.quarterFinals ?? []),
      ...(game.playoffBracket?.semiFinals ?? []),
      ...(game.playoffBracket?.final ? [game.playoffBracket.final] : []),
    ]
    const eliminatingSeries = allSeries.find(s =>
      s.loserId === game.managedClubId && s.winnerId !== null
    )
    if (eliminatingSeries) {
      const opponent = game.clubs.find(c => c.id === eliminatingSeries.winnerId)
      const seriesFixtures = eliminatingSeries.fixtures
        .map((fid: string) => game.fixtures.find(f => f.id === fid))
        .filter((f): f is NonNullable<typeof f> => !!f && f.status === 'completed')
      const lastFixture = seriesFixtures.sort((a, b) => b.matchday - a.matchday)[0]
      const getRoundLabel = (round: string) =>
        round === 'quarterFinal' ? 'kvartsfinalen' :
        round === 'semiFinal' ? 'semifinalen' :
        'SM-finalen'
      variantBody = variantBody
        .replace(/{motståndare}/g, opponent?.shortName ?? opponent?.name ?? 'motståndaren')
        .replace(/{rond}/g, getRoundLabel(eliminatingSeries.round))
        .replace(/{resultat}/g, lastFixture ? `${lastFixture.homeScore}–${lastFixture.awayScore}` : '')
    }
  }

  const isWinner = anslagKey === 'cup_done_winner'

  return (
    <div className="anslag-overlay" onClick={onDismiss}>
      <div className={`anslag-card${isWinner ? ' winner' : ''}`} onClick={e => e.stopPropagation()}>
        {ANSLAG_BAND_IMAGE[anslagKey] && (
          <IllustrationScene
            mode="band"
            name={ANSLAG_BAND_IMAGE[anslagKey]}
            fadeTo="var(--bg-portal-surface)"
            style={{ height: 140, margin: '-28px -24px 20px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
          />
        )}
        <div className="anslag-chapter">{anslag.chapter}</div>
        <div
          className="anslag-text"
          dangerouslySetInnerHTML={{ __html: finalBody }}
        />
        <div className="anslag-cta" onClick={onDismiss}>Tryck för att fortsätta</div>
      </div>
    </div>
  )
}
