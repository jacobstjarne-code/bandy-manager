import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Users, LineChart, GraduationCap, type LucideIcon } from 'lucide-react'
import { Icon } from '../../components/primitives/Icon'
import { useGameStore } from '../../store/gameStore'
import { playSound } from '../../audio/soundEffects'
import { MatchEventType } from '../../../domain/enums'
import { FixtureStatus } from '../../../domain/enums'
import { getCriticalEventsForGranska } from '../../../domain/services/granskaEventClassifier'
import { deriveMatchTypeAxes } from '../../../domain/services/matchTypeAxes'
import { GranskaOversikt } from './GranskaOversikt'
import { GranskaSpelare } from './GranskaSpelare'
import { GranskaShotmap } from './GranskaShotmap'
import { GranskaAnalys } from './GranskaAnalys'
import { NextOpponentHook } from './NextOpponentHook'
import { mergeResolvedChoices } from './helpers'

type GranskaStep = 'oversikt' | 'spelare' | 'shotmap' | 'analys'

const STEPS: { id: GranskaStep; Icon: LucideIcon; label: string }[] = [
  { id: 'oversikt', Icon: Target, label: 'Översikt' },
  { id: 'spelare', Icon: Users, label: 'Spelare' },
  { id: 'shotmap', Icon: LineChart, label: 'Shotmap' },
  { id: 'analys', Icon: GraduationCap, label: 'Analys' },
]

