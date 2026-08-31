import type { FacilityNodeView, FacilityState, FacilityNodeDef } from '../../../domain/entities/SaveGame'
import { getFacilityTreeByGren, isFacilityTreeFull, getOrdinaryFacilityNodeDefs } from '../../../domain/services/facilityService'
import { FACILITY_DESC, FACILITY_INTRO } from '../../../domain/data/facilityDescriptions'
import { FACILITY_NODE_DEFS } from '../../../domain/data/facilityNodes'

interface FacilityTreeProps {
  facilityState: FacilityState
  currentMatchday: number
  currentSeason: number
  mode: 'betrakta' | 'valj'
  selectedNodeId?: string
  onSelect?: (nodeId: string) => void
  clubName?: string
  /** Block 3a — HALLNODE_SUBS[stage] med riktiga värden ifyllda (hallProcessService.formatHallNodeSub). */
  hallNodeSub?: string
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
            ? 'var(--danger-text)'
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

// Bug 2 (AUDIT DEL 4, A4) — akademi_3 (och ev. framtida noder) kräver FLERA
// byggen (AND av requires[]). Tidigare visades bara requires[0] i låstaggen.
// Listar nu varje krav separat med eget uppfyllt/ej uppfyllt-status, samma
// mönster som BoardMeetingScene.tsx:s evalRows (✓/✕ + success/danger-färg).
function LockRequirements({ requires, builtNodeIds }: { requires: string[]; builtNodeIds: string[] }) {
  if (requires.length === 0) return null
  const built = new Set(builtNodeIds)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
      {requires.map(r => {
        const label = FACILITY_NODE_DEFS.find(d => d.id === r)?.label ?? r
        const met = built.has(r)
        return (
          <span key={r} style={{ fontSize: 8.5, fontWeight: 600, color: met ? 'var(--success)' : 'var(--danger-text)', whiteSpace: 'nowrap' }}>
            {met ? '✓' : '✕'} {label}
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
            background: i < filledDots ? 'var(--accent)' : 'var(--border-dark)',
          }}
        />
      ))}
    </span>
  )
}

