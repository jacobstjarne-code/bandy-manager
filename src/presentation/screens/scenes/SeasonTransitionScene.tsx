/**
 * SeasonTransitionScene — "Sommaren". 5.1 (SLUTTEST_KO.md, 2026-08-18).
 * Underlag: CODE_INSTRUKTION_SOMMAREN_2026-08-17.md, variant 1e (låst),
 * mock: docs/incoming/Sommaren-sasongsovergangen-2026-08-17.dc.html.
 * Pixel-värden från mocken. Justera inte.
 *
 * Mellan årsboken och första matchen, säsong 2+. Inga beslut, bara rytm —
 * passerbar på två sekunder men väger något (Jacobs egen brief).
 */
import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { ClubExpectation, FixtureStatus } from '../../../domain/enums'
import { deriveMatchTypeAxes } from '../../../domain/services/matchTypeAxes'
import { getBurnoutZone } from '../../../domain/services/managerProfileService'
import { seasonStartYear } from '../../../domain/utils/seasonYear'
import { BoardObjectivesList } from '../../components/portal/secondary/BoardObjectivesList'
import { getSeasonGoalOffers, type SeasonGoalOffer } from '../../../domain/services/seasonGoalService'
import {
  deriveEpokLine, deriveWonTitleLastSeason, deriveWorsePlacementOrEarlierExit,
  deriveSommarLine, selectAwayEventLines, deriveIsPlayoffUnlikely, deriveTandLine,
  deriveSeasonRoundCount, deriveEyebrowLabel, deriveCtaButtonText,
} from '../../../domain/services/seasonTransitionService'

const NOISE_OVERLAY = 'repeating-linear-gradient(92deg, rgba(255,255,255,.014) 0 2px, transparent 2px 7px)'

