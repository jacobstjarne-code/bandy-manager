import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, BookOpen } from 'lucide-react'
import { Icon } from './primitives/Icon'
import { useGameStore, useManagedClub, useUnreadInboxCount } from '../store/gameStore'
import { TownSilhouette } from './TownSilhouette'
import { KlubbparmOverlay } from './KlubbparmOverlay'
import { Logo } from './Logo'
import { PlayoffRound, PlayoffStatus } from '../../domain/enums'
import { seasonSpanLabel } from '../../domain/utils/seasonYear'

/** Handritad SVG-kuvert-glyph i koppar. Ersätter 🔔-emoji. */
function EnvelopeIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Kuvert-kropp */}
      <rect x="2" y="4" width="14" height="10" rx="1.5" />
      {/* Veck uppifrån */}
      <polyline points="2,4 9,10.5 16,4" />
    </svg>
  )
}

export function GameHeader() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const saveGame = useGameStore(s => s.saveGame)
  const club = useManagedClub()
  const unreadInbox = useUnreadInboxCount()
  const [showMenu, setShowMenu] = useState(false)
  const [saveToast, setSaveToast] = useState<{ visible: boolean; ok: boolean; text: string }>({
    visible: false,
    ok: true,
    text: '',
  })
  const [showKlubbparm, setShowKlubbparm] = useState(false)

  async function handleSaveGame() {
    const result = await saveGame()
    if (result.success) {
      setSaveToast({ visible: true, ok: true, text: '✓ Sparat' })
    } else {
      setSaveToast({ visible: true, ok: false, text: result.error ?? 'Kunde inte spara' })
    }
    setTimeout(() => setSaveToast(prev => ({ ...prev, visible: false })), 2400)
  }

  if (!game || !club) return null

  const lastPlayedRound = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  const nextLeagueRound = game.fixtures
    .filter(f => f.status === 'scheduled' && !f.isCup && f.roundNumber <= 22)
    .reduce((min, f) => Math.min(min, f.roundNumber), Infinity)
  const currentRound = nextLeagueRound < Infinity ? nextLeagueRound : lastPlayedRound

  // Playoff phase label
  const bracket = game.playoffBracket
  const isInPlayoff = bracket !== null && bracket.status !== PlayoffStatus.Completed
  let playoffLabel: string | null = null
  if (isInPlayoff && bracket) {
    const allSeries = [...bracket.quarterFinals, ...bracket.semiFinals, ...(bracket.final ? [bracket.final] : [])]
    const activeSeries = allSeries.find(s =>
      !s.winnerId && (s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId)
    )
    if (activeSeries) {
      const roundName = activeSeries.round === PlayoffRound.QuarterFinal ? 'Kvartsfinal'
        : activeSeries.round === PlayoffRound.SemiFinal ? 'Semifinal'
        : 'SM-Final'
      const matchNum = activeSeries.homeWins + activeSeries.awayWins + 1
      playoffLabel = `${roundName} · match ${matchNum}`
    } else {
      playoffLabel = 'Slutspel'
    }
  }

  const roundChipLabel = playoffLabel ?? (currentRound > 0 ? `Omg ${currentRound}` : null)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '44px 1fr auto',
      alignItems: 'center',
      position: 'relative',
      padding: '8px 10px',
      background: 'var(--bg-dark)',
      borderBottom: '2px solid var(--accent)',
      flexShrink: 0,
      minHeight: 44,
    }}>
      {/* Ortens siluett — absolut positionerad bakgrund */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
        <TownSilhouette clubId={game.managedClubId} width={375} height={20} />
      </div>

      {/* Kolumn 1: Logo */}
      <Logo variant="light" height={26} />

      {/* Kolumn 2: Klubbnamn + devis/krönika */}
      <div style={{ padding: '0 6px', overflow: 'hidden' }}>
        <p style={{
          fontSize: 12,
          color: 'rgba(245,241,235,0.90)',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          margin: 0,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {club.shortName ?? club.name}
        </p>
        <p style={{
          fontSize: 9,
          color: 'var(--header-undertext)',
          margin: 0,
          lineHeight: 1.3,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {game.managerName} · {seasonSpanLabel(game.currentSeason)}
        </p>
      </div>

      {/* Kolumn 3: Meta (sigill-chip + kuvert + inställningar) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {/* Omgångs-sigill */}
        {roundChipLabel && (
          <div className="h-label" style={{
            padding: '2px 7px',
            borderRadius: 3,
            border: '1px solid var(--accent)',
            background: 'rgba(201,122,58,0.10)',
            color: 'var(--accent)',
            whiteSpace: 'nowrap',
          }}>
            {roundChipLabel}
          </div>
        )}

        {/* Klubbpärmen */}
        <button
          onClick={() => setShowKlubbparm(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'rgba(245,241,235,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Klubbpärmen"
        >
          <Icon icon={BookOpen} size={16} />
        </button>

        {/* Kuvert-notifikation — SVG-glyph, inte emoji */}
        <button
          onClick={() => navigate('/game/inbox')}
          style={{
            position: 'relative',
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: unreadInbox > 0 ? 'var(--accent)' : 'rgba(245,241,235,0.45)',
          }}
        >
          {/* TODO(FAS 1): kuvert-glyphen ersätts av finalt handritad ikon · se ICON-BRIEF.md */}
          <EnvelopeIcon size={17} color="currentColor" />
          {/* Notifikationsprick — separat element, kan visas/döljas oberoende */}
          {unreadInbox > 0 && (
            <span style={{
              position: 'absolute', top: 1, right: 1,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--danger)',
              border: '1.5px solid var(--bg-dark)',
              display: 'block',
            }} />
          )}
        </button>

        {/* Inställningar */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'rgba(245,241,235,0.45)',
          }}
        >
          <Icon icon={Settings} size={16} />
        </button>
      </div>

      {/* Save toast */}
      {saveToast.visible && (
        <div style={{
          position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
          background: saveToast.ok ? 'var(--success)' : 'var(--danger)',
          color: 'var(--text-light)',
          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, zIndex: 'var(--z-toast)',  // save-toast → toast-nivå (var 201)
        }}>
          {saveToast.text}
        </div>
      )}

      {/* Inställnings-dropdown */}
      {showMenu && (
        <div style={{
          position: 'absolute', top: 48, right: 10,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '4px 0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 'var(--z-header)', minWidth: 160,  // var 200 = oförändrat
        }}>
          {[
            { label: '💾 Spara spel', action: handleSaveGame },
            { label: '📂 Ladda spel', action: () => navigate('/') },
          ].map((item, i) => (
            <button key={i} onClick={() => { void item.action(); setShowMenu(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', background: 'none', border: 'none',
                fontSize: 13, color: 'var(--text-primary)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {showKlubbparm && game && (
        <KlubbparmOverlay game={game} onClose={() => setShowKlubbparm(false)} />
      )}
    </div>
  )
}
