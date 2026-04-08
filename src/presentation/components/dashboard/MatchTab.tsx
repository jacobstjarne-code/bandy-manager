import type { NavigateFunction } from 'react-router-dom'
import type { SaveGame, StandingRow } from '../../../domain/entities/SaveGame'
import type { Club } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { MatchWeather } from '../../../domain/entities/Weather'
import type { PlayoffBracket, PlayoffSeries } from '../../../domain/entities/Playoff'

import { PlayoffStatus } from '../../../domain/enums'
import type { FormResult } from '../../utils/formUtils'
import { OnboardingHint } from './OnboardingHint'
import { PlayoffBanner } from './PlayoffBanner'
import { NextMatchCard } from './NextMatchCard'
import { LastResultCard } from './LastResultCard'
import { PlayoffBracketCard } from './PlayoffBracketCard'
import { CupCard } from './CupCard'
import { DiamondDivider } from './DiamondDivider'
import { DashboardNudges } from './DashboardNudges'
import { FormSquares } from '../FormDots'

interface LastResult {
  scoreFor: number
  scoreAgainst: number
  opponentName: string
}

interface MatchTabProps {
  game: SaveGame
  club: Club
  standing: StandingRow | null
  nextFixture: Fixture | null
  opponent: Club | null
  isHome: boolean
  matchWeather: MatchWeather | undefined
  hasPendingLineup: boolean
  isPlayoffFixture: boolean
  playoffInfo: PlayoffBracket | null
  playoffSeries: PlayoffSeries | null
  dynamicHomeWins: number
  dynamicAwayWins: number
  isPlayoffJustStarted: boolean
  eliminated: boolean
  lastResult: LastResult | null
  lastCompletedFixture: Fixture | null
  recentForm: FormResult[]
  currentRound: number
  currentDateStr: string
  canClickAdvance: boolean
  isBatchSim: boolean
  setIsBatchSim: (v: boolean) => void
  advanceButtonText: string
  canSimulateRemaining: boolean
  remainingOtherFixtures: number
  onAdvance: () => void
  onDismissOnboarding: () => void
  navigate: NavigateFunction
}

