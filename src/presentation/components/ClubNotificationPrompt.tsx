import { useMemo, useState } from 'react'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { isNotificationPromptEligible } from '../../domain/attention/attentionEngine'
import { useClubNotifications } from '../hooks/useClubNotifications'

const DISMISSED_PREFIX = 'bandy-notification-prompt-dismissed:'

function wasDismissed(saveId: string): boolean {
  try {
    return localStorage.getItem(`${DISMISSED_PREFIX}${saveId}`) === 'true'
  } catch {
    return false
  }
}

export function ClubNotificationPrompt({ game }: { game: SaveGame }) {
  const { capability, backendAvailable, isSubscribed, isChanging, error, enable } = useClubNotifications()
  const [dismissed, setDismissed] = useState(() => wasDismissed(game.id))
  const [showIosHelp, setShowIosHelp] = useState(false)
  const eligible = useMemo(() => isNotificationPromptEligible(game), [game])

  if (!eligible || dismissed || !capability.supported || backendAvailable !== true || capability.permission === 'denied' || isSubscribed !== false) {
    return null
  }

  function dismiss() {
    try { localStorage.setItem(`${DISMISSED_PREFIX}${game.id}`, 'true') } catch { /* no-op */ }
    setDismissed(true)
  }

  return (
    <section
      aria-labelledby="club-notification-title"
      className="card-sharp"
      style={{
        padding: '12px 14px',
        margin: '6px 0 12px',
        borderLeft: '3px solid var(--accent)',
        background: 'color-mix(in srgb, var(--accent) 5%, var(--bg-surface))',
      }}
    >
      <p className="h-label" style={{ color: 'var(--accent-dark)', marginBottom: 5 }}>KLUBBEN UTANFÖR SPELET</p>
      <h3 id="club-notification-title" className="h-card" style={{ color: 'var(--text-primary)', marginBottom: 4 }}>
        Vill du att klubben hör av sig när något faktiskt är värt att veta?
      </h3>
      <p className="h-quote-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        Matcher, beslut och klubbhändelser. Inga dagliga bonuspåminnelser.
      </p>

      {capability.requiresHomeScreenInstall ? (
        <>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-outline" onClick={() => setShowIosHelp(value => !value)} style={{ flex: 1, fontSize: 11 }}>
              {showIosHelp ? 'Dölj hjälp' : 'Visa hur'}
            </button>
            <button className="btn btn-ghost" onClick={dismiss} style={{ fontSize: 11 }}>Inte nu</button>
          </div>
          {showIosHelp && (
            <p className="h-micro" style={{ color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.45 }}>
              Öppna Dela-menyn i Safari, välj Lägg till på hemskärmen och öppna sedan Bandy Manager därifrån.
            </p>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn btn-primary" onClick={() => void enable()} disabled={isChanging} style={{ flex: 1, fontSize: 11 }}>
            {isChanging ? 'Kopplar in…' : 'Slå på klubbnotiser'}
          </button>
          <button className="btn btn-ghost" onClick={dismiss} disabled={isChanging} style={{ fontSize: 11 }}>Inte nu</button>
        </div>
      )}

      {error && (
        /* adherence-semantic-key: notifieringssetup kunde inte slutföras */
        <p role="status" className="h-micro" style={{ color: 'var(--danger-text)', marginTop: 8 }}>
          Notiser är inte tillgängliga just nu. Försök igen senare.
        </p>
      )}
    </section>
  )
}
