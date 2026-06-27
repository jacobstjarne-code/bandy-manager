import type { ReactNode, CSSProperties } from 'react'
import { ClubBadge } from '../ClubBadge'
import '../../styles/ledger.css'

export type LedgerPhase = 'forbered' | 'spela' | 'granska'

export interface LedgerTab {
  id: string
  label: string
  active: boolean
  onClick: () => void
}

interface LedgerFrameProps {
  clubId: string
  clubName: string
  managerName: string
  /** Alltid via seasonSpanLabel(game.currentSeason) — aldrig hårdkodad */
  season: string
  round: number
  phase: LedgerPhase
  /** null = ingen stämpel (aktiv speltid) */
  stamp: { label: string; onClick: () => void } | null
  /** Valfri flikrad — bara Granska skickar detta */
  tabs?: LedgerTab[]
  /** Grepp 4: under spel ersätts masthead + RPS-strip av en tunn live-rad.
   *  Bara phase='spela' skickar detta — annars full masthead. */
  liveScore?: { homeName: string; awayName: string; homeScore: number; awayScore: number }
  /** Dedikerad slot för botten-dock(ar). Renderas direkt i .lf-root, UTANFÖR
   *  .lf-content { overflow: hidden } — så en absolut-positionerad dock aldrig klipps.
   *  BottomDock(ar) skickas hit, inte som children. */
  dock?: ReactNode
  children: ReactNode
  style?: CSSProperties
}

const PHASES: { key: LedgerPhase; label: string }[] = [
  { key: 'forbered', label: 'FÖRBERED' },
  { key: 'spela', label: 'SPELA' },
  { key: 'granska', label: 'GRANSKA' },
]

const PHASE_INDEX: Record<LedgerPhase, number> = { forbered: 0, spela: 1, granska: 2 }
const PERF_DOTS = Array.from({ length: 12 })

export function LedgerFrame({
  clubId,
  clubName,
  managerName,
  season,
  round,
  phase,
  stamp,
  tabs,
  liveScore,
  dock,
  children,
  style,
}: LedgerFrameProps) {
  const phaseIdx = PHASE_INDEX[phase]
  // Grepp 4: under spel viker masthead + RPS ihop till en tunn orienteringsrad.
  const slim = phase === 'spela' && liveScore != null

  return (
    <div className="lf-root" style={style}>
      {slim ? (
        /* ── Slim live-rad (grepp 4) ── */
        <div className="lf-masthead-slim">
          <span className="lf-slim-score">
            {liveScore.homeName} <b>{liveScore.homeScore}–{liveScore.awayScore}</b> {liveScore.awayName}
          </span>
          <span className="lf-slim-meta">OMG.&nbsp;{round} · SPELA</span>
        </div>
      ) : (
        <>
          {/* ── Masthead ── */}
          <div className="lf-masthead">
            <div className="lf-crest">
              <ClubBadge
                clubId={clubId}
                name={clubName}
                size={22}
                strokeColor="color-mix(in srgb, var(--copper) 40%, transparent)"
              />
            </div>
            <div className="lf-club">
              <span className="lf-club-name">{clubName}</span>
              <span className="lf-club-sub">{managerName} · {season}</span>
            </div>
            <div className="lf-round">OMG.&nbsp;{round}</div>
          </div>

          {/* ── RPS-strip ── */}
          <div className="lf-rps">
            {PHASES.map((p, i) => {
              const isDone = i < phaseIdx
              const isActive = i === phaseIdx
              const cls = isActive ? 'active' : isDone ? 'done' : 'pending'
              return (
                <span key={p.key} className={`lf-rps-item ${cls}`}>
                  {isDone && <span className="lf-rps-icon">✓</span>}
                  {isActive && <span className="lf-rps-icon">⬡</span>}
                  {p.label}
                  {i < PHASES.length - 1 && (
                    <span className="lf-rps-sep" aria-hidden="true"> — </span>
                  )}
                </span>
              )
            })}
          </div>
        </>
      )}

      {/* ── Body: marginal + innehåll ── */}
      <div className="lf-body">
        <div className="lf-margin" aria-hidden="true">
          {PERF_DOTS.map((_, i) => (
            <div key={i} className="lf-perf" />
          ))}
        </div>
        <div className="lf-content">{children}</div>
      </div>

      {/* ── Flikrad (bara Granska) ── */}
      {tabs && tabs.length > 0 && (
        <div className="lf-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`lf-tab${tab.active ? ' active' : ''}`}
              onClick={tab.onClick}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Stämpel-CTA ── */}
      {stamp && (
        <button className="lf-stamp" onClick={stamp.onClick}>
          {stamp.label}
        </button>
      )}

      {/* ── Botten-dock-slot ──
          Direkt i .lf-root (position: relative, overflow: hidden) — utanför
          .lf-content, så dockens slide-up aldrig klipps av .lf-content overflow. */}
      {dock}
    </div>
  )
}
