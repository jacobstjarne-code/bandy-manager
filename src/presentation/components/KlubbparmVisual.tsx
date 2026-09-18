import type { SaveGame } from '../../domain/entities/SaveGame'
import { formatFinanceAbs } from '../utils/formatters'
import { CornerPitchGuide } from './match/CornerInteraction'
import { MatchPhaseStrip } from './match-flow/MatchFlowFrame'
import { CommunityPulseMeter } from './club/CommunityPulseMeter'

interface KlubbparmVisualProps {
  game: SaveGame
  chapterId: string
  chapterLabel: string
}

/** Befintlig spelgrafik och verkliga värden från spelarens klubb. */
export function KlubbparmVisual({ game, chapterId, chapterLabel }: KlubbparmVisualProps) {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club) return null

  let content: React.ReactNode
  switch (chapterId) {
    case 'hornor':
      content = <div style={{ padding: '12px 10px 14px' }}>
        <CornerPitchGuide />
        <p style={captionStyle}>Exempel: mitt · lågt. Oddsen visas först i matchen.</p>
      </div>
      break
    case 'matchen':
      content = <>
        <img
          src="/assets/illustrations/premiar.webp"
          alt="Bandyrink inför match"
          style={{ ...imageStyle, height: 174, objectPosition: 'center 47%' }}
        />
        <MatchPhaseStrip phase="spela" />
      </>
      break
    case 'orten':
      content = <>
        <img
          src="/assets/illustrations/bruksort-header.webp"
          alt="Bruksorten och bandyplanen"
          style={{ ...imageStyle, height: 158, objectPosition: 'center' }}
        />
        <div style={{ padding: '12px 14px 4px', background: 'var(--bg-surface)' }}>
          <p className="h-label" style={{ marginBottom: 7 }}>BYGDENS PULS</p>
          <CommunityPulseMeter game={game} />
        </div>
      </>
      break
    case 'klacken':
      content = <div style={{ height: 180, overflow: 'hidden', background: '#e7e8e5' }}>
        <img
          src="/assets/illustrations/klack-tifo.webp"
          alt="Klacken förbereder en banderoll på läktaren"
          style={{ ...imageStyle, height: '100%', transform: 'scale(1.3)', objectPosition: 'center 58%' }}
        />
      </div>
      break
    case 'ekonomi':
      content = <div style={{ padding: '15px 16px 17px', background: 'var(--bg-surface)' }}>
        <p className="h-label" style={{ marginBottom: 10 }}>KASSAÖVERSIKT</p>
        <div className="eco-row" style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Saldo</span>
          {/* adherence-semantic-key: rött saldo betyder att kassan är negativ. */}
          <span className="h-display-sm" style={{ color: club.finances < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {formatFinanceAbs(club.finances)}
          </span>
        </div>
        <div className="eco-row-mb">
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Lönebudget / mån</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{formatFinanceAbs(club.wageBudget)}</span>
        </div>
        <div className="eco-row-mb" style={{ marginBottom: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Transferbudget</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{formatFinanceAbs(club.transferBudget)}</span>
        </div>
      </div>
      break
    case 'slutspel':
      content = <img
        src="/assets/illustrations/final.webp"
        alt="Finalarenan"
        style={{ ...imageStyle, height: 152, objectPosition: 'center 39%' }}
      />
      break
    default:
      return null
  }

  return (
    <div aria-label={`Spelgrafik: ${chapterLabel}`} style={{
      background: 'var(--bg-parm-tabs)', border: '1px solid var(--border-parm)',
      borderRadius: 8, overflow: 'hidden', marginBottom: 16,
    }}>
      {content}
    </div>
  )
}

const imageStyle: React.CSSProperties = {
  display: 'block', width: '100%', objectFit: 'cover',
}

const captionStyle: React.CSSProperties = {
  color: 'var(--text-secondary)', fontFamily: 'system-ui',
  fontSize: 10, margin: '8px 2px 0', textAlign: 'center',
}
