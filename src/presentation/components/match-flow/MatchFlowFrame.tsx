import type { ReactNode, CSSProperties } from 'react'
import { ClubBadge } from '../ClubBadge'
import '../../styles/match-flow.css'

export type MatchFlowPhase = 'forbered' | 'spela' | 'granska'

export interface MatchFlowTab {
  id: string
  label: string
  active: boolean
  onClick: () => void
}

interface MatchFlowFrameProps {
  clubId: string
  clubName: string
  managerName: string
  /** Alltid via seasonSpanLabel(game.currentSeason) — aldrig hårdkodad */
  season: string
  /**
   * HIGH 5 (2026-08-29): färdig rond-ETIKETT, inte ett rått tal. Var tidigare
   * `round: number` + hårdkodat "OMG."-prefix i JSX — MatchLiveScreen matade
   * in `fixture.matchday` (global spelordning) medan portalen visade
   * `roundNumber`, så samma derby stod som "Omgång 4" i portalen och
   * "OMG. 8" i mastheaden. Anropsstället bygger nu strängen via
   * getRoundLabel (domain/roundLabel.ts); ramen formaterar inget själv.
   */
  roundLabel: string
  phase: MatchFlowPhase
  /** null = ingen stämpel (aktiv speltid) */
  stamp: { label: string; onClick: () => void; disabled?: boolean } | null
  /** Förbereds intra-fas-flikar, direkt under RPS-stripen. */
  subTabs?: MatchFlowTab[]
  /** Granskas flikrad, mellan body och stämpel. */
  tabs?: MatchFlowTab[]
  /** Grepp 4: under spel ersätts masthead + RPS-strip av en tunn live-rad.
   *  Bara phase='spela' skickar detta — annars full masthead. */
  liveScore?: { homeName: string; awayName: string; homeScore: number; awayScore: number }
  /** Dedikerad slot för botten-dock(ar). Renderas direkt i .mf-root, UTANFÖR
   *  .mf-content { overflow: hidden } — så en absolut-positionerad dock aldrig klipps.
   *  BottomDock(ar) skickas hit, inte som children. */
  dock?: ReactNode
  children: ReactNode
  style?: CSSProperties
}

const PHASES: { key: MatchFlowPhase; label: string }[] = [
  { key: 'forbered', label: 'FÖRBERED' },
  { key: 'spela', label: 'SPELA' },
  { key: 'granska', label: 'GRANSKA' },
]

const PHASE_INDEX: Record<MatchFlowPhase, number> = { forbered: 0, spela: 1, granska: 2 }
const PERF_DOTS = Array.from({ length: 12 })

export function MatchFlowFrame({
  clubId,
  clubName,
  managerName,
  season,
  roundLabel,
  phase,
  stamp,
  subTabs,
  tabs,
  liveScore,
  dock,
  children,
  style,
}: MatchFlowFrameProps) {
  const phaseIdx = PHASE_INDEX[phase]
  // Grepp 4: under spel viker masthead + RPS ihop till en tunn orienteringsrad.
  const slim = phase === 'spela' && liveScore != null

  return (
    <div className="mf-root" style={style}>
      {slim ? (
        /* ── Slim live-rad (grepp 4) ── */
        <div className="mf-masthead-slim">
          <span className="mf-slim-score">
            {liveScore.homeName} <b>{liveScore.homeScore}–{liveScore.awayScore}</b> {liveScore.awayName}
          </span>
          <span className="mf-slim-meta">{roundLabel} · SPELA</span>
        </div>
      ) : (
        <>
          {/* ── Masthead ── */}
          <div className="mf-masthead">
            <div className="mf-crest">
              <ClubBadge
                clubId={clubId}
                name={clubName}
                size={22}
                strokeColor="color-mix(in srgb, var(--copper) 40%, transparent)"
              />
            </div>
            <div className="mf-club">
              <span className="mf-club-name">{clubName}</span>
              <span className="mf-club-sub">{managerName} · {season}</span>
            </div>
            <div className="mf-round">{roundLabel}</div>
          </div>

          {/* ── RPS-strip ── */}
          <div className="mf-rps">
            {PHASES.map((p, i) => {
              const isDone = i < phaseIdx
              const isActive = i === phaseIdx
              const cls = isActive ? 'active' : isDone ? 'done' : 'pending'
              return (
                <span key={p.key} className={`mf-rps-item ${cls}`}>
                  {isDone && <span className="mf-rps-icon">✓</span>}
                  {isActive && <span className="mf-rps-icon">⬡</span>}
                  {p.label}
                  {i < PHASES.length - 1 && (
                    <span className="mf-rps-sep" aria-hidden="true"> — </span>
                  )}
                </span>
              )
            })}
          </div>
        </>
      )}

      {/* ── Subflikrad (Förbered) ── */}
      {subTabs && subTabs.length > 0 && (
        <div className="mf-subtabs">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              className={`mf-subtab${tab.active ? ' active' : ''}`}
              onClick={tab.onClick}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Body: marginal + innehåll ── */}
      <div className="mf-body">
        <div className="mf-margin" aria-hidden="true">
          {PERF_DOTS.map((_, i) => (
            <div key={i} className="mf-perf" />
          ))}
        </div>
        <div className="mf-content">{children}</div>
      </div>

      {/* ── Flikrad (bara Granska) ── */}
      {tabs && tabs.length > 0 && (
        <div className="mf-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`mf-tab${tab.active ? ' active' : ''}`}
              onClick={tab.onClick}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Stämpel-CTA ── */}
      {stamp && (
        <button className="mf-stamp" onClick={stamp.onClick} disabled={stamp.disabled}>
          {stamp.label}
        </button>
      )}

      {/* ── Botten-dock-slot ──
          Direkt i .mf-root (position: relative, overflow: hidden) — utanför
          .mf-content, så dockens slide-up aldrig klipps av .mf-content overflow. */}
      {dock}
    </div>
  )
}
