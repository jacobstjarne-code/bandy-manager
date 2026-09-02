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
import { BOARD_EXPECTATION_LEVEL_LABEL } from '../../../domain/services/boardService'
import type { BoardAssessment, BoardLeagueMovement } from '../../../domain/entities/SaveGame'
import { ordinal } from '../../utils/formatters'
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

  // H6 (människoupplevelse-audit 7024f8a, 2026-08-24): "Säsong tre kallades
  // 'Din andra säsong'". Rotorsak: trainerArc.seasonCount räknas upp FÖRST
  // vid säsongsSLUT (seasonEndProcessor.ts, checkSeasonEndArc — 0-indexerat,
  // "antal AVSLUTADE säsonger") — vid övergången till säsong 2 är den alltså
  // 1, inte 2, och deriveEpokVariant()s "seasonCount===2 → sasong2"-gren
  // (som förväntar sig "ordningen på säsongen SOM KOMMER") missar den
  // övergången och slår till en säsong FÖR SENT. managerProfile.seasonsAtClub
  // är samma fält ClubScreen.tsx/TranareTab.tsx redan använder (kommentar i
  // ClubScreen.tsx, AUDIT DEL 3 2026-08-11) — startar på 1 (spelarens
  // FÖRSTA säsong) och räknas upp i SAMMA season-end-anrop, med rätt
  // semantik för "vilken säsong är det här". En sanning, inte tre.
  const seasonCount = game.managerProfile?.seasonsAtClub ?? 1
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
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

        {game.boardAssessment && (
          <BoardTalksSection assessment={game.boardAssessment} />
        )}

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
              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden',
              ['--text-light' as string]: 'var(--text-primary)',
              ['--text-light-secondary' as string]: 'var(--text-secondary)',
            }}>
              {/* 5.1 fynd 5 (SLUTTEST_KO.md, alt. a): "Framsteg X/Y" mot ett nyss
                  återställt mål motsäger rubriken ovan ("nya mål") — döljs här. */}
              <BoardObjectivesList objectives={objectives} max={2} hideProgress />
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

/**
 * Förutsättningsfasen (Jacobs dom 2026-08-25, docs/incoming/
 * Forutsattningsfasen-styrelsen-talar-2026-08-25.dc.html, variant 1b).
 * "Styrelsen talar" — ordförandeband + kvittensrad + kravband (ribba,
 * riktning, skälsrad) + steg 2:s högst tre kanoniskt belagda ligarörelser.
 * Ingen egen beräkning här — game.boardAssessment är redan färdigt från
 * seasonEndProcessor.ts.
 *
 * Skälsraden ligger INUTI kravbandet, under ribban — strukturellt, inte en
 * fotnot. En ny ribba kan inte renderas utan sin rad (stänger H1, Skutskär-
 * auditen). "Oförändrad": ingen pil, ingen skälsrad, ingen ramfärg — frånvaron
 * av skäl är korrekt, inte en lucka.
 */
function BoardTalksSection({ assessment }: { assessment: BoardAssessment }) {
  const isRaised = assessment.direction === 'raised'
  const isLowered = assessment.direction === 'lowered'
  const frameColor = isRaised ? 'var(--accent)' : isLowered ? 'var(--ice)' : 'rgba(255,255,255,.06)'
  const arrowColor = isRaised ? 'var(--accent)' : 'var(--ice)'

  return (
    <div>
      {/* Ordförandeband — svalt, samma kromfamilj som kapitel-headern ovan */}
      <div style={{
        background: 'var(--bg-dark)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        padding: '11px 12px 10px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: NOISE_OVERLAY }} />
        <div style={{ position: 'relative', display: 'flex', gap: 9, alignItems: 'center' }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: 'radial-gradient(circle at 35% 30%, #5a5048, #2a251f)',
            border: '1.5px solid var(--border-dark)',
          }} />
          <div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--copper)', marginBottom: 1, fontFamily: 'var(--font-body)' }}>
              Ordföranden
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>
              Styrelsen har sett er säsong
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)', borderTop: 'none',
        borderRadius: '0 0 var(--radius-md) var(--radius-md)', padding: '11px 12px', display: 'flex', flexDirection: 'column', gap: 9,
      }}>
        <div className="h-quote" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          "{assessment.seasonAcknowledgment}"
        </div>

        {assessment.leagueMovements && assessment.leagueMovements.length > 0 && (
          <div>
            <div className="h-label" style={{ color: 'var(--accent-deep)', marginBottom: 7 }}>
              Medan ni var borta · serien
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {assessment.leagueMovements.map((movement, index) => (
                <BoardLeagueMovementRow key={`${movement.type}-${index}`} movement={movement} />
              ))}
            </div>
          </div>
        )}

        <div style={{
          background: 'var(--bg-leather)', borderRadius: 'var(--radius-md)', padding: '11px 12px',
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${frameColor} 30%, transparent)`,
        }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--copper)', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
            Vad styrelsen begär i år
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: assessment.reasonLine ? 8 : 0 }}>
            {assessment.direction !== 'unchanged' && (
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-light-secondary)' }}>
                {BOARD_EXPECTATION_LEVEL_LABEL[assessment.previousExpectation]}
              </span>
            )}
            {assessment.direction !== 'unchanged' && (
              <span style={{ color: arrowColor, fontSize: 12 }}>{isRaised ? '↗' : '↘'}</span>
            )}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--text-light)' }}>
              {BOARD_EXPECTATION_LEVEL_LABEL[assessment.newExpectation]}
            </span>
            {assessment.direction === 'unchanged' && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'Georgia' }}>
                — som i fjol
              </span>
            )}
          </div>
          {assessment.reasonLine && (
            <div
              className="h-quote"
              style={{
                fontSize: 11.5, color: 'var(--text-light-secondary)', lineHeight: 1.5,
                borderLeft: `2px solid ${arrowColor}`, paddingLeft: 8,
              }}
            >
              "{assessment.reasonLine}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function formatBoardLeagueMovement(movement: BoardLeagueMovement): string {
  if (movement.type === 'transfer') {
    return `${movement.playerName} flyttade från ${movement.fromClubName} till ${movement.toClubName}.`
  }
  const delta = Math.abs(movement.toPosition - movement.fromPosition)
  const direction = movement.toPosition < movement.fromPosition ? 'upp' : 'ner'
  return `${movement.clubName} slutade ${ordinal(movement.toPosition)} i år, ${delta} platser ${direction} mot i fjol.`
}

function BoardLeagueMovementRow({ movement }: { movement: BoardLeagueMovement }) {
  const isDown = movement.type === 'positionTrend' && movement.toPosition > movement.fromPosition
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
      <span style={{ color: isDown ? 'var(--ice)' : 'var(--accent)', fontSize: 11, flexShrink: 0, transform: 'translateY(1px)' }}>
        {isDown ? '▼' : '▲'}
      </span>
      <div style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
        {formatBoardLeagueMovement(movement)}
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
