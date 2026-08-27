import { useGameStore } from '../store/gameStore'
import { Overlay } from './primitives/Overlay'

/**
 * M2 (audit 5c9a7a8, 2026-08-24): renderas när saveConflict är true i
 * gameStore — antingen för att denna flik försökte spara och blev avvisad
 * av compare-and-swap (saveGameStorage.ts:saveSaveGame), eller för att en
 * annan flik broadcastat att den redan skrivit en nyare version (samma fil,
 * subscribeToSaveWrites). I båda fallen är denna fliks state per definition
 * bakom och kan inte längre sparas säkert — enda vägen framåt är att ladda
 * om och läsa den faktiska nyaste kopian, aldrig att fortsätta spela på en
 * kopia som redan tappat kapplöpningen.
 *
 * Mönster: full-screen blockerande overlay, samma struktur som
 * ErrorBoundary.tsx (root-nivå, ingen router-kontext krävs) — monterad i
 * AppRouter.tsx som syskon till <Routes>, precis som FeedbackButton/
 * PwaUpdateBanner, eftersom konflikten kan inträffa på VILKEN skärm som
 * helst, inte bara under /game/*.
 */
export function SaveConflictModal() {
  const saveConflict = useGameStore(s => s.saveConflict)
  const resolveSaveConflict = useGameStore(s => s.resolveSaveConflict)
  if (!saveConflict) return null

  // M4 (audit 5c9a7a8, 2026-08-24): migrerad till Overlay-primitiven. Ingen
  // "avbryt"-väg finns eller ska finnas här (fliken kan inte spara säkert
  // längre) — Escape/bakgrundsklick mappas därför till SAMMA handling som
  // knappen, inte en tyst stängning som lämnar spelaren kvar i stale state.
  return (
    <Overlay onClose={() => { void resolveSaveConflict() }} ariaLabel="En annan flik har sparat" maxWidth={340} backdropPadding="24px 16px">
      <div style={{
        background: 'var(--bg-dark)',
        border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
        borderRadius: 'var(--radius-md)',
        padding: '22px 20px',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 32, display: 'block', marginBottom: 10 }}>⚠️</span>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8 }}>
          En annan flik har sparat
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-light-secondary)', lineHeight: 1.5, marginBottom: 4 }}>
          Den här karriären har öppnats i en annan flik, som redan sparat en nyare version.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-light-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
          Det som gjorts här sedan dess går inte att spara. Ladda om för att fortsätta med den senaste versionen.
        </p>
        <button
          onClick={() => { void resolveSaveConflict() }}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          Ladda om
        </button>
      </div>
    </Overlay>
  )
}
