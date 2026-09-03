import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { PlayoffRound } from '../../../domain/enums'
import type { AnslagKey } from '../../../domain/services/anslagService'
import { pickAnslagVariant, getAnslagData, isClubDirektkvalad } from '../../../domain/services/anslagService'
import { IllustrationScene } from '../illustration/IllustrationScene'
import { playoffRoundDefinite } from '../../../domain/roundLabel'
import { Overlay } from '../primitives/Overlay'

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
    // PT-8 (2026-07-18): samma bugg som M66e fixade i anslagService.ts (triggern)
    // men INTE här (renderingen) — hårdkodat roundNumber===1 hittade aldrig en
    // direktkvalad klubbs (bye till kvarten) faktiska första cupmatch, som ligger
    // på roundNumber 2. Anslaget visades (triggern var fixad) men {vsLabel}/
    // {motståndare} förblev outfyllda för dessa klubbar. Samma isClubDirektkvalad-
    // logik som triggern använder.
    const firstRoundForClub = bracket && club ? (isClubDirektkvalad(bracket, club.id) ? 2 : 1) : 1
    const round1Fixture = game.fixtures.find(f =>
      f.isCup && f.roundNumber === firstRoundForClub &&
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

  // Template-variable resolution for playoff elimination anslag.
  //
  // A2 (långspelsaudit, 10 säsonger, 2026-08-17): {motståndare}/{resultat} rendrades
  // ALLTID bokstavligt för playoff_eliminated_* — två rotorsaker, båda fixade här:
  //   1. Denna substitution låg tidigare EFTER `finalBody`-beräkningen (som var en
  //      `const`) — så `variantBody`-omtilldelningen nådde aldrig rendern, oavsett
  //      om eliminatingSeries hittades eller ej. Flyttad hit, före finalBody.
  //   2. Substitutionen härledde motståndare/resultat ur game.playoffBracket vid
  //      RENDER-tillfället, vilket kräver att bracket fortfarande innehåller den
  //      avgörande serien intakt. Läser nu primärt game.lastPlayoffElimination —
  //      resolved EN gång i playoffProcessor.ts, samma stund inbox-raden för
  //      elimineringen skapas (se PlayoffEliminationInfo i Playoff.ts). Bracket-
  //      härledningen finns kvar som fallback för sparfiler från innan detta fält
  //      fanns (en pågående elimineringsanslag utan lastPlayoffElimination satt).
  // HIGH 5 (2026-08-29): bestämd form ur roundLabel.ts — samma uppslag som
  // resten av UI:t, bara ett annat kasus.
  const getPlayoffRoundLabel = (round: PlayoffRound) => playoffRoundDefinite(round)
  if (anslagKey.startsWith('playoff_eliminated_')) {
    const info = game.lastPlayoffElimination
    if (info) {
      variantBody = variantBody
        .replace(/{motståndare}/g, info.opponentName)
        .replace(/{rond}/g, getPlayoffRoundLabel(info.round))
        .replace(/{resultat}/g, info.resultat)
    } else {
      // Fallback för sparfiler äldre än lastPlayoffElimination-fältet.
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
        variantBody = variantBody
          .replace(/{motståndare}/g, opponent?.shortName ?? opponent?.name ?? 'motståndaren')
          .replace(/{rond}/g, getPlayoffRoundLabel(eliminatingSeries.round))
          .replace(/{resultat}/g, lastFixture ? `${lastFixture.homeScore}–${lastFixture.awayScore}` : '')
      }
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

  const isWinner = anslagKey === 'cup_done_winner'

  return (
    <Overlay
      onClose={onDismiss}
      ariaLabel={anslag.chapter}
      maxWidth={320}
      zIndex={300}
      backdropStyle={{ background: 'var(--anslag-backdrop)', padding: '40px 28px', cursor: 'pointer' }}
      contentStyle={{ background: 'transparent' }}
    >
      <div className={`anslag-card${isWinner ? ' winner' : ''}`}>
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
        <button type="button" className="anslag-cta" onClick={onDismiss}>Tryck för att fortsätta</button>
      </div>
    </Overlay>
  )
}
