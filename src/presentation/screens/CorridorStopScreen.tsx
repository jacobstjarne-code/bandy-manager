import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { PendingScreen } from '../../domain/enums'
import { buildWeekAfterStop, buildFinalDayStop } from '../../domain/services/corridorService'
import { getSpectatorSpecialDateBriefing } from '../../domain/services/specialDateService'

/**
 * TEXTLEVERANS §D / Jacobs beslut 2026-09-19 — korridorens två stopp.
 *
 * Korridoren (omgång 28–36) gick inte att fylla per omgång: en utslagen klubb
 * FÅR inte de omgångarna, advance svansrekurserar förbi dem och omgångsräknaren
 * hoppar från ~26 till 37. Advance ska fortsätta hoppa; innehållet bärs av två
 * stopp MELLAN sista spelade omgång och omgång 37.
 *
 * Ett stopp är ingen omgång: räknaren, matchens rand och alla omgångsbaserade
 * mätningar är orörda.
 *
 * Rubriker och ingressrader är Fables, låsta. Raderna kommer ur §D-poolerna med
 * karriärscopad dedup, så ingen rad återkommer inom sju säsonger.
 */
export function CorridorStopScreen({ kind }: { kind: PendingScreen.WeekAfter | PendingScreen.FinalDay }) {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const clearCorridorStop = useGameStore(s => s.clearCorridorStop)

  if (!game) { navigate('/game', { replace: true }); return null }

  const isFinalDay = kind === PendingScreen.FinalDay
  const stop = isFinalDay ? buildFinalDayStop(game) : buildWeekAfterStop(game)
  // Finaldagen bär pool 1:s åskådarbriefing överst — den raden är skriven för
  // exakt den här dagen och låg död tills stoppen fanns.
  const spectatorBriefing = isFinalDay ? getSpectatorSpecialDateBriefing(game) : null

  if (!stop) {
    clearCorridorStop()
    navigate('/game/dashboard', { replace: true })
    return null
  }

  const handleContinue = () => {
    clearCorridorStop()
    navigate('/game/dashboard', { replace: true })
  }

  return (
    // Egen botten och explicita textfärger: skärmen får inte ärva värdytans
    // grund. Första versionen gjorde det och rubriken blev nästan osynlig i
    // dev-scenens mörka ram — ljusa tokens på mörk botten, precis det
    // återkommande felet CLAUDE.md pekar ut.
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%',
      padding: '0 12px', background: 'var(--bg)',
    }}>
      <div style={{ padding: '24px 0 8px' }}>
        <h1 className="h-display" style={{ margin: 0, color: 'var(--text-primary)' }}>{stop.heading}</h1>
        <p className="h-quote-sm" style={{ lineHeight: 1.5, margin: '8px 0 0', color: 'var(--text-secondary)' }}>
          {stop.intro}
        </p>
      </div>

      {spectatorBriefing && (
        <div className="card-round" style={{ margin: '4px 0 12px', padding: '10px 12px' }}>
          <p className="h-quote-sm" style={{ lineHeight: 1.5, margin: 0 }}>
            {spectatorBriefing}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {stop.lines.map((line, i) => (
          <div key={i} className="card-sharp" style={{ padding: '12px 13px' }}>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
              {line.text}
            </p>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 0 24px' }}>
        <button className="btn-cta" style={{ width: '100%' }} onClick={handleContinue}>
          Vidare
        </button>
      </div>
    </div>
  )
}
