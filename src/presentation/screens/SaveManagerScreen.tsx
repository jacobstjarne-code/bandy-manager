import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { listSaveGames, type SaveGameSummary } from '../../infrastructure/persistence/saveGameStorage'

/**
 * Multi-slot (2026-08-22, releasegrind) — save-väljare, inte destruktiv
 * ersättning. newGame():s tidigare ovillkorade radera-alla-loop är borttagen
 * (gameStore.ts), så flera karriärer kan nu samexistera i bandy_save_index.
 * Den här skärmen är den enda konsumenten som faktiskt LISTAR dem — utan den
 * fanns de bara på disk, onåbara (listSaveGames()/loadGame(id) var redan
 * byggda och testade, bara aldrig kopplade till en yta förutom JSON-importen).
 */
export function SaveManagerScreen() {
  const navigate = useNavigate()
  const switchToSave = useGameStore(s => s.switchToSave)
  const activeGameId = useGameStore(s => s.game?.id)
  const [saves] = useState<SaveGameSummary[]>(() => listSaveGames())
  const [switchingId, setSwitchingId] = useState<string | null>(null)

  async function handleSelect(id: string) {
    if (switchingId) return
    setSwitchingId(id)
    const ok = await switchToSave(id)
    if (ok) navigate('/game')
    else setSwitchingId(null)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        background: 'var(--bg-dark)',
        borderBottom: '2px solid var(--accent)',
        flexShrink: 0,
        minHeight: 44,
        position: 'relative',
      }}>
        <img
          src="/bandymanager-logo.png"
          alt="Bandy Manager"
          style={{ height: 26, width: 'auto', opacity: 0.85 }}
        />
        <span style={{
          color: 'var(--text-light)', fontSize: 11, letterSpacing: 3,
          textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 600,
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          MINA KARRIÄRER
        </span>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {saves.length === 0 && (
          <p className="h-quote" style={{ textAlign: 'center', marginTop: 40 }}>
            Inga sparade karriärer hittades.
          </p>
        )}
        {saves.map(save => {
          const isActive = save.id === activeGameId
          const isSwitching = switchingId === save.id
          return (
            <button
              key={save.id}
              onClick={() => handleSelect(save.id)}
              disabled={!!switchingId}
              className="card-sharp"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: 10,
                padding: '14px 16px',
                background: isActive ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-surface))' : 'var(--bg-surface)',
                border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                cursor: switchingId ? 'default' : 'pointer',
                opacity: switchingId && !isSwitching ? 0.5 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {save.managerName}
                </span>
                {isActive && (
                  <span className="h-label" style={{ color: 'var(--accent)', letterSpacing: 1 }}>
                    AKTIV
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {save.clubName} · säsong {save.season}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {isSwitching
                  ? 'Byter…'
                  : `Senast sparad ${new Date(save.lastSavedAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ padding: '16px', paddingBottom: 'calc(16px + var(--safe-bottom))', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/new-game')}
          className="btn btn-outline"
          style={{ width: '100%' }}
        >
          Starta en ny karriär
        </button>
      </div>
    </div>
  )
}
