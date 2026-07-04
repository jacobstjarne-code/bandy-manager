import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useLineupEditor } from '../hooks/useLineupEditor'
import { LineupStep } from '../components/match/LineupStep'
import { CornerInteraction } from '../components/match/CornerInteraction'
import { IllustrationScene } from '../components/illustration/IllustrationScene'
import { CoachFraming } from '../components/CoachFraming'
import {
  buildCornerInteractionData,
  resolveCorner,
  type CornerZone,
  type CornerDelivery,
  type CornerOutcome,
} from '../../domain/services/cornerInteractionService'
import { PlayerPosition } from '../../domain/enums'
import { mulberry32 } from '../../domain/utils/random'
import type { Player } from '../../domain/entities/Player'

/**
 * Tillträdet — engångs-onboardingflöde efter ArrivalScene (styrelsebesöket).
 * F1 Ankomst → F2 Sätt elvan → F3 Öva hörna → F4 Klart → Portal.
 * Mock: docs/incoming/Intro & Guide - Tillträdet + Klubbpärmen (fristående).html
 */

type Step = 1 | 2 | 3 | 4

const STEP_TITLES = ['Ankomst', 'Startelva', 'Hörnan', 'Klart']

/** Shield-märke med klubbinitial — F1 mock: 64×76px */
function ClubShield({ initial }: { initial: string }) {
  return (
    <svg
      width="64" height="76" viewBox="0 0 64 76" fill="none"
      style={{ display: 'block', margin: '8px auto 4px' }}
      aria-hidden="true"
    >
      <path
        d="M32 3L61 13V36C61 58 32 73 32 73C32 73 3 58 3 36V13Z"
        fill="var(--copper)" fillOpacity="0.06"
        stroke="var(--copper)" strokeWidth="1.5" strokeOpacity="0.55"
      />
      <text
        x="32" y="46"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="24"
        fontWeight="800"
        fill="var(--copper)"
        fillOpacity="0.85"
      >{initial}</text>
    </svg>
  )
}

/** Beat-progress — horisontella staplar.
 *  lg = F1/F4 (18×3px, gap 7), sm = F2/F3 header (14×3px, gap 5).
 *  Kumulativ: alla steg ≤ current lyser i koppar. */
function BeatBars({ step, size }: { step: number; size: 'lg' | 'sm' }) {
  const w = size === 'lg' ? 18 : 14
  const gap = size === 'lg' ? 7 : 5
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap, marginTop: size === 'lg' ? 10 : 0 }}>
      {[1, 2, 3, 4].map(i => (
        <span key={i} style={{
          display: 'inline-block', width: w, height: 3, borderRadius: 2,
          background: i <= step
            ? 'var(--accent)'
            : 'color-mix(in srgb, var(--accent) 25%, transparent)',
        }} />
      ))}
    </div>
  )
}