export function SeasonTransitionScene() {
  const game = useGameStore(s => s.game)
  const passSeasonTransition = useGameStore(s => s.passSeasonTransition)
  const navigate = useNavigate()

  if (!game) return null

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub) return null

  // Återinträdesguard (Jacobs DOM, 2026-08-18): Sommaren är passerad exakt
  // när seasonGoalChosenForSeason === currentSeason. Se fältets kommentar
  // i SaveGame.ts — O3 tar över samma fält, bygger ingen egen "sedd"-flagga.
  if (game.seasonGoalChosenForSeason === game.currentSeason) {
    return <Navigate to="/game/dashboard" replace />
  }

  const seasonCount = game.trainerArc?.seasonCount ?? 1
  const recentSummaries = game.seasonSummaries ?? []
  const lastSeason = recentSummaries[recentSummaries.length - 1]

  const epokLine = deriveEpokLine({
    seasonCount,
    clubName: managedClub.name,
    wonTitleLastSeason: deriveWonTitleLastSeason(lastSeason),
    worsePlacementOrEarlierExit: deriveWorsePlacementOrEarlierExit(recentSummaries),
  })

  const burnoutZone = getBurnoutZone(game.managerProfile?.burnoutScore ?? 0)
  const sommarLine = deriveSommarLine(burnoutZone)
  const awayEventLines = selectAwayEventLines(game.pendingSeasonTransitionEvents ?? [])

  const isPlayoffUnlikely = deriveIsPlayoffUnlikely(
    managedClub.boardExpectation === ClubExpectation.AvoidBottom,
    lastSeason?.playoffResult === 'didNotQualify',
  )
  const roundCount = deriveSeasonRoundCount(game.clubs.length)

  const nextFixture = game.fixtures
    .filter(f => f.status === FixtureStatus.Scheduled && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => a.matchday - b.matchday)[0]

  const opponentId = nextFixture ? (nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId) : undefined
  const opponent = opponentId ? game.clubs.find(c => c.id === opponentId) : undefined
  const axes = nextFixture ? deriveMatchTypeAxes(nextFixture, game.managedClubId, game.playoffBracket ?? null) : null

  const opponentName = opponent?.name ?? '?'
  const eyebrowLabel = axes ? deriveEyebrowLabel({ tavlingstyp: axes.tavlingstyp, skede: axes.skede, roundNumber: nextFixture.roundNumber, opponentName }) : ''
  const ctaText = axes ? deriveCtaButtonText({ tavlingstyp: axes.tavlingstyp, skede: axes.skede, roundNumber: nextFixture.roundNumber, opponentName }) : 'FORTSÄTT →'
  const tandLine = deriveTandLine(opponentName, isPlayoffUnlikely)

  const objectives = game.boardObjectives ?? []
  const visibleObjectiveCount = Math.min(objectives.filter(o => o.status !== 'met').length, 2)
  const hiddenObjectiveCount = objectives.filter(o => o.status !== 'met').length - visibleObjectiveCount

  // O3 (DOM_EGET_SASONGSMAL_2026-08-17.md) — spelarens eget säsongsmål,
  // valt här och bara här ("enda gången i spelet spelaren har överblick och
  // inte är mitt i något"). Tre-läges state: undefined = ingen interaktion
  // ännu (inget visuellt förvalt), 'none' = spelaren valde explicit "Inget
  // särskilt i år", ett SeasonGoalOffer = ett riktigt mål valt. undefined
  // och 'none' ger samma slutresultat i passSeasonTransition (inget mål
  // registreras) — SeasonGoalType saknar idag en egen 'none'-variant, så ett
  // explicit avstående går inte att skilja från ingen interaktion i
  // historiken (se HistoryScreen.tsx). Känt, avsiktligt gap.
  const [selectedGoal, setSelectedGoal] = useState<SeasonGoalOffer | 'none' | undefined>(undefined)
  const goalOffers = getSeasonGoalOffers(game)

  function handleContinue() {
    passSeasonTransition(
      selectedGoal && selectedGoal !== 'none'
        ? { type: selectedGoal.type, referenceId: selectedGoal.referenceId, trackedPlayerIds: selectedGoal.trackedPlayerIds }
        : undefined
    )
    navigate('/game/dashboard', { replace: true })
  }

  return (
    <div style={{ background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Kapitel-header — svalt, stilla, tittar bakåt */}
      <div style={{
        background: 'radial-gradient(ellipse at 50% -10%, color-mix(in srgb, var(--accent) 26%, var(--bg-dark)), var(--bg-dark) 70%)',
        padding: '24px 18px 20px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: NOISE_OVERLAY }} />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--copper)', marginBottom: 9, fontFamily: 'var(--font-body)' }}>
            ☀ Sommaren {seasonStartYear(game.currentSeason)}
          </div>
          <div className="h-scene-epok" style={{ marginBottom: 14 }}>
            {epokLine}
          </div>
          <div className="h-quote" style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.5, maxWidth: 250, margin: '0 auto' }}>
            {sommarLine}
          </div>
        </div>
      </div>

      {/* 2. Paper-kropp — tre andetag, sakliga mål */}
      <div style={{ padding: 13, display: 'flex', flexDirection: 'column', gap: 11, background: 'var(--bg)' }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
            Medan du var borta
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {awayEventLines.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, transform: 'translateY(-2px)' }} />
                <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>{line}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        <div>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            Styrelsen har satt nya mål
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 8 }}>
            De minns förra året, men de bryr sig mest om nästa.
          </div>
          {visibleObjectiveCount > 0 && (
            // Browser-verifierat (2026-08-18): BoardObjectivesList/.obj-row-*
            // (stalvallen-portal.css) är byggd uteslutande för mörk värd —
            // .obj-row-label/.obj-progress-value läser --text-light (#F5F1EB)
            // rakt av, aldrig satt om av komponenten själv eftersom Portal/
            // ArrivalScene alltid ger den ett mörkt kort. Sommarens paper-kropp
            // är den FÖRSTA ljusa värden — texten blev i praktiken osynlig
            // (nästan-vitt på nästan-vitt). Fixen skopar om --text-light/
            // --text-light-secondary till de ljusa värdens motsvarigheter för
            // just detta underträd via CSS custom properties — komponentens
            // egen logik/klasser är orörda, ordern ("bygg ingen egen variant")
            // hålls bokstavligt.
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
              ['--text-light' as string]: 'var(--text-primary)',
              ['--text-light-secondary' as string]: 'var(--text-secondary)',
            }}>
              <BoardObjectivesList objectives={objectives} max={2} />
            </div>
          )}
          {hiddenObjectiveCount > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
              +{hiddenObjectiveCount} till
            </div>
          )}
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* O3 — säsongens eget mål. Enda beslutet i Sommaren, avsiktligt. */}
        <div data-season-goal-picker="true">
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            Ditt mål
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 8 }}>
            Styrelsen har sitt. Vad vill du?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...goalOffers.map(o => ({ key: o.type, offer: o as SeasonGoalOffer | 'none', text: o.choiceText })),
              { key: 'none', offer: 'none' as const, text: 'Inget särskilt i år. Vi ser vad som händer.' }]
              .map(({ key, offer, text }) => {
                const isSelected = offer === 'none' ? selectedGoal === 'none' : selectedGoal !== 'none' && selectedGoal?.type === offer.type
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedGoal(offer)}
                    data-season-goal-option={key}
                    data-selected={isSelected}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      background: isSelected ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'var(--border)'}`,
                      fontSize: 12, color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--accent)' : 'transparent',
                    }} />
                    {text}
                  </button>
                )
              })}
          </div>
        </div>
      </div>

      {/* 3. Horisont-block, varmt — säsongsvägen, tändraden, CTA */}
      <div style={{ background: 'var(--bg-dark)', padding: '16px 15px 15px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: NOISE_OVERLAY }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--copper)', textAlign: 'center', marginBottom: 13, fontFamily: 'var(--font-body)' }}>
            Säsongen framför dig
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
            <RoadNode emoji="🏆" label="Cupen" sub="nu" lit />
            <RoadConnector lit />
            <RoadNode emoji="🏒" label="Serien" sub={`${roundCount} omg`} />
            <RoadConnector />
            <RoadNode emoji="⚔️" label="Slutspel" sub="i mars" />
          </div>

          <div className="h-quote" style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.45, marginBottom: 12 }}>
            {tandLine}
          </div>

          {eyebrowLabel && (
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--copper)', textAlign: 'center', marginBottom: 7, fontFamily: 'var(--font-body)' }}>
              {eyebrowLabel}
            </div>
          )}
          <button onClick={handleContinue} className="btn btn-cta btn-primary">
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  )
}

function RoadNode({ emoji, label, sub, lit }: { emoji: string; label: string; sub: string; lit?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: 70, opacity: lit ? 1 : 0.5 }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: lit ? 'linear-gradient(180deg, var(--copper), var(--copper-deep))' : 'var(--bg-leather)',
        border: lit ? 'none' : '1px solid rgba(255,255,255,.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: lit ? 15 : 14,
        boxShadow: lit ? '0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
      }}>
        {emoji}
      </div>
      <div style={{ fontSize: 10, fontWeight: lit ? 700 : 400, color: lit ? 'var(--text-light)' : 'var(--text-light-secondary)', textAlign: 'center', lineHeight: 1.2 }}>
        {label}<br /><span style={{ fontSize: 8, fontWeight: 400, color: lit ? 'var(--copper)' : 'inherit' }}>{sub}</span>
      </div>
    </div>
  )
}

function RoadConnector({ lit }: { lit?: boolean }) {
  return (
    <div style={{
      flex: 1, height: 2, marginTop: 16,
      background: lit ? 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 20%, transparent))' : 'rgba(255,255,255,.1)',
    }} />
  )
}
