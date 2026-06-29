import type { FacilityNodeView, FacilityState, FacilityNodeDef } from '../../../domain/entities/SaveGame'
import { getFacilityTreeByGren } from '../../../domain/services/facilityService'
import { FACILITY_DESC, FACILITY_INTRO } from '../../../domain/data/facilityDescriptions'

interface FacilityTreeProps {
  facilityState: FacilityState
  currentMatchday: number
  currentSeason: number
  mode: 'betrakta' | 'valj'
  selectedNodeId?: string
  onSelect?: (nodeId: string) => void
  clubName?: string
}

const GREN_LABELS: Record<string, string> = {
  anlaggning: 'ANLÄGGNING',
  verksamhet: 'VERKSAMHET',
  akademi: 'AKADEMI',
}

const DIM_LABELS: Record<string, string> = {
  publik: 'Publik',
  ekonomi: 'Ekonomi',
  ungdom: 'Ungdom',
  sjal: 'Själ',
}

function ConsekvensRad({ consequences }: { consequences: FacilityNodeDef['consequences'] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
      {consequences.map((c, i) => {
        const color = c.dir === 'upp'
          ? 'var(--success)'
          : c.dir === 'ned'
            ? 'var(--danger-text, #8B3E30)'
            : 'var(--text-muted)'
        const arrow = c.dir === 'upp' ? '↑' : c.dir === 'ned' ? '↓' : '—'
        return (
          <span key={i} style={{ fontSize: 8.5, fontWeight: 600, color, whiteSpace: 'nowrap' }}>
            {DIM_LABELS[c.dim]} {arrow}
          </span>
        )
      })}
    </div>
  )
}

function CooldownDots({ total, filled }: { total: number; filled: number }) {
  const dots = Math.min(4, total)
  const filledDots = Math.round((filled / total) * dots)
  return (
    <span style={{ display: 'inline-flex', gap: 2, marginLeft: 4, verticalAlign: '1px' }}>
      {Array.from({ length: dots }, (_, i) => (
        <i
          key={i}
          style={{
            width: 5, height: 5, borderRadius: '50%', display: 'inline-block',
            background: i < filledDots ? 'var(--accent)' : 'var(--border-dark, #C4BAA8)',
          }}
        />
      ))}
    </span>
  )
}