export function MatchTab({
  game,
  club,
  standing,
  nextFixture,
  opponent,
  isHome,
  matchWeather,
  hasPendingLineup,
  isPlayoffFixture,
  playoffInfo,
  playoffSeries,
  dynamicHomeWins,
  dynamicAwayWins,
  isPlayoffJustStarted,
  eliminated,
  lastResult,
  lastCompletedFixture,
  recentForm,
  currentRound,
  currentDateStr,
  canClickAdvance,
  isBatchSim,
  setIsBatchSim,
  advanceButtonText,
  canSimulateRemaining,
  remainingOtherFixtures,
  onAdvance,
  onDismissOnboarding,
  navigate,
}: MatchTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Onboarding */}
      {game.onboardingStep !== undefined && game.onboardingStep >= 0 && game.onboardingStep <= 4 && (
        <OnboardingHint
          step={game.onboardingStep}
          clubName={club.name}
          onDismiss={onDismissOnboarding}
        />
      )}

      {/* Playoff just started */}
      {isPlayoffJustStarted && playoffInfo && (
        <div style={{ margin: '0 0 8px' }}>
          <PlayoffBanner game={game} playoffInfo={playoffInfo} />
        </div>
      )}

      {/* Eliminated */}
      {eliminated && !nextFixture && game.playoffBracket && game.playoffBracket.status !== PlayoffStatus.Completed && (
        <div className="card-round card-stagger-1" style={{ margin: '0 0 8px', padding: '18px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Din säsong är slut</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>Väntar på att slutspelet ska avgöras...</p>
        </div>
      )}

      {/* Next match */}
      {nextFixture && opponent && (
        <NextMatchCard
          nextFixture={nextFixture}
          opponent={opponent}
          isHome={isHome}
          club={club}
          game={game}
          isPlayoffFixture={isPlayoffFixture}
          playoffSeries={playoffSeries}
          dynamicHomeWins={dynamicHomeWins}
          dynamicAwayWins={dynamicAwayWins}
          matchWeather={matchWeather}
          hasPendingLineup={hasPendingLineup}
          lineupConfirmedThisRound={game.lineupConfirmedThisRound}
        />
      )}

      {/* Nudges */}
      <DashboardNudges game={game} navigate={navigate} />

      {/* Tabell + Senast */}
      <div style={{ display: 'flex', gap: 8, margin: '0 0 8px' }}>
        {standing && (
          <div
            className="card-sharp card-stagger-3"
            style={{ flex: 1, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            onClick={() => navigate('/game/tabell')}
          >
            {standing.position <= 8 && currentRound > 0 && (
              <span className="tag tag-fill" style={{ position: 'absolute', top: -1, right: 8, borderRadius: '0 0 8px 8px', letterSpacing: '1px' }}>
                TOPP 8
              </span>
            )}
            <div style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                  📊 Tabell
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/game/tabell') }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--accent)', fontSize: 12, lineHeight: 1,
                    cursor: 'pointer',
                  }}
                >›</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 36, fontWeight: 400, color: 'var(--accent-dark)', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                  {standing.position}
                </span>
                <div>
                  {(() => {
                    const lastSummary = (game.seasonSummaries ?? []).slice(-1)[0]
                    const lastPos = lastSummary?.finalPosition ?? null
                    const posDiff = lastPos != null ? lastPos - standing.position : null
                    return posDiff !== null && posDiff !== 0 && standing.played > 0 ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: posDiff > 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-body)' }}>
                        {posDiff > 0 ? `↑${posDiff}` : `↓${Math.abs(posDiff)}`}
                      </span>
                    ) : null
                  })()}
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '3px 0 0', fontFamily: 'var(--font-body)' }}>
                    {standing.points}p · {standing.goalDifference >= 0 ? '+' : ''}{standing.goalDifference}
                  </p>
                  {standing.played > 0 && (
                    <p style={{ fontSize: 9, fontWeight: 600, marginTop: 2, color: standing.position <= 8 ? 'var(--success)' : standing.position <= 10 ? 'var(--text-muted)' : 'var(--danger)' }}>
                      {standing.position <= 8 ? 'Slutspelszonen' : standing.position <= 10 ? 'Utanför slutspel' : 'Nedflyttningszonen'}
                    </p>
                  )}
                </div>
              </div>
              {recentForm.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <FormSquares results={recentForm} size={12} />
                </div>
              )}
              {standing.played > 0 && (() => {
                const myIdx = game.standings.findIndex(s => s.clubId === game.managedClubId)
                const above = myIdx > 0 ? game.standings[myIdx - 1] : null
                const below = myIdx < game.standings.length - 1 ? game.standings[myIdx + 1] : null
                const myPts = standing.points
                const gapAbove = above ? above.points - myPts : null
                const gapBelow = below ? myPts - below.points : null
                return (
                  <div style={{ marginTop: 5, fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {above && gapAbove !== null && (
                      <div>↑ {gapAbove === 0 ? 'Lika med' : `${gapAbove}p till`} {game.clubs.find(c => c.id === above.clubId)?.shortName ?? above.clubId} ({above.position}:a)</div>
                    )}
                    {below && gapBelow !== null && (
                      <div>↓ {gapBelow === 0 ? 'Lika med' : `${gapBelow}p ned till`} {game.clubs.find(c => c.id === below.clubId)?.shortName ?? below.clubId} ({below.position}:a)</div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {lastResult && (
          <LastResultCard
            lastResult={lastResult}
            lastCompletedFixture={lastCompletedFixture}
            managedClubId={game.managedClubId}
            recentForm={recentForm}
            onNavigateToReport={() => navigate('/game/match', { state: { showReport: true } })}
          />
        )}
      </div>

      {/* Playoff bracket or cup */}
      {playoffInfo ? (
        <PlayoffBracketCard bracket={playoffInfo} game={game} />
      ) : game.cupBracket ? (
        <CupCard bracket={game.cupBracket} game={game} />
      ) : null}

      {/* Trainer arc mood */}
      {game.trainerArc && (() => {
        const moodTexts: Record<string, string> = {
          honeymoon: '☀️ Allt stämmer just nu',
          questioned: '⛅ Media ställer frågor',
          crisis: '⛈️ Styrelsen är orolig',
          redemption: '🌤️ Vändningen har börjat',
          legendary: '👑 Legendstatus',
        }
        const mood = moodTexts[game.trainerArc.current]
        const lastTransition = game.trainerArc.history.length > 0
          ? game.trainerArc.history[game.trainerArc.history.length - 1]
          : null
        const reason = lastTransition?.to === game.trainerArc.current ? lastTransition.reason : null
        return mood ? (
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{mood}</p>
            {reason && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.7, marginTop: 2 }}>{reason}</p>
            )}
          </div>
        ) : null
      })()}

      {/* CTA section */}
      <div style={{ margin: '8px 0 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 2px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.5px' }}>
            {currentDateStr}
          </span>
          {currentRound > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.5px' }}>
              Omgång {currentRound}
            </span>
          )}
        </div>
        <DiamondDivider />

        {/* Batch sim */}
        {canSimulateRemaining && !isBatchSim && (
          <button
            onClick={() => setIsBatchSim(true)}
            className="btn btn-ghost"
            style={{ width: '100%', marginBottom: 8, justifyContent: 'center' }}
          >
            ⏩ Simulera resterande säsong
          </button>
        )}
        {isBatchSim && (
          <div style={{ marginBottom: 8, padding: '10px 14px', background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.2)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--accent-dark)', fontWeight: 700, fontFamily: 'var(--font-body)' }}>⏩ Simulerar säsongen...</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-body)' }}>{remainingOtherFixtures} omgångar kvar</div>
              </div>
              <button onClick={() => setIsBatchSim(false)} className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>
                Stopp
              </button>
            </div>
          </div>
        )}

        {/* Main CTA */}
        <button
          onClick={onAdvance}
          disabled={!canClickAdvance || isBatchSim}
          className="texture-leather"
          style={{
            width: '100%', padding: '18px',
            background: canClickAdvance && !isBatchSim
              ? 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))'
              : 'var(--border)',
            color: canClickAdvance && !isBatchSim ? 'var(--text-light)' : 'var(--text-muted)',
            border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
            cursor: canClickAdvance && !isBatchSim ? 'pointer' : 'not-allowed',
            animation: canClickAdvance && !isBatchSim ? 'pulseCTA 3s ease-in-out infinite' : undefined,
          }}
        >
          {advanceButtonText}
        </button>
      </div>

      {/* Build version */}
      <p style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-muted)', opacity: 0.5, marginTop: 16 }}>
        build {(typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : '?')} · {(typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '')}
      </p>
    </div>
  )
}