export function GranskaScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const roundSummary = useGameStore(s => s.roundSummary)
  const clearRoundSummary = useGameStore(s => s.clearRoundSummary)
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const [visible, setVisible] = useState(false)
  const [resolvedEventIds, setResolvedEventIds] = useState<Set<string>>(new Set())
  const [chosenLabels, setChosenLabels] = useState<Record<string, string>>({})
  const [soundsPlayed, setSoundsPlayed] = useState(false)
  const [step, setStep] = useState<GranskaStep>('oversikt')
  const [visitedSteps, setVisitedSteps] = useState<Set<GranskaStep>>(new Set(['oversikt']))
  const didRedirect = useRef(false)
  // M10 (audit 5c9a7a8, 2026-08-24): FRUSEN vid mount, inte game.pendingEvents
  // läst live. handleChoice nedan löser domänen (resolveEvent) SYNKRONT nu —
  // om korten renderades från live pendingEvents skulle ett löst event
  // försvinna ur criticalEvents-listan (GranskaOversikt.tsx) i SAMMA
  // ögonblick det löstes, innan spelaren ens hunnit se sin egen ✓-markering
  // (DecisionCard visar resolved-läget permanent, ingen egen timing).
  // Ingen ny händelse tillkommer normalt medan spelaren står kvar på
  // Granska (advance() körs inte här) — en engångs-snapshot är därför säker
  // mot att MISSA något.
  // Känd, medveten avvägning: om en runda har FLER än 3 kritiska events
  // (criticalEvents.slice(0,3)) rullar det 4:e inte längre in i listan efter
  // att ett av de tre lösts, som det gjorde förut när listan lästes live —
  // det ligger kvar olöst i game.pendingEvents (inte tappat, bara inte visat
  // HÄR under DEN HÄR skärmvisningen). Sällsynt läge (taket är redan satt
  // till 3 som om det vore ovanligt att nå), och att lösa det utan att
  // återinföra en timing-baserad "släpp in nästa efter en stund"-mekanik
  // hade motverkat hela poängen med denna fix.
  const [pendingEventsSnapshot] = useState(() => game?.pendingEvents ?? [])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  // advance()-flytten (Audit-syntes yta 5, 2026-07-07): denna effekt processade
  // tidigare omgången själv (advance(true)) som en sidoeffekt av att skärmen
  // monterades — en skärm som avancerar spelets tillstånd bara för att den
  // navigerades till, oavsett att `if (roundSummary) return` höll den i schack.
  // Alla tre vägar in hit säkerställer nu processningen explicit INNAN navigering
  // (MatchScreen.tsx snabbsim, MatchLiveScreen.tsx matchDone-effekten, och dess
  // övergiven-match-återhämtning) — den här effekten är därför en ren guard:
  // finns roundSummary, visa den; annars finns inget att visa, gå till dashboard.
  useEffect(() => {
    if (roundSummary) return
    if (!didRedirect.current) {
      didRedirect.current = true
      navigate('/game/dashboard', { replace: true })
    }
  }, [roundSummary, navigate])

  useEffect(() => {
    if (!roundSummary || soundsPlayed) return
    setSoundsPlayed(true)
    const csDelta = (roundSummary.communityStandingAfter ?? 0) - (roundSummary.communityStandingBefore ?? roundSummary.communityStandingAfter ?? 0)
    if (csDelta > 0) setTimeout(() => playSound('communityUp'), 400)
    else if (csDelta < 0) setTimeout(() => playSound('communityDown'), 400)
    if (roundSummary.youthMatchResult?.includes('vann')) setTimeout(() => playSound('youthGoal'), 600)
  }, [roundSummary, soundsPlayed])

  if (!game) return null

  const fixture = game.lastCompletedFixtureId
    ? game.fixtures.find(f => f.id === game.lastCompletedFixtureId)
    : undefined

  const homeClub = fixture ? game.clubs.find(c => c.id === fixture.homeClubId) : undefined
  const awayClub = fixture ? game.clubs.find(c => c.id === fixture.awayClubId) : undefined
  const isHome = fixture?.homeClubId === game.managedClubId
  const myScore = fixture ? (isHome ? fixture.homeScore : fixture.awayScore) : 0
  const theirScore = fixture ? (isHome ? fixture.awayScore : fixture.homeScore) : 0

  const penResult = fixture?.penaltyResult
  const otResult = fixture?.overtimeResult
  const wonByPenalties = penResult ? (isHome ? penResult.home > penResult.away : penResult.away > penResult.home) : false
  const lostByPenalties = penResult ? (isHome ? penResult.home < penResult.away : penResult.away < penResult.home) : false
  const wonByOT = otResult ? (isHome ? otResult === 'home' : otResult === 'away') : false
  const lostByOT = otResult ? (isHome ? otResult === 'away' : otResult === 'home') : false
  const won = myScore > theirScore || wonByOT || wonByPenalties
  const lost = myScore < theirScore || lostByOT || lostByPenalties

  const resultColor = won ? 'var(--success)' : lost ? 'var(--danger)' : 'var(--accent)'
  const resultLabel = wonByPenalties ? 'SEGER (straffar)'
    : lostByPenalties ? 'FÖRLUST (straffar)'
    : wonByOT ? 'SEGER (förl.)'
    : lostByOT ? 'FÖRLUST (förl.)'
    : won ? 'SEGER' : lost ? 'FÖRLUST' : 'OAVGJORT'

  const potmId = fixture?.report?.playerOfTheMatchId
  const potm = potmId ? (game.players.find(p => p.id === potmId) ?? null) : null
  const potmRating = potmId ? fixture?.report?.playerRatings[potmId] : null

  const keyMoments = fixture?.events
    .filter(e => e.type === MatchEventType.Goal || e.type === MatchEventType.Suspension)
    .sort((a, b) => a.minute - b.minute) ?? []

  const rs = roundSummary
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const standingBefore = rs?.standingBefore ?? null
  const financesDelta = rs ? rs.financesAfter - rs.financesBefore : 0
  const csDelta = rs ? rs.communityStandingAfter - (rs.communityStandingBefore ?? rs.communityStandingAfter) : 0
  const cs = rs?.communityStandingAfter ?? game.communityStanding ?? 50

  const currentMatchday = fixture?.matchday ?? 0
  const otherResults = currentMatchday > 0
    ? game.fixtures.filter(f =>
        f.matchday === currentMatchday &&
        f.status === FixtureStatus.Completed &&
        f.homeClubId !== game.managedClubId &&
        f.awayClubId !== game.managedClubId
      )
    : []

  // GRANSKA DEL 4 (2026-08-11), steg 2: axlarna, härledda en gång här och
  // skickade ner — ingen skärm under Översikt ska härleda matchtyp själv.
  const axes = fixture
    ? deriveMatchTypeAxes(fixture, game.managedClubId, game.playoffBracket)
    : { tavlingstyp: 'liga' as const, skede: undefined, plats: 'hemma' as const, utfall: 'oavgjort' as const, gavLigapoang: false, arDerby: false }

  // M10: snapshot (se useState ovan), inte live game.pendingEvents — se den
  // kommentaren för varför.
  const pendingEvents = pendingEventsSnapshot

  // PÅSTÅENDEKARTAN (2026-08-24): se helpers.ts:s mergeResolvedChoices —
  // resolvedEventIds/chosenLabels ovan är bara en optimistisk overlay,
  // game.resolvedChoices är den nedskrivna sanningen som överlever en
  // remount/omladdning.
  const { resolvedEventIds: effectiveResolvedEventIds, chosenLabels: effectiveChosenLabels } =
    mergeResolvedChoices(game.resolvedChoices ?? [], resolvedEventIds, chosenLabels)

  // M10 (audit 5c9a7a8, 2026-08-24) — rotorsak rapporterad separat
  // (RAPPORT_M10_ROTORSAK_2026-08-26.md) innan denna fix: domänmutationen
  // (resolveEvent) sköts tidigare upp 600ms bakom animationen, utan
  // clearTimeout vid unmount. Ett snabbt "KLAR"-tryck + navigering hann då
  // ske INNAN den riktiga skrivningen, medan händelsen fortfarande låg kvar
  // i game.pendingEvents — kunde dyka upp igen som en EventOverlay på
  // dashboarden och bli besvarad en andra gång innan den ursprungliga,
  // fördröjda skrivningen hann köra (som då blev en tyst no-op, se
  // eventResolver.ts — spelarens FAKTISKA val försvann tyst, ersattes av
  // vad som råkade tryckas på återuppdykningen). Fixen: resolva domänen
  // SYNKRONT, samma frame som klicket. Animationen (DecisionCards
  // resolve-övergång) körs oberoende av detta — kortet finns kvar i
  // pendingEventsSnapshot (se useState ovan) trots att game.pendingEvents
  // redan är uppdaterat, så inget racefönster återstår.
  function handleChoice(eventId: string, choiceId: string, choiceLabel: string) {
    playSound('click')
    setResolvedEventIds(prev => new Set([...prev, eventId]))
    setChosenLabels(prev => ({ ...prev, [eventId]: choiceLabel }))
    resolveEvent(eventId, choiceId, true)
  }

  function handleResolveReactions(ids: string[]) {
    setResolvedEventIds(prev => new Set([...prev, ...ids]))
    // HIGH 6 (Jacobs körorder 2026-08-31): bulk-avfärdning av reaktions-
    // events ('auto' som choiceId) — inget riktigt val, ingen player-tap.
    ids.forEach(id => resolveEvent(id, 'auto', false))
  }

  function handleContinue() {
    clearRoundSummary()
    navigate('/game/dashboard', { replace: true })
  }

  function goToStep(s: GranskaStep) {
    setStep(s)
    setVisitedSteps(prev => new Set([...prev, s]))
  }

  const fadeIn = (i: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.35s ease ${80 + i * 60}ms`,
  })

  const unresolvedCritical = getCriticalEventsForGranska(pendingEvents).filter(e => !effectiveResolvedEventIds.has(e.id)).length
  const unresolvedPC = game.pendingPressConference && !effectiveResolvedEventIds.has(game.pendingPressConference.id) ? 1 : 0
  const unresolvedRM = game.pendingRefereeMeeting && !effectiveResolvedEventIds.has(game.pendingRefereeMeeting.id) ? 1 : 0
  const unresolved = unresolvedCritical + unresolvedPC + unresolvedRM

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Content */}
      <div className="texture-wood card-stack" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingTop: 12, paddingBottom: 8 }}>
        {step === 'oversikt' && (
          <GranskaOversikt
            game={game}
            fixture={fixture}
            homeClub={homeClub}
            awayClub={awayClub}
            isHome={isHome}
            won={won}
            lost={lost}
            resultColor={resultColor}
            resultLabel={resultLabel}
            potm={potm}
            potmRating={potmRating}
            penResult={penResult}
            keyMoments={keyMoments}
            pendingEvents={pendingEvents}
            resolvedEventIds={effectiveResolvedEventIds}
            chosenLabels={effectiveChosenLabels}
            fadeIn={fadeIn}
            onChoice={handleChoice}
            onResolve={handleResolveReactions}
            rs={rs}
            standing={standing}
            standingBefore={standingBefore}
            financesDelta={financesDelta}
            csDelta={csDelta}
            cs={cs}
            otherResults={otherResults}
            onOpenReport={() => goToStep('analys')}
            axes={axes}
          />
        )}
        {step === 'spelare' && (
          <GranskaSpelare
            game={game}
            fixture={fixture}
            isHome={isHome}
            potmId={potmId}
            pendingEvents={pendingEvents}
            resolvedEventIds={effectiveResolvedEventIds}
            chosenLabels={effectiveChosenLabels}
            onChoice={handleChoice}
          />
        )}
        {step === 'shotmap' && (
          <GranskaShotmap
            game={game}
            fixture={fixture}
            isHome={isHome}
          />
        )}
        {step === 'analys' && (
          <GranskaAnalys
            game={game}
            fixture={fixture}
            isHome={isHome}
            won={won}
            lost={lost}
            myScore={myScore}
            theirScore={theirScore}
            potm={potm}
          />
        )}
      </div>

      {/* Bottom nav + CTA */}
      <div style={{
        flexShrink: 0,
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'var(--safe-bottom, 0px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease 0.3s',
      }}>
        {/* Step label */}
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textAlign: 'center', color: 'var(--text-muted)', paddingTop: 8, marginBottom: 2 }}>
          FÖRDJUPA
        </p>

        {/* Icon buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px', marginBottom: 8 }}>
          {STEPS.map(s => {
            const isActive = step === s.id
            const isVisited = visitedSteps.has(s.id) && !isActive
            return (
              <button
                key={s.id}
                onClick={() => goToStep(s.id)}
                style={{
                  width: 56,
                  height: 56,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  borderRadius: 8,
                  border: isActive ? 'none' : '1px solid var(--accent)',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  cursor: 'pointer',
                  opacity: isVisited ? 0.55 : 1,
                  boxShadow: isVisited ? 'none' : (isActive ? '0 2px 6px color-mix(in srgb, var(--accent) 35%, transparent)' : 'none'),
                  position: 'relative',
                }}
              >
                <Icon icon={s.Icon} size={18} color={isActive ? 'var(--text-light)' : 'var(--accent)'} active={isActive} />
                <span style={{ fontSize: 8, color: isActive ? 'var(--text-light)' : 'var(--accent)', letterSpacing: '0.5px', fontWeight: 600 }}>{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* B3 — framåtkroken: sista innehållsblocket, direkt ovanför CTA:n */}
        <NextOpponentHook game={game} />

        {/* CTA */}
        <div style={{ padding: '0 20px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {unresolved > 0 && (
            <p style={{ fontSize: 10, color: 'var(--warning)', textAlign: 'center', margin: 0 }}>
              {unresolved} ohanterad{unresolved > 1 ? 'e' : ''} händelse{unresolved > 1 ? 'r' : ''} — du kan hantera dem i Översikt
            </p>
          )}
          <button onClick={handleContinue} disabled={unresolved > 0} className="btn btn-primary btn-cta">
            KLAR — NÄSTA OMGÅNG →
          </button>
        </div>
      </div>
    </div>
  )
}
