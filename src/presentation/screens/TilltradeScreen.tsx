import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useLineupEditor } from '../hooks/useLineupEditor'
import { LineupStep } from '../components/match/LineupStep'
import { CornerInteraction } from '../components/match/CornerInteraction'
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
 * Den assisterande tränaren (game.assistantCoach, genererad) lär ut det praktiska:
 * F1 Ankomst → F2 Sätt elvan → F3 Öva hörna → F4 Klart → Portal.
 *
 * Instruktion: docs/CODE_INSTRUKTION_TILLTRADET_KLUBBPARMEN_2026-06-26.md
 * Texten är Opus-skriven och godkänd — Code templatear bara coach-namnet.
 *
 * F2/F3 wiras mot de RIKTIGA komponenterna (lineup-ytan resp. CornerInteraction
 * i övningsläge) i nästa pass — markerade WIP nedan. Reroute från ArrivalScene
 * flippas först när hela flödet står (main-koherens).
 */

type Step = 1 | 2 | 3 | 4

export function TilltradeScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const markOnboardingComplete = useGameStore(s => s.markOnboardingComplete)
  const [step, setStep] = useState<Step>(1)
  const [cornerOutcome, setCornerOutcome] = useState<CornerOutcome | null>(null)

  // F2 — useLineupEditor anropas ovillkorligt (hooks-regel) — game/managedClub kan vara undefined
  const managedClub = game?.clubs.find(c => c.id === game?.managedClubId)
  const lineupEditor = useLineupEditor(game, managedClub)

  // F3 — öva-hörnan mot ett sparring-lag. Byggs en gång; resolvas lokalt utan store-mutation.
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

  if (!game) {
    navigate('/', { replace: true })
    return null
  }
  // Redan klar (nått hit av misstag) → hoppa rakt in.
  if (game.onboardingComplete) {
    navigate('/game/dashboard', { replace: true })
    return null
  }
  // Defensivt: saknas tränare, hoppa hellre Tillträdet än krascha (samma mönster
  // som ArrivalScene har för game.board).
  const coach = game.assistantCoach
  if (!coach) {
    navigate('/game/dashboard', { replace: true })
    return null
  }

  const firstName = coach.name.split(' ')[0]
  const lastName = coach.name.split(' ')[1] ?? ''

  async function finish() {
    await markOnboardingComplete()
    navigate('/game/dashboard', { replace: true })
  }

  // F3 övningsläge: resolva utfallet lokalt (samma motor som live), ingen store-mutation.
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

  return (
    <div className="arrival-scene">
      <div className="arrival-lamp-overlay" />

      {/* Beat-prickar: fyra steg */}
      <div style={{ position: 'relative', zIndex: 2, padding: '32px 24px 0', textAlign: 'center' }}>
        <div className="h-scene-genre">⬩ &nbsp;Tillträdet&nbsp; ⬩</div>
        <div className="beat-progress" style={{ marginTop: 14 }}>
          {[1, 2, 3, 4].map(i => (
            <span key={i} className={`dot${i === step ? ' active' : ''}`} />
          ))}
        </div>
      </div>

      {/* Innehåll per steg */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1,
        padding: '28px 24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {step === 1 && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 14,
            background: 'rgba(10,8,12,0.80)',
            border: '1px solid rgba(245,241,235,0.06)',
            borderRadius: 'var(--radius)',
            padding: '20px 18px',
          }}>
            <div className="h-scene-speaker">{firstName} {lastName} · Assisterande tränare</div>
            <div className="h-scene-quote">
              "Styrelsen gav dig målet. Jag ger dig laget. Två saker innan första matchen — sätt elvan, och lär dig hur vi slår en hörna. Sen är du igång."
            </div>
          </div>
        )}

        {/* F2 — riktig lineup-yta med coach-framing ovan */}
        {step === 2 && (
          <>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 14,
              background: 'rgba(10,8,12,0.80)',
              border: '1px solid rgba(245,241,235,0.06)',
              borderRadius: 'var(--radius)',
              padding: '20px 18px',
            }}>
              <div className="h-scene-speaker">{firstName} · Sätt din elva</div>
              <div className="h-scene-quote">
                "Här är truppen. Elva på isen. Du bestämmer — jag säger till om något skaver."
              </div>
            </div>
            <LineupStep
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
          </>
        )}

        {/* F3 Öva en hörna — driver RIKTIGA CornerInteraction i övningsläge (practice):
            timern släckt, utfallet resolvas lokalt, ingen matchkonsekvens. */}
        {step === 3 && (
          <>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 14,
              background: 'rgba(10,8,12,0.80)',
              border: '1px solid rgba(245,241,235,0.06)',
              borderRadius: 'var(--radius)',
              padding: '20px 18px',
            }}>
              <div className="h-scene-speaker">{firstName} · Öva en hörna</div>
              <div className="h-scene-quote">
                "En hörna innan det gäller. Du väljer var den läggs och hur hårt. Titta på zonerna."
              </div>
            </div>

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
                background: 'rgba(10,8,12,0.80)',
                border: '1px solid rgba(245,241,235,0.06)',
                borderRadius: 'var(--radius)',
                padding: '20px 18px',
              }}>
                <div className="h-scene-quote">
                  "Så funkar det. Under match får du fem sekunder. Nu fick du så lång tid du ville."
                </div>
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 14,
            background: 'rgba(10,8,12,0.80)',
            border: '1px solid rgba(245,241,235,0.06)',
            borderRadius: 'var(--radius)',
            padding: '20px 18px',
          }}>
            <div className="h-scene-speaker">{firstName} {lastName} · Assisterande tränare</div>
            <div className="h-scene-quote">
              "Det var allt jag har. Resten lär du dig på vägen. Du vet vad styrelsen vill ha. Jag vet vad laget tål. Däremellan spelas säsongen."
            </div>
          </div>
        )}
      </div>

      {/* CTA per steg. F3: ingen scen-CTA förrän hörnan slagits (panelen äger handlingen);
          om practice-data saknas (edge) faller den tillbaka till en vanlig Vidare. */}
      <div className="scene-cta-area in">
        {step === 4 ? (
          <button className="btn btn-primary btn-cta" onClick={finish}>Första omgången →</button>
        ) : step === 3 ? (
          (cornerOutcome || !practiceCorner) ? (
            <button className="btn-scene-cta" onClick={() => setStep(4)}>Vidare</button>
          ) : null
        ) : step === 2 ? null /* LineupStep renderar sin egen CTA */ : (
          <button
            className="btn-scene-cta"
            onClick={() => setStep(s => (Math.min(4, s + 1) as Step))}
          >
            Visa mig
          </button>
        )}
      </div>
    </div>
  )
}