export function TilltradeScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const markOnboardingComplete = useGameStore(s => s.markOnboardingComplete)
  const [step, setStep] = useState<Step>(1)
  const [cornerOutcome, setCornerOutcome] = useState<CornerOutcome | null>(null)

  // F2 — useLineupEditor ovillkorligt (hooks-regel)
  const managedClub = game?.clubs.find(c => c.id === game?.managedClubId)
  const lineupEditor = useLineupEditor(game, managedClub)

  // F3 — öva-hörna, byggs en gång
  const practiceCorner = useMemo(() => {
    if (!game) return null
    const attackers = game.players.filter(p => p.clubId === game.managedClubId)
    if (attackers.length === 0) return null
    const cornerTaker = [...attackers].sort((a, b) => b.attributes.cornerSkill - a.attributes.cornerSkill)[0]
    const sparring = game.clubs.find(c => c.id !== game.managedClubId)
    const defenders = sparring ? game.players.filter(p => p.clubId === sparring.id) : []
    const data = buildCornerInteractionData(cornerTaker, attackers, defenders, true, game.supporterGroup?.mood ?? 50, 1, 0, 0)
    return { data, attackers, defenders }
  }, [game])

  if (!game) { navigate('/', { replace: true }); return null }
  if (game.onboardingComplete) { navigate('/game/dashboard', { replace: true }); return null }
  const coach = game.assistantCoach
  if (!coach) { navigate('/game/dashboard', { replace: true }); return null }

  const firstName = coach.name.split(' ')[0]
  const lastName = coach.name.split(' ')[1] ?? ''
  const coachInitials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`
  const clubInitial = managedClub?.name?.[0]?.toUpperCase() ?? '?'

  async function finish() {
    await markOnboardingComplete()
    navigate('/game/dashboard', { replace: true })
  }

  function handlePracticeCorner(zone: CornerZone, delivery: CornerDelivery) {
    if (!game || !practiceCorner) return
    const { attackers, defenders, data } = practiceCorner
    const taker = attackers.find(p => p.id === data.cornerTakerId) ?? attackers[0]
    const rushers = data.rusherIds.map(id => attackers.find(p => p.id === id)).filter(Boolean) as Player[]
    const gk = defenders.find(p => p.position === PlayerPosition.Goalkeeper)
    const defOutfield = defenders.filter(p => p.position !== PlayerPosition.Goalkeeper)
    const outcome = resolveCorner(
      { zone, delivery },
      taker, rushers, defOutfield, gk,
      data.opponentPenaltyKill, data.isHome,
      game.supporterGroup?.mood ?? 50,
      mulberry32(Date.now()),
    )
    setCornerOutcome(outcome)
  }

  /* ── F1 / F4: ankomst-layout — illustration + centrerad narrativ panel ── */
  if (step === 1 || step === 4) {
    return (
      <div className="arrival-scene">
        <IllustrationScene mode="fullbleed" name="intro" alt="" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <div className="arrival-scrim" />
        <div className="arrival-lamp-overlay" />

        <div style={{
          position: 'relative', zIndex: 2,
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '32px 24px 20px',
        }}>
          {/* Genre + bars */}
          <div style={{ textAlign: 'center' }}>
            <div className="h-scene-genre">
              {step === 1 ? '⬩  Tillträdet  ⬩' : '⬩  Klart för avspark  ⬩'}
            </div>
            <BeatBars step={step} size="lg" />
          </div>

          {/* Narrativ panel — centrerad mot illustrationen, ingen fri luft i mitten */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 8 }}>
            <div style={{
              background: 'rgba(10,8,12,0.80)',
              border: '1px solid rgba(245,241,235,0.06)',
              borderRadius: 'var(--radius)',
              padding: '18px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 14,
            }}>
              {step === 1 && (
                <>
                  <ClubShield initial={clubInitial} />
                  <p style={{
                    fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700,
                    color: 'var(--text-light)', textAlign: 'center', margin: 0,
                  }}>
                    {managedClub?.name}
                  </p>
                </>
              )}

              {step === 4 && (
                <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Startelva klar',
                    'Hörna övad',
                    'Säsongen väntar',
                  ].map((text, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'color-mix(in srgb, var(--success) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
                      borderRadius: 8, padding: '11px 14px',
                    }}>
                      <span style={{ color: 'var(--success)', fontSize: 14 }}>✓</span>
                      <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-light)' }}>{text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coach framing — ingen cirkel, hel bredd inuti narrativ-panelen */}
              <div style={{
                alignSelf: 'stretch',
                background: 'rgba(0,0,0,0.25)',
                borderLeft: '2px solid var(--copper)',
                borderRadius: '0 8px 8px 0',
                padding: '12px 14px',
              }}>
                <div className="h-scene-speaker">{firstName} {lastName} · Assisterande tränare</div>
                <div className="h-scene-quote">
                  {step === 1
                    ? '“Styrelsen gav dig målet. Jag ger dig laget. Två saker innan första matchen — sätt elvan, och lär dig hur vi slår en hörna. Sen är du igång.”'
                    : '“Det var allt jag har. Resten lär du dig på vägen. Du vet vad styrelsen vill ha. Jag vet vad laget tål. Däremellan spelas säsongen.”'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="scene-cta-area in">
          {step === 1
            ? <button className="btn-scene-cta" onClick={() => setStep(2)}>Visa mig</button>
            : <button className="btn btn-primary btn-cta" onClick={finish}>Första omgången →</button>}
        </div>
      </div>
    )
  }

  /* ── F2 / F3: steg-header + innehåll ─────────────────────────── */
  return (
    <div className="arrival-scene">
      <IllustrationScene mode="fullbleed" name="intro" alt="" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <div className="arrival-scrim" />
      <div className="arrival-lamp-overlay" />

      {/* Steg-header */}
      <div style={{
        padding: '12px 18px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
        flexShrink: 0, position: 'relative', zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'system-ui', fontSize: 9, fontWeight: 600,
            letterSpacing: '2.5px', textTransform: 'uppercase',
            color: 'var(--text-light-secondary)',
          }}>
            Uppgift {step} / 4 · {STEP_TITLES[step - 1]}
          </span>
          {step === 3 && (
            <span style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 9, fontWeight: 700,
              letterSpacing: '2px', color: 'var(--accent)',
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              borderRadius: 3, padding: '3px 8px',
            }}>ÖVNING</span>
          )}
        </div>
        <BeatBars step={step} size="sm" />
      </div>

      {/* Innehåll — F2 binder scrollen i ljust inset, F3 scrollar fritt */}
      <div style={{
        flex: 1, overflow: step === 2 ? 'hidden' : 'auto',
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Coach-framing med monogrammcirkel — F2 (Sätt elvan) renderar sin egen
            beat-baserade quote inne i LineupStep (practice-läge), F3 (Hörnan) här. */}
        {step === 3 && (
          <CoachFraming
            initial={coachInitials}
            quote='“En hörna innan det gäller. Du väljer var den läggs och hur hårt. Titta på zonerna.”'
          />
        )}

        {step === 2 && (
          /* Ljus inset — laguppställnings-lappen på det mörka bordet */
          <div style={{
            flex: 1, margin: '0 12px 12px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            minHeight: 0,
          }}>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <LineupStep
                practice
                opponent={null}
                nextFixture={null}
                game={game}
                squadPlayers={lineupEditor.squadPlayers}
                groupedPlayers={lineupEditor.groupedPlayers}
                startingIds={lineupEditor.startingIds}
                benchIds={lineupEditor.benchIds}
                captainId={lineupEditor.captainId ?? null}
                selectedSlotId={lineupEditor.selectedSlotId}
                tacticState={lineupEditor.tacticState}
                canPlay={lineupEditor.canPlay}
                injuredInStarting={lineupEditor.injuredInStarting}
                onTogglePlayer={lineupEditor.togglePlayer}
                onSetCaptain={lineupEditor.setCaptain}
                onAutoFill={lineupEditor.handleAutoFill}
                onSlotClick={lineupEditor.onSlotClick}
                onFormationChange={lineupEditor.onFormationChange}
                onAssignPlayer={lineupEditor.assignPlayerToSlot}
                onSwapPlayers={lineupEditor.swapSlots}
                onRemovePlayer={lineupEditor.removePlayer}
                onError={lineupEditor.setLineupError}
                onNext={() => { lineupEditor.commitLineup(); setStep(3) }}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <>
            {practiceCorner && (
              <CornerInteraction
                data={practiceCorner.data}
                outcome={cornerOutcome}
                onChoose={handlePracticeCorner}
                coach={coach}
                practice
              />
            )}
            {cornerOutcome && (
              <div style={{
                margin: '0 16px 16px',
                background: 'rgba(0,0,0,0.3)',
                borderLeft: '2px solid var(--copper)',
                borderRadius: '0 8px 8px 0',
                padding: '9px 12px',
              }}>
                <span style={{
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  fontSize: 12, color: 'var(--text-quote-light)', lineHeight: 1.35,
                }}>
                  “Så funkar det. Under match får du fem sekunder. Nu fick du så lång tid du ville.”
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* F3 CTA — dyker upp efter att hörnan slagits */}
      {step === 3 && (cornerOutcome || !practiceCorner) && (
        <div className="scene-cta-area in">
          <button className="btn-scene-cta" onClick={() => setStep(4)}>Vidare</button>
        </div>
      )}
    </div>
  )
}