function NodeCard({ view, mode, selected, onSelect }: {
  view: FacilityNodeView
  mode: 'betrakta' | 'valj'
  selected: boolean
  onSelect?: (id: string) => void
}) {
  const { def, status } = view
  const isHall = def.isHall

  const borderStyle = (() => {
    if (isHall) return `1.5px solid var(--cold, #4a6680)`
    if (status === 'built') return '2px solid var(--success)'
    if (status === 'ongoing') return '2px solid var(--accent)'
    if (status === 'available') return '1.5px solid var(--border-dark, #C4BAA8)'
    return '1px solid var(--border)'
  })()

  const bg = (() => {
    if (isHall) return 'color-mix(in srgb, var(--cold, #4a6680) 5%, var(--bg-surface))'
    if (status === 'available') return 'var(--bg-elevated, #FFFFFF)'
    return 'var(--bg-surface)'
  })()

  const nameColor = isHall ? 'var(--cold, #4a6680)' : 'var(--text-primary)'

  const lockLabel = (() => {
    const r = def.requires[0]
    if (!r) return null
    const labels: Record<string, string> = {
      traningshall: 'Träningshall',
      laktare_ostra: 'Läktare',
      varmestuga: 'Värmestuga',
      gym: 'Gym',
      belysning: 'Belysning',
      kiosk: 'Kiosk',
    }
    return labels[r] ?? r
  })()

  const tagText = (() => {
    if (isHall) return 'Prövning'
    if (status === 'built') return view.completedSeason ? `Byggd ${view.completedSeason}` : 'Byggd'
    if (status === 'ongoing') return 'Pågår'
    if (status === 'available') return 'Möjlig'
    return lockLabel ? `🔒 ${lockLabel}` : '🔒 Låst'
  })()

  const tagColor = (() => {
    if (isHall) return 'var(--cold, #4a6680)'
    if (status === 'built') return 'var(--success)'
    if (status === 'ongoing') return 'var(--accent-dark, #A25828)'
    return 'var(--text-secondary)'
  })()

  const tagBg = (() => {
    if (isHall) return 'color-mix(in srgb, var(--cold, #4a6680) 12%, transparent)'
    if (status === 'built') return 'color-mix(in srgb, var(--success) 12%, transparent)'
    if (status === 'ongoing') return 'color-mix(in srgb, var(--accent) 12%, transparent)'
    return 'transparent'
  })()

  const opacity = status === 'locked' ? 0.35 : 1
  const clickable = mode === 'valj' && (status === 'available') && !isHall && !!onSelect

  const marginLeft = isHall ? 18 : 0

  return (
    <div
      style={{
        position: 'relative',
        background: selected ? 'color-mix(in srgb, var(--accent) 8%, var(--bg-surface))' : bg,
        border: selected ? `2px solid var(--accent)` : borderStyle,
        borderRadius: 8,
        padding: '7px 10px',
        marginBottom: 5,
        marginLeft,
        opacity,
        cursor: clickable ? 'pointer' : 'default',
        outline: selected ? '1px solid var(--accent)' : undefined,
      }}
      onClick={clickable ? () => onSelect?.(def.id) : undefined}
    >
      {isHall && (
        <div style={{
          position: 'absolute',
          left: -30, top: '50%',
          width: 28, height: 1.5,
          background: 'var(--cold, #4a6680)',
          transform: 'translateY(-50%)',
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, flex: 1, color: nameColor }}>
          {def.label}
        </span>
        <span style={{
          fontSize: 8, padding: '2px 7px', borderRadius: 99, fontWeight: 600,
          whiteSpace: 'nowrap', color: tagColor, background: tagBg,
          border: (status === 'available' || status === 'locked') && !isHall ? '1px solid var(--border-dark, #C4BAA8)' : undefined,
        }}>
          {tagText}
        </span>
      </div>

      {status === 'ongoing' && view.etaMatchday !== undefined && view.cooldownTotal !== undefined && (
        <div className="h-micro" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
          Klar omg {view.etaMatchday}
          <CooldownDots total={view.cooldownTotal} filled={view.cooldownFilled ?? 0} />
        </div>
      )}

      {(status === 'available' || isHall) && (
        <ConsekvensRad consequences={def.consequences} />
      )}

      {isHall && (
        <div className="h-micro" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
          Öppnar prövningen — förankring krävs ›
        </div>
      )}

      {mode === 'valj' && status === 'available' && !isHall && (
        <div className="h-quote-sm" style={{ color: 'var(--text-secondary)', marginTop: 3 }}>
          {def.consequences.find(c => c.dim === 'publik' || c.dim === 'sjal')?.label ?? ''}
        </div>
      )}

      {FACILITY_DESC[def.id] && (
        <p className="h-micro" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          {FACILITY_DESC[def.id]}
        </p>
      )}
    </div>
  )
}

export function FacilityTree({
  facilityState,
  currentMatchday,
  mode,
  selectedNodeId,
  onSelect,
  clubName,
}: FacilityTreeProps) {
  const tree = getFacilityTreeByGren(facilityState, currentMatchday)
  const grens: Array<'anlaggning' | 'verksamhet' | 'akademi'> = ['anlaggning', 'verksamhet', 'akademi']

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {mode === 'betrakta' && (
        <div style={{ marginBottom: 8 }}>
          <h2 className="h-name">Anläggningen</h2>
          <span style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            Betrakta · val görs i säsongsstarten
          </span>
          {FACILITY_INTRO && (
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              {FACILITY_INTRO}
            </p>
          )}
        </div>
      )}

      {grens.map(gren => {
        const nodes = tree[gren]
        if (nodes.length === 0) return null
        return (
          <div key={gren} style={{ marginBottom: 9 }}>
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
              {GREN_LABELS[gren]}
            </div>
            <div style={{ position: 'relative', paddingLeft: 14 }}>
              {/* Vertikal kopplningslinje */}
              <div style={{
                position: 'absolute', left: 4, top: 8, bottom: 8,
                width: 1.5, background: 'var(--border-dark, #C4BAA8)',
              }} />
              {nodes.map(view => (
                <div key={view.def.id} style={{ position: 'relative' }}>
                  {/* Horisontell kopplningslinje */}
                  <div style={{
                    position: 'absolute',
                    left: view.def.isHall ? -30 : -12,
                    top: '50%',
                    width: view.def.isHall ? 28 : 10,
                    height: 1.5,
                    background: view.def.isHall ? 'var(--cold, #4a6680)' : 'var(--border-dark, #C4BAA8)',
                    transform: 'translateY(-50%)',
                  }} />
                  <NodeCard
                    view={view}
                    mode={mode}
                    selected={selectedNodeId === view.def.id}
                    onSelect={onSelect}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Konstis-baseline */}
      <div className="h-quote-sm" style={{
        marginTop: 6, paddingTop: 7, borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)', textAlign: 'center',
      }}>
        {clubName
          ? `Konstis sedan 1963 · ${clubName}, utomhus — det är så bandy spelas.`
          : 'Konstis sedan 1963 · Stålvallen, utomhus — det är så bandy spelas.'
        }
      </div>
    </div>
  )
}