function NodeCard({ view, mode, selected, onSelect, hallNodeSub, hallTrialActive, builtNodeIds, currentMatchday }: {
  view: FacilityNodeView
  mode: 'betrakta' | 'valj'
  selected: boolean
  onSelect?: (id: string) => void
  hallNodeSub?: string
  hallTrialActive?: boolean
  builtNodeIds: string[]
  currentMatchday: number
}) {
  const { def, status } = view
  const isHall = def.isHall

  const borderStyle = (() => {
    if (isHall) return `1.5px solid var(--cold)`
    if (status === 'built') return '2px solid var(--success)'
    if (status === 'ongoing') return '2px solid var(--accent)'
    if (status === 'available') return '1.5px solid var(--border-dark)'
    return '1px solid var(--border)'
  })()

  const bg = (() => {
    if (isHall) return 'color-mix(in srgb, var(--cold) 5%, var(--bg-surface))'
    if (status === 'available') return 'var(--bg-elevated)'
    return 'var(--bg-surface)'
  })()

  const nameColor = isHall ? 'var(--cold)' : 'var(--text-primary)'

  const tagText = (() => {
    if (isHall) return 'Prövning'
    if (status === 'built') return view.completedSeason ? `Byggd ${view.completedSeason}` : 'Byggd'
    if (status === 'ongoing') return 'Pågår'
    if (status === 'available') return 'Möjlig'
    // Bug 2 (AUDIT DEL 4, A4): taggen visade tidigare bara requires[0] — vilseledande
    // för noder med flera krav (t.ex. akademi_3: traningshall + akademi_2). Generisk
    // tagg, full uppdelning per krav visas i LockRequirements nedan.
    return '🔒 Låst'
  })()

  const tagColor = (() => {
    if (isHall) return 'var(--cold)'
    if (status === 'built') return 'var(--success)'
    if (status === 'ongoing') return 'var(--accent-dark)'
    return 'var(--text-secondary)'
  })()

  const tagBg = (() => {
    if (isHall) return 'color-mix(in srgb, var(--cold) 12%, transparent)'
    if (status === 'built') return 'color-mix(in srgb, var(--success) 12%, transparent)'
    if (status === 'ongoing') return 'color-mix(in srgb, var(--accent) 12%, transparent)'
    return 'transparent'
  })()

  const opacity = status === 'locked' ? 0.35 : 1
  // Block 3a: hallnoden öppnar H·1-hubben (via chevron) närhelst ett trial är
  // aktivt — oberoende av betrakta/valj-läget, eftersom hubben bara VISAR
  // status, den startar inget bygge. Startvalet (inled/inte_nu) sker separat
  // via hallProcessService.ts:s buildStartEvent, ett vanligt GameEvent-kort.
  // O17 del 3: byggda noder klickbara i valj-läget också — öppnar
  // avvecklingsvalet (FacilityScreen skiljer på built/available via status).
  const clickable = isHall
    ? hallTrialActive && !!onSelect
    : mode === 'valj' && (status === 'available' || status === 'built') && !!onSelect

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
          background: 'var(--cold)',
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
          border: (status === 'available' || status === 'locked') && !isHall ? '1px solid var(--border-dark)' : undefined,
        }}>
          {tagText}
        </span>
      </div>

      {/* MEDIUM 13c (audit 2026-08-29): `Klar omg {etaMatchday}` var en RÅ
          `Omg ${matchday}`-identitet — precis den form roundLabel.ts:s huvud
          kallar en regression, och dessutom fel sorts uppgift: ett bygge har
          ingen rond-IDENTITET, det har en nedräkning. Samma fil pekar också ut
          att rena räknare INTE ska gå genom getRoundLabel(). Alltså en ren
          nedräkning här. Skalan stämmer först efter 13b (startedMatchday
          stämplas nu i matchdagar, som läsvägen alltid har gjort). */}
      {status === 'ongoing' && view.etaMatchday !== undefined && view.cooldownTotal !== undefined && (() => {
        const remaining = Math.max(0, view.etaMatchday - currentMatchday)
        return (
          <div className="h-micro" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
            {remaining === 1 ? '1 omgång kvar' : `${remaining} omgångar kvar`}
            <CooldownDots total={view.cooldownTotal} filled={view.cooldownFilled ?? 0} />
          </div>
        )
      })()}

      {(status === 'available' || isHall) && (
        <ConsekvensRad consequences={def.consequences} />
      )}

      {status === 'locked' && !isHall && (
        <LockRequirements requires={def.requires} builtNodeIds={builtNodeIds} />
      )}

      {isHall && (
        <div className="h-micro" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
          {hallNodeSub ?? 'Öppnar prövningen — förankring krävs'}{clickable ? ' ›' : ''}
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
  hallNodeSub,
}: FacilityTreeProps) {
  const hallTrialActive = !!facilityState.hallTrial
  const tree = getFacilityTreeByGren(facilityState, currentMatchday)
  const grens: Array<'anlaggning' | 'verksamhet' | 'akademi'> = ['anlaggning', 'verksamhet', 'akademi']
  // O17 del 1 (DOM_ANLAGGNINGSTRADETS_SLUT, 2026-08-17) — fullt träd är ett
  // tillstånd, inte ett tomrum. Matchhallen räknas inte in (separat Prövning,
  // se getOrdinaryFacilityNodeDefs).
  const treeFull = isFacilityTreeFull(facilityState)
  const ordinaryDefs = getOrdinaryFacilityNodeDefs()

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {mode === 'betrakta' && (
        <div style={{ marginBottom: 8 }}>
          <h2 className="h-name">Anläggningen</h2>
          <span style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            Ett bygge åt gången
          </span>
        </div>
      )}

      {/* B4 (Korrvända 2-audit, 2026-07-28): visas i BÅDA lägena — behövs
          mest när man faktiskt väljer (valj), inte bara i betrakta. */}
      {FACILITY_INTRO && (
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
          {FACILITY_INTRO}
        </p>
      )}

      {/* O17 del 1 — fullt-träd-tillståndet. Texten är låst ordagrant
          (DOM_ANLAGGNINGSTRADETS_SLUT_2026-08-17.md). Driftskostnad per
          säsong (O5) finns inte än — sammanställningen visar bara antal
          noder, inte drift. Trädet nedan visas oförändrat (varje nod visar
          redan sin "Byggd {säsong}"-tagg), banner:n lägger till tillståndet,
          tar inte bort listan. */}
      {treeFull && (
        <div className="card-sharp" style={{ padding: '14px 16px', marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            Allt som gick att bygga är byggt. Nu handlar det om vad ni gör med det.
          </p>
          <p className="h-micro" style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            {ordinaryDefs.length} noder byggda
          </p>
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
                width: 1.5, background: 'var(--border-dark)',
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
                    background: view.def.isHall ? 'var(--cold)' : 'var(--border-dark)',
                    transform: 'translateY(-50%)',
                  }} />
                  <NodeCard
                    view={view}
                    mode={mode}
                    selected={selectedNodeId === view.def.id}
                    onSelect={onSelect}
                    hallNodeSub={view.def.isHall ? hallNodeSub : undefined}
                    hallTrialActive={view.def.isHall ? hallTrialActive : undefined}
                    builtNodeIds={facilityState.builtNodeIds}
                    currentMatchday={currentMatchday}
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
