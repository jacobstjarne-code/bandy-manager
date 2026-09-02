import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearSaveRecoveryNeeded,
  isSaveRecoveryNeeded,
  listSaveSnapshots,
  restoreLatestSaveSnapshot,
  SAVE_RECOVERY_NEEDED_EVENT,
} from '../../infrastructure/persistence/saveGameStorage'
import { useGameStore } from '../store/gameStore'

/**
 * U7: route-oberoende yta för ett misslyckat boot-/migreringsförsök. Den
 * visar bara att en återställningspunkt finns efter att listningen bekräftat
 * det; UI-texten gör alltså inget löfte som state inte kan hålla.
 */
export function SaveRecoveryBanner() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(() => isSaveRecoveryNeeded())
  const [snapshotAvailable, setSnapshotAvailable] = useState<boolean | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreFailed, setRestoreFailed] = useState(false)

  useEffect(() => {
    const show = () => {
      setVisible(true)
      setSnapshotAvailable(null)
      setRestoreFailed(false)
    }
    window.addEventListener(SAVE_RECOVERY_NEEDED_EVENT, show)
    return () => window.removeEventListener(SAVE_RECOVERY_NEEDED_EVENT, show)
  }, [])

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    listSaveSnapshots()
      .then(snapshots => { if (!cancelled) setSnapshotAvailable(snapshots.length > 0) })
      .catch(() => { if (!cancelled) setSnapshotAvailable(false) })
    return () => { cancelled = true }
  }, [visible])

  async function handleRestore() {
    if (restoring) return
    setRestoring(true)
    setRestoreFailed(false)
    const result = await restoreLatestSaveSnapshot()
    if (!result.success) {
      setRestoring(false)
      setRestoreFailed(true)
      return
    }

    // setState skriver den migrerade återställningen till Zustands egen
    // persist-post. En ny rehydrate avslutar sedan den hydration som förblev
    // ofärdig när det första migreringsförsöket kastade.
    await useGameStore.setState({
      game: result.game,
      lastSaveError: null,
      saveConflict: false,
    })
    clearSaveRecoveryNeeded()
    await useGameStore.persist.rehydrate()
    setVisible(false)
    navigate('/game')
  }

  if (!visible) return null

  return (
    <div
      role="alert"
      style={{
        position: 'fixed', left: 12, right: 12, top: 12,
        zIndex: 'var(--z-toast)',
        padding: '12px 14px',
        background: 'var(--bg-dark)', color: 'var(--text-light)',
        border: '1px solid color-mix(in srgb, var(--warning) 55%, transparent)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-raised)',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
        Den senaste sparningen gick inte att läsa.
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-light-secondary)', lineHeight: 1.45, marginBottom: 10 }}>
        {snapshotAvailable === null && 'Söker efter en lokal återställningspunkt…'}
        {snapshotAvailable === true && !restoreFailed && 'En lokal återställningspunkt finns kvar.'}
        {snapshotAvailable === false && 'Ingen lokal återställningspunkt kunde läsas just nu.'}
        {restoreFailed && 'Återställningen misslyckades. Din säkerhetskopia ligger kvar.'}
      </div>
      {snapshotAvailable ? (
        <button
          type="button"
          onClick={() => { void handleRestore() }}
          disabled={restoring}
          className="btn btn-primary"
          style={{ width: '100%', minHeight: 44 }}
        >
          {restoring ? 'Återställer…' : 'Återställ säkerhetskopian'}
        </button>
      ) : snapshotAvailable === false ? (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-outline"
          style={{ width: '100%', minHeight: 44 }}
        >
          Försök igen
        </button>
      ) : null}
    </div>
  )
}
