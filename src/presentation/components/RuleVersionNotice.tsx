import { useEffect, useState } from 'react'
import { CURRENT_RULE_VERSION } from '../../domain/data/ruleVersion'
import { useGameStore } from '../store/gameStore'

/**
 * Äldre karriärer fortsätter med sin sparade regelversion. Det här är en
 * mjuk upplysning, inte en spärr eller migration: spelaren kan fortsätta och
 * notisen återkommer inte under samma session efter att den stängts.
 */
export function RuleVersionNotice() {
  const game = useGameStore(s => s.game)
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)
  const mismatchKey = game?.ruleVersion && game.ruleVersion !== CURRENT_RULE_VERSION
    ? `${game.id}:${game.ruleVersion}:${CURRENT_RULE_VERSION}`
    : null

  useEffect(() => {
    setDismissedKey(null)
  }, [game?.id])

  if (!mismatchKey || dismissedKey === mismatchKey) return null

  return (
    <div
      role="status"
      style={{
        position: 'fixed', left: 12, right: 12, bottom: 'calc(var(--bottom-nav-height, 60px) + 12px)',
        zIndex: 'var(--z-toast)', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', background: 'var(--bg-dark)', color: 'var(--text-light)',
        border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)', fontSize: 12,
      }}
    >
      <span style={{ flex: 1 }}>Karriären startades med äldre spelregler. Balansen kan skilja sig.</span>
      <button
        type="button"
        onClick={() => setDismissedKey(mismatchKey)}
        aria-label="Stäng regelversionsnotis"
        className="btn btn-ghost"
        style={{ minWidth: 44, minHeight: 44, color: 'var(--text-light)' }}
      >
        Stäng
      </button>
    </div>
  )
}
