import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

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

        {/* F2 — WIP: ska driva den RIKTIGA lineup-komponenten med tutorial-lager
            (highlight tomt MV-slot, gated CTA tills elvan giltig). game.managedClubPendingLineup.
            Framing: "Här är truppen. Elva på isen. Du bestämmer — jag säger till om något skaver." */}
        {step === 2 && (
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
            <div className="h-scene-helper">[WIP: wiras mot riktig lineup-yta i nästa pass]</div>
          </div>
        )}

        {/* F3 — WIP: ska driva RIKTIGA CornerInteraction i övningsläge (ingen state-mutation),
            coachtips ur generateCoachQuote(coach, {type:'corner', sub:'default'}).
            Framing: "En hörna innan det gäller. Du väljer var den läggs och hur hårt. Titta på zonerna." */}
        {step === 3 && (
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
            <div className="h-scene-helper">[WIP: wiras mot riktig CornerInteraction i nästa pass]</div>
          </div>
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

      {/* CTA per steg */}
      <div className="scene-cta-area in">
        {step === 4 ? (
          <button className="btn btn-primary btn-cta" onClick={finish}>Första omgången →</button>
        ) : (
          <button
            className="btn-scene-cta"
            onClick={() => setStep(s => (Math.min(4, s + 1) as Step))}
          >
            {step === 1 ? 'Visa mig' : 'Vidare'}
          </button>
        )}
      </div>
    </div>
  )
}
