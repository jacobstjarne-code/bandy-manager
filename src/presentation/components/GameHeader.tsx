import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, BookOpen } from 'lucide-react'
import { Icon } from './primitives/Icon'
import { useGameStore, useManagedClub, useUnreadInboxCount } from '../store/gameStore'
import { TownSilhouette } from './TownSilhouette'
import { KlubbparmOverlay } from './KlubbparmOverlay'
import { Logo } from './Logo'
import { PlayoffStatus } from '../../domain/enums'
import { seasonSpanLabel } from '../../domain/utils/seasonYear'
import { getPlayoffSeriesContext } from '../../domain/services/portal/playoffSeriesContext'
import { getManagerDisplayName } from '../../domain/services/managerProfileService'
import { exportSaveAsJson, importSaveFromJson } from '../../infrastructure/persistence/saveGameStorage'
import { playoffRoundName } from '../../domain/roundLabel'


// C1 (5c9a7a8, 2026-08-24) — "senast bekräftad sparningstid" i UI.
function formatRelativeSaveTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(deltaMs / 60000)
  if (minutes < 1) return 'just nu'
  if (minutes < 60) return `${minutes} min sedan`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} tim sedan`
  return new Date(iso).toLocaleDateString('sv-SE')
}

const CRIT_LABEL: Record<'open' | 'matchpuck' | 'decisive', string | null> = {
  open: null,
  matchpuck: 'Matchpuck',
  decisive: 'Avgörande',
}

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
  const loadGame = useGameStore(s => s.loadGame)
  const lastConfirmedSaveAt = useGameStore(s => s.lastConfirmedSaveAt)
  const lastSaveError = useGameStore(s => s.lastSaveError)
  const club = useManagedClub()
  const unreadInbox = useUnreadInboxCount()
  const [showMenu, setShowMenu] = useState(false)
  const [saveToast, setSaveToast] = useState<{ visible: boolean; ok: boolean; text: string }>({
    visible: false,
    ok: true,
    text: '',
  })
  const [showKlubbparm, setShowKlubbparm] = useState(false)

  function showToast(ok: boolean, text: string) {
    setSaveToast({ visible: true, ok, text })
    setTimeout(() => setSaveToast(prev => ({ ...prev, visible: false })), 2400)
  }

  async function handleSaveGame() {
    const result = await saveGame()
    if (result.success) showToast(true, '✓ Sparat')
    // Felfallet visas INTE här direkt — se useEffect nedan, som bevakar
    // lastSaveError och visar EXAKT samma toast oavsett om felet kom från
    // knapptrycket eller en autosave i bakgrunden (C1, 5c9a7a8, 2026-08-24).
    // En enda källa till "ett sparfel hände", inte två separata vägar som
    // kan glida isär.
  }

  // C1 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24): den
  // VANLIGASTE sparvägen (autosave, gameFlowActions.ts, kör efter nästan
  // varje spelaråtgärd) hade tidigare NOLL signal vid fel — inte ens en
  // konsolrad. lastSaveError sätts nu av både persistGameSnapshot och
  // persistAutosave; denna effekten är den ENDA ytan som visar den, så en
  // spelare som mister en autosave i bakgrunden faktiskt märker det, inte
  // bara någon som råkar trycka den manuella knappen. shownErrorRef
  // förhindrar att samma fel visas två gånger om komponenten renderar om.
  const shownErrorRef = useRef<string | null>(null)
  useEffect(() => {
    if (lastSaveError && lastSaveError !== shownErrorRef.current) {
      shownErrorRef.current = lastSaveError
      showToast(false, lastSaveError)
    }
    if (!lastSaveError) shownErrorRef.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSaveError])

  function handleExportSave() {
    if (!game) return
    exportSaveAsJson(game)
    showToast(true, '✓ Exporterad')
  }

  // U7 (SLUTTEST_KO.md, 2026-08-17): import skriver över den aktiva karriären
  // — window.confirm som varning FÖRE, Jacobs beslut. Ingen ny modal-yta för
  // en operation som redan är sällsynt och destruktiv.
  async function handleImportSave() {
    const proceed = window.confirm(
      'Importera säkerhetskopia? Din aktuella karriär ersätts. Detta går inte att ångra.'
    )
    if (!proceed) return
    const imported = await importSaveFromJson()
    if (!imported) {
      showToast(false, 'Kunde inte importera')
      return
    }
    const ok = await loadGame(imported.id)
    showToast(ok, ok ? '✓ Importerad' : 'Kunde inte ladda den importerade filen')
  }

  if (!game || !club) return null

  const lastPlayedRound = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  const nextLeagueRound = game.fixtures
    .filter(f => f.status === 'scheduled' && !f.isCup && f.roundNumber <= 22)
    .reduce((min, f) => Math.min(min, f.roundNumber), Infinity)
  const currentRound = nextLeagueRound < Infinity ? nextLeagueRound : lastPlayedRound

  // AUDIT DEL 2 (2026-08-09), Jacobs ruling: RoundMark (ren kronologi — rundnamn
  // + kritikalitet) hör hemma i headerns befintliga omgångs-sigill, inte som en
  // egen rad i Portal. Detta ersätter headerns tidigare EGEN, parallella
  // beräkning av samma rundnamn (playoffCtx via getPlayoffSeriesContext är
  // samma källa PortalRoundMark redan använde — en beräkning, inte två som
  // råkade vara överens). Ingen ny headerdesign: samma .h-label-chip, bara
  // texten byggd av en gemensam källa. Kritikalitet (Matchpuck/Avgörande)
  // ersätter den gamla "match N"-suffixen när serien faktiskt är kritisk —
  // annars visas matchnumret som förut.
  const bracket = game.playoffBracket
  const isInPlayoff = bracket !== null && bracket.status !== PlayoffStatus.Completed
  const playoffCtx = isInPlayoff ? getPlayoffSeriesContext(game) : null
  let playoffLabel: string | null = null
  if (isInPlayoff) {
    if (playoffCtx) {
      const critLabel = CRIT_LABEL[playoffCtx.criticality]
      const suffix = critLabel ?? `match ${playoffCtx.nextGame}`
      playoffLabel = `${playoffRoundName(playoffCtx.round)} · ${suffix}`
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
          {getManagerDisplayName(game)} · {seasonSpanLabel(game.currentSeason)}
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
          boxShadow: 'var(--shadow-raised)',
          zIndex: 'var(--z-header)', minWidth: 160,  // var 200 = oförändrat
        }}>
          {/* C1 (5c9a7a8, 2026-08-24): "senast bekräftad sparningstid" —
              lastConfirmedSaveAt sätts ENDAST efter ett faktiskt lyckat
              saveSaveGame()-anrop (persistGameSnapshot/persistAutosave),
              aldrig optimistiskt. En spelare kan alltså lita på raden. */}
          <div style={{
            padding: '8px 14px 6px', fontSize: 10.5, color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border)', marginBottom: 2,
          }}>
            {lastConfirmedSaveAt ? `Senast sparat: ${formatRelativeSaveTime(lastConfirmedSaveAt)}` : 'Inte sparat än denna session'}
          </div>
          {[
            { label: '💾 Spara spel', action: handleSaveGame },
            { label: '📂 Ladda spel', action: () => navigate('/') },
            { label: '⬇️ Exportera säkerhetskopia', action: handleExportSave },
            { label: '⬆️ Importera säkerhetskopia', action: handleImportSave },
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
